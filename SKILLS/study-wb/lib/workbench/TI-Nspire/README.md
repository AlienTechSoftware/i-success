# TI-Nspire CX II CAS-style calculator (study component)

An approximation of the TI-Nspire CX II CAS look and workflow for study pages. **It is not TI's software and not an
exact emulator.** Use the calculator your course allows on the real exam; many proctored exams allow only a basic
on-screen calculator.

## Files

| File | What it is |
|---|---|
| `nspire.js` | The device: photo skin, 320x240 screen, clickable keypad, menus, pages (Calculator, Graphs, Table, Tools). Loads `cas.js`, `nspire.css` and `panel.js` itself. |
| `cas.js` | The algebra engine (pure JS, no DOM). Exact fractions and radicals, polynomials, derivative, integral, solve, factor, expand, limit, sum. |
| `nspire.css` | Styles for the device and the screen. |
| `TI-Nspire.jpg` | Optional local skin (TI's product photo of the handheld). Not in this repository and never committed; without it a labelled keypad is drawn. |
| `cas.test.js` | Node tests for the engine: `node cas.test.js` (64 cases). |
| `demo.html` | A minimal page that mounts the device. |

## Use it on a page

```html
<div id="calc"></div>
<script src="TI-Nspire/nspire.js"></script>
<script>TINspire.mount(document.getElementById('calc'), { key: 'my-page-ns', title: 'Study' });</script>
```

Open `demo.html` in this folder for a working example (serve the folder over http, for example `python -m http.server`).

`key` is the localStorage name that remembers pages, functions and the graph window. `title` is the document name in the
title bar. Add `?nsdebug` to the page URL to outline every key hotspot.

**Stand-alone:** copy this whole folder into any project. It needs nothing outside itself. If the sister folder `Nspire-Panel/` is on the same page,
both use one engine, so variables and functions are shared (`cas.js` is identical in both).

Inside the Workbench (`../workbench.js`): pick Mode, then **Engineering graphing**. The Workbench loads this folder on demand, from
`TI-Nspire/` next to `workbench.js`, or from the folder named in `data-nspire="..."` on its script tag.

## Using the device

Click the keys, or click the device once and type on the keyboard. `ctrl` and `shift` are one-shot, like the handheld.

| Key | Does |
|---|---|
| `menu` | Commands for the current page. Arrows move, `enter` or a number picks, `esc` goes back. |
| `doc` | Insert a page (Calculator, Graphs, Table, Tools), delete a page. |
| `home` | Add-a-page screen. |
| `ctrl` + `eˣ` / `10ˣ` / `x²` / `^` | `ln(` / `log(` / `sqrt(` / `^(1/` |
| `ctrl` + `(−)` | `ans` |
| `ctrl` + `enter` | Approximate (decimal) answer |
| `ctrl` + `del` | Clear the entry line, or the history if the line is empty |
| `var` / `ctrl`+`var` | Stored variables / `→` store |
| `trig`, the template key, the book key | Trig, template and catalog menus |
| ◀ ▶ (next to the pad) | Previous / next page |
| `tab` | Graphs: switch between the function line and the graph |

Pages:

- **Calculator.** Exact answers (`√8` gives `2·√(2)`, `1/3+1/6` gives `1/2`), with the decimal under it for irrational values.
  Commands: `solve(x^2-4=0,x)`, `factor(x^2-5x+6)`, `expand((x+1)^3)`, `diff(sin(x^2),x)`, `integrate(x^2,x,0,3)`,
  `limit(sin(x)/x,x,0)`, `sum(k^2,k,1,10)`, `approx(√2)`. Store with `a:=5` or `5→a`; define `f(x):=x^2+1`.
- **Graphs.** Four functions. Drag to pan, scroll to zoom, hover to trace. Menu: View (window, zoom), Trace, Analyze
  Graph (zero, minimum, maximum, intersection, dy/dx, integral).
- **Table.** Values of the Graphs page functions. Start, step and rows are editable.
- **Tools.** Length and angle conversion, drawing scale 1:N, inch fractions, right-triangle solver.

## Limits

No matrices, lists, complex numbers, programs, spreadsheets, geometry or statistics tools. Solving is exact for
polynomials (rational roots and quadratics) and numeric for everything else, searched in the range -50 to 50.
Integration covers polynomials, sin, cos, tan, exp, 1/x, powers of linear terms, ln x, and `1/(1+x²)`; anything else
reports that no closed form was found. Keypad hotspots were aligned to the 800x1753 photo by eye.

## Checks

- `node cas.test.js` passes 64 of 64.
- Verified in headless Chrome: the page loads with no errors, the keypad drives the screen, a graph plots, the Analyze
  menu finds zeros, and pages can be added.
- Not verified: real-pen and touch use, and long sessions.
