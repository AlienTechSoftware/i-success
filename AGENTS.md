<!-- craft-house-rules:start core source=0f6cc4848ef0d2c5346b39d0ed6305c4cf94b0d7 sha256=540e6cea75d12d0710c3dca89658328e81e508ecef102446ca5bb95b7c0b92bb -->
## House rules

These apply in every Craft repository. A later rule may be stricter, not weaker. The source is `standards/house-rules-core.md` in `storytold/craft-contrib`. Propose changes there, not in a copy.

1. **A person is accountable.** Whoever runs an agent answers for what it opens and for its review comments.
2. **Check, then claim.** Before writing code, read the issue comments, search pull requests for `#N` and the keywords, and check recent commits on `main`. Comment on the issue first. Release a claim you will not finish.
3. **Verify, don't guess.** Open a definition before using it. Confirm the cause in the code, even when someone names a location.
4. **Keep fixes narrow and tested.** Fix what the issue describes, where the bug is. Add a test that fails without the fix.
5. **Review the diff before opening a pull request.** Identifiers exist as used, the test fails without the fix, nothing unrelated changed, and the description is true.
6. **Look for a better pull request.** If another fixes the same thing, close yours when it is better or equal, and say why.
7. **Report only what ran.** Say what you tested and what you could not run. Without a local build or test, say so and rely on CI before marking ready.
8. **`main` changes through a pull request.** Do not push to it. Branch protection enforces this. There is no exception.
9. **Stop and ask only about** licensing outside the allowlist, publishing, releases, a new remote, secrets, spending money, destructive git, and anything else hard to undo. Otherwise keep working. `plan/` is a gitignored notebook, not rules. Without it, do not ask for it and do not stop.
10. **Keep secrets and personal details out** of the repository, logs and requests.
11. **CI stays shared.** Workflows call `storytold/craft-common-actions`. Do not change CI in a feature or fix pull request. If CI cannot cover a change, open an issue there.
12. **Guards say why.** A check that looks removable says what it prevents. Read that before changing it.
13. **Instructions must be readable by everyone.** No notes about one machine, and no links to files a reader cannot open. `craftrules` is retired. Do not link to it.
14. **Keep pull requests moving.** Concurrent pull requests are fine; unanswered actionable feedback is not. Respond in 7 days, a reminder at 14, closure eligible at 30, from when an actionable request waits on the author. Suggestions and unconfirmed bot findings do not start the clock. A fix, explanation or agreed plan resets it; unrelated activity does not. Waiting on a reviewer or maintainer pauses it and does not count against the author. A maintainer decides closure; it is never automatic. Reuse search results, do not poll, and stop at a rate limit.
15. **No agent attribution.** A pull request does not say an agent wrote it. A repository rule may not require that.
<!-- craft-house-rules:end -->
<!-- craft-house-rules:start rust source=0f6cc4848ef0d2c5346b39d0ed6305c4cf94b0d7 sha256=642f46b4ac38cc9e4d10d1ccde19d68cb6bc03d20e4c6236a7535f3047566262 -->
## Rust Craft repositories

These apply to native Craft apps and to shared Rust libraries. Select them by repository type. A repository that merely contains some Rust does not take this block. Rules later in a repository's file may be stricter, but not weaker. The source is `standards/house-rules-rust.md` in [storytold/craft-contrib](https://github.com/storytold/craft-contrib).

