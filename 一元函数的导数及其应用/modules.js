/* ============================================================
   选择性必修第二册 · 第 5 章 一元函数的导数及其应用
   ============================================================ */
(function () {

/* f(x) = x²/2,  f′(x) = x */
const F1 = x => x * x / 2;
const T1 = x => x;
/* f(x) = x³/3 − x,  f′(x) = x² − 1 */
const F2 = x => x * x * x / 3 - x;
const T2 = x => x * x - 1;

/* 数值显示：负号统一用 − */
const num = (n, d) => fmt(n, d).replace('-', '−');

/* ---------- 公用绘图 ---------- */
function plot(f, color, opt) {
  opt = opt || {};
  const L = lim(), N = 500;
  const lo = Math.max(L.x0, opt.lo == null ? L.x0 : opt.lo);
  const hi = Math.min(L.x1, opt.hi == null ? L.x1 : opt.hi);
  if (!(hi > lo)) return;
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
    const x = lo + (hi - lo) * i / N;
    let y;
    try { y = f(x); } catch (e) { y = NaN; }
    if (!isFinite(y) || Math.abs(y) > 260) { on = false; continue; }
    if (!on) { ctx.moveTo(X(x), Y(y)); on = true; }
    else ctx.lineTo(X(x), Y(y));
  }
  ctx.stroke();
  ctx.restore();
}

function axes() {
  const L = lim();
  line({x: L.x0, y: 0}, {x: L.x1, y: 0}, 'rgba(190,215,230,.28)', {w: 1.1});
  line({x: 0, y: L.y0}, {x: 0, y: L.y1}, 'rgba(190,215,230,.28)', {w: 1.1});
  arrow({x: L.x1 - .9, y: 0}, {x: L.x1, y: 0}, 'rgba(190,215,230,.45)', {w: 1.1, head: 7});
  arrow({x: 0, y: L.y1 - .7}, {x: 0, y: L.y1}, 'rgba(190,215,230,.45)', {w: 1.1, head: 7});
  math('x', X(L.x1) - 15, Y(0) + 15, 'rgba(175,205,220,.6)', 12);
  math('y', X(0) + 15, Y(L.y1) + 6, 'rgba(175,205,220,.6)', 12);
}

function band(x0, x1, color) {
  const L = lim();
  const a = Math.max(X(Math.max(x0, L.x0)), 0);
  const b = Math.min(X(Math.min(x1, L.x1)), W);
  if (b - a < 1) return;
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(a, 0, b - a, H);
  ctx.restore();
}

function tanLine(x0, y0, k, color, opt) {
  opt = opt || {};
  const L = lim();
  const xa = L.x0 - .5, xb = L.x1 + .5;
  line({x: xa, y: y0 + k * (xa - x0)}, {x: xb, y: y0 + k * (xb - x0)}, color, opt);
}

function lineEq(k, b) {
  if (Math.abs(k) < .005) return 'y = ' + num(b, 2);
  const bs = Math.abs(b) < .005 ? '' : (b > 0 ? ' + ' : ' − ') + num(Math.abs(b), 2);
  return 'y = ' + num(k, 2) + 'x' + bs;
}

/* ---------- 01 平均变化率与割线 ---------- */
MODULES.push({
  key: 'average', tab: '01', name: '平均变化率', en: 'AVERAGE RATE', blurb: '割线的斜率',
  accent: '#6cb6ff', rgb: '108,182,255',
  hint: '拖动 A、B 两点，观察割线斜率 Δy/Δx 的变化',
  state: {a: -1.4, b: 1.8, tri: true},
  reset() { this.state.a = -1.4; this.state.b = 1.8; this.state.tri = true; },
  meta() {
    return {
      title: '平均变化率：割线 AB 的斜率',
      desc: '设 A、B 是曲线 y = x²/2 上的两点，从 A 到 B 的<b>平均变化率</b>就是割线 AB 的斜率 Δy/Δx。拖动两个端点改变位置，观察 Δx 伸长、Δy 变化时，斜率怎样随之改变。',
      formula: 'k<sub>AB</sub> = Δy/Δx = (f(x₂) − f(x₁)) / (x₂ − x₁)',
      note: '对 <span class="nw">y = x²/2</span>，平均变化率恰好等于 <span class="nw">(x₁ + x₂)/2</span>。它刻画的是一整段区间上的平均快慢，还没反映某一点的瞬时状态。'
    };
  },
  handles() {
    return [
      {id: 'A', x: this.state.a, y: F1(this.state.a)},
      {id: 'B', x: this.state.b, y: F1(this.state.b)}
    ];
  },
  drag(id, p) {
    const x = clamp(clampPt(p).x, -3.2, 3.2);
    if (id === 'A') this.state.a = Math.min(x, this.state.b - .4);
    else this.state.b = Math.max(x, this.state.a + .4);
  },
  draw() {
    setFrame(.5, .6, 12);
    base();
    axes();
    const s = this.state, L = lim();
    const a = s.a, b = s.b, fa = F1(a), fb = F1(b);
    const m = (fb - fa) / (b - a);

    plot(F1, '#6cb6ff', {w: 2.6, glow: 10, lo: -4, hi: 4});

    line({x: a, y: 0}, {x: a, y: fa}, 'rgba(154,208,255,.32)', {w: 1, dash: [4, 4]});
    line({x: b, y: 0}, {x: b, y: fb}, 'rgba(154,208,255,.32)', {w: 1, dash: [4, 4]});

    tanLine(a, fa, m, '#9ad0ff', {w: 2.1});

    if (s.tri) {
      line({x: a, y: fa}, {x: b, y: fa}, 'rgba(255,197,107,.65)', {w: 1.4, dash: [5, 4]});
      line({x: b, y: fa}, {x: b, y: fb}, 'rgba(255,143,171,.8)', {w: 1.4, dash: [5, 4]});
      rightAngle({x: b, y: fa}, {x: -1, y: 0}, {x: 0, y: fb > fa ? 1 : -1}, 9, 'rgba(255,255,255,.3)');
      sans('Δx = ' + num(b - a, 2), X((a + b) / 2), Y(fa) + 15, '#ffd99a', 11);
      sans('Δy = ' + num(fb - fa, 2), X(b) + 14, Y((fa + fb) / 2), '#ffb3c6', 11, 'left');
    }

    segLabel({x: a, y: fa}, {x: b, y: fb}, 'k = ' + num(m, 2), '#9ad0ff', .5, 22, 12);

    dot({x: a, y: fa}, '#6cb6ff', 4.5);
    dot({x: b, y: fb}, '#6cb6ff', 4.5);
    handle({x: a, y: fa}, '#6cb6ff', hoverId === 'A');
    handle({x: b, y: fb}, '#6cb6ff', hoverId === 'B');
    math('A', X(a) - 15, Y(fa) - 14, '#a9d4ff', 15);
    math('B', X(b) + 15, Y(fb) - 14, '#a9d4ff', 15);

    sans('y = x²/2', X(L.x0 + .3), Y(L.y1 - .5), 'rgba(154,208,255,.75)', 12, 'left');
  },
  hud() {
    const s = this.state, a = s.a, b = s.b;
    const m = (F1(b) - F1(a)) / (b - a);
    return [
      {k: 'x₁', v: num(a, 2)},
      {k: 'x₂', v: num(b, 2)},
      {k: 'Δx', v: num(b - a, 2)},
      {k: 'Δy', v: num(F1(b) - F1(a), 2)},
      {k: '平均变化率 k', v: num(m, 2), hi: true}
    ];
  },
  panel(el) {
    const s = this.state;
    addToggle(el, '显示 Δx、Δy 的直角三角形', s.tri, v => s.tri = v);
    const r = row(el);
    addBtn(r, '让 B 靠近 A', () => {
      s.a = Math.min(s.a, 2.6);
      s.b = s.a + .5;
    }, 'ghost');
    addBtn(r, '交换 A、B', () => {
      const t = s.a; s.a = s.b; s.b = t;
    }, 'ghost');
  }
});

/* ---------- 02 瞬时变化率 ---------- */
MODULES.push({
  key: 'instant', tab: '02', name: '瞬时变化率', en: 'INSTANT RATE', blurb: 'Δx → 0 的极限',
  accent: '#5eead4', rgb: '94,234,212',
  hint: '点击播放或拖动 B，让 B 沿曲线趋近 A',
  state: {a: 1, h: 1.6, playing: false, ghosts: true},
  reset() {
    this.state.a = 1;
    this.state.h = 1.6;
    this.state.playing = false;
    this.state.ghosts = true;
    this.syncH();
  },
  syncH() { if (this._h) this._h.set(+this.state.h.toFixed(2)); },
  togglePlay() {
    const s = this.state;
    s.playing = !s.playing;
    if (s.playing) { s.h = 1.8; this.syncH(); }
  },
  meta() {
    return {
      title: '瞬时变化率：割线趋向切线',
      desc: '让 B 沿曲线不断靠近 A，割线 AB 就绕着 A 转动，最终趋于一条确定的直线——切线。切线的斜率就是函数在 A 处的<b>瞬时变化率</b>，即导数 f′(x₀)。点击播放或拖动 B 观察这一过程。',
      formula: 'f′(x₀) = lim<sub>Δx→0</sub> (f(x₀+Δx) − f(x₀)) / Δx',
      note: '对 <span class="nw">y = x²/2</span>，割线斜率 <span class="nw">= x₀ + Δx/2</span>；当 Δx → 0 时它趋于 x₀，所以 <span class="nw">f′(x₀) = x₀</span>，与切线斜率一致。'
    };
  },
  handles() {
    const s = this.state;
    return [
      {id: 'A', x: s.a, y: F1(s.a)},
      {id: 'B', x: s.a + s.h, y: F1(s.a + s.h)}
    ];
  },
  drag(id, p) {
    const s = this.state, q = clampPt(p);
    if (id === 'A') {
      s.a = clamp(q.x, -3.2, 3.2 - s.h);
    } else {
      const xb = clamp(q.x, s.a + .08, Math.min(3.4, s.a + 2));
      s.h = xb - s.a;
      this.syncH();
    }
  },
  draw(dt) {
    setFrame(.5, .58, 12);
    base();
    axes();
    const s = this.state;
    if (s.playing) {
      s.h = Math.max(.08, s.h - dt * .55);
      if (s.h <= .0805) s.playing = false;
      this.syncH();
    }
    const a = s.a, h = s.h, b = a + h;
    const fa = F1(a), fb = F1(b);
    const m = (fb - fa) / h;

    tanLine(a, fa, T1(a), 'rgba(255,197,107,.9)', {w: 1.7, dash: [7, 6]});

    if (s.ghosts) {
      [1.75, 1.3, .85, .45].forEach(hh => {
        if (hh > 2 || Math.abs(hh - h) < .04) return;
        const x2 = a + hh;
        line({x: a, y: fa}, {x: x2, y: F1(x2)}, 'rgba(94,234,212,.22)', {w: 1.2});
      });
    }

    line({x: a, y: fa}, {x: b, y: fb}, '#5eead4', {w: 2.4, glow: 8});

    plot(F1, '#9ad0ff', {w: 2.6, glow: 6, lo: -4, hi: 4});

    line({x: b, y: 0}, {x: b, y: fb}, 'rgba(154,208,255,.3)', {w: 1, dash: [4, 4]});
    if (h > .32) {
      line({x: a, y: fa}, {x: b, y: fa}, 'rgba(94,234,212,.45)', {w: 1.2, dash: [4, 4]});
      line({x: b, y: fa}, {x: b, y: fb}, 'rgba(94,234,212,.45)', {w: 1.2, dash: [4, 4]});
      sans('Δx = ' + num(h, 2), X((a + b) / 2), Y(fa) + 15, '#8ff5e4', 11);
      math('Δy', X(b) + 14, Y((fa + fb) / 2), '#8ff5e4', 12, 'left');
    }

    dot({x: a, y: fa}, '#ffc56b', 5);
    dot({x: b, y: fb}, '#5eead4', 4.5);
    handle({x: a, y: fa}, '#ffc56b', hoverId === 'A');
    handle({x: b, y: fb}, '#5eead4', hoverId === 'B');
    math('A', X(a) - 16, Y(fa) - 14, '#ffd99a', 15);
    if (h > .38) math('B', X(b) + 15, Y(fb) - 14, '#8ff5e4', 15);

    const L = lim();
    const ly = L.y0 + .55;
    line({x: L.x0 + .35, y: ly}, {x: L.x0 + 1.1, y: ly}, '#5eead4', {w: 2.4});
    sans('割线 AB', X(L.x0 + 1.25), Y(ly), '#8ff5e4', 11, 'left');
    line({x: L.x0 + .35, y: ly + .7}, {x: L.x0 + 1.1, y: ly + .7}, '#ffc56b', {w: 1.7, dash: [6, 5]});
    sans('切线', X(L.x0 + 1.25), Y(ly + .7), '#ffd99a', 11, 'left');
  },
  hud() {
    const s = this.state;
    const m = (F1(s.a + s.h) - F1(s.a)) / s.h;
    return [
      {k: 'x₀', v: num(s.a, 2)},
      {k: 'Δx', v: num(s.h, 2)},
      {k: '割线斜率', v: num(m, 3)},
      {k: '切线斜率 f′(x₀)', v: num(T1(s.a), 3), hi: true},
      {k: '两者之差', v: num(Math.abs(m - T1(s.a)), 3)}
    ];
  },
  panel(el) {
    const s = this.state;
    this._h = addSlider(el, 'B 与 A 的横坐标差 Δx', .08, 2, .02, s.h,
      v => (+v).toFixed(2),
      v => { s.h = v; s.playing = false; });
    addToggle(el, '显示若干条割线', s.ghosts, v => s.ghosts = v);
    addBtn(el, '▶ 让 B 趋近 A', () => this.togglePlay(), 'ghost');
  }
});

/* ---------- 03 导数的几何意义 ---------- */
MODULES.push({
  key: 'tangent', tab: '03', name: '导数的几何意义', en: 'TANGENT LINE', blurb: '切线方程',
  accent: '#ffc56b', rgb: '255,197,107',
  hint: '拖动切点 P，观察切线斜率 f′(x₀) 与切线方程',
  state: {x0: 1.2, tri: true, normal: false},
  reset() { this.state.x0 = 1.2; this.state.tri = true; this.state.normal = false; this.syncX(); },
  syncX() { if (this._x) this._x.set(+this.state.x0.toFixed(1)); },
  meta() {
    return {
      title: '导数的几何意义：切线的斜率',
      desc: '曲线 y = f(x) 在点 P(x₀, f(x₀)) 处的切线斜率，就是导数值 f′(x₀)。拖动切点 P，切线随之绕 P 转动：导数越大切线越陡，导数为负时切线向右下倾斜。',
      formula: 'y − f(x₀) = f′(x₀)(x − x₀)',
      note: '对 <span class="nw">y = x²/2</span>，<span class="nw">f′(x₀) = x₀</span>，切线方程为 <span class="nw">y = x₀x − x₀²/2</span>，与 x 轴交于 <span class="nw">x₀/2</span>。'
    };
  },
  handles() { return [{id: 'P', x: this.state.x0, y: F1(this.state.x0)}]; },
  drag(id, p) {
    this.state.x0 = Math.round(clamp(clampPt(p).x, -3, 3) * 10) / 10;
    this.syncX();
  },
  draw() {
    setFrame(.5, .58, 12);
    base();
    axes();
    const s = this.state, L = lim();
    const x0 = s.x0, k = T1(x0), p = {x: x0, y: F1(x0)};
    const bc = -k * x0 / 2;

    plot(F1, '#9ad0ff', {w: 2.6, glow: 6, lo: -4, hi: 4});
    tanLine(x0, p.y, k, '#ffc56b', {w: 2.4, glow: 9});

    if (s.normal && Math.abs(k) > .18) {
      const nk = -1 / k, nd = Math.hypot(1, nk);
      tanLine(x0, p.y, nk, 'rgba(180,156,255,.75)', {w: 1.5, dash: [6, 6]});
      sans('法线', X(x0 + .95 / nd), Y(p.y + nk * .95 / nd) - 13, 'rgba(200,185,255,.85)', 11);
    }

    line({x: x0, y: 0}, {x: x0, y: p.y}, 'rgba(255,197,107,.35)', {w: 1, dash: [4, 4]});
    math('x₀', X(x0), Y(0) + 15, 'rgba(255,217,154,.8)', 12);

    if (s.tri) {
      const p1 = {x: x0 + 1, y: p.y}, p2 = {x: x0 + 1, y: p.y + k};
      line(p, p1, 'rgba(255,197,107,.55)', {w: 1.3, dash: [4, 4]});
      line(p1, p2, 'rgba(255,197,107,.55)', {w: 1.3, dash: [4, 4]});
      rightAngle(p1, {x: -1, y: 0}, {x: 0, y: k > 0 ? 1 : -1}, 9, 'rgba(255,255,255,.3)');
      const flip = x0 > 1.4;
      sans('1', X(x0 + .5), Y(p.y) + 14, 'rgba(255,217,154,.85)', 11);
      sans('f′(x₀) = ' + num(k, 2), X(x0 + 1) + (flip ? -12 : 12), Y(p.y + k / 2),
        '#ffd99a', 11, flip ? 'right' : 'left');
    }

    const xi = x0 / 2;
    if (Math.abs(xi) < 4) {
      dot({x: xi, y: 0}, 'rgba(255,197,107,.85)', 3.6);
      sans('x₀/2', X(xi), Y(0) - 14, 'rgba(255,217,154,.7)', 10);
    }

    dot(p, '#ffc56b', 5);
    handle(p, '#ffc56b', hoverId === 'P');
    math('P', X(x0) - 16, Y(p.y) - 14, '#ffd99a', 15);

    sans(lineEq(k, bc), X(L.x1 - .25), Y(L.y1 - .55), '#ffd99a', 12, 'right');
    sans('y = x²/2', X(L.x0 + .3), Y(L.y1 - .55), 'rgba(154,208,255,.75)', 12, 'left');
  },
  hud() {
    const s = this.state, k = T1(s.x0);
    return [
      {k: 'x₀', v: num(s.x0, 2)},
      {k: 'f(x₀)', v: num(F1(s.x0), 2)},
      {k: 'f′(x₀)', v: num(k, 2), hi: true},
      {k: '切线', v: lineEq(k, -k * s.x0 / 2)},
      {k: '与 x 轴交点', v: num(s.x0 / 2, 2)}
    ];
  },
  panel(el) {
    const s = this.state;
    this._x = addSlider(el, '切点横坐标 x₀', -3, 3, .1, s.x0,
      v => (+v).toFixed(1),
      v => s.x0 = v);
    addToggle(el, '显示斜率三角形', s.tri, v => s.tri = v);
    addToggle(el, '显示法线', s.normal, v => s.normal = v);
    const r = row(el);
    addBtn(r, 'x₀ = −2', () => { s.x0 = -2; this.syncX(); }, 'ghost');
    addBtn(r, 'x₀ = 1', () => { s.x0 = 1; this.syncX(); }, 'ghost');
  }
});

/* ---------- 04 单调性与导数的符号 ---------- */
MODULES.push({
  key: 'mono', tab: '04', name: '单调性', en: 'MONOTONICITY', blurb: 'f′ 的符号决定升降',
  accent: '#b49cff', rgb: '180,156,255',
  hint: '拖动点 P，观察 f′(x₀) 的符号与曲线升降',
  state: {x0: 1.6, shade: true, tan: true, chart: true},
  reset() { this.state.x0 = 1.6; this.state.shade = true; this.state.tan = true; this.state.chart = true; },
  meta() {
    return {
      title: '导数的符号决定单调性',
      desc: '在区间内 f′(x) &gt; 0，曲线上升；f′(x) &lt; 0，曲线下降；f′(x) = 0 的点是升降的分界。拖动点 P，观察导数符号与曲线升降如何一一对应。',
      formula: 'f′(x) &gt; 0 ⇒ f 递增　　f′(x) &lt; 0 ⇒ f 递减',
      note: '对 <span class="nw">y = x³/3 − x</span>，<span class="nw">f′(x) = x² − 1 = (x+1)(x−1)</span>。x &lt; −1 或 x &gt; 1 时导数为正，−1 &lt; x &lt; 1 时为负。'
    };
  },
  handles() { return [{id: 'P', x: this.state.x0, y: F2(this.state.x0)}]; },
  drag(id, p) { this.state.x0 = Math.round(clamp(clampPt(p).x, -2.4, 2.4) * 20) / 20; },
  draw() {
    setFrame(.5, .55, 11);
    base();
    axes();
    const s = this.state, L = lim();
    const x0 = s.x0, k = T2(x0), p = {x: x0, y: F2(x0)};

    if (s.shade) {
      band(-11, -1, 'rgba(180,156,255,.075)');
      band(-1, 1, 'rgba(255,143,171,.075)');
      band(1, 11, 'rgba(180,156,255,.075)');
    }

    plot(F2, '#b49cff', {w: 2.8, glow: 10, lo: -3, hi: 3});

    [-1, 1].forEach(xc => {
      line({x: xc, y: 0}, {x: xc, y: F2(xc)}, 'rgba(200,215,230,.3)', {w: 1, dash: [4, 4]});
      dot({x: xc, y: F2(xc)}, 'rgba(220,230,245,.85)', 3.4);
      math(xc < 0 ? '−1' : '1', X(xc), Y(0) + 15, 'rgba(200,215,230,.65)', 11);
    });

    if (s.tan) {
      const d = 1.1;
      line({x: x0 - d, y: p.y - k * d}, {x: x0 + d, y: p.y + k * d}, '#ffc56b', {w: 2.2, glow: 7});
      sans('切线斜率 ' + num(k, 2), X(x0) + 18, Y(p.y) - 18, '#ffd99a', 11, 'left');
    }

    line({x: x0, y: 0}, {x: x0, y: p.y}, 'rgba(255,255,255,.18)', {w: 1, dash: [4, 4]});
    dot(p, k > .05 ? '#8ff5e4' : k < -.05 ? '#ffb3c6' : '#ffd99a', 5);
    handle(p, '#b49cff', hoverId === 'P');
    math('P', X(x0) - 16, Y(p.y) - 14, '#c9b8ff', 15);

    sans(Math.abs(k) < .05 ? 'f′ = 0：临界点' : (k > 0 ? 'f′ > 0：递增' : 'f′ < 0：递减'),
      X(x0) + 18, Y(p.y) + 4, k > .05 ? '#8ff5e4' : k < -.05 ? '#ffb3c6' : '#ffd99a', 11, 'left');

    if (s.chart) {
      const cy = -2.95;
      const c0 = Math.max(L.x0 + .35, -3.4), c1 = Math.min(L.x1 - .35, 3.4);
      const segs = [
        [c0, Math.min(-1, c1), '#b49cff', '+'],
        [Math.max(-1, c0), Math.min(1, c1), '#ff8fab', '−'],
        [Math.max(1, c0), c1, '#b49cff', '+']
      ];
      segs.forEach(sg => {
        if (sg[1] - sg[0] < .1) return;
        line({x: sg[0], y: cy}, {x: sg[1], y: cy}, sg[2], {w: 5, alpha: .85});
        math(sg[3], X((sg[0] + sg[1]) / 2), Y(cy) - 17, sg[2], 15);
      });
      line({x: -1, y: cy - .17}, {x: -1, y: cy + .17}, 'rgba(220,230,240,.6)', {w: 1.4});
      line({x: 1, y: cy - .17}, {x: 1, y: cy + .17}, 'rgba(220,230,240,.6)', {w: 1.4});
      math('−1', X(-1), Y(cy) - 38, 'rgba(200,215,230,.7)', 11);
      math('1', X(1), Y(cy) - 38, 'rgba(200,215,230,.7)', 11);
      sans('f′(x) 的符号', X(c1), Y(cy) + 18, 'rgba(190,205,220,.55)', 10, 'right');
    }

    sans('y = x³/3 − x', X(L.x0 + .3), Y(L.y1 - .5), 'rgba(200,185,255,.75)', 12, 'left');
  },
  hud() {
    const s = this.state, k = T2(s.x0);
    const sg = Math.abs(k) < .05 ? '0' : (k > 0 ? '正' : '负');
    return [
      {k: 'x₀', v: num(s.x0, 2)},
      {k: 'f(x₀)', v: num(F2(s.x0), 2)},
      {k: 'f′(x₀)', v: num(k, 2), hi: true},
      {k: '导数符号', v: sg, hi: Math.abs(k) > .05},
      {k: '单调性', v: Math.abs(k) < .05 ? '临界点' : (k > 0 ? '递增' : '递减')}
    ];
  },
  panel(el) {
    const s = this.state;
    addToggle(el, '给单调区间着色', s.shade, v => s.shade = v);
    addToggle(el, '显示切线', s.tan, v => s.tan = v);
    addToggle(el, '显示导数符号表', s.chart, v => s.chart = v);
  }
});

/* ---------- 05 极值与最值 ---------- */
MODULES.push({
  key: 'extrema', tab: '05', name: '极值与最值', en: 'EXTREMA', blurb: 'f′(x) = 0 的点',
  accent: '#ff8fab', rgb: '255,143,171',
  hint: '拖动区间右端，比较极值与最值',
  state: {s: 1.6, ext: true},
  reset() { this.state.s = 1.6; this.state.ext = true; this.syncS(); },
  syncS() { if (this._s) this._s.set(+this.state.s.toFixed(2)); },
  meta() {
    return {
      title: '极值与最值：局部与整体',
      desc: '导数为零且左右变号的点，是函数的极值点。拖动区间右端 s：区间很短时函数单调，最值只能落在端点；区间变宽到 s &gt; 1 后，最大值与最小值改由极大值点、极小值点取得。极值是局部概念，最值是整体概念。',
      formula: 'f′(x₀) = 0 且左右异号 ⇒ x₀ 为极值点',
      note: '对 <span class="nw">y = x³/3 − x</span>：<span class="nw">f(−1) = 2/3</span> 是极大值，<span class="nw">f(1) = −2/3</span> 是极小值。区间 [−s, s] 中 s ≤ 1 时函数递减，最值在端点；1 &lt; s ≤ 2 时最值为 2/3 与 −2/3。'
    };
  },
  handles() { return [{id: 's', x: this.state.s, y: F2(this.state.s)}]; },
  drag(id, p) {
    this.state.s = Math.round(clamp(clampPt(p).x, .55, 2) * 20) / 20;
    this.syncS();
  },
  draw() {
    setFrame(.5, .55, 11);
    base();
    axes();
    const st = this.state, L = lim();
    const s = st.s;
    const fs = F2(s), fn = F2(-s);

    const cand = [{x: -s, y: fn}, {x: s, y: fs}];
    if (s > 1) { cand.push({x: -1, y: F2(-1)}, {x: 1, y: F2(1)}); }
    let mx = cand[0], mn = cand[0];
    cand.forEach(q => {
      if (q.y > mx.y + 1e-9) mx = q;
      if (q.y < mn.y - 1e-9) mn = q;
    });

    band(-s, s, 'rgba(255,143,171,.055)');
    plot(F2, 'rgba(255,143,171,.2)', {w: 1.6, lo: -3, hi: 3});
    plot(F2, '#ff8fab', {w: 2.9, glow: 10, lo: -s, hi: s});

    line({x: -s, y: 0}, {x: -s, y: fn}, 'rgba(230,240,250,.35)', {w: 1, dash: [4, 4]});
    line({x: s, y: 0}, {x: s, y: fs}, 'rgba(230,240,250,.35)', {w: 1, dash: [4, 4]});
    dot({x: -s, y: fn}, 'rgba(255,143,171,.9)', 4);
    dot({x: s, y: fs}, 'rgba(255,143,171,.9)', 4);
    handle({x: s, y: fs}, '#ff8fab', hoverId === 's');

    if (s > 1) {
      [-1, 1].forEach(xc => {
        line({x: xc, y: 0}, {x: xc, y: F2(xc)}, 'rgba(200,215,230,.28)', {w: 1, dash: [4, 4]});
        dot({x: xc, y: F2(xc)}, 'rgba(225,235,248,.9)', 3.4);
        math(xc < 0 ? '−1' : '1', X(xc), Y(0) + 15, 'rgba(200,215,230,.6)', 11);
      });
    }

    line({x: 0, y: mx.y}, {x: mx.x, y: mx.y}, 'rgba(255,197,107,.55)', {w: 1, dash: [4, 4]});
    line({x: 0, y: mn.y}, {x: mn.x, y: mn.y}, 'rgba(123,224,192,.55)', {w: 1, dash: [4, 4]});
    dot(mx, '#ffc56b', 5.5);
    dot(mn, '#7be0c0', 5.5);
    if (st.ext) {
      sans('最大值 ' + num(mx.y, 2), X(mx.x), Y(mx.y) - 17, '#ffd99a', 11);
      sans('最小值 ' + num(mn.y, 2), X(mn.x), Y(mn.y) + 19, '#9ff0d8', 11);
      if (s > 1) {
        sans('极大值点', X(-1) - 16, Y(F2(-1)) + 16, 'rgba(255,217,154,.75)', 10, 'right');
        sans('极小值点', X(1) + 16, Y(F2(1)) - 16, 'rgba(159,240,216,.75)', 10, 'left');
      }
    }

    sans('区间 [−' + num(s, 2) + ', ' + num(s, 2) + ']', X(L.x0 + .3), Y(L.y1 - .55),
      'rgba(255,179,198,.8)', 12, 'left');
  },
  hud() {
    const s = this.state.s;
    const fs = F2(s), fn = F2(-s);
    const cand = [{x: -s, y: fn}, {x: s, y: fs}];
    if (s > 1) { cand.push({x: -1, y: F2(-1)}, {x: 1, y: F2(1)}); }
    let mx = cand[0], mn = cand[0];
    cand.forEach(q => {
      if (q.y > mx.y + 1e-9) mx = q;
      if (q.y < mn.y - 1e-9) mn = q;
    });
    return [
      {k: '区间右端 s', v: num(s, 2)},
      {k: 'f(−s)', v: num(fn, 2)},
      {k: 'f(s)', v: num(fs, 2)},
      {k: '最大值', v: num(mx.y, 2) + '（x = ' + num(mx.x, 2) + '）', hi: true},
      {k: '最小值', v: num(mn.y, 2) + '（x = ' + num(mn.x, 2) + '）', hi: true}
    ];
  },
  panel(el) {
    const s = this.state;
    this._s = addSlider(el, '区间右端 s（区间 [−s, s]）', .55, 2, .05, s.s,
      v => (+v).toFixed(2),
      v => s.s = v);
    addToggle(el, '标注最大值与最小值', s.ext, v => s.ext = v);
    const r = row(el);
    addBtn(r, '缩到 s = 0.8', () => { s.s = .8; this.syncS(); }, 'ghost');
    addBtn(r, '展开到 s = 2', () => { s.s = 2; this.syncS(); }, 'ghost');
  }
});

})();
