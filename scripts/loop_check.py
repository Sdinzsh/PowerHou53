#!/usr/bin/env python3
"""PowerHous3 closed-loop enforcement gate.

Deterministic checks that convert protocol conventions into hard gates:

  1. Bounded memory caps      MEMORY.md <= 2200 chars, USER.md <= 1375 chars
  2. Learning-loop artifacts  graphify-out/graph.json + reflections/LESSONS.md
  3. Changelog liveness       improver/changelog.md touched within N days
  4. Graph drift              tracked sources newer than graph.json -> stale

Severity model (so the gate is safe to wire as a real pre-commit hook):

  HARD by default (exit 1):
    - memory-cap overflow           (committed content; the core invariant)
    - improver/MEMORY.md/USER.md/changelog.md missing (committed files)
  WARNING by default (exit 0, prints to stderr):
    - graph.json / LESSONS.md missing  (per-machine, gitignored runtime art)
    - changelog older than N days      (mtime is unreliable across clones)
    - knowledge-graph drift            (sets graphify-out/.needs_update)

  Promote any warning to hard with the matching flag:
    --require-graph      missing graph artifacts fail
    --strict-changelog   stale changelog fails
    --strict-stale       graph drift fails

Modes:
    --staged   evaluate the git *index* (what a commit will actually record),
               not the working tree. This closes the stage-bad / shrink-worktree
               bypass. The pre-commit hook always passes --staged.
    --check    report whether the git hooks are wired (core.hooksPath) and exit.
    --json     emit a machine-readable result (for tests / CI).

Escape hatch: set LOOP_CHECK_SKIP=1 to bypass entirely (documented; visible in
env, unlike `git commit --no-verify`).

Exit codes: 0 = pass, 1 = violation, 2 = usage/internal error.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
MEMORY_CAP = 2200
USER_CAP = 1375

# Globs of sources whose edits should invalidate the knowledge graph.
# `*` matches within a path segment; `**` spans segments (see _match).
TRACKED_GLOBS = (
    "AGENTS.md",
    "README.md",
    "INSTALL.md",
    "agents/*.md",
    "improver/*.md",
    "skills/**/*.md",
    ".opencode/plugins/*.js",
    "scripts/*.py",
    "scripts/*.sh",
)

# Runtime / per-machine files that legitimately change after the graph is built
# and must never, on their own, mark the graph stale (else it latches forever).
STALENESS_EXCLUDE = (
    "improver/session-log.md",
)


def git(args: list[str]) -> str | None:
    """Run a git command rooted at REPO. Return stdout or None on failure."""
    try:
        r = subprocess.run(
            ["git", "-C", str(REPO), *args],
            capture_output=True, text=True, timeout=15,
        )
    except Exception:
        return None
    if r.returncode != 0:
        return None
    return r.stdout


def _match(path: str, pattern: str) -> bool:
    """Glob match that respects '/' boundaries.

    '*' matches any run of non-'/' chars; '**' matches across segments.
    Fixes fnmatch's segment-crossing bug where 'scripts/*.py' matched
    'scripts/__pycache__/x.py'.
    """
    path = path.replace("\\", "/")
    p_parts = path.split("/")
    g_parts = pattern.split("/")

    def seg_match(seg: str, glob: str) -> bool:
        # single-segment glob: '*' -> [^/]* , '?' -> single char
        from fnmatch import fnmatchcase
        return fnmatchcase(seg, glob)

    def rec(pi: int, gi: int) -> bool:
        while gi < len(g_parts):
            g = g_parts[gi]
            if g == "**":
                # '**' consumes zero or more path segments
                if gi + 1 == len(g_parts):
                    return True
                for skip in range(pi, len(p_parts) + 1):
                    if rec(skip, gi + 1):
                        return True
                return False
            if pi >= len(p_parts):
                return False
            if not seg_match(p_parts[pi], g):
                return False
            pi += 1
            gi += 1
        return pi == len(p_parts)

    return rec(0, 0)


def matches_tracked(rel: str) -> bool:
    return any(_match(rel, g) for g in TRACKED_GLOBS)


def git_tracked_sources(exclude_ignored: bool = True) -> list[Path]:
    """Sources (existing on disk) that match TRACKED_GLOBS.

    Unions git-tracked files with on-disk glob discovery (a fresh repo may not
    track anything yet). Optionally drops gitignored paths so runtime/vendor
    files (e.g. gitignored .opencode/plugins/graphify.js, session-log.md) never
    trigger phantom staleness.
    """
    rels: set[str] = set()

    out = git(["ls-files"])
    if out is not None:
        for f in out.splitlines():
            if matches_tracked(f):
                rels.add(f.replace("\\", "/"))

    for g in TRACKED_GLOBS:
        for p in REPO.glob(g):
            if p.is_file():
                rels.add(p.relative_to(REPO).as_posix())

    for ex in STALENESS_EXCLUDE:
        rels.discard(ex)

    if exclude_ignored and rels:
        ignored = git_ignored(sorted(rels))
        rels -= ignored

    return sorted((REPO / r) for r in rels)


def git_ignored(rels: list[str]) -> set[str]:
    """Subset of rels that git ignores. Empty set if git is unavailable."""
    try:
        r = subprocess.run(
            ["git", "-C", str(REPO), "check-ignore", "--stdin"],
            input="\n".join(rels), capture_output=True, text=True, timeout=15,
        )
    except Exception:
        return set()
    # check-ignore exits 0 (some ignored), 1 (none), 128 (error)
    if r.returncode not in (0, 1):
        return set()
    return {line.strip().replace("\\", "/") for line in r.stdout.splitlines() if line.strip()}


def read_source(rel: str, staged: bool) -> tuple[bool, str]:
    """Return (exists, text) for a source.

    staged=True reads the git index blob (what the commit will record); the
    index contains every tracked file, so a `git show :rel` miss means the path
    is untracked or staged-for-deletion -> treated as absent.
    """
    if staged:
        content = git(["show", f":{rel}"])
        if content is None:
            return False, ""
        return True, content
    p = REPO / rel
    if p.exists():
        return True, p.read_text(encoding="utf-8", errors="replace")
    return False, ""


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="PowerHous3 closed-loop gate")
    ap.add_argument("--staged", action="store_true",
                    help="evaluate the git index (commit content), not the worktree")
    ap.add_argument("--require-graph", action="store_true",
                    help="missing graph.json / LESSONS.md is a hard failure")
    ap.add_argument("--strict-changelog", action="store_true",
                    help="a stale changelog is a hard failure")
    ap.add_argument("--strict-stale", action="store_true",
                    help="knowledge-graph drift is a hard failure")
    ap.add_argument("--max-changelog-age-days", type=int, default=14,
                    help="0 disables the changelog liveness check")
    ap.add_argument("--check", action="store_true",
                    help="report whether git hooks are wired, then exit")
    ap.add_argument("--json", action="store_true",
                    help="emit a machine-readable result")
    args = ap.parse_args(argv)

    if args.check:
        hp = git(["config", "--get", "core.hooksPath"])
        wired = hp is not None and hp.strip() == ".githooks"
        msg = (".githooks wired (core.hooksPath=.githooks)" if wired
               else "git hooks NOT wired - run: scripts/install_hooks.sh "
                    "(or: git config core.hooksPath .githooks)")
        if args.json:
            print(json.dumps({"hooks_wired": wired, "message": msg}))
        else:
            print(f"[loop-check] {'OK' if wired else 'WARN'}: {msg}",
                  file=sys.stderr if not wired else sys.stdout)
        return 0 if wired else 1

    if os.environ.get("LOOP_CHECK_SKIP") == "1":
        print("[loop-check] SKIP: LOOP_CHECK_SKIP=1 set", file=sys.stderr)
        if args.json:
            print(json.dumps({"skipped": True, "violations": [], "warnings": []}))
        return 0

    violations: list[str] = []
    warnings: list[str] = []

    def gate(hard: bool, msg: str) -> None:
        (violations if hard else warnings).append(msg)

    # 1. Bounded memory caps (single read each) — HARD (committed content).
    for rel, cap in (("improver/MEMORY.md", MEMORY_CAP), ("improver/USER.md", USER_CAP)):
        exists, text = read_source(rel, args.staged)
        if not exists:
            gate(True, f"{rel} missing - bounded memory store broken")
        else:
            n = len(text)
            if n > cap:
                gate(True, f"{rel} exceeds {cap}-char bound ({n} chars) - consolidate inline")

    # 2. Changelog presence (HARD) + liveness (warning unless --strict-changelog).
    cl_rel = "improver/changelog.md"
    cl_exists, _ = read_source(cl_rel, args.staged)
    if not cl_exists:
        gate(True, f"{cl_rel} missing")
    elif args.max_changelog_age_days > 0:
        cl_path = REPO / cl_rel
        if cl_path.exists():
            age = time.time() - cl_path.stat().st_mtime
            if age > args.max_changelog_age_days * 86400:
                gate(args.strict_changelog,
                     f"{cl_rel} older than {args.max_changelog_age_days}d "
                     "- session-end logging may have stopped")

    # 3. Learning-loop artifacts — WARNING by default (gitignored/per-machine),
    #    HARD only with --require-graph.
    graph = REPO / "graphify-out/graph.json"
    lessons = REPO / "graphify-out/reflections/LESSONS.md"
    if not graph.exists():
        gate(args.require_graph,
             "graphify-out/graph.json missing - knowledge graph not built "
             "(run: graphify <path>)")
    if not lessons.exists():
        gate(args.require_graph,
             "graphify-out/reflections/LESSONS.md missing - learning loop not "
             "reflected (run: graphify reflect)")

    # 4. Knowledge-graph drift — worktree mtimes; sets/clears .needs_update.
    #    Skipped for gitignored/runtime sources; latch is cleared when fresh.
    needs_update = REPO / "graphify-out/.needs_update"
    if graph.exists():
        g_mtime = graph.stat().st_mtime
        stale = sorted(
            p.relative_to(REPO).as_posix()
            for p in git_tracked_sources()
            if p.exists() and p.stat().st_mtime > g_mtime
        )
        if stale:
            try:
                needs_update.touch()
            except Exception:
                pass
            eg = ", ".join(stale[:3])
            gate(args.strict_stale,
                 f"knowledge graph stale: {len(stale)} source(s) newer than "
                 f"graph.json (e.g. {eg}) - run: graphify --update")
        else:
            # Clear the one-way latch once sources are no longer newer.
            if not args.staged:
                try:
                    needs_update.unlink()
                except FileNotFoundError:
                    pass
                except Exception:
                    pass

    if args.json:
        print(json.dumps({
            "skipped": False,
            "staged": args.staged,
            "violations": violations,
            "warnings": warnings,
            "ok": not violations,
        }))
    else:
        for w in warnings:
            print(f"[loop-check] WARNING: {w}", file=sys.stderr)
        if violations:
            for v in violations:
                print(f"[loop-check] FAIL: {v}", file=sys.stderr)
        else:
            print("[loop-check] OK: memory bounds, learning-loop artifacts, "
                  "changelog liveness all pass")

    return 1 if violations else 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        sys.exit(2)
