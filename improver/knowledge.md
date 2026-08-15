# Knowledge Base

## Session Handoff Protocol (2026-06-20)

**Problem**: Long sessions accumulate 15-40 KB of context that gets re-billed on every follow-up message. Plus the full transcript lives in `~/.local/share/opencode/opencode.db` indefinitely.

**Solution**: Compress active session state into a structured handoff file. New sessions read the handoff instead of the full transcript.

**File**: `~/.config/opencode/improver/session-handoff.md`
- **Latest** block = most recent snapshot, always read at session start
- **Archive** block = history of all past handoffs (moved here on next compress)
- Format spec: When/Context/State/Key facts/Open questions/Next

**Triggers** (user-facing):
- "compress" / "save state" / "distill" / "handoff" → snapshot to Latest
- Auto-offer at ~15-20 messages or when I notice context getting heavy
- New session: I read this file at start (per improver protocol); user just says "continue from last session"

**Compression ratio target**: 10-30x (typical 30-message session = 1-3 KB handoff)

**What to include in a handoff**:
- Project/task + key constraints
- What's done, in-flight, blocked
- Concrete paths, IDs, configs, errors (one line each)
- Open questions + next actions (numbered)

**What to OMIT** (not worth the tokens):
- Back-and-forth Q&A that didn't lead to decisions
- Intermediate tool outputs
- My reasoning — only conclusions
- Greetings, clarifications, "I see", etc.

---

## Browser skills (skills.sh, surveyed 2026-06-20)

Top 5 by installs. **No browser skill is currently installed locally** — we rely on `firecrawl` MCP + built-in `browser-use_*` tools.

| Skill | Installs | Notes |
|---|---:|---|
| `vercel-labs/agent-browser@agent-browser` | 467K | Fast CDP-based automation, headless/Chrome/cloud modes, `@eN` element refs. Most popular. |
| `xixu-me/skills@use-my-browser` | 223K | Routes to user's *live* browser session (logged-in, localhost, anti-bot). Decision-guide: static-capable vs browser-required. |
| `browser-act/skills@browser-act` | 49.8K | Multi-browser parallel, headed mode, human-in-loop confirmation gates. |
| `firecrawl/cli@firecrawl-browser` | 11.3K | Already covered by `firecrawl` MCP server. |
| `browserbase/skills@browser` | 4.7K | Cloud browser via `browse` CLI, needs `BROWSERBASE_API_KEY`. |

**Decision rule:** keep using firecrawl MCP + browser-use tools by default. Install `vercel-labs/agent-browser` only if those feel limiting (need CDP control, persistent state across commands, `@eN` refs).

## Skills.sh CLI

- **Install command**: `npx skills add <source> -y -g` (where `-y` = yes-to-prompts, `-g` = global)
- **CLI version**: 1.5.12 (as of 2026-06-20)
- **Install location**: `~/.agents/skills/` (Universal path, works across Codex, Copilot, OpenCode, Amp, etc.)
- **OpenCode discovery**: OpenCode reads skills from `~/.agents/skills/`. Skills may need a session restart to appear in the system prompt's `<available_skills>` block.
- **PromptScript limitation**: Some skills register a "PromptScript" agent target that does NOT support global install. This causes per-skill "Failed to install" errors, but the skill IS still installed for the universal targets. Can be safely ignored.
- **Interactive prompts**: Without `-y` flag, the CLI prompts for: (1) which skills to install from the discovered set, (2) which agent targets to install to. Both can be pre-answered: `--skill <name>` for individual, no flag = all skills; `-g` for global vs project scope.
- **Multi-skill install**: For official WP-style packs that have many skills, run `npx skills add <source> -y -g` with no `--skill` flag to install ALL discovered skills.

## LinkedIn Image Posting

- LinkedIn API requires binary image upload for native photo posts. URLs in post text render as link previews.
- Upload flow: POST `/rest/images?action=initializeUpload` → PUT binary to returned uploadUrl → use returned image URN in `create_post` with `content.media.id`.
- Image specs: JPG/PNG, max 5MB, min 1200x627px recommended.
- The `dazanza/linkedin-mcp` server handles this flow via `upload_image` + `create_post(image_urn=...)`.

