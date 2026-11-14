# URL state: share a practice page exactly as it was left

A practice page can keep its place in the address bar. The open problem and every answer box of that problem are written into the hash, so copying the URL and opening it later (or sending it to someone) reproduces the same selections and answers.

## Turning it on and off

Options (gear, top right) > **Save selections and answers in the URL**. It is **on by default**. The choice is saved in this browser under the page's `storageKey`-options.

- **On:** every change to the open problem (choosing a group or problem, typing in a box, picking a dropdown, Check, Reset, Show answers) rewrites the hash. The page does not reload.
- **Off:** the hash is removed from the address bar. Opening a link that has state still works, so a shared link is never ignored.

## What goes in the URL

```
#g=Q5%3ADEC&p=3&a=%7B%22ppv%22%3A%221000%22%7D
```

| Part | Meaning |
|---|---|
| `g` | the group id, for example `Q5:DEC` or `HW#14` (URL-encoded) |
| `p` | the problem number inside that group, counted from 1 (`p=3` is P3) |
| `a` | JSON object of `{field name: value}` for every box of that problem that is not empty |

Only the open problem is stored. Other problems are not in the URL, so links stay short.

Field names come from the `data-f` attribute of each box, which is the field key in the page data (for example `a_cm_1`, `b_net`). Values are the text as typed or the option chosen. Boxes that are empty are left out.

## Reading a link

On load the page reads the hash before the page is shown:

1. Finds the group by `g`, clicks its level-1 button, then clicks problem `p`.
2. Fills each box whose name is in `a`, with the saved text, and clears any old correct/incorrect marks.

A bad link does not break the page. It adds a message to the build errors (visible in the console and in `StudyKit.errors`) and leaves the page on its default view. An unknown group, a problem number that is out of range, or invalid JSON in `a` are each reported on their own.

## Rules for the content author

- **Group ids must be unique** on the page, because `g` is the group id. Duplicate ids make a link open the first match.
- **Problem order is part of the link.** If problems are reordered, old links open a different problem. Reorder only when no one is using old links, or accept it.
- **Box names must be unique within a problem**, because `a` is keyed by field name. This is already required by the data contract.
- The URL holds answers as the student typed them. Do not put a page with a graded key in front of a student who should not see it: anyone with the link sees their typed answers, not the key. The key is still only shown through Show answers.

## Where this is implemented

- `lib/study-kit/study-kit.js`: the `urlState` object (`write`, `read`, `hasState`, `clear`), its listeners on input, change and click, and the checkbox in the options panel (`optUrl`).
- The option is stored as `urlState` in the options object, next to theme, voice and highlighting. Its default is `true`.

## Verifying it

1. Open the page, pick a group and problem, type a value in one box.
2. The address bar changes to `#g=...&p=...&a=...` without a reload.
3. Copy the full URL into a new tab. The same problem is open and the value is in its box.
4. Turn the option off in Options. The hash disappears. Reload with a link that has state. The state is still applied.
