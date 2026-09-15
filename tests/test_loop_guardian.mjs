// Tests for .opencode/plugins/loop-guardian.js
// Run:  node --test tests/test_loop_guardian.mjs      (from repo root)
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, symlinkSync, utimesSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN = join(HERE, "..", ".opencode", "plugins", "loop-guardian.js");
const pluginModule = await import(PLUGIN);
const { LoopGuardianPlugin } = pluginModule;
const { shellDq, audit } = await import("../.opencode/lib/loop-guardian.mjs");

function mkrepo({ mem = "small", usr = "small", graph = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "ph3-guardian-"));
  mkdirSync(join(dir, "improver"), { recursive: true });
  writeFileSync(join(dir, "improver/MEMORY.md"), "M".repeat(mem === "big" ? 5000 : 10));
  writeFileSync(join(dir, "improver/USER.md"), "U".repeat(usr === "big" ? 3000 : 10));
  writeFileSync(join(dir, "improver/changelog.md"), "# changelog\n");
  if (graph) {
    mkdirSync(join(dir, "graphify-out/reflections"), { recursive: true });
    writeFileSync(join(dir, "graphify-out/graph.json"), "{}");
    writeFileSync(join(dir, "graphify-out/reflections/LESSONS.md"), "# lessons\n");
    // Make the graph the newest artifact so audit() is not "stale".
    const future = Date.now() / 1000 + 100000;
    utimesSync(join(dir, "graphify-out/graph.json"), future, future);
  }
  return dir;
}

test("shellDq escapes every double-quote-hostile metacharacter", () => {
  assert.equal(shellDq('a"b'), 'a\\"b');
  assert.equal(shellDq("a$b"), "a\\$b");
  assert.equal(shellDq("a`b"), "a\\`b");
  assert.equal(shellDq("a\\b"), "a\\\\b");
  // command-substitution attempt is fully neutralised
  assert.equal(shellDq("$(id)"), "\\$(id)");
});