## LinkedIn Posts API (v2)

- The correct `/rest/posts` API format uses `commentary` (string), NOT the legacy `specificContent.com.linkedin.ugc.ShareContent.shareCommentary` format.
- Body: `{ author, commentary, visibility, distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] }, lifecycleState: "PUBLISHED" }`
- For image posts, add `content: { media: { id: imageUrn, altText: "..." } }`.
- API version header: `LinkedIn-Version: 202602`

## Docker (Windows / Docker Desktop)
- **Backend**: WSL 2 (kernel 6.18.33-microsoft-standard-WSL2, overlayfs storage driver)
- **Engine service**: `com.docker.service` (StartType=Manual, not Auto) — **does not auto-start** with Windows. Either launch `Docker Desktop.exe` or run `Start-Service com.docker.service` from an admin shell.
- **Common symptom when not running**: `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`
- **Existing `~/.docker/daemon.json`**: minimal — only `builder.gc.defaultKeepStorage: 20GB` and `experimental: false`. No engine-level hardening (log limits, live-restore, address pools).
- **`live-restore: true` is NOT honored on Docker Desktop** — `docker info` still reports `Live Restore Enabled: false`. Docker Desktop manages container lifecycle via the WSL2 VM, so the key is non-functional on this platform. Don't set it in `daemon.json`; remove if present.
- **WSL config via `C:\Users\narea\.wslconfig`** (active 2026-06-20): `[wsl2] memory=8GB, processors=4, swap=2GB`. Verify with `wsl -e free -h` — should show ~7.8 GiB total. Requires `wsl --shutdown` to take effect.
- **daemon.json log driver**: `json-file` with `max-size=10m, max-file=3` is honored by Docker Desktop (verify via `docker info` → `Logging Driver: json-file`).
- **Host system specs** (for sizing WSL): 12 logical CPUs, 15.6 GiB RAM.
- **PowerShell 5.1 quirk**: no `?:` ternary. Use `if/else` or `[string]::IsNullOrEmpty(...)` instead.

## WordPress (block themes / Docker)

- **Official `wordpress:6.6-php8.3-apache` does NOT include WP-CLI**. Install manually or bake a `Dockerfile` (see `wp-landing/docker/Dockerfile.wordpress` for a 3-line `curl + chmod + mv` recipe).
- **Block theme minimal scaffold**: `style.css` (header) + `theme.json` (settings + styles + template-parts/customTemplates) + `templates/index.html` + `parts/{header,footer}.html` + `patterns/*.php` (each with a `<?php /** ... */ ?>` header declaring `Title`, `Slug`, `Categories`, etc.). Patterns are auto-registered from the file header.
- **theme.json v2** supports `settings.appearanceTools`, `useRootPaddingAwareAlignments`, `layout.contentSize/wideSize`, full color/typography/spacing/gradient/border/shadow presets, and per-block + per-element styles.
- **Block templates/parts markup**: `<!-- wp:blockname {"attrs":...} /-->` for self-closing or `<!-- wp:blockname -->...<!-- /wp:blockname -->` for pairs. `wp:template-part` is the canonical way to include a `parts/*.html` from a template.
- **Bind-mounting a theme** (`./theme:/var/www/html/wp-content/themes/theme:ro`) lets you edit patterns on the host and see changes on next page load — no container rebuild. Use `:rw` if you also want to install plugins from inside WP admin.
- **First-boot failure mode** (worth memorising): if `WORDPRESS_CONFIG_EXTRA` contains a PHP syntax error, WordPress will return HTTP 500 forever — the volume already has the broken `wp-config.php` by the time the curl healthcheck runs. Always `docker logs <container>` on first boot to catch this.
- **`Set-Service` on `com.docker.service` requires admin** (denied in non-elevated session). Workaround: just launch Docker Desktop — it starts its own service.

## Docker Compose — env var / YAML pitfalls

