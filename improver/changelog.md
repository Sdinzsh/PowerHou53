# Change Log

## 2026-08-25 — Enforcement-kit hardening: staged gate, bootstrap-safe, test suite
- **Critical: staged-bypass closed.** Pre-commit gate previously read the working tree, so staging over-cap content then shrinking the file committed it anyway (reproduced: 5000-char MEMORY.md through a 2200 gate, exit 0). `loop_check.py` now supports `--staged` and reads the git index (`git show :path`); `.githooks/pre-commit` passes `--staged`. Regression test proves a real `git commit` is now blocked.
- **Critical: bootstrap deadlock fixed.** Fresh clones (graphify-out/ is gitignored) failed the gate on missing `graph.json`/`LESSONS.md`, blocking every commit. These are now WARNINGS by default (per-machine artifacts); promote with `--require-graph`. Memory caps + changelog presence remain HARD on committed content.
- **Unwired-gate fixed.** `core.hooksPath` was never set, so the "hard gate" never ran. New idempotent `scripts/install_hooks.sh` (wire + chmod + smoke-test); `loop_check.py --check` reports wiring state.
- **.needs_update one-way latch fixed.** The drift marker was set but never cleared. `loop_check.py` now removes it once sources are no longer newer than graph.json (post-commit delegates to it).
- **Staleness scope fixed.** Excluded gitignored + runtime files (e.g. `session-log.md`) that made the graph permanently stale; replaced fnmatch (which crossed `/`, matching `__pycache__`) with a segment-aware matcher.
- **loop-guardian.js hardened.** Shell-escape the injected echo ($, backtick, backslash, quote) to kill command-substitution risk; symlink-cycle + depth guard in `newerThan`; cached audit reused at session end; changelog-liveness now a warning with `LOOP_CHECK_SKIP=1` escape hatch and no-python graceful degrade.
- **Sub-agents cannot re-delegate.** Added `permission.task: {"*": deny}` to all 6 sub-agents (backend/frontend/general/testing/explore/hermes), enforcing AGENTS.md rule 6 deterministically. Trimmed unused `@opencode-ai/plugin` dep from `.opencode/package.json`.
- **Tests added (zero deps).** `tests/`: 19 python unittest + 9 `node --test` + 5-assertion shell hook e2e; `tests/run_all.sh` + `.github/workflows/ci.yml`. Ran twice, no flakes.

## 2026-08-24 — Pre-push audit & verification (GitHub readiness)
- **Push inventory fixed**: `.gitignore` negations ship first-party `.opencode/plugins/loop-guardian.js` + `.opencode/package.json` while vendor `graphify.js`, `node_modules`, locks stay machine-local; nested `.opencode/.gitignore` adjusted accordingly. 42 files / ~408K total.
- **E2E gate proof**: deliberate over-cap MEMORY.md → real `git commit` blocked with exit=1 and FAIL line, zero commits created; restore → loop_check OK. Strict-stale fail path re-verified (rc=1).
- **Graph integrity after splices**: 69 nodes; query "what enforces the learning loop" correctly traverses loop_check.py / loop-guardian.js nodes.
- **INSTALL.md**: new "Enable the hard loop gates" section for repo consumers (validator usage, hooksPath wiring, plugin auto-load notes).
- **Secrets/personal-path scan**: clean across all shippable files.

## 2026-08-24 — Closed-loop enforcement: graph built, lessons compiled, conventions hardened
- **Knowledge Graph built in-repo**: curated-detect graphify pipeline (35 docs + 3 code files; excludes gitignored junk). Final: 65 nodes, 80 edges, 11 communities, 3 hyperedges restored after rebuild, 0 dangling/health flags; includes the new enforcement layer (loop_check gate, git hooks, loop-guardian plugin) as first-class nodes. God nodes: Universal Protocol, Task Dispatch, Graphify CLI, Hermes, Bounded Memory Store. Outputs in `graphify-out/` (`graph.html`, `GRAPH_REPORT.md`, `graph.json`, `manifest.json`, `cost.json`).
- **Learning loop closed**: 3 `save-result` entries (2 useful, 1 corrected) → `graphify reflect` → `graphify-out/reflections/LESSONS.md` with preferred/tentative/correction tags. Live query verified: "how does the self-improving learning loop work" traversed 31 correct nodes.
- **Convention → code enforcement**: new `scripts/loop_check.py` (memory caps 2200/1375, artifact presence, changelog liveness ≤14d, graph-drift detection writing `.needs_update`); wired as HARD pre-commit gate via `.githooks/pre-commit` + `git config core.hooksPath .githooks`. `.githooks/post-commit` marks drift. Tested: over-cap MEMORY.md → exit 1 block confirmed.
- **New plugin** `.opencode/plugins/loop-guardian.js`: deterministic first-bash violation echo + `session.idle` append to `improver/session-log.md` — session-end logging no longer depends on LLM discipline. Violation path tested against fake project. `node --check` clean; `.opencode/package.json` set `"type": "module"`.
- **Limitation from earlier analysis resolved**: knowledge-graph now exercised here (was absent), LESSONS.md compiled (was missing), self-improvement enforcement is code-backed (was prompt-only convention per 2026-08-23 note).

