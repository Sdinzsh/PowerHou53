# OpenCode Custom Setup — Install Guide (Powerhouse 3 Architecture)

This package gives you a customized OpenCode installation with:

- **3 custom meta-agents** (PowerHous3-GOD, PowerHous3-Max, PowerHous3) — powered by **Think-Before-Act Planning**, **Goal-Task-Context-Constraints Alignment**, and **Playwright Web Automation**
- **6 sub-agents** for delegating specialized work (backend, frontend, explore, general, testing, hermes)
- **A Deterministic Knowledge Graph & Comprehension Engine** (Understand-Anything + Graphify AST with Tree-sitter)
- **A Multi-Modal Ingestion Pipeline** (Microsoft MarkItDown for PDFs, PPTX, XLSX, audio, images with OCR)
- **A Closed Learning Loop**: bounded memory, on-demand skill loading, session-end batched logging, `graphify` reflection overlays (`LESSONS.md`), and a curator convention for skill lifecycle (`active → stale → archived`)
- **An improver memory system** that logs patterns, decisions, plugins, skills, and token usage across sessions
- **A PROJECT.md living document** per project (`.opencode/PROJECT.md`) detailing directory structure, tech stack, work progress log, architecture notes, active tasks, and learnings — written at milestones, never blocking active work

Drop the contents of this folder into `~/.config/opencode/` and you get the same setup.

---

## What's in this folder

```text
PowerHou53/
├── AGENTS.md             ← Shared tool-calling discipline & Powerhouse 3 Universal Protocol (global instructions)
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
├── scripts/              ← Enforcement kit (project-local, not copied to ~/.config)
│   ├── loop_check.py     ← Deterministic loop validator (staged-aware; --check/--json)
│   └── install_hooks.sh  ← Idempotent git-hook activator
├── .githooks/            ← pre-commit (staged HARD gate) + post-commit (drift latch)
├── tests/               ← Zero-dependency suite: run with `sh tests/run_all.sh`
├── .opencode/plugins/    ← loop-guardian.js (auto-loaded first-party plugin)
├── .github/workflows/    ← ci.yml (runs the full suite on push/PR)
├── README.md             ← Architecture overview
└── INSTALL.md            ← This guide
```

### agents/ (9 files)

| File | Role |
|---|---|
| `PowerHous3-god.md` | Default meta-agent. Full local control, no confirmations (`bash: allow`). Full planning & KG engine. |
| `PowerHous3-Max.md` | High-power meta-agent variant (`bash: allow`). Full planning & KG engine. |
| `PowerHous3.md` | Ask-first meta-agent (`bash: ask`). 5 user safety rules. Full planning & KG engine. |
| `backend.md` | Sub-agent for APIs, auth, server-side logic. Spec-driven; loads skills on demand. |
| `frontend.md` | Sub-agent for UI/UX, React/Vue/etc. Spec-driven; loads skills on demand. |
| `general.md` | Sub-agent for cross-domain tasks. Spec-driven; loads skills on demand. |
| `testing.md` | Sub-agent for unit/integration/e2e tests & Playwright validation. |
| `explore.md` | Sub-agent for codebase exploration & Understand-Anything AST graph traversal. |
| `hermes.md` | Procedural memory engine — learns tools/libs, generates `SKILL.md` documents & reflection overlays. |

### skills/ (progressive disclosure library)

Skills follow the `agentskills.io` open standard as implemented by OpenCode's native `skill` tool:

| Level | What loads | When | Token cost |
|---|---|---|---|
| **Index** | Frontmatter `name` + `description` (only these are auto-listed) | Always in context (`<available_skills>`) | Small per skill |
| **Procedure** | Full `SKILL.md` body | On demand via `skill({ name })` when the task matches | Variable per skill |
| **References** | Plain files under `references/`, `scripts/`, `templates/` | Only when a specific step needs deep detail — read with the read tool | Variable per file |

Only `name`, `description`, `license`, `compatibility`, and `metadata` frontmatter fields are recognized; provenance/status/dates live in the `metadata` map.

---

## Powerhouse 3 Architecture: How the Complete Loop Works

```text
Session starts
   ↓
Primary agent batch-reads MEMORY.md + USER.md + knowledge.md in one turn
(sub-agents skip this — they consume the dispatcher's task spec)
   ↓
Skill index is always in context (<available_skills>); bodies load on demand via skill({ name })
   ↓
Task arrives → proportional protocol:
  trivial edit → act, then verify          non-trivial → Think Before Act + Goal framing
   ↓
Structural question & graph exists? → graphify query / path / explain
otherwise → native glob/grep (graph never built unprompted)
   ↓
Substantial specialist work → self-contained Task dispatches (parallel where independent)
   ↓
Execution with milestone verification (tests/lint/build/browser at checkpoints)
   ↓
Session end: one batched log write (changelog/knowledge/plugins) +
PROJECT.md refresh; optional graphify save-result for reusable lessons
   ↓
Curator convention (manual/on-demand): telemetry in improver/skills.md,
active → stale (30d) → archived (90d); pinned skills exempt
   ↓
Next session starts smarter: better context, refined skills
```

