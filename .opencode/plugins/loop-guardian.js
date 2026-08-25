// loop-guardian OpenCode plugin
// Deterministic enforcement for the PowerHous3 closed learning loop.
//
// 1. On the first bash tool call of a session, audits the loop invariants
//    (memory caps, learning-loop artifacts, graph drift) and prepends a
//    one-line report to the command so violations are impossible to miss —
//    no LLM discipline required.
// 2. On session idle/deletion, appends one immutable record to
//    improver/session-log.md, making session-end logging mechanical rather
//    than convention-driven.
//
// The prepended note is injected into a double-quoted `echo`, so every shell
// metacharacter that survives inside double quotes ($ ` \ ") is escaped —
// otherwise a path or message fragment could trigger command substitution.
import { appendFileSync, existsSync, readFileSync, readdirSync, statSync, realpathSync } from "fs";
import { join } from "path";

const MEMORY_CAP = 2200;
const USER_CAP = 1375;
const MAX_DEPTH = 12;
// Runtime/per-machine files that must never, on their own, mark the graph
// stale (mirrors STALENESS_EXCLUDE in scripts/loop_check.py).
const STALENESS_EXCLUDE = new Set(["session-log.md"]);

// Recursively test whether any *.md under `dir` is newer than mtimeMs.
// Guards against symlink cycles (visited realpaths) and pathological depth.
// Exported for unit tests; OpenCode ignores non-plugin exports.
export function newerThan(dir, mtimeMs, visited, depth) {
  visited = visited || new Set();
  depth = depth || 0;
  if (depth > MAX_DEPTH) return false;
  let real;
  try {
    real = realpathSync(dir);
  } catch {
    return false;
  }
  if (visited.has(real)) return false;
  visited.add(real);
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue; // don't follow symlinks
      const fp = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (newerThan(fp, mtimeMs, visited, depth + 1)) return true;
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        if (STALENESS_EXCLUDE.has(entry.name)) continue;
        try {
          if (statSync(fp).mtimeMs > mtimeMs) return true;
        } catch {}
      }
    }
  } catch {}
  return false;
}

export function audit(directory) {
  const problems = [];

  const checkCap = (rel, cap) => {
    const p = join(directory, rel);
    if (!existsSync(p)) return `${rel} missing`;
    let len = 0;
    try {
      len = readFileSync(p, "utf8").length;
    } catch {
      return `${rel} unreadable`;
    }
    if (len > cap) return `${rel} over bound (${len}/${cap} chars) - consolidate`;
    return null;
  };
  const memMsg = checkCap("improver/MEMORY.md", MEMORY_CAP);
  if (memMsg) problems.push(memMsg);
  const usrMsg = checkCap("improver/USER.md", USER_CAP);
  if (usrMsg) problems.push(usrMsg);

  if (!existsSync(join(directory, "graphify-out/graph.json")))
    problems.push("knowledge graph not built (graphify-out/graph.json)");
  if (!existsSync(join(directory, "graphify-out/reflections/LESSONS.md")))
    problems.push("LESSONS.md never compiled - run: graphify reflect");

  const graphPath = join(directory, "graphify-out/graph.json");
  if (existsSync(graphPath)) {
    let gTime = 0;
    try {
      gTime = statSync(graphPath).mtimeMs;
    } catch {}
    let stale = false;
    for (const dir of ["agents", "improver", "skills"]) {
      if (newerThan(join(directory, dir), gTime)) {
        stale = true;
        break;
      }
    }
    if (!stale) {
      try {
        if (statSync(join(directory, "AGENTS.md")).mtimeMs > gTime) stale = true;
      } catch {}
    }
    if (stale) problems.push("knowledge graph stale vs sources - run: graphify --update");
  }

  return problems;
}

// Escape a string for safe embedding inside a double-quoted shell `echo`.
// Exported for unit tests; OpenCode ignores non-plugin exports.
export function shellDq(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/`/g, "\\`").replace(/\$/g, "\\$");
}

export const LoopGuardianPlugin = async ({ directory }) => {
  let audited = false;
  let loggedSession = false;
  let bashCount = 0;
  let lastViolations = null; // cache of the first audit, reused at session end

  const logSessionEnd = () => {
    if (loggedSession) return;
    loggedSession = true;
    try {
      const count = lastViolations === null ? "n/a" : lastViolations.length;
      const line =
        `- ${new Date().toISOString()} tool=bash count=${bashCount} violations=${count}\n`;
      appendFileSync(join(directory, "improver/session-log.md"), line, "utf8");
    } catch {}
  };

  return {
    event: async ({ event }) => {
      if (event && (event.type === "session.idle" || event.type === "session.deleted")) {
        logSessionEnd();
      }
    },
    "tool.execute.before": async (input, output) => {
      if (input.tool !== "bash") return;
      bashCount += 1;
      if (audited) return;
      audited = true;
      const problems = audit(directory);
      lastViolations = problems;
      if (problems.length === 0) return;
      const note =
        "[loop-guardian] LOOP VIOLATIONS: " +
        problems.join(" | ") +
        ". Fix before continuing; pre-commit will block on these.";
      output.args.command = 'echo "' + shellDq(note) + '" ; ' + output.args.command;
    },
  };
};
