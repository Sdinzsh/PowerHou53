import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, cpSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("OpenCode discovers all three Powerhouse tools in an isolated project", { timeout: 45000 }, async (t) => {
  const root = mkdtempSync(join(tmpdir(), "powerhouse-opencode-"));
  const project = join(root, "project");
  mkdirSync(join(project, ".opencode/plugins"), { recursive: true });
  cpSync(".opencode/lib", join(project, ".opencode/lib"), { recursive: true });
  cpSync(".opencode/plugins/powerhouse.js", join(project, ".opencode/plugins/powerhouse.js"));
  cpSync(".opencode/package.json", join(project, ".opencode/package.json"));
  cpSync(".opencode/package-lock.json", join(project, ".opencode/package-lock.json"));
  cpSync(".opencode/node_modules", join(project, ".opencode/node_modules"), { recursive: true });
  // Seed the isolated global config too: OpenCode waits for its dependency
  // bootstrap even when only project plugins are configured.
  const globalConfig = join(root, "config/opencode");
  mkdirSync(globalConfig, { recursive: true });
  cpSync(".opencode/package.json", join(globalConfig, "package.json"));
  cpSync(".opencode/package-lock.json", join(globalConfig, "package-lock.json"));
  symlinkSync(join(project, ".opencode/node_modules"), join(globalConfig, "node_modules"));
  const child = spawn("opencode", ["serve", "--hostname", "127.0.0.1", "--port", "0", "--print-logs", "--log-level", "DEBUG"], {
    cwd: project, env: { PATH: process.env.PATH, HOME: root, XDG_CONFIG_HOME: join(root, "config"),
      XDG_DATA_HOME: join(root, "data"), XDG_CACHE_HOME: join(root, "cache"), XDG_STATE_HOME: join(root, "state"),
      OPENCODE_DISABLE_AUTOUPDATE: "true", OPENCODE_DISABLE_DEFAULT_PLUGINS: "true", OPENCODE_DISABLE_MODELS_FETCH: "true" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const exited = new Promise((resolve) => child.once("exit", resolve));
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
    const timer = setTimeout(() => child.kill("SIGKILL"), 2000);
    await exited;
    clearTimeout(timer);
    rmSync(root, { recursive: true, force: true });
  });
  let output = "";
  const url = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`OpenCode startup timed out: ${output}`)), 20000);
    const data = (chunk) => {
      output += chunk;
      const match = output.match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) { clearTimeout(timer); resolve(match[0]); }
    };
    child.stdout.on("data", data); child.stderr.on("data", data);
    child.once("error", (error) => { clearTimeout(timer); reject(error); });
    child.once("exit", () => { clearTimeout(timer); reject(new Error(`OpenCode exited: ${output}`)); });
  });
  let response;
  try { response = await fetch(`${url}/experimental/tool/ids?directory=${encodeURIComponent(project)}`, { signal: AbortSignal.timeout(20000) }); }
  catch (error) { throw new Error(`Tool discovery failed: ${output}`, { cause: error }); }
  const body = await response.text();
  assert.equal(response.status, 200, body);
  const ids = JSON.parse(body);
  for (const name of ["powerhouse_task", "powerhouse_verify", "powerhouse_harness"]) assert.ok(ids.includes(name), `${name} missing: ${body}`);
});
