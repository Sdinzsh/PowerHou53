import { tool } from "@opencode-ai/plugin";
import { realpathSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { TaskStore, loadConfig, taskAction, evidenceAction, recoveryContext, taskSummary, privateDirectory, sessionKey } from "./powerhouse-state.mjs";
import { workspaceDigest } from "./powerhouse-workspace.mjs";
import { runCheck } from "./powerhouse-process.mjs";

const z = tool.schema;
const instructions = "For substantial work, checkpoint with powerhouse_task and verify before completion. Handle small tasks directly; delegate only when useful. Save non-obvious verified lessons once in existing memory/skills. No automatic continuation.";

export async function createPowerhouse({ directory, worktree }) {
  const root = realpathSync(worktree && worktree !== "/" ? worktree : directory);
  const store = new TaskStore(root);
  const running = new Set();
  const config = () => loadConfig(root);
  const exclusive = async (id, fn) => {
    if (running.has(id)) throw new Error("A Powerhouse operation is already running in this session");
    running.add(id);
    try { return await fn(); } finally { running.delete(id); }
  };
  return {
    tool: {
      powerhouse_task: tool({
        description: "Persist tasks/checkpoints across restart and compaction. Reuse the last returned revision; read status when unknown/stale. Completion requires current successful checks.",
        args: {
          action: z.enum(["status", "start", "checkpoint", "block", "resume", "complete"]),
          revision: z.number().int().nonnegative().optional(),
          objective: z.string().max(2000).optional(), criteria: z.array(z.string().max(400)).max(20).optional(),
          checks: z.array(z.string()).max(20).optional(), note: z.string().max(4000).optional(),
          detail: z.boolean().optional().describe("Full saved text on status only"),
        },
        async execute(args, ctx) {
          if (args.action !== "status" && running.has(ctx.sessionID)) throw new Error("Wait for verification/delegation before changing the task");
          return JSON.stringify(taskSummary(taskAction(store, ctx.sessionID, args, config(),
            args.action === "complete" ? workspaceDigest(root) : undefined), args));
        },
      }),
      powerhouse_verify: tool({
        description: "Run a named verification command from .opencode/powerhouse.json and record actual exit status. Output is bounded. Workspace changes invalidate the result.",
        args: { check: z.string().max(64) },
        async execute({ check }, ctx) {
          return exclusive(ctx.sessionID, async () => {
            const settings = config(), selected = settings.checks[check];
            const state = store.read(ctx.sessionID);
            if (!Object.hasOwn(settings.checks, check) || !state.task?.checks.includes(check) || state.task.status !== "active")
              throw new Error("Start/resume a task with this configured check first");
            // Custom tools must explicitly enter OpenCode's permission system.
            await ctx.ask({ permission: "bash", patterns: [selected.command + " " + selected.args.join(" ")],
              always: [], metadata: { command: selected.command, args: selected.args, cwd: root } });
            store.change(ctx.sessionID, state.revision, "check.started", (next) => {
              delete next.task.evidence[check];
              return next;
            });
            const before = workspaceDigest(root);
            const result = await runCheck(selected, root, ctx.abort);
            if (workspaceDigest(root) !== before) throw new Error("Workspace changed during verification; rerun the check");
            const next = evidenceAction(store, ctx.sessionID, state.task.id, state.generation, check,
              { ...result, workspace: before }, settings);
            const cap = result.exitCode === 0 ? settings.successOutputChars : settings.failureOutputChars;
            const truncated = result.output.length > cap;
            let outputPath;
            if (truncated) {
              const dir = privateDirectory(root, ".opencode", "powerhouse", "sessions", sessionKey(ctx.sessionID));
              outputPath = join(dir, `check-${randomUUID()}.log`);
              writeFileSync(outputPath, result.output, { flag: "wx", mode: 0o600 });
            }
            return JSON.stringify({ check, ...result, output: result.output.slice(-cap), truncated, outputPath,
              retainedOutputChars: result.output.length, revision: next.revision });
          });
        },
      }),
      powerhouse_harness: tool({
        description: "Run a bounded task in the official DeepSeek Harness runtime. Child tool permissions are owned by Harness, separate from OpenCode. Needs the optional SDK install and configured provider. Does not mark parent work complete.",
        args: { prompt: z.string().min(1).max(12000) },
        async execute({ prompt }, ctx) {
          return exclusive(ctx.sessionID, async () => {
            const settings = config().harness;
            if (!settings.enabled) throw new Error("Enable harness in .opencode/powerhouse.json first");
            await ctx.ask({ permission: "powerhouse_harness", patterns: [settings.profile + ":" + settings.provider + ":" + settings.model],
              always: [], metadata: { cwd: root, prompt, profile: settings.profile, timeoutMs: settings.timeoutMs } });
            const { runHarness } = await import("../../integrations/deepseek-harness/bridge.mjs");
            store.invalidate(ctx.sessionID, "Harness delegation started");
            try { return JSON.stringify(await runHarness({ root, sessionID: ctx.sessionID, prompt, settings, signal: ctx.abort })); }
            finally { store.invalidate(ctx.sessionID, "Harness delegation ended; verify workspace changes"); }
          });
        },
      }),
    },
    "tool.execute.before": async ({ tool: name, sessionID }) => {
      if (["bash", "edit", "write", "apply_patch", "task"].includes(name)) store.invalidate(sessionID, `${name} invoked`);
    },
    "experimental.chat.system.transform": async ({ sessionID }, output) => {
      output.system.push(instructions);
      if (sessionID) {
        const context = recoveryContext(store.read(sessionID), config().contextChars);
        if (context) output.system.push(context);
      }
    },
    "experimental.session.compacting": async ({ sessionID }, output) => {
      const context = recoveryContext(store.read(sessionID), config().compactionChars);
      if (context) output.context.push(context);
    },
  };
}
