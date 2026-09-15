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

if [ "$#" -gt 1 ] || { [ "$#" -eq 1 ] && [ "$1" != "--check" ]; }; then
  echo "Usage: sh scripts/install_hooks.sh [--check]" >&2
  exit 2
fi

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
  if { [ "$current" = ".githooks" ] || [ "$current" = "$HOOKS_DIR" ]; } &&
     [ -f "$HOOKS_DIR/pre-commit" ] && [ -x "$HOOKS_DIR/pre-commit" ] &&
     [ -f "$HOOKS_DIR/post-commit" ] && [ -x "$HOOKS_DIR/post-commit" ] &&
     [ -f "$ROOT/scripts/loop_check.py" ]; then
    echo "[install-hooks] OK: executable pre/post-commit hooks wired"
    exit 0
  fi
  echo "[install-hooks] NOT wired (core.hooksPath='${current:-unset}'). Run: scripts/install_hooks.sh" >&2
  exit 1
fi

for hook in pre-commit post-commit; do
  if [ ! -f "$HOOKS_DIR/$hook" ]; then
    echo "[install-hooks] ERROR: missing $HOOKS_DIR/$hook" >&2
    exit 2
  fi
done
if [ ! -f "$ROOT/scripts/loop_check.py" ]; then
  echo "[install-hooks] ERROR: scripts/loop_check.py missing" >&2
  exit 2
fi
chmod +x "$HOOKS_DIR/pre-commit" "$HOOKS_DIR/post-commit"
git -C "$ROOT" config core.hooksPath .githooks

echo "[install-hooks] wired core.hooksPath=.githooks"

# Smoke-test the gate so a broken interpreter path surfaces now, not at commit.
PY=""
for cand in python3 python py; do
  if command -v "$cand" >/dev/null 2>&1 &&
     "$cand" -c 'import sys; sys.exit(sys.version_info < (3, 10))' >/dev/null 2>&1; then
    PY="$cand"; break
  fi
done
if [ -n "$PY" ]; then
  if "$PY" "$ROOT/scripts/loop_check.py"; then
    echo "[install-hooks] gate smoke-test: PASS"
  else
    echo "[install-hooks] gate smoke-test: FAILED (see output above)" >&2
    exit 1
  fi
else
  echo "[install-hooks] WARNING: no Python interpreter; hooks will no-op until one is installed." >&2
fi

echo "[install-hooks] done. Bypass a single commit with: LOOP_CHECK_SKIP=1 git commit ..."
