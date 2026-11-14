---
name: study-wb
description: Build and maintain offline study pages for exam preparation - a side-pane workbench (calculator with modes, per-problem notepad, Nspire-style CAS) plus the workflow for turning course sources (homework, practice exams, announcements) into checked, labelled practice problems. Use when creating or updating a study aid, practice page, or exam prep page, when adding a calculator or notepad to a study page, or when verifying that a study page's answers and steps are right.
metadata:
  version: "0.1.20261113182207"
---

# study-wb

Study workbench: the tools a student keeps open while practising, and the
workflow that turns a course's own material into practice problems that check
themselves.

## Host-project boundary

This skill is a portable mechanism that runs in a host project. The host supplies
locations, project configuration, content, dependencies, and domain decisions;
the skill supplies reusable instructions, tooling, schemas, and tests. A linked
`SKILLS/<name>` path is the same shared implementation, and work can proceed
through that visible path normally. Only the client agent composes skills; this
skill does not invoke a sibling skill.

## Jobs to be Done

This skill's jobs, stated as **verb + object [+ clarifier]**:

> **Equip** a study page *with a calculator and notepad that work offline on any page, with no build step* - built
> **Build** a practice page *from host problem files, every answer labelled by where it came from* - built
> **Verify** a study page *by running every problem's steps and checking every answer box, in a real browser* - built

It does not decide what an answer is, write course content, or grade anyone.
Answers come from the host's sources; this skill renders, checks and labels
them, and says so when a value is calculated rather than graded.

The workflow these tools serve, including the parts no tool can do
(collecting sources, transcribing, labelling):
[references/howto_create_study_aid.md](references/howto_create_study_aid.md).

## Quick start

```bash
cp SKILLS/study-wb/assets/template_01/content.example.yaml my-page.yaml   # next to where the page should live
python SKILLS/study-wb/scripts/validate_study_data.py my-page.yaml
python SKILLS/study-wb/scripts/build_study_aid.py my-page.yaml           # writes my-page.html beside it
python SKILLS/study-wb/scripts/verify_page.py my-page.html               # every problem, headless Chrome/Edge
python SKILLS/study-wb/tests/test_build.py                               # the whole pipeline and its failure cases
node SKILLS/study-wb/lib/workbench/TI-Nspire/cas.test.js                   # TI-Nspire engine (64 cases)
python SKILLS/study-wb/tests/test_nspire_input.py                          # TI-Nspire typing, paste and keys in Chrome/Edge (16 checks)
python SKILLS/study-wb/tests/test_study_kit_steps.py                        # step-by-step play, pause, stop and URL state (11 checks)
```

Edit the content file, never the built page. Details:
[assets/template_01/README.md](assets/template_01/README.md).

## Rule: workbench changes must pass their tests

Any change under `lib/workbench/` (including the TI-Nspire emulator in `TI-Nspire/nspire.js` and `cas.js`) must pass, in this order, before the change is reported as done or any course page is rebuilt:

1. `node lib/workbench/TI-Nspire/cas.test.js` (must print `64/64 pass`)
2. `python tests/test_nspire_input.py` (must print `16/16 passed`)
3. `python tests/test_build.py` (must report 7 of 7)
4. `python tests/test_study_kit_steps.py` (must print `11/11 passed`)

Add a test for every behaviour you add or fix, in the same change. A failing test means the change is not done: fix the code or the test, never skip or weaken a check to get a pass. Edit the skill source, not the copies a course build writes.

## What ships today

