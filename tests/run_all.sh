#!/bin/sh
# Run the full PowerHous3 suite: Python gate + Node plugins/SDK + hook e2e.
# Usage:  sh tests/run_all.sh        (from anywhere; resolves repo root itself)
set -u

ROOT=$(CDPATH= cd "$(dirname "$0")/.." && pwd)
cd "$ROOT" || exit 2
RC=0

PY=""
for c in python3 python; do command -v "$c" >/dev/null 2>&1 && { PY="$c"; break; }; done

echo "== 1/3 Python gate tests (scripts/loop_check.py) =="
if [ -n "$PY" ]; then
  "$PY" -m unittest discover -s tests -p 'test_*.py' -v || RC=1
else
  echo "[skip] no Python interpreter"; RC=1
fi

echo
echo "== 2/3 Node plugin and Harness runtime tests =="
if command -v node >/dev/null 2>&1; then
  node --test tests/test_*.mjs || RC=1
else
  echo "[FAIL] node not found; plugin suite is required"; RC=1
fi

echo
echo "== 3/3 Hook integration test (.githooks) =="
sh tests/integration_hooks.sh || RC=1

echo
if [ "$RC" -eq 0 ]; then echo "==> ALL SUITES PASSED"; else echo "==> SOME SUITES FAILED"; fi
exit "$RC"
