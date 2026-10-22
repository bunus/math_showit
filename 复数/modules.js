/* ============================================================
   必修第二册 · 第 7 章 复数
   复平面 · 加减 · 乘法旋转 · 共轭与模 · 圆的方程
   ============================================================ */
(function () {

/* ---------- 局部绘图小工具 ---------- */
function ring(c, rad, color, opt) {
  opt = opt || {};
  ctx.save();
  ctx.beginPath();
  ctx.arc(X(c.x), Y(c.y), Math.max(1, rad * V.k), 0, TAU);
  ctx.globalAlpha = opt.alpha == null ? 1 : opt.alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = opt.w || 1.4;
  if (opt.dash) ctx.setLineDash(opt.dash);
  ctx.stroke();
  ctx.restore();
}
function arcW(c, th0, th1, rad, color, w, dash) {
  if (Math.abs(th1 - th0) < 1e-3) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = w || 1.6;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.arc(X(c.x), Y(c.y), Math.max(2, rad * V.k), -th0, -th1, th1 > th0);
  ctx.stroke();
  ctx.restore();
}
function fC(a, b, d) {
  d = d == null ? 2 : d;
  const A = Math.abs(a) < 5e-3 ? 0 : a;
  const B = Math.abs(b) < 5e-3 ? 0 : b;
  if (B === 0) return fmt(A, d);
  if (A === 0) return fmt(B, d) + 'i';
  return fmt(A, d) + (B > 0 ? ' + ' : ' − ') + fmt(Math.abs(B), d) + 'i';
}
const mod = z => Math.hypot(z.x, z.y);
const arg = z => Math.atan2(z.y, z.x);

/* ============================================================
   01 复平面与复数的表示
   ============================================================ */
MODULES.push({
  key: 'plane', tab: '01', name: '复平面表示', en: 'COMPLEX PLANE', blurb: '点与向量',
  accent: '#5eead4', rgb: '94,234,212',
  hint: '拖动点 z，观察实部、虚部、模与辐角',
  state: {z: {x: 2.5, y: 1.5}, proj: true, arc: true},
  reset() { this.state.z = {x: 2.5, y: 1.5}; this.state.proj = true; this.state.arc = true; },
  meta() {
    return {
      title: '复平面：复数与点一一对应',
      desc: '复数 z = a + bi 与复平面上的点 Z(a, b) 一一对应：a 是横坐标（实部），b 是纵坐标（虚部）。拖动点 z，虚线是它在两条坐标轴上的投影，线段 Oz 的长度就是模 |z|，它与实轴正方向的夹角就是辐角 θ。',
      formula: 'z = a + bi ⇔ 点 Z(a, b)<br>|z| = √(a² + b²)　θ = arg z',
      note: '当 b = 0 时 z 是实数，点落在实轴上；当 a = 0 且 b ≠ 0 时 z 是纯虚数，点落在虚轴上。辐角 θ ∈ (−π, π]，这里用角度显示。'
    };
  },
  handles() { return [{id: 'z', x: this.state.z.x, y: this.state.z.y}]; },
  drag(id, p) {
    const q = clampPt(p);
    this.state.z = {x: Math.round(q.x * 2) / 2, y: Math.round(q.y * 2) / 2};
  },
  draw() {
    setFrame(.5, .54, 12.5);
    base();
    const s = this.state, z = s.z, r = mod(z), th = arg(z), L = lim();

    sans('Re', X(L.x1) - 4, Y(0) - 15, 'rgba(150,180,195,.6)', 10, 'right');
    sans('Im', X(0) + 12, Y(L.y1) + 12, 'rgba(150,180,195,.6)', 10, 'left');
    sans('O', X(0) - 12, Y(0) + 13, 'rgba(150,180,195,.7)', 10);

    if (s.proj) {
      line(z, {x: z.x, y: 0}, 'rgba(94,234,212,.32)', {w: 1.2, dash: [4, 4]});
      line(z, {x: 0, y: z.y}, 'rgba(94,234,212,.32)', {w: 1.2, dash: [4, 4]});
      dot({x: z.x, y: 0}, '#6cb6ff', 3.5);
      dot({x: 0, y: z.y}, '#ff8fab', 3.5);
      math('a', X(z.x), Y(0) + 16, '#a9d4ff', 14);
      math('bi', X(0) - 20, Y(z.y), '#ffb3c6', 14);
    }

    if (r > .12) ring({x: 0, y: 0}, r, 'rgba(94,234,212,.22)', {w: 1.1, dash: [3, 6]});
    arrow({x: 0, y: 0}, z, '#5eead4', {w: 2.6, glow: 12, head: 11});

    if (s.arc && r > .4) {
      angleArc({x: 0, y: 0}, 0, th, 44, 'rgba(255,197,107,.95)', null, 12);
      const mx = X(0) + Math.cos(th / 2) * 68, my = Y(0) - Math.sin(th / 2) * 68;
      sans('θ', mx, my, '#ffd99a', 13);
    }

    segMath({x: 0, y: 0}, z, '|z|', '#8ff5e4', .56, -18, 14);
    math('z', X(z.x) + 17, Y(z.y) - 14, '#8ff5e4', 17);
    handle(z, '#5eead4', hoverId === 'z');
  },
  hud() {
    const z = this.state.z, r = mod(z);
    return [
      {k: 'z', v: fC(z.x, z.y), hi: true},
      {k: 'Re z', v: fmt(z.x, 2)},
      {k: 'Im z', v: fmt(z.y, 2)},
      {k: '|z|', v: fmt(r, 2)},
      {k: 'arg z', v: r < .05 ? '—' : fmt(deg(arg(z)), 1) + '°'}
    ];
  },
  panel(el) {
    const s = this.state;
    addToggle(el, '显示投影虚线', s.proj, v => s.proj = v);
    addToggle(el, '显示模与辐角', s.arc, v => s.arc = v);
    addBtn(el, '随机取一个复数', () => {
      s.z = {x: Math.round((Math.random() * 9 - 4.5) * 2) / 2, y: Math.round((Math.random() * 7 - 3.5) * 2) / 2};
    }, 'ghost');
  }
});

/* ============================================================
   02 复数的加减法
   ============================================================ */
MODULES.push({
  key: 'addsub', tab: '02', name: '复数的加减', en: 'ADD & SUBTRACT', blurb: '平行四边形法则',
  accent: '#6cb6ff', rgb: '108,182,255',
  hint: '拖动 z₁、z₂，观察和向量与差向量',
  state: {z1: {x: -2.4, y: 1.2}, z2: {x: 1.6, y: -.8}, para: true, diff: true},
  reset() { this.state.z1 = {x: -2.4, y: 1.2}; this.state.z2 = {x: 1.6, y: -.8}; this.state.para = true; this.state.diff = true; },
  meta() {
    return {
      title: '加法：向量的平行四边形法则',
      desc: '两个复数相加就是实部加实部、虚部加虚部，在复平面上对应向量加法：以 Oz₁、Oz₂ 为邻边作平行四边形，对角线 O(z₁+z₂) 就是和。把 z₂ 平移到 z₁ 的终点，又得到三角形法则。拖动两点，观察和与差的变化。',
      formula: '(a₁+b₁i) + (a₂+b₂i) = (a₁+a₂) + (b₁+b₂)i<br>z₁ − z₂ 对应向量 Z₂Z₁',
      note: '减法 z₁ − z₂ 是以 z₂ 为起点、z₁ 为终点的向量，所以 <span class="nw">|z₁ − z₂|</span> 正好是两点 Z₁、Z₂ 之间的距离。'
    };
  },
  handles() {
    return [{id: 'z1', x: this.state.z1.x, y: this.state.z1.y},
            {id: 'z2', x: this.state.z2.x, y: this.state.z2.y}];
  },
  drag(id, p) {
    const q = clampPt(p);
    this.state[id] = {x: Math.round(q.x * 2) / 2, y: Math.round(q.y * 2) / 2};
  },
  draw() {
    setFrame(.5, .54, 12.5);
    base();
    const s = this.state, z1 = s.z1, z2 = s.z2;
    const S = {x: z1.x + z2.x, y: z1.y + z2.y};
    const D = {x: z1.x - z2.x, y: z1.y - z2.y};
    const L = lim();
    sans('O', X(0) - 12, Y(0) + 13, 'rgba(150,180,195,.7)', 10);

    if (s.para) {
      line(z1, S, 'rgba(255,197,107,.5)', {w: 1.4, dash: [5, 5]});
      line(z2, S, 'rgba(255,197,107,.5)', {w: 1.4, dash: [5, 5]});
    }

    arrow({x: 0, y: 0}, z1, '#6cb6ff', {w: 2.6, glow: 12, head: 11});
    arrow({x: 0, y: 0}, z2, '#b49cff', {w: 2.6, glow: 12, head: 11});
    arrow({x: 0, y: 0}, S, '#ffc56b', {w: 2.8, glow: 14, head: 12});
    if (s.diff) arrow(z2, z1, '#5eead4', {w: 2.2, dash: [7, 5], head: 10});

    vlabel({x: 0, y: 0}, z1, 'z₁', '#a9d4ff', 18, 16);
    vlabel({x: 0, y: 0}, z2, 'z₂', '#d2c4ff', 18, 16);
    vlabel({x: 0, y: 0}, S, 'z₁ + z₂', '#ffd99a', 20, 15);
    if (s.diff) vlabel(z2, z1, 'z₁ − z₂', '#8ff5e4', 16, 13);

    dot({x: 0, y: 0}, 'rgba(200,225,235,.7)', 3);
    handle(z1, '#6cb6ff', hoverId === 'z1');
    handle(z2, '#b49cff', hoverId === 'z2');

    if (s.diff) sans('|z₁ − z₂| = ' + fmt(mod(D), 2), X(L.x0 + .4), Y(L.y1) + 6, 'rgba(150,235,220,.85)', 11, 'left');
  },
  hud() {
    const z1 = this.state.z1, z2 = this.state.z2;
    const S = {x: z1.x + z2.x, y: z1.y + z2.y};
    const D = {x: z1.x - z2.x, y: z1.y - z2.y};
    return [
      {k: 'z₁', v: fC(z1.x, z1.y)},
      {k: 'z₂', v: fC(z2.x, z2.y)},
      {k: 'z₁ + z₂', v: fC(S.x, S.y), hi: true},
      {k: 'z₁ − z₂', v: fC(D.x, D.y)},
      {k: '|z₁ − z₂|', v: fmt(mod(D), 2)}
    ];
  },
  panel(el) {
    const s = this.state;
    addToggle(el, '显示平行四边形', s.para, v => s.para = v);
    addToggle(el, '显示差向量 z₁ − z₂', s.diff, v => s.diff = v);
    addBtn(el, '交换 z₁ 与 z₂', () => {
      const t = s.z1; s.z1 = s.z2; s.z2 = t;
    }, 'ghost');
  }
});

/* ============================================================
   03 复数的乘法与旋转
   ============================================================ */
MODULES.push({
  key: 'mul', tab: '03', name: '乘法与旋转', en: 'MULTIPLICATION', blurb: '模相乘 · 角相加',
  accent: '#ffc56b', rgb: '255,197,107',
  hint: '调节 r₂、θ₂，点击播放观察旋转与伸缩',
  state: {z1: {x: 2.1, y: 1.2}, r2: 1.3, th2: 65 * Math.PI / 180, t: 1, anim: false, aux: true},
  reset() {
    this.state.z1 = {x: 2.1, y: 1.2};
    this.state.r2 = 1.3;
    this.state.th2 = 65 * Math.PI / 180;
    this.state.t = 1;
    this.state.anim = false;
    this.state.aux = true;
  },
  togglePlay() { this.state.t = 0; this.state.anim = true; },
  meta() {
    return {
      title: '乘法：模相乘，辐角相加',
      desc: '设 z₁ = r₁(cos θ₁ + i sin θ₁)，z₂ = r₂(cos θ₂ + i sin θ₂)，则 |z₁z₂| = r₁r₂，arg(z₁z₂) = θ₁ + θ₂。乘以 z₂ 即旋转 θ₂ 再伸缩 r₂ 倍。',
      formula: 'z₁z₂ = r₁r₂[cos(θ₁+θ₂) + i sin(θ₁+θ₂)]',
      note: '乘以 i 就是逆时针旋转 90°，乘以 −1 就是旋转 180°。模相乘、辐角相加，正是复数被称为“平面上的旋转与伸缩”的原因。'
    };
  },
  handles() { return [{id: 'z1', x: this.state.z1.x, y: this.state.z1.y}]; },
  drag(id, p) {
    const q = clampPt(p);
    let r = Math.hypot(q.x, q.y);
    if (r < 1e-4) { q.x = .6; q.y = 0; r = .6; }
    if (r < .6) { q.x *= .6 / r; q.y *= .6 / r; }
    if (r > 2.4) { q.x *= 2.4 / r; q.y *= 2.4 / r; }
    this.state.z1 = q;
  },
  draw(dt) {
    setFrame(.5, .54, 13);
    base();
    const s = this.state;
    if (s.anim) {
      s.t = Math.min(1, s.t + dt / 1.8);
      if (s.t >= 1) s.anim = false;
    }
    const z1 = s.z1, r1 = mod(z1), th1 = arg(z1);
    const r2 = s.r2, th2 = s.th2;
    const R = r1 * r2;
    const P = {x: R * Math.cos(th1 + th2), y: R * Math.sin(th1 + th2)};
    const z2 = {x: r2 * Math.cos(th2), y: r2 * Math.sin(th2)};
    const t = easeInOut(s.t);
    const rr = lerp(r1, R, t), aa = th1 + th2 * t;
    const mz = {x: rr * Math.cos(aa), y: rr * Math.sin(aa)};

    if (s.aux) {
      ring({x: 0, y: 0}, r1, 'rgba(108,182,255,.22)', {w: 1.1, dash: [4, 6]});
      arcW({x: 0, y: 0}, th1, th1 + th2, r1, 'rgba(255,197,107,.28)', 1.4, [4, 5]);
      line({x: 0, y: 0}, {x: R * Math.cos(th1), y: R * Math.sin(th1)}, 'rgba(255,255,255,.12)', {w: 1, dash: [3, 6]});
      arcW({x: 0, y: 0}, th1, aa, r1, 'rgba(255,197,107,.95)', 2.4);
      const mid = th1 + th2 * .5;
      sans('旋转 ' + fmt(deg(th2), 0) + '°', X(0) + Math.cos(mid) * (r1 * V.k + 30),
        Y(0) - Math.sin(mid) * (r1 * V.k + 30), '#ffd99a', 10.5);
    }

    arrow({x: 0, y: 0}, z1, '#6cb6ff', {w: 2.6, glow: 12, head: 11});
    arrow({x: 0, y: 0}, z2, '#b49cff', {w: 2.2, glow: 10, head: 10});
    arrow({x: 0, y: 0}, P, '#ffc56b', {w: 2.8, glow: 14, head: 12});
    if (s.t < .999) {
      arrow({x: 0, y: 0}, mz, 'rgba(255,217,154,.7)', {w: 1.6, dash: [5, 5], head: 8});
      dot(mz, '#ffd99a', 4.5);
      line(mz, P, 'rgba(255,255,255,.16)', {w: 1, dash: [3, 5]});
    }

    vlabel({x: 0, y: 0}, z1, 'z₁', '#a9d4ff', 16, 15);
    vlabel({x: 0, y: 0}, z2, 'z₂', '#d2c4ff', 14, 14);
    vlabel({x: 0, y: 0}, P, 'z₁z₂', '#ffd99a', 18, 16);

    math('|z₁| = ' + fmt(r1, 2), X(0) + 8, Y(0) - r1 * V.k - 26, 'rgba(169,212,255,.9)', 10.5, 'left');
    handle(z1, '#6cb6ff', hoverId === 'z1');
  },
  hud() {
    const s = this.state, r1 = mod(s.z1), th1 = arg(s.z1), th2 = s.th2;
    const R = r1 * s.r2;
    const P = {x: R * Math.cos(th1 + th2), y: R * Math.sin(th1 + th2)};
    return [
      {k: '|z₁|', v: fmt(r1, 2)},
      {k: '|z₂|', v: fmt(s.r2, 2)},
      {k: '|z₁z₂|', v: fmt(R, 2), hi: true},
      {k: 'arg(z₁z₂)', v: fmt(deg(th1 + th2), 1) + '°'},
      {k: 'z₁z₂', v: fC(P.x, P.y)}
    ];
  },
  panel(el) {
    const s = this.state;
    addSlider(el, '|z₂| = r₂', .4, 1.7, .05, s.r2, v => v.toFixed(2), v => s.r2 = v);
    addSlider(el, 'arg z₂ = θ₂', 0, 360, 5, s.th2 * 180 / Math.PI, v => v.toFixed(0) + '°', v => s.th2 = v * Math.PI / 180);
    addToggle(el, '显示旋转辅助弧', s.aux, v => s.aux = v);
    addBtn(el, '播放：旋转 + 伸缩', () => { s.t = 0; s.anim = true; }, 'ghost');
  }
});

/* ============================================================
   04 共轭复数与模
   ============================================================ */
MODULES.push({
  key: 'conj', tab: '04', name: '共轭与模', en: 'CONJUGATE', blurb: '关于实轴对称',
  accent: '#b49cff', rgb: '180,156,255',
  hint: '拖动点 z，观察 z 与共轭复数 z̄ 的对称关系',
  state: {z: {x: 2.2, y: 1.6}, conn: true, sumd: false, modc: true},
  reset() { this.state.z = {x: 2.2, y: 1.6}; this.state.conn = true; this.state.sumd = false; this.state.modc = true; },
  meta() {
    return {
      title: '共轭复数：实轴对称的两点',
      desc: '实部相同、虚部相反的两个复数互为共轭复数，记作 z̄。在复平面上，z 与 z̄ 关于实轴对称，因此 |z| = |z̄|。而 z·z̄ = a² + b² = |z|² 一定是一个实数。拖动点 z，观察对称点、模与乘积的变化。',
      formula: 'z = a + bi，z̄ = a − bi<br>z·z̄ = a² + b² = |z|²',
      note: '当 b = 0 时 z = z̄，这个复数本身就是实数。求模、化简分式时常用 <span class="nw">|z|² = z·z̄</span> 把复数化为实数。'
    };
  },
  handles() { return [{id: 'z', x: this.state.z.x, y: this.state.z.y}]; },
  drag(id, p) {
    const q = clampPt(p);
    this.state.z = {
      x: clamp(Math.round(q.x * 2) / 2, -3.6, 3.6),
      y: clamp(Math.round(q.y * 2) / 2, -3.0, 3.0)
    };
  },
  draw() {
    setFrame(.5, .54, 12.5);
    base();
    const s = this.state, z = s.z, zc = {x: z.x, y: -z.y};
    const r = mod(z), a = z.x, b = z.y, L = lim();
    sans('Re', X(L.x1) - 4, Y(0) - 15, 'rgba(150,180,195,.6)', 10, 'right');
    sans('Im', X(0) + 12, Y(L.y1) + 12, 'rgba(150,180,195,.6)', 10, 'left');

    if (s.modc && r > .15) ring({x: 0, y: 0}, r, 'rgba(180,156,255,.22)', {w: 1.1, dash: [4, 6]});
    if (s.conn) {
      line(z, zc, 'rgba(255,255,255,.24)', {w: 1.2, dash: [4, 5]});
      dot({x: a, y: 0}, '#ffc56b', 3.6);
      math('a', X(a), Y(0) + 16, '#ffd99a', 14);
    }
    if (s.sumd) {
      arrow({x: 0, y: 0}, {x: 2 * a, y: 0}, 'rgba(255,197,107,.8)', {w: 2, head: 9});
      arrow({x: 0, y: 0}, {x: 0, y: 2 * b}, 'rgba(94,234,212,.8)', {w: 2, head: 9});
      math('z + z̄ = 2a', X(2 * a), Y(0) - 20, '#ffd99a', 13);
      math('z − z̄ = 2bi', X(0) + 16, Y(2 * b), '#8ff5e4', 13, 'left');
      dot({x: 2 * a, y: 0}, '#ffc56b', 4);
      dot({x: 0, y: 2 * b}, '#5eead4', 4);
    }

    arrow({x: 0, y: 0}, z, '#b49cff', {w: 2.6, glow: 12, head: 11});
    arrow({x: 0, y: 0}, zc, '#ff8fab', {w: 2.6, glow: 12, head: 11});
    math('z', X(z.x) + 17, Y(z.y) - 14, '#c9b9ff', 17);
    math('z̄', X(zc.x) - 17, Y(zc.y) + 14, '#ffb3c6', 17);
    handle(z, '#b49cff', hoverId === 'z');

    sans('|z| = |z̄| = ' + fmt(r, 2) + '　z·z̄ = ' + fmt(a * a + b * b, 2),
      X(L.x0 + .4), Y(L.y1) + 6, 'rgba(200,190,245,.85)', 10.5, 'left');
  },
  hud() {
    const z = this.state.z, r = mod(z), a = z.x, b = z.y;
    return [
      {k: 'z', v: fC(a, b), hi: true},
      {k: 'z̄', v: fC(a, -b)},
      {k: '|z| = |z̄|', v: fmt(r, 2)},
      {k: 'z·z̄', v: fmt(a * a + b * b, 2)},
      {k: '类型', v: Math.abs(b) < 5e-3 ? '实数' : (Math.abs(a) < 5e-3 ? '纯虚数' : '一般复数')}
    ];
  },
  panel(el) {
    const s = this.state;
    addToggle(el, '显示 z 与 z̄ 的连线', s.conn, v => s.conn = v);
    addToggle(el, '显示 z + z̄ 与 z − z̄', s.sumd, v => s.sumd = v);
    addToggle(el, '显示 |z| 的圆', s.modc, v => s.modc = v);
    addBtn(el, '让 z 落到实轴上', () => { s.z = {x: s.z.x, y: 0}; }, 'ghost');
  }
});

/* ============================================================
   05 复数的几何应用：|z − z₀| = r
   ============================================================ */
MODULES.push({
  key: 'circle', tab: '05', name: '圆与轨迹', en: 'LOCUS', blurb: '|z − z₀| = r',
  accent: '#ff8fab', rgb: '255,143,171',
  hint: '拖动圆心与圆上的点 z，调节半径 r',
  state: {c: {x: 1.2, y: .4}, r: 2.0, phi: .85, ext: true, spin: false},
  reset() { this.state.c = {x: 1.2, y: .4}; this.state.r = 2.0; this.state.phi = .85; this.state.ext = true; this.state.spin = false; },
  meta() {
    return {
      title: '轨迹：|z − z₀| = r 是一个圆',
      desc: '方程 |z − z₀| = r 表示以 z₀ 为圆心、r 为半径的圆：圆上每一点到 z₀ 的距离都等于 r。拖动圆心或圆上的点、调节半径，可以看到 |z| 的最大值与最小值如何随位置变化。',
      formula: '|z − z₀| = r　⇔　(x−x₀)² + (y−y₀)² = r²',
      note: '圆上的点可写成 <span class="nw">z = z₀ + r(cos θ + i sin θ)</span>。圆心在原点时 |z| 恒等于 r；圆心不在原点时，|z| 在 |z₀| + r 与 ||z₀| − r| 之间取值。'
    };
  },
  handles() {
    const s = this.state;
    return [
      {id: 'c', x: s.c.x, y: s.c.y},
      {id: 'z', x: s.c.x + s.r * Math.cos(s.phi), y: s.c.y + s.r * Math.sin(s.phi)}
    ];
  },
  drag(id, p) {
    const s = this.state, q = clampPt(p);
    if (id === 'z') {
      s.phi = Math.atan2(q.y - s.c.y, q.x - s.c.x);
    } else {
      const L = lim(), m = Math.min(s.r * .5, 1.1);
      s.c = {x: clamp(q.x, L.x0 + m, L.x1 - m), y: clamp(q.y, L.y0 + m, L.y1 - m)};
    }
  },
  draw(dt) {
    setFrame(.5, .54, 13);
    base();
    const s = this.state, c = s.c, r = s.r;
    if (s.spin) s.phi += dt * .8;
    const z = {x: c.x + r * Math.cos(s.phi), y: c.y + r * Math.sin(s.phi)};
    const cc = mod(c);

    ring(c, r, 'rgba(255,143,171,.95)', {w: 2.4});
    ring({x: 0, y: 0}, .02, 'rgba(200,225,235,.9)', {w: 1});

    if (s.ext && cc > .05) {
      const u = {x: c.x / cc, y: c.y / cc};
      const far = {x: c.x + u.x * r, y: c.y + u.y * r};
      const near = {x: c.x - u.x * r, y: c.y - u.y * r};
      line({x: 0, y: 0}, far, 'rgba(94,234,212,.32)', {w: 1, dash: [3, 5]});
      line({x: 0, y: 0}, near, 'rgba(108,182,255,.32)', {w: 1, dash: [3, 5]});
      dot(far, '#5eead4', 4);
      dot(near, '#6cb6ff', 4);
      sans('|z|最大 ' + fmt(cc + r, 2), X(far.x), Y(far.y) - 17, '#8ff5e4', 10.5);
      sans('|z|最小 ' + fmt(Math.abs(cc - r), 2), X(near.x), Y(near.y) + 18, '#a9d4ff', 10.5);
    }

    arrow({x: 0, y: 0}, c, 'rgba(180,156,255,.85)', {w: 2, head: 10});
    math('z₀', X(c.x) - 18, Y(c.y) + 14, '#c9b9ff', 16);
    line(c, z, 'rgba(255,197,107,.95)', {w: 1.8, dash: [5, 4]});
    segMath(c, z, 'r', '#ffc56b', .52, -15, 14);

    arrow({x: 0, y: 0}, z, 'rgba(255,143,171,.7)', {w: 1.4, head: 8});
    math('z', X(z.x) + 17, Y(z.y) - 14, '#ffb3c6', 16);
    sans('|z − z₀| = r', X(c.x), Y(c.y + r) - 16, 'rgba(255,179,198,.9)', 11);

    handle(c, '#b49cff', hoverId === 'c');
    handle(z, '#ffc56b', hoverId === 'z');
  },
  hud() {
    const s = this.state, c = s.c, r = s.r;
    const z = {x: c.x + r * Math.cos(s.phi), y: c.y + r * Math.sin(s.phi)};
    const cc = mod(c);
    return [
      {k: 'z₀', v: fC(c.x, c.y)},
      {k: 'r', v: fmt(r, 2)},
      {k: 'z', v: fC(z.x, z.y)},
      {k: '|z − z₀|', v: fmt(Math.hypot(z.x - c.x, z.y - c.y), 2), hi: true},
      {k: '|z| 范围', v: fmt(Math.abs(cc - r), 2) + ' ~ ' + fmt(cc + r, 2)}
    ];
  },
  panel(el) {
    const s = this.state;
    addSlider(el, '半径 r', .5, 3.2, .05, s.r, v => v.toFixed(2), v => s.r = v);
    addToggle(el, '显示 |z| 的最值点', s.ext, v => s.ext = v);
    addToggle(el, '让 z 在圆上匀速转动', s.spin, v => s.spin = v);
  }
});

})();
