# Common failure modes

Every entry happened at least once. Each says what was seen, why, and the rule
that prevents it.

## Building the page

**A "study page" that is only links.** Seen: a page listing each homework PDF
with a one-line description, no problem text, no answer boxes, no steps,
reported as complete. Why: the page was hand-written instead of built from the
previous working page, and nobody looked at it. Rule: start from the last good
page ([howto](howto_create_study_aid.md) phase 0) and verify in a browser before
claiming anything ([verification.md](verification.md)).

**Rebuilding shared UI by hand.** Seen: options panel, theme switch and voice
controls re-implemented from scratch, looking worse and partly broken. Why: UI
that is not exam content was treated as exam content. Rule: change only the
content layer.

**Problem panels never shown.** Seen: problem sections inside a container left
with `hidden`, so clicking a problem showed nothing. Rule: the "every Level 2
button shows its problem" check.

**Workbench missing.** Seen: `<script src="../workbench/workbench.js">` pointing
at a folder that does not exist relative to the page. The script 404s silently
and no pane appears. Rule: the path is relative to the **page**; check the
Network or Console panel; the browser check requires the pane to be present.

**Placeholder container for a self-mounting component.** Seen: an empty
`<div id="bench">` added "for the workbench". The workbench creates its own
element; a stray one with the same id confuses later code. Rule: add only the
script tag.

## Looks

**A component that only looks right on one page.** Seen: the Mode dropdown thin
and the buttons bordered and serif on a page without page-wide `select` and
`button` rules. Why: the component silently relied on the host's CSS. Rule: a
component carries its own base look at zero specificity (`:where(.bench) ...`)
and passes the bare-page check.

**Notepad sheets named by raw ids.** Seen: the notepad's problem list showed
`behav`, `auc`. Why: it labels each sheet from the first `h2` in each
`.question-panel`, and the panels had none. Rule: every problem-type panel has
a readable heading.

**Crowding.** The side pane gains tools over time (calculator modes, notepad,
timer, read-aloud, reference tables). Without a way to show and hide them it
becomes a wall. Rule: each tool can be shown or hidden, remembered per page
(roadmap).

## Checking answers

**One tolerance for every box.** Seen: an absolute tolerance of 0.51 accepts
1.4 for 1.6 and 0.6 for 0.25. Rule: decimals carry their own tolerance (for
example `data-tol="0.05"` for one decimal place, `0.005` for two).

**A blank accepted as an answer.** A blank box counts as correct only where the
answer is 0 or "N/A", and is then shown neutral, not green.

**Signs.** Forms that say "do not use negative signs" want the size in the box
and the direction in a dropdown (U/F, increased/decreased). Keep the signed
value in the calculator; derive both box values from it.

**Units and scale.** A table "in $ thousands" or "$ millions" wants the answer
in the same unit. Convert inside the calculator only where the form asks.

## Storage

**Two pages sharing state.** Seen risk: copying a page without changing its
storage keys makes two exams share notes, timer and options. Rule: every key
carries the page's identity (`<course>-<exam>-options`, `-timer`, `-bench`).

## Keyboard

**Alt+C is swallowed by Chrome on Windows.** Bind Check to Alt+K as well. Never
bind Ctrl shortcuts; they collide with copy and paste.

## Read-aloud

**Long text stops mid-way.** Browser speech can drop an utterance's `onend`
after garbage collection. Keep references to utterances, speak sentence by
sentence, and run a watchdog that notices the engine went quiet.

## Opening from disk

**`fetch()` of a neighbouring JSON file fails on `file:///`.** Chromium blocks
it unconditionally. Content files must be compiled into a `<script src>` data
file or embedded into the page at build time.

## User text

**Typed text inserted as HTML.** Seen in a page this skill borrowed from: note
titles and text built into `innerHTML`, so a typed `<b>` or `<img onerror=...>`
became markup. Rule: user text goes in as `.value` or `.textContent`, never into
a template string that becomes HTML.

## Testing

**Test data left in the student's own browser.** The automated browser can be
the same one the student uses, and `file:///` pages share one storage. Notes or
settings created by a test then appear on the real page. Rule: test on a scratch
page with its own storage key; if a test must touch a real page, remove what it
created and leave the student's own choices alone.

## Files and tooling

**Line-ending false alarms.** Seen: a shell count suggested files were CRLF;
they were LF. "Normalizing" them would have rewritten every line. Rule: inspect
bytes before touching line endings ([verification.md](verification.md) section 5).

**Scratch files in a synced folder.** Throwaway renders, test pages and
extracted text written into a cloud-synced folder are uploaded and versioned.
Put scratch outside it.

**Reports that outrun the evidence.** Seen: a summary describing features that
did not exist. Rule: report verified, not verified, and assumed separately.
