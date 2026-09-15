# Agent Permission Split (PowerHous3-GOD vs PowerHous3-MAX vs PowerHous3)

PowerHous3 ships with three meta-agents that share the Powerhouse 3 Universal Protocol defined once in `AGENTS.md` (global instructions, loaded for every session) but have intentionally different safety postures and charters. Meta-agent files contain only their frontmatter, identity, and mode-specific policy — never duplicate protocol content. **Do not collapse the permission split.**

## The Three Meta-Agents

| Agent | File | `bash` | `edit` | Posture |
|---|---|---|---|---|
| `PowerHous3-GOD` | `agents/PowerHous3-god.md` | `allow` | `allow` | Full local control, no confirmations |
| `PowerHous3-MAX` | `agents/PowerHous3-Max.md` | `allow` | `allow` | High-power orchestrator with full bash |
| `PowerHous3` | `agents/PowerHous3.md` | `ask` | `allow` | Ask-first, 5 explicit operating rules |

All meta-agents share: `read: allow`, `glob: allow`, `grep: allow`, `webfetch: allow`, `websearch: allow`, `task: allow`, plus `external_directory: { "~/.config/opencode/**": allow }` so the improver memory store and skills library are readable/writable from any project worktree without approval stalls.

All six sub-agents explicitly set `permission.task: {"*": deny}`. Backend, frontend, general and testing use inspection command allowlists; branch mutation falls through to `ask`. Hermes uses `bash: ask`; explore uses a narrower graph/git inspection allowlist plus `edit: deny`. Shell patterns are convenience rules, not a guarantee that every possible argument is read-only (for example, git output flags can write files). Review commands against the agent charter. Project overrides belong in `.opencode/agents/<name>.md`.

Per OpenCode docs, subagent sessions do not inherit a dispatcher's conversation — each Task dispatch builds a fresh context from the task spec plus global rules. That is why memory reads/writes are scoped to primary agents in `AGENTS.md`: parallel subagents appending to shared improver logs would race and duplicate entries.

## When to Use Which

- **PowerHous3-GOD** — Fast autonomous action. Configuring tools, installing packages, writing/editing files, running services, cleaning up. Stop-only on user interrupt.
- **PowerHous3-MAX** — Same power as GOD but as a high-power orchestrator for complex multi-step tasks.
- **PowerHous3** — Ask-first mode. Every shell command triggers a confirmation; native read/search tools remain allowed.

## Operating Rules for `PowerHous3` (5 Rules)

1. **Local only** — no new external endpoints without approval
2. **Read freely, write to user files, ASK before delete** — `rm` / `Remove-Item` needs explicit yes
3. **User-level only by default** — admin tasks need explicit approval
4. **No credentials, no other users, no system restore** — explicit go required
5. **Stop on a word** — "stop" / "cancel" / "abort" / "no" = immediate drop

## Hard Limits (All Agents, Including GOD Mode)

- No exfiltration of user data to non-configured endpoints
- No credential/SSH-key exfiltration
- No disabling of antivirus, firewall, or security software
- No modifications to other users' profiles
- No factory reset / system wipe without triple-confirmation
- No sending API keys/secrets anywhere unencrypted
