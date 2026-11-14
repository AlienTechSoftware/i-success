"""study_wb_lib - the implementation behind build_study_aid.py, validate_study_data.py and verify_page.py.

Content file (YAML or JSON) -> expanded page data (references/data_schema.md) -> a page that opens from disk:
    <out>/<name>.html        template_01/page.html with placeholders filled
    <out>/<name>.data.js     window.STUDY_DATA = {...}
    <out>/page.css           the template's theme layer
    <out>/study-kit/         copied runtime
    <out>/workbench/         copied side pane (with its two Nspire components)

Every write is idempotent: a file is written only when its bytes change, so a rebuild with no changes touches
nothing (a synced folder stays quiet and a git diff stays honest). Standard library plus PyYAML (only for .yaml).
Nothing here reads or writes outside the paths the caller passes in, and nothing is defaulted that the content
file must state (page.title, page.storageKey).
"""
from __future__ import annotations

import copy
import html
import json
import re
import shutil
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
LIB = SKILL / "lib"
VENDOR = LIB / "vendor"
# Chart and diagram libraries a content file may ask for (files under lib/vendor, see VERSIONS.md).
LIBRARIES = {"mermaid": ["mermaid.min.js"], "d3": ["d3.min.js"],
             "vega": ["vega.min.js", "vega-lite.min.js", "vega-embed.min.js"]}
TEMPLATES = SKILL / "assets"
LABELS = ("graded", "calculated", "generated")
KEY_RE = re.compile(r"^[A-Za-z0-9._-]+$")
TOKEN_RE = re.compile(r"\{\{(?:box|pick):([\w.-]+)\}\}")
LETTERS = "abcdefghijklmnopqrstuvwxyz"


class ContentError(Exception):
    """The content file is wrong. The message says where and what."""


# ---------------------------------------------------------------- loading
def load_content(path: Path) -> dict:
    """Read a .yaml/.yml, .json, or .data.js (window.STUDY_DATA = {...};) content file."""
    text = path.read_text(encoding="utf-8")
    if path.suffix.lower() in (".yaml", ".yml"):
        try:
            import yaml
        except ImportError as e:  # pragma: no cover - environment problem, said plainly
            raise ContentError("PyYAML is not installed in this Python; install it or use a .json content file") from e
        data = yaml.safe_load(text)
    elif path.name.endswith(".data.js"):
        m = re.search(r"window\.STUDY_DATA\s*=\s*(\{.*\})\s*;?\s*$", text, re.S)
        if not m:
            raise ContentError(f"{path.name}: expected 'window.STUDY_DATA = {{...}};'")
        data = json.loads(m.group(1))
    else:
        data = json.loads(text)
    if not isinstance(data, dict):
        raise ContentError(f"{path.name}: the top level must be a mapping")
    return data


# ---------------------------------------------------------------- widget shorthand
def _attr(v) -> str:
    return html.escape(str(v), quote=True)


def _field_from(spec: dict, where: str) -> tuple[str, dict]:
    if "name" not in spec:
        raise ContentError(f"{where}: an answer box needs a name")
    if "answer" not in spec:
        raise ContentError(f"{where}: box '{spec['name']}' needs an answer")
    f = {k: spec[k] for k in ("answer", "tol", "options", "kind", "cls", "style", "aria") if k in spec}
    return spec["name"], f


def _cell(cell, fields: dict, where: str) -> str:
    """A table cell: plain HTML (may already hold tokens) or an answer-box spec {name, answer, ...}."""
    if isinstance(cell, dict):
        name, f = _field_from(cell, where)
        fields[name] = f
        pre, post = cell.get("prefix", ""), cell.get("suffix", "")
        return f"{pre}{' ' if pre else ''}{{{{box:{name}}}}}{' ' if post else ''}{post}"
    return "" if cell is None else str(cell)


