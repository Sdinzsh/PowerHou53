import { spawn } from "node:child_process";

// Verification commands are explicit argv arrays, never shell-interpolated.
export function runCheck(check, cwd, signal, maxChars = 12000) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new Error("Verification cancelled")); return; }
    const start = Date.now();
    const child = spawn(check.command, check.args, { cwd, shell: false, detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe"] });
    let output = "", timedOut = false, aborted = false, killTimer;
    const capture = (data) => { output = (output + data.toString()).slice(-maxChars); };
    child.stdout.on("data", capture);
    child.stderr.on("data", capture);
    const kill = (signal) => {
      try { if (process.platform !== "win32") process.kill(-child.pid, signal); else child.kill(signal); } catch {}
    };
    const stop = () => { kill("SIGTERM"); killTimer ??= setTimeout(() => kill("SIGKILL"), 500); };
    const abort = () => { aborted = true; stop(); };
    signal?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(() => { timedOut = true; stop(); }, check.timeoutMs);
    const cleanup = () => { clearTimeout(timer); clearTimeout(killTimer); signal?.removeEventListener("abort", abort); };
    child.on("error", (error) => { cleanup(); reject(error); });
    child.on("close", (code, signal) => {
      cleanup();
      resolve({ exitCode: timedOut || aborted ? null : code, signal, timedOut, aborted, durationMs: Date.now() - start, output });
    });
  });
}
