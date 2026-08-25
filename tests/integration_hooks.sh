#!/bin/sh
# End-to-end integration test for the PowerHous3 git hooks.
#
# Builds a throwaway git repo from the CURRENT working-tree copies of
# scripts/loop_check.py, scripts/install_hooks.sh and .githooks/*, then
# exercises the real commit path:
#   1. install_hooks.sh wires core.hooksPath and --check passes
#   2. a clean commit succeeds (bootstrap-safe: no graph -> warnings only)
#   3. the staged-bypass commit is BLOCKED by the pre-commit hook
#   4. LOOP_CHECK_SKIP=1 lets an explicit override through
#
# Exit 0 = all assertions pass. Any failure prints [FAIL] and exits 1.
set -u

SRC=$(CDPATH= cd "$(dirname "$0")/.." && pwd)
TMP=$(mktemp -d "${TMPDIR:-/tmp}/ph3-hooks.XXXXXX")
FAILED=0

pass() { echo "[PASS] $1"; }
fail() { echo "[FAIL] $1"; FAILED=1; }
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

# --- build fixture from the working tree --------------------------------
mkdir -p "$TMP/scripts" "$TMP/.githooks" "$TMP/improver"
cp "$SRC/scripts/loop_check.py"    "$TMP/scripts/"
cp "$SRC/scripts/install_hooks.sh" "$TMP/scripts/"
cp "$SRC/.githooks/pre-commit"     "$TMP/.githooks/"
cp "$SRC/.githooks/post-commit"    "$TMP/.githooks/"
chmod +x "$TMP/.githooks/"* "$TMP/scripts/install_hooks.sh"
printf 'M%.0s' $(seq 1 10) > "$TMP/improver/MEMORY.md"
printf 'U%.0s' $(seq 1 10) > "$TMP/improver/USER.md"
printf '# changelog\n'      > "$TMP/improver/changelog.md"
printf 'graphify-out/\nimprover/session-log.md\n' > "$TMP/.gitignore"

cd "$TMP" || { echo "cannot cd fixture"; exit 2; }
git init -q
git config user.email t@t
git config user.name t
git add -A
git commit -q -m init

# --- 1. wire hooks ------------------------------------------------------
sh scripts/install_hooks.sh >/dev/null 2>&1
if sh scripts/install_hooks.sh --check >/dev/null 2>&1; then
  pass "install_hooks.sh wires core.hooksPath and --check confirms it"
else
  fail "install_hooks.sh --check did not confirm wiring"
fi

# --- 2. clean commit succeeds ------------------------------------------
printf -- '- entry\n' >> improver/changelog.md
git add improver/changelog.md
if git commit -q -m "clean change" 2>/dev/null; then
  pass "clean commit passes the gate (bootstrap-safe with no graph)"
else
  fail "clean commit was wrongly blocked"
fi

# --- 3. staged-bypass MUST be blocked ----------------------------------
before=$(git rev-parse HEAD)
awk 'BEGIN{for(i=0;i<5000;i++)printf "X"}' > improver/MEMORY.md   # over-cap
git add improver/MEMORY.md
awk 'BEGIN{print "tiny"}' > improver/MEMORY.md                    # shrink worktree
if git commit -q -m "bypass attempt" 2>/dev/null; then
  fail "staged over-cap content COMMITTED through the gate (bypass!)"
else
  pass "pre-commit blocked the staged-bypass commit"
fi
after=$(git rev-parse HEAD)
if [ "$before" = "$after" ]; then
  pass "no commit was created by the blocked attempt"
else
  fail "a commit was created despite the block"
fi

# --- 4. explicit escape hatch ------------------------------------------
if LOOP_CHECK_SKIP=1 git commit -q -m "explicit override" 2>/dev/null; then
  n=$(git show HEAD:improver/MEMORY.md | wc -c | tr -d ' ')
  if [ "$n" -ge 5000 ]; then
    pass "LOOP_CHECK_SKIP=1 lets an explicit override through ($n chars)"
  else
    fail "override committed unexpected content ($n chars)"
  fi
else
  fail "LOOP_CHECK_SKIP=1 did not bypass the gate"
fi

echo "------------------------------------------------------------"
if [ "$FAILED" -eq 0 ]; then
  echo "[OK] all hook integration assertions passed"
  exit 0
fi
echo "[ERROR] hook integration test failed"
exit 1
