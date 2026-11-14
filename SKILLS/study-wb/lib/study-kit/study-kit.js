/* ==========================================================================
   study-kit.js  -  practice-page runtime for study-wb. Builds a whole study page from one data object.

   Load order, just before </body>:
       <link rel="stylesheet" href="study-kit/study-kit.css">        (in <head>)
       <script src="my-page.data.js"></script>                        sets window.STUDY_DATA
       <script src="study-kit/study-kit.js"></script>                 builds the page
       <script src="workbench/workbench.js" data-key="..."></script>  optional side pane (needs the page built first)

   What it builds: header with the options gear, the Practice card (Level 1 groups, Level 2 problems), the Reference
   card, hidden how-to panels (shown inside each problem and used by the workbench notepad), the options panel
   (theme, voice, speed), and the timer bar. Per problem: the statement with answer boxes, Check / Reset /
   Show answers / Next step / Restart steps / Read problem / Read selection, and a hidden worked solution with a
   keystroke table computed by a basic-calculator simulator.

   The data contract is references/data_schema.md. Nothing is defaulted that belongs to the host: a missing
   page.title or page.storageKey stops the page with a visible error.

   window.StudyKit exposes verify() (run every problem's steps and check every box), and the step and check
   functions for tests. It never sends anything over the network.
   ========================================================================== */
