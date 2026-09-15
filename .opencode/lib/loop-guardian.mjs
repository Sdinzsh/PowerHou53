// loop-guardian implementation; kept outside OpenCode's plugin discovery directory.
// Deterministic enforcement for the PowerHous3 closed learning loop.
//
// 1. On the first bash tool call of a session, audits the loop invariants
//    (memory caps, learning-loop artifacts, graph drift) and prepends a
//    one-line report to the command so violations are impossible to miss —
//    no LLM discipline required.
// 2. On session idle/deletion after new bash activity, appends one record to
//    improver/session-log.md, making session-end logging mechanical rather
//    than convention-driven.
//
// The prepended note is injected as a double-quoted printf argument, so every shell
// metacharacter that survives inside double quotes ($ ` \ ") is escaped —
// otherwise a path or message fragment could trigger command substitution.
import { appendFileSync, existsSync, readFileSync, readdirSync, statSync, lstatSync } from "fs";
import { spawnSync } from "node:child_process";
import { join } from "path";

const MEMORY_CAP = 2200;
const USER_CAP = 1375;
const MAX_DEPTH = 12;
const isFile = (path) => {
  try { return statSync(path).isFile(); } catch { return false; }
};

export function audit(directory) {
  const problems = [];

  const checkCap = (rel, cap) => {
    const p = join(directory, rel);
    if (!existsSync(p)) return `${rel} missing`;
    let len = 0;
    try {
      if (!lstatSync(p).isFile()) return `${rel} unreadable - regular file required`;
      len = Array.from(readFileSync(p, "utf8").replace(/\r\n?/g, "\n")).length;
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

  const changelog = join(directory, "improver/changelog.md");
  try {
    if (!lstatSync(changelog).isFile()) problems.push("improver/changelog.md unreadable");
    else if (Date.now() - statSync(changelog).mtimeMs > 14 * 86400000)
      problems.push("improver/changelog.md older than 14d - session-end logging may have stopped");
  } catch {
    problems.push("improver/changelog.md missing");
  }

  if (!isFile(join(directory, "graphify-out/graph.json")))
    problems.push("knowledge graph not built (graphify-out/graph.json)");
  if (!isFile(join(directory, "graphify-out/reflections/LESSONS.md")))
    problems.push("LESSONS.md never compiled - run: graphify reflect");

  const graphPath = join(directory, "graphify-out/graph.json");
  if (isFile(graphPath)) {
    let gTime = 0;
    try {
      gTime = statSync(graphPath).mtimeMs;
    } catch {}
    const stale = sourcePaths(directory).some((rel) => {
      try { return statSync(join(directory, rel)).mtimeMs > gTime; }
      catch { return true; }
    });
    if (stale) problems.push("knowledge graph stale vs sources - use /graphify . --update in OpenCode");
  }

  return problems;
}

// Escape a string for safe embedding inside a double-quoted shell argument.
// Exported from this helper module, never from the plugin entry point.
export function shellDq(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/`/g, "\\`").replace(/\$/g, "\\$");
}

// Match the source scope of scripts/loop_check.py, including ignored files.
function sourcePaths(directory) {
  const matches = (p) => /^(AGENTS\.md|README\.md|INSTALL\.md|agents\/[^/]+\.md|improver\/[^/]+\.md|skills\/(?:[^/]+\/)*[^/]+\.md|\.opencode\/plugins\/[^/]+\.js|\.opencode\/lib\/[^/]+\.mjs|scripts\/[^/]+\.(py|sh)|tests\/[^/]+\.(py|mjs|sh)|\.githooks\/[^/]+)$/.test(p);
  const paths = new Set();
  const git = (args) => spawnSync("git", ["-C", directory, ...args], {
    encoding: "utf8", timeout: 5000, windowsHide: true,
  });
  const tracked = git(["ls-files", "-z"]);
  if (tracked.status === 0) {
    for (const rel of tracked.stdout.split("\0")) if (matches(rel)) paths.add(rel);
  }
  try {
    const manifest = JSON.parse(readFileSync(join(directory, "graphify-out/manifest.json"), "utf8"));
    if (manifest && !Array.isArray(manifest) && typeof manifest === "object")
      for (const rel of Object.keys(manifest))
        if (!rel.split("/").includes("..") && matches(rel)) paths.add(rel);
  } catch {}
  const walk = (rel, depth = 0) => {
    if (depth > MAX_DEPTH) return;
    try {
      for (const entry of readdirSync(join(directory, rel), { withFileTypes: true })) {
        const path = rel ? `${rel}/${entry.name}` : entry.name;
        if (entry.isSymbolicLink()) continue;
        if (entry.isDirectory() && rel.startsWith("skills")) walk(path, depth + 1);
        else if (entry.isFile() && matches(path)) paths.add(path);
      }
    } catch {}
  };
  for (const rel of ["", "agents", "improver", "skills", ".opencode/plugins", ".opencode/lib", "scripts", "tests", ".githooks"]) walk(rel);
  paths.delete("improver/session-log.md");
  const candidates = [...paths];
  for (let offset = 0; offset < candidates.length; offset += 128) {
    const ignored = git(["--literal-pathspecs", "ls-files", "--others", "--ignored", "--exclude-standard", "-z", "--", ...candidates.slice(offset, offset + 128)]);
    if (ignored.status === 0) for (const rel of ignored.stdout.split("\0")) paths.delete(rel);
  }
  return [...paths];
}

export const createLoopGuardian = async ({ directory, worktree }) => {
  const root = worktree && existsSync(join(worktree, "improver")) ? worktree : directory;
  const sessions = new Map();

  const logSessionEnd = (id) => {
    const state = sessions.get(id);
    if (!state || state.loggedCount === state.bashCount) return;
    try {
      const count = audit(root).length;
      const line =
        `- ${new Date().toISOString()} session=${JSON.stringify(id)} tool=bash count=${state.bashCount} violations=${count}\n`;
      appendFileSync(join(root, "improver/session-log.md"), line, "utf8");
      state.loggedCount = state.bashCount;
    } catch {}
  };

  return {
    event: async ({ event }) => {
      const id = event?.properties?.sessionID ?? event?.properties?.info?.id;
      if (!id) return;
      if (event.type === "session.idle" || event.type === "session.deleted" ||
          (event.type === "session.status" && event.properties.status?.type === "idle"))
        logSessionEnd(id);
      if (event.type === "session.deleted") sessions.delete(id);
    },
    "tool.execute.before": async (input, output) => {
      if (input.tool !== "bash" || !input.sessionID || typeof output.args?.command !== "string") return;
      let state = sessions.get(input.sessionID);
      if (!state) {
        state = { bashCount: 0, loggedCount: 0 };
        sessions.set(input.sessionID, state);
      }
      state.bashCount += 1;
      if (state.bashCount > 1) return;
      const problems = audit(root);
      if (problems.length === 0) return;
      const note =
        "[loop-guardian] LOOP CHECK: " +
        problems.join(" | ") +
        ". Memory bounds and required memory files block commits; graph/liveness findings are warnings by default.";
      output.args.command = 'printf "%s\\n" "' + shellDq(note) + '" >&2; ' + output.args.command;
    },
  };
};
