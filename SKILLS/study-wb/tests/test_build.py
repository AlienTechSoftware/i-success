#!/usr/bin/env python3
"""End-to-end test of the study-wb pipeline. Run:  python tests/test_build.py   (exit 0 = all passed)

Builds assets/template_01/content.example.yaml in a temporary folder, then checks:
  1. validate passes once the source files exist;
  2. the build writes the page, the data script, page.css, study-kit/ and workbench/;
  3. a second build writes nothing (idempotent);
  4. verify_page.py passes in headless Chrome/Edge;
  and that the checks catch broken content:
  5. a step that fills a wrong value makes verify_page.py fail and name the box;
  6. a token without a field, an unknown label and a step filling a missing box make validate fail;
  7. a page whose workbench is missing makes verify_page.py fail.
Needs PyYAML and Chrome or Edge. Writes only inside a temporary folder.
"""
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
SCRIPTS = SKILL / "scripts"
EXAMPLE = SKILL / "assets" / "template_01" / "content.example.yaml"
sys.path.insert(0, str(SCRIPTS))
import yaml  # noqa: E402

results = []


def run(script, *args):
    p = subprocess.run([sys.executable, str(SCRIPTS / script), *map(str, args)], capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=180)
    return p.returncode, (p.stdout + p.stderr)


def check(name, cond, detail=""):
    results.append((name, bool(cond)))
    print(f"{'PASS' if cond else 'FAIL'}  {name}" + (f"\n      {detail.strip()[:600]}" if (detail and not cond) else ""))


def main() -> int:
    with tempfile.TemporaryDirectory(prefix="study-wb-test-") as tmp:
        tmp = Path(tmp)
        content = tmp / "my-page.yaml"
        shutil.copy(EXAMPLE, content)
        code, out = run("validate_study_data.py", content)
        check("validate passes on the example as shipped", code == 0, out)

        code, out = run("build_study_aid.py", content)
        built = all((tmp / p).exists() for p in ("my-page.html", "my-page.data.js", "page.css", "study-kit/study-kit.js", "workbench/workbench.js"))
        check("build writes page, data, css, study-kit, workbench", code == 0 and built, out)
        code, out = run("build_study_aid.py", content)
        check("rebuild writes nothing", code == 0 and "nothing changed" in out, out)
        code, out = run("verify_page.py", tmp / "my-page.html")
        check("verify_page passes in a headless browser", code == 0 and out.startswith("ok"), out)

        data = yaml.safe_load(content.read_text(encoding="utf-8"))
        data["groups"][1]["problems"][0]["steps"][0]["fill"]["a1"] = 6.5
        content.write_text(yaml.safe_dump(data, allow_unicode=True, sort_keys=False), encoding="utf-8")
        run("build_study_aid.py", content)
        code, out = run("verify_page.py", tmp / "my-page.html")
        check("verify_page fails on a wrong step value and names the box", code == 1 and "wrong a1" in out, out)

        data["groups"][1]["problems"][0]["steps"][0]["fill"]["a1"] = 5.5
        p = data["groups"][1]["problems"][2]
        p["blocks"].append("<p>{{box:ghost}}</p>")
        p["label"] = "graded-ish"
        p["steps"].append({"say": "x", "fill": {"nobox": 1}})
        content.write_text(yaml.safe_dump(data, allow_unicode=True, sort_keys=False), encoding="utf-8")
        code, out = run("validate_study_data.py", content)
        check("validate catches token without field, bad label, step filling a missing box",
              code == 1 and "fields has no 'ghost'" in out and "label must be one of" in out and "fills 'nobox'" in out, out)

        shutil.copy(EXAMPLE, content)
        run("build_study_aid.py", content)
        shutil.rmtree(tmp / "workbench")
        code, out = run("verify_page.py", tmp / "my-page.html")
        check("verify_page fails when the workbench is missing", code == 1 and ("workbench" in out), out)

    failed = [n for n, ok in results if not ok]
    print(f"\n{len(results) - len(failed)} of {len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
