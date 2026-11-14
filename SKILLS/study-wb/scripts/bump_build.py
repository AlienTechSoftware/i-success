#!/usr/bin/env python3
"""bump_build.py - refresh ONLY the build stamp of this skill's version in SKILL.md.

The version is  MAJOR.MINOR.BUILD  and lives in one place: `metadata.version` in SKILL.md front matter.
  MAJOR and MINOR change only on the skill owner's explicit instruction. This script never touches them.
  BUILD is a DATETIME STAMP, YYYYMMDDHHmmss, in Pacific time (America/Los_Angeles), e.g. 20261012093045.

Run it after any change to a file in this skill:

    python scripts/bump_build.py            # set the build stamp to "now"
    python scripts/bump_build.py --check    # print the current version and exit (changes nothing)

Standard library only. If the tz database is missing (common on Windows) it falls back to the US daylight-saving
rule: Pacific is UTC-7 from the second Sunday of March 02:00 local until the first Sunday of November 02:00 local,
and UTC-8 otherwise.
"""
import datetime as dt
import re
import sys
from pathlib import Path

DOC = Path(__file__).resolve().parent.parent / "SKILL.md"
VERSION_LINE = re.compile(r'^(\s*version:\s*")(\d+)\.(\d+)\.(\d{14})(")\s*$', re.M)


def nth_sunday(year, month, n):
    """Date of the n-th Sunday of a month."""
    first = dt.date(year, month, 1)
    return first + dt.timedelta(days=(6 - first.weekday()) % 7 + 7 * (n - 1))


def pacific_now():
    """Current Pacific wall-clock time as a naive datetime."""
    try:
        from zoneinfo import ZoneInfo
        return dt.datetime.now(ZoneInfo("America/Los_Angeles")).replace(tzinfo=None)
    except Exception:
        utc = dt.datetime.now(dt.timezone.utc).replace(tzinfo=None)
        year = utc.year
        start = dt.datetime.combine(nth_sunday(year, 3, 2), dt.time(2)) + dt.timedelta(hours=8)   # 02:00 PST in UTC
        end = dt.datetime.combine(nth_sunday(year, 11, 1), dt.time(2)) + dt.timedelta(hours=7)    # 02:00 PDT in UTC
        return utc - dt.timedelta(hours=7 if start <= utc < end else 8)


def main():
    text = DOC.read_text(encoding="utf-8")
    m = VERSION_LINE.search(text)
    if not m:
        sys.exit('SKILL.md has no front-matter line like:  version: "0.1.20261012000000"')
    major, minor, old = m.group(2), m.group(3), m.group(4)
    if "--check" in sys.argv:
        print(f"{major}.{minor}.{old}")
        return
    stamp = pacific_now().strftime("%Y%m%d%H%M%S")
    if stamp < old:
        sys.exit(f"Refusing to move the build stamp backwards ({old} -> {stamp}). Check the clock.")
    text = VERSION_LINE.sub(lambda k: f'{k.group(1)}{major}.{minor}.{stamp}{k.group(5)}', text, count=1)
    DOC.write_text(text, encoding="utf-8", newline="")
    print(f"version {major}.{minor}.{stamp}   (major and minor untouched)")


if __name__ == "__main__":
    main()
