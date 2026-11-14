# template_01

The default page: blue header, cards, two-level navigation, workbench on the
right, timer bar at the bottom, light and dark themes.

| File | Role |
|---|---|
| `page.html` | Shell with placeholders (`{{TITLE}}`, `{{STORAGE_KEY}}`, `{{DATA_SCRIPT}}`, `{{WORKBENCH_ATTRS}}`, `{{HEAD_EXTRA}}`, `{{LANG}}`). Filled by the build; never opened directly. |
| `page.css` | Theme layer loaded after `study-kit.css`: the design tokens. Change colours here, not in the runtime. |
| `content.example.yaml` | A starter content file that uses every widget. Invented content only. |

## New page in five commands

From the folder where the page should live (source PDFs are linked relative
to it). `<skill>` is the path to this skill, for example `SKILLS/study-wb`.

```bash
cp <skill>/assets/template_01/content.example.yaml my-page.yaml   # 1. start from the example
# 2. edit my-page.yaml: page.title, page.storageKey, groups, problems (transcribe, never invent)
python <skill>/scripts/validate_study_data.py my-page.yaml           # 3. static checks
python <skill>/scripts/build_study_aid.py my-page.yaml               # 4. writes my-page.html next to it
python <skill>/scripts/verify_page.py my-page.html                   # 5. every problem, in a headless browser
```

Then open `my-page.html` and look at it. Before calling it done, follow
[../../references/verification.md](../../references/verification.md).

The whole pipeline, with its failure cases, runs in one command:
`python <skill>/tests/test_build.py`.

## Options panel (built in, same on every page)

The gear at the top right opens the options panel. The runtime builds it for
every page, so this template gets it without extra markup:

- **Theme:** Light, Dark, System.
- **Voice and speed:** Voice (read aloud), Speed, Test voice, and Reset (theme,
  voice and speed only).
- **Read-aloud group (inline, next to each details section):** play/pause, stop,
  the highlight checkbox and the two colour swatches. Its state is saved in the
  browser under the page's `storageKey` and is shared by every read-aloud group
  on the page, so one change updates them all.
- **Save selections and answers in the URL:** on by default. The open problem
  and its answer boxes are kept in the address bar, so a copied link reopens
  the same state. See [../../references/url_state.md](../../references/url_state.md).

A page's options and its URL state are stored per page, under its
`storageKey`, so two pages never share them.

## What the build writes next to the content file

`<name>.html`, `<name>.data.js`, `page.css`, `study-kit/`, `workbench/`. All
are regenerated; edit the content file, never these. They are written only
when they change, so a rebuild with no edits touches nothing. The runtime is
copied in, so the page still opens on a machine that does not have this skill.
