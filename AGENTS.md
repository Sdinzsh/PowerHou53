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

## Powerhouse 3 Universal Protocol

Applies to every agent; meta-agents layer their orchestration charter on top.
The protocol is **proportional**: full ceremony only for non-trivial work.

### Execution Speed Rules (highest priority)
1. **Batch independent tool calls into a single turn** — parallel reads,
   greps, and dispatches; never serialize what can run together.
2. **Fast path for trivial actions** — single-file, obvious-intent, easily
   reversible edits need no planning cycle: act, then verify.
3. **Don't re-read context you already have** (task spec, prior reads,
   conversation). Don't re-explore what the dispatcher already summarized.
4. **Native search first by default.** Use the Knowledge Graph only when
   `graphify-out/graph.json` or `.ua/knowledge-graph.json` already exists AND
   the question is structural. If `graphify` is absent or slow, fall back to
   glob/grep immediately. Never build/rebuild a graph unprompted.
5. **Verify at milestones and task end**, not after every micro-edit.
6. **Log once**: memory/changelog appends happen at session end in one
   batched write — not after each action (exception: critical incidents).

### Think Before Act (non-trivial actions only)
Triggers: multi-file edits, architecture changes, installs, deletions,
anything hard to reverse.
1. **Analyze & Hypothesize** — intent, system state, root causes.
2. **Consult Prior Knowledge** — read `improver/MEMORY.md`, `USER.md`,
   `knowledge.md`; query the Knowledge Graph (`.ua/knowledge-graph.json` or
   `graphify-out/graph.json`) via `graphify query|path|explain` /
   `/understand-chat` BEFORE raw file sweeps. Distinguish edge provenance:
   `EXTRACTED` (syntax fact) / `INFERRED` (semantic hypothesis) / `AMBIGUOUS`.
3. **Plan** — exact step/tool sequence, zero ambiguity.
4. **Verify** — define validation commands (tests/lint/build/browser/diff)
   BEFORE executing.

### Goal-Oriented Framing
Structure every task around four pillars:
- **Goal** — ultimate objective + definition of done.
- **Task** — concrete, measurable steps.
- **Context** — user domain, environment, active dependencies.
- **Constraints** — token budget, permissions, style, architectural limits.

### Web & Browser Stack
Static content → `webfetch`/curl. Dynamic pages, forms, logins, visual QA →
Playwright / `agent-browser` using `@eN` DOM snapshot references (never raw
HTML dumps). Keep web research to 2–4 targeted queries. Non-code assets
(PDF/PPTX/XLSX/audio/images) → convert via `markitdown` before graph indexing.

### Bounded Memory Store (`~/.config/opencode/improver/`)
- `MEMORY.md` (≤2,200 chars) and `USER.md` (≤1,375 chars): frozen snapshot at
  session start; overflow forces inline consolidation before writes.
- `knowledge.md`, `plugins.md`, `skills.md`, `token-audit.md`,
  `changelog.md`: durable logs — append dated, token-efficient entries after
  meaningful actions.
- Writes pass deduplication + security heuristics; when the optional
  write-approval convention is enabled, drafts stage in `pending/` for review.
  Cross-session transcript recall (SQLite FTS5 `session_search`) is roadmap,
  not shipped — do not assume it exists.

### Learning Loop (on-demand)
Record episodic outcomes only for non-obvious, reusable lessons:
```
graphify save-result --question "<Q>" --answer "<A>" --nodes <N> --outcome useful|dead_end|corrected
```
Run `graphify reflect` when asked or when a meaningful lesson set has
accumulated — it compiles `LESSONS.md` + `.graphify_learning.json`
(nodes tagged `preferred` / `tentative` / `contested`; changed code
auto-flagged "code changed — re-verify").

### Skills (OpenCode native + agentskills.io layout)
Skills live at `skills/<name>/SKILL.md` and are discovered automatically;
the native `skill` tool lists them (`<available_skills>`) and loads a full
skill via `skill({ name })`. Only `name`, `description`, `license`,
`compatibility`, `metadata` frontmatter fields are recognized by OpenCode —
store provenance/status/dates inside `metadata`. "Level 2 references" are
plain files under the skill folder, read on demand with the read tool.
Create/patch skills by editing `SKILL.md` directly (small diffs over full
rewrites); register new skills in `improver/skills.md`.

### Session Start / End (role-scoped)
- **Primary/meta agents**: at start, batch-read `MEMORY.md`, `USER.md`,
  `knowledge.md` (+ latest `changelog.md` entries) in ONE parallel turn.
  Load `plugins.md` / `skills.md` / `token-audit.md` only when relevant to
  the task. Restore project context from `.opencode/PROJECT.md` if present.
- **Sub-agents**: skip bulk memory reads — work from the enriched task spec
  given by the dispatcher plus targeted reads the task actually needs. Never
  append to shared improver logs; report outcomes in your structured output
  so the dispatcher records them once (avoids write races from parallel
  sub-agents).
- **End of session (primary only)**: append dated outcomes to relevant
  improver files immediately.
