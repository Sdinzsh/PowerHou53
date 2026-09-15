import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runHarness } from "../integrations/deepseek-harness/bridge.mjs";

test("official Harness SDK boots the full runtime, calls a local provider, and shuts down", { timeout: 60000 }, async (t) => {
  const root = mkdtempSync(join(tmpdir(), "powerhouse-sdk-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const requests = [];
  const server = createServer(async (req, res) => {
    try {
      let body = "";
      for await (const chunk of req) body += chunk;
      const data = JSON.parse(body);
      requests.push(data);
      res.writeHead(200, { "Content-Type": "text/event-stream" });
      const chunk = { id: "fixture", object: "chat.completion.chunk", created: 1, model: data.model };
      res.write(`data: ${JSON.stringify({ ...chunk, choices: [{ index: 0, delta: { role: "assistant", content: "HARNESS_RUNTIME_OK" }, finish_reason: null }] })}\n\n`);
      res.write(`data: ${JSON.stringify({ ...chunk, choices: [{ index: 0, delta: {}, finish_reason: "stop" }], usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 } })}\n\n`);
      res.end("data: [DONE]\n\n");
    } catch (error) { res.writeHead(500); res.end(error.message); }
  });
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  t.after(() => new Promise((resolve) => { server.closeAllConnections(); server.close(resolve); }));
  const { DeepSeekHarness } = await import("../integrations/deepseek-harness/node_modules/@deepseek-ai/dsh-sdk-client/lib/index.js");
  const result = await runHarness({ root, sessionID: "runtime-smoke", prompt: "Reply HARNESS_RUNTIME_OK", settings: {
    profile: "sdk", provider: "deepseek-official", model: "deepseek-v4-flash", timeoutMs: 45000, maxTokens: 128,
  } }, (options) => new DeepSeekHarness({ ...options, env: {
    PATH: process.env.PATH, HOME: root, XDG_CONFIG_HOME: root, XDG_CACHE_HOME: root,
    DEEPSEEK_API_KEY: "local-test-only", DEEPSEEK_BASE_URL: `http://127.0.0.1:${server.address().port}`,
    DSH_PERMISSION_MODE: "read-only",
  } }));
  assert.equal(result.finalResponse, "HARNESS_RUNTIME_OK");
  assert.ok(result.eventCount > 0);
  assert.ok(requests.length >= 1);
  assert.ok(requests.some((request) => request.messages.some((message) => JSON.stringify(message.content).includes("Reply HARNESS_RUNTIME_OK"))));
  assert.ok(requests.some((request) => request.tools?.length > 0), "Full runtime must advertise tools");
  assert.equal(result.turnEnd?.data.reason.kind, "completed");
});