test("audit flags an over-cap MEMORY.md", () => {
  const dir = mkrepo({ mem: "big" });
  try {
    const problems = audit(dir);
    assert.ok(problems.some((p) => /over bound/.test(p)), problems.join(" | "));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("audit is clean on a well-formed, non-stale repo", () => {
  const dir = mkrepo();
  try {
    assert.deepEqual(audit(dir), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("audit reports missing learning-loop artifacts", () => {
  const dir = mkrepo({ graph: false });
  try {
    const problems = audit(dir);
    assert.ok(problems.some((p) => /graph\.json/.test(p)));
    assert.ok(problems.some((p) => /LESSONS\.md/.test(p)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("audit survives a symlink cycle without hanging", () => {
  const dir = mkrepo();
  try {
    mkdirSync(join(dir, "skills/a"), { recursive: true });
    writeFileSync(join(dir, "skills/a/x.md"), "hi");
    symlinkSync(join(dir, "skills/a"), join(dir, "skills/a/loop"));
    assert.deepEqual(audit(dir), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("before-hook injects a stderr note only when findings exist", async () => {
  const dir = mkrepo({ mem: "big" });
  try {
    const hooks = await LoopGuardianPlugin({ directory: dir });
    const output = { args: { command: "ls -la" } };
    await hooks["tool.execute.before"]({ tool: "bash", sessionID: "one" }, output);
    assert.ok(output.args.command.startsWith('printf "%s\\n"'));
    assert.ok(output.args.command.endsWith("; ls -la"));
    assert.ok(output.args.command.includes("LOOP CHECK"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("before-hook leaves the command untouched on a clean repo", async () => {
  const dir = mkrepo();
  try {
    const hooks = await LoopGuardianPlugin({ directory: dir });
    const output = { args: { command: "echo hi" } };
    await hooks["tool.execute.before"]({ tool: "bash", sessionID: "one" }, output);
    assert.equal(output.args.command, "echo hi");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("before-hook only fires on the bash tool and only once", async () => {
  const dir = mkrepo({ mem: "big" });
  try {
    const hooks = await LoopGuardianPlugin({ directory: dir });
    const nonBash = { args: { command: "x" } };
    await hooks["tool.execute.before"]({ tool: "read", sessionID: "one" }, nonBash);
    assert.equal(nonBash.args.command, "x"); // untouched for non-bash

    const first = { args: { command: "one" } };
    await hooks["tool.execute.before"]({ tool: "bash", sessionID: "one" }, first);
    assert.ok(first.args.command.includes("LOOP CHECK"));

    const second = { args: { command: "two" } };
    await hooks["tool.execute.before"]({ tool: "bash", sessionID: "one" }, second);
    assert.equal(second.args.command, "two"); // audit only annotates once
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("session.idle appends exactly one deterministic session-log line", async () => {
  const dir = mkrepo();
  try {
    const hooks = await LoopGuardianPlugin({ directory: dir });
    await hooks["tool.execute.before"]({ tool: "bash", sessionID: "one" }, { args: { command: "true" } });
    await hooks.event({ event: { type: "session.idle", properties: { sessionID: "one" } } });
    await hooks.event({ event: { type: "session.idle", properties: { sessionID: "one" } } });
    const log = readFileSync(join(dir, "improver/session-log.md"), "utf8");
    const lines = log.trim().split("\n").filter((l) => l.startsWith("- "));
    assert.equal(lines.length, 1, log);
    assert.ok(/tool=bash count=\d+ violations=/.test(lines[0]));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("every entry-point export can be initialized by the OpenCode loader", async () => {
  const dir = mkrepo();
  try {
    assert.deepEqual(Object.keys(pluginModule), ["LoopGuardianPlugin"]);
    for (const factory of Object.values(pluginModule)) {
      const hooks = await factory({ directory: dir });
      assert.equal(typeof hooks.event, "function");
      assert.equal(typeof hooks["tool.execute.before"], "function");
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("sessions audit independently and resumed sessions log new activity", async () => {
  const dir = mkrepo({ mem: "big" });
  try {
    const hooks = await LoopGuardianPlugin({ directory: dir });
    const run = async (sessionID) => {
      const output = { args: { command: "true" } };
      await hooks["tool.execute.before"]({ tool: "bash", sessionID }, output);
      return output.args.command;
    };
    const idle = (sessionID) => hooks.event({ event: { type: "session.idle", properties: { sessionID } } });
    assert.match(await run("one"), /LOOP CHECK/);
    assert.match(await run("two"), /LOOP CHECK/);
    await idle("two");
    await idle("one");
    await idle("one");
    assert.equal(await run("one"), "true");
    writeFileSync(join(dir, "improver/MEMORY.md"), "fixed");
    await hooks.event({ event: { type: "session.status", properties: { sessionID: "one", status: { type: "idle" } } } });
    await hooks.event({ event: { type: "session.deleted", properties: { info: { id: "one" } } } });
    const lines = readFileSync(join(dir, "improver/session-log.md"), "utf8").trim().split("\n");
    assert.equal(lines.length, 3);
    assert.match(lines[0], /session="two" tool=bash count=1 violations=1/);
    assert.match(lines[1], /session="one" tool=bash count=1 violations=1/);
    assert.match(lines[2], /session="one" tool=bash count=2 violations=0/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("memory bounds count Unicode code points and normalize CRLF", () => {
  const dir = mkrepo();
  try {
    writeFileSync(join(dir, "improver/MEMORY.md"), "😀".repeat(2199) + "\r\n");
    assert.deepEqual(audit(dir), []);
    writeFileSync(join(dir, "improver/MEMORY.md"), "😀".repeat(2201));
    assert.ok(audit(dir).some((p) => /over bound/.test(p)));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("missing and old changelogs are reported", () => {
  const dir = mkrepo();
  try {
    const path = join(dir, "improver/changelog.md");
    utimesSync(path, 0, 0);
    assert.ok(audit(dir).some((p) => /older than 14d/.test(p)));
    rmSync(path);
    assert.ok(audit(dir).some((p) => /changelog.md missing/.test(p)));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("drift covers scripts, docs, tests and hooks but ignores vendor/runtime files", () => {
  const dir = mkrepo();
  try {
    const git = (...args) => {
      const result = spawnSync("git", ["-C", dir, ...args], { encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr);
    };
    git("init", "-q");
    writeFileSync(join(dir, ".gitignore"), "skills/vendor.md\nimprover/session-log.md\n");
    mkdirSync(join(dir, "skills"));
    const future = Date.now() / 1000 + 200000;
    for (const rel of ["skills/vendor.md", "improver/session-log.md"]) {
      writeFileSync(join(dir, rel), "runtime");
      utimesSync(join(dir, rel), future, future);
    }
    assert.deepEqual(audit(dir), []);
    for (const rel of ["README.md", "scripts/check.py", ".opencode/lib/check.mjs", "tests/check.sh", ".githooks/pre-commit"]) {
      mkdirSync(dirname(join(dir, rel)), { recursive: true });
      writeFileSync(join(dir, rel), "source");
      utimesSync(join(dir, rel), future, future);
      assert.ok(audit(dir).some((p) => /stale/.test(p)), rel);
      rmSync(join(dir, rel));
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("injected note preserves stdout and command exit status", async () => {
  const dir = mkrepo({ mem: "big" });
  try {
    const hooks = await LoopGuardianPlugin({ directory: dir });
    const output = { args: { command: "printf original; exit 7" } };
    await hooks["tool.execute.before"]({ tool: "bash", sessionID: "one" }, output);
    const result = spawnSync("sh", ["-c", output.args.command], { encoding: "utf8" });
    assert.equal(result.stdout, "original");
    assert.equal(result.status, 7);
    assert.match(result.stderr, /LOOP CHECK/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("sessions started in a subdirectory use the worktree memory store", async () => {
  const dir = mkrepo();
  try {
    mkdirSync(join(dir, "nested"));
    const hooks = await LoopGuardianPlugin({ directory: join(dir, "nested"), worktree: dir });
    const output = { args: { command: "true" } };
    await hooks["tool.execute.before"]({ tool: "bash", sessionID: "one" }, output);
    assert.equal(output.args.command, "true");
    await hooks.event({ event: { type: "session.deleted", properties: { info: { id: "one" } } } });
    assert.match(readFileSync(join(dir, "improver/session-log.md"), "utf8"), /session="one"/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("manifest detects sources deleted from the graph even after commit", () => {
  const dir = mkrepo();
  try {
    writeFileSync(join(dir, "graphify-out/manifest.json"), JSON.stringify({ "agents/deleted.md": {} }));
    assert.ok(audit(dir).some((p) => /stale/.test(p)));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("failed log writes can be retried on the next idle event", async () => {
  const dir = mkrepo();
  try {
    const hooks = await LoopGuardianPlugin({ directory: dir });
    await hooks["tool.execute.before"]({ tool: "bash", sessionID: "one" }, { args: { command: "true" } });
    const path = join(dir, "improver/session-log.md");
    mkdirSync(path);
    const event = { event: { type: "session.idle", properties: { sessionID: "one" } } };
    await hooks.event(event);
    rmSync(path, { recursive: true });
    await hooks.event(event);
    assert.match(readFileSync(path, "utf8"), /session="one"/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
