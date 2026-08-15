# Token Audit

## 2026-06-20 — Session Handoff Protocol introduced
- **Pattern**: Mid-session distillation into `~/.config/opencode/improver/session-handoff.md` (Latest + Archive blocks).
- **Trigger**: user says "compress" / "save state" / "distill" / "handoff" — or I offer at ~15-20 messages.
- **Target compression**: 10-30x (typical 30-msg session = 1-3 KB handoff vs 15-40 KB full transcript).
- **Use case**: kill the pattern of paying the full session context on every follow-up message. New session reads just the Latest block instead of re-injecting the whole history.
- **Status**: protocol defined in knowledge.md, file scaffolded, demo pending (this session will be the first real handoff).
- **Watch for**: if the handoff itself bloats (I include too much), tighten the format. If users ignore the trigger and sessions keep growing long, consider auto-snapshot at message N.

## 2026-06-16 — TTT Project

- **Redundancy alert**: `.opencode/context.md` and `.opencode/project.md` are ~380 lines each with nearly identical content. If both are loaded as context, that's ~760 lines of duplicated tokens. Recommend consolidating to one file.
- **Stale context**: `context.md` recommends "Postgres" and "NestJS" but project uses SQL Server + Express. Agents reading this may generate incorrect code.

## 2026-06-16 — TTT Frontend Project

- **PROJECT_SCOPE.md is 702 lines** (full BRD document). If loaded as agent context on every call, that's ~10K+ tokens per request. Consider whether agents need the full scope or a condensed version.
- **Design system skill** (253 lines) is well-targeted — no redundancy, useful on every UI task.
- **AGENTS.md** (117 lines) is lean and accurate — no trimming needed.
- **Dual lock files**: Both `bun.lock` and `package-lock.json` present — should standardize on one package manager.

## 2026-06-20 — WordPress skills (33 installed)
- All installed to `~/.agents/skills/`. Most have SKILL.md + references/ folder.
- **Discovery model**: OpenCode lists all skill names + descriptions in the system prompt. With 33 WP skills added, that's ~33 additional description entries. Each entry is typically 50-200 tokens, so the description overhead is ~1.6K-6.6K tokens per request.
- **Triggering**: Skills are typically only LOADED (full SKILL.md content) when explicitly invoked or when the agent determines relevance. The description overhead is the main concern.
- **Action**: Monitor session cost; if WP description overhead becomes painful, consider scoping WP skills to `.opencode/skills/` (project-level) or a per-project override rather than `~/.agents/skills/` (global).
- **Official pack (`WordPress/agent-skills`) is the largest and most comprehensive** — likely the only one strictly needed. Consider whether the 3 community packs (jeffallan, elvismdev, jorgerosal) are duplicative for our actual usage before next review.
- **Note**: User said "use all skills" so I installed all 4 packs. If a WP project is never started, this is sunk overhead.
