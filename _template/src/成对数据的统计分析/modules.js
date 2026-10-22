/* ============================================================
   选择性必修第三册 · 第 8 章 成对数据的统计分析
   散点图 / 回归直线 / 残差 / 列联表 / 统计案例
   ============================================================ */
(function () {

/* ---------- 通用：描述统计与最小二乘 ---------- */
function stat(pts) {
  const n = pts.length;
  let sx = 0, sy = 0;
  for (let i = 0; i < n; i++) { sx += pts[i].x; sy += pts[i].y; }
  const mx = sx / n, my = sy / n;
  let sxx = 0, sxy = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = pts[i].x - mx, dy = pts[i].y - my;
    sxx += dx * dx; sxy += dx * dy; syy += dy * dy;
  }
  const b = sxx > 1e-9 ? sxy / sxx : 0;
  const a = my - b * mx;
  const r = (sxx > 1e-9 && syy > 1e-9) ? sxy / Math.sqrt(sxx * syy) : 0;
  let q = 0;
  for (let i = 0; i < n; i++) {
    const e = pts[i].y - (a + b * pts[i].x);
    q += e * e;
  }
  return {n: n, mx: mx, my: my, sxx: sxx, sxy: sxy, syy: syy, b: b, a: a, r: r, q: q};
}

function corrWord(r) {
  const v = Math.abs(r);
  if (v >= .85) return r > 0 ? '强正相关' : '强负相关';
  if (v >= .5) return r > 0 ? '正相关' : '负相关';
  if (v >= .25) return r > 0 ? '弱正相关' : '弱负相关';
  return '几乎不相关';
}

function ring(p, color, rad) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(X(p.x), Y(p.y), rad || 4.5, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

/* 带刻度的坐标轴 */
function axesXY(xl, yl, every) {
  every = every || 2;
  const L = lim(), c = 'rgba(190,215,225,.4)';
  line({x: L.x0, y: 0}, {x: L.x1, y: 0}, c, {w: 1.2});
  line({x: 0, y: L.y0}, {x: 0, y: L.y1}, c, {w: 1.2});
  arrow({x: L.x1 - .65, y: 0}, {x: L.x1, y: 0}, c, {w: 1.2, head: 7});
  arrow({x: 0, y: L.y1 - .65}, {x: 0, y: L.y1}, c, {w: 1.2, head: 7});
  sans(xl, X(L.x1) - 4, Y(0) + 17, 'rgba(175,205,215,.8)', 12, 'right');
  sans(yl, X(0) - 10, Y(L.y1) + 2, 'rgba(175,205,215,.8)', 12, 'right');
  for (let i = Math.ceil(L.x0); i <= Math.floor(L.x1); i++) {
    if (i === 0) continue;
    line({x: i, y: -.1}, {x: i, y: .1}, c, {w: 1});
    if (i % every === 0) sans(String(i), X(i), Y(0) + 13, 'rgba(150,180,195,.55)', 9);
  }
  for (let j = Math.ceil(L.y0); j <= Math.floor(L.y1); j++) {
    if (j === 0) continue;
    line({x: -.1, y: j}, {x: .1, y: j}, c, {w: 1});
    if (j % every === 0) sans(String(j), X(0) - 8, Y(j), 'rgba(150,180,195,.55)', 9, 'right');
  }
}

const D1 = [[-3.6, -2.6], [-2.7, -2.1], [-1.6, -1.6], [-.6, -.1], [.4, .9], [1.4, .6], [2.5, 2.4], [3.4, 2.9]];

/* ---------- 01 散点图与相关性 ---------- */
MODULES.push({
  key: 'scatter', tab: '01', name: '散点图', en: 'SCATTER', blurb: '相关方向与强度',
  accent: '#5eead4', rgb: '94,234,212',
  hint: '拖动样本点，观察相关系数 r 的正负与大小',
  state: {pts: D1.map(function (p) { return {x: p[0], y: p[1]}; }), showMean: true},
  reset() {
    this.state.pts = D1.map(function (p) { return {x: p[0], y: p[1]}; });
    this.state.showMean = true;
  },
  meta() {
    return {
      title: '散点图：看出相关的方向',
      desc: '把成对数据 (x, y) 画成散点，点的分布就透露了两个变量的关系。拖动任意一个点，观察 <b>相关系数 r</b> 的正负与大小如何变化：点越贴近一条上升的直线，正相关就越强。',
      formula: 'r = Σ(xᵢ−x̄)(yᵢ−ȳ) / √(Σ(xᵢ−x̄)²·Σ(yᵢ−ȳ)²)',
      note: '|r| ≤ 1；r &gt; 0 为正相关，r &lt; 0 为负相关。把点拖成水平的一团，r 会趋近 0，说明两个变量几乎不呈线性关系。'
    };
  },
  handles() {
    return this.state.pts.map(function (p, i) { return {id: 'p' + i, x: p.x, y: p.y}; });
  },
  drag(id, p) {
    const i = +id.slice(1);
    const q = clampPt(p), L = lim();
    this.state.pts[i] = {x: clamp(q.x, L.x0 + .35, L.x1 - .35), y: clamp(q.y, L.y0 + .5, L.y1 - .5)};
  },
  draw() {
    setFrame(.5, .54, 12.2);
    base();
    const s = this.state, L = lim(), st = stat(s.pts);
    axesXY('x', 'y', 2);

    if (s.showMean) {
      line({x: st.mx, y: L.y0 + .2}, {x: st.mx, y: L.y1 - .2}, 'rgba(230,240,245,.22)', {w: 1, dash: [5, 5]});
      line({x: L.x0 + .2, y: st.my}, {x: L.x1 - .2, y: st.my}, 'rgba(230,240,245,.22)', {w: 1, dash: [5, 5]});
      sans('x̄', X(st.mx) + 10, Y(0) - 8, 'rgba(200,220,230,.8)', 12);
      sans('ȳ', X(0) - 14, Y(st.my) - 10, 'rgba(200,220,230,.8)', 12);
      dot({x: st.mx, y: st.my}, '#ffc56b', 5);
    }

    s.pts.forEach(function (p, i) {
      const prod = (p.x - st.mx) * (p.y - st.my);
      const col = prod >= 0 ? '#5eead4' : '#ff8fab';
      line({x: p.x, y: 0}, {x: p.x, y: p.y}, 'rgba(255,255,255,.07)', {w: 1});
      handle(p, col, hoverId === 'p' + i);
    });

    sans('n = ' + st.n, X(L.x0 + .5), Y(L.y1 - .5), 'rgba(170,200,215,.75)', 10.5, 'left');
    sans('r = ' + fmt(st.r, 3), X(L.x0 + .5), Y(L.y1 - 1.05), '#8ff5e4', 20, 'left');
    sans(corrWord(st.r), X(L.x0 + .5), Y(L.y1 - 1.6), 'rgba(205,225,235,.85)', 11, 'left');
  },
  hud() {
    const st = stat(this.state.pts);
    return [
      {k: '样本量 n', v: String(st.n)},
      {k: '相关系数 r', v: fmt(st.r, 3), hi: true},
      {k: '相关方向', v: Math.abs(st.r) < .25 ? '无明显方向' : (st.r > 0 ? '正相关' : '负相关')},
      {k: '相关强度', v: corrWord(st.r)},
      {k: 'x̄ / ȳ', v: fmt(st.mx, 2) + ' / ' + fmt(st.my, 2)}
    ];
  },
  panel(el) {
    const s = this.state;
    addToggle(el, '显示均值线 x̄、ȳ', s.showMean, function (v) { s.showMean = v; });
    addBtn(el, '恢复默认数据', function () { this.reset(); buildPanel(); }.bind(this), 'ghost');
    addBtn(el, '随机生成一组数据', function () {
      const k = (Math.random() * 2 - 1) * 1.15;
      const b = Math.random() * 1.2 - .6;
      const arr = [];
      for (let i = 0; i < 8; i++) {
        const x = -3.8 + i * 7.6 / 7 + (Math.random() - .5) * .7;
        const y = k * x + b + (Math.random() - .5) * 1.4;
        arr.push({x: clamp(x, -5.2, 5.2), y: clamp(y, -3.2, 3.2)});
      }
      s.pts = arr;
    }, 'ghost');
  }
});

const B2X = [-3, -2, -1, 0, 1, 2, 3];
const B2Y = [-2.4, -1.2, -1.0, 0, 1.1, 1.5, 2.7];

/* ---------- 02 回归直线 ---------- */
MODULES.push({
  key: 'regression', tab: '02', name: '回归直线', en: 'REGRESSION', blurb: '最小二乘拟合',
  accent: '#6cb6ff', rgb: '108,182,255',
  hint: '拖动样本点，最小二乘直线即时重新拟合',
  state: {pts: [], spread: 1, showDev: true, showMean: true},
  applySpread() {
    const s = this.state;
    s.pts = B2X.map(function (x, i) { return {x: x, y: .1 + s.spread * (B2Y[i] - .1)}; });
  },
  reset() {
    this.state.spread = 1;
    this.state.showDev = true;
    this.state.showMean = true;
    this.applySpread();
  },
  meta() {
    return {
      title: '回归直线：最小二乘估计',
      desc: '用一条直线近似描述两个变量的关系，就是回归。拖动样本点，最小二乘估计会立刻重算：直线总经过样本中心 (x̄, ȳ)，并使残差平方和达到最小。',
      formula: 'b̂ = Σ(xᵢ−x̄)(yᵢ−ȳ) / Σ(xᵢ−x̄)²<br>â = ȳ − b̂x̄',
      note: '竖直偏差 eᵢ = yᵢ − ŷᵢ 叫残差。直线随点转动，但始终穿过样本中心 (x̄, ȳ)。'
    };
  },
  handles() {
    return this.state.pts.map(function (p, i) { return {id: 'p' + i, x: p.x, y: p.y}; });
  },
  drag(id, p) {
    const i = +id.slice(1);
    const q = clampPt(p), L = lim();
    this.state.pts[i] = {x: clamp(q.x, L.x0 + .35, L.x1 - .35), y: clamp(q.y, L.y0 + .5, L.y1 - .5)};
  },
  draw() {
    setFrame(.5, .54, 12.2);
    base();
    const s = this.state, L = lim(), st = stat(s.pts);
    axesXY('x', 'y', 2);

    line({x: L.x0, y: st.a + st.b * L.x0}, {x: L.x1, y: st.a + st.b * L.x1}, '#6cb6ff', {w: 2.8});

    if (s.showDev) {
      s.pts.forEach(function (p) {
        const yh = st.a + st.b * p.x;
        if (Math.abs(yh - p.y) > .03) {
          line({x: p.x, y: p.y}, {x: p.x, y: yh}, 'rgba(154,208,255,.45)', {w: 1.2, dash: [4, 4]});
        }
      });
    }

    if (s.showMean) {
      line({x: st.mx, y: st.my}, {x: st.mx, y: 0}, 'rgba(255,197,107,.3)', {w: 1, dash: [4, 5]});
      line({x: 0, y: st.my}, {x: st.mx, y: st.my}, 'rgba(255,197,107,.3)', {w: 1, dash: [4, 5]});
      dot({x: st.mx, y: st.my}, '#ffc56b', 5.5);
      sans('(x̄, ȳ)', X(st.mx) + 26, Y(st.my) + 13, 'rgba(255,210,145,.9)', 10.5, 'left');
    }

    s.pts.forEach(function (p, i) {
      handle(p, '#6cb6ff', hoverId === 'p' + i);
    });

    math('ŷ = ' + fmt(st.b, 2) + 'x ' + (st.a >= 0 ? '+ ' : '− ') + fmt(Math.abs(st.a), 2),
      X(L.x0 + .5), Y(L.y1 - .55), '#9ad0ff', 18, 'left');
    sans('b̂ = ' + fmt(st.b, 3) + '　â = ' + fmt(st.a, 3), X(L.x0 + .5), Y(L.y1 - 1.15), 'rgba(175,210,240,.8)', 10.5, 'left');
  },
  hud() {
    const st = stat(this.state.pts);
    return [
      {k: 'x̄', v: fmt(st.mx, 2)},
      {k: 'ȳ', v: fmt(st.my, 2)},
      {k: '斜率 b̂', v: fmt(st.b, 3), hi: true},
      {k: '截距 â', v: fmt(st.a, 3), hi: true},
      {k: '相关系数 r', v: fmt(st.r, 3)}
    ];
  },
  panel(el) {
    const s = this.state, self = this;
    addSlider(el, '样本整体波动幅度', .5, 1.8, .05, s.spread, function (v) { return v.toFixed(2); },
      function (v) { s.spread = v; self.applySpread(); });
    addToggle(el, '显示竖直偏差', s.showDev, function (v) { s.showDev = v; });
    addToggle(el, '显示样本中心', s.showMean, function (v) { s.showMean = v; });
    addBtn(el, '恢复默认数据', function () { self.reset(); buildPanel(); }, 'ghost');
  }
});

const P3 = [[-3, -2.4], [-2, -1.0], [-1, -1.3], [0, .6], [1, .5], [2, 2.2], [3, 2.1]]
  .map(function (p) { return {x: p[0], y: p[1]}; });

/* ---------- 03 残差与拟合 ---------- */
MODULES.push({
  key: 'residual', tab: '03', name: '残差分析', en: 'RESIDUALS', blurb: '残差平方和',
  accent: '#ffc56b', rgb: '255,197,107',
  hint: '调节斜率与截距，比较候选直线与最小二乘直线',
  state: {b: .5, a: -.2, resid: false, showLS: true},
  reset() {
    this.state.b = .5; this.state.a = -.2;
    this.state.resid = false; this.state.showLS = true;
  },
  meta() {
    return {
      title: '残差：直线拟合得好不好',
      desc: '残差是实际值与预测值之差。直线拟合得好不好，要看残差是否随机地散布在 0 附近。调节斜率或截距，比较候选直线与最小二乘直线的残差平方和。',
      formula: 'eᵢ = yᵢ − (b̂xᵢ + â)<br>Q = Σeᵢ²',
      note: '残差图以 x 为横轴、e 为纵轴。若残差呈现明显的弯曲或喇叭形，说明直线模型并不合适。'
    };
  },
  handles() { return []; },
  draw() {
    const s = this.state, opt = stat(P3);
    let q = 0;
    P3.forEach(function (p) { const e = p.y - (s.a + s.b * p.x); q += e * e; });

    if (s.resid) {
      setFrame(.5, .55, 12.2);
      base();
      const L2 = lim();
      axesXY('x', 'e', 1);
      line({x: L2.x0, y: 0}, {x: L2.x1, y: 0}, 'rgba(230,240,250,.55)', {w: 1.4});
      if (s.showLS) {
        P3.forEach(function (p) {
          ring({x: p.x, y: p.y - (opt.a + opt.b * p.x)}, 'rgba(108,182,255,.75)', 4.2);
        });
      }
      P3.forEach(function (p) {
        const e = p.y - (s.a + s.b * p.x);
        const col = e >= 0 ? '#ffc56b' : '#ff8fab';
        line({x: p.x, y: 0}, {x: p.x, y: e}, col, {w: 7, alpha: .8});
        dot({x: p.x, y: e}, col, 3.6);
      });
      sans('残差图：e = y − ŷ', X(L2.x0 + .5), Y(L2.y1 - .5), 'rgba(255,215,150,.9)', 11, 'left');
      sans('蓝圈为最小二乘直线的残差', X(L2.x0 + .5), Y(L2.y1 - 1.0), 'rgba(160,205,250,.8)', 10, 'left');
    } else {
      setFrame(.5, .54, 12.2);
      base();
      const L = lim();
      axesXY('x', 'y', 2);
      if (s.showLS) {
        line({x: L.x0, y: opt.a + opt.b * L.x0}, {x: L.x1, y: opt.a + opt.b * L.x1}, 'rgba(108,182,255,.55)', {w: 2, dash: [6, 5]});
      }
      line({x: L.x0, y: s.a + s.b * L.x0}, {x: L.x1, y: s.a + s.b * L.x1}, '#ffc56b', {w: 2.8});
      P3.forEach(function (p) {
        const yh = s.a + s.b * p.x;
        line({x: p.x, y: p.y}, {x: p.x, y: yh}, 'rgba(255,197,107,.4)', {w: 1.2, dash: [4, 4]});
        dot(p, '#ffc56b', 4.4);
      });
      math('ŷ = ' + fmt(s.b, 2) + 'x ' + (s.a >= 0 ? '+ ' : '− ') + fmt(Math.abs(s.a), 2),
        X(L.x0 + .5), Y(L.y1 - .55), '#ffd99a', 18, 'left');
      sans('Q = ' + fmt(q, 3) + '　最小二乘 Qmin = ' + fmt(opt.q, 3),
        X(L.x0 + .5), Y(L.y1 - 1.15), 'rgba(255,220,165,.85)', 10.5, 'left');
    }
  },
  hud() {
    const s = this.state, opt = stat(P3);
    let q = 0;
    P3.forEach(function (p) { const e = p.y - (s.a + s.b * p.x); q += e * e; });
    return [
      {k: '斜率 b̂', v: fmt(s.b, 2)},
      {k: '截距 â', v: fmt(s.a, 2)},
      {k: '残差平方和 Q', v: fmt(q, 3), hi: true},
      {k: '最小二乘 Qmin', v: fmt(opt.q, 3)},
      {k: '判断', v: q <= opt.q * 1.02 + 1e-6 ? '已接近最优' : '仍有偏差'}
    ];
  },
  panel(el) {
    const s = this.state, opt = stat(P3);
    addSlider(el, '候选直线斜率 b', -.2, 1.8, .05, s.b, function (v) { return v.toFixed(2); }, function (v) { s.b = v; });
    addSlider(el, '候选直线截距 a', -1, 1, .05, s.a, function (v) { return v.toFixed(2); }, function (v) { s.a = v; });
    addToggle(el, '切换为残差图', s.resid, function (v) { s.resid = v; });
    addToggle(el, '显示最小二乘直线', s.showLS, function (v) { s.showLS = v; });
    addBtn(el, '一键最小二乘', function () { s.b = opt.b; s.a = opt.a; buildPanel(); }, 'ghost');
  }
});

/* ---------- 04 列联表与独立性检验 ---------- */
MODULES.push({
  key: 'chi2', tab: '04', name: '独立性检验', en: 'CHI-SQUARE', blurb: '列联表与 χ²',
  accent: '#b49cff', rgb: '180,156,255',
  hint: '调节四格频数，观察 χ² 与临界值的比较',
  state: {a: 32, b: 18, c: 20, d: 30},
  reset() { this.state.a = 32; this.state.b = 18; this.state.c = 20; this.state.d = 30; },
  meta() {
    return {
      title: '列联表与独立性检验',
      desc: '把两个分类变量的频数排成 2×2 列联表，用 χ² 统计量判断它们是否独立。调节四格频数，观察 χ² 与临界值 3.841 的大小关系，以及结论如何改变。',
      formula: 'χ² = n(ad − bc)² / [(a+b)(c+d)(a+c)(b+d)]',
      note: 'χ² ≥ 3.841 时，在犯错误概率不超过 0.05 的前提下认为两变量有关；χ² ≥ 6.635 时把握提高到 99%。'
    };
  },
  handles() { return []; },
  draw() {
    setFrame(.5, .5, 12.4);
    const L = lim();
    const s = this.state, a = s.a, b = s.b, c = s.c, d = s.d;
    const n = a + b + c + d;
    const den = (a + b) * (c + d) * (a + c) * (b + d);
    const chi = den > 0 ? n * Math.pow(a * d - b * c, 2) / den : 0;

    const H0 = L.y1 - L.y0, W0 = L.x1 - L.x0;
    const chh = clamp(H0 * .13, .45, .95);
    const hdrY = L.y1 - H0 * .07;
    const cy = [hdrY - H0 * .12, hdrY - H0 * .12 - chh, hdrY - H0 * .12 - 2 * chh];
    const cw = Math.min(3.0, W0 * .235);
    const cx = [-cw, 0, cw];
    const hdr = ['喜欢数学', '不喜欢数学', '合计'];

    function box(x, y, fill, stroke) {
      ctx.save();
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(X(x - cw / 2), Y(y + chh / 2), cw * V.k, chh * V.k);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    function val(x, y, t, col, size) {
      sans(t, X(x), Y(y), col, size || 13);
    }

    hdr.forEach(function (t, i) {
      sans(t, X(cx[i]), Y(hdrY), 'rgba(214,198,255,.95)', 10.5);
    });
    ['男生', '女生', '合计'].forEach(function (t, i) {
      sans(t, X(cx[0] - cw / 2 - .14), Y(cy[i]), 'rgba(214,198,255,.95)', 10.5, 'right');
    });

    box(cx[0], cy[0], 'rgba(180,156,255,.15)', 'rgba(180,156,255,.32)');
    box(cx[1], cy[0], 'rgba(180,156,255,.15)', 'rgba(180,156,255,.32)');
    box(cx[2], cy[0], 'rgba(255,255,255,.045)', 'rgba(180,156,255,.22)');
    box(cx[0], cy[1], 'rgba(180,156,255,.15)', 'rgba(180,156,255,.32)');
    box(cx[1], cy[1], 'rgba(180,156,255,.15)', 'rgba(180,156,255,.32)');
    box(cx[2], cy[1], 'rgba(255,255,255,.045)', 'rgba(180,156,255,.22)');
    box(cx[0], cy[2], 'rgba(255,255,255,.045)', 'rgba(180,156,255,.22)');
    box(cx[1], cy[2], 'rgba(255,255,255,.045)', 'rgba(180,156,255,.22)');
    box(cx[2], cy[2], 'rgba(255,255,255,.045)', 'rgba(180,156,255,.22)');

    val(cx[0], cy[0], String(a), '#efe8ff');
    val(cx[1], cy[0], String(b), '#efe8ff');
    val(cx[2], cy[0], String(a + b), '#cfc3ef');
    val(cx[0], cy[1], String(c), '#efe8ff');
    val(cx[1], cy[1], String(d), '#efe8ff');
    val(cx[2], cy[1], String(c + d), '#cfc3ef');
    val(cx[0], cy[2], String(a + c), '#cfc3ef');
    val(cx[1], cy[2], String(b + d), '#cfc3ef');
    val(cx[2], cy[2], String(n), '#cfc3ef');

    const strong = chi >= 6.635;
    const sig = chi >= 3.841;
    const col = strong ? '#7be0c0' : (sig ? '#ffc56b' : 'rgba(195,210,220,.85)');

    const yChi = cy[2] - chh / 2 - H0 * .095;
    math('χ² = ' + fmt(chi, 2), X(L.x0 + .45), Y(yChi), col, 21, 'left');
    sans('n = ' + n, X(L.x1 - .45), Y(yChi), 'rgba(205,215,225,.7)', 11, 'right');

    const gmax = Math.max(12, Math.ceil(chi / 4) * 4);
    const gx0 = L.x0 + .45, gx1 = L.x1 - .45;
    const gx = function (v) { return gx0 + (gx1 - gx0) * Math.min(v, gmax) / gmax; };
    const yG = yChi - H0 * .17;
    line({x: gx0, y: yG}, {x: gx1, y: yG}, 'rgba(200,220,235,.28)', {w: 5});
    line({x: gx0, y: yG}, {x: gx(Math.min(chi, gmax)), y: yG}, col, {w: 5});
    [3.841, 6.635].forEach(function (v) {
      line({x: gx(v), y: yG - .2}, {x: gx(v), y: yG + .2}, 'rgba(225,235,245,.6)', {w: 1.2});
      sans(v.toFixed(3), X(gx(v)), Y(yG - .4), 'rgba(185,205,220,.75)', 9);
    });
    sans('0', X(gx0), Y(yG - .4), 'rgba(185,205,220,.6)', 9);
    sans(String(gmax), X(gx1), Y(yG - .4), 'rgba(185,205,220,.6)', 9);
    dot({x: gx(chi), y: yG}, col, 6.5);

    sans(strong ? 'χ² ≥ 6.635：有 99% 的把握认为两者有关'
      : sig ? 'χ² ≥ 3.841：有 95% 的把握认为两者有关'
      : 'χ² < 3.841：没有充分证据认为两者有关',
      X(0), Y(yG - H0 * .11), col, 11.5);
  },

  hud() {
    const s = this.state;
    const n = s.a + s.b + s.c + s.d;
    const den = (s.a + s.b) * (s.c + s.d) * (s.a + s.c) * (s.b + s.d);
    const chi = den > 0 ? n * Math.pow(s.a * s.d - s.b * s.c, 2) / den : 0;
    return [
      {k: '样本容量 n', v: String(n)},
      {k: 'χ² 统计量', v: fmt(chi, 2), hi: true},
      {k: '临界值 χ²₀.₀₅', v: '3.841'},
      {k: '临界值 χ²₀.₀₁', v: '6.635'},
      {k: '结论', v: chi >= 3.841 ? '认为有关' : '不能认为有关', hi: chi >= 3.841}
    ];
  },
  panel(el) {
    const s = this.state;
    addSlider(el, '男生 · 喜欢 a', 6, 48, 1, s.a, function (v) { return String(v); }, function (v) { s.a = v; });
    addSlider(el, '男生 · 不喜欢 b', 6, 48, 1, s.b, function (v) { return String(v); }, function (v) { s.b = v; });
    addSlider(el, '女生 · 喜欢 c', 6, 48, 1, s.c, function (v) { return String(v); }, function (v) { s.c = v; });
    addSlider(el, '女生 · 不喜欢 d', 6, 48, 1, s.d, function (v) { return String(v); }, function (v) { s.d = v; });
    addBtn(el, '载入教材数据', function () { this.reset(); buildPanel(); }.bind(this), 'ghost');
  }
});

const P5 = [[1, 22], [2, 33], [3, 36], [4, 48], [5, 53], [6, 67], [7, 70], [8, 83]]
  .map(function (p) { return {x: p[0], y: p[1]}; });

/* ---------- 05 统计案例：预测 ---------- */
MODULES.push({
  key: 'case', tab: '05', name: '统计案例', en: 'CASE STUDY', blurb: '回归预测',
  accent: '#ff8fab', rgb: '255,143,171',
  hint: '移动预测点 x₀，比较预测值与样本实际值',
  state: {pts: P5.map(function (p) { return {x: p.x, y: p.y}; }), x0: 6, showResid: true, showLine: true},
  reset() {
    this.state.pts = P5.map(function (p) { return {x: p.x, y: p.y}; });
    this.state.x0 = 6;
    this.state.showResid = true;
    this.state.showLine = true;
  },
  meta() {
    return {
      title: '统计案例：用回归方程预测',
      desc: '把回归方程用于预测：给定 x₀，代入 ŷ = b̂x₀ + â 就得到预测值。移动 x₀，比较不同位置上的预测值与样本实际值，注意样本范围之外的预测要谨慎。',
      formula: 'ŷ = b̂x + â<br>e = y − ŷ',
      note: '回归直线经过样本中心，但单个样本点通常不在直线上；|e| 越小，预测越贴近实际。'
    };
  },
  handles() { return []; },
  draw() {
    setFrame(.5, .5, 12.4);
    const L = lim();
    const s = this.state, st = stat(s.pts);
    const x0 = s.x0, yh = st.a + st.b * x0;

    const gx0 = L.x0 + 1.0, gx1 = L.x1 - .8;
    const gy0 = L.y0 + .8, gy1 = L.y1 - .65;
    const PX = function (x) { return gx0 + (gx1 - gx0) * x / 10; };
    const PY = function (y) { return gy0 + (gy1 - gy0) * y / 95; };
    const axc = 'rgba(200,225,235,.42)';

    for (let i = 0; i <= 10; i++) {
      line({x: PX(i), y: gy0}, {x: PX(i), y: gy1}, 'rgba(190,215,225,.06)', {w: 1});
    }
    for (let j = 0; j <= 9; j++) {
      line({x: gx0, y: PY(j * 10)}, {x: gx1, y: PY(j * 10)}, 'rgba(190,215,225,.06)', {w: 1});
    }

    line({x: PX(0), y: gy0}, {x: PX(10.45), y: gy0}, axc, {w: 1.2});
    line({x: PX(0), y: gy0 - .22}, {x: PX(0), y: PY(96)}, axc, {w: 1.2});
    arrow({x: PX(9.9), y: gy0}, {x: PX(10.45), y: gy0}, axc, {w: 1.2, head: 7});
    arrow({x: PX(0), y: PY(92)}, {x: PX(0), y: PY(96)}, axc, {w: 1.2, head: 7});

    for (let i = 0; i <= 10; i++) {
      line({x: PX(i), y: gy0 - .07}, {x: PX(i), y: gy0 + .07}, axc, {w: 1});
      sans(String(i), X(PX(i)), Y(gy0) + 12, 'rgba(160,190,205,.6)', 8.5);
    }
    for (let j = 1; j <= 9; j++) {
      line({x: PX(0) - .07, y: PY(j * 10)}, {x: PX(0) + .07, y: PY(j * 10)}, axc, {w: 1});
      sans(String(j * 10), X(PX(0)) - 8, Y(PY(j * 10)), 'rgba(160,190,205,.6)', 8.5, 'right');
    }
    sans('广告费 x / 万元', X(PX(10.2)), Y(gy0) + 30, 'rgba(175,205,215,.8)', 10.5, 'right');
    sans('销售额 y / 万元', X(PX(0)) + 10, Y(PY(93)) + 2, 'rgba(175,205,215,.8)', 10.5, 'left');

    line({x: PX(.3), y: PY(st.a + st.b * .3)}, {x: PX(9.7), y: PY(st.a + st.b * 9.7)}, '#ff8fab', {w: 2.6});
    s.pts.forEach(function (p) { dot({x: PX(p.x), y: PY(p.y)}, '#ffd0dd', 4.2); });

    if (s.showLine) {
      line({x: PX(x0), y: gy0}, {x: PX(x0), y: PY(yh)}, 'rgba(255,197,107,.4)', {w: 1.2, dash: [4, 4]});
    }
    dot({x: PX(x0), y: PY(yh)}, '#ffc56b', 6);
    ring({x: PX(x0), y: PY(yh)}, 'rgba(255,197,107,.55)', 10);
    if (x0 > 8) {
      sans('ŷ = ' + fmt(yh, 2), X(PX(x0)) - 14, Y(PY(yh)) + 18, '#ffd99a', 11, 'right');
    } else {
      sans('ŷ = ' + fmt(yh, 2), X(PX(x0)) + 14, Y(PY(yh)) + 18, '#ffd99a', 11, 'left');
    }

    let act = null;
    s.pts.forEach(function (p) { if (Math.abs(p.x - x0) < .26) act = p; });
    if (act) {
      ring({x: PX(act.x), y: PY(act.y)}, '#7be0c0', 7);
      sans('实际 ' + fmt(act.y, 2), X(PX(act.x)) + 13, Y(PY(act.y)) - 14, 'rgba(150,240,215,.95)', 10.5, 'left');
      if (s.showResid && Math.abs(act.y - yh) > .02) {
        line({x: PX(act.x), y: PY(yh)}, {x: PX(act.x), y: PY(act.y)}, 'rgba(190,255,235,.7)', {w: 1.6, dash: [4, 3]});
        if (Math.abs(act.y - yh) > .35) {
          sans('e = ' + fmt(act.y - yh, 2), X(PX(act.x)) + 14, Y(PY((act.y + yh) / 2)), 'rgba(190,255,235,.9)', 10, 'left');
        }
      }
    }
    if (x0 > 8.01) {
      sans('x₀ 超出样本范围（外推）', X(PX(.15)), Y(PY(76)), 'rgba(255,180,190,.9)', 10.5, 'left');
    }

    math('ŷ = ' + fmt(st.b, 2) + 'x ' + (st.a >= 0 ? '+ ' : '− ') + fmt(Math.abs(st.a), 2),
      X(PX(.15)), Y(PY(92)), '#ffb3c6', 17, 'left');
    sans('r = ' + fmt(st.r, 3), X(PX(.15)), Y(PY(86)), 'rgba(255,190,205,.8)', 10.5, 'left');
  },

  hud() {
    const s = this.state, st = stat(s.pts);
    const yh = st.a + st.b * s.x0;
    let act = null;
    s.pts.forEach(function (p) { if (Math.abs(p.x - s.x0) < .26) act = p; });
    return [
      {k: '斜率 b̂', v: fmt(st.b, 3)},
      {k: '预测点 x₀', v: fmt(s.x0, 1), hi: true},
      {k: '预测值 ŷ', v: fmt(yh, 2), hi: true},
      {k: '实际值 y', v: act ? fmt(act.y, 2) : '无样本'},
      {k: '残差 y − ŷ', v: act ? fmt(act.y - yh, 2) : '—'}
    ];
  },
  panel(el) {
    const s = this.state, self = this;
    addSlider(el, '预测点 x₀（万元）', 1, 9, .5, s.x0, function (v) { return v.toFixed(1); }, function (v) { s.x0 = v; });
    addToggle(el, '显示预测辅助线', s.showLine, function (v) { s.showLine = v; });
    addToggle(el, '显示残差线段', s.showResid, function (v) { s.showResid = v; });
    addBtn(el, '恢复默认数据', function () { self.reset(); buildPanel(); }, 'ghost');
  }
});

})();
