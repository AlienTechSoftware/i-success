#!/usr/bin/env python3
"""build_study_aid.py - build a study page from a content file.

    python build_study_aid.py CONTENT [--out DIR] [--name NAME] [--template template_01]

CONTENT is a .yaml/.yml, .json or .data.js file (references/data_schema.md, plus the widget shorthand in
references/widgets.md). The page is written next to the content file unless --out says otherwise, so the source
paths the content names (PDFs, relative to the page) keep working:

    <out>/<name>.html   <out>/<name>.data.js   <out>/page.css   <out>/study-kit/   <out>/workbench/

Only changed files are written. Exit status 0 on success, 1 on a content error (each error is printed).
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from study_wb_lib import ContentError, build  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("content", type=Path)
    ap.add_argument("--out", type=Path, help="output folder (default: the content file's folder)")
    ap.add_argument("--name", help="output base name (default: build.name in the content, else the content file's name)")
    ap.add_argument("--template", default="template_01", help="template folder under assets/ (default: template_01)")
    ap.add_argument("--runtime", choices=("copy", "link"), help="copy (default): runtime copied beside the page, opens anywhere; "
                    "link: page uses this skill's lib/ by relative path, copies nothing (for the skill's own examples)")
    a = ap.parse_args()
    if not a.content.exists():
        print(f"not found: {a.content}", file=sys.stderr)
        return 1
    try:
        r = build(a.content.resolve(), a.out, a.name, a.template, a.runtime)
    except ContentError as e:
        print(e, file=sys.stderr)
        return 1
    print(f"page: {r['page']}")
    print(f"written: {len(r['written'])} file(s)" + ("" if r["written"] else " (nothing changed)"))
    for w in r["written"][:20]:
        print(f"  {w}")
    if len(r["written"]) > 20:
        print(f"  ... and {len(r['written']) - 20} more")
    print(f"next: python {Path(__file__).with_name('verify_page.py')} \"{r['page']}\"")
    return 0


if __name__ == "__main__":
    sys.exit(main())