def w_classify(w: dict, fields: dict, where: str):
    """Rows of items, each answered from one shared option list. Optional auto steps, one per option."""
    items, options, prefix = w["items"], w["options"], w.get("prefix", "c")
    head = w.get("head")
    rows = []
    for i, it in enumerate(items):
        text, answer = it[0], it[1]
        if answer not in options:
            raise ContentError(f"{where}: item {i + 1} answer {answer!r} is not one of the options {options}")
        name = f"{prefix}{i}"
        fields[name] = {"answer": answer, "options": list(options), **({"style": w["style"]} if "style" in w else {})}
        mark = f"<td>({LETTERS[i]})</td>" if w.get("letters", True) else ""
        rows.append(f"<tr>{mark}<td>{text}</td><td>{{{{pick:{name}}}}}</td></tr>")
    thead = f"<thead><tr>{''.join(f'<th>{h}</th>' for h in head)}</tr></thead>" if head else ""
    steps = []
    if w.get("autoSteps"):
        for opt in options:
            idx = [i for i, it in enumerate(items) if it[1] == opt]
            if idx:
                lines = "<br>".join(f"({LETTERS[i]}) {items[i][0]}" + (f": {items[i][2]}." if len(items[i]) > 2 and items[i][2] else "") for i in idx)
                steps.append({"say": f"<strong>{opt}:</strong><br>{lines}", "fill": {f"{prefix}{i}": opt for i in idx}})
    return f'<table class="given">{thead}<tbody>{"".join(rows)}</tbody></table>', steps


def w_answers(w: dict, fields: dict, where: str):
    """Labelled answer rows: label | prefix [box] suffix."""
    rows = []
    for r in w["rows"]:
        name, f = _field_from(r, where)
        f.setdefault("cls", "mid")
        fields[name] = f
        pre, post = r.get("prefix", ""), r.get("suffix", "")
        rows.append(f"<tr><td>{r.get('label', '')}</td><td>{pre}{' ' if pre else ''}{{{{box:{name}}}}}{' ' if post else ''}{post}</td></tr>")
    return f'<table class="answers"><tbody>{"".join(rows)}</tbody></table>', []


def w_choice(w: dict, fields: dict, where: str):
    """One multiple-choice question: lettered options and one dropdown of letters."""
    opts = w["options"]
    letters = [chr(ord("A") + i) for i in range(len(opts))]
    ans = w["answer"]
    if ans not in letters:
        raise ContentError(f"{where}: choice answer {ans!r} must be one of {letters}")
    name = w.get("name", "choice")
    fields[name] = {"answer": ans, "options": letters}
    q = f"<p>{w['question']}</p>" if w.get("question") else ""
    return f'{q}<ol type="A" style="padding-left:26px">{"".join(f"<li>{o}</li>" for o in opts)}</ol><p>Answer: {{{{pick:{name}}}}}</p>', []


def w_table(w: dict, fields: dict, where: str):
    """A free table whose cells are HTML or answer boxes."""
    cls = w.get("cls", "given")
    head = w.get("head")
    thead = f"<thead><tr>{''.join(f'<th>{h}</th>' for h in head)}</tr></thead>" if head else ""
    body = "".join("<tr>" + "".join(f"<td>{_cell(c, fields, where)}</td>" for c in row) + "</tr>" for row in w["rows"])
    return f'<table class="{_attr(cls)}">{thead}<tbody>{body}</tbody></table>', []


def w_fset(w: dict, fields: dict, where: str):
    """Financial-statement-effects grid: one row of amounts per transaction and a row of account dropdowns under it
    (none under the last column, which is the net-income total)."""
    cols, accounts, prefix = w["columns"], w["accounts"], w.get("prefix", "f")
    n = len(cols)
    bs = w.get("balanceSheetColumns", n - 3)
    head = (f'<thead><tr><th rowspan="2">Transaction</th><th colspan="{bs}">BALANCE SHEET</th><th colspan="{n - bs}">INCOME STATEMENT</th></tr>'
            f"<tr>{''.join(f'<th>{c}</th>' for c in cols)}</tr></thead>")
    out = []
    for r, row in enumerate(w["rows"]):
        values, accts = row["values"], row.get("accounts", ["N/A"] * (n - 1))
        if len(values) != n or len(accts) != n - 1:
            raise ContentError(f"{where}: fset row {r + 1} needs {n} values and {n - 1} accounts")
        cells, acells = [], []
        for i, v in enumerate(values):
            cls = "net-cell" if i == n - 1 else "input-cell"
            name = f"{prefix}r{r}c{i}"
            fields[name] = {"answer": v}
            cells.append(f'<td class="{cls}">{{{{box:{name}}}}}</td>')
            if i == n - 1:
                acells.append(f'<td class="{cls}"></td>')
            else:
                if accts[i] not in accounts:
                    raise ContentError(f"{where}: fset row {r + 1} account {accts[i]!r} is not in accounts")
                an = f"{prefix}r{r}a{i}"
                fields[an] = {"answer": accts[i], "options": list(accounts)}
                acells.append(f'<td class="{cls}">{{{{pick:{an}}}}}</td>')
        out.append(f"<tr><td>{row['label']}</td>{''.join(cells)}</tr><tr class=\"account-row\"><td></td>{''.join(acells)}</tr>")
    return f'<table class="fset">{head}<tbody>{"".join(out)}</tbody></table>', []


