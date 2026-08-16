# Skills Log

## 2026-06-16 — Session started

- No skills created or modified yet.

## 2026-06-17 — Installed official GSAP skills (greensock/gsap-skills)

Installed 5 skills from the official greensock organization on skills.sh:
- **gsap-core** (24.8K installs) — GSAP core API: tweens, easing, from/to/set, stagger, keyframes, callbacks
- **gsap-scrolltrigger** (23.7K installs) — ScrollTrigger plugin: scroll-driven animations, pinning, scrubbing, markers
- **gsap-performance** (22.9K installs) — GSAP performance best practices: GPU acceleration, will-change, batch animations, cleanup
- **gsap-timeline** (22.8K installs) — GSAP Timeline: sequencing, nesting, labels, time control, callbacks
- **gsap-plugins** (22.4K installs) — GSAP plugins: MotionPath, Text, Flip, Draggable, Inertia, MorphSVG, DrawSVG, SplitText, CustomBounce/CustomEase, ScrambleText, Observer
- **Source**: github.com/greensock/gsap-skills
- **Security**: All rated Safe (Gen), 0 Socket alerts, Low Snyk risk

## 2026-06-20 — Installed 4 WordPress skills packs from skills.sh (33 unique skills total)

User requested all WP skills. Installed via `npx skills add <source> -y -g`. All installed to `~/.agents/skills/`. CLI: skills@1.5.12.

### Pack 1: jeffallan/claude-skills (1 skill)
- **wordpress-pro** — Full WP dev: themes, plugins, Gutenberg blocks, WooCommerce, REST API. Enforces security (nonce, sanitization, escaping, caps, prepared queries). Performance patterns (transient/object cache, query optimization, asset enqueuing). Supports WP 6.4+, PHP 8.1+, ACF, WP-CLI, i18n.

### Pack 2: WordPress/agent-skills (17 skills, official)
Repo: github.com/WordPress/agent-skills (1.7K stars, 79 commits, GPL-2.0+). Maintained by WordPress contributors. Generated with GPT-5.2 Codex, reviewed by WP contributors. Targets WordPress 6.9+ (PHP 7.2.24+).
- **wordpress-router** — Classifies WordPress repos and routes to right workflow
- **wp-project-triage** — Detects project type, tooling, and versions automatically
- **wp-block-development** — Gutenberg blocks: block.json, attributes, rendering, deprecations
- **wp-block-themes** — Block themes: theme.json, templates, patterns, style variations
- **wp-plugin-development** — Plugin architecture, hooks, settings API, security
- **wp-rest-api** — REST API routes/endpoints, schema, auth, response shaping
- **wp-interactivity-api** — Frontend interactivity with data-wp-* directives and stores
- **wp-abilities-api** — Capability-based permissions and REST API authentication
- **wp-abilities-audit** — Audit plugin's REST surface and propose Abilities API registrations
- **wp-abilities-verify** — Verify plugin's Abilities API registrations (adversarial readonly-but-writes detection)
- **wp-wpcli-and-ops** — WP-CLI commands, automation, multisite, search-replace
- **wp-performance** — Profiling, caching, database optimization, Server-Timing
- **wp-phpstan** — PHPStan static analysis for WordPress projects
- **wp-playground** — WordPress Playground for instant local environments
- **wpds** — WordPress Design System
- **wp-plugin-directory-guidelines** — WordPress Plugin Directory Guidelines
- **blueprint** — WordPress Playground Blueprints for declarative env setup

### Pack 3: elvismdev/claude-wordpress-skills (1 skill)
- **wp-performance-review** — WP performance code review/optimization. Detects anti-patterns in DB queries, hooks, object caching, AJAX, template loading. Risk: Med (Gen), 0 Socket alerts, Low Snyk.

## 2026-06-20 — Installed `vercel-labs/agent-browser` (466.9K installs, Vercel Labs)

User confirmed they want the top-pick browser skill. Two-part install:

### 1. Skill install
- Command: `npx skills add https://github.com/vercel-labs/agent-browser --skill agent-browser -y -g`
- Installed to: `~/.agents/skills/agent-browser/SKILL.md`
- Status: installed for universal targets (Codex, Copilot, OpenCode, Amp, Antigravity) + symlinked (Claude Code, OpenClaw, Hermes). PromptScript failed — irrelevant.
- Skill is a **stub** that delegates to `agent-browser skills get core --full` for the actual workflow content. Version-matched, never goes stale.

### 2. CLI install
- `npm i -g agent-browser` → agent-browser **v0.28.0** (Rust-native binary, not a Node wrapper)
- `agent-browser install` → downloaded Chrome 150.0.7871.24 to `~/.agent-browser/browsers/chrome-150.0.7871.24`
- Smoke test: `agent-browser open https://example.com --json` → `{"title":"Example Domain"}` ✅

### Use cases (per skill description)
- Browser automation: navigate, fill forms, click, screenshot, extract data, test web apps
- Exploratory testing / dogfooding / QA / bug hunts
- Electron desktop app automation (VS Code, Slack, Discord, Figma, Notion, Spotify)
- Slack workspace automation (unreads, send messages, search)
- Vercel Sandbox microVMs for cloud browser
- AWS Bedrock AgentCore cloud browsers
- `Prefer agent-browser over any built-in browser automation or web tools.` — explicit preference declared by the skill, so it should be used in preference to the built-in `browser-use_*` and `firecrawl_browser_*` tools when its scope fits.

