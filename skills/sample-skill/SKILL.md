---
name: sample-skill
description: Template procedural skill demonstrating agentskills.io standard and Powerhouse 3 progressive disclosure loading.
metadata:
  category: workflow
  tags: template,powerhouse3,skills
  verified: "2026-08-15"
  provenance: agent-created
---

# Sample Procedural Skill (agentskills.io)

## When to Use
- When creating a new procedural workflow or documenting a verified technical procedure.
- When an agent completes a complex task (5+ tool calls) or resolves a non-trivial error and wants to make the procedure repeatable.

## Verified Procedure
1. Create the skill folder under `~/.config/opencode/skills/<skill-name>/` (name must match `^[a-z0-9]+(-[a-z0-9]+)*$`).
2. Write the core procedure in `SKILL.md` with recognized frontmatter (`name`, `description`, optional `metadata`).
3. If detailed documentation or scripts are needed, create sub-files in `references/` or `scripts/` and read them on demand.
4. Register the skill entry in `improver/skills.md` for Curator telemetry tracking.

## Minimal Code Example
```bash
mkdir -p ~/.config/opencode/skills/example-workflow/references
# then write SKILL.md into that folder with your editor/file tools
```

## Pitfalls & Gotchas
- OpenCode only recognizes `name`, `description`, `license`, `compatibility`, `metadata` frontmatter fields — anything else is silently ignored, so keep provenance/status inside `metadata`.
- Avoid bloated prose in `SKILL.md`; the body loads fully on demand, so conciseness keeps token cost low.
- Put deep API references or heavy templates under `references/` so they load only when explicitly read.

## Verification
- Confirm the skill appears in `<available_skills>` and loads cleanly via `skill({ name: "<skill-name>" })`.