WIDGETS = {"classify": w_classify, "answers": w_answers, "choice": w_choice, "table": w_table, "fset": w_fset}


def expand_problem(p: dict, where: str) -> dict:
    """Turn a problem's `blocks` (HTML strings and widget shorthand) into `body` + `fields` (+ auto steps)."""
    p = copy.deepcopy(p)
    if "blocks" not in p:
        return p
    if "body" in p:
        raise ContentError(f"{where}: give either body or blocks, not both")
    fields = dict(p.get("fields") or {})
    parts, auto = [], []
    for bi, b in enumerate(p.pop("blocks")):
        if isinstance(b, str):
            parts.append(b)
            continue
        if not isinstance(b, dict) or len(b) != 1:
            raise ContentError(f"{where} block {bi + 1}: a block is an HTML string or one widget, for example {{classify: {{...}}}}")
        kind, spec = next(iter(b.items()))
        if kind not in WIDGETS:
            raise ContentError(f"{where} block {bi + 1}: unknown widget {kind!r}; known: {', '.join(WIDGETS)}")
        out, steps = WIDGETS[kind](spec, fields, f"{where} block {bi + 1} ({kind})")
        parts.append(out)
        auto.extend(steps)
    p["body"] = "\n".join(parts)
    p["fields"] = fields
    if p.get("steps") == "auto":
        p["steps"] = auto
    return p


def expand(data: dict) -> dict:
    """Content -> page data: expand every problem; drop build-only keys."""
    out = copy.deepcopy(data)
    for gi, g in enumerate(out.get("groups") or []):
        g["problems"] = [expand_problem(p, f"group {g.get('id', gi + 1)} P{pi + 1}") for pi, p in enumerate(g.get("problems") or [])]
    out.pop("build", None)
    out.pop("workbench", None)
    return out


# ---------------------------------------------------------------- validation
def _answers(f: dict) -> list[str]:
    a = f.get("answer")
    if isinstance(a, list):
        return [str(x) for x in a]
    return [s.strip() for s in str(a).split("|")]