## 2026-08-23 — Final pre-push audit (full re-read of all files)
- Removed duplicated sentence fragment in all 3 meta-agents' Real-Time Project Adaptation (residue from the earlier scripted reorder).
- explore.md: aligned prior-knowledge step with role-scoped protocol (task spec + graph-if-exists instead of memory reads).
- INSTALL.md feature bullet rewritten honestly (curator as convention, session-end logging); MEMORY.md graph guidance aligned with native-search-first speed rule.
- Verified end-to-end: 37 files, all frontmatters spec-compliant, no stale terminology outside dated historical entries, sub-agent permission allowlists intact.

## 2026-08-23 — Finalization pass (full-file audit before GitHub publish)
- Fixed comma-splice grammar bug in all 3 meta-agents ("PROJECT.md`, Create/update" → "PROJECT.md`. Create/update").
- Resolved contradiction: "Real-Time Project Adaptation" ordered PROJECT.md creation FIRST while the milestone policy de-blocked it — reordered to scan → compare → override → write PROJECT.md at milestone/session end.
- INSTALL.md loop diagram rewritten to actual mechanics (native `skill` tool, proportional protocol, graph-only-if-exists, batched end-of-session logging); removed retired "Level 0/1", "The Nudge" fork, "~3k tokens" claims; agents table updated ("Memory/skill-aware" → "Spec-driven").
- README pillars aligned: proportional protocol wording, milestone-based PROJECT.md, session-start/end diagram terms.
- token-audit.md strategy #3 updated to native skill loading; knowledge.md 2026-08-15 Safety Gates entry annotated as convention-not-config-key.
- Verified: vendor graphify frontmatter spec-compliant; no stale terms remain outside dated historical entries; all frontmatter YAML-valid; live install re-synced.

