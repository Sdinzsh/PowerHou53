# PowerHous3 Architecture for OpenCode

PowerHous3 is a comprehensive **Closed Learning Loop** AI architecture built for [OpenCode](https://opencode.ai). Inspired by the NousResearch Hermes Agent, it evolves a standard static prompt setup into a self-improving, memory-bounded, multi-agent system.

It relies on a knowledge-graph of Markdown files to manage continuous learning, ensuring that the agents get smarter and more customized over time without blowing up your token context window.

## 🧠 The Self-Improving Loop

The PowerHous3 architecture implements a 5-stage loop to manage agent knowledge:

1. **Session Start (Frozen Context)**: Reads bounded memory files (`MEMORY.md` and `USER.md`) and a progressive skill index. This snapshot stays frozen during the session to maximize prompt prefix caching efficiency.
2. **Specialized Delegation**: Meta-agents (PowerHous3, PowerHous3-Max, PowerHous3-god) act as routers, delegating tasks to 6 specialized sub-agents (`backend`, `frontend`, `explore`, `general`, `testing`, `hermes`) tailored for the exact job.
3. **On-Demand Loading**: When a task matches a known skill, the agent fetches the detailed Level 1 or Level 2 procedure from the `skills/` library via `skill_view`.
4. **Post-Turn Background Review**: "The Nudge" — an auxiliary fork replays the conversation digest in the background to propose new durable facts or skill patches.
5. **Autonomous Curator**: Tracks skill telemetry (views, patches, last-used). Archives unused skills after 90 days to maintain a lean, high-signal knowledge base.

## 📂 Architecture Components

```text
~/.config/opencode/
├── agents/                       ← 9 agent definitions
│   ├── PowerHous3-god.md         ← Unrestricted orchestrator
│   ├── PowerHous3-Max.md         ← High-power orchestrator
│   ├── PowerHous3.md             ← Ask-first (safe) orchestrator
│   ├── backend.md                ← APIs, databases, server logic
│   ├── explore.md                ← Codebase discovery
│   ├── frontend.md               ← UI/UX, components, state
│   ├── general.md                ← Cross-domain & devops
│   ├── hermes.md                 ← Procedural memory engine
│   └── testing.md                ← Test pipelines & coverage
├── improver/                     ← Persistent knowledge-graph
│   ├── MEMORY.md                 ← Bounded operational memory (2,200 char cap)
│   ├── USER.md                   ← Bounded user profile (1,375 char cap)
│   ├── knowledge.md              ← Unbounded durable learnings
│   ├── skills.md                 ← Telemetry & registry
│   ├── changelog.md              ← Immutable audit log
│   ├── plugins.md                ← MCP/Plugin states
│   └── ...
└── skills/                       ← Progressive disclosure library
    └── sample-skill/
        └── SKILL.md              ← agentskills.io format template
```

## 🚀 Cross-Platform Installation

PowerHous3 is fully cross-platform and works seamlessly on Windows, Linux, and macOS. The OpenCode engine resolves `~` to your home directory on Unix and your `%USERPROFILE%` on Windows.

### Linux & macOS

1. Copy the files into your local OpenCode config directory:
```bash
mkdir -p ~/.config/opencode/agents
mkdir -p ~/.config/opencode/improver
mkdir -p ~/.config/opencode/skills

cp -r ./agents/* ~/.config/opencode/agents/
cp -r ./improver/* ~/.config/opencode/improver/
cp -r ./skills/* ~/.config/opencode/skills/
```

### Windows (PowerShell)

1. Copy the files into your local OpenCode config directory:
```powershell
New-Item -ItemType Directory -Path "$env:USERPROFILE\.config\opencode\agents" -Force | Out-Null
New-Item -ItemType Directory -Path "$env:USERPROFILE\.config\opencode\improver" -Force | Out-Null
New-Item -ItemType Directory -Path "$env:USERPROFILE\.config\opencode\skills" -Force | Out-Null

Copy-Item -Path ".\agents\*" -Destination "$env:USERPROFILE\.config\opencode\agents\" -Force -Recurse
Copy-Item -Path ".\improver\*" -Destination "$env:USERPROFILE\.config\opencode\improver\" -Force -Recurse
Copy-Item -Path ".\skills\*" -Destination "$env:USERPROFILE\.config\opencode\skills\" -Force -Recurse
```

### Set Default Agent (Optional but Recommended)

In your `~/.config/opencode/opencode.json` (or `%USERPROFILE%\.config\opencode\opencode.json` on Windows), set the default agent to leverage the full PowerHous3 loop:

```json
{
  "default_agent": "powerhous3-god"
}
```

## 🛡️ Safety Gates & Write Approvals

PowerHous3 includes built-in safety mechanisms to prevent context pollution:
- **`memory.write_approval`**: Stages memory updates in `pending/` for user review.
- **`skills.write_approval`**: Stages skill patches for user `/skills diff` and `/skills approve`.
- **Heuristic Guard**: Prevents agent-created skills from injecting malicious commands or unbounded text.

---
*See [`INSTALL.md`](INSTALL.md) for more detailed workflow examples and verification steps.*
