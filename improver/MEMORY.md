# Declarative Bounded Memory (MEMORY.md)
<!-- HARD BOUND: 2,200 characters (~800 tokens). Overflow forces inline consolidation. -->

## Operational Environment
- **OS**: Linux / WSL2 kernel 6.18.33
- **Primary Agent Framework**: OpenCode Custom Setup (Powerhouse 3 Architecture)
- **Default Meta-Agent**: PowerHous3-GOD (unrestricted execution, full bash permissions)

## Durable Conventions & Guidelines
- **Code Graph Optimization**: Prefer `madar pack` over broad glob/grep scans when querying codebase structures.
- **Skill Format Standard**: All skills conform to `agentskills.io` standard in `~/.config/opencode/skills/`.
- **Memory Snapshot Immutability**: Memory is read at session start as a frozen snapshot. Writes persist to disk immediately but reload into prompt on subsequent session starts.
- **Background Review & Approval**: Post-turn aux review extracts durable facts. Staged writes land in `pending/` when `write_approval` is enabled.
