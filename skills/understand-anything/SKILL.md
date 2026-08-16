---
name: understand-anything
description: "Transform any codebase into an interactive knowledge graph using Tree-sitter AST and LLM semantic analysis with Understand-Anything by Egonex-AI. Includes web dashboard, diff-impact analysis, and graph-grounded chat."
category: exploration
tags: [knowledge-graph, ast, architecture, understand-anything, diff-impact, visualization]
verified: 2026-08-16
provenance: agent-created
---

# Understand-Anything Skill

Understand-Anything by Egonex-AI transforms codebases and documentation into an interactive, queryable knowledge graph stored in `.ua/knowledge-graph.json` (or `.understand-anything/`). It combines deterministic Tree-sitter parsing with a multi-agent semantic analysis pipeline.

## When to Use
- Onboarding to a new or unfamiliar codebase.
- Analyzing the ripple effect and blast radius of proposed edits (`/understand-diff`).
- Exploring system architecture visually via force-directed graph dashboard.
- Asking complex architectural questions grounded in code relationships (`/understand-chat`).

## Multi-Agent Compilation Pipeline

When `/understand` runs, it dispatches specialized sub-agents:
1. **`project-scanner`**: Scans file tree, detects build tools, configurations, and project manifests.
2. **`file-analyzer`**: Runs local Tree-sitter AST parsing to extract deterministic syntax facts (imports, exports, function declarations, type signatures).
3. **`architecture-analyzer`**: Performs LLM semantic pass to synthesize module purposes, data flows, and design patterns.
4. **`tour-builder`**: Constructs guided architectural tours for developer onboarding.
5. **`graph-reviewer`**: Validates edge consistency, resolves cyclic dependencies, and assigns confidence tags (`EXTRACTED`, `INFERRED`).

## Verified Commands & Workflows

### 1. Build or Update the Knowledge Graph
```bash
# Analyze current project and generate .ua/knowledge-graph.json
/understand

# Run with auto-update git hook, language selection, and exclusion patterns
/understand --auto-update --language en --exclude "tests/**,vendor/**"
```
*Fingerprint Change Classification*: Detects changes as `NONE`, `COSMETIC`, or `STRUCTURAL` (SHA-256 content + structural AST hashing) to minimize unnecessary re-scans.

### 2. Specialized Multi-Agent Commands
```bash
# Generate guided onboarding documentation walkthrough
/understand-onboard

# Extract business domain mappings, entity flows, and process steps
/understand-domain

# Analyze wiki-style markdown knowledge bases (wikilinks, categories, claims)
/understand-knowledge
```

### 3. Launch Interactive Visual Dashboard
```bash
# Serves interactive force-directed web visualization on local port (token-gated)
/understand-dashboard
```
Features of the dashboard:
- Color-codes nodes by architectural layer (e.g., API, Service, Data, UI, Utility).
- Supports zoom, pan, node filtering, and search.
- Persona-adaptive detail levels (Junior Developer vs. PM vs. Power User).

### 4. Diff-Impact & Blast Radius Analysis
Before making large refactors or modifying shared interfaces, check what will break:
```bash
# Analyze blast radius of uncommitted changes or proposed edits
/understand-diff
```

### 5. Graph-Grounded Natural Language Chat
```bash
# Query architecture grounded in the typed graph
/understand-chat "How does data flow from the API controller to the database?"
```

### 6. Deep-Dive File Explanation
```bash
# Inspect all inbound/outbound relations for a single file
/understand-explain src/auth/session.ts
```

### 7. Zero-LLM Read-Only Viewer (for Team Sharing)
Teammates can view the committed `.ua/knowledge-graph.json` without an LLM key:
```bash
npx https://github.com/Egonex-AI/Understand-Anything/releases/latest/download/understand-anything-viewer.tgz .
```

## Integration with PowerHous3 Self-Improving Loop
- The `.ua/knowledge-graph.json` serves as the primary structural graph.
- Meta-agents and the `explore` sub-agent must consult `.ua/knowledge-graph.json` before performing raw text sweeps.
- When source code changes, run `/understand-diff` to verify downstream consumers.

---

## Quality Gates & Verification Checklist

- [ ] `.ua/knowledge-graph.json` exists and is validated by `graph-reviewer` (no dangling edges)
- [ ] Confirmed structural fingerprint baseline updated in `.ua/meta.json`
- [ ] Ran `/understand-diff` prior to submitting code modifications
- [ ] Verified visual dashboard accessibility via `/understand-dashboard`
- [ ] Checked that git-lfs is configured if `.ua/knowledge-graph.json` exceeds 10 MB