---

## Install

### Linux & macOS (bash / zsh)
```bash
mkdir -p ~/.config/opencode/agents ~/.config/opencode/improver ~/.config/opencode/skills

cp ./AGENTS.md   ~/.config/opencode/AGENTS.md
cp -r ./agents/*   ~/.config/opencode/agents/
cp -r ./improver/* ~/.config/opencode/improver/
cp -r ./skills/*   ~/.config/opencode/skills/
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

### Set the toolchain (graphify, markitdown, playwright/agent-browser)

The skills in `skills/` drive three external tools. Install them once:

**1. Graphify — knowledge graph CLI** (PyPI package is `graphifyy`, double-y; the command is `graphify`):
```bash
uv tool install graphifyy          # or: pipx install graphifyy  (Python 3.10+)
uv tool update-shell               # if `graphify` isn't found afterwards
graphify --version

# Register graphify's official OpenCode skill + query-first plugin:
graphify install --platform opencode
```
Note: this replaces the bundled `skills/graphify/SKILL.md` with the vendor-maintained version and adds a `references/` sidecar — keep only one `graphify` skill (duplicate names break skill discovery). It also writes a project-local `.opencode/plugins/graphify.js` + `.opencode/opencode.json` in the directory where you run it.

**2. MarkItDown — multi-format → Markdown ingestion** (Microsoft). Avoid `'markitdown[all]'` for now — its `youtube-transcript-api~=1.0.0` pin is unsatisfiable on PyPI; install format extras individually:
```bash
uv tool install "markitdown[pdf,docx,pptx,xlsx]"   # add ,youtube-transcription if needed
echo "# hi" | markitdown                           # smoke test
```

**3. Playwright / agent-browser — browser automation**. The `playwright` skill drives Vercel's native Rust CLI (`agent-browser`); Playwright libraries are only needed for scripted test suites:
```bash
npm install -g agent-browser       # native CLI (or: brew install agent-browser)
agent-browser install              # downloads Chrome for Testing (first time only)
agent-browser doctor               # verify

# optional: Python Playwright for scripted suites
pip install pytest-playwright && playwright install chromium
```

Optional companion skills from the open ecosystem (verified high-trust sources, installed to `~/.agents/skills/`, discovered by OpenCode automatically). To discover more, run the find-skills flow and follow its generated instructions (it searches skills.sh, verifies install counts/source reputation, then installs with `npx skills add <owner/repo@skill> -g -y`):
```bash
npx skills use "https://github.com/vercel-labs/skills" --skill "find-skills"
```
Pre-verified picks for this stack:
```bash
npx skills add "microsoft/playwright-cli@playwright-cli" -g -y   # 128K+ installs, Microsoft
npx skills add "vercel-labs/agent-browser" -g -y                 # official Vercel skill
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

---

## Enable the hard loop gates (optional, recommended)

The closed learning loop ships with code-enforced guardrails. To activate them in a repo:

```bash
# 1. Deterministic validator (memory caps, changelog liveness, artifact
#    presence, knowledge-graph drift detection).
python3 scripts/loop_check.py                # worktree check, anytime
python3 scripts/loop_check.py --staged       # what a commit would record
python3 scripts/loop_check.py --require-graph --strict-changelog --strict-stale
python3 scripts/loop_check.py --check        # is the git hook wired?

# 2. Wire the git hooks (idempotent: sets core.hooksPath, chmods, smoke-tests).
sh scripts/install_hooks.sh                  # preferred
#   equivalent manual form:
#   git config core.hooksPath .githooks

# 3. loop-guardian plugin auto-loads from .opencode/plugins/ in any OpenCode
#    session started in this repo (no config entry needed — local plugin dirs
#    are auto-loaded). It echoes violations on the first bash call and appends
#    a deterministic record to improver/session-log.md on session idle.

# 4. Run the test suite (zero external deps: python unittest + node --test + sh).
sh tests/run_all.sh
```

Severity model (so the gate is safe to wire without deadlocking a fresh clone):

- **Hard — blocks the commit:** memory-cap overflow, and a missing
  `MEMORY.md` / `USER.md` / `changelog.md` (these are committed files).
- **Warning by default:** missing `graph.json` / `LESSONS.md` (per-machine,
  gitignored), a stale changelog (mtime is unreliable across clones), and
  knowledge-graph drift. Promote each to hard with `--require-graph`,
  `--strict-changelog`, `--strict-stale`.

Notes:
- The pre-commit hook evaluates the **staged index**, not the working tree, so
  over-cap content cannot be slipped past by shrinking the file after `git add`.
- Graph drift sets `graphify-out/.needs_update`; the next clean run (post-commit
  or `python3 scripts/loop_check.py`) **clears it automatically** once sources
  are no longer newer than `graph.json`.
- Bypass a single commit explicitly with `LOOP_CHECK_SKIP=1 git commit …`.
  If no Python interpreter is found, the hook warns and allows the commit
  rather than blocking all work.
- `improver/session-log.md` is machine-local (gitignored) and is excluded from
  drift detection so it never latches the graph stale.

