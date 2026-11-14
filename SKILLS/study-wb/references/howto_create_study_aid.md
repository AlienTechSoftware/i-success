# How to create a study aid

The whole workflow, from "an exam is coming" to a page the student can trust.
Each phase ends with something checkable. Do not start a phase before the
previous one's check passes.

## 0. Start from the last good page, never from a blank file

If the host already has a working study page for an earlier exam, the new page
starts from it. The page shell, look, options, timer, step engine, checker and
read-aloud are not exam content; rebuilding them by hand produces a worse copy
and wastes the session. Change only the content layer and the storage keys.

Once `lib/study-kit/` and `scripts/build_study_aid.py` exist (roadmap), "start
from the last page" becomes "write new content files and run the build".

## 1. Collect the scope from the sources, newest first

| Question | Where the answer comes from |
|---|---|
| Date, window, time limit, attempts, allowed tools | The **most recent instructor communication** first, then the LMS, then the syllabus. An announcement outranks the syllabus. |
| Which topics / modules / chapters | The syllabus schedule row for the exam, unless a newer message changes it. |
| Points | Syllabus grading table, the gradebook, or the instructor's message. Say which. |
| Which homework sets | The topics above, mapped through the schedule. |

Write down where each fact came from. If two sources disagree, show both and
say which one wins and why. Nothing is assumed; if a fact is missing, say it is
missing (for example, "the time limit is carried over from the last exam until
a new message says otherwise").

**Check:** every fact on the page names its source.

## 2. Inventory the problem sources

List every file that holds a problem for this exam:

- graded homework attempts (answer marked correct, solution shown);
- unsubmitted or incomplete attempts (problem visible, no key);
- practice-exam attempts (often the best predictor of the real exam);
- earlier real-exam reviews, if the host keeps them.

For each file record: which problem(s) it holds, whether it has a key, and the
attempt date. File names lie: a file named for one set can hold another set's
problems, and a second problem of a set can sit in an oddly named file. Open
every file and identify each problem **by reading it**, never by its position
or name.

**Check:** a table of problem → file → key status, with nothing unmatched.

## 3. Transcribe

Read each source and copy the problem: the scenario, every given number, every
table, every sub-question, the exact answer format (units, rounding, "do not use
negative signs", dropdown wording). See
[source_handling.md](source_handling.md) for image-only PDFs and OCR.

Never invent a number. If a value cannot be read, stop and ask.

**Check:** a reader comparing the page and the PDF side by side finds no
difference in any given value.

## 4. Label every answer

| Label | Meaning | Shown as |
|---|---|---|
| **Graded key** | The source shows the answer marked correct (and usually a solution). | green |
| **Calculated** | No key exists (unsubmitted attempt, practice question without review). Computed with the textbook method. | amber |
| **Generated** | An invented drill variant. Same structure, invented numbers. No key can exist. | red, dashed |

Where a graded key disagrees with the method, or its solution text contradicts
its own numbers, **record it as a key oddity**: show both, tell the user, never
quietly "correct" it.

**Check:** no answer without a label.

## 5. Encode each problem type once

Group problems by **type** (same method, different numbers), not by homework
set. For each type write:

1. a pure calculator: inputs → every answer the form asks for;
2. a renderer: the problem text and its answer boxes, in the source's format;
3. steps: one explanation per step, each filling only that step's boxes;
4. a "how to solve" panel: what it is about, what is given, what to produce,
   the method, a one-line "say it out loud", and the traps;
5. keystroke lines for the exam's allowed calculator, where arithmetic is
   involved.

Then add each **graded key** as data, and a self-test that recomputes every
graded instance and compares it with its key. A type whose calculator does not
reproduce the graded key is wrong, however plausible it looks.

## 6. Add drill variants

For each type, add at least one generated variant. Good variants change what
the student must notice, not just the numbers: a sign flips (favorable instead
of unfavorable), a threshold is crossed (below break-even), a distractor becomes
relevant, the best-looking choice is not the best by the scarce resource. Mark
them `[AI#n]` with a one-line twist description.

Choose invented numbers that come out clean (whole cents, no ambiguous
rounding such as x.x5 to one decimal) unless rounding is the point.

## 7. Organize the page in two levels

- **Level 1:** the exam's structure: practice-exam questions (Q1..Qn) first if a
  practice exam exists, then homework sets.
- **Level 2:** inside each, the problems: real instances first (practice exam,
  then homework), then generated variants.

When a practice exam arrives later, it becomes new Level 1 groups whose
problems reuse the existing types. That must be a content-only change.

## 8. Wire the tools

- Add the workbench with a page-specific `data-key`
  ([workbench.md](workbench.md)).
- Give every page its own storage keys (options, timer, workbench) so two exams
  never share notes or settings.
- Set the timer default to the exam's real limit times the student's extra-time
  multiplier, and say where both numbers came from.

## 9. Verify, then and only then say it works

Follow [verification.md](verification.md). The minimum: the self-test passes;
every problem's steps fill every box; every box checks correct; no console
errors; the workbench is visible and looks finished; it has been looked at in a
browser.

## 10. Record

Write what changed, what was verified, and what is still assumed into the
host's journal. Key oddities, missing keys, and assumptions go there too, so
the next session does not rediscover them.
