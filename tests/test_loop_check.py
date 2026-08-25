#!/usr/bin/env python3
"""End-to-end tests for scripts/loop_check.py.

Each test builds an isolated temporary git repo, copies the real loop_check.py
into it (so REPO resolves to the temp dir), and invokes it as a subprocess with
--json. No network, no external deps — stdlib unittest only.

Run:  python3 tests/test_loop_check.py            (from repo root)
   or python3 -m unittest -v tests.test_loop_check
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
REAL_SCRIPT = REPO_ROOT / "scripts" / "loop_check.py"


def run_git(cwd: Path, *args: str) -> None:
    subprocess.run(["git", "-C", str(cwd), *args],
                   check=True, capture_output=True, text=True)


class Fixture:
    """A throwaway git repo with the loop_check.py gate installed."""

    def __init__(self, *, include_graph=True, mem="small", usr="small",
                 changelog=True):
        self.dir = Path(tempfile.mkdtemp(prefix="ph3-loop-"))
        (self.dir / "scripts").mkdir()
        shutil.copy(REAL_SCRIPT, self.dir / "scripts" / "loop_check.py")
        (self.dir / "improver").mkdir()
        self._write("improver/MEMORY.md", "M" * (5000 if mem == "big" else 10))
        self._write("improver/USER.md", "U" * (3000 if usr == "big" else 10))
        if changelog:
            self._write("improver/changelog.md", "# changelog\n")
        self._write(".gitignore", "graphify-out/\nimprover/session-log.md\n")
        if include_graph:
            (self.dir / "graphify-out" / "reflections").mkdir(parents=True)
            self._write("graphify-out/graph.json", "{}")
            self._write("graphify-out/reflections/LESSONS.md", "# lessons\n")
        run_git(self.dir, "init", "-q")
        run_git(self.dir, "config", "user.email", "t@t")
        run_git(self.dir, "config", "user.name", "t")
        run_git(self.dir, "add", "-A")
        run_git(self.dir, "commit", "-q", "-m", "init")

    def _write(self, rel: str, text: str) -> None:
        p = self.dir / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text, encoding="utf-8")

    def write(self, rel: str, text: str) -> None:
        self._write(rel, text)

    def run(self, *args: str, env_extra=None) -> tuple[int, dict, str]:
        env = os.environ.copy()
        if env_extra:
            env.update(env_extra)
        r = subprocess.run(
            [sys.executable, "scripts/loop_check.py", "--json", *args],
            cwd=self.dir, capture_output=True, text=True, env=env,
        )
        # --json prints one JSON line to stdout; parse the last non-empty line.
        payload: dict = {}
        for line in r.stdout.splitlines():
            line = line.strip()
            if line.startswith("{"):
                payload = json.loads(line)
        if not payload:
            raise AssertionError(
                f"no JSON payload (rc={r.returncode})\nSTDOUT:{r.stdout}\nSTDERR:{r.stderr}")
        return r.returncode, payload, r.stderr

    def cleanup(self) -> None:
        shutil.rmtree(self.dir, ignore_errors=True)


class LoopCheckTests(unittest.TestCase):
    def setUp(self):
        self.fixtures: list[Fixture] = []

    def tearDown(self):
        for f in self.fixtures:
            f.cleanup()

    def mk(self, **kw) -> Fixture:
        f = Fixture(**kw)
        self.fixtures.append(f)
        return f

    # --- caps -----------------------------------------------------------
    def test_clean_repo_passes(self):
        f = self.mk()
        code, out, _ = f.run()
        self.assertEqual(code, 0, out)
        self.assertTrue(out["ok"])
        self.assertEqual(out["violations"], [])

    def test_memory_over_cap_fails(self):
        f = self.mk(mem="big")
        code, out, _ = f.run()
        self.assertEqual(code, 1)
        self.assertTrue(any("MEMORY.md exceeds" in v for v in out["violations"]))

    def test_user_over_cap_fails(self):
        f = self.mk(usr="big")
        code, out, _ = f.run()
        self.assertEqual(code, 1)
        self.assertTrue(any("USER.md exceeds" in v for v in out["violations"]))

    def test_missing_memory_fails(self):
        f = self.mk()
        (f.dir / "improver/MEMORY.md").unlink()
        code, out, _ = f.run()
        self.assertEqual(code, 1)
        self.assertTrue(any("MEMORY.md missing" in v for v in out["violations"]))

    # --- the critical staged-bypass regression -------------------------
    def test_staged_bypass_is_blocked(self):
        """Stage over-cap content, then shrink the worktree copy.

        Worktree mode must PASS (worktree is small) but --staged mode must
        FAIL (the index still holds the 5000-char blob that will be committed).
        This is the exact bypass that defeated the original gate.
        """
        f = self.mk()
        f.write("improver/MEMORY.md", "X" * 5000)
        run_git(f.dir, "add", "improver/MEMORY.md")
        f.write("improver/MEMORY.md", "tiny\n")  # shrink worktree only

        code_wt, out_wt, _ = f.run()             # worktree mode
        self.assertEqual(code_wt, 0, "worktree copy is small -> should pass")

        code_st, out_st, _ = f.run("--staged")   # index mode
        self.assertEqual(code_st, 1, "staged blob is 5000 chars -> must fail")
        self.assertTrue(any("MEMORY.md exceeds" in v for v in out_st["violations"]))

    # --- bootstrap safety ----------------------------------------------
    def test_missing_graph_is_warning_by_default(self):
        f = self.mk(include_graph=False)
        code, out, _ = f.run()
        self.assertEqual(code, 0, "fresh clone must not deadlock the gate")
        self.assertTrue(out["ok"])
        self.assertTrue(any("graph.json missing" in w for w in out["warnings"]))

    def test_missing_graph_hard_with_require_graph(self):
        f = self.mk(include_graph=False)
        code, out, _ = f.run("--require-graph")
        self.assertEqual(code, 1)
        self.assertTrue(any("graph.json missing" in v for v in out["violations"]))

    # --- changelog ------------------------------------------------------
    def test_missing_changelog_fails(self):
        f = self.mk(changelog=False)
        code, out, _ = f.run()
        self.assertEqual(code, 1)
        self.assertTrue(any("changelog.md missing" in v for v in out["violations"]))

    def test_old_changelog_warns_then_hard(self):
        f = self.mk()
        old = time.time() - 40 * 86400
        os.utime(f.dir / "improver/changelog.md", (old, old))
        code, out, _ = f.run()
        self.assertEqual(code, 0)
        self.assertTrue(any("older than" in w for w in out["warnings"]))
        code2, out2, _ = f.run("--strict-changelog")
        self.assertEqual(code2, 1)
        self.assertTrue(any("older than" in v for v in out2["violations"]))

    def test_changelog_check_disabled_with_zero(self):
        f = self.mk()
        old = time.time() - 999 * 86400
        os.utime(f.dir / "improver/changelog.md", (old, old))
        code, out, _ = f.run("--max-changelog-age-days", "0")
        self.assertEqual(code, 0)
        self.assertFalse(any("older than" in w for w in out["warnings"]))

    # --- staleness + .needs_update latch --------------------------------
    def test_staleness_sets_and_clears_needs_update(self):
        f = self.mk()
        graph = f.dir / "graphify-out/graph.json"
        mem = f.dir / "improver/MEMORY.md"
        base = time.time()
        # Source strictly newer than graph -> stale.
        os.utime(graph, (base, base))
        os.utime(mem, (base + 7200, base + 7200))
        code, out, _ = f.run()
        self.assertEqual(code, 0)     # warning by default
        self.assertTrue(any("stale" in w for w in out["warnings"]))
        self.assertTrue((f.dir / "graphify-out/.needs_update").exists(),
                        "stale run must set the latch")
        # Graph now dominates every source -> fresh -> latch cleared.
        os.utime(graph, (base + 100000, base + 100000))
        code2, out2, _ = f.run()
        self.assertEqual(code2, 0)
        self.assertFalse(any("stale" in w for w in out2["warnings"]))
        self.assertFalse((f.dir / "graphify-out/.needs_update").exists(),
                         "fresh run must clear the latch (one-way-latch bug fix)")

    def test_staleness_hard_with_strict_stale(self):
        f = self.mk()
        base = time.time()
        os.utime(f.dir / "graphify-out/graph.json", (base, base))
        os.utime(f.dir / "improver/MEMORY.md", (base + 7200, base + 7200))
        code, out, _ = f.run("--strict-stale")
        self.assertEqual(code, 1)
        self.assertTrue(any("stale" in v for v in out["violations"]))

    def test_session_log_excluded_from_staleness(self):
        """A runtime-appended session-log.md must never mark the graph stale."""
        f = self.mk()
        base = time.time()
        os.utime(f.dir / "graphify-out/graph.json", (base, base))
        f.write("improver/session-log.md", "log\n")
        os.utime(f.dir / "improver/session-log.md", (base + 7200, base + 7200))
        code, out, _ = f.run()
        self.assertEqual(code, 0)
        self.assertFalse(any("stale" in w for w in out["warnings"]),
                         "session-log.md is excluded from staleness")
        self.assertFalse((f.dir / "graphify-out/.needs_update").exists())

    def test_gitignored_source_excluded_from_staleness(self):
        """A gitignored file matching a tracked glob must not cause staleness."""
        f = self.mk()
        base = time.time()
        os.utime(f.dir / "graphify-out/graph.json", (base, base))
        # Ignore a plugin path that matches the .opencode/plugins/*.js glob.
        f.write(".gitignore", "graphify-out/\nimprover/session-log.md\n"
                              ".opencode/plugins/vendor.js\n")
        (f.dir / ".opencode/plugins").mkdir(parents=True, exist_ok=True)
        f.write(".opencode/plugins/vendor.js", "// vendor\n")
        run_git(f.dir, "add", ".gitignore")
        run_git(f.dir, "commit", "-q", "-m", "ignore vendor")
        os.utime(f.dir / ".opencode/plugins/vendor.js", (base + 7200, base + 7200))
        code, out, _ = f.run()
        self.assertEqual(code, 0)
        self.assertFalse(any("stale" in w for w in out["warnings"]),
                         "gitignored vendor.js must be excluded from staleness")

    # --- escape hatch + --check ----------------------------------------
    def test_escape_hatch_skips(self):
        f = self.mk(mem="big")  # would normally fail
        code, out, _ = f.run(env_extra={"LOOP_CHECK_SKIP": "1"})
        self.assertEqual(code, 0)
        self.assertTrue(out.get("skipped"))

    def test_check_reports_hook_wiring(self):
        f = self.mk()
        code, out, _ = f.run("--check")
        self.assertEqual(code, 1)               # not wired yet
        self.assertFalse(out["hooks_wired"])
        run_git(f.dir, "config", "core.hooksPath", ".githooks")
        code2, out2, _ = f.run("--check")
        self.assertEqual(code2, 0)
        self.assertTrue(out2["hooks_wired"])


class MatchUnitTests(unittest.TestCase):
    """Direct unit tests for the segment-aware glob matcher."""

    def setUp(self):
        import importlib.util
        spec = importlib.util.spec_from_file_location("loop_check", REAL_SCRIPT)
        assert spec and spec.loader
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        self._match = mod._match

    def test_star_does_not_cross_slash(self):
        self.assertTrue(self._match("scripts/x.py", "scripts/*.py"))
        self.assertFalse(self._match("scripts/__pycache__/x.py", "scripts/*.py"))
        self.assertFalse(self._match("agents/sub/a.md", "agents/*.md"))

    def test_double_star_crosses_slash(self):
        self.assertTrue(self._match("skills/a/b/c.md", "skills/**/*.md"))
        self.assertTrue(self._match("skills/x.md", "skills/**/*.md"))

    def test_exact(self):
        self.assertTrue(self._match("AGENTS.md", "AGENTS.md"))
        self.assertFalse(self._match("x/AGENTS.md", "AGENTS.md"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
