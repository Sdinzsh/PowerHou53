# OpenCode Custom Setup — Install Guide (Powerhouse 3 Architecture)

This package gives you a customized OpenCode installation with:

- **3 custom meta-agents** (PowerHous3-GOD, PowerHous3-Max, PowerHous3) — each powered by the **Powerhouse 3 Self-Improving Engine**
- **6 sub-agents** for delegating specialized work (backend, frontend, explore, general, testing, hermes)
- **A Closed Learning Loop** system with bounded memory, progressive disclosure skills, background review, and an autonomous curator
- **An improver memory system** that logs patterns, decisions, plugins, skills, and token usage across sessions

Drop the contents of this folder into `~/.config/opencode/` and you get the same setup.

---

## What's in this folder

```
PowerHou53/
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
│   └── sample-skill/
│       └── SKILL.md      ← Template procedural skill
├── powerhouse3.md        ← Architecture reference document
└── INSTALL.md            ← This file
```

### agents/ (9 files)

| File | Role |
|---|---|
| `PowerHous3-god.md` | Default meta-agent. Full local control, no confirmations. Powerhouse 3 engine. |
| `PowerHous3-Max.md` | High-power meta-agent variant. Powerhouse 3 engine. |
| `PowerHous3.md` | Ask-first meta-agent. Confirms before shell commands. Powerhouse 3 engine. |
| `backend.md` | Sub-agent for APIs, auth, server-side logic. Memory/skill-aware. |
| `frontend.md` | Sub-agent for UI/UX, React/Vue/etc. Memory/skill-aware. |
| `general.md` | Sub-agent for cross-domain tasks. Memory/skill-aware. |
| `testing.md` | Sub-agent for unit/integration/e2e tests. Memory/skill-aware. |
| `explore.md` | Sub-agent for codebase exploration. Memory/skill-aware. |
| `hermes.md` | Procedural memory engine — learns tools/libs, generates `SKILL.md` documents. |

### improver/ (9 files)

| File | What it stores | Bounds |
|---|---|---|
| `MEMORY.md` | Operational memory: environment facts, conventions, learnings | 2,200 chars max |
| `USER.md` | Dialectic user profile: preferences, communication style | 1,375 chars max |
| `knowledge.md` | Durable learnings, patterns, decisions with outcomes | Unbounded |
| `plugins.md` | Every MCP server installed — what it does, why, footprint | Unbounded |
| `skills.md` | Skills telemetry index with progressive disclosure metadata | Unbounded |
| `token-audit.md` | Token-heavy patterns observed and fixes applied | Unbounded |
| `changelog.md` | Dated log of every config change with rationale | Unbounded |
| `session-handoff.md` | Compressed snapshot of the current session | Unbounded |
| `agent-permissions.md` | Notes on the 3 meta-agents — when to use which | Unbounded |

### skills/ (progressive disclosure library)

Skills follow the `agentskills.io` open standard with 3-level loading:

| Level | What loads | When | Token cost |
|---|---|---|---|
| **Level 0 (Index)** | YAML frontmatter: name, description, tags | Always in context | ~3k tokens for full index |
| **Level 1 (Procedure)** | Full `SKILL.md` body | On-demand when task matches | Variable per skill |
| **Level 2 (References)** | Files under `references/`, `scripts/`, `templates/` | Only when specific sub-steps need deep detail | Variable per file |

---

## Powerhouse 3 Architecture: How the Self-Improving Loop Works

```
Session starts
   ↓
Agent reads MEMORY.md + USER.md + knowledge.md (frozen prompt snapshot)
   ↓
Loads Level 0 skill index into context (~3k tokens)
   ↓
Task arrives → searches skill index for relevant procedures
   ↓
Loads matching skill at Level 1 (on-demand) → executes task
   ↓
Post-Turn Background Review ("The Nudge")
   ├── Forks auxiliary agent to replay conversation digest
   ├── Proposes MEMORY.md/USER.md writes or skill patches
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

### Safety Gates

| Gate | Config Key | Default | What it does |
|---|---|---|---|
| Memory write approval | `memory.write_approval` | `false` | Stages memory saves in `pending/` for `/memory pending` review |
| Skill write approval | `skills.write_approval` | `false` | Stages skill writes for `/skills pending` + `/skills diff` + `/skills approve` |
| Skill content guard | `skills.guard_agent_created` | heuristic | Scans agent-created skills for dangerous patterns |

---

## Install

### Linux (bash / zsh)

```bash
mkdir -p ~/.config/opencode/agents
mkdir -p ~/.config/opencode/improver
mkdir -p ~/.config/opencode/skills

