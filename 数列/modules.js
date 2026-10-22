/* ============================================================
   选择性必修第二册 · 第 4 章 数列
   ============================================================ */
(function () {

const SUB = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];

function f2(v) {
  const s = (Math.abs(v) < 5e-3 ? 0 : v).toFixed(2);
  return s.indexOf('.') >= 0 ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
}

function axes(tx, ty) {
  const L = lim();
  line({x: L.x0, y: 0}, {x: L.x1, y: 0}, 'rgba(200,225,235,.45)', {w: 1.4});
  line({x: 0, y: L.y0}, {x: 0, y: L.y1}, 'rgba(200,225,235,.45)', {w: 1.4});
  arrow({x: L.x1 - .6, y: 0}, {x: L.x1, y: 0}, 'rgba(200,225,235,.55)', {w: 1.2, head: 8});
  arrow({x: 0, y: L.y1 - .6}, {x: 0, y: L.y1}, 'rgba(200,225,235,.55)', {w: 1.2, head: 8});
  if (tx) sans(tx, X(L.x1) - 6, Y(0) + 16, 'rgba(175,200,215,.8)', 12, 'right');
  if (ty) sans(ty, X(0) + 12, Y(L.y1) + 18, 'rgba(175,200,215,.8)', 12, 'left');
  return L;
}

function ticksN(a, b) {
  for (let k = a; k <= b; k++) {
    line({x: k, y: -.1}, {x: k, y: .1}, 'rgba(200,225,235,.5)', {w: 1});
    sans(String(k), X(k), Y(0) + 15, 'rgba(160,185,200,.7)', 10.5);
  }
}

/* ---------- 01 数列与通项 ---------- */
MODULES.push({
  key: 'terms', tab: '01', name: '数列与通项', en: 'TERMS', blurb: '序号与项的对应',
  accent: '#5eead4', rgb: '94,234,212',
  hint: '拖动高亮点或调节 n，观察 aₙ 随序号变化',
  state: {n: 3, curve: true, list: true},
  reset() { this.state.n = 3; this.state.curve = true; this.state.list = true; this.slN = null; },
  term(k) { return 12 / (k + 2); },
  meta() {
    return {
      title: '数列：按序号排好的一列数',
      desc: '按一定顺序排列的一列数叫做数列，每一项由它的序号唯一确定。把序号 n 作横坐标、项 aₙ 作纵坐标描点，就得到数列的图象——一串孤立的点。拖动亮点或调节 n，观察 aₙ 怎样随序号变化。',
      formula: 'aₙ = 12/(n + 2)，n ∈ N*',
      note: '数列的定义域是正整数集（或其子集），图象是<b>离散的点</b>，不是连续曲线。本例中 aₙ 随 n 增大而<b>递减</b>，并无限趋近于 0。'
    };
  },
  handles() { return [{id: 'pt', x: this.state.n, y: this.term(this.state.n)}]; },
  drag(id, p) {
    const q = clampPt(p);
    this.state.n = clamp(Math.round(q.x), 1, 8);
    if (this.slN) this.slN.set(this.state.n);
  },
  draw() {
    setFrame(.4, .55, 16);
    base();
    const L = axes('n', 'aₙ');
    const s = this.state;
    ticksN(1, 8);

    if (s.curve) {
      let prev = null;
      for (let x = .34; x <= 8.9; x += .04) {
        const p = {x: x, y: this.term(x)};
        if (prev) line(prev, p, 'rgba(94,234,212,.3)', {w: 1.6});
        prev = p;
      }
      sans('aₙ = 12/(n+2)', X(8.7), Y(2.7), 'rgba(94,234,212,.8)', 11.5, 'right');
    }

    for (let k = 1; k <= 8; k++) {
      const y = this.term(k);
      line({x: k, y: 0}, {x: k, y: y}, 'rgba(94,234,212,.14)', {w: 1, dash: [3, 4]});
      dot({x: k, y: y}, k === s.n ? '#fff1cf' : '#5eead4', 4.2);
    }

    const an = this.term(s.n);
    line({x: 0, y: an}, {x: s.n, y: an}, 'rgba(255,255,255,.22)', {w: 1.2, dash: [5, 5]});
    line({x: s.n, y: 0}, {x: s.n, y: an}, 'rgba(255,255,255,.28)', {w: 1.2, dash: [5, 5]});
    math('a' + SUB[s.n] + ' = ' + f2(an), X(s.n) + 15, Y(an) - 15, '#ffe7b8', 15, 'left');

    if (s.list) {
      sans('前几项', X(-5.85), Y(5.05), 'rgba(160,200,210,.7)', 11, 'left');
      for (let k = 1; k <= 6; k++) {
        const yy = 4.35 - (k - 1) * .62;
        const on = k === s.n;
        math('a' + SUB[k] + ' = ' + f2(this.term(k)), X(-5.85), Y(yy),
          on ? '#ffffff' : 'rgba(150,190,200,.6)', on ? 14.5 : 12.5, 'left');
      }
    }

    handle({x: s.n, y: an}, '#ffc56b', hoverId === 'pt');
  },
  hud() {
    const s = this.state, an = this.term(s.n);
    return [
      {k: '序号 n', v: String(s.n), hi: true},
      {k: 'aₙ', v: f2(an), hi: true},
      {k: 'aₙ₊₁', v: s.n < 8 ? f2(this.term(s.n + 1)) : '—'},
      {k: '相邻两项之差', v: s.n > 1 ? f2(an - this.term(s.n - 1)) : '—'},
      {k: 'n 增大时', v: '递减 · 趋近 0'}
    ];
  },
  panel(el) {
    const s = this.state;
    this.slN = addSlider(el, '序号 n', 1, 8, 1, s.n, v => String(v), v => s.n = v);
    addToggle(el, '显示通项曲线（辅助）', s.curve, v => s.curve = v);
    addToggle(el, '显示前几项列表', s.list, v => s.list = v);
    addBtn(el, '下一项 →', () => {
      s.n = s.n >= 8 ? 1 : s.n + 1;
      if (this.slN) this.slN.set(s.n);
    }, 'ghost');
  }
});

/* ---------- 02 等差数列 ---------- */
MODULES.push({
  key: 'arith', tab: '02', name: '等差数列', en: 'ARITHMETIC', blurb: '公差 d 与共线点列',
  accent: '#6cb6ff', rgb: '108,182,255',
  hint: '拖动 a₁ 或 a₂ 的点，观察点列是否始终共线',
  state: {a1: 1, d: .6, showD: true},
  reset() { this.state.a1 = 1; this.state.d = .6; this.state.showD = true; this.slA = null; this.slD = null; },
  val(k) { return this.state.a1 + (k - 1) * this.state.d; },
  meta() {
    return {
      title: '等差数列：公差恒定，点列共线',
      desc: '从第 2 项起，每一项与前一项的差都等于同一个常数 d，这样的数列叫等差数列，d 称为公差。把点 (n, aₙ) 描出来，它们恰好落在一条直线上。拖动 a₁、a₂ 两点，或调节滑块，观察直线与公差如何联动。',
      formula: 'aₙ = a₁ + (n − 1)d',
      note: 'd &gt; 0 时数列递增，d &lt; 0 时递减，d = 0 时为常数列。相邻两点间的竖直高度差恒为 <span class="nw">d</span>，这正是点列共线的原因。'
    };
  },
  handles() { return [{id: 'p1', x: 1, y: this.val(1)}, {id: 'p2', x: 2, y: this.val(2)}]; },
  drag(id, p) {
    const q = clampPt(p);
    const s = this.state;
    if (id === 'p1') {
      s.a1 = clamp(Math.round(q.y * 10) / 10, -1.5, 2.5);
      if (this.slA) this.slA.set(s.a1);
    } else {
      s.d = clamp(Math.round((q.y - s.a1) * 20) / 20, -.6, .6);
      if (this.slD) this.slD.set(s.d);
    }
  },
  draw() {
    setFrame(.4, .55, 16);
    base();
    const L = axes('n', 'aₙ');
    const s = this.state;
    ticksN(1, 8);
    const A = k => s.a1 + (k - 1) * s.d;

    line({x: L.x0, y: A(L.x0)}, {x: 8.7, y: A(8.7)}, 'rgba(108,182,255,.42)', {w: 1.5, dash: [7, 6]});

    for (let k = 1; k <= 7; k++) {
      const y = A(k);
      line({x: k, y: 0}, {x: k, y: y}, 'rgba(108,182,255,.14)', {w: 1});
      dot({x: k, y: y}, '#6cb6ff', 4.4);
      sans('a' + SUB[k], X(k) + 12, Y(y) + 15, 'rgba(160,200,245,.7)', 10.5, 'left');
    }

    if (s.showD) {
      for (let k = 1; k <= 6; k++) {
        const xr = k + .78;
        line({x: k + .4, y: A(k)}, {x: xr, y: A(k)}, 'rgba(255,255,255,.22)', {w: 1, dash: [3, 4]});
        line({x: xr, y: A(k)}, {x: xr, y: A(k + 1)}, 'rgba(255,255,255,.22)', {w: 1, dash: [3, 4]});
      }
      math('d = ' + f2(s.d), X(1.95), Y((A(1) + A(2)) / 2), '#ffd8a0', 13, 'left');
    }

    math('aₙ = a₁ + (n − 1)d', X(L.x0 + 2.6), Y(5.3), 'rgba(160,205,255,.85)', 14);

    handle({x: 1, y: A(1)}, '#6cb6ff', hoverId === 'p1');
    handle({x: 2, y: A(2)}, '#ffc56b', hoverId === 'p2');
  },
  hud() {
    const s = this.state;
    const an = this.val(7);
    let trend = '常数列（d = 0）';
    if (s.d > 1e-6) trend = '递增';
    else if (s.d < -1e-6) trend = '递减';
    return [
      {k: '首项 a₁', v: f2(s.a1), hi: true},
      {k: '公差 d', v: f2(s.d), hi: true},
      {k: 'a₂ − a₁', v: f2(this.val(2) - this.val(1))},
      {k: 'a₇', v: f2(an)},
      {k: '单调性', v: trend}
    ];
  },
  panel(el) {
    const s = this.state;
    this.slA = addSlider(el, '首项 a₁', -1.5, 2.5, .1, s.a1, v => f2(v), v => s.a1 = v);
    this.slD = addSlider(el, '公差 d', -.6, .6, .05, s.d, v => f2(v), v => s.d = v);
    addToggle(el, '标出公差 d', s.showD, v => s.showD = v);
    addBtn(el, '令 d = 0（常数列）', () => {
      s.d = 0;
      if (this.slD) this.slD.set(0);
    }, 'ghost');
  }
});

/* ---------- 03 等比数列 ---------- */
MODULES.push({
  key: 'geom', tab: '03', name: '等比数列', en: 'GEOMETRIC', blurb: '公比 q 与指数变化',
  accent: '#ff8fab', rgb: '255,143,171',
  hint: '拖动 a₁ 或 a₂ 的点，观察 q 对增长与衰减的影响',
  state: {a1: 1, q: 1.3},
  reset() { this.state.a1 = 1; this.state.q = 1.3; this.slA = null; this.slQ = null; },
  val(k) { return this.state.a1 * Math.pow(this.state.q, k - 1); },
  meta() {
    return {
      title: '等比数列：公比恒定，指数增减',
      desc: '从第 2 项起，每一项与前一项的比都等于同一个常数 q，这样的数列叫等比数列，q 称为公比。q &gt; 1 时项随序号指数增长，0 &lt; q &lt; 1 时指数衰减。拖动 a₂ 改变公比，观察点列的弯曲方向如何变化。',
      formula: 'aₙ = a₁ · qⁿ⁻¹（q ≠ 0）',
      note: '等比数列的点列<b>不共线</b>，整体呈指数曲线形状。相邻两项之比恒为 <span class="nw">aₙ₊₁ / aₙ = q</span>；q = 1 时退化为常数列。'
    };
  },
  handles() { return [{id: 'p1', x: 1, y: this.val(1)}, {id: 'p2', x: 2, y: this.val(2)}]; },
  drag(id, p) {
    const q = clampPt(p);
    const s = this.state;
    if (id === 'p1') {
      s.a1 = clamp(Math.round(q.y * 20) / 20, .5, 2);
      if (this.slA) this.slA.set(s.a1);
    } else {
      s.q = clamp(Math.round((q.y / s.a1) * 20) / 20, .5, 1.3);
      if (this.slQ) this.slQ.set(s.q);
    }
  },
  draw() {
    setFrame(.3, .86, 14);
    base();
    const L = axes('n', 'aₙ');
    const s = this.state;
    ticksN(1, 6);
    const A = k => s.a1 * Math.pow(s.q, k - 1);

    let prev = null;
    for (let x = .6; x <= 6.4; x += .03) {
      const y = s.a1 * Math.pow(s.q, x - 1);
      if (prev) line(prev, {x: x, y: y}, 'rgba(255,143,171,.3)', {w: 1.6});
      prev = {x: x, y: y};
    }
    line({x: 1, y: s.a1}, {x: 6.4, y: s.a1}, 'rgba(255,255,255,.13)', {w: 1, dash: [4, 5]});

    for (let k = 1; k <= 6; k++) {
      const y = A(k);
      line({x: k, y: 0}, {x: k, y: y}, 'rgba(255,143,171,.16)', {w: 1, dash: [3, 4]});
      dot({x: k, y: y}, '#ff8fab', 4.4);
      sans(f2(y), X(k), Y(y) - 13, 'rgba(255,185,205,.85)', 10.5);
    }

    math('aₙ = a₁·qⁿ⁻¹', X(L.x0 + 2.6), Y(5.7), 'rgba(255,170,195,.9)', 14);
    math('q = ' + f2(s.q), X(L.x0 + 2.6), Y(5.05), 'rgba(255,205,220,.85)', 12.5);

    const xr = 1.45;
    line({x: xr, y: A(1)}, {x: xr, y: A(2)}, 'rgba(255,255,255,.22)', {w: 1, dash: [3, 3]});
    math('×q', X(xr) + 9, Y((A(1) + A(2)) / 2), 'rgba(255,225,235,.85)', 12, 'left');

    handle({x: 1, y: A(1)}, '#ffd0dd', hoverId === 'p1');
    handle({x: 2, y: A(2)}, '#ffc56b', hoverId === 'p2');
  },
  hud() {
    const s = this.state;
    let trend = '常数列';
    if (s.q > 1 + 1e-6) trend = '递增（指数增长）';
    else if (s.q < 1 - 1e-6) trend = '递减（指数衰减）';
    return [
      {k: '首项 a₁', v: f2(s.a1), hi: true},
      {k: '公比 q', v: f2(s.q), hi: true},
      {k: 'a₆', v: f2(this.val(6))},
      {k: 'a₂ / a₁', v: f2(this.val(2) / s.a1)},
      {k: '变化趋势', v: trend}
    ];
  },
  panel(el) {
    const s = this.state;
    this.slA = addSlider(el, '首项 a₁', .5, 2, .05, s.a1, v => f2(v), v => s.a1 = v);
    this.slQ = addSlider(el, '公比 q', .5, 1.3, .05, s.q, v => f2(v), v => s.q = v);
    const r = row(el);
    addBtn(r, '递增', () => { s.q = 1.2; if (this.slQ) this.slQ.set(1.2); }, 'ghost');
    addBtn(r, '递减', () => { s.q = .6; if (this.slQ) this.slQ.set(.6); }, 'ghost');
    addBtn(r, '常数列', () => { s.q = 1; if (this.slQ) this.slQ.set(1); }, 'ghost');
  }
});

/* ---------- 04 前 n 项和 ---------- */
MODULES.push({
  key: 'sum', tab: '04', name: '前 n 项和', en: 'SUM', blurb: '柱形堆叠与倒序相加',
  accent: '#ffc56b', rgb: '255,197,107',
  hint: '拖动最后一根柱子的顶端，或调节 n 观察 Sₙ',
  state: {a1: 1, d: .4, n: 6, rect: true},
  reset() { this.state.a1 = 1; this.state.d = .4; this.state.n = 6; this.state.rect = true; this.slN = null; this.slA = null; this.slD = null; },
  val(k) { return this.state.a1 + (k - 1) * this.state.d; },
  sum() { const s = this.state; return s.n * (s.a1 + this.val(s.n)) / 2; },
  meta() {
    return {
      title: '前 n 项和：柱形面积与倒序相加',
      desc: '把每一项画成一根宽度为 1 的柱子，前 n 项和就是这些柱子的总面积。再取一份倒过来的柱子，两份恰好拼成一个 n × (a₁ + aₙ) 的大矩形，于是一次性得到求和公式。调节 n 与公差 d，观察面积与公式如何同步变化。',
      formula: 'Sₙ = n(a₁ + aₙ)/2 = na₁ + n(n − 1)d/2',
      note: '虚线高度 (a₁ + aₙ)/2 是各项的<b>平均值</b>，Sₙ 等于“平均项 × 项数”。打开矩形开关，可以看到 <span class="nw">2Sₙ = n(a₁ + aₙ)</span>。'
    };
  },
  handles() {
    const s = this.state;
    if (s.n < 2) return [];
    return [{id: 'top', x: s.n + .5, y: this.val(s.n)}];
  },
  drag(id, p) {
    const q = clampPt(p);
    const s = this.state;
    if (s.n < 2) return;
    s.d = clamp(Math.round(((q.y - s.a1) / (s.n - 1)) * 20) / 20, 0, .6);
    if (this.slD) this.slD.set(s.d);
  },
  draw() {
    setFrame(.3, .84, 15);
    base();
    const L = axes('n', '项');
    const s = this.state, n = s.n, a1 = s.a1, d = s.d;
    ticksN(1, 8);
    const A = k => a1 + (k - 1) * d;
    const an = A(n), S = n * (a1 + an) / 2, avg = (a1 + an) / 2;

    for (let k = 1; k <= n; k++) {
      const h = A(k);
      ctx.save();
      ctx.fillStyle = 'rgba(255,197,107,.16)';
      ctx.strokeStyle = 'rgba(255,197,107,.6)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.rect(X(k) + 2, Y(h), V.k - 4, Y(0) - Y(h));
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      if (h > .55) sans(f2(h), X(k + .5), Y(h) + 14, 'rgba(255,228,185,.9)', 10.5);
    }

    line({x: 1, y: avg}, {x: n + 1, y: avg}, 'rgba(255,255,255,.5)', {w: 1.5, dash: [6, 5]});
    math('S' + SUB[n] + ' = ' + f2(S), X(1) - 18, Y(avg) - 16, '#ffe1ad', 15, 'right');
    math('(a₁+aₙ)/2 = ' + f2(avg), X(1) - 18, Y(avg) + 16, 'rgba(255,255,255,.62)', 12, 'right');

    if (s.rect) {
      ctx.save();
      ctx.setLineDash([7, 6]);
      ctx.strokeStyle = 'rgba(255,197,107,.5)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(X(1), Y(a1 + an), n * V.k, (a1 + an) * V.k);
      ctx.restore();
      sans('2S' + SUB[n] + ' = n(a₁+aₙ) = ' + f2(2 * S), X(1) + n * V.k / 2, Y(a1 + an) + 16, 'rgba(255,215,160,.9)', 11);
    }

    if (n >= 2) handle({x: n + .5, y: an}, '#ffc56b', hoverId === 'top');
  },
  hud() {
    const s = this.state;
    const an = this.val(s.n), S = this.sum();
    return [
      {k: '项数 n', v: String(s.n), hi: true},
      {k: '末项 aₙ', v: f2(an), hi: true},
      {k: 'Sₙ', v: f2(S), hi: true},
      {k: '平均项 (a₁+aₙ)/2', v: f2((s.a1 + an) / 2)},
      {k: '2Sₙ', v: f2(2 * S)}
    ];
  },
  panel(el) {
    const s = this.state;
    this.slA = addSlider(el, '首项 a₁', .5, 2.5, .1, s.a1, v => f2(v), v => s.a1 = v);
    this.slD = addSlider(el, '公差 d', 0, .6, .05, s.d, v => f2(v), v => s.d = v);
    this.slN = addSlider(el, '项数 n', 1, 8, 1, s.n, v => String(v), v => s.n = v);
    addToggle(el, '显示倒序相加的矩形', s.rect, v => s.rect = v);
  }
});

/* ---------- 05 递推数列 ---------- */
const REC = [
  {name: 'aₙ₊₁ = aₙ/2 + 1', short: 'aₙ/2+1', a0: 3.5, f: x => x / 2 + 1, fix: 2, desc: '单调递增，趋近 2'},
  {name: 'aₙ₊₁ = (aₙ + 3/aₙ)/2', short: '(aₙ+3/aₙ)/2', a0: .6, f: x => (x + 3 / x) / 2, fix: Math.sqrt(3), desc: '单调递减，趋近 √3'},
  {name: 'aₙ₊₁ = 3 − 0.8aₙ', short: '3−0.8aₙ', a0: .6, f: x => 3 - .8 * x, fix: 5 / 3, desc: '左右摆动，趋近 5/3'}
];

MODULES.push({
  key: 'recur', tab: '05', name: '递推数列', en: 'RECURSION', blurb: 'aₙ₊₁ = f(aₙ) 的迭代',
  accent: '#b49cff', rgb: '180,156,255',
  hint: '拖动 x 轴上的 a₁，或切换递推式，观察迭代走向',
  state: {which: 1, a1: 1, steps: 5},
  reset() { this.state.which = 1; this.state.a1 = REC[1].a0; this.state.steps = 5; this.slA = null; this.slS = null; },
  vals() {
    const f = REC[this.state.which].f;
    const out = [this.state.a1];
    for (let i = 0; i < this.state.steps; i++) out.push(f(out[out.length - 1]));
    return out;
  },
  meta() {
    return {
      title: '递推数列：由前一项推出后一项',
      desc: '若数列的每一项由前一项按同一规则算出，即 aₙ₊₁ = f(aₙ)，就称它是递推数列。给定首项 a₁，逐次迭代即可得到整个数列。画布上紫色曲线是 y = f(x)，斜线是 y = x，阶梯状折线把每次迭代“搬运”到对角线上。',
      formula: 'aₙ₊₁ = f(aₙ)，n ∈ N*',
      note: '折线被“吸”向曲线与斜线的交点，该点满足 <span class="nw">x = f(x)</span>，就是数列的极限。斜率绝对值小于 1 时迭代收敛，正负号决定是单调靠近还是左右摆动。'
    };
  },
  handles() { return [{id: 'a1', x: this.state.a1, y: 0}]; },
  drag(id, p) {
    const q = clampPt(p);
    this.state.a1 = clamp(Math.round(q.x * 20) / 20, .5, 4);
    if (this.slA) this.slA.set(this.state.a1);
  },
  draw() {
    setFrame(.46, .5, 13);
    base();
    const L = axes('aₙ', 'aₙ₊₁');
    const s = this.state, R = REC[s.which], f = R.f;

    for (let i = 1; i <= 4; i++) {
      line({x: i, y: -.1}, {x: i, y: .1}, 'rgba(200,225,235,.4)', {w: 1});
      sans(String(i), X(i), Y(0) + 15, 'rgba(160,185,200,.65)', 10);
    }

    line({x: L.x0, y: L.x0}, {x: L.x1, y: L.x1}, 'rgba(255,255,255,.24)', {w: 1.3, dash: [6, 5]});
    sans('y = x', X(4.2), Y(4.2) + 16, 'rgba(200,215,225,.7)', 11);

    let prev = null;
    const xa = s.which === 1 ? .42 : L.x0 + .3;
    for (let x = xa; x <= 4.8; x += .03) {
      const y = f(x);
      if (y > L.y0 - 1 && y < L.y1 + 1) {
        if (prev) line(prev, {x: x, y: y}, 'rgba(180,156,255,.55)', {w: 2});
        prev = {x: x, y: y};
      } else prev = null;
    }
    sans('y = f(x)', X(3.55), Y(f(3.55)) + 18, 'rgba(200,180,255,.85)', 11.5);

    const vs = this.vals();
    let p = {x: vs[0], y: 0};
    for (let i = 0; i < s.steps; i++) {
      const y = vs[i + 1];
      line({x: p.x, y: p.y}, {x: p.x, y: y}, 'rgba(180,156,255,.9)', {w: 1.8});
      line({x: p.x, y: y}, {x: y, y: y}, 'rgba(180,156,255,.9)', {w: 1.8});
      dot({x: y, y: y}, '#d9caff', 3.4);
      p = {x: y, y: y};
    }
    dot({x: R.fix, y: R.fix}, 'rgba(255,255,255,.55)', 3.6);
    math(f2(R.fix), X(R.fix) + 13, Y(R.fix) + 24, 'rgba(255,255,255,.7)', 12, 'left');

    math('a₁ = ' + f2(vs[0]), X(vs[0]), Y(0) + 34, '#e3d9ff', 13);
    handle({x: vs[0], y: 0}, '#ffc56b', hoverId === 'a1');
  },
  hud() {
    const s = this.state, R = REC[s.which], vs = this.vals();
    const last = vs[vs.length - 1];
    return [
      {k: '首项 a₁', v: f2(vs[0]), hi: true},
      {k: '递推式', v: R.name.replace('aₙ₊₁ = ', ''), hi: true},
      {k: '第 ' + (s.steps + 1) + ' 项', v: f2(last)},
      {k: '走势', v: R.desc},
      {k: '不动点', v: f2(R.fix)}
    ];
  },
  panel(el) {
    const s = this.state;
    const r = row(el);
    REC.forEach((R, i) => {
      addBtn(r, (s.which === i ? '● ' : '○ ') + R.short, () => {
        s.which = i;
        s.a1 = R.a0;
        buildPanel();
      }, 'ghost');
    });
    this.slA = addSlider(el, '首项 a₁', .5, 4, .05, s.a1, v => f2(v), v => s.a1 = v);
    this.slS = addSlider(el, '迭代步数', 2, 6, 1, s.steps, v => String(v), v => s.steps = v);
  }
});

})();
