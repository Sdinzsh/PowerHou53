// Tests for .opencode/plugins/loop-guardian.js
// Run:  node --test tests/test_loop_guardian.mjs      (from repo root)
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, symlinkSync, utimesSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN = join(HERE, "..", ".opencode", "plugins", "loop-guardian.js");
const { shellDq, audit, newerThan, LoopGuardianPlugin } = await import(PLUGIN);

function mkrepo({ mem = "small", usr = "small", graph = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "ph3-guardian-"));
  mkdirSync(join(dir, "improver"), { recursive: true });
  writeFileSync(join(dir, "improver/MEMORY.md"), "M".repeat(mem === "big" ? 5000 : 10));
  writeFileSync(join(dir, "improver/USER.md"), "U".repeat(usr === "big" ? 3000 : 10));
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

test("newerThan survives a symlink cycle without hanging", () => {
  const dir = mkdtempSync(join(tmpdir(), "ph3-cycle-"));
  try {
    mkdirSync(join(dir, "a"));
    writeFileSync(join(dir, "a/x.md"), "hi");
    symlinkSync(join(dir, "a"), join(dir, "a/loop")); // self-referential cycle
    // Must return promptly (guarded), and see x.md as newer than epoch 0.
    assert.equal(newerThan(join(dir, "a"), 0), true);
    // Nothing is newer than a far-future timestamp.
    assert.equal(newerThan(join(dir, "a"), Date.now() * 2), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("before-hook injects an escaped echo only when violations exist", async () => {
  const dir = mkrepo({ mem: "big" });
  try {
    const hooks = await LoopGuardianPlugin({ directory: dir });
    const output = { args: { command: "ls -la" } };
    await hooks["tool.execute.before"]({ tool: "bash" }, output);
    assert.ok(output.args.command.startsWith('echo "'));
    assert.ok(output.args.command.endsWith("; ls -la"));
    assert.ok(output.args.command.includes("LOOP VIOLATIONS"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("before-hook leaves the command untouched on a clean repo", async () => {
  const dir = mkrepo();
  try {
    const hooks = await LoopGuardianPlugin({ directory: dir });
    const output = { args: { command: "echo hi" } };
    await hooks["tool.execute.before"]({ tool: "bash" }, output);
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
    await hooks["tool.execute.before"]({ tool: "read" }, nonBash);
    assert.equal(nonBash.args.command, "x"); // untouched for non-bash

    const first = { args: { command: "one" } };
    await hooks["tool.execute.before"]({ tool: "bash" }, first);
    assert.ok(first.args.command.includes("LOOP VIOLATIONS"));

    const second = { args: { command: "two" } };
    await hooks["tool.execute.before"]({ tool: "bash" }, second);
    assert.equal(second.args.command, "two"); // audit only annotates once
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("session.idle appends exactly one deterministic session-log line", async () => {
  const dir = mkrepo();
  try {
    const hooks = await LoopGuardianPlugin({ directory: dir });
    await hooks.event({ event: { type: "session.idle" } });
    await hooks.event({ event: { type: "session.idle" } }); // second must be a no-op
    const log = readFileSync(join(dir, "improver/session-log.md"), "utf8");
    const lines = log.trim().split("\n").filter((l) => l.startsWith("- "));
    assert.equal(lines.length, 1, log);
    assert.ok(/tool=bash count=\d+ violations=/.test(lines[0]));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
