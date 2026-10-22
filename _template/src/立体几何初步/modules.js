/* ============================================================
   必修第二册 · 第 8 章 立体几何初步
   01 基本立体图形 / 02 表面积与体积 / 03 线面平行
   04 线面垂直 / 05 三视图
   ============================================================ */
(function () {

const D2R = Math.PI / 180;

/* ---------- 公共：填充多边形与折线 ---------- */
function poly(pts, fill, stroke, w, dash) {
  if (!pts || pts.length < 2) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(X(pts[0].x), Y(pts[0].y));
  for (let i = 1; i < pts.length; i++) ctx.lineTo(X(pts[i].x), Y(pts[i].y));
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = w || 1.6;
    if (dash) ctx.setLineDash(dash);
    ctx.stroke();
  }
  ctx.restore();
}
function polyline(pts, color, w, dash) {
  if (!pts || pts.length < 2) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(X(pts[0].x), Y(pts[0].y));
  for (let i = 1; i < pts.length; i++) ctx.lineTo(X(pts[i].x), Y(pts[i].y));
  ctx.strokeStyle = color;
  ctx.lineWidth = w || 1.2;
  if (dash) ctx.setLineDash(dash);
  ctx.stroke();
  ctx.restore();
}

/* ---------- 公共：绕 y 轴偏航、绕 x 轴俯仰后的正交投影 ---------- */
function rot3(p, yaw, pit) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pit), sp = Math.sin(pit);
  const x1 = p[0] * cy + p[2] * sy;
  const z1 = -p[0] * sy + p[2] * cy;
  return {x: x1, y: p[1] * cp - z1 * sp, z: p[1] * sp + z1 * cp};
}
function faceInfo(pts, cen) {
  const p0 = pts[0], p1 = pts[1], p2 = pts[2];
  const u = {x: p1.x - p0.x, y: p1.y - p0.y, z: p1.z - p0.z};
  const v = {x: p2.x - p0.x, y: p2.y - p0.y, z: p2.z - p0.z};
  const n = {x: u.y * v.z - u.z * v.y, y: u.z * v.x - u.x * v.z, z: u.x * v.y - u.y * v.x};
  const dot = n.x * cen.x + n.y * cen.y + n.z * cen.z;
  const nz = dot > 0 ? n.z : -n.z;
  return nz > 0;
}

/* ---------- 01 的多面体数据 ---------- */
const SOLIDS = {
  cube: {
    name: '正方体',
    v: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1],
        [-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]],
    f: [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [0, 3, 7, 4], [1, 2, 6, 5]],
    e: [[0, 1, 0, 2], [1, 2, 0, 5], [2, 3, 0, 3], [3, 0, 0, 4],
        [4, 5, 1, 2], [5, 6, 1, 5], [6, 7, 1, 3], [7, 4, 1, 4],
        [0, 4, 2, 4], [1, 5, 2, 5], [2, 6, 3, 5], [3, 7, 3, 4]],
    lab: ['A', 'B', 'C', 'D', 'A₁', 'B₁', 'C₁', 'D₁']
  },
  pyr: {
    name: '正四棱锥',
    v: [[-1.1, -1.15, -1.1], [1.1, -1.15, -1.1], [1.1, -1.15, 1.1], [-1.1, -1.15, 1.1], [0, 1.45, 0]],
    f: [[0, 1, 2, 3], [0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4]],
    e: [[0, 1, 0, 1], [1, 2, 0, 2], [2, 3, 0, 3], [3, 0, 0, 4],
        [0, 4, 1, 4], [1, 4, 1, 2], [2, 4, 2, 3], [3, 4, 3, 4]],
    lab: ['A', 'B', 'C', 'D', 'S']
  }
};

/* ============================================================
   01 基本立体图形
   ============================================================ */
