/* ============================================================
   选择性必修第三册 · 第 7 章 随机变量及其分布
   01 分布列 · 02 期望与方差 · 03 二项分布 · 04 正态分布 · 05 超几何分布
   ============================================================ */
(function () {

/* ---------- 通用小工具 ---------- */
function comb(n, k) {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let r = 1;
  for (let i = 1; i <= k; i++) r = r * (n - k + i) / i;
  return r;
}
function erf(x) {
  const sgn = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1 / (1 + .3275911 * x);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x * x);
  return sgn * y;
}
function phi(z) { return .5 * (1 + erf(z / Math.SQRT2)); }
function sup(n) {
  const m = {'0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'};
  return String(n).split('').map(c => m[c] || c).join('');
}
function bar(cx, w, y0, y1, fill, stroke, lw) {
  const top = Math.max(y0, y1), h = Math.abs(y1 - y0);
  ctx.save();
  ctx.beginPath();
  ctx.rect(X(cx - w / 2), Y(top), w * V.k, h * V.k);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.2; ctx.stroke(); }
  ctx.restore();
}

/* ============================================================
   01 离散型随机变量的分布列
   ============================================================ */
const D1_V = [3, 4, 5, 6, 7];
const D1_P = [1 / 6, 1 / 6, 1 / 3, 1 / 6, 1 / 6];
const D1_F = ['1/6', '1/6', '1/3', '1/6', '1/6'];
const D1_E = [[1, 2, 3], [1, 3, 4], [1, 4, 5], [2, 3, 5], [2, 4, 6], [3, 4, 7]];

