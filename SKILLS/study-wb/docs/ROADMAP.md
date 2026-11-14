# Roadmap

Declared work, in order. Each item says what it delivers, how it is checked,
and what blocks it. Nothing here is built until it moves into `SKILL.md`'s
"What ships today" table.

## Done

- **Step 1** (2026-10-31): skeleton, references, workbench moved in.
- **Step 2** (2026-10-31): `lib/study-kit/` runtime and the data contract
  (`references/data_schema.md`); workbench tool show/hide. Acceptance: a host's
  32-problem hand-built page, exported to data and rebuilt with only this
  runtime, passes `StudyKit.verify()` with no content errors and no console
  messages.
- **Step 3** (2026-10-31): `scripts/build_study_aid.py`, `validate_study_data.py`,
  `verify_page.py` (headless browser), `study_wb_lib.py`; widget shorthand
  (`classify`, `answers`, `choice`, `table`, `fset`; `references/widgets.md`);
  `assets/template_01/` with a starter content file; `tests/test_build.py`
  (8 of 8, including three failure cases that must be caught). Decision: page
  configuration (output name, template, workbench tools) lives in the content
  file's `build:` and `workbench:` keys, so no separate host manifest is needed.
- **Step 5, first host page** (2026-10-31): the host's newest exam page now
  builds from a content file and passes `verify_page.py` (32 problems). The
  hand-built page stays in the host's version control as the fallback.

## Step 3 leftovers

- **Calculator plug-ins.** Answers are stated in the content file today. A host
  may later supply a small JS calculator per problem type that the self-test
  compares with the stated graded keys and that generates drill variants.
- **More widgets** when a real page needs them: select-all, statement tables
  with subtotal rows, units with significant-figure checking.

## Step 4 - examples

Examples are content files (YAML or JSON) plus any PDFs, HTML or CSS they need.
They reuse `lib/workbench/` and `lib/study-kit/` unless an example exists to
show an override. Each example has a `README.md` with its exact validate,
build and verify commands pointing at the one copy of the scripts in
`scripts/` (scripts are never copied into examples; copies drift), and
`tests/` builds and verifies every example. All are anonymized: invented names and numbers, no
instructor, grade, date or email, no copyrighted problem text.

| Example | Shows |
|---|---|
| `accounting_basics/` | Bookkeeping for an invented bike repair shop: the accounting equation, classifying accounts, debits and credits, the statement-effects grid, straight-line depreciation, unearned revenue. |
| `circuits/` | Ohm's law, series and parallel resistance, power; numeric boxes with units. |
| `mechanics/` | Kinematics, forces, energy; unit handling and significant figures. |
| `chemistry/` | Molar mass, stoichiometry; uses the periodic-table tool. |
| `minimal/` | The smallest working page. |

## Workbench: tool show/hide, what is left

Built: a round × on each tool collapses it into a `+ Name` button; offered and
default-shown tools are set on the script tag. Left: restricting calculator
**modes** (for example only Basic, to match what an exam allows), and loading a
hidden tool's code only when it is first shown.

## Workbench: periodic-table tool

An interactive periodic table (symbol, name, atomic number, standard atomic
weight, group, period, category), searchable, with a click that copies the
atomic weight into the calculator. Data shipped as a static table with its
source and edition named. Off by default; enabled per page.

## Read-aloud through a local voice service (optional)

Today read-aloud uses the browser's built-in speech: client-only, no setup.
A host that already runs a local, offline text-to-speech service can offer a
much better voice. The design:

- the runtime exposes one speaking function and a provider setting:
  `browser` (default) or `http`, with the service URL in the host config;
- the `http` provider sends sentence-sized chunks to a service on `127.0.0.1`
  and plays the returned audio, with the same Stop and watchdog behavior;
- if the service is unreachable, it says so and falls back to `browser`;
- text never leaves the machine: only loopback addresses are accepted.

The skill ships the provider hook and documents the request and response
shape. The host runs the service and wires it to whatever speech engine it
uses. Blocked by: nothing technical; deferred because client-only is enough
today.

## Known open questions

- Whether problem-type calculators should be shareable across hosts as optional
  "type packs" (for example one for accounting variances), or stay in each host.
- Whether the TI-Nspire skin photo should be optional at build time for hosts
  that publish their pages.
