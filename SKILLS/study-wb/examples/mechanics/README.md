# Mechanics Study Page (example)

Mechanics (invented content). Shows unit-labelled answers, a classify widget, a page stylesheet override (page.css: [mechanics.css]) and a workbench limited to two tools.

| | |
|---|---|
| Content file | [`mechanics.yaml`](mechanics.yaml) |
| Built page | [`mechanics.html`](mechanics.html) (built with `runtime: link`: it uses the skill's own `lib/`) |
| Problems | 5 in 2 group(s): Motion, Energy |
| Labels | 3 calculated, 2 generated |
| Widgets | `answers`, `classify` |
| Workbench tools | calculator, notepad |
| Sources | [`sources/problem_set_1.html`](sources/problem_set_1.html) (invented) |

## Commands (from this folder)

```bash
python ../../scripts/validate_study_data.py mechanics.yaml
python ../../scripts/build_study_aid.py mechanics.yaml
python ../../scripts/verify_page.py mechanics.html
```

The scripts live once in `../../scripts/`; they are not copied here. Edit the YAML, never the built
`mechanics.html` / `mechanics.data.js`. Format: [data_schema.md](../../references/data_schema.md),
[widgets.md](../../references/widgets.md). All content is invented; see the gallery: [../index.html](../index.html).
