/* ============================================================
   必修第一册 · 第 1 章 集合与常用逻辑用语
   ============================================================ */
(function () {

const A = [-3, -1.5, .5, 2.5];

function circle(c, r, color, fill, opt) {
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
function inCircle(p, c, r) {
  return len2(p.x - c.x, p.y - c.y) <= r + 1e-6;
}

/* ---------- 01 集合的含义与表示 ---------- */
MODULES.push({
  key: 'meaning', tab: '01', name: '集合的含义', en: 'SETS', blurb: '元素与集合',
  accent: '#5eead4', rgb: '94,234,212',
  hint: '拖动 x 点，观察 x 是否属于集合 A',
  state: {x: 1.2, showList: true},
  reset() { this.state.x = 1.2; this.state.showList = true; },
  meta() {
    return {
      title: '集合：确定的、互异的整体',
      desc: '把一些确定的、彼此不同的对象看成一个整体，就得到集合。集合中的每个对象叫元素。拖动数轴上的 x，观察 <b>x ∈ A</b> 与 <b>x ∉ A</b> 如何切换。',
      formula: 'A = {x | x 具有性质 P(x)}',
      note: '集合中的元素具有<b>确定性</b>、<b>互异性</b>、<b>无序性</b>。列举法写成 <span class="nw">A = {−3, −1.5, 0.5, 2.5}</span>，描述法写成 <span class="nw">{x | x 满足的条件}</span>。'
    };
  },
  handles() { return [{id: 'x', x: this.state.x, y: -1.15}]; },
  drag(id, p) {
    const q = clampPt(p);
    this.state.x = Math.round(q.x * 2) / 2;
  },
  draw() {
    setFrame(.5, .58, 12.5);
    base();
    const s = this.state, L = lim();
    const y = 0;
    line({x: L.x0, y}, {x: L.x1, y}, 'rgba(200,225,235,.4)', {w: 1.5});
    for (let i = Math.ceil(L.x0); i <= Math.floor(L.x1); i++) {
      line({x: i, y: -.12}, {x: i, y: .12}, 'rgba(200,225,235,.35)', {w: 1});
      if (i % 1 === 0) sans(String(i), X(i), Y(-.5), 'rgba(150,175,190,.65)', 10);
    }
    A.forEach(a => {
      line({x: a, y: .1}, {x: a, y: .8}, 'rgba(94,234,212,.28)', {w: 1, dash: [3, 4]});
      dot({x: a, y: 0}, '#5eead4', 5);
    });
    sans('A', X(A[A.length - 1]) + 18, Y(.85), '#8ff5e4', 14);

    const inA = A.some(a => Math.abs(a - s.x) < 1e-6);
    const col = inA ? '#ffc56b' : '#ff8fab';
    line({x: s.x, y: -1.15}, {x: s.x, y: 1.05}, 'rgba(255,255,255,.16)', {w: 1, dash: [4, 5]});
    arrow({x: s.x, y: -1.15}, {x: s.x, y: -.08}, col, {w: 3, glow: 12, head: 10});
    math('x', X(s.x) + 18, Y(-1.05), col, 16);
    handle({x: s.x, y: -1.15}, col, hoverId === 'x');

    math(inA ? 'x ∈ A' : 'x ∉ A', X(s.x), Y(1.65), col, 20);
    sans(inA ? 'x 是集合 A 的元素' : 'x 不是集合 A 的元素', X(s.x), Y(1.2), 'rgba(190,210,220,.75)', 10.5);

    if (s.showList) {
      sans('A = {−3, −1.5, 0.5, 2.5}', X(L.x0 + .4), Y(3.1), 'rgba(160,200,210,.85)', 12, 'left');
    }
  },
  hud() {
    const s = this.state;
    const inA = A.some(a => Math.abs(a - s.x) < 1e-6);
    return [
      {k: 'x', v: fmt(s.x, 1), hi: true},
      {k: '与 A 的关系', v: inA ? 'x ∈ A' : 'x ∉ A', hi: inA},
      {k: '集合 A 的元素个数', v: '4'}
    ];
  },
  panel(el) {
    const s = this.state;
    addToggle(el, '显示列举法表示', s.showList, v => s.showList = v);
    addBtn(el, '随机取一个 x', () => {
      s.x = Math.round((Math.random() * 10 - 5) * 2) / 2;
    }, 'ghost');
  }
});

/* ---------- 02 集合间的基本关系 ---------- */
MODULES.push({
  key: 'subset', tab: '02', name: '集合间关系', en: 'SUBSET', blurb: '子集与真子集',
  accent: '#6cb6ff', rgb: '108,182,255',
  hint: '拖动 B 的圆心、调节半径，观察 A ⊆ B 何时成立',
  state: {b: {x: 1.5, y: .2}, r: 2.1, elems: true},
  reset() { this.state.b = {x: 1.5, y: .2}; this.state.r = 2.1; this.state.elems = true; },
  meta() {
    return {
      title: '子集：A 中的每个元素都在 B 中',
      desc: '若集合 A 的<b>每一个</b>元素都是集合 B 的元素，则称 A 是 B 的子集，记作 <b>A ⊆ B</b>。拖动 B 的圆心或改变半径，观察包含关系的变化。',
      formula: 'A ⊆ B ⇔ 任意 x∈A，都有 x∈B',
      note: '当 A ⊆ B 且存在 B 中的元素不属于 A 时，A 是 B 的<b>真子集</b>，记作 <span class="nw">A ⊊ B</span>。空集是任何集合的子集，也是任何非空集合的真子集。'
    };
  },
  handles() { return [{id: 'b', ...this.state.b}]; },
  drag(id, p) { this.state.b = clampPt(p); },
  draw() {
    setFrame(.5, .55, 12);
    base();
    const s = this.state;
    const Ac = {x: -1.6, y: .1}, Ar = 1.35;
    const Bc = s.b, Br = s.r;
    const subset = len2(Bc.x - Ac.x, Bc.y - Ac.y) + Ar <= Br + .02;
    const proper = subset && Br > Ar + .05;

    circle(Bc, Br, '#6cb6ff', 'rgba(108,182,255,.09)', {w: 2.2});
    circle(Ac, Ar, '#5eead4', 'rgba(94,234,212,.12)', {w: 2.2});
    math('B', X(Bc.x + Br * .72), Y(Bc.y + Br * .72), '#a9d4ff', 18);
    math('A', X(Ac.x - Ar * .55), Y(Ac.y + Ar * .72), '#8ff5e4', 18);

    if (s.elems) {
      const pts = [[-.5, .5], [-2.1, .1], [-1.4, -.8], [-2.3, 1.0], [-.9, -.1]];
      pts.forEach(p => dot(p, subset ? '#8ff5e4' : '#5eead4', 4));
    }

    if (subset) {
      arrow({x: -1.6, y: 2.15}, {x: Bc.x, y: 2.15}, 'rgba(94,234,212,.45)', {w: 1.4, dash: [5, 5], head: 7});
      sans('A ⊆ B', X((Ac.x + Bc.x) / 2), Y(2.4), '#8ff5e4', 14);
      if (proper) sans('真子集', X((Ac.x + Bc.x) / 2), Y(2.0), 'rgba(150,220,210,.7)', 10);
    } else {
      sans('A ⊄ B', X(Bc.x), Y(2.3), '#ff8fab', 14);
    }
    handle(Bc, '#6cb6ff', hoverId === 'b');
  },
  hud() {
    const s = this.state;
    const Ac = {x: -1.6, y: .1}, Ar = 1.35;
    const d = len2(s.b.x - Ac.x, s.b.y - Ac.y);
    const subset = d + Ar <= s.r + .02;
    return [
      {k: 'A 的半径', v: '1.35'},
      {k: 'B 的半径', v: fmt(s.r, 2)},
      {k: '圆心距', v: fmt(d, 2)},
      {k: '关系', v: subset ? (s.r > Ar + .05 ? 'A ⊊ B' : 'A = B') : 'A ⊄ B', hi: subset}
    ];
  },
  panel(el) {
    const s = this.state;
    addSlider(el, '集合 B 的半径', 1.2, 2.8, .05, s.r, v => v.toFixed(2), v => s.r = v);
    addToggle(el, '显示集合中的元素', s.elems, v => s.elems = v);
  }
});

/* ---------- 03 集合的基本运算 ---------- */
MODULES.push({
  key: 'ops', tab: '03', name: '集合的运算', en: 'OPERATIONS', blurb: '交、并、差',
  accent: '#ffc56b', rgb: '255,197,107',
  hint: '拖动 B 圆，切换交集、并集、差集',
  state: {b: {x: 1.4, y: .1}, inter: true, union: false, diff: false},
  reset() { this.state.b = {x: 1.4, y: .1}; this.state.inter = true; this.state.union = false; this.state.diff = false; },
  meta() {
    return {
      title: '交集、并集与差集',
      desc: '两个集合的<b>公共部分</b>是交集，<b>全部元素</b>合起来是并集；从 A 中去掉属于 B 的元素，得到差集。切换高亮，观察区域与元素个数的变化。',
      formula: 'A∩B = {x | x∈A 且 x∈B}',
      note: '并集满足 <span class="nw">A∪B = B∪A</span>，交集也满足交换律。差集 <span class="nw">A\\B = {x | x∈A 且 x∉B}</span> 不满足交换律。'
    };
  },
  handles() { return [{id: 'b', ...this.state.b}]; },
  drag(id, p) { this.state.b = clampPt(p); },
  draw() {
    setFrame(.5, .55, 12);
    base();
    const s = this.state;
    const Ac = {x: -1.3, y: 0}, Ar = 2.0;
    const Bc = s.b, Br = 2.0;
    const ae = {x: -3.4, y: 1.2}, be = {x: -1.2, y: -1.1}, ce = {x: -0.1, y: 1.35}, de = {x: -2.4, y: -.2};
    const ee = {x: 1.7, y: 1.2}, fe = {x: 3.2, y: -.4}, ge = {x: 2.6, y: 1.5}, he = {x: .6, y: -.9};
    const elems = [ae, be, ce, de, ee, fe, ge, he];

    // 高亮
    if (s.union) {
      ctx.save();
      ctx.globalAlpha = .13; ctx.fillStyle = '#5eead4';
      ctx.beginPath(); ctx.arc(X(Ac.x), Y(Ac.y), Ar * V.k, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(X(Bc.x), Y(Bc.y), Br * V.k, 0, TAU); ctx.fill();
      ctx.restore();
    }
    if (s.inter) {
      ctx.save();
      ctx.beginPath(); ctx.arc(X(Ac.x), Y(Ac.y), Ar * V.k, 0, TAU); ctx.clip();
      ctx.beginPath(); ctx.arc(X(Bc.x), Y(Bc.y), Br * V.k, 0, TAU);
      ctx.fillStyle = 'rgba(255,197,107,.24)'; ctx.fill();
      ctx.restore();
    }
    if (s.diff) {
      ctx.save();
      ctx.beginPath(); ctx.arc(X(Ac.x), Y(Ac.y), Ar * V.k, 0, TAU); ctx.clip();
      ctx.beginPath();
      ctx.arc(X(Ac.x), Y(Ac.y), Ar * V.k, 0, TAU);
      ctx.arc(X(Bc.x), Y(Bc.y), Br * V.k, 0, TAU);
      ctx.fillStyle = 'rgba(255,143,171,.24)';
      ctx.fill('evenodd');
      ctx.restore();
    }

    circle(Ac, Ar, 'rgba(108,182,255,.85)', null, {w: 2.2});
    circle(Bc, Br, 'rgba(255,197,107,.85)', null, {w: 2.2});
    math('A', X(Ac.x - Ar * .62), Y(Ac.y + Ar * .7), '#a9d4ff', 18);
    math('B', X(Bc.x + Br * .62), Y(Bc.y + Br * .7), '#ffd99a', 18);

    elems.forEach(p => {
      const inA = inCircle(p, Ac, Ar), inB = inCircle(p, Bc, Br);
      let col = 'rgba(180,200,210,.45)';
      if (inA && inB) col = '#ffc56b';
      else if (inA) col = '#8fbfff';
      else if (inB) col = '#ffcf8f';
      dot(p, col, 4.2);
    });

    const cA = elems.filter(p => inCircle(p, Ac, Ar)).length;
    const cB = elems.filter(p => inCircle(p, Bc, Br)).length;
    const cI = elems.filter(p => inCircle(p, Ac, Ar) && inCircle(p, Bc, Br)).length;
    sans('|A| = ' + cA + '   |B| = ' + cB + '   |A∩B| = ' + cI, X(0), Y(-3.35), 'rgba(170,200,215,.8)', 11);
    handle(Bc, '#ffc56b', hoverId === 'b');
  },
  hud() {
    const s = this.state;
    const Ac = {x: -1.3, y: 0}, Ar = 2.0;
    const elems = [{x: -3.4, y: 1.2}, {x: -1.2, y: -1.1}, {x: -0.1, y: 1.35}, {x: -2.4, y: -.2}, {x: 1.7, y: 1.2}, {x: 3.2, y: -.4}, {x: 2.6, y: 1.5}, {x: .6, y: -.9}];
    const cA = elems.filter(p => inCircle(p, Ac, Ar)).length;
    const cB = elems.filter(p => inCircle(p, s.b, 2.0)).length;
    const cI = elems.filter(p => inCircle(p, Ac, Ar) && inCircle(p, s.b, 2.0)).length;
    return [
      {k: '|A|', v: String(cA)},
      {k: '|B|', v: String(cB)},
      {k: '|A∩B|', v: String(cI), hi: s.inter},
      {k: '|A∪B|', v: String(cA + cB - cI), hi: s.union},
      {k: '|A\\B|', v: String(cA - cI), hi: s.diff}
    ];
  },
  panel(el) {
    const s = this.state;
    addToggle(el, '高亮交集 A∩B', s.inter, v => s.inter = v);
    addToggle(el, '高亮并集 A∪B', s.union, v => s.union = v);
    addToggle(el, '高亮差集 A\\B', s.diff, v => s.diff = v);
  }
});

/* ---------- 04 充分条件与必要条件 ---------- */
MODULES.push({
  key: 'logic', tab: '04', name: '充分与必要', en: 'LOGIC', blurb: 'p ⇒ q',
  accent: '#ff8fab', rgb: '255,143,171',
  hint: '拖动 Q 区间或调节宽度，观察 p ⇒ q 与 q ⇒ p',
  state: {q: -.4, w: 1.8},
  reset() { this.state.q = -.4; this.state.w = 1.8; },
  meta() {
    return {
      title: '充分条件与必要条件',
      desc: '设 p 对应集合 P，q 对应集合 Q。若 <b>P ⊆ Q</b>，则 p 是 q 的充分条件；若 <b>Q ⊆ P</b>，则 p 是 q 的必要条件；两者都成立时 p 与 q 互为充要条件。',
      formula: 'p ⇒ q ⇔ P ⊆ Q',
      note: '“小集合”推出“大集合”。P 越小越容易成为充分条件，Q 越小越容易成为必要条件。拖动 Q，观察四种关系如何切换。'
    };
  },
  handles() { return [{id: 'q', x: this.state.q, y: 0}]; },
  drag(id, p) { this.state.q = clampPt(p).x; },
  draw() {
    setFrame(.5, .55, 12);
    base();
    const s = this.state;
    const p0 = -4.4, p1 = -1.2;
    const q0 = s.q - s.w / 2, q1 = s.q + s.w / 2;
    const pSubQ = p0 >= q0 - 1e-6 && p1 <= q1 + 1e-6;
    const qSubP = q0 >= p0 - 1e-6 && q1 <= p1 + 1e-6;

    line({x: -5.6, y: 0}, {x: 5.6, y: 0}, 'rgba(200,225,235,.4)', {w: 1.5});
    for (let i = -5; i <= 5; i++) {
      line({x: i, y: -.12}, {x: i, y: .12}, 'rgba(200,225,235,.3)', {w: 1});
      sans(String(i), X(i), Y(-.45), 'rgba(150,175,190,.6)', 9.5);
    }

    line({x: p0, y: .75}, {x: p1, y: .75}, '#6cb6ff', {w: 7});
    sans('P（p）', X((p0 + p1) / 2), Y(1.05), '#a9d4ff', 12);
    line({x: q0, y: -.65}, {x: q1, y: -.65}, '#ff8fab', {w: 7});
    sans('Q（q）', X((q0 + q1) / 2), Y(-.98), '#ffb3c6', 12);

    if (pSubQ) {
      line({x: p0, y: 1.4}, {x: p0, y: .9}, 'rgba(94,234,212,.35)', {w: 1, dash: [3, 4]});
      line({x: p1, y: 1.4}, {x: p1, y: .9}, 'rgba(94,234,212,.35)', {w: 1, dash: [3, 4]});
      sans('P ⊆ Q：p 是 q 的充分条件', X(0), Y(1.9), '#8ff5e4', 12);
    }
    if (qSubP) {
      sans('Q ⊆ P：p 是 q 的必要条件', X(0), Y(-1.55), '#ffb3c6', 12);
    }
    if (!pSubQ && !qSubP) sans('互不包含', X(0), Y(1.9), 'rgba(190,200,210,.7)', 12);
    if (pSubQ && qSubP) sans('p ⇔ q：充要条件', X(0), Y(2.2), '#ffc56b', 13);

    handle({x: s.q, y: 0}, '#ff8fab', hoverId === 'q');
    sans('Q 的可拖动中心', X(s.q), Y(.35), 'rgba(180,200,210,.55)', 9);
  },
  hud() {
    const s = this.state;
    const p0 = -4.4, p1 = -1.2, q0 = s.q - s.w / 2, q1 = s.q + s.w / 2;
    const pSubQ = p0 >= q0 - 1e-6 && p1 <= q1 + 1e-6;
    const qSubP = q0 >= p0 - 1e-6 && q1 <= p1 + 1e-6;
    let rel = '既不充分也不必要';
    if (pSubQ && qSubP) rel = '充要条件';
    else if (pSubQ) rel = '充分不必要';
    else if (qSubP) rel = '必要不充分';
    return [
      {k: 'p ⇒ q（P⊆Q）', v: pSubQ ? '成立' : '不成立', hi: pSubQ},
      {k: 'q ⇒ p（Q⊆P）', v: qSubP ? '成立' : '不成立', hi: qSubP},
      {k: '条件关系', v: rel, hi: pSubQ || qSubP}
    ];
  },
  panel(el) {
    const s = this.state;
    addSlider(el, 'Q 的区间宽度', .4, 4.8, .1, s.w, v => v.toFixed(1), v => s.w = v);
    addBtn(el, '重置区间', () => { s.q = -.4; s.w = 1.8; buildPanel(); }, 'ghost');
  }
});

/* ---------- 05 全称量词与存在量词 ---------- */
MODULES.push({
  key: 'quant', tab: '05', name: '量词与否定', en: 'QUANTIFIERS', blurb: '∀ 与 ∃',
  accent: '#b49cff', rgb: '180,156,255',
  hint: '拖动阈值 a，观察全称命题与存在命题的真假',
  state: {a: 1.2, neg: false},
  reset() { this.state.a = 1.2; this.state.neg = false; },
  meta() {
    return {
      title: '全称量词与存在量词',
      desc: '设定义域 <b>D = [−3, 3]</b>，命题为 <b>x &gt; a</b>。拖动阈值 a：只要还有一个 x 不满足，全称命题就为假；只要能找到一个 x 满足，存在命题就为真。',
      formula: '∀x∈D, P(x)　∃x∈D, P(x)',
      note: '全称命题的否定是存在命题：<span class="nw">¬(∀x∈D, P(x)) ⇔ ∃x∈D, ¬P(x)</span>。存在命题的否定则是全称命题。'
    };
  },
  handles() { return [{id: 'a', x: this.state.a, y: 0}]; },
  drag(id, p) { this.state.a = clampPt(p).x; },
  draw() {
    setFrame(.5, .55, 12);
    base();
    const s = this.state;
    const d0 = -3, d1 = 3;
    const forall = s.a < d0 - 1e-6;
    const exists = s.a < d1 - 1e-6;

    line({x: -5.6, y: 0}, {x: 5.6, y: 0}, 'rgba(200,225,235,.4)', {w: 1.5});
    for (let i = -5; i <= 5; i++) {
      line({x: i, y: -.1}, {x: i, y: .1}, 'rgba(200,225,235,.3)', {w: 1});
      sans(String(i), X(i), Y(-.4), 'rgba(150,175,190,.6)', 9.5);
    }
    // 定义域
    line({x: d0, y: 1.25}, {x: d1, y: 1.25}, 'rgba(180,156,255,.85)', {w: 4});
    line({x: d0, y: .95}, {x: d0, y: 1.55}, 'rgba(180,156,255,.85)', {w: 1.5});
    line({x: d1, y: .95}, {x: d1, y: 1.55}, 'rgba(180,156,255,.85)', {w: 1.5});
    sans('D = [−3, 3]', X(0), Y(1.75), 'rgba(190,175,245,.9)', 11);

    // 满足 x>a 的部分
    const from = Math.max(d0, s.a), to = d1;
    if (to > from) {
      line({x: from, y: .55}, {x: to, y: .55}, 'rgba(94,234,212,.85)', {w: 7});
      sans('x > a', X((from + to) / 2), Y(.9), 'rgba(150,235,220,.9)', 11);
    }

    // 阈值
    line({x: s.a, y: -1.3}, {x: s.a, y: 1.6}, '#ffc56b', {w: 2, dash: [5, 4]});
    math('a', X(s.a) + 14, Y(-1.1), '#ffc56b', 16);
    handle({x: s.a, y: -1.3}, '#ffc56b', hoverId === 'a');

    // 反例
    if (!forall) {
      const cx = clamp(s.a - .15, d0, d1);
      dot({x: cx, y: 0}, '#ff8fab', 5);
      sans('反例 x = ' + fmt(cx, 2), X(cx), Y(-.85), 'rgba(255,143,171,.9)', 10);
    }
    if (!exists) {
      sans('定义域内没有 x 满足', X(0), Y(-1.75), 'rgba(255,143,171,.9)', 11);
    }

    const truth = s.neg ? !forall : forall;
    sans((s.neg ? '¬∀' : '∀') + 'x∈D, x>a：' + (truth ? '真' : '假'), X(-4.9), Y(3.15), truth ? '#8ff5e4' : '#ff8fab', 12, 'left');
    const truth2 = s.neg ? !exists : exists;
    sans((s.neg ? '¬∃' : '∃') + 'x∈D, x>a：' + (truth2 ? '真' : '假'), X(-4.9), Y(2.6), truth2 ? '#8ff5e4' : '#ff8fab', 12, 'left');
  },
  hud() {
    const s = this.state;
    const forall = s.a < -3 - 1e-6;
    const exists = s.a < 3 - 1e-6;
    return [
      {k: 'a', v: fmt(s.a, 2), hi: true},
      {k: '∀x∈D, x>a', v: forall ? '真' : '假', hi: forall},
      {k: '∃x∈D, x>a', v: exists ? '真' : '假', hi: exists},
      {k: '全称的否定', v: forall ? '假' : '真'}
    ];
  },
  panel(el) {
    const s = this.state;
    addSlider(el, '阈值 a', -4, 4, .05, s.a, v => v.toFixed(2), v => s.a = v);
    addToggle(el, '显示否定命题的真假', s.neg, v => s.neg = v);
    addBtn(el, '重置 a', () => { s.a = 1.2; buildPanel(); }, 'ghost');
  }
});

})();