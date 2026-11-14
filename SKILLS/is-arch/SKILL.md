---
name: is-arch
description: Define or review I-SUCCESS architecture, crate boundaries, data flow, and content or media representation. Use when a change crosses model, content, engine, UI, or app layers, or introduces a new content type or renderer.
license: MIT
metadata:
  version: "0.1.20261113"
  related_skills: [is-code, is-content, is-ui, is-devx]
---

# is-arch - I-SUCCESS architecture

## Job to be done

Keep the Rust workspace understandable as I-SUCCESS grows from a practice catalog into an
educational content and assessment system. Define who owns data, rules, rendering, and user
actions before a change crosses crate boundaries.

This guide describes the implementation that exists and the questions to settle for future
course material. A proposed content type is not supported merely because it is named here.

## Current workspace boundaries

The domain dependencies flow upward from `model`: `content` and `engine` depend on it;
`ui-egui` uses `model`, `content`, and `engine`; `apps/i-success` starts the UI. The workspace
dependencies are declared in `Cargo.toml`. Keep lower layers independent of higher ones.

| Crate | Current responsibility | Must not own |
|---|---|---|
| `crates/model` | Pure catalog and practice types: subjects, bands, grades, skills, problems, answers, and steps | File I/O, answer checking, UI types, or media execution |
| `crates/content` | Parse the embedded `content/catalog.toml` and validate its references and rules | Practice-session state or egui |
| `crates/engine` | Check answers and manage a practice session | File access or presentation details |
| `crates/ui-egui` | Draw the screens and translate learner input into engine operations | Rules that belong in the engine or model |
| `apps/i-success` | Configure and start the desktop window | Screen behavior or content rules |
| `xtask` | Repository checks and developer commands | Runtime application behavior |

Read the crate sources before changing this table. Update it when the implementation changes.

## MVC mapping

Use MVC as a responsibility check, not as a requirement to add a class or crate named
`Controller`:

- **Model:** the pure types in `crates/model` describe authored curriculum and practice data.
- **Controller:** `crates/engine` owns practice rules and session transitions. The UI may handle
  immediate input events, but it does not decide whether an answer is correct or how a score
  changes.
- **View:** `crates/ui-egui` presents model and engine state and sends user actions to the engine.
- **Content boundary:** `crates/content` parses and validates authored data. Keep parsing and
  reference checks out of both the view and the practice engine.

The desktop app is the only current presentation entry point. A future importer, authoring UI,
renderer, or service needs a defined contract before it is added; do not route around the layers.

## Data flow

For a learner checking an answer:

```text
UI input -> engine operation -> answer check and session update -> result -> UI rendering
```

For authored content:

```text
content file -> content parser and validator -> model values -> engine or UI consumer
```

Content validation reports all actionable errors and names the affected course, item, or asset.
The view formats errors for the learner or author; it does not silently replace invalid data with
fallback content.

## Course and assessment concepts

I-SUCCESS is intended to manage educational, test, and examination material. The current catalog
has subjects, grade bands, grades, skills, and practice problems. It does not yet define courses,
lessons, learning outcomes, exams, rubrics, or reusable content blocks.

Before adding those concepts, establish which are required by an approved product workflow and
how they relate. Keep these concerns distinct:

- **Course structure:** courses, units, lessons, and learning outcomes organize instruction.
- **Learning material:** explanations, examples, diagrams, media, and activities teach a topic.
- **Assessment:** exams, tests, questions, answer rules, rubrics, and scoring evaluate learning.
- **Learner records:** attempts, responses, scores, and progress are user data, not authored
  course content. Give them an explicit persistence and privacy boundary.

Do not force every course into the existing `Skill` and `Problem` fields. Keep stable identifiers
for authored objects that may be referenced by progress or assessment records. Define versioning
and migration behavior before persisting a format that will change.

## Rich material and runtime boundaries

Course material may eventually include formatted text or HTML, Mermaid diagrams, Vega or D3
charts, video, audio, animations, and small interactive activities or games. For each type,
specify its authored representation, referenced assets, validation rules, renderer, accessibility
behavior, and failure state. A media reference in the model does not mean that a renderer exists.

Keep authored content separate from rendering and execution:

- Store semantic content and typed references in the model. Keep file loading, parsing, and asset
  checks in a content or storage boundary.
- Make rendering a UI or dedicated rendering responsibility. It must not change the meaning of
  a question or calculate its score.
- Treat imported or authored HTML and executable content as untrusted input. Do not execute
  arbitrary scripts or load remote content implicitly. Define a reviewed allowlist and resource
  limits before supporting executable material.
- Prefer declarative, portable specifications when they meet the learning need. Record the limits
  and expected output for every renderer.
- Require accessible alternatives: meaningful descriptions for diagrams, captions and transcripts
  for media, keyboard operation for interactive content, and reduced-motion behavior where
  applicable.
- Keep assessment logic deterministic and testable outside the renderer. Interactive activities
  must expose a clear completion result to the engine rather than hiding scoring in presentation
  code.

The repository's native app is Rust-only, and its current JavaScript exception is `SKILLS/study-wb`.
D3 execution and arbitrary HTML scripting therefore require a separate architecture decision;
do not add a webview, JavaScript runtime, or handwritten JavaScript to the native app by assuming
that rich course content permits it. Resolve the rendering approach with the owner before
implementation.

## Assets and provenance

Keep media as referenced assets with stable identities instead of embedding large binary data in
catalog metadata. Decide packaging, path safety, size limits, caching, and missing-file behavior
for each supported type. Validate that references stay inside the content package.

Every distributed image, audio, video, font, chart library, or other third-party asset needs a
source and licence record in `ATTRIBUTION.md`; allowed licence texts and hashes belong in
`licenses.toml`. Check `is-clean-room` for original-content and reference-product restrictions.
Do not copy question banks, skill lists, explanations, exam content, or artwork from another
publisher.

## Design and implementation checks

For a change that crosses layers, write down:

1. The learner or author workflow and its acceptance criteria.
2. Which crate owns the data, parsing, rules, persistence, rendering, and error reporting.
3. The content and asset format, versioning or migration path, and safety limits.
4. Accessibility behavior and what happens when content is missing or cannot render.
5. Tests at the model/content/engine boundary and a real UI test when the screen changes.

Test parsing and validation with real representative content. Test that engine results do not
depend on the view. Test renderers against every supported content type and verify accessible
alternatives. Do not use mocks of I-SUCCESS code. For a visible UI change, render and inspect the
screens as required by `is-ui`.

Use `is-code` for Rust implementation rules, `is-content` for current practice catalog authoring,
`is-ui` for rendering and accessibility, and `is-devx` for repository checks.

## Not decided

The current implementation does not settle the course package format, authoring workflow,
external asset storage, video or audio playback, D3 execution, interactive activity protocol, or
exam and rubric schema. Treat each as a design decision. Estimate new subsystems and dependencies
and get the required checkpoint before building them.
