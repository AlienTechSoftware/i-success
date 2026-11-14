# Minimal Study Page (example)

The smallest working page. One group, one problem, one answer box, one step. No timer, no how-to.

| | |
|---|---|
| Content file | [`minimal.yaml`](minimal.yaml) |
| Built page | [`minimal.html`](minimal.html) (built with `runtime: link`: it uses the skill's own `lib/`) |
| Problems | 1 in 1 group(s): Q1 |
| Labels | 1 generated |
| Widgets | body HTML with tokens |
| Workbench tools | calculator, notepad, stickies |

## Commands (from this folder)

```bash
python ../../scripts/validate_study_data.py minimal.yaml
python ../../scripts/build_study_aid.py minimal.yaml
python ../../scripts/verify_page.py minimal.html
```

The scripts live once in `../../scripts/`; they are not copied here. Edit the YAML, never the built
`minimal.html` / `minimal.data.js`. Format: [data_schema.md](../../references/data_schema.md),
[widgets.md](../../references/widgets.md). All content is invented; see the gallery: [../index.html](../index.html).
