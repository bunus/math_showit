/* ============================================================
   必修第一册 · 第 3 章 函数的概念与性质
   ============================================================ */
(function () {

/* 绘制 y=f(x) 的折线图象，自动跳过无定义与过大的值 */
function plotCurve(f, x0, x1, color, opt) {
  opt = opt || {};
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = opt.w || 2.2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (opt.dash) ctx.setLineDash(opt.dash);
  if (opt.glow) { ctx.shadowColor = color; ctx.shadowBlur = opt.glow; }
  ctx.beginPath();
  const n = opt.n || 280;
  let pen = false;
  for (let i = 0; i <= n; i++) {
    const x = x0 + (x1 - x0) * i / n;
    const y = f(x);
    if (!isFinite(y) || Math.abs(y) > 45) { pen = false; continue; }
    const sx = X(x), sy = Y(y);
    if (!pen) { ctx.moveTo(sx, sy); pen = true; } else ctx.lineTo(sx, sy);
  }
  ctx.stroke();
  ctx.restore();
}

/* 画坐标轴（网格由 base 提供） */
function axes() {
  const L = lim();
  line({x: L.x0, y: 0}, {x: L.x1, y: 0}, 'rgba(200,225,235,.32)', {w: 1.3});
  line({x: 0, y: L.y0}, {x: 0, y: L.y1}, 'rgba(200,225,235,.32)', {w: 1.3});
  arrow({x: L.x1 - .9, y: 0}, {x: L.x1 - .1, y: 0}, 'rgba(200,225,235,.4)', {w: 1.3, head: 8});
  arrow({x: 0, y: L.y1 - .7}, {x: 0, y: L.y1 - .1}, 'rgba(200,225,235,.4)', {w: 1.3, head: 8});
  math('x', X(L.x1 - .45), Y(0) + 15, 'rgba(190,215,225,.55)', 13);
  math('y', X(0) - 15, Y(L.y1 - .45), 'rgba(190,215,225,.55)', 13);
  math('O', X(0) - 12, Y(0) + 13, 'rgba(190,215,225,.5)', 12);
}

/* 实数范围内的幂 x^a（只处理本章用到的指数） */
function powReal(x, a) {
  if (x >= 0) return Math.pow(x, a);
  if (Math.abs(a - Math.round(a)) < 1e-9) return Math.pow(x, Math.round(a));
  if (Math.abs(a - 1 / 3) < 1e-9) return -Math.pow(-x, 1 / 3);
  return NaN;
}

/* ============================================================
   01 函数的概念与对应关系
   ============================================================ */
const IN1 = [-2, -1, 0, 1, 2];
const OUT1 = [3, 0, -1];
const f1 = x => x * x - 1;
const nodeYa = i => 2.05 - i * 1.02;
const nodeYb = v => v === 3 ? 1.6 : (v === 0 ? 0 : -1.6);
const neg1 = v => String(v).replace('-', '−');

MODULES.push({
  key: 'mapping', tab: '01', name: '函数的概念', en: 'MAPPING', blurb: '定义域 → 值域',
  accent: '#5eead4', rgb: '94,234,212',
  hint: '拖动左侧旋钮选择输入 x，看它唯一对应的输出',
  state: {i: 2, all: true, t: 0},
  reset() { this.state.i = 2; this.state.all = true; this.state.t = 0; },
  meta() {
    return {
      title: '函数：一个 x 对应唯一的 y',
      desc: '把定义域中的每个 x 沿箭头送到值域中的 f(x)，就得到一个函数。拖动左侧旋钮换一个输入，观察每个输入都恰好射出一条箭头：一个 x 只能对应一个输出，但不同的 x 可以对应同一个输出。',
      formula: 'f：A → B，x ↦ f(x) = x² − 1',
      note: '判断对应是否为函数，关键看<b>唯一性</b>：定义域中每个 x 都必须有且只有一个像。原像可以不止一个，例如 <span class="nw">f(−2) = f(2) = 3</span>。'
    };
  },
  handles() { return [{id: 'sel', x: -5.0, y: nodeYa(this.state.i)}]; },
  drag(id, p) {
    const q = clampPt(p);
    this.state.i = clamp(Math.round((2.05 - q.y) / 1.02), 0, 4);
  },
  draw(dt) {
    setFrame(.5, .54, 12);
    base();
    const s = this.state;
    s.t += Math.min(dt || 0, .05);
    const i = clamp(Math.round(s.i), 0, 4);
    const x = IN1[i], y = f1(x);

    sans('定义域 A', X(-3.2), Y(2.95), 'rgba(150,235,220,.9)', 11.5);
    sans('值域 B', X(3.3), Y(2.95), 'rgba(255,215,160,.9)', 11.5);

    // 左侧选择轨道
    line({x: -5.0, y: 2.35}, {x: -5.0, y: -2.35}, 'rgba(94,234,212,.22)', {w: 1, dash: [4, 5]});
    IN1.forEach((v, k) => {
      line({x: -5.25, y: nodeYa(k)}, {x: -4.75, y: nodeYa(k)}, 'rgba(94,234,212,.26)', {w: 1});
    });
    line({x: -5.0, y: nodeYa(i)}, {x: -3.2, y: nodeYa(i)}, 'rgba(94,234,212,.28)', {w: 1, dash: [3, 4]});

    // 全部对应箭头（淡）
    if (s.all) {
      IN1.forEach((v, k) => {
        if (k === i) return;
        arrow({x: -3.2, y: nodeYa(k)}, {x: 3.3, y: nodeYb(f1(v))}, 'rgba(120,175,195,.2)', {w: 1.2, head: 8});
      });
    }
    const A0 = {x: -3.2, y: nodeYa(i)}, B0 = {x: 3.3, y: nodeYb(y)};
    arrow(A0, B0, '#5eead4', {w: 3, head: 12, glow: 14});

    // 沿箭头移动的映射点
    const ph = (s.t * .55) % 1;
    dot({x: lerp(A0.x, B0.x, ph), y: lerp(A0.y, B0.y, ph)}, '#ffe0a8', 3.6);

    // 输入结点
    IN1.forEach((v, k) => {
      const on = k === i;
      ctx.save();
      ctx.beginPath(); ctx.arc(X(-3.2), Y(nodeYa(k)), on ? 17 : 13, 0, TAU);
      ctx.fillStyle = on ? 'rgba(94,234,212,.16)' : 'rgba(9,17,28,.86)';
      ctx.fill();
      ctx.lineWidth = on ? 2.4 : 1.5;
      ctx.strokeStyle = on ? '#5eead4' : 'rgba(94,234,212,.38)';
      ctx.stroke();
      ctx.restore();
      math(neg1(v), X(-3.2), Y(nodeYa(k)), on ? '#eafffa' : 'rgba(190,235,228,.72)', on ? 17 : 14);
    });

    // 输出结点
    OUT1.forEach(v => {
      const on = v === y;
      ctx.save();
      ctx.beginPath(); ctx.arc(X(3.3), Y(nodeYb(v)), on ? 17 : 13, 0, TAU);
      ctx.fillStyle = on ? 'rgba(255,197,107,.18)' : 'rgba(9,17,28,.86)';
      ctx.fill();
      ctx.lineWidth = on ? 2.4 : 1.5;
      ctx.strokeStyle = on ? '#ffc56b' : 'rgba(255,197,107,.4)';
      ctx.stroke();
      ctx.restore();
      math(neg1(v), X(3.3), Y(nodeYb(v)), on ? '#fff3dc' : 'rgba(245,225,190,.7)', on ? 17 : 14);
    });

    math('f', X(.05), Y(2.55), 'rgba(185,225,228,.8)', 18);
    sans('A = {−2, −1, 0, 1, 2}　　B = {−1, 0, 3}', X(-.1), Y(-3.2), 'rgba(165,195,205,.78)', 11.5);

    handle({x: -5.0, y: nodeYa(i)}, '#5eead4', hoverId === 'sel');
  },
  hud() {
    const i = clamp(Math.round(this.state.i), 0, 4);
    const x = IN1[i], y = f1(x);
    const pre = IN1.filter(t => f1(t) === y).length;
    return [
      {k: '输入 x', v: neg1(x), hi: true},
      {k: '输出 f(x)', v: neg1(y), hi: true},
      {k: '该输出的原像个数', v: pre + ' 个'},
      {k: '对应关系', v: pre > 1 ? '多对一' : '一对一'}
    ];
  },
  panel(el) {
    const s = this.state;
    addToggle(el, '显示全部对应箭头', s.all, v => s.all = v);
    addBtn(el, '换一个输入', () => { s.i = (Math.round(s.i) + 1) % 5; }, 'ghost');
  }
});

/* ============================================================
   02 单调性
   ============================================================ */
const f2 = x => .25 * x * x * x - .75 * x;
function mono2(x1, x2) {
  if (x1 >= 1 - 1e-6) return '单调递增';
  if (x2 <= -1 + 1e-6) return '单调递增';
  if (x1 >= -1 + 1e-6 && x2 <= 1 - 1e-6) return '单调递减';
  return '不确定';
}

MODULES.push({
  key: 'mono', tab: '02', name: '函数的单调性', en: 'MONOTONICITY', blurb: '割线斜率与增减',
  accent: '#6cb6ff', rgb: '108,182,255',
  hint: '拖动图象上的 A、B 两点，观察割线斜率的正负',
  state: {x1: 1.2, x2: 2.2, tri: true},
  reset() { this.state.x1 = 1.2; this.state.x2 = 2.2; this.state.tri = true; },
  meta() {
    return {
      title: '割线斜率刻画平均变化率',
      desc: '在图象上取两点 A、B，割线斜率 k = Δy/Δx 就是区间上的平均变化率。拖动两点改变区间：k &gt; 0 时函数值随 x 增大而增大，k &lt; 0 时随 x 增大而减小。',
      formula: 'k = [f(x₂) − f(x₁)] / (x₂ − x₁)',
      note: '本例 <span class="nw">f(x) = ¼x³ − ¾x</span> 在 (−∞,−1) 与 (1,+∞) 上递增，在 (−1,1) 上递减。两点跨越极值点时，割线斜率的符号不能说明整段区间的单调性。'
    };
  },
  handles() {
    const s = this.state;
    return [
      {id: 'A', x: s.x1, y: f2(s.x1)},
      {id: 'B', x: s.x2, y: f2(s.x2)}
    ];
  },
  drag(id, p) {
    const q = clampPt(p);
    const v = clamp(q.x, -2.3, 2.3);
    const s = this.state;
    if (id === 'A') s.x1 = Math.min(v, s.x2 - .25);
    else s.x2 = Math.max(v, s.x1 + .25);
  },
  draw() {
    setFrame(.5, .55, 12);
    base();
    axes();
    const s = this.state, L = lim();
    const x1 = s.x1, x2 = s.x2, y1 = f2(x1), y2 = f2(x2);
    const k = (y2 - y1) / (x2 - x1);

    plotCurve(f2, Math.max(L.x0, -2.6), Math.min(L.x1, 2.6), '#6cb6ff', {w: 2.6, glow: 8});
    plotCurve(f2, x1, x2, 'rgba(108,182,255,.26)', {w: 9, n: 90});

    const sx0 = Math.max(L.x0 + .5, x1 - 1.5), sx1 = Math.min(L.x1 - .5, x2 + 1.5);
    line({x: sx0, y: y1 + k * (sx0 - x1)}, {x: sx1, y: y1 + k * (sx1 - x1)}, 'rgba(255,208,138,.72)', {w: 2, dash: [8, 5]});

    const A = {x: x1, y: y1}, B = {x: x2, y: y2}, C = {x: x2, y: y1};
    if (s.tri) {
      line(A, C, 'rgba(220,235,245,.32)', {w: 1.2, dash: [4, 4]});
      line(C, B, 'rgba(220,235,245,.32)', {w: 1.2, dash: [4, 4]});
      segLabel(A, C, 'Δx = ' + fmt(x2 - x1, 2), 'rgba(205,222,232,.85)', .5, 13, 10.5);
      segLabel(C, B, 'Δy = ' + fmt(y2 - y1, 2), 'rgba(205,222,232,.85)', .5, 15, 10.5);
    }

    dot(A, '#6cb6ff', 5);
    dot(B, '#ffc56b', 5);
    math('A', X(x1) - 15, Y(y1) - 15, '#a9d4ff', 15);
    math('B', X(x2) + 15, Y(y2) + 16, '#ffd99a', 15);
    handle(A, '#6cb6ff', hoverId === 'A');
    handle(B, '#ffc56b', hoverId === 'B');

    math('y = ¼x³ − ¾x', X(L.x0 + .35), Y(L.y1 - .35), 'rgba(160,205,240,.85)', 15, 'left');
    sans('k = ' + fmt(k, 2), X(L.x1 - .4), Y(L.y1 - .5), '#ffd08a', 17, 'right');
    sans('割线斜率 Δy/Δx', X(L.x1 - .4), Y(L.y1 - .95), 'rgba(225,205,175,.65)', 10, 'right');

    const mono = mono2(x1, x2);
    sans('区间上' + mono, X(0), Y(L.y0 + .5), mono === '不确定' ? '#ff8fab' : '#8ff5e4', 13);
  },
  hud() {
    const s = this.state;
    const y1 = f2(s.x1), y2 = f2(s.x2);
    const k = (y2 - y1) / (s.x2 - s.x1);
    return [
      {k: 'x₁', v: fmt(s.x1, 2)},
      {k: 'x₂', v: fmt(s.x2, 2)},
      {k: 'Δx', v: fmt(s.x2 - s.x1, 2)},
      {k: '割线斜率 k', v: fmt(k, 2), hi: true},
      {k: '区间单调性', v: mono2(s.x1, s.x2), hi: k > 0 && mono2(s.x1, s.x2) !== '不确定'}
    ];
  },
  panel(el) {
    const s = this.state;
    addToggle(el, '显示 Δx、Δy 斜率三角形', s.tri, v => s.tri = v);
    const r = row(el);
    addBtn(r, '缩小间隔', () => {
      const mid = (s.x1 + s.x2) / 2, half = Math.max(.15, (s.x2 - s.x1) / 4);
      s.x1 = clamp(mid - half, -2.3, 2.3);
      s.x2 = clamp(mid + half, -2.3, 2.3);
    }, 'ghost');
    addBtn(r, '交换 A、B', () => {
      const t = s.x1; s.x1 = s.x2; s.x2 = t;
    }, 'ghost');
  }
});

/* ============================================================
   03 奇偶性
   ============================================================ */
const f3 = (x, a, b, even) => even ? a * x * x + b : a * x * x * x + b * x;

MODULES.push({
  key: 'parity', tab: '03', name: '函数的奇偶性', en: 'PARITY', blurb: '轴对称与中心对称',
  accent: '#ff8fab', rgb: '255,143,171',
  hint: '拖动点 P，切换偶函数与奇函数，观察对称点 P′',
  state: {a: .45, b: .6, even: true, x: 1.1},
  reset() { this.state.a = .45; this.state.b = .6; this.state.even = true; this.state.x = 1.1; },
  meta() {
    return {
      title: '偶函数与奇函数',
      desc: '偶函数满足 f(−x) = f(x)，图象关于 y 轴对称；奇函数满足 f(−x) = −f(x)，图象关于原点对称。拖动曲线上的点 P，观察对称点 P′ 的坐标与位置如何随 P 同步变化。',
      formula: '偶：f(−x) = f(x)　　奇：f(−x) = −f(x)',
      note: '定义域必须关于原点对称，才可能具备奇偶性。奇函数若在 x = 0 处有定义，则 <span class="nw">f(0) = 0</span>；偶函数在 x 与 −x 处的函数值总相等。'
    };
  },
  handles() {
    const s = this.state;
    return [{id: 'P', x: s.x, y: f3(s.x, s.a, s.b, s.even)}];
  },
  drag(id, p) {
    const q = clampPt(p);
    this.state.x = clamp(q.x, -1.45, 1.45);
  },
  draw() {
    setFrame(.5, .52, 12);
    base();
    axes();
    const s = this.state, L = lim();
    const a = s.a, b = s.b, even = s.even;
    const fun = x => f3(x, a, b, even);
    const x = s.x, y = fun(x), ym = fun(-x);
    const P = {x: x, y: y}, Q = {x: -x, y: ym};

    plotCurve(fun, -2.0, 2.0, '#ff8fab', {w: 2.6, glow: 8});

    if (even) {
      line({x: 0, y: L.y0}, {x: 0, y: L.y1}, 'rgba(255,143,171,.45)', {w: 1.6, dash: [7, 6]});
      line(P, Q, 'rgba(255,205,220,.4)', {w: 1.3, dash: [5, 5]});
      line(P, {x: x, y: 0}, 'rgba(255,205,220,.28)', {w: 1.1, dash: [4, 5]});
      line(Q, {x: -x, y: 0}, 'rgba(255,205,220,.28)', {w: 1.1, dash: [4, 5]});
      sans('f(−x) = f(x)：关于 y 轴对称', X(0), Y(L.y1 - .45), '#ffb3c6', 13);
    } else {
      line({x: 0, y: L.y0}, {x: 0, y: L.y1}, 'rgba(255,143,171,.32)', {w: 1.3, dash: [7, 6]});
      line({x: L.x0, y: 0}, {x: L.x1, y: 0}, 'rgba(255,143,171,.26)', {w: 1.2, dash: [7, 6]});
      line(P, Q, 'rgba(255,205,220,.4)', {w: 1.3, dash: [5, 5]});
      dot({x: 0, y: 0}, '#ffd08a', 3.6);
      sans('f(−x) = −f(x)：关于原点对称', X(0), Y(L.y1 - .45), '#ffb3c6', 13);
    }

    dot(Q, 'rgba(255,180,200,.75)', 4.5);
    dot(P, '#ff8fab', 5);
    handle(P, '#ff8fab', hoverId === 'P');
    math('P', X(x) + 15, Y(y) + 16, '#ffc2d2', 15);
    if (Math.abs(x) > .18) math('P′', X(-x) - 17, Y(ym) + 16, 'rgba(255,190,208,.85)', 15);

    const eq = even
      ? 'f(x) = ' + fmt(a, 2) + 'x² ' + (b >= 0 ? '+ ' : '− ') + fmt(Math.abs(b), 2)
      : 'f(x) = ' + fmt(a, 2) + 'x³ ' + (b >= 0 ? '+ ' : '− ') + fmt(Math.abs(b), 2) + 'x';
    sans(eq, X(L.x0 + .35), Y(L.y0 + .5), 'rgba(255,195,212,.85)', 12.5, 'left');
    sans('x = ' + fmt(x, 2) + '　f(x) = ' + fmt(y, 2) + '　f(−x) = ' + fmt(ym, 2),
      X(L.x1 - .4), Y(L.y0 + .5), 'rgba(225,195,205,.75)', 10.5, 'right');
  },
  hud() {
    const s = this.state;
    const y = f3(s.x, s.a, s.b, s.even), ym = f3(-s.x, s.a, s.b, s.even);
    return [
      {k: '函数类型', v: s.even ? '偶函数' : '奇函数', hi: true},
      {k: 'x', v: fmt(s.x, 2)},
      {k: 'f(x)', v: fmt(y, 2)},
      {k: 'f(−x)', v: fmt(ym, 2)},
      {k: '对称关系', v: s.even ? 'f(−x) = f(x)' : 'f(−x) = −f(x)'}
    ];
  },
  panel(el) {
    const s = this.state;
    addToggle(el, '偶函数模式（否则为奇函数）', s.even, v => {
      s.even = v;
      buildPanel();
    });
    addSlider(el, s.even ? '二次项系数 a' : '三次项系数 a', -.6, .6, .05, s.a, v => v.toFixed(2), v => s.a = v);
    addSlider(el, s.even ? '常数项 b' : '一次项系数 b', -1, 1, .1, s.b, v => v.toFixed(1), v => s.b = v);
  }
});

/* ============================================================
   04 幂函数
   ============================================================ */
const POW = [
  {a: -2, label: '−2', dom: 'R\\{0}', mono: '(−∞,0) 增，(0,+∞) 减', par: '偶函数', x0: -4, x1: 4, px0: .45, px1: 3.2},
  {a: -1, label: '−1', dom: 'R\\{0}', mono: '逐支递减', par: '奇函数', x0: -4, x1: 4, px0: .45, px1: 3.2},
  {a: -.5, label: '−½', dom: '(0,+∞)', mono: '(0,+∞) 递减', par: '非奇非偶', x0: .02, x1: 4, px0: .3, px1: 3.4},
  {a: 1 / 3, label: '⅓', dom: 'R', mono: 'R 上递增', par: '奇函数', x0: -4, x1: 4, px0: -2.4, px1: 2.4},
  {a: .5, label: '½', dom: '[0,+∞)', mono: '[0,+∞) 递增', par: '非奇非偶', x0: 0, x1: 4, px0: 0, px1: 3.2},
  {a: 1, label: '1', dom: 'R', mono: 'R 上递增', par: '奇函数', x0: -4, x1: 4, px0: -3.2, px1: 3.2},
  {a: 2, label: '2', dom: 'R', mono: '先减后增', par: '偶函数', x0: -2.4, x1: 2.4, px0: -1.9, px1: 1.9},
  {a: 3, label: '3', dom: 'R', mono: 'R 上递增', par: '奇函数', x0: -2.4, x1: 2.4, px0: -1.55, px1: 1.55}
];

MODULES.push({
  key: 'power', tab: '04', name: '幂函数', en: 'POWER', blurb: 'y = x^α 的图象',
  accent: '#b49cff', rgb: '180,156,255',
  hint: '拖动 α 滑块与点 P，观察定义域、奇偶性与单调性',
  state: {ai: 4, px: 1.6, ref: false},
  reset() { this.state.ai = 4; this.state.px = 1.6; this.state.ref = false; },
  meta() {
    return {
      title: '指数 α 决定幂函数的形状',
      desc: '幂函数 y = x^α 的图象随指数变化：α &gt; 0 时过原点，在第一象限递增；α &lt; 0 时不过原点，图象以坐标轴为渐近线。拖动滑块切换 α，比较定义域、奇偶性与单调性的差别。',
      formula: 'y = x<sup>α</sup>（α 为常数）',
      note: 'α 为偶数时是偶函数，α 为奇数时是奇函数；α = ½ 时定义域为 [0,+∞)，既不是奇函数也不是偶函数。α &lt; 0 时两支各自单调，不能合并成“在定义域上递减”。'
    };
  },
  handles() {
    const sp = POW[clamp(Math.round(this.state.ai), 0, 7)];
    const px = clamp(this.state.px, sp.px0, sp.px1);
    return [{id: 'P', x: px, y: powReal(px, sp.a)}];
  },
  drag(id, p) {
    const sp = POW[clamp(Math.round(this.state.ai), 0, 7)];
    const q = clampPt(p);
    this.state.px = clamp(q.x, sp.px0, sp.px1);
  },
  draw() {
    setFrame(.5, .54, 12);
    base();
    axes();
    const s = this.state, L = lim();
    const sp = POW[clamp(Math.round(s.ai), 0, 7)];
    const a = sp.a;
    const px = clamp(s.px, sp.px0, sp.px1);
    s.px = px;
    const py = powReal(px, a);

    if (s.ref) {
      const e = Math.max(Math.abs(L.x0), Math.abs(L.x1));
      line({x: -e, y: -e}, {x: e, y: e}, 'rgba(150,175,200,.35)', {w: 1.4, dash: [6, 6]});
      math('y = x', X(Math.min(e, 3.4)) + 14, Y(Math.min(e, 3.4)) + 8, 'rgba(170,195,215,.6)', 13);
    }

    plotCurve(x => powReal(x, a), sp.x0, sp.x1, '#b49cff', {w: 2.7, glow: 9, n: 340});

    line({x: px, y: 0}, {x: px, y: py}, 'rgba(180,156,255,.3)', {w: 1.1, dash: [4, 5]});
    line({x: 0, y: py}, {x: px, y: py}, 'rgba(180,156,255,.3)', {w: 1.1, dash: [4, 5]});
    dot({x: px, y: py}, '#b49cff', 5);
    handle({x: px, y: py}, '#b49cff', hoverId === 'P');
    math('P', X(px) + 16, Y(py) + 16, '#cbb8ff', 15);
    sans('(' + fmt(px, 2) + ', ' + fmt(py, 2) + ')', X(px) + 18, Y(py) - 8, 'rgba(205,190,245,.75)', 10, 'left');

    sans('y = x^α，α = ' + sp.label, X(L.x0 + .4), Y(L.y1 - .4), 'rgba(200,185,250,.9)', 13, 'left');
    sans('定义域 ' + sp.dom + '　·　' + sp.par, X(L.x0 + .4), Y(L.y0 + .5), 'rgba(190,175,240,.8)', 11, 'left');
  },
  hud() {
    const sp = POW[clamp(Math.round(this.state.ai), 0, 7)];
    const px = clamp(this.state.px, sp.px0, sp.px1);
    return [
      {k: '指数 α', v: sp.label, hi: true},
      {k: '定义域', v: sp.dom},
      {k: '奇偶性', v: sp.par},
      {k: '单调性', v: sp.mono},
      {k: 'x^α（x = ' + fmt(px, 1) + '）', v: fmt(powReal(px, sp.a), 2), hi: true}
    ];
  },
  panel(el) {
    const s = this.state;
    addSlider(el, '指数 α（滑动切换）', 0, 7, 1, s.ai,
      v => POW[clamp(Math.round(v), 0, 7)].label,
      v => {
        s.ai = clamp(Math.round(v), 0, 7);
        const sp = POW[s.ai];
        if (s.px < sp.px0 || s.px > sp.px1) s.px = clamp(1.4, sp.px0, sp.px1);
      });
    addToggle(el, '显示 y = x 参照线', s.ref, v => s.ref = v);
  }
});

/* ============================================================
   05 二次函数的最值与图象平移
   ============================================================ */
MODULES.push({
  key: 'vertex', tab: '05', name: '最值与图象平移', en: 'VERTEX', blurb: '顶点式与最值',
  accent: '#ffc56b', rgb: '255,197,107',
  hint: '拖动顶点，或调节 a、h、k，观察最值的改变',
  state: {a: .6, h: 1, k: -1, down: false, showAxis: true},
  reset() { this.state.a = .6; this.state.h = 1; this.state.k = -1; this.state.down = false; this.state.showAxis = true; },
  meta() {
    return {
      title: '顶点式：y = a(x − h)² + k',
      desc: '把 y = ax² 的图象向右平移 h、向上平移 k，就得到 y = a(x − h)² + k，顶点为 (h, k)。拖动顶点或调节滑块，观察对称轴、开口方向与最值如何随之改变。',
      formula: 'y = a(x − h)² + k，顶点 (h, k)',
      note: 'a &gt; 0 时开口向上，函数在 x = h 处取最小值 k；a &lt; 0 时开口向下，取最大值 k。平移只改变顶点位置，不改变开口大小与图象形状。'
    };
  },
  handles() {
    const s = this.state;
    return [{id: 'V', x: s.h, y: s.k}];
  },
  drag(id, p) {
    const q = clampPt(p);
    const s = this.state;
    s.h = clamp(Math.round(q.x * 10) / 10, -3, 3);
    s.k = clamp(Math.round(q.y * 10) / 10, -2.5, 2.5);
    if (this.sl) { this.sl.h.set(s.h); this.sl.k.set(s.k); }
  },
  draw() {
    setFrame(.5, .54, 12);
    base();
    axes();
    const s = this.state, L = lim();
    const A = s.down ? -s.a : s.a;
    const h = s.h, k = s.k;
    const fun = x => A * (x - h) * (x - h) + k;

    plotCurve(fun, L.x0, L.x1, '#ffc56b', {w: 2.7, glow: 9, n: 320});

    if (s.showAxis) {
      line({x: h, y: L.y0}, {x: h, y: L.y1}, 'rgba(255,197,107,.35)', {w: 1.4, dash: [7, 6]});
      line({x: L.x0, y: k}, {x: L.x1, y: k}, 'rgba(255,197,107,.28)', {w: 1.2, dash: [7, 6]});
    }

    dot({x: h, y: k}, '#ffc56b', 6);
    handle({x: h, y: k}, '#ffc56b', hoverId === 'V');

    const up = A > 0;
    sans('顶点 (' + fmt(h, 1) + ', ' + fmt(k, 1) + ')', X(h) + 14, Y(k) - 18, '#ffe0b0', 12, 'left');
    sans(up ? '最小值 ' + fmt(k, 1) : '最大值 ' + fmt(k, 1), X(L.x1 - .5), Y(k) + (up ? 20 : -20), up ? '#8ff5e4' : '#ff8fab', 12, 'right');
    sans('对称轴 x = ' + fmt(h, 1), X(h) + 10, Y(L.y1 - .5), 'rgba(255,215,160,.75)', 11, 'left');
    math('y = ' + fmt(A, 1) + '(x − ' + fmt(h, 1) + ')² ' + (k >= 0 ? '+ ' : '− ') + fmt(Math.abs(k), 1),
      X(L.x0 + .4), Y(L.y1 - .4), 'rgba(255,220,170,.9)', 14, 'left');
  },
  hud() {
    const s = this.state;
    const A = s.down ? -s.a : s.a;
    return [
      {k: 'a', v: fmt(A, 1), hi: true},
      {k: '顶点', v: '(' + fmt(s.h, 1) + ', ' + fmt(s.k, 1) + ')', hi: true},
      {k: '对称轴', v: 'x = ' + fmt(s.h, 1)},
      {k: '最值', v: (A > 0 ? '最小 ' : '最大 ') + fmt(s.k, 1)},
      {k: '开口', v: A > 0 ? '向上' : '向下'}
    ];
  },
  panel(el) {
    const s = this.state;
    this.sl = {
      a: addSlider(el, '开口大小 |a|', .2, 1.4, .1, s.a, v => v.toFixed(1), v => s.a = v),
      h: addSlider(el, '对称轴 h', -3, 3, .1, s.h, v => v.toFixed(1), v => s.h = v),
      k: addSlider(el, '顶点纵坐标 k', -2.5, 2.5, .1, s.k, v => v.toFixed(1), v => s.k = v)
    };
    addToggle(el, '开口向下（a < 0）', s.down, v => s.down = v);
    addToggle(el, '显示对称轴与最值线', s.showAxis, v => s.showAxis = v);
  }
});

})();