| Path | What it is | Status |
|---|---|---|
| `lib/workbench/` | Collapsible side pane: calculator (Basic, Scientific, Programming, Financial, Statistics, two Nspire-style engineering modes), per-problem notepad (type or draw), sticky notes floating over the page (colours, drag, resize, minimize, arrange), per-tool show/hide, copy/paste, resize. One `<script>` tag; injects its own CSS. | built, verified |
| `lib/study-kit/` | Builds a whole practice page from one data object (`window.STUDY_DATA`): two-level navigator, answer boxes from tokens, step engine, checker with per-box tolerance, keystroke tables from a calculator simulator, timer, read-aloud, options, and `StudyKit.verify()`. Contract: [references/data_schema.md](references/data_schema.md). | built, verified |
| `scripts/` | `build_study_aid.py` (content file → page, --runtime copy\|link for portable or in-skill pages, writes only changes), `validate_study_data.py` (static checks), `verify_page.py` (headless browser: every problem), `make_periodic_data.py` (118 elements from PubChem), `build_examples_index.py` (gallery data), `study_wb_lib.py` (the implementation), `bump_build.py`. | built, verified |
| `assets/template_01/` | Page shell, theme layer, and a starter content file using every widget. | built, verified |
| `tests/test_build.py` | End to end: validate, build, idempotent rebuild, headless verify, and three failure cases that must be caught. | 7 of 7 pass |
| `tests/test_study_kit_steps.py` | Step-by-step controls: Next step, Pause, Resume, Stop, the URL step count (`k=`), reload, Restart, and verify without speech. | 11 of 11 pass |
| `tests/test_nspire_input.py` | TI-Nspire emulator in headless Chrome/Edge: every printable key, typed expressions, Enter, paste (trim, line breaks, caret, empty), paste inside page inputs, Backspace, Escape. | 16 of 16 pass |
| `references/` | Workflow, source handling, verification, failure modes, data contract, widgets, the workbench contract. | written |
| `examples/` | Five example pages with invented content (minimal, chemistry, circuits, mechanics, accounting_basics) with searchable gallery, 22 problems total. Gallery: search, filter by subject, theme selector (dark/light/green/red), problem count and label split visualization, widget and tool chips. Each example has a README and verified build. | built, verified |
| `lib/workbench/periodic/` | 118-element periodic table tool (opt-in), with search, click-to-element details, calculator integration, and source attribution (PubChem). Generated from `scripts/make_periodic_data.py`. | built, verified |
| `scripts/build_examples_index.py` | Generate the gallery data file from content YAMLs so the gallery never drifts from the examples. | built |

Use the workbench now:

```html
<script src="workbench/workbench.js" data-key="my-page-bench"></script>   <!-- just before </body> -->
```

Copy `lib/workbench/` next to the page (as `workbench/`). Give each page its
own `data-key`. Each tool (calculator, notepad) has a small round × that
collapses it into a "+ Name" button at the top of the pane. Details:
[references/workbench.md](references/workbench.md).

A built page loads, in order: `study-kit/study-kit.css`, `<name>.data.js`
(`window.STUDY_DATA = {...}`), `study-kit/study-kit.js`, then the workbench.
The build writes all of that; see the quick start above.

## Layout

```
study-wb/
├── SKILL.md                 this file; the one home of the version
├── README.md                drop-in guide
├── JOURNAL.md  MEMORY.md    history and distilled lessons
├── docs/ROADMAP.md          declared work, with what blocks each item
├── references/              how-to, source handling, verification, gotchas, contracts
├── assets/template_01/      page shell, theme layer, starter content file
├── lib/workbench/           the side pane and the two Nspire components
├── lib/study-kit/           the practice-page runtime (js + css)
├── scripts/                 build, validate, verify; study_wb_lib.py is the implementation
├── examples/                worked examples (content files only)   - roadmap
└── tests/                   test_build.py: the pipeline end to end
```

`lib/` is runtime that a host page loads. `scripts/` is tooling that runs on the
author's machine. Neither reads host content except through paths the host
passes in.

## Where things live

| Layer | Holds | Where |
|---|---|---|
| Skill | runtime, template, build and check tools, references | this folder |
| Project (host, tracked) | problem files, source PDFs, page config, built pages | the host's course folder and `.config/study-wb/` |
| Personal (host, ignored) | nothing is needed today | `.personal/study-wb/` if that ever changes |

Host content never enters this folder. Examples here are anonymized: invented
companies, numbers and names; no instructor, grade, date or email from any
course. Copyrighted textbook text is never copied in.

## Rules that are not negotiable

1. **Never invent a problem, number or date.** Every problem is transcribed from
   a host file, and names that file.
2. **Label every answer** as *graded key* (the source shows it marked correct),
   *calculated* (no key exists) or *generated* (an invented drill variant).
   An unlabelled answer is not finished.
3. **Flag, do not fix, answer-key oddities.** Show the key and the method, and
   tell the user.
4. **Verify in a real browser before saying it works.** A page that parses is not
   a page that works. See [references/verification.md](references/verification.md).
5. **Never claim progress not seen.** A stub with links is not a study page.

## References

Start with the workflow, then the gotchas:

