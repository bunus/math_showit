/* ============================================================
   必修第一册 · 第 2 章 一元二次函数、方程和不等式
   五个情境：判别式 / 解集 / 基本不等式 / 不等式性质 / 标根法
   ============================================================ */
(function () {

const TEAL = '#5eead4';
const BLUE = '#6cb6ff';
const PINK = '#ff8fab';
const GOLD = '#ffc56b';
const PURPLE = '#b49cff';

/* ---------- 通用小工具 ---------- */
function num(v, d) {
  d = d == null ? 1 : d;
  return fmt(v, d).replace('-', '−');
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function curve(fn, x0, x1, color, w, n) {
  n = n || 170;
  let px = x0, py = clamp(fn(x0), -90, 90);
  for (let i = 1; i <= n; i++) {
    const x = x0 + (x1 - x0) * i / n;
    let y = fn(x);
    if (!isFinite(y)) { px = x; py = 0; continue; }
    y = clamp(y, -90, 90);
    line({x: px, y: py}, {x: x, y: y}, color, {w: w || 2});
    px = x; py = y;
  }
}
function ring(p, color, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(X(p.x), Y(p.y), r, 0, TAU);
  ctx.fillStyle = '#0a111d';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}
function rule(y, color, w) {
  const L = lim();
  line({x: L.x0, y: y}, {x: L.x1, y: y}, color, {w: w || 1.2});
}

/* ============================================================
   01 二次函数图象与判别式
   ============================================================ */
MODULES.push({
  key: 'disc', tab: '01', name: '图象与判别式', en: 'DISCRIMINANT', blurb: 'Δ 决定交点',
  accent: '#5eead4', rgb: '94,234,212',
  hint: '调节 |a| 与 c，拖动 t 点读出函数值',
  state: {a: 1, c: -1, down: false, t: 2.2},
  reset() { this.state.a = 1; this.state.c = -1; this.state.down = false; this.state.t = 2.2; },
  meta() {
    return {
      title: 'Δ 的符号决定图象与 x 轴的交点',
      desc: '二次函数 y = ax² + bx + c 与 x 轴的交点，由判别式 Δ = b² − 4ac 决定：Δ &gt; 0 有两个交点，Δ = 0 时图象与 x 轴相切，Δ &lt; 0 时没有交点。调节 a 与 c，再拖动底部的 t 点读出函数值。',
      formula: 'y = ax² + bx + c　(b = −2)<br>Δ = b² − 4ac = 4 − 4ac<br>x₁,₂ = (2 ± √Δ) / (2a)',
      note: '本题固定 b = −2，所以 Δ = 4 − 4ac。上下平移抛物线（改变 c），Δ 会由正变零再变负，交点个数随之从 2 变成 1、0。<i>a 同时决定开口方向、开口大小与对称轴 x = 1/a。</i>'
    };
  },
  handles() { return [{id: 't', x: this.state.t, y: 0}]; },
  drag(id, p) {
    const q = clampPt(p);
    const L = lim();
    this.state.t = clamp(q.x, L.x0 + .2, L.x1 - .2);
  },
  draw() {
    setFrame(.5, .55, 12);
    base();
    const s = this.state, A = s.down ? -s.a : s.a, b = -2, c = s.c;
    const D = b * b - 4 * A * c;
    const f = x => A * x * x + b * x + c;
    const L = lim();
    const xv = -b / (2 * A);

    line({x: xv, y: L.y0}, {x: xv, y: L.y1}, 'rgba(94,234,212,.14)', {w: 1, dash: [5, 6]});
    rule(0, 'rgba(190,220,235,.45)', 1.4);
    curve(f, L.x0, L.x1, TEAL, 2.6);

    let roots = [];
    if (D > 1e-9) {
      const sq = Math.sqrt(D);
      roots = [(2 - sq) / (2 * A), (2 + sq) / (2 * A)].sort((u, v) => u - v);
    } else if (Math.abs(D) <= 1e-9) {
      roots = [xv];
    }
    roots.forEach((r, i) => {
      dot({x: r, y: 0}, GOLD, 5);
      const lx = clamp(X(r), X(L.x0) + 42, X(L.x1) - 42);
      if (roots.length === 1) {
        sans('x₁ = x₂ = ' + num(r, 2), lx, Y(-.45), 'rgba(255,220,160,.95)', 10.5);
      } else {
        math((i === 0 ? 'x₁' : 'x₂') + ' = ' + num(r, 2), lx, Y(-.45), 'rgba(255,220,160,.95)', 12);
      }
    });

    const yv = c - 1 / A;
    dot({x: xv, y: yv}, 'rgba(94,234,212,.85)', 3.6);
    sans('顶点', X(xv) + 10, Y(yv) - 14, 'rgba(150,235,220,.75)', 10, 'left');

    const t = s.t, ft = f(t);
    line({x: t, y: 0}, {x: t, y: ft}, 'rgba(255,169,122,.35)', {w: 1, dash: [4, 4]});
    if (Math.abs(ft) < 3.4) line({x: 0, y: ft}, {x: t, y: ft}, 'rgba(255,169,122,.16)', {w: 1, dash: [3, 5]});
    dot({x: t, y: ft}, '#ffa97a', 4.6);
    const pRight = X(t) > W - 96;
    const pdx = pRight ? -13 : 13;
    math('P', X(t) + pdx, Y(ft) + (ft >= 0 ? -12 : 12), '#ffc4a8', 14, pRight ? 'right' : 'left');
    sans('f(t) = ' + num(ft, 2), X(t) + pdx, Y(ft) + (ft >= 0 ? -30 : 30), 'rgba(255,196,168,.95)', 10.5, pRight ? 'right' : 'left');
    handle({x: t, y: 0}, '#ffa97a', hoverId === 't');
    sans('t', X(t), Y(.32), '#ffc4a8', 11);

    const st = D > 1e-9 ? '两个交点' : Math.abs(D) <= 1e-9 ? '相切于一点' : '没有交点';
    sans('Δ = ' + num(D, 2) + '　与 x 轴：' + st, X(L.x0 + .4), Y(3.15),
      D > 1e-9 ? '#8ff5e4' : D < -1e-9 ? '#ffb3c6' : '#ffd99a', 12, 'left');
    const cTxt = Math.abs(c) < 5e-3 ? '' : (c > 0 ? ' + ' + num(c, 1) : ' − ' + num(-c, 1));
    math('y = ' + num(A, 1) + 'x² − 2x' + cTxt,
      X(L.x0 + .4), Y(3.55), 'rgba(150,220,210,.9)', 14, 'left');
  },
  hud() {
    const s = this.state, A = s.down ? -s.a : s.a;
    const D = 4 - 4 * A * s.c;
    const ft = A * s.t * s.t - 2 * s.t + s.c;
    return [
      {k: 'a', v: num(A, 2), hi: true},
      {k: 'c', v: num(s.c, 1)},
      {k: 'Δ = 4 − 4ac', v: num(D, 2), hi: D > 1e-9},
      {k: '与 x 轴交点', v: D > 1e-9 ? '2 个' : Math.abs(D) <= 1e-9 ? '1 个' : '0 个'},
      {k: 'f(t)', v: num(ft, 2)}
    ];
  },
  panel(el) {
    const s = this.state;
    addSlider(el, '二次项系数 |a|', .4, 2.2, .05, s.a, v => v.toFixed(2), v => s.a = v);
    addSlider(el, '常数项 c', -3, 3, .1, s.c, v => v.toFixed(1), v => s.c = v);
    addToggle(el, '开口向下', s.down, v => s.down = v);
    addBtn(el, '令 Δ = 0', () => {
      s.c = 1 / (s.down ? -s.a : s.a);
      buildPanel();
    }, 'ghost');
  }
});

/* ============================================================
   02 一元二次不等式的解集
   ============================================================ */
const NL2 = -2.9;

MODULES.push({
  key: 'solutionset', tab: '02', name: '不等式的解集', en: 'SOLUTION SET', blurb: '图象与数轴',
  accent: '#6cb6ff', rgb: '108,182,255',
  hint: '移动两根与开口，拖动 t 点检验解集',
  state: {m: .5, d: 2.4, up: true, gt: true, t: 3.2},
  reset() { this.state.m = .5; this.state.d = 2.4; this.state.up = true; this.state.gt = true; this.state.t = 3.2; },
  meta() {
    return {
      title: '图象在 x 轴上方，对应 f(x) > 0',
      desc: '把二次函数写成 a(x − x₁)(x − x₂)：图象位于 x 轴上方的部分就是 f(x) &gt; 0 的解，位于下方的部分就是 f(x) &lt; 0 的解。调节两根的位置与开口方向，数轴上的解集随之改变。',
      formula: 'f(x) = a(x − x₁)(x − x₂)　(a = ±0.6)<br>a &gt; 0：f(x) &gt; 0 ⇔ x 在两根之外<br>a &gt; 0：f(x) &lt; 0 ⇔ x 在两根之间',
      note: '开口向上且取 &gt; 0 时，解集在两根之外；取 &lt; 0 时，解集在两根之间。开口向下则两种情况互换。<i>“大于取两边，小于取中间”只对 a &gt; 0 成立。</i>'
    };
  },
  handles() { return [{id: 't', x: this.state.t, y: NL2}]; },
  drag(id, p) {
    const q = clampPt(p);
    const L = lim();
    this.state.t = clamp(q.x, L.x0 + .2, L.x1 - .2);
  },
  draw() {
    setFrame(.5, .46, 12.5);
    base();
    const s = this.state, A = s.up ? .6 : -.6;
    const r1 = s.m - s.d / 2, r2 = s.m + s.d / 2;
    const f = x => A * (x - r1) * (x - r2);
    const L = lim();
    const outside = (A > 0) === s.gt;

    curve(f, L.x0, L.x1, BLUE, 2.6);
    rule(0, 'rgba(190,220,235,.45)', 1.4);

    line({x: L.x0, y: NL2}, {x: L.x1, y: NL2}, 'rgba(200,225,235,.45)', {w: 1.3});
    for (let i = Math.ceil(L.x0); i <= Math.floor(L.x1); i++) {
      line({x: i, y: NL2 - .1}, {x: i, y: NL2 + .1}, 'rgba(200,225,235,.3)', {w: 1});
      sans(String(i), X(i), Y(NL2 - .4), 'rgba(150,175,190,.6)', 9);
    }

    const seg = (u, v) => line({x: u, y: NL2}, {x: v, y: NL2}, 'rgba(108,182,255,.9)', {w: 7});
    if (outside) { seg(L.x0, r1); seg(r2, L.x1); } else seg(r1, r2);
    ring({x: r1, y: NL2}, '#9ad0ff', 5.5);
    ring({x: r2, y: NL2}, '#9ad0ff', 5.5);

    line({x: r1, y: 0}, {x: r1, y: NL2}, 'rgba(154,208,255,.22)', {w: 1, dash: [4, 5]});
    line({x: r2, y: 0}, {x: r2, y: NL2}, 'rgba(154,208,255,.22)', {w: 1, dash: [4, 5]});

    math('x₁', X(r1) - 13, Y(.4), '#9ad0ff', 15);
    math('x₂', X(r2) + 13, Y(.4), '#9ad0ff', 15);

    const t = s.t, ft = f(t);
    const inSet = outside ? (t < r1 || t > r2) : (t > r1 && t < r2);
    line({x: t, y: NL2}, {x: t, y: ft}, 'rgba(255,197,107,.3)', {w: 1, dash: [4, 4]});
    dot({x: t, y: ft}, GOLD, 4.5);
    const tRight = X(t) > W - 96;
    math('f(t) = ' + num(ft, 1), X(t) + (tRight ? -12 : 12), Y(ft) + (ft >= 0 ? -13 : 13), '#ffd99a', 12, tRight ? 'right' : 'left');
    handle({x: t, y: NL2}, GOLD, hoverId === 't');
    sans('t ' + (inSet ? '∈ 解集' : '∉ 解集'), X(t), Y(NL2 + .38), inSet ? '#8ff5e4' : '#ffb3c6', 10);

    const stext = outside
      ? '解集：x < ' + num(r1, 1) + ' 或 x > ' + num(r2, 1)
      : '解集：' + num(r1, 1) + ' < x < ' + num(r2, 1);
    sans(stext, X(0), Y(-3.85), 'rgba(170,205,235,.9)', 12);
    sans((s.up ? '开口向上' : '开口向下') + '　' + (s.gt ? 'f(x) > 0' : 'f(x) < 0'),
      X(L.x0 + .4), Y(3.3), 'rgba(154,208,255,.9)', 12, 'left');
  },
  hud() {
    const s = this.state, A = s.up ? .6 : -.6;
    const r1 = s.m - s.d / 2, r2 = s.m + s.d / 2;
    const outside = (A > 0) === s.gt;
    const ft = A * (s.t - r1) * (s.t - r2);
    const inSet = outside ? (s.t < r1 || s.t > r2) : (s.t > r1 && s.t < r2);
    return [
      {k: 'x₁', v: num(r1, 1), hi: true},
      {k: 'x₂', v: num(r2, 1), hi: true},
      {k: '二次项系数 a', v: num(A, 1)},
      {k: 'f(t)', v: num(ft, 1) + (inSet ? ' ∈ 解集' : ' ∉ 解集'), hi: inSet},
      {k: '解集', v: esc(outside ? 'x < ' + num(r1, 1) + ' 或 x > ' + num(r2, 1) : num(r1, 1) + ' < x < ' + num(r2, 1)), hi: true}
    ];
  },
  panel(el) {
    const s = this.state;
    addSlider(el, '两根中点 m', -2.2, 2.2, .1, s.m, v => v.toFixed(1), v => s.m = v);
    addSlider(el, '两根间距 d', .8, 4, .1, s.d, v => v.toFixed(1), v => s.d = v);
    addToggle(el, '开口向上', s.up, v => s.up = v);
    addToggle(el, '取 f(x) > 0', s.gt, v => s.gt = v);
  }
});

/* ============================================================
   03 基本不等式
   ============================================================ */
MODULES.push({
  key: 'amgm', tab: '03', name: '基本不等式', en: 'AM–GM', blurb: 'a + b ≥ 2√ab',
  accent: '#ffc56b', rgb: '255,197,107',
  hint: '调节 a、b，比较垂线段 CD 与半径 R',
  state: {a: 2.4, b: 1.2, showR: true},
  reset() { this.state.a = 2.4; this.state.b = 1.2; this.state.showR = true; },
  meta() {
    return {
      title: '半圆中的 √(ab) 与 (a + b)/2',
      desc: '以 a + b 为直径作半圆，把直径分成 a、b 两段，过分点作垂线交半圆于 C，则 CD = √(ab)，半径 R = (a + b)/2。垂线段总不长于半径，于是 a + b ≥ 2√(ab)，当 a = b 时取等号。',
      formula: 'a + b ≥ 2√(ab)　(a, b &gt; 0)<br>等号成立 ⇔ a = b',
      note: '半径是从圆心到半圆上任意一点的距离，垂线段 CD 当然不超过它。让 a 与 b 逐渐靠近，CD 不断变长，直到 a = b 时与半径重合，等号成立。'
    };
  },
  draw() {
    setFrame(.5, .6, 12);
    base();
    const s = this.state, a = s.a, b = s.b;
    const tot = a + b, r = tot / 2, h = Math.sqrt(a * b);
    const A = {x: -r, y: 0}, B = {x: r, y: 0};
    const D = {x: a - r, y: 0}, C = {x: a - r, y: h}, O = {x: 0, y: 0};

    let prev = {x: r, y: 0};
    for (let i = 1; i <= 100; i++) {
      const th = Math.PI * i / 100;
      const p = {x: r * Math.cos(th), y: r * Math.sin(th)};
      line(prev, p, GOLD, {w: 2.2});
      prev = p;
    }

    line(A, D, 'rgba(108,182,255,.9)', {w: 5});
    line(D, B, 'rgba(255,143,171,.85)', {w: 5});

    line(A, C, 'rgba(154,208,255,.28)', {w: 1.2});
    line(C, B, 'rgba(154,208,255,.28)', {w: 1.2});
    line(D, C, GOLD, {w: 2.4});
    rightAngle(D, {x: 1, y: 0}, {x: 0, y: 1}, 11, 'rgba(255,197,107,.75)');

    if (s.showR) {
      line(O, C, 'rgba(108,182,255,.85)', {w: 1.6, dash: [5, 5]});
      dot(O, 'rgba(154,208,255,.9)', 3.5);
      math('R', X(C.x * .55) - 12, Y(C.y * .55) + 12, '#a9d4ff', 15);
    }

    math('A', X(A.x) - 14, Y(-.32), 'rgba(190,215,235,.9)', 15);
    math('B', X(B.x) + 14, Y(-.32), 'rgba(190,215,235,.9)', 15);
    math('C', X(C.x), Y(h + .28), '#ffd99a', 15);
    math('D', X(D.x), Y(-1.15), 'rgba(190,215,235,.8)', 13);
    sans('a = ' + num(a, 1), X((A.x + D.x) / 2), Y(-.62), '#a9d4ff', 11);
    sans('b = ' + num(b, 1), X((D.x + B.x) / 2), Y(-.62), '#ffb3c6', 11);

    math('CD = √(ab)', X(C.x) + 12, Y(h / 2), '#ffd99a', 14, 'left');
    sans('= ' + num(h, 2), X(C.x) + 12, Y(h / 2 - .4), 'rgba(255,217,154,.85)', 10.5, 'left');

    const eq = Math.abs(a - b) < 1e-9;
    math('a + b ≥ 2√(ab)', X(0), Y(-2.1), '#ffd99a', 18);
    sans(eq ? 'a = b，等号成立：CD = R' : 'a ≠ b，CD < R，严格大于',
      X(0), Y(-2.65), eq ? TEAL : 'rgba(190,210,220,.8)', 11.5);
  },
  hud() {
    const s = this.state;
    const sum = s.a + s.b, gm = 2 * Math.sqrt(s.a * s.b);
    return [
      {k: 'a', v: num(s.a, 1), hi: true},
      {k: 'b', v: num(s.b, 1), hi: true},
      {k: 'a + b', v: num(sum, 2)},
      {k: '2√(ab)', v: num(gm, 2)},
      {k: '等号条件', v: Math.abs(s.a - s.b) < 1e-9 ? '成立' : '不成立', hi: Math.abs(s.a - s.b) < 1e-9}
    ];
  },
  panel(el) {
    const s = this.state;
    addSlider(el, '正数 a', .8, 3.2, .1, s.a, v => v.toFixed(1), v => s.a = v);
    addSlider(el, '正数 b', .8, 3.2, .1, s.b, v => v.toFixed(1), v => s.b = v);
    addToggle(el, '显示半径 OC', s.showR, v => s.showR = v);
    addBtn(el, '令 a = b', () => {
      s.b = s.a;
      buildPanel();
    }, 'ghost');
  }
});

/* ============================================================
   04 不等式的性质
   ============================================================ */
MODULES.push({
  key: 'props', tab: '04', name: '不等式的性质', en: 'PROPERTIES', blurb: '同加与同乘',
  accent: '#ff8fab', rgb: '255,143,171',
  hint: '拖动 a、b，调节 c，观察不等号是否保持',
  state: {a: -1.5, b: 2.5, c: 1, mul: false},
  reset() { this.state.a = -1.5; this.state.b = 2.5; this.state.c = 1; this.state.mul = false; },
  meta() {
    return {
      title: '同加不变号，同乘负数要变号',
      desc: '不等式两边同加一个数，不等号方向不变；两边同乘一个正数，方向不变，同乘一个负数，方向反转。拖动数轴上的 a、b 改变大小关系，再调节 c 的符号，比较上下两行的顺序。',
      formula: 'a &lt; b ⇒ a + c &lt; b + c<br>a &lt; b, c &gt; 0 ⇒ ac &lt; bc<br>a &lt; b, c &lt; 0 ⇒ ac &gt; bc',
      note: '同加一个数相当于把两个点同时平移，先后顺序不会改变；同乘一个数相当于以原点为中心伸缩，乘负数时两点跨过原点、左右互换，所以不等号反向。<i>c = 0 时两边都变成 0。</i>'
    };
  },
  handles() {
    return [{id: 'a', x: this.state.a, y: 1.7}, {id: 'b', x: this.state.b, y: 1.7}];
  },
  drag(id, p) {
    const q = clampPt(p);
    this.state[id] = Math.round(clamp(q.x, -2.8, 2.8) * 10) / 10;
  },
  draw() {
    setFrame(.5, .55, 12);
    base();
    const s = this.state, a = s.a, b = s.b, c = s.c;
    const yt = 1.7, yb = -1.7;
    const ta = s.mul ? a * c : a + c;
    const tb = s.mul ? b * c : b + c;
    const L = lim();

    const axis = (y, labels) => {
      line({x: L.x0, y: y}, {x: L.x1, y: y}, 'rgba(200,225,235,.4)', {w: 1.3});
      for (let i = -5; i <= 5; i++) {
        line({x: i, y: y - .11}, {x: i, y: y + .11}, 'rgba(200,225,235,.28)', {w: 1});
        if (labels && i % 2 === 0) sans(String(i), X(i), Y(y - .42), 'rgba(150,175,190,.55)', 9);
      }
    };
    axis(yt, true);
    axis(yb, false);

    const r0 = a < b - 1e-9 ? '<' : a > b + 1e-9 ? '>' : '=';
    const r1 = ta < tb - 1e-9 ? '<' : ta > tb + 1e-9 ? '>' : '=';

    arrow({x: a, y: yt - .14}, {x: ta, y: yb + .14}, 'rgba(108,182,255,.45)', {w: 1.3, dash: [4, 4], head: 7});
    arrow({x: b, y: yt - .14}, {x: tb, y: yb + .14}, 'rgba(255,143,171,.45)', {w: 1.3, dash: [4, 4], head: 7});

    dot({x: a, y: yt}, BLUE, 5);
    dot({x: b, y: yt}, PINK, 5);
    const off = Math.abs(a - b) < 1.1 ? .45 : 0;
    sans('a = ' + num(a, 1), X(a), Y(yt + .42 + off), '#a9d4ff', 11);
    sans('b = ' + num(b, 1), X(b), Y(yt + .42), '#ffb3c6', 11);

    dot({x: ta, y: yb}, 'rgba(255,197,107,.95)', 5);
    dot({x: tb, y: yb}, 'rgba(255,197,107,.95)', 5);
    const opTxt = s.mul ? 'a·c' : 'a+c';
    const opTxt2 = s.mul ? 'b·c' : 'b+c';
    if (Math.abs(ta - tb) < .5) {
      sans(opTxt + ' = ' + num(ta, 1) + '，' + opTxt2 + ' = ' + num(tb, 1), X((ta + tb) / 2), Y(yb - .55), '#ffd99a', 11);
    } else {
      sans(opTxt + ' = ' + num(ta, 1), X(ta), Y(yb - .5), '#ffd99a', 11);
      sans(opTxt2 + ' = ' + num(tb, 1), X(tb), Y(yb - .5), '#ffd99a', 11);
    }

    sans('原关系：a ' + r0 + ' b', X(L.x0 + .4), Y(2.85), 'rgba(170,205,235,.85)', 12, 'left');
    sans((s.mul ? '两边同乘 c = ' : '两边同加 c = ') + num(c, 1),
      X(L.x0 + .4), Y(.25), 'rgba(185,205,220,.8)', 11.5, 'left');

    let msg, col;
    if (r1 === '=' && r0 !== '=') { msg = '两边同时变成 0：相等'; col = GOLD; }
    else if (r0 === '=') { msg = 'a = b，两边仍然相等'; col = GOLD; }
    else if (r0 === r1) { msg = '不等号方向不变：a ' + r0 + ' b 仍成立'; col = TEAL; }
    else { msg = '不等号方向反转：a ' + r0 + ' b 变为 ' + r1; col = PINK; }
    sans(msg, X(0), Y(-2.75), col, 13.5);

    handle({x: a, y: yt}, BLUE, hoverId === 'a');
    handle({x: b, y: yt}, PINK, hoverId === 'b');
  },
  hud() {
    const s = this.state, a = s.a, b = s.b, c = s.c;
    const ta = s.mul ? a * c : a + c, tb = s.mul ? b * c : b + c;
    const r0 = a < b - 1e-9 ? '<' : a > b + 1e-9 ? '>' : '=';
    const r1 = ta < tb - 1e-9 ? '<' : ta > tb + 1e-9 ? '>' : '=';
    return [
      {k: 'a', v: num(a, 1)},
      {k: 'b', v: num(b, 1)},
      {k: 'c', v: num(c, 1), hi: true},
      {k: '原关系', v: 'a ' + r0 + ' b'},
      {k: '变换后', v: esc('a' + (s.mul ? '·c ' : ' + c ') + r1 + ' b' + (s.mul ? '·c' : ' + c'))}
    ];
  },
  panel(el) {
    const s = this.state;
    addSlider(el, '数值 c', -2, 2, .1, s.c, v => v.toFixed(1), v => s.c = v);
    addToggle(el, '两边同乘 c（否则同加）', s.mul, v => s.mul = v);
    const r = row(el);
    addBtn(r, '交换 a、b', () => {
      const t = s.a; s.a = s.b; s.b = t;
    }, 'ghost');
    addBtn(r, '重置', () => { this.reset(); buildPanel(); }, 'ghost');
  }
});

/* ============================================================
   05 分式不等式与标根法
   ============================================================ */
function solStr(a, b, le) {
  const p = Math.min(a, b), q = Math.max(a, b);
  const pInc = Math.abs(p - a) < 1e-9;
  const qInc = Math.abs(q - a) < 1e-9;
  if (!le) {
    return 'x ' + (pInc ? '≤ ' : '< ') + num(p, 1) + ' 或 x ' + (qInc ? '≥ ' : '> ') + num(q, 1);
  }
  return num(p, 1) + (pInc ? ' ≤ x ' : ' < x ') + (qInc ? '≤ ' : '< ') + num(q, 1);
}

MODULES.push({
  key: 'frac', tab: '05', name: '分式不等式', en: 'SIGN CHART', blurb: '标根法',
  accent: '#b49cff', rgb: '180,156,255',
  hint: '滑动 a、拖动 b，观察解集区间的开闭',
  state: {a: -1, b: 2, le: false, showSign: true},
  reset() { this.state.a = -1; this.state.b = 2; this.state.le = false; this.state.showSign = true; },
  meta() {
    return {
      title: '标根法：把数轴分成三段',
      desc: '解分式不等式 (x − a)/(x − b) ≥ 0 常用标根法：把分子根 a 与分母零点 b 标在数轴上，数轴被分成三段，各段符号依次为 +、−、+。拖动 a、b 移动临界点，观察解集区间与端点的开闭。',
      formula: '(x − a)/(x − b) ≥ 0　(a ≠ b)<br>分子根 a 可取等，分母零点 b 挖去',
      note: '端点 a 使分子为 0，函数值恰为 0，可以取到；端点 b 使分母为 0，函数无定义，必须挖去。把 a 滑过 b 或拖动 b 越过 a，解集的写法会自动交换左右。'
    };
  },
  handles() {
    return [{id: 'b', x: this.state.b, y: 0}];
  },
  drag(id, p) {
    const q = clampPt(p);
    const s = this.state;
    let x = clamp(q.x, -5, 5);
    if (Math.abs(x - s.a) < .6) {
      let nb = s.a + (x < s.a ? -.6 : .6);
      if (nb > 5) nb = s.a - .6;
      if (nb < -5) nb = s.a + .6;
      x = nb;
    }
    s.b = x;
  },
  draw() {
    setFrame(.5, .55, 12);
    base();
    const s = this.state, a = s.a, b = s.b;
    const p = Math.min(a, b), q = Math.max(a, b);
    const L = lim();

    const seg = (u, v) => line({x: u, y: 0}, {x: v, y: 0}, 'rgba(180,156,255,.55)', {w: 9});
    if (!s.le) { seg(L.x0, p); seg(q, L.x1); } else seg(p, q);

    rule(0, 'rgba(200,225,235,.5)', 1.4);
    for (let i = Math.ceil(L.x0); i <= Math.floor(L.x1); i++) {
      line({x: i, y: -.1}, {x: i, y: .1}, 'rgba(200,225,235,.3)', {w: 1});
      sans(String(i), X(i), Y(-.42), 'rgba(150,175,190,.6)', 9);
    }

    if (s.showSign) {
      const yS = 1.9;
      line({x: a, y: .1}, {x: a, y: 2.5}, 'rgba(180,156,255,.25)', {w: 1, dash: [4, 5]});
      line({x: b, y: .1}, {x: b, y: 2.5}, 'rgba(180,156,255,.25)', {w: 1, dash: [4, 5]});
      const xs = [(L.x0 + p) / 2, (p + q) / 2, (q + L.x1) / 2];
      const sg = ['+', '−', '+'];
      xs.forEach((x, i) => math(sg[i], X(x), Y(yS), i === 1 ? PINK : TEAL, 22));
      sans('f(x) 的符号', X(L.x0 + .3), Y(2.45), 'rgba(175,200,215,.75)', 10.5, 'left');
    }

    dot({x: a, y: 0}, PURPLE, 6);
    ring({x: b, y: 0}, PINK, 6.5);
    math('a', X(a), Y(-1.02), '#c9baff', 15);
    math('b', X(b), Y(-1.02), '#ffb3c6', 15);
    sans('可取等', X(a), Y(-1.45), 'rgba(201,186,255,.75)', 9.5);
    sans('无定义', X(b), Y(-1.45), 'rgba(255,179,198,.75)', 9.5);

    handle({x: b, y: 0}, PINK, hoverId === 'b');

    math('(x − a) / (x − b) ' + (s.le ? '≤ 0' : '≥ 0'), X(0), Y(3.2), '#c9baff', 18);
    sans('解集：' + solStr(a, b, s.le), X(0), Y(-2.35), 'rgba(205,190,255,.95)', 13);
  },
  hud() {
    const s = this.state;
    return [
      {k: 'a（分子根，可取等）', v: num(s.a, 1), hi: true},
      {k: 'b（分母零点，挖去）', v: num(s.b, 1), hi: true},
      {k: '解集　' + (s.le ? '≤ 0' : '≥ 0'), v: esc(solStr(s.a, s.b, s.le)), hi: true}
    ];
  },
  panel(el) {
    const s = this.state;
    addSlider(el, '分子根 a（滑动）', -5, 5, .1, s.a, v => v.toFixed(1), v => {
      s.a = v;
      if (Math.abs(s.a - s.b) < .6) {
        let nb = s.a + (s.a <= s.b ? .6 : -.6);
        if (nb > 5) nb = s.a - .6;
        if (nb < -5) nb = s.a + .6;
        s.b = nb;
      }
    });
    addToggle(el, '显示符号表', s.showSign, v => s.showSign = v);
    addToggle(el, '改为 (x−a)/(x−b) ≤ 0', s.le, v => s.le = v);
    const r = row(el);
    addBtn(r, '交换 a、b', () => {
      const t = s.a; s.a = s.b; s.b = t;
      buildPanel();
    }, 'ghost');
    addBtn(r, 'a = −2, b = 1', () => {
      s.a = -2; s.b = 1;
      buildPanel();
    }, 'ghost');
  }
});

})();
