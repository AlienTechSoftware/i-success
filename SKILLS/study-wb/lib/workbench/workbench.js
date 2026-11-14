/* ==========================================================================
   workbench.js  -  a collapsible side Workbench for study pages: calculator + notepad.
   Self-contained: it injects its own styles and panel. To use it in another exam page:

       <script src="workbench/workbench.js" data-key="my-exam-bench"></script>     (put it just before </body>)

   data-key   the localStorage key that remembers open/closed, width, notes and drawing (one per page).
   data-tools-offered   optional, comma list of tools to include at all (calculator, notepad, stickies, periodic); default:
                        every tool except opt-in ones. The periodic table is opt-in: it appears only when named here or in data-tools.
   data-periodic        optional, URL of the folder holding elements.js; default: periodic/ next to this file.
   data-tools           optional, comma list of tools shown at first; default: every offered tool. The user's own
                        show/hide choice (chips at the top of the pane) is remembered per page and wins afterwards.
   The page should have a <main> (and optionally a .top header) so the content moves aside when the bench is open,
   and may have a fixed footer.timer, which the bench sits above.

   What it has
   - Calculator, mode dropdown (Basic is the default and always the starting mode):
       Basic (memory keys MC MR M- M+), Scientific, Programming, Financial (TVM, NPV, IRR), Statistics,
       Engineering graphing (panel version) = Nspire-Panel/, and Engineering graphing (TI-Nspire CX II CAS style) = TI-Nspire/;
       each is its own Mode entry and is loaded on demand from its own folder.
   - Notepad: one sheet per problem (auto-discovered from the page, remembered separately), type or draw, pen colours, undo,
     Blank/Lines/Grid page style, Clear (current problem) and Clear all (every problem, confirms first).
   - Drag the thin bar on its left edge to resize it; the tab on its edge opens and closes it.

   External components, each a stand-alone folder next to this file (or point to them with data-nspire / data-panel):
     TI-Nspire/     the handheld-style device with the photo skin
     Nspire-Panel/  the roomy panel (tabs, chips, Analyze)
   Without them the other modes still work.
   window.Workbench exposes open(), close() and loadNspire().
   Mode entries: ... Statistics, "Engineering graphing (panel version)" (Nspire-Panel/), "Engineering graphing (TI-Nspire CX II CAS style)" (TI-Nspire/).
   ========================================================================== */