MODULES.push({
  key: 'dist', tab: '01', name: '分布列', en: 'LAW', blurb: '表格与柱状图',
  accent: '#5eead4', rgb: '94,234,212',
  hint: '拖动底部手柄，逐个查看 X 的取值与概率',
  state: {sel: 2, tab: true, ev: true, last: -1},
  reset() { this.state.sel = 2; this.state.tab = true; this.state.ev = true; this.state.last = -1; },
  meta() {
    return {
      title: '离散型随机变量的分布列',
      desc: '袋中有编号 1、2、3、4 的四个球，从中任取两个，用 <b>X</b> 表示两球编号之和。把 X 的每个取值与对应概率列成表格，就得到<b>分布列</b>。拖动下方手柄选择取值，核对表格、柱状图与读数是否一致。',
      formula: 'P(X = x<sub>k</sub>) = p<sub>k</sub>，<br>p<sub>1</sub> + p<sub>2</sub> + … + p<sub>n</sub> = 1',
      note: '六个基本事件等可能，概率由<b>计数</b>得到。和为正中间值 5 的取法有两种，所以 <span class="nw">P(X=5) = 2/6 = 1/3</span> 最大，柱子也最高。'
    };
  },
  handles() {
    return [{id: 'sel', x: -3.1 + this.state.sel * 1.6, y: -1.4}];
  },
  drag(id, p) {
    const q = clampPt(p);
    this.state.sel = clamp(Math.round((q.x + 3.1) / 1.6), 0, 4);
  },
  draw() {
    setFrame(.5, .5, 13);
    base();
    const s = this.state;
    const BX = -3.1, ST = 1.6, baseY = -1.4, hk = 7.2;
    const cx = i => BX + i * ST;

    if (s.tab) {
      const y0 = 1.75, y1 = 2.4, y2 = 3.05;
      line({x: -5.3, y: y2}, {x: 4.1, y: y2}, 'rgba(150,200,215,.3)', {w: 1});
      line({x: -5.3, y: y1}, {x: 4.1, y: y1}, 'rgba(150,200,215,.2)', {w: 1});
      line({x: -5.3, y: y0}, {x: 4.1, y: y0}, 'rgba(150,200,215,.2)', {w: 1});
      line({x: -5.3, y: y0}, {x: -5.3, y: y2}, 'rgba(150,200,215,.16)', {w: 1});
      for (let i = 0; i <= 5; i++) {
        const x = -3.9 + i * ST;
        line({x, y: y0}, {x, y: y2}, 'rgba(150,200,215,.16)', {w: 1});
      }
      math('X', X(-4.6), Y(2.72), 'rgba(150,215,215,.9)', 15);
      math('P', X(-4.6), Y(2.07), 'rgba(150,215,215,.9)', 15);
      for (let i = 0; i < 5; i++) {
        sans(String(D1_V[i]), X(cx(i)), Y(2.72), i === s.sel ? '#ffffff' : 'rgba(220,242,246,.9)', 12);
        sans(D1_F[i], X(cx(i)), Y(2.07), i === s.sel ? '#8ff5e4' : 'rgba(168,222,218,.85)', 11.5);
      }
      sans('分布列', X(-5.3), Y(3.32), 'rgba(140,200,205,.7)', 9.5, 'left');
    }

    line({x: -5.3, y: baseY}, {x: 4.1, y: baseY}, 'rgba(150,200,215,.32)', {w: 1.4});

    for (let i = 0; i < 5; i++) {
      const h = D1_P[i] * hk, sel = i === s.sel;
      bar(cx(i), .9, baseY, baseY + h,
        sel ? 'rgba(94,234,212,.3)' : 'rgba(94,234,212,.1)',
        sel ? '#5eead4' : 'rgba(94,234,212,.42)', sel ? 2 : 1.2);
      sans(D1_F[i], X(cx(i)), Y(baseY + h + .28), sel ? '#d8fff7' : 'rgba(158,215,212,.8)', 10);
      sans(String(D1_V[i]), X(cx(i)), Y(baseY - .34), sel ? '#ffffff' : 'rgba(190,215,220,.8)', 12);
    }

    const sx = cx(s.sel);
    line({x: sx, y: baseY}, {x: sx, y: 1.75}, 'rgba(94,234,212,.24)', {w: 1, dash: [4, 5]});

    math('P(X = ' + D1_V[s.sel] + ') = ' + D1_F[s.sel], X(0), Y(-2.1), '#8ff5e4', 17);

    if (s.last >= 0) {
      const e = D1_E[s.last];
      sans('本次取出 (' + e[0] + ', ' + e[1] + ')，X = ' + e[2], X(0), Y(-2.66), 'rgba(255,197,107,.85)', 10.5);
    }
    if (s.ev) {
      const txt = D1_E.map(e => '(' + e[0] + ',' + e[1] + ')→' + e[2]).join('   ');
      sans(txt, X(0), Y(-3.3), 'rgba(150,182,196,.62)', 9.5);
    }

    handle({x: sx, y: baseY}, '#5eead4', hoverId === 'sel');
  },
  hud() {
    const s = this.state;
    return [
      {k: 'X 的全部取值', v: '3, 4, 5, 6, 7'},
      {k: '选中取值', v: 'X = ' + D1_V[s.sel], hi: true},
      {k: '对应概率', v: D1_F[s.sel], hi: true},
      {k: 'Σ pₖ', v: '1.000'}
    ];
  },
  panel(el) {
    const s = this.state;
    addToggle(el, '显示分布列表格', s.tab, v => s.tab = v);
    addToggle(el, '显示六个基本事件', s.ev, v => s.ev = v);
    addBtn(el, '随机摸一次', () => {
      s.last = Math.floor(Math.random() * 6);
      s.sel = D1_E[s.last][2] - 3;
    }, 'ghost');
  }
});

/* ============================================================
   02 期望与方差
   ============================================================ */
