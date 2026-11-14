/* study-wb examples gallery: renders window.STUDY_WB_EXAMPLES (index.data.js) as cards, with search, subject pills,
   and a Light / Dark switch plus a theme selector remembered in this browser. All text is set as text, not HTML. */
(function () {
  'use strict';
  const data = window.STUDY_WB_EXAMPLES || [];
  const grid = document.getElementById('grid'), q = document.getElementById('q'), subjectsBox = document.getElementById('subjects');
  const root = document.documentElement, mode = document.getElementById('mode'), theme = document.getElementById('theme');
  const KEY = 'studywb-gallery';
  let saved = {}; try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
  const store = () => { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {} };
  mode.checked = (root.dataset.mode || 'dark') === 'dark';
  theme.value = root.dataset.theme || 'default';
  mode.addEventListener('change', () => { saved.mode = mode.checked ? 'dark' : 'light'; root.dataset.mode = saved.mode; store(); });
  theme.addEventListener('change', () => { saved.theme = theme.value; root.dataset.theme = theme.value; store(); });

  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const link = (cls, text, href, title) => { const a = el('a', 'btn ' + cls, text); a.href = encodeURI(href); if (title) a.title = title; return a; };
  const WIDGET = { classify: 'classify table', answers: 'answer rows', choice: 'multiple choice', table: 'answer table', fset: 'effects grid' };
  const TOOL = { calculator: 'calculator', notepad: 'notepad', stickies: 'sticky notes', periodic: 'periodic table' };
  const ICON = { accounting: '$', circuits: '⚡', mechanics: 'F', chemistry: 'H', minimal: '1' };

  const subjects = ['All', ...new Set(data.map(d => d.subject))];
  let subject = saved.subject && subjects.includes(saved.subject) ? saved.subject : 'All';
  subjects.forEach(s => {
    const b = el('button', 'tag' + (s === subject ? ' active' : ''), s); b.type = 'button'; b.setAttribute('aria-pressed', String(s === subject));
    b.addEventListener('click', () => { subject = s; saved.subject = s; store(); subjectsBox.querySelectorAll('.tag').forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', String(x === b)); }); render(); });
    subjectsBox.appendChild(b);
  });

  function card(d, i) {
    const c = el('article', 'card');
    const head = el('div', 'card-head');
    const icon = el('div', 'card-icon'); icon.textContent = ICON[d.id.split('_')[0]] || '◆';
    const titles = el('div', 'card-titles');
    titles.append(el('p', 'kicker', `${String(i + 1).padStart(2, '0')} · ${d.subject}`), el('h2', '', d.title));
    head.append(icon, titles);
    c.append(head);
    if (d.heading) c.append(el('p', 'heading', d.heading));
    if (d.description) c.append(el('p', 'desc', d.description.charAt(0).toUpperCase() + d.description.slice(1)));
    const m = el('div', 'metric'); m.append(el('b', '', String(d.problems)), el('span', 'muted', `problem${d.problems === 1 ? '' : 's'} in ${d.groups.length} group${d.groups.length === 1 ? '' : 's'}: ${d.groups.join(', ')}`));
    c.append(m);
    const total = d.problems || 1, bar = el('div', 'stack'); bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', `${d.labels.graded} graded, ${d.labels.calculated} calculated, ${d.labels.generated} generated`);
    const legend = el('div', 'legend');
    ['graded', 'calculated', 'generated'].forEach(k => {
      const n = d.labels[k]; if (!n) return;
      const seg = el('i'); seg.style.width = (100 * n / total) + '%'; seg.style.background = `var(--${k})`; bar.append(seg);
      const s = el('span', '', `${n} ${k}`); s.style.setProperty('--c', `var(--${k})`); legend.append(s);
    });
    c.append(bar, legend);
    const chips = el('div', 'chips');
    d.widgets.forEach(w => chips.append(el('span', 'chip', WIDGET[w] || w)));
    d.tools.forEach(t => chips.append(el('span', 'chip tool', TOOL[t] || t)));
    if (d.timer) chips.append(el('span', 'chip tool', 'timer'));
    c.append(chips);
    const a = el('div', 'actions');
    const open = link('primary', 'Open page', d.page, d.built ? 'Open the built page' : 'Not built yet: run build_study_aid.py');
    if (!d.built) open.setAttribute('aria-disabled', 'true');
    a.append(open, link('', 'Content file', d.content, 'The YAML the page is built from'));
    if (d.sources.length) a.append(link('', `Source${d.sources.length > 1 ? 's' : ''} (${d.sources.length})`, d.content.replace(/[^/]+$/, '') + d.sources[0], 'An invented source document the page links to'));
    c.append(a);
    return c;
  }
  function startCard() {
    const c = el('article', 'card start');
    c.append(el('p', 'kicker', 'Start your own'), el('h2', '', 'New page in five commands'),
      el('p', 'desc', 'Copy the starter content file next to where the page should live, edit it, then validate, build and verify.'));
    const pre = el('pre', '', 'cp <skill>/assets/template_01/content.example.yaml my-page.yaml\npython <skill>/scripts/validate_study_data.py my-page.yaml\npython <skill>/scripts/build_study_aid.py my-page.yaml\npython <skill>/scripts/verify_page.py my-page.html');
    const a = el('div', 'actions');
    a.append(link('primary', 'Template guide', '../assets/template_01/README.md'), link('', 'Starter content', '../assets/template_01/content.example.yaml'), link('', 'Data contract', '../references/data_schema.md'));
    c.append(pre, a);
    return c;
  }
  function render() {
    const words = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const shown = data.filter(d => (subject === 'All' || d.subject === subject) && words.every(w =>
      [d.id, d.title, d.heading, d.description, d.subject, ...d.groups, ...d.widgets.map(x => WIDGET[x] || x), ...d.tools.map(x => TOOL[x] || x)].join(' ').toLowerCase().includes(w)));
    grid.replaceChildren(...shown.map(card));
    if (!shown.length) grid.append(el('p', 'empty muted', 'No example matches.'));
    if (subject === 'All' && !words.length) grid.append(startCard());
  }
  q.addEventListener('input', render);
  if (!data.length) { grid.append(el('p', 'empty muted', 'index.data.js is missing or empty. Run scripts/build_examples_index.py.')); return; }
  render();
})();
