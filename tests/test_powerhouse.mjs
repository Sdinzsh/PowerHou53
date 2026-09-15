import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, appendFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import * as plugin from "../.opencode/plugins/powerhouse.js";
import { TaskStore, loadConfig, recoveryContext, taskSummary } from "../.opencode/lib/powerhouse-state.mjs";
import { runCheck } from "../.opencode/lib/powerhouse-process.mjs";
import { workspaceDigest } from "../.opencode/lib/powerhouse-workspace.mjs";
import { runHarness } from "../integrations/deepseek-harness/bridge.mjs";

function fixture(t, code = "console.log('verified')") {
  const root = mkdtempSync(join(tmpdir(), "powerhouse-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.equal(spawnSync("git", ["init", "-q", root]).status, 0);
  mkdirSync(join(root, ".opencode"));
  writeFileSync(join(root, "source.txt"), "original");
  writeFileSync(join(root, ".gitignore"), ".opencode/powerhouse/\n");
  const config = { version: 1, checks: { suite: { command: process.execPath, args: ["-e", code], timeoutMs: 3000 } } };
  writeFileSync(join(root, ".opencode/powerhouse.json"), JSON.stringify(config));
  return { root, config };
}
async function setup(t, code) {
  const data = fixture(t, code);
  const hooks = await plugin.PowerhousePlugin({ directory: data.root });
  const permissions = [];
  const ctx = { sessionID: "parent", abort: new AbortController().signal, ask: async (p) => permissions.push(p) };
  const task = async (args, context = ctx) => JSON.parse(await hooks.tool.powerhouse_task.execute(args, context));
  const start = await task({ action: "start", revision: 0, objective: "Fix behavior", criteria: ["Suite passes"] });
  const verify = () => hooks.tool.powerhouse_verify.execute({ check: "suite" }, ctx);
  return { ...data, hooks, ctx, permissions, task, start, verify };
}

test("entry point exposes only its loadable plugin factory", async () => {
  assert.deepEqual(Object.keys(plugin), ["PowerhousePlugin"]);
});
test("sessions opened in a subdirectory use worktree configuration and task state", async (t) => {
  const { root } = fixture(t);
  mkdirSync(join(root, "src"));
  const hooks = await plugin.PowerhousePlugin({ directory: join(root, "src"), worktree: root });
  const state = JSON.parse(await hooks.tool.powerhouse_task.execute({ action: "start", revision: 0,
    objective: "Subdirectory task", criteria: ["Uses repository checks"] }, { sessionID: "nested" }));
  assert.deepEqual(state.task.checks, ["suite"]);
  assert.equal(new TaskStore(root).read("nested").task.objective, "Subdirectory task");
});
test("actual checks unlock completion; state survives a plugin restart and compaction", async (t) => {
  const { root, hooks, task, verify, permissions } = await setup(t);
  await assert.rejects(task({ action: "complete", revision: 1, note: "Done" }), /current successful/);
  const run = JSON.parse(await verify());
  assert.equal(run.exitCode, 0);
  assert.match(run.output, /verified/);
  assert.equal(permissions[0].permission, "bash");
  const state = await task({ action: "checkpoint", revision: run.revision, note: "Implementation verified" });
  const restored = await plugin.PowerhousePlugin({ directory: root });
  const compact = { context: [] };
  await restored["experimental.session.compacting"]({ sessionID: "parent" }, compact);
  assert.match(compact.context[0], /Implementation verified/);
  const complete = await task({ action: "complete", revision: state.revision, note: "Acceptance suite passes" });
  assert.equal(complete.task.status, "complete");
  const system = { system: [] };
  await hooks["experimental.chat.system.transform"]({ sessionID: "unrelated" }, system);
  assert.equal(system.system.length, 1);
});
test("external edits and new files invalidate successful evidence without hook delivery", async (t) => {
  const { root, task, verify } = await setup(t);
  const run = JSON.parse(await verify());
  writeFileSync(join(root, "source.txt"), "changed");
  await assert.rejects(task({ action: "complete", revision: run.revision, note: "Done" }), /current successful/);
  writeFileSync(join(root, "source.txt"), "original");
  writeFileSync(join(root, "new.txt"), "new file");
  await assert.rejects(task({ action: "complete", revision: run.revision, note: "Done" }), /current successful/);
});
test("tool mutations invalidate proofs and stale revisions fail", async (t) => {
  const { hooks, task, verify } = await setup(t);
  const run = JSON.parse(await verify());
  await hooks["tool.execute.before"]({ tool: "edit", sessionID: "parent" });
  await assert.rejects(task({ action: "checkpoint", revision: run.revision, note: "Old state" }), /Stale/);
  const state = await task({ action: "status" });
  assert.deepEqual(state.task.evidence, {});
  await assert.rejects(task({ action: "complete", revision: state.revision, note: "Done" }), /current successful/);
});
test("nonzero exits never satisfy completion", async (t) => {
  const { task, verify } = await setup(t, "process.exit(7)");
  const run = JSON.parse(await verify());
  assert.equal(run.exitCode, 7);
  await assert.rejects(task({ action: "complete", revision: run.revision, note: "Done" }), /current successful/);
});
test("configuration drift requires fresh evidence", async (t) => {
  const { root, config, task, verify } = await setup(t);
  const run = JSON.parse(await verify());
  config.checks.suite.args = ["-e", "process.exit(1)"];
  writeFileSync(join(root, ".opencode/powerhouse.json"), JSON.stringify(config));
  await assert.rejects(task({ action: "complete", revision: run.revision, note: "Done" }), /configuration changed/);
});
test("a check which edits sources cannot record a passing proof", async (t) => {
  const { verify, task } = await setup(t, "require('fs').writeFileSync('source.txt', 'changed')");
  await assert.rejects(verify(), /Workspace changed/);
  assert.deepEqual((await task({ action: "status" })).task.evidence, {});
});
test("permission rejection prevents a configured process from running", async (t) => {
  const { root, ctx, verify } = await setup(t, "require('fs').writeFileSync('source.txt', 'executed')");
  ctx.ask = async () => { throw new Error("Permission denied"); };
  await assert.rejects(verify(), /Permission denied/);
  assert.equal(readFileSync(join(root, "source.txt"), "utf8"), "original");
});
test("concurrent verification is rejected and an aborted rerun clears older proof", async (t) => {
  const { ctx, verify, task } = await setup(t);
  await verify();
  let release;
  ctx.ask = () => new Promise((resolve) => { release = resolve; });
  const pending = verify();
  await assert.rejects(verify(), /already running/);
  const controller = new AbortController();
  controller.abort();
  ctx.abort = controller.signal;
  release();
  await assert.rejects(pending, /cancelled/);
  assert.deepEqual((await task({ action: "status" })).task.evidence, {});
});
test("task sessions stay separate; corruption and concurrent writers fail closed", async (t) => {
  const { root, task } = await setup(t);
  const store = new TaskStore(root);
  assert.equal(store.read("another").task, null);
  assert.ok(!store.path("../../outside").includes("../"));
  writeFileSync(store.path("parent") + ".lock", "");
  await assert.rejects(task({ action: "checkpoint", revision: 1, note: "new" }), /busy/);
  appendFileSync(store.path("parent"), "broken");
  assert.throws(() => store.read("parent"), /Incomplete/);
});
test("blocked task requires resume; recovery is bounded", async (t) => {
  const { root, task } = await setup(t);
  const blocked = await task({ action: "block", revision: 1, note: "Missing prerequisite" });
  await assert.rejects(task({ action: "complete", revision: blocked.revision, note: "Done" }), /active task/);
  const resumed = await task({ action: "resume", revision: blocked.revision });
  assert.equal(resumed.task.status, "active");
  await task({ action: "checkpoint", revision: resumed.revision, note: "x".repeat(4000) });
  assert.ok(recoveryContext(new TaskStore(root).read("parent"), 1000).length <= 1000);
});
test("symlinked runtime directories are rejected", (t) => {
  const { root } = fixture(t);
  symlinkSync(tmpdir(), join(root, ".opencode/powerhouse"));
  assert.throws(() => new TaskStore(root).read("parent"), /symlink/);
});
test("workspace hashing handles tracked deletions and refuses non-Git directories", (t) => {
  const { root } = fixture(t);
  assert.equal(spawnSync("git", ["add", "source.txt"], { cwd: root }).status, 0);
  const before = workspaceDigest(root);
  rmSync(join(root, "source.txt"));
  assert.notEqual(workspaceDigest(root), before);
  assert.throws(() => workspaceDigest(tmpdir()), /Git workspace/);
});
test("invalid configuration fails with a useful error", (t) => {
  const { root, config } = fixture(t);
  config.checks.suite.timeoutMs = -1;
  writeFileSync(join(root, ".opencode/powerhouse.json"), JSON.stringify(config));
  assert.throws(() => loadConfig(root), /Invalid verification check/);
});
test("compact replies preserve complete checkpoints and criteria on disk and on demand", async (t) => {
  const { root, task } = await setup(t);
  const note = "Reusable lesson: ".repeat(180);
  const reply = await task({ action: "checkpoint", revision: 1, note });
  assert.ok(JSON.stringify(reply).length < 300);
  const summary = await task({ action: "status" });
  assert.ok(summary.task.checkpoint.length <= 500);
  assert.match(summary.more, /detail:true/);
  const detail = await task({ action: "status", detail: true });
  assert.equal(detail.task.checkpoint, note);
  const saved = new TaskStore(root).read("parent");
  assert.equal(saved.task.checkpoint, note);
  assert.ok(JSON.stringify(reply).length < JSON.stringify(saved).length / 4);
  const large = structuredClone(saved);
  large.task.criteria = Array.from({ length: 20 }, (_, i) => `${i}: ${"acceptance ".repeat(30)}`);
  assert.equal(taskSummary(large).task.criteria.length, 5);
  assert.deepEqual(taskSummary(large, { detail: true }).task.criteria, large.task.criteria);
});
test("routine prompts stay bounded, omit fingerprints, and retain more context at compaction", async (t) => {
  const { root, hooks, task } = await setup(t);
  await task({ action: "checkpoint", revision: 1, note: "Keep the verified reusable fix. ".repeat(100) });
  const state = new TaskStore(root).read("parent");
  const routine = { system: [] }, compact = { context: [] };
  await hooks["experimental.chat.system.transform"]({ sessionID: "parent" }, routine);
  await hooks["experimental.session.compacting"]({ sessionID: "parent" }, compact);
  assert.ok(routine.system[1].length <= 1200);
  assert.ok(compact.context[0].length <= 4000);
  assert.ok(compact.context[0].length > routine.system[1].length);
  assert.match(routine.system[1], /Keep the verified reusable fix/);
  assert.ok(!routine.system[1].includes(state.task.configDigest));
  assert.equal(recoveryContext({ ...state, revision: 999 }), recoveryContext(state));
  state.task.status = "complete";
  assert.equal(recoveryContext(state), "");
});
test("success and failure previews preserve retained diagnostic logs for on-demand reads", async (t) => {
  for (const code of [0, 1]) {
    const { root, task, verify } = await setup(t, `console.log('START_DIAGNOSTIC' + 'x'.repeat(7000) + 'END_DIAGNOSTIC'); process.exit(${code})`);
    const result = JSON.parse(await verify());
    assert.equal(result.exitCode, code);
    assert.equal(result.output.length, code === 0 ? 800 : 4000);
    assert.equal(result.truncated, true);
    assert.match(result.output, /END_DIAGNOSTIC/);
    const retained = readFileSync(result.outputPath, "utf8");
    assert.match(retained, /START_DIAGNOSTIC/);
    assert.ok(result.outputPath.startsWith(join(root, ".opencode/powerhouse/")));
    if (code === 0) assert.equal((await task({ action: "complete", revision: result.revision, note: "Passed" })).task.status, "complete");
    else await assert.rejects(task({ action: "complete", revision: result.revision, note: "Done" }), /current successful/);
  }
});
test("output budgets are configurable and invalid bounds are rejected", (t) => {
  const { root, config } = fixture(t);
  const defaults = loadConfig(root);
  assert.equal(defaults.contextChars, 1200);
  assert.equal(defaults.compactionChars, 4000);
  assert.equal(defaults.harness.maxTokens, 8192);
  for (const key of ["contextChars", "compactionChars", "successOutputChars", "failureOutputChars"]) {
    writeFileSync(join(root, ".opencode/powerhouse.json"), JSON.stringify({ ...config, [key]: 0 }));
    assert.throws(() => loadConfig(root), new RegExp(key));
  }
  writeFileSync(join(root, ".opencode/powerhouse.json"), JSON.stringify({ ...config, harness: { responseChars: -1 } }));
  assert.throws(() => loadConfig(root), /Invalid harness/);
});
test("process runner bounds output, handles spawn failure and kills timeouts", async () => {
  const check = { command: process.execPath, args: ["-e", "console.log('x'.repeat(50000))"], timeoutMs: 3000 };
  assert.equal((await runCheck(check, tmpdir(), undefined, 100)).output.length, 100);
  await assert.rejects(runCheck({ ...check, command: "/missing-powerhouse-command" }, tmpdir()), /ENOENT/);
  const timed = await runCheck({ ...check, args: ["-e", "setInterval(()=>{},1000)"], timeoutMs: 100 }, tmpdir());
  assert.equal(timed.timedOut, true);
  assert.equal(timed.exitCode, null);
});
test("process runner respects cancellation", async () => {
  const controller = new AbortController();
  const pending = runCheck({ command: process.execPath, args: ["-e", "setInterval(()=>{},1000)"], timeoutMs: 3000 }, tmpdir(), controller.signal);
  controller.abort();
  assert.equal((await pending).aborted, true);
  await assert.rejects(runCheck({}, tmpdir(), controller.signal), /cancelled/);
});
test("bridge passes official launch options, bounds output, and always closes", async (t) => {
  const { root } = fixture(t);
  let closed = 0, options;
  const result = await runHarness({ root, sessionID: "parent", prompt: "work", settings: {
    profile: "sdk", provider: "deepseek-official", model: "deepseek-v4-flash", maxTokens: 1024, timeoutMs: 1000,
  } }, (opts) => {
    options = opts;
    return { run: async () => ({ sessionId: "child", finalResponse: "x".repeat(25000), events: [{ type: "turn/end", data: { reason: { kind: "completed" } } }] }), close: async () => { closed++; } };
  });
  assert.equal(options.cwd, root);
  assert.equal(options.profile, "sdk");
  assert.ok(options.dshHome.startsWith(root));
  assert.equal(result.finalResponse.length, 6000);
  assert.equal(readFileSync(result.responsePath, "utf8").length, 25000);
  assert.equal(result.truncated, true);
  assert.equal(closed, 1);
});
test("bridge closes on failure, timeout, cancellation and empty response", async (t) => {
  const { root } = fixture(t);
  for (const mode of ["failure", "timeout", "abort", "empty", "token-limit"]) {
    let closed = false;
    const controller = new AbortController();
    const pending = runHarness({ root, sessionID: mode, prompt: "work", settings: { timeoutMs: 30 }, signal: controller.signal }, () => ({
      run: async () => {
        if (mode === "failure") throw new Error("provider failed");
        if (mode === "empty") return { events: [], finalResponse: "" };
        if (mode === "token-limit") return { events: [{ type: "turn/end", data: { reason: { kind: "max-tokens" } } }], finalResponse: "Partial work" };
        return new Promise(() => {});
      }, close: async () => { closed = true; },
    }));
    if (mode === "abort") controller.abort();
    await assert.rejects(pending, /failed|timed out|cancelled|no final response|did not complete/);
    assert.equal(closed, true);
  }
});
