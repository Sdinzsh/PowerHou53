# OpenCode Custom Setup — Install Guide (Powerhouse 3 Architecture)

This package gives you a customized OpenCode installation with:

- **3 custom meta-agents** (PowerHous3-GOD, PowerHous3-Max, PowerHous3) — powered by **Think-Before-Act Planning**, **Goal-Task-Context-Constraints Alignment**, and **Playwright Web Automation**
- **6 sub-agents** for delegating specialized work (backend, frontend, explore, general, testing, hermes)
- **A Deterministic Knowledge Graph & Comprehension Engine** (Understand-Anything + Graphify AST with Tree-sitter)
- **A Multi-Modal Ingestion Pipeline** (Microsoft MarkItDown for PDFs, PPTX, XLSX, audio, images with OCR)
- **A Closed Learning Loop**: bounded memory, on-demand skill loading, session-end batched logging, `graphify` reflection overlays (`LESSONS.md`), and a curator convention for skill lifecycle (`active → stale → archived`)
- **An improver memory system** that logs patterns, decisions, plugins, skills, and token usage across sessions
- **A PROJECT.md living document** per project (`.opencode/PROJECT.md`) detailing directory structure, tech stack, work progress log, architecture notes, active tasks, and learnings — written at milestones, never blocking active work

Copy the configuration kit (`AGENTS.md`, `agents/`, `improver/`, `skills/`) as shown below. Keep the enforcement kit project-local. Existing memory files are preserved; back up customized agents and skills before replacing them.

## Install the Powerhouse runtime and Harness bridge

From this checkout, with Node.js 22.19+ (22.x) or 24+, Python 3.10+, Git and bash:

```bash
npm ci --prefix .opencode
npm ci --prefix integrations/deepseek-harness
bash tests/run_all.sh
node --test tests/integration_opencode.mjs  # requires the opencode executable
```

Restart OpenCode in this project. It discovers `.opencode/plugins/powerhouse.js`
and exposes `powerhouse_task`, `powerhouse_verify`, and `powerhouse_harness`.
The current verification command is `bash tests/run_all.sh`; configure project
checks in `.opencode/powerhouse.json`. For the model credential, tool usage,
permission boundary, transfer to another project and rollback, follow the
[Harness integration guide](integrations/deepseek-harness/README.md).

Both npm installations are required for the full test suite. Production task
tracking and verification can run with just the `.opencode` dependency install.

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
├── tests/               ← Python, Node, SDK and hook tests: `sh tests/run_all.sh`
├── integrations/        ← DeepSeek Harness SDK bridge and dependency lockfile
├── .opencode/plugins/    ← loop-guardian.js and powerhouse.js (auto-loaded)
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
# Seed missing memory files; preserve existing session history on upgrades.
for source in ./improver/*.md; do
  destination="$HOME/.config/opencode/improver/${source##*/}"
  if [ ! -e "$destination" ]; then cp "$source" "$destination"; fi
done
cp -r ./skills/*   ~/.config/opencode/skills/
```

### Windows (PowerShell)
```powershell
New-Item -ItemType Directory -Path "$env:USERPROFILE\.config\opencode\agents" -Force | Out-Null
New-Item -ItemType Directory -Path "$env:USERPROFILE\.config\opencode\improver" -Force | Out-Null
New-Item -ItemType Directory -Path "$env:USERPROFILE\.config\opencode\skills" -Force | Out-Null

Copy-Item -Path ".\AGENTS.md"   -Destination "$env:USERPROFILE\.config\opencode\AGENTS.md" -Force
Copy-Item -Path ".\agents\*"    -Destination "$env:USERPROFILE\.config\opencode\agents\"   -Force
Get-ChildItem ".\improver\*.md" | ForEach-Object {
  $destination = Join-Path "$env:USERPROFILE\.config\opencode\improver" $_.Name
  if (-not (Test-Path $destination)) { Copy-Item $_.FullName $destination }
}
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

**2. MarkItDown — multi-format → Markdown ingestion** (Microsoft). Install format extras individually to limit dependencies; [upstream documentation](https://github.com/microsoft/markitdown#optional-dependencies) lists additional formats and integrations:
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
An invalid agent name can prevent startup; use the exact filename stem.

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

The full kit needs the runtimes and dependencies listed above (Git Bash or WSL on Windows). To use it in another repository, copy `scripts/`, `.githooks/`, `tests/`, `integrations/deepseek-harness/` without `node_modules`, `.opencode/plugins/loop-guardian.js`, `.opencode/plugins/powerhouse.js`, `.opencode/lib/`, and `.opencode/powerhouse.json`. Merge `.opencode/package.json` into an existing package file instead of replacing dependencies, install its dependencies, and adapt the configured checks. Seed project-local `improver/MEMORY.md`, `USER.md`, and `changelog.md`; the gate checks this project store, not the global store.

To activate it:

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
#    a record per session with new bash activity to improver/session-log.md
#    on idle/deletion. Duplicate idle events do not duplicate records.

# 4. Run the test suite after the npm installs above.
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
- Memory limits count Unicode code points with line endings normalized to LF.
  Staged changelog liveness uses the last commit timestamp, or the current time
  when a changelog change is staged; touching the worktree cannot bypass it.
- `--check` verifies executable hook files as well as `core.hooksPath`.
  Installation reports a failed smoke test with a nonzero exit status.
- Graph drift sets `graphify-out/.needs_update`; the next clean run (post-commit
  or `python3 scripts/loop_check.py`) **clears it automatically** once sources
  are no longer newer than `graph.json`.
- Bypass a single commit explicitly with `LOOP_CHECK_SKIP=1 git commit …`.
  If no Python interpreter is found, the hook warns and allows the commit
  rather than blocking all work.
- `improver/session-log.md` is machine-local (gitignored) and is excluded from
  drift detection so it never latches the graph stale.
