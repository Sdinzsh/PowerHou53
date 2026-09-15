---
name: playwright
description: "Browser automation, web testing, dynamic scraping, and visual verification using Playwright and agent-browser CLI. Supports DOM snapshots with @eN element references, form interactions, and screenshot validations."
metadata:
  category: automation
  tags: playwright,browser-automation,testing,webfetch,websearch,scraping
  verified: "2026-08-16"
  provenance: agent-created
---

# Playwright & Browser Automation Skill

This skill defines procedures for dynamic web research, interactive UI automation, visual regression testing, and web scraping using **Playwright** and the Rust-native **`agent-browser`** engine.

## When to Use
- Interacting with client-side rendered (SPA) web applications requiring JavaScript execution.
- Automated end-to-end (E2E) testing and visual QA verification.
- Filling out forms, logging into authenticated portals, and multi-step browser workflows.
- Capturing screenshots, inspecting DOM snapshots with `@eN` references, and scraping dynamic data.
- Live verification of local development servers (e.g. `localhost:3000`, `localhost:5173`).

---

## Tool Selection & Decision Rules

1. **Static Content**: If a target URL is static HTML, prefer `webfetch` or curl to save memory and execution tokens.
2. **Dynamic / Interactive**: If the page requires JavaScript, clicks, navigation, or visual inspection, use **`agent-browser`** / **Playwright**.
3. **Token Discipline**: Use `@eN` compact element references from DOM snapshots instead of raw HTML dumps.

---

## Command Examples (`agent-browser` CLI)

### 1. Open URL and Extract Information
```bash
# Open URL and return JSON summary
agent-browser open https://example.com --json

# Open local development server
agent-browser open http://localhost:5173
```

### 2. Capture DOM Snapshot with Element References
```bash
# Returns an interactive tree of elements with short identifiers (@e1, @e2, etc.)
agent-browser snapshot
```

### 3. Interact with Page Elements
```bash
# Click a button or link using its snapshot ID or CSS selector
agent-browser click @e3

# Fill input fields
agent-browser fill @e4 "admin@example.com"
agent-browser fill @e5 "test-password"

# Submit or press key
agent-browser press Enter
```

### 4. Capture Visual Proof (Screenshots)
```bash
# Capture full-page screenshot
agent-browser screenshot --full out/test-results.png

# Capture specific element
agent-browser screenshot @e2 out/header.png
```

---

## Playwright Python / TypeScript Scripting Workflow

When automated test suites or complex multi-step scripts are needed:

### Python Example:
```python
import asyncio
from playwright.async_api import async_playwright

async def verify_login_flow():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Navigate to target
        await page.goto("http://localhost:3000/login")
        
        # Fill credentials
        await page.fill('input[name="username"]', "testuser")
        await page.fill('input[name="password"]', "password123")
        await page.click('button[type="submit"]')
        
        # Wait for navigation / assertion
        await page.wait_for_url("http://localhost:3000/dashboard")
        assert await page.is_visible("text=Welcome back")
        
        # Take screenshot verification
        await page.screenshot(path="dashboard-verified.png")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_login_flow())
```

---

## Quality Gates & Verification Checklist

- [ ] Dev server is up and responsive before opening browser
- [ ] Captured token-efficient snapshots (`@eN`) rather than full raw HTML dumps
- [ ] Confirmed successful navigation or state change
- [ ] Captured screenshot artifact for visual confirmation