MODULES.push({
  key: 'solid', tab: '01', name: '基本立体图形', en: 'SOLIDS', blurb: '顶点 · 棱 · 面',
  accent: '#9ad0ff', rgb: '154,208,255',
  hint: '拖动画布旋转几何体，或拖动下方圆环；实线与虚线随之切换',
  state: {kind: 'cube', yaw: -.55, pit: .40, faces: true, lab: true, hl: 0},
  reset() {
    this.state.kind = 'cube';
    this.state.yaw = -.55;
    this.state.pit = .40;
    this.state.faces = true;
    this.state.lab = true;
    this.state.hl = 0;
  },
  meta() {
    const s = this.state, D = SOLIDS[s.kind];
    return {
      title: D.name + '：顶点、棱与面',
      desc: '转动模型，观察每一条棱的虚实变化：面向观察者的棱画成实线，被几何体挡住的棱画成虚线。数一数顶点 V、棱 E、面 F 的个数，再代入欧拉公式检验，体会多面体元素之间的数量关系。',
      formula: 'V − E + F = ' + D.v.length + ' − ' + D.e.length + ' + ' + D.f.length + ' = 2',
      note: '正方体 V = 8、E = 12、F = 6；正四棱锥 V = 5、E = 8、F = 5。两种立体都满足 <span class="nw">V − E + F = 2</span>，这是凸多面体的欧拉公式。'
    };
  },
  handles() {
    const s = this.state;
    return [{id: 'dial', x: 1.85 * Math.cos(s.yaw), y: -2.5 + .42 * Math.sin(s.yaw)}];
  },
  drag(id, p) {
    const q = clampPt(p);
    const t = Math.atan2((q.y + 2.5) / .42, q.x / 1.85);
    this.state.yaw = Math.round(t / D2R) * D2R;
  },
  orbit(dx, dy) {
    this.state.yaw -= dx * .007;
    this.state.pit = clamp(this.state.pit + dy * .006, -.15, 1.15);
  },
  draw() {
    setFrame(.5, .55, 12);
    base();
    const s = this.state, D = SOLIDS[s.kind];
    const k = s.kind === 'cube' ? 1.42 : 1.25;
    const cy = s.kind === 'cube' ? .95 : .85;
    const rp = D.v.map(p => rot3(p, s.yaw, s.pit));
    const sp = rp.map(p => ({x: p.x * k, y: cy + p.y * k}));

    // 每个面的朝向与深度
    const fi = D.f.map(f => {
      let c = {x: 0, y: 0, z: 0};
      f.forEach(j => { c.x += rp[j].x / f.length; c.y += rp[j].y / f.length; c.z += rp[j].z / f.length; });
      return {front: faceInfo(f.map(j => rp[j]), c), depth: c.z};
    });

    // 面：由远到近
    if (s.faces) {
      D.f.map((f, i) => i).sort((i, j) => fi[i].depth - fi[j].depth).forEach(i => {
        poly(D.f[i].map(j => sp[j]), 'rgba(154,208,255,' + (fi[i].front ? '.10' : '.045') + ')', null);
      });
    }

    // 棱：可见实线，被遮挡为虚线
    D.e.forEach(e => {
      if (e[0] === s.hl || e[1] === s.hl) return;
      const vis = fi[e[2]].front || fi[e[3]].front;
      line(sp[e[0]], sp[e[1]], vis ? 'rgba(154,208,255,.92)' : 'rgba(154,208,255,.26)',
        {w: vis ? 2 : 1.3, dash: vis ? null : [5, 5]});
    });
    // 与高亮顶点相连的棱
    D.e.forEach(e => {
      if (e[0] !== s.hl && e[1] !== s.hl) return;
      line(sp[e[0]], sp[e[1]], '#ffd08a', {w: 3.2});
    });

    // 顶点与字母
    rp.forEach((p, i) => {
      const hlp = i === s.hl;
      dot(sp[i], hlp ? '#ffd08a' : 'rgba(205,232,250,.9)', hlp ? 5.2 : 3.2);
      if (s.lab) {
        const L = len2(sp[i].x, sp[i].y - cy) || 1;
        math(D.lab[i], X(sp[i].x) + sp[i].x / L * 15,
          Y(sp[i].y) - (sp[i].y - cy) / L * 15,
          hlp ? '#ffd9a8' : 'rgba(200,226,244,.92)', hlp ? 16 : 13);
      }
    });

    // 旋转圆环
    const dc = {x: 0, y: -2.5}, rx = 1.85, ry = .42, ring = [];
    for (let i = 0; i <= 48; i++) {
      const t = i / 48 * TAU;
      ring.push({x: dc.x + rx * Math.cos(t), y: dc.y + ry * Math.sin(t)});
    }
    polyline(ring, 'rgba(154,208,255,.22)', 1.2, [4, 6]);
    const hp = {x: dc.x + rx * Math.cos(s.yaw), y: dc.y + ry * Math.sin(s.yaw)};
    line(dc, hp, 'rgba(154,208,255,.35)', {w: 1, dash: [3, 4]});
    handle(hp, '#9ad0ff', hoverId === 'dial');
    sans('拖动旋转', X(dc.x), Y(dc.y - .78), 'rgba(150,182,205,.7)', 10);
    sans(D.name + ' · ' + (s.kind === 'cube' ? '6 个面都是正方形' : '底面正方形，四个侧面是等腰三角形'),
      X(-5.3), Y(3.5), 'rgba(160,195,215,.75)', 10.5, 'left');
  },
  hud() {
    const s = this.state, D = SOLIDS[s.kind];
    return [
      {k: '几何体', v: D.name},
      {k: '顶点 V', v: String(D.v.length)},
      {k: '棱 E', v: String(D.e.length)},
      {k: '面 F', v: String(D.f.length)},
      {k: 'V − E + F', v: '2', hi: true}
    ];
  },
  panel(el) {
    const s = this.state;
    addSlider(el, '俯仰角', 10, 65, 1, Math.round(s.pit / D2R), v => v + '°', v => s.pit = v * D2R);
    addToggle(el, '显示面', s.faces, v => s.faces = v);
    addToggle(el, '显示顶点字母', s.lab, v => s.lab = v);
    const r = row(el);
    addBtn(r, '换一个几何体', () => {
      s.kind = s.kind === 'cube' ? 'pyr' : 'cube';
      s.hl = 0;
      buildPanel();
    }, 'ghost');
    addBtn(r, '下一个顶点', () => { s.hl = (s.hl + 1) % SOLIDS[s.kind].v.length; }, 'ghost');
  }
});