1. **Never crash.** Non-test code does not panic and has no `unsafe`, except where the repository file names an exception. Return errors, treat input as hostile, and bound recursion and allocations. New production crate roots copy the `deny` attribute from an existing crate: `clippy::unwrap_used`, `clippy::expect_used`, `clippy::panic`, `clippy::unimplemented`, `clippy::todo`, `clippy::unreachable`. Every crash fix comes with a test that panicked before the fix.
2. **Clean room.** Learn from observed behaviour and public specifications. Do not copy another product's code, assets, strings or artwork. Check a dependency's licence before adding it.
3. **Assets and fonts.** Every asset is original or suitably licensed, and is recorded in `ATTRIBUTION.md` in the same change. Font files live in [storytold/craft-fonts](https://github.com/storytold/craft-fonts), not in the app repository.
4. **Rust only for native Craft apps.** No handwritten JavaScript or TypeScript, and no Tauri, Electron or webview shell, in those apps. Shared tooling follows its documented technical scope and maintainer-approved exceptions. Craft PR Review's existing Tauri and TypeScript UI is one such exception. It does not relax this rule for native apps. Preserve any existing web build.
5. **Time goes through `chrono`.** Do not hand-roll calendar conversion. For dates beyond what `chrono` can represent, follow [standards/time.md](https://github.com/storytold/craft-contrib/blob/main/standards/time.md).
6. **Contributor credits.** Add or edit only your own person's entry in `contributors/people.toml`, and only after asking them. Never guess a name or hand-edit `contributors.json`.

## Licence allowlist

Dependencies and assets use SPDX identifiers. An expression is allowed when every identifier is in this list. A repository may name a shorter list. It may not add an identifier here by editing its own copy of these rules.

- `ISC`
- `MIT`
- `BSD-2-Clause`
- `BSD-3-Clause`
- `Apache-2.0`
- `Unicode-3.0`
- `OFL-1.1`
- `Ubuntu-font-1.0`
- `Bitstream-Vera`
- `CC0-1.0`
- `CC-BY-4.0`
- `CC-BY-SA-4.0`
- `LicenseRef-Public-Domain`

`LicenseRef-Storyteller-Trademark` is not in this list. It covers Storyteller brand marks only, where a repository already says so.
<!-- craft-house-rules:end -->

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
| [`is-clean-room`](SKILLS/is-clean-room/SKILL.md) | What may be used, what may never be consulted, the record to keep, and what to do when something is not clean |
| [`study-wb`](SKILLS/study-wb/SKILL.md) | The JavaScript proof of concept (kept as the one exception to Rust only) |

## Rules

- **Never crash.** No `unwrap`, `expect`, `panic!`, `todo!`, `unimplemented!`, `unreachable!`
  outside tests; no `unsafe`. The lints deny them.
- **Layers.** `model` < `content` < `engine` < `ui-egui` < `apps`. Only `ui-egui` and `apps` use
  egui or eframe.
- **No mocks.** Tests use the real code and real data. UI tests drive the real window.
- **Original content only**, every problem labelled `graded`, `calculated` or `generated`.
- **Clean room.** Copy no other product's code, questions, text, images or marks. Follow
  `is-clean-room` before building anything that resembles an existing product.
- **Names.** Some product names must not appear anywhere in this repository; `cargo xtask names`
  checks every text file. Keep them out of commit messages and pull requests too.
- **Assets.** Every image or font has a row in `ATTRIBUTION.md`, in the same change.
- **No personal data** in any file: no names, emails, schools or private material.
- **Look at the screens** after a visible change (`is-ui`); green tests are not enough.
- **Git.** Do not commit, push, publish or release without the owner's explicit go. No commit
  message or pull request says an AI assistant wrote it. Never skip a hook with `--no-verify`.

## Where this repository stands against the house rules

The two blocks above are copied verbatim from `storytold/craft-contrib` (the markers name the
commit and the SHA-256 of each text; `cargo xtask license-check` refuses an edited copy). This
repository is outside the `storytold` organisation. Where it does not yet meet a house rule, it
says so here rather than weakening the rule:

| Rule | Status here |
|---|---|
| Core 8: `main` changes through a pull request | The first commit was made on `main` before the repository had a remote. From the first push on, `main` changes through pull requests. |
| Core 11: CI calls `storytold/craft-common-actions` | Not met. `.github/workflows/ci.yml` is self-contained. Whether to call the shared workflows is the owner's decision. |
| Rust 3: font files live in `craft-fonts` | Met: no font file is in this repository. |
| Rust 4: Rust only, no handwritten JavaScript | Not met by `SKILLS/study-wb`, the JavaScript proof of concept, kept by the repository owner's decision. It is not part of the app. Add no JavaScript anywhere else. |
| Rust 5: time through `chrono` | No date or time code yet. |
| Rust 6: contributor credits in `contributors/people.toml` | Not set up yet. |

## Commands

```bash
cargo xtask ci          # fmt, clippy -D warnings, every test, names, license-check
cargo xtask coverage    # line coverage with its floor (needs cargo-llvm-cov)
cargo run --release -p i-success
git config core.hooksPath .githooks    # once per clone: turn the hooks on
```

On Windows, `.\run.cmd` builds and runs the app, and `.\run.cmd help` lists the rest.

## Gates

| Gate | Command | Status |
|---|---|---|
| Pre-commit | `.githooks/pre-commit`: fmt check, names, license-check | ENFORCED once `core.hooksPath` is set |
| Pre-push | `.githooks/pre-push`: `cargo xtask ci` | ENFORCED once `core.hooksPath` is set |
| Pull request and `main` | `.github/workflows/ci.yml`: fmt, names, clippy, build and test on three platforms, coverage floor | ENFORCED when branch protection requires the `CI` check |

## Done means

The commands you ran and their output, the files you changed, and what is still open. Do not
call work done or ready to test without that.
