/* ============================================================
   必修第一册 · 第 5 章 三角函数
   ============================================================ */
(function () {

const PI2 = Math.PI * 2;

/* ---------- 公用工具 ---------- */
function ring(c, r, color, fill, w) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(X(c.x), Y(c.y), r * V.k, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  ctx.strokeStyle = color;
  ctx.lineWidth = w || 1.6;
  ctx.stroke();
  ctx.restore();
}

function sweep(c, r, from, to, color, w) {
  const d = to - from;
  if (Math.abs(d) < 1e-3) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = w || 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(X(c.x), Y(c.y), r * V.k, -from, -to, d > 0);
  ctx.stroke();
  ctx.restore();
}

function curveOf(f, color, w, dash, alpha) {
  const stepPx = V.k > 70 ? 2 : 3;
  ctx.save();
  ctx.globalAlpha = alpha == null ? 1 : alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = w || 2;
  ctx.lineJoin = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  let on = false;
  for (let sx = 0; sx <= W; sx += stepPx) {
    const x = (sx - V.ox) / V.k;
    const y = f(x);
    if (!isFinite(y) || Math.abs(y) > 60) { on = false; continue; }
    if (on) ctx.lineTo(sx, Y(y));
    else { ctx.moveTo(sx, Y(y)); on = true; }
  }
  ctx.stroke();
  ctx.restore();
}

function axes(L) {
  arrow({x: L.x0 + .1, y: 0}, {x: L.x1 - .1, y: 0}, 'rgba(185,210,225,.45)', {w: 1.2, head: 7});
  arrow({x: 0, y: L.y0 + .1}, {x: 0, y: L.y1 - .1}, 'rgba(185,210,225,.45)', {w: 1.2, head: 7});
  math('x', X(L.x1 - .1) - 6, Y(0) + 16, 'rgba(170,195,210,.7)', 13);
  math('y', X(0) - 14, Y(L.y1 - .1) + 10, 'rgba(170,195,210,.7)', 13);
}

function piAxis(L) {
  for (let k = -2; k <= 2; k++) {
    if (!k) continue;
    const x = k * Math.PI;
    if (x < L.x0 + .35 || x > L.x1 - .35) continue;
    line({x: x, y: -.11}, {x: x, y: .11}, 'rgba(200,225,235,.35)', {w: 1});
    sans((k < 0 ? '−' : '') + (Math.abs(k) === 1 ? 'π' : Math.abs(k) + 'π'),
      X(x), Y(-.42), 'rgba(150,175,190,.7)', 10);
  }
}

function n2(v, d) {
  return fmt(v, d == null ? 2 : d).replace('-', '−');
}
function signStr(v, d) {
  if (Math.abs(v) < 5e-3) return '0';
  return (v < 0 ? '−' : '') + fmt(Math.abs(v), d == null ? 2 : d);
}
function phiStr(p) {
  if (Math.abs(p) < 1e-9) return '';
  return (p > 0 ? ' + ' : ' − ') + fmt(Math.abs(p) / Math.PI, 2) + 'π';
}
function quadOf(d) {
  const a = ((d % 360) + 360) % 360;
  if (Math.abs(a % 90) < 1e-6) return '坐标轴上';
  if (a < 90) return '第一象限';
  if (a < 180) return '第二象限';
  if (a < 270) return '第三象限';
  return '第四象限';
}

/* ---------- 01 任意角与弧度 ---------- */
MODULES.push({
  key: 'angle', tab: '01', name: '任意角与弧度', en: 'ANGLES', blurb: '旋转与弧度制',
  accent: '#5eead4', rgb: '94,234,212',
  hint: '拖动圆上的动点 P，或调节角度滑块',
  state: {th: 2.36, cot: true},
  reset() { this.state.th = 2.36; this.state.cot = true; },
  meta() {
    return {
      title: '角是射线旋转出来的',
      desc: '把一条射线绕端点旋转就得到角：逆时针为正、顺时针为负，转满一圈还能接着转。拖动单位圆上的动点 P，或拉动角度滑块，观察同一个角在度与弧度下的数值，以及所有与它终边相同的角。',
      formula: 'θ = α + k·360°（k∈Z，0° ≤ α < 360°）',
      note: '半径等于 1 的圆叫单位圆。1 弧度的角所对的弧长恰等于半径，所以 <span class="nw">180° = π rad</span>，<span class="nw">1 rad ≈ 57.3°</span>。'
    };
  },
  handles() {
    return [{id: 'P', x: Math.cos(this.state.th), y: Math.sin(this.state.th)}];
  },
  drag(id, p) {
    const q = clampPt(p);
    const a = Math.atan2(q.y, q.x);
    const delta = ((a - this.state.th + Math.PI) % PI2 + PI2) % PI2 - Math.PI;
    this.state.th = clamp(this.state.th + delta, -4 * Math.PI, 4 * Math.PI);
    if (this._sl) this._sl.set(this.state.th * 180 / Math.PI);
  },
  draw() {
    setFrame(.5, .5, 8);
    base();
    const s = this.state, L = lim();
    const th = s.th, c = Math.cos(th), sn = Math.sin(th);

    axes(L);
    ring({x: 0, y: 0}, 1, 'rgba(94,234,212,.42)', 'rgba(94,234,212,.035)', 1.6);

    const turns = Math.trunc(th / PI2);
    const rem = th - turns * PI2;
    const laps = Math.min(3, Math.abs(turns));
    for (let i = 0; i < laps; i++)
      ring({x: 0, y: 0}, .44 + i * .07, 'rgba(94,234,212,.3)', null, 1.4);
    const rArc = .44 + laps * .07;
    sweep({x: 0, y: 0}, rArc, 0, rem, '#5eead4', 2.6);
    if (Math.abs(rem) > .08) {
      const mid = rem / 2;
      math('θ', X(Math.cos(mid) * (rArc + .17)), Y(Math.sin(mid) * (rArc + .17)), '#8ff5e4', 16);
    }
    if (turns !== 0) {
      sans('已转 ' + Math.abs(turns) + ' 整圈', X(0), Y(-1.45), 'rgba(150,215,210,.7)', 11);
    }

    arrow({x: 0, y: 0}, {x: c * 2.3, y: sn * 2.3}, 'rgba(255,197,107,.7)', {w: 2, head: 9, glow: 8});
    line({x: c, y: 0}, {x: c, y: sn}, 'rgba(255,255,255,.16)', {w: 1, dash: [4, 5]});
    line({x: 0, y: sn}, {x: c, y: sn}, 'rgba(255,255,255,.16)', {w: 1, dash: [4, 5]});
    dot({x: c, y: sn}, '#5eead4', 5);
    math('P', X(c) + (c >= 0 ? 16 : -16), Y(sn) + (sn >= 0 ? -14 : 16), '#8ff5e4', 15);
    handle({x: c, y: sn}, '#5eead4', hoverId === 'P');

    const d = th * 180 / Math.PI;
    const yA = Math.min(L.y1 - .4, 3.0);
    sans('θ = ' + n2(d, 1) + '°', X(L.x1 - .25), Y(yA), '#8ff5e4', 16, 'right');
    sans('= ' + n2(th / Math.PI, 2) + 'π rad', X(L.x1 - .25), Y(yA - .48), 'rgba(150,215,210,.8)', 11.5, 'right');
    sans('P(' + n2(c, 2) + ', ' + n2(sn, 2) + ')', X(L.x1 - .25), Y(yA - .94), 'rgba(170,200,215,.7)', 10.5, 'right');

    if (s.cot) {
      sans('终边相同的角', X(L.x0 + .25), Y(yA), 'rgba(160,205,210,.8)', 11, 'left');
      sans('θ + k·360°，k∈Z', X(L.x0 + .25), Y(yA - .45), 'rgba(150,190,200,.6)', 10.5, 'left');
    }
  },
  hud() {
    const s = this.state, d = s.th * 180 / Math.PI;
    return [
      {k: 'θ（度）', v: n2(d, 1) + '°', hi: true},
      {k: 'θ（弧度）', v: n2(s.th / Math.PI, 2) + 'π'},
      {k: '所在象限', v: quadOf(d)},
      {k: '最小正同终边角', v: n2(((d % 360) + 360) % 360, 1) + '°'}
    ];
  },
  panel(el) {
    const s = this.state;
    this._sl = addSlider(el, '角度 θ（度）', -720, 720, 5, s.th * 180 / Math.PI,
      v => n2(v, 0) + '°', v => s.th = v * Math.PI / 180);
    addToggle(el, '显示终边相同的角', s.cot, v => s.cot = v);
    const r = row(el);
    addBtn(r, '+360°', () => {
      s.th = clamp(s.th + PI2, -4 * Math.PI, 4 * Math.PI);
      buildPanel();
    }, 'ghost');
    addBtn(r, '−360°', () => {
      s.th = clamp(s.th - PI2, -4 * Math.PI, 4 * Math.PI);
      buildPanel();
    }, 'ghost');
  }
});

/* ---------- 02 三角函数的定义 ---------- */
MODULES.push({
  key: 'def', tab: '02', name: '三角函数的定义', en: 'DEFINITION', blurb: '单位圆定义',
  accent: '#6cb6ff', rgb: '108,182,255',
  hint: '拖动单位圆上的点 P，观察三条彩色线段',
  state: {th: 1.05, snap: true, tan: true},
  reset() { this.state.th = 1.05; this.state.snap = true; this.state.tan = true; },
  meta() {
    return {
      title: '单位圆：P(cos θ, sin θ)',
      desc: '在单位圆上，角 θ 的终边与圆的交点 P 的横坐标就是 cos θ，纵坐标就是 sin θ，两者之比就是 tan θ。拖动 P 点，三条彩色线段随角度伸缩；tan θ 很大时正切线会超出画面，读数仍给出精确值。',
      formula: 'sin θ = y　cos θ = x　tan θ = y/x',
      note: 'P 在单位圆上，所以 <span class="nw">sin²θ + cos²θ = 1</span>；当 <span class="nw">cos θ = 0</span> 时 tan θ 不存在。'
    };
  },
  handles() {
    return [{id: 'P', x: Math.cos(this.state.th), y: Math.sin(this.state.th)}];
  },
  drag(id, p) {
    const q = clampPt(p);
    let a = Math.atan2(q.y, q.x);
    if (a < 0) a += PI2;
    if (this.state.snap) a = Math.round(a / (Math.PI / 12)) * (Math.PI / 12);
    this.state.th = a >= PI2 - 1e-9 ? 0 : a;
    if (this._sl) this._sl.set(deg(this.state.th));
  },
  draw() {
    setFrame(.5, .5, 8.2);
    base();
    const s = this.state, L = lim();
    const th = s.th, c = Math.cos(th), sn = Math.sin(th);

    axes(L);
    ring({x: 0, y: 0}, 1, 'rgba(108,182,255,.42)', 'rgba(108,182,255,.035)', 1.6);
    line({x: 1, y: L.y0 + .25}, {x: 1, y: L.y1 - .25}, 'rgba(255,143,171,.3)', {w: 1, dash: [4, 5]});
    line({x: 0, y: 0}, {x: c, y: sn}, 'rgba(230,245,250,.5)', {w: 1.8});

    line({x: 0, y: 0}, {x: c, y: 0}, '#6cb6ff', {w: 5});
    line({x: c, y: 0}, {x: c, y: sn}, '#ffc56b', {w: 5});
    segLabel({x: 0, y: 0}, {x: c, y: 0}, 'cos θ', '#8fc4ff', .5, 16, 11.5);
    segMath({x: c, y: 0}, {x: c, y: sn}, 'sin θ', '#ffd99a', .5, 22, 13);

    const tv = Math.abs(c) < 1e-6 ? NaN : sn / c;
    if (s.tan && isFinite(tv)) {
      const yTop = L.y1 - .4, yBot = L.y0 + .4;
      const ty = clamp(tv, yBot, yTop);
      line({x: 1, y: 0}, {x: 1, y: ty}, '#ff8fab', {w: 5});
      if (Math.abs(tv) > Math.abs(ty) + 1e-6) {
        line({x: 1, y: ty}, {x: 1, y: ty + (tv > 0 ? .45 : -.45)}, '#ff8fab', {w: 1.6, dash: [4, 4]});
      }
      segMath({x: 1, y: 0}, {x: 1, y: ty}, 'tan θ', '#ffb3c6', .5, 18, 13);
      dot({x: 1, y: ty}, '#ff8fab', 4.5);
      sans('T', X(1) + 12, Y(ty) - 10, '#ffb3c6', 11);
      if (Math.abs(tv) > Math.abs(ty) + 1e-6) {
        sans('tan θ ≈ ' + n2(tv, 1) + '（画面已截断）', X(1) + 12, Y(ty) - 30, 'rgba(255,179,198,.85)', 9.5, 'left');
      }
    } else if (s.tan) {
      sans('tan θ 不存在', X(1.06), Y(-1.75), '#ff8fab', 11, 'left');
    }

    if (Math.abs(c) > .08 && Math.abs(sn) > .08) {
      rightAngle({x: c, y: 0}, {x: c > 0 ? -1 : 1, y: 0}, {x: 0, y: sn > 0 ? 1 : -1},
        9, 'rgba(205,225,235,.4)');
    }

    dot({x: c, y: sn}, '#6cb6ff', 5);
    math('P', X(c) + (c >= 0 ? 17 : -17), Y(sn) + (sn >= 0 ? -15 : 17), '#a9d4ff', 15);
    sans('(cos θ, sin θ)', X(c) + (c >= 0 ? 17 : -17), Y(sn) + (sn >= 0 ? 4 : -4),
      'rgba(170,205,230,.65)', 9.5, c >= 0 ? 'left' : 'right');
    handle({x: c, y: sn}, '#6cb6ff', hoverId === 'P');

    // 角的弧
    sweep({x: 0, y: 0}, .26, 0, th, 'rgba(108,182,255,.85)', 2);
  },
  hud() {
    const s = this.state;
    const c = Math.cos(s.th), sn = Math.sin(s.th);
    const tv = Math.abs(c) < 1e-6 ? null : sn / c;
    return [
      {k: 'θ', v: n2(deg(s.th), 0) + '°'},
      {k: 'sin θ', v: n2(sn, 3), hi: true},
      {k: 'cos θ', v: n2(c, 3), hi: true},
      {k: 'tan θ', v: tv == null ? '不存在' : n2(tv, 3)},
      {k: 'sin²θ + cos²θ', v: n2(sn * sn + c * c, 3)}
    ];
  },
  panel(el) {
    const s = this.state;
    this._sl = addSlider(el, '角度 θ（度）', 0, 360, 1, deg(s.th),
      v => n2(v, 0) + '°', v => s.th = v * Math.PI / 180);
    addToggle(el, '吸附到 15° 的整数倍', s.snap, v => s.snap = v);
    addToggle(el, '显示正切线', s.tan, v => s.tan = v);
    const r = row(el);
    addBtn(r, '30°', () => { s.th = Math.PI / 6; buildPanel(); }, 'ghost');
    addBtn(r, '45°', () => { s.th = Math.PI / 4; buildPanel(); }, 'ghost');
    addBtn(r, '60°', () => { s.th = Math.PI / 3; buildPanel(); }, 'ghost');
  }
});

/* ---------- 03 诱导公式 ---------- */
MODULES.push({
  key: 'induce', tab: '03', name: '诱导公式', en: 'IDENTITIES', blurb: '对称与符号',
  accent: '#ff8fab', rgb: '255,143,171',
  hint: '拖动圆上的点改变 θ，再选择一组对称点',
  state: {th: .95, hl: 'p2'},
  reset() { this.state.th = .95; this.state.hl = 'p2'; },
  meta() {
    return {
      title: '对称的终边，差一个符号',
      desc: '角 θ 与 π−θ、π+θ、−θ 的终边分别关于 y 轴、原点、x 轴对称，因此它们的正弦、余弦、正切只差一个符号。拖动圆上的点改变 θ，再选择一组对称点，观察函数值之间的等量关系。',
      formula: 'sin(π−θ) = sin θ　sin(π+θ) = −sin θ　cos(−θ) = cos θ',
      note: '口诀“函数名不变，符号看象限”：把 θ 看成锐角，判断对称点落在哪个象限，就能写出符号。'
    };
  },
  handles() {
    return [{id: 'P', x: Math.cos(this.state.th), y: Math.sin(this.state.th)}];
  },
  drag(id, p) {
    const q = clampPt(p);
    let a = Math.atan2(q.y, q.x);
    if (a < 0) a += PI2;
    this.state.th = clamp(a, 10 * Math.PI / 180, 80 * Math.PI / 180);
    if (this._sl) this._sl.set(deg(this.state.th));
  },
  draw() {
    setFrame(.5, .5, 8);
    base();
    const s = this.state, L = lim();
    const th = s.th, c = Math.cos(th), sn = Math.sin(th);

    axes(L);
    ring({x: 0, y: 0}, 1, 'rgba(255,143,171,.4)', 'rgba(255,143,171,.03)', 1.6);

    const P1 = {x: c, y: sn}, P2 = {x: -c, y: sn}, P3 = {x: -c, y: -sn}, P4 = {x: c, y: -sn};

    line({x: -c, y: sn}, {x: c, y: sn}, 'rgba(255,255,255,.14)', {w: 1, dash: [4, 5]});
    line({x: -c, y: -sn}, {x: c, y: -sn}, 'rgba(255,255,255,.14)', {w: 1, dash: [4, 5]});
    line({x: c, y: -sn}, {x: c, y: sn}, 'rgba(255,255,255,.14)', {w: 1, dash: [4, 5]});
    line({x: -c, y: -sn}, {x: -c, y: sn}, 'rgba(255,255,255,.14)', {w: 1, dash: [4, 5]});

    // 对称轴高亮
    const HLC = {p2: '#6cb6ff', p3: '#b49cff', p4: '#ffc56b'};
    if (s.hl === 'p2') {
      line({x: -c, y: sn}, {x: c, y: sn}, '#6cb6ff', {w: 2.2});
      line({x: 0, y: -1.25}, {x: 0, y: 1.25}, 'rgba(108,182,255,.4)', {w: 1.2, dash: [5, 4]});
    } else if (s.hl === 'p3') {
      line({x: -c, y: -sn}, {x: -c, y: sn}, '#b49cff', {w: 2.2});
    } else if (s.hl === 'p4') {
      line({x: c, y: -sn}, {x: c, y: sn}, '#ffc56b', {w: 2.2});
      line({x: -1.25, y: 0}, {x: 1.25, y: 0}, 'rgba(255,197,107,.4)', {w: 1.2, dash: [5, 4]});
    }

    sweep({x: 0, y: 0}, .28, 0, th, 'rgba(255,143,171,.9)', 2);

    const pts = [
      {p: P1, col: '#ff8fab', lab: 'θ'},
      {p: P2, col: '#6cb6ff', lab: 'π−θ'},
      {p: P3, col: '#b49cff', lab: 'π+θ'},
      {p: P4, col: '#ffc56b', lab: '−θ'}
    ];
    pts.forEach(o => {
      dot(o.p, o.col, 5);
      const ux = o.p.x / (len2(o.p.x, o.p.y) || 1), uy = o.p.y / (len2(o.p.x, o.p.y) || 1);
      math(o.lab, X(o.p.x + ux * .19), Y(o.p.y + uy * .19) - 4, o.col, 14);
    });
    handle(P1, '#ff8fab', hoverId === 'P');

    // 关系式
    let l1 = '', l2 = '', col = HLC[s.hl] || '#ff8fab';
    if (s.hl === 'p2') {
      l1 = 'sin(π−θ) = sin θ = ' + signStr(sn);
      l2 = 'cos(π−θ) = −cos θ = ' + signStr(-c);
    } else if (s.hl === 'p3') {
      l1 = 'sin(π+θ) = −sin θ = ' + signStr(-sn);
      l2 = 'cos(π+θ) = −cos θ = ' + signStr(-c);
    } else {
      l1 = 'sin(−θ) = −sin θ = ' + signStr(-sn);
      l2 = 'cos(−θ) = cos θ = ' + signStr(c);
    }
    const yb = Math.max(L.y0 + .95, -2.55);
    sans(l1, X(L.x0 + .3), Y(yb), col, 11.5, 'left');
    sans(l2, X(L.x0 + .3), Y(yb - .4), col, 11.5, 'left');
  },
  hud() {
    const s = this.state;
    const c = Math.cos(s.th), sn = Math.sin(s.th);
    const rel = s.hl === 'p2' ? 'sin(π−θ) = sin θ'
      : s.hl === 'p3' ? 'sin(π+θ) = −sin θ' : 'cos(−θ) = cos θ';
    return [
      {k: 'θ', v: n2(deg(s.th), 1) + '°'},
      {k: 'sin θ', v: signStr(sn)},
      {k: 'cos θ', v: signStr(c)},
      {k: '所选对称关系', v: rel, hi: true}
    ];
  },
  panel(el) {
    const s = this.state;
    this._sl = addSlider(el, '角度 θ（度）', 10, 80, 1, deg(s.th),
      v => n2(v, 0) + '°', v => s.th = v * Math.PI / 180);
    const r = row(el);
    addBtn(r, 'π−θ', () => s.hl = 'p2', 'ghost');
    addBtn(r, 'π+θ', () => s.hl = 'p3', 'ghost');
    addBtn(r, '−θ', () => s.hl = 'p4', 'ghost');
  }
});

/* ---------- 04 y = A sin(ωx+φ) 的图象 ---------- */
MODULES.push({
  key: 'sine', tab: '04', name: '正弦型函数', en: 'SINE WAVE', blurb: '振幅·周期·初相',
  accent: '#ffc56b', rgb: '255,197,107',
  hint: '拖动三个滑块，或拖动右侧的 A 手柄',
  state: {A: 1.6, w: 1.4, phi: .6, five: true},
  reset() { this.state.A = 1.6; this.state.w = 1.4; this.state.phi = .6; this.state.five = true; },
  meta() {
    return {
      title: 'y = A sin(ωx + φ) 的三个参数',
      desc: '把 y = sin x 的图象纵向拉长为 A 倍、横向压缩为 1/ω 倍，再左右平移 |φ|/ω 个单位，就得到 y = A sin(ωx+φ)。拖动滑块或右侧的 A 手柄，观察振幅、周期与初相如何即时变化。',
      formula: 'y = A sin(ωx + φ)　T = 2π/ω',
      note: 'A 决定振幅，ω 决定周期，φ 叫初相。注意：图象左右平移量是 <span class="nw">|φ|/ω</span>，不是 |φ|。'
    };
  },
  handles() {
    const L = lim();
    return [{id: 'A', x: L.x1 - .75, y: this.state.A}];
  },
  drag(id, p) {
    const q = clampPt(p);
    this.state.A = clamp(Math.round(Math.abs(q.y) * 10) / 10, .4, 3);
    if (this._sa) this._sa.set(this.state.A);
  },
  draw() {
    setFrame(.5, .52, 14);
    base();
    const s = this.state, L = lim();
    const A = s.A, w = s.w, phi = s.phi, T = PI2 / w;

    axes(L);
    piAxis(L);

    line({x: L.x0 + .3, y: A}, {x: L.x1 - .3, y: A}, 'rgba(255,197,107,.18)', {w: 1, dash: [5, 5]});
    line({x: L.x0 + .3, y: -A}, {x: L.x1 - .3, y: -A}, 'rgba(255,197,107,.18)', {w: 1, dash: [5, 5]});
    curveOf(x => A * Math.sin(w * x + phi), '#ffc56b', 2.6);

    // 一个周期内的五个关键点
    let x0 = -phi / w;
    while (x0 > L.x1 - .4) x0 -= T;
    while (x0 < L.x0 + .4) x0 += T;
    if (s.five) {
      const xs = [x0, x0 + T / 4, x0 + T / 2, x0 + 3 * T / 4, x0 + T];
      const ys = [0, A, 0, -A, 0];
      for (let i = 0; i < 5; i++) {
        if (xs[i] < L.x0 + .1 || xs[i] > L.x1 - .1) continue;
        dot({x: xs[i], y: ys[i]}, 'rgba(255,225,180,.9)', 3.6);
      }
    }

    // 周期标注
    const p1 = x0 + T;
    if (x0 > L.x0 + .3 && p1 < L.x1 - .3) {
      const yb = Math.min(A + .55, L.y1 - 1.15);
      line({x: x0, y: yb}, {x: p1, y: yb}, 'rgba(255,197,107,.55)', {w: 1.2});
      line({x: x0, y: yb - .12}, {x: x0, y: yb + .12}, 'rgba(255,197,107,.55)', {w: 1.2});
      line({x: p1, y: yb - .12}, {x: p1, y: yb + .12}, 'rgba(255,197,107,.55)', {w: 1.2});
      sans('T = ' + n2(T, 2), X((x0 + p1) / 2), Y(yb) - 13, 'rgba(255,215,160,.9)', 11);
    }

    // 振幅手柄
    const hx = L.x1 - .75;
    line({x: hx, y: 0}, {x: hx, y: A}, 'rgba(255,197,107,.7)', {w: 1.4, dash: [4, 4]});
    handle({x: hx, y: A}, '#ffc56b', hoverId === 'A');
    sans('A', X(hx) + 15, Y(A / 2), 'rgba(255,215,160,.95)', 12);

    math('y = ' + n2(A, 1) + ' sin(' + n2(w, 1) + 'x' + phiStr(phi) + ')',
      X(L.x0 + .25), Y(L.y1 - .5), '#ffd99a', 15, 'left');
  },
  hud() {
    const s = this.state;
    return [
      {k: '振幅 A', v: n2(s.A, 1), hi: true},
      {k: 'ω', v: n2(s.w, 1)},
      {k: '初相 φ', v: n2(s.phi / Math.PI, 2) + 'π'},
      {k: '周期 T', v: n2(PI2 / s.w, 2)},
      {k: '频率 1/T', v: n2(s.w / PI2, 2)}
    ];
  },
  panel(el) {
    const s = this.state;
    this._sa = addSlider(el, '振幅 A', .4, 3, .1, s.A, v => n2(v, 1), v => s.A = v);
    addSlider(el, '角频率 ω', .5, 3, .1, s.w, v => n2(v, 1), v => s.w = v);
    addSlider(el, '初相 φ', -Math.PI, Math.PI, .05, s.phi, v => n2(v / Math.PI, 2) + 'π', v => s.phi = v);
    addToggle(el, '标出一个周期的五个关键点', s.five, v => s.five = v);
  }
});

/* ---------- 05 图象变换 ---------- */
MODULES.push({
  key: 'shift', tab: '05', name: '图象变换', en: 'TRANSFORM', blurb: '平移与伸缩',
  accent: '#b49cff', rgb: '180,156,255',
  hint: '用按钮逐步切换，对比每一步的图象',
  state: {A: 2, w: 2, phi: .6, step: 1},
  reset() { this.state.A = 2; this.state.w = 2; this.state.phi = .6; this.state.step = 1; },
  meta() {
    return {
      title: '从 y = sin x 一步步变过去',
      desc: '从 y = sin x 出发，先向左平移 φ 个单位得到 y = sin(x+φ)，再把横坐标压缩为原来的 1/ω，最后把纵坐标伸长为 A 倍。用按钮逐步切换，对比每一步的图象与原图象的差别。',
      formula: 'y = sin x → sin(x+φ) → sin(ωx+φ) → A sin(ωx+φ)',
      note: '先平移后伸缩与先伸缩后平移，平移量并不相同。本演示按“先平移 φ，再横向压缩 1/ω”的顺序进行。'
    };
  },
  draw() {
    setFrame(.5, .55, 14);
    base();
    const s = this.state, L = lim();
    const A = s.A, w = s.w, phi = s.phi;

    axes(L);
    piAxis(L);
    curveOf(x => Math.sin(x), 'rgba(200,225,235,.35)', 1.4, [5, 5]);

    const fns = [
      x => Math.sin(x),
      x => Math.sin(x + phi),
      x => Math.sin(w * x + phi),
      x => A * Math.sin(w * x + phi)
    ];
    for (let k = 0; k < s.step; k++)
      curveOf(fns[k], 'rgba(185,212,230,.9)', 1.8, null, .22);
    curveOf(fns[s.step], '#b49cff', 2.8);

    const forms = [
      'y = sin x',
      'y = sin(x' + phiStr(phi) + ')',
      'y = sin(' + n2(w, 1) + 'x' + phiStr(phi) + ')',
      'y = ' + n2(A, 1) + ' sin(' + n2(w, 1) + 'x' + phiStr(phi) + ')'
    ];
    math(forms[s.step], X(L.x0 + .25), Y(L.y1 - .5), '#c9b8ff', 15, 'left');

    // 当前步骤的几何提示
    if (s.step === 1 && Math.abs(phi) > .02) {
      const y = 2.5;
      arrow({x: 0, y: y}, {x: -phi, y: y}, 'rgba(180,156,255,.75)', {w: 1.4, head: 7, dash: [5, 4]});
      sans((phi > 0 ? '左移 ' : '右移 ') + n2(Math.abs(phi), 2), X(-phi / 2), Y(y) + 15, 'rgba(200,180,255,.85)', 10.5);
    } else if (s.step === 2) {
      const xOld = Math.PI / 2, xNew = (Math.PI / 2 - phi) / w;
      if (xOld < L.x1 - .5 && xNew > L.x0 + .5) {
        dot({x: xOld, y: 1}, 'rgba(200,225,235,.5)', 4);
        line({x: xOld, y: 1}, {x: xNew, y: 1}, 'rgba(180,156,255,.6)', {w: 1.2, dash: [4, 4]});
        dot({x: xNew, y: 1}, '#b49cff', 4.5);
        sans('横坐标 ×1/ω', X((xOld + xNew) / 2), Y(1) - 14, 'rgba(200,180,255,.85)', 10.5);
      }
    } else if (s.step === 3) {
      const hx = L.x1 - .9;
      arrow({x: hx, y: 0}, {x: hx, y: A}, 'rgba(180,156,255,.8)', {w: 1.6, head: 8});
      sans('×A', X(hx) + 14, Y(A / 2), 'rgba(200,180,255,.85)', 10.5);
    }
  },
  hud() {
    const s = this.state;
    const names = ['① 原图', '② 平移', '③ 伸缩', '④ 振幅'];
    return [
      {k: '当前步骤', v: names[s.step], hi: true},
      {k: 'A', v: n2(s.A, 1)},
      {k: 'ω', v: n2(s.w, 1)},
      {k: 'φ', v: n2(s.phi / Math.PI, 2) + 'π'},
      {k: '周期 T', v: n2(PI2 / s.w, 2)}
    ];
  },
  panel(el) {
    const s = this.state;
    addSlider(el, '振幅 A', 1, 3, .1, s.A, v => n2(v, 1), v => { s.A = v; if (s.step < 3) s.step = 3; });
    addSlider(el, '角频率 ω', .5, 3, .1, s.w, v => n2(v, 1), v => { s.w = v; if (s.step < 2) s.step = 2; });
    addSlider(el, '初相 φ', -Math.PI, Math.PI, .05, s.phi, v => n2(v / Math.PI, 2) + 'π',
      v => { s.phi = v; if (s.step < 1) s.step = 1; });
    const r = row(el);
    addBtn(r, '原图', () => s.step = 0, 'ghost');
    addBtn(r, '平移', () => s.step = 1, 'ghost');
    addBtn(r, '伸缩', () => s.step = 2, 'ghost');
    addBtn(r, '振幅', () => s.step = 3, 'ghost');
  }
});

})();
