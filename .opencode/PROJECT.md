# PowerHous3 project context

## Project structure

`agents/` contains nine OpenCode agent definitions; `skills/` contains six skill packages. `improver/` holds bounded memory templates and durable logs. The project-local enforcement kit consists of `scripts/`, `.githooks/`, `.opencode/plugins/loop-guardian.js`, and `.opencode/lib/loop-guardian.mjs`. `tests/` covers the gate, plugin, and real Git commits.

`.opencode/plugins/powerhouse.js` adds task persistence, verified completion and
Harness delegation through `.opencode/lib/powerhouse-*.mjs` and
`integrations/deepseek-harness/bridge.mjs`. `.opencode/powerhouse.json` configures
checks and runtime routing. Local state under `.opencode/powerhouse/` is ignored.

## Tech stack

| Component | Runtime |
| --- | --- |
| Commit gate | Python 3.10+, standard library |
| Plugin | JavaScript ESM, OpenCode plugin hooks |
| Plugin and SDK tests | Node.js ^22.19.0 or >=24, built-in node:test |
| Harness bridge | @deepseek-ai/dsh-sdk-client 0.1.5-rc.2, full sdk profile |
| Plugin dependency | @opencode-ai/plugin 1.18.30 |
| Hooks and integration tests | POSIX shell and Git |
| Agent and skill definitions | Markdown with YAML frontmatter |

## Work progress

| Date | Outcome |
| --- | --- |
| 2026-09-14 | Repaired plugin loading/session isolation, aligned memory checks, hardened staged liveness and hook installation, corrected permissions and installation docs. Full suite passed twice: 27 Python tests, 18 JavaScript tests, 8 hook assertions. Syntax and frontmatter checks passed. |
| 2026-09-15 | Completed native Powerhouse task/checkpoint tools and official Harness SDK bridge. Full suite passed twice: 27 Python tests, 38 Node tests, 8 hook assertions. Actual OpenCode tool discovery passed separately. SDK test booted full Harness against a local HTTP model fixture. Tested Node 26.8.2 and OpenCode 1.18.29 on Linux. |
| 2026-09-15 | Reduced repeated task context and tool output; added on-demand detail/log retrieval and targeted memory-reading rules. Full suite passed: 27 Python, 42 Node and 8 hook assertions; OpenCode discovery passed. Character measurements are in improver/token-audit.md. |

## Architecture notes

Only plugin factories may be exported from `.opencode/plugins/`; helpers belong in `.opencode/lib/`. Session state is keyed by OpenCode session ID. Idle/deletion logs are deduplicated until new bash activity; findings are refreshed at log time. The Python gate reads committed memory content from the index under `--staged`; graph checks inspect machine-local worktree artifacts. Graph freshness uses source mtimes and an optional Graphify manifest for deleted sources, not content hashing.

Powerhouse task journals use revision checks, exclusive locks and atomic replacement.
Completion requires real successful checks with current Git-workspace fingerprints;
ignored dependencies/artifacts are outside the fingerprint. Checkpoints restore into
system and compaction context. Delegation owns and closes an SDK subprocess per
call; Harness permissions remain separate from OpenCode's. OpenCode does not
automatically continue saved tasks. Subdirectory sessions use the worktree root.

Routine recovery is capped at 1,200 characters; compaction at 4,000. Successful
check previews use 800 characters, failures 4,000, and Harness previews 6,000;
full saved task text and retained output are available on demand. Self-improvement
uses relevant prior lessons and one verified memory/skill update when useful,
without per-turn background model reviews. Model maxTokens remains 8,192.

## Active tasks and verification limits

The integration is complete in this checkout. Restart OpenCode to load it; live
Harness calls require a configured model credential. Paid model calls, model coding
quality, macOS and Windows were not exercised. No global installation was changed.
Existing unrelated edits, optional hook wiring and generated graphs were preserved.

## Key learnings and entry points

Run `bash tests/run_all.sh` for the full suite and `python3 scripts/loop_check.py --json` for the worktree gate. `sh scripts/install_hooks.sh --check` checks actual hook wiring. OpenCode's factory contract is documented at https://opencode.ai/docs/plugins/#create-a-plugin. `README.md` and `INSTALL.md` distinguish the global configuration kit from the optional project-local enforcement kit.
