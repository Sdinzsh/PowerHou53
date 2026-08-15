---
name: sample-skill
description: Template procedural skill demonstrating agentskills.io standard and Powerhouse 3 progressive disclosure loading.
category: workflow
tags: [template, powerhouse3, skills]
verified: 2026-08-15
provenance: agent-created
---

# Sample Procedural Skill (agentskills.io)

## When to Use
- When creating a new procedural workflow or documenting an verified technical procedure.
- When an agent completes a complex task (5+ tool calls) or resolves a non-trivial error and wants to make the procedure repeatable.

## Verified Procedure
1. Create the skill folder under `~/.config/opencode/skills/<skill-name>/`.
2. Write the core procedure in `SKILL.md` (Level 1).
3. If detailed documentation or scripts are needed, create sub-files in `references/` or `scripts/` (Level 2).
4. Register the skill entry in `improver/skills.md` for Curator telemetry tracking.

## Minimal Code Example
```bash
# Register skill with skill_manage
skill_manage create --name "sample-skill" --category "workflow"
```

## Pitfalls & Gotchas
- Avoid writing bloated prose in `SKILL.md`; keep it concise so Level 1 loading remains token-efficient.
- Put deep API references or heavy templates under Level 2 (`references/guide.md`) so they only load when explicitly requested.

## Verification
- Test that `skill_view("sample-skill")` loads Level 1 without errors.
