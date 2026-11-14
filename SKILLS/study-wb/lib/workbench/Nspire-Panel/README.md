# Nspire-Panel (study component)

A roomy, tabbed, Nspire-style workspace. **An approximation of the TI-Nspire CX II CAS workflow, not TI's software.**
Use the calculator your course allows on the real exam.

## Files

| File | What it is |
|---|---|
| `panel.js` | The panel. Loads `cas.js` and `panel.css` itself. |
| `panel.css` | Styles. |
| `cas.js` | The algebra engine (pure JS, no DOM): exact fractions and radicals, polynomials, derivative, integral, solve, factor, expand, limit, sum. Identical to the copy in `TI-Nspire/`. |
| `cas.test.js` | Node tests for the engine: `node cas.test.js` (64 cases). |
| `demo.html` | A minimal page that mounts the panel. |

## Use it on a page

```html
<div id="here"></div>
<script src="Nspire-Panel/panel.js"></script>
<script>NspirePanel.mount(document.getElementById('here'), { key: 'my-page' });</script>
```

`key` is the localStorage name that remembers the graph functions and window. Open `demo.html` for a working example (serve the
folder over http, for example `python -m http.server`).

**Stand-alone:** copy this whole folder into any project. It needs nothing outside itself. If the sister folder `TI-Nspire/` is on the
same page, both use one engine, so variables and functions you define in one work in the other.

Inside the Workbench (`../workbench.js`): pick Mode, then **Engineering graphing**. The Workbench loads this folder on demand from
`Nspire-Panel/` next to `workbench.js`, or from the folder in `data-panel="..."` on its script tag.

## What is on the tabs

- **Calculator.** A history screen and a typed entry line. Chips insert commands: solve, d/dx, ∫, factor, expand, limit, Σ, ≈, trig,
  ln, log, √, |x|, π, e, ^, :=, →, ans. A "Commands and what is supported" list gives samples. Exact answers
  (`√8` gives `2·√(2)`), with the decimal under irrational values. Radian or degree.
  Samples: `solve(x^2-4=0,x)`, `factor(x^2-5x+6)`, `expand((x+1)^3)`, `diff(sin(x^2),x)`, `integrate(x^2,x,0,3)`,
  `limit(sin(x)/x,x,0)`, `sum(k^2,k,1,10)`, `a:=5`, `f(x):=x^2+1`.
- **Graph.** Four functions with show/hide, window fields, Standard, Zoom in/out, Square, Fit. Drag to pan, scroll to zoom, hover to trace.
  Analyze between a and b: zero, minimum, maximum, dy/dx, integral, and f1 ∩ f2, with marks on the graph.
- **Table.** Values of the functions from a start and a step.
- **Tools.** Length and angle conversion, drawing scale 1:N, inch fractions, right-triangle solver.

## Limits

No matrices, lists, complex numbers, programs, spreadsheets, geometry or statistics tools. Solving is exact for polynomials (rational
roots and quadratics) and numeric elsewhere, searched in -50 to 50. Integration covers polynomials, sin, cos, tan, exp, 1/x, powers
of linear terms, ln x, and `1/(1+x²)`; anything else reports that no closed form was found.

## Checks

`node cas.test.js` passes 64 of 64. Verified in headless Chrome: loads without errors, solves, graphs, finds zeros, runs the tools.
Not verified: touch use.
