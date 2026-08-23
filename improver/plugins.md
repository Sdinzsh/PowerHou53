# Plugins & MCP Servers

This file tracks MCP server plugins configured in `opencode.json`. Update this file whenever plugins are added, removed, or reconfigured.

## Template Entry

```
## YYYY-MM-DD — <plugin-name>
- **Type**: local | remote
- **Source**: <URL or npm package>
- **Command/URL**: <how it's invoked>
- **Tools**: <list of key tools provided>
- **Auth**: <auth method — OAuth, API key, none>
- **Status**: enabled | disabled
- **Notes**: <any important caveats, token cost, or overlap with other tools>
```

## Recommended MCP Servers

| Server | Type | Purpose |
|---|---|---|
| `firecrawl` | remote | Web scraping, search, crawling, and data extraction |
| `@modelcontextprotocol/server-gdrive` | local | Google Drive file access (list, search, read, create) |
| `chrome-devtools-mcp` | local | Chrome DevTools debugging, performance profiling, DOM inspection |
| `postman` | remote | API collection management, workspace, and environment access |

## Installed Toolchain

## 2026-08-23 — graphify
- **Type**: local CLI (`uv tool install graphifyy` — note double-y PyPI name)
- **Command**: `graphify` (v0.9.48 at install); skill registered via `graphify install --platform opencode`
- **Tools**: `graphify query|path|explain`, `graphify-mcp` server, project plugin hook (`.opencode/plugins/graphify.js`)
- **Auth**: none for code-only graphs (local tree-sitter); optional backend keys for docs/PDF semantic pass
- **Status**: enabled
- **Notes**: replaced bundled hand-written `skills/graphify/SKILL.md` with vendor-canonical version + `references/`. Keep only one `graphify` skill — duplicate names break discovery.

## 2026-08-23 — markitdown
- **Type**: local CLI (`uv tool install "markitdown[pdf,docx,pptx,xlsx]"`)
- **Command**: `markitdown <file>` (v0.1.7)
- **Auth**: none for core formats; OpenAI/Azure keys only for vision OCR extras
- **Status**: enabled
- **Notes**: avoid `[all]` extra — unsatisfiable `youtube-transcript-api~=1.0.0` pin on PyPI (microsoft/markitdown#2179); install format extras individually.

## 2026-08-23 — agent-browser (+ playwright-cli skills)
- **Type**: global npm CLI + companion skills in `~/.agents/skills/`
- **Source**: vercel-labs/agent-browser v0.34.0; skills `vercel-labs/agent-browser` + `microsoft/playwright-cli@playwright-cli` (128K+ installs) via `npx skills add ... -g`
- **Status**: enabled
- **Notes**: drives the `playwright` skill's automation commands; `agent-browser install` downloads Chrome for Testing.
