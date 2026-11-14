---
name: is-ui
description: I-SUCCESS user interface in egui 0.37. Use when changing what the window shows or how it behaves - screens, cards, pills, bands, practice controls, theme colours, fonts and accessibility labels - and when writing UI tests or checking the look with the screen pictures.
license: MIT
metadata:
  version: "0.1.20261113"
  related_skills: [is-code, is-devx, is-content]
---

# is-ui - the window

## Job to be done

Change the window so it stays bright, readable and easy for a young learner, behaves the same for
a person and for a test, and never crashes on what it draws.

## The shape of the UI

`crates/ui-egui/src/lib.rs`: `App::show(ui)` draws one frame.

- The brand bar (`Panel::top`): the orangutan and the I-SUCCESS wordmark (both embedded PNGs
  from `assets/brand/`). The wordmark goes home.
- Then one `Screen`: `Home` (subject pills, collapsible level bands, grade cards), `Grade(id)`
  (that grade's skills), or `Practice(Practice)` (one problem at a time).
- A screen function returns an optional `Nav`; `App::go` applies it after drawing. Do not change
  `self.screen` in the middle of drawing.
- State that is about practice lives in the engine's `Practice`; the UI only shows it and calls
  its methods (`check`, `show_step`, `next`, `typed`).

egui 0.37 specifics, checked against its source: `eframe::App` has `fn ui(&mut self, ui, frame)`;
panels take `.show(ui, ..)`; `Margin` takes `i8`; `TextEdit::frame` takes a `Frame`;
`WidgetType` is a deprecated alias of `Role`. Check any other call in the egui sources in your
cargo registry before using it, rather than writing it from memory.

## Theme

Every colour comes from `src/theme.rs` or from a grade's `accent` in the catalog. No colour
literal in a widget.

- Surfaces use the bright colours as they are: the lime bar `BRAND`, card borders and badges in
  each grade's accent, the light grey `PAGE`.
- Text uses a readable partner: `ON_BRAND` ink on lime, white on the deeper `PRIMARY` blue,
  `accent_text()` (a darker shade) for titles in a grade's colour.
- Contrast is tested in `theme.rs`: 4.5 to 1 for text, 3 to 1 for edges a learner must find
  (the answer box). A new text colour pair gets a row in that test. A new grade accent is covered
  by `every_grade_title_is_readable`.
- Sizes: body and buttons 16, small 13, headings 26 or more. Do not go smaller for young readers.

## Fonts and characters

egui panics on a character no installed font can draw. Only **Ubuntu-Light** and **egui-icons**
are installed for text: the emoji font files in `epaint_default_fonts` are present but not
installed. Before using a symbol, check it against those two (the panic message lists the
installed fonts). Known safe: ASCII, `•` `×` `÷` `−` `‹` `›` `·`. Known missing: `★` `●` `✓` `▸`.
egui has no bold face; `strong()` only darkens. A bold face would come from `craft-fonts` with a
row in `ATTRIBUTION.md`.

## Accessibility labels (also how tests find things)

Every control a learner uses has a label that says what it does, set with
`response.widget_info(|| WidgetInfo::labeled(Role::.., true, label))` when its text alone is not
unique:

| Control | Label |
|---|---|
| Grade card skill link | `"{grade} {subject} skills"`, such as `Grade 3 Math skills` |
| Skill link | `"Practise {code} {title}"` |
| Answer box | `"Answer: {label}"` |
| Back link | `"Back to {where}"` |
| Wordmark | `I-SUCCESS home` |

A subject pill is a button labelled with the subject's name; query it with
`get_by_role_and_label(Role::Button, "Math")`, because the name also appears on every card.

## Tests

`crates/ui-egui/tests/ui.rs` drives the real app with `egui_kittest`:

```rust
let mut h = Harness::builder().with_size(egui::vec2(1280.0, 900.0))
    .build_ui_state(|ui, app: &mut App| app.show(ui), App::new());
h.run();
h.get_by_label("Grade 3 Math skills").click();
h.run();
```

- Type into a box: `focus()`, `run()`, then `type_text("42")`, `run()`.
- Assert absence with `query_by_label(..).is_none()`, presence with `get_by_label` (it fails on
  none or on more than one).
- Disabled state: `node.accesskit_node().is_disabled()` (import `kittest::NodeT`).
- No mocks: the tests use the built-in catalog, or `App::with_catalog` for a broken one.

## Look at it

Green tests prove behaviour, not looks. For any visible change, render the screens and look at
every picture before saying it is done:

```bash
cargo test -p i-success-ui-egui --test screens -- --ignored
```

The pictures are in `target/screenshots/`. Add a screen to `tests/screens.rs` when you add one
to the app. Things only the pictures showed so far: text justified into wide gaps inside
`ui.columns` (wrap card contents in `Layout::top_down(Align::Min)`), body text too small to read,
an answer box with no visible edge.
