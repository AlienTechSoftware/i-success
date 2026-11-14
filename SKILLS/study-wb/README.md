# study-wb

Offline study tools and the workflow for building practice pages that check
themselves.

## Use the workbench today

1. Copy `lib/workbench/` next to your page, as `workbench/`.
2. Add one line just before `</body>`:

   ```html
   <script src="workbench/workbench.js" data-key="my-page-bench"></script>
   ```

3. Give every page its own `data-key`. The page needs a `<main>`; a fixed
   `footer.timer` is respected. Nothing else is required.

You get a collapsible side pane with a calculator (Basic, Scientific,
Programming, Financial, Statistics, two Nspire-style engineering modes) and a
notepad with one sheet per problem (type or draw). Everything runs offline,
from `file:///`, with no build step.

## Build a study page

Follow [references/howto_create_study_aid.md](references/howto_create_study_aid.md).
The build tooling that automates it is on the
[roadmap](docs/ROADMAP.md).

## What is where

| Path | What |
|---|---|
| `SKILL.md` | Jobs, boundaries, rules, the version |
| `references/` | Workflow, source handling, verification, failure modes, workbench contract |
| `lib/workbench/` | The side pane and its two Nspire components |
| `docs/ROADMAP.md` | Declared work |
| `JOURNAL.md`, `MEMORY.md` | What happened, and what was learned |

## Notes

The Nspire tools approximate the TI-Nspire CX II CAS workflow; they are not
TI's software. TI's product photo of the handheld is not included in this
repository; without it the device draws a labelled keypad. The tools are for
study: check what your exam's proctoring allows.