- [references/howto_create_study_aid.md](references/howto_create_study_aid.md) - end to end
- [references/source_handling.md](references/source_handling.md) - PDFs, dates, keys, announcements
- [references/verification.md](references/verification.md) - what "done" means
- [references/data_schema.md](references/data_schema.md) - the page data contract
- [references/widgets.md](references/widgets.md) - answer-widget shorthand for content files
- [references/common_failure_modes.md](references/common_failure_modes.md) - every mistake made once
- [references/workbench.md](references/workbench.md) - the side pane's contract
- [references/url_state.md](references/url_state.md) - the address bar keeps the open problem and answers; the Options checkbox (on by default)

## Personal data boundary

This skill ships a mechanism, and stores nothing belonging to one person: no
name, contact details, home region, employment history, or account handle; no
stated preferences such as industries someone will not work in; no credentials,
and no templates or documents the user authored.

That is not a style preference. A skill carrying any of it still runs perfectly,
reports nothing, and is no longer reusable - it has become a copy of one setup,
and it leaks the moment it is shared.

Anything specific is supplied at run time by the caller or read from
user-owned configuration outside this folder, conventionally
`.personal/<this-skill>/manifest.json`, which the host keeps out of version
control. Where this skill ships an example of that configuration it lives in
`assets/` with `.example.` in the name, carries placeholders only, and is never
read at run time.

If personal configuration is required and absent, stop and say so. Never fall
back to a built-in default: a default that stands in for someone's own settings
produces output that looks valid and is not, and nothing downstream can tell.

## Versioning

`MAJOR.MINOR.BUILD`. BUILD is a DATETIME STAMP (below). MAJOR and MINOR change
only on the skill owner's explicit instruction; agents refresh BUILD after any
change with `python scripts/bump_build.py`. The version lives only in this
file's `metadata.version` and covers `lib/workbench/` too.

## Stamps

```
DATE STAMP        YYYYMMDD
DATETIME STAMP    YYYYMMDDHHmmss
```

A DATE STAMP names a day. A DATETIME STAMP names an instant within a day, down to
the second. Both exist so a filename, an identifier, and a folder can be sorted
and matched as plain text.

| Element | Meaning | Range |
|---|---|---|
| `YYYY` | year | four digits |
| `MM` | month | 01 to 12 |
| `DD` | day | 01 to 31 |
| `HH` | hour, 24-hour clock | 00 to 23 |
| `mm` | minutes | 00 to 59 |
| `ss` | seconds | 00 to 59 |

Case carries meaning: **`MM` is month, `mm` is minutes.** Never write `hh`.
Digits only. Zero padded. No separators, no timezone suffix, no milliseconds.
**Times are Pacific**, `America/Los_Angeles`, never UTC. **Never rewrite a stamp
that has been issued.** A DATE STAMP is not a shortened DATETIME STAMP.

## The learning loop

This skill owns the knowledge, the experience, the style, and the how-to for
building and checking study pages, and applies that expertise outward to
whatever course it is dropped into. It is the expert; the host is the caller.

**Whenever a calling project improves something in this domain, that is a
trigger, not a footnote.** Ask immediately:

> What can we learn and generalize from this?

1. **Name the lesson.** What actually went wrong, or what worked better.
2. **Strip the host.** Remove its course codes, names, paths and vocabulary.
3. **Decide where it lands** - a failure mode, a template, a check in a script,
   or a capability in `lib/`.
4. **Prefer executable over prose.** A written rule depends on someone
   remembering it. A check does not.

If a lesson cannot survive having the host's vocabulary removed, it belongs to
the host, not here.

## Artifact integrity

- Never add watermarks, hidden text, invisible characters, tracking markers, or concealed metadata to generated artifacts.
- Write in a natural, specific, evidence-grounded voice. Avoid generic filler, invented claims, canned phrasing, repetitive sentence patterns, and unnecessary jargon.

## Host integrity delegation

This skill owns portable mechanisms, schemas, validators, renderers, and neutral result contracts only. The host orchestrator owns deployment layout, allowed paths, retention, cross-record rules, and final acceptance. The client agent invokes this skill with host-provided configuration; skills never invoke one another. Return validation failures loudly. Never choose a host destination, create an undeclared compatibility output, or treat a generated projection as canonical host data. The host decides whether a failure requires configuration or a reusable-skill improvement.
