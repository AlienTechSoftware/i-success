/* ==========================================================================
   Nspire-Panel/panel.js  -  a roomy Nspire-style workspace for study pages (stand-alone).
   Tabs: Calculator (exact CAS), Graph, Table, Tools. A typed entry line, command chips (solve, d/dx, integral, factor, ...),
   sample commands, window settings and Analyze fields with from/to bounds.
   An approximation of the TI-Nspire CX II CAS workflow, not TI's software.

   Use:   <div id="here"></div>
          <script src="Nspire-Panel/panel.js"></script>
          <script>NspirePanel.mount(document.getElementById('here'), { key: 'my-page' });</script>
   Loads cas.js and panel.css from its own folder. Needs nothing else. If the TI-Nspire/ device folder is loaded on the
   same page too, both use one engine (cas.js is identical in both), so variables and functions are shared.
   ========================================================================== */
(function () {
  const script = document.currentScript, BASE = script && script.src ? script.src.replace(/[^/?#]*([?#].*)?$/, '') : '';
  let casP = null;
  const ensureCAS = () => window.NspireCAS ? Promise.resolve() : casP || (casP = new Promise((ok, bad) => { const el = document.createElement('script'); el.src = BASE + 'cas.js'; el.onload = ok; el.onerror = () => bad(new Error('cannot load ' + el.src)); document.head.appendChild(el); }));
  window.NspirePanel = {
    mount(root, opts = {}) {
      if (!document.querySelector('link[data-nspire-panel-css]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = BASE + 'panel.css'; l.setAttribute('data-nspire-panel-css', ''); document.head.appendChild(l); }
      return ensureCAS().then(() => { buildPanel(root, opts); });
    }
  };
    const CM = {   /* pure math: no DOM, tested in Node */
      angle: 'deg',
      toRad: x => CM.angle === 'deg' ? x * Math.PI / 180 : x,
      fromRad: x => CM.angle === 'deg' ? x * 180 / Math.PI : x,
      fact(n) { if (n < 0 || !Number.isInteger(n) || n > 170) return NaN; let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; },
      fn: {
        sin: x => Math.sin(CM.toRad(x)), cos: x => Math.cos(CM.toRad(x)), tan: x => Math.tan(CM.toRad(x)),
        asin: x => CM.fromRad(Math.asin(x)), acos: x => CM.fromRad(Math.acos(x)), atan: x => CM.fromRad(Math.atan(x)),
        ln: Math.log, log: Math.log10, sqrt: Math.sqrt, sq: x => x * x, cube: x => x * x * x, inv: x => 1 / x,
        fact: x => CM.fact(x), exp10: x => Math.pow(10, x), expE: Math.exp, neg: x => -x, pct: x => x / 100, abs: Math.abs,
        not: x => Number(~BigInt(Math.trunc(x)))
      },
      bi: v => BigInt(Math.trunc(v)),
      /* time value of money: PV(1+i)^n + PMT(1+i*b)((1+i)^n - 1)/i + FV = 0 ; i is the periodic rate as a decimal, b = 1 for payments at the start */
      tvmF(i, n, pv, pmt, fv, b) { return i === 0 ? pv + pmt * n + fv : pv * Math.pow(1 + i, n) + pmt * (1 + i * b) * (Math.pow(1 + i, n) - 1) / i + fv; },
      tvm(target, v, b) {
        const { n, i, pv, pmt, fv } = v, r = i / 100, g = Math.pow(1 + r, n), a = r === 0 ? n : (1 + r * b) * (g - 1) / r;
        if (target === 'fv') return -(pv * g + pmt * a);
        if (target === 'pv') return -(fv + pmt * a) / g;
        if (target === 'pmt') return -(fv + pv * g) / a;
        if (target === 'n') { if (r === 0) return -(pv + fv) / pmt; const k = pmt * (1 + r * b) / r; return Math.log((k - fv) / (pv + k)) / Math.log(1 + r); }
        if (target === 'i') return CM.solveRate(x => CM.tvmF(x, n, pv, pmt, fv, b)) * 100;
        return NaN;
      },
      solveRate(f) {   /* scan for a sign change, then bisect */
        let lo = -0.95, flo = f(lo), step = 0.01;
        for (let x = lo + step; x <= 10; x += x < 1 ? step : 0.25) {
          const fx = f(x);
          if (Number.isFinite(flo) && Number.isFinite(fx) && flo * fx <= 0) {
            let a = x - (x < 1 ? step : 0.25), c = x, fa = f(a);
            for (let k = 0; k < 200; k++) { const m = (a + c) / 2, fm = f(m); if (fa * fm <= 0) c = m; else { a = m; fa = fm; } }
            return (a + c) / 2;
          }
          flo = fx;
        }
        return NaN;
      },
      npv: (rate, cfs) => cfs.reduce((s, c, t) => s + c / Math.pow(1 + rate / 100, t), 0),
      irr: cfs => CM.solveRate(r => cfs.reduce((s, c, t) => s + c / Math.pow(1 + r, t), 0)) * 100,
      nums: t => (t.match(/-?\d*\.?\d+(?:e-?\d+)?/gi) || []).map(Number),
      stats(xs) {
        const n = xs.length; if (!n) return null;
        const sum = xs.reduce((a, b) => a + b, 0), mean = sum / n, s = [...xs].sort((a, b) => a - b);
        const median = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2, ss = xs.reduce((a, b) => a + (b - mean) ** 2, 0);
        const count = {}; xs.forEach(x => count[x] = (count[x] || 0) + 1); const top = Math.max(...Object.values(count));
        const mode = top === 1 ? 'none' : Object.keys(count).filter(k => count[k] === top).join(', ');
        return { n, sum, mean, median, mode, min: s[0], max: s[n - 1], range: s[n - 1] - s[0], sumsq: xs.reduce((a, b) => a + b * b, 0), varP: ss / n, sdP: Math.sqrt(ss / n), varS: n > 1 ? ss / (n - 1) : NaN, sdS: n > 1 ? Math.sqrt(ss / (n - 1)) : NaN };
      },
      regress(xs, ys) {
        const n = Math.min(xs.length, ys.length); if (n < 2) return null;
        const mx = xs.slice(0, n).reduce((a, b) => a + b, 0) / n, my = ys.slice(0, n).reduce((a, b) => a + b, 0) / n;
        let sxy = 0, sxx = 0, syy = 0; for (let k = 0; k < n; k++) { sxy += (xs[k] - mx) * (ys[k] - my); sxx += (xs[k] - mx) ** 2; syy += (ys[k] - my) ** 2; }
        const slope = sxy / sxx; return { n, slope, intercept: my - slope * mx, r: sxy / Math.sqrt(sxx * syy) };
      },
      LEN: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 },
      ANG: { deg: 1, rad: 180 / Math.PI, grad: 0.9 },
      convert(v, from, to, table) { return v * table[from] / table[to]; },
      parseInches(t) { const m = t.trim().match(/^(-?\d+(?:\.\d+)?)?\s*(?:(\d+)\s*\/\s*(\d+))?$/); if (!m || (m[1] === undefined && m[2] === undefined)) return NaN; const w = m[1] === undefined ? 0 : Number(m[1]); const f = m[2] ? Number(m[2]) / Number(m[3]) : 0; return w < 0 || Object.is(w, -0) ? w - f : w + f; },
      toFraction(x, den) {
        const neg = x < 0, a = Math.abs(x); let whole = Math.floor(a), num = Math.round((a - whole) * den);
        if (num === den) { whole++; num = 0; } let d = den; while (num && num % 2 === 0) { num /= 2; d /= 2; }
        return (neg ? '-' : '') + (num ? (whole ? whole + ' ' : '') + num + '/' + d : String(whole));
      },
      triangle(a, b, c, A) {   /* right triangle, A = angle opposite side a, in degrees; blank = NaN */
        const r = x => x * Math.PI / 180, d = x => x * 180 / Math.PI, has = x => Number.isFinite(x);
        if (has(a) && has(b)) c = Math.hypot(a, b); else if (has(a) && has(c)) b = Math.sqrt(c * c - a * a); else if (has(b) && has(c)) a = Math.sqrt(c * c - b * b);
        else if (has(A) && has(a)) { b = a / Math.tan(r(A)); c = a / Math.sin(r(A)); }
        else if (has(A) && has(b)) { a = b * Math.tan(r(A)); c = b / Math.cos(r(A)); }
        else if (has(A) && has(c)) { a = c * Math.sin(r(A)); b = c * Math.cos(r(A)); } else return null;
        return { a, b, c, A: d(Math.atan2(a, b)), B: d(Math.atan2(b, a)) };
      },
      eng(x) { if (!x) return '0'; const e = Math.floor(Math.log10(Math.abs(x)) / 3) * 3; return Number((x / Math.pow(10, e)).toPrecision(10)) + 'E' + e; }
    };
    const fmtN = (x, d = 10) => Number.isFinite(x) ? String(Number(x.toPrecision(d))) : 'n/a';
    function engTools(root) {
      const out = id => root.querySelector('#' + id), pin = (id, label, val = '', ph = '') => `<label class="pl">${label}<input id="${id}" value="${val}" placeholder="${ph}" inputmode="decimal"></label>`;
        const unitOpts = t => Object.keys(t).map(u => `<option>${u}</option>`).join('');
        root.innerHTML = `<p class="ph">Convert</p><div class="pgrid">${pin('uV', 'Value', '1')}<label class="pl">From<select id="uF">${unitOpts({ ...CM.LEN, ...CM.ANG })}</select></label><label class="pl">To<select id="uT">${unitOpts({ ...CM.LEN, ...CM.ANG })}</select></label></div>
          <div class="calc-row"><button type="button" class="pt" id="uGo">Convert</button></div><p id="uOut" class="pout"></p>
          <p class="ph">Drawing scale 1 : N</p><div class="pgrid">${pin('sN', 'N', '50')}${pin('sR', 'Real length (mm)')}${pin('sD', 'On paper (mm)')}</div>
          <div class="calc-row"><button type="button" class="pt" id="sToD">Real → paper</button><button type="button" class="pt" id="sToR">Paper → real</button></div><p id="sOutE" class="pout"></p>
          <p class="ph">Inches: fraction ↔ decimal</p><div class="pgrid">${pin('fI', 'Fraction or decimal', '', '3 7/16')}<label class="pl">Nearest 1/<select id="fD"><option>8</option><option>16</option><option selected>32</option><option>64</option></select></label></div>
          <div class="calc-row"><button type="button" class="pt" id="fGo">Convert</button></div><p id="fOut" class="pout"></p>
          <p class="ph">Right triangle (A is opposite side a; leave unknowns blank)</p><div class="pgrid">${pin('rA', 'side a')}${pin('rB', 'side b')}${pin('rC', 'hypotenuse c')}${pin('rAng', 'angle A (deg)')}</div>
          <div class="calc-row"><button type="button" class="pt" id="rGo">Solve</button></div><p id="rOut" class="pout"></p>
          `;
        const num = id => parseFloat(out(id).value);
        out('uGo').onclick = () => {
          const f = out('uF').value, t = out('uT').value, v = num('uV'), L = CM.LEN, A = CM.ANG;
          out('uOut').textContent = (f in L && t in L) ? `${fmtN(CM.convert(v, f, t, L))} ${t}` : (f in A && t in A) ? `${fmtN(CM.convert(v, f, t, A))} ${t}` : 'Pick two lengths or two angles.';
        };
        out('sToD').onclick = () => { const n = num('sN'), r = num('sR'); out('sOutE').textContent = Number.isFinite(n) && Number.isFinite(r) ? `On paper: ${fmtN(r / n)} mm` : 'Enter N and the real length.'; };
        out('sToR').onclick = () => { const n = num('sN'), d = num('sD'); out('sOutE').textContent = Number.isFinite(n) && Number.isFinite(d) ? `Real: ${fmtN(d * n)} mm` : 'Enter N and the paper length.'; };
        out('fGo').onclick = () => {
          const t = out('fI').value.trim(), den = Number(out('fD').value);
          if (/^-?\d*\.\d+$/.test(t) || /^-?\d+$/.test(t)) out('fOut').textContent = `${t} in = ${CM.toFraction(parseFloat(t), den)} in (nearest 1/${den})`;
          else { const x = CM.parseInches(t); out('fOut').textContent = Number.isFinite(x) ? `${t} in = ${fmtN(x)} in` : 'Type 3 7/16, 7/16 or 3.4375'; }
        };
        out('rGo').onclick = () => { const r = CM.triangle(num('rA'), num('rB'), num('rC'), num('rAng')); out('rOut').textContent = r ? `a ${fmtN(r.a, 8)}   b ${fmtN(r.b, 8)}   c ${fmtN(r.c, 8)}\nA ${fmtN(r.A, 8)}°   B ${fmtN(r.B, 8)}°` : 'Give two sides, or one side and angle A.'; };
    }
    function buildPanel(root, opts) {
      const { CAS: C, CASS } = window.NspireCAS, colors = ['#0668c9', '#b42318', '#138a45', '#a34d00'], pkey = opts.key ? 'nsp:' + opts.key : null;
      let saved = {}; try { saved = (pkey && JSON.parse(localStorage.getItem(pkey))) || {}; } catch (e) {}
      const persist = v => { saved = v; if (pkey) try { localStorage.setItem(pkey, JSON.stringify(v)); } catch (e) {} };
      root.classList.add('nsp');
      root.innerHTML = `<div class="ns">
        <div class="ns-tabs"><button type="button" class="active" data-tab="calc">Calculator</button><button type="button" data-tab="graph">Graph</button><button type="button" data-tab="table">Table</button><button type="button" data-tab="tools">Tools</button></div>

        <div class="ns-view" data-view="calc">
          <div class="ns-hist" id="nsHist" aria-live="polite"></div>
          <input id="nsIn" class="ns-in" placeholder="Type here, press Enter.  Try: solve(x^2-4=0,x)" spellcheck="false" autocomplete="off">
          <div class="ns-chips" id="nsChips"></div>
          <div class="calc-row"><label><input type="radio" name="nsAng" value="rad" checked> Radian</label> <label><input type="radio" name="nsAng" value="deg"> Degree</label>
            <button type="button" class="pt" id="nsClear">Clear all</button></div>
          <details class="ns-help"><summary>Commands and what is supported</summary><div>
            <p><code>solve(x^2-4=0,x)</code> · <code>diff(x^3+2x,x)</code> · <code>integrate(x^2,x)</code> · <code>integrate(sin(x),x,0,π)</code> · <code>factor(x^2-5x+6)</code> · <code>expand((x+1)^3)</code> · <code>simplify(…)</code> · <code>approx(√2)</code> · <code>sum(k^2,k,1,10)</code> · <code>limit(sin(x)/x,x,0)</code></p>
            <p>Store: <code>a:=5</code> or <code>5→a</code>. Define: <code>f(x):=x^2+1</code>, then <code>f(3)</code>. <code>ans</code> is the last result. Also gcd, lcm, mod, nCr, nPr, abs, floor, ceil, round, 5!.</p>
            <p>Exact answers: fractions, radicals, π, e, exact trig at multiples of π/12. Not included: matrices, lists, complex numbers, programs, spreadsheets, geometry, statistics tools. This is a study tool in the style of the Nspire CX II CAS; for the exam use the calculator your course allows.</p></div></details>
        </div>

        <div class="ns-view" data-view="graph" hidden>
          <canvas id="nsCv" class="ns-cv" aria-label="Graph. Drag to pan, scroll to zoom."></canvas>
          <div class="ns-stat" id="nsStat">Move over the graph to trace. Drag to pan. Scroll to zoom.</div>
          <div class="ns-fx" id="nsFx"></div>
          <div class="pgrid4">${['x0|Xmin', 'x1|Xmax', 'y0|Ymin', 'y1|Ymax'].map(s => { const [k, l] = s.split('|'); return `<label class="pl">${l}<input id="nsW_${k}" inputmode="decimal"></label>`; }).join('')}</div>
          <div class="calc-row"><button type="button" class="pt" id="nsApply">Apply window</button><button type="button" class="pt" id="nsStd">Standard</button><button type="button" class="pt" id="nsIn2">Zoom in</button><button type="button" class="pt" id="nsOut2">Zoom out</button><button type="button" class="pt" id="nsSq">Square</button><button type="button" class="pt" id="nsFit">Fit</button></div>
          <p class="ph">Analyze</p>
          <div class="pgrid4"><label class="pl">Function<select id="nsAf"><option>1</option><option>2</option><option>3</option><option>4</option></select></label><label class="pl">From (a)<input id="nsAa" inputmode="decimal"></label><label class="pl">To (b)<input id="nsAb" inputmode="decimal"></label></div>
          <div class="calc-row"><button type="button" class="pt" data-an="zero">Zero</button><button type="button" class="pt" data-an="min">Minimum</button><button type="button" class="pt" data-an="max">Maximum</button><button type="button" class="pt" data-an="deriv">dy/dx at a</button><button type="button" class="pt" data-an="int">∫ a to b</button><button type="button" class="pt" data-an="isect">f1 ∩ f2</button><button type="button" class="pt" data-an="clear">Clear marks</button></div>
          <pre class="pout" id="nsAn"></pre>
        </div>

        <div class="ns-view" data-view="table" hidden>
          <div class="pgrid4"><label class="pl">Start<input id="nsTs" value="-5" inputmode="decimal"></label><label class="pl">Step<input id="nsTd" value="1" inputmode="decimal"></label><label class="pl">Rows<input id="nsTn" value="15" inputmode="numeric"></label></div>
          <div class="calc-row"><button type="button" class="pt" id="nsTgo">Update table</button></div>
          <div id="nsTab" class="ns-tab"></div>
        </div>

        <div class="ns-view" data-view="tools" hidden><div id="nsTools"></div></div>
      </div>`;
      const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
      const showTab = t => { $$('.ns-tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === t)); $$('.ns-view').forEach(v => v.hidden = v.dataset.view !== t); if (t === 'graph') { sizeCv(); draw(); } if (t === 'table') tableGo(); if (t === 'tools' && !$('#nsTools').children.length) engTools($('#nsTools')); };
      $$('.ns-tabs button').forEach(b => b.onclick = () => showTab(b.dataset.tab));

      /* ---------- Calculator screen ---------- */
      const hist = $('#nsHist'), inp = $('#nsIn'), past = []; let pi = 0;
      function addEntry(src, r, err) {
        const d = document.createElement('div'); d.className = 'ns-ent';
        const e = document.createElement('div'); e.className = 'ns-e'; e.textContent = src; d.appendChild(e);
        if (err) { const x = document.createElement('div'); x.className = 'ns-r ns-err'; x.textContent = err; d.appendChild(x); }
        else r.lines.forEach(l => { const x = document.createElement('div'); x.className = 'ns-r'; x.textContent = l.text; d.appendChild(x); if (l.approx) { const a = document.createElement('div'); a.className = 'ns-a'; a.textContent = '≈ ' + l.approx; d.appendChild(a); } });
        if (!err && r.note) { const n = document.createElement('div'); n.className = 'ns-a'; n.textContent = r.note; d.appendChild(n); }
        hist.appendChild(d); hist.scrollTop = hist.scrollHeight;
      }
      function submit() {
        const src = inp.value.trim(); if (!src) return;
        past.push(src); pi = past.length; inp.value = '';
        try { addEntry(src, CASS.run(src)); } catch (e) { addEntry(src, null, e.message || String(e)); }
        refreshGraphs();
      }
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); submit(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); if (pi > 0) inp.value = past[--pi]; }
        else if (e.key === 'ArrowDown') { e.preventDefault(); pi = Math.min(past.length, pi + 1); inp.value = past[pi] || ''; }
      });
      const chips = [['solve(', 'solve'], ['diff(', 'd/dx'], ['integrate(', '∫'], ['factor(', 'factor'], ['expand(', 'expand'], ['limit(', 'limit'], ['sum(', 'Σ'], ['approx(', '≈'],
        ['sin(', 'sin'], ['cos(', 'cos'], ['tan(', 'tan'], ['ln(', 'ln'], ['log(', 'log'], ['√(', '√'], ['abs(', '|x|'], ['π', 'π'], ['e', 'e'], ['^', '^'], [':=', ':='], ['→', '→'], ['ans', 'ans'], ['x', 'x']];
      $('#nsChips').innerHTML = chips.map(([t, l]) => `<button type="button" class="pt" data-ins="${t}">${l}</button>`).join('');
      $('#nsChips').onclick = e => {
        const t = e.target.dataset.ins; if (!t) return; const s = inp.selectionStart ?? inp.value.length, en = inp.selectionEnd ?? s;
        inp.value = inp.value.slice(0, s) + t + inp.value.slice(en); const c = s + t.length; inp.focus(); inp.setSelectionRange(c, c);
      };
      $$('[name=nsAng]').forEach(r => r.onchange = () => { C.st.deg = r.value === 'deg'; refreshGraphs(); });
      $('#nsClear').onclick = () => { hist.innerHTML = ''; CASS.reset(); past.length = 0; pi = 0; refreshGraphs(); };

      /* ---------- Graph ---------- */
      const cv = $('#nsCv'), ctx = cv.getContext('2d'), stat = $('#nsStat');
      const G = { w: saved.w || { x0: -10, x1: 10, y0: -7, y1: 7 }, marks: [], tr: null };
      const fxBox = $('#nsFx'), fx = [];
      for (let i = 0; i < 4; i++) {
        const row = document.createElement('div'); row.className = 'ns-fxr';
        row.innerHTML = `<label><input type="checkbox" ${i < 1 || (saved.fx && saved.fx[i]) ? 'checked' : ''}> <span class="dot" style="background:${colors[i]}"></span> f${i + 1}(x) =</label><input class="fxin" placeholder="${['x^2-2', 'sin(x)', '2x+1', ''][i]}" value="${saved.fx && saved.fx[i] || ''}" spellcheck="false">`;
        fxBox.appendChild(row); fx.push({ chk: row.querySelector('input[type=checkbox]'), inp: row.querySelector('.fxin'), comp: null });
      }
      function compileAll() {
        fx.forEach(o => {
          o.comp = null; let t = o.inp.value.trim(); o.inp.classList.remove('bad'); if (!t) return;
          t = t.replace(/^\s*y\s*=\s*/i, '');
          try { const node = C.simp(CASS.sub(C.parse(t))); const bad = [...C.freeVars(node)].filter(v => v !== 'x'); if (bad.length) throw new Error('unknown ' + bad[0]); o.comp = { node, f: C.compile(node, 'x') }; }
          catch (e) { o.inp.classList.add('bad'); o.inp.title = e.message; }
        });
        persist({ w: G.w, fx: fx.map(o => o.inp.value) });
      }
      const active = () => fx.map((o, i) => ({ i, o })).filter(({ o }) => o.chk.checked && o.comp);
      let dprG = 1;
      function sizeCv() {
        const w = Math.max(200, Math.floor(root.clientWidth - 16)), h = Math.round(Math.max(220, Math.min(460, w * 0.74)));
        dprG = window.devicePixelRatio || 1;
        if (cv.width !== Math.round(w * dprG) || cv.height !== Math.round(h * dprG)) { cv.width = Math.round(w * dprG); cv.height = Math.round(h * dprG); cv.style.width = w + 'px'; cv.style.height = h + 'px'; }
      }
      const niceStep = r => { const p = Math.pow(10, Math.floor(Math.log10(r / 5))), m = r / 5 / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; };
      const labelFmt = v => Math.abs(v) < 1e-12 ? '0' : String(Number(v.toPrecision(6)));
      function draw() {
        if (cv.width === 0) return; const W = cv.width / dprG, H = cv.height / dprG, { x0, x1, y0, y1 } = G.w;
        ctx.setTransform(dprG, 0, 0, dprG, 0, 0); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
        const X = x => (x - x0) / (x1 - x0) * W, Y = y => H - (y - y0) / (y1 - y0) * H, ix = x => x0 + x / W * (x1 - x0);
        const sx = niceStep(x1 - x0), sy = niceStep(y1 - y0);
        ctx.lineWidth = 1; ctx.font = '10px Arial'; ctx.fillStyle = '#536477';
        for (let v = Math.ceil(x0 / sx) * sx; v <= x1; v += sx) { const px = Math.round(X(v)) + .5; ctx.strokeStyle = '#e1e8ef'; ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke(); if (Math.abs(v) > sx / 2) ctx.fillText(labelFmt(v), px + 2, Math.min(H - 3, Math.max(10, Y(0) + 11))); }
        for (let v = Math.ceil(y0 / sy) * sy; v <= y1; v += sy) { const py = Math.round(Y(v)) + .5; ctx.strokeStyle = '#e1e8ef'; ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke(); if (Math.abs(v) > sy / 2) ctx.fillText(labelFmt(v), Math.min(W - 28, Math.max(2, X(0) + 3)), py - 2); }
        ctx.strokeStyle = '#17202a'; ctx.lineWidth = 1.4; ctx.beginPath(); if (y0 < 0 && y1 > 0) { ctx.moveTo(0, Y(0)); ctx.lineTo(W, Y(0)); } if (x0 < 0 && x1 > 0) { ctx.moveTo(X(0), 0); ctx.lineTo(X(0), H); } ctx.stroke();
        active().forEach(({ i, o }) => {
          ctx.strokeStyle = colors[i]; ctx.lineWidth = 2; ctx.beginPath(); let pen = false, prev = 0;
          for (let px = 0; px <= W; px++) {
            const y = o.comp.f(ix(px)); if (!Number.isFinite(y)) { pen = false; continue; }
            const py = Math.max(-1e5, Math.min(1e5, Y(y)));
            if (pen && Math.abs(py - prev) > H * 1.5) pen = false;
            if (!pen) { ctx.moveTo(px, py); pen = true; } else ctx.lineTo(px, py); prev = py;
          }
          ctx.stroke();
        });
        G.marks.forEach(m => { ctx.fillStyle = '#17202a'; ctx.beginPath(); ctx.arc(X(m.x), Y(m.y), 4, 0, 7); ctx.fill(); ctx.fillStyle = '#17202a'; ctx.font = '11px Arial'; ctx.fillText(m.label, X(m.x) + 6, Y(m.y) - 6); });
        if (G.tr) { const t = G.tr; ctx.strokeStyle = colors[t.i]; ctx.fillStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(t.x), Y(t.y), 5, 0, 7); ctx.fill(); ctx.stroke(); }
      }
      const setWinInputs = () => ['x0', 'x1', 'y0', 'y1'].forEach(k => $('#nsW_' + k).value = labelFmt(G.w[k]));
      function setWin(w) { G.w = w; setWinInputs(); G.marks = []; compileAll(); draw(); }
      const aspect = () => cv.height / cv.width;
      const shown = v => { const e = $('[data-view=' + v + ']'); return !!e && !e.hidden; };
      function refreshGraphs() { if (!cv.isConnected) return; compileAll(); if (shown('graph')) draw(); if (shown('table')) tableGo(); }
      fx.forEach(o => { o.inp.addEventListener('input', () => { compileAll(); draw(); }); o.chk.addEventListener('change', () => { draw(); }); });
      $('#nsApply').onclick = () => { const g = k => parseFloat($('#nsW_' + k).value); const w = { x0: g('x0'), x1: g('x1'), y0: g('y0'), y1: g('y1') }; if (Object.values(w).every(Number.isFinite) && w.x1 > w.x0 && w.y1 > w.y0) setWin(w); };
      $('#nsStd').onclick = () => { const h = 10 * aspect(); setWin({ x0: -10, x1: 10, y0: -h, y1: h }); };
      const zoom = (f, cx, cy) => { const { x0, x1, y0, y1 } = G.w; cx = cx ?? (x0 + x1) / 2; cy = cy ?? (y0 + y1) / 2; setWin({ x0: cx - (cx - x0) * f, x1: cx + (x1 - cx) * f, y0: cy - (cy - y0) * f, y1: cy + (y1 - cy) * f }); };
      $('#nsIn2').onclick = () => zoom(0.5); $('#nsOut2').onclick = () => zoom(2);
      $('#nsSq').onclick = () => { const { x0, x1, y0, y1 } = G.w, cy = (y0 + y1) / 2, h = (x1 - x0) * aspect() / 2; setWin({ x0, x1, y0: cy - h, y1: cy + h }); };
      $('#nsFit').onclick = () => {
        const ys = []; active().forEach(({ o }) => { for (let k = 0; k <= 400; k++) { const y = o.comp.f(G.w.x0 + k / 400 * (G.w.x1 - G.w.x0)); if (Number.isFinite(y)) ys.push(y); } });
        if (ys.length < 2) return; ys.sort((a, b) => a - b); const lo = ys[Math.floor(ys.length * 0.02)], hi = ys[Math.ceil(ys.length * 0.98) - 1], pad = (hi - lo || 1) * 0.1; setWin({ ...G.w, y0: lo - pad, y1: hi + pad });
      };
      let drag = null;
      const coord = e => { const r = cv.getBoundingClientRect(), W = r.width, H = r.height; return { px: e.clientX - r.left, py: e.clientY - r.top, x: G.w.x0 + (e.clientX - r.left) / W * (G.w.x1 - G.w.x0), y: G.w.y1 - (e.clientY - r.top) / H * (G.w.y1 - G.w.y0), W, H }; };
      cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); drag = { ...coord(e), w: { ...G.w } }; });
      cv.addEventListener('pointermove', e => {
        const c = coord(e);
        if (drag) { const dx = (c.px - drag.px) / c.W * (drag.w.x1 - drag.w.x0), dy = (c.py - drag.py) / c.H * (drag.w.y1 - drag.w.y0); G.w = { x0: drag.w.x0 - dx, x1: drag.w.x1 - dx, y0: drag.w.y0 + dy, y1: drag.w.y1 + dy }; setWinInputs(); }
        const a = active()[0]; if (a) { const y = a.o.comp.f(c.x); G.tr = Number.isFinite(y) ? { x: c.x, y, i: a.i } : null; stat.textContent = Number.isFinite(y) ? `f${a.i + 1}:  x = ${labelFmt(c.x)}   y = ${labelFmt(y)}` : `x = ${labelFmt(c.x)}`; } else stat.textContent = `x = ${labelFmt(c.x)}   y = ${labelFmt(c.y)}`;
        draw();
      });
      ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => { if (drag) { drag = null; persist({ w: G.w, fx: fx.map(o => o.inp.value) }); } }));
      cv.addEventListener('pointerleave', () => { G.tr = null; draw(); });
      cv.addEventListener('wheel', e => { e.preventDefault(); const c = coord(e); zoom(e.deltaY < 0 ? 0.8 : 1.25, c.x, c.y); }, { passive: false });
      const ro = new ResizeObserver(() => { if (!cv.isConnected) return ro.disconnect(); if (shown('graph')) { sizeCv(); draw(); } }); ro.observe(root);

      /* analysis */
      const num = id => parseFloat($(id).value), an = $('#nsAn');
      $$('[data-an]').forEach(b => b.onclick = () => {
        const k = b.dataset.an; if (k === 'clear') { G.marks = []; an.textContent = ''; return draw(); }
        const idx = Number($('#nsAf').value) - 1, o = fx[idx]; let a = num('#nsAa'), bb = num('#nsAb'); if (!Number.isFinite(a)) a = G.w.x0; if (!Number.isFinite(bb)) bb = G.w.x1;
        if (k === 'isect') { const o1 = fx[0], o2 = fx[1]; if (!o1.comp || !o2.comp) { an.textContent = 'Fill f1 and f2 first.'; return; } const r = C.numericRoots(x => o1.comp.f(x) - o2.comp.f(x), Math.min(a, bb), Math.max(a, bb)); G.marks = r.map(x => ({ x, y: o1.comp.f(x), label: `(${labelFmt(x)}, ${labelFmt(o1.comp.f(x))})` })); an.textContent = r.length ? r.map(x => `x = ${labelFmt(x)}, y = ${labelFmt(o1.comp.f(x))}`).join('\n') : 'No intersection in [a, b].'; return draw(); }
        if (!o.comp) { an.textContent = `Fill f${idx + 1} first.`; return; }
        const f = o.comp.f, lo = Math.min(a, bb), hi = Math.max(a, bb);
        if (k === 'zero') { const r = C.numericRoots(f, lo, hi); G.marks = r.map(x => ({ x, y: 0, label: labelFmt(x) })); an.textContent = r.length ? r.map(x => `zero at x = ${labelFmt(x)}`).join('\n') : 'No zero in [a, b].'; }
        else if (k === 'min' || k === 'max') {
          const sg = k === 'min' ? 1 : -1; let bx = lo, bv = Infinity; for (let i = 0; i <= 8000; i++) { const x = lo + i / 8000 * (hi - lo), v = sg * f(x); if (v < bv) { bv = v; bx = x; } }
          let l = Math.max(lo, bx - (hi - lo) / 8000), r = Math.min(hi, bx + (hi - lo) / 8000); for (let i = 0; i < 80; i++) { const m1 = l + (r - l) / 3, m2 = r - (r - l) / 3; if (sg * f(m1) < sg * f(m2)) r = m2; else l = m1; }
          bx = (l + r) / 2; G.marks = [{ x: bx, y: f(bx), label: `${k === 'min' ? 'min' : 'max'} (${labelFmt(bx)}, ${labelFmt(f(bx))})` }]; an.textContent = `${k === 'min' ? 'Minimum' : 'Maximum'}: x = ${labelFmt(bx)}, y = ${labelFmt(f(bx))}`;
        } else if (k === 'deriv') {
          let t = `f${idx + 1}'(${labelFmt(a)}) ≈ ${labelFmt((f(a + 1e-6) - f(a - 1e-6)) / 2e-6)}`; try { const d = C.simp(C.diff(o.comp.node, 'x')); t += `\nf${idx + 1}'(x) = ${C.show(d)}`; } catch (e) {} an.textContent = t; G.marks = [{ x: a, y: f(a), label: `x = ${labelFmt(a)}` }];
        } else if (k === 'int') {
          let t = `∫ from ${labelFmt(lo)} to ${labelFmt(hi)} ≈ ${labelFmt(C.nsimpson(f, lo, hi))}`; try { const Fn_ = C.integrate(o.comp.node, 'x'); if (Fn_) t += `\nantiderivative: ${C.show(Fn_)}`; } catch (e) {} an.textContent = t; G.marks = [];
        }
        draw();
      });

      /* ---------- Table ---------- */
      function tableGo() {
        compileAll(); const s = parseFloat($('#nsTs').value), d = parseFloat($('#nsTd').value), n = Math.max(1, Math.min(200, parseInt($('#nsTn').value) || 15)), a = active();
        if (!Number.isFinite(s) || !Number.isFinite(d)) { $('#nsTab').textContent = 'Enter a start and a step.'; return; }
        if (!a.length) { $('#nsTab').textContent = 'Fill in a function on the Graph tab first.'; return; }
        let h = '<table class="ns-t"><thead><tr><th>x</th>' + a.map(({ i }) => `<th style="color:${colors[i]}">f${i + 1}</th>`).join('') + '</tr></thead><tbody>';
        for (let k = 0; k < n; k++) { const x = Number((s + k * d).toPrecision(12)); h += `<tr><td>${labelFmt(x)}</td>${a.map(({ o }) => { const y = o.comp.f(x); return `<td>${Number.isFinite(y) ? labelFmt(y) : 'undef'}</td>`; }).join('')}</tr>`; }
        $('#nsTab').innerHTML = h + '</tbody></table>';
      }
      $('#nsTgo').onclick = tableGo;

      compileAll(); setWinInputs(); $('#nsAa').value = ''; $('#nsAb').value = '';
      requestAnimationFrame(() => { if (!cv.isConnected) return; sizeCv(); const h = (G.w.x1 - G.w.x0) * aspect() / 2, cy = (G.w.y0 + G.w.y1) / 2; if (!saved.w) { G.w.y0 = -h; G.w.y1 = h; setWinInputs(); } });
    }

})();