def validate(data: dict, base: Path | None = None) -> list[str]:
    """Static checks on expanded page data. Returns a list of problems; empty means it passed.
    `base` is the folder the page will live in, used to check that source files exist."""
    errs = []
    page = data.get("page") or {}
    if not page.get("title"):
        errs.append("page.title is required")
    sk = page.get("storageKey")
    if not sk:
        errs.append("page.storageKey is required (unique per page)")
    elif not KEY_RE.match(str(sk)):
        errs.append(f"page.storageKey {sk!r} may use only letters, digits, dot, dash and underscore")
    t = data.get("timer")
    if t is not None and not (isinstance(t, dict) and isinstance(t.get("minutes"), (int, float)) and t["minutes"] > 0):
        errs.append("timer.minutes must be a positive number (or leave timer out)")
    howtos = set((data.get("howto") or {}).keys())
    groups = data.get("groups")
    if not groups:
        errs.append("groups: at least one group is required")
    seen_ids = set()
    for gi, g in enumerate(groups or []):
        gid = g.get("id")
        if not gid:
            errs.append(f"group {gi + 1}: id is required")
        elif gid in seen_ids:
            errs.append(f"group {gid}: duplicate id")
        seen_ids.add(gid)
        if not g.get("problems"):
            errs.append(f"group {gid}: has no problems")
        for pi, p in enumerate(g.get("problems") or []):
            w = f"{gid} P{pi + 1}"
            if not p.get("name"):
                errs.append(f"{w}: name is required")
            lab = p.get("label")
            if lab not in LABELS:
                errs.append(f"{w}: label must be one of {', '.join(LABELS)} (got {lab!r})")
            if lab == "generated" and p.get("files"):
                errs.append(f"{w}: a generated variant cannot have source files")
            if lab in ("graded", "calculated") and not p.get("files"):
                errs.append(f"{w}: a {lab} problem must name its source file(s)")
            if str(p.get("name", "")).startswith("[AI#") and lab != "generated":
                errs.append(f"{w}: an [AI#n] problem must be labelled generated")
            if p.get("howto") and p["howto"] not in howtos:
                errs.append(f"{w}: howto {p['howto']!r} is not defined under howto")
            if base is not None:
                for f in p.get("files") or []:
                    if not re.match(r"^[a-z]+:", f) and not (base / f).exists():
                        errs.append(f"{w}: source file not found: {f}")
            fields = p.get("fields") or {}
            used = TOKEN_RE.findall(str(p.get("body", "")))
            for n in used:
                if n not in fields:
                    errs.append(f"{w}: the body uses {{{{{n}}}}} but fields has no {n!r}")
            if len(used) != len(set(used)):
                errs.append(f"{w}: a field is placed twice in the body")
            for n, f in fields.items():
                if n not in used:
                    errs.append(f"{w}: field {n!r} is never placed in the body")
                if "answer" not in f:
                    errs.append(f"{w}: field {n!r} has no answer")
                    continue
                if f.get("options") and not any(a in f["options"] for a in _answers(f)):
                    errs.append(f"{w}: field {n!r} answer {f['answer']!r} is not one of its options")
                if not f.get("options") and f.get("kind") != "text":
                    for a in _answers(f):
                        try:
                            float(str(a).replace(",", ""))
                        except ValueError:
                            if a != "":
                                errs.append(f"{w}: numeric field {n!r} has a non-numeric answer {a!r} (use kind: text or options)")
            steps = p.get("steps") or []
            if not isinstance(steps, list):
                errs.append(f"{w}: steps must be a list (or 'auto' with classify widgets)")
                steps = []
            filled = set()
            for si, s in enumerate(steps):
                for n in (s.get("fill") or {}):
                    if n not in fields:
                        errs.append(f"{w} step {si + 1}: fills {n!r}, which is not a field")
                    filled.add(n)
            if steps:
                for n, f in fields.items():
                    if n not in filled and not any(a in ("0", "N/A") for a in _answers(f)):
                        errs.append(f"{w}: no step fills field {n!r}")
            for ki, k in enumerate(p.get("keys") or []):
                if isinstance(k, dict):
                    bad = [x for x in k.get("keys", []) if not isinstance(x, (int, float)) and x not in ("+", "−", "×", "÷", "=")]
                    if bad:
                        errs.append(f"{w} keys line {ki + 1}: unknown key(s) {bad}; use numbers and + − × ÷ = (true minus sign)")
    return errs


# ---------------------------------------------------------------- writing
def write_if_changed(path: Path, data: bytes) -> bool:
    if path.exists() and path.read_bytes() == data:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_bytes(data)
    tmp.replace(path)
    return True


def copy_tree_if_changed(src: Path, dst: Path) -> list[str]:
    changed = []
    for f in sorted(src.rglob("*")):
        if f.is_dir() or "__pycache__" in f.parts:
            continue
        if write_if_changed(dst / f.relative_to(src), f.read_bytes()):
            changed.append(str((dst / f.relative_to(src))))
    return changed


def render_page(data: dict, content: dict, template: Path, data_script: str, extra_css: list[str], kit: str = "study-kit/", wb_path: str = "workbench/", lib_scripts: str = "") -> str:
    page = data["page"]
    wb = content.get("workbench") or {}
    attrs = ""
    if wb.get("toolsOffered"):
        attrs += f' data-tools-offered="{_attr(",".join(wb["toolsOffered"]))}"'
    if wb.get("tools"):
        attrs += f' data-tools="{_attr(",".join(wb["tools"]))}"'
    head_extra = "".join(f'  <link rel="stylesheet" href="{_attr(Path(c).name)}">\n' for c in extra_css) + lib_scripts
    out = (template / "page.html").read_text(encoding="utf-8")
    # Version tag from the file contents: a browser that cached an older script must fetch the new one.
    import hashlib
    skill_lib = Path(__file__).resolve().parent.parent / "lib"
    def _ver(p: Path) -> str:
        return hashlib.sha256(p.read_bytes()).hexdigest()[:12]
    kit_v = _ver(skill_lib / "study-kit" / "study-kit.js")
    wb_v = _ver(skill_lib / "workbench" / "workbench.js")
    for k, v in {"TITLE": html.escape(str(page["title"])), "LANG": _attr(page.get("lang", "en")), "STORAGE_KEY": page["storageKey"],
                 "DATA_SCRIPT": _attr(data_script), "WORKBENCH_ATTRS": attrs, "HEAD_EXTRA": head_extra, "KIT": _attr(kit), "WB": _attr(wb_path), "KIT_V": kit_v, "WB_V": wb_v}.items():
        out = out.replace("{{" + k + "}}", v)
    left = re.findall(r"\{\{[A-Z_]+\}\}", out)
    if left:
        raise ContentError(f"template placeholders left unfilled: {left}")
    return out


