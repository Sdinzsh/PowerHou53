import { privateDirectory, sessionKey } from "../../.opencode/lib/powerhouse-state.mjs";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

// The dependency stays outside OpenCode's startup path. One process per run,
// with a per-parent-session home, prevents cross-session state contamination.
export async function runHarness({ root, sessionID, prompt, settings, signal }, createHarness) {
  if (signal?.aborted) throw new Error("Harness cancelled");
  if (!createHarness) {
    let sdk;
    try { sdk = await import("@deepseek-ai/dsh-sdk-client"); }
    catch (error) { throw new Error("Install Harness dependencies: npm ci --prefix integrations/deepseek-harness", { cause: error }); }
    createHarness = (options) => new sdk.DeepSeekHarness(options);
  }
  const home = privateDirectory(root, ".opencode", "powerhouse", "harness", sessionKey(sessionID));
  const harness = createHarness({ profile: settings.profile, provider: settings.provider, model: settings.model,
    maxTokens: settings.maxTokens, cwd: root, processCwd: root, dshHome: home,
    initializeTimeoutMs: 20000, shutdownTimeoutMs: 1000, disposeEofGraceMs: 1000, disposeGraceMs: 1000 });
  let timer, abort;
  try {
    const cancelled = new Promise((_, reject) => {
      abort = () => reject(new Error("Harness cancelled"));
      signal?.addEventListener("abort", abort, { once: true });
      if (signal?.aborted) abort();
      timer = setTimeout(() => reject(new Error("Harness run timed out")), settings.timeoutMs);
    });
    const result = await Promise.race([harness.run(prompt), cancelled]);
    const endings = result.events.filter((event) => event.type === "turn/end");
    if (!result.finalResponse) throw new Error("Harness returned no final response; inspect its session journal");
    if (endings.at(-1)?.data?.reason?.kind !== "completed")
      throw new Error(`Harness turn did not complete (${endings.at(-1)?.data?.reason?.kind ?? "missing turn/end"}); inspect its session journal`);
    const cap = settings.responseChars ?? 6000;
    const truncated = result.finalResponse.length > cap;
    let responsePath;
    if (truncated) {
      responsePath = join(home, `response-${randomUUID()}.txt`);
      writeFileSync(responsePath, result.finalResponse, { flag: "wx", mode: 0o600 });
    }
    // Preserve the beginning and ending of long reports; full text stays on disk.
    const marker = "\n[…see full report…]\n";
    const preview = truncated ? result.finalResponse.slice(0, cap - Math.floor(cap / 2) - marker.length) + marker + result.finalResponse.slice(-Math.floor(cap / 2)) : result.finalResponse;
    return { sessionId: result.sessionId, finalResponse: preview,
      truncated, responsePath, eventCount: result.events.length,
      turnEnd: endings.at(-1), home, verification: "Delegated output is not parent verification evidence" };
  } finally {
    clearTimeout(timer);
    if (abort) signal?.removeEventListener("abort", abort);
    await harness.close();
  }
}
