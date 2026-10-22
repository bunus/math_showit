/* ============================================================
   选择性必修第三册 · 第 6 章 计数原理
   分类加法与分步乘法 / 排列 / 组合 / 二项式定理 / 杨辉三角
   ============================================================ */
(function () {

/* ---------- 工具 ---------- */
function fact(n) { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }
function perm(n, m) { let r = 1; for (let i = 0; i < m; i++) r *= (n - i); return r; }
function comb(n, k) {
  if (k < 0 || k > n) return 0;
  return Math.round(fact(n) / (fact(k) * fact(n - k)));
}
function allCombos(n, m) {
  const out = [], cur = [];
  (function rec(st) {
    if (cur.length === m) { out.push(cur.slice()); return; }
    for (let i = st; i <= n - (m - cur.length); i++) { cur.push(i); rec(i + 1); cur.pop(); }
  })(0);
  return out;
}
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
function sup(v) {
  v = Math.max(0, Math.round(v));
  return String(v).split('').map(d => SUP[+d] || '').join('');
}
function ring(c, r, color, w, dash) {
  ctx.save();
  ctx.beginPath(); ctx.arc(X(c.x), Y(c.y), r * V.k, 0, TAU);
  ctx.strokeStyle = color; ctx.lineWidth = w || 1.5;
  if (dash) ctx.setLineDash(dash);
  ctx.stroke(); ctx.restore();
}
function fillCircle(c, r, color) {
  ctx.save();
  ctx.beginPath(); ctx.arc(X(c.x), Y(c.y), r * V.k, 0, TAU);
  ctx.fillStyle = color; ctx.fill(); ctx.restore();
}
function barAt(cx, y0, h, w, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(X(cx) - w * V.k / 2, Y(y0 + h), w * V.k, Math.max(1, h * V.k));
  ctx.restore();
}

/* ---------- 01 分类加法与分步乘法 ---------- */
MODULES.push({
  key: 'rules', tab: '01', name: '两个计数原理', en: 'RULES', blurb: '分类相加 · 分步相乘',
  accent: '#5eead4', rgb: '94,234,212',
  hint: '拖动换乘点乙，调节两段的路数，观察相乘',
  state: {a: 3, b: 4, hub: {x: 0, y: .9}, direct: true},
  reset() {
    const s = this.state;
    s.a = 3; s.b = 4; s.hub = {x: 0, y: .9}; s.direct = true;
  },
  meta() {
    return {
      title: '分类相加，分步相乘',
      desc: '从甲地到丙地，若必须经乙地中转，就要分两步走：甲到乙有 a 种走法，乙到丙有 b 种走法，由<b>分步乘法</b>原理共有 a×b 种。若还有不经乙的走法，则同一类内部相乘、不同类之间相加。',
      formula: '分类：N = m₁ + m₂ + …<br>分步：N = m₁ × m₂ × …',
      note: '拖动乙点可改变中转位置，两条滑动条改变两段的路数。判断用加法还是乘法：<span class="nw">一步就能完成 → 加法</span>，<span class="nw">必须分步完成 → 乘法</span>。'
    };
  },
  handles() { return [{id: 'hub', x: this.state.hub.x, y: this.state.hub.y}]; },
  drag(id, p) {
    const q = clampPt(p);
    this.state.hub = {x: clamp(q.x, -1.5, 1.5), y: clamp(q.y, -.5, 1.9)};
  },
  draw() {
    setFrame(.5, .58, 13);
    base();
    const s = this.state, a = s.a, b = s.b;
    const P = {x: -4.85, y: .9}, Q = {x: 4.85, y: .9}, M = s.hub;

    const dP = len2(M.x - P.x, M.y - P.y) || 1;
    const n1 = {x: -(M.y - P.y) / dP, y: (M.x - P.x) / dP};
    const dQ = len2(Q.x - M.x, Q.y - M.y) || 1;
    const n2 = {x: -(Q.y - M.y) / dQ, y: (Q.x - M.x) / dQ};

    // 不经乙的两条路线（类②）
    if (s.direct) {
      for (let i = 0; i < 2; i++) {
        const w1 = {x: -1.9 - i * .5, y: -1.45 - i * .55};
        const w2 = {x: 1.9 + i * .5, y: -1.45 - i * .55};
        arrow(P, w1, 'rgba(255,197,107,.34)', {w: 1.5, dash: [6, 5], head: 6});
        arrow(w1, w2, 'rgba(255,197,107,.34)', {w: 1.5, dash: [6, 5], head: 6});
        arrow(w2, Q, 'rgba(255,197,107,.34)', {w: 1.5, dash: [6, 5], head: 6});
      }
      sans('类②：不经乙，共 2 种', X(0), Y(-2.5), 'rgba(255,215,150,.85)', 11);
    }

    // 甲→乙
    for (let i = 0; i < a; i++) {
      const off = (i - (a - 1) / 2) * .16;
      const e = {x: M.x + n1.x * off, y: M.y + n1.y * off};
      arrow(P, e, 'rgba(94,234,212,' + (.30 + .34 / a) + ')', {w: 1.8, head: 6, glow: 4});
    }
    // 乙→丙
    for (let i = 0; i < b; i++) {
      const off = (i - (b - 1) / 2) * .16;
      const st = {x: M.x + n2.x * off, y: M.y + n2.y * off};
      arrow(st, Q, 'rgba(108,182,255,' + (.26 + .3 / b) + ')', {w: 1.8, head: 6, glow: 4});
    }

    segLabel(P, M, a + ' 种', 'rgba(150,240,220,.95)', .42, 16, 11.5);
    segLabel(M, Q, b + ' 种', 'rgba(160,205,255,.95)', .58, 16, 11.5);

    dot(P, '#8ff5e4', 6); dot(Q, '#8ff5e4', 6);
    sans('甲', X(P.x) - 26, Y(P.y), 'rgba(190,230,225,.9)', 13);
    sans('丙', X(Q.x) + 26, Y(Q.y), 'rgba(190,230,225,.9)', 13);
    sans('乙', X(M.x), Y(M.y) + 22, '#8ff5e4', 13);
    handle(M, '#5eead4', hoverId === 'hub');

    math(a + ' × ' + b + ' = ' + (a * b), X(0), Y(3.25), '#8ff5e4', 20);
    sans('类①：先甲→乙，再乙→丙', X(0), Y(2.72), 'rgba(170,215,215,.75)', 10.5);
    const total = a * b + (s.direct ? 2 : 0);
    sans('全部走法：' + (s.direct ? (a * b) + ' + 2 = ' + total : String(a * b)) + ' 种',
      X(0), Y(-3.15), '#ffd99a', 12.5);
  },
  hud() {
    const s = this.state;
    return [
      {k: '甲→乙 的走法', v: s.a + ' 种'},
      {k: '乙→丙 的走法', v: s.b + ' 种'},
      {k: '经乙：a×b', v: String(s.a * s.b), hi: true},
      {k: '不经乙', v: s.direct ? '2 种' : '未计入'},
      {k: '总走法', v: String(s.a * s.b + (s.direct ? 2 : 0)), hi: true}
    ];
  },
  panel(el) {
    const s = this.state;
    addSlider(el, '甲→乙 的走法数 a', 2, 5, 1, s.a, v => String(v), v => s.a = Math.round(v));
    addSlider(el, '乙→丙 的走法数 b', 2, 6, 1, s.b, v => String(v), v => s.b = Math.round(v));
    addToggle(el, '计入不经乙的 2 种走法', s.direct, v => s.direct = v);
    const r = row(el);
    addBtn(r, '拖动或恢复乙的位置', () => { s.hub = {x: 0, y: .9}; }, 'ghost');
  }
});

/* ---------- 02 排列 ---------- */
MODULES.push({
  key: 'arrange', tab: '02', name: '排列', en: 'PERMUTATION', blurb: '排队与 A(n,m)',
  accent: '#6cb6ff', rgb: '108,182,255',
  hint: '调节人数与位数，点“安排下一位”填座',
  state: {n: 5, m: 3, picked: [], tree: true},
  reset() { const s = this.state; s.n = 5; s.m = 3; s.picked = []; s.tree = true; },
  meta() {
    return {
      title: '排列：顺序不同就是不同的排法',
      desc: '把 n 个不同的人安排到 m 个位置：第 1 个位置有 n 种选法，第 2 个位置只剩 n−1 种，依次递减。由分步乘法原理，排法总数为 <b>n(n−1)…(n−m+1)</b>，记作 <b>A(n,m)</b>。',
      formula: 'A(n,m) = n(n−1)…(n−m+1) = n! / (n−m)!',
      note: '每点一次按钮，可选人数就少 1。下方示意只展开一条代表性分支，每层旁的“n 种”表示该步的可选个数。<i>交换两个人的位置会得到新的排列</i>，所以排列与顺序有关。'
    };
  },
  draw() {
    setFrame(.5, .52, 13);
    base();
    const s = this.state, n = s.n, m = s.m, k = s.picked.length;
    const nA = perm(n, m);

    // 座位
    const sx0 = -5.15, gap = 1.45, bw = 1.06;
    for (let i = 0; i < m; i++) {
      const cx = sx0 + i * gap;
      const filled = i < k;
      const col = filled ? '#6cb6ff' : 'rgba(150,180,205,.45)';
      const yc = 2.72, hh = .5;
      line({x: cx - bw / 2, y: yc - hh}, {x: cx + bw / 2, y: yc - hh}, col, {w: 1.5, dash: filled ? null : [5, 4]});
      line({x: cx - bw / 2, y: yc + hh}, {x: cx + bw / 2, y: yc + hh}, col, {w: 1.5, dash: filled ? null : [5, 4]});
      line({x: cx - bw / 2, y: yc - hh}, {x: cx - bw / 2, y: yc + hh}, col, {w: 1.5, dash: filled ? null : [5, 4]});
      line({x: cx + bw / 2, y: yc - hh}, {x: cx + bw / 2, y: yc + hh}, col, {w: 1.5, dash: filled ? null : [5, 4]});
      if (filled) math(String(s.picked[i]), X(cx), Y(yc), '#cfe6ff', 19);
      else math('?', X(cx), Y(yc), 'rgba(140,170,200,.45)', 17);
      sans('第 ' + (i + 1) + ' 位', X(cx), Y(yc + .78), 'rgba(150,185,215,.6)', 9.5);
      sans((n - i) + ' 种', X(cx), Y(yc - .88), i === k ? '#8fc6ff' : 'rgba(150,185,215,.55)', 11);
    }

    // 递减因子链
    const fs = [];
    for (let i = 0; i < m; i++) fs.push(n - i);
    math('A(' + n + ',' + m + ') = ' + (m > 1 ? fs.join(' × ') + ' = ' + nA : String(nA)),
      X(0), Y(1.25), '#a9d4ff', 17);
    sans('分步选择，每步少一种', X(0), Y(.72), 'rgba(150,185,215,.65)', 10);

    // 树状图
    if (s.tree) {
      const yc = -2.0, st = .33;
      const root = {x: -5.9, y: yc};
      dot(root, 'rgba(108,182,255,.85)', 4);
      for (let L = 1; L <= m; L++) {
        const cnt = n - L + 1;
        const x = -4.4 + (L - 1) * 1.5;
        const span = (cnt - 1) * st;
        let parent = root;
        if (L > 1) parent = {x: -4.4 + (L - 2) * 1.5, y: yc + (n - L + 1) * st / 2};
        if (L > 1) dot(parent, 'rgba(255,217,154,.9)', 4);
        for (let i = 0; i < cnt; i++) {
          const p = {x: x, y: yc + span / 2 - i * st};
          line(parent, p, 'rgba(108,182,255,.22)', {w: 1});
          dot(p, L === m ? 'rgba(108,182,255,.95)' : 'rgba(150,195,240,.7)', 3.4);
        }
        sans(String(cnt) + ' 种', X(x), Y(yc - span / 2 - .42), 'rgba(150,185,215,.6)', 9.5);
      }
      sans('只展开一条代表性分支 · 每层可选数依次减少', X(-1.2), Y(-3.7), 'rgba(150,185,215,.55)', 9.5);
    }
  },
  hud() {
    const s = this.state;
    return [
      {k: '人数 n', v: String(s.n)},
      {k: '位数 m', v: String(s.m)},
      {k: 'A(n,m)', v: String(perm(s.n, s.m)), hi: true},
      {k: '已排', v: s.picked.length + ' / ' + s.m},
      {k: '剩余可选', v: String(s.n - s.picked.length)}
    ];
  },
  panel(el) {
    const s = this.state;
    const mS = addSlider(el, '人数 n', 3, 6, 1, s.n, v => String(v), v => {
      s.n = Math.round(v);
      mS.input.max = s.n;
      if (s.m > s.n) { s.m = s.n; mS.set(s.m); }
      s.picked = s.picked.filter(x => x <= s.n);
    });
    addSlider(el, '位数 m', 1, s.n, 1, s.m, v => String(v), v => {
      s.m = Math.round(v);
      s.picked = s.picked.slice(0, s.m);
    });
    addToggle(el, '显示树状图', s.tree, v => s.tree = v);
    const r = row(el);
    addBtn(r, '安排下一位', () => {
      if (s.picked.length >= s.m) return;
      const used = new Set(s.picked);
      const pool = [];
      for (let i = 1; i <= s.n; i++) if (!used.has(i)) pool.push(i);
      s.picked.push(pool[Math.floor(Math.random() * pool.length)]);
    });
    addBtn(r, '清空', () => { s.picked = []; }, 'ghost');
  }
});

/* ---------- 03 组合 ---------- */
MODULES.push({
  key: 'pick', tab: '03', name: '组合', en: 'COMBINATION', blurb: '只选不排 C(n,m)',
  accent: '#ff8fab', rgb: '255,143,171',
  hint: '滑动调节 n 与 m，点“下一组”遍历所有组合',
  state: {n: 5, m: 2, idx: 0, all: true},
  reset() { const s = this.state; s.n = 5; s.m = 2; s.idx = 0; s.all = true; },
  meta() {
    return {
      title: '组合：只问取哪些，不问顺序',
      desc: '从 n 个不同元素中取出 m 个，不计先后，得到<b>组合</b>。若按顺序取有 A(n,m) 种，而每种组合内部的 m! 种顺序都被重复计算，故 C(n,m) = A(n,m) / m!。',
      formula: 'C(n,m) = A(n,m) / m! = n! / (m!(n−m)!)',
      note: '点“下一组”会按字典序走遍所有组合，右下角编号与总数一致。<i>交换取出的元素顺序仍是同一组合</i>，这正是组合与排列的区别。'
    };
  },
  draw() {
    setFrame(.5, .56, 13);
    base();
    const s = this.state, n = s.n, m = s.m;
    const list = allCombos(n, m);
    const idx = clamp(s.idx, 0, list.length - 1);
    const sel = list[idx];

    const gap = 1.15, x0 = -(n - 1) * gap / 2, yc = 2.55;
    for (let i = 0; i < n; i++) {
      const c = {x: x0 + i * gap, y: yc};
      const on = sel.indexOf(i) >= 0;
      if (on) {
        fillCircle(c, .34, 'rgba(255,143,171,.18)');
        ring(c, .34, '#ff8fab', 2.2);
        math(String(i + 1), X(c.x), Y(c.y), '#ffd3de', 16);
        line({x: c.x, y: yc + .55}, {x: c.x, y: yc + .78}, 'rgba(255,143,171,.5)', {w: 1.2});
      } else {
        ring(c, .34, 'rgba(180,195,215,.32)', 1.4, [4, 4]);
        math(String(i + 1), X(c.x), Y(c.y), 'rgba(185,200,215,.55)', 15);
      }
    }
    sans('取出 ' + m + ' 个，顺序不算', X(0), Y(3.35), 'rgba(255,190,205,.85)', 10.5);

    const np = perm(n, m), nc = comb(n, m);
    math('C(' + n + ',' + m + ') = A(' + n + ',' + m + ') ÷ ' + m + '! = ' + np + ' ÷ ' + fact(m) + ' = ' + nc,
      X(0), Y(1.55), '#ffb3c6', 15);
    sans('先按顺序取 ' + np + ' 种，每种组合被重复算了 ' + fact(m) + ' 次', X(0), Y(1.0),
      'rgba(210,175,190,.7)', 10);

    if (s.all) {
      const per = 5, cw = 2.2, ch = .56;
      const rows = Math.ceil(list.length / per);
      const gx0 = -(per - 1) * cw / 2, gy0 = -.2;
      list.forEach((c, i2) => {
        const r2 = Math.floor(i2 / per), c2 = i2 % per;
        const px = gx0 + c2 * cw, py = gy0 - r2 * ch;
        const on = i2 === idx;
        if (on) {
          ctx.save();
          ctx.fillStyle = 'rgba(255,143,171,.16)';
          ctx.fillRect(X(px) - cw * V.k * .36, Y(py) - 11, cw * V.k * .72, 22);
          ctx.restore();
        }
        sans('{' + c.map(v => v + 1).join(',') + '}', X(px), Y(py),
          on ? '#ffd3de' : 'rgba(190,195,215,.55)', on ? 11 : 10);
      });
      sans('共 ' + list.length + ' 种组合（第 ' + (idx + 1) + ' 组高亮）',
        X(0), Y(gy0 - rows * ch - .15), 'rgba(210,175,190,.7)', 10);
    }
  },
  hud() {
    const s = this.state;
    return [
      {k: 'n', v: String(s.n)},
      {k: 'm', v: String(s.m)},
      {k: 'A(n,m)', v: String(perm(s.n, s.m))},
      {k: 'm!', v: String(fact(s.m))},
      {k: 'C(n,m)', v: String(comb(s.n, s.m)), hi: true}
    ];
  },
  panel(el) {
    const s = this.state;
    const mS = addSlider(el, '总数 n', 3, 6, 1, s.n, v => String(v), v => {
      s.n = Math.round(v);
      mS.input.max = s.n;
      if (s.m > s.n) { s.m = s.n; mS.set(s.m); }
      s.idx = 0;
    });
    addSlider(el, '取出 m', 1, s.n, 1, s.m, v => String(v), v => { s.m = Math.round(v); s.idx = 0; });
    addToggle(el, '列举全部组合', s.all, v => s.all = v);
    const r = row(el);
    const total = () => allCombos(s.n, s.m).length;
    addBtn(r, '上一组', () => { s.idx = (s.idx - 1 + total()) % total(); });
    addBtn(r, '下一组', () => { s.idx = (s.idx + 1) % total(); });
  }
});

/* ---------- 04 二项式定理 ---------- */
MODULES.push({
  key: 'binomial', tab: '04', name: '二项式定理', en: 'BINOMIAL', blurb: '系数 C(n,k)',
  accent: '#b49cff', rgb: '180,156,255',
  hint: '滑动改变指数 n，观察各项系数的变化',
  state: {n: 4, showV: true, mark: true},
  reset() { const s = this.state; s.n = 4; s.showV = true; s.mark = true; },
  meta() {
    return {
      title: '二项展开式的系数',
      desc: '把 (a+b)ⁿ 逐项乘开，含 k 个 b 的项一共有 C(n,k) 个，合并同类项后其系数就是 <b>C(n,k)</b>。系数左右对称、中间最大，全部系数之和等于 2ⁿ。',
      formula: '(a+b)<sup>n</sup> = Σ<sub>k=0</sub><sup>n</sup> C(n,k)·a<sup>n−k</sup>b<sup>k</sup>',
      note: '拖动滑动条增大 n，条形图逐行变高、变宽，形状始终先增后减且左右对称。<i>第 k+1 项</i>的二项式系数就是 C(n,k)，注意与“系数”区分（含 a、b 自身系数时不同）。'
    };
  },
  draw() {
    setFrame(.5, .56, 13);
    base();
    const s = this.state, n = s.n;
    const gap = Math.min(1.34, 10.4 / (n + 1));
    const bw = Math.min(.78, gap * .58);
    const yB = -1.05, H0 = 2.35;
    const mx = comb(n, Math.floor(n / 2));
    const unit = H0 / mx;
    const x0 = -n * gap / 2;

    line({x: -6.1, y: yB}, {x: 6.1, y: yB}, 'rgba(200,225,235,.32)', {w: 1.3});

    for (let k = 0; k <= n; k++) {
      const c = comb(n, k), h = c * unit, cx = x0 + k * gap;
      const hot = s.mark && c === mx;
      barAt(cx, yB, h, bw, hot ? 'rgba(255,197,107,.82)' : 'rgba(180,156,255,.62)');
      line({x: cx - bw / 2, y: yB}, {x: cx - bw / 2, y: yB + h}, hot ? 'rgba(255,197,107,.95)' : 'rgba(180,156,255,.9)', {w: 1.2});
      line({x: cx + bw / 2, y: yB}, {x: cx + bw / 2, y: yB + h}, hot ? 'rgba(255,197,107,.95)' : 'rgba(180,156,255,.9)', {w: 1.2});
      if (s.showV) sans(String(c), X(cx), Y(yB + h) - 11, hot ? '#ffd99a' : 'rgba(215,205,255,.92)', 10.5);
      math('a' + sup(n - k) + 'b' + sup(k), X(cx), Y(yB) + 24, hot ? 'rgba(255,215,150,.9)' : 'rgba(195,185,240,.72)', 11);
    }

    math('(a+b)' + sup(n), X(0), Y(2.95), '#d8caff', 20);
    sans('展开共 ' + (n + 1) + ' 项 · 系数和 2' + sup(n) + ' = ' + Math.pow(2, n),
      X(0), Y(2.4), 'rgba(205,195,245,.75)', 10.5);
    sans('每一根柱子是一项的二项式系数 C(n,k)', X(0), Y(-3.15), 'rgba(205,195,245,.55)', 10);
  },
  hud() {
    const s = this.state;
    const n = s.n, mx = comb(n, Math.floor(n / 2));
    return [
      {k: '指数 n', v: String(n)},
      {k: '项数 n+1', v: String(n + 1)},
      {k: '系数和 2ⁿ', v: String(Math.pow(2, n))},
      {k: '最大系数', v: String(mx), hi: true},
      {k: '取到最大的 k', v: n % 2 ? '⌊n/2⌋ 与 ⌈n/2⌉' : String(n / 2)}
    ];
  },
  panel(el) {
    const s = this.state;
    addSlider(el, '指数 n', 1, 7, 1, s.n, v => String(v), v => s.n = Math.round(v));
    addToggle(el, '显示系数数值', s.showV, v => s.showV = v);
    addToggle(el, '高亮最大系数', s.mark, v => s.mark = v);
  }
});

/* ---------- 05 杨辉三角 ---------- */
MODULES.push({
  key: 'pascal', tab: '05', name: '杨辉三角', en: 'PASCAL', blurb: '对称与最大',
  accent: '#ffc56b', rgb: '255,197,107',
  hint: '上下拖动行标签切换行，观察对称与最大值',
  state: {N: 7, row: 5, sym: true, gen: false},
  reset() { const s = this.state; s.N = 7; s.row = 5; s.sym = true; s.gen = false; },
  meta() {
    return {
      title: '杨辉三角：二项式系数的排列',
      desc: '把 C(r,k) 按行排成三角形，就得到杨辉三角。第 r 行有 r+1 个数，左右对称、中间最大，每行之和为 2ʳ，并且每个数都等于它肩上两个数之和。',
      formula: 'C(r,k) = C(r,r−k)<br>C(r,k) = C(r−1,k−1) + C(r−1,k)',
      note: '拖动左侧圆点上下移动可换行。打开“对称连线”看首尾配对，打开“肩上两数”看递推关系。<i>r 为偶数时中间一个数最大，r 为奇数时中间两个数并列最大。</i>'
    };
  },
  handles() {
    const s = this.state;
    const step = s.N >= 7 ? .56 : .64;
    const sx = Math.min(1.25, 9.0 / (s.N + 1));
    return [{id: 'row', x: -(s.row / 2) * sx - sx * 1.05, y: 3.1 - s.row * step}];
  },
  drag(id, p) {
    const s = this.state, q = clampPt(p);
    const step = s.N >= 7 ? .56 : .64;
    s.row = clamp(Math.round((3.1 - q.y) / step), 0, s.N);
  },
  draw() {
    setFrame(.5, .5, 13);
    base();
    const s = this.state, N = s.N, row = Math.min(s.row, N);
    const step = N >= 7 ? .56 : .64;
    const sx = Math.min(1.25, 9.0 / (N + 1));
    const yTop = 3.1;
    const rowY = r => yTop - r * step;
    const cellX = (r, k) => (k - r / 2) * sx;

    // 选中行的底纹
    ctx.save();
    ctx.fillStyle = 'rgba(255,197,107,.10)';
    ctx.fillRect(X(cellX(row, 0)) - sx * V.k * .62, Y(rowY(row)) - 13,
      sx * V.k * row + sx * V.k * 1.24, 26);
    ctx.restore();

    // 肩上两数
    if (s.gen && row > 0) {
      for (let k = 0; k <= row; k++) {
        const p = {x: cellX(row, k), y: rowY(row)};
        if (k - 1 >= 0) line({x: cellX(row - 1, k - 1), y: rowY(row - 1)}, p, 'rgba(255,197,107,.34)', {w: 1});
        if (k <= row - 1) line({x: cellX(row - 1, k), y: rowY(row - 1)}, p, 'rgba(255,197,107,.22)', {w: 1});
      }
    }

    // 三角形
    for (let r = 0; r <= N; r++) {
      const on = r === row;
      for (let k = 0; k <= r; k++) {
        const v = comb(r, k);
        const isMax = v === comb(r, Math.floor(r / 2));
        const c = {x: cellX(r, k), y: rowY(r)};
        math(String(v), X(c.x), Y(c.y),
          on ? (isMax ? '#ffe2a8' : '#ffe9c4') : 'rgba(200,215,225,.52)', on ? 12.5 : 10.5);
        if (on && isMax) ring(c, .27, 'rgba(255,197,107,.85)', 1.3);
      }
    }

    // 对称连线
    if (s.sym && row >= 2) {
      for (let k = 0; k < row - k; k++) {
        const a = {x: cellX(row, k), y: rowY(row) + .26};
        const b = {x: cellX(row, row - k), y: rowY(row) + .26};
        const apex = {x: (a.x + b.x) / 2, y: rowY(row) + .26 + .10 + Math.abs(b.x - a.x) * .03};
        line(a, apex, 'rgba(255,197,107,.42)', {w: 1.1, dash: [4, 4]});
        line(apex, b, 'rgba(255,197,107,.42)', {w: 1.1, dash: [4, 4]});
      }
      sans('对称：C(' + row + ',k) = C(' + row + ',' + row + '−k)',
        X(-6.0), Y(2.95), 'rgba(255,215,150,.75)', 10, 'left');
    }

    // 行标签与手柄
    sans('r = ' + row, X(cellX(row, 0)) - sx * V.k * .62 - 26, Y(rowY(row)), '#ffd99a', 11);
    handle({x: -(row / 2) * sx - sx * 1.05, y: rowY(row)}, '#ffc56b', hoverId === 'row');

    sans('第 ' + row + ' 行 · 共 ' + (row + 1) + ' 个数 · 和为 2' + sup(row) + ' = ' + Math.pow(2, row),
      X(0), Y(-3.85), 'rgba(215,200,175,.7)', 10.5);
  },
  hud() {
    const s = this.state, row = Math.min(s.row, s.N);
    return [
      {k: '选中行 r', v: String(row), hi: true},
      {k: '该行系数个数', v: String(row + 1)},
      {k: '该行系数和', v: String(Math.pow(2, row))},
      {k: '最大系数', v: String(comb(row, Math.floor(row / 2)))},
      {k: '对称对数', v: String(Math.floor((row + 1) / 2))}
    ];
  },
  panel(el) {
    const s = this.state;
    const rS = addSlider(el, '最大行号 N', 3, 8, 1, s.N, v => String(v), v => {
      s.N = Math.round(v);
      if (s.row > s.N) { s.row = s.N; rS.input.max = s.N; rS.set(s.row); }
    });
    addSlider(el, '选中行 r', 0, s.N, 1, s.row, v => String(v), v => s.row = Math.round(v));
    addToggle(el, '对称连线 C(r,k) = C(r,r−k)', s.sym, v => s.sym = v);
    addToggle(el, '肩上两数相加', s.gen, v => s.gen = v);
  }
});

})();
