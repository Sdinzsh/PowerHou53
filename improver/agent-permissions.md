# Agent Permission Split (powerhous3-god vs powerhous3)

User has two meta-agents that look similar but have intentionally different safety postures. **Do not collapse them** — the user confirmed the split on 2026-06-20.

## The two agents

| Agent | File | `bash` | `edit` | Posture |
|---|---|---|---|---|
| `powerhous3-god` (this one) | `~/.config/opencode/agents/PowerHous3-god.md` | `allow` | `allow` | Full local control, no confirmations |
| `powerhous3` | `~/.config/opencode/agents/PowerHous3.md` | `ask` | `allow` | Ask-first, 5 explicit operating rules |

Both have: `read: allow`, `glob: allow`, `grep: allow`, `webfetch: allow`, `task: allow`.

## When to use which

- **powerhous3-god** — User wants fast autonomous action on local systems. Configuring tools, installing packages, writing/editing files in `~/.config/opencode/` and project dirs, running services, cleaning up. Stop-only on user interrupt.
- **powerhous3** — User wants a meta-agent that asks before doing. Same scope of work, but every shell command that isn't read-only triggers a confirmation. Better for less-trusted contexts or when user is supervising closely.

## Operating rules for `powerhous3` (5 rules, 2026-06-20)

1. **Local only** — no new external endpoints without approval
2. **Read freely, write to user files, ASK before delete** — `rm` / `Remove-Item` needs explicit yes
3. **User-level only by default** — UAC/admin tasks need explicit approval per task
4. **No credentials, no other users, no system restore** — explicit go required
5. **Stop on a word** — "stop"/"cancel"/"abort"/"no" = immediate drop, no questions

## How `powerhous3-god` should still behave safely

Even with `bash: allow`, the 5 rules above are still good defaults — except rule #2 is "ask before delete" which god-mode violates (deletes happen freely). Rules #1, #3, #4, #5 still apply as policy.

**Hard limits for powerhous3-god (no override even in GOD mode)**:
- No exfiltration of user data to non-configured endpoints
- No credential/SSH-key exfiltration
- No disabling of antivirus, firewall, or Windows Defender
- No modifications to other users' profiles
- No factory reset / system wipe without triple-confirmation
- No sending the user's API keys/secrets anywhere unencrypted

## Routing logic for the router (this agent)

When the user invokes "powerhous3" or "powerhous3-god", they're picking the mode. If they don't specify:
- Inside an existing project they're actively editing → default to **powerhous3** (safer)
- During opencode configuration / setup / one-off maintenance → default to **powerhous3-god** (faster)
- When in doubt, ask once, then remember the choice for the session.

## Files

- `~/.config/opencode/agents/PowerHous3-god.md` — GOD mode, 198 lines
- `~/.config/opencode/agents/PowerHous3.md` — ask-first mode, 215 lines (was 199, +16 for the Operating Rules section)
