# Plugins & MCP Servers

## 2025-06-17
- **firecrawl** — MCP server added (remote, global)
  - URL: https://mcp.firecrawl.dev/{API_KEY}/v2/mcp
  - Tools: firecrawl_scrape, firecrawl_search, firecrawl_map, firecrawl_crawl, firecrawl_extract, firecrawl_agent, firecrawl_browser_*, firecrawl_interact
  - API key embedded in URL path, no additional env vars needed
  - Status: enabled

## 2026-06-22
- **postman** — MCP server added (remote, OAuth, global)
  - URL: https://mcp.postman.com/minimal
  - Source: https://github.com/postmanlabs/postman-mcp-server (v2.9.1, 265 stars, official)
  - Auth: OAuth (MCP Authorization spec compliant) — no API key needed, browser prompt on first use
  - Config: **minimal** (default — ~15 tools for collections/workspaces/environments/requests)
  - Alternatives: `/code` (adds client-code generation) or `/mcp` (full — 100+ tools, Enterprise)
  - Backups: `opencode.json.bak-20260622-postman` (in `~/.config/opencode/`)
  - Switch to richer config: change URL to `https://mcp.postman.com/code` or `https://mcp.postman.com/mcp`
  - Status: enabled
  - Revisit: if user reports they only use a subset of minimal tools, consider switching to `code` or `full`. If OAuth flow fails in this environment, fall back to local with `POSTMAN_API_KEY`.

## 2026-06-22 (later)
- **chrome-devtools** — MCP server added (local, npx, global)
  - Source: https://github.com/ChromeDevTools/chrome-devtools-mcp (v1.3.0, 44.2K stars, 2.9K forks — official Google Chrome team)
  - npm: `chrome-devtools-mcp@latest`
  - Command: `npx -y chrome-devtools-mcp@latest --no-usage-statistics`
  - Tool count: ~30+ tools across input automation (10), navigation (6), emulation (2), performance (3), network (2), debugging (8), memory (9), extensions (5), third-party (2), WebMCP (2)
  - **Usage statistics opt-out by default** — Google's data collection disabled via `--no-usage-statistics` flag. Disable also via `CHROME_DEVTOOLS_MCP_NO_USAGE_STATISTICS` or `CI` env vars (auto-detected).
  - **Update checks ON** — periodically checks npm for newer versions, logs notification. Disable via `CHROME_DEVTOOLS_MCP_NO_UPDATE_CHECKS=1` env var if desired.
  - **Requirements verified**: Chrome 148.0.7778.181 (stable) installed at `C:\Program Files\Google\Chrome\Application\chrome.exe`, Node v24.15.0, npm 11.12.1
  - **Performance tools send trace URLs to Google CrUX API** by default — opt out via `--no-performance-crux`
  - **Browser auto-launches on first tool call** that needs a live browser instance (per-page navigation, screenshot, performance trace, etc.). Connects to a running Chrome instead via `--browserUrl=http://127.0.0.1:9222` if you already have one open with remote debugging.
  - **Slim mode** (3 tools only — navigation, script eval, screenshot) available via `--slim` flag — useful if token cost of the full ~30 tool schemas is too high
  - Backups: `opencode.json.bak-20260622-chromedevtools` (in `~/.config/opencode/`)
  - Status: enabled (restart OpenCode session for MCP to load)
  - Revisit: if user finds the ~30 tool schemas too costly, switch to `--slim` mode. If user wants the official Google-maintained agent-browser skill bundled with this MCP, install via Claude Code plugin marketplace: `/plugin install chrome-devtools-mcp@chrome-devtools-plugins` (the repo also includes skills/, but OpenCode reads from `~/.agents/skills/` — would need manual copy from the GitHub repo).
  - **Overlaps with existing tooling**: `firecrawl` MCP (web scraping/extraction), `browser-use` (Python-based browser automation), `vercel-labs/agent-browser` skill+CLI (Rust-based CDP automation). Chrome DevTools MCP is the most feature-rich for in-browser debugging/performance analysis; others are better for pure scraping/automation.

