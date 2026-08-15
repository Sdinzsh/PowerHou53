# Session Handoff

**Purpose**: Compressed state for resuming work in a new session. Replaces the need to re-bill the full conversation transcript on every new session start.

**Token savings**: A typical 30-message session = 15-40 KB of context. A handoff entry = 1-3 KB. ~10-30x compression.

---

## How to use

- **Mid-session**: say `compress` / `save state` / `distill` / `handoff` → I snapshot to the **latest** block below
- **New session**: I auto-read this file at start (per improver protocol) — just say "continue from last session" or "pick up where we left off"
- **Manual trigger**: I may *offer* a compress at ~15-20 messages or when I notice context is getting heavy (decision-based, not auto-forced)

---

## Format (every entry follows this shape)

```
### [YYYY-MM-DD] <short label>
- **When**: trigger (user said "compress" / auto-detected at N messages / etc.)
- **Context**: project or task, key constraints, who's involved
- **State**: done ✓ | in-flight ◐ | blocked ✗
- **Key facts**: paths, IDs, configs, decisions, errors (terse, one line each)
- **Open questions**: unresolved / undecided
- **Next**: concrete next actions (numbered)
```

---

## Latest

### [2026-06-25] Stock `opencode` Bun segfault on `--continue` — diagnosed, NOT fixed
- **When**: end of session, ~4 messages. User reported intermittent Bun segfault from `opencode --continue`, asked if it will happen again when they switch back to their old session.
- **Context**: User is about to switch to an old opencode session to do real work. The crash that prompted this session happened on the resume path. No fix was applied during this session — only diagnosis. The triggering conditions (409 MB DB, 4 MB uncommitted WAL, Bun 1.3.14) are still in place.
- **State**:
  - ✓ Diagnosed the crash
  - ✓ Identified prime suspect: 409 MB `opencode.db` + 4 MB stale WAL
  - ✓ Logged to `knowledge.md` and `changelog.md`
  - ✓ Established identity + C:-only scope directives (user pushed back twice: "your work dir is C:" and "you are not rimuru or powerhous3 u r opencode")
  - ✗ Crash NOT fixed — no DB prune, no config change, no Bun downgrade
- **Key facts** (for future me, not re-research):
  - **Crash signature**: `panic(main thread): Segmentation fault at address 0x225BAC36AA2` ("oh no: Bun has crashed. This indicates a bug in Bun, not your code.")
  - **Runtime**: Bun 1.3.14, standalone_executable, `process_dlopen(3)`, `workers_spawned(2)`, `tsconfig_paths`, `transpiler_cache(5)`
  - **Opencode version**: `0.0.0-dev-202606250443` (stock build at `C:\Users\narea\.bun\bin\opencode.exe`)
  - **Memory state at crash**: RSS 1.08 GB, Peak 1.08 GB, Commit 1.66 GB, Faults 377,341 — high RSS for startup
  - **Prime suspect file**: `C:\Users\narea\.local\share\opencode\opencode.db` = 409,035,520 bytes (409 MB), last modified 2026-06-22
  - **Stale WAL**: `opencode.db-wal` = 4,165,352 bytes, NOT checkpointed in 3 days — likely left by a previous unclean shutdown
  - **Crash address `0x225BAC36AA2`** is in the TB+ range → memory corruption / use-after-free, not NULL deref
  - **Tool-output dir is 22 MB** across 5 files — ruled out as a cause
  - **Identity & scope (user directive, 2026-06-25)**: I am opencode / PowerHous3-MAX. NOT rimuru, NOT powerhous3. C: only. Do not reference, check, or mention `D:\`, `rimuru-ai`, `powerhous3-ai`. Stale entries about those projects in older knowledge.md sections are to be ignored in this scope.
- **Open questions**: none. (User has not yet chosen whether to apply a workaround or live with the crash.)
- **Next** (in priority order):
  1. **Will the crash happen again? YES, very likely** — we did not change anything on disk. The 409 MB DB and 4 MB WAL are still there. The next `--continue` on the stock opencode will likely hit the same path.
  2. **Before resuming the old session**: backup the DB first (one-liner in chat history) so a future prune is reversible.
  3. **If crash hits when resuming**: try `opencode` (no `--continue`) to start fresh, OR `$env:OPENCODE_DISABLE_WORKERS=1; opencode --continue` to skip the worker race.
  4. **If neither workaround works**: the 409 MB DB is too bloated; must prune (delete + re-auth, or backup + selective session trim).
  5. **Long-term**: file a Bun bug at `https://bun.report/1.3.14/...` (auto-generated link in crash output).
- **Workarounds (unchanged from diagnosis, in priority order)**:
  1. Skip `--continue` (start fresh)
  2. `OPENCODE_DISABLE_WORKERS=1 opencode` (worker race workaround)
  3. Prune `opencode.db` (backup → trim or delete + re-auth)
  4. File a Bun bug

---

## Archive

### [2026-06-20] OpenCode internals Q&A + handoff protocol setup

- **When**: end of session, ~9 messages
- **Context**: General questions about OpenCode's data/privacy/storage + user proposed a session-distillation workflow. No project-specific work; operating from `C:\Users\narea` (home dir, not a project).
- **State**:
  - ✓ Confirmed OpenCode data locations
  - ✓ Explained RAM/disk/token cost model
  - ✓ Built & wired session-handoff protocol
- **Key facts** (for future me, not re-research):
  - Sessions: `~/.local/share/opencode/opencode.db` (SQLite, +`-shm`/`-wal`)
  - Config: `~/.config/opencode/` (agents, plugins, improver, opencode.json/c)
  - Desktop app: `C:\Users\narea\AppData\Roaming\ai.opencode.desktop\`
  - **Model is remote** (minimax-m3 on MiniMax server) — RAM holds context window + tool schemas, not the model itself
  - **Thinking tokens are billed but hidden** — every reasoning block burns output tokens the user never sees
  - **PowerShell 5.1 quirks** on this host (no `&&`, `$()` subexpression trap with `docker compose exec`, no `?:` ternary)
  - **WSL2 already configured**: 8 GB RAM, 4 CPU, 2 GB swap (`.wslconfig`); host has 12 CPU / 15.6 GB RAM
- **Open questions**: none for this session
- **Next**:
  1. User: try the protocol in a real long session — say "compress" when you want a snapshot
  2. New session: I'll auto-read `session-handoff.md` at start; say "continue from last session" to pick up

---

## Archive

<!-- Dated full handoffs go here. Newest at top. Each entry above (in Latest) gets moved here on the next compress, so Latest always shows just the most recent snapshot. -->