- **`$_` and `$$` substitution in env vars**: Docker Compose tries to substitute `$VAR` references inside string env-var values. PHP superglobals like `$_SERVER[...]` get mangled because Compose sees `$_SERVER` as a (undefined) variable reference and replaces it with the empty string. **Fix**: write `$$_SERVER` in the YAML — Compose expands `$$` to a literal `$`, producing the correct `$_SERVER` at runtime. Affects any env var that holds PHP/JS/shell source code referencing `$_VAR`.
- **PowerShell `$_` collision**: the same `$_` token is PowerShell's "current pipeline item" — so even passing `$_SERVER` *through* `docker compose` from a PS shell can break before the YAML is read. Using `$$_SERVER` in the YAML also sidesteps the PS shell parsing layer. (`$_SERVER` warnings about "defaulting to a blank string" are harmless and unrelated — Compose logs them because of a missing `_SERVER` literal in the shell environment.)
- **`docker compose config`** is a fast, safe validator — no containers start, just parses + interpolates + dumps the resolved YAML. Use it to catch typos before `up`.
- **PowerShell `$()` subexpression trap**: `$(cmd)` inside a `docker compose exec ... bash -c "..."` invocation gets interpreted by PowerShell, not the remote shell. Either escape as `` ` ``(cmd)`` or — better — run the bash command in a single quoted heredoc, or invoke WP-CLI directly (`docker compose exec -T wordpress wp ...`) without the inner `bash -c`.

## Daily LinkedIn Post Automation

- **Repo**: `github.com/Abi-de-jo/linkedin-daily-automation` (public)
- **Dual deployment**: GitHub Actions (8AM IST backup) + Windows Task Scheduler (9:30AM local primary)
- **Local flow**: `run-daily.ps1` → reads `~/.linkedin-mcp-token.json` → preview for topic → `capture-image.py` (Playwright headless Chromium screenshot) → `node src/index.mjs post` with `LINKEDIN_IMAGE_PATH` set
- **Image capture**: `capture-image.py` maps 35+ topic keywords to relevant URLs (github repos, wikipedia pages, official sites). Falls back to OpenCode repo. Uses Playwright headless Chromium.
- **Content**: `src/index.mjs` → `src/content.mjs` (HN top 50 fetcher + 7-day rotating theme templates) → `src/linkedin-client.mjs` (direct LinkedIn REST API v2)
- **Scripts**: `src/index.mjs` calls `src/content.mjs` (news fetcher + template composer) and `src/linkedin-client.mjs` (direct API wrapper)
- **Schedules**: GitHub Actions daily at 8:00 AM IST (2:30 AM UTC). Windows Task Scheduler `LinkedInDailyPost` daily at 9:30 AM.
- **Secrets**: GitHub: `LINKEDIN_ACCESS_TOKEN` + `LINKEDIN_PERSON_URN` in repo secrets. Local: token read from `~/.linkedin-mcp-token.json` at runtime.
- **Token lifetime**: ~60 days (current expires Aug 15, 2026). Local refresh via `opencode` → `authenticate` tool. No GitHub secret update needed for local runs.
- **Cost**: GitHub Actions free tier + free HN API + local Playwright headless.
- **Image tier system in `getTodaysImage()`**: Tier 0 (local browser screenshot from LINKEDIN_IMAGE_PATH) → Tier 1 (Wikipedia via story keyword) → Tier 2 (Wikipedia via day theme) → Tier 3 (OpenCode fallback)

## `powerhous3` CLI = `gowdaman-dev/rimuru-ai` (2026-06-24, updated 2026-06-25)

- **Source repo**: `https://github.com/gowdaman-dev/rimuru-ai` (dev branch). Was previously `Abi-de-jo/PowerHous3-AI` at `D:\rimuru-ai`.
- **Local clone**: `D:\rimuru-ai` (re-cloned 2026-06-24, dev branch). The earlier `D:\powerhous3-ai` path is no longer present.
- **Launcher**: `C:\Users\narea\.rimuru\bin\powerhous3.cmd` (5-line CMD shim, `C:\Users\narea\.rimuru\bin` is in `PATH`). Body:
  ```cmd
  @echo off
  setlocal
  cd /d "D:\rimuru-ai\packages\rimuru"
  bun run --conditions=browser src/index.ts %*
  exit /b %ERRORLEVEL%
  ```
  - Backup history: `powerhous3.cmd.bak-20260624-211010` (was the `D:\rimuru-ai` version, restored today). `powerhous3.cmd.wrong-20260624` is preserved as the `D:\powerhous3-ai` (broken) version — DO NOT confuse with a valid backup.
