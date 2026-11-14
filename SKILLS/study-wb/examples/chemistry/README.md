# Chemistry Study Page (example)

Introductory chemistry (invented content). Shows the opt-in periodic-table tool, numeric answers with a two-decimal tolerance, a classify widget with automatic steps, and keystroke lines. Atomic masses are PubChem's values, the same ones the workbench's periodic table shows.

| | |
|---|---|
| Content file | [`chemistry.yaml`](chemistry.yaml) |
| Built page | [`chemistry.html`](chemistry.html) (built with `runtime: link`: it uses the skill's own `lib/`) |
| Problems | 4 in 2 group(s): Moles, Table |
| Labels | 2 calculated, 2 generated |
| Widgets | `answers`, `classify` |
| Workbench tools | calculator, periodic, notepad, stickies |
| Sources | [`sources/worksheet_1.html`](sources/worksheet_1.html) (invented) |

## Commands (from this folder)

```bash
python ../../scripts/validate_study_data.py chemistry.yaml
python ../../scripts/build_study_aid.py chemistry.yaml
python ../../scripts/verify_page.py chemistry.html
```

The scripts live once in `../../scripts/`; they are not copied here. Edit the YAML, never the built
`chemistry.html` / `chemistry.data.js`. Format: [data_schema.md](../../references/data_schema.md),
[widgets.md](../../references/widgets.md). All content is invented; see the gallery: [../index.html](../index.html).
