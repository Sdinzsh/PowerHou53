# Token Audit

## Token Efficiency Strategies

### 1. Session Handoff Protocol
- **Pattern**: Mid-session distillation into `improver/session-handoff.md` (Latest + Archive blocks).
- **Trigger**: user says "compress" / "save state" / "distill" / "handoff" — or auto-offer at ~15-20 messages.
- **Measurement**: Compare actual handoff and source sizes; no fixed compression ratio is guaranteed.

### 2. Targeted Retrieval
- **Pattern**: Native search first; query an existing graph only for structural questions. Never build a graph merely to answer a small task.
- **Measurement**: Graph traversal can return more context than a focused search. No universal savings multiplier is established.

### 3. Progressive Disclosure Skills
- **Pattern**: Frontmatter (`name`/`description`) always in context via `<available_skills>`. Full SKILL.md body loaded only on demand via `skill({ name })`; references read per-step.
- **Savings**: Prevents loading all skill bodies into every session context.

### 4. Bounded Memory
- **MEMORY.md**: Hard cap 2,200 chars. Frozen at session start.
- **USER.md**: Hard cap 1,375 chars. Frozen at session start.
- **Tokens**: Depend on the model's tokenizer and text; character caps are not billed-token measurements.
- **Overflow**: Forces inline consolidation — oldest entries compressed or evicted.

### 5. PROJECT.md Living Document
- **Pattern**: Token-efficient tables and summaries only (no raw file dumps). Prevents re-scanning project structure every session.

## 2026-09-15 — Measured Powerhouse context reduction

- Routine recovery cap: 4,000 → 1,200 characters; compaction keeps 4,000. Successful check preview: 12,000 → 800; failed check preview: 12,000 → 4,000. Retained check tail stays available through outputPath. Harness preview: 24,000 → 6,000, full response available through responsePath.
- Executed a representative active-task fixture with two checks and a long checkpoint against the before/after functions: routine recovery 1,438 → 695 chars (52%); checkpoint reply 1,459 → 204 (86%). These are character reductions for that fixture, not measured provider-token/billing savings.
- Combined shared rules + selected charter: GOD 11,737 → 11,407 chars; MAX 11,682 → 11,366; safe 12,926 → 12,624. Startup now retrieves relevant knowledge sections and at most 40 recent changelog lines; broad history is on demand.
- Preserve quality: full task/checkpoint storage, on-demand details, permissions, stale-proof rejection, larger compaction context, full SDK profile, and 8,192 maxTokens remain. Reuse returned revisions instead of redundant status calls. No duplicate delegation or automatic per-turn reflection LLM.
- Validation: 27 Python tests, 42 Node tests and 8 hook assertions passed; actual OpenCode tool discovery passed. No live coding-quality or billed-token benchmark was performed.
