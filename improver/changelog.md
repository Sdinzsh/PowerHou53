# Change Log

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
