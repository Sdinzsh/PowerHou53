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