MODULES.push({
  key: 'expect', tab: '02', name: '期望与方差', en: 'EXPECTATION', blurb: '重心与离散度',
  accent: '#ffc56b', rgb: '255,197,107',
  hint: '拖动中间柱顶或滑块，观察 E(X) 与 σ 的移动',
  state: {p: .3, sd: true},
  reset() { this.state.p = .3; this.state.sd = true; },
  meta() {
    return {
      title: '数学期望：分布的重心',
      desc: '把每个取值乘以它的概率再相加，得到<b>数学期望</b> E(X)，它是分布的重心；各取值偏离 E(X) 的平方的加权平均是<b>方差</b> D(X)，刻画取值的分散程度。拖动柱顶或滑块改变 P(X=2)，看重心与 σ 区间如何移动。',
      formula: 'E(X) = Σ x<sub>k</sub>p<sub>k</sub>　D(X) = Σ (x<sub>k</sub> − E(X))²p<sub>k</sub>',
      note: '若 P(X=−1)=0.2、P(X=0)=0.8−p、P(X=2)=p，则 <span class="nw">E(X) = 2p − 0.2</span> 随 p 线性增大。p 越大，取值越向 2 集中，σ 先减小后增大。'
    };
  },
  handles() {
    return [{id: 'p', x: 2, y: -1.9 + this.state.p * 3.6}];
  },
  drag(id, p) {
    const q = clampPt(p);
    const v = clamp((q.y + 1.9) / 3.6, 0, .75);
    this.state.p = Math.round(v * 100) / 100;
    if (this.slider) this.slider.set(this.state.p);
  },
  draw() {
    setFrame(.5, .5, 13);
    base();
    const s = this.state;
    const pa = .2, pc = s.p, pb = 1 - pa - pc;
    const xs = [-1, 0, 2], vs = [-1, 0, 2], ps = [pa, pb, pc];
    const E = vs[0] * ps[0] + vs[2] * ps[2];
    const E2 = 1 * ps[0] + 4 * ps[2];
    const D = Math.max(0, E2 - E * E), sd = Math.sqrt(D);
    const baseY = -1.9, hk = 3.6;

    line({x: -5.2, y: baseY}, {x: 5.2, y: baseY}, 'rgba(150,200,215,.28)', {w: 1.3});

    for (let i = 0; i < 3; i++) {
      const h = ps[i] * hk;
      bar(xs[i], .8, baseY, baseY + h, 'rgba(255,197,107,.13)', 'rgba(255,197,107,.6)', 1.3);
      sans(fmt(ps[i], 2), X(xs[i]), Y(baseY + h + .26), 'rgba(255,220,160,.92)', 10.5);
      sans(String(vs[i]), X(xs[i]), Y(baseY - .34), 'rgba(205,218,222,.85)', 12.5);
    }
    math('X', X(-2.55), Y(baseY - .34), 'rgba(205,218,222,.7)', 12);
    sans('P(X=−1)=0.20 固定，改变 P(X=2)', X(-5.6), Y(3.05), 'rgba(150,180,195,.68)', 10, 'left');

    sans('E(X) = (−1)×' + fmt(pa, 2) + ' + 0×' + fmt(pb, 2) + ' + 2×' + fmt(pc, 2) + ' = ' + fmt(E, 2),
      X(-5.6), Y(2.5), 'rgba(170,225,235,.92)', 11, 'left');
    sans('E(X²) = ' + fmt(E2, 2) + '，D(X) = ' + fmt(E2, 2) + ' − ' + fmt(E, 2) + '² = ' + fmt(D, 3) + '，σ(X) = ' + fmt(sd, 3),
      X(-5.6), Y(1.95), 'rgba(150,195,215,.82)', 10.5, 'left');

    /* 数轴 */
    const ny = -3.0;
    line({x: -4.2, y: ny}, {x: 4.2, y: ny}, 'rgba(200,225,235,.35)', {w: 1.4});
    for (let i = -4; i <= 4; i++) {
      line({x: i, y: ny - .08}, {x: i, y: ny + .08}, 'rgba(200,225,235,.26)', {w: 1});
      sans(String(i), X(i), Y(ny - .38), 'rgba(160,190,200,.62)', 9);
    }
    if (s.sd) {
      line({x: E - sd, y: ny}, {x: E + sd, y: ny}, 'rgba(255,197,107,.3)', {w: 10});
      line({x: E - sd, y: ny - .12}, {x: E - sd, y: ny + .12}, 'rgba(255,197,107,.7)', {w: 1.4});
      line({x: E + sd, y: ny - .12}, {x: E + sd, y: ny + .12}, 'rgba(255,197,107,.7)', {w: 1.4});
    }
    line({x: E, y: baseY}, {x: E, y: ny}, 'rgba(255,197,107,.45)', {w: 1, dash: [4, 4]});
    dot({x: E, y: ny}, '#ffc56b', 6);
    sans('E(X) = ' + fmt(E, 2), X(E), Y(ny - .78), '#ffd99a', 11.5);

    handle({x: 2, y: baseY + pc * hk}, '#ffc56b', hoverId === 'p');
  },
  hud() {
    const s = this.state;
    const pa = .2, pc = s.p;
    const E = -pa + 2 * pc, E2 = pa + 4 * pc;
    const D = Math.max(0, E2 - E * E);
    return [
      {k: 'E(X)', v: fmt(E, 3), hi: true},
      {k: 'E(X²)', v: fmt(E2, 3)},
      {k: 'D(X)', v: fmt(D, 3)},
      {k: 'σ(X)', v: fmt(Math.sqrt(D), 3), hi: true},
      {k: 'Σ pₖ', v: fmt(pa + (1 - pa - pc) + pc, 3)}
    ];
  },
  panel(el) {
    const s = this.state;
    this.slider = addSlider(el, 'P(X = 2)', 0, .75, .01, s.p, v => v.toFixed(2), v => s.p = v);
    addToggle(el, '显示 E ± σ 区间', s.sd, v => s.sd = v);
    addBtn(el, '恢复默认', () => { s.p = .3; this.slider.set(.3); }, 'ghost');
  }
});