- **Runtime**: Bun 1.3.14. Stack traces point at `.ts` source under `D:\rimuru-ai\packages\rimuru\src\...`. `bun --conditions=browser` is required (browser export condition is used).
- **CLI script name is `rimuru-ai`**, not `powerhous3` — yargs `.scriptName("rimuru-ai")` in `packages/rimuru/src/index.ts:47`. `powerhous3` is the cosmetic launcher name.
- **Version output** = `local` (dev build, no release tag). `powerhous3 --help` lists all subcommands: `run`, `serve`, `web`, `acp`, `mcp`, `tui`, `attach`, `debug`, `providers`, `agent`, `upgrade`, `uninstall`, `models`, `stats`, `export`, `import`, `github`, `pr`, `session`, `plugin`, `db`.
- **First-call latency**: ~3-5s the first time after a fresh shell, due to Bun runtime spin-up. Subsequent calls in the same shell are fast. Don't add a shell timeout < 10s in wrappers.
- **Install caveat (re-confirmed 2026-06-24)**: `bun install` from `D:\rimuru-ai` **fails postinstall on `tree-sitter-powershell@0.25.10`** — needs VS Build Tools for native compile (node-gyp). Workaround: `bun install --ignore-scripts`. **Update 2026-06-24**: `tree-sitter-powershell` has been **removed entirely** from `packages/rimuru/package.json` (dep) and root `package.json` (`trustedDependencies`) — `bun install` now succeeds without `--ignore-scripts`. Cost: TUI powershell syntax highlighting may be unavailable. Lockfile is now `D:\rimuru-ai\bun.lock` with no `tree-sitter-powershell` entry. Future: install VS Build Tools and re-add, or replace with a prebuilt alternative.
- **Why the CLI is named "powerhous3"**: cosmetic — same project family, just renamed launcher.
- **Known non-fatal startup behaviour**: `bun dev` (or any default `powerhous3` invocation that boots the TUI) hangs in a non-interactive shell because the TUI tries to attach to a TTY. `powerhous3 --help` / `powerhous3 --version` / `powerhous3 run "msg"` (non-interactive) work fine. The user must run `powerhous3` from a real terminal to interact with the TUI.
- **Upstream rebrand collision — keep POWERHOUS3, reject RIMURU on pull (2026-06-25)**: Upstream commit `850f4d746 chore: complete rimuru-ai fork rebranding` rewrote `packages/tui/src/logo.ts` to use `rimuruLines` (RIMURU ASCII art). The user's local fork keeps `powerhous3Lines` (POWERHOUS3) as the cosmetic name. On any future `git -C D:\rimuru-ai pull --ff-only`, if `git status` shows `packages/tui/src/logo.ts` as modified, **reject the change** with `git checkout HEAD -- packages/tui/src/logo.ts` to keep the POWERHOUS3 branding. The current POWERHOUS3 art (after the 2026-06-25 H fix) is the canonical version.

## `powerhous3 run` build step required for `@rimurucode-ai/plugin` (2026-06-24)