(function () {
  const script = document.currentScript, KEY = (script && script.dataset.key) || 'workbench';
  const CSS = `
    /* Fallback design tokens at zero specificity: a host page that defines the same names on :root wins; a bare page still looks right. */
    :where(:root) { --blue:#0668c9; --blue-dark:#034c99; --ink:#17202a; --line:#d7e1eb; --pale:#edf7ff; --good:#138a45; --bad:#b42318; --amber:#fff7e7; }
    /* Base look at zero specificity, so the pane is complete on a bare page and every rule below (and any host rule) still wins. */
    :where(.bench) { font-family:Arial, Helvetica, sans-serif; line-height:1.45; color:var(--ink); }
    :where(.bench), :where(.bench) * { box-sizing:border-box; }
    :where(.bench) button { border:0; border-radius:4px; font-family:inherit; font-weight:bold; cursor:pointer; }
    :where(.bench) select, :where(.bench) input, :where(.bench) textarea { font-family:inherit; color:var(--ink); }
    /* ---- Workbench: calculator + notepad, collapsible on the right ---- */
    .bench { position:fixed; top:0; right:0; bottom:0; width:var(--bench-w,352px); z-index:9; background:#fff; border-left:2px solid var(--blue); box-shadow:-4px 0 12px #0c37611a; transition:transform .2s; display:flex; flex-direction:column; }
    .bench.closed { transform:translateX(100%); box-shadow:none; }
    .bench.dragging { transition:none; }
    .bench-grip { position:absolute; left:-5px; top:0; bottom:0; width:12px; cursor:ew-resize; touch-action:none; z-index:1; }
    .bench-grip::after { content:''; position:absolute; left:4px; top:50%; width:4px; height:56px; margin-top:-28px; border-radius:2px; background:#9fc5e9; }
    .bench-grip:hover::after, .bench.dragging .bench-grip::after { background:var(--blue); }
    .bench-tab { position:absolute; left:-36px; top:120px; width:36px; padding:14px 4px; writing-mode:vertical-rl; background:var(--blue-dark); color:#fff; border-radius:6px 0 0 6px; font-size:.95rem; }
    .bench-body { overflow:auto; padding:12px 12px 80px; }
    .bench-h { margin:6px 0 8px; font-size:1rem; color:var(--blue-dark); }
    .bench-tools { display:flex; flex-wrap:wrap; align-items:center; gap:6px; margin:0 0 10px; padding-bottom:8px; border-bottom:1px solid var(--line); }
    .bench-tools[hidden] { display:none; }
    .bench-tools button { padding:4px 10px; border-radius:12px; font-size:.8rem; background:#e7f1fa; color:var(--blue-dark); border:1px solid #b7d5f3; }
    .bench-tools button::before { content:'+ '; }
    .bench-tool[hidden] { display:none; }
    .bench-tool > .bench-h { display:flex; align-items:center; justify-content:space-between; gap:8px; }
    .tool-x { width:22px; height:22px; padding:0; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:15px; line-height:1; background:#e7f1fa; color:var(--blue-dark); border:1px solid #b7d5f3; }
    .tool-x:hover, .tool-x:focus-visible { background:var(--blue-dark); color:#fff; }
    /* ---- Sticky notes: managed in the pane, floating over the page ---- */
    .st-bar { display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin-bottom:8px; }
    .st-bar button { padding:5px 10px; font-size:.82rem; background:#e7f1fa; color:var(--blue-dark); }
    .st-bar .st-new { background:var(--blue-dark); color:#fff; }
    .st-colors { display:flex; flex-wrap:wrap; gap:5px; align-items:center; font-size:.8rem; color:#43586d; margin-bottom:8px; }
    .st-sw { width:22px; height:22px; padding:0; border-radius:50%; border:1px solid #0003; }
    .st-sw.on { box-shadow:0 0 0 2px #fff, 0 0 0 4px var(--blue-dark); }
    .st-custom { width:30px; height:24px; padding:0; border:1px solid #9eb8d0; border-radius:4px; background:#fff; cursor:pointer; }
    .st-list { list-style:none; margin:0; padding:0; font-size:.86rem; }
    .st-list li { display:flex; align-items:center; gap:8px; padding:5px 4px; border-bottom:1px solid var(--line); }
    .st-list .st-dot { width:12px; height:12px; border-radius:50%; flex:none; border:1px solid #0003; }
    .st-list .st-name { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; cursor:pointer; }
    .st-list .st-name.off { color:#8a97a5; text-decoration:line-through; }
    .st-list button { padding:2px 8px; font-size:.75rem; background:#e7f1fa; color:var(--blue-dark); }
    .st-empty { color:#8a97a5; font-size:.85rem; margin:4px 0; }
    .sticky { --sc:#fff176; position:fixed; z-index:8; display:flex; flex-direction:column; width:260px; height:220px; min-width:180px; min-height:44px;
      background:var(--sc); border:2px solid var(--sc-border, #c9b400); border-radius:6px; box-shadow:0 6px 16px #0003; resize:both; overflow:hidden;
      font-family:"Comic Sans MS", cursive, sans-serif; color:#222; }
    .sticky.min { height:auto !important; min-height:0; resize:none; }
    .sticky.min .sticky-text, .sticky.min .st-pal { display:none; }
    .sticky-head { display:flex; align-items:center; gap:4px; padding:4px 4px 4px 0; background:var(--sc); border-bottom:2px solid var(--sc-border, #c9b400); touch-action:none; }
    .sticky-grip { width:22px; align-self:stretch; cursor:grab; flex:none; background:radial-gradient(#0005 1px, transparent 1.5px) 0 0 / 6px 6px; margin-left:4px; opacity:.7; }
    .sticky.dragging .sticky-grip { cursor:grabbing; }
    .sticky-title { flex:1; width:auto; min-width:0; border:0; background:transparent; font:bold .95rem "Comic Sans MS", cursive, sans-serif; color:#222; padding:3px 4px; outline:none; text-align:left; box-shadow:none; }
    .sticky-title:focus { background:#ffffff66; border-radius:3px; }
    .sticky-b { width:22px; height:22px; padding:0; border-radius:50%; flex:none; display:inline-flex; align-items:center; justify-content:center; font-size:13px; line-height:1; background:#ffffff80; color:#222; border:1px solid #0002; font-weight:bold; }
    .sticky-b:hover, .sticky-b:focus-visible { background:#fff; }
    .sticky-b.dot { background:var(--sc); box-shadow:inset 0 0 0 2px #fff; }
    .st-pal { display:flex; flex-wrap:wrap; gap:4px; padding:5px 6px; border-bottom:1px solid var(--sc-border, #c9b400); background:#ffffff59; }
    .st-pal[hidden] { display:none; }
    .sticky-text { flex:1; min-height:0; border:0; background:transparent; resize:none; padding:8px; font:.9rem/1.4 "Comic Sans MS", cursive, sans-serif; color:#222; outline:none; text-align:left; }
    .sticky[hidden] { display:none; }
    /* ---- Periodic table (opt-in tool) ---- */
    .pt-search { width:100%; min-width:0; padding:6px 8px; margin-bottom:8px; border:1px solid #9eb8d0; border-radius:4px; font-size:.85rem; text-align:left; }
    .pt-grid { display:grid; grid-template-columns:repeat(18, minmax(0, 1fr)); gap:2px; }
    .pt-el { aspect-ratio:1 / 1.15; padding:0; border:1px solid #0002; border-radius:3px; font:bold clamp(.5rem, 1.6vw, .72rem)/1 Arial, Helvetica, sans-serif; color:#17202a; display:flex; flex-direction:column; align-items:center; justify-content:center; min-width:0; overflow:hidden; }
    .pt-el small { font-size:.75em; font-weight:normal; opacity:.75; }
    .pt-el.dim { opacity:.25; }
    .pt-el.on { outline:2px solid var(--blue-dark); outline-offset:1px; }
    .pt-gap { grid-column:1 / -1; height:6px; }
    .pt-info { margin-top:8px; padding:8px; border:1px solid var(--line); border-radius:6px; background:#f8fbfe; font-size:.85rem; }
    .pt-info b { font-size:1.05rem; }
    .pt-info .pt-row { display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; }
    .pt-info button { padding:4px 9px; font-size:.78rem; background:#e7f1fa; color:var(--blue-dark); }
    .pt-legend { display:flex; flex-wrap:wrap; gap:4px 8px; margin-top:6px; font-size:.7rem; color:#43586d; }
    .pt-legend span::before { content:''; display:inline-block; width:9px; height:9px; margin-right:3px; border-radius:2px; background:var(--c); border:1px solid #0002; vertical-align:-1px; }
    @media print { .sticky { display:none !important; } }
    .bench-tool + .bench-tool { margin-top:14px; }
    .calc { border:1px solid var(--line); border-radius:8px; padding:8px; background:#f4f7fa; }
    .calc:focus { outline:2px solid var(--blue); }
    .calc-screen { position:relative; background:#fff; border:1px solid #9eb8d0; border-radius:4px; padding:8px 10px; text-align:right; font:bold 1.6rem/1.2 ui-monospace,Consolas,monospace; min-height:2.4rem; overflow:hidden; white-space:nowrap; }
    .calc-screen::before { content:attr(data-m); position:absolute; left:8px; top:3px; font:bold .8rem Arial, sans-serif; color:#a34d00; }
    .calc-keys { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin-top:8px; }
    .calc-keys .k { padding:12px 0; font-size:1.15rem; background:#fff; color:var(--ink); border:1px solid #b7d5f3; }
    .calc-keys .k.op { background:#e7f1fa; color:var(--blue-dark); }
    .calc-keys .k.mem { background:#f4fbf6; color:#087338; border-color:#9fd3b0; font-size:1rem; }
    .calc-keys .k.fn { background:#fdeceb; color:#8a1a10; }
    .calc-keys .k.eq { background:var(--blue); color:#fff; grid-column:4; grid-row:5 / span 2; }
    .calc-head { display:flex; gap:8px; align-items:center; margin-bottom:6px; font-weight:bold; font-size:.9rem; }
    .calc-head select { flex:1; min-width:0; padding:8px 10px; font-size:.95rem; border:1px solid #9eb8d0; border-radius:4px; background:#fff; color:var(--ink); font-family:inherit; cursor:pointer; }
    .calc-extra { margin-top:8px; }
    .calc-keys.sci { grid-template-columns:repeat(5,1fr); gap:5px; margin-top:0; }
    .calc-keys .k.sm { padding:8px 0; font-size:.85rem; }
    .calc-keys .k.hex { background:#f4fbf6; color:#087338; border-color:#9fd3b0; }
    .calc-row { display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin:6px 0; font-size:.85rem; }
    .calc-row input[type=radio] { width:auto; min-width:0; }
    .calc-panel { margin-top:10px; border-top:1px solid var(--line); padding-top:8px; font-size:.85rem; }
    .calc-panel:empty { display:none; }
    .calc-panel input, .calc-panel textarea, .calc-panel select { width:100%; min-width:0; padding:5px 6px; font-size:.85rem; text-align:left; border:1px solid #9eb8d0; border-radius:4px; font-family:inherit; }
    .pgrid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
    .pl { display:block; font-size:.78rem; color:#43586d; font-weight:bold; margin:4px 0; }
    .ph { margin:12px 0 4px; font-weight:bold; color:var(--blue-dark); }
    .pout { margin:6px 0; padding:6px 8px; background:#fff; border:1px solid var(--line); border-radius:4px; font:.85rem/1.4 ui-monospace,Consolas,monospace; white-space:pre-wrap; min-height:1.4rem; }
    .calc-panel .pt { padding:6px 9px; font-size:.82rem; background:#e7f1fa; color:var(--blue-dark); }
    .calc.eng .calc-screen, .calc.eng .calc-keys, .calc.eng .calc-extra, .calc.eng .calc-cp { display:none; }
    .calc-cp { display:flex; gap:6px; justify-content:flex-end; margin-top:4px; }
    .calc-cp button, .pad-bar .cp { padding:3px 9px; font-size:.75rem; background:#e7f1fa; color:var(--blue-dark); }
    .pad-bar { display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin-bottom:6px; }
    .pad-bar button { padding:6px 10px; font-size:.85rem; background:#e7f1fa; color:var(--blue-dark); }
    .pad-bar button.active { background:var(--blue-dark); color:#fff; }
    .pad-bar select { padding:5px 6px; font-size:.85rem; border:1px solid #9eb8d0; border-radius:4px; background:#fff; color:var(--ink); }
    #padProblem { flex:1 1 160px; min-width:0; max-width:100%; }
    #padRule { flex:0 0 auto; width:auto; }
    .pad-tools { display:inline-flex; gap:6px; align-items:center; }
    .pad-tools[hidden] { display:none; }
    .pad-bar .sw { width:22px; height:22px; padding:0; border-radius:50%; border:2px solid #fff; box-shadow:0 0 0 1px #9eb8d0; }
    .pad-bar .sw.active { box-shadow:0 0 0 3px var(--blue); }
    .pad { position:relative; height:360px; border:1px solid #9eb8d0; border-radius:4px; background:#fff; resize:vertical; overflow:hidden; }
    /* Line-height is set in absolute rem, equal to the ruling's own repeat distance (--pad-line), so a typed line always
       sits exactly on top of one rule - text and background can never drift apart, at any font size change. */
    .pad textarea { position:absolute; inset:0; width:100%; height:100%; border:0; padding:10px; font:1.05rem/var(--pad-line,1.6rem) Verdana, Arial, sans-serif; resize:none; background:#fff; }
    .pad[data-rule="lines"] textarea { background:repeating-linear-gradient(#fff 0, #fff var(--pad-line,1.6rem), #e6eef6 var(--pad-line,1.6rem), #e6eef6 calc(var(--pad-line,1.6rem) + 1px)); }
    .pad[data-rule="grid"] textarea { background-color:#fff; background-image:
        repeating-linear-gradient(#e6eef6 0, #e6eef6 1px, transparent 1px, transparent var(--pad-line,1.6rem)),
        repeating-linear-gradient(90deg, #e6eef6 0, #e6eef6 1px, transparent 1px, transparent var(--pad-line,1.6rem)); }
    .pad canvas { position:absolute; inset:0; width:100%; height:100%; touch-action:none; pointer-events:none; }
    .pad.drawing canvas { pointer-events:auto; cursor:crosshair; }
    .pad.drawing textarea { pointer-events:none; }
    @media (min-width:1100px) { body.bench-open main { max-width:none; margin-left:24px; margin-right:calc(var(--bench-w,352px) + 24px); } body.bench-open .top { padding-left:24px; padding-right:calc(var(--bench-w,352px) + 24px); } }
    @media (max-width:700px) { .bench { width:100%; } .bench-tab { left:-36px; } }
`;
  const HTML = `
  <aside id="bench" class="bench closed" aria-label="Workbench: calculator and notepad">
    <div class="bench-grip" id="benchGrip" title="Drag to resize the workbench"></div>
    <button id="benchTab" class="bench-tab" type="button" aria-expanded="false" data-act="toggle">Workbench</button>
    <div class="bench-body">
      <div class="bench-tools" id="benchTools" role="group" aria-label="Hidden tools: click one to show it again" hidden></div>
      <section class="bench-tool" data-tool="calculator" data-label="Calculator">
      <h2 class="bench-h">Calculator</h2>
      <div class="calc" id="calc" tabindex="0" aria-label="Basic calculator. Type digits and + - * / = on the keyboard while it has focus.">
        <div class="calc-head"><label for="calcModeSel">Mode</label> <select id="calcModeSel"></select></div>
        <div class="calc-screen" id="calcScreen" role="status">0</div>
        <div class="calc-cp"><button type="button" data-act="calc-copy" title="Copy the displayed number">Copy</button><button type="button" data-act="calc-paste" title="Paste a number into the calculator">Paste</button></div>
        <div class="calc-extra" id="calcExtra"></div>
        <div class="calc-keys">
          <button type="button" class="k mem" data-k="MC">MC</button><button type="button" class="k mem" data-k="MR">MR</button><button type="button" class="k mem" data-k="M−">M−</button><button type="button" class="k mem" data-k="M+">M+</button>
          <button type="button" class="k fn" data-k="C">C</button><button type="button" class="k fn" data-k="BS">⌫</button><button type="button" class="k op" data-k="÷">÷</button><button type="button" class="k op" data-k="×">×</button>
          <button type="button" class="k" data-k="7">7</button><button type="button" class="k" data-k="8">8</button><button type="button" class="k" data-k="9">9</button><button type="button" class="k op" data-k="−">−</button>
          <button type="button" class="k" data-k="4">4</button><button type="button" class="k" data-k="5">5</button><button type="button" class="k" data-k="6">6</button><button type="button" class="k op" data-k="+">+</button>
          <button type="button" class="k" data-k="1">1</button><button type="button" class="k" data-k="2">2</button><button type="button" class="k" data-k="3">3</button><button type="button" class="k eq" data-k="=">=</button>
          <button type="button" class="k zero" data-k="0">0</button><button type="button" class="k" data-k="+/-" title="Change sign">+/−</button><button type="button" class="k" data-k=".">.</button>
        </div>
        <div class="calc-panel" id="calcPanel"></div>
      </div>
      </section>

      <section class="bench-tool" data-tool="notepad" data-label="Notepad">
      <h2 class="bench-h">Notepad</h2>
      <div class="pad-bar">
        <select id="padProblem" aria-label="Problem"></select>
      </div>
      <div class="pad-bar">
        <button type="button" class="pm active" id="padModeType" data-act="mode-type">Type</button>
        <button type="button" class="pm" id="padModeDraw" data-act="mode-draw">Draw</button>
        <select id="padRule" aria-label="Page style"><option value="blank">Blank</option><option value="lines" selected>Lines</option><option value="grid">Grid</option></select>
        <span class="pad-tools" id="padTools" hidden>
          <button type="button" class="pt active" data-tool="pen">Pen</button><button type="button" class="pt" data-tool="eraser">Eraser</button>
          <button type="button" class="sw active" data-color="#17202a" style="background:#17202a" aria-label="black"></button><button type="button" class="sw" data-color="#0668c9" style="background:#0668c9" aria-label="blue"></button><button type="button" class="sw" data-color="#b42318" style="background:#b42318" aria-label="red"></button>
          <button type="button" class="pt" data-act="undo">Undo</button>
        </span>
        <button type="button" class="pt cp" data-act="pad-copy" title="Copy the selected text, or all of it">Copy</button><button type="button" class="pt cp" data-act="pad-paste" title="Paste at the cursor">Paste</button><button type="button" class="pt" data-act="clear" title="Clear this problem's notes and drawing">Clear</button><button type="button" class="pt" data-act="clear-all" title="Clear every problem's saved notes and drawings">Clear all</button>
      </div>
      <div class="pad" id="pad" data-rule="lines">
        <textarea id="padText" spellcheck="false"></textarea>
        <canvas id="padCanvas" aria-label="Drawing layer"></canvas>
      </div>
      <p class="muted" style="margin:6px 0 0">One sheet of notes per problem, remembered per problem in this browser.</p>
      </section>

      <section class="bench-tool" data-tool="stickies" data-label="Sticky notes">
      <h2 class="bench-h">Sticky notes</h2>
      <div class="st-bar">
        <button type="button" class="st-new" data-sact="new" title="Add a sticky note to the page">+ New note</button>
        <button type="button" data-sact="arrange" title="Show every note and line them up">Arrange</button>
        <button type="button" data-sact="show-all">Show all</button>
        <button type="button" data-sact="hide-all">Hide all</button>
      </div>
      <div class="st-colors" id="stColors"><span>New note colour:</span></div>
      <ul class="st-list" id="stList" aria-label="Sticky notes on this page"></ul>
      <p class="muted" style="margin:6px 0 0">Notes float over the page. Drag by the dotted grip, resize from the corner. Saved in this browser, per page.</p>
      </section>

      <section class="bench-tool" data-tool="periodic" data-label="Periodic table" data-optin="1">
      <h2 class="bench-h">Periodic table</h2>
      <input type="search" class="pt-search" id="ptSearch" placeholder="Find: symbol, name or atomic number" aria-label="Find an element">
      <div class="pt-grid" id="ptGrid" aria-label="Periodic table">Loading...</div>
      <div class="pt-legend" id="ptLegend"></div>
      <div class="pt-info" id="ptInfo" aria-live="polite">Click an element.</div>
      <p class="muted" id="ptSource" style="margin:6px 0 0;font-size:.75rem"></p>
      </section>
    </div>
  </aside>`;
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const wrap = document.createElement('div'); wrap.innerHTML = HTML.trim();
  const footer = document.querySelector('footer.timer'); document.body.insertBefore(wrap.firstElementChild, footer || null);
    /* ======================================================================
       WORKBENCH: basic calculator + typed/drawn notepad. DOM only; state kept in this browser (localStorage, optional).
       ====================================================================== */
    const BENCH_KEY = KEY;
    const benchEl = document.getElementById('bench');
    let benchSaved = {};
    try { benchSaved = JSON.parse(localStorage.getItem(BENCH_KEY)) || {}; } catch (e) {}
    function benchStore(patch) { Object.assign(benchSaved, patch); try { localStorage.setItem(BENCH_KEY, JSON.stringify(benchSaved)); } catch (e) {} }
    function benchSet(open) {
      benchEl.classList.toggle('closed', !open); document.body.classList.toggle('bench-open', open);
      document.getElementById('benchTab').setAttribute('aria-expanded', String(open));
      document.getElementById('benchTab').textContent = open ? 'Close' : 'Workbench';
      if (open) padSize();
    }
    function benchWidth(w) { document.documentElement.style.setProperty('--bench-w', Math.round(w) + 'px'); }
    if (benchSaved.w) benchWidth(benchSaved.w);
    (() => {
      const grip = document.getElementById('benchGrip'); let drag = false;
      grip.addEventListener('pointerdown', e => { drag = true; grip.setPointerCapture(e.pointerId); benchEl.classList.add('dragging'); e.preventDefault(); });
      grip.addEventListener('pointermove', e => { if (!drag) return; const w = Math.max(280, Math.min(window.innerWidth - e.clientX, Math.round(window.innerWidth * 0.7), 1000)); benchWidth(w); benchSaved.w = w; });
      ['pointerup', 'pointercancel'].forEach(t => grip.addEventListener(t, () => { if (!drag) return; drag = false; benchEl.classList.remove('dragging'); benchStore({ w: benchSaved.w }); }));
    })();
    function benchToggle() { const open = benchEl.classList.contains('closed'); benchSet(open); benchStore({ open }); }

    /* ---------- Calculator: immediate-execution basic calculator, like the exam's ---------- */
    const calc = { acc: null, op: null, entry: '0', fresh: true, err: false, mem: 0, recall: false };
    const calcScreen = document.getElementById('calcScreen');
    const calcOps = { '+': (x, y) => x + y, '−': (x, y) => x - y, '×': (x, y) => x * y, '÷': (x, y) => x / y };
    function calcFmt(s) {
      if (calc.err) return 'Error';
      const neg = s.startsWith('-'), body = neg ? s.slice(1) : s, [i, f] = body.split('.');
      return (neg ? '-' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f !== undefined ? '.' + f : '');
    }
    function calcDraw() { calcScreen.textContent = calcFmt(calc.entry); calcScreen.dataset.m = calc.mem !== 0 ? 'M' : ''; calcAfter(); }
    function calcNum(v) { return Number(Number(v).toPrecision(12)); }
    function calcPress(k) {
      if (calc.err && k !== 'C') return;
      if (k === 'MC') { calc.mem = 0; return calcDraw(); }
      if (k === 'M+' || k === 'M−') { calc.mem = calcNum(calc.mem + (k === 'M+' ? 1 : -1) * parseFloat(calc.entry)); calc.fresh = true; calc.recall = false; return calcDraw(); }
      if (k === 'MR') { calc.entry = String(calc.mem); calc.fresh = false; calc.recall = true; return calcDraw(); }
      if (/^[0-9.]$/.test(k)) {
        if (calc.fresh || calc.recall) { calc.recall = false; calc.entry = k === '.' ? '0.' : k; calc.fresh = false; }
        else if (k === '.' && calc.entry.includes('.')) return;
        else if (calc.entry.replace(/[-.]/g, '').length >= 12) return;
        else calc.entry = calc.entry === '0' && k !== '.' ? k : calc.entry + k;
      } else if (k === 'C') { Object.assign(calc, { acc: null, op: null, entry: '0', fresh: true, err: false, recall: false }); }
      else if (k === '+/-') { if (calc.entry !== '0') calc.entry = calc.entry.startsWith('-') ? calc.entry.slice(1) : '-' + calc.entry; }
      else if (k === 'BS') { if (!calc.fresh && !calc.recall) calc.entry = calc.entry.slice(0, -1).replace(/^-?$/, '0'); }
      else if (k in calcOps) {
        if (calc.op && !calc.fresh) { if (!calcRun()) return calcDraw(); }
        else if (!calc.op) calc.acc = parseFloat(calc.entry);
        calc.op = k; calc.fresh = true; calc.recall = false;
      } else if (k === '=') { if (calc.op && !calc.fresh && calcRun()) { calc.op = null; calc.fresh = true; calc.recall = false; } }
      calcDraw();
    }
    function calcRun() {
      const r = calcOps[calc.op](calc.acc, parseFloat(calc.entry));
      if (!isFinite(r)) { calc.err = true; return false; }
      calc.acc = calcNum(r); calc.entry = String(calc.acc); return true;
    }
    document.querySelectorAll('#calc .k').forEach(b => b.addEventListener('click', () => calcPress(b.dataset.k)));
    document.getElementById('calc').addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && /^[cv]$/i.test(e.key) && !e.target.closest('input,textarea,select') && !document.getElementById('calc').classList.contains('eng')) {
        /* Ctrl+C copies the displayed number. Ctrl+V: the browser's own paste event is used; if none arrives shortly, read the clipboard directly. */
        if (e.key.toLowerCase() === 'c') { e.preventDefault(); calcCopyNow(document.querySelector('[data-act="calc-copy"]')); }
        else { calcPasteSeen = false; setTimeout(() => { if (!calcPasteSeen) calcPasteNow(document.querySelector('[data-act="calc-paste"]')); }, 150); }
        return;
      }
      if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest('input,textarea,select')) return;
      const map = { '*': '×', '/': '÷', '-': '−', '+': '+', Enter: '=', '=': '=', Backspace: 'BS', Escape: 'C', c: 'C', C: 'C', '.': '.', ',': '.' };
      const k = /^[0-9]$/.test(e.key) ? e.key : map[e.key];
      if (k) { e.preventDefault(); calcPress(k); }
    });
    /* ---------- Calculator modes beyond Basic (many proctored exams allow only a basic calculator) ---------- */
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

    /* extra operators for the shared calculator */
    Object.assign(calcOps, {
      '^': (x, y) => Math.pow(x, y), 'MOD': (x, y) => x % y,
      'AND': (x, y) => Number(CM.bi(x) & CM.bi(y)), 'OR': (x, y) => Number(CM.bi(x) | CM.bi(y)), 'XOR': (x, y) => Number(CM.bi(x) ^ CM.bi(y)),
      '<<': (x, y) => Number(CM.bi(x) << CM.bi(y)), '>>': (x, y) => Number(CM.bi(x) >> CM.bi(y))
    });
    function calcSetEntry(v) {
      if (!isFinite(v)) { calc.err = true; return calcDraw(); }
      calc.entry = String(calcNum(v)); calc.fresh = false; calc.recall = true; calcDraw();
    }
    function calcFn(name) {
      if (calc.err) return;
      if (name === 'pi') return calcSetEntry(Math.PI);
      if (name === 'e') return calcSetEntry(Math.E);
      calcSetEntry(CM.fn[name](parseFloat(calc.entry)));
    }

    const MODES = {
      basic: { label: 'Basic' }, sci: { label: 'Scientific' }, prog: { label: 'Programming' },
      fin: { label: 'Financial' }, stat: { label: 'Statistics' }, engp: { label: 'Engineering graphing (panel version)' }, eng: { label: 'Engineering graphing (TI-Nspire CX II CAS style)' }
    };
    const modeSel = document.getElementById('calcModeSel'), calcExtra = document.getElementById('calcExtra'), calcPanel = document.getElementById('calcPanel');
    modeSel.innerHTML = Object.entries(MODES).map(([k, m]) => `<option value="${k}">${m.label}</option>`).join('');
    const kb = (label, attr, cls = '') => `<button type="button" class="k ${cls}" ${attr}>${label}</button>`;
    const pin = (id, label, val = '', ph = '') => `<label class="pl">${label}<input id="${id}" value="${val}" placeholder="${ph}" inputmode="decimal"></label>`;
    const out = id => document.getElementById(id);
    let calcAfter = () => {};

    /* Two stand-alone components, each in its own folder next to this file (override with data-nspire / data-panel on the script tag):
         TI-Nspire/   the handheld-style device with the photo skin      -> window.TINspire.mount(el, opts)
         Nspire-Panel/ the roomy panel with tabs, chips and Analyze      -> window.NspirePanel.mount(el, opts)
       Either may be missing; the Engineering mode shows whichever loads. */
    const compBase = (attr, def) => { const d = script && script.dataset[attr]; const u = d ? new URL(d, document.baseURI).href : new URL(def, script ? script.src : document.baseURI).href; return u.endsWith('/') ? u : u + '/'; };
    const NSPIRE_BASE = compBase('nspire', 'TI-Nspire/'), PANEL_BASE = compBase('panel', 'Nspire-Panel/'), compP = {};
    function loadComp(base, file, global) {
      if (window[global]) return Promise.resolve(true);
      return compP[base] || (compP[base] = new Promise(ok => { const el = document.createElement('script'); el.src = base + file; el.onload = () => ok(true); el.onerror = () => { compP[base] = null; ok(false); }; document.head.appendChild(el); }));
    }
    const loadNspire = () => Promise.all([loadComp(PANEL_BASE, 'panel.js', 'NspirePanel'), loadComp(NSPIRE_BASE, 'nspire.js', 'TINspire')]);

    /* ---------- Periodic table: data in periodic/elements.js (generated from PubChem by scripts/make_periodic_data.py),
       loaded the first time the tool is shown. Click an element for its details; "Use in calculator" puts its atomic
       mass on the calculator display. ---------- */
    const PERIODIC_BASE = compBase('periodic', 'periodic/');
    let periodicStarted = false;
    function periodicInit() {
      if (periodicStarted) return; periodicStarted = true;
      const grid = document.getElementById('ptGrid'), info = document.getElementById('ptInfo'), search = document.getElementById('ptSearch');
      if (!grid) return;
      const CAT = { 'Alkali metal': '#ffcfcf', 'Alkaline earth metal': '#ffe0bd', 'Transition metal': '#fff0b3', 'Post-transition metal': '#dde3ea', 'Metalloid': '#e3eebf',
        'Nonmetal': '#c9f0d2', 'Halogen': '#c6eaf6', 'Noble gas': '#ddd4f7', 'Lanthanide': '#f8d5ee', 'Actinide': '#f1c6da' };
      loadComp(PERIODIC_BASE, 'elements.js', 'STUDY_WB_ELEMENTS').then(found => {
        const data = window.STUDY_WB_ELEMENTS;
        if (!found || !data) { grid.textContent = 'periodic/elements.js was not found next to workbench.js (see data-periodic).'; return; }
        document.getElementById('ptSource').textContent = 'Source: ' + data.source + '.';
        const rows = data.rows, cells = [];
        grid.textContent = '';
        const place = r => {
          const [z, , , , , , , g, p] = r;
          if (g) return [p, g];
          return [p === 6 ? 9 : 10, (z - (p === 6 ? 57 : 89)) + 3];      /* lanthanoids and actinoids in the two rows below */
        };
        rows.forEach(r => {
          const [z, sym, name, mass, , , block] = r, [row, col] = place(r);
          const b = document.createElement('button'); b.type = 'button'; b.className = 'pt-el'; b.style.gridRow = row; b.style.gridColumn = col;
          b.style.background = CAT[block] || '#eee'; b.title = `${name} (${z}), ${mass}`; b.setAttribute('aria-label', `${name}, atomic number ${z}`);
          b.innerHTML = `<small>${z}</small>${sym}`;
          b.addEventListener('click', () => show(r, b)); grid.appendChild(b); cells.push([r, b]);
        });
        const gap = document.createElement('div'); gap.className = 'pt-gap'; gap.style.gridRow = 8; grid.appendChild(gap);
        document.getElementById('ptLegend').innerHTML = Object.entries(CAT).map(([k, c]) => `<span style="--c:${c}">${k}</span>`).join('');
        function show(r, b) {
          const [z, sym, name, mass, en, state, block, g, p, conf] = r;
          cells.forEach(([, x]) => x.classList.toggle('on', x === b));
          info.innerHTML = '';
          const head = document.createElement('div'); head.innerHTML = `<b></b> <span></span>`; head.querySelector('b').textContent = `${sym} · ${name}`; head.querySelector('span').textContent = `Z = ${z}`;
          const facts = document.createElement('div');
          facts.textContent = `Atomic mass ${mass} · ${g ? 'group ' + g + ' · ' : ''}period ${p} · ${block}${en != null ? ' · electronegativity ' + en : ''} · ${state}${conf ? ' · ' + conf : ''}`;
          const actions = document.createElement('div'); actions.className = 'pt-row';
          const use = document.createElement('button'); use.type = 'button'; use.textContent = 'Use mass in calculator';
          use.addEventListener('click', () => { calcSetEntry(parseFloat(mass)); flash(use, 'On the display'); });
          const copy = document.createElement('button'); copy.type = 'button'; copy.textContent = 'Copy mass';
          copy.addEventListener('click', () => clipCopy(mass, copy));
          actions.append(use, copy); info.append(head, facts, actions);
        }
        search.addEventListener('input', () => {
          const q = search.value.trim().toLowerCase();
          cells.forEach(([r, b]) => { const hit = !q || String(r[0]) === q || r[1].toLowerCase() === q || r[2].toLowerCase().includes(q) || (q.length <= 2 && r[1].toLowerCase().startsWith(q)); b.classList.toggle('dim', !hit); });
        });
        search.addEventListener('keydown', e => { if (e.key !== 'Enter') return; const hit = cells.find(([, b]) => !b.classList.contains('dim')); if (hit) { show(hit[0], hit[1]); hit[1].focus(); } });
      });
    }
    function setMode(m) {
      calcExtra.innerHTML = ''; calcPanel.innerHTML = ''; calcAfter = () => {}; document.getElementById('calc').classList.toggle('eng', m === 'eng' || m === 'engp');
      if (m === 'sci') {
        const keys = [['sin', 'fn'], ['cos', 'fn'], ['tan', 'fn'], ['asin', 'fn'], ['acos', 'fn'], ['atan', 'fn'], ['ln', 'fn'], ['log', 'fn'], ['sqrt', 'fn', '√'], ['sq', 'fn', 'x²'], ['cube', 'fn', 'x³'], ['inv', 'fn', '1/x'], ['fact', 'fn', 'x!'], ['exp10', 'fn', '10ˣ'], ['expE', 'fn', 'eˣ'], ['pi', 'fn', 'π'], ['e', 'fn', 'e'], ['neg', 'fn', '±'], ['pct', 'fn', '%'], ['^', 'op', 'xʸ']];
        calcExtra.innerHTML = `<div class="calc-keys sci">${keys.map(([k, t, l]) => kb(l || k, t === 'fn' ? `data-fn="${k}"` : `data-k="${k}"`, 'sm')).join('')}</div>
          <div class="calc-row"><label><input type="radio" name="ang" value="deg" checked> Degrees</label> <label><input type="radio" name="ang" value="rad"> Radians</label></div>`;
        calcExtra.querySelectorAll('[name=ang]').forEach(r => r.onchange = () => CM.angle = r.value);
      } else if (m === 'prog') {
        const keys = [['AND'], ['OR'], ['XOR'], ['not', 'fn', 'NOT'], ['<<'], ['>>'], ['MOD'], ['A', 'h'], ['B', 'h'], ['C', 'h'], ['D', 'h'], ['E', 'h'], ['F', 'h']];
        calcExtra.innerHTML = `<div class="calc-keys sci">${keys.map(([k, t, l]) => t === 'fn' ? kb(l, `data-fn="${k}"`, 'sm') : t === 'h' ? kb(k, `data-h="${k}"`, 'sm hex') : kb(k, `data-k="${k}"`, 'sm')).join('')}</div>`;
        calcPanel.innerHTML = `<div class="pgrid">${pin('bDec', 'DEC')}${pin('bHex', 'HEX')}${pin('bOct', 'OCT')}${pin('bBin', 'BIN')}</div><p class="muted">Integers only (the part after the point is dropped). Type in any box, or use the keypad for DEC. Hex digits A to F: use the green keys, they type into the HEX box.</p>`;
        const setAll = v => { const n = Math.trunc(v); out('bDec').value = String(n); out('bHex').value = n.toString(16).toUpperCase(); out('bOct').value = n.toString(8); out('bBin').value = n.toString(2); };
        calcAfter = () => { if (document.activeElement && calcPanel.contains(document.activeElement)) return; if (!calc.err) setAll(parseFloat(calc.entry)); };
        [['bDec', 10], ['bHex', 16], ['bOct', 8], ['bBin', 2]].forEach(([id, radix]) => out(id).addEventListener('input', () => {
          const t = out(id).value.trim(); if (!t) return; const v = parseInt(t, radix); if (Number.isNaN(v)) return;
          calc.entry = String(v); calc.fresh = false; calc.recall = true; calcScreen.textContent = calcFmt(calc.entry); calcScreen.dataset.m = calc.mem !== 0 ? 'M' : ''; setAll(v);
          [['bDec', 10], ['bHex', 16], ['bOct', 8], ['bBin', 2]].forEach(([o]) => { if (o === id) out(o).value = t; });
        }));
        calcExtra.querySelectorAll('[data-h]').forEach(b => b.onclick = () => { const f = out('bHex'); f.value += b.dataset.h; f.dispatchEvent(new Event('input')); });
        calcAfter();
      } else if (m === 'fin') {
        calcPanel.innerHTML = `<div class="pgrid">${pin('tN', 'N (periods)')}${pin('tI', 'I/Y (% per period)')}${pin('tPV', 'PV')}${pin('tPMT', 'PMT')}${pin('tFV', 'FV')}</div>
          <div class="calc-row"><label><input type="radio" name="tb" value="0" checked> Payments at end</label> <label><input type="radio" name="tb" value="1"> at start</label></div>
          <div class="calc-row" id="tBtns">${['n', 'i', 'pv', 'pmt', 'fv'].map(t => `<button type="button" class="pt" data-t="${t}">Solve ${t === 'i' ? 'I/Y' : t.toUpperCase()}</button>`).join('')}</div>
          <p class="muted">Money you pay out is negative, money you receive is positive. Fill four boxes, solve the fifth. The rate is per period.</p><p id="tOut" class="pout"></p>
          <hr><div class="pgrid">${pin('nRate', 'Discount rate % (NPV)')}</div><label class="pl">Cash flows, first = time 0 (comma or space separated)<textarea id="nCF" rows="2" placeholder="-1000 300 400 500"></textarea></label>
          <div class="calc-row"><button type="button" class="pt" id="nNpv">NPV</button><button type="button" class="pt" id="nIrr">IRR</button></div><p id="nOut" class="pout"></p>`;
        out('tBtns').onclick = e => {
          const t = e.target.dataset.t; if (!t) return;
          const get = id => parseFloat(out(id).value), v = { n: get('tN'), i: get('tI'), pv: get('tPV'), pmt: get('tPMT'), fv: get('tFV') }, b = Number(calcPanel.querySelector('[name=tb]:checked').value);
          const need = ['n', 'i', 'pv', 'pmt', 'fv'].filter(k => k !== t && !Number.isFinite(v[k]));
          if (need.length) { out('tOut').textContent = 'Fill in: ' + need.join(', ').toUpperCase(); return; }
          const r = CM.tvm(t, v, b); out('tOut').textContent = Number.isFinite(r) ? `${t === 'i' ? 'I/Y' : t.toUpperCase()} = ${fmtN(r, 10)}` : 'No solution for these numbers.';
          if (Number.isFinite(r)) { out({ n: 'tN', i: 'tI', pv: 'tPV', pmt: 'tPMT', fv: 'tFV' }[t]).value = fmtN(r, 10); calcSetEntry(r); }
        };
        out('nNpv').onclick = () => { const cf = CM.nums(out('nCF').value), r = parseFloat(out('nRate').value); out('nOut').textContent = cf.length && Number.isFinite(r) ? 'NPV = ' + fmtN(CM.npv(r, cf), 10) : 'Enter a rate and cash flows.'; };
        out('nIrr').onclick = () => { const cf = CM.nums(out('nCF').value); out('nOut').textContent = cf.length > 1 ? 'IRR = ' + fmtN(CM.irr(cf), 8) + ' %' : 'Enter cash flows.'; };
      } else if (m === 'stat') {
        calcPanel.innerHTML = `<label class="pl">Data (comma, space or new line)<textarea id="sX" rows="3" placeholder="12 15 9 20 15"></textarea></label>
          <label class="pl">Optional second list, same length, for a line of best fit (x = first list, y = this one)<textarea id="sY" rows="2" placeholder="3 4 2 6 5"></textarea></label>
          <div class="calc-row"><button type="button" class="pt" id="sGo">Calculate</button></div><pre id="sOut" class="pout"></pre>`;
        out('sGo').onclick = () => {
          const xs = CM.nums(out('sX').value), ys = CM.nums(out('sY').value), s = CM.stats(xs); if (!s) { out('sOut').textContent = 'Enter some numbers.'; return; }
          let t = `n        ${s.n}\nsum      ${fmtN(s.sum)}\nmean     ${fmtN(s.mean)}\nmedian   ${fmtN(s.median)}\nmode     ${s.mode}\nmin      ${fmtN(s.min)}\nmax      ${fmtN(s.max)}\nrange    ${fmtN(s.range)}\nΣx²      ${fmtN(s.sumsq)}\nsample SD   ${fmtN(s.sdS)}\npopul. SD   ${fmtN(s.sdP)}\nsample var  ${fmtN(s.varS)}\npopul. var  ${fmtN(s.varP)}`;
          const r = ys.length ? CM.regress(xs, ys) : null; if (r) t += `\n\ny = a + bx  (n ${r.n})\nslope b     ${fmtN(r.slope)}\nintercept a ${fmtN(r.intercept)}\nr           ${fmtN(r.r)}`;
          out('sOut').textContent = t; calcSetEntry(s.mean);
        };
      } else if (m === 'eng' || m === 'engp') {
        /* Two separate Mode entries, one component each: 'engp' = the panel (Nspire-Panel/), 'eng' = the handheld device (TI-Nspire/). */
        const isPanel = m === 'engp';
        calcPanel.textContent = 'Loading…';
        (isPanel ? loadComp(PANEL_BASE, 'panel.js', 'NspirePanel') : loadComp(NSPIRE_BASE, 'nspire.js', 'TINspire')).then(found => {
          if (modeSel.value !== m) return;
          if (!found) { calcPanel.textContent = (isPanel ? 'Nspire-Panel/' : 'TI-Nspire/') + ' was not found next to workbench.js (see ' + (isPanel ? 'data-panel' : 'data-nspire') + ').'; return; }
          calcPanel.textContent = ''; const host = document.createElement('div'); calcPanel.appendChild(host);   /* own wrapper: the panel adds a class to its root */
          return (isPanel ? window.NspirePanel.mount(host, { key: KEY + '-panel' }) : window.TINspire.mount(host, { key: KEY + '-ns', title: 'Study' }))
            .then(() => { if (modeSel.value === m && parseFloat(getComputedStyle(benchEl).width) < 540) benchWidth(600); });
        }).catch(err => { calcPanel.textContent = 'Could not load the component (' + err.message + ').'; });
      }
      calcDraw();
    }
    calcExtra.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.fn) calcFn(b.dataset.fn); else if (b.dataset.k) calcPress(b.dataset.k); });
    modeSel.addEventListener('change', () => setMode(modeSel.value));
    modeSel.value = 'basic';   /* always start in Basic */
    setMode(modeSel.value);
    /* copy / paste for the basic display: shared by the buttons and by Ctrl+C / Ctrl+V while the calculator has focus */
    let calcPasteSeen = false;
    function calcApplyPaste(t) { const m = String(t).replace(/[\s,$]/g, '').match(/-?\d*\.?\d+(?:e[+-]?\d+)?/i); if (!m) return false; calc.entry = String(Number(m[0])); calc.fresh = false; calc.recall = true; calc.err = false; calcDraw(); return true; }
    const calcCopyNow = btn => clipCopy(calc.err ? '' : calc.entry, btn);
    const calcPasteNow = btn => clipPaste(calcApplyPaste, btn);
    document.getElementById('calc').addEventListener('paste', e => {
      if (document.getElementById('calc').classList.contains('eng') || e.target.closest('input,textarea,select')) return;
      calcPasteSeen = true; e.preventDefault(); const btn = document.querySelector('[data-act="calc-paste"]'), ok = calcApplyPaste((e.clipboardData && e.clipboardData.getData('text')) || ''); flash(btn, ok ? 'Pasted' : 'No number');
    });
    calcDraw();

    /* ---------- Notepad: one sheet per problem, typed text underneath, a drawing layer on top ---------- */
    const padBox = document.getElementById('pad'), padText = document.getElementById('padText'), padCanvas = document.getElementById('padCanvas'), padProblemSel = document.getElementById('padProblem');
    const pctx = padCanvas.getContext('2d');
    const padState = { tool: 'pen', color: '#17202a', drawing: false, last: null, undo: [], w: 0, h: 0 };
    const escHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    /* Problems: auto-discovered from the host page's own practice-question panels (`.question-panel[id]`, label = its
       heading with any badge stripped out). A host page with none of those still gets one slot, "Notes". */
    /* Each practice problem on the page is a slot: id = "<group id> | <problem name>", label = the problem's name. The slot
       follows the page: choosing a group or a problem in the practice navigator switches the notepad to that problem. */
    function currentProblemId() {
      const v = document.querySelector('#l2host .group.active .source-view.active');
      return v ? v.closest('.group').dataset.id + ' | ' + v.dataset.name : null;
    }
    function discoverProblems() {
      const views = [...document.querySelectorAll('#l2host .group')].flatMap(g => [...g.querySelectorAll('.source-view')].map(v => ({ id: g.dataset.id + ' | ' + v.dataset.name, label: v.dataset.name })));
      if (views.length) return views;
      const panels = [...document.querySelectorAll('.question-panel[id]')];
      const items = panels.map(p => {
        const h = p.querySelector('.card-head h2, h2');
        let label = p.id;
        if (h) { const c = h.cloneNode(true); c.querySelectorAll('.badge,.points').forEach(b => b.remove()); label = c.textContent.replace(/\s+/g, ' ').trim() || p.id; }
        return { id: p.id, label };
      });
      return items.length ? items : [{ id: 'default', label: 'Notes' }];
    }
    const PROBLEMS = discoverProblems();
    padProblemSel.innerHTML = PROBLEMS.map(p => `<option value="${escHtml(p.id)}">${escHtml(p.label)}</option>`).join('');
    /* One-time migration: versions before per-problem notes kept one flat {text, img, iw, ih} for the whole page. */
    if (!benchSaved.pads && (benchSaved.text || benchSaved.img)) {
      benchSaved.pads = { [PROBLEMS[0].id]: { text: benchSaved.text || '', img: benchSaved.img || '', iw: benchSaved.iw, ih: benchSaved.ih } };
      benchStore({ pads: benchSaved.pads, text: undefined, img: undefined, iw: undefined, ih: undefined });
    }
    const openNow = currentProblemId();
    let padActive = (openNow && PROBLEMS.some(p => p.id === openNow)) ? openNow : (benchSaved.padActive && PROBLEMS.some(p => p.id === benchSaved.padActive)) ? benchSaved.padActive : PROBLEMS[0].id;
    padProblemSel.value = padActive;
    function padSlot(id) { return (benchSaved.pads && benchSaved.pads[id]) || {}; }
    function padSetSlot(id, patch) { const pads = benchSaved.pads || (benchSaved.pads = {}); pads[id] = Object.assign({}, pads[id], patch); benchStore({ pads }); }
    function padSize() {
      const w = padBox.clientWidth, h = padBox.clientHeight; if (!w || !h || (w === padState.w && h === padState.h)) return;
      const slot = padSlot(padActive);
      const keep = padState.w ? padCanvas.toDataURL() : slot.img, dpr = window.devicePixelRatio || 1, ow = padState.w || slot.iw || w, oh = padState.h || slot.ih || h;
      padCanvas.width = Math.round(w * dpr); padCanvas.height = Math.round(h * dpr); pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      padState.w = w; padState.h = h;
      if (keep) { const im = new Image(); im.onload = () => pctx.drawImage(im, 0, 0, ow, oh); im.src = keep; } else pctx.clearRect(0, 0, padCanvas.width, padCanvas.height);
    }
    function padSave() { try { padSetSlot(padActive, { img: padCanvas.toDataURL('image/png'), iw: padState.w, ih: padState.h }); } catch (e) {} }
    function padMode(m) {
      const draw = m === 'draw';
      padBox.classList.toggle('drawing', draw); document.getElementById('padTools').hidden = !draw;
      document.getElementById('padModeDraw').classList.toggle('active', draw); document.getElementById('padModeType').classList.toggle('active', !draw);
      if (!draw) padText.focus();
    }
    const padRuleSel = document.getElementById('padRule');
    /* Page style is per PROBLEM, not page-wide: applyRule only updates the display; padSetRule also saves it, into the
       active problem's own slot, so each problem remembers its own Blank/Lines/Grid choice. A page saved by the brief
       page-wide-style version of this component (a flat `rule` key) still works: it is read as the fallback for any
       problem that has not set its own rule yet, never written back to. */
    function applyRule(r) { padBox.dataset.rule = r; padRuleSel.value = r; }
    function padSetRule(r) { applyRule(r); padSetSlot(padActive, { rule: r }); }
    function padLoadSlot(id) {
      clearTimeout(padTimer);
      const slot = padSlot(id);
      padText.value = slot.text || '';
      padState.undo = [];
      padState.w = 0; padState.h = 0;   /* force padSize() to treat this as a fresh load, so it restores this slot's own drawing */
      padSize();
      applyRule(slot.rule || benchSaved.rule || 'lines');
    }
    function padSwitch(id) {
      if (id === padActive) return;
      padSetSlot(padActive, { text: padText.value });   /* flush the outgoing slot first, bypassing the debounce */
      padActive = id;
      padProblemSel.value = id;
      padLoadSlot(id);
    }
    function padClear() {
      // if (!confirm("Clear this problem's notes and drawing?")) return;   // confirmation dialog switched off on purpose; uncomment to ask first
      padText.value = ''; pctx.clearRect(0, 0, padState.w, padState.h); padState.undo = []; padSetSlot(padActive, { text: '', img: '', iw: padState.w, ih: padState.h });
    }
    function padClearAll() {
      if (!confirm('Clear the saved notes and drawings for every problem? This cannot be undone.')) return;
      /* Wipes text and drawings only. Each problem's own page-style choice is a display preference, not a note, so it
         survives: keep the `rule` field of every slot that had one, drop everything else. */
      const pads = benchSaved.pads || {}, kept = {};
      for (const id of Object.keys(pads)) if (pads[id] && pads[id].rule) kept[id] = { rule: pads[id].rule };
      benchStore({ pads: kept });
      padText.value = ''; pctx.clearRect(0, 0, padState.w, padState.h); padState.undo = [];
    }
    function padUndo() { const snap = padState.undo.pop(); if (snap) { pctx.save(); pctx.setTransform(1, 0, 0, 1, 0, 0); pctx.putImageData(snap, 0, 0); pctx.restore(); padSave(); } }
    document.querySelectorAll('#padTools .pt[data-tool]').forEach(b => b.addEventListener('click', () => { padState.tool = b.dataset.tool; document.querySelectorAll('#padTools .pt[data-tool]').forEach(x => x.classList.toggle('active', x === b)); }));
    document.querySelectorAll('#padTools .sw').forEach(b => b.addEventListener('click', () => { padState.color = b.dataset.color; padState.tool = 'pen'; document.querySelectorAll('#padTools .sw').forEach(x => x.classList.toggle('active', x === b)); document.querySelectorAll('#padTools .pt[data-tool]').forEach(x => x.classList.toggle('active', x.dataset.tool === 'pen')); }));
    function padPoint(e) { const r = padCanvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, p: e.pointerType === 'pen' && e.pressure ? e.pressure : 0.5 }; }
    padCanvas.addEventListener('pointerdown', e => {
      padCanvas.setPointerCapture(e.pointerId); padState.drawing = true; padState.last = padPoint(e);
      padState.undo.push(pctx.getImageData(0, 0, padCanvas.width, padCanvas.height)); if (padState.undo.length > 15) padState.undo.shift();
      padStroke(padState.last, padState.last); e.preventDefault();
    });
    padCanvas.addEventListener('pointermove', e => { if (!padState.drawing) return; const p = padPoint(e); padStroke(padState.last, p); padState.last = p; });
    ['pointerup', 'pointercancel'].forEach(t => padCanvas.addEventListener(t, () => { if (padState.drawing) { padState.drawing = false; padSave(); } }));
    function padStroke(a, b) {
      pctx.save(); pctx.lineCap = 'round'; pctx.lineJoin = 'round';
      if (padState.tool === 'eraser') { pctx.globalCompositeOperation = 'destination-out'; pctx.lineWidth = 16; }
      else { pctx.strokeStyle = padState.color; pctx.lineWidth = 1 + b.p * 3.5; }
      pctx.beginPath(); pctx.moveTo(a.x, a.y); pctx.lineTo(b.x + 0.01, b.y + 0.01); pctx.stroke(); pctx.restore();
    }
    let padTimer = null;
    padText.addEventListener('input', () => { clearTimeout(padTimer); padTimer = setTimeout(() => padSetSlot(padActive, { text: padText.value }), 400); });
    padProblemSel.addEventListener('change', () => padSwitch(padProblemSel.value));
    /* Follow the practice page: after any click in the navigator, the notepad shows the problem that is now open. */
    document.addEventListener('click', () => setTimeout(() => { const id = currentProblemId(); if (id && id !== padActive && PROBLEMS.some(p => p.id === id)) padSwitch(id); }, 0));
    padRuleSel.addEventListener('change', () => padSetRule(padRuleSel.value));
    applyRule(padSlot(padActive).rule || benchSaved.rule || 'lines');
    padText.value = padSlot(padActive).text || '';
    benchSet(benchSaved.open !== undefined ? !!benchSaved.open : window.innerWidth >= 1500);
    new ResizeObserver(() => padSize()).observe(padBox);

    /* ---------- Show / hide tools. Each tool's heading has a small round × that collapses it into a "+ Name" button in a
       row at the top of the pane; that button brings it back. The row exists only while something is hidden.
       data-tools-offered removes tools entirely; data-tools picks which start shown; the user's choice is then remembered. ---------- */
    (() => {
      const list = v => v == null ? null : String(v).split(',').map(s => s.trim()).filter(Boolean);
      const bar = document.getElementById('benchTools');
      const offered = list(script && script.dataset.toolsOffered), shownDefault = list(script && script.dataset.tools);
      /* opt-in tools (data-optin, for example the periodic table) exist only when the host names them in data-tools-offered or data-tools */
      benchEl.querySelectorAll('.bench-tool').forEach(s => {
        const named = (offered || []).includes(s.dataset.tool) || (shownDefault || []).includes(s.dataset.tool);
        if ((offered && !offered.includes(s.dataset.tool)) || (s.dataset.optin && !named)) s.remove();
      });
      const live = [...benchEl.querySelectorAll('.bench-tool')], saved = benchSaved.tools || {};
      const isShown = s => s.dataset.tool in saved ? !!saved[s.dataset.tool] : (shownDefault ? shownDefault.includes(s.dataset.tool) : true);
      const remember = (s, on) => benchStore({ tools: { ...(benchSaved.tools || {}), [s.dataset.tool]: on } });
      const apply = (s, on) => {
        s.hidden = !on;
        bar.querySelector(`[data-tool="${s.dataset.tool}"]`).hidden = on;
        bar.hidden = live.every(x => !x.hidden);
        if (on && s.dataset.tool === 'notepad') { padState.w = 0; padState.h = 0; padSize(); }
        if (on && s.dataset.tool === 'periodic') periodicInit();
      };
      live.forEach(s => {
        const name = s.dataset.label || s.dataset.tool;
        const x = document.createElement('button'); x.type = 'button'; x.className = 'tool-x'; x.textContent = '×';
        x.title = `Hide the ${name.toLowerCase()}`; x.setAttribute('aria-label', x.title);
        x.addEventListener('click', () => { apply(s, false); remember(s, false); bar.querySelector(`[data-tool="${s.dataset.tool}"]`).focus(); });
        s.querySelector('.bench-h').appendChild(x);
        const b = document.createElement('button'); b.type = 'button'; b.dataset.tool = s.dataset.tool; b.textContent = name;
        b.title = `Show the ${name.toLowerCase()}`;
        b.addEventListener('click', () => { apply(s, true); remember(s, true); x.focus(); });
        bar.appendChild(b);
      });
      live.forEach(s => apply(s, isShown(s)));
    })();

    /* ---------- Sticky notes: managed from the pane, floating over the page. Text is set as values, never as HTML.
       Saved per page in this bench's storage entry as stickies: { color, notes: [{ id, title, text, color, x, y, w, h, visible, min }] }.
       A page that does not offer the tool (data-tools-offered without "stickies") shows no notes at all. ---------- */
    (() => {
      if (!benchEl.querySelector('.bench-tool[data-tool="stickies"]')) return;
      const COLORS = [['Yellow', '#fff176'], ['Pink', '#f8bbd0'], ['Blue', '#b3e5fc'], ['Green', '#c8e6c9'], ['Orange', '#ffcc80'], ['Purple', '#e1bee7']];
      const isHex = h => /^#[0-9a-f]{6}$/i.test(h || '');
      const saved = benchSaved.stickies || {};
      const st = { color: isHex(saved.color) ? saved.color : COLORS[0][1], notes: Array.isArray(saved.notes) ? saved.notes.filter(n => n && n.id) : [] };
      const els = new Map(), listEl = document.getElementById('stList'), colorsEl = document.getElementById('stColors');
      let saveTimer = null;
      const save = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => benchStore({ stickies: { color: st.color, notes: st.notes } }), 250); };
      const shade = (hex, f) => '#' + [0, 2, 4].map(i => Math.max(0, Math.min(255, Math.round(parseInt(hex.substr(1 + i, 2), 16) * f))).toString(16).padStart(2, '0')).join('');
      const paint = (el, c) => { el.style.setProperty('--sc', c); el.style.setProperty('--sc-border', shade(c, 0.72)); };
      const swatches = (current, onPick) => {
        const frag = document.createDocumentFragment();
        COLORS.forEach(([name, c]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'st-sw' + (c === current ? ' on' : ''); b.style.background = c; b.title = name; b.setAttribute('aria-label', name); b.addEventListener('click', () => onPick(c)); frag.appendChild(b); });
        const custom = document.createElement('input'); custom.type = 'color'; custom.className = 'st-custom'; custom.value = current; custom.title = 'Any colour'; custom.setAttribute('aria-label', 'Any colour');
        custom.addEventListener('input', () => onPick(custom.value)); frag.appendChild(custom);
        return frag;
      };
      function drawColors() {
        colorsEl.querySelectorAll('.st-sw, .st-custom').forEach(x => x.remove());
        colorsEl.appendChild(swatches(st.color, c => { st.color = c; save(); drawColors(); }));
      }
      const clampX = x => Math.max(0, Math.min(x, window.innerWidth - 80)), clampY = y => Math.max(0, Math.min(y, window.innerHeight - 44));
      function front(el) { els.forEach(x => { x.style.zIndex = '7'; }); el.style.zIndex = '8'; }
      function mount(n) {
        const el = document.createElement('div');
        el.className = 'sticky' + (n.min ? ' min' : ''); el.dataset.id = n.id; el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Sticky note');
        el.innerHTML = '<div class="sticky-head"><span class="sticky-grip" title="Drag to move"></span><input class="sticky-title" aria-label="Note title" placeholder="Title" maxlength="80">'
          + '<button type="button" class="sticky-b dot" data-n="pal" title="Note colour" aria-label="Note colour"></button><button type="button" class="sticky-b" data-n="min" title="Minimize or expand">–</button>'
          + '<button type="button" class="sticky-b" data-n="hide" title="Hide this note (show it again from the workbench)">×</button></div><div class="st-pal" hidden></div>'
          + '<textarea class="sticky-text" placeholder="Write here..." aria-label="Note text"></textarea>';
        const title = el.querySelector('.sticky-title'), text = el.querySelector('.sticky-text'), pal = el.querySelector('.st-pal');
        title.value = n.title || ''; text.value = n.text || '';
        paint(el, n.color);
        el.style.left = clampX(n.x) + 'px'; el.style.top = clampY(n.y) + 'px';
        if (n.w) el.style.width = n.w + 'px'; if (n.h && !n.min) el.style.height = n.h + 'px';
        el.hidden = !n.visible; el.style.zIndex = '7';
        const repaint = c => { n.color = c; paint(el, c); pal.replaceChildren(swatches(c, repaint)); save(); drawList(); };
        pal.appendChild(swatches(n.color, repaint));
        title.addEventListener('input', () => { n.title = title.value; save(); drawList(); });
        text.addEventListener('input', () => { n.text = text.value; save(); });
        el.addEventListener('pointerdown', () => front(el));
        el.querySelector('.sticky-head').addEventListener('click', e => {
          const b = e.target.closest('[data-n]'); if (!b) return;
          if (b.dataset.n === 'pal') pal.hidden = !pal.hidden;
          if (b.dataset.n === 'min') { n.min = !n.min; el.classList.toggle('min', n.min); el.style.height = n.min ? '' : (n.h || 220) + 'px'; save(); }
          if (b.dataset.n === 'hide') { n.visible = false; el.hidden = true; save(); drawList(); }
        });
        const head = el.querySelector('.sticky-head');
        let drag = null;
        head.addEventListener('pointerdown', e => {
          if (e.target !== head && !e.target.classList.contains('sticky-grip')) return;
          drag = { dx: e.clientX - el.offsetLeft, dy: e.clientY - el.offsetTop }; try { head.setPointerCapture(e.pointerId); } catch (err) { /* synthetic or ended pointer */ } el.classList.add('dragging'); e.preventDefault();
        });
        head.addEventListener('pointermove', e => { if (!drag) return; el.style.left = clampX(e.clientX - drag.dx) + 'px'; el.style.top = clampY(e.clientY - drag.dy) + 'px'; });
        ['pointerup', 'pointercancel'].forEach(t => head.addEventListener(t, () => { if (!drag) return; drag = null; el.classList.remove('dragging'); n.x = el.offsetLeft; n.y = el.offsetTop; save(); }));
        new ResizeObserver(() => { if (n.min || el.hidden) return; const w = el.offsetWidth, h = el.offsetHeight; if (w && h && (w !== n.w || h !== n.h)) { n.w = w; n.h = h; save(); } }).observe(el);
        document.body.appendChild(el); els.set(n.id, el);
        return el;
      }
      function setVisible(n, on) { n.visible = on; const el = els.get(n.id); el.hidden = !on; if (on) front(el); }
      function drawList() {
        listEl.replaceChildren();
        if (!st.notes.length) { const p = document.createElement('li'); p.className = 'st-empty'; p.textContent = 'No notes yet.'; listEl.appendChild(p); return; }
        st.notes.forEach(n => {
          const li = document.createElement('li');
          const dot = document.createElement('span'); dot.className = 'st-dot'; dot.style.background = n.color;
          const name = document.createElement('span'); name.className = 'st-name' + (n.visible ? '' : ' off'); name.textContent = n.title || 'Untitled'; name.title = n.visible ? 'Click to hide' : 'Click to show';
          name.addEventListener('click', () => { setVisible(n, !n.visible); save(); drawList(); });
          const show = document.createElement('button'); show.type = 'button'; show.textContent = n.visible ? 'Hide' : 'Show';
          show.addEventListener('click', () => { setVisible(n, !n.visible); save(); drawList(); });
          const del = document.createElement('button'); del.type = 'button'; del.textContent = 'Delete'; del.title = 'Delete this note';
          del.addEventListener('click', () => {
            if ((n.text || '').trim() && !confirm(`Delete the note "${n.title || 'Untitled'}" and its text? This cannot be undone.`)) return;
            els.get(n.id).remove(); els.delete(n.id); st.notes = st.notes.filter(x => x !== n); save(); drawList();
          });
          li.append(dot, name, show, del); listEl.appendChild(li);
        });
      }
      function arrange() {
        const benchW = benchEl.classList.contains('closed') ? 0 : benchEl.offsetWidth, usable = window.innerWidth - benchW - 40, w = 270, gap = 16;
        const cols = Math.max(1, Math.floor(usable / (w + gap)));
        st.notes.forEach((n, i) => { n.visible = true; n.x = 20 + (i % cols) * (w + gap); n.y = 90 + Math.floor(i / cols) * 70; const el = els.get(n.id); el.hidden = false; el.style.left = n.x + 'px'; el.style.top = clampY(n.y) + 'px'; });
        save(); drawList();
      }
      benchEl.querySelector('.bench-tool[data-tool="stickies"]').addEventListener('click', e => {
        const b = e.target.closest('[data-sact]'); if (!b) return;
        const act = b.dataset.sact;
        if (act === 'new') {
          const i = st.notes.length, n = { id: 'n' + Date.now().toString(36), title: `Note ${i + 1}`, text: '', color: st.color, x: 40 + (i % 6) * 28, y: 110 + (i % 6) * 28, w: 260, h: 220, visible: true, min: false };
          st.notes.push(n); const el = mount(n); front(el); save(); drawList(); el.querySelector('.sticky-text').focus();
        }
        if (act === 'arrange') arrange();
        if (act === 'show-all' || act === 'hide-all') { st.notes.forEach(n => setVisible(n, act === 'show-all')); save(); drawList(); }
      });
      st.notes.forEach(n => { if (!isHex(n.color)) n.color = st.color; mount(n); });
      drawColors(); drawList();
    })();

    benchEl.addEventListener('click', e => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      ({ toggle: benchToggle, 'mode-type': () => padMode('type'), 'mode-draw': () => padMode('draw'), undo: padUndo, clear: padClear, 'clear-all': padClearAll,
         'calc-copy': () => calcCopyNow(a), 'calc-paste': () => calcPasteNow(a),
         'pad-copy': () => { const s0 = padText.selectionStart, e0 = padText.selectionEnd; clipCopy(s0 !== e0 ? padText.value.slice(s0, e0) : padText.value, a); },
         'pad-paste': () => clipPaste(t => { const s0 = padText.selectionStart, e0 = padText.selectionEnd; padText.setRangeText(t, s0, e0, 'end'); padText.dispatchEvent(new Event('input')); return true; }, a) })[a.dataset.act]();
    });
    /* copy / paste helpers: the clipboard API when allowed, a fallback otherwise */
    function flash(btn, txt) { const old = btn.dataset.l || (btn.dataset.l = btn.textContent); btn.textContent = txt; setTimeout(() => { btn.textContent = old; }, 900); }
    function clipCopy(text, btn) {
      const fallback = () => { const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) {} t.remove(); flash(btn, ok ? 'Copied' : 'Blocked'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => flash(btn, 'Copied'), fallback); else fallback();
    }
    function clipPaste(apply, btn) {
      const manual = () => { const t = window.prompt('Paste here (Ctrl+V), then OK:', ''); if (t != null && apply(t) !== false) flash(btn, 'Pasted'); else if (t != null) flash(btn, 'No number'); };
      if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(t => flash(btn, apply(t) !== false ? 'Pasted' : 'No number'), manual); else manual();
    }
    window.Workbench = { open: () => { benchSet(true); benchStore({ open: true }); }, close: () => { benchSet(false); benchStore({ open: false }); }, loadNspire };
})();
