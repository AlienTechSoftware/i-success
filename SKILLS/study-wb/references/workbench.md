# Workbench component contract

This reference is for agents and maintainers. It explains what the workbench is, how its parts fit, how a host page uses
it, how it was checked, and the rules for changing it. Read it before editing anything in `lib/workbench/`.

## 1. What it is, in one paragraph

The **workbench** is a collapsible **side pane** that sits on the right edge of a study page. Inside it are a
**calculator** (with a Mode dropdown), a **notepad** you can type or draw on, and, in one of the calculator's modes, two
**Nspire-style components** that approximate the TI-Nspire CX II CAS workflow. It is one script, `workbench.js`. The host
page adds a single `<script>` line; the script injects its own CSS and markup, so no other file on the page changes.
It is written to be dropped into any study page; `scripts/build_study_aid.py` copies it next to each built page.

## 2. Folder map

```
lib/workbench/
  README.md             short "how to drop it into a project" note
  workbench.js          the side pane: calculator, modes, notepad, copy/paste, resize, loader for the two components
  TI-Nspire/            stand-alone component: handheld-style device with the photo skin
    nspire.js           device: skin, 320x240 screen, 77 clickable keys, menus, pages (Calculator, Graphs, Table, Tools)
    nspire.css          device styles
    cas.js              the algebra engine (pure JS, no DOM)
    cas.test.js         Node tests for the engine (64 cases)
    TI-Nspire.jpg       optional local skin (TI's product photo); not in this repository, never commit it
    demo.html           minimal page that mounts the device
    README.md           component notes
  Nspire-Panel/         stand-alone component: roomy panel with tabs, chips, samples, Analyze fields
    panel.js            panel UI
    panel.css           panel styles
    cas.js              identical copy of the engine (so this folder needs nothing outside itself)
    cas.test.js         the same 64 tests
    demo.html           minimal page that mounts the panel
    README.md           component notes
```

**Rule of three folders:** `lib/workbench/` is the thing a build copies into a host page's output. `TI-Nspire/` and `Nspire-Panel/` are
each also copyable alone. The two `cas.js` files must stay byte-identical; if one changes, copy it over the other and
run both test files.

## 3. The side pane (`workbench.js`)

### 3.1 How a host page uses it

```html
<script src="workbench/workbench.js" data-key="my-page-bench"></script>   <!-- just before </body> -->
```

| Attribute | Meaning | Default |
|---|---|---|
| `data-key` | localStorage name for this page's bench state. Use a different value on each page. | `workbench` |
| `data-nspire` | URL of the folder holding `nspire.js` (the device). Relative to the page. | `TI-Nspire/` next to `workbench.js` |
| `data-panel` | URL of the folder holding `panel.js` (the panel). Relative to the page. | `Nspire-Panel/` next to `workbench.js` |
| `data-tools-offered` | Comma list of tools to include at all: `calculator`, `notepad`, `stickies`. A tool not listed is removed from the pane (for `stickies`, no notes appear on the page either). | every tool |
| `data-tools` | Comma list of tools shown at first. The user's own show/hide choice is remembered per page and wins afterwards. | every offered tool |

The script reads its own `src` and `data-*` attributes through `document.currentScript`, so it must be a classic `<script>` tag
(not `type="module"`, which has no `currentScript`).

### 3.2 What the host page must provide

- A `<main>` element. When the bench is open on a wide screen the script gives `main` a right margin so content moves aside.
- Optionally a header with class `.top`; it gets matching right padding while the bench is open.
- Optionally a fixed footer with class `footer.timer`; the bench panel is inserted just before it and sits above it in z-order.
- Nothing else. The pane carries its own base look at zero specificity (`:where(.bench)`: font, line height, box-sizing, button reset), so it is complete on a bare page and any host rule still wins. The script defines fallback design tokens at zero specificity
  (`:where(:root) { --blue, --blue-dark, --ink, --line, --pale, --good, --bad, --amber }`), so a host that defines the same
  names wins and a bare page still looks right.

### 3.3 Anatomy