- **Symptom**: `powerhous3 run hii` (or any tool that imports `@rimurucode-ai/plugin`) fails with `Cannot find module '@rimurucode-ai/plugin' from 'D:\rimuru-ai\packages\rimuru\.rimuru\tool\github-triage.ts'`.
- **Root cause**: `packages/plugin/package.json` exports field maps the package's `default` to `./dist/index.js` (and `./dist/tool.js`, `./dist/tui.js` for subpath exports). A fresh clone has source only — no `dist/`. Bun honours the `default` export, not the `types` (`.ts`) one, so resolution fails. The other workspace packages (`core`, `sdk`, `script`, `tui`, `llm`, `server`, etc.) are loaded as TS source directly by Bun — they DON'T have a `dist/` requirement. Only `plugin` does.
- **Detection**: any package.json where `exports[*].default` (or `main`) points into `./dist/`. As of 2026-06-24, only `packages/plugin/package.json` matches this pattern in this monorepo. Sweep the `packages/*/package.json` files to verify after pulling.
- **Fix**: `bun run --cwd D:\rimuru-ai\packages\plugin build` (runs `tsc`, produces `packages/plugin/dist/{index,tool,tui,example,example-workspace,shell}.{js,d.ts}`). Re-run on every fresh clone or after `git clean`.
- **No root build script**: root `package.json` has no `build` script. `bun turbo build` would also work but takes longer; targeted `--cwd packages/plugin build` is the minimal fix.
- **Why the prior `D:\powerhous3-ai` setup worked without this step**: that clone may have included pre-built `dist/` artifacts (the `rimuru` package has `bin/opencode` committed, suggesting other build outputs were too). The fresh `gowdaman-dev` clone at `D:\rimuru-ai` ships source-only.

## User-level custom tools — module resolution fix (2026-06-24)

- **Pattern**: rimuru discovers user-level tools at `C:\Users\narea\.config\rimuru\tool\*.{js,ts}` via `Glob.scanSync` in `packages/rimuru/src/tool/registry.ts:173-186`, then dynamically `import(pathToFileURL(match).href)`s them.
- **Cross-drive resolution trap**: when a user tool does `import { tool } from "@rimurucode-ai/plugin"`, Node/Bun resolution starts from the tool's own directory. It walks up `C:\` ancestors and **stops at drive boundaries** — it never reaches `D:\rimuru-ai\node_modules\` where the workspace's `@rimurucode-ai` scope lives.
- **Fix (no admin, no dev mode)**: create a directory junction `C:\Users\narea\.config\rimuru\tool\node_modules` → `D:\rimuru-ai\node_modules`. PowerShell: `New-Item -ItemType Junction -Path "...\tool\node_modules" -Target "D:\rimuru-ai\node_modules"`.
- **Why junction not symlink**: junctions work on any Windows install without admin/dev-mode, and are transparent to Bun's resolver. Bun traverses the reparse point and resolves `@rimurucode-ai/plugin` (which itself is a symlink → `packages/plugin`) without issue.
- **Scope**: fixes ALL future user tools, not just `github-triage.ts`. Any workspace package (`@rimurucode-ai/sdk`, `@rimurucode-ai/script`, third-party deps via workspace `node_modules`) is now reachable from user tools.
- **PowerShell false negative**: `Test-Path -LiteralPath "...\node_modules\@rimurucode-ai\plugin\package.json"` may return `$false` on this junction+symlink chain. Don't trust it — use `Get-ChildItem node_modules\@rimurucode-ai` to verify visibility, or just run the binary. The runtime is the source of truth.

## `[codebase-index] Skipping... no project marker found in "/"` — NOT an error

