# PowerHous3 Architecture for OpenCode

PowerHous3 is an enterprise-grade, **Closed Learning Loop** AI architecture built for [OpenCode](https://opencode.ai). Inspired by the NousResearch Hermes Agent and powered by **Understand-Anything** and **Graphify**, it evolves static coding agents into a self-improving, memory-bounded, multi-agent cognitive architecture.

---

## 🌟 Core Pillars & Capabilities

### 1. 🧭 Think Before Act & Planning Protocol
Every meta-agent and specialist sub-agent adheres to a strict multi-step reasoning protocol before executing tool calls or code modifications:
- **Analyze & Hypothesize**: Evaluate intent, system state, and root causes.
- **Consult Prior Knowledge**: Inspect `MEMORY.md`, `USER.md`, `knowledge.md`, and query the Knowledge Graph.
- **Formulate Step-by-Step Plan**: Outline sub-tasks and tool sequences with zero ambiguity.
- **Define Verification Criteria**: Establish test criteria (unit tests, linting, Playwright runs, diffs) before running code.

### 2. 🎯 Goal-Oriented Execution Framework
All tasks are framed through the 4 foundational pillars:
- **Goal**: Ultimate objective, definition of done, and value to be created.
- **Task**: Concrete, actionable, measurable steps.
- **Context**: User domain, environment, active dependencies, and system state.
- **Constraints**: Token budget, execution limits, style conventions, and tool boundaries.

### 3. 🌐 Web Research & Playwright Automation Stack
Equipped with dynamic web exploration and native headless browser automation (`agent-browser` + Playwright):
- **Web Search & Fetch**: High-efficiency research for official documentation and package registries.
- **Playwright DOM Snapshots**: Compact `@eN` element references for token-efficient web interaction.
- **Visual Validation**: Screenshot capture, form automation, login flow verification, and live UI testing.

### 4. 🧠 Understand-Anything & Knowledge Graph Self-Improvement
- **Deterministic Tree-sitter AST**: Parses code grammar into structural nodes without LLM hallucination risk or token bloat.
- **Edge Provenance**: Clear separation between `EXTRACTED` (factual syntax) and `INFERRED` (semantic links).
- **Understand-Anything Pipeline**: Multi-agent scanners generate `.ua/knowledge-graph.json`, interactive force-directed dashboards (`/understand-dashboard`), and diff-impact blast radius analysis (`/understand-diff`).
- **Episodic Work Memory & Reflection**: Commands `graphify save-result` and `graphify reflect` compile outcomes into `LESSONS.md` and annotate nodes (`preferred`, `tentative`, `contested`).
- **Automatic Drift Invalidation**: Flags modified code with `"code changed — re-verify"`.
- **Multi-Modal MarkItDown Ingestion**: Converts PDFs, Word, PPTX, Excel, Audio, and Video into clean Markdown before graph indexing.

### 5. 📋 Mandatory PROJECT.md Living Document
Every project automatically receives and maintains a `.opencode/PROJECT.md` file:
- **Project Structure**: High-level map of key directories and entry points.
- **Tech Stack**: Table detailing language, framework, database, build tools, and versions.
- **Work Progress**: Dated append-only log of tasks, modified files, and completion statuses.
- **Architecture Notes**: Key decisions, module boundaries, data flows, and active goals.

---

## 🔄 The 6-Stage Self-Improving Loop

```
Session Start (Frozen Context: MEMORY.md + USER.md + Level 0 Skills)
   │
   ▼
Task Arrival ──► Think Before Act & Goal/Task/Context/Constraints Framing
   │
   ▼
Knowledge Graph Consultation (.ua/knowledge-graph.json & graphify-out/)
   │
   ▼
Specialized Delegation (Meta-Agent ──► backend | frontend | explore | testing | hermes | general)
   │
   ▼
Execution & Verification (AST Navigation + Web/Playwright Validation)
   │
   ▼
Post-Turn Reflection ("The Nudge" + save-result ──► reflect ──► LESSONS.md + Curator Lifecycle)
```

---

## 📂 Architecture Components

```text
~/.config/opencode/
├── AGENTS.md                     ← Shared tool-calling discipline & conventions (loaded once, all agents)
├── agents/                       ← 9 agent definitions
│   ├── PowerHous3-god.md         ← Unrestricted orchestrator (bash: allow)
│   ├── PowerHous3-Max.md         ← High-power orchestrator (bash: allow)
│   ├── PowerHous3.md             ← Ask-first safe orchestrator (bash: ask)
│   ├── backend.md                ← APIs, databases, server logic
│   ├── explore.md                ← Understand-Anything AST graph explorer
│   ├── frontend.md               ← UI/UX, components, state management
│   ├── general.md                ← Cross-domain & infrastructure
│   ├── hermes.md                 ← Procedural memory & skill creation
│   └── testing.md                ← Test pipelines & Playwright automation
├── improver/                     ← Persistent knowledge-graph store
│   ├── MEMORY.md                 ← Bounded operational memory (2,200 char cap)
│   ├── USER.md                   ← Bounded dialectic user profile (1,375 char cap)
│   ├── knowledge.md              ← Durable architectural learnings
│   ├── skills.md                 ← Skills telemetry & progressive registry
│   ├── changelog.md              ← Immutable audit log
│   ├── plugins.md                ← MCP/Plugin states
│   └── token-audit.md            ← Token efficiency logs
└── skills/                       ← Progressive disclosure library (agentskills.io)
    ├── understand-anything/      ← Codebase AST knowledge graph & dashboard
    ├── playwright/               ← Headless browser automation & testing
    ├── graphify/                 ← Self-improving reflection & work memory
    ├── markitdown/               ← Multi-modal media & PDF markdown ingestion
    ├── llm-council/              ← 5-advisor peer-review decision framework
    └── sample-skill/             ← Template procedural skill
```

---

## 🚀 Cross-Platform Installation

PowerHous3 is fully cross-platform (Linux, macOS, Windows PowerShell).

### Linux & macOS
```bash
mkdir -p ~/.config/opencode/agents ~/.config/opencode/improver ~/.config/opencode/skills

cp ./AGENTS.md   ~/.config/opencode/AGENTS.md
cp -r ./agents/* ~/.config/opencode/agents/
cp -r ./improver/* ~/.config/opencode/improver/
cp -r ./skills/* ~/.config/opencode/skills/
```

### Windows (PowerShell)
```powershell
New-Item -ItemType Directory -Path "$env:USERPROFILE\.config\opencode\agents" -Force | Out-Null
New-Item -ItemType Directory -Path "$env:USERPROFILE\.config\opencode\improver" -Force | Out-Null
New-Item -ItemType Directory -Path "$env:USERPROFILE\.config\opencode\skills" -Force | Out-Null

Copy-Item -Path ".\AGENTS.md"  -Destination "$env:USERPROFILE\.config\opencode\AGENTS.md" -Force
Copy-Item -Path ".\agents\*" -Destination "$env:USERPROFILE\.config\opencode\agents\" -Force -Recurse
Copy-Item -Path ".\improver\*" -Destination "$env:USERPROFILE\.config\opencode\improver\" -Force -Recurse
Copy-Item -Path ".\skills\*" -Destination "$env:USERPROFILE\.config\opencode\skills\" -Force -Recurse
```

### Set Default Agent (opencode.json)
The agent name must match the markdown filename exactly (case-sensitive).
`PowerHous3-god.md` → `"PowerHous3-god"`:
```json
{
  "default_agent": "PowerHous3-god"
}
```
If the name doesn't match, OpenCode silently falls back to the built-in `build` agent.

---

## 🛡️ Safety Gates & Write Approvals

PowerHous3 provides configurable guardrails:
- **`memory.write_approval`**: Stages memory updates in `pending/` for `/memory pending` review.
- **`skills.write_approval`**: Stages skill patches for `/skills pending`, `/skills diff`, and `/skills approve`.
- **Heuristic Guard**: Prevents untrusted scripts from injecting malicious terminal commands.

---
*See [`INSTALL.md`](INSTALL.md) for detailed verification commands, sample prompts, and operator guides.*
