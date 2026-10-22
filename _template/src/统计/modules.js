/* ============================================================
   必修第二册 · 第 9 章 统计
   ============================================================ */
(function () {

/* ---------- 公共小工具 ---------- */
function ring(x, y, r, color, lw, fill) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  ctx.strokeStyle = color;
  ctx.lineWidth = lw || 1.4;
  ctx.stroke();
  ctx.restore();
}
function meanOf(a) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i];
  return a.length ? s / a.length : 0;
}
function medianOf(a) {
  const b = a.slice().sort((p, q) => p - q), n = b.length;
  if (!n) return 0;
  return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2;
}
function modeOf(a) {
  const m = new Map();
  for (let i = 0; i < a.length; i++) m.set(a[i], (m.get(a[i]) || 0) + 1);
  let f = 0;
  m.forEach(c => { if (c > f) f = c; });
  const vals = [];
  m.forEach((c, v) => { if (c === f) vals.push(v); });
  vals.sort((p, q) => p - q);
  return {freq: f, vals: f > 1 ? vals : []};
}
function num(v) { return String(Math.round(v * 100) / 100); }
function pickSample(N, n) {
  const a = [];
  for (let i = 0; i < N; i++) a.push(i);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(Math.random() * (N - i));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a.slice(0, n).sort((x, y) => x - y);
}
function edgeLabel(txt, wx, py, color, size) {
  const px = X(wx), flip = px > W - 78;
  sans(txt, px + (flip ? -7 : 7), py, color, size, flip ? 'right' : 'left');
}
function subP(p) {
  const d = '₀₁₂₃₄₅₆₇₈₉';
  return String(p).split('').map(c => d[+c]).join('');
}