/* ============================================================
   02 表面积与体积
   ============================================================ */
MODULES.push({
  key: 'measure', tab: '02', name: '表面积与体积', en: 'AREA & VOLUME', blurb: 'S 与 V',
  accent: '#ffc56b', rgb: '255,197,107',
  hint: '拖动画布旋转几何体，拖动顶点或滑块改变边长与高',
  state: {a: 2.4, h: 2.6, pyr: false, yaw: .48, pit: .32},
  reset() { this.state.a = 2.4; this.state.h = 2.6; this.state.pyr = false; this.state.yaw = .48; this.state.pit = .32; },
  meta() {
    const s = this.state;
    return {
      title: s.pyr ? '正四棱锥：表面积与体积' : '正四棱柱：表面积与体积',
      desc: s.pyr
        ? '底面是边长为 a 的正方形，顶点在底面中心的正上方，高为 h。四个侧面是全等的等腰三角形，斜高 l = √(h² + a²/4)。拖动滑块或顶点，观察 S 与 V 如何变化。'
        : '底面是边长为 a 的正方形，侧棱垂直于底面、长为 h。表面积等于上下两个底面加上四个侧面，体积等于底面积乘高。拖动滑块或顶点，观察 S 与 V 随 a、h 的变化。',
      formula: s.pyr ? 'S = a² + 2a√(h² + a²/4)　V = ⅓a²h' : 'S = 2a² + 4ah　V = a²h',
      note: s.pyr
        ? '等底等高时，棱锥的体积恰好是棱柱的 <b>⅓</b>：<span class="nw">V锥 = ⅓V柱</span>。把 a、h 同时放大 2 倍，体积会变成 8 倍。'
        : '侧面展开图是矩形，故侧面积为 <span class="nw">4ah</span>。把 a、h 同时放大 2 倍，表面积变为 4 倍，体积变为 8 倍。'
    };
  },
  handles() {
    const s = this.state;
    return [{id: 'h', x: 0, y: -1.6 + s.h * .95}];
  },
  drag(id, p) {
    const q = clampPt(p);
    this.state.h = clamp(Math.round((q.y + 1.6) / .95 * 10) / 10, 1, 4.6);
  },
  orbit(dx, dy) {
    this.state.yaw -= dx * .007;
    this.state.pit = clamp(this.state.pit + dy * .006, -.10, 1.10);
  },
  draw() {
    setFrame(.5, .55, 10);
    base();
    const s = this.state, a = s.a, h = s.h, hw = a / 2;
    const sc = .95, by = -1.6;
    const P = (x, y, z) => {
      const r = rot3([x, y, z], s.yaw, s.pit);
      return {x: r.x * sc, y: by + r.y * sc};
    };
    const B = [P(-hw, 0, -hw), P(hw, 0, -hw), P(hw, 0, hw), P(-hw, 0, hw)];
    const T = [P(-hw, h, -hw), P(hw, h, -hw), P(hw, h, hw), P(-hw, h, hw)];
    const Apex = P(0, h, 0);
    const edge = 'rgba(255,197,107,.95)';

    // 底面
    poly(B, 'rgba(255,197,107,.13)', null);
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      line(B[i], B[j], 'rgba(255,197,107,.85)', {w: 1.8, dash: i === 1 ? [5, 5] : null});
    }

    if (s.pyr) {
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4;
        poly([B[i], B[j], Apex], 'rgba(255,197,107,.07)', null);
      }
      for (let i = 0; i < 4; i++) line(B[i], Apex, edge, {w: 2});
    } else {
      poly(T, 'rgba(255,197,107,.16)', null);
      for (let i = 0; i < 4; i++) line(B[i], T[i], edge, {w: 2});
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4;
        line(T[i], T[j], 'rgba(255,197,107,.9)', {w: 1.8});
      }
    }

    // 高
    const H0 = P(0, 0, 0), H1 = P(0, h, 0);
    line(H0, H1, 'rgba(255,226,175,.5)', {w: 1.2, dash: [5, 5]});
    sans('h = ' + fmt(h, 1), X(H1.x) + 14, Y((H0.y + H1.y) / 2), 'rgba(255,226,175,.92)', 11, 'left');

    // 底面边长
    const m0 = B[0], m1 = B[1];
    sans('a = ' + fmt(a, 1), X((m0.x + m1.x) / 2), Y(Math.min(m0.y, m1.y) - .42),
      'rgba(255,226,175,.92)', 11);

    handle(H1, '#ffc56b', hoverId === 'h');
    sans(s.pyr ? '四棱锥' : '四棱柱', X(-4.7), Y(2.75), 'rgba(255,214,160,.85)', 11, 'left');
  },
  hud() {
    const s = this.state, a = s.a, h = s.h, bs = a * a;
    let S, V;
    if (s.pyr) {
      const l = Math.hypot(h, a / 2);
      S = bs + 2 * a * l;
      V = bs * h / 3;
    } else {
      S = 2 * bs + 4 * a * h;
      V = bs * h;
    }
    return [
      {k: '底面边长 a', v: fmt(a, 1)},
      {k: '高 h', v: fmt(h, 1)},
      {k: '底面积', v: fmt(bs, 2)},
      {k: '表面积 S', v: fmt(S, 2), hi: true},
      {k: '体积 V', v: fmt(V, 2), hi: true}
    ];
  },
  panel(el) {
    const s = this.state;
    addSlider(el, '底面边长 a', 1, 4, .1, s.a, v => v.toFixed(1), v => s.a = v);
    addSlider(el, '高 h', 1, 4.6, .1, s.h, v => v.toFixed(1), v => s.h = v);
    addToggle(el, '切换为四棱锥', s.pyr, v => { s.pyr = v; buildPanel(); });
    addBtn(el, '回到默认尺寸', () => { s.a = 2.4; s.h = 2.6; buildPanel(); }, 'ghost');
  }
});

