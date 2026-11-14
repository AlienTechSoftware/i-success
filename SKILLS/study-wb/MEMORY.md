# study-wb - Memory

Lessons distilled from `JOURNAL.md` and from the hosts this skill came from.
Each: what, why it matters, now what. Details and more cases:
[references/common_failure_modes.md](references/common_failure_modes.md).

## Start from the last good page, never from a blank file

- **What:** a hand-written study page came out as links with no problems, hidden
  panels and a broken workbench path, and was reported as complete.
- **Why it matters:** the page shell, checker, steps and tools are not exam
  content. Rewriting them costs a session and produces a worse copy.
- **Now what:** change only content and storage keys; once the build exists,
  only content files.

## A component must look finished on a bare page

- **What:** the workbench looked right only because exam pages style `button`
  and `select` page-wide.
- **Now what:** keep the base look inside the component at zero specificity and
  run the bare-page check after every workbench change.

## Verify in a browser; report verified, not verified and assumed separately

- **What:** parsing scripts and reading code did not catch hidden panels, a 404
  script or ugly controls. A browser pass that runs every step and checks every
  box did, in one go.
- **Now what:** no "it works" without that pass and a screenshot that was looked
  at.

## Label every answer by where it came from

- **What:** some saved attempts are unsubmitted; their problems are real but no
  key exists. Solution texts can contradict their own numbers.
- **Now what:** graded key, calculated, or generated, on every problem. Key
  oddities are recorded, never quietly fixed.

## Check the bytes before touching line endings

- **What:** a shell's count suggested CRLF; the files were LF.
- **Now what:** count `\r\n` and `\n` in the raw bytes, or diff against a
  sibling copy, first.
