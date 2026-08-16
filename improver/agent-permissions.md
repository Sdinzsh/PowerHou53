# Agent Permission Split (PowerHous3-GOD vs PowerHous3-MAX vs PowerHous3)

PowerHous3 ships with three meta-agents that share the same core architecture and the shared rules in `AGENTS.md` (global instructions, loaded once) but have intentionally different safety postures and charters. **Do not collapse the permission split.**

## The Three Meta-Agents

| Agent | File | `bash` | `edit` | Posture |
|---|---|---|---|---|
| `PowerHous3-GOD` | `agents/PowerHous3-god.md` | `allow` | `allow` | Full local control, no confirmations |
| `PowerHous3-MAX` | `agents/PowerHous3-Max.md` | `allow` | `allow` | High-power orchestrator with full bash |
| `PowerHous3` | `agents/PowerHous3.md` | `ask` | `allow` | Ask-first, 5 explicit operating rules |

All meta-agents share: `read: allow`, `glob: allow`, `grep: allow`, `webfetch: allow`, `websearch: allow`, `task: allow`, plus `external_directory: { "~/.config/opencode/**": allow }` so the improver memory store and skills library are readable/writable from any project worktree without approval stalls.

Sub-agents (backend, frontend, general, testing, explore, hermes) have no `task` rule — OpenCode denies `task` for subagents unless explicitly permitted, which enforces the no-re-delegation design. `explore` additionally enforces its read-only charter with `edit: deny` and only read-only bash patterns allowed.

## When to Use Which

- **PowerHous3-GOD** — Fast autonomous action. Configuring tools, installing packages, writing/editing files, running services, cleaning up. Stop-only on user interrupt.
- **PowerHous3-MAX** — Same power as GOD but as a high-power orchestrator for complex multi-step tasks.
- **PowerHous3** — Ask-first mode. Every shell command that isn't read-only triggers a confirmation. Better for supervised work or less-trusted contexts.

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