/* ============================================================
   03 直线与平面平行的判定
   ============================================================ */
MODULES.push({
  key: 'parallel', tab: '03', name: '线面平行', en: 'PARALLEL', blurb: 'a ∥ b ⇒ b ∥ α',
  accent: '#7be0c0', rgb: '123,224,192',
  hint: '拖动 a、b 的端点，让两条直线方向相同',
  state: {fa: 0, fb: 26, proj: true},
  reset() { this.state.fa = 0; this.state.fb = 26; this.state.proj = true; },
  meta() {
    return {
      title: '线面平行的判定',
      desc: '平面 α 内有一条直线 a，平面外有一条直线 b。拖动 b 的端点改变它的方向：当 b 与 a 平行时，b 与平面 α 没有公共点，于是 b ∥ α；方向一旦偏离，判定就不再成立。',
      formula: 'a ∥ b，a ⊂ α，b ⊄ α ⇒ b ∥ α',
      note: '三个条件缺一不可：线线平行、线在面内、线在面外。两直线方向相同或相反都算平行，对应两直线夹角为 0°。'
    };
  },
  handles() {
    const s = this.state;
    const fa = s.fa * D2R, fb = s.fb * D2R;
    const za = .05 + 2.4 * Math.sin(fa);
    const zb = -.1 + 1.7 * Math.sin(fb);
    return [
      {id: 'a', x: 2.4 * Math.cos(fa) + .55 * za, y: .38 * za - .25},
      {id: 'b', x: .1 + 1.7 * Math.cos(fb) + .55 * zb, y: 1.3 + .38 * zb - .25}
    ];
  },
  drag(id, p) {
    const q = clampPt(p);
    if (id === 'a') {
      const dz = (q.y + .25) / .38;
      const dx = q.x - .55 * dz;
      this.state.fa = clamp(Math.round(Math.atan2(dz - .05, dx) / D2R), -35, 35);
    } else {
      const dz = (q.y - 1.05) / .38;
      const dx = q.x - .55 * dz;
      this.state.fb = clamp(Math.round(Math.atan2(dz + .1, dx - .1) / D2R), -80, 80);
    }
  },
  draw() {
    setFrame(.5, .55, 11);
    const s = this.state;
    const pr = (x, y, z) => ({x: x + .55 * z, y: y + .38 * z - .25});
    const col = '#7be0c0';

    // 平面 α
    const quad = [pr(-3, 0, -1.45), pr(3, 0, -1.45), pr(3, 0, 1.45), pr(-3, 0, 1.45)];
    poly(quad, 'rgba(123,224,192,.07)', 'rgba(123,224,192,.55)', 1.5);
    for (let i = -2; i <= 2; i++) {
      line(pr(-3, 0, i * .58), pr(3, 0, i * .58), 'rgba(123,224,192,.10)', {w: 1});
    }
    for (let i = -2; i <= 2; i++) {
      line(pr(i * 1.2, 0, -1.45), pr(i * 1.2, 0, 1.45), 'rgba(123,224,192,.10)', {w: 1});
    }
    math('α', X(quad[2].x) + 18, Y(quad[2].y) + 6, 'rgba(150,240,215,.95)', 17);

    // 平面内的直线 a
    const fa = s.fa * D2R;
    const ad = {x: Math.cos(fa), z: Math.sin(fa)};
    const a0 = pr(-2.4 * ad.x, 0, .05 - 2.4 * ad.z);
    const a1 = pr(2.4 * ad.x, 0, .05 + 2.4 * ad.z);
    line(a0, a1, col, {w: 3.4});
    dot(a0, col, 3.4);
    math('a', X(a1.x) + 14, Y(a1.y) + 12, '#a9f5e0', 17);

    // 平面外的直线 b
    const fb = s.fb * D2R;
    const bd = {x: Math.cos(fb), z: Math.sin(fb)};
    const b0 = pr(.1 - 1.7 * bd.x, 1.3, -.1 - 1.7 * bd.z);
    const b1 = pr(.1 + 1.7 * bd.x, 1.3, -.1 + 1.7 * bd.z);
    if (s.proj) {
      line(b0, pr(.1 - 1.7 * bd.x, 0, -.1 - 1.7 * bd.z), 'rgba(255,143,171,.28)', {w: 1, dash: [4, 5]});
      line(b1, pr(.1 + 1.7 * bd.x, 0, -.1 + 1.7 * bd.z), 'rgba(255,143,171,.28)', {w: 1, dash: [4, 5]});
    }
    line(b0, b1, '#ff8fab', {w: 3.4});
    dot(b0, '#ff8fab', 3.4);
    math('b', X(b1.x) + 14, Y(b1.y) - 12, '#ffb3c6', 17);

    // 判定
    const diff = Math.abs((((s.fb - s.fa) % 180) + 180) % 180);
    const gap = Math.min(diff, 180 - diff);
    const par = gap <= 2.5;
    math(par ? 'a ∥ b' : 'a ∦ b', X(-4.9), Y(2.72), par ? '#8ff5e4' : '#ff8fab', 18, 'left');
    sans(par ? 'b 与 α 没有公共点，故 b ∥ α' : '两条直线方向不同，判定条件不满足',
      X(-4.9), Y(2.3), par ? 'rgba(150,235,215,.85)' : 'rgba(255,175,195,.8)', 11, 'left');

    handle(a1, col, hoverId === 'a');
    handle(b1, '#ff8fab', hoverId === 'b');
    sans('a 在平面内，b 在平面外', X(0), Y(-1.85), 'rgba(160,205,195,.6)', 10);
  },
  hud() {
    const s = this.state;
    const diff = Math.abs((((s.fb - s.fa) % 180) + 180) % 180);
    const gap = Math.min(diff, 180 - diff);
    const par = gap <= 2.5;
    return [
      {k: 'a 与 b 的夹角', v: fmt(gap, 1) + '°', hi: par},
      {k: 'a ⊂ α', v: '成立'},
      {k: 'b ⊄ α', v: '成立'},
      {k: 'b ∥ α', v: par ? '成立' : '不成立', hi: par}
    ];
  },
  panel(el) {
    const s = this.state;
    addSlider(el, '直线 b 的方向角', -80, 80, 1, s.fb, v => v + '°', v => s.fb = v);
    addSlider(el, '直线 a 的方向角', -35, 35, 1, s.fa, v => v + '°', v => s.fa = v);
    addToggle(el, '显示 b 到平面的投影', s.proj, v => s.proj = v);
    addBtn(el, '让 b ∥ a', () => { s.fb = s.fa; buildPanel(); }, 'ghost');
  }
});

