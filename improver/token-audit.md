# Token Audit

## Token Efficiency Strategies

### 1. Session Handoff Protocol
- **Pattern**: Mid-session distillation into `improver/session-handoff.md` (Latest + Archive blocks).
- **Trigger**: user says "compress" / "save state" / "distill" / "handoff" — or auto-offer at ~15-20 messages.
- **Target compression**: 10-30x (typical 30-msg session = 1-3 KB handoff vs 15-40 KB full transcript).

### 2. Knowledge Graph First
- **Pattern**: Always query `graphify query` / `/understand-chat` before doing raw file reads or grep sweeps.
- **Savings**: ~71.5x token reduction per query vs reading full file contents.

### 3. Progressive Disclosure Skills
- **Pattern**: Frontmatter (`name`/`description`) always in context via `<available_skills>`. Full SKILL.md body loaded only on demand via `skill({ name })`; references read per-step.
- **Savings**: Prevents loading all skill bodies into every session context.

### 4. Bounded Memory
- **MEMORY.md**: Hard cap 2,200 chars (~800 tokens). Frozen at session start.
- **USER.md**: Hard cap 1,375 chars (~500 tokens). Frozen at session start.
- **Overflow**: Forces inline consolidation — oldest entries compressed or evicted.

### 5. PROJECT.md Living Document
- **Pattern**: Token-efficient tables and summaries only (no raw file dumps). Prevents re-scanning project structure every session.
