# Page data contract (`window.STUDY_DATA`)

Normative. `lib/study-kit/study-kit.js` builds a whole study page from one
object assigned to `window.STUDY_DATA` by a data script loaded before it.
Where this file and the runtime disagree, the runtime is the bug report: fix
one, never let them drift.

## Load order

```html
<head>
  <link rel="stylesheet" href="study-kit/study-kit.css">
</head>
<body>
  <script src="my-page.data.js"></script>          <!-- window.STUDY_DATA = { ... }; -->
  <script src="study-kit/study-kit.js"></script>
  <script src="workbench/workbench.js" data-key="<storageKey>-bench"></script>
</body>
```

A data **script** is used, not a `.json` fetched at run time, because browsers
block `fetch()` of local files on `file:///`.

## Top level

| Key | Required | Type | Meaning |
|---|---|---|---|
| `page` | yes | object | Page identity, below. |
| `groups` | yes | array | Level 1 groups, in display order. |
| `howto` | no | object | How-to panels by id; problems point at them. |
| `reference` | no | array | Collapsed reference sections, nestable. |
| `timer` | no | object | Exam timer. Absent → no timer bar. |
| `intro` | no | HTML string | Text above the navigation. Absent → a generic explanation of levels, labels and shortcuts. `""` → nothing. |
| `labelText` | no | object | Overrides the explanation shown under each label: keys `graded`, `calculated`, `generated`; HTML values. |
| `voice` | no | object | `{ "lang": "en-GB" }`: preferred voice language for read-aloud when the user has not picked one. |

## `page`

| Key | Required | Meaning |
|---|---|---|
| `title` | **yes** | Browser tab title. Missing → the page stops with a visible error. |
| `storageKey` | **yes** | Prefix for everything saved in the browser: `<key>-options`, `<key>-timer`, `<key>-timer-setup`. Use the same prefix for the workbench `data-key` (`<key>-bench`). Unique per page. Missing → visible error. |
| `heading` | no | HTML for the header's `<h1>`. Default: the title. |
| `subtitle` | no | HTML line under the heading: date, scope, points, with sources. |
| `lang` | no | `<html lang>`. |
| `practiceTitle`, `referenceTitle` | no | Card titles. |

## `groups[]` (Level 1)

| Key | Required | Meaning |
|---|---|---|
| `id` | yes | Button text, for example `Q1` or `HW#10`. |
| `caption` | no | HTML line shown above the group's problems. |
| `gapBefore` | no | `true` puts a small gap before this button (for example between practice-exam questions and homework sets). |
| `problems` | yes | Level 2 problems, in display order: real instances first, then generated variants. |

## `problems[]` (Level 2)

| Key | Required | Meaning |
|---|---|---|
| `name` | yes | Shown as `P<n> · <name>`. Start generated variants with `[AI#n]`. |
| `label` | yes | `graded`, `calculated` or `generated`. Anything else is a content error. |
| `files` | no | Source file paths, relative to the **page**. Empty → "generated drill variant". |
| `howto` | no | Id of a `howto` panel to show inside the problem. |
| `body` | yes | HTML of the problem statement with answer-box tokens (below). |
| `fields` | yes if the body has tokens | Answer boxes by name. |
| `steps` | no | Ordered steps: `{ "say": HTML, "fill": { "<field>": value } }`. Each step fills only its own boxes. |
| `keys` | no | Keystroke lines for the worked solution: a string (a heading row) or `{ "keys": [6000, "÷", 100, "+", 0.4, "="], "meaning": "...", "value": 60.4 }`. Operators: `+ − × ÷ =` (true minus sign U+2212). The "screen shows" column is computed by a basic-calculator simulator, so a wrong key sequence shows a wrong screen. |

### Answer-box tokens

In `body`, `{{box:name}}` and `{{pick:name}}` are both replaced by the field
`name`; the field's definition decides what it becomes (a dropdown when it has
`options`, otherwise an input). A token without a field, or a field never
placed, is a content error.

