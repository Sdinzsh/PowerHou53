import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { lstatSync, readFileSync, readlinkSync } from "node:fs";
import { join } from "node:path";

// Include ignored tracked files and untracked source; exclude our own journal.
// Git defines the workspace inventory, including worktree/subdirectory handling.
export function workspaceDigest(root) {
  const result = spawnSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024, timeout: 10000 });
  if (result.error || result.status !== 0) throw new Error("Verification requires a readable Git workspace");
  const digest = createHash("sha256");
  for (const file of [...new Set(result.stdout.split("\0").filter(Boolean))].sort()) {
    if (file.startsWith(".opencode/powerhouse/")) continue;
    digest.update(file + "\0");
    try {
      const path = join(root, file), stat = lstatSync(path);
      digest.update(String(stat.mode) + "\0");
      if (stat.isSymbolicLink()) digest.update(readlinkSync(path));
      else if (stat.isFile()) {
        if (stat.size > 32 * 1024 * 1024) throw new Error(`Verification file exceeds 32 MiB: ${file}`);
        digest.update(readFileSync(path));
      } else throw new Error(`Unsupported verification entry (including submodules): ${file}`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      digest.update("<deleted>");
    }
    digest.update("\0");
  }
  return digest.digest("hex");
}