## 2026-08-23 — Toolchain installation added (graphify, markitdown, playwright/agent-browser)
- **Installed on machine**: `graphifyy` v0.9.48 via uv (CLI `graphify`); registered vendor OpenCode skill + plugin hook (`graphify install --platform opencode`) which replaced the bundled hand-written graphify SKILL.md with the canonical one; `markitdown` v0.1.7 via uv with individual format extras; agent-browser v0.34.0 already present.
- **Ecosystem skills installed** to `~/.agents/skills/` per find-skills procedure (quality-verified): `microsoft/playwright-cli@playwright-cli` (128K installs) and `vercel-labs/agent-browser`. Both are OpenCode-discoverable, no name collisions.
- **INSTALL.md**: new "Set the toolchain" section with verified commands, PATH notes (`uv tool update-shell`), the `graphifyy` double-y PyPI gotcha, the broken `markitdown[all]` pin workaround (#2179), and duplicate-skill-name warning for graphify.
- **plugins.md**: three dated toolchain entries registered.

## 2026-08-23 — Performance pass: fix end-to-end slowness on real projects
Root causes addressed (ceremony tax, approval stalls, step exhaustion, over-delegation):
- **Proportional protocol** (`AGENTS.md`): added Execution Speed Rules — fast path for trivial actions (no planning cycle), batch independent tool calls into single turns, no re-reading known context, Knowledge Graph only when the graph file already exists and the question is structural (never build unprompted; native search fallback), verification at milestones not micro-edits, logging batched once at session end.
- **Step caps raised**: GOD 35→60, MAX 30→50, safe 25→40. Old caps forced mid-task summarization → restarts → perceived incompleteness/slowness on long turns.
- **Approval stalls removed from sub-agents** (backend/frontend/general/testing): `bash: ask` → patterned allowlist for read-only commands (`ls`, `cat`, `head/tail/wc`, `grep`/`rg`, `tree`, read-only git). Destructive/unknown commands still ask. Per-project loosening documented in agent-permissions.md.
- **Dispatch protocol slimmed** in all editing sub-agents: dropped mandatory MEMORY.md/skills round-trip per dispatch (spec carries conventions); added batching + one-shot completion guidance; telemetry reporting moved to dispatcher.
- **Meta-agent routing hardened**: dispatched specs must be self-contained (paths, constraints, acceptance criteria) so subagents don't re-explore; independent tasks dispatch in parallel.
- **PROJECT.md de-blocked**: created/updated at milestones or session end, never blocking active work.
- **Skill index weight cut**: llm-council description trimmed ~1010→~330 chars (it is always-in-context via `<available_skills>`; full methodology remains in body).

## 2026-08-23 — Logic hardening pass (verified against opencode.ai docs)
- **Fictional tools removed**: `skill_manage`, `skill_view`, `skills_list` do not exist in OpenCode. All operative prompts now use the native `skill` tool (`skill({ name })` loads a body; `<available_skills>` is the index) plus plain file operations (write/edit) for creating/patching `SKILL.md`. Affected: `AGENTS.md`, `agents/hermes.md`, `INSTALL.md`, `improver/skills.md`, `skills/sample-skill/`.
- **Frontmatter compliance**: OpenCode only recognizes `name`, `description`, `license`, `compatibility`, `metadata`; unknown fields are silently ignored. Moved `category`/`tags`/`verified`/`provenance` into the `metadata` map across all 6 skills so telemetry actually survives loading.
- **Role-scoped memory protocol**: session-start reads and improver appends were mandated for every agent, but subagent sessions build fresh context per dispatch — parallel subagents appending to shared logs would race and duplicate. Now scoped: primaries read/write the store; sub-agents consume dispatcher task specs only.
- **Step-budget sanity**: mandatory session-start reads cut from 7 files to 4 (`MEMORY.md`, `USER.md`, `knowledge.md`, changelog skim); `plugins.md`/`skills.md`/`token-audit.md` now load on demand. Prevents routers (steps 25–35) burning ~8 steps on housekeeping before real work.
- **Delegation heuristic** added to all 3 meta-agents (delegate when domain-specific AND substantial; direct handling for trivial cross-cutting tweaks) — prevents over-delegation overhead.
- **PROJECT.md threshold**: creation now triggers on substantive work (first edit/install/multi-step task), not one-off Q&A.
- **Accuracy fixes**: char↔token math corrected (2,200 chars ≈ ~550 tokens; 1,375 ≈ ~350); FTS5 recall and write-approval gates re-labeled as convention/roadmap rather than shipped features; `bash: ask` on sub-agents documented as intentional supervised autonomy in agent-permissions.md.

## 2026-08-23 — MAJOR: Deduplication & weight reduction pass
- **Shared engine extracted to `AGENTS.md`**: The ~200-line Universal Protocol (Think-Before-Act, Goal/Task/Context/Constraints framing, Web/Playwright stack, KG engine, bounded memory store, skills conventions) was duplicated verbatim across all 3 meta-agents. It now lives once in `AGENTS.md` (loaded globally for every session per OpenCode docs); meta-agent files keep only frontmatter + identity + mode-specific policy.
  - `PowerHous3-god.md`: 267 → ~90 lines; `PowerHous3-Max.md`: 267 → ~90 lines; `PowerHous3.md`: 280 → ~100 lines. Net repo: ~480 duplicated lines removed (~17% of total). Mode-specific confirmation language (GOD/MAX apply-directly vs ask-first) preserved verbatim in each file's responsibilities sections.
- **README.md**: improver tree listed 7 of the 9 shipped files — added `session-handoff.md` and `agent-permissions.md`.
- **INSTALL.md**: merged byte-identical Linux/macOS install sections into one; normalized all copy commands to `cp -r` / `-Recurse` (was mixed `cp` vs `cp -r`, inconsistent with README).
- **improver/MEMORY.md**: replaced stale `madar pack` reference (tool not part of this stack) with `graphify query`.
- **Correction note**: the 2026-08-16 entry below references a `walkthrough.md` that was never shipped in this package — treat that filename as void.

## 2026-08-16 — Tool-calling & permission fixes across agent configs
- **external_directory allow (all 9 agents)**: Added `external_directory: { "~/.config/opencode/**": allow }`. Without it, every read/write of the improver store or skills library from inside a project worktree hit the default `ask` gate, stalling the mandated session-start memory reads and post-action appends.
- **websearch: allow (3 meta-agents)**: Prompts feature Web Search as a core capability but the permission key was absent (only worked via permissive defaults; a stricter global config would silently disable it).
- **explore.md read-only enforcement**: `edit: ask` → `edit: deny` (its charter says read-only); bash now allows only read-only patterns (`graphify query|path|explain`, `git status|log|diff|show`) so autonomous graph exploration doesn't trigger per-command approval prompts; everything else still asks.
- **default_agent casing fix (README.md, INSTALL.md)**: `"powerhous3-god"` → `"PowerHous3-god"`. OpenCode matches agent names exactly (case-sensitive, name derived from filename); the lowercase value silently fell back to the built-in `build` agent. **Action: update live opencode.json to `"default_agent": "PowerHous3-god"`** (previous entry noted live config has the lowercase value).
- **Added AGENTS.md (new file)**: Shared Tool-Calling Discipline + memory/skills conventions — referenced by `testing.md` and `agent-permissions.md` but never shipped. Installs to `~/.config/opencode/AGENTS.md` (global instructions). Install commands in README/INSTALL updated.
- **agent-permissions.md**: Documented the new shared permission set and subagent `task`-deny behavior.

## 2026-08-16 — Reinstalled PowerHous3 package per INSTALL.md (full sync)
- Ran `cp ./agents/*`, `cp ./improver/*`, `cp -r ./skills/*` into `~/.config/opencode/` per INSTALL.md Linux steps.
- **State before**: `agents/` and `skills/` were already in sync with repo; `improver/` (7 files) was stale (June 2026 state with old machine logs, outdated plugin/skill records).
- **Synced**: Replaced stale live `improver/` files with the newer cleaned repo revisions (changelog, knowledge, session-handoff, plugins, skills, token-audit, agent-permissions). Backed up old state to `/tmp/opencode/improver-bak-20260816-134106/`.
- **Config**: `opencode.jsonc` already had `"default_agent": "powerhous3-god"` — no change needed.
- **Verified**: `diff -rq` clean across all 3 dirs (9 agents + 9 improver files + 6 skills). Changes take effect on next session restart.

## 2026-08-16 — MAJOR: Mandatory Living `PROJECT.md` & Universal Comprehension Finalization
- **Mandatory Project Context**: Added mandatory `.opencode/PROJECT.md` living document protocol to all 3 meta-orchestrators (`PowerHous3-god.md`, `PowerHous3-Max.md`, `PowerHous3.md`).
- **Session Rules**: Meta-agents now automatically read `.opencode/PROJECT.md` at session start and continuously update directory structure, tech stack, work progress, and architecture notes at session end.
- **Universal Comprehension ("Understands Anything")**: Fully integrated AST Tree-sitter knowledge graph (`Understand-Anything`), multi-modal media ingestion (`MarkItDown`), domain mapping (`/understand-domain`), and guided onboarding walkthroughs (`/understand-onboard`).
- **Self-Improving Memory Loop**: Enforced `graphify save-result` outcome logging, `graphify reflect` lesson compilation (`LESSONS.md`), and node confidence tagging (`preferred`, `tentative`, `contested`).
- **Dynamic Web & Browser Automation**: Standardized Playwright (`agent-browser`) DOM snapshotting (`@eN`) and visual verification across `explore.md` and `hermes.md`.
- **Documentation**: Updated `README.md`, `INSTALL.md`, and `walkthrough.md` with complete 5-pillar architecture specs and verification rules.

## 2026-08-15 — MAJOR: PowerHous3 Architecture Upgrade (Hermes Agent & Closed Learning Loop)
- **Scope**: Complete architecture upgrade from static improver log files to Closed Learning Loop system.
- **Meta-Agents Upgraded**: `PowerHous3-god.md`, `PowerHous3-Max.md`, `PowerHous3.md` — all embed the 5-tier PowerHous3 engine (Bounded Memory, Progressive Skills, Background Review, Autonomous Curator, FTS5 Recall).
- **Sub-Agents Upgraded**: `hermes.md` (procedural memory engine), `backend.md`, `frontend.md`, `explore.md`, `general.md`, `testing.md` — all check `MEMORY.md` and `skills/` before executing tasks.
- **Memory Store Created**: `improver/MEMORY.md` (bounded 2,200 char cap), `improver/USER.md` (bounded 1,375 char cap), `improver/knowledge.md`, `improver/skills.md`, `improver/plugins.md`, `improver/token-audit.md`.
- **Skills System Overhaul**: `agentskills.io` standard with YAML frontmatter, 3-level progressive disclosure (L0 Index / L1 Procedure / L2 Reference), and `skill_manage` tool actions (`create`/`patch`/`edit`/`delete`/`write_file`).
- **Safety & Quality Gates**: Configured `memory.write_approval`, `skills.write_approval` staging gates, and `skills.guard_agent_created` heuristic scanner.
- **Curator Lifecycle**: `active` → `stale` (30d) → `archived` (90d, to `skills/.archive/`) with pinning protection.

## 2026-09-14 — Project review and logic repairs
- Fixed OpenCode startup: plugin entry point now exports only the factory; test helpers and implementation moved to `.opencode/lib/loop-guardian.mjs` and included in the repository allowlist.
- Isolated audit/log state by session ID, handled resumed sessions and idle/status/deletion events, retried failed idle writes, refreshed findings at log time, and sent notices to stderr without changing command output/status.
- Aligned Unicode/CRLF bounds; rejected non-file bounded stores; checked changelog presence/liveness in the plugin. Staged changelog liveness now uses Git timestamps/staged changes rather than worktree mtime.
- Expanded drift detection to hooks/tests/helper modules, supported deleted sources via the optional extraction manifest, and corrected Git filename handling and graph refresh instructions.
- Hook checks require executable files; installer rejects bad arguments and failed smoke tests; Python selection requires 3.10+. Test runner fails when Node is missing and uses explicit unittest discovery. Integration fixtures isolate signing and skip settings.
- Narrowed specialist shell command prefixes and branch-list permissions; corrected Hermes shared-log ownership, graph-query/routing contradictions, nested Markdown fences, browser examples, and installation commands that overwrote memory history.
- Verification: `bash tests/run_all.sh` passed twice consecutively (27 Python tests, 18 JavaScript tests, 8 hook assertions); direct Node runs confirmed all 18 named tests. Python/JS/shell syntax checks, 9 agent + 6 skill frontmatter validation, `git diff --check`, and a missing-Node failure-path check passed.
- Limits: Linux verification only; no live model session or external integration exercised. Optional hooks remain unwired, generated graph remains stale per the no-unsolicited-rebuild rule, and the pre-existing CI workflow deletion is preserved. Source changes are not installed globally.

## 2026-09-15 — DeepSeek Harness integration finalized
- Researched official Harness SDK, goal/compaction architecture, published runtime source and OpenCode plugin/tool contracts. Completed the existing unfinished task-state/process helpers and SDK dependency scaffold.
- Added the Powerhouse plugin: durable revision-checked task journals, bounded checkpoint recovery, configured check execution with OpenCode permissions, content-based evidence invalidation, and completion gating. Added session-operation exclusion, failed-rerun proof clearing and worktree-root handling.
- Added an optional lazy official SDK bridge using the full `sdk` profile, per-parent homes, bounded timeout/output, cancellation cleanup, and rejection of empty/error/token-limited turns. Kept Harness child permissions separate and documented the boundary.
- Added configuration, pinned lockfiles, ignore rules, setup/usage/rollback documentation and executable tests. Preserved unrelated existing edits and the pre-existing CI deletion; no global configuration or credential changes.
- Validation: `bash tests/run_all.sh` passed twice consecutively after final code changes: 27 Python tests, 38 Node tests (including full Harness runtime with local HTTP model fixture), and 8 Git-hook assertions. `node --test tests/integration_opencode.mjs` passed actual discovery of all three tools with OpenCode 1.18.29. Dependency inspection, JS/shell syntax checks and `git diff --check` passed. Node 26.8.2 / Linux.
- Limits: no paid model call or live coding-quality benchmark; runtime fixture uses isolated storage and a dummy key. Real delegation requires provider credentials. No automatic OpenCode continuation is enabled.

## 2026-09-15 — Token efficiency with preserved learning
- Added compact task replies and status detail retrieval; removed opaque proof metadata from model context and completed tasks from routine recovery. Kept full journal data and completion checks.
- Set routine/compaction context caps to 1,200/4,000 chars, success/failure previews to 800/4,000, and Harness previews to 6,000. Larger retained outputs are available via private files. Full SDK profile and 8,192 model output cap are unchanged.
- Trimmed meta-agent prompts, narrowed startup history retrieval, discouraged redundant delegation/status calls, and retained one useful verified memory/skill improvement per meaningful outcome. Corrected unsupported historic token-saving multipliers.
- Measured representative recovery text down 52% and checkpoint replies down 86% by characters. Not a billed-token or model-quality benchmark.
- Verified: full suite passed (27 Python tests, 42 Node tests, 8 hook assertions), actual OpenCode tool discovery passed, config JSON/agent YAML and whitespace checks passed. Added tests for retained details, preview bounds, compaction, log retrieval and completion integrity.
