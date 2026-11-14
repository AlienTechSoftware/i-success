---
name: is-content
description: Writing I-SUCCESS practice content. Use when adding or changing subjects, level bands, grades, skills or practice problems in content/catalog.toml, or when checking that content is original, correct and drawable.
license: MIT
metadata:
  version: "0.1.20261113"
  related_skills: [is-code, is-ui]
---

# is-content - practice content

## Job to be done

Add practice that a learner can trust: original problems, right answers, worked steps that reach
those answers, and text the window can draw.

## Where it lives

One file, `content/catalog.toml`, embedded into the app at build time. Its shape is the
`Catalog` type in `crates/model/src/lib.rs`; unknown fields are refused, not ignored.

| Table | Holds |
|---|---|
| `[[subject]]` | `id`, `name`, `ready`. A subject that is not ready is shown disabled, never hidden. |
| `[[band]]` | `id`, `name`, `range`, `grades` (ids in display order), `note` when it has no grades yet |
| `[[grade]]` | `id`, `badge`, `name`, `summary`, `accent` (`#rrggbb`) |
| `[[skill]]` | `id`, `subject`, `grade`, `code` (such as `C.2`), `title` |
| `[[skill.problem]]` | `label`, `prompt`, `answer = [...]`, `step = [...]` |

An answer box: `{ name, label, answer, tol, prefix, suffix }`. A numeric `answer` is checked
within `tol` (0 means exact); anything else is checked as text, ignoring case and outer spaces.
A step: `{ say, fill = { box = "value" } }`; a step may fill nothing and only explain.

## Rules

1. **Original only.** Write every problem, summary and step yourself. Do not copy questions,
   skill lists, wording or numbers from any other product, book or site. Ideas of what a grade
   learns are common knowledge; their phrasing is not.
2. **Label every problem** (the study-wb rule): `graded` when an official answer key exists,
   `calculated` when it was worked out with no key, `generated` for an invented drill. Everything
   in the catalog today is `generated`.
3. **The steps must reach the answer.** Every box is filled by some step, and following all the
   steps must give an answer the checker accepts. The tests prove it.
4. **Use only drawable characters.** egui panics on a character none of its installed fonts
   has. Safe: plain ASCII, `•` `×` `÷` `−` `‹` `›` `·`. Not drawable: `★` `●` `✓` `▸` and most
   emoji. Check anything else first (see `is-ui`).
5. **Write for the grade.** Short sentences, one idea per step, numbers a learner of that grade
   meets. Say the method, not only the result: "Make a ten: 9 + 1 = 10, leaving 4 of the 5."
6. **Keep ids stable.** A skill's `id` may be saved by the app one day; change a title freely,
   an id only with a migration.
7. **A new band or grade needs a place:** every grade belongs to exactly one band, and a band with
   no grades says why in `note`.

## Adding a skill

1. Pick the grade and the next free `code` in that grade (codes are per grade, in order).
2. Write two problems or more, each with its steps.
3. Run the checks below. Then open the skill in the app and work it through once as a learner.

## Checks

```bash
cargo test -p i-success-content     # the catalog loads and every reference resolves
cargo test -p i-success-engine      # every problem's steps reach an accepted answer
cargo test -p i-success-ui-egui --test ui every_problem_and_step   # every problem draws
cargo xtask names                   # no forbidden product name
```

The content tests name each broken reference ("skill g1-add-20 problem 2: no step fills
answer sum"); fix the content, never the test.
