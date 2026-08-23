# Skills Log

## Progressive Disclosure Skills Registry

Skills are stored under `~/.config/opencode/skills/<skill-name>/` conforming to the `agentskills.io` standard.

### Skill Telemetry Schema

Each skill tracks the following metadata for Curator lifecycle management:

| Field | Type | Description |
|---|---|---|
| `name` | string | Unique skill identifier |
| `provenance` | enum | `agent-created` \| `user-created` \| `hub-installed` \| `bundled` |
| `status` | enum | `active` \| `stale` \| `archived` \| `pinned` |
| `created` | date | Date skill was first created |
| `last_used` | date | Last date skill body was loaded via the native `skill` tool |
| `view_count` | int | Number of times skill was loaded |
| `patch_count` | int | Number of patch (diff edit) operations on the skill |
| `stale_after_days` | int | Default: 30. Days of non-use before status → `stale` |
| `archive_after_days` | int | Default: 90. Days of non-use before status → `archived` |

### Progressive Disclosure Levels

- **Index**: Frontmatter `name` + `description` auto-listed by OpenCode's native `skill` tool (`<available_skills>`); only `name`, `description`, `license`, `compatibility`, `metadata` frontmatter fields are recognized.
- **Procedure**: Full `SKILL.md` loaded on demand via `skill({ name })` when a matching task is executing.
- **References**: Sub-files under `references/`, `templates/`, `scripts/` read with the read tool only when specific sub-steps require deep detail.

Skills are created/patched by editing their `SKILL.md` directly (small diffs preferred over rewrites). Telemetry below is maintained manually/conventionally in this registry.

### Registered Skills

| Skill Name | Provenance | Status | Created | Levels | Purpose |
|---|---|---|---|---|---|
| `understand-anything` | agent-created | active | 2026-08-16 | L0, L1 | Codebase AST knowledge graph, dashboard, diff-impact analysis |
| `graphify` | agent-created | active | 2026-08-16 | L0, L1 | Self-improving reflection loop, work memory, LESSONS.md |
| `markitdown` | agent-created | active | 2026-08-16 | L0, L1 | Multi-modal document & media ingestion to Markdown |
| `playwright` | agent-created | active | 2026-08-16 | L0, L1 | Headless browser automation, DOM snapshots, visual QA |
| `llm-council` | user-created | active | 2026-08-16 | L0, L1 | 5-advisor peer-review decision framework |
| `sample-skill` | agent-created | active | 2026-08-15 | L0, L1 | Template procedural skill for reference |

### Curator Lifecycle Rules
- Skills unused for 30 days → `stale` (still loadable, flagged for review)
- Skills unused for 90 days → `archived` (moved to `skills/.archive/`, recoverable)
- Pinned skills (`skills pin <name>`) exempt from lifecycle transitions
- Bundled and hub-installed skills exempt from Curator unless `prune_builtins: true`