/* ============================================================
   03 二项分布
   ============================================================ */
MODULES.push({
  key: 'binomial', tab: '03', name: '二项分布', en: 'BINOMIAL', blurb: 'X ~ B(n, p)',
  accent: '#6cb6ff', rgb: '108,182,255',
  hint: '调节 n 与 p，观察柱形与期望线的移动',
  state: {n: 8, p: .4, k: 3, showE: true},
  reset() { this.state.n = 8; this.state.p = .4; this.state.k = 3; this.state.showE = true; },
  meta() {
    return {
      title: 'n 次独立重复试验：二项分布',
      desc: '在 n 次独立重复试验中，每次成功的概率为 p，成功次数 <b>X</b> 服从二项分布 B(n, p)。调节 n 与 p，柱状图的形状、峰值位置与期望 np 都会改变，而所有柱高之和始终为 1。',
      formula: 'P(X = k) = C<sub>n</sub><sup>k</sup> p<sup>k</sup>(1 − p)<sup>n−k</sup>',
      note: 'p = 0.5 时图象左右对称，峰值在 np 附近；p 偏离 0.5 时图象向一侧偏斜。拖动底部手柄，可以读出任意一个 k 的概率。'
    };
  },
  handles() {
    const s = this.state;
    const left = -5.2, slot = 10.4 / (s.n + 1);
    return [{id: 'k', x: left + (s.k + .5) * slot, y: -1.5}];
  },
  drag(id, p) {
    const q = clampPt(p);
    const s = this.state;
    const left = -5.2, slot = 10.4 / (s.n + 1);
    s.k = clamp(Math.round((q.x - left) / slot - .5), 0, s.n);
  },
  draw() {
    setFrame(.5, .5, 13);
    base();
    const s = this.state, n = s.n, p = s.p;
    const left = -5.2, slot = 10.4 / (n + 1), baseY = -1.5;
    const pr = [];
    for (let k = 0; k <= n; k++) pr.push(comb(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k));
    const pmax = Math.max.apply(null, pr);
    const hk = 2.7 / pmax;
    const xc = k => left + (k + .5) * slot;

    line({x: -5.4, y: baseY}, {x: 5.4, y: baseY}, 'rgba(150,200,215,.28)', {w: 1.3});

    for (let k = 0; k <= n; k++) {
      const h = pr[k] * hk, sel = k === s.k;
      bar(xc(k), slot * .66, baseY, baseY + h,
        sel ? 'rgba(108,182,255,.34)' : 'rgba(108,182,255,.12)',
        sel ? '#6cb6ff' : 'rgba(108,182,255,.42)', sel ? 2 : 1.1);
      if (n <= 13 || k % 2 === 0 || k === n) {
        sans(String(k), X(xc(k)), Y(baseY - .32), sel ? '#ffffff' : 'rgba(180,205,220,.7)', n > 15 ? 8 : 9.5);
      }
    }

    /* 折线轮廓 */
    ctx.save();
    ctx.beginPath();
    for (let k = 0; k <= n; k++) {
      const x = X(xc(k)), y = Y(baseY + pr[k] * hk);
      if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(154,208,255,.55)';
    ctx.lineWidth = 1.4;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    const xE = left + (n * p + .5) * slot;
    if (s.showE) {
      line({x: xE, y: baseY}, {x: xE, y: 1.55}, 'rgba(94,234,212,.6)', {w: 1.4, dash: [5, 4]});
      sans('E(X) = np = ' + fmt(n * p, 2), X(xE), Y(1.78), '#8ff5e4', 10.5);
    }

    math('X ~ B(' + n + ', ' + fmt(p, 2) + ')', X(-5.3), Y(3.15), '#a9d4ff', 15);
    sans('P(X = ' + s.k + ') = C(' + n + ',' + s.k + ') × ' + fmt(p, 2) + sup(s.k) + ' × ' + fmt(1 - p, 2) + sup(n - s.k),
      X(-5.3), Y(2.55), 'rgba(190,220,245,.85)', 10.5, 'left');
    sans('≈ ' + fmt(pr[s.k], 4), X(4.9), Y(2.55), '#8fc6ff', 11, 'right');

    handle({x: xc(s.k), y: baseY}, '#6cb6ff', hoverId === 'k');
  },
  hud() {
    const s = this.state, n = s.n, p = s.p;
    const pk = comb(n, s.k) * Math.pow(p, s.k) * Math.pow(1 - p, n - s.k);
    return [
      {k: '试验次数 n', v: String(n)},
      {k: '成功概率 p', v: fmt(p, 2)},
      {k: 'E(X) = np', v: fmt(n * p, 2), hi: true},
      {k: 'D(X) = np(1−p)', v: fmt(n * p * (1 - p), 2)},
      {k: 'P(X = ' + s.k + ')', v: fmt(pk, 4), hi: true}
    ];
  },
  panel(el) {
    const s = this.state;
    addSlider(el, '试验次数 n', 2, 20, 1, s.n, v => String(v), v => {
      s.n = v;
      if (s.k > v) s.k = v;
    });
    addSlider(el, '成功概率 p', .05, .95, .01, s.p, v => v.toFixed(2), v => s.p = v);
    addToggle(el, '显示期望线 x = np', s.showE, v => s.showE = v);
    const r = row(el);
    addBtn(r, 'p = 0.5', () => { s.p = .5; }, 'ghost');
    addBtn(r, '回到 n = 8', () => { s.n = 8; s.k = Math.min(s.k, 8); }, 'ghost');
  }
});

/* ============================================================
   04 正态分布
   ============================================================ */
MODULES.push({
  key: 'normal', tab: '04', name: '正态分布', en: 'NORMAL', blurb: 'μ 与 σ 的意义',
  accent: '#b49cff', rgb: '180,156,255',
  hint: '拖动阈值 a，阴影面积即 P(X ≤ a)',
  state: {mu: 0, sig: 1, a: .8, band: true},
  reset() { this.state.mu = 0; this.state.sig = 1; this.state.a = .8; this.state.band = true; },
  meta() {
    return {
      title: '正态分布 N(μ, σ²)',
      desc: '正态分布的密度曲线是钟形曲线，关于 <b>x = μ</b> 对称；σ 越小曲线越陡、越集中。拖动阈值 a，曲线下阴影面积就是 P(X ≤ a)。蓝色区间 μ ± 3σ 内的概率约为 99.7%。',
      formula: 'f(x) = 1/(σ√(2π)) · e<sup>−(x−μ)²/(2σ²)</sup>',
      note: '无论 μ、σ 取何值，<b>μ ± σ</b> 内的概率总约为 0.6827，<b>μ ± 2σ</b> 约 0.9545。所以概率只与“偏离几个 σ”有关。'
    };
  },
  handles() { return [{id: 'a', x: this.state.a, y: 0}]; },
  drag(id, p) {
    const q = clampPt(p);
    this.state.a = Math.round(clamp(q.x, -6, 6) * 20) / 20;
    if (this.slider) this.slider.set(this.state.a);
  },
  draw() {
    setFrame(.5, .62, 14);
    base();
    const s = this.state, mu = s.mu, sg = s.sig, a = s.a;
    const L = lim();
    const kk = 2.6;
    const den = x => Math.exp(-((x - mu) * (x - mu)) / (2 * sg * sg)) / (sg * Math.sqrt(2 * Math.PI));
    const N = 260;

    /* μ±3σ 区间 */
    if (s.band) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(X(mu - 3 * sg), Y(0));
      for (let i = 0; i <= N; i++) {
        const x = mu - 3 * sg + 6 * sg * i / N;
        ctx.lineTo(X(x), Y(den(x) * kk));
      }
      ctx.lineTo(X(mu + 3 * sg), Y(0));
      ctx.closePath();
      ctx.fillStyle = 'rgba(180,156,255,.09)';
      ctx.fill();
      ctx.restore();
      [-3, -2, -1, 1, 2, 3].forEach(m => {
        const x = mu + m * sg;
        if (x < L.x0 || x > L.x1) return;
        line({x, y: 0}, {x, y: den(x) * kk}, 'rgba(180,156,255,.22)', {w: 1, dash: [3, 4]});
      });
      line({x: mu - 3 * sg, y: 0}, {x: mu - 3 * sg, y: den(mu) * kk * .35}, 'rgba(180,156,255,.55)', {w: 1.2, dash: [5, 4]});
      line({x: mu + 3 * sg, y: 0}, {x: mu + 3 * sg, y: den(mu) * kk * .35}, 'rgba(180,156,255,.55)', {w: 1.2, dash: [5, 4]});
      sans('μ±3σ', X(mu), Y(den(mu) * kk * .48), 'rgba(205,190,255,.8)', 10);
    }

    /* 左尾阴影 */
    const aCut = clamp(a, L.x0, L.x1);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(X(L.x0), Y(0));
    for (let i = 0; i <= N; i++) {
      const x = L.x0 + (aCut - L.x0) * i / N;
      ctx.lineTo(X(x), Y(den(x) * kk));
    }
    ctx.lineTo(X(aCut), Y(0));
    ctx.closePath();
    ctx.fillStyle = 'rgba(180,156,255,.26)';
    ctx.fill();
    ctx.restore();

    /* 曲线 */
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i <= N * 2; i++) {
      const x = L.x0 + (L.x1 - L.x0) * i / (N * 2);
      const y = Y(den(x) * kk);
      if (i === 0) ctx.moveTo(X(x), y); else ctx.lineTo(X(x), y);
    }
    ctx.strokeStyle = '#b49cff';
    ctx.lineWidth = 2.2;
    ctx.shadowColor = 'rgba(180,156,255,.8)';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.restore();

    /* 坐标轴 */
    line({x: L.x0, y: 0}, {x: L.x1, y: 0}, 'rgba(200,225,235,.4)', {w: 1.4});
    for (let i = Math.ceil(L.x0); i <= Math.floor(L.x1); i++) {
      line({x: i, y: -.09}, {x: i, y: .09}, 'rgba(200,225,235,.3)', {w: 1});
      if (Math.abs(i) <= 6 && i % 1 === 0) sans(String(i), X(i), Y(-.42), 'rgba(160,190,200,.6)', 9);
    }
    line({x: mu, y: 0}, {x: mu, y: den(mu) * kk}, 'rgba(220,210,255,.5)', {w: 1.2, dash: [5, 5]});
    math('μ', X(mu) + 14, Y(den(mu) * kk + .18), '#d9ceff', 15);

    /* 阈值 */
    line({x: a, y: 0}, {x: a, y: den(a) * kk + .25}, '#5eead4', {w: 2});
    math('a', X(a), Y(-.8), '#8ff5e4', 14);
    handle({x: a, y: 0}, '#5eead4', hoverId === 'a');

    const z = (a - mu) / sg;
    sans('P(X ≤ a) = Φ(z) = ' + fmt(phi(z), 4), X(-6.2), Y(-2.55), '#d6ccff', 12.5, 'left');
    sans('z = (a − μ)/σ = (' + fmt(a, 2) + ' − ' + fmt(mu, 2) + ')/' + fmt(sg, 2) + ' = ' + fmt(z, 2),
      X(-6.2), Y(-3.1), 'rgba(195,180,245,.78)', 10.5, 'left');
  },
  hud() {
    const s = this.state;
    const z = (s.a - s.mu) / s.sig;
    return [
      {k: 'μ', v: fmt(s.mu, 2)},
      {k: 'σ', v: fmt(s.sig, 2)},
      {k: 'a', v: fmt(s.a, 2), hi: true},
      {k: 'z = (a−μ)/σ', v: fmt(z, 2)},
      {k: 'P(X ≤ a)', v: fmt(phi(z), 4), hi: true}
    ];
  },
  panel(el) {
    const s = this.state;
    addSlider(el, '均值 μ', -2, 2, .05, s.mu, v => v.toFixed(2), v => s.mu = v);
    addSlider(el, '标准差 σ', .3, 2, .05, s.sig, v => v.toFixed(2), v => s.sig = v);
    this.slider = addSlider(el, '阈值 a', -6, 6, .05, s.a, v => v.toFixed(2), v => s.a = v);
    addToggle(el, '显示 μ±3σ 区间', s.band, v => s.band = v);
    addBtn(el, '化为标准正态 μ=0, σ=1', () => {
      s.mu = 0; s.sig = 1; s.a = .8;
      buildPanel();
    }, 'ghost');
  }
});

