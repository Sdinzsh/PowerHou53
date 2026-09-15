// OpenCode invokes every export in this directory as a plugin factory.
// Keep utilities in ../lib so they are never loaded as plugins.
export { createLoopGuardian as LoopGuardianPlugin } from "../lib/loop-guardian.mjs";
