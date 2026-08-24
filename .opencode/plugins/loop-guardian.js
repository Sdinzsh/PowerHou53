// loop-guardian OpenCode plugin
// Deterministic enforcement for the PowerHous3 closed learning loop.
//
// 1. On the first bash tool call of a session, audits the loop invariants
//    (memory caps, learning-loop artifacts, graph drift) and prepends a
//    one-line report to the command output path so violations are impossible
//    to miss — no LLM discipline required.
// 2. On every session idle event, appends an immutable record to
//    improver/session-log.md, making session-end logging mechanical rather
//    than convention-driven.
//
// IMPORTANT: keep reminder strings free of backticks and $(...).
import { appendFileSync, existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

function newerThan(dir, mtimeMs) {
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fp = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (newerThan(fp, mtimeMs)) return true;
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        if (statSync(fp).mtimeMs > mtimeMs) return true;
      }
    }
  } catch {}
  return false;
}

const MEMORY_CAP = 2200;
const USER_CAP = 1375;

function audit(directory) {
  const problems = [];

  const checkCap = (rel, cap) => {
    const p = join(directory, rel);
    if (!existsSync(p)) return `${rel} missing`;
    const len = readFileSync(p, "utf8").length;
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
    problems.push("LESSONS.md never compiled - run: python3 -m graphify reflect");

  let stale = false;
  const graphPath = join(directory, "graphify-out/graph.json");
  if (existsSync(graphPath)) {
    const gTime = statSync(graphPath).mtimeMs;
    for (const dir of ["agents", "improver", "skills"]) {
      if (newerThan(join(directory, dir), gTime)) {
        stale = true;
        break;
      }
    }
    try {
      if (statSync(join(directory, "AGENTS.md")).mtimeMs > gTime) stale = true;
    } catch {}
  }
  if (stale) problems.push("knowledge graph stale vs sources - run: graphify --update");

  return problems;
}

export const LoopGuardianPlugin = async ({ directory }) => {
  let audited = false;
  let loggedSession = false;
  let bashCount = 0;

  const logSessionEnd = () => {
    if (loggedSession) return;
    loggedSession = true;
    try {
      const line =
        `- ${new Date().toISOString()} tool=bash count=${bashCount} ` +
        `violations=${audited ? audit(directory).length : "n/a"}\n`;
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
      if (problems.length === 0) return;
      const note =
        "[loop-guardian] LOOP VIOLATIONS: " +
        problems.join(" | ") +
        " . Fix before continuing; pre-commit will block on these." ;
      output.args.command =
        'echo "' + note.replace(/"/g, "'") + '" ; ' + output.args.command;
    },
  };
};
