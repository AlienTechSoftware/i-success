# Vendored chart and diagram libraries

Offline copies so study pages work without a network. Loaded only when a content
file lists them under `libraries:`. Do not edit these files; to upgrade, replace
the file, replace its licence text in `licenses/` with the one from the same
version, and update the table below.

| File | Package | Version | Licence | Copyright | Licence text |
|---|---|---|---|---|---|
| `mermaid.min.js` | mermaid | 11.4.1 | MIT | 2014 - 2022 Knut Sveidqvist | [`licenses/mermaid.LICENSE.txt`](licenses/mermaid.LICENSE.txt) |
| `d3.min.js` | d3 | 7.9.0 | ISC | 2010-2023 Mike Bostock | [`licenses/d3.LICENSE.txt`](licenses/d3.LICENSE.txt) |
| `vega.min.js` | vega | 5.30.0 | BSD-3-Clause | 2015-2023, University of Washington Interactive Data Lab | [`licenses/vega.LICENSE.txt`](licenses/vega.LICENSE.txt) |
| `vega-lite.min.js` | vega-lite | 5.21.0 | BSD-3-Clause | 2015, University of Washington Interactive Data Lab | [`licenses/vega-lite.LICENSE.txt`](licenses/vega-lite.LICENSE.txt) |
| `vega-embed.min.js` | vega-embed | 6.26.0 | BSD-3-Clause | 2015, University of Washington Interactive Data Lab | [`licenses/vega-embed.LICENSE.txt`](licenses/vega-embed.LICENSE.txt) |

The minified files keep the licences they ship with. Only `d3.min.js` still starts with its
copyright line, so each package's own licence file is kept in `licenses/`, unchanged, as
published in that exact version on npm (fetched from `cdn.jsdelivr.net/npm/<package>@<version>/LICENSE`
on 2026-11-13). The version of every file was confirmed from the version string inside it.

## Code bundled inside these files

- `mermaid.min.js` carries a "Bundled license information" block with the notices of what it
  bundles: DOMPurify 3.2.1 (Apache-2.0 and MPL-2.0), js-yaml 4.1.0 (MIT), lodash-es (MIT) and
  parts of cytoscape (MIT). The block is inside the file, so it travels with it.
- `vega.min.js`, `vega-lite.min.js` and `vega-embed.min.js` carry no notices for anything they
  may bundle. What they bundle has not been audited; check before a release that ships them.
