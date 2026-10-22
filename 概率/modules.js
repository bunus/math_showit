/* ============================================================
   必修第二册 · 第 10 章 概率
   ============================================================ */
(function () {

/* ---------- 局部绘图工具 ---------- */
function circ(c, r, color, fill, opt) {
  opt = opt || {};
  ctx.save();
  ctx.beginPath();
  ctx.arc(X(c.x), Y(c.y), r * V.k, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  ctx.strokeStyle = color;
  ctx.lineWidth = opt.w || 2;
  if (opt.dash) ctx.setLineDash(opt.dash);
  ctx.stroke();
  ctx.restore();
}
function inC(p, c, r) {
  return len2(p.x - c.x, p.y - c.y) <= r + 1e-6;
}
function wrect(x0, y0, x1, y1, fill, stroke, w, dash) {
  if (fill) {
    ctx.save();
    ctx.fillStyle = fill;
    ctx.fillRect(X(x0), Y(y1), (x1 - x0) * V.k, (y1 - y0) * V.k);
    ctx.restore();
  }
  if (stroke) {
    line({x: x0, y: y0}, {x: x1, y: y0}, stroke, {w: w || 1.5, dash: dash});
    line({x: x1, y: y0}, {x: x1, y: y1}, stroke, {w: w || 1.5, dash: dash});
    line({x: x1, y: y1}, {x: x0, y: y1}, stroke, {w: w || 1.5, dash: dash});
    line({x: x0, y: y1}, {x: x0, y: y0}, stroke, {w: w || 1.5, dash: dash});
  }
}
/* 骰子点数图案 */
const PIPS = {
  1: [[0, 0]],
  2: [[-1, 1], [1, -1]],
  3: [[-1, 1], [0, 0], [1, -1]],
  4: [[-1, 1], [1, 1], [-1, -1], [1, -1]],
  5: [[-1, 1], [1, 1], [0, 0], [-1, -1], [1, -1]],
  6: [[-1, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [1, -1]]
};
function pips(cx, cy, k, color) {
  (PIPS[k] || []).forEach(function (q) {
    dot({x: cx + q[0] * .2, y: cy + q[1] * .28}, color, 3.2);
  });
}

/* ---------- 01 样本空间与随机事件 ---------- */
MODULES.push({
  key: 'sample', tab: '01', name: '样本空间', en: 'SAMPLE SPACE', blurb: '样本点与随机事件',
  accent: '#5eead4', rgb: '94,234,212',
  hint: '拖动顶部手柄选择事件 A，或掷一次骰子',
  state: {n: 3, comp: false, roll: 0},
  reset() { this.state.n = 3; this.state.comp = false; this.state.roll = 0; },
  meta() {
    return {
      title: '样本空间与随机事件',
      desc: '掷一枚均匀骰子，所有可能的结果组成样本空间 Ω = {1,2,3,4,5,6}，每个结果是一个样本点。把满足条件“点数不超过 n”的样本点收集起来就得到随机事件 A。拖动顶部手柄，观察 A 中的样本点如何增减。',
      formula: 'Ω = {1,2,3,4,5,6}　A = {点数 ≤ n}',
      note: '随机事件是样本空间的<b>子集</b>。样本点等可能时 <span class="nw">P(A) = |A| / |Ω|</span>；A 包含的样本点越多，A 发生的可能性越大。'
    };
  },
  handles() {
    const n = this.state.n;
    return [{id: 'n', x: 1.1 * n - 3.39, y: 1.8}];
  },
  drag(id, p) {
    const q = clampPt(p);
    this.state.n = clamp(Math.round((q.x + 3.39) / 1.1), 1, 6);
  },
  draw() {
    setFrame(.5, .55, 12);
    base();
    const s = this.state, n = clamp(Math.round(s.n), 1, 6);
    const cy = .5, hw = .46, hh = .55;

    sans('Ω = {1, 2, 3, 4, 5, 6}', X(-5.2), Y(3.05), 'rgba(185,208,220,.85)', 11.5, 'left');
    sans('全体样本点', X(-5.2), Y(2.6), 'rgba(150,175,190,.6)', 10, 'left');

    for (let i = 1; i <= 6; i++) {
      const cx = -2.75 + 1.1 * (i - 1);
      const inA = i <= n;
      const col = inA ? '#5eead4' : (s.comp ? 'rgba(255,143,171,.7)' : 'rgba(160,180,195,.38)');
      wrect(cx - hw, cy - hh, cx + hw, cy + hh,
        inA ? 'rgba(94,234,212,.11)' : null, col, inA ? 2.2 : 1.4);
      pips(cx, cy, i, inA ? '#9df7e6' : (s.comp ? 'rgba(255,160,180,.85)' : 'rgba(150,172,188,.5)'));
      sans(String(i), X(cx), Y(cy - hh - .34), inA ? 'rgba(160,240,225,.85)' : 'rgba(140,160,175,.55)', 10.5);
    }

    const ax0 = -2.75 - hw, ax1 = -2.75 + 1.1 * (n - 1) + hw;
    line({x: ax0, y: -.42}, {x: ax1, y: -.42}, '#5eead4', {w: 5});
    sans('A：点数 ≤ ' + n + '，|A| = ' + n, X((ax0 + ax1) / 2), Y(-.92), '#8ff5e4', 11.5);

    if (s.comp) {
      if (n < 6) {
        const bx0 = ax1 + .14, bx1 = 2.75 + hw;
        line({x: bx0, y: -.42}, {x: bx1, y: -.42}, 'rgba(255,143,171,.8)', {w: 5});
        sans('Ā：|Ā| = ' + (6 - n), X((bx0 + bx1) / 2), Y(-1.55), 'rgba(255,175,195,.9)', 11);
      } else {
        sans('Ā = ∅', X(1.3), Y(-1.55), 'rgba(255,175,195,.9)', 11);
      }
      sans('P(Ā) = ' + (6 - n) + '/6 = ' + fmt((6 - n) / 6, 3), X(0), Y(-2.25), 'rgba(255,175,195,.9)', 11.5);
    } else {
      sans('P(A) = ' + n + '/6 = ' + fmt(n / 6, 3), X(0), Y(-2.05), 'rgba(150,235,220,.9)', 11.5);
    }

    const hx = 1.1 * n - 3.39;
    line({x: hx, y: 1.15}, {x: hx, y: 1.72}, 'rgba(94,234,212,.45)', {w: 1.2, dash: [3, 3]});
    handle({x: hx, y: 1.8}, '#5eead4', hoverId === 'n');

    if (s.roll > 0) {
      const cx = -2.75 + 1.1 * (s.roll - 1);
      wrect(cx - hw - .1, cy - hh - .1, cx + hw + .1, cy + hh + .1, null, '#ffc56b', 2.4);
      const occ = s.roll <= n;
      sans('本次掷出 ' + s.roll + '：' + (occ ? 'A 发生' : 'A 未发生'),
        X(0), Y(2.35), occ ? '#ffd99a' : '#ffb3c6', 12);
    }
  },
  hud() {
    const s = this.state, n = clamp(Math.round(s.n), 1, 6);
    const occ = s.roll > 0 ? s.roll <= n : null;
    return [
      {k: '|Ω|', v: '6'},
      {k: '|A|', v: String(n), hi: true},
      {k: 'P(A)', v: n + '/6 ≈ ' + fmt(n / 6, 3)},
      {k: '本次点数', v: s.roll > 0 ? String(s.roll) : '—'},
      {k: 'A 是否发生', v: occ === null ? '—' : (occ ? '发生' : '未发生'), hi: occ === true}
    ];
  },
  panel(el) {
    const s = this.state;
    addSlider(el, '事件 A：点数 ≤ n', 1, 6, 1, s.n, v => String(v), v => s.n = v);
    addToggle(el, '显示对立事件 Ā', s.comp, v => s.comp = v);
    addBtn(el, '掷一次骰子', () => { s.roll = 1 + Math.floor(Math.random() * 6); }, 'ghost');
  }
});

/* ---------- 02 古典概型 ---------- */
MODULES.push({
  key: 'classical', tab: '02', name: '古典概型', en: 'CLASSICAL', blurb: 'm / n 的比值',
  accent: '#6cb6ff', rgb: '108,182,255',
  hint: '调节球数与红球数，观察 P(A) = m / n 的变化',
  state: {N: 10, m: 4},
  reset() { this.state.N = 10; this.state.m = 4; },
  meta() {
    return {
      title: '古典概型：等可能的基本事件',
      desc: '袋中装有 n 个除颜色外完全相同的小球，其中 m 个是红球。任取一个球，每个球被取到的可能性相同，基本事件总数为 n，事件 A“取到红球”包含 m 个基本事件。调节两个滑块，观察比值怎样变化。',
      formula: 'P(A) = m / n = |A| / |Ω|',
      note: '古典概型要求：基本事件<b>有限</b>且<b>等可能</b>。m 增大时 P(A) 增大，但 P(A) 一定落在 <span class="nw">0 ≤ P(A) ≤ 1</span> 之内。'
    };
  },
  draw() {
    setFrame(.5, .55, 12);
    base();
    const s = this.state;
    const N = Math.round(s.N), m = Math.min(Math.round(s.m), N);
    const rows = Math.ceil(N / 6);
    for (let i = 0; i < N; i++) {
      const r = Math.floor(i / 6), c = i % 6;
      const cnt = Math.min(6, N - r * 6);
      const x = -(cnt - 1) * 1.02 / 2 + c * 1.02;
      const y = 1.55 - r * 1.05;
      const red = i < m;
      circ({x, y}, .4, red ? '#6cb6ff' : 'rgba(165,185,200,.5)',
        red ? 'rgba(108,182,255,.22)' : 'rgba(165,185,200,.06)', {w: red ? 2.2 : 1.4});
      if (red) dot({x: x - .11, y: y + .13}, 'rgba(190,220,255,.6)', 2.4);
    }
    sans('袋中 ' + N + ' 个球：红 ' + m + ' 个，白 ' + (N - m) + ' 个',
      X(0), Y(1.55 - (rows - 1) * 1.05 + .78), 'rgba(180,205,220,.8)', 11);

    const P = m / N;
    const by = -1.35;
    line({x: -3, y: by}, {x: 3, y: by}, 'rgba(170,190,205,.22)', {w: 9});
    if (P > 0) line({x: -3, y: by}, {x: -3 + 6 * P, y: by}, '#6cb6ff', {w: 9});
    line({x: -3, y: by - .28}, {x: -3, y: by + .28}, 'rgba(190,210,225,.55)', {w: 1.5});
    line({x: 3, y: by - .28}, {x: 3, y: by + .28}, 'rgba(190,210,225,.55)', {w: 1.5});
    if (P > 0 && P < 1) dot({x: -3 + 6 * P, y: by}, '#a9d4ff', 4);
    sans('0', X(-3), Y(by - .55), 'rgba(150,175,190,.6)', 9.5);
    sans('1', X(3), Y(by - .55), 'rgba(150,175,190,.6)', 9.5);

    math('P(A) = ' + m + '/' + N + ' = ' + fmt(P, 3), X(0), Y(-2.25), '#a9d4ff', 17);
    sans('红色部分占全长的比例就是 P(A)', X(0), Y(-2.85), 'rgba(160,190,210,.6)', 10);
  },
  hud() {
    const s = this.state;
    const N = Math.round(s.N), m = Math.min(Math.round(s.m), N);
    return [
      {k: '基本事件总数 n', v: String(N)},
      {k: 'A 包含的 m', v: String(m), hi: true},
      {k: '不属于 A 的', v: String(N - m)},
      {k: 'P(A)', v: m + '/' + N},
      {k: '小数近似', v: fmt(m / N, 3)}
    ];
  },
  panel(el) {
    const s = this.state;
    let mRef = null;
    addSlider(el, '袋中球的总数 n', 2, 12, 1, s.N, v => String(v), v => {
      s.N = v;
      if (s.m > v) s.m = v;
      if (mRef) { mRef.input.max = v; mRef.set(s.m); }
    });
    mRef = addSlider(el, '红球数 m', 0, 12, 1, s.m, v => String(v), v => {
      s.m = Math.min(v, Math.round(s.N));
    });
    mRef.input.max = Math.round(s.N);
    addBtn(el, '随机配置', () => {
      s.N = 4 + Math.floor(Math.random() * 9);
      s.m = Math.floor(Math.random() * (s.N + 1));
      buildPanel();
    }, 'ghost');
  }
});

/* ---------- 03 事件的关系与运算 ---------- */
MODULES.push({
  key: 'events', tab: '03', name: '事件的运算', en: 'EVENT ALGEBRA', blurb: '交、并、对立',
  accent: '#ffc56b', rgb: '255,197,107',
  hint: '拖动 B 圆，切换 A∩B、A∪B、Ā 的高亮',
  state: {b: {x: 1.3, y: .1}, inter: true, union: false, comp: false},
  reset() {
    this.state.b = {x: 1.3, y: .1};
    this.state.inter = true; this.state.union = false; this.state.comp = false;
  },
  meta() {
    return {
      title: '事件的关系与运算',
      desc: '把事件看成样本空间 Ω 的子集，事件的运算就对应集合的运算。拖动 B 圆可以改变事件 B 包含的样本点：A∩B 表示 A 与 B 同时发生，A∪B 表示至少有一个发生，Ā 表示 A 不发生。',
      formula: 'A∩B　A∪B　Ā = Ω \\ A',
      note: '对立事件一定互斥，但互斥事件不一定对立。<span class="nw">P(Ā) = 1 − P(A)</span>，而 <span class="nw">P(A∪B) = P(A) + P(B) − P(A∩B)</span>。'
    };
  },
  handles() { return [{id: 'b', x: this.state.b.x, y: this.state.b.y}]; },
  drag(id, p) {
    const q = clampPt(p);
    this.state.b = {x: clamp(q.x, -2.4, 2.4), y: clamp(q.y, -.7, .7)};
  },
  draw() {
    setFrame(.5, .55, 12);
    base();
    const s = this.state;
    const Ac = {x: -1.5, y: 0}, Ar = 2.1;
    const Bc = s.b, Br = 2.1;
    const E = [
      {x: -3.4, y: 1.2}, {x: -3.1, y: -1.1}, {x: -2.2, y: 1.9}, {x: -2.0, y: -1.8},
      {x: -.9, y: .9}, {x: -1.0, y: -.9}, {x: .2, y: 1.6}, {x: .4, y: -1.5},
      {x: 1.6, y: .6}, {x: 1.9, y: -.8}, {x: 2.9, y: 1.4}, {x: 3.1, y: -1.3}
    ];

    wrect(-4.6, -2.9, 4.6, 2.9, 'rgba(120,150,175,.04)', 'rgba(160,185,200,.35)', 1.4);
    sans('Ω', X(-4.35), Y(2.62), 'rgba(170,195,210,.8)', 13, 'left');

    circ(Ac, Ar, 'rgba(108,182,255,.85)', 'rgba(108,182,255,.07)', {w: 2});
    circ(Bc, Br, 'rgba(255,143,171,.85)', 'rgba(255,143,171,.07)', {w: 2});
    math('A', X(Ac.x - Ar * .6), Y(Ac.y + Ar * .66), '#a9d4ff', 18);
    math('B', X(Bc.x + Br * .6), Y(Bc.y + Br * .66), '#ffb3c6', 18);

    const active = s.inter ? 'inter' : (s.union ? 'union' : (s.comp ? 'comp' : ''));
    E.forEach(p => {
      const a = inC(p, Ac, Ar), b = inC(p, Bc, Br);
      let hit = false;
      if (active === 'inter') hit = a && b;
      else if (active === 'union') hit = a || b;
      else if (active === 'comp') hit = !a;
      dot(p, hit ? '#ffc56b' : 'rgba(175,195,210,.42)', hit ? 5.4 : 4);
    });

    const cA = E.filter(p => inC(p, Ac, Ar)).length;
    const cB = E.filter(p => inC(p, Bc, Br)).length;
    const cI = E.filter(p => inC(p, Ac, Ar) && inC(p, Bc, Br)).length;
    sans('|A| = ' + cA + '　|B| = ' + cB + '　|A∩B| = ' + cI,
      X(0), Y(-3.35), 'rgba(170,200,215,.85)', 11.5);

    const names = {inter: 'A∩B：A 与 B 同时发生', union: 'A∪B：A 与 B 至少一个发生', comp: 'Ā：A 不发生'};
    if (active) sans(names[active], X(0), Y(3.15), '#ffd99a', 12.5);

    handle(Bc, '#ff8fab', hoverId === 'b');
  },
  hud() {
    const s = this.state;
    const Ac = {x: -1.5, y: 0}, Bc = s.b;
    const E = [
      {x: -3.4, y: 1.2}, {x: -3.1, y: -1.1}, {x: -2.2, y: 1.9}, {x: -2.0, y: -1.8},
      {x: -.9, y: .9}, {x: -1.0, y: -.9}, {x: .2, y: 1.6}, {x: .4, y: -1.5},
      {x: 1.6, y: .6}, {x: 1.9, y: -.8}, {x: 2.9, y: 1.4}, {x: 3.1, y: -1.3}
    ];
    const cA = E.filter(p => inC(p, Ac, 2.1)).length;
    const cB = E.filter(p => inC(p, Bc, 2.1)).length;
    const cI = E.filter(p => inC(p, Ac, 2.1) && inC(p, Bc, 2.1)).length;
    return [
      {k: '|A|', v: String(cA)},
      {k: '|B|', v: String(cB)},
      {k: '|A∩B|', v: String(cI), hi: s.inter},
      {k: '|A∪B|', v: String(cA + cB - cI), hi: s.union},
      {k: '|Ā|', v: String(12 - cA), hi: s.comp}
    ];
  },
  panel(el) {
    const s = this.state;
    const pick = k => v => {
      s.inter = s.union = s.comp = false;
      if (v) s[k] = true; else s.inter = true;
      buildPanel();
    };
    addToggle(el, '高亮 A∩B（同时发生）', s.inter, pick('inter'));
    addToggle(el, '高亮 A∪B（至少一个）', s.union, pick('union'));
    addToggle(el, '高亮 Ā（A 不发生）', s.comp, pick('comp'));
  }
});

/* ---------- 04 频率与概率 ---------- */
MODULES.push({
  key: 'freq', tab: '04', name: '频率与概率', en: 'FREQUENCY', blurb: '大量重复试验',
  accent: '#ff8fab', rgb: '255,143,171',
  hint: '开启自动投掷或点击按钮，观察频率折线',
  state: {p: .5, n: 0, heads: 0, hist: [], auto: false},
  reset() { this.state.p = .5; this.state.n = 0; this.state.heads = 0; this.state.hist = []; this.state.auto = false; },
  meta() {
    return {
      title: '频率的稳定性与概率',
      desc: '重复投掷一枚硬币，记录正面出现的频率 f = 正面次数 / 试验次数。试验次数较少时频率波动很大，随着次数增加，频率会在某个常数附近摆动，这个常数就是概率。也可以用滑块把硬币改成不均匀的。',
      formula: 'f(n) = n(H) / n　n → +∞ 时 f → P',
      note: '频率是<b>试验值</b>，会波动；概率是<b>确定的常数</b>。增大试验次数只能让频率更靠近概率，并不能保证每次试验都相等。'
    };
  },
  draw(dt) {
    setFrame(.5, .52, 12);
    base();
    const s = this.state;
    const MAXN = 6000;

    if (s.auto) {
      let k = Math.max(1, Math.round(dt * 520));
      k = Math.min(k, MAXN - s.n);
      for (let i = 0; i < k; i++) {
        s.n++;
        if (Math.random() < s.p) s.heads++;
        if (s.n <= 10 || s.n % 10 === 0) s.hist.push({n: s.n, f: s.heads / s.n});
      }
      if (s.n >= MAXN) s.auto = false;
    }

    const x0 = -5.2, x1 = 5.0, y0 = -2.2, y1 = 2.45;
    const xOf = n => x0 + (n / MAXN) * (x1 - x0);
    const yOf = f => y0 + f * (y1 - y0);

    line({x: x0, y: y0}, {x: x1, y: y0}, 'rgba(200,225,235,.42)', {w: 1.4});
    line({x: x0, y: y0}, {x: x0, y: y1}, 'rgba(200,225,235,.42)', {w: 1.4});
    for (let t = 0; t <= 4; t++) {
      const f = t / 4;
      line({x: x0 - .1, y: yOf(f)}, {x: x0 + .1, y: yOf(f)}, 'rgba(200,225,235,.35)', {w: 1});
      sans(fmt(f, 2), X(x0) - 12, Y(yOf(f)), 'rgba(150,175,190,.7)', 9.5, 'right');
      line({x: x0, y: yOf(f)}, {x: x1, y: yOf(f)}, 'rgba(170,205,220,.07)', {w: 1});
    }
    for (let t = 0; t <= 4; t++) {
      const n = t * 1500;
      line({x: xOf(n), y: y0}, {x: xOf(n), y: y0 - .12}, 'rgba(200,225,235,.35)', {w: 1});
      sans(String(n), X(xOf(n)), Y(y0 - .42), 'rgba(150,175,190,.7)', 9.5);
    }

    sans('频率 f', X(x0 + .1), Y(y1 + .38), 'rgba(180,205,220,.8)', 10.5, 'left');
    sans('试验次数 n', X(x1), Y(y0 - .85), 'rgba(180,205,220,.8)', 10.5, 'right');

    line({x: x0, y: yOf(s.p)}, {x: x1, y: yOf(s.p)}, 'rgba(255,143,171,.85)', {w: 1.8, dash: [6, 5]});
    sans('p = ' + fmt(s.p, 2), X(x1) + 4, Y(yOf(s.p)) - 12, '#ffb3c6', 11, 'right');

    if (s.hist.length > 1) {
      for (let i = 1; i < s.hist.length; i++) {
        line({x: xOf(s.hist[i - 1].n), y: yOf(s.hist[i - 1].f)},
          {x: xOf(s.hist[i].n), y: yOf(s.hist[i].f)}, '#ff8fab', {w: 1.7, alpha: .95});
      }
      const last = s.hist[s.hist.length - 1];
      dot({x: xOf(last.n), y: yOf(last.f)}, '#ffd0dd', 4.5);
      sans(fmt(last.f, 3), X(xOf(last.n)) + 10, Y(yOf(last.f)) - 14,
        '#ffd0dd', 11, 'left');
    } else {
      sans('点击「投掷 100 次」或开启自动投掷', X(0), Y(y1 - .5), 'rgba(180,200,215,.6)', 11.5);
    }
  },
  hud() {
    const s = this.state;
    const f = s.n > 0 ? s.heads / s.n : 0;
    return [
      {k: '试验次数 n', v: String(s.n), hi: true},
      {k: '正面次数', v: String(s.heads)},
      {k: '频率 f', v: s.n > 0 ? fmt(f, 4) : '—'},
      {k: '理论概率 p', v: fmt(s.p, 2)},
      {k: '|f − p|', v: s.n > 0 ? fmt(Math.abs(f - s.p), 4) : '—', hi: s.n > 0 && Math.abs(f - s.p) < .02}
    ];
  },
  panel(el) {
    const s = this.state;
    const sim = k => {
      const MAXN = 6000;
      k = Math.min(k, MAXN - s.n);
      for (let i = 0; i < k; i++) {
        s.n++;
        if (Math.random() < s.p) s.heads++;
        if (s.n <= 10 || s.n % 10 === 0) s.hist.push({n: s.n, f: s.heads / s.n});
      }
    };
    addSlider(el, '理论概率 p', .1, .9, .05, s.p, v => v.toFixed(2), v => {
      s.p = v; s.n = 0; s.heads = 0; s.hist = []; s.auto = false;
    });
    addToggle(el, '自动投掷', s.auto, v => { s.auto = v; });
    const r = row(el);
    addBtn(r, '投掷 100 次', () => sim(100), 'ghost');
    addBtn(r, '投掷 1000 次', () => sim(1000), 'ghost');
    addBtn(r, '清空', () => { s.n = 0; s.heads = 0; s.hist = []; s.auto = false; buildPanel(); }, 'ghost');
  }
});

/* ---------- 05 相互独立与对立事件 ---------- */
MODULES.push({
  key: 'indep', tab: '05', name: '相互独立', en: 'INDEPENDENCE', blurb: 'P(AB) = P(A)P(B)',
  accent: '#b49cff', rgb: '180,156,255',
  hint: '拖动角点同时改变 P(A) 与 P(B)，验证乘积关系',
  state: {a: .5, b: .4, opp: false},
  reset() { this.state.a = .5; this.state.b = .4; this.state.opp = false; },
  meta() {
    return {
      title: '相互独立事件',
      desc: '把概率看成单位正方形内的面积：A 占左边的竖条，B 占下面的横条，重叠部分的面积恰好是 P(A)·P(B)。拖动角点或调节滑块，观察等式两边是否始终相等，并打开 Ā 查看对立事件。',
      formula: 'P(AB) = P(A)·P(B)',
      note: '独立是“<b>一个发生与否不影响另一个</b>”。对立事件 Ā 满足 <span class="nw">P(Ā) = 1 − P(A)</span>；A 与 Ā 互斥，绝不可能独立（除非 P(A)=0）。'
    };
  },
  handles() {
    const s = this.state;
    return [{id: 'c', x: -2.4 + 4.8 * s.a, y: -2.4 + 4.8 * s.b}];
  },
  drag(id, p) {
    const q = clampPt(p);
    this.state.a = clamp((q.x + 2.4) / 4.8, .05, .95);
    this.state.b = clamp((q.y + 2.4) / 4.8, .05, .95);
  },
  draw() {
    setFrame(.5, .5, 12);
    base();
    const s = this.state;
    const x0 = -2.4, x1 = 2.4, y0 = -2.4, y1 = 2.4;
    const xa = x0 + 4.8 * s.a, yb = y0 + 4.8 * s.b;

    if (s.opp) {
      wrect(xa, y0, x1, y1, 'rgba(255,143,171,.07)', 'rgba(255,143,171,.5)', 1.4, [4, 4]);
      sans('Ā', X((xa + x1) / 2), Y(y1 + .32), '#ffb3c6', 13);
    }
    wrect(x0, y0, xa, y1, 'rgba(108,182,255,.10)', null);
    wrect(x0, y0, x1, yb, 'rgba(255,143,171,.10)', null);
    wrect(x0, y0, xa, yb, 'rgba(180,156,255,.26)', null);

    wrect(x0, y0, x1, y1, null, 'rgba(200,220,235,.55)', 1.6);
    line({x: xa, y: y0}, {x: xa, y: y1}, 'rgba(160,190,235,.55)', {w: 1.4, dash: [5, 5]});
    line({x: x0, y: yb}, {x: x1, y: yb}, 'rgba(255,160,190,.55)', {w: 1.4, dash: [5, 5]});

    sans('A', X((x0 + xa) / 2), Y(y1 + .32), '#a9d4ff', 14);
    sans('B', X(x1 + .42), Y((y0 + yb) / 2), '#ffb3c6', 14);

    if (s.a * s.b > .05) {
      math('AB', X((x0 + xa) / 2), Y((y0 + yb) / 2), '#e2d9ff', 17);
    }

    sans('P(A) = ' + fmt(s.a, 2), X(x0 - .15), Y(y0 - .5), 'rgba(169,212,255,.9)', 11, 'left');
    sans('P(B) = ' + fmt(s.b, 2), X(x1 + .15), Y(y1 + .5), 'rgba(255,179,198,.9)', 11, 'right');

    const prod = s.a * s.b;
    sans('P(A)P(B) = ' + fmt(prod, 3) + '　=　P(AB) = ' + fmt(prod, 3) + '　✓',
      X(0), Y(-3.0), '#c9bcff', 12.5);
    if (s.opp) {
      sans('P(Ā) = 1 − P(A) = ' + fmt(1 - s.a, 3) + '，P(A) + P(Ā) = 1',
        X(0), Y(-3.45), 'rgba(255,179,198,.9)', 11);
    }

    line({x: xa, y: yb}, {x: xa, y: y0}, 'rgba(180,156,255,.35)', {w: 1, dash: [3, 3]});
    line({x: xa, y: yb}, {x: x0, y: yb}, 'rgba(180,156,255,.35)', {w: 1, dash: [3, 3]});
    handle({x: xa, y: yb}, '#b49cff', hoverId === 'c');
  },
  hud() {
    const s = this.state;
    const prod = s.a * s.b;
    return [
      {k: 'P(A)', v: fmt(s.a, 3), hi: true},
      {k: 'P(B)', v: fmt(s.b, 3), hi: true},
      {k: 'P(A)·P(B)', v: fmt(prod, 4)},
      {k: 'P(AB)', v: fmt(prod, 4), hi: true},
      {k: 'P(A∪B)', v: fmt(s.a + s.b - prod, 4)}
    ];
  },
  panel(el) {
    const s = this.state;
    addSlider(el, 'P(A)', .05, .95, .05, s.a, v => v.toFixed(2), v => s.a = v);
    addSlider(el, 'P(B)', .05, .95, .05, s.b, v => v.toFixed(2), v => s.b = v);
    addToggle(el, '显示对立事件 Ā', s.opp, v => s.opp = v);
    addBtn(el, '重置为 0.5 / 0.4', () => { s.a = .5; s.b = .4; s.opp = false; buildPanel(); }, 'ghost');
  }
});

})();
