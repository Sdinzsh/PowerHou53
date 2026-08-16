---
name: graphify
description: "Run Graphify to build and query deterministic codebase knowledge graphs, trace execution paths, record work memory outcomes, and compile reflection overlays into LESSONS.md."
category: memory
tags: [knowledge-graph, ast, tree-sitter, self-improving, reflection, memory]
verified: 2026-08-16
provenance: agent-created
---

# Graphify Knowledge Graph & Self-Improvement Engine

Graphify transforms source code, schemas, and documentation into a deterministic, queryable knowledge graph. It provides external structured memory and an active reflection loop that enables agents to learn continuously across sessions without fine-tuning model weights.

## When to Use
- Navigating and exploring an unfamiliar codebase without doing raw file sweeps.
- Tracing execution dependencies and call graphs between components (`graphify path`).
- Understanding central architectural hubs and God Nodes (`graphify explain`).
- Recording problem-solving outcomes into work memory (`graphify save-result`).
- Periodically compiling work memory into `LESSONS.md` and node overlays (`graphify reflect`).

---

## 🏗️ Architectural Foundations

### 1. Dual-Pass Extraction (Facts vs Inferences)
- **Pass 1 (Deterministic AST)**: Parsed locally using Tree-sitter across 36 languages. Produces factual code edges tagged `EXTRACTED` (imports, function calls, class inheritance, routing). Zero hallucination risk, zero LLM token cost.
- **Pass 2 (Semantic Layer)**: Resolves markdown documentation, schemas, and comments into conceptual edges tagged `INFERRED`.
- **Ambiguity Marking**: Dynamic dispatch or unresolved references are tagged `AMBIGUOUS` to flag zones that require explicit testing.

### 2. Communities & God Nodes
- **Leiden Clustering**: Partitions the graph into structural subsystems/communities.
- **God Nodes**: Surfaces central architectural hubs that the majority of dependencies flow through.

---

## 🔍 Core Query & Maintenance Workflows

Always query the graph before reading raw files:

### 1. Incremental Update & Re-extraction
```bash
# Re-parse changed files using SHA256 per-file caching
graphify update .
```

### 2. Installing Git Hooks & Smart-Grep Intercepts
```bash
# Install post-commit and post-checkout hooks for background auto-rebuilds
graphify hook install
```
*Smart-Grep Hook*: Intercepts raw `grep`/`rg`/`find` calls and rewrites them into `graphify query` first (bypass with `# --graph-tried`).

### 3. Querying Subgraph Context
```bash
# Query relevant concepts and return a scoped subgraph (~71.5x token reduction)
graphify query "How does authentication middleware validate JWT tokens?"
```

### 4. Shortest Path Traversal
```bash
# Trace direct structural connection between two components
graphify path "AuthController" "DatabaseConnectionPool"
```

### 5. Deep Entity Neighborhood & Provenance
```bash
# Explain a node, its neighbors, and provenance tags
graphify explain "src/services/payment.service.ts"
```

### 6. Obsidian Vault Sync ("Second Brain")
```bash
# Copy GRAPH_REPORT.md to local Obsidian vault for persistent cross-session knowledge
cp graphify-out/GRAPH_REPORT.md ~/ai-vault/graphify/GRAPH_REPORT.md
```

---

## 🔄 The Closed Learning Loop (Work Memory & Reflection)

The self-improving mechanism operates via a 4-step episodic cycle:

```
[Query Graph] ──► [Execute Action] ──► [Save Result to Memory] ──► [Reflect & Update Overlay]
```

### Step 1: Record Experience (`graphify save-result`)
Every time an agent solves an issue, encounters a dead end, or receives a correction, it records the outcome into work memory:
```bash
graphify save-result \
  --question "Why did the database connection drop during high load?" \
  --answer "Connection pool size was default 5; increased maxConnections to 50 in db.config.ts" \
  --nodes "DatabasePool,ConnectionManager,db.config.ts" \
  --outcome useful
```
*Valid Outcomes:*
- `useful`: Successfully solved the problem without side effects.
- `dead_end`: Investigated path did not lead to a solution.
- `corrected`: Solution had errors and was corrected by user or test failure.

### Step 2: Aggregate Lessons (`graphify reflect`)
Periodically run reflection to compress episodic logs into `LESSONS.md` and generate the `.graphify_learning.json` overlay:
```bash
graphify reflect --graph graphify-out/graph.json --if-stale
```

### Step 3: Learning Overlay & Node Tagging
Reflection dynamically annotates nodes in future queries:
- **`preferred`**: Consistently successful patterns and functions.
- **`tentative`**: Insufficient data; proceed with caution.
- **`contested`**: Conflicting past results; review before choosing.

### Step 4: Source-Drift Invalidation
If source code changes for a tagged node, the engine marks the lesson:
`⚠️ code changed — re-verify`
This guarantees the agent never blindly follows stale memories.

---

## Output Visualizations

- **`graph.html`**: Interactive force-directed 3D/2D browser visualization.
- **`GRAPH_REPORT.md`**: Textual summary of bottlenecks, God Nodes, and architectural suggestions.
- **`graph.json`**: NetworkX-compliant graph data file.

---

## Quality Gates & Verification Checklist

- [ ] `graphify-out/graph.json` exists and is non-empty before querying
- [ ] Checked for `EXTRACTED` vs `INFERRED` edge provenance in query output
- [ ] Recorded task outcomes with `graphify save-result` after significant actions
- [ ] Verified that `LESSONS.md` and `.graphify_learning.json` were generated during `graphify reflect`
- [ ] Checked for `⚠️ code changed — re-verify` invalidation flags on updated files
