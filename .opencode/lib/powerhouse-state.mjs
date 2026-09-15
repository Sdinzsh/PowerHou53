import { createHash, randomUUID } from "node:crypto";
import { closeSync, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LIMIT = 8 * 1024 * 1024;
const hash = (value) => createHash("sha256").update(value).digest("hex");
export const sessionKey = (id) => {
  if (typeof id !== "string" || !id.trim() || id.length > 512) throw new Error("A valid session ID is required");
  return hash(id);
};
export function privateDirectory(root, ...segments) {
  let directory = realpathSync(root);
  for (const segment of segments) {
    if (!segment || segment === "." || segment === ".." || /[/\\]/.test(segment)) throw new Error("Invalid state directory");
    directory = join(directory, segment);
    if (!existsSync(directory)) mkdirSync(directory, { mode: 0o700 });
    if (!lstatSync(directory).isDirectory() || lstatSync(directory).isSymbolicLink())
      throw new Error("Powerhouse state directories must not be symlinks");
  }
  return directory;
}

export function loadConfig(root) {
  const path = join(root, ".opencode/powerhouse.json");
  const config = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : { version: 1, checks: {} };
  if (config.version !== 1 || !config.checks || typeof config.checks !== "object" || Array.isArray(config.checks))
    throw new Error("Invalid .opencode/powerhouse.json: expected version 1 and checks object");
  for (const [name, check] of Object.entries(config.checks)) {
    if (!/^[a-z][a-z0-9_-]{0,63}$/.test(name) || !check || typeof check.command !== "string" || !check.command ||
        !Array.isArray(check.args) || !check.args.every((arg) => typeof arg === "string") ||
        !Number.isSafeInteger(check.timeoutMs) || check.timeoutMs < 100 || check.timeoutMs > 600000)
      throw new Error(`Invalid verification check: ${name}`);
  }
  const budgets = { contextChars: config.contextChars ?? 1200, compactionChars: config.compactionChars ?? 4000,
    successOutputChars: config.successOutputChars ?? 800, failureOutputChars: config.failureOutputChars ?? 4000 };
  for (const [name, value] of Object.entries(budgets)) {
    if (!Number.isSafeInteger(value) || value < 500 || value > 12000) throw new Error(`${name} must be 500–12000`);
  }
  const harness = { enabled: false, profile: "sdk", provider: "deepseek-official", model: "deepseek-v4-flash",
    timeoutMs: 300000, maxTokens: 8192, responseChars: 6000, ...config.harness };
  if (typeof harness.enabled !== "boolean" || !["sdk", "sdk-minimal"].includes(harness.profile) ||
      ![harness.provider, harness.model].every((s) => typeof s === "string" && s.length > 0 && s.length < 200) ||
      !Number.isSafeInteger(harness.timeoutMs) || harness.timeoutMs < 100 || harness.timeoutMs > 600000 ||
      !Number.isSafeInteger(harness.maxTokens) || harness.maxTokens < 1 || harness.maxTokens > 65536 ||
      !Number.isSafeInteger(harness.responseChars) || harness.responseChars < 500 || harness.responseChars > 24000)
    throw new Error("Invalid harness configuration");
  return { ...config, ...budgets, harness };
}

export class TaskStore {
  constructor(root) { this.root = realpathSync(root); }
  path(id, create = false) {
    const key = sessionKey(id);
    const directory = create ? privateDirectory(this.root, ".opencode", "powerhouse", "sessions", key)
      : join(this.root, ".opencode/powerhouse/sessions", key);
    // Check existing ancestors even on reads, without creating runtime state.
    for (let path = this.root; path !== directory;) {
      const next = directory.slice(path.length + 1).split(/[\\/]/)[0];
      path = join(path, next);
      if (existsSync(path) && lstatSync(path).isSymbolicLink()) throw new Error("State path contains a symlink");
    }
    return join(directory, "events.jsonl");
  }
  read(id) {
    const path = this.path(id);
    if (!existsSync(path)) return { revision: 0, generation: 0, task: null };
    if (!lstatSync(path).isFile() || lstatSync(path).isSymbolicLink() || lstatSync(path).size > LIMIT)
      throw new Error("Invalid or oversized task journal");
    const text = readFileSync(path, "utf8");
    if (text && !text.endsWith("\n")) throw new Error("Incomplete task journal; restore from a known-good copy");
    let state = { revision: 0, generation: 0, task: null };
    for (const line of text.split("\n").filter(Boolean)) {
      const event = JSON.parse(line);
      if (event.version !== 1 || event.seq !== state.revision + 1 || event.digest !== hash(JSON.stringify(event.state)) ||
          event.state?.revision !== event.seq || !Number.isSafeInteger(event.state.generation) || event.state.generation < state.generation)
        throw new Error("Task journal integrity check failed");
      state = event.state;
    }
    return state;
  }
  change(id, expectedRevision, type, update) {
    const path = this.path(id, true);
    const lock = `${path}.lock`;
    let fd;
    try { fd = openSync(lock, "wx", 0o600); }
    catch (error) {
      if (error.code === "EEXIST") throw new Error("Task journal is busy; retry after the current writer finishes");
      throw error;
    }
    const temporary = `${path}.${randomUUID()}.tmp`;
    try {
      const state = this.read(id);
      if (expectedRevision !== undefined && state.revision !== expectedRevision) throw new Error("Stale task revision; read status and retry");
      const next = update(structuredClone(state));
      if (!next) return state;
      next.revision = state.revision + 1;
      const event = { version: 1, seq: next.revision, type, time: new Date().toISOString(), state: next, digest: hash(JSON.stringify(next)) };
      const content = (existsSync(path) ? readFileSync(path, "utf8") : "") + JSON.stringify(event) + "\n";
      if (Buffer.byteLength(content) > LIMIT) throw new Error("Task journal size limit reached; start a new OpenCode session");
      const output = openSync(temporary, "wx", 0o600);
      try { writeFileSync(output, content); fsyncSync(output); } finally { closeSync(output); }
      renameSync(temporary, path);
      return next;
    } finally {
      if (existsSync(temporary)) unlinkSync(temporary);
      closeSync(fd);
      unlinkSync(lock);
    }
  }
  invalidate(id, reason) {
    if (!this.read(id).task) return;
    return this.change(id, undefined, "workspace.changed", (state) => {
      state.generation += 1;
      state.task.evidence = {};
      state.task.lastChange = reason;
      if (state.task.status === "complete") state.task.status = "active";
      return state;
    });
  }
}

export function taskAction(store, id, args, config, workspace) {
  if (args.action === "status") return { ...store.read(id), availableChecks: Object.keys(config.checks) };
  if (!Number.isSafeInteger(args.revision) || args.revision < 0) throw new Error("Mutations require the revision from status");
  return store.change(id, args.revision, `task.${args.action}`, (state) => {
    if (args.action === "start") {
      if (state.task && state.task.status !== "complete") throw new Error("Finish the existing task before starting another");
      if (!args.objective?.trim() || args.objective.length > 2000 || !args.criteria?.length || args.criteria.length > 20 ||
          !args.criteria.every((item) => typeof item === "string" && item.trim() && item.length <= 400))
        throw new Error("Supply an objective and 1–20 concise acceptance criteria");
      const checks = args.checks ?? Object.keys(config.checks);
      if (!checks.length || checks.length > 20 || new Set(checks).size !== checks.length || checks.some((name) => !Object.hasOwn(config.checks, name)))
        throw new Error("Select at least one configured verification check");
      state.task = { id: randomUUID(), objective: args.objective, criteria: args.criteria, checks,
        status: "active", checkpoint: "", evidence: {}, configDigest: hash(JSON.stringify(config.checks)) };
      return state;
    }
    if (!state.task) throw new Error("No task exists in this session");
    if (args.action === "checkpoint") {
      if (!args.note?.trim() || args.note.length > 4000) throw new Error("A checkpoint note of 1–4000 characters is required");
      state.task.checkpoint = args.note;
    } else if (args.action === "block") {
      if (!args.note?.trim() || args.note.length > 2000) throw new Error("A concise blocker explanation is required");
      state.task.status = "blocked";
      state.task.blocker = args.note;
    } else if (args.action === "resume") {
      state.task.status = "active";
      delete state.task.blocker;
    } else if (args.action === "complete") {
      if (state.task.status !== "active") throw new Error("Only an active task can be completed");
      if (!args.note?.trim() || args.note.length > 2000) throw new Error("Explain how the acceptance criteria were met");
      if (state.task.configDigest !== hash(JSON.stringify(config.checks))) throw new Error("Check configuration changed; run verification again");
      for (const name of state.task.checks) {
        const evidence = state.task.evidence[name];
        if (!evidence || evidence.exitCode !== 0 || evidence.timedOut || evidence.aborted ||
            evidence.generation !== state.generation || !workspace || evidence.workspace !== workspace)
          throw new Error(`Completion requires a current successful run of ${name}`);
      }
      state.task.status = "complete";
      state.task.completion = args.note;
    } else throw new Error("Unknown task action");
    return state;
  });
}

export function evidenceAction(store, id, taskId, generation, name, result, config) {
  return store.change(id, undefined, "check.finished", (state) => {
    if (state.task?.id !== taskId || state.generation !== generation) throw new Error("Workspace changed during verification; rerun the check");
    const digest = hash(JSON.stringify(config.checks));
    if (state.task.configDigest !== digest) state.task.evidence = {};
    state.task.configDigest = digest;
    if (!state.task.checks.includes(name)) throw new Error("Check is not selected for this task");
    state.task.evidence[name] = { exitCode: result.exitCode, generation, durationMs: result.durationMs, workspace: result.workspace,
      checkedAt: new Date().toISOString(), timedOut: result.timedOut, aborted: result.aborted };
    return state;
  });
}

// Keep opaque evidence fingerprints and timestamps on disk, not in model context.
export function taskSummary(state, { action = "status", detail = false } = {}) {
  const result = { revision: state.revision, task: null };
  if (state.availableChecks) result.availableChecks = state.availableChecks;
  if (!state.task) return result;
  const { status, objective, criteria, checks, checkpoint, blocker, completion } = state.task;
  result.task = { status, checks, evidence: Object.fromEntries(Object.entries(state.task.evidence).map(([name, run]) =>
    [name, { exitCode: run.exitCode, timedOut: run.timedOut, aborted: run.aborted }])) };
  if (action === "status") {
    Object.assign(result.task, { objective, criteria, checkpoint, blocker, completion });
    if (!detail) {
      result.task.objective = excerpt(objective, 300);
      result.task.criteria = criteria.slice(0, 5).map((item) => excerpt(item, 120));
      result.task.checkpoint = excerpt(checkpoint, 500);
      if (blocker) result.task.blocker = excerpt(blocker, 300);
      if (completion) result.task.completion = excerpt(completion, 300);
      if (objective.length > 300 || criteria.length > 5 || criteria.some((item) => item.length > 120) ||
          checkpoint.length > 500 || blocker?.length > 300 || completion?.length > 300)
        result.more = "Use status with detail:true for full saved text";
    }
  }
  return result;
}

function excerpt(text, chars) {
  return text.length <= chars ? text : text.slice(0, chars - 1) + "…";
}

export function recoveryContext(state, limit = 1200) {
  if (!state.task || state.task.status === "complete") return "";
  const { objective, criteria, status, checkpoint, blocker, checks } = state.task;
  const prefix = "Saved Powerhouse task data; use status for current revision/details.\n";
  const budget = limit - prefix.length;
  // Prioritize objective, blocker and checkpoint so long criteria cannot hide progress.
  const fields = [status, `Goal: ${excerpt(objective, Math.floor(budget * .25))}`,
    ...(blocker ? [`Blocked: ${excerpt(blocker, Math.floor(budget * .18))}`] : []),
    ...(checkpoint ? [`Checkpoint: ${excerpt(checkpoint, Math.floor(budget * .3))}`] : []),
    `Criteria: ${criteria.map((item) => excerpt(item, 120)).join("; ")}`,
    `Checks: ${checks.join(", ")} (run after final edits)`];
  return prefix + excerpt(fields.join("\n"), budget);
}
