# Session Handoff

**Purpose**: Compressed state for resuming work in a new session. Replaces the need to re-bill the full conversation transcript on every new session start.

**Token savings**: A typical 30-message session = 15-40 KB of context. A handoff entry = 1-3 KB. ~10-30x compression.

---

## How to use

- **Mid-session**: say `compress` / `save state` / `distill` / `handoff` → I snapshot to the **latest** block below
- **New session**: I auto-read this file at start (per improver protocol) — just say "continue from last session" or "pick up where we left off"
- **Manual trigger**: I may *offer* a compress at ~15-20 messages or when context gets heavy

---

## Format (every entry follows this shape)

```
### [YYYY-MM-DD] <short label>
- **When**: trigger (user said "compress" / auto-detected at N messages / etc.)
- **Context**: project or task, key constraints, who's involved
- **State**: done ✓ | in-flight ◐ | blocked ✗
- **Key facts**: paths, IDs, configs, decisions, errors (terse, one line each)
- **Open questions**: unresolved / undecided
- **Next**: concrete next actions (numbered)
```

---

## Latest

### [2026-08-16] PowerHous3 Architecture Finalization & Mandatory PROJECT.md Integration
- **When**: Task completion & user audit
- **Context**: PowerHous3 closed learning loop multi-agent cognitive architecture
- **State**: done ✓
- **Key facts**:
  - **Meta-agents**: `PowerHous3-god.md`, `PowerHous3-Max.md`, `PowerHous3.md` enforce Think-Before-Act, Goal alignment, Playwright automation, Understand-Anything AST graph, and mandatory `.opencode/PROJECT.md` living documents.
  - **Sub-agents**: `explore.md` (AST & Playwright UI explorer) and `hermes.md` (procedural memory engine with `graphify save-result` & `reflect`).
  - **Skills**: `understand-anything`, `graphify`, `markitdown`, `playwright`, `llm-council`, `sample-skill`.
  - **Clean improver memory**: Cleaned `changelog.md`, `knowledge.md`, `session-handoff.md` of all stale external machine logs.
- **Open questions**: none
- **Next**: Ready for cross-platform deployment and active project use.

---

## Archive

<!-- Dated full handoffs go here. Newest at top. -->
