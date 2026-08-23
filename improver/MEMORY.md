# Declarative Bounded Memory (MEMORY.md)
<!-- HARD BOUND: 2,200 characters (~550 tokens). Overflow forces inline consolidation. -->

## Operational Environment
- **OS**: Linux / WSL2 kernel 6.18.33
- **Primary Agent Framework**: OpenCode Custom Setup (Powerhouse 3 Architecture)
- **Default Meta-Agent**: PowerHous3-GOD (unrestricted execution, full bash permissions)

## Durable Conventions & Guidelines
- **Code Graph Strategy**: Native search first by default; query `graphify query` only when a graph already exists and the question is structural.
- **Skill Format Standard**: All skills conform to `agentskills.io` standard in `~/.config/opencode/skills/`.
- **Memory Snapshot Immutability**: Memory is read at session start as a frozen snapshot. Writes persist to disk immediately but reload into prompt on subsequent session starts.
- **Background Review & Approval**: Post-turn aux review extracts durable facts. Staged writes land in `pending/` when the write-approval convention is enabled.
- **Role-Scoped Protocol**: Primary agents read/write the memory store; sub-agents consume dispatcher task specs and never append to shared logs (race prevention).