cp ./agents/*    ~/.config/opencode/agents/
cp ./improver/*  ~/.config/opencode/improver/
cp -r ./skills/* ~/.config/opencode/skills/
```

### Windows (PowerShell)

```powershell
# Create target dirs if they don't exist
New-Item -ItemType Directory -Path "$env:USERPROFILE\.config\opencode\agents" -Force | Out-Null
New-Item -ItemType Directory -Path "$env:USERPROFILE\.config\opencode\improver" -Force | Out-Null
New-Item -ItemType Directory -Path "$env:USERPROFILE\.config\opencode\skills" -Force | Out-Null

# Copy agents, improver memory, and skills library
Copy-Item -Path ".\agents\*"        -Destination "$env:USERPROFILE\.config\opencode\agents\"   -Force
Copy-Item -Path ".\improver\*"      -Destination "$env:USERPROFILE\.config\opencode\improver\" -Force
Copy-Item -Path ".\skills\*"        -Destination "$env:USERPROFILE\.config\opencode\skills\"   -Recurse -Force
```

### macOS (bash / zsh)

```bash
mkdir -p ~/.config/opencode/agents
mkdir -p ~/.config/opencode/improver
mkdir -p ~/.config/opencode/skills

cp ./agents/*    ~/.config/opencode/agents/
cp ./improver/*  ~/.config/opencode/improver/
cp -r ./skills/* ~/.config/opencode/skills/
```

### Set the default agent (optional)

Edit `~/.config/opencode/opencode.json` and add:

```json
{
  "default_agent": "powerhous3-god"
}
```

### Restart OpenCode

Close and reopen your OpenCode session. The new agents, bounded memory, and skills will load on the next session start.

---

## Verify it worked

After restarting, try these prompts with your agent:

- *"List the 3 meta-agents and explain when to use each."*
- *"What's in MEMORY.md and USER.md?"*
- *"Show me the skill index — what skills are registered?"*
- *"Show me the most recent entry in changelog.md."*
- *"Compare powerhous3-god and powerhous3 — which is right for X?"*

If the agent reads from `improver/MEMORY.md`, `improver/USER.md`, and `improver/knowledge.md` to answer, your Powerhouse 3 setup is working.

---

## Sample prompts you can paste

### Discover what's installed

```
Read ~/.config/opencode/improver/plugins.md and ~/.config/opencode/improver/skills.md.
Summarize what MCPs and skills are configured, and which ones might be unused.
```

### Use the improver system

```
Add this discovery to MEMORY.md: [your finding here].
Then update changelog.md with a dated entry explaining what changed and why.
```

### Create a new skill from experience

```
I just completed a complex workflow for [describe task]. Create a new SKILL.md
for it under skills/ following the agentskills.io standard.
```

### Inspect the skill library

```
Run skills_list and show me all registered skills with their telemetry
(view count, patch count, status, last used).
```

### Review pending background writes

```
Show me /skills pending and /memory pending — what has the background
review proposed since last session?
```

### Audit token usage

```
Read token-audit.md. Based on what's logged there, what are the top 3
token-cost patterns you've observed, and what's the proposed fix for each?
```

### Decide which agent to use

```
Compare powerhous3-god and powerhous3. I want to [describe your task].
Which one should I use, and why?
```

---

## How the Powerhouse 3 self-improving system actually works

The system is built on **4 cooperating subsystems** (based on NousResearch Hermes Agent architecture):

### 1. Bounded Persistent Memory
- `MEMORY.md` (max 2,200 chars / ~800 tokens) — operational facts, conventions, lessons.
- `USER.md` (max 1,375 chars / ~500 tokens) — user preferences, communication style.
- **Frozen snapshot**: loaded once at session start for prompt cache stability. Writes persist to disk immediately but only enter the prompt on next session.
- **Forced consolidation**: when bounds overflow, the agent must compress or remove stale entries before writing.

### 2. Progressive Disclosure Skills
- Skills stored as `SKILL.md` with YAML frontmatter under `skills/<name>/`.
- **Level 0**: index metadata always in context. **Level 1**: full procedure loaded on-demand. **Level 2**: reference files loaded only when needed.
- Agent creates skills autonomously after complex tasks (5+ tool calls), error resolutions, or user corrections.
- `skill_manage` tool: `create`, `patch` (preferred — token-efficient), `edit`, `delete`, `write_file`, `remove_file`.

### 3. Post-Turn Background Review
- Forks an auxiliary agent after conversation turns.
- Replays a digest of the conversation to decide if anything is worth persisting.
- May write to `MEMORY.md`/`USER.md` or patch skills.
- Notifications: `💾 Memory updated` / `💾 Skill patched`.
- Configurable approval gates stage writes for user review.

### 4. Autonomous Curator Daemon
- Tracks skill usage telemetry (views, patches, last-used timestamps).
- **Deterministic lifecycle**: `active` → `stale` (30 days unused) → `archived` (90 days, moved to `skills/.archive/`).
- **Never auto-deletes** — archived skills are recoverable.
- **Optional LLM consolidation**: merges overlapping micro-skills into umbrella skills (off by default).
- **Pinning**: `skills pin <name>` exempts skills from lifecycle transitions.

### 5. Cross-Session Recall
- Conversations stored in SQLite with FTS5 full-text search via `session_search`.
- Enables recall of raw past messages without stuffing everything into bounded memory.
- Memory is the always-on shortlist; session search is the long archive.

**Why this matters:** A 30-message session can cost 40 KB of context. If bounded memory + skills let the next session pick up at 2-5 KB instead, that's a **10-20x cost reduction** for the same continuity.

---

## Customizing

After using this for a while, you'll want to evolve it. The right moves:

- **Add to `MEMORY.md`** for operational facts that should always be in context (respect the 2,200 char bound).
- **Add to `USER.md`** for preference updates (respect the 1,375 char bound).
- **Update `knowledge.md`** when you discover a pattern that future sessions would benefit from.
- **Create skills** when you complete complex or repeatable workflows — use `skill_manage create`.
- **Update `plugins.md` / `skills.md`** when you install or remove something.
- **Log in `token-audit.md`** whenever you notice wasteful patterns.
- **Append to `changelog.md`** whenever you change a config — even small ones.

---

## License

Use freely. No warranty. Have fun.