- **`#bench`** (an `<aside>`): fixed to the right edge, full height, `z-index: 9`.
- **Edge tab** (`#benchTab`): a vertical button on the pane's left edge. It says **Workbench** when closed and **Close** when open.
- **Resize grip** (`#benchGrip`): a thin bar on the left edge. Drag to resize. Width is clamped to at least 280 px and at most
  the smaller of 70% of the window and 1000 px. Default width is 352 px (CSS variable `--bench-w`).
- **Body** (`.bench-body`): scrolls. Holds the calculator, then the notepad, each in its own `section.bench-tool[data-tool]`.
- **Show and hide tools:** each tool's heading ends in a small round **×**. Clicking it collapses the tool into a
  `+ Name` button in a row at the top of the body (`#benchTools`); clicking that button restores the tool. The row is
  hidden while every tool is shown. The choice is saved per page as `tools: { calculator: true|false, notepad: ... }`
  in the page's `data-key` entry. A new tool joins by adding a `section.bench-tool` with `data-tool` and `data-label`
  and a `.bench-h` heading; the show/hide code picks it up.
- **Sticky notes** (`data-tool="stickies"`): managed from the pane, floating over the page (`position:fixed`, z-index 7,
  the front note 8, so the pane at 9 and the timer at 10 stay on top). Pane: **+ New note**, **Arrange** (shows every
  note and lines them up left of the pane), **Show all**, **Hide all**, a **new-note colour** (six post-it colours or any
  colour), and a list with each note's colour, name (click to show or hide), Hide/Show and Delete (asks first if the
  note has text). Each note: drag by the dotted grip or the bare header (pointer events: mouse, touch, pen), resize from
  the corner, title, colour dot (its own palette; header and body share the colour, and the border and the line under
  the header are a darker shade derived from it), minimize to the title bar, × to hide. Font: "Comic Sans MS",
  cursive, sans-serif, the classic post-it look; the title is left-aligned explicitly because study pages
  right-align inputs for numbers. Titles and text are set as values, never as HTML. Saved per page as
  `stickies: { color, notes: [{ id, title, text, color, x, y, w, h, visible, min }] }`; positions are pulled back
  inside the window on load. Hidden when printing.
- On screens narrower than 700 px the pane is full width and overlays the page; on screens 1100 px and wider it pushes `main`
  and `.top` aside by the pane's width plus 24 px.
- **Default open or closed:** open if the window is at least 1500 px wide, closed otherwise, until the user chooses; the choice is then remembered.
- When Engineering graphing is selected and the pane is narrower than 540 px, it widens itself to 600 px (not remembered).

### 3.4 Calculator

A **Mode** dropdown sits above the display. **It always starts in Basic**; the last mode is deliberately not remembered.

| Mode | Contents |
|---|---|
| **Basic** | Display (max 12 digits, thousands separators shown), digit keys, `+ − × ÷ =`, `C`, `⌫`, decimal point, memory keys **MC MR M− M+** with an amber **M** indicator while memory is not zero. Immediate-execution: `2 + 3 × 4 =` gives 20, like a basic handheld. Keyboard works while the calculator has focus. Copy and Paste buttons (see 3.6). |
| **Scientific** | sin cos tan, inverse trig, ln, log, √, x², x³, 1/x, x!, 10ˣ, eˣ, π, e, ±, %, xʸ. Degrees or radians. |
| **Programming** | DEC HEX OCT BIN boxes kept in sync; AND OR XOR NOT, shifts, MOD; hex digit keys A to F. Integers only. |
| **Financial** | Time value of money: fill four of N, I/Y, PV, PMT, FV and solve the fifth (payments at end or start); NPV and IRR from a list of cash flows. Money paid out is negative. |
| **Statistics** | Paste a list: n, sum, mean, median, mode, min, max, range, Σx², sample and population SD and variance. An optional second list gives slope, intercept and r. |
| **Engineering graphing (panel version)** | Loads `Nspire-Panel/` only (section 4.3). The basic display and keys are hidden in this mode. |
| **Engineering graphing (TI-Nspire CX II CAS style)** | Loads `TI-Nspire/` only, the handheld-style device (section 4.2). The basic display and keys are hidden in this mode. |

