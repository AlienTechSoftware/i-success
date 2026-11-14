#!/usr/bin/env python3
"""verify_page.py - open a built study page in headless Chrome or Edge and run every problem.

    python verify_page.py PAGE.html [--browser PATH] [--timeout SECONDS] [--json]

Loads PAGE.html?sk-verify from disk, the way a student opens it. study-kit then runs StudyKit.verify() (every
problem's steps, then Check) and writes the result into the page; this script reads it from a DOM dump.

Fails (exit 1) on: a script or resource that failed to load, a content error, a box no step fills, a box that does
not check correct, a missing workbench, or no result at all (the page did not build). Prints one line per failing
problem. A pass is a statement about answers and steps; look at the page as well (references/verification.md).
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
]


def find_browser(explicit: str | None) -> str:
    if explicit:
        return explicit
    for name in ("chrome", "google-chrome", "chromium", "chromium-browser", "msedge"):
        p = shutil.which(name)
        if p:
            return p
    for c in CANDIDATES:
        if os.path.exists(c):
            return c
    sys.exit("No Chrome or Edge found. Pass --browser PATH.")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("page", type=Path)
    ap.add_argument("--browser")
    ap.add_argument("--timeout", type=int, default=60)
    ap.add_argument("--json", action="store_true", help="print the full result as JSON")
    a = ap.parse_args()
    page = a.page.resolve()
    if not page.exists():
        print(f"not found: {page}")
        return 1
    url = page.as_uri() + "?sk-verify"
    with tempfile.TemporaryDirectory(prefix="study-wb-verify-") as profile:
        cmd = [find_browser(a.browser), "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
               f"--user-data-dir={profile}", "--virtual-time-budget=15000", "--dump-dom", url]
        try:
            run = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=a.timeout)
        except subprocess.TimeoutExpired:
            print(f"FAIL {page.name}: the browser did not finish within {a.timeout} s")
            return 1
    m = re.search(r'<script type="application/json" id="sk-verify-result">(.*?)</script>', run.stdout, re.S)
    if not m:
        print(f"FAIL {page.name}: no verify result in the page. It did not build (check the data script and study-kit paths).")
        return 1
    r = json.loads(m.group(1))
    if a.json:
        print(json.dumps(r, indent=1))
    ok = bool(r.get("ok")) and r.get("workbench", False)
    head = f"{'ok' if ok else 'FAIL'} {page.name}: {r.get('problems', 0)} problems"
    print(head)
    for e in r.get("pageErrors", []):
        print(f"  page error: {e}")
    for e in r.get("errors", []):
        print(f"  content error: {e}")
    if not r.get("workbench", False):
        print("  workbench missing (is workbench/workbench.js next to the page?)")
    for f in r.get("failures", []):
        parts = []
        if f.get("unfilled"):
            parts.append(f"unfilled {', '.join(f['unfilled'])}")
        if f.get("wrong"):
            parts.append(f"wrong {', '.join(f['wrong'])}")
        print(f"  {f['group']} | {f['problem']}: {'; '.join(parts)}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