def build(content_path: Path, out_dir: Path | None = None, name: str | None = None, template_name: str = "template_01", runtime: str | None = None) -> dict:
    """Build one page. Returns {'page', 'data', 'written': [...]}. Raises ContentError on any content error.

    runtime 'copy' (default) copies study-kit/ and workbench/ next to the page, so it opens anywhere, even where this
    skill is absent. runtime 'link' points the page at this skill's own lib/ by relative path and copies nothing; it
    is for pages that live with the skill (its examples) or on the same machine, never for pages that travel."""
    content = load_content(content_path)
    data = expand(content)
    out_dir = (out_dir or content_path.parent).resolve()
    errs = validate(data, base=out_dir)
    if errs:
        raise ContentError("content errors:\n  " + "\n  ".join(errs))
    b = content.get("build") or {}
    stem = name or b.get("name") or re.sub(r"\.(data\.js|ya?ml|json)$", "", content_path.name)
    template = TEMPLATES / (b.get("template") or template_name)
    if not (template / "page.html").exists():
        raise ContentError(f"template not found: {template}")
    extra_css = [str(c) for c in ((content.get("page") or {}).get("css") or [])]
    runtime = runtime or b.get("runtime") or "copy"
    if runtime not in ("copy", "link"):
        raise ContentError(f"build.runtime must be copy or link (got {runtime!r})")
    kit, wb = "study-kit/", "workbench/"
    if runtime == "link":
        import os
        try:
            kit = os.path.relpath(LIB / "study-kit", out_dir).replace("\\", "/") + "/"
            wb = os.path.relpath(LIB / "workbench", out_dir).replace("\\", "/") + "/"
        except ValueError as e:
            raise ContentError(f"runtime link needs the page and the skill on the same drive: {e}") from e
    written = []
    data_js = f"window.STUDY_DATA = {json.dumps(data, ensure_ascii=False, indent=1)};\n"
    libs = content.get("libraries") or []
    if not isinstance(libs, list) or any(x not in LIBRARIES for x in libs):
        raise ContentError(f"libraries must be a list of {sorted(LIBRARIES)} (got {libs!r})")
    lib_scripts = ""
    for lib in libs:
        for f in LIBRARIES[lib]:
            src = VENDOR / f
            if not src.exists():
                raise ContentError(f"vendored library missing: {src}")
            if write_if_changed(out_dir / "vendor" / f, src.read_bytes()):
                written.append(str(out_dir / "vendor" / f))
            lib_scripts += f'  <script src="vendor/{f}"></script>\n'
    page_html = render_page(data, content, template, f"{stem}.data.js", extra_css, kit, wb, lib_scripts)
    for path, payload in [(out_dir / f"{stem}.data.js", data_js), (out_dir / f"{stem}.html", page_html)]:
        if write_if_changed(path, payload.encode("utf-8")):
            written.append(str(path))
    if write_if_changed(out_dir / "page.css", (template / "page.css").read_bytes()):
        written.append(str(out_dir / "page.css"))
    for c in extra_css:
        src = (content_path.parent / c).resolve()
        if not src.exists():
            raise ContentError(f"page.css file not found: {c}")
        if src.parent != out_dir and write_if_changed(out_dir / src.name, src.read_bytes()):
            written.append(str(out_dir / src.name))
    if runtime == "copy":
        written += copy_tree_if_changed(LIB / "study-kit", out_dir / "study-kit")
        written += copy_tree_if_changed(LIB / "workbench", out_dir / "workbench")
    return {"page": out_dir / f"{stem}.html", "data": out_dir / f"{stem}.data.js", "written": written}