/* ============================================================
   05 超几何分布
   ============================================================ */
MODULES.push({
  key: 'hyper', tab: '05', name: '超几何分布', en: 'HYPERGEOMETRIC', blurb: '不放回抽样',
  accent: '#ff8fab', rgb: '255,143,171',
  hint: '拖动小球之间的分隔线改变次品件数 M',
  state: {M: 3, n: 4, bin: true},
  reset() { this.state.M = 3; this.state.n = 4; this.state.bin = true; },
  meta() {
    return {
      title: '不放回抽样：超几何分布',
      desc: '10 件产品中有 M 件次品，不放回地抽取 n 件，次品数 <b>X</b> 服从超几何分布；若改为有放回，则 X 服从二项分布 B(n, M/10)。拖动分隔线改变 M，比较两种分布的柱高差异。',
      formula: 'P(X = k) = C<sub>M</sub><sup>k</sup>C<sub>10−M</sub><sup>n−k</sup> / C<sub>10</sub><sup>n</sup>',
      note: '不放回时，抽走一件会改变剩余次品率，所以超几何分布的方差更小、柱形更集中。当 N 远大于 n 时，两种分布几乎重合。'
    };
  },
  handles() { return [{id: 'm', x: -5 + this.state.M, y: 2.7}]; },
  drag(id, p) {
    const q = clampPt(p);
    this.state.M = clamp(Math.round(q.x + 5), 1, 9);
  },
  draw() {
    setFrame(.5, .5, 13);
    base();
    const s = this.state, N = 10, M = s.M, n = s.n;
    const yB = 2.7;

    for (let i = 0; i < N; i++) {
      const p = {x: -4.5 + i, y: yB};
      if (i < M) dot(p, '#ff8fab', 11);
      else dot(p, 'rgba(150,180,195,.38)', 10);
    }
    sans('次品 M = ' + M, X(-5.0), Y(yB + .75), 'rgba(255,185,205,.9)', 10.5, 'left');
    sans('正品 ' + (N - M), X(5.0), Y(yB + .75), 'rgba(180,205,215,.75)', 10.5, 'right');
    sans('袋中共 N = 10 件，任取 n = ' + n + ' 件，X = 抽到的次品数', X(0), Y(yB + 1.2), 'rgba(190,210,220,.72)', 10.5);

    const dx = -5 + M;
    line({x: dx, y: yB - .62}, {x: dx, y: yB + .62}, 'rgba(255,143,171,.6)', {w: 1.5, dash: [4, 4]});
    handle({x: dx, y: yB}, '#ff8fab', hoverId === 'm');

    const left = -5.2, slot = 10.4 / (n + 1), baseY = -1.5;
    const hyp = [], bin = [];
    for (let k = 0; k <= n; k++) {
      hyp.push(comb(M, k) * comb(N - M, n - k) / comb(N, n));
      bin.push(comb(n, k) * Math.pow(M / N, k) * Math.pow(1 - M / N, n - k));
    }
    const pmax = Math.max.apply(null, hyp.concat(s.bin ? bin : [0])) || 1;
    const hk = 2.6 / pmax;
    const xc = k => left + (k + .5) * slot;

    line({x: -5.4, y: baseY}, {x: 5.4, y: baseY}, 'rgba(150,200,215,.28)', {w: 1.3});

    for (let k = 0; k <= n; k++) {
      bar(xc(k), slot * .58, baseY, baseY + hyp[k] * hk, 'rgba(255,143,171,.2)', '#ff8fab', 1.3);
      sans(String(k), X(xc(k)), Y(baseY - .32), 'rgba(190,210,220,.75)', 9.5);
    }

    if (s.bin) {
      ctx.save();
      ctx.beginPath();
      for (let k = 0; k <= n; k++) {
        const x = X(xc(k)), y = Y(baseY + bin[k] * hk);
        if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(154,208,255,.85)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.restore();
      for (let k = 0; k <= n; k++) {
        dot({x: xc(k), y: baseY + bin[k] * hk}, '#9ad0ff', 3.4);
      }
    }

    /* 图例 */
    bar(-4.6, .3, 1.32, 1.72, 'rgba(255,143,171,.3)', '#ff8fab', 1.2);
    sans('超几何（不放回）', X(-4.3), Y(1.52), 'rgba(255,190,205,.85)', 10, 'left');
    if (s.bin) {
      dot({x: .9, y: 1.52}, '#9ad0ff', 4);
      sans('二项（有放回）', X(1.15), Y(1.52), 'rgba(175,212,245,.85)', 10, 'left');
    }

    math('E(X) = n·M/N = ' + fmt(n * M / N, 2), X(4.9), Y(2.0), 'rgba(255,190,205,.9)', 12.5, 'right');
  },
  hud() {
    const s = this.state, N = 10, M = s.M, n = s.n;
    const p0 = comb(M, 0) * comb(N - M, n) / comb(N, n);
    const p0b = Math.pow(1 - M / N, n);
    const E = n * M / N;
    const E2 = n * (M / N) * (1 - M / N) * (N - n) / (N - 1) + E * E;
    return [
      {k: '次品率 M/N', v: fmt(M / N, 2)},
      {k: 'E(X) = nM/N', v: fmt(E, 2), hi: true},
      {k: 'D(X) 超几何', v: fmt(E2 - E * E, 3)},
      {k: 'P(X=0) 不放回', v: fmt(p0, 4)},
      {k: 'P(X=0) 有放回', v: fmt(p0b, 4), hi: s.bin}
    ];
  },
  panel(el) {
    const s = this.state;
    addSlider(el, '抽取件数 n', 1, 6, 1, s.n, v => String(v), v => s.n = v);
    addToggle(el, '叠加二项分布（有放回）', s.bin, v => s.bin = v);
    addBtn(el, '换一批：M = 3', () => { s.M = 3; s.n = 4; }, 'ghost');
  }
});

})();