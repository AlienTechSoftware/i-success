---
name: is-devx
description: I-SUCCESS developer experience. Use when setting up a machine, building or running the app, running checks, coverage or the screen pictures, working with the git hooks or the CI workflow, or making a branch, commit or pull request in this repository.
license: MIT
metadata:
  version: "0.1.20261113"
  related_skills: [is-code, is-ui]
---

# is-devx - developer experience

## Job to be done

Get from a fresh clone to a running app, check work the same way CI will, and land it through
the same gates every time.

## First day

1. Install Rust with `rustup`. The exact version is pinned in `rust-toolchain.toml` (1.99.1);
   `rustup install` in the repository root installs it with clippy and rustfmt. The oldest Rust
   that builds the code is `rust-version` in `Cargo.toml` (1.95).
2. On Linux, install the libraries eframe and wgpu build against (the list is `LINUX_DEPS` in
   `.github/workflows/ci.yml`).
3. Turn the git hooks on, once per clone:

   ```bash
   git config core.hooksPath .githooks
   ```

4. Build and run:

   ```bat
   .\run.cmd
   ```

## Everyday commands

On Windows, `run.cmd` wraps them. Always type `.\run.cmd`: a bare `run.cmd` can start another
program's `run.cmd` from `PATH` (nvm-windows ships one), always in PowerShell, and in cmd when
`NoDefaultCurrentDirectoryInExePath` is set.

| What | Windows | Any platform |
|---|---|---|
| Build and run the app (release) | `.\run.cmd` | `cargo run --release -p i-success` |
| Every check | `.\run.cmd ci` | `cargo xtask ci` |
| Coverage, with its floor | `.\run.cmd coverage` | `cargo xtask coverage` |
| Pictures of the screens | | `cargo test -p i-success-ui-egui --test screens -- --ignored` |
| One crate's tests | | `cargo test -p i-success-engine` |
| Every command | `.\run.cmd help` | |

`cargo xtask ci` runs, in order, stopping at the first failure:

1. `fmt`: `cargo fmt --all -- --check`
2. `clippy`: `cargo clippy --workspace --all-targets -- -D warnings`
3. `test`: `cargo test --workspace`
4. `names`: every text file outside `target`, `.git` and vendored code is searched for product
   names this project must not mention; any whole-word hit fails.

`cargo xtask coverage` needs `cargo-llvm-cov` (installing it is your decision; CI installs a
pinned version). It runs the tests instrumented, writes `target/coverage/lcov.info`, prints a
summary, and fails when line coverage of the library crates is below `COVERAGE_FLOOR_LINES`
(90). The window's `main.rs` and `xtask` are left out.

The screen pictures render offscreen with wgpu, so they need a GPU or a software adapter. They
go to `target/screenshots/` and are never committed or compared; they are for looking at.

## The JavaScript proof of concept

`SKILLS/study-wb` is the early proof of concept: offline practice pages in JavaScript, built by
Python scripts. Its commands are `.\run.cmd poc`, `poc-open`, `poc-build`, `poc-verify`,
`poc-examples` and `poc-test`. They need Python 3 and Node, and Chrome or Edge for `poc-verify`
and `poc-test`. `run.cmd` sets `PYTHONUTF8=1` because the scripts print symbols a default
Windows console cannot encode. Its own guide is `SKILLS/study-wb/SKILL.md`.

## Gates

| When | What runs | Where |
|---|---|---|
| While working | the focused tests of the crate you changed, `cargo fmt` | by hand |
| Every commit | `cargo fmt --check`, `cargo xtask names` | `.githooks/pre-commit` |
| Every push | `cargo xtask ci` | `.githooks/pre-push` |
| Every pull request and push to `main` | fmt, names, clippy, build and test on Linux, Windows and macOS, coverage with its floor | `.github/workflows/ci.yml` |

The workflow's last job is named `CI` and passes only when every other job passed. Branch
protection should require that one check.

The hooks read the working tree, not only what is staged. Do not skip them with `--no-verify`,
and do not edit a hook or the workflow to get past a failure: find the cause, or stop and say
what fails. A flaky test is a failure; rerun it only to diagnose it.

Every action in the workflow is pinned to a full commit, with its release in a comment. Update
a pin in a change of its own.

## Branches, commits and pull requests

- Work on a branch named `<type>/<name>`, where type is one of `feat fix docs test chore
  refactor perf ci build release`, and name is short, lowercase and hyphenated:
  `feat/fraction-skills`, `fix/answer-box-focus`.
- One feature per branch. Stage only the files of that change.
- Subject line: `type(scope): what changed`, in plain words, under about 72 characters.
- No commit message or pull request says an AI assistant wrote it (house rule).
- `main` changes through pull requests. Nobody pushes, publishes or releases without the
  owner's explicit go.
- Before opening a pull request: `cargo xtask ci`, `cargo xtask coverage` if library code
  changed, the screen pictures if the look changed, and a description that says what was run.

## Keeping the docs true

- New command or check: add it to `run.cmd`, to this skill and to `AGENTS.md` in the same
  change.
- New asset: a row in `ATTRIBUTION.md` in the same change; a third-party licence text goes
  beside the files it covers.
- Changed tooling version: `rust-toolchain.toml`, the workflow and this skill together.