/* ---------- 01 简单随机抽样 ---------- */
MODULES.push({
  key: 'sampling', tab: '01', name: '简单随机抽样', en: 'SAMPLING', blurb: '从总体中抽取样本',
  accent: '#5eead4', rgb: '94,234,212',
  hint: '调节样本容量，点击「抽取样本」，观察入样的个体',
  state: {n: 8, sel: [], showNo: true, t: 0},
  reset() { this.state.n = 8; this.state.sel = []; this.state.showNo = true; this.state.t = 0; },
  meta() {
    return {
      title: '简单随机抽样：每个个体机会均等',
      desc: '总体由 <b>N = 40</b> 个个体组成。从中不放回地抽取 n 个个体，若每个个体被抽到的机会相同，这样的抽样就是简单随机抽样。调节样本容量并点击抽取，观察样本编号的分布。',
      formula: 'P(每个个体被抽到) = n / N',
      note: '常用<b>抽签法</b>或<b>随机数法</b>实现。样本容量越大，样本的频率分布通常越接近总体的分布。'
    };
  },
  draw(dt) {
    setFrame(.5, .52, 13);
    base();
    const s = this.state;
    s.t += dt || 0;
    const cols = 10, x0 = -4.5, dx = 1, yTop = 1.45, dy = .95;
    for (let k = 0; k < 40; k++) {
      const c = k % cols, r = (k / cols) | 0;
      const px = X(x0 + c * dx), py = Y(yTop - r * dy);
      const on = s.sel.indexOf(k) >= 0;
      if (on) {
        const pulse = 1 + .07 * Math.sin(s.t * 3.2 + k * .7);
        ctx.save();
        ctx.shadowColor = 'rgba(94,234,212,.75)';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(px, py, 13 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(94,234,212,.16)';
        ctx.fill();
        ctx.restore();
        ring(px, py, 11.5, '#5eead4', 2);
        if (s.showNo) sans(String(k + 1), px, py, '#dcfff9', 8.5);
      } else {
        ring(px, py, 9.5, 'rgba(150,182,196,.32)', 1.2);
        if (s.showNo) sans(String(k + 1), px, py, 'rgba(150,175,190,.62)', 8);
      }
    }
    sans('总体 N = 40', X(-4.5), Y(2.15), 'rgba(160,195,205,.8)', 10.5, 'left');
    ring(X(3.9), Y(2.15), 6, '#5eead4', 2);
    sans('样本（已抽 ' + s.sel.length + ' 个）', X(4.1), Y(2.15), 'rgba(160,195,205,.8)', 10, 'left');

    const txt = s.sel.length ? '样本编号：' + s.sel.map(i => i + 1).join('、') : '尚未抽取样本，点击左侧「抽取样本」';
    sans(txt, X(0), Y(-2.35), 'rgba(190,215,225,.75)', 10.5);
  },
  hud() {
    const s = this.state;
    return [
      {k: '总体容量 N', v: '40'},
      {k: '样本容量 n', v: String(s.n), hi: true},
      {k: '已抽个体数', v: s.sel.length + ' / ' + s.n, hi: s.sel.length === s.n},
      {k: '入样概率 n/N', v: (s.n / 40).toFixed(3)}
    ];
  },
  panel(el) {
    const s = this.state;
    addSlider(el, '样本容量 n', 4, 16, 1, s.n, v => String(v), v => { s.n = v; s.sel = []; });
    addToggle(el, '显示个体编号', s.showNo, v => s.showNo = v);
    const r = row(el);
    addBtn(r, '抽取样本', () => { s.sel = pickSample(40, s.n); });
    addBtn(r, '清空', () => { s.sel = []; }, 'ghost');
  }
});

/* ---------- 02 频率分布直方图 ---------- */
const SCORES = [
  55, 58, 60, 62, 63, 64, 65, 66, 66, 67,
  68, 68, 69, 70, 70, 71, 71, 72, 72, 73,
  73, 74, 74, 75, 75, 75, 76, 76, 77, 77,
  78, 78, 79, 79, 80, 81, 81, 82, 83, 84,
  85, 86, 87, 88, 90, 92, 94, 95, 96, 98
];
function scoreX(v) { return (v - 75) / 6; }

MODULES.push({
  key: 'hist', tab: '02', name: '频率分布直方图', en: 'HISTOGRAM', blurb: '组距与频率密度',
  accent: '#6cb6ff', rgb: '108,182,255',
  hint: '拖动起点手柄或改变组距，观察矩形面积之和',
  state: {w: 10, a0: 50, data: SCORES.slice(), showH: true},
  reset() { this.state.w = 10; this.state.a0 = 50; this.state.data = SCORES.slice(); this.state.showH = true; },
  meta() {
    return {
      title: '直方图：用面积表示频率',
      desc: '把 50 个数据分组，矩形的高取<b>频率与组距的比值</b>，于是每个矩形的面积恰好等于该组的频率。拖动起点或改变组距，看矩形如何重新排列，而所有矩形面积之和始终为 1。',
      formula: 'h = 频率 / 组距　　Σ(h × d) = 1',
      note: '组距越小，分组越细，直方图越能反映数据的分布形状；但组数过多时，每组的频率很小，图形会变得零碎。'
    };
  },
  bins() {
    const s = this.state, d = s.data, n = d.length, w = s.w, a0 = s.a0;
    const maxV = Math.max.apply(null, d);
    const k = Math.floor((maxV - a0) / w + 1e-9) + 1;
    const out = [];
    for (let j = 0; j < k; j++) {
      const e0 = a0 + j * w, e1 = e0 + w;
      let c = 0;
      for (let q = 0; q < n; q++) if (d[q] >= e0 - 1e-9 && d[q] < e1 - 1e-9) c++;
      out.push({e0: e0, e1: e1, c: c, h: c / (n * w)});
    }
    let sum = 0, maxH = 0;
    out.forEach(b => { sum += b.h * w; if (b.h > maxH) maxH = b.h; });
    return {k: k, out: out, n: n, sum: sum, maxH: maxH};
  },
  draw() {
    setFrame(.5, .52, 12.5);
    base();
    const s = this.state, B = this.bins();
    line({x: -5.5, y: 0}, {x: 5.5, y: 0}, 'rgba(200,225,235,.42)', {w: 1.5});
    line({x: -4.9, y: -.15}, {x: -4.9, y: 3.15}, 'rgba(200,225,235,.32)', {w: 1.2});
    for (let g = .02; g <= .0601; g += .02) {
      line({x: -4.9, y: g * 50}, {x: 5.3, y: g * 50}, 'rgba(170,205,220,.09)', {w: 1, dash: [3, 5]});
      sans(fmt(g, 2), X(-5.02), Y(g * 50), 'rgba(150,175,190,.72)', 9, 'right');
    }
    sans('频率/组距', X(-4.9), Y(3.38), 'rgba(160,190,205,.75)', 9.5);

    B.out.forEach(b => {
      if (b.c === 0) return;
      const xa = scoreX(b.e0), xb = scoreX(b.e1);
      const bh = b.h * 50;
      const px = X(xa), pw = X(xb) - px;
      ctx.save();
      ctx.fillStyle = 'rgba(108,182,255,.20)';
      ctx.fillRect(px, Y(bh), pw - 2, Y(0) - Y(bh));
      ctx.strokeStyle = 'rgba(108,182,255,.8)';
      ctx.lineWidth = 1.3;
      ctx.strokeRect(px + .5, Y(bh) + .5, pw - 2, Y(0) - Y(bh) - 1);
      ctx.restore();
      if (s.showH) sans(fmt(b.h, 3), px + (pw - 2) / 2, Y(bh) - 10, 'rgba(195,222,255,.92)', 8.5);
    });

    for (let v = 50; v <= 100; v += 10) {
      const wx = scoreX(v);
      line({x: wx, y: -.09}, {x: wx, y: 0}, 'rgba(200,225,235,.45)', {w: 1});
      sans(String(v), X(wx), Y(-.36), 'rgba(150,175,190,.75)', 9.5);
    }
    sans('成绩', X(5.05), Y(-.36), 'rgba(150,175,190,.7)', 9.5);

    const hx = scoreX(s.a0);
    line({x: hx, y: -.15}, {x: hx, y: 3.15}, 'rgba(108,182,255,.35)', {w: 1.2, dash: [4, 5]});
    handle({x: hx, y: -.78}, '#6cb6ff', hoverId === 'a0');
    sans('分组起点 ' + s.a0, X(hx), Y(-1.15), 'rgba(165,205,245,.85)', 9.5);
  },
  hud() {
    const s = this.state, B = this.bins();
    return [
      {k: '样本容量 n', v: String(B.n)},
      {k: '组距 d', v: String(s.w), hi: true},
      {k: '组数 k', v: String(B.k)},
      {k: '面积和 Σh·d', v: fmt(B.sum, 3), hi: true},
      {k: '最大频率/组距', v: fmt(B.maxH, 3)}
    ];
  },
  drag(id, p) {
    const q = clampPt(p);
    let v = Math.round(75 + q.x * 6);
    this.state.a0 = clamp(v, 50, 55);
  },
  handles() { return [{id: 'a0', x: scoreX(this.state.a0), y: -.78}]; },
  panel(el) {
    const s = this.state;
    addSlider(el, '组距 d', 5, 20, 5, s.w, v => String(v), v => { s.w = v; });
    addToggle(el, '显示柱顶的频率/组距', s.showH, v => s.showH = v);
    addBtn(el, '重新取样', () => {
      const a = [];
      for (let i = 0; i < 50; i++) {
        const u = (Math.random() + Math.random() + Math.random()) / 3;
        a.push(clamp(Math.round(55 + 44 * u), 56, 96));
      }
      s.data = a;
    }, 'ghost');
  }
});

/* ---------- 03 平均数、中位数、众数 ---------- */
MODULES.push({
  key: 'center', tab: '03', name: '平均数·中位数·众数', en: 'CENTER', blurb: '三种集中趋势',
  accent: '#ffc56b', rgb: '255,197,107',
  hint: '左右拖动每个数据点，观察三条标记线如何移动',
  state: {vals: [1, 2, 2, 2, 3, 5, 6, 7], marks: true},
  reset() { this.state.vals = [1, 2, 2, 2, 3, 5, 6, 7]; this.state.marks = true; },
  meta() {
    return {
      title: '平均数、中位数与众数',
      desc: '平均数刻画数据的<b>平均水平</b>，中位数把数据分成个数相等的两半，众数是出现次数最多的数据。拖动数据点，观察三者怎样随数据移动而变化。',
      formula: 'x̄ = (x₁ + x₂ + … + xₙ) / n',
      note: '数据中<b>极端值</b>对平均数影响很大，对中位数影响较小。众数可能不止一个，也可能不存在。'
    };
  },
  layout() {
    const v = this.state.vals;
    const lv = [];
    let mx = 1;
    for (let i = 0; i < v.length; i++) {
      let c = 0;
      for (let j = 0; j < i; j++) if (Math.abs(v[j] - v[i]) < 1e-9) c++;
      lv.push(c);
      if (c + 1 > mx) mx = c + 1;
    }
    const step = Math.min(.55, 2.6 / Math.max(4, mx));
    return v.map((x, i) => ({x: x, y: .55 + lv[i] * step, i: i}));
  },
  draw() {
    setFrame(.5, .5, 12.5);
    base();
    const s = this.state, vals = s.vals;
    line({x: -5.6, y: 0}, {x: 6.2, y: 0}, 'rgba(200,225,235,.42)', {w: 1.5});
    for (let i = -5; i <= 5; i++) {
      line({x: i, y: -.1}, {x: i, y: .1}, 'rgba(200,225,235,.35)', {w: 1});
      sans(String(i), X(i), Y(-.42), 'rgba(150,175,190,.7)', 9.5);
    }

    const mn = meanOf(vals), md = medianOf(vals), mo = modeOf(vals);
    if (s.marks) {
      line({x: mn, y: -.6}, {x: mn, y: 2.95}, 'rgba(255,197,107,.9)', {w: 2, dash: [6, 4]});
      edgeLabel('x̄ = ' + num(mn), mn, Y(3.14), '#ffd79a', 10.5);
      line({x: md, y: -.6}, {x: md, y: 2.55}, 'rgba(154,208,255,.9)', {w: 2, dash: [6, 4]});
      edgeLabel('Me = ' + num(md), md, Y(2.74), '#b9ddff', 10.5);
      mo.vals.forEach(v => line({x: v, y: -.6}, {x: v, y: 2.15}, 'rgba(255,143,171,.9)', {w: 2, dash: [6, 4]}));
      if (mo.vals.length) edgeLabel('Mo = ' + mo.vals.map(num).join('、'), mo.vals[0], Y(2.34), '#ffb3c6', 10.5);
    }

    const P = this.layout();
    P.forEach(p => handle({x: p.x, y: p.y}, '#ffc56b', hoverId === 'p' + p.i));
    sans('拖动数据点可改变数值', X(0), Y(-1.15), 'rgba(175,195,205,.55)', 9.5);
  },
  hud() {
    const v = this.state.vals, mo = modeOf(v);
    return [
      {k: '数据个数 n', v: String(v.length)},
      {k: '平均数 x̄', v: num(meanOf(v)), hi: true},
      {k: '中位数 Me', v: num(medianOf(v)), hi: true},
      {k: '众数 Mo', v: mo.vals.length ? mo.vals.map(num).join('、') : '无'}
    ];
  },
  handles() {
    return this.layout().map(p => ({id: 'p' + p.i, x: p.x, y: p.y}));
  },
  drag(id, p) {
    const q = clampPt(p);
    const i = +id.slice(1);
    this.state.vals[i] = clamp(Math.round(q.x * 4) / 4, -5, 5.5);
  },
  panel(el) {
    const s = this.state;
    addToggle(el, '显示三条标记线', s.marks, v => s.marks = v);
    addBtn(el, '重置数据', () => {
      s.vals = [1, 2, 2, 2, 3, 5, 6, 7];
      buildPanel();
    }, 'ghost');
  }
});

/* ---------- 04 方差与标准差 ---------- */
MODULES.push({
  key: 'variance', tab: '04', name: '方差与标准差', en: 'VARIANCE', blurb: '离散程度的度量',
  accent: '#ff8fab', rgb: '255,143,171',
  hint: '拖动数据点，观察偏差平方与方差的变化',
  state: {vals: [-3, -1, 0, 1, 3], sq: true},
  reset() { this.state.vals = [-3, -1, 0, 1, 3]; this.state.sq = true; },
  meta() {
    return {
      title: '方差与标准差：衡量数据的离散程度',
      desc: '各数据与平均数的差叫<b>偏差</b>。把偏差平方后求平均，就得到方差；方差越大，数据越分散。拖动数据点，观察偏差线段与偏差平方的柱形怎样变化。',
      formula: 's² = (1/n)·Σ(xᵢ − x̄)²　　s = √s²',
      note: '方差与标准差都<b>不小于 0</b>，只有所有数据都等于平均数时取 0。标准差的单位与原数据相同，比方差更直观。'
    };
  },
  calc() {
    const v = this.state.vals, n = v.length;
    const m = meanOf(v);
    const d = v.map(x => x - m);
    const d2 = d.map(x => x * x);
    let s2 = 0;
    for (let i = 0; i < n; i++) s2 += d2[i];
    s2 /= n;
    return {n: n, m: m, d: d, d2: d2, s2: s2, s: Math.sqrt(s2), maxD2: Math.max(1, Math.max.apply(null, d2))};
  },
  draw() {
    setFrame(.5, .52, 12.5);
    base();
    const s = this.state, C = this.calc();
    const yA = 1.05;

    line({x: -5.6, y: yA}, {x: 5.6, y: yA}, 'rgba(200,225,235,.42)', {w: 1.5});
    for (let i = -5; i <= 5; i++) {
      line({x: i, y: yA - .08}, {x: i, y: yA + .08}, 'rgba(200,225,235,.32)', {w: 1});
      sans(String(i), X(i), Y(yA - .32), 'rgba(150,175,190,.68)', 9);
    }

    line({x: C.m, y: -2.95}, {x: C.m, y: 3.22}, 'rgba(255,197,107,.9)', {w: 2, dash: [6, 4]});
    edgeLabel('x̄ = ' + num(C.m), C.m, Y(3.2), '#ffd79a', 10.5);

    for (let i = 0; i < C.n; i++) {
      const y = 1.62 + i * .3;
      const a = Math.min(C.m, s.vals[i]), b = Math.max(C.m, s.vals[i]);
      line({x: a, y: y}, {x: b, y: y}, 'rgba(255,143,171,.75)', {w: 1.8});
      line({x: a, y: y - .09}, {x: a, y: y + .09}, 'rgba(255,143,171,.8)', {w: 1.4});
      line({x: b, y: y - .09}, {x: b, y: y + .09}, 'rgba(255,143,171,.8)', {w: 1.4});
      line({x: s.vals[i], y: yA}, {x: s.vals[i], y: y}, 'rgba(255,255,255,.10)', {w: 1, dash: [2, 4]});
      sans('d' + (i + 1) + ' = ' + num(C.d[i]), X((C.m + s.vals[i]) / 2), Y(y + .17), 'rgba(255,190,208,.9)', 9.5);
    }

    const P = this.state.vals;
    for (let i = 0; i < P.length; i++) {
      dot({x: P[i], y: yA}, '#ff8fab', 4.5);
      handle({x: P[i], y: yA}, '#ff8fab', hoverId === 'v' + i);
      sans(num(P[i]), X(P[i]), Y(yA + .35), 'rgba(255,205,220,.9)', 9.5);
    }

    if (s.sq) {
      const yb = -2.55;
      const unit = 2.1 / C.maxD2;
      line({x: -5.6, y: yb}, {x: 5.6, y: yb}, 'rgba(200,225,235,.38)', {w: 1.4});
      sans('偏差平方 d²', X(-5.5), Y(-2.72), 'rgba(190,200,215,.7)', 9.5, 'left');
      for (let i = 0; i < C.n; i++) {
        const h = C.d2[i] * unit;
        const px = X(P[i]) - .23 * V.k;
        ctx.save();
        ctx.fillStyle = 'rgba(255,143,171,.22)';
        ctx.fillRect(px, Y(yb + h), .46 * V.k, Y(yb) - Y(yb + h));
        ctx.strokeStyle = 'rgba(255,143,171,.7)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(px + .5, Y(yb + h) + .5, .46 * V.k - 1, Y(yb) - Y(yb + h) - 1);
        ctx.restore();
        sans(num(C.d2[i]), X(P[i]), Y(yb + h) - 10, 'rgba(255,190,208,.92)', 9);
      }
      const ys = yb + C.s2 * unit;
      line({x: -5.6, y: ys}, {x: 5.6, y: ys}, 'rgba(255,197,107,.9)', {w: 1.6, dash: [6, 4]});
      sans('s² = ' + fmt(C.s2, 2), X(5.5), Y(ys + .2), '#ffd79a', 10, 'right');
    }
  },
  hud() {
    const C = this.calc(), v = this.state.vals;
    const rng = Math.max.apply(null, v) - Math.min.apply(null, v);
    return [
      {k: '平均数 x̄', v: num(C.m)},
      {k: '方差 s²', v: fmt(C.s2, 2), hi: true},
      {k: '标准差 s', v: fmt(C.s, 3), hi: true},
      {k: '数据个数 n', v: String(C.n)},
      {k: '极差', v: num(rng)}
    ];
  },
  handles() {
    return this.state.vals.map((x, i) => ({id: 'v' + i, x: x, y: 1.05}));
  },
  drag(id, p) {
    const q = clampPt(p);
    const i = +id.slice(1);
    this.state.vals[i] = clamp(Math.round(q.x * 4) / 4, -4.8, 4.8);
  },
  panel(el) {
    const s = this.state;
    addToggle(el, '显示偏差平方', s.sq, v => s.sq = v);
    const r = row(el);
    addBtn(r, '更集中', () => {
      const m = meanOf(s.vals);
      s.vals = s.vals.map(v => clamp(Math.round((m + (v - m) * .8) * 4) / 4, -4.8, 4.8));
    }, 'ghost');
    addBtn(r, '更分散', () => {
      const m = meanOf(s.vals);
      s.vals = s.vals.map(v => clamp(Math.round((m + (v - m) * 1.2) * 4) / 4, -4.8, 4.8));
    }, 'ghost');
    addBtn(el, '重置数据', () => { s.vals = [-3, -1, 0, 1, 3]; buildPanel(); }, 'ghost');
  }
});

/* ---------- 05 百分位数 ---------- */
const RANKS = [56, 62, 65, 68, 72, 75, 78, 83, 88, 94];

MODULES.push({
  key: 'percentile', tab: '05', name: '百分位数', en: 'PERCENTILE', blurb: '第 p 百分位数',
  accent: '#b49cff', rgb: '180,156,255',
  hint: '拖动底部手柄或调节滑块，改变百分位数 p',
  state: {p: 75, data: RANKS.slice(), showCalc: true},
  reset() { this.state.p = 75; this.state.data = RANKS.slice(); this.state.showCalc = true; },
  meta() {
    return {
      title: '百分位数：按位置切分数据',
      desc: '把 n 个数据从小到大排列，第 p 百分位数是这样一个值：小于或等于它的数据至少占 p%，大于或等于它的数据至少占 (100 − p)%。调节 p，观察取值位置的变化。',
      formula: 'i = n × p%，按 i 是否为整数取第 i 项或第 i、i+1 项的平均数',
      note: '中位数就是第 <b>50</b> 百分位数。求百分位数前必须<b>先排序</b>；i 为整数与不为整数时，取法不同。'
    };
  },
  calc() {
    const s = this.state, d = s.data, n = d.length;
    const i = n * s.p / 100;
    const isInt = Math.abs(i - Math.round(i)) < 1e-9;
    let val, lo, hi, j;
    if (isInt && i >= 1 && i < n) {
      const k = Math.round(i);
      val = (d[k - 1] + d[k]) / 2;
      lo = k - 1; hi = k; j = k;
    } else {
      j = clamp(Math.ceil(i - 1e-9), 1, n);
      val = d[j - 1];
      lo = hi = j - 1;
    }
    return {n: n, i: i, isInt: isInt, val: val, lo: lo, hi: hi, j: j};
  },
  draw() {
    setFrame(.5, .52, 12.5);
    base();
    const s = this.state, d = s.data, C = this.calc();
    const vy = v => (v - 75) / 10;
    const vx = -5.3;

    line({x: vx, y: -2.75}, {x: vx, y: 2.75}, 'rgba(200,225,235,.42)', {w: 1.5});
    for (let v = 50; v <= 100; v += 10) {
      const y = vy(v);
      line({x: vx, y: y}, {x: 5.0, y: y}, 'rgba(170,205,220,.08)', {w: 1, dash: [3, 5]});
      line({x: vx - .08, y: y}, {x: vx + .08, y: y}, 'rgba(200,225,235,.4)', {w: 1});
      sans(String(v), X(vx - .22), Y(y), 'rgba(150,175,190,.75)', 9, 'right');
    }

    for (let i = 0; i < d.length; i++) {
      const x = -4.55 + i * .98, y = vy(d[i]);
      const hot = (i === C.lo || i === C.hi);
      dot({x: x, y: y}, hot ? '#ffc56b' : '#b49cff', hot ? 5 : 4);
      if (hot) ring(X(x), Y(y), 9, 'rgba(255,197,107,.85)', 1.6);
      sans(num(d[i]), X(x), Y(y - .27), 'rgba(190,205,225,.8)', 9);
      line({x: x, y: -2.75}, {x: x, y: y}, 'rgba(180,156,255,.10)', {w: 1, dash: [2, 5]});
    }

    const yp = vy(C.val);
    line({x: vx, y: yp}, {x: 5.0, y: yp}, 'rgba(255,197,107,.95)', {w: 2, dash: [7, 4]});
    sans('P' + subP(s.p) + ' = ' + num(C.val), X(5.08), Y(yp), '#ffd79a', 11, 'left');

    if (s.showCalc) {
      sans('i = n × p% = 10 × ' + s.p + '% = ' + (C.isInt ? String(C.i) : C.i.toFixed(1)),
        X(-5.3), Y(3.55), 'rgba(205,215,235,.9)', 11, 'left');
      sans(C.isInt && C.i >= 1 && C.i < C.n
        ? 'i 是整数 → 取第 ' + C.j + '、' + (C.j + 1) + ' 项的平均数'
        : 'i 不是整数 → 取第 ' + C.j + ' 项',
        X(-5.3), Y(3.15), 'rgba(195,180,250,.9)', 10.5, 'left');
    }

    const py = -3.35, x0 = -4.55, x1 = 4.55;
    line({x: x0, y: py}, {x: x1, y: py}, 'rgba(200,225,235,.28)', {w: 2});
    const px = x0 + (x1 - x0) * s.p / 100;
    line({x: x0, y: py}, {x: px, y: py}, 'rgba(180,156,255,.75)', {w: 3});
    for (let q = 0; q <= 100; q += 25) {
      const x = x0 + (x1 - x0) * q / 100;
      line({x: x, y: py - .09}, {x: x, y: py + .09}, 'rgba(200,225,235,.4)', {w: 1});
      sans(String(q), X(x), Y(py - .33), 'rgba(150,175,190,.7)', 9);
    }
    sans('百分位数 p', X(x0 - .35), Y(py), 'rgba(170,190,205,.6)', 9, 'right');
    handle({x: px, y: py}, '#b49cff', hoverId === 'p');
    sans('p = ' + s.p, X(px), Y(py + .36), '#c9b8ff', 11);
  },
  hud() {
    const s = this.state, C = this.calc();
    return [
      {k: '数据个数 n', v: String(C.n)},
      {k: '百分位数 p', v: String(s.p), hi: true},
      {k: 'i = n·p%', v: C.isInt ? String(C.i) : C.i.toFixed(1)},
      {k: '取值方式', v: (C.isInt && C.i >= 1 && C.i < C.n) ? '第 ' + C.j + '、' + (C.j + 1) + ' 项平均' : '第 ' + C.j + ' 项'},
      {k: '第 ' + s.p + ' 百分位数', v: num(C.val), hi: true}
    ];
  },
  handles() {
    const py = -3.35;
    return [{id: 'p', x: -4.55 + 9.1 * this.state.p / 100, y: py}];
  },
  drag(id, p) {
    const q = clampPt(p);
    const t = (q.x + 4.55) / 9.1;
    this.state.p = clamp(Math.round(t * 100), 1, 99);
  },
  panel(el) {
    const s = this.state;
    addSlider(el, '百分位数 p', 1, 99, 1, s.p, v => String(v), v => { s.p = v; });
    addToggle(el, '显示计算过程', s.showCalc, v => s.showCalc = v);
    addBtn(el, '重置 p', () => { s.p = 75; buildPanel(); }, 'ghost');
  }
});

})();
