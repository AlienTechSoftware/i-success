# Circuits Study Page (example)

DC circuits (invented content). Shows numeric answers with units and tolerances, a table widget with answer boxes in cells, a multiple-choice question, keystroke lines, and a TWIST variant.

| | |
|---|---|
| Content file | [`circuits.yaml`](circuits.yaml) |
| Built page | [`circuits.html`](circuits.html) (built with `runtime: link`: it uses the skill's own `lib/`) |
| Problems | 5 in 2 group(s): Ohm, Networks |
| Labels | 3 calculated, 2 generated |
| Widgets | `answers`, `choice`, `table` |
| Workbench tools | calculator, notepad |
| Sources | [`sources/lab_sheet_1.html`](sources/lab_sheet_1.html) (invented) |

## Commands (from this folder)

```bash
python ../../scripts/validate_study_data.py circuits.yaml
python ../../scripts/build_study_aid.py circuits.yaml
python ../../scripts/verify_page.py circuits.html
```

The scripts live once in `../../scripts/`; they are not copied here. Edit the YAML, never the built
`circuits.html` / `circuits.data.js`. Format: [data_schema.md](../../references/data_schema.md),
[widgets.md](../../references/widgets.md). All content is invented; see the gallery: [../index.html](../index.html).