(function () {
  'use strict';
  /* ?sk-verify: headless check mode (scripts/verify_page.py). Collect script and resource errors from here on; after
     load, write verify()'s result into the page as JSON so a DOM dump can read it. */
  const VERIFY_MODE = /[?&]sk-verify\b/.test(location.search), pageErrors = [];
  if (VERIFY_MODE) {
    window.addEventListener('error', e => { pageErrors.push(e.message || `failed to load ${(e.target && (e.target.src || e.target.href)) || 'a resource'}`); }, true);
    window.addEventListener('load', () => setTimeout(() => {
      let out;
      try { out = window.StudyKit ? window.StudyKit.verify() : { ok: false, errors: ['study-kit did not finish building the page'] }; }
      catch (err) { out = { ok: false, errors: [String(err)] }; }
      out.pageErrors = pageErrors.slice(); out.workbench = !!document.getElementById('bench');
      if (out.pageErrors.length) out.ok = false;
      const s = document.createElement('script'); s.type = 'application/json'; s.id = 'sk-verify-result';
      s.textContent = JSON.stringify(out).replace(/</g, '\\u003c'); document.body.appendChild(s);
    }, 0));
  }
  const D = window.STUDY_DATA;
  function stop(msg) {
    const p = document.createElement('div'); p.className = 'sk-error'; p.setAttribute('role', 'alert');
    p.textContent = 'study-kit: ' + msg; document.body.prepend(p); throw new Error('study-kit: ' + msg);
  }
  if (!D) stop('no window.STUDY_DATA. Load the page data file before study-kit.js.');
  const P = D.page || {};
  if (!P.title) stop('page.title is required.');
  if (!P.storageKey) stop('page.storageKey is required (unique per page, so two pages never share notes or settings).');
  const SK = P.storageKey;

  /* ---------- small helpers ---------- */
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  /* Diagrams and charts. A problem may carry `diagram` (Mermaid text) and/or `chart` (a Vega-Lite spec). The
     libraries are loaded only when the content file lists them under `libraries:`. Each visual draws the first time
     it is on screen. */
  function visualHtml(p) {
    let h = '';
    if (p.diagram) h += `<div class="visual" data-mmd="${esc(p.diagram)}" style="margin:.6rem 0;overflow-x:auto"></div>`;
    if (p.chart) h += `<div class="visual" data-vega="${esc(JSON.stringify(p.chart))}" style="margin:.6rem 0;overflow-x:auto"></div>`;
    return h;
  }
  function renderVisuals() {
    document.querySelectorAll('.visual:not([data-done])').forEach(el => {
      if (el.offsetParent === null) return;
      el.dataset.done = '1';
      if (el.dataset.mmd && window.mermaid) {
        const pre = document.createElement('pre'); pre.className = 'mermaid'; pre.textContent = el.dataset.mmd; el.appendChild(pre);
        mermaid.run({ nodes: [pre] }).catch(err => { el.textContent = 'Diagram could not be drawn: ' + err.message; });
      }
      if (el.dataset.vega && window.vegaEmbed) {
        vegaEmbed(el, JSON.parse(el.dataset.vega), { actions: false, renderer: 'svg' }).catch(err => { el.textContent = 'Chart could not be drawn: ' + err.message; });
      }
    });
  }
  if (window.mermaid) mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
  document.addEventListener('click', () => setTimeout(renderVisuals, 80));
  window.addEventListener('load', () => setTimeout(renderVisuals, 200));
  document.addEventListener('toggle', () => setTimeout(renderVisuals, 80), true);
  const fmt = n => Number(n).toLocaleString('en-US');
  const f2 = n => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money = n => n < 0 ? `(${fmt(-n)})` : fmt(n);
  const LABELS = ['graded', 'calculated', 'generated'];
  const KEY_TEXT = Object.assign({
    graded: 'Answer key: <strong>graded key</strong>, copied from the graded attempt in the source linked above.',
    calculated: '<strong>No answer key saved.</strong> The problem is transcribed from the source linked above, but every answer here is <strong>calculated</strong> with the standard method.',
    generated: '<strong>GENERATED VARIANT, not from any course file.</strong> Same structure as a source problem, invented numbers. Answers are calculated by the same method; no graded key exists for them.'
  }, D.labelText || {});
  const BADGE = { graded: 'Graded key', calculated: 'Calculated', generated: 'Generated' };
  const GEAR = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
  const DEFAULT_INTRO = '<p class="muted"><strong>Level 1:</strong> choose a group. <strong>Level 2:</strong> choose a problem (P1, P2, …) inside it. Green = graded key, amber = calculated (no key exists), red dashed = generated variant. <strong>[AI#n]</strong> = a problem the assistant proposed (generated; some carry a TWIST). Each problem has Check · Reset · Show answers, plus <strong>Next step</strong>, which explains one step and fills only that step\'s boxes.</p>'
    + '<p class="muted">Shortcuts for the active problem: <kbd>Alt</kbd>+<kbd>K</kbd> (or <kbd>Alt</kbd>+<kbd>C</kbd>) = Check · <kbd>Alt</kbd>+<kbd>R</kbd> = Reset · <kbd>Alt</kbd>+<kbd>S</kbd> = Show answers · <kbd>Alt</kbd>+<kbd>N</kbd> = Next step · <kbd>Alt</kbd>+<kbd>V</kbd> = Read the selected text aloud. (Chrome on Windows swallows Alt+C, so use Alt+K there.)</p>';

  /* ---------- page shell ---------- */
  document.title = P.title;
  if (P.lang) document.documentElement.lang = P.lang;
  const refNode = r => r.children
    ? `<details><summary>${r.title}</summary><div>${r.html || ''}${r.children.map(refNode).join('')}</div></details>`
    : `<details><summary>${r.title}</summary><div>${r.html || ''}</div></details>`;
  const reference = (D.reference || []).length
    ? `<section class="card" id="reference"><div class="card-head"><h2>${P.referenceTitle || 'Reference (everything here is collapsed)'}</h2><span class="points">Optional</span></div><div class="content">
        <div class="actions" style="margin:0 0 6px"><button type="button" data-sk="expand">Expand all</button><button type="button" class="secondary" data-sk="collapse">Collapse all</button></div>${D.reference.map(refNode).join('')}</div></section>` : '';
  const howtos = Object.entries(D.howto || {}).map(([id, h]) =>
    `<section class="card question-panel" id="${esc(id)}"><div class="card-head"><h2>${h.title || id}</h2></div><div class="content">${(h.panels || [{ summary: 'How to solve — step by step', html: h.html || '' }]).map(x => `<details><summary>${x.summary}</summary><div>${x.html}</div></details>`).join('')}</div></section>`).join('');
  const T = D.timer;
  const timerBar = T ? `<footer class="timer" aria-label="Exam timer"><strong>Exam timer</strong><span class="clock" id="timerClock" role="timer" aria-live="off"></span>
      <button type="button" id="timerStart" data-sk="timer-start">Start</button><button type="button" class="secondary" data-sk="timer-stop">Stop</button><button type="button" class="secondary" data-sk="timer-reset">Reset</button>
      <label>Exam <input id="timerBase" type="number" min="1" step="1" value="${Number(T.minutes)}"> min</label><label>× extra <input id="timerMult" type="number" min="1" step="0.25" value="${Number(T.multiplier || 1)}"></label><span class="src" id="timerSrc"></span></footer>` : '';
  const shell = document.createElement('div');
  shell.innerHTML = `<header class="top"><button type="button" id="optBtn" class="optbtn" aria-label="Options" title="Options: theme and voice" aria-haspopup="dialog" aria-expanded="false">${GEAR}</button><h1>${P.heading || esc(P.title)}</h1>${P.subtitle ? `<p>${P.subtitle}</p>` : ''}</header>
    <main><section class="card"><div class="card-head"><h2>${P.practiceTitle || 'Practice'}</h2></div><div class="content">${D.intro != null ? D.intro : DEFAULT_INTRO}<nav class="question-nav" id="l1" aria-label="Level 1: groups"></nav><div id="l2host"></div></div></section>
    ${reference}<div id="howto" hidden>${howtos}</div></main>
    <div id="optPanel" role="dialog" aria-label="Options" hidden><h3>Options</h3><label>Theme</label><div class="seg" id="optTheme"><button type="button" data-v="light">Light</button><button type="button" data-v="dark">Dark</button><button type="button" data-v="system">System</button></div>
      <label for="optVoice">Voice (read aloud)</label><select id="optVoice"></select><label for="optRate">Speed: <span id="optRateVal"></span></label><input type="range" id="optRate" min="0.6" max="1.4" step="0.05">
      <div class="row" style="align-items:flex-start"><input type="checkbox" id="optUrl" aria-label="Save selections and answers in the URL" style="width:1rem !important;height:1rem !important;min-width:0 !important;margin:.2rem .5rem 0 0 !important;padding:0;flex:none;cursor:pointer"><label for="optUrl" style="display:block;flex:1;margin:0;font-weight:normal;line-height:1.35;cursor:pointer">Save selections and answers in the URL</label></div>
      <div class="row"><button type="button" id="optTest">Test voice</button><button type="button" class="secondary" id="optReset">Reset</button></div></div>${timerBar}`;
  document.body.prepend(...shell.childNodes);
  if (!T) document.body.style.paddingBottom = '0';

  /* ---------- timer: stores the end time and redraws once a second; nothing runs while stopped ---------- */
  if (T) (() => {
    const KS = SK + '-timer-setup', KT = SK + '-timer';
    let total = 0, left = 0, end = null, tick = null;
    const base = document.getElementById('timerBase'), mult = document.getElementById('timerMult'), el = document.getElementById('timerClock');
    const save = () => { try { localStorage.setItem(KT, JSON.stringify({ left, end })); } catch (e) {} };
    function draw() {
      if (end) left = Math.max(0, end - Date.now());
      const sec = Math.ceil(left / 1000);
      el.textContent = sec ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : "Time's up";
      el.className = 'clock' + (sec <= 600 ? ' late' : sec <= 1500 ? ' warn' : '');
      document.getElementById('timerStart').textContent = end ? 'Running' : left < total ? 'Resume' : 'Start';
      base.disabled = mult.disabled = !!end;
      if (end && !sec) stop();
    }
    function start() { if (end || !left) return; end = Date.now() + left; tick = setInterval(draw, 1000); save(); draw(); }
    function stop() { if (end) left = Math.max(0, end - Date.now()); end = null; clearInterval(tick); save(); draw(); }
    function reset() { end = null; clearInterval(tick); left = total; save(); draw(); }
    function setup(doReset) {
      const b = Math.max(1, +base.value || T.minutes), m = Math.max(1, +mult.value || 1), t = Math.round(b * m);
      total = t * 60000;
      document.getElementById('timerSrc').innerHTML = `${b} min × ${m} = ${t} min. ${T.note || ''}`;
      try { localStorage.setItem(KS, JSON.stringify({ base: b, mult: m })); } catch (e) {}
      if (doReset && !end) reset();
    }
    try { const u = JSON.parse(localStorage.getItem(KS)); if (u) { base.value = u.base; mult.value = u.mult; } } catch (e) {}
    setup(false); left = total;
    try { const s = JSON.parse(localStorage.getItem(KT)); if (s) { left = s.left; if (s.end) { left = Math.max(0, s.end - Date.now()); if (left) { end = s.end; tick = setInterval(draw, 1000); } } } } catch (e) {}
    base.addEventListener('change', () => setup(true)); mult.addEventListener('change', () => setup(true));
    document.addEventListener('click', e => { const a = e.target.closest('[data-sk^="timer-"]'); if (a) ({ 'timer-start': start, 'timer-stop': stop, 'timer-reset': reset })[a.dataset.sk](); });
    draw();
  })();

  /* ---------- basic-calculator simulator: the keystroke table's "Screen shows" column follows from the keys ---------- */
  const OPS = { '+': (x, y) => x + y, '−': (x, y) => x - y, '×': (x, y) => x * y, '÷': (x, y) => x / y };
  function simulate(lines) {
    let acc = null, op = null, entry = null, disp = 0;
    const press = t => {
      if (typeof t === 'number') { entry = t; disp = t; }
      else if (t in OPS) { if (op && entry != null) acc = OPS[op](acc, entry); else if (!op) acc = entry ?? disp; op = t; entry = null; disp = acc; }
      else if (t === '=') { if (op && entry != null) { acc = OPS[op](acc, entry); disp = acc; } op = null; entry = null; }
    };
    return lines.map(line => {
      if (typeof line === 'string') return { say: line };
      const keys = line.keys, meaning = line.meaning, key = line.value;
      keys.forEach(press); return { keys, meaning, key, disp };
    });
  }
  const kbd = t => `<kbd>${typeof t === 'number' ? String(t).replace(/^0\./, '.') : esc(t)}</kbd>`;
  const scr = n => String(Math.round(n * 1e4) / 1e4);
  function calcTable(lines) {
    if (!lines || !lines.length) return '';
    const rows = simulate(lines).map((r, i) => r.say !== undefined ? `<tr><td colspan="4" class="keys-say">${r.say}</td></tr>`
      : `<tr><td>${i + 1}</td><td>${r.keys.map(kbd).join(' ')}</td><td>${scr(r.disp)}</td><td>${r.meaning}${r.key == null ? '' : ` → <strong>${money(r.key)}</strong>${Math.abs(r.disp - r.key) > 1e-9 ? ' (rounded)' : ''}`}</td></tr>`).join('');
    return `<p><strong>Keystrokes (basic calculator):</strong></p><table class="keys"><thead><tr><th>#</th><th>Press</th><th>Screen shows</th><th>Meaning</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  /* ---------- problems ---------- */
  const problems = [];
  const buildErrors = [];
  function box(name, f) {
    const ans = Array.isArray(f.answer) ? f.answer.join('|') : f.answer;
    if (f.options) return `<select data-answer="${esc(ans)}" data-f="${esc(name)}" data-kind="text" aria-label="${esc(f.aria || name)}"${f.style ? ` style="${esc(f.style)}"` : ''}${f.cls ? ` class="${esc(f.cls)}"` : ''}><option value=""></option>${f.options.map(o => `<option>${esc(o)}</option>`).join('')}</select>`;
    return `<input data-answer="${esc(ans)}" data-f="${esc(name)}" class="${esc(f.cls || '')}" aria-label="${esc(f.aria || name)}"${f.tol != null ? ` data-tol="${Number(f.tol)}"` : ''}${f.kind === 'text' ? ' data-kind="text"' : ''}${f.style ? ` style="${esc(f.style)}"` : ''}>`;
  }
  function body(p, id) {
    const fields = p.fields || {}, used = new Set();
    const html = String(p.body || '').replace(/\{\{(?:box|pick):([\w.-]+)\}\}/g, (m, name) => {
      if (!fields[name]) { buildErrors.push(`${id}: the body uses {{${name}}} but fields has no "${name}"`); return `<span class="sk-error">missing field ${esc(name)}</span>`; }
      used.add(name); return box(name, fields[name]);
    });
    Object.keys(fields).forEach(n => { if (!used.has(n)) buildErrors.push(`${id}: field "${n}" is never placed in the body`); });
    return html;
  }
  function howtoHtml(id, extra = '') {
    const boxEl = id && document.querySelector(`#howto [id="${CSS.escape(id)}"] > .content`);
    if (!boxEl) return extra;
    const parts = [...boxEl.querySelectorAll(':scope > details')].map(x => x.outerHTML);
    if (extra && parts.length) parts[0] = parts[0].replace(/<\/details>\s*$/, extra + '</details>');
    return parts.join('');
  }
  const ACTIONS = `<div class="actions"><button type="button" data-sk="check">Check</button><button type="button" class="secondary" data-sk="reset">Reset</button><button type="button" class="secondary" data-sk="show">Show answers</button><button type="button" class="step" data-sk="next">Next step</button><button type="button" class="secondary" data-sk="restart">Restart steps</button><button type="button" class="tts-btn" data-sk="read-problem" title="Read this problem aloud">Read problem</button><button type="button" class="tts-btn" data-sk="read-selection" title="Read the selected text aloud (Alt+V)">Read selection (Alt+V)</button><span class="result"></span></div>
    <div class="steps" hidden><strong>Step by step</strong> <span class="muted">(each click explains one step and fills only that step's boxes)</span> <span class="sk-audio-slot"></span><ol></ol></div>`;
  function renderProblem(p, label, id) {
    if (!LABELS.includes(p.label)) buildErrors.push(`${id}: label must be one of ${LABELS.join(', ')} (got "${p.label}")`);
    const files = p.files || [];
    const links = files.length ? `<p class="muted">Original: ${files.map(f => `<a href="${encodeURI(f)}" target="_blank" rel="noopener">${esc(f.split('/').pop())}</a>`).join(' + ')}</p>`
      : '<p class="muted">Original: none. This is a generated drill variant.</p>';
    const badge = p.label === 'generated' && /\[AI#/.test(p.name) ? 'AI proposed' : BADGE[p.label] || p.label;
    const solution = `<details class="solution"><summary>Worked solution (hidden, try the problem first)</summary><div>${calcTable(p.keys)}<ol>${(p.steps || []).map(s => `<li>${s.say}</li>`).join('')}</ol></div></details>`;
    return `<strong>${esc(label)}</strong> <span class="badge ${esc(p.label)}">${badge}</span>${links}<p class="keynote ${esc(p.label)}">${KEY_TEXT[p.label] || ''}</p>${howtoHtml(p.howto, visualHtml(p))}${body(p, id)}${ACTIONS}${solution}`;
  }
  (() => {
    const l1 = document.getElementById('l1'), host = document.getElementById('l2host');
    (D.groups || []).forEach((g, gi) => {
      if (!g.id) buildErrors.push(`group ${gi}: id is required`);
      const l1btn = document.createElement('button'); l1btn.type = 'button'; l1btn.textContent = g.id; if (g.caption) l1btn.title = g.caption.replace(/<[^>]+>/g, '');
      if (g.gapBefore) l1.appendChild(Object.assign(document.createElement('span'), { className: 'gap' }));
      const group = document.createElement('div'); group.className = 'group'; group.dataset.id = g.id;
      group.innerHTML = g.caption ? `<p class="caption">${g.caption}</p>` : '';
      const nav = document.createElement('div'); nav.className = 'source-nav'; nav.innerHTML = '<span class="label">Choose a problem</span>';
      const views = document.createElement('div');
      (g.problems || []).forEach((p, i) => {
        const label = `P${i + 1} · ${p.name}`, id = `${g.id} P${i + 1}`;
        const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
        b.className = (i === 0 ? 'active' : '') + (p.label === 'generated' ? ' gen' : p.label === 'calculated' ? ' calc' : '');
        const v = document.createElement('div'); v.className = `source-view${i === 0 ? ' active' : ''}`; v.dataset.name = label;
        v.innerHTML = renderProblem(p, label, id);
        v._steps = p.steps || []; v._i = 0;
        v._steps.forEach((s, si) => Object.keys(s.fill || {}).forEach(n => { if (!v.querySelector(`[data-f="${CSS.escape(n)}"]`)) buildErrors.push(`${id} step ${si + 1}: fills "${n}", which is not on the form`); }));
        b.addEventListener('click', () => { nav.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b)); views.querySelectorAll('.source-view').forEach(x => x.classList.toggle('active', x === v)); });
        nav.appendChild(b); views.appendChild(v); problems.push(v);
      });
      group.append(nav, views); host.appendChild(group);
      l1btn.addEventListener('click', () => { l1.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === l1btn)); host.querySelectorAll('.group').forEach(x => x.classList.toggle('active', x === group)); });
      if (gi === 0) { l1btn.classList.add('active'); group.classList.add('active'); }
      l1.appendChild(l1btn);
    });
  })();

  /* ---------- step engine ---------- */
  const isText = f => f.dataset.kind === 'text' || f.tagName === 'SELECT';
  function number(value) { const raw = String(value).trim(); const neg = /^\(.*\)$/.test(raw) || /^-/.test(raw); const n = Number(raw.replace(/[$,\s()\-]/g, '')); return neg ? -n : n; }
  function fillValue(f, v) {
    if (isText(f)) f.value = String(v);
    else { const n = Number(v); f.value = n === 0 ? '0' : Number.isInteger(n) ? money(n) : (n < 0 ? `(${f2(-n)})` : f2(n)); }
    f.classList.add('correct'); f.classList.remove('incorrect');
  }
  function nextStep(view, silent) {
    const log = view.querySelector('.steps'), ol = log.querySelector('ol'), steps = view._steps;
    log.hidden = false;
    if (view._i >= steps.length) { if (!ol.querySelector('.done')) ol.insertAdjacentHTML('beforeend', '<li class="done">All steps shown. Check your remaining boxes, or Restart steps.</li>'); return; }
    const s = steps[view._i++];
    ol.querySelectorAll('li').forEach(li => li.classList.remove('now'));
    ol.insertAdjacentHTML('beforeend', `<li class="now">${s.say}</li>`);
    if (!silent) { if (speaking) ttsStop(); speakText(plainText(s.say), view.querySelector('.steps-audio [data-ctl="playpause"]') || view.querySelector('[data-sk="play-steps"]')); }
    Object.entries(s.fill || {}).forEach(([n, v]) => { const f = view.querySelector(`[data-f="${CSS.escape(n)}"]`); if (f) fillValue(f, v); });
    view.querySelector('button.step').textContent = view._i >= steps.length ? 'Next step (done)' : `Next step (${view._i + 1} of ${steps.length})`;
  }
  function plainText(html) { const d = document.createElement('div'); d.innerHTML = html; return d.textContent.trim(); }
  function playSteps(btn, view) {
    if (speaking && speaking.btn === btn) { ttsStop(); return; }
    const items = [...view.querySelectorAll('.steps ol li')].filter(li => !li.classList.contains('done'));
    if (!items.length) { toast('No steps shown yet. Press Next step first.'); return; }
    speakText(items.map(li => plainText(li.innerHTML)).join(' '), btn);
  }
  function restartSteps(view) { view._i = 0; const log = view.querySelector('.steps'); log.hidden = true; log.querySelector('ol').innerHTML = ''; view.querySelector('button.step').textContent = 'Next step'; resetFields(view); }

  /* ---------- check / reset / show. Tolerance 0.51 unless the box sets data-tol; text is case-insensitive; blank counts only where the answer is 0 or N/A. ---------- */
  const answersOf = f => f.dataset.answer.split('|').map(a => a.trim());
  const blankAllowed = f => { const a = answersOf(f); return isText(f) ? a.includes('N/A') : a.some(x => x !== '' && Number(x) === 0); };
  function checkFields(view) {
    if (view.dataset.checked === 'true') { view.querySelectorAll('[data-answer]').forEach(f => f.classList.remove('correct', 'incorrect')); view.querySelector('.actions > .result').textContent = ''; view.dataset.checked = 'false'; return; }
    const fields = [...view.querySelectorAll('[data-answer]')]; let ok = 0;
    /* Label-and-amount rows (a text dropdown and a number box in the same row) are checked by PAIR, not by position:
       each row is correct when its label and amount match some expected pair that no other row has already used. */
    const pairs = [...view.querySelectorAll('tr')].map(tr => ({ sel: tr.querySelector('select[data-answer][data-kind="text"]'), inp: tr.querySelector('input[data-answer]') })).filter(p => p.sel && p.inp);
    const expected = pairs.map(p => ({ l: answersOf(p.sel), a: answersOf(p.inp), used: false }));
    const paired = new Set();
    const tolOf = f => f.dataset.tol ? +f.dataset.tol : 0.51;
    const amountOk = (value, a, f) => value === '' ? a.some(x => x !== '' && Number(x) === 0) : a.some(x => Math.abs(number(value) - Number(x)) < tolOf(f));
    pairs.forEach(p => {
      const lv = (p.sel.value || '').trim(), av = (p.inp.value || '').trim();
      const hit = lv !== '' ? expected.find(e => !e.used && e.l.some(x => x.toLowerCase() === lv.toLowerCase()) && amountOk(av, e.a, p.inp)) : undefined;
      if (hit) hit.used = true;
      [p.sel, p.inp].forEach(f => { paired.add(f); f.classList.toggle('correct', !!hit); f.classList.toggle('incorrect', !hit); if (hit) ok++; });
    });
    fields.forEach(f => {
      if (paired.has(f)) return;
      const a = answersOf(f), value = (f.value || '').trim(), blank = value === '' && blankAllowed(f);
      const tol = tolOf(f);
      const right = blank || (value !== '' && (isText(f) ? a.some(x => x.toLowerCase() === value.toLowerCase()) : a.some(x => Math.abs(number(value) - Number(x)) < tol)));
      f.classList.toggle('correct', right && !blank); f.classList.toggle('incorrect', !right); if (right) ok++;
    });
    view.querySelector('.actions > .result').textContent = `${ok} of ${fields.length} correct`;
    view.dataset.checked = 'true';
  }
  function resetFields(view) { view.querySelectorAll('[data-answer]').forEach(f => { f.value = ''; f.classList.remove('correct', 'incorrect'); }); view.querySelector('.actions > .result').textContent = ''; view.dataset.checked = 'false'; }
  function showFields(view) { view.querySelectorAll('[data-answer]').forEach(f => fillValue(f, answersOf(f)[0])); view.querySelector('.actions > .result').textContent = 'Answers filled in'; view.dataset.checked = 'true'; }
  const setDetails = open => document.querySelectorAll('details:not(.solution)').forEach(d => { d.open = open; });
  const activeView = () => document.querySelector('.group.active .source-view.active');

  /* ---------- options: theme, voice, speed. Saved in this browser under <storageKey>-options. ---------- */
  const OPT_KEY = SK + '-options';
  const opts = { theme: 'light', voice: '', rate: 0.95, hl: false, hlColor: '#fff3a3', hlReadColor: '#bfbfbf', urlState: true };
  try { Object.assign(opts, JSON.parse(localStorage.getItem(OPT_KEY)) || {}); } catch (e) {}
  const saveOpts = () => { try { localStorage.setItem(OPT_KEY, JSON.stringify(opts)); } catch (e) {} };

  /* ---------- read-aloud: browser speech, sentence chunks, a watchdog for engines that drop onend ---------- */
  function pickVoice() {
    if (!('speechSynthesis' in window)) return null;
    const voices = speechSynthesis.getVoices();
    if (opts.voice) { const v = voices.find(x => x.name === opts.voice); if (v) return v; }
    const pref = (D.voice && D.voice.lang) || '';
    const score = v => (pref && v.lang && v.lang.toLowerCase().startsWith(pref.toLowerCase()) ? 4 : 0) + (/^en/i.test(v.lang) ? 1 : 0);
    return voices.slice().sort((a, b) => score(b) - score(a))[0] || null;
  }
  let speaking = null, ttsToken = 0, ttsRefs = [], ttsWatch = null;
  function toast(msg) {
    let t = document.getElementById('ttsToast'); if (!t) { t = document.createElement('div'); t.id = 'ttsToast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false; clearTimeout(t._h); t._h = setTimeout(() => { t.hidden = true; }, 2600);
  }
  const ICON = {
    play: '<span style="display:block;width:0;height:0;border-top:.3rem solid transparent;border-bottom:.3rem solid transparent;border-left:.5rem solid currentColor;margin-left:.1rem"></span>',
    pause: '<span style="display:flex;gap:.16rem"><span style="width:.15rem;height:.5rem;background:currentColor"></span><span style="width:.15rem;height:.5rem;background:currentColor"></span></span>',
    stop: '<span style="display:block;width:.46rem;height:.46rem;background:currentColor"></span>'
  };
  function setGroup(grp, st) { // st: 'idle' | 'playing' | 'paused'
    if (!grp) return;
    const pp = grp.querySelector('[data-ctl="playpause"]'), sx = grp.querySelector('[data-ctl="stop"]');
    const playing = st === 'playing';
    pp.innerHTML = playing ? ICON.pause : ICON.play;
    pp.style.background = playing ? '#6c757d' : '#1e7e34';
    pp.title = playing ? 'Pause' : (st === 'paused' ? 'Resume' : 'Play');
    pp.setAttribute('aria-label', pp.title);
    sx.disabled = st === 'idle';
    grp.querySelectorAll('button').forEach(x => { x.style.opacity = x.disabled ? '0.35' : '1'; });
  }
  function ttsStop() {
    const prev = speaking;
    ttsToken++; clearInterval(ttsWatch); ttsWatch = null; ttsRefs = [];
    if ('speechSynthesis' in window) { speechSynthesis.resume(); speechSynthesis.cancel(); }
    if (prev && prev.grp) setGroup(prev.grp, 'idle');
    if ('highlights' in CSS) clearHl();
    document.querySelectorAll('button.tts-btn.speaking').forEach(x => { x.classList.remove('speaking'); x.textContent = x.dataset.label || x.textContent; });
    speaking = null;
  }
  function sentenceRanges(root) {
    if (!root || !document.createTreeWalker) return [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.parentElement && n.parentElement.closest('summary, button, script, style, .tts-group')) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    const parts = []; let full = '';
    while (walker.nextNode()) { const n = walker.currentNode; if (!n.textContent) continue; parts.push({ n, s: full.length }); full += n.textContent; }
    const locate = idx => { for (let k = parts.length - 1; k >= 0; k--) if (parts[k].s <= idx) return { node: parts[k].n, off: idx - parts[k].s }; return null; };
    const ranges = [], re = /[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g; let m;
    while ((m = re.exec(full))) {
      const a = m.index, b = m.index + m[0].replace(/\s+$/, '').length;
      if (b <= a) continue;
      const A = locate(a), B = locate(b); if (!A || !B) continue;
      const r = document.createRange(); r.setStart(A.node, A.off); r.setEnd(B.node, B.off);
      if (r.toString().trim()) ranges.push(r);
    }
    return ranges;
  }
  function swatch(cls, title, val, onInput) {
    const wrap = document.createElement('label'); wrap.title = title;
    wrap.style.cssText = 'position:relative;display:inline-block;width:1.3rem;height:.9rem;border:1px solid #888;border-radius:4px;overflow:hidden;cursor:pointer;margin-left:.15rem;flex:none';
    const fill = document.createElement('span'); fill.style.cssText = 'position:absolute;inset:0;background:' + val;
    const inp = document.createElement('input'); inp.type = 'color'; inp.value = val; inp.className = cls; inp.setAttribute('aria-label', title);
    inp.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;margin:0;padding:0;border:0';
    inp.addEventListener('input', () => { fill.style.background = inp.value; onInput(inp.value); });
    wrap.append(fill, inp);
    return { wrap, inp, fill };
  }
  function syncHl() {
    document.querySelectorAll('.tts-hl-on').forEach(x => { x.checked = !!opts.hl; });
    document.querySelectorAll('.tts-hl-col').forEach(x => { x.value = opts.hlColor; x.parentElement.querySelector('span').style.background = opts.hlColor; });
    document.querySelectorAll('.tts-hl-read').forEach(x => { x.value = opts.hlReadColor; x.parentElement.querySelector('span').style.background = opts.hlReadColor; });
  }
  function setHlStyle() {
    let st = document.getElementById('rdHlStyle'); if (!st) { st = document.createElement('style'); st.id = 'rdHlStyle'; document.head.appendChild(st); }
    st.textContent = `::highlight(read-done){background-color:${opts.hlReadColor}}
::highlight(read-aloud){background-color:${opts.hlColor}}
input.tts-hl-col::-webkit-color-swatch-wrapper{padding:0}
input.tts-hl-col::-webkit-color-swatch{border:0;border-radius:3px}
input.tts-hl-read::-webkit-color-swatch{border:0;border-radius:3px}`;
  }
  function clearHl() { if ('highlights' in CSS) { CSS.highlights.delete('read-done'); CSS.highlights.delete('read-aloud'); } }
  function hlUpdate(ranges, upto) {
    if (!('highlights' in CSS) || typeof Highlight === 'undefined') return;
    if (!opts.hl) { clearHl(); return; }
    CSS.highlights.set('read-done', new Highlight(...ranges.slice(0, upto)));
    CSS.highlights.set('read-aloud', new Highlight(ranges[upto]));
  }
  function speakText(text, btn, ranges) {
    if (!('speechSynthesis' in window)) { toast('This browser has no speech synthesis.'); return; }
    if (speaking) { const same = speaking.btn === btn; ttsStop(); if (same) return; }
    let items;
    if (ranges && ranges.length) items = ranges.map(r => ({ r, t: r.toString().replace(/\s+/g, ' ').trim() })).filter(x => x.t);
    else {
      items = [];
      String(text).replace(/\s+/g, ' ').trim().split(/(?<=[.!?:;])\s+/).forEach(p => { while (p.length > 220) { const cut = p.lastIndexOf(' ', 220); items.push({ r: null, t: p.slice(0, cut > 0 ? cut : 220) }); p = p.slice(cut > 0 ? cut + 1 : 220); } if (p) items.push({ r: null, t: p }); });
    }
    if (!items.length) return;
    const token = ++ttsToken;
    const grp = btn && btn.closest ? btn.closest('.tts-group') : null;
    const st = { btn, grp, items, ranges: items.map(x => x.r), chunks: items.map(x => x.t), i: 0, cur: 0, token, paused: false, utt: null, voice: pickVoice(), next: null };
    speaking = st;
    if (grp) setGroup(grp, 'playing');
    else if (btn) { btn.dataset.label = btn.dataset.label || btn.textContent; btn.classList.add('speaking'); btn.textContent = 'Stop'; }
    st.next = () => {
      if (token !== ttsToken || st.paused) return;
      if (st.i >= st.chunks.length) { ttsStop(); return; }
      const idx = st.i++; st.cur = idx;
      if (st.ranges.some(Boolean)) hlUpdate(st.ranges.filter(Boolean), st.ranges.slice(0, idx + 1).filter(Boolean).length - 1);
      const u = new SpeechSynthesisUtterance(st.chunks[idx]); u.rate = opts.rate; if (st.voice) { u.voice = st.voice; u.lang = st.voice.lang; }
      st.utt = u; ttsRefs.push(u);
      u.onend = () => { if (st.utt === u) st.next(); };
      u.onerror = e => { if (token !== ttsToken || st.paused || st.utt !== u) return; if (e && (e.error === 'interrupted' || e.error === 'canceled')) return; ttsStop(); };
      speechSynthesis.speak(u);
    };
    st.next();
    let idle = 0;
    ttsWatch = setInterval(() => {
      if (token !== ttsToken) { clearInterval(ttsWatch); return; }
      if (st.paused) return;
      if (speechSynthesis.speaking || speechSynthesis.pending) { idle = 0; return; }
      if (++idle >= 2) { idle = 0; if (st.i >= st.chunks.length) ttsStop(); else st.next(); }
    }, 400);
  }
  function readSelection(btn) {
    const text = String(window.getSelection ? window.getSelection() : '').trim();
    if (!text) { toast('Select some text first, then press Alt+V.'); return; }
    speakText(text, btn || (activeView() || document).querySelector('button.tts-btn[data-sk="read-selection"]'));
  }
  function problemText(view) {
    const c = view.cloneNode(true);
    if (c.firstElementChild && c.firstElementChild.tagName === 'STRONG') c.firstElementChild.remove();
    c.querySelectorAll('details, .actions, .steps, .keynote, .badge, .muted, script, style').forEach(e => e.remove());
    c.querySelectorAll('table.fset').forEach(t => t.replaceWith(document.createTextNode(' Fill in the financial statement effects template. ')));
    c.querySelectorAll('table.given').forEach(t => t.replaceWith(document.createTextNode(' ' + [...t.rows].map(r => [...r.cells].map(x => x.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean).join(', ')).filter(Boolean).join('. ') + '. ')));
    c.querySelectorAll('select').forEach(e => e.replaceWith(document.createTextNode(' (choose an answer) ')));
    c.querySelectorAll('input').forEach(e => e.remove());
    c.style.cssText = 'position:absolute;left:-9999px;top:0;width:900px'; document.body.appendChild(c);
    const t = c.innerText.replace(/[•]/g, ',').replace(/\s*\n\s*/g, '. ').replace(/\.\s*\./g, '.').replace(/\s+/g, ' ').trim(); c.remove(); return t;
  }
  function readProblem(btn) {
    const view = btn ? btn.closest('.source-view') : activeView(); if (!view) { toast('Open a problem first.'); return; }
    speakText(view.dataset.name.replace(/^P\d+ · /, '').replace(/\[AI#(\d+)\]/, 'A I number $1') + '. ' + problemText(view), btn);
  }
  function togglePlay(grp) { // returns false when this group is not the one speaking
    const st = speaking;
    if (!st || st.grp !== grp) return false;
    if (!st.paused) { st.paused = true; st.i = st.cur; speechSynthesis.cancel(); setGroup(grp, 'paused'); }
    else { st.paused = false; setGroup(grp, 'playing'); st.next(); }
    return true;
  }
  function addListenButtons(root) {
    if (!('speechSynthesis' in window)) return;
    root.querySelectorAll('details').forEach(d => {
      if (d.querySelector(':scope > summary > button.tts')) return;
      const grp = document.createElement('span'); grp.className = 'tts-group'; grp.style.cssText = 'margin-left:1.6rem;display:inline-flex;gap:.15rem;align-items:center;padding:.3rem .4rem;line-height:1;border:1px solid #888;border-radius:6px';
      const mk = (ctl, label, bg) => { const x = document.createElement('button'); x.type = 'button'; x.className = 'tts tts-btn'; x.dataset.ctl = ctl; x.title = label; x.setAttribute('aria-label', label); x.style.cssText = 'width:1.4rem;height:1.4rem;min-width:0;padding:0;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:.7rem;line-height:1;border:0;color:#fff;background:' + bg + ';transition:opacity .15s'; return x; };
      const pp = mk('playpause', 'Play', '#1e7e34'), sx = mk('stop', 'Stop', '#b02a37');
      pp.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); if (togglePlay(grp)) return; d.open = true; const body = d.querySelector('div'); speakText(body.innerText, pp, sentenceRanges(body)); });
      sx.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); ttsStop(); });
      sx.innerHTML = ICON.stop;
      const hw = document.createElement('span'); hw.className = 'tts-hl'; hw.style.cssText = 'display:inline-flex;align-items:center;gap:0;margin-left:.1rem;font-size:.8rem;line-height:1';
      const hc = document.createElement('input'); hc.type = 'checkbox'; hc.className = 'tts-hl-on'; hc.title = 'Highlight what has been read'; hc.setAttribute('aria-label', 'Highlight what has been read'); hc.style.cssText = 'margin:0 !important;width:.8rem !important;min-width:0 !important;height:.8rem !important;flex:none';
      const hread = swatch('tts-hl-read', 'Colour for sentences already read', opts.hlReadColor, v => { opts.hlReadColor = v; saveOpts(); syncHl(); setHlStyle(); });
      const hcol = swatch('tts-hl-col', 'Highlight colour for the sentence being read', opts.hlColor, v => { opts.hlColor = v; saveOpts(); syncHl(); setHlStyle(); });
      hc.checked = !!opts.hl;
      hc.addEventListener('change', () => { opts.hl = hc.checked; saveOpts(); syncHl(); if (!opts.hl && 'highlights' in CSS) clearHl(); });
      hw.append(hc, hread.wrap, hcol.wrap);
      grp.append(pp, sx, hw);
      d.querySelector('summary').appendChild(grp);
      setGroup(grp, 'idle');
      d.addEventListener('toggle', () => { if (!d.open && speaking && speaking.btn && d.contains(speaking.btn)) ttsStop(); });
    });
  }

  /* ---------- options panel ---------- */
  (() => {
    const btn = document.getElementById('optBtn'), panel = document.getElementById('optPanel'), themeBox = document.getElementById('optTheme'), vsel = document.getElementById('optVoice'), rate = document.getElementById('optRate'), rateVal = document.getElementById('optRateVal');
    const mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
    const applyTheme = () => { const dark = opts.theme === 'dark' || (opts.theme === 'system' && mq && mq.matches); document.documentElement.classList.toggle('dark', dark); themeBox.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === opts.theme)); };
    const fillVoices = () => {
      if (!('speechSynthesis' in window)) { vsel.innerHTML = '<option value="">No speech in this browser</option>'; vsel.disabled = true; return; }
      const vs = speechSynthesis.getVoices().slice().sort((a, b) => (/^en/i.test(b.lang) ? 1 : 0) - (/^en/i.test(a.lang) ? 1 : 0) || a.name.localeCompare(b.name));
      vsel.innerHTML = '<option value="">Automatic</option>' + vs.map(v => `<option value="${esc(v.name)}">${esc(v.name)} (${esc(v.lang)})</option>`).join('');
      vsel.value = vs.some(v => v.name === opts.voice) ? opts.voice : '';
    };
    const setOpen = open => { panel.hidden = !open; btn.setAttribute('aria-expanded', String(open)); if (open) fillVoices(); };
    btn.addEventListener('click', e => { e.stopPropagation(); setOpen(panel.hidden); });
    document.addEventListener('click', e => { if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { setOpen(false); btn.focus(); } });
    themeBox.addEventListener('click', e => { const v = e.target.dataset && e.target.dataset.v; if (v) { opts.theme = v; saveOpts(); applyTheme(); } });
    if (mq && mq.addEventListener) mq.addEventListener('change', () => { if (opts.theme === 'system') applyTheme(); });
    vsel.addEventListener('change', () => { opts.voice = vsel.value; saveOpts(); });
    const urlBox = document.getElementById('optUrl');
    urlBox.checked = opts.urlState !== false;
    urlBox.addEventListener('change', () => { opts.urlState = urlBox.checked; saveOpts(); urlState.write(); });
    setHlStyle();
    rate.value = opts.rate; rateVal.textContent = Number(opts.rate).toFixed(2) + '×';
    rate.addEventListener('input', () => { opts.rate = Number(rate.value); rateVal.textContent = opts.rate.toFixed(2) + '×'; saveOpts(); });
    document.getElementById('optTest').addEventListener('click', () => speakText('This is the voice you picked.', document.getElementById('optTest')));
    document.getElementById('optReset').addEventListener('click', () => { ttsStop(); Object.assign(opts, { theme: 'light', voice: '', rate: 0.95 }); saveOpts(); applyTheme(); fillVoices(); rate.value = opts.rate; rateVal.textContent = '0.95×'; });
    if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = fillVoices;
    applyTheme();
  })();

  /* ---------- one click handler for every page action; keyboard shortcuts (Alt+letter only, never Ctrl) ---------- */
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-sk]'); if (!a) return;
    const view = a.closest('.source-view');
    const act = {
      check: () => checkFields(view), reset: () => resetFields(view), show: () => showFields(view), next: () => nextStep(view), restart: () => restartSteps(view),
      'play-steps': () => playSteps(a, view), 'read-problem': () => readProblem(a), 'read-selection': () => readSelection(a), expand: () => setDetails(true), collapse: () => setDetails(false)
    }[a.dataset.sk];
    if (act) act();
  });
  document.addEventListener('mousedown', e => { if (e.target.closest('button.tts-btn')) e.preventDefault(); });
  document.addEventListener('keydown', e => {
    if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const k = e.key.toLowerCase();
    if (k === 'v') { e.preventDefault(); readSelection(); return; }
    const v = activeView(); if (!v) return;
    const f = { c: checkFields, k: checkFields, r: resetFields, s: showFields, n: nextStep }[k];
    if (f) { e.preventDefault(); f(v); }
  });
  window.addEventListener('beforeunload', () => { if ('speechSynthesis' in window) speechSynthesis.cancel(); });
  addListenButtons(document);
  /* Step-by-step box: the same audio group as the worked solutions (play/pause, stop, highlight, colours). */
  function stepsAudioGroup(view) {
    const grp = document.createElement('span'); grp.className = 'tts-group steps-audio'; grp.style.cssText = 'margin-left:.8rem;display:inline-flex;gap:.25rem;align-items:center;padding:.4rem .6rem;line-height:1;border:1px solid #888;border-radius:6px';
    const mk = (label, bg) => { const x = document.createElement('button'); x.type = 'button'; x.className = 'tts tts-btn'; x.dataset.ctl = label; x.title = label; x.setAttribute('aria-label', label); x.style.cssText = 'width:1.4rem;height:1.4rem;min-width:0;padding:0;margin:0 .1rem;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:.7rem;line-height:1;border:0;color:#fff;background:' + bg + ';transition:opacity .15s'; return x; };
    const pp = mk('Play steps', '#1e7e34'), sx = mk('Stop', '#b02a37');
    pp.dataset.ctl = 'playpause'; sx.dataset.ctl = 'stop';
    pp.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); if (togglePlay(grp)) return; playSteps(pp, view); });
    sx.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); ttsStop(); });
    sx.innerHTML = ICON.stop;
    const hw = document.createElement('span'); hw.className = 'tts-hl'; hw.style.cssText = 'display:inline-flex;align-items:center;gap:.25rem;margin-left:.2rem;font-size:.8rem;line-height:1';
    const hc = document.createElement('input'); hc.type = 'checkbox'; hc.className = 'tts-hl-on'; hc.title = 'Highlight what has been read'; hc.setAttribute('aria-label', 'Highlight what has been read'); hc.style.cssText = 'margin:0 !important;width:.8rem !important;min-width:0 !important;height:.8rem !important;flex:none';
    const hread = swatch('tts-hl-read', 'Colour for sentences already read', opts.hlReadColor, v => { opts.hlReadColor = v; saveOpts(); syncHl(); setHlStyle(); });
    const hcol = swatch('tts-hl-col', 'Highlight colour for the sentence being read', opts.hlColor, v => { opts.hlColor = v; saveOpts(); syncHl(); setHlStyle(); });
    hc.checked = !!opts.hl;
    hc.addEventListener('change', () => { opts.hl = hc.checked; saveOpts(); syncHl(); if (!opts.hl && 'highlights' in CSS) clearHl(); });
    hw.append(hc, hread.wrap, hcol.wrap);
    grp.append(pp, sx, hw);
    setGroup(grp, 'idle');
    return grp;
  }
  if ('speechSynthesis' in window) document.querySelectorAll('.sk-audio-slot').forEach(s => s.replaceWith(stepsAudioGroup(s.closest('.source-view'))));

  /* ---------- URL state: the open problem and its answer boxes, kept in the hash so a link reproduces the page.
     Format: #g=<group id>&p=<problem number in the group, from 1>&k=<steps shown, optional>&a=<JSON {field name: typed or chosen value}>.
     On by default; Options > "Save selections and answers in the URL" turns it off. Reading a link always works. ---------- */
  const urlState = {
    enabled() { return opts.urlState !== false; },
    hasState() { return /(^#|&)g=/.test(location.hash); },
    clear() { if (this.hasState()) history.replaceState(null, '', location.pathname + location.search); },
    write() {
      if (!this.enabled()) { this.clear(); return; }
      const v = activeView(); if (!v) return;
      const grp = v.closest('.group'), a = {};
      v.querySelectorAll('[data-answer]').forEach(f => { if (f.value !== '') a[f.dataset.f] = f.value; });
      const params = new URLSearchParams();
      params.set('g', grp.dataset.id);
      params.set('p', String([...grp.querySelectorAll('.source-view')].indexOf(v) + 1));
      if (v._i) params.set('k', String(v._i));
      if (Object.keys(a).length) params.set('a', JSON.stringify(a));
      history.replaceState(null, '', location.pathname + location.search + '#' + params.toString());
    },
    read() {
      const q = new URLSearchParams(location.hash.replace(/^#/, ''));
      const gid = q.get('g'), pn = Number(q.get('p'));
      if (!gid || !pn) return;
      const l1 = document.getElementById('l1'), groups = [...document.querySelectorAll('#l2host .group')], grp = groups.find(x => x.dataset.id === gid);
      if (!grp) { buildErrors.push(`link: no group "${gid}"`); return; }
      const pb = grp.querySelectorAll('.source-nav > button')[pn - 1], v = grp.querySelectorAll('.source-view')[pn - 1];
      if (!pb || !v) { buildErrors.push(`link: group "${gid}" has no problem ${pn}`); return; }
      l1.querySelectorAll('button')[groups.indexOf(grp)].click();
      pb.click();
      const k = Math.min(Number(q.get('k')) || 0, v._steps ? v._steps.length : 0);
      for (let i = 0; i < k; i++) nextStep(v, true);
      let a = {}; try { a = JSON.parse(q.get('a') || '{}'); } catch (e) { buildErrors.push('link: the answers part is not valid JSON'); }
      v.querySelectorAll('[data-answer]').forEach(f => { if (Object.prototype.hasOwnProperty.call(a, f.dataset.f)) { f.value = String(a[f.dataset.f]); f.classList.remove('correct', 'incorrect'); } });
    }
  };
  urlState.read();
  const later = () => setTimeout(() => urlState.write(), 0);
  document.addEventListener('input', e => { if (e.target.matches('[data-answer]') && e.target.closest('.source-view')) later(); });
  document.addEventListener('change', e => { if (e.target.matches('[data-answer]') && e.target.closest('.source-view')) later(); });
  document.addEventListener('click', e => { if (e.target.closest('#l1, .source-nav, .source-view')) later(); });

  /* ---------- verify: run every problem's steps, check every box, report ---------- */
  function verify() {
    const rows = problems.map(v => {
      v._steps.forEach(() => nextStep(v, true));
      const boxes = [...v.querySelectorAll('[data-answer]')];
      v.dataset.checked = 'false'; checkFields(v);
      const row = { group: v.closest('.group').dataset.id, problem: v.dataset.name, result: v.querySelector('.actions > .result').textContent,
        unfilled: boxes.filter(b => b.value === '' && !blankAllowed(b)).map(b => b.dataset.f), wrong: boxes.filter(b => b.classList.contains('incorrect')).map(b => b.dataset.f) };
      restartSteps(v); return row;
    });
    return { ok: !buildErrors.length && rows.every(r => !r.unfilled.length && !r.wrong.length), problems: rows.length, errors: buildErrors.slice(), failures: rows.filter(r => r.unfilled.length || r.wrong.length), rows };
  }
  if (buildErrors.length) console.error('study-kit: content errors\n' + buildErrors.join('\n'));
  window.StudyKit = { verify, nextStep, restartSteps, checkFields, resetFields, showFields, simulate, errors: buildErrors };
})();
