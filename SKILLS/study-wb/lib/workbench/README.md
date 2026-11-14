# workbench (study component)

A collapsible side panel for study pages: a calculator with modes, and a notepad you can type or draw on.
**Copy this whole folder into any project** and add one line before `</body>`:

```html
<script src="workbench/workbench.js" data-key="my-page-bench"></script>
```

`data-key` is the localStorage name that remembers open or closed, width, notes and drawing. Use a different key per page.
The page needs a `<main>` so the content moves aside when the bench is open; a fixed `footer.timer` is respected.

## What is inside

| Path | What it is |
|---|---|
| `workbench.js` | The panel itself: injects its own styles and markup. Calculator modes, notepad, copy and paste buttons, resize bar. |
| `TI-Nspire/` | Stand-alone: the handheld-style TI-Nspire CX II CAS device with the photo skin. Has its own README and demo. |
| `Nspire-Panel/` | Stand-alone: the roomy Nspire-style panel with tabs, chips and Analyze. Has its own README and demo. |

The two component folders load on demand, from next to `workbench.js`, when you choose one of the two **Engineering graphing** entries in Mode
("panel version" loads `Nspire-Panel/`, "TI-Nspire CX II CAS style" loads `TI-Nspire/`). Either folder may be deleted; the rest still works. To keep them
elsewhere, point to them on the script tag: `data-nspire="path/TI-Nspire/"` and `data-panel="path/Nspire-Panel/"`.

## Features

- **Calculator.** Mode dropdown, always starting in Basic: Basic (memory keys MC MR M- M+), Scientific, Programming (bases and
  bitwise), Financial (TVM, NPV, IRR), Statistics, then two separate entries: Engineering graphing (panel version) and Engineering graphing (TI-Nspire CX II CAS style). Copy and Paste buttons; Ctrl+C and Ctrl+V work while the calculator has focus.
- **Notepad.** One sheet per problem - a dropdown lists every problem on the page (auto-discovered) and remembers each one's own notes and drawing separately. Type or draw (mouse, touch or pen), pen colours, eraser, undo. Page style dropdown: Blank, Lines or Grid. Clear (current problem) and Clear all (every problem, confirms first). Copy and Paste buttons.
- **Resize.** Drag the thin bar on the left edge. The tab on the edge opens and closes it.
- **API.** `Workbench.open()`, `Workbench.close()`, `Workbench.loadNspire()`.

## Notes

The Nspire tools approximate the TI-Nspire CX II CAS workflow; they are not TI's software. TI's product photo is not
included in this repository, so the device draws a labelled keypad. A local copy can be dropped in as `TI-Nspire/TI-Nspire.jpg`; never commit it.
The bench is for study. Check what your exam's proctoring allows.
