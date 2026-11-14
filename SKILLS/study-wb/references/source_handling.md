# Source handling

How to read course material without introducing errors.

## PDFs

- **Many problem PDFs are images, not text.** Printouts from courseware are
  often image-only. A text extractor returns an empty string and **does not
  error**. Read them as images.
- **OCR output is a draft.** Confirm every number against the image at high
  resolution before it goes on a page.
- **An attempt printout shows its own state.** Look for "Not complete", "Marked
  out of", a score, check marks, and a "Solution" block. Those decide the label:
  a check mark and a solution make a graded key; "Not complete" means the
  problem is usable but has no key.
- **A partially correct attempt:** take answers from the site's own solution
  block, not from the submitted (wrong) inputs.
- **Randomized questions:** an algorithmic question re-draws its numbers per
  attempt but keeps its structure and often its names. Each attempt is a new
  graded instance of the same type. Fixed question banks repeat exactly; a
  reshuffled multiple-choice order adds nothing new.

## Identifying problems

- Identify each problem by reading it. Question order differs between attempts,
  between practice and real exams, and between terms.
- File names are not evidence. A file can hold another set's problem; a set's
  second problem can live in a differently named file.
- The page header of a printout ("Set N: code, code") is better evidence than
  the file name.

## Dates and times

- **LMS APIs often return UTC.** A deadline at `04:59Z` or `05:59Z` is 23:59 the
  **previous day** in US Central time. Reading the UTC date as the due date puts
  every deadline one day late.
- **Courseware can display a different zone than the LMS.** If two sources give
  the same window shifted by whole hours, the display zone differs. Use the
  earlier time as binding until the zone is confirmed.
- **"CST" in a message during daylight time** usually means local time. Read it
  as local and say so.

## Which source wins

1. The most recent instructor message or announcement.
2. The platform that enforces the rule (it closes the attempt).
3. The LMS.
4. The syllabus.

Record the losing value too; it explains later confusion.

## Answer keys

- A graded key is a fact about what the site accepted, not a proof of method.
- When the key and the textbook method disagree, show both. Never quietly fix.
- Solution text can contradict its own numbers (a typo in a multiplier, a
  sentence naming the wrong order). Record it as a key oddity next to the
  problem and in the host journal.
- A site may accept a value within a small tolerance of its own solution.
  Aim for the exact value anyway, and note the observed tolerance.

## Copyright and privacy

- Course problems are usually copyrighted textbook material and belong in the
  host, never in a shared skill.
- Instructor names, grades, student IDs, and email text belong in the host.
- Examples in this skill are anonymized: invented names and numbers, same
  structure.