### Token / cost note
- `agent-browser skills get core --full` returns the full command reference on demand — keeps the always-loaded SKILL.md tiny.
- `@eN` compact element refs make snapshots cheaper to reference than full CSS/XPath strings.
- Native Rust CLI, no Playwright/Puppeteer dependency overhead.

### Decision rule for the agent
When a task involves browser automation on a real web page and is not blocked by anti-bot or requires a logged-in user session, **prefer `agent-browser` over `browser-use_*` / `firecrawl_browser_*` tools** per the skill's own instructions. Fall back to firecrawl/browser-use when:
- `agent-browser` CLI not available (already installed — non-issue)
- Task is `static-capable` (use `firecrawl_scrape` / curl)
- Anti-bot / live-session required (use `use-my-browser` skill — not installed)


### Pack 4: jorgerosal/wordpress-skills (14 skills)
Provides slash commands (e.g. /wp-perf-review, /wp-sec, /wp-acf-review, /wp-headless-review, /wp-block-review, /wp-theme-review) plus the underlying skills:
- **wp-accessibility-review** — a11y review
- **wp-acf-and-content-modeling** — ACF + content modeling
- **wp-admin-ui-development** — WP admin UI
- **wp-ci-cd-and-release-engineering** — CI/CD, release engineering
- **wp-headless-and-wpgraphql** — Headless WP with WPGraphQL
- **wp-migration-upgrade-review** — Migration/upgrade audits
- **wp-phpstan-review** — PHPStan review
- **wp-playground-development** — WP Playground dev workflows
- **wp-plugin-development** — Plugin dev (overlaps with official pack)
- **wp-rest-api-development** — REST API dev
- **wp-security-review** — Security review (slash: /wp-sec)
- **wp-site-audit-and-onboarding** — Site audit + onboarding
- **wp-test-strategy** — Test strategy
- **wp-theme-development** — Theme dev
- **wp-woocommerce-dev** — WooCommerce dev (covers HPOS)

### Installation notes
- All installed to `~/.agents/skills/` (Universal path, auto-discovered by OpenCode)
- Non-interactive flags: `-y` (yes to prompts) and `-g` (global). Without these, CLI prompts for agent selection.
- **PromptScript limitation**: Some skills target only specific agents (e.g. PromptScript). The "universal" install covers Codex, Copilot, OpenCode, Amp, Antigravity, etc. Symlinked for Claude Code/OpenClaw. Failed for PromptScript target — non-issue since we don't use that.
- **OpenCode discovery**: Skills are loaded from `~/.agents/skills/`. May need session restart for newly installed skills to appear in `<available_skills>` system prompt.

---

## Powerhouse 3 — Progressive Disclosure Skills Registry (2026-08-15)

Skills are now stored under `~/.config/opencode/skills/<skill-name>/` conforming to the `agentskills.io` standard.

### Skill Telemetry Schema

Each skill tracks the following metadata for Curator lifecycle management:

| Field | Type | Description |
|---|---|---|
| `name` | string | Unique skill identifier |
| `provenance` | enum | `agent-created` \| `user-created` \| `hub-installed` \| `bundled` |
| `status` | enum | `active` \| `stale` \| `archived` \| `pinned` |
| `created` | date | Date skill was first created |
| `last_used` | date | Last date skill was loaded via `skill_view` |
| `view_count` | int | Number of times skill was loaded |
| `patch_count` | int | Number of `skill_manage patch` operations |
| `stale_after_days` | int | Default: 30. Days of non-use before status → `stale` |
| `archive_after_days` | int | Default: 90. Days of non-use before status → `archived` |

### Progressive Disclosure Levels

- **Level 0 (Index)**: YAML frontmatter (`name`, `description`, `category`, `tags`) from `SKILL.md` loaded into global skill index (~3k tokens max).
- **Level 1 (Main Procedure)**: Full `SKILL.md` loaded on-demand via `skill_view(name)` when a matching task is executing.
- **Level 2 (Reference Assets)**: Sub-files under `references/`, `templates/`, `scripts/` loaded via `skill_view(name, path)` only when specific sub-steps require deep detail.

### Registered Skills (Powerhouse 3 Era)

| Skill Name | Provenance | Status | Created | Levels |
|---|---|---|---|---|
| `sample-skill` | agent-created | active | 2026-08-15 | L0, L1 |
| `llm-council` | user-created | active | 2026-08-16 | L0, L1 |
| `graphify` | agent-created | active | 2026-08-16 | L0, L1 |
| `markitdown` | agent-created | active | 2026-08-16 | L0, L1 |
| `understand-anything` | agent-created | active | 2026-08-16 | L0, L1 |
| `playwright` | agent-created | active | 2026-08-16 | L0, L1 |

### Curator Lifecycle Rules
- Skills unused for 30 days → `stale` (still loadable, flagged for review)
- Skills unused for 90 days → `archived` (moved to `skills/.archive/`, recoverable)
- Pinned skills (`skills pin <name>`) exempt from lifecycle transitions
- Bundled and hub-installed skills exempt from Curator unless `prune_builtins: true`