## 2026-06-25 — `google-drive` (remote, official, OAuth, global)

- **Source**: https://developers.google.com/workspace/drive/api/guides/configure-mcp-server (Google's official Drive MCP server, hosted at `https://drivemcp.googleapis.com/mcp/v1`)
- **Why official**: not a community fork — backed by Google Workspace team. Won't be abandoned.
- **8 tools** (modest schema cost): `copy_file`, `create_file`, `download_file_content`, `get_file_metadata`, `get_file_permissions`, `list_recent_files`, `read_file_content`, `search_files`
- **Auth**: MCP Authorization spec (browser-based OAuth via Google sign-in) — no client ID/secret needed in config. Same flow as Figma/Postman MCPs.
- **Scopes used**: `drive.readonly` + `drive.file` (no full Drive access — least-privilege, requested at sign-in)
- **Config**:
  ```json
  "google-drive": {
    "type": "remote",
    "url": "https://drivemcp.googleapis.com/mcp/v1",
    "enabled": true
  }
  ```
- **No env vars required** (no client ID/secret — auth handled by MCP Authorization spec)
- **First call**: OpenCode opens browser → Google sign-in → consent screen → token cached locally
- **Backup**: `opencode.json.bak-20260625-162935` (with OAuth block); `opencode.json.bak-20260625-163045` (SSO form, current)
- **Status**: enabled, ready to use after OpenCode session restart
- **Use cases**: list/search/read Drive files from agent context, create new files (e.g., export reports, save agent-generated content), download content for local processing, copy/move files
- **Revisit**: if 8 tools are insufficient (no update/delete), look for an alternative Drive MCP. Google's official server is intentionally limited. If browser auth fails, fall back to manual OAuth client (`GOOGLE_DRIVE_OAUTH_CLIENT_ID` + `GOOGLE_DRIVE_OAUTH_CLIENT_SECRET`) — see docstring from earlier today.

## 2026-06-25 (later) — `google-drive` REPLACED: remote (DCR-fail) → local `@modelcontextprotocol/server-gdrive`
- **Trigger**: User tried `google-drive_list_recent_files` → "Incompatible auth server: does not support dynamic client registration". Google's hosted `drivemcp.googleapis.com/mcp/v1` does not support DCR, so it has no way to obtain an OAuth token.
- **Fix**: Switched from `type: "remote"` to `type: "local"` with `npx -y @modelcontextprotocol/server-gdrive` (the official MCP server for Google Drive — same pattern as the working `gmail` MCP).
- **New config**:
  ```json
  "google-drive": {
    "type": "local",
    "command": ["npx", "-y", "@modelcontextprotocol/server-gdrive"],
    "enabled": true,
    "environment": {
      "GDRIVE_CREDENTIALS_PATH": "${POWERHOUS3_GDRIVE_CREDENTIALS_PATH}",
      "GDRIVE_TOKEN_PATH": "${POWERHOUS3_GDRIVE_TOKEN_PATH}"
    }
  }
  ```
- **Backup**: `opencode.json.bak-20260625-164319-gdrive` (the working remote version, kept for reference)
- **JSON validated** post-edit
- **User action required**:
  1. Create a Google Cloud OAuth 2.0 Desktop client (same project as Gmail) → download JSON
  2. Set env vars: `POWERHOUS3_GDRIVE_CREDENTIALS_PATH` (path to the JSON) and `POWERHOUS3_GDRIVE_TOKEN_PATH` (where the generated token will be saved, e.g. `~/.config/opencode/gdrive-token.json`)
  3. First tool call → browser OAuth consent → token auto-saved
- **Status**: enabled, requires env vars + session restart
- **Token cost**: server-gdrive exposes ~10 tools (list, search, read, create, copy, etc.) — similar schema cost to the remote version
- **Revisit**: if the local server-gdrive becomes unmaintained or lacks needed tools, look at community alternatives. Note that Gmail's `@gongrzhe/server-gmail-autoauth-mcp` has no Drive equivalent — only the official server-gdrive mirrors the autoauth pattern well.
