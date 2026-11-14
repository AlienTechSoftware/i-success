# Verification

What "done" means for a study page. Run every check. Report what passed, what
was not checked, and why. A check that was described but not run did not pass.

## 1. Static

| Check | How |
|---|---|
| Every inline script parses | Extract each `<script>` block and compile it (for example Node `vm.Script`). |
| Graded keys reproduce | Run the page's logic in Node and call its self-test: every graded instance's calculator output equals its key (within 0.005 for numbers, exact for text). |
| Generated variants are clean | Print every generated instance's computed answers. Look for non-terminating decimals, x.x5 rounding traps, negative values where the form forbids a sign, and divisions that only work by accident. |
| No forbidden residue | No placeholder text, no notes to self, no stub sections. |

## 2. In a real browser

Load the page from disk (`file:///`), the way the student will open it.

| Check | Pass condition |
|---|---|
| Console | No errors. The self-test logs success. |
| Run every problem | For each Level 2 problem: run all of its steps, then Check. Every box is filled by some step, and every box checks correct. |
| Every step's fill target exists | No step names a box that is not on the form. |
| Navigation | Every Level 1 button shows its group; every Level 2 button shows its problem; nothing is hidden by a leftover `hidden` attribute. |
| Workbench | Visible (or its edge tab is), opens and closes, the Mode dropdown and buttons look finished, the notepad lists problems by readable name. |
| Look | A screenshot has been taken and **looked at**. |

A browser driver (DevTools protocol, Playwright, or headless Chrome with a test
script) can do the "run every problem" check in one pass; see the sample below.

```js
// in the page: run every problem's steps, then check it
const rows = [];
document.querySelectorAll('.group').forEach(g => g.querySelectorAll('.source-view').forEach(v => {
  v._steps.forEach(() => nextStep(v));
  const boxes = [...v.querySelectorAll('[data-answer]')];
  v.dataset.checked = 'false'; checkFields(v);
  rows.push([v.querySelector('strong').textContent, v.querySelector('.result').textContent,
             boxes.filter(b => b.value === '').length, boxes.filter(b => b.classList.contains('incorrect')).length]);
  restartSteps(v);
}));
rows;   // every row: "n of n correct", 0 unfilled, 0 incorrect
```

## 3. Bare-page check (workbench changes)

Load `lib/workbench/workbench.js` into a page with nothing but `<main>` and the
script tag. The pane must look the same as on a styled page: sans-serif text,
borderless rounded buttons, a full-size Mode dropdown. Check at least Basic and
one panel mode (Financial). Any difference is a hidden dependency on host CSS.

## 4. Component tests (workbench)

- `node --check lib/workbench/workbench.js`
- `node cas.test.js` in `lib/workbench/TI-Nspire/` and in
  `lib/workbench/Nspire-Panel/`: all cases pass.
- The two `cas.js` copies are byte-identical.

## 5. Line endings and diffs

Before and after editing a file, compare its bytes, not a shell's guess: count
`\r\n` and `\n` directly, or diff against a sibling copy. A wrong "normalization"
rewrites every line and hides the real change.

## Reporting

Report three lists separately: **verified** (with the evidence), **not
verified** (and why), **assumed** (and where the assumption is recorded).
Never collapse them into "working".