### `fields.<name>`

| Key | Meaning |
|---|---|
| `answer` | The answer. Several accepted answers: an array, or one string with `|` between them. Numbers may be written with or without commas. |
| `options` | Makes a dropdown with these options (an empty first option is added). The answer must be one of them. |
| `tol` | Absolute tolerance for numeric answers. Default 0.51 (whole numbers). Use 0.05 for one decimal place, 0.005 for two. |
| `kind` | `"text"` for a free-text input compared case-insensitively. |
| `cls`, `style`, `aria` | Class (for example `mid` for a 150 px box), inline style, accessible name. |

Checking rules: numbers accept `1,234`, `(1,234)` and `-1234`; text is
case-insensitive; a blank box counts as correct only where the answer is `0`
or `N/A`, and is then shown neutral rather than green.

## `howto.<id>`

`{ "title": "...", "html": "..." }`, or `{ "title": "...", "panels": [ { "summary": "...", "html": "..." } ] }`
for several collapsible panels. The title becomes the panel heading; the
workbench notepad uses it as the sheet name, so make it readable.

## `reference[]`

`{ "title": HTML, "html": HTML, "children": [ ...same shape... ] }`. Rendered as
collapsed, nestable sections with Expand all / Collapse all, each with audio
controls in the summary line.

Audio controls style (recommended for every section and problem read-aloud):
- Three small round icon buttons, about 1.7 rem across, in this order: Start
  (green, play triangle), Pause (gray, two bars), Stop (red, square).
- Pause becomes Resume (play triangle) while paused.
- Start is enabled and Pause and Stop are disabled when idle; unavailable
  buttons fade to about 35 percent opacity.
- Draw the icons with CSS shapes, not text characters, so they centre exactly.
- Each button needs a title and an aria-label.
- One audio state per page: starting a new section stops the previous one.
- Highlight option (Options panel): a checkbox "Highlight what has been read"
  and a small rounded colour swatch (default a faint yellow, #fff3a3). While a
  section is read aloud, each sentence is highlighted as it is spoken, using the
  CSS Custom Highlight API; Stop clears it. Browsers without that API skip it.

## `timer`

`{ "minutes": 100, "multiplier": 1.5, "note": "where both numbers come from" }`.
The student can change both on the page; their choice and a running clock
survive a reload.

## Errors

Content errors (unknown label, token without a field, unplaced field, a step
filling a box that does not exist, a group without an id) are collected, logged
to the console, and returned by `StudyKit.verify().errors`. A page with content
errors is not done.

## `StudyKit` API

| Member | Does |
|---|---|
| `verify()` | Runs every problem's steps, checks every box, resets, and returns `{ ok, problems, errors, failures, rows }`. `ok` is true only with no content errors, no unfilled box (except blank-allowed ones) and no incorrect box. |
| `nextStep(view)`, `restartSteps(view)`, `checkFields(view)`, `resetFields(view)`, `showFields(view)` | The per-problem actions, for tests. `view` is a `.source-view` element. |
| `simulate(lines)` | The keystroke simulator. |
| `errors` | The content errors found while building. |

## Libraries, diagrams and charts

- `libraries` (top level, optional): a list of `mermaid`, `d3` or `vega`. The build copies the matching vendored
  files from `lib/vendor/` into `<out>/vendor/` and loads them with the page. Nothing loads from the network. Only
  list what the page uses. The versions are in `lib/vendor/VERSIONS.md`.
- `diagram` (on a problem, optional): Mermaid text, for example `graph LR` with `A[Sales] --> B[Contribution margin]`.
  Needs `mermaid` in `libraries`. Drawn the first time the problem is on screen.
- `chart` (on a problem, optional): a Vega-Lite spec as a YAML or JSON object. Needs `vega` in `libraries`. Drawn the
  first time the problem is on screen.
- `d3` is copied for content that brings its own D3 code; the study kit does not call it.
