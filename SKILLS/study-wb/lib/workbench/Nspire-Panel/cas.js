/* ==========================================================================
   TI-Nspire/cas.js  -  the computer-algebra engine behind the TI-Nspire CX II CAS-style calculator.
   Pure JavaScript, no DOM. Exact rational arithmetic (BigInt), radicals, polynomials, derivative, integral,
   solve, factor, expand, limit, sum. Used by nspire.js; also usable from Node (see cas.test.js).
   Exposes:  NspireCAS.CAS (engine)   NspireCAS.CASS (session: variables, user functions, commands)
   ========================================================================== */
(function (root) {
    /* ======================================================================
       CAS: a small computer-algebra engine for the Nspire-style mode (pure JS, no DOM).
       Exact rational arithmetic (BigInt), radicals, polynomials, derivative, integral, solve, factor, expand.
       ====================================================================== */
    const CAS = (() => {
      const gcdB = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { const t = a % b; a = b; b = t; } return a; };
      class Q {
        constructor(n, d = 1n) { n = BigInt(n); d = BigInt(d); if (d === 0n) throw new Error('Division by zero'); if (d < 0n) { n = -n; d = -d; } const g = gcdB(n, d) || 1n; this.n = n / g; this.d = d / g; }
        add(o) { return new Q(this.n * o.d + o.n * this.d, this.d * o.d); }
        sub(o) { return new Q(this.n * o.d - o.n * this.d, this.d * o.d); }
        mul(o) { return new Q(this.n * o.n, this.d * o.d); }
        div(o) { return new Q(this.n * o.d, this.d * o.n); }
        neg() { return new Q(-this.n, this.d); }
        isInt() { return this.d === 1n; } isZero() { return this.n === 0n; } isOne() { return this.n === 1n && this.d === 1n; }
        sign() { return this.n < 0n ? -1 : this.n > 0n ? 1 : 0; }
        pow(k) { return k >= 0 ? new Q(this.n ** BigInt(k), this.d ** BigInt(k)) : new Q(this.d ** BigInt(-k), this.n ** BigInt(-k)); }
        num() { return Number(this.n) / Number(this.d); }
        eq(o) { return this.n === o.n && this.d === o.d; }
        cmp(o) { const l = this.n * o.d, r = o.n * this.d; return l < r ? -1 : l > r ? 1 : 0; }
      }
      const isQ = c => c instanceof Q, cn = c => isQ(c) ? c.num() : c;
      const cAdd = (a, b) => isQ(a) && isQ(b) ? a.add(b) : cn(a) + cn(b);
      const cMul = (a, b) => isQ(a) && isQ(b) ? a.mul(b) : cn(a) * cn(b);
      const cZero = c => isQ(c) ? c.isZero() : c === 0, cOne = c => isQ(c) ? c.isOne() : c === 1;
      const N = (q, d) => ({ t: 'N', q: q instanceof Q ? q : new Q(q, d === undefined ? 1n : d) });
      const F = v => ({ t: 'F', v });
      const S = name => ({ t: 'S', name });
      const Add = a => ({ t: '+', a }), Mul = a => ({ t: '*', a }), Pow = (b, e) => ({ t: '^', b, e }), Fn = (name, a) => ({ t: 'f', name, a });
      const ZERO = N(0), ONE = N(1), NEG1 = N(-1), PI = S('π'), E = S('e');
      const cNode = c => isQ(c) ? N(c) : F(c);
      const st = { deg: false };
      const key = x => x.t === 'N' ? x.q.n + '/' + x.q.d : x.t === 'F' ? 'F' + x.v : x.t === 'S' ? x.name : x.t === 'f' ? x.name + '(' + x.a.map(key).join(',') + ')' : x.t === '^' ? '(' + key(x.b) + ')^(' + key(x.e) + ')' : x.t + '[' + x.a.map(key).join(',') + ']';
      const isNum = x => x.t === 'N' || x.t === 'F';
      const numOf = x => x.t === 'N' ? x.q.num() : x.v;

      /* ---- number theory ---- */
      function factorInt(n) {   /* n: positive Number (safe integer) -> Map prime -> exponent */
        const m = new Map(); let k = n;
        for (let p = 2; p * p <= k && p < 3e6; p += p === 2 ? 1 : 2) while (k % p === 0) { m.set(p, (m.get(p) || 0) + 1); k /= p; }
        if (k > 1) m.set(k, (m.get(k) || 0) + 1); return m;
      }
      const safe = b => b >= 0n ? b <= 9007199254740991n : -b <= 9007199254740991n;

      /* ---- simplification ---- */
      function splitCoef(t) {
        if (isNum(t)) return [t.t === 'N' ? t.q : t.v, null];
        if (t.t !== '*') return [new Q(1), t];
        let c = new Q(1); const rest = [];
        for (const f of t.a) { if (isNum(f)) c = cMul(c, f.t === 'N' ? f.q : f.v); else rest.push(f); }
        return [c, rest.length === 1 ? rest[0] : rest.length ? Mul(rest) : null];
      }
      function degOf(n) { return n.t === 'S' ? 1 : n.t === '^' && n.b.t === 'S' && n.e.t === 'N' ? n.e.q.num() : n.t === '*' ? n.a.reduce((s, f) => s + degOf(f), 0) : 0; }
      function simpAdd(ts) {
        const flat = []; for (const t of ts) { if (t.t === '+') flat.push(...t.a); else flat.push(t); }
        let k0 = new Q(0); const map = new Map();
        for (const t of flat) {
          const [c, rest] = splitCoef(t);
          if (rest === null) { k0 = cAdd(k0, c); continue; }
          const kk = key(rest), cur = map.get(kk);
          if (cur) cur.c = cAdd(cur.c, c); else map.set(kk, { c, rest });
        }
        let terms = [...map.values()].filter(e => !cZero(e.c)).map(e => ({ node: cOne(e.c) ? e.rest : simpMul([cNode(e.c), e.rest]), deg: degOf(e.rest), k: key(e.rest), neg: cn(e.c) < 0 ? 1 : 0 }));
        terms.sort((a, b) => b.deg - a.deg || a.neg - b.neg || (a.k < b.k ? -1 : 1));
        const out = terms.map(t => t.node);
        if (!cZero(k0)) out.push(cNode(k0));
        return out.length === 0 ? ZERO : out.length === 1 ? out[0] : Add(out);
      }
      function simpMul(fs) {
        const flat = []; for (const f of fs) { if (f.t === '*') flat.push(...f.a); else flat.push(f); }
        let coef = new Q(1); const map = new Map(), order = [];
        for (const f of flat) {
          if (isNum(f)) { coef = cMul(coef, f.t === 'N' ? f.q : f.v); continue; }
          const b = f.t === '^' ? f.b : f, e = f.t === '^' ? f.e : ONE, kk = key(b), cur = map.get(kk);
          if (cur) cur.e = simpAdd([cur.e, e]); else { map.set(kk, { b, e }); order.push(kk); }
        }
        if (cZero(coef)) return ZERO;
        const parts = [];
        for (const kk of order) {
          const { b, e } = map.get(kk), r = simpPow(b, e);
          if (isNum(r)) coef = cMul(coef, r.t === 'N' ? r.q : r.v);
          else if (r.t === '*') r.a.forEach(z => isNum(z) ? coef = cMul(coef, z.t === 'N' ? z.q : z.v) : parts.push(z));
          else parts.push(r);
        }
        if (cZero(coef)) return ZERO;
        if (!parts.length) return cNode(coef);
        if (parts.length === 1 && parts[0].t === '+' && !cOne(coef)) return simpAdd(parts[0].a.map(t => simpMul([cNode(coef), t])));
        parts.sort((a, b) => degOf(b) - degOf(a) || (key(a) < key(b) ? -1 : 1));
        return cOne(coef) ? (parts.length === 1 ? parts[0] : Mul(parts)) : Mul([cNode(coef), ...parts]);
      }
      function rootOf(q, p, r) {   /* q^(p/r) for a positive rational q, integers p, r>1: returns node or null */
        if (!safe(q.n) || !safe(q.d)) return null;
        const fn = factorInt(Number(q.n)), fd = factorInt(Number(q.d)), all = new Map();
        fn.forEach((k, pr) => all.set(pr, k)); fd.forEach((k, pr) => all.set(pr, (all.get(pr) || 0) - k));
        let outside = new Q(1), inside = 1n;
        for (const [pr, k] of all) {
          const tot = k * p, fl = Math.floor(tot / r), rem = tot - fl * r;
          outside = outside.mul(new Q(pr).pow(fl)); if (rem) inside *= BigInt(pr) ** BigInt(rem);
        }
        if (inside === 1n) return N(outside);
        const rt = Pow(N(new Q(inside)), N(new Q(1, r)));
        return outside.isOne() ? rt : Mul([N(outside), rt]);
      }
      function simpPow(b, e) {
        if (e.t === 'N') {
          if (e.q.isZero()) return ONE; if (e.q.isOne()) return b;
          if (b.t === 'N') {
            if (b.q.isOne()) return ONE;
            if (e.q.isInt()) { const k = Number(e.q.n); if (Math.abs(k) <= 2000 && !(b.q.isZero() && k < 0)) return N(b.q.pow(k)); }
            else if (e.q.d <= 12n && b.q.sign() !== 0) {
              const r = Number(e.q.d), p = Number(e.q.n); let q = b.q, sg = 1;
              if (q.sign() < 0) { if (r % 2 === 0) return Pow(b, e); q = q.neg(); sg = Math.abs(p) % 2 ? -1 : 1; }
              const n = rootOf(q, p, r); if (n) return sg < 0 ? simpMul([NEG1, n]) : n;
            }
          } else if (b.t === 'F') return F(Math.pow(b.v, numOf(e)));
          if (e.q.isInt()) {
            if (b.t === '^') return simpPow(b.b, simpMul([b.e, e]));
            if (b.t === '*') return simpMul(b.a.map(f => simpPow(f, e)));
          }
        } else if (e.t === 'F' && isNum(b)) return F(Math.pow(numOf(b), e.v));
        else if (b.t === 'N' && b.q.isOne()) return ONE;
        if (b.t === 'S' && b.name === 'e' && e.t === 'f' && e.name === 'ln') return e.a[0];
        return Pow(b, e);
      }
      /* exact values of sin at k*pi/12 */
      const SIN12 = ['0', '(sqrt(6)-sqrt(2))/4', '1/2', 'sqrt(2)/2', 'sqrt(3)/2', '(sqrt(6)+sqrt(2))/4', '1'];
      function trigExact(name, arg) {
        let q = null;
        if (arg.t === 'N' && st.deg) q = arg.q.div(new Q(180));
        else if (!st.deg) { if (arg.t === 'N' && arg.q.isZero()) q = new Q(0); else if (arg.t === 'S' && arg.name === 'π') q = new Q(1); else if (arg.t === '*' && arg.a.length === 2 && arg.a[0].t === 'N' && arg.a[1].t === 'S' && arg.a[1].name === 'π') q = arg.a[0].q; }
        if (!q) return null;
        const k12 = q.mul(new Q(12)); if (!k12.isInt()) return null;
        let k = Number(((k12.n % 24n) + 24n) % 24n);
        const sinK = j => { j = ((j % 24) + 24) % 24; const sgn = j > 12 ? -1 : 1; let m = j > 12 ? j - 12 : j; if (m > 6) m = 12 - m; return [sgn, SIN12[m]]; };
        const val = j => { const [sg, s] = sinK(j); const n = simp(parse(s)); return sg < 0 ? simpMul([NEG1, n]) : n; };
        if (name === 'sin') return val(k); if (name === 'cos') return val(k + 6);
        const c = val(k + 6); if (c.t === 'N' && c.q.isZero()) return Fn('undef', []); return simpMul([val(k), simpPow(c, NEG1)]);
      }
      function simpFn(name, a) {
        const x = a[0];
        if (name === 'sqrt') return simpPow(x, N(1, 2));
        if (name === 'exp') return simpPow(E, x);
        if (name === 'ln') { if (x.t === 'N' && x.q.isOne()) return ZERO; if (x.t === 'S' && x.name === 'e') return ONE; if (x.t === '^' && x.b.t === 'S' && x.b.name === 'e') return x.e; if (isNum(x) && numOf(x) > 0 && x.t === 'F') return F(Math.log(x.v)); return Fn('ln', [x]); }
        if (name === 'log') { if (x.t === 'N' && x.q.isOne()) return ZERO; if (x.t === 'N' && x.q.isInt() && x.q.n > 0n && /^10*$/.test(String(x.q.n))) return N(String(x.q.n).length - 1); if (x.t === 'F') return F(Math.log10(x.v)); return Fn('log', [x]); }
        if (name === 'sin' || name === 'cos' || name === 'tan') {
          if (x.t === 'F') return F(({ sin: Math.sin, cos: Math.cos, tan: Math.tan })[name](st.deg ? x.v * Math.PI / 180 : x.v));
          const r = trigExact(name, x); if (r) return r;
          if (x.t === '*' && x.a[0].t === 'N' && x.a[0].q.sign() < 0) { const inner = simp(simpMul([NEG1, x])); const v = simpFn(name, [inner]); return name === 'cos' ? v : simpMul([NEG1, v]); }
          return Fn(name, [x]);
        }
        if (name === 'asin' || name === 'acos' || name === 'atan') {
          if (x.t === 'F') { const v = ({ asin: Math.asin, acos: Math.acos, atan: Math.atan })[name](x.v); return F(st.deg ? v * 180 / Math.PI : v); }
          const TB = { asin: { '0': '0', '1/2': 'π/6', '1': 'π/2', 'sqrt(2)/2': 'π/4', 'sqrt(3)/2': 'π/3' }, atan: { '0': '0', '1': 'π/4', 'sqrt(3)': 'π/3', 'sqrt(3)/3': 'π/6' } };
          if (!st.deg) { const kx = key(x); for (const [src, res] of Object.entries(name === 'acos' ? TB.asin : TB[name] || {})) { if (key(simp(parse(src))) === kx) { const r = simp(parse(res)); return name === 'acos' ? simpAdd([simpMul([N(1, 2), PI]), simpMul([NEG1, r])]) : r; } } }
          return Fn(name, [x]);
        }
        if (['sinh', 'cosh', 'tanh'].includes(name)) return x.t === 'F' ? F(Math[name](x.v)) : x.t === 'N' && x.q.isZero() && name !== 'cosh' ? ZERO : Fn(name, [x]);
        if (name === 'abs') { if (x.t === 'N') return N(x.q.sign() < 0 ? x.q.neg() : x.q); if (x.t === 'F') return F(Math.abs(x.v)); return Fn('abs', [x]); }
        if (name === 'fact') { if (x.t === 'N' && x.q.isInt() && x.q.n >= 0n && x.q.n <= 500n) { let r = 1n; for (let i = 2n; i <= x.q.n; i++) r *= i; return N(new Q(r)); } return Fn('fact', [x]); }
        const ints = a.every(v => v.t === 'N' && v.q.isInt());
        if (ints && ['gcd', 'lcm', 'mod', 'ncr', 'npr'].includes(name)) {
          const [p, q] = a.map(v => v.q.n);
          if (name === 'gcd') return N(new Q(gcdB(p, q))); if (name === 'lcm') return N(new Q(p * q / (gcdB(p, q) || 1n)));
          if (name === 'mod') return N(new Q(((p % q) + q) % q));
          let r = 1n, k = name === 'ncr' ? (q < p - q ? q : p - q) : q; for (let i = 0n; i < k; i++) r = name === 'ncr' ? r * (p - i) / (i + 1n) : r * (p - i); return N(new Q(r));
        }
        if (a.every(isNum) && ['floor', 'ceil', 'round', 'sign', 'min', 'max'].includes(name)) {
          const v = a.map(numOf); const r = ({ floor: () => Math.floor(v[0]), ceil: () => Math.ceil(v[0]), round: () => Math.round(v[0]), sign: () => Math.sign(v[0]), min: () => Math.min(...v), max: () => Math.max(...v) })[name]();
          return x.t === 'N' && Number.isInteger(r) ? N(r) : F(r);
        }
        return Fn(name, a);
      }
      function simp(x) {
        switch (x.t) {
          case '+': return simpAdd(x.a.map(simp));
          case '*': return simpMul(x.a.map(simp));
          case '^': return simpPow(simp(x.b), simp(x.e));
          case 'f': return simpFn(x.name, x.a.map(simp));
          default: return x;
        }
      }

      /* ---- numeric evaluation ---- */
      function num(x, env) {
        switch (x.t) {
          case 'N': return x.q.num(); case 'F': return x.v;
          case 'S': return x.name === 'π' ? Math.PI : x.name === 'e' ? Math.E : env && x.name in env ? env[x.name] : NaN;
          case '+': { let s = 0; for (const t of x.a) s += num(t, env); return s; }
          case '*': { let s = 1; for (const t of x.a) s *= num(t, env); return s; }
          case '^': return x.b.t === 'S' && x.b.name === 'e' ? Math.exp(num(x.e, env)) : Math.pow(num(x.b, env), num(x.e, env));
          case 'f': {
            const v = x.a.map(t => num(t, env)), a = v[0], r = st.deg ? Math.PI / 180 : 1;
            switch (x.name) {
              case 'sin': return Math.sin(a * r); case 'cos': return Math.cos(a * r); case 'tan': return Math.tan(a * r);
              case 'asin': return Math.asin(a) / r; case 'acos': return Math.acos(a) / r; case 'atan': return Math.atan(a) / r;
              case 'sinh': return Math.sinh(a); case 'cosh': return Math.cosh(a); case 'tanh': return Math.tanh(a);
              case 'ln': return Math.log(a); case 'log': return Math.log10(a); case 'sqrt': return Math.sqrt(a); case 'exp': return Math.exp(a); case 'abs': return Math.abs(a);
              case 'floor': return Math.floor(a); case 'ceil': return Math.ceil(a); case 'round': return Math.round(a); case 'sign': return Math.sign(a);
              case 'fact': { if (a < 0 || !Number.isInteger(a) || a > 170) return NaN; let q = 1; for (let i = 2; i <= a; i++) q *= i; return q; }
              case 'min': return Math.min(...v); case 'max': return Math.max(...v); case 'mod': return ((a % v[1]) + v[1]) % v[1];
              default: return NaN;
            }
          }
          default: return NaN;
        }
      }
      const freeVars = (x, set = new Set()) => { if (x.t === 'S' && x.name !== 'π' && x.name !== 'e') set.add(x.name); else if (x.a) x.a.forEach(t => freeVars(t, set)); else if (x.t === '^') { freeVars(x.b, set); freeVars(x.e, set); } return set; };
      const has = (x, v) => freeVars(x).has(v);
      const subst = (x, map) => x.t === 'S' ? (map.has(x.name) ? map.get(x.name) : x) : x.t === '^' ? Pow(subst(x.b, map), subst(x.e, map)) : x.a ? { ...x, a: x.a.map(t => subst(t, map)) } : x;

      /* ---- parsing ---- */
      const FUNCS = new Set(['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'ln', 'log', 'sqrt', 'exp', 'abs', 'floor', 'ceil', 'round', 'sign', 'fact', 'gcd', 'lcm', 'mod', 'ncr', 'npr', 'min', 'max',
        'solve', 'diff', 'd', 'derivative', 'integrate', 'int', 'expand', 'factor', 'simplify', 'approx', 'n', 'limit', 'sum', 'product', 'nsolve']);
      const userFuncs = new Map();
      function tokenize(src) {
        const s = src.replace(/−/g, '-').replace(/[×·]/g, '*').replace(/÷/g, '/').replace(/π/g, ' pi ').replace(/√/g, ' sqrt ').replace(/²/g, '^2').replace(/³/g, '^3').replace(/→/g, '->').replace(/∫/g, ' int ');
        const re = /\s*(?:(\d*\.?\d+(?:E[+-]?\d+)?)|([A-Za-z_][A-Za-z_0-9]*)|(:=|->|[-+*/^(),=!]))/gy, out = []; let m; re.lastIndex = 0;
        while (re.lastIndex < s.length) {
          const at = re.lastIndex; m = re.exec(s);
          if (!m) { if (/^\s*$/.test(s.slice(at))) break; throw new Error('Unexpected "' + s.slice(at).trim()[0] + '"'); }
          out.push(m[1] !== undefined ? { k: 'n', v: m[1] } : m[2] !== undefined ? { k: 'i', v: m[2] } : { k: 'o', v: m[3] });
        }
        return out;
      }
      function parse(src) { return parseTokens(typeof src === 'string' ? tokenize(src) : src); }
      function parseTokens(tk) {
        let p = 0;
        const peek = () => tk[p], eat = () => tk[p++], isOp = v => tk[p] && tk[p].k === 'o' && tk[p].v === v;
        const expect = v => { if (!isOp(v)) throw new Error('Expected ' + v); p++; };
        function startsPrimary() { const t = tk[p]; return t && (t.k === 'n' || t.k === 'i' || (t.k === 'o' && t.v === '(')); }
        function expr() { const l = add(); if (isOp('=')) { p++; return Fn('eq', [l, add()]); } return l; }
        function add() { let l = mul(); while (isOp('+') || isOp('-')) { const o = eat().v; const r = mul(); l = o === '+' ? Add([l, r]) : Add([l, Mul([NEG1, r])]); } return l; }
        function mul() {
          let l = unary();
          for (;;) {
            if (isOp('*') || isOp('/')) { const o = eat().v; const r = unary(); l = o === '*' ? Mul([l, r]) : Mul([l, Pow(r, NEG1)]); }
            else if (startsPrimary()) l = Mul([l, unary()]);
            else return l;
          }
        }
        function unary() { if (isOp('-')) { p++; return Mul([NEG1, unary()]); } if (isOp('+')) { p++; return unary(); } return pow(); }
        function pow() { const b = post(); if (isOp('^')) { p++; return Pow(b, unary()); } return b; }
        function post() { let x = primary(); while (isOp('!')) { p++; x = Fn('fact', [x]); } return x; }
        function primary() {
          const t = eat(); if (!t) throw new Error('Incomplete expression');
          if (t.k === 'n') { return /^\d+$/.test(t.v) ? N(new Q(t.v)) : F(Number(t.v)); }
          if (t.k === 'o' && t.v === '(') { const e = expr(); expect(')'); return e; }
          if (t.k === 'i') {
            const nm = t.v.toLowerCase() === 'pi' ? 'π' : t.v;
            if (nm === 'π') return PI;
            const lname = nm.length > 1 ? nm.toLowerCase() : nm;
            if (nm === 'e') return E;
            if (FUNCS.has(lname) || userFuncs.has(nm)) {
              const fname = userFuncs.has(nm) ? nm : lname;
              if (isOp('(')) { p++; const args = []; if (!isOp(')')) { args.push(expr()); while (isOp(',')) { p++; args.push(expr()); } } expect(')'); return Fn(fname, args); }
              return Fn(fname, [unary()]);
            }
            return S(nm);
          }
          throw new Error('Unexpected "' + t.v + '"');
        }
        const r = expr(); if (p < tk.length) throw new Error('Unexpected "' + tk[p].v + '"'); return r;
      }

      /* ---- printing ---- */
      const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
      function show(x, prec = 0) {
        let s, mine;
        switch (x.t) {
          case 'N': s = x.q.isInt() ? String(x.q.n) : x.q.n + '/' + x.q.d; mine = x.q.isInt() && x.q.n >= 0n ? 9 : x.q.isInt() ? 1 : 2; break;
          case 'F': s = fmtNum(x.v); mine = x.v < 0 ? 1 : 9; break;
          case 'S': s = x.name; mine = 9; break;
          case '+': s = x.a.map((t, i) => { const u = show(t, 1); return i === 0 ? u : u.startsWith('-') ? '−' + u.slice(1) : '+' + u; }).join(''); s = s.replace(/\+/g, ' + ').replace(/−/g, ' − '); mine = 1; break;
          case '*': {
            let c = null, rest = x.a; if (isNum(rest[0])) { c = rest[0]; rest = rest.slice(1); }
            const numer = [], denom = [];
            for (const f of rest) { if (f.t === '^' && f.e.t === 'N' && f.e.q.sign() < 0) denom.push(f.e.q.neg().isOne() ? f.b : Pow(f.b, N(f.e.q.neg()))); else numer.push(f); }
            let cs = '', cd = null;
            if (c && c.t === 'N') { if (c.q.n === -1n && c.q.d === 1n) cs = '-'; else if (!(c.q.n === 1n && c.q.d === 1n)) { cs = (c.q.n < 0n ? '-' : '') + (c.q.n < 0n ? -c.q.n : c.q.n); if (c.q.d !== 1n) cd = String(c.q.d); if (c.q.n === 1n || c.q.n === -1n) cs = c.q.n < 0n ? '-' : ''; } }
            else if (c && c.t === 'F') cs = fmtNum(c.v);
            const body = numer.map(f => show(f, 2)).join('·'), dens = denom.map(f => show(f, 3)).join('·');
            let top = (cs === '-' || cs === '') ? cs + (body || '1') : cs + (body ? '·' + body : '');
            if (cs.endsWith('-') && !body) top = '-1';
            if (cd || dens) { const bottom = [cd, dens].filter(Boolean).join('·'); s = top + '/' + ((denom.length + (cd ? 1 : 0)) > 1 ? '(' + bottom + ')' : bottom); }
            else s = top;
            mine = 2; break;
          }
          case '^': {
            if (x.e.t === 'N' && x.e.q.eq(new Q(1, 2))) { s = '√(' + show(x.b, 0) + ')'; mine = 9; break; }
            if (x.e.t === 'N' && x.e.q.sign() < 0) { const pos = x.e.q.neg(); s = '1/' + show(pos.isOne() ? x.b : Pow(x.b, N(pos)), 3); mine = 2; break; }
            const b = show(x.b, 3), e = x.e;
            if (e.t === 'N' && e.q.isInt() && e.q.n >= 2n && e.q.n <= 9n) s = b + SUP[Number(e.q.n)];
            else s = b + '^' + (e.t === 'N' && e.q.isInt() && e.q.n >= 0n ? show(e, 9) : '(' + show(e, 0) + ')');
            mine = 3; break;
          }
          case 'f': s = (x.name === 'fact' ? 'fact' : x.name) + '(' + x.a.map(t => show(t, 0)).join(', ') + ')'; mine = 9; break;
          default: s = '?'; mine = 9;
        }
        return mine < prec ? '(' + s + ')' : s;
      }
      function fmtNum(v) {
        if (!Number.isFinite(v)) return Number.isNaN(v) ? 'undef' : v > 0 ? '∞' : '-∞';
        let s = Number(v.toPrecision(14)).toString();
        if (/e/.test(s)) s = s.replace(/e\+?/, 'E');
        return s.replace('-', '-');
      }

      /* ---- polynomials in one variable with rational coefficients ---- */
      function toPoly(x, v) {
        if (x.t === 'N') return [x.q];
        if (x.t === 'S') return x.name === v ? [new Q(0), new Q(1)] : null;
        if (x.t === '+') { let r = [new Q(0)]; for (const t of x.a) { const p = toPoly(t, v); if (!p) return null; r = padd(r, p); } return trim(r); }
        if (x.t === '*') { let r = [new Q(1)]; for (const t of x.a) { const p = toPoly(t, v); if (!p) return null; r = pmul(r, p); } return trim(r); }
        if (x.t === '^' && x.e.t === 'N' && x.e.q.isInt() && x.e.q.n >= 0n && x.e.q.n <= 60n) { const p = toPoly(x.b, v); if (!p) return null; let r = [new Q(1)]; for (let i = 0n; i < x.e.q.n; i++) r = pmul(r, p); return trim(r); }
        return null;
      }
      const padd = (a, b) => { const r = []; for (let i = 0; i < Math.max(a.length, b.length); i++) r.push((a[i] || new Q(0)).add(b[i] || new Q(0))); return r; };
      const pmul = (a, b) => { const r = Array.from({ length: a.length + b.length - 1 }, () => new Q(0)); a.forEach((x, i) => b.forEach((y, j) => r[i + j] = r[i + j].add(x.mul(y)))); return r; };
      const trim = p => { while (p.length > 1 && p[p.length - 1].isZero()) p.pop(); return p; };
      const fromPoly = (p, v) => simpAdd(p.map((c, i) => i === 0 ? N(c) : simpMul([N(c), simpPow(S(v), N(i))])));
      function expand(x) {
        switch (x.t) {
          case '+': return simpAdd(x.a.map(expand));
          case '*': { let acc = [ONE]; for (const f of x.a.map(expand)) { const ts = f.t === '+' ? f.a : [f]; acc = acc.flatMap(a => ts.map(t => simpMul([a, t]))); } return simpAdd(acc); }
          case '^': { const b = expand(x.b); if (x.e.t === 'N' && x.e.q.isInt() && x.e.q.n >= 2n && x.e.q.n <= 40n && b.t === '+') { let r = b; for (let i = 1n; i < x.e.q.n; i++) r = expand(Mul([r, b])); return r; } return simpPow(b, x.e); }
          case 'f': return simpFn(x.name, x.a.map(expand));
          default: return x;
        }
      }
      const divisors = n => { const r = []; n = n < 0n ? -n : n; for (let i = 1n; i * i <= n && i < 100000n; i++) if (n % i === 0n) { r.push(i); if (i * i !== n) r.push(n / i); } return r; };
      function pdiv(p, root) {   /* synthetic division of p by (x - root) */
        const out = new Array(p.length - 1); let carry = new Q(0);
        for (let i = p.length - 1; i >= 1; i--) { carry = p[i].add(carry.mul(root)); out[i - 1] = carry; }
        const rem = p[0].add(carry.mul(root)); return { q: out, rem };
      }
      const pval = (p, x) => p.reduceRight((s, c) => s.mul(x).add(c), new Q(0));
      function ratRoots(p) {   /* returns {roots:[Q...], rest: poly} */
        const roots = []; p = p.slice();
        while (p.length > 1 && p[0].isZero()) { roots.push(new Q(0)); p = p.slice(1); }
        let again = p.length > 2;
        while (again && p.length > 1) {
          again = false;
          let den = 1n; p.forEach(c => { den = den * c.d / gcdB(den, c.d); });
          const ip = p.map(c => c.n * (den / c.d)), a0 = ip[0], an = ip[ip.length - 1];
          if (a0 === 0n) break;
          outer: for (const pd of divisors(a0)) for (const qd of divisors(an)) for (const sg of [1n, -1n]) {
            const r = new Q(sg * pd, qd);
            if (pval(p, r).isZero()) { roots.push(r); p = pdiv(p, r).q; again = p.length > 2; break outer; }
          }
        }
        return { roots, rest: p };
      }
      function factorNode(x, v) {
        if (x.t === 'N' && x.q.isInt() && x.q.n > 1n && safe(x.q.n)) { const f = factorInt(Number(x.q.n)); return simpMul([...f].map(([pr, k]) => k === 1 ? N(pr) : Pow(N(pr), N(k)))) && Mul([...f].map(([pr, k]) => k === 1 ? N(pr) : Pow(N(pr), N(k)))); }
        const e = expand(x), p = toPoly(e, v); if (!p || p.length < 2) return e;
        let den = 1n; p.forEach(c => { den = den * c.d / gcdB(den, c.d); });
        let ip = p.map(c => c.n * (den / c.d)), g = 0n; ip.forEach(c => { g = gcdB(g, c); });
        let content = new Q(g, den); if (ip[ip.length - 1] < 0n) content = content.neg();
        let prim = p.map(c => c.div(content));
        const { roots, rest } = ratRoots(prim);
        const groups = new Map(); roots.forEach(r => { const k = r.n + '/' + r.d; groups.set(k, { r, m: (groups.get(k)?.m || 0) + 1 }); });
        const fs = [];
        for (const { r, m } of groups.values()) {
          const lin = r.isZero() ? S(v) : simpAdd([simpMul([N(r.d), S(v)]), N(r.n.valueOf() * -1n)]);   /* (d x - n) */
          let c2 = lin; fs.push(m === 1 ? c2 : Pow(c2, N(m)));
        }
        let lead = content;
        if (rest.length > 1) {
          if (rest.length === 2 && !rest[1].isOne()) { const l = simpMul([N(rest[1]), S(v)]); fs.push(simpAdd([l, N(rest[0])])); }
          else { const pr = rest; const lc = pr[pr.length - 1]; if (!lc.isOne()) { lead = lead.mul(lc); } fs.push(fromPoly(pr.map(c => c.div(lc)), v)); }
        } else if (rest.length === 1) lead = lead.mul(rest[0]);
        /* rational-root linear factors carry their own leading denominators; keep the constant as is */
        const body = fs.length === 1 ? fs[0] : Mul(fs);
        return lead.isOne() ? body : simpMul([N(lead), body]) && Mul([N(lead), ...(body.t === '*' ? body.a : [body])]);
      }

      /* ---- calculus ---- */
      function diff(x, v) {
        switch (x.t) {
          case 'N': case 'F': return ZERO;
          case 'S': return x.name === v ? ONE : ZERO;
          case '+': return simpAdd(x.a.map(t => diff(t, v)));
          case '*': return simpAdd(x.a.map((t, i) => simpMul(x.a.map((u, j) => i === j ? diff(u, v) : u))));
          case '^': {
            if (!has(x.e, v)) return simpMul([x.e, simpPow(x.b, simpAdd([x.e, NEG1])), diff(x.b, v)]);
            if (!has(x.b, v)) return simpMul([x, Fn('ln', [x.b]), diff(x.e, v)]);
            return simpMul([x, simpAdd([simpMul([diff(x.e, v), Fn('ln', [x.b])]), simpMul([x.e, diff(x.b, v), simpPow(x.b, NEG1)])])]);
          }
          case 'f': {
            const u = x.a[0], du = diff(u, v);
            const D = { sin: Fn('cos', [u]), cos: simpMul([NEG1, Fn('sin', [u])]), tan: simpPow(Fn('cos', [u]), N(-2)), ln: simpPow(u, NEG1), log: simpMul([simpPow(u, NEG1), simpPow(Fn('ln', [N(10)]), NEG1)]),
              asin: simpPow(simpAdd([ONE, simpMul([NEG1, simpPow(u, N(2))])]), N(-1, 2)), acos: simpMul([NEG1, simpPow(simpAdd([ONE, simpMul([NEG1, simpPow(u, N(2))])]), N(-1, 2))]), atan: simpPow(simpAdd([ONE, simpPow(u, N(2))]), NEG1),
              sinh: Fn('cosh', [u]), cosh: Fn('sinh', [u]), tanh: simpPow(Fn('cosh', [u]), N(-2)), abs: simpMul([u, simpPow(Fn('abs', [u]), NEG1)]) }[x.name];
            if (!D) throw new Error('Cannot differentiate ' + x.name);
            return simpMul([D, du]);
          }
        }
        throw new Error('Cannot differentiate');
      }
      function linear(u, v) { const p = toPoly(expand(u), v); return p && p.length === 2 ? { a: p[1], b: p[0] } : null; }
      function integTerm(t, v) {
        const [c0, rest] = splitCoef(t); let coef = [cNode(c0)], factors = rest ? (rest.t === '*' ? rest.a : [rest]) : [];
        const free = factors.filter(f => !has(f, v)), dep = factors.filter(f => has(f, v)); coef.push(...free);
        const C = simpMul(coef); let r;
        if (!dep.length) r = simpMul([C, S(v)]);
        else if (dep.length === 1) {
          const g = dep[0], vx = S(v);
          if (g.t === 'S') r = simpMul([N(1, 2), simpPow(vx, N(2))]);
          else if (g.t === '^' && g.e.t === 'N') {
            const lin = linear(g.b, v); if (!lin) return null; const n = g.e.q;
            r = n.eq(new Q(-1)) ? simpMul([simpPow(lin.a.isOne() ? ONE : N(lin.a), NEG1), Fn('ln', [Fn('abs', [g.b])])]) : simpMul([simpPow(N(lin.a), NEG1), simpPow(g.b, N(n.add(new Q(1)))), N(new Q(1).div(n.add(new Q(1))))]);
            if (g.b.t === '+' && n.eq(new Q(-1)) && false) r = null;
            /* 1/(1+x^2) and 1/sqrt(1-x^2) */
            if (g.e.q.eq(new Q(-1)) && g.b.t === '+' && key(g.b) === key(simpAdd([ONE, simpPow(vx, N(2))]))) r = Fn('atan', [vx]);
            if (g.e.q.eq(new Q(-1, 2)) && g.b.t === '+' && key(g.b) === key(simpAdd([ONE, simpMul([NEG1, simpPow(vx, N(2))])]))) r = Fn('asin', [vx]);
          } else if (g.t === '^' && g.b.t === 'S' && g.b.name === 'e') { const lin = linear(g.e, v); if (!lin) return null; r = simpMul([simpPow(N(lin.a), NEG1), g]); }
          else if (g.t === 'f' && ['sin', 'cos', 'tan'].includes(g.name)) {
            const lin = linear(g.a[0], v); if (!lin) return null, null; const u = g.a[0], ia = simpPow(N(lin.a), NEG1);
            r = g.name === 'sin' ? simpMul([NEG1, ia, Fn('cos', [u])]) : g.name === 'cos' ? simpMul([ia, Fn('sin', [u])]) : simpMul([NEG1, ia, Fn('ln', [Fn('abs', [Fn('cos', [u])])])]);
          } else if (g.t === 'f' && g.name === 'ln' && key(g.a[0]) === key(vx)) r = simpAdd([simpMul([vx, Fn('ln', [vx])]), simpMul([NEG1, vx])]);
          else return null;
          if (r) r = simpMul([C, r]);
        } else return null;
        return r;
      }
      function integrate(x, v) {
        const e = expand(x), terms = e.t === '+' ? e.a : [e], out = [];
        for (const t of terms) { const r = integTerm(t, v); if (!r) return null; out.push(r); }
        return simpAdd(out);
      }
      const nsimpson = (f, a, b, n = 2000) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; };
      const compile = (node, v) => (xv => num(node, { [v]: xv }));

      /* ---- solving ---- */
      function numericRoots(f, lo = -50, hi = 50) {
        const roots = [], steps = 20000, h = (hi - lo) / steps; let px = lo, pf = f(lo);
        const push = r => { if (!roots.some(q => Math.abs(q - r) < 1e-7)) roots.push(r); };
        for (let i = 1; i <= steps; i++) {
          const x = lo + i * h, fx = f(x);
          if (Number.isFinite(pf) && Number.isFinite(fx)) {
            if (pf === 0) push(px);
            else if (pf * fx < 0) { let a = px, b = x, fa = pf; for (let k = 0; k < 100; k++) { const m = (a + b) / 2, fm = f(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } } const r = (a + b) / 2; if (Math.abs(f(r)) < 1e-6 * Math.max(1, Math.abs(pf), Math.abs(fx))) push(r); }
          }
          px = x; pf = fx;
        }
        return roots.map(r => Math.abs(r) < 1e-12 ? 0 : r).sort((a, b) => a - b);
      }
      function solve(eq, v) {   /* returns {list: nodes, exact: bool} */
        const lhs = eq.t === 'f' && eq.name === 'eq' ? simpAdd([eq.a[0], simpMul([NEG1, eq.a[1]])]) : eq;
        const e = expand(lhs), p = toPoly(e, v);
        if (p) {
          if (p.length === 1) return { list: [], all: p[0].isZero(), exact: true };
          const { roots, rest } = ratRoots(p), list = []; const seen = new Set();
          roots.forEach(r => { const k = r.n + '/' + r.d; if (!seen.has(k)) { seen.add(k); list.push(N(r)); } });
          if (rest.length === 2) list.push(N(rest[0].neg().div(rest[1])));
          else if (rest.length === 3) {
            const [c, b, a] = rest, D = b.mul(b).sub(new Q(4).mul(a).mul(c));
            if (D.sign() >= 0) { const sq = simpPow(N(D), N(1, 2)), den = N(new Q(2).mul(a)); [1, -1].forEach(sg => list.push(simpMul([simpAdd([N(b.neg()), sg > 0 ? sq : simpMul([NEG1, sq])]), simpPow(den, NEG1)]))); }
          } else if (rest.length > 3) { const nf = compile(fromPoly(rest, v), v); numericRoots(nf).forEach(r => list.push(F(r))); return { list: dedupe(list), exact: false }; }
          return { list: dedupe(list).sort((a, b) => num(a) - num(b)), exact: true };
        }
        const f = compile(e, v); return { list: numericRoots(f).map(F), exact: false };
      }
      const dedupe = l => { const seen = new Set(); return l.filter(n => { const k = key(n); if (seen.has(k)) return false; seen.add(k); return true; }); };

      return { Q, N, F, S, Add, Mul, Pow, Fn, ZERO, ONE, PI, E, st, simp, expand, factorNode, num, show, fmtNum, key, has, freeVars, subst, diff, integrate, integTerm, solve, parse, tokenize, compile, nsimpson, numericRoots, userFuncs, toPoly, isNum, FUNCS };
    })();

    /* ---- session: variables, functions, commands, result formatting ---- */
    const CASS = (() => {
      const C = CAS, vars = new Map();
      let ans = C.ZERO;
      function sub(node, depth = 0) {   /* substitute stored variables and user functions, then simplify */
        if (depth > 20) throw new Error('Circular definition');
        const walk = x => {
          if (x.t === 'S') return vars.has(x.name) ? sub(vars.get(x.name), depth + 1) : x.name === 'ans' ? ans : x;
          if (x.t === '^') return C.Pow(walk(x.b), walk(x.e));
          if (x.t === 'f' && C.userFuncs.has(x.name)) { const f = C.userFuncs.get(x.name), m = new Map(); f.params.forEach((pn, i) => m.set(pn, walk(x.a[i] || C.S(pn)))); return walk(C.subst(f.body, m)); }
          if (x.t === 'f' && CMD.has(x.name)) return x;
          return x.a ? { ...x, a: x.a.map(walk) } : x;
        };
        return walk(node);
      }
      const CMD = new Set(['solve', 'diff', 'd', 'derivative', 'integrate', 'int', 'expand', 'factor', 'simplify', 'approx', 'n', 'limit', 'sum', 'product', 'nsolve', 'eq']);
      const varOf = (arg, def = 'x') => arg && arg.t === 'S' ? arg.name : def;
      function evalNode(x) {   /* resolves commands; returns {node} or {list,var,exact} */
        if (x.t === 'f' && CMD.has(x.name)) return command(x);
        const y = sub(x); return { node: C.simp(resolveCmds(y)) };
      }
      function resolveCmds(x) {
        if (x.t === 'f' && CMD.has(x.name) && x.name !== 'eq') { const r = command(x); if (r.node) return r.node; throw new Error('Use ' + x.name + ' on its own line'); }
        if (x.t === '^') return C.Pow(resolveCmds(x.b), resolveCmds(x.e));
        return x.a ? { ...x, a: x.a.map(resolveCmds) } : x;
      }
      function command(x) {
        const nm = x.name, a = x.a, arg0 = () => C.simp(resolveCmds(sub(a[0])));
        if (nm === 'eq') return { node: x };
        if (nm === 'expand') return { node: C.expand(arg0()), noApprox: true };
        if (nm === 'simplify') return { node: arg0() };
        if (nm === 'approx' || nm === 'n') { const v = C.num(arg0()); return { node: C.F(v), approx: true }; }
        if (nm === 'factor') { const e = arg0(), vs = [...C.freeVars(e)]; return { node: C.factorNode(e, vs.includes('x') ? 'x' : vs[0] || 'x'), noApprox: true }; }
        if (nm === 'diff' || nm === 'd' || nm === 'derivative') {
          const v = varOf(a[1]), order = a[2] ? Number(a[2].q ? a[2].q.n : 1) : 1; let e = arg0();
          for (let i = 0; i < order; i++) e = C.simp(C.diff(e, v)); return { node: e };
        }
        if (nm === 'integrate' || nm === 'int') {
          const e = arg0(), v = varOf(a[1]);
          const F = C.integrate(e, v);
          if (a.length >= 4) {
            const lo = C.simp(resolveCmds(sub(a[2]))), hi = C.simp(resolveCmds(sub(a[3])));
            if (F) { const m1 = new Map([[v, hi]]), m0 = new Map([[v, lo]]); return { node: C.simp(C.Add([C.subst(F, m1), C.Mul([C.N(-1), C.subst(F, m0)])])) }; }
            const f = C.compile(e, v); return { node: C.F(C.nsimpson(f, C.num(lo), C.num(hi))), approx: true };
          }
          if (!F) throw new Error('No closed form found for this integral');
          return { node: F };
        }
        if (nm === 'solve' || nm === 'nsolve') {
          const eq = C.simp(resolveCmds(sub(a[0]))), eqq = a[0].t === 'f' && a[0].name === 'eq' ? C.Fn('eq', [C.simp(sub(a[0].a[0])), C.simp(sub(a[0].a[1]))]) : eq;
          const vs = C.freeVars(eqq.t === 'f' && eqq.name === 'eq' ? C.Add([eqq.a[0], eqq.a[1]]) : eqq), v = a[1] ? varOf(a[1]) : vs.has('x') ? 'x' : [...vs][0] || 'x';
          const r = C.solve(eqq, v); return { list: r.list, v, exact: r.exact, all: r.all };
        }
        if (nm === 'sum' || nm === 'product') {
          const e = C.simp(resolveCmds(sub(a[0]))), k = varOf(a[1], 'k'), lo = Math.round(C.num(C.simp(sub(a[2])))), hi = Math.round(C.num(C.simp(sub(a[3]))));
          if (hi - lo > 100000) throw new Error('Range too large');
          let acc = nm === 'sum' ? C.ZERO : C.ONE;
          for (let i = lo; i <= hi; i++) { const t = C.simp(C.subst(e, new Map([[k, C.N(i)]]))); acc = C.simp(nm === 'sum' ? C.Add([acc, t]) : C.Mul([acc, t])); }
          return { node: acc };
        }
        if (nm === 'limit') {
          const e = C.simp(resolveCmds(sub(a[0]))), v = varOf(a[1]), at = C.num(C.simp(sub(a[2]))), f = C.compile(e, v);
          const lr = [1e-4, 1e-6, 1e-8].map(h => f(at + h)), ll = [1e-4, 1e-6, 1e-8].map(h => f(at - h)), L = lr[2], R = ll[2];
          if (!Number.isFinite(L) || !Number.isFinite(R) || Math.abs(L - R) > 1e-4 * Math.max(1, Math.abs(L))) return { node: C.Fn('undef', []) };
          const val = (L + R) / 2, r = Math.round(val); return { node: Math.abs(val - r) < 1e-5 ? C.N(r) : C.F(val), approx: true };
        }
        throw new Error('Unknown command ' + nm);
      }
      /* run one input line: returns {lines:[{text, approx}], ...} */
      function run(src) {
        const tk = C.tokenize(src);
        const di = tk.findIndex(t => t.k === 'o' && t.v === ':='), ai = tk.map(t => t.k === 'o' && t.v === '->').lastIndexOf(true);
        if (di > 0) {   /* name := expr   or   f(x) := expr */
          const lhs = tk.slice(0, di), rhs = tk.slice(di + 1), name = lhs[0].v;
          if (lhs.length === 1) { const val = C.simp(sub(C.parse(rhs))); vars.set(name, val); return { lines: [{ text: C.show(val) }], note: 'stored ' + name }; }
          const params = lhs.filter(t => t.k === 'i').slice(1).map(t => t.v); C.userFuncs.set(name, { params, body: C.parse(rhs) }); return { lines: [{ text: 'Done' }], note: 'defined ' + name };
        }
        if (ai > 0) { const name = tk[ai + 1] && tk[ai + 1].v; const val = C.simp(sub(C.parse(tk.slice(0, ai)))); vars.set(name, val); return { lines: [{ text: C.show(val) }], note: 'stored ' + name }; }
        const res = evalNode(C.parse(tk));
        return format(res);
      }
      function approxOf(node) { if (C.freeVars(node).size) return null; const v = C.num(node); return Number.isFinite(v) ? v : null; }
      function format(res) {
        if (res.list) {
          if (res.all) return { lines: [{ text: res.v + ' = any real number' }] };
          if (!res.list.length) return { lines: [{ text: 'No real solution' }] };
          const lines = res.list.map(n => { const ap = n.t === 'F' || n.t === 'N' ? null : approxOf(n); return { text: res.v + ' = ' + C.show(n), approx: ap !== null ? C.fmtNum(ap) : null }; });
          return { lines, note: res.exact ? '' : 'numeric solutions in [-50, 50]' };
        }
        const n = res.node; ans = n;
        if (n.t === 'f' && n.name === 'undef') return { lines: [{ text: 'undef' }] };
        const ap = res.approx || res.noApprox || n.t === 'N' || n.t === 'F' ? null : approxOf(n), txt = C.show(n);
        return { lines: [{ text: txt, approx: ap !== null && txt !== C.fmtNum(ap) ? C.fmtNum(ap) : null }], node: n };
      }
      return { run, vars, reset() { vars.clear(); C.userFuncs.clear(); ans = C.ZERO; }, sub, evalNode, get ans() { return ans; } };
    })();


  const api = { CAS, CASS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.NspireCAS = api;
})(typeof window !== 'undefined' ? window : globalThis);
