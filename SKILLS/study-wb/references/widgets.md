# Answer widgets (content-file shorthand)

A problem gives either `body` (HTML with `{{box:name}}` / `{{pick:name}}`
tokens plus a `fields` map, see [data_schema.md](data_schema.md)) or `blocks`:
a list whose items are HTML strings or one widget each. The build
(`scripts/build_study_aid.py`) expands `blocks` into `body` + `fields`; the
runtime never sees the shorthand. A working file that uses every widget:
[../assets/template_01/content.example.yaml](../assets/template_01/content.example.yaml).

Field names must be unique within a problem. Steps fill boxes by these names.

## `classify` - items answered from one option list

```yaml
- classify:
    options: [Variable, Fixed, Mixed, Step]
    prefix: c            # boxes are c0, c1, ... (default c)
    letters: true        # (a), (b), ... in front of each item (default true)
    head: [ "", Cost, Behavior ]    # optional header row
    style: "min-width:220px"        # optional dropdown style
    autoSteps: true      # one step per option, listing its items with the reason (third element)
    items:
      - [Salary of the department manager, Fixed, the same salary at any volume]
      - [Raw materials used, Variable]
```

With `autoSteps: true`, set the problem's `steps: auto` to use them.

## `answers` - labelled answer rows

```yaml
- answers:
    rows:
      - { label: "Total lease liabilities", name: total, answer: 4263245, prefix: "$", suffix: thousands }
      - { label: "Rate per hour", name: rate, answer: 12.5, tol: 0.005, prefix: "$" }
```

Boxes default to class `mid` (150 px wide).

## `choice` - one multiple-choice question

```yaml
- choice:
    name: q
    question: What are the four components of pension expense?
    options: [ "...A...", "...B...", "...C...", "...D..." ]
    answer: D            # a letter
```

## `table` - any table; a cell is HTML or an answer box

```yaml
- table:
    cls: given           # default given; answers is the narrow variant
    head: [Item, Current year, Prior year]
    rows:
      - [Operating lease assets, "$3,421,386", "$3,271,710"]
      - [Total, { name: total, answer: 6692, prefix: "$" }, ""]
      - [Direction, { name: dir, answer: U, options: [U, F], style: "min-width:64px" }, ""]
```

A cell box takes the same keys as a field (`answer`, `tol`, `options`, `kind`,
`cls`, `style`) plus `prefix` and `suffix`.

## `fset` - financial-statement-effects grid

```yaml
- fset:
    prefix: s            # boxes s r<row> c<col> (amounts) and s r<row> a<col> (accounts)
    columns: [Cash, Noncash assets, Liabilities, Equity, Revenue, Expenses, Net income]
    balanceSheetColumns: 4   # default: all but the last three
    accounts: [N/A, Cash, Inventory, Ret Earn, Sales, COGS]
    rows:
      - label: Sale
        values: [100, 0, 0, 100, 100, 0, 100]
        accounts: [Cash, N/A, N/A, Ret Earn, Sales, N/A]   # one per column except the last (net income)
```

Amounts of 0 and accounts of `N/A` may be left blank by the student and are
accepted blank. Steps fill the rest by name, for example `sr0c0`, `sr0a0`.

## Writing YAML that parses

- Quote text that contains `: ` (colon space) or ` #`.
- Inside `{ }` or `[ ]`, quote text that contains a comma: `"1,000"`.
- Use `|` for multi-line HTML.
- Use the true minus sign `−` (U+2212) in keystroke lines, and quote operators:
  `[5000, "÷", 100, "=" ]`.