/* ============================================================
   04 直线与平面垂直的判定
   ============================================================ */
MODULES.push({
  key: 'perp', tab: '04', name: '线面垂直', en: 'PERPENDICULAR', blurb: 'l⊥m，l⊥n ⇒ l⊥α',
  accent: '#b49cff', rgb: '180,156,255',
  hint: '拖动 m、n 的端点，或让 l 倾斜，检验两个直角',
  state: {tm: -38, tn: 38, tilt: 0, mark: true},
  reset() { this.state.tm = -38; this.state.tn = 38; this.state.tilt = 0; this.state.mark = true; },
  meta() {
    return {
      title: '线面垂直的判定',
      desc: '平面 α 内过点 O 的两条相交直线 m、n，若平面外的直线 l 同时垂直于 m 和 n，则 l ⊥ α。拖动 m、n 的端点，或让 l 倾斜，观察两个直角同时成立时结论才成立。',
      formula: 'l ⊥ m，l ⊥ n，m ∩ n = O ⇒ l ⊥ α',
      note: '条件中的 m、n 必须是平面内<b>两条相交</b>直线：若 m 与 n 重合或平行，即使 l 垂直也判定不了。'
    };
  },
  handles() {
    const s = this.state, tm = s.tm * D2R, tn = s.tn * D2R;
    const Lm = Math.min(2.3, 1.85 / Math.max(1e-4, Math.abs(Math.sin(tm))), 2.5 / Math.max(1e-4, Math.abs(Math.cos(tm))));
    const Ln = Math.min(2.3, 1.85 / Math.max(1e-4, Math.abs(Math.sin(tn))), 2.5 / Math.max(1e-4, Math.abs(Math.cos(tn))));
    const pr = (x, z) => ({x: x + .55 * z, y: .38 * z - .7});
    return [
      {id: 'm', ...pr(Lm * Math.cos(tm), Lm * Math.sin(tm))},
      {id: 'n', ...pr(Ln * Math.cos(tn), Ln * Math.sin(tn))}
    ];
  },
  drag(id, p) {
    const q = clampPt(p);
    const dz = (q.y + .7) / .38;
    const dx = q.x - .55 * dz;
    const ang = clamp(Math.round(Math.atan2(dz, dx) / D2R), -70, 70);
    if (id === 'm') this.state.tm = ang; else this.state.tn = ang;
  },
  draw() {
    setFrame(.5, .55, 11);
    const s = this.state;
    const pr = (x, y, z) => ({x: x + .55 * z, y: y + .38 * z - .7});
    const col = '#b49cff';
    const tm = s.tm * D2R, tn = s.tn * D2R, tl = s.tilt * D2R;

    // 平面
    const quad = [pr(-2.8, 0, -2), pr(2.8, 0, -2), pr(2.8, 0, 2), pr(-2.8, 0, 2)];
    poly(quad, 'rgba(180,156,255,.07)', 'rgba(180,156,255,.5)', 1.5);
    for (let i = -2; i <= 2; i++) {
      line(pr(-2.8, 0, i * .8), pr(2.8, 0, i * .8), 'rgba(180,156,255,.09)', {w: 1});
    }
    for (let i = -2; i <= 2; i++) {
      line(pr(i * 1.4, 0, -2), pr(i * 1.4, 0, 2), 'rgba(180,156,255,.09)', {w: 1});
    }
    math('α', X(quad[2].x) + 18, Y(quad[2].y) + 6, 'rgba(200,180,255,.95)', 17);

    const Lm = Math.min(2.3, 1.85 / Math.max(1e-4, Math.abs(Math.sin(tm))), 2.5 / Math.max(1e-4, Math.abs(Math.cos(tm))));
    const Ln = Math.min(2.3, 1.85 / Math.max(1e-4, Math.abs(Math.sin(tn))), 2.5 / Math.max(1e-4, Math.abs(Math.cos(tn))));

    // 角
    const angM = Math.acos(Math.min(1, Math.abs(Math.sin(tl) * Math.cos(tm)))) / D2R;
    const angN = Math.acos(Math.min(1, Math.abs(Math.sin(tl) * Math.cos(tn)))) / D2R;
    const angMN = Math.acos(Math.min(1, Math.abs(Math.cos(tm - tn)))) / D2R;
    const ok = angM >= 89.5 && angN >= 89.5 && angMN >= 5;
    const O = pr(0, 0, 0);

    // m、n
    line(pr(-Lm * Math.cos(tm), 0, -Lm * Math.sin(tm)), pr(Lm * Math.cos(tm), 0, Lm * Math.sin(tm)), '#6cb6ff', {w: 3});
    line(pr(-Ln * Math.cos(tn), 0, -Ln * Math.sin(tn)), pr(Ln * Math.cos(tn), 0, Ln * Math.sin(tn)), '#ff8fab', {w: 3});
    math('m', X(pr(Lm * Math.cos(tm), 0, Lm * Math.sin(tm)).x) + 12,
      Y(pr(Lm * Math.cos(tm), 0, Lm * Math.sin(tm)).y) + 10, '#a9d4ff', 16);
    math('n', X(pr(Ln * Math.cos(tn), 0, Ln * Math.sin(tn)).x) + 12,
      Y(pr(Ln * Math.cos(tn), 0, Ln * Math.sin(tn)).y) - 10, '#ffb3c6', 16);

    // l：方向 (sin t, cos t, 0)
    const ld = {x: Math.sin(tl), y: Math.cos(tl)};
    const lTop = {x: ld.x * 2.9, y: ld.y * 2.9 - .7};
    const lBot = {x: -ld.x * .55, y: -ld.y * .55 - .7};
    line(O, lBot, 'rgba(180,156,255,.35)', {w: 2, dash: [5, 5]});
    line(O, lTop, col, {w: 3.4});
    math('l', X(lTop.x) + 14, Y(lTop.y) + 12, '#cdbcff', 17);
    dot(O, '#e7dfff', 4.2);
    math('O', X(O.x) - 15, Y(O.y) + 12, 'rgba(220,210,255,.9)', 14);

    // 直角标记：确实垂直时才画
    if (s.mark) {
      const dm = {x: Math.cos(tm) + .55 * Math.sin(tm), y: .38 * Math.sin(tm)};
      const lm = len2(dm.x, dm.y) || 1;
      if (angM >= 89.5) rightAngle(O, {x: ld.x, y: ld.y}, {x: dm.x / lm, y: dm.y / lm}, 14, 'rgba(180,156,255,.8)');
      const dn = {x: Math.cos(tn) + .55 * Math.sin(tn), y: .38 * Math.sin(tn)};
      const ln = len2(dn.x, dn.y) || 1;
      if (angN >= 89.5) rightAngle(O, {x: ld.x, y: ld.y}, {x: dn.x / ln, y: dn.y / ln}, 18, 'rgba(180,156,255,.8)');
    }

    math(ok ? 'l ⊥ α' : 'l 与 α 不垂直', X(-5), Y(2.95), ok ? '#c9b6ff' : '#ff8fab', 18, 'left');
    sans(ok ? 'l 垂直于平面内两条相交直线' : (angMN < 5 ? 'm 与 n 近似平行，不能判定' : 'l 与其中一条直线不垂直'),
      X(-5), Y(2.53), 'rgba(200,190,235,.78)', 11, 'left');
  },
  hud() {
    const s = this.state;
    const tm = s.tm * D2R, tn = s.tn * D2R, tl = s.tilt * D2R;
    const angM = Math.acos(Math.min(1, Math.abs(Math.sin(tl) * Math.cos(tm)))) / D2R;
    const angN = Math.acos(Math.min(1, Math.abs(Math.sin(tl) * Math.cos(tn)))) / D2R;
    const angMN = Math.acos(Math.min(1, Math.abs(Math.cos(tm - tn)))) / D2R;
    const ok = angM >= 89.5 && angN >= 89.5 && angMN >= 5;
    return [
      {k: '∠(l, m)', v: fmt(angM, 1) + '°', hi: angM >= 89.5},
      {k: '∠(l, n)', v: fmt(angN, 1) + '°', hi: angN >= 89.5},
      {k: '∠(m, n)', v: fmt(angMN, 1) + '°'},
      {k: 'l ⊥ α', v: ok ? '成立' : '不成立', hi: ok}
    ];
  },
  panel(el) {
    const s = this.state;
    addSlider(el, '直线 l 的倾斜角', 0, 40, 1, s.tilt, v => v + '°', v => s.tilt = v);
    addToggle(el, '显示直角标记', s.mark, v => s.mark = v);
    const r = row(el);
    addBtn(r, '恢复垂直', () => { s.tilt = 0; s.tm = -38; s.tn = 38; buildPanel(); }, 'ghost');
    addBtn(r, '让 m ∥ n', () => { s.tm = 20; s.tn = 20; s.tilt = 0; buildPanel(); }, 'ghost');
  }
});

