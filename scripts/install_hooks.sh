#!/bin/sh
# PowerHous3 — activate the closed-loop git hooks in this repo.
#
# The hooks live in .githooks/ but git ignores them until core.hooksPath points
# there. This script wires that path, marks the hooks executable, and verifies
# the gate runs. Idempotent: safe to re-run.
#
# Usage:  scripts/install_hooks.sh          # wire + verify
#         scripts/install_hooks.sh --check  # verify only (no changes)
set -eu

ROOT=$(git rev-parse --show-toplevel 2>/dev/null || true)
if [ -z "$ROOT" ]; then
  echo "[install-hooks] ERROR: not inside a git repository." >&2
  exit 2
fi

HOOKS_DIR="$ROOT/.githooks"
if [ ! -d "$HOOKS_DIR" ]; then
  echo "[install-hooks] ERROR: $HOOKS_DIR not found." >&2
  exit 2
fi

if [ "${1:-}" = "--check" ]; then
  current=$(git -C "$ROOT" config --get core.hooksPath || true)
  if [ "$current" = ".githooks" ]; then
    echo "[install-hooks] OK: core.hooksPath=.githooks"
    exit 0
  fi
  echo "[install-hooks] NOT wired (core.hooksPath='${current:-unset}'). Run: scripts/install_hooks.sh" >&2
  exit 1
fi

chmod +x "$HOOKS_DIR/pre-commit" "$HOOKS_DIR/post-commit" 2>/dev/null || true
git -C "$ROOT" config core.hooksPath .githooks

echo "[install-hooks] wired core.hooksPath=.githooks"

# Smoke-test the gate so a broken interpreter path surfaces now, not at commit.
PY=""
for cand in python3 python py; do
  if command -v "$cand" >/dev/null 2>&1; then PY="$cand"; break; fi
done
if [ -n "$PY" ]; then
  if "$PY" "$ROOT/scripts/loop_check.py" >/dev/null 2>&1; then
    echo "[install-hooks] gate smoke-test: PASS"
  else
    echo "[install-hooks] gate smoke-test: reported violations/warnings (see: $PY scripts/loop_check.py)"
  fi
else
  echo "[install-hooks] WARNING: no Python interpreter; hooks will no-op until one is installed." >&2
fi

echo "[install-hooks] done. Bypass a single commit with: git commit --no-verify"
