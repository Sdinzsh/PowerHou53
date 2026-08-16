# Change Log

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