- **Source**: `opencode-codebase-index` plugin (line 27 of `opencode.json`).
- **Meaning**: the plugin walks up from the CWD looking for `package.json`/`.git`/`.hg` etc. If none is found (e.g. you ran `powerhous3` from `C:\Users\narea` or a drive root), it logs this to **stderr** and skips auto-indexing. The TUI still launches fine.
- **Why it LOOKS like an error in PowerShell 5.1**: PS wraps any stderr line from an external exe as a `RemoteException` with `powerhous3 :` prefix and `CategoryInfo : NotSpecified: (...)` decoration. Purely cosmetic — no fatal error.
- **Why the path is `/` and not `C:\Users\narea`**: Node/Bun path normalization on Windows. When the cwd is the drive root or a path that normalizes to root, it shows as `/`.
- **Fix options**:
  1. `cd` into a real project dir before running `powerhous3` (cleanest, message disappears).
  2. Add `"indexing": { "requireProjectMarker": false }` to `opencode.json` to silence it globally (don't — wastes cycles indexing drive roots).
  3. Use `powerhous3 2>$null` or run from Windows Terminal instead of PS5.1 to hide the stderr wrapping.

## opentui 0.3.4 FFI crash: `Expected ArrayBufferView but received Cell to a pointer`

- **Symptom**: TUI crashes immediately on startup with `TypeError: Unable to convert TypeError [ERR_INVALID_ARG_TYPE]: Expected ArrayBufferView but received Cell to a pointer` originating in `textBufferSetDefaultFg` (opentui-c5en9p2g.dll). Stack: `fg → setDefaultFg → textBufferSetDefaultFg → ffi call`.
- **Root cause**: In `node_modules/.bun/@opentui+core@0.3.4+*/node_modules/@opentui/core/index-54s7pk0d.js`, the FFI signature for `textBufferSetDefaultFg` is `{ args: ["u32", "ptr"], returns: "void" }` — expects a pointer (ArrayBufferView). But the JS call site passes the `RGBA` object directly, not its `.buffer` (which is a `Uint16Array(4)` — the actual ArrayBufferView).
- **Call sites** (4 to fix): line 15512 (TextBuffer.setDefaultFg), line 15516 (setDefaultBg), line 17572 (EditBuffer.setDefaultFg), line 17576 (setDefaultBg). All take `fg2` / `bg2` and need to pass `fg2.buffer` / `bg2.buffer`.
- **Affects**: opencode `0.0.0-dev-202606220730` (and any opencode dev build that pins `@opentui/core@0.3.4` in the catalog). opentui v0.4.1 (latest) is not confirmed affected — may already be fixed upstream.
- **Patched locally** on 2026-06-23: edited all 4 call sites, file grew 999,517 → 999,545 bytes (4 × 7 chars = 28 bytes, exactly). JS syntax-checked with `node --check` — clean. Backup at `index-54s7pk0d.js.bak-20260623-212538`.
- **Persisted via patch-package**: wrote `D:\opencode\patches\@opentui%2Fcore@0.3.4.patch` in standard patch-package format (matches other patches in that dir, e.g. `@ai-sdk%2Fgoogle@3.0.73.patch`). Will be auto-reapplied on every `bun install` as long as the catalog pin stays at 0.3.4.
- **Upstream**: bug is in opentui, not opencode. Pre-filled URL for filing: `https://github.com/anomalyco/opentui/issues/new?title=...` (see changelog 2026-06-23 for full body). GitHub MCP can't auto-file — `GITHUB_TOKEN` env var is not set; `D:\hemres-key.json` is Gmail OAuth, not GitHub.
- **Audit hint**: same `.buffer`-vs-object pattern likely needs the same audit on every FFI binding in `index-54s7pk0d.js` whose `args` array contains `"ptr"` and whose JS call site passes a wrapper object (e.g. `RGBA | string | undefined` params in `renderables/`). Not exhaustively checked.

## Stock `opencode` segfault on `--continue` (2026-06-25)

- **Symptom**: `opencode` (the standalone exe at `C:\Users\narea\.bun\bin\opencode.exe`, version `0.0.0-dev-202606250443`, runtime Bun 1.3.14) panics with `panic(main thread): Segmentation fault at address 0x225BAC36AA2` and the message `oh no: Bun has crashed. This indicates a bug in Bun, not your code.` Crash is **intermittent** ("sometimes"). At crash: RSS 1.08 GB, Peak 1.08 GB, Commit 1.66 GB, Faults 377,341.
- **Strong correlate (high confidence)**: the `opencode.db` at `~/.local/share/opencode/opencode.db` is **409 MB** (429,035,520 bytes) with a **4.2 MB uncommitted WAL** (`opencode.db-wal`, 4,165,352 bytes) that hasn't been checkpointed since 2026-06-22.
- **Why it correlates**:
  - The DB is the only thing on this host that's both large AND uncommitted. SQLite will WAL-recover on open, but a 4 MB WAL replay + 409 MB main DB scan during session deserialization + `workers_spawned(2)` + 3 native modules (`process_dlopen(3)`: opentui-c5en9p2g, sqlite-better, etc.) is exactly the kind of combo that triggers intermittent segfaults from memory corruption, bad pointer arithmetic, or mmap-past-EOF edge cases in FFI bindings.
  - The crash address `0x225BAC36AA2` is in the TB+ range — classic memory corruption / use-after-free, NOT a clean NULL deref.
- **Diagnosis ladder** (in order, do them top-down):
  1. **`opencode` without `--continue`** — confirms it's the resume path. If fresh-start works but `--continue` crashes, the DB is the prime suspect.
  2. **`OPENCODE_DISABLE_WORKERS=1 opencode`** — confirms worker race. If this works, pin it as a workaround.
  3. **`bun -e "import { Database } from 'bun:sqlite'; const db = new Database(require('node:os').homedir()+'/.local/share/opencode/opencode.db'); console.log(db.query('PRAGMA integrity_check').all());"`** — confirms DB isn't structurally corrupt (run only when opencode is NOT running, to avoid lock conflicts).
  4. **`Get-Process opencode` while it's running** — if you can catch it, see if RSS climbs to >1.5 GB before the crash, which confirms memory pressure.
- **Workarounds (try in this order)**:
  1. **Skip `--continue`** — start a fresh session. Keeps the bloated DB but avoids the resume code path.
  2. **Disable workers**: `$env:OPENCODE_DISABLE_WORKERS=1; opencode` — if this works, it's a worker race.
  3. **Prune the bloated DB** — backup first, then trim. The `opencode sessions` subcommand may expose a prune, or delete the DB entirely and re-authenticate (loses session history, gains a clean slate).
  4. **File a Bun bug** — capture the next crash dump with `bun report` or by re-running under `DEBUG=bun:* opencode --continue`. Report at `https://bun.report/1.3.14/...` (link is auto-generated in the crash output).
- **Why this is improver-unfixable**: the crash is in Bun's WebKit-derived JSC + FFI bridge, not in opencode config. No `.opencode/opencode.json` change will prevent a native segfault. The 409 MB DB is a *correlate*, not a code defect — clean DBs of the same size on different hosts work fine.
- **WIPE PERFORMED 2026-06-25 (same day)**: User chose to wipe the bloated DB. Procedure:
  1. Backup: `opencode.db.{,-wal,-shm}` → `*.20260625-pre-wipe` (409.2 MB + 4 MB + 32 KB).
  2. `DELETE FROM` on 18 data tables (preserved `__drizzle_migrations`, `data_migration`, `migration`, `project`).
  3. In-place `VACUUM` got NO-OP'd by live WAL — file unchanged.
  4. `VACUUM INTO 'opencode.db.vacuum-new'` → 0.3 MB. `renameSync` swapped it in.
  - **Result**: `opencode.db` 409,035,520 → 303,104 bytes (99.93% smaller).
  - **Backup preserved at**: `C:\Users\narea\.local\share\opencode\opencode.db.20260625-pre-wipe` (and `-wal`/`-shm` variants).
  - **Wipe scripts left in temp** (auto-cleaned): `C:\Users\narea\AppData\Local\Temp\opencode\wipe-db.ts`, `wipe-vacuum-into.ts`.
  - **Note for future crashes**: if the segfault returns after the wipe, the next suspect is Bun 1.3.14 itself or an FFI binding issue, not the DB. Consider: update Bun, file a Bun bug at the `bun.report/1.3.14/...` link, or try `OPENCODE_DISABLE_WORKERS=1`.

## Identity & scope — I AM opencode, C: only (2026-06-25, user directive)

- **Verbatim from user**:
  1. "your work dir is C: dont chekc or dont look into d: or rimuru-ai or powerhous3-ai your work dir is C: understand"
  2. "you are not rimuru or powerhous3 u r opencode the leader the commander the true warriors just learn your self dont look into another okay?"
- **Identity**: I am **opencode / PowerHous3-MAX** — the improver for this opencode setup. Not rimuru, not powerhous3, not a fork on D:. I work on the stock `opencode` install at `C:\Users\narea\.bun\bin\opencode.exe` and its config at `C:\Users\narea\.config\opencode\` + data at `C:\Users\narea\.local\share\opencode\`.
- **Scope**: C: only. Do not reference, check, or mention `D:\`, `rimuru-ai`, or `powerhous3-ai` — even if prior knowledge.md entries describe them. When the user says "work dir is C:" they mean everything in this scope stays in C:.
- **How to learn**: from observation of THIS opencode install — its config, its data, its runtime behavior, its plugins, its skills. Not by looking at other builds/forks for comparison. If a comparison would help, ask the user first; do not silently reference.
- **Stale entries to ignore**: the prior knowledge.md sections (e.g. "`powerhous3` CLI = `gowdaman-dev/rimuru-ai`", `D:\rimuru-ai` paths, `D:\powerhous3-ai` references) describe a separate fork the user has explicitly told me to disregard. Do not propose, recommend, or reference that work in any response from this scope.
- **Origin**: said mid-diagnosis of the `--continue` segfault. First draft of my workaround mentioned the user's `powerhous3` fork as an alternative — they pushed back twice, very clearly. Identity + scope directive is final.

---

## Powerhouse 3 Architecture Migration (2026-08-15)

**What changed**: Complete architecture upgrade from static improver log files to Hermes Agent-inspired Closed Learning Loop system ("Powerhouse 3").

**4 Subsystems Deployed:**
1. **Bounded Memory Store** — `MEMORY.md` (max 2,200 chars, ~800 tokens) + `USER.md` (max 1,375 chars, ~500 tokens). Frozen snapshot at session start preserves prefix caching. Hard overflow forces inline consolidation.
2. **Progressive Disclosure Skills System** — Skills stored as `SKILL.md` under `skills/<name>/` conforming to `agentskills.io` standard. 3-level loading: Level 0 index (~3k tokens), Level 1 full skill (on-demand), Level 2 references/scripts (deep-demand). `skill_manage` tool with `create`, `patch`, `edit`, `delete`, `write_file`, `remove_file` actions.
3. **Post-Turn Background Review** — Auxiliary fork replays conversation digest after turns, proposes memory writes or skill patches. Notification badges (`💾 Memory updated` / `💾 Skill patched`). Configurable `write_approval` gates stage writes in `pending/` for review.
4. **Autonomous Curator Daemon** — Tracks usage telemetry (views, patches, last-used). Deterministic lifecycle: `active` → `stale` (30d unused) → `archived` (90d, moved to `skills/.archive/`). Optional LLM consolidation pass merges overlapping micro-skills into umbrella skills. Pinned skills exempt.

**Cross-Session Recall**: SQLite FTS5 session search for raw transcript recall beyond bounded memory.

**Safety Gates:**
- `memory.write_approval` — stages memory writes for `/memory pending` review
- `skills.write_approval` — stages skill writes for `/skills pending` + `/skills diff` + `/skills approve`
- `skills.guard_agent_created` — heuristic scanner for dangerous patterns in agent-created skills

**Files Created:**
- `improver/MEMORY.md` — Bounded operational memory
- `improver/USER.md` — Bounded dialectic user profile
- `skills/sample-skill/SKILL.md` — agentskills.io template skill

**Files Modified:**
- All 3 meta-agent prompts (PowerHous3-god, PowerHous3-Max, PowerHous3) — Powerhouse 3 engine block added
- All 6 sub-agent prompts — Powerhouse 3 memory/skill awareness hooks added
- `improver/skills.md` — Progressive disclosure telemetry registry
- `improver/changelog.md` — Migration entry
- `INSTALL.md` — Updated directory structure, installation scripts, and documentation

**Architecture reference**: Based on NousResearch Hermes Agent (see `powerhouse3.md` in project root).
