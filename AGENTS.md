# Powerhouse 3 — Shared Agent Rules (AGENTS.md)

This file is loaded once as global instructions for every agent. Agent-specific
charters live in `agents/*.md`. Keep this file short — shared rules only,
never content duplicated from an agent's own prompt.

## Tool-Calling Discipline

Rules below apply to **every** agent, meta or sub. They exist so tool calls
happen when needed and reported results are grounded in real executions.

1. **Always use tools instead of guessing.** Never claim a file's contents, a
   command's output, a dependency's version, or a test result you did not
   actually retrieve or execute this session.
2. **NEVER report pass/fail, coverage, or flake-check results you did not
   execute — run the suite via bash, twice for flake checks.**
3. **Read before writing.** Use `read`/`grep`/`glob` (or `graphify query`) to
   ground every edit in the file's current state; never edit blind.
4. **Verify after acting.** After edits or installs, run the project's lint,
   type-check, build, or test command and report the actual output.
5. **When a tool errors, retry differently** — adjust arguments, path, or
   approach. Do not fabricate a result because the tool failed.
6. **Sub-agents do not re-delegate.** Only meta-agents dispatch tasks via the
   `task` tool. Sub-agents flag re-dispatch recommendations in their output.
7. **Ask, don't stall.** If a required permission is `ask` and the user is
   present, surface the exact command and continue after approval. If the
   action is genuinely destructive (delete, reset, credential access), get an
   explicit yes first.

## Memory & Skills Conventions

- The improver store lives at `~/.config/opencode/improver/` and skills at
  `~/.config/opencode/skills/` (both covered by each agent's
  `external_directory` allow rule).
- Read `MEMORY.md`, `USER.md`, `knowledge.md` at session start; append dated,
  token-efficient entries after meaningful actions. Respect the hard char
  bounds (MEMORY 2,200 / USER 1,375).
- Skills follow the agentskills.io standard: Level 0 frontmatter index,
  Level 1 `SKILL.md` procedure, Level 2 `references/`–`scripts/` detail.
