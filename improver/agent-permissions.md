# Agent Permission Split (PowerHous3-GOD vs PowerHous3)

PowerHous3 ships with two meta-agents that share the same architecture but have intentionally different safety postures. **Do not collapse them.**

## The Two Agents

| Agent | File | `bash` | `edit` | Posture |
|---|---|---|---|---|
| `PowerHous3-GOD` | `agents/PowerHous3-god.md` | `allow` | `allow` | Full local control, no confirmations |
| `PowerHous3-MAX` | `agents/PowerHous3-Max.md` | `allow` | `allow` | High-power orchestrator with full bash |
| `PowerHous3` | `agents/PowerHous3.md` | `ask` | `allow` | Ask-first, 5 explicit operating rules |

All agents share: `read: allow`, `glob: allow`, `grep: allow`, `webfetch: allow`, `task: allow`.

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