/* ============================================================
   05 三视图
   ============================================================ */
MODULES.push({
  key: 'views', tab: '05', name: '三视图', en: 'THREE VIEWS', blurb: '长对正 · 高平齐',
  accent: '#ffa97a', rgb: '255,169,122',
  hint: '拖动画布旋转立体图；切换视角按钮对照三视图',
  state: {view: 'iso', h: 2.6, dim: true, yaw: .48, pit: .35},
  reset() { this.state.view = 'iso'; this.state.h = 2.6; this.state.dim = true; this.state.yaw = .48; this.state.pit = .35; },
  meta() {
    return {
      title: '三视图：从三个方向看同一个几何体',
      desc: '同一个正四棱锥，从正面看得到主视图（等腰三角形），从左面看得到左视图（等腰三角形），从上面看得到俯视图（正方形加两条对角线）。切换视角或并排对照三视图，体会三者之间的对应关系。',
      formula: '长对正　高平齐　宽相等',
      note: '主视图与俯视图<b>长对正</b>，主视图与左视图<b>高平齐</b>，俯视图与左视图<b>宽相等</b>。拖动顶点改变高 h，三个视图会同步变化。'
    };
  },
  handles() {
    if (this.state.view !== 'iso') return [];
    return [{id: 'apex', x: 0, y: -1.1 + this.state.h * 1.15}];
  },
  drag(id, p) {
    const q = clampPt(p);
    this.state.h = clamp(Math.round((q.y + 1.1) / 1.15 * 10) / 10, 1.4, 3.4);
  },
  orbitEnabled() { return this.state.view === 'iso'; },
  orbit(dx, dy) {
    if (this.state.view !== 'iso') return;
    this.state.yaw -= dx * .007;
    this.state.pit = clamp(this.state.pit + dy * .006, -.10, 1.10);
  },
  draw() {
    setFrame(.5, .55, 11);
    const s = this.state, h = s.h, a = 1.2;
    const basePts = [[-a, 0, -a], [a, 0, -a], [a, 0, a], [-a, 0, a]];
    const V3 = basePts.concat([[0, h, 0]]);
    const EDGES = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 4], [2, 4], [3, 4]];
    const col = '#ffa97a';

    const projV = (p, mode, cx, cy, sc) => {
      let u, v;
      if (mode === 'front') { u = p[0]; v = p[1]; }
      else if (mode === 'left') { u = p[2]; v = p[1]; }
      else if (mode === 'top') { u = p[0]; v = -p[2]; }
      else { const r = rot3(p, s.yaw, s.pit); u = r.x; v = r.y; }
      return {x: cx + u * sc, y: cy + v * sc};
    };

    const drawView = (mode, cx, cy, sc, label) => {
      const P = p => projV(p, mode, cx, cy, sc);
      if (mode === 'front') {
        poly([basePts[0], basePts[1], [0, h, 0]].map(P), 'rgba(255,169,122,.10)', null);
      } else if (mode === 'left') {
        poly([basePts[1], basePts[2], [0, h, 0]].map(P), 'rgba(255,169,122,.10)', null);
      } else {
        poly(basePts.map(P), 'rgba(255,169,122,.10)', null);
      }
      EDGES.forEach(e => {
        const A = V3[e[0]], B = V3[e[1]];
        let alpha = .95, w = 2, dash = null;
        if (mode === 'iso') {
          if (A[2] > 0 && B[2] > 0) { alpha = .32; w = 1.4; dash = [5, 5]; }
          else if (A[2] > 0 || B[2] > 0) { alpha = .62; }
        }
        line(P(A), P(B), 'rgba(255,169,122,' + alpha + ')', {w, dash});
      });
      if (mode === 'top') dot(P([0, h, 0]), 'rgba(255,214,170,.95)', 3.4);

      if (s.dim) {
        if (mode === 'front' || mode === 'left') {
          const e0 = mode === 'front' ? P([-a, 0, -a]) : P([0, 0, a]);
          const e1 = mode === 'front' ? P([a, 0, -a]) : P([0, 0, -a]);
          sans('a', X((e0.x + e1.x) / 2), Y(e0.y - .24), 'rgba(255,214,170,.9)', 11);
          const h0 = P([0, 0, 0]), h1 = P([0, h, 0]);
          line(h0, h1, 'rgba(255,214,170,.4)', {w: 1, dash: [4, 4]});
          sans('h', X(h1.x) + 12, Y((h0.y + h1.y) / 2), 'rgba(255,214,170,.9)', 11, 'left');
        } else if (mode === 'top') {
          const e0 = P([a, 0, -a]), e1 = P([a, 0, a]);
          sans('a', X(e0.x) + 12, Y((e0.y + e1.y) / 2), 'rgba(255,214,170,.9)', 11, 'left');
        } else {
          const e0 = P([-a, 0, -a]), e1 = P([a, 0, -a]);
          sans('a', X((e0.x + e1.x) / 2), Y(e0.y - .26), 'rgba(255,214,170,.9)', 11);
          const h0 = P([0, 0, 0]), h1 = P([0, h, 0]);
          line(h0, h1, 'rgba(255,214,170,.4)', {w: 1, dash: [4, 4]});
          sans('h', X(h1.x) + 12, Y((h0.y + h1.y) / 2), 'rgba(255,214,170,.9)', 11, 'left');
        }
      }
      if (label) sans(label, X(cx), Y(cy - (mode === 'top' ? a * sc + .32 : .95)), 'rgba(255,200,165,.9)', 11.5);
    };

    if (s.view === 'three') {
      const sc = .6;
      // 辅助线：长对正 / 高平齐
      const left = -2.5, dx = a * sc;
      line({x: left - dx, y: .6}, {x: left - dx, y: -1.12}, 'rgba(255,214,170,.3)', {w: 1, dash: [4, 6]});
      line({x: left + dx, y: .6}, {x: left + dx, y: -1.12}, 'rgba(255,214,170,.3)', {w: 1, dash: [4, 6]});
      line({x: left + dx + .2, y: .7}, {x: 1.2, y: .7}, 'rgba(255,214,170,.3)', {w: 1, dash: [4, 6]});
      line({x: left + dx + .2, y: .7 + h * sc}, {x: 1.2, y: .7 + h * sc}, 'rgba(255,214,170,.3)', {w: 1, dash: [4, 6]});
      drawView('front', left, .7, sc, '主视图');
      drawView('left', 2.0, .7, sc, '左视图');
      drawView('top', left, -1.85, sc, '俯视图');
      sans('长对正', X(left), Y(-.95), 'rgba(255,214,170,.55)', 9.5);
      sans('高平齐', X(1.0), Y(.7 + h * sc / 2), 'rgba(255,214,170,.55)', 9.5);
    } else {
      const iso = s.view === 'iso';
      const cx = 0, cy = iso ? -1.1 : (s.view === 'top' ? -.1 : -1.0);
      const sc = 1.15;
      const names = {iso: '斜二测直观图', front: '主视图（从前向后看）', left: '左视图（从左向右看）', top: '俯视图（从上向下看）'};
      drawView(s.view, cx, cy, sc, names[s.view]);
      if (iso) {
        const ap = projV([0, h, 0], 'iso', cx, cy, sc);
        handle(ap, '#ffa97a', hoverId === 'apex');
        sans('拖动顶点改变高', X(cx), Y(cy - 1.55), 'rgba(255,190,150,.6)', 10);
      }
    }
    sans('底面边长 2.4', X(-5.2), Y(3.15), 'rgba(220,180,150,.7)', 10.5, 'left');
  },
  hud() {
    const s = this.state;
    const names = {iso: '斜二测直观图', front: '主视图', left: '左视图', top: '俯视图', three: '三视图对照'};
    return [
      {k: '当前视角', v: names[s.view], hi: true},
      {k: '底面边长', v: '2.4'},
      {k: '高 h', v: fmt(s.h, 2)},
      {k: '主视图面积', v: fmt(1.2 * s.h, 2)}
    ];
  },
  panel(el) {
    const s = this.state;
    const r1 = row(el);
    addBtn(r1, '立体图', () => { s.view = 'iso'; buildPanel(); }, s.view === 'iso' ? '' : 'ghost');
    addBtn(r1, '主视图', () => { s.view = 'front'; buildPanel(); }, s.view === 'front' ? '' : 'ghost');
    addBtn(r1, '左视图', () => { s.view = 'left'; buildPanel(); }, s.view === 'left' ? '' : 'ghost');
    const r2 = row(el);
    addBtn(r2, '俯视图', () => { s.view = 'top'; buildPanel(); }, s.view === 'top' ? '' : 'ghost');
    addBtn(r2, '三视图对照', () => { s.view = 'three'; buildPanel(); }, s.view === 'three' ? '' : 'ghost');
    addSlider(el, '高 h', 1.4, 3.4, .1, s.h, v => v.toFixed(1), v => s.h = v);
    addToggle(el, '显示尺寸标注', s.dim, v => s.dim = v);
  }
});

})();
