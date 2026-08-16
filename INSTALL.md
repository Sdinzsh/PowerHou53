# OpenCode Custom Setup — Install Guide (Powerhouse 3 Architecture)

This package gives you a customized OpenCode installation with:

- **3 custom meta-agents** (PowerHous3-GOD, PowerHous3-Max, PowerHous3) — powered by **Think-Before-Act Planning**, **Goal-Task-Context-Constraints Alignment**, and **Playwright Web Automation**
- **6 sub-agents** for delegating specialized work (backend, frontend, explore, general, testing, hermes)
- **A Deterministic Knowledge Graph & Comprehension Engine** (Understand-Anything + Graphify AST with Tree-sitter)
- **A Multi-Modal Ingestion Pipeline** (Microsoft MarkItDown for PDFs, PPTX, XLSX, audio, images with OCR)
- **A Closed Learning Loop** system with bounded memory, progressive disclosure skills, background review, reflection overlays (`LESSONS.md`), and an autonomous curator
- **An improver memory system** that logs patterns, decisions, plugins, skills, and token usage across sessions
- **A mandatory PROJECT.md living document** created in every project root (`.opencode/PROJECT.md`) detailing directory structure, tech stack, work progress log, architecture notes, active tasks, and learnings

Drop the contents of this folder into `~/.config/opencode/` and you get the same setup.

---

## What's in this folder

```text
PowerHou53/
├── AGENTS.md             ← Shared tool-calling discipline & conventions (global instructions)
├── agents/               ← 9 agent definitions (3 meta + 6 sub)
├── improver/             ← Persistent memory & knowledge store
│   ├── MEMORY.md         ← Bounded operational memory (2,200 char cap)
│   ├── USER.md           ← Bounded dialectic user profile (1,375 char cap)
│   ├── knowledge.md      ← Durable learnings, patterns, decisions
│   ├── plugins.md        ← Plugin/MCP registry & evaluations
│   ├── skills.md         ← Skills telemetry index & registry
│   ├── token-audit.md    ← Token-heavy patterns & optimization fixes
│   ├── changelog.md      ← Dated changelog with rationale
│   ├── session-handoff.md← Session state compression snapshots
│   └── agent-permissions.md ← Meta-agent comparison & permission notes
├── skills/               ← Progressive disclosure skill library (agentskills.io)
│   ├── understand-anything/ ← Codebase AST knowledge graph & interactive dashboard
│   ├── playwright/          ← Headless browser automation, DOM snapshots & testing
│   ├── graphify/            ← Deterministic AST memory & reflection loop
│   ├── markitdown/          ← Multi-modal media & PDF markdown ingestion
│   ├── llm-council/         ← 5-advisor peer-review decision framework
│   └── sample-skill/        ← Template procedural skill
└── INSTALL.md            ← This guide
```

### agents/ (9 files)

| File | Role |
|---|---|
| `PowerHous3-god.md` | Default meta-agent. Full local control, no confirmations (`bash: allow`). Full planning & KG engine. |
| `PowerHous3-Max.md` | High-power meta-agent variant (`bash: allow`). Full planning & KG engine. |
| `PowerHous3.md` | Ask-first meta-agent (`bash: ask`). 5 user safety rules. Full planning & KG engine. |
| `backend.md` | Sub-agent for APIs, auth, server-side logic. Memory/skill-aware. |
| `frontend.md` | Sub-agent for UI/UX, React/Vue/etc. Memory/skill-aware. |
| `general.md` | Sub-agent for cross-domain tasks. Memory/skill-aware. |
| `testing.md` | Sub-agent for unit/integration/e2e tests & Playwright validation. |
| `explore.md` | Sub-agent for codebase exploration & Understand-Anything AST graph traversal. |
| `hermes.md` | Procedural memory engine — learns tools/libs, generates `SKILL.md` documents & reflection overlays. |

### skills/ (progressive disclosure library)

Skills follow the `agentskills.io` open standard with 3-level loading:

| Level | What loads | When | Token cost |
|---|---|---|---|
| **Level 0 (Index)** | YAML frontmatter: name, description, tags | Always in context | ~3k tokens for full index |
| **Level 1 (Procedure)** | Full `SKILL.md` body | On-demand when task matches | Variable per skill |
| **Level 2 (References)** | Files under `references/`, `scripts/`, `templates/` | Only when specific sub-steps need deep detail | Variable per file |

---

## Powerhouse 3 Architecture: How the Complete Loop Works

```text
Session starts
   ↓
Agent reads MEMORY.md + USER.md + knowledge.md (frozen prompt snapshot)
   ↓
Loads Level 0 skill index into context (~3k tokens)
   ↓
Task arrives → Think Before Act & Goal/Task/Context/Constraints Framing
   ↓
Knowledge Graph Consultation (.ua/knowledge-graph.json or graphify-out/)
   ↓
Loads matching skill at Level 1 (on-demand) → executes task with Web/Playwright verification
   ↓
Post-Turn Background Review ("The Nudge" + save-result → reflect)
   ├── Forks auxiliary agent to replay conversation digest
   ├── Updates LESSONS.md and .graphify_learning.json overlay (preferred/tentative/contested)
   ├── Displays: 💾 Memory updated / 💾 Skill patched
   └── If write_approval enabled → stages in pending/ for review
   ↓
Autonomous Curator (periodic, inactivity-triggered)
   ├── Tracks skill telemetry (views, patches, last-used)
   ├── active → stale (30 days) → archived (90 days)
   └── Optional: LLM consolidation pass merges overlapping skills
   ↓
Next session starts smarter: better context, refined skills, pruned library
```

---

## Install

### Linux (bash / zsh)
```bash
mkdir -p ~/.config/opencode/agents ~/.config/opencode/improver ~/.config/opencode/skills

cp ./AGENTS.md   ~/.config/opencode/AGENTS.md
cp ./agents/*    ~/.config/opencode/agents/
cp ./improver/*  ~/.config/opencode/improver/
cp -r ./skills/* ~/.config/opencode/skills/
```

### Windows (PowerShell)
```powershell
New-Item -ItemType Directory -Path "$env:USERPROFILE\.config\opencode\agents" -Force | Out-Null
New-Item -ItemType Directory -Path "$env:USERPROFILE\.config\opencode\improver" -Force | Out-Null
New-Item -ItemType Directory -Path "$env:USERPROFILE\.config\opencode\skills" -Force | Out-Null

Copy-Item -Path ".\AGENTS.md"   -Destination "$env:USERPROFILE\.config\opencode\AGENTS.md" -Force
Copy-Item -Path ".\agents\*"    -Destination "$env:USERPROFILE\.config\opencode\agents\"   -Force
Copy-Item -Path ".\improver\*"  -Destination "$env:USERPROFILE\.config\opencode\improver\" -Force
Copy-Item -Path ".\skills\*"    -Destination "$env:USERPROFILE\.config\opencode\skills\"   -Recurse -Force
```

### macOS (bash / zsh)
```bash
mkdir -p ~/.config/opencode/agents ~/.config/opencode/improver ~/.config/opencode/skills

cp ./AGENTS.md   ~/.config/opencode/AGENTS.md
cp ./agents/*    ~/.config/opencode/agents/
cp ./improver/*  ~/.config/opencode/improver/
cp -r ./skills/* ~/.config/opencode/skills/
```

### Set the default agent (opencode.json)
The agent name must match the markdown filename exactly (case-sensitive).
`PowerHous3-god.md` → `"PowerHous3-god"`:
```json
{
  "default_agent": "PowerHous3-god"
}
```
If the name doesn't match, OpenCode silently falls back to the built-in `build` agent.

---

## Verify it worked

After restarting, try these prompts with your agent:

- *"Show me your Think-Before-Act and Goal framing workflow for refactoring auth."*
- *"Query the knowledge graph for our database pool configuration."*
- *"Use Playwright / agent-browser to verify our web application on localhost:3000."*
- *"Show me the skill index — what skills are registered?"*
- *"Run /understand-diff to inspect the ripple effect of our recent edits."*

If the agent uses the knowledge graph, goal framing, and bounded memory to answer, your upgraded Powerhouse 3 setup is fully operational.
