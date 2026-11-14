/* ==========================================================================
   TI-Nspire/nspire.js  -  a TI-Nspire CX II CAS-style calculator for study pages.
   An approximation of the handheld's look and workflow, NOT TI's software and not an exact emulator.

   Load it and mount it into any element:
       <script src="TI-Nspire/nspire.js"></script>
       TINspire.mount(document.getElementById('here'), { key: 'my-page-ns', title: 'Study' });
   It loads cas.js and nspire.css from its own folder, and uses TI-Nspire.jpg (same folder) as the device skin.
   If the photo is missing it draws a labelled keypad instead.

   What works: the keypad (click it, or type on a keyboard while the device has focus), ctrl and shift,
   a 320x240 screen with document page tabs (1.1, 1.2, ...), menu / doc / home, and pages for
   Calculator (exact CAS), Graphs (4 functions, trace, zoom, analyze), Table, and Tools.
   Not included: matrices, lists, complex numbers, programs, spreadsheets, geometry, statistics tools.
   ========================================================================== */
(function () {
  const script = document.currentScript;
  const BASE = script && script.src ? script.src.replace(/[^/?#]*([?#].*)?$/, '') : '';
  const loaded = {};
  const loadScript = src => loaded[src] || (loaded[src] = new Promise((ok, bad) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => bad(new Error('Cannot load ' + src)); document.head.appendChild(s); }));
  const loadCss = href => { if (!document.querySelector('link[data-nspire-css]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.setAttribute('data-nspire-css', ''); document.head.appendChild(l); } };

  const ready = () => window.NspireCAS ? Promise.resolve() : loadScript(BASE + 'cas.js');
  function mount(root, opts = {}) {
    loadCss(BASE + 'nspire.css');
    return ready().then(() => build(root, opts));
  }
  window.TINspire = { mount };

  /* ---------- keypad geometry, in pixels of the 800 x 1753 photo ---------- */
  const W0 = 800, H0 = 1753, KEYS = [];
  const key = (id, label, cx, cy, w = 62, h = 54, cls = '') => KEYS.push({ id, label, cx, cy, w, h, cls });
  key('esc', 'esc', 117, 694, 92, 52); key('home', 'home', 682, 698, 92, 52); key('save', 'save', 117, 793, 92, 56); key('doc', 'doc', 680, 793, 92, 56);
  key('tab', 'tab', 117, 890, 92, 56); key('menu', 'menu', 680, 887, 92, 56); key('pgPrev', '◀', 215, 787, 40, 40); key('pgNext', '▶', 583, 787, 40, 40);
  key('up', '▲', 400, 700, 70, 44); key('down', '▼', 400, 876, 70, 44); key('left', '◀', 275, 788, 44, 70); key('right', '▶', 525, 788, 44, 70); key('click', '●', 400, 788, 84, 84);
  key('ctrl', 'ctrl', 117, 1021, 92, 56, 'blue'); key('shift', 'shift', 279, 1020, 92, 56); key('var', 'var', 520, 1018, 92, 56); key('del', 'del', 682, 1018, 92, 56);
  key('eq', '=', 101, 1103); key('trig', 'trig', 170, 1098);
  [['n7', '7', 279, 1102], ['n8', '8', 399, 1102], ['n9', '9', 520, 1102], ['n4', '4', 279, 1190], ['n5', '5', 399, 1190], ['n6', '6', 520, 1190], ['n1', '1', 279, 1278], ['n2', '2', 399, 1278], ['n3', '3', 520, 1278], ['n0', '0', 279, 1365], ['dot', '.', 399, 1365], ['neg', '(−)', 520, 1365]]
    .forEach(([id, l, x, y]) => key(id, l, x, y, 92, 56, 'num'));
  key('tmpl', '▫', 627, 1102); key('cat', '📖', 682, 1102); key('pow', '^', 101, 1190); key('sq', 'x²', 170, 1190); key('mul', '×', 628, 1190); key('div', '÷', 696, 1190);
  key('ex', 'eˣ', 101, 1278); key('tenx', '10ˣ', 170, 1278); key('add', '+', 628, 1278); key('sub', '−', 696, 1278); key('lp', '(', 101, 1365); key('rp', ')', 170, 1365); key('enter', 'enter', 662, 1365, 130, 56);
  key('EE', 'EE', 101, 1465, 56, 44); key('qf', '?!', 698, 1465, 56, 44); key('pi', 'π', 101, 1529, 56, 44); key('flag', '⚑', 698, 1529, 56, 44); key('comma', ',', 101, 1593, 56, 44); key('nl', '↵', 698, 1593, 56, 44);
  'abcdefg'.split('').forEach((c, i) => key('L' + c, c.toUpperCase(), 182 + 72.5 * i, 1465, 58, 44)); 'hijklmn'.split('').forEach((c, i) => key('L' + c, c.toUpperCase(), 182 + 72.5 * i, 1529, 58, 44));
  'opqrstu'.split('').forEach((c, i) => key('L' + c, c.toUpperCase(), 182 + 72.5 * i, 1593, 58, 44)); 'vwxyz'.split('').forEach((c, i) => key('L' + c, c.toUpperCase(), 182 + 72.5 * i, 1658, 58, 44));
  key('space', 'space', 581, 1658, 112, 44);

  /* text typed by each key: [plain, ctrl] */
  const INS = { n0: ['0'], n1: ['1'], n2: ['2'], n3: ['3'], n4: ['4'], n5: ['5'], n6: ['6'], n7: ['7'], n8: ['8'], n9: ['9'], dot: ['.'], add: ['+'], sub: ['-'], mul: ['*'], div: ['/'], eq: ['='],
    pow: ['^', '^(1/'], sq: ['^2', 'sqrt('], ex: ['e^(', 'ln('], tenx: ['10^(', 'log('], lp: ['(', '['], rp: [')', '}'], neg: ['-', 'ans'], EE: ['E'], qf: ['!'], pi: ['π'], comma: [','], space: [' '], flag: ['<'] };
  const FUNCMENU = [['sin', 'sin('], ['cos', 'cos('], ['tan', 'tan('], ['sin⁻¹', 'asin('], ['cos⁻¹', 'acos('], ['tan⁻¹', 'atan('], ['sinh', 'sinh('], ['cosh', 'cosh('], ['tanh', 'tanh(']];

  function build(root, opts) {
    const { CAS: C, CASS } = window.NspireCAS, store = opts.key ? 'ns:' + opts.key : null;
    const colors = ['#1f4de6', '#e02020', '#18a02e', '#f08a00'];
    root.innerHTML = '';
    const dev = document.createElement('div'); dev.className = 'nsd'; dev.tabIndex = 0; dev.setAttribute('aria-label', 'TI-Nspire CX II CAS style calculator. Click the keys or type.');
    dev.innerHTML = '<div class="nsd-wrap"><div class="nsd-lcd"></div></div>';
    root.appendChild(dev);
    const wrap = dev.querySelector('.nsd-wrap'), lcd = dev.querySelector('.nsd-lcd');
    if (/[?&]nsdebug/.test(location.search)) dev.classList.add('debug');
    const img = new Image(), imgURL = (script && script.dataset.image) || BASE + 'TI-Nspire.jpg';
    img.onload = () => { dev.style.backgroundImage = `url("${imgURL}")`; }; img.onerror = () => dev.classList.add('noimg'); img.src = imgURL;
    KEYS.forEach(kd => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'nsd-key ' + kd.cls; b.dataset.k = kd.id; b.textContent = kd.label; b.title = kd.label;
      Object.assign(b.style, { left: ((kd.cx - kd.w / 2) / W0 * 100) + '%', top: ((kd.cy - kd.h / 2) / H0 * 100) + '%', width: (kd.w / W0 * 100) + '%', height: (kd.h / H0 * 100) + '%' });
      b.addEventListener('mousedown', e => e.preventDefault());   /* keep focus where it is */
      b.addEventListener('click', () => press(kd.id)); dev.appendChild(b);
    });
    let k = 1;
    const fit = () => { const w = wrap.clientWidth; if (!w) return; k = w / 320; lcd.style.transform = `scale(${k})`; dev.style.setProperty('--k', String(dev.clientWidth / W0 * 2.2)); if (S && cur() && cur().type === 'graph') drawGraph(); };
    new ResizeObserver(() => { if (!dev.isConnected) return; fit(); }).observe(dev);

    /* ---------- state ---------- */
    const S = { pages: [], cur: 0, ctrl: false, shift: false, menu: null, home: false, dlg: null, toast: '' };
    const mk = type => ({
      calc: () => ({ type: 'calc', hist: [], ent: '', c: 0, past: [], pi: 0 }),
      graph: () => ({ type: 'graph', fx: ['', '', '', ''], vis: [true, true, true, true], sel: 0, ent: '', c: 0, w: { x0: -10, x1: 10, y0: -7.1, y1: 7.1 }, marks: [], trace: null, focus: 'entry' }),
      table: () => ({ type: 'table', start: '-5', step: '1', rows: '15' }), tools: () => ({ type: 'tools' })
    })[type]();
    const cur = () => S.pages[S.cur];
    const TYPES = [['calc', 'Calculator'], ['graph', 'Graphs'], ['table', 'Table'], ['tools', 'Tools']];
    function save() {
      if (!store) return; try { localStorage.setItem(store, JSON.stringify({ cur: S.cur, deg: C.st.deg, pages: S.pages.map(p => p.type === 'graph' ? { type: 'graph', fx: p.fx, vis: p.vis, w: p.w, sel: p.sel } : p.type === 'table' ? { type: 'table', start: p.start, step: p.step, rows: p.rows } : { type: p.type }) })); } catch (e) {}
    }
    try { const sv = store && JSON.parse(localStorage.getItem(store)); if (sv && sv.pages && sv.pages.length) { S.pages = sv.pages.map(p => Object.assign(mk(p.type), p)); S.cur = Math.min(sv.cur || 0, S.pages.length - 1); C.st.deg = !!sv.deg; } } catch (e) {}
    if (!S.pages.length) { S.pages.push(mk('calc'), mk('graph')); S.cur = 0; }

    /* ---------- entry line helpers ---------- */
    const hasEntry = p => p && (p.type === 'calc' || p.type === 'graph');
    function ins(t) {
      const a = document.activeElement;
      if (a && lcd.contains(a) && /INPUT|TEXTAREA/.test(a.tagName)) { const s = a.selectionStart ?? a.value.length, e = a.selectionEnd ?? s; a.value = a.value.slice(0, s) + t + a.value.slice(e); a.setSelectionRange(s + t.length, s + t.length); a.dispatchEvent(new Event('input', { bubbles: true })); return; }
      const p = cur(); if (!hasEntry(p) || S.home) return; if (p.type === 'graph' && p.focus !== 'entry') p.focus = 'entry';
      p.ent = p.ent.slice(0, p.c) + t + p.ent.slice(p.c); p.c += t.length; renderEntry();
    }
    function backspace() {
      const a = document.activeElement; if (a && lcd.contains(a) && /INPUT|TEXTAREA/.test(a.tagName)) { const s = a.selectionStart, e = a.selectionEnd; if (s !== e) a.setRangeText('', s, e, 'end'); else if (s > 0) a.setRangeText('', s - 1, s, 'end'); a.dispatchEvent(new Event('input', { bubbles: true })); return; }
      const p = cur(); if (!hasEntry(p) || !p.c) return; p.ent = p.ent.slice(0, p.c - 1) + p.ent.slice(p.c); p.c--; renderEntry();
    }

    /* ---------- rendering ---------- */
    const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
    function render() {
      const p = cur(), tabs = S.pages.map((_, i) => `<span class="tab${i === S.cur && !S.home ? ' on' : ''}" data-pg="${i}">1.${i + 1}</span>`).join('');
      lcd.innerHTML = `<div class="tb"><span class="arr" data-act="prev">◀</span>${tabs}<span class="arr" data-act="next">▶</span><span class="doc">*${esc(opts.title || 'Doc')}</span><span class="rad">${C.st.deg ? 'DEG' : 'RAD'}</span><span class="bat"></span><span class="x" data-act="closepage">✕</span></div><div class="tbl"></div><div class="pg"></div>`;
      const pg = lcd.querySelector('.pg');
      if (S.home) renderHome(pg); else if (p.type === 'calc') renderCalc(pg, p); else if (p.type === 'graph') renderGraph(pg, p); else if (p.type === 'table') renderTable(pg, p); else renderTools(pg);
      renderMenu(); renderDlg(); renderStrip(); fit();
      if (p && p.type === 'graph' && !S.home) drawGraph();
    }
    function renderStrip(msg) {
      const el = lcd.querySelector('.strip'); if (!el) return; const p = cur();
      const mods = (S.ctrl ? '<b>ctrl</b> ' : '') + (S.shift ? '<b>shift</b> ' : '');
      el.innerHTML = `<span>${msg !== undefined ? msg : mods || (p.type === 'graph' ? (p.focus === 'entry' ? 'tab: graph focus' : 'arrows pan · click: trace · +/−: zoom') : p.type === 'calc' ? 'menu: commands' : '')}</span><span>${p.type === 'graph' && p.trace ? '' : ''}</span>`;
      dev.querySelector('[data-k=ctrl]').classList.toggle('on', S.ctrl); dev.querySelector('[data-k=shift]').classList.toggle('on', S.shift);
    }
    function entHtml(p, pre) { const a = esc(p.ent.slice(0, p.c)), b = esc(p.ent.slice(p.c)); return `<span class="pre">${pre}</span>${a}<span class="caret"></span>${b}`; }
    function renderEntry() {
      const el = lcd.querySelector('.ent'); const p = cur(); if (!el || !hasEntry(p)) return;
      el.innerHTML = entHtml(p, p.type === 'graph' ? `f${p.sel + 1}(x)=` : '▸'); el.classList.toggle('nofocus', p.type === 'graph' && p.focus !== 'entry');
      const sc = el.scrollWidth - el.clientWidth; el.scrollLeft = sc > 0 ? sc : 0;
    }

    /* Calculator page */
    function renderCalc(pg, p) {
      pg.innerHTML = '<div class="hist"></div><div class="ent"></div><div class="strip"></div>'; const h = pg.querySelector('.hist');
      p.hist.forEach(it => { const d = document.createElement('div'); d.innerHTML = `<div class="e">${esc(it.src)}</div>` + (it.err ? `<div class="r err">${esc(it.err)}</div>` : it.lines.map(l => `<div class="r">${esc(l.text)}</div>${l.approx ? `<div class="a">≈ ${esc(l.approx)}</div>` : ''}`).join('') + (it.note ? `<div class="a">${esc(it.note)}</div>` : '')); h.appendChild(d); });
      h.scrollTop = h.scrollHeight; renderEntry();
    }
    function submitCalc(approx) {
      const p = cur(); let src = p.ent.trim(); if (!src) return; p.past.push(src); p.pi = p.past.length;
      try { p.hist.push({ src, ...CASS.run(approx ? `approx(${src})` : src) }); } catch (e) { p.hist.push({ src, err: e.message || String(e) }); }
      p.ent = ''; p.c = 0; render(); save();
    }

    /* Graph page */
    let gcv = null;
    function renderGraph(pg, p) {
      pg.innerHTML = '<canvas></canvas><div class="ent"></div><div class="strip"></div>'; gcv = pg.querySelector('canvas'); renderEntry();
      gcv.addEventListener('pointerdown', e => { gcv.setPointerCapture(e.pointerId); p.drag = { ...gcoord(e), w: { ...p.w } }; });
      gcv.addEventListener('pointermove', e => {
        const c = gcoord(e); if (p.drag) { const dx = (c.px - p.drag.px) / c.W * (p.drag.w.x1 - p.drag.w.x0), dy = (c.py - p.drag.py) / c.H * (p.drag.w.y1 - p.drag.w.y0); p.w = { x0: p.drag.w.x0 - dx, x1: p.drag.w.x1 - dx, y0: p.drag.w.y0 + dy, y1: p.drag.w.y1 + dy }; }
        const a = activeFx(p)[0]; if (a) { const y = a.comp.f(c.x); p.trace = Number.isFinite(y) ? { x: c.x, i: a.i } : null; renderStrip(Number.isFinite(y) ? `f${a.i + 1}: x=${nf(c.x)}  y=${nf(y)}` : `x=${nf(c.x)}`); } drawGraph();
      });
      ['pointerup', 'pointercancel'].forEach(t => gcv.addEventListener(t, () => { if (p.drag) { p.drag = null; save(); } }));
      gcv.addEventListener('pointerleave', () => { if (!p.traceKey) { p.trace = null; drawGraph(); } });
      gcv.addEventListener('wheel', e => { e.preventDefault(); const c = gcoord(e); zoomBy(e.deltaY < 0 ? 0.8 : 1.25, c.x, c.y); }, { passive: false });
    }
    const nf = v => Math.abs(v) < 1e-12 ? '0' : String(Number(v.toPrecision(6)));
    function gcoord(e) { const p = cur(), r = gcv.getBoundingClientRect(); return { px: e.clientX - r.left, py: e.clientY - r.top, x: p.w.x0 + (e.clientX - r.left) / r.width * (p.w.x1 - p.w.x0), y: p.w.y1 - (e.clientY - r.top) / r.height * (p.w.y1 - p.w.y0), W: r.width, H: r.height }; }
    function compileFx(p) {
      return p.fx.map((t, i) => {
        t = t.trim().replace(/^\s*y\s*=\s*/i, ''); if (!t || !p.vis[i]) return null;
        try { const node = C.simp(CASS.sub(C.parse(t))); if ([...C.freeVars(node)].some(v => v !== 'x')) return null; return { node, f: C.compile(node, 'x') }; } catch (e) { return null; }
      });
    }
    const activeFx = p => compileFx(p).map((comp, i) => ({ i, comp })).filter(o => o.comp);
    const niceStep = r => { const q = Math.pow(10, Math.floor(Math.log10(r / 5))), m = r / 5 / q; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * q; };
    function drawGraph() {
      const p = cur(); if (!gcv || !p || p.type !== 'graph' || S.home) return;
      const W = 320, H = 169, dpr = window.devicePixelRatio || 1, sc = k * dpr;
      if (gcv.width !== Math.round(W * sc) || gcv.height !== Math.round(H * sc)) { gcv.width = Math.round(W * sc); gcv.height = Math.round(H * sc); }
      const ctx = gcv.getContext('2d'), { x0, x1, y0, y1 } = p.w; ctx.setTransform(sc, 0, 0, sc, 0, 0); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      const X = x => (x - x0) / (x1 - x0) * W, Y = y => H - (y - y0) / (y1 - y0) * H, ix = x => x0 + x / W * (x1 - x0), sx = niceStep(x1 - x0), sy = niceStep(y1 - y0);
      ctx.lineWidth = 0.6; ctx.font = '8px Arial'; ctx.fillStyle = '#556';
      for (let v = Math.ceil(x0 / sx) * sx; v <= x1; v += sx) { const px = X(v); ctx.strokeStyle = '#d9dfe5'; ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke(); if (Math.abs(v) > sx / 2) ctx.fillText(nf(v), px + 1, Math.min(H - 2, Math.max(9, Y(0) + 9))); }
      for (let v = Math.ceil(y0 / sy) * sy; v <= y1; v += sy) { const py = Y(v); ctx.strokeStyle = '#d9dfe5'; ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke(); if (Math.abs(v) > sy / 2) ctx.fillText(nf(v), Math.min(W - 22, Math.max(1, X(0) + 2)), py - 1); }
      ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.beginPath(); if (y0 < 0 && y1 > 0) { ctx.moveTo(0, Y(0)); ctx.lineTo(W, Y(0)); } if (x0 < 0 && x1 > 0) { ctx.moveTo(X(0), 0); ctx.lineTo(X(0), H); } ctx.stroke();
      activeFx(p).forEach(({ i, comp }) => {
        ctx.strokeStyle = colors[i]; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.beginPath(); let pen = false, prev = 0;
        for (let px = 0; px <= W; px += 0.5) { const y = comp.f(ix(px)); if (!Number.isFinite(y)) { pen = false; continue; } const py = Math.max(-1e5, Math.min(1e5, Y(y))); if (pen && Math.abs(py - prev) > H * 1.5) pen = false; if (!pen) { ctx.moveTo(px, py); pen = true; } else ctx.lineTo(px, py); prev = py; }
        ctx.stroke();
      });
      ctx.font = '9px Arial'; p.marks.forEach(m => { ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(X(m.x), Y(m.y), 2.6, 0, 7); ctx.fill(); ctx.fillText(m.label, X(m.x) + 4, Y(m.y) - 4); });
      if (p.trace) { const comp = compileFx(p)[p.trace.i]; if (comp) { const y = comp.f(p.trace.x); if (Number.isFinite(y)) { ctx.strokeStyle = colors[p.trace.i]; ctx.fillStyle = '#fff'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(X(p.trace.x), Y(y), 3.4, 0, 7); ctx.fill(); ctx.stroke(); } } }
    }
    function setWin(w) { const p = cur(); p.w = w; p.marks = []; drawGraph(); save(); }
    function zoomBy(f, cx, cy) { const p = cur(), { x0, x1, y0, y1 } = p.w; cx = cx ?? (x0 + x1) / 2; cy = cy ?? (y0 + y1) / 2; setWin({ x0: cx - (cx - x0) * f, x1: cx + (x1 - cx) * f, y0: cy - (cy - y0) * f, y1: cy + (y1 - cy) * f }); }
    const gAspect = () => 169 / 320;
    function zoomStd() { const h = 10 * gAspect(); setWin({ x0: -10, x1: 10, y0: -h, y1: h }); }
    function zoomSquare() { const p = cur(), { x0, x1, y0, y1 } = p.w, cy = (y0 + y1) / 2, h = (x1 - x0) * gAspect() / 2; setWin({ x0, x1, y0: cy - h, y1: cy + h }); }
    function zoomFit() { const p = cur(), ys = []; activeFx(p).forEach(({ comp }) => { for (let q = 0; q <= 400; q++) { const y = comp.f(p.w.x0 + q / 400 * (p.w.x1 - p.w.x0)); if (Number.isFinite(y)) ys.push(y); } }); if (ys.length < 2) return; ys.sort((a, b) => a - b); const lo = ys[Math.floor(ys.length * 0.02)], hi = ys[Math.ceil(ys.length * 0.98) - 1], pad = (hi - lo || 1) * 0.1; setWin({ ...p.w, y0: lo - pad, y1: hi + pad }); }
    function commitFx() { const p = cur(); p.fx[p.sel] = p.ent; save(); drawGraph(); }
    function loadFx() { const p = cur(); p.ent = p.fx[p.sel]; p.c = p.ent.length; renderEntry(); }
    function analyze(kind) {
      const p = cur(), act = activeFx(p); if (!act.length) return toast('Enter a function first.');
      const lo = p.w.x0, hi = p.w.x1, o = act.find(a => a.i === p.sel) || act[0], f = o.comp.f, out = [];
      if (kind === 'zero') { const r = C.numericRoots(f, lo, hi); p.marks = r.map(x => ({ x, y: 0, label: nf(x) })); toast(r.length ? r.map(x => `zero: x = ${nf(x)}`).join('\n') : 'No zero in view.'); }
      else if (kind === 'min' || kind === 'max') {
        const sg = kind === 'min' ? 1 : -1; let bx = lo, bv = Infinity; for (let i = 0; i <= 8000; i++) { const x = lo + i / 8000 * (hi - lo), v = sg * f(x); if (v < bv) { bv = v; bx = x; } }
        let l = Math.max(lo, bx - (hi - lo) / 8000), r = Math.min(hi, bx + (hi - lo) / 8000); for (let i = 0; i < 80; i++) { const m1 = l + (r - l) / 3, m2 = r - (r - l) / 3; if (sg * f(m1) < sg * f(m2)) r = m2; else l = m1; }
        bx = (l + r) / 2; p.marks = [{ x: bx, y: f(bx), label: `${kind} ${nf(bx)}, ${nf(f(bx))}` }]; toast(`${kind === 'min' ? 'Minimum' : 'Maximum'}: x = ${nf(bx)}, y = ${nf(f(bx))}`);
      } else if (kind === 'deriv') { const x = p.trace ? p.trace.x : (lo + hi) / 2; let t = `f${o.i + 1}'(${nf(x)}) ≈ ${nf((f(x + 1e-6) - f(x - 1e-6)) / 2e-6)}`; try { t += `\nf${o.i + 1}'(x) = ${C.show(C.simp(C.diff(o.comp.node, 'x')))}`; } catch (e) {} p.marks = [{ x, y: f(x), label: 'x=' + nf(x) }]; toast(t); }
      else if (kind === 'int') { let t = `∫ over view ≈ ${nf(C.nsimpson(f, lo, hi))}`; try { const F = C.integrate(o.comp.node, 'x'); if (F) t += `\nantiderivative: ${C.show(F)}`; } catch (e) {} p.marks = []; toast(t); }
      else if (kind === 'isect') { const a = act.find(z => z.i === 0), b = act.find(z => z.i === 1); if (!a || !b) return toast('Needs f1 and f2.'); const r = C.numericRoots(x => a.comp.f(x) - b.comp.f(x), lo, hi); p.marks = r.map(x => ({ x, y: a.comp.f(x), label: `${nf(x)}, ${nf(a.comp.f(x))}` })); toast(r.length ? r.map(x => `x = ${nf(x)}, y = ${nf(a.comp.f(x))}`).join('\n') : 'No intersection in view.'); }
      else if (kind === 'clear') { p.marks = []; toast(''); }
      drawGraph();
    }
    function toast(t) { S.toast = t; lcd.querySelectorAll('.toast').forEach(e => e.remove()); if (t) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; lcd.appendChild(d); } }

    /* Table page */
    function renderTable(pg, p) {
      pg.innerHTML = `<div class="tab-wrap"><div style="display:flex;gap:6px;align-items:center">x start <input id="nsTs" size="5" value="${esc(p.start)}"> step <input id="nsTd" size="4" value="${esc(p.step)}"> rows <input id="nsTn" size="3" value="${esc(p.rows)}"></div><div id="nsTb"></div></div><div class="strip"></div>`;
      const upd = () => { p.start = pg.querySelector('#nsTs').value; p.step = pg.querySelector('#nsTd').value; p.rows = pg.querySelector('#nsTn').value; tableBody(pg.querySelector('#nsTb'), p); save(); };
      pg.querySelectorAll('input').forEach(i => i.addEventListener('input', upd)); tableBody(pg.querySelector('#nsTb'), p);
    }
    function tableBody(el, p) {
      const g = S.pages.find(q => q.type === 'graph'), a = g ? activeFx(g) : [], s = parseFloat(p.start), d = parseFloat(p.step), n = Math.max(1, Math.min(200, parseInt(p.rows) || 15));
      if (!g) { el.textContent = 'Add a Graphs page (doc > Insert) and enter functions.'; return; } if (!a.length) { el.textContent = 'Enter a function on the Graphs page first.'; return; } if (!Number.isFinite(s) || !Number.isFinite(d)) { el.textContent = 'Enter a start and a step.'; return; }
      let h = '<table class="nst"><thead><tr><th>x</th>' + a.map(({ i }) => `<th style="color:${colors[i]}">f${i + 1}</th>`).join('') + '</tr></thead><tbody>';
      for (let r = 0; r < n; r++) { const x = Number((s + r * d).toPrecision(12)); h += `<tr><td>${nf(x)}</td>${a.map(({ comp }) => { const y = comp.f(x); return `<td>${Number.isFinite(y) ? nf(y) : 'undef'}</td>`; }).join('')}</tr>`; }
      el.innerHTML = h + '</tbody></table>';
    }

    /* Tools page: units, drawing scale, inch fractions, right triangle */
    function renderTools(pg) {
      const LEN = { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 }, ANG = { deg: 1, rad: 180 / Math.PI, grad: 0.9 };
      const opt = t => Object.keys(t).map(u => `<option>${u}</option>`).join(''), pin = (id, l, v = '', ph = '') => `<label class="pl">${l}<input id="${id}" value="${v}" placeholder="${ph}"></label>`, f = x => Number.isFinite(x) ? String(Number(x.toPrecision(10))) : 'n/a';
      pg.innerHTML = `<div class="tools"><div class="ph">Convert</div><div class="pgrid">${pin('uV', 'Value', '1')}<label class="pl">From<select id="uF">${opt({ ...LEN, ...ANG })}</select></label><label class="pl">To<select id="uT">${opt({ ...LEN, ...ANG })}</select></label></div><button id="uGo">Convert</button><div class="pout" id="uOut"></div>
        <div class="ph">Drawing scale 1 : N</div><div class="pgrid">${pin('sN', 'N', '50')}${pin('sR', 'Real (mm)')}${pin('sD', 'Paper (mm)')}</div><button id="sA">Real → paper</button><button id="sB">Paper → real</button><div class="pout" id="sOut"></div>
        <div class="ph">Inches: fraction ⇄ decimal</div><div class="pgrid">${pin('fI', 'Value', '', '3 7/16')}<label class="pl">Nearest 1/<select id="fD"><option>8</option><option>16</option><option selected>32</option><option>64</option></select></label></div><button id="fGo">Convert</button><div class="pout" id="fOut"></div>
        <div class="ph">Right triangle (A opposite a)</div><div class="pgrid">${pin('rA', 'side a')}${pin('rB', 'side b')}${pin('rC', 'hypotenuse c')}${pin('rG', 'angle A (deg)')}</div><button id="rGo">Solve</button><div class="pout" id="rOut"></div></div><div class="strip"></div>`;
      const $ = s => pg.querySelector(s), v = id => parseFloat($(id).value);
      $('#uGo').onclick = () => { const a = $('#uF').value, b = $('#uT').value, x = v('#uV'); $('#uOut').textContent = a in LEN && b in LEN ? f(x * LEN[a] / LEN[b]) + ' ' + b : a in ANG && b in ANG ? f(x * ANG[a] / ANG[b]) + ' ' + b : 'Pick two lengths or two angles.'; };
      $('#sA').onclick = () => { $('#sOut').textContent = `Paper: ${f(v('#sR') / v('#sN'))} mm`; }; $('#sB').onclick = () => { $('#sOut').textContent = `Real: ${f(v('#sD') * v('#sN'))} mm`; };
      $('#fGo').onclick = () => {
        const t = $('#fI').value.trim(), den = Number($('#fD').value);
        const toFrac = x => { const neg = x < 0, a = Math.abs(x); let w = Math.floor(a), n = Math.round((a - w) * den); if (n === den) { w++; n = 0; } let d = den; while (n && n % 2 === 0) { n /= 2; d /= 2; } return (neg ? '-' : '') + (n ? (w ? w + ' ' : '') + n + '/' + d : String(w)); };
        if (/^-?\d*\.?\d+$/.test(t)) $('#fOut').textContent = `${t} in = ${toFrac(parseFloat(t))} in`;
        else { const m = t.match(/^(-?\d+)?\s*(?:(\d+)\s*\/\s*(\d+))?$/); $('#fOut').textContent = m && (m[1] || m[2]) ? `${t} in = ${f((m[1] ? Number(m[1]) : 0) + (m[1] && m[1].startsWith('-') ? -1 : 1) * (m[2] ? m[2] / m[3] : 0))} in` : 'Type 3 7/16, 7/16 or 3.4375'; }
      };
      $('#rGo').onclick = () => {
        let a = v('#rA'), b = v('#rB'), c = v('#rC'); const A = v('#rG'), has = Number.isFinite, r = x => x * Math.PI / 180, d = x => x * 180 / Math.PI; let ok = true;
        if (has(a) && has(b)) c = Math.hypot(a, b); else if (has(a) && has(c)) b = Math.sqrt(c * c - a * a); else if (has(b) && has(c)) a = Math.sqrt(c * c - b * b);
        else if (has(A) && has(a)) { b = a / Math.tan(r(A)); c = a / Math.sin(r(A)); } else if (has(A) && has(b)) { a = b * Math.tan(r(A)); c = b / Math.cos(r(A)); } else if (has(A) && has(c)) { a = c * Math.sin(r(A)); b = c * Math.cos(r(A)); } else ok = false;
        $('#rOut').textContent = ok ? `a ${f(a)}  b ${f(b)}  c ${f(c)}\nA ${f(d(Math.atan2(a, b)))}°  B ${f(d(Math.atan2(b, a)))}°` : 'Give two sides, or one side and angle A.';
      };
    }

    /* Home screen */
    let homeSel = 0;
    function renderHome(pg) {
      pg.innerHTML = `<div class="home"><div class="hh">Add a page to this document</div>${TYPES.map(([t, l], i) => `<div class="ic${i === homeSel ? ' sel' : ''}" data-add="${t}">${i + 1}  ${l}</div>`).join('')}</div>`;
    }
    function addPage(type) { S.pages.splice(S.cur + 1, 0, mk(type)); S.cur++; S.home = false; S.menu = null; toast(''); render(); save(); }

    /* ---------- menus ---------- */
    const I = (l, t) => ({ l, ins: t });
    function pageMenu() {
      const p = cur();
      if (p.type === 'graph') return { t: 'Graphs', items: [
        { l: 'View', sub: [{ l: 'Window settings…', act: () => openWindow() }, { l: 'Zoom - Standard', act: zoomStd }, { l: 'Zoom - In', act: () => zoomBy(0.5) }, { l: 'Zoom - Out', act: () => zoomBy(2) }, { l: 'Zoom - Square', act: zoomSquare }, { l: 'Zoom - Fit', act: zoomFit }] },
        { l: 'Trace', sub: [{ l: 'Graph Trace (on/off)', act: () => { p.focus = 'graph'; p.traceKey = !p.traceKey; if (p.traceKey) { const a = activeFx(p)[0]; p.trace = a ? { x: (p.w.x0 + p.w.x1) / 2, i: a.i } : null; } else p.trace = null; drawGraph(); renderStrip(); } }] },
        { l: 'Analyze Graph', sub: [{ l: 'Zero', act: () => analyze('zero') }, { l: 'Minimum', act: () => analyze('min') }, { l: 'Maximum', act: () => analyze('max') }, { l: 'Intersection (f1, f2)', act: () => analyze('isect') }, { l: 'dy/dx', act: () => analyze('deriv') }, { l: '∫ (integral over view)', act: () => analyze('int') }, { l: 'Clear marks', act: () => analyze('clear') }] },
        { l: 'Functions', sub: [0, 1, 2, 3].map(i => ({ l: `Edit f${i + 1}(x)`, act: () => { p.sel = i; p.focus = 'entry'; loadFx(); renderStrip(); } })).concat([{ l: 'Show/hide current', act: () => { p.vis[p.sel] = !p.vis[p.sel]; drawGraph(); save(); } }]) },
        settingsItem()] };
      if (p.type === 'calc') return { t: 'Calculator', items: [
        { l: 'Number', sub: [I('Approximate to decimal', 'approx('), I('Factorial !', '!'), I('Absolute value', 'abs('), I('Floor', 'floor('), I('Ceiling', 'ceil('), I('Round', 'round('), I('gcd', 'gcd('), I('lcm', 'lcm('), I('Remainder (mod)', 'mod('), I('Combinations nCr', 'nCr('), I('Permutations nPr', 'nPr(')] },
        { l: 'Algebra', sub: [I('Solve', 'solve('), I('Factor', 'factor('), I('Expand', 'expand('), I('Simplify', 'simplify(')] },
        { l: 'Calculus', sub: [I('Derivative', 'diff('), I('Integral', 'integrate('), I('Limit', 'limit('), I('Sum Σ', 'sum('), I('Product Π', 'product(')] },
        { l: 'Define / store', sub: [I('Define  :=', ':='), I('Store  →', '→'), { l: 'Clear all variables', act: () => { CASS.reset(); toast('Variables cleared'); } }] }, settingsItem()] };
      return { t: p.type === 'table' ? 'Table' : 'Tools', items: [settingsItem()] };
    }
    const settingsItem = () => ({ l: 'Settings', sub: [{ l: 'Radian', act: () => { C.st.deg = false; render(); save(); } }, { l: 'Degree', act: () => { C.st.deg = true; render(); save(); } }] });
    function docMenu() { return { t: 'Document', items: [{ l: 'Insert', sub: TYPES.map(([t, l]) => ({ l, act: () => addPage(t) })) }, { l: 'Delete this page', act: closePage }, { l: 'New document', act: () => { S.pages = [mk('calc'), mk('graph')]; S.cur = 0; render(); save(); } }] }; }
    function varMenu() { const names = [...CASS.vars.keys()]; return { t: 'Variables', items: [I('ans', 'ans'), ...names.map(n => I(n, n)), ...[...C.userFuncs.keys()].map(n => I(n + '( )', n + '('))] }; }
    function tmplMenu() { return { t: 'Templates', items: [I('Fraction  (a)/(b)', '()/()'), I('Square root', 'sqrt('), I('Power  ^', '^('), I('Absolute value', 'abs('), I('Derivative', 'diff('), I('Integral', 'integrate('), I('Sum', 'sum('), I('Limit', 'limit('), I('Piece e^( )', 'e^(')] }; }
    function catMenu() { return { t: 'Catalog', items: [...C.FUNCS].sort().map(n => I(n, n + '(')) }; }
    function openMenu(m) { S.menu = { stack: [], title: m.t, items: m.items, idx: 0 }; toast(''); renderMenu(); }
    function renderMenu() {
      lcd.querySelectorAll('.menu').forEach(e => e.remove()); const m = S.menu; if (!m) return;
      const d = document.createElement('div'); d.className = 'menu'; d.innerHTML = `<div class="mt">${esc(m.title)}</div>` + m.items.map((it, i) => `<div class="mi${i === m.idx ? ' sel' : ''}" data-mi="${i}"><i>${i < 9 ? i + 1 : ''}</i>${esc(it.l)}${it.sub ? ' ▸' : ''}</div>`).join(''); lcd.appendChild(d);
      const sel = d.querySelector('.sel'); if (sel) sel.scrollIntoView({ block: 'nearest' });
    }
    function menuPick(i) {
      const m = S.menu, it = m.items[i]; if (!it) return;
      if (it.sub) { m.stack.push({ title: m.title, items: m.items, idx: i }); m.title = it.l; m.items = it.sub; m.idx = 0; renderMenu(); return; }
      S.menu = null; renderMenu(); if (it.act) it.act(); else if (it.ins) ins(it.ins);
    }
    function menuBack() { const m = S.menu; if (m.stack.length) { const b = m.stack.pop(); m.title = b.title; m.items = b.items; m.idx = b.idx; renderMenu(); } else { S.menu = null; renderMenu(); } }
    function openWindow() {
      const p = cur(); S.dlg = { w: { ...p.w } }; renderDlg(); const f = lcd.querySelector('.dlg input'); if (f) f.focus();
    }
    function renderDlg() {
      lcd.querySelectorAll('.dlg').forEach(e => e.remove()); if (!S.dlg) return; const d = document.createElement('div'); d.className = 'dlg';
      d.innerHTML = '<h4>Window settings</h4>' + [['x0', 'XMin'], ['x1', 'XMax'], ['y0', 'YMin'], ['y1', 'YMax']].map(([kk, l]) => `<label><span>${l}</span><input data-w="${kk}" value="${nf(S.dlg.w[kk])}"></label>`).join('') + '<div style="margin-top:4px;color:#556">enter = OK · esc = cancel</div>'; lcd.appendChild(d);
    }
    function applyWindow() { const w = {}; lcd.querySelectorAll('[data-w]').forEach(i => w[i.dataset.w] = parseFloat(i.value)); S.dlg = null; renderDlg(); if (Object.values(w).every(Number.isFinite) && w.x1 > w.x0 && w.y1 > w.y0) setWin(w); }
    function closePage() { if (S.pages.length <= 1) return; S.pages.splice(S.cur, 1); S.cur = Math.min(S.cur, S.pages.length - 1); S.menu = null; render(); save(); }
    function goPage(i) { S.cur = (i + S.pages.length) % S.pages.length; S.home = false; S.menu = null; S.dlg = null; toast(''); render(); save(); }

    /* ---------- key handling ---------- */
    function press(id) {
      dev.focus({ preventScroll: true });
      const mod = { ctrl: S.ctrl, shift: S.shift }, p = cur();
      if (id === 'ctrl') { S.ctrl = !S.ctrl; S.shift = false; return renderStrip(); } if (id === 'shift') { S.shift = !S.shift; S.ctrl = false; return renderStrip(); }
      S.ctrl = false; S.shift = false; renderStrip();
      if (S.dlg) { if (id === 'enter' || id === 'click') return applyWindow(); if (id === 'esc') { S.dlg = null; return renderDlg(); } if (id === 'del') return backspace(); if (INS[id]) return ins(INS[id][0]); if (id[0] === 'L') return ins(id[1]); return; }
      if (S.menu) {
        const m = S.menu; if (id === 'up') { m.idx = (m.idx + m.items.length - 1) % m.items.length; return renderMenu(); } if (id === 'down') { m.idx = (m.idx + 1) % m.items.length; return renderMenu(); }
        if (id === 'left' || id === 'esc') return menuBack(); if (id === 'right' || id === 'enter' || id === 'click') return menuPick(m.idx);
        if (/^n[1-9]$/.test(id)) return menuPick(Number(id[1]) - 1); return;
      }
      if (S.home) {
        if (id === 'left' || id === 'up') { homeSel = (homeSel + 3) % 4; return render(); } if (id === 'right' || id === 'down') { homeSel = (homeSel + 1) % 4; return render(); }
        if (id === 'enter' || id === 'click') return addPage(TYPES[homeSel][0]); if (/^n[1-4]$/.test(id)) return addPage(TYPES[Number(id[1]) - 1][0]); if (id === 'esc' || id === 'home') { S.home = false; return render(); } return;
      }
      if (S.toast && (id === 'esc')) { toast(''); return; }
      switch (id) {
        case 'home': S.home = true; S.menu = null; toast(''); return render();
        case 'menu': return openMenu(pageMenu()); case 'doc': return openMenu(docMenu()); case 'save': toast('Document saved in this browser'); return save();
        case 'esc': toast(''); if (p.type === 'graph') { p.traceKey = false; p.trace = null; p.focus = 'entry'; drawGraph(); renderEntry(); renderStrip(); } return;
        case 'pgPrev': return goPage(S.cur - 1); case 'pgNext': return goPage(S.cur + 1);
        case 'tab': if (p.type === 'graph') { p.focus = p.focus === 'entry' ? 'graph' : 'entry'; renderEntry(); renderStrip(); } return;
        case 'trig': return openMenu({ t: 'Trig', items: FUNCMENU.map(([l, t]) => I(l, t)) });
        case 'var': if (mod.ctrl) return ins('→'); return openMenu(varMenu());
        case 'tmpl': if (mod.ctrl) return ins(':='); return openMenu(tmplMenu()); case 'cat': return openMenu(catMenu());
        case 'del': if (mod.ctrl) { if (hasEntry(p) && p.ent) { p.ent = ''; p.c = 0; renderEntry(); } else if (p.type === 'calc') { p.hist = []; render(); } return; } return backspace();
        case 'enter': { const a = document.activeElement; if (a && lcd.contains(a) && a.tagName === 'INPUT') { if (S.dlg) return applyWindow(); a.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); return; } if (p.type === 'calc') return submitCalc(mod.ctrl); if (p.type === 'graph') { if (p.focus === 'entry') { commitFx(); } return; } return; }
        case 'click': if (p.type === 'calc') return submitCalc(false); if (p.type === 'graph') { if (p.focus === 'entry') return commitFx(); p.traceKey = !p.traceKey; if (p.traceKey) { const a = activeFx(p)[0]; p.trace = a ? { x: (p.w.x0 + p.w.x1) / 2, i: a.i } : null; } else p.trace = null; drawGraph(); return; } return;
        case 'left': case 'right': case 'up': case 'down': return arrow(id, p);
      }
      if (INS[id]) return ins(INS[id][mod.ctrl && INS[id][1] ? 1 : 0]);
      if (id[0] === 'L') return ins(mod.shift ? id[1].toUpperCase() : id[1]);
      if (id === 'nl') return;
    }
    function arrow(id, p) {
      const a = document.activeElement; if (a && lcd.contains(a) && /INPUT|TEXTAREA/.test(a.tagName)) return;
      if (p.type === 'calc') { if (id === 'left') { p.c = Math.max(0, p.c - 1); } else if (id === 'right') { p.c = Math.min(p.ent.length, p.c + 1); } else if (id === 'up') { if (p.pi > 0) { p.ent = p.past[--p.pi]; p.c = p.ent.length; } } else { p.pi = Math.min(p.past.length, p.pi + 1); p.ent = p.past[p.pi] || ''; p.c = p.ent.length; } return renderEntry(); }
      if (p.type === 'graph') {
        if (p.focus === 'entry') { if (id === 'left') p.c = Math.max(0, p.c - 1); else if (id === 'right') p.c = Math.min(p.ent.length, p.c + 1); else { p.sel = (p.sel + (id === 'up' ? 3 : 1)) % 4; loadFx(); } return renderEntry(); }
        const span = p.w.x1 - p.w.x0, sy = p.w.y1 - p.w.y0;
        if (p.traceKey && p.trace) { if (id === 'left' || id === 'right') { p.trace.x += (id === 'left' ? -1 : 1) * span / 80; const y = (compileFx(p)[p.trace.i] || {}).f; renderStrip(y ? `f${p.trace.i + 1}: x=${nf(p.trace.x)}  y=${nf(y(p.trace.x))}` : undefined); } else { const act = activeFx(p); if (act.length) { const pos = act.findIndex(o => o.i === p.trace.i); p.trace.i = act[(pos + (id === 'up' ? act.length - 1 : 1)) % act.length].i; } } return drawGraph(); }
        p.w = { x0: p.w.x0 + (id === 'left' ? -1 : id === 'right' ? 1 : 0) * span * 0.1, x1: p.w.x1 + (id === 'left' ? -1 : id === 'right' ? 1 : 0) * span * 0.1, y0: p.w.y0 + (id === 'down' ? -1 : id === 'up' ? 1 : 0) * sy * 0.1, y1: p.w.y1 + (id === 'down' ? -1 : id === 'up' ? 1 : 0) * sy * 0.1 }; p.marks = []; drawGraph(); save();
      }
    }
    /* mouse on the screen */
    lcd.addEventListener('click', e => {
      const t = e.target.closest('[data-pg],[data-act],[data-mi],[data-add]'); if (!t) return;
      if (t.dataset.pg !== undefined) return goPage(Number(t.dataset.pg)); if (t.dataset.mi !== undefined) return menuPick(Number(t.dataset.mi)); if (t.dataset.add) return addPage(t.dataset.add);
      if (t.dataset.act === 'prev') return goPage(S.cur - 1); if (t.dataset.act === 'next') return goPage(S.cur + 1); if (t.dataset.act === 'closepage') return closePage();
    });
    lcd.addEventListener('keydown', e => { if (S.dlg && e.key === 'Enter') { e.preventDefault(); applyWindow(); } else if (S.dlg && e.key === 'Escape') { S.dlg = null; renderDlg(); } });
    /* physical keyboard while the device has focus */
    dev.addEventListener('keydown', e => {
      if (e.altKey || e.ctrlKey || e.metaKey) return; const a = document.activeElement; if (a && lcd.contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && e.key !== 'Escape') return;
      const map = { Enter: 'enter', Backspace: 'del', Escape: 'esc', ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Tab: 'tab', ' ': 'space', '+': 'add', '-': 'sub', '*': 'mul', '/': 'div', '^': 'pow', '(': 'lp', ')': 'rp', '=': 'eq', '.': 'dot', ',': 'comma', '!': 'qf' };
      let id = map[e.key]; if (!id && /^[0-9]$/.test(e.key)) id = 'n' + e.key; if (!id && /^[a-zA-Z]$/.test(e.key)) { e.preventDefault(); return ins(e.key); }
      if (!id && e.key.length === 1) { e.preventDefault(); return ins(e.key); }
      if (id) { e.preventDefault(); press(id); }
    });
    /* paste text from the clipboard into the entry line (keeps the emulated keys in use too) */
    dev.addEventListener('paste', e => {
      const a = document.activeElement; if (a && lcd.contains(a) && /INPUT|TEXTAREA/.test(a.tagName)) return;
      e.preventDefault(); const t = ((e.clipboardData || window.clipboardData) ? (e.clipboardData || window.clipboardData).getData('text') : '').replace(/\s*[\r\n]+\s*/g, ' ').trim();
      if (t) ins(t);
    });
    render(); fit();
    return { press, state: S, dev, lcd };
  }
})();
