#!/usr/bin/env python3
"""validate_study_data.py - static checks on a content file, without building anything.

    python validate_study_data.py CONTENT [--base DIR]

Checks: page.title and page.storageKey present and well formed; every problem labelled graded, calculated or
generated; graded and calculated problems name their sources and generated ones do not; [AI#n] problems are
generated; every answer-box token has a field and every field is placed; dropdown answers are among their options;
numeric answers are numbers; every step fills boxes that exist and every box is filled by some step (except
blank-allowed 0 / N/A); keystroke lines use numbers and + − × ÷ =; how-to ids exist; source files exist relative to
--base (default: the content file's folder). Prints every problem found; exit status 1 if any.
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from study_wb_lib import ContentError, expand, load_content, validate  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("content", type=Path)
    ap.add_argument("--base", type=Path, help="folder the page will live in (default: the content file's folder)")
    a = ap.parse_args()
    try:
        data = expand(load_content(a.content))
    except (ContentError, ValueError) as e:
        print(f"FAIL {a.content}\n  {e}")
        return 1
    errs = validate(data, base=(a.base or a.content.resolve().parent))
    n = sum(len(g.get("problems") or []) for g in data.get("groups") or [])
    if errs:
        print(f"FAIL {a.content}: {len(errs)} problem(s) in {n} problems")
        for e in errs:
            print(f"  {e}")
        return 1
    print(f"ok {a.content}: {len(data.get('groups') or [])} groups, {n} problems")
    return 0


if __name__ == "__main__":
    sys.exit(main())