Design facts an editor needs: the calculator state is the object `calc` (accumulator, pending operator, entry string,
`fresh` and `recall` flags, memory). Extra operators are added to the table `calcOps`. Each non-Basic mode builds its
extra controls into `#calcExtra` (extra keys) and `#calcPanel` (forms) when `setMode` runs and clears them on the next switch.
The pure math for the modes lives in the object `CM` (no DOM), so it can be tested in Node.

### 3.5 Notepad

**One sheet per problem.** A `<select>` ("Problem") lists every problem the host page has, auto-discovered from
`.question-panel[id]` elements (label = that panel's first `h2`, with any `.badge`/`.points` child stripped out, or the
panel's own `id` if it has no heading). A page with none of those still gets a single slot, `"Notes"`, so the component
degrades gracefully when copied into a bare page. Switching the dropdown saves the outgoing problem's text immediately
(bypassing the autosave debounce) and loads the chosen problem's own text and drawing. Each sheet is two layers: a
**textarea** underneath and a transparent **canvas** on top.

- **Type** mode: the canvas ignores the pointer, so you type.
- **Draw** mode: the canvas takes the pointer (mouse, touch or pen) and the textarea is frozen. Pen pressure sets line width. Tools: pen with three colours, eraser, **Undo** (up to 15 steps).
- **Page style:** a dropdown, **Blank** / **Lines** / **Grid**, sets `.pad`'s `data-rule` attribute and is remembered **per problem**, in that problem's own slot - switching problems can switch the style too. A problem with no style of its own falls back to the page-wide `rule` a pre-per-problem save of this component left behind, then to `lines`. **Clear all** keeps every problem's style choice and drops only its text and drawing (style is a display preference, not a note). The textarea's `line-height` is set in the same absolute unit as the ruling's repeat distance (the `--pad-line` custom property, 1.6rem), so a typed line always lands exactly on one rule at any zoom level; it cannot drift the way a unitless line-height would.
- The sheet's height is resizable (drag the corner). Drawings keep their size when the pane is resized.
- **Clear** empties the current problem's sheet only (no confirmation dialog: the `confirm()` in `padClear` is commented out on purpose; uncomment it to ask first). **Clear all** empties every problem's saved sheet and does confirm first - the one deliberately-destructive action in the component.
- Saved in this browser only: `pads[<problem id>] = { text, img (PNG data URL), iw, ih }`, plus the shared `rule` choice, in the page's one localStorage entry. A page saved by a pre-per-problem version of this component (a flat `{text, img, iw, ih}`) is migrated once, into the first problem's slot, the first time the new script runs on it.
- **Copy** copies the selected text, or all of it when nothing is selected. **Paste** inserts at the cursor.

### 3.6 Copy and Paste

Small buttons on the Basic display and on the notepad. They use the browser Clipboard API when allowed and fall back to
`execCommand('copy')` for copying and to a "paste here" prompt for pasting. The calculator's Paste accepts text such as
` $5,250,000.50 ` (it strips spaces, commas and `$`, then reads the first number). The button flashes Copied, Pasted, No number or Blocked.
While the **basic calculator has focus** (click it or Tab to it), **Ctrl+C** copies the displayed number and **Ctrl+V** pastes a number (Cmd on a Mac).
Ctrl+V uses the browser's native paste event; if none arrives within 150 ms it reads the clipboard directly. Neither shortcut is active
in Engineering mode or while typing in a text box, where the browser's normal behaviour applies.
These are study conveniences; an exam may not allow clipboards.

### 3.7 Public API

`window.Workbench` has three members: `open()`, `close()` and `loadNspire()` (returns a promise of `[panelFound, deviceFound]`).

### 3.8 State and persistence

All state is optional and wrapped in try/catch, so the pane works with storage blocked.

| localStorage key | Holds |
|---|---|
| `<data-key>` | JSON: `open`, `w` (width), `padActive` (last-selected problem id), `pads` (`{ [problem id]: { text, img (PNG data URL), iw, ih, rule } }`); `rule` is a leftover top-level key from a brief page-wide-style version, read as a fallback only, never written |
| `nsp:<data-key>-panel` | the panel's graph functions and window |
| `ns:<data-key>-ns` | the device's pages, graph functions, window, table settings and RAD/DEG |

## 4. The Nspire components

Both are **approximations of the TI-Nspire CX II CAS workflow, not TI's software and not an exact emulator.** They never claim
to be exact. No matrices, lists, complex numbers, programs, spreadsheets, geometry or statistics tools.

### 4.1 `cas.js`: the algebra engine

Pure JavaScript, no DOM. Exports `NspireCAS.CAS` (engine) and `NspireCAS.CASS` (session: stored variables, user functions, commands).
Works in Node: `require('./cas.js')`.

- Exact arithmetic with BigInt fractions; radicals (`√8` gives `2·√(2)`); exact trig at multiples of π/12.
- Expression tree with a canonical simplifier (like terms, like factors, constants folded, numeric coefficients distributed).
- Polynomials in one variable: expand, factor (rational-root theorem plus quadratic remainder), solve (exact for degree 1, 2 and for anything that
  factors over the rationals; numeric search in -50 to 50 otherwise).
- Calculus: derivative (sum, product, power, chain, trig, ln, log, exp, atan and more), integral (polynomials, sin, cos, tan, exp,
  1/x, powers of linear terms, ln x, `1/(1+x²)`, `1/√(1-x²)`; otherwise "no closed form found"), definite integral exact or Simpson, `limit` (numeric), `sum`, `product`.
- Commands: `solve diff integrate expand factor simplify approx limit sum product`; also `gcd lcm mod nCr nPr abs floor ceil round`.
  Store with `a:=5` or `5→a`; define `f(x):=x^2+a`.
- `CAS.st.deg` switches degrees and radians.

### 4.2 `TI-Nspire/nspire.js`: the device

Mounts into any element: `TINspire.mount(el, { key, title })`. It loads `cas.js` and `nspire.css` from its own folder and uses
`TI-Nspire.jpg` as the skin (if the photo is missing it draws a labelled keypad instead).

- Geometry: the photo is 800 x 1753 px. Each of the 77 keys is a transparent hotspot placed by percentage over the photo
  (table `KEYS`). The screen is a 320 x 240 virtual LCD scaled to the photo's screen area. Add `?nsdebug` to the URL to outline every hotspot.
- Screen: page tabs (1.1, 1.2, ...), document title, RAD or DEG, battery, close X. Pages: **Calculator**, **Graphs**, **Table**, **Tools**.
- Keys: `ctrl` and `shift` are one-shot; `menu` (page commands), `doc` (insert or delete a page), `home` (add-a-page screen), `var`,
  `trig`, template and catalog menus, previous and next page, touchpad arrows, `enter`, `del`. `ctrl` + `eˣ`, `10ˣ`, `x²`, `^`, `(−)`,
  `enter`, `del` give ln, log, √, nth root start, `ans`, approximate answer, clear. A physical keyboard works while the device has focus.
- Graphs: four functions, trace, pan, zoom, Analyze (zero, minimum, maximum, intersection, dy/dx, integral), window dialog.

### 4.3 `Nspire-Panel/panel.js`: the panel

Mounts with `NspirePanel.mount(el, { key })`. Tabs: **Calculator** (history, typed entry line, command chips, "Commands and what is
supported" samples), **Graph** (functions with show or hide, window fields, zoom buttons, Analyze with from and to), **Table**, **Tools**
(length and angle conversion, drawing scale 1:N, inch fractions, right-triangle solver).

### 4.4 How the two relate

Both use `window.NspireCAS`. If both are loaded they share one engine, so `a:=5` or `f(x):=x^2+a` defined in one works in the other.
The workbench gives each its own Mode entry (panel version above the TI-Nspire entry) and loads each folder on demand and independently; they are never
stacked in the pane. If a folder is missing, only its own Mode entry shows a plain message and every other mode is unaffected. Variables are still shared
between the two if you have used both in one session, because both talk to `window.NspireCAS`.

## 5. Checks that exist

- `node cas.test.js` in `TI-Nspire/` and in `Nspire-Panel/`: 64 of 64 cases (arithmetic, radicals, expand, factor, derivative, integral, solve, trig, stored values).
- Headless Chrome (`chrome --headless=new --dump-dom`) with a throwaway page that drives the UI through the DOM and writes results into `document.title`.
  Done for: all calculator modes; basic key sequences; notepad drawing and undo; copy and paste (with a stand-in clipboard); resize; the panel
  alone, the device alone, both together, one folder missing, both missing; key hotspot alignment against the photo.
- **Not verified:** real touch and pen input on the keypad, the real browser clipboard permission prompt, long sessions, browsers other than Chrome.
  Keypad hotspots were aligned to the photo by eye.

Throwaway test pages go in the host's scratch area, outside any synced folder, and are deleted afterwards.

## 6. Versioning (strict)

The version is **MAJOR.MINOR.BUILD**, for example `0.1.20261012000000`.

- **MAJOR** and **MINOR** are changed **only by the skill owner**, or by an agent acting on an explicit instruction from the owner to change them.
  An agent never decides on its own that a change is "big enough" for a bump. If you think one is warranted, say so and ask; do not edit the number.
- **BUILD** is a **DATETIME STAMP**: `YYYYMMDDHHmmss`, digits only, zero padded, in **Pacific** time (`MM` is month, `mm` is minutes; never `hh`).
  Agents **may** and **should** refresh it after any change to a file in this folder.
- **One home:** the version is written in exactly one place, `metadata.version` in `SKILL.md`. It covers the whole skill, `lib/workbench/` included. Do not repeat it in other files.
- **Refresh the build** with `python scripts/bump_build.py` (standard library only; it also updates `last-updated`; it refuses to move the stamp backwards;
  it never touches MAJOR or MINOR). `python bump_build.py --check` prints the current version and changes nothing.
- A stamp that has been issued is a key. Never rewrite an old stamp by hand.

## 7. Rules for agents editing this folder

1. **Read before changing.** Read the file you will edit and the section of this document that covers it.
2. **Never bump MAJOR or MINOR.** See section 6. Run `scripts/bump_build.py` after your change and say so in your report.
3. **No runtime network, no third-party code.** Plain JavaScript, CSS and HTML. No CDN, no npm packages shipped here.
4. **Stay stand-alone.** `TI-Nspire/` and `Nspire-Panel/` must work when copied alone. Keep both `cas.js` copies identical.
5. **Keep the host contract.** Do not add requirements on the host page beyond section 3.2 without owner approval. The pane must look finished on a bare page (see `verification.md`).
6. **Match the surrounding style:** two-space indentation, `const` and arrow functions, the existing comment density, UTF-8, each file's existing line endings.
7. **Test what you change.** Run both `cas.test.js` files after touching an engine. Re-run the headless checks in section 5 for UI changes. Report anything you could not verify as unverified.
8. **Be honest about the Nspire parts.** They are approximations. Do not add wording that suggests they are exact or official.
9. **Do not overwrite the owner's saved data.** Storage keys are in 3.8; changing a key name or shape needs owner approval.
10. **Commit only when asked.** Stage and report, then wait.

## 8. Known limits

- Basic is a 12-digit immediate-execution calculator, not a model of any one exam-approved device.
- The Programming mode works on integers within JavaScript's safe range for the keypad path.
- The Financial rate solver scans from -95% to 1000% per period and may report no solution for unusual inputs.
- Nspire CAS solving is exact for polynomials and numeric elsewhere; limits are numeric; integration is a table of known forms.
- `TI-Nspire.jpg` is TI's product photo. Keep it out of public repositories.

## 9. Documentation standard for this folder

The owner likes verbose documentation. For any new part: a header comment saying what it is, how to load it, what it exposes, what it does **not** do;
a README with a file table, a usage snippet and a limits section; this file updated in the same change; and checks listed honestly as verified or not.
