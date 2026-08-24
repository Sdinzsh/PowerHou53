#!/usr/bin/env python3
"""PowerHous3 closed-loop enforcement gate.

Deterministic checks that convert protocol conventions into hard gates:

  1. Bounded memory caps      MEMORY.md <= 2200 chars, USER.md <= 1375 chars
  2. Learning-loop artifacts  graphify-out/graph.json + reflections/LESSONS.md exist
  3. Changelog liveness       improver/changelog.md touched within N days
  4. Graph drift              tracked sources newer than graph.json -> stale

Exit codes: 0 = pass, 1 = violation (blocks git pre-commit).
Staleness fails only with --strict-stale (default: warning; the post-commit
hook / next `graphify --update` clears it).
"""
from __future__ import annotations

import argparse
import subprocess
import sys
import time
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
MEMORY_CAP = 2200
USER_CAP = 1375
TRACKED_GLOBS = (
    "AGENTS.md",
    "README.md",
    "INSTALL.md",
    "agents/*.md",
    "improver/*.md",
    "skills/**/*.md",
    ".opencode/plugins/*.js",
    "scripts/*.py",
)


def git_tracked_sources() -> list[Path]:
    from fnmatch import fnmatch

    def matches(f: str) -> bool:
        f = f.replace("\\", "/")
        return any(fnmatch(f, g) for g in TRACKED_GLOBS)

    sources: dict[str, Path] = {}
    try:
        out = subprocess.run(
            ["git", "-C", str(REPO), "ls-files"],
            capture_output=True, text=True, check=True, timeout=10,
        ).stdout.splitlines()
        for f in out:
            if matches(f):
                sources[f] = REPO / f
    except Exception:
        pass
    # Always union with glob discovery: a fresh repo may track nothing yet,
    # and new files are untracked until first add/commit.
    for g in TRACKED_GLOBS:
        for p in REPO.glob(g):
            if p.is_file():
                sources[p.relative_to(REPO).as_posix()] = p
    return sorted(sources.values())


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--strict-stale", action="store_true",
                    help="treat a stale knowledge graph as a hard failure")
    ap.add_argument("--max-changelog-age-days", type=int, default=14,
                    help="0 disables the changelog liveness check")
    args = ap.parse_args()

    violations: list[str] = []
    warnings: list[str] = []

    mem = REPO / "improver/MEMORY.md"
    usr = REPO / "improver/USER.md"
    if mem.exists() and len(mem.read_text(encoding="utf-8")) > MEMORY_CAP:
        violations.append(f"improver/MEMORY.md exceeds {MEMORY_CAP}-char bound "
                          f"({len(mem.read_text(encoding='utf-8'))} chars) - consolidate inline")
    elif not mem.exists():
        violations.append("improver/MEMORY.md missing - bounded memory store broken")
    if usr.exists() and len(usr.read_text(encoding="utf-8")) > USER_CAP:
        violations.append(f"improver/USER.md exceeds {USER_CAP}-char bound "
                          f"({len(usr.read_text(encoding='utf-8'))} chars)")
    elif not usr.exists():
        violations.append("improver/USER.md missing")

    graph = REPO / "graphify-out/graph.json"
    lessons = REPO / "graphify-out/reflections/LESSONS.md"
    if not graph.exists():
        violations.append("graphify-out/graph.json missing - knowledge graph never built")
    if not lessons.exists():
        violations.append("graphify-out/reflections/LESSONS.md missing - learning loop never reflected")

    cl = REPO / "improver/changelog.md"
    if args.max_changelog_age_days > 0:
        if not cl.exists():
            violations.append("improver/changelog.md missing")
        elif (time.time() - cl.stat().st_mtime) > args.max_changelog_age_days * 86400:
            violations.append(
                f"improver/changelog.md older than {args.max_changelog_age_days}d "
                "- session-end logging stopped")

    if graph.exists():
        g_mtime = graph.stat().st_mtime
        stale = [p.relative_to(REPO) for p in git_tracked_sources()
                 if p.exists() and p.stat().st_mtime > g_mtime]
        if stale:
            (REPO / "graphify-out/.needs_update").touch()
            msg = (f"knowledge graph stale: {len(stale)} source(s) newer than graph.json "
                   f"(e.g. {', '.join(str(s) for s in sorted(stale)[:3])}) - run /graphify --update")
            (violations if args.strict_stale else warnings).append(msg)

    for w in warnings:
        print(f"[loop-check] WARNING: {w}", file=sys.stderr)
    if violations:
        for v in violations:
            print(f"[loop-check] FAIL: {v}", file=sys.stderr)
        return 1
    print("[loop-check] OK: memory bounds, learning-loop artifacts, changelog liveness all pass")
    return 0


if __name__ == "__main__":
    sys.exit(main())
