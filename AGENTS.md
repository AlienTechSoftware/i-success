# Agents contract: I-SUCCESS

Rules for anyone, person or agent, working in this repository. The detail is in the skills under
[`SKILLS/`](SKILLS/README.md); this file is the short version and the inventory.

## What this is

I-SUCCESS: adaptive practice for every grade, from Pre-K to university, in pure Rust with egui,
built the way the ArtCraft Craft apps are. Math comes first. See [`README.md`](README.md).

## Before you change anything

1. Read this file and the skill for your task (table below).
2. Check `git status` and your branch. Do not work on `main`; preserve other people's uncommitted
   work.
3. Read the code you are about to change and its tests. State the issue and its likely cause
   before editing.
4. For a substantial change, write the acceptance criteria and the tests first, and see the
   tests fail for the right reason.

## Skills

| Skill | Owns |
|---|---|
| [`is-code`](SKILLS/is-code/SKILL.md) | The code guide: crate layers, never crash, errors, tests without mocks, style, dependencies |
| [`is-devx`](SKILLS/is-devx/SKILL.md) | Setup, `run.cmd`, `cargo xtask`, coverage, hooks, the CI workflow, branches and commits |
| [`is-content`](SKILLS/is-content/SKILL.md) | `content/catalog.toml`: original, labelled problems whose steps reach their answers |
| [`is-ui`](SKILLS/is-ui/SKILL.md) | The egui window: screens, theme and contrast, fonts, accessibility labels, UI tests, screen pictures |
| [`study-wb`](SKILLS/study-wb/SKILL.md) | The JavaScript proof of concept (kept as the one exception to Rust only) |

## Rules

- **Never crash.** No `unwrap`, `expect`, `panic!`, `todo!`, `unimplemented!`, `unreachable!`
  outside tests; no `unsafe`. The lints deny them.
- **Layers.** `model` < `content` < `engine` < `ui-egui` < `apps`. Only `ui-egui` and `apps` use
  egui or eframe.
- **No mocks.** Tests use the real code and real data. UI tests drive the real window.
- **Original content only**, every problem labelled `graded`, `calculated` or `generated`.
- **Clean room.** Copy no other product's code, questions, text, images or marks.
- **Names.** Some product names must not appear anywhere in this repository; `cargo xtask names`
  checks every text file. Keep them out of commit messages and pull requests too.
- **Assets.** Every image or font has a row in `ATTRIBUTION.md`, in the same change.
- **No personal data** in any file: no names, emails, schools or private material.
- **Look at the screens** after a visible change (`is-ui`); green tests are not enough.
- **Git.** Do not commit, push, publish or release without the owner's explicit go. No commit
  message or pull request says an AI assistant wrote it. Never skip a hook with `--no-verify`.

## Commands

```bash
cargo xtask ci          # fmt, clippy -D warnings, every test, names
cargo xtask coverage    # line coverage with its floor (needs cargo-llvm-cov)
cargo run --release -p i-success
git config core.hooksPath .githooks    # once per clone: turn the hooks on
```

On Windows, `.\run.cmd` builds and runs the app, and `.\run.cmd help` lists the rest.

## Gates

| Gate | Command | Status |
|---|---|---|
| Pre-commit | `.githooks/pre-commit`: fmt check, names | ENFORCED once `core.hooksPath` is set |
| Pre-push | `.githooks/pre-push`: `cargo xtask ci` | ENFORCED once `core.hooksPath` is set |
| Pull request and `main` | `.github/workflows/ci.yml`: fmt, names, clippy, build and test on three platforms, coverage floor | ENFORCED when branch protection requires the `CI` check |

## Done means

The commands you ran and their output, the files you changed, and what is still open. Do not
call work done or ready to test without that.
