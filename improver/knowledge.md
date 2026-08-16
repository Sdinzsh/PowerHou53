# Knowledge Base

## Session Handoff Protocol (2026-06-20)

**Problem**: Long sessions accumulate 15-40 KB of context that gets re-billed on every follow-up message. Plus the full transcript lives in `~/.local/share/opencode/opencode.db` indefinitely.

**Solution**: Compress active session state into a structured handoff file. New sessions read the handoff instead of the full transcript.

**File**: `~/.config/opencode/improver/session-handoff.md`
- **Latest** block = most recent snapshot, always read at session start
- **Archive** block = history of all past handoffs (moved here on next compress)
- Format spec: When/Context/State/Key facts/Open questions/Next

**Triggers** (user-facing):
- "compress" / "save state" / "distill" / "handoff" → snapshot to Latest
- Auto-offer at ~15-20 messages or when context gets heavy
- New session: Read at start; user says "continue from last session"

**Compression ratio target**: 10-30x (typical 30-message session = 1-3 KB handoff)

**What to include in a handoff**:
- Project/task + key constraints
- What's done, in-flight, blocked
- Concrete paths, IDs, configs, errors (one line each)
- Open questions + next actions (numbered)

---

## Browser Skills Integration (Playwright & agent-browser)

- **Preferred Tool**: `agent-browser` (CDP-based automation, headless/Chrome modes, `@eN` element refs).
- **Static Content**: Use `webfetch` or curl for static HTML to save execution tokens.
- **Dynamic / SPA Browsing**: Use `agent-browser` or Playwright Python/TypeScript APIs for DOM interactions, form completion, and visual screenshots.

---

## PowerHous3 Architecture Migration (2026-08-15)

**What changed**: Complete architecture upgrade from static improver log files to Hermes Agent-inspired Closed Learning Loop system ("PowerHous3").

**4 Subsystems Deployed:**
1. **Bounded Memory Store** — `MEMORY.md` (max 2,200 chars, ~800 tokens) + `USER.md` (max 1,375 chars, ~500 tokens). Frozen snapshot at session start preserves prefix caching. Hard overflow forces inline consolidation.
2. **Progressive Disclosure Skills System** — Skills stored as `SKILL.md` under `skills/<name>/` conforming to `agentskills.io` standard. 3-level loading: Level 0 index (~3k tokens), Level 1 full skill (on-demand), Level 2 references/scripts (deep-demand). `skill_manage` tool with `create`, `patch`, `edit`, `delete`, `write_file`, `remove_file` actions.
3. **Post-Turn Background Review** — Auxiliary fork replays conversation digest after turns, proposes memory writes or skill patches. Notification badges (`💾 Memory updated` / `💾 Skill patched`). Configurable `write_approval` gates stage writes in `pending/` for review.
4. **Autonomous Curator Daemon** — Tracks usage telemetry (views, patches, last-used). Deterministic lifecycle: `active` → `stale` (30d unused) → `archived` (90d, moved to `skills/.archive/`). Optional LLM consolidation pass merges overlapping micro-skills into umbrella skills. Pinned skills exempt.

**Cross-Session Recall**: SQLite FTS5 session search for raw transcript recall beyond bounded memory.

**Safety Gates:**
- `memory.write_approval` — stages memory writes for `/memory pending` review
- `skills.write_approval` — stages skill writes for `/skills pending` + `/skills diff` + `/skills approve`
- `skills.guard_agent_created` — heuristic scanner for dangerous patterns in agent-created skills

---

## Think-Before-Act, Goal Alignment, Playwright & Understand-Anything Knowledge Graph Upgrade (2026-08-16)

**What changed**: Upgraded the PowerHous3 multi-agent architecture with 5 core systemic capabilities:

1. **Think Before Act Protocol**:
   - Compulsory planning cycle (Analyze & Hypothesize $\rightarrow$ Consult Prior Knowledge & Knowledge Graph $\rightarrow$ Formulate Step-by-Step Plan $\rightarrow$ Define Verification Criteria) before executing modifications or tools.

2. **Goal-Oriented Execution Framework**:
   - Structured alignment model:
     - **Goal**: Clear overarching objective and success metric.
     - **Task**: Actionable, discrete sub-steps ("What exactly do you want?").
     - **Context**: User domain, environment, active dependencies ("Who are you? Who is this for?").
     - **Constraints**: Token budgets, tool permissions, safety boundaries ("Time, budget, tools, style, limits").

3. **Web Search, Web Fetch & Playwright Automation Stack**:
   - Native headless browser automation (`agent-browser` + Playwright) for dynamic web applications, `@eN` token-efficient DOM snapshots, screenshot verifications, and real-time research.

4. **Understand-Anything & Knowledge Graph Self-Improvement Engine**:
   - Deterministic AST parsing (Tree-sitter across 36 languages) with zero-LLM token overhead and zero hallucination risk.
   - Dual-layer edge provenance: `EXTRACTED` (factual syntax) vs `INFERRED` (semantic connections).
   - Multi-agent compilation (`project-scanner`, `file-analyzer`, `architecture-analyzer`, `tour-builder`, `graph-reviewer`) creating `.ua/knowledge-graph.json`.
   - Domain & Onboarding Comprehension: `/understand-domain` (business domain flows), `/understand-onboard` (developer tours), `/understand-knowledge` (wiki knowledge bases).
   - Closed learning loop: `save-result` (work memory) $\rightarrow$ `reflect` $\rightarrow$ `LESSONS.md` + `.graphify_learning.json` (`preferred`, `tentative`, `contested`) with automatic `"code changed — re-verify"` cache invalidation on code drift.
   - Multi-modal ingestion via Microsoft MarkItDown (`markitdown`) converting 15+ formats (PDFs, PPTX, XLSX, audio, images with OCR) into clean Markdown.

5. **Mandatory Living PROJECT.md Context Document**:
   - Automatically creates and maintains `.opencode/PROJECT.md` in every workspace to capture project directory trees, tech stacks, dated work progress logs, architecture notes, and active session goals.
