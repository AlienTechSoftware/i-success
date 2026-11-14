---
name: is-code
description: The I-SUCCESS code guide. Use when writing, changing or reviewing Rust in this repository - which crate a change belongs in, the never-crash and lint rules, error handling, tests without mocks, naming and style - and before claiming a code change is done.
license: MIT
metadata:
  version: "0.1.20261113"
  related_skills: [is-devx, is-ui, is-content]
---

# is-code - the I-SUCCESS code guide

## Job to be done

Write Rust that fits the workspace: the right crate, no crashes, honest errors, tests that use
the real code, and a change that passes `cargo xtask ci` before anyone calls it done.

This repository follows the shared house rules of the ArtCraft Craft apps, copied verbatim at
the top of `AGENTS.md` (from `standards/` in `storytold/craft-contrib`), with a table of where
this repository does not meet them yet. Where this guide is stricter, this guide wins; it is
never weaker.

## 1. Where a change goes

The workspace is in layers. A crate depends only on crates above it in this list.

| Crate | Owns | Must not |
|---|---|---|
| `crates/model` | The vocabulary: `Catalog`, `Subject`, `Band`, `Grade`, `Skill`, `Problem`, `AnswerSpec`, `Step`, `Label`; `rgb()` | Read files, know egui, check answers |
| `crates/content` | Reading `content/catalog.toml` (embedded with `include_str!`) and checking every reference in it | Know egui, run a practice session |
| `crates/engine` | `check()` for one answer, `Practice` for a session: inputs, verdicts, steps shown, score | Know egui or files |
| `crates/ui-egui` | Everything drawn: `App`, the screens, `theme.rs` | Hold rules the engine should own |
| `apps/i-success` | The window: title, size, icon, `run_native` | Contain screen logic |
| `xtask` | `cargo xtask ci`, `coverage`, `names` | Ship in the app |

Questions to settle before writing:

- Is it a rule about answers or progress? It goes in `engine`, with a unit test, and the UI calls it.
- Is it new content, or a new field in content? The field goes in `model`, its checks in
  `content::check`, and the content itself in `content/catalog.toml`. See `is-content`.
- Is it only how something looks or is reached? It goes in `ui-egui`. See `is-ui`.
- Only `ui-egui` and `apps/` may depend on egui, eframe or winit.

## 2. Never crash

- No `unwrap`, `expect`, `panic!`, `todo!`, `unimplemented!` or `unreachable!` outside tests.
  The workspace lints in `Cargo.toml` deny them; `clippy.toml` allows them in tests only.
  `unsafe` is forbidden.
- Return a `Result` or an `Option` and let the caller decide. A bad catalog makes the window say
  why (`App::with_catalog(Err(..))`), it never starts empty or exits.
- Treat input as hostile: anything typed, anything read from a file. `parse_number` returns
  `None` for text that is not a finite number; follow that shape.
- Indexing: prefer `get`, `iter().zip`, `split_first`. A slice index is a panic waiting for a
  short list.
- egui panics on a character no installed font can draw. Only Ubuntu-Light and egui-icons are
  installed for text: check a new symbol before using it (see `is-ui`).
- Every crash fix comes with a test that panicked before the fix (house rule).

## 3. Errors

- One error type per crate boundary, an `enum` with a `Display` that a person can read
  (`ContentError` is the pattern: `Parse(String)` and `Invalid(Vec<String>)`, one message per
  problem, naming the thing that is wrong).
- Report every problem found, not the first one: `content::check` collects all broken references.
- Do not hide an error to make a step pass. If something cannot be done, say so in the UI.

## 4. Tests

- **No mocks, fakes or stubs of our own code.** Test with the real code and real data: the
  built-in catalog, a small TOML catalog in the test, a real temporary folder.
- Unit tests live beside the code (`#[cfg(test)] mod tests`). UI tests live in
  `crates/ui-egui/tests/` and drive the real window through the accessibility tree
  (`egui_kittest`), by label and role. See `is-ui` for how.
- Name a test for what it proves: `a_right_answer_scores_once`,
  `every_broken_reference_is_named`.
- A bug fix adds the test that fails without the fix. A new feature writes its acceptance tests
  first and sees them fail for the right reason.
- Keep the catalog-wide tests green: `the_builtin_catalog_is_sound`,
  `the_builtin_steps_lead_to_correct_answers`,
  `every_problem_and_step_in_the_catalog_can_be_drawn`.
- Coverage has a floor (`COVERAGE_FLOOR_LINES` in `xtask/src/main.rs`). Raise it when coverage
  rises; never lower it to let a change through.

## 5. Style

- `cargo fmt` decides layout (`rustfmt.toml`: width 150, `use_small_heuristics = "Max"`, the
  default four-space indent). Do not hand-format against it.
- Doc comments say what a thing is for and what it refuses, in plain sentences. A module starts
  with a `//!` paragraph saying its job.
- Names say what something is in the learner's terms: `Practice`, `steps_shown`, `solved`, not
  `state2` or `flag`.
- Constants for every number with a meaning (`CARD_MIN_WIDTH`, `MAX_COLUMNS`,
  `COVERAGE_FLOOR_LINES`), each with a comment saying why it is that value.
- Text in the UI is short, plain and kind, for young learners: "Not yet", not "Incorrect".
- No `println!` in library crates. The app writes one line to stderr when the window cannot
  open; when the app gains logging, it uses the `log` facade, as the Craft apps do.
- Time, when it arrives, goes through `chrono` (house rule).

## 6. Dependencies

- Ask before adding one. Prefer what the Craft apps already use (versions in the workspace
  `Cargo.toml` follow NoteCraft and WordCraft) and the shared `craft-libs` crates.
- The licence must be on the suite's licence allowlist, copied verbatim at the top of
  `AGENTS.md`. A licence outside it is a stop-and-ask (house rule 9).
- Declare it once in `[workspace.dependencies]` and use `{ workspace = true }` in the crate.

## 7. The one exception: the JavaScript proof of concept

The suite's house rules say native Craft apps are Rust only. `SKILLS/study-wb` is handwritten
JavaScript and Python. It is kept on purpose, as the early proof of concept that shows how
practice pages behave, and it is not part of the app. Do not add JavaScript anywhere else, and
do not move app behaviour into it.

## 8. Clean room and names

The full procedure, with the record to keep, is `is-clean-room`.

- Learn from behaviour you can see and from public specifications. Copy no other product's code,
  questions, wording, images or marks.
- `cargo xtask names` fails if any text file names a product this project must not mention. Do
  not name it in code, comments, tests, commit messages or pull requests either.

## Done means

Run, in the repository root, and read the output:

```bash
cargo xtask ci        # fmt, clippy -D warnings, every test, names
cargo xtask coverage  # when you changed library code
```

Then report the commands and their results. If the change touches the screen, also follow the
"look at it" step in `is-ui`. A change is not done because it compiles.
