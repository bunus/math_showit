/* ============================================================
   必修第一册 · 第 4 章 指数函数与对数函数
   ============================================================ */
(function () {

/* ---------- 公用 ---------- */
function clampA(a, hi) {
  a = clamp(a, .1, hi || 4.5);
  if (Math.abs(a - 1) < .06) a = a < 1 ? .94 : 1.06;
  return a;
}

function plot(f, color, opt) {
  opt = opt || {};
  const L = lim(), N = 420;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = opt.w || 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (opt.dash) ctx.setLineDash(opt.dash);
  if (opt.glow) { ctx.shadowColor = color; ctx.shadowBlur = opt.glow; }
  ctx.beginPath();
  let on = false;
  for (let i = 0; i <= N; i++) {
    const x = L.x0 + (L.x1 - L.x0) * i / N;
    let y = NaN;
    try { y = f(x); } catch (e) { y = NaN; }
    if (!isFinite(y) || Math.abs(y) > 400) { on = false; continue; }
    if (!on) { ctx.moveTo(X(x), Y(y)); on = true; }
    else ctx.lineTo(X(x), Y(y));
  }
  ctx.stroke();
  ctx.restore();
}

function axes() {
  const L = lim();
  line({x: L.x0, y: 0}, {x: L.x1, y: 0}, 'rgba(190,215,230,.30)', {w: 1.2});
  line({x: 0, y: L.y0}, {x: 0, y: L.y1}, 'rgba(190,215,230,.30)', {w: 1.2});
  arrow({x: L.x1 - 1, y: 0}, {x: L.x1, y: 0}, 'rgba(190,215,230,.45)', {w: 1.2, head: 8});
  arrow({x: 0, y: L.y1 - .8}, {x: 0, y: L.y1}, 'rgba(190,215,230,.45)', {w: 1.2, head: 8});
  math('x', X(L.x1) - 12, Y(0) + 15, 'rgba(175,205,220,.6)', 13);
  math('y', X(0) + 15, Y(L.y1) + 6, 'rgba(175,205,220,.6)', 13);
}

function legend(items, sx, sy) {
  items.forEach((it, i) => {
    const y = sy + i * 20;
    ctx.save();
    ctx.strokeStyle = it.c; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx + 18, y); ctx.stroke();
    ctx.restore();
    sans(it.t, sx + 26, y, it.c, 11.5, 'left');
  });
}

const SUP = {'0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', '+': '⁺'};
const SUB = {'0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', 'a': 'ₐ'};
const sup = n => String(n).split('').map(c => SUP[c] || c).join('');
const sub = n => String(n).split('').map(c => SUB[c] || c).join('');

/* ---------- 01 指数函数 ---------- */
MODULES.push({
  key: 'exp', tab: '01', name: '指数函数', en: 'EXPONENTIAL', blurb: 'y = aˣ 的图象',
  accent: '#6cb6ff', rgb: '108,182,255',
  hint: '拖动圆点上下移动，或滑动滑块改变底数 a',
  state: {a: 2, mirror: false},
  reset() { this.state.a = 2; this.state.mirror = false; },
  meta() {
    return {
      title: '指数函数 y = aˣ 的图象',
      desc: '底数 a 决定图象的走向：a &gt; 1 时曲线从左向右上升，0 &lt; a &lt; 1 时下降。无论 a 取何值，图象都经过定点 (0, 1)，值域恒为 (0, +∞)，x 轴是它的水平渐近线。拖动圆点或滑动滑块，观察曲线随底数变化而翻转。',
      formula: 'y = a<sup>x</sup>　(a &gt; 0, a ≠ 1)',
      note: 'a 越大，y 轴右侧的曲线越陡；<span class="nw">0 &lt; a &lt; 1</span> 的图象与 <span class="nw">a &gt; 1</span> 的图象关于 y 轴对称。底数不能等于 1，否则退化为常函数 y = 1。'
    };
  },
  handles() { return [{id: 'a', x: 1, y: this.state.a}]; },
  drag(id, p) {
    const q = clampPt(p);
    const a = clampA(q.y, 3.5);
    this.state.a = a;
    if (this._sl) this._sl.set(+a.toFixed(2));
  },
  draw() {
    setFrame(.5, .52, 12);
    base();
    axes();
    const s = this.state, L = lim(), a = s.a, inc = a > 1;

    line({x: L.x0, y: 0}, {x: L.x1, y: 0}, 'rgba(255,197,107,.30)', {w: 1, dash: [6, 6]});
    if (s.mirror) plot(x => Math.pow(1 / a, x), 'rgba(200,215,230,.55)', {w: 1.6, dash: [6, 5]});
    plot(x => Math.pow(a, x), '#6cb6ff', {w: 2.6, glow: 10});

    dot({x: 0, y: 1}, '#ffc56b', 5);
    sans('(0, 1)', X(0) + 34, Y(1) - 12, '#ffd99a', 11);

    line({x: 0, y: a}, {x: 1, y: a}, 'rgba(108,182,255,.38)', {w: 1, dash: [4, 4]});
    line({x: 1, y: 0}, {x: 1, y: a}, 'rgba(108,182,255,.38)', {w: 1, dash: [4, 4]});
    dot({x: 1, y: a}, '#6cb6ff', 4);
    handle({x: 1, y: a}, '#6cb6ff', hoverId === 'a');
    math('a', X(1) - 16, Y(a / 2), '#9ecbff', 14);

    sans('a = ' + a.toFixed(2), X(L.x1 - .2), Y(L.y1 - .45), '#9ecbff', 12, 'right');
    sans(inc ? '在 R 上单调递增' : '在 R 上单调递减',
      X(L.x1 - .2), Y(L.y1 - 1.05), inc ? '#8ff5e4' : '#ffb3c6', 12, 'right');
    sans('x 轴：水平渐近线 y = 0', X(L.x0 + .2), Y(-.45), 'rgba(255,210,150,.6)', 10.5, 'left');
  },
  hud() {
    const a = this.state.a;
    return [
      {k: '底数 a', v: fmt(a, 2), hi: true},
      {k: '定点', v: '(0, 1)'},
      {k: '值域', v: '(0, +∞)'},
      {k: '单调性', v: a > 1 ? '增函数' : '减函数', hi: true}
    ];
  },
  panel(el) {
    const s = this.state;
    this._sl = addSlider(el, '底数 a', .1, 3.5, .05, s.a, v => (+v).toFixed(2), v => {
      const c = clampA(v, 3.5);
      s.a = c;
      if (Math.abs(c - v) > 1e-9) this._sl.set(+c.toFixed(2));
    });
    addToggle(el, '显示 y = (1/a)ˣ 的对称图象', s.mirror, v => s.mirror = v);
    const r = row(el);
    addBtn(r, 'a = 0.5', () => { s.a = .5; this._sl.set(.5); }, 'ghost');
    addBtn(r, 'a = 2', () => { s.a = 2; this._sl.set(2); }, 'ghost');
  }
});

/* ---------- 02 对数函数 ---------- */
MODULES.push({
  key: 'log', tab: '02', name: '对数函数', en: 'LOGARITHM', blurb: 'y = logₐx 的图象',
  accent: '#5eead4', rgb: '94,234,212',
  hint: '拖动圆点左右移动，改变底数 a',
  state: {a: 2},
  reset() { this.state.a = 2; },
  meta() {
    return {
      title: '对数函数 y = logₐx 的图象',
      desc: '对数函数与指数函数互为反函数，所以它的定义域是 (0, +∞)，值域是全体实数 R，图象恒过定点 (1, 0)，y 轴是它的竖直渐近线。底数 a &gt; 1 时函数递增，0 &lt; a &lt; 1 时递减；拖动圆点左右移动即可切换底数。',
      formula: 'y = log<sub>a</sub>x　(a &gt; 0, a ≠ 1, x &gt; 0)',
      note: '圆点取在 <span class="nw">(a, 1)</span> 处：因为 <span class="nw">log<sub>a</sub>a = 1</span>，无论底数怎么变，这个点始终在图象上。a 越大，x &gt; 1 的部分越平缓。'
    };
  },
  handles() { return [{id: 'a', x: this.state.a, y: 1}]; },
  drag(id, p) {
    const q = clampPt(p);
    const a = clampA(q.x);
    this.state.a = a;
    if (this._sl) this._sl.set(+a.toFixed(2));
  },
  draw() {
    setFrame(.5, .55, 12);
    base();
    ctx.save();
    ctx.fillStyle = 'rgba(255,143,171,.06)';
    ctx.fillRect(0, 0, X(0), H);
    ctx.restore();
    axes();
    const s = this.state, L = lim(), a = s.a, inc = a > 1;

    line({x: 0, y: L.y0}, {x: 0, y: L.y1}, 'rgba(255,197,107,.34)', {w: 1, dash: [6, 6]});
    plot(x => x > 0 ? Math.log(x) / Math.log(a) : NaN, '#5eead4', {w: 2.6, glow: 10});

    dot({x: 1, y: 0}, '#ffc56b', 5);
    sans('(1, 0)', X(1) + 32, Y(0) - 13, '#ffd99a', 11);

    line({x: a, y: 0}, {x: a, y: 1}, 'rgba(94,234,212,.38)', {w: 1, dash: [4, 4]});
    line({x: a, y: 1}, {x: 0, y: 1}, 'rgba(94,234,212,.38)', {w: 1, dash: [4, 4]});
    dot({x: a, y: 1}, '#5eead4', 4);
    handle({x: a, y: 1}, '#5eead4', hoverId === 'a');
    math('a', X(a) + 8, Y(0) - 20, '#8ff5e4', 14);

    sans('a = ' + a.toFixed(2), X(L.x1 - .2), Y(L.y1 - .45), '#8ff5e4', 12, 'right');
    sans(inc ? '在 (0, +∞) 上单调递增' : '在 (0, +∞) 上单调递减',
      X(L.x1 - .2), Y(L.y1 - 1.05), inc ? '#8ff5e4' : '#ffb3c6', 12, 'right');
    sans('x ≤ 0 处无定义', X(-3.6), Y(L.y1 - .55), 'rgba(255,143,171,.55)', 10.5);
  },
  hud() {
    const a = this.state.a;
    return [
      {k: '底数 a', v: fmt(a, 2), hi: true},
      {k: '定义域', v: '(0, +∞)'},
      {k: '定点', v: '(1, 0)'},
      {k: '值域', v: 'R'},
      {k: '单调性', v: a > 1 ? '增函数' : '减函数', hi: true}
    ];
  },
  panel(el) {
    const s = this.state;
    this._sl = addSlider(el, '底数 a', .1, 4.5, .05, s.a, v => (+v).toFixed(2), v => {
      const c = clampA(v);
      s.a = c;
      if (Math.abs(c - v) > 1e-9) this._sl.set(+c.toFixed(2));
    });
    const r = row(el);
    addBtn(r, 'a = 0.5', () => { s.a = .5; this._sl.set(.5); }, 'ghost');
    addBtn(r, 'a = 2', () => { s.a = 2; this._sl.set(2); }, 'ghost');
    addBtn(r, 'a = 3', () => { s.a = 3; this._sl.set(3); }, 'ghost');
  }
});

/* ---------- 03 互为反函数 ---------- */
MODULES.push({
  key: 'inverse', tab: '03', name: '互为反函数', en: 'INVERSE', blurb: '关于 y = x 对称',
  accent: '#b49cff', rgb: '180,156,255',
  hint: '拖动曲线上的点 P，看它的对称点 P′ 落在哪里',
  state: {a: 2, t: 1.6, showLink: true},
  reset() { this.state.a = 2; this.state.t = 1.6; this.state.showLink = true; },
  meta() {
    return {
      title: '指数函数与对数函数互为反函数',
      desc: '在同一坐标系中作出 y = aˣ 与 y = logₐx，两条曲线关于直线 y = x 对称。拖动曲线上的点 P，它的对应点 P′ 始终落在另一条曲线上：两点连线与 y = x 垂直，中点在 y = x 上，且 |OP| = |OP′|。',
      formula: 'y = a<sup>x</sup> ⇔ x = log<sub>a</sub>y',
      note: '把图象沿 y = x 翻折，指数曲线就变成对数曲线。所以定义域与值域互换：<span class="nw">y = aˣ</span> 的定点 (0, 1) 对应 <span class="nw">y = logₐx</span> 的定点 (1, 0)。'
    };
  },
  tnow() {
    const L = lim(), a = this.state.a, la = Math.log(a);
    const M = Math.min(L.y1, L.x1) - .4;
    const c1 = Math.log(M) / la, c2 = Math.log(.12) / la;
    let lo = Math.max(Math.min(c1, c2), L.x0 + .5, L.y0 + .5);
    let hi = Math.min(Math.max(c1, c2), L.x1 - .5, L.y1 - .5);
    if (!(hi > lo)) hi = lo + .2;
    return clamp(this.state.t, lo, hi);
  },
  handles() {
    const t = this.tnow();
    return [{id: 'P', x: t, y: Math.pow(this.state.a, t)}];
  },
  drag(id, p) {
    const q = clampPt(p);
    this.state.t = q.x;
  },
  draw() {
    setFrame(.5, .5, 13);
    base();
    const s = this.state, L = lim(), a = s.a;
    const t = this.tnow(), v = Math.pow(a, t);
    const P = {x: t, y: v}, Q = {x: v, y: t};
    const m = {x: (t + v) / 2, y: (t + v) / 2};

    const lo = Math.max(L.x0, L.y0), hi = Math.min(L.x1, L.y1);
    axes();
    line({x: lo, y: lo}, {x: hi, y: hi}, 'rgba(200,215,230,.45)', {w: 1.4, dash: [7, 6]});
    sans('y = x', X(hi) - 6, Y(hi) + 16, 'rgba(200,215,230,.7)', 11.5, 'right');

    plot(x => Math.pow(a, x), '#b49cff', {w: 2.6, glow: 10});
    plot(x => x > 0 ? Math.log(x) / Math.log(a) : NaN, '#5eead4', {w: 2.6, glow: 10});

    if (s.showLink) {
      line(P, Q, 'rgba(255,197,107,.65)', {w: 1.4, dash: [5, 5]});
      dot(m, '#ffc56b', 4);
      rightAngleOnLine(m);
      sans('中点', X(m.x) + 18, Y(m.y) - 14, 'rgba(255,210,150,.85)', 10);
    }

    dot(P, '#b49cff', 5);
    dot(Q, '#5eead4', 5);
    handle(P, '#b49cff', hoverId === 'P');
    math('P', X(P.x) - 16, Y(P.y) + 14, '#c9b8ff', 15);
    math('P′', X(Q.x) + 16, Y(Q.y) + 6, '#8ff5e4', 15);

    line({x: t, y: 0}, {x: t, y: v}, 'rgba(180,156,255,.28)', {w: 1, dash: [3, 4]});
    line({x: 0, y: t}, {x: v, y: t}, 'rgba(94,234,212,.28)', {w: 1, dash: [3, 4]});

    legend([
      {t: 'y = aˣ', c: '#b49cff'},
      {t: 'y = logₐx', c: '#5eead4'},
      {t: 'y = x', c: 'rgba(200,215,230,.7)'}
    ], 18, 24);
    sans('a = ' + a.toFixed(2), X(L.x1 - .2), Y(L.y1 - .45), '#c9b8ff', 12, 'right');
  },
  hud() {
    const a = this.state.a, t = this.tnow(), v = Math.pow(a, t);
    return [
      {k: '底数 a', v: fmt(a, 2)},
      {k: 'P', v: '(' + fmt(t, 2) + ', ' + fmt(v, 2) + ')', hi: true},
      {k: 'P′', v: '(' + fmt(v, 2) + ', ' + fmt(t, 2) + ')', hi: true},
      {k: '|OP| = |OP′|', v: fmt(Math.hypot(t, v), 2)}
    ];
  },
  panel(el) {
    const s = this.state;
    this._sl = addSlider(el, '底数 a', .4, 4, .05, s.a, v => (+v).toFixed(2), v => {
      const c = clampA(v);
      s.a = c;
      if (Math.abs(c - v) > 1e-9) this._sl.set(+c.toFixed(2));
    });
    addToggle(el, '显示 P 与 P′ 的连线', s.showLink, v => s.showLink = v);
    const r = row(el);
    addBtn(r, 'P 靠近 y 轴', () => { s.t = .2; }, 'ghost');
    addBtn(r, 'P 远离 y 轴', () => { s.t = 2.4; }, 'ghost');
  }
});

function rightAngleOnLine(m) {
  // 中点处的小直角：一边沿 y = x，一边沿 PP′
  const s = .26, k = .7071;
  const e1 = {x: k, y: k}, e2 = {x: k, y: -k};
  const a1 = {x: m.x + e1.x * s, y: m.y + e1.y * s};
  const a2 = {x: m.x + e2.x * s, y: m.y + e2.y * s};
  const c = {x: m.x + (e1.x + e2.x) * s, y: m.y + (e1.y + e2.y) * s};
  line(a1, c, 'rgba(255,197,107,.6)', {w: 1.1});
  line(a2, c, 'rgba(255,197,107,.6)', {w: 1.1});
}

/* ---------- 04 运算律 ---------- */
MODULES.push({
  key: 'laws', tab: '04', name: '运算律', en: 'LAWS', blurb: '幂与对数的法则',
  accent: '#ffc56b', rgb: '255,197,107',
  hint: '拖动分界圆点，或调节滑块改变 m、n 与底数 a',
  state: {a: 2, m: 2, n: 3, logMode: false},
  reset() { this.state.a = 2; this.state.m = 2; this.state.n = 3; this.state.logMode = false; },
  meta() {
    return {
      title: '指数与对数的运算律',
      desc: '同底数幂相乘，指数相加；同底对数相加，真数相乘——两条运算律其实是同一件事的两面。拖动分界圆点或调节滑块改变 m、n 与底数 a，观察两段长度如何拼成总长度，右侧的数值如何从乘积变成指数之和。',
      formula: 'a<sup>m</sup>·a<sup>n</sup> = a<sup>m+n</sup>　log<sub>a</sub>(MN) = log<sub>a</sub>M + log<sub>a</sub>N',
      note: '取 <span class="nw">M = aᵐ、N = aⁿ</span>，则 <span class="nw">MN = aᵐ⁺ⁿ</span>，两边取对数恰好得到对数的加法。所以“指数相加”与“对数相加”是同一段长度。'
    };
  },
  handles() { return [{id: 'm', x: -3.4 + this.state.m, y: .3}]; },
  drag(id, p) {
    const q = clampPt(p);
    const m = clamp(Math.round(q.x + 3.4), 1, 3);
    this.state.m = m;
    if (this._mSl) this._mSl.set(m);
  },
  draw() {
    setFrame(.5, .58, 12);
    base();
    axes();
    const L = lim();
    const s = this.state, a = s.a, m = s.m, n = s.n, lg = s.logMode;
    const x0 = -3.4, y = .3, x1 = x0 + m, x2 = x0 + m + n;
    const A = Math.pow(a, m), B = Math.pow(a, n), C = A * B;

    line({x: x0 - .2, y}, {x: x0 + 6.4, y}, 'rgba(190,215,230,.22)', {w: 1.2});
    for (let k = 0; k <= 6; k++) {
      const xx = x0 + k;
      line({x: xx, y: y - .15}, {x: xx, y: y + .15}, 'rgba(190,215,230,.32)', {w: 1});
      sans(String(k), X(xx), Y(y - .45), 'rgba(160,190,205,.55)', 10);
    }

    line({x: x0, y}, {x: x1, y}, '#ffc56b', {w: 9});
    line({x: x1, y}, {x: x2, y}, '#5eead4', {w: 9});

    const c1 = lg ? 'log' + sub(a) + A + ' = ' + m : 'aᵐ = ' + a + sup(m) + ' = ' + A;
    const c2 = lg ? 'log' + sub(a) + B + ' = ' + n : 'aⁿ = ' + a + sup(n) + ' = ' + B;
    const c3 = lg ? 'log' + sub(a) + C + ' = ' + (m + n) : 'aᵐ⁺ⁿ = ' + a + sup(m + n) + ' = ' + C;

    const p1 = (x0 + x1) / 2, p2 = (x1 + x2) / 2;
    line({x: p1, y: y + .28}, {x: p1, y: 1.0}, 'rgba(255,197,107,.35)', {w: 1, dash: [3, 4]});
    line({x: p2, y: y + .28}, {x: p2, y: 1.75}, 'rgba(94,234,212,.35)', {w: 1, dash: [3, 4]});
    sans(c1, X(p1), Y(1.35), '#ffd99a', 12);
    sans(c2, X(p2), Y(2.1), '#8ff5e4', 12);

    line({x: x0, y: -1.05}, {x: x2, y: -1.05}, 'rgba(210,225,235,.42)', {w: 1.6});
    line({x: x0, y: -1.22}, {x: x0, y: -.88}, 'rgba(210,225,235,.42)', {w: 1.6});
    line({x: x2, y: -1.22}, {x: x2, y: -.88}, 'rgba(210,225,235,.42)', {w: 1.6});
    sans(c3, X((x0 + x2) / 2), Y(-1.6), '#ffe4b0', 13);

    math(lg ? 'logₐ(MN) = logₐM + logₐN' : 'aᵐ · aⁿ = aᵐ⁺ⁿ', X(0), Y(L.y1 - .55), '#ffd99a', 21);
    sans(lg ? '真数相乘 ⇔ 对数相加' : '幂相乘 ⇔ 指数相加', X(0), Y(L.y0 + .5), 'rgba(200,215,225,.75)', 12);

    handle({x: x1, y}, '#ffc56b', hoverId === 'm');
    math('+', X(x1), Y(y + .38), 'rgba(255,255,255,.5)', 15);
  },
  hud() {
    const s = this.state, a = s.a, m = s.m, n = s.n;
    const A = Math.pow(a, m), B = Math.pow(a, n), C = A * B;
    if (s.logMode) {
      return [
        {k: 'M = aᵐ', v: String(A)},
        {k: 'N = aⁿ', v: String(B)},
        {k: 'MN', v: String(C)},
        {k: 'logₐM + logₐN', v: m + ' + ' + n + ' = ' + (m + n), hi: true},
        {k: 'logₐ(MN)', v: String(m + n)}
      ];
    }
    return [
      {k: 'aᵐ', v: String(A)},
      {k: 'aⁿ', v: String(B)},
      {k: 'aᵐ·aⁿ', v: String(C), hi: true},
      {k: 'aᵐ⁺ⁿ', v: String(C), hi: true}
    ];
  },
  panel(el) {
    const s = this.state;
    addSlider(el, '底数 a', 2, 4, 1, s.a, v => String(v), v => s.a = v);
    this._mSl = addSlider(el, '指数 m', 1, 3, 1, s.m, v => String(v), v => s.m = v);
    addSlider(el, '指数 n', 1, 3, 1, s.n, v => String(v), v => s.n = v);
    addToggle(el, '切换为对数运算律', s.logMode, v => s.logMode = v);
  }
});

/* ---------- 05 增长比较 ---------- */
MODULES.push({
  key: 'growth', tab: '05', name: '增长比较', en: 'GROWTH', blurb: 'x 与 2ˣ 与 log₂x',
  accent: '#ffa97a', rgb: '255,169,122',
  hint: '拖动竖线，比较同一 x 处三个函数值的大小',
  state: {t: 2.6, lin: true, exp: true, log: true, playing: false},
  reset() { this.state.t = 2.6; this.state.lin = true; this.state.exp = true; this.state.log = true; this.state.playing = false; },
  togglePlay() { this.state.playing = !this.state.playing; },
  meta() {
    return {
      title: '三个函数的增长比较',
      desc: '把 y = x、y = 2ˣ、y = log₂x 画在同一坐标系中：在 (0, +∞) 上恒有 log₂x ≤ x ≤ 2ˣ。拖动竖线与三条曲线相交，读出同一个 x 处的三个函数值，可以看到指数函数很快甩开一次函数，而对数函数增长越来越慢。',
      formula: 'log₂x ≤ x ≤ 2<sup>x</sup>　(x &gt; 0)',
      note: '在 x 较小时三者差距不大，x 超过 2 之后 2ˣ 迅速变大；log₂x 却始终被 x 压住。点“播放”可让竖线自动右移，观察差距怎样拉开。'
    };
  },
  handles() { return [{id: 't', x: this.state.t, y: 0}]; },
  drag(id, p) {
    const q = clampPt(p);
    this.state.t = clamp(q.x, .4, 3);
    if (this._sl) this._sl.set(+this.state.t.toFixed(2));
  },
  draw(dt) {
    const s = this.state;
    if (s.playing) {
      s.t += dt * .45;
      if (s.t > 3) s.t = .4;
      if (this._sl) this._sl.set(+s.t.toFixed(2));
    }
    setFrame(.3, .9, 16);
    base();
    axes();
    const L = lim(), t = s.t;
    const vx = t, ve = Math.pow(2, t), vl = Math.log(t) / Math.LN2;

    if (s.exp) plot(x => Math.pow(2, x), '#ffa97a', {w: 2.6, glow: 10});
    if (s.lin) line({x: L.x0, y: L.x0}, {x: Math.min(L.x1, L.y1), y: Math.min(L.x1, L.y1)}, '#6cb6ff', {w: 2.4});
    if (s.log) plot(x => x > 0 ? Math.log(x) / Math.LN2 : NaN, '#5eead4', {w: 2.6, glow: 10});

    line({x: t, y: L.y0}, {x: t, y: L.y1}, 'rgba(255,255,255,.16)', {w: 1.4, dash: [4, 5]});

    const pts = [
      {v: vx, c: '#6cb6ff', on: s.lin},
      {v: ve, c: '#ffa97a', on: s.exp},
      {v: vl, c: '#5eead4', on: s.log}
    ];
    pts.forEach(p => {
      if (!p.on || p.v < L.y0 || p.v > L.y1) return;
      dot({x: t, y: p.v}, p.c, 4.5);
      sans(fmt(p.v, 2), X(t) + 14, Y(p.v) - 11, p.c, 11.5, 'left');
    });

    handle({x: t, y: 0}, '#ffa97a', hoverId === 't');
    math('x = ' + fmt(t, 2), X(t) + 12, Y(0) + 16, '#ffd0b5', 13, 'left');

    legend([
      {t: 'y = 2ˣ', c: '#ffa97a'},
      {t: 'y = x', c: '#6cb6ff'},
      {t: 'y = log₂x', c: '#5eead4'}
    ], 18, 24);
  },
  hud() {
    const t = this.state.t, ve = Math.pow(2, t), vl = Math.log(t) / Math.LN2;
    return [
      {k: 'x = t', v: fmt(t, 2), hi: true},
      {k: '2ᵗ', v: fmt(ve, 2)},
      {k: 'log₂t', v: fmt(vl, 2)},
      {k: '2ᵗ − t', v: fmt(ve - t, 2)},
      {k: '2ᵗ ÷ t', v: fmt(ve / t, 2), hi: true}
    ];
  },
  panel(el) {
    const s = this.state;
    this._sl = addSlider(el, '竖线位置 t', .4, 3, .05, s.t, v => (+v).toFixed(2), v => s.t = v);
    addToggle(el, '显示 y = 2ˣ', s.exp, v => s.exp = v);
    addToggle(el, '显示 y = x', s.lin, v => s.lin = v);
    addToggle(el, '显示 y = log₂x', s.log, v => s.log = v);
  }
});

})();
