# Accounting Basics Study Page (example)

Introductory bookkeeping for an invented bike repair shop (invented company, names and numbers). Shows the accounting equation, a classify table, debit and credit picks in a table, the statement-effects grid, straight-line depreciation and an unearned-revenue TWIST.

| | |
|---|---|
| Content file | [`accounting_basics.yaml`](accounting_basics.yaml) |
| Built page | [`accounting_basics.html`](accounting_basics.html) (built with `runtime: link`: it uses the skill's own `lib/`) |
| Problems | 7 in 3 group(s): Basics, Entries, Adjusting |
| Labels | 7 generated |
| Widgets | `answers`, `choice`, `classify`, `fset`, `table` |
| Workbench tools | calculator, notepad |
| Sources | none: every problem is a generated drill |

## Commands (from this folder)

```bash
python ../../scripts/validate_study_data.py accounting_basics.yaml
python ../../scripts/build_study_aid.py accounting_basics.yaml
python ../../scripts/verify_page.py accounting_basics.html
```

The scripts live once in `../../scripts/`; they are not copied here. Edit the YAML, never the built
`accounting_basics.html` / `accounting_basics.data.js`. Format: [data_schema.md](../../references/data_schema.md),
[widgets.md](../../references/widgets.md). All content is invented; see the gallery: [../index.html](../index.html).
