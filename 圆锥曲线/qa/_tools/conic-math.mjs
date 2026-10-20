// Independent conic geometry engine for QA — computes from definitions/formulas,
// not from the page's own implementation.
const TAU = Math.PI * 2;
const hypot = (x, y) => Math.hypot(x, y);

export const MODE_NAMES = { ellipse: '椭圆', hyperbola: '双曲线', parabola: '抛物线', unified: '统一视角' };

function orient(p, orientation) { return orientation === 'y' ? { x: p.y, y: p.x } : { x: p.x, y: p.y }; }
function fociList(points) { return points.map(p => [p.x, p.y]); }

export function expectedGeometry(mode, orientation, prm) {
  const o = orientation === 'y' ? 'y' : 'x';
  if (mode === 'ellipse') {
    const a = prm.a, e = prm.e;
    const c = a * e;
    const b = a * Math.sqrt(Math.max(0, 1 - e * e));
    const circle = c < 1e-9;
    const fociCanonical = circle ? [{ x: 0, y: 0 }] : [{ x: -c, y: 0 }, { x: c, y: 0 }];
    const foci = fociCanonical.map(p => orient(p, o));
    const directrices = circle ? [] : [
      { type: o === 'x' ? 'vertical' : 'horizontal', value: -(a * a / c) },
      { type: o === 'x' ? 'vertical' : 'horizontal', value: a * a / c }
    ];
    return {
      kind: circle ? 'circle' : 'ellipse', a, b, c, e, orientation: o,
      foci: fociList(foci), vertices: [[-a, 0], [a, 0]].map(p => { const q = orient({ x: p[0], y: p[1] }, o); return [q.x, q.y]; }),
      directrices, asymptotes: [], semiLatusRectum: b * b / a, focalParameter: circle ? null : b * b / c,
      equation: circle ? 'x² + y² = ' + round4(a * a) : (o === 'x' ? 'x²/' + round4(a * a) + ' + y²/' + round4(b * b) + ' = 1' : 'x²/' + round4(b * b) + ' + y²/' + round4(a * a) + ' = 1'),
      invariant: { type: 'sum', value: 2 * a }, eRange: circle ? 'e=0' : '0<=e<1'
    };
  }
  if (mode === 'hyperbola') {
    const a = prm.a, e = prm.e;
    const b = a * Math.sqrt(Math.max(0, e * e - 1));
    const c = a * e;
    const foci = fociList([{ x: -c, y: 0 }, { x: c, y: 0 }].map(p => orient(p, o)));
    const dv = a * a / c;
    const slope = o === 'x' ? b / a : a / b;
    return {
      kind: 'hyperbola', a, b, c, e, orientation: o, foci,
      vertices: [[-a, 0], [a, 0]].map(p => { const q = orient({ x: p[0], y: p[1] }, o); return [q.x, q.y]; }),
      directrices: [
        { type: o === 'x' ? 'vertical' : 'horizontal', value: -dv },
        { type: o === 'x' ? 'vertical' : 'horizontal', value: dv }
      ],
      asymptotes: [{ slope: slope, intercept: 0 }, { slope: -slope, intercept: 0 }],
      semiLatusRectum: b * b / a, focalParameter: b * b / c,
      equation: o === 'x' ? 'x²/' + round4(a * a) + ' − y²/' + round4(b * b) + ' = 1' : 'y²/' + round4(a * a) + ' − x²/' + round4(b * b) + ' = 1',
      invariant: { type: 'diff', value: 2 * a }, eRange: 'e>1'
    };
  }
  if (mode === 'parabola') {
    const p = prm.p;
    const focus = orient({ x: p / 2, y: 0 }, o);
    const directrix = { type: o === 'x' ? 'vertical' : 'horizontal', value: -p / 2 };
    return {
      kind: 'parabola', p, e: 1, orientation: o, foci: [[focus.x, focus.y]],
      vertices: [[0, 0]], directrices: [directrix], asymptotes: [],
      semiLatusRectum: p, focalParameter: p,
      equation: o === 'x' ? 'y² = ' + round4(2 * p) + 'x' : 'x² = ' + round4(2 * p) + 'y',
      invariant: { type: 'parabola', value: 1 }, eRange: 'e=1'
    };
  }
  if (mode === 'unified') {
    const e = prm.e, l = prm.l;
    const d = l / e;
    const center = e > 1 ? -e * l / (e * e - 1) : (e < 1 ? e * l / (1 - e * e) : null);
    return {
      kind: e < 1 ? 'ellipse' : (Math.abs(e - 1) < 1e-9 ? 'parabola' : 'hyperbola'),
      e, l, d, center, orientation: 'x',
      foci: [[0, 0]], directrices: [{ type: 'vertical', value: -d }], asymptotes: [],
      semiLatusRectum: l, focalParameter: d,
      equation: 'r = ' + round4(l) + ' / (1 − ' + round4(e) + ' cos θ)',
      invariant: { type: 'ratio', value: e }, eRange: e < 1 ? 'e<1' : (Math.abs(e - 1) < 1e-9 ? 'e=1' : 'e>1')
    };
  }
  throw new Error('unknown mode ' + mode);
}
function round4(v) { return Math.round(v * 1e4) / 1e4; }

export function pointOnCurveResidual(mode, orientation, prm, P) {
  const x = P[0], y = P[1];
  if (mode === 'ellipse') {
    const a = prm.a, b = prm.a * Math.sqrt(Math.max(0, 1 - prm.e * prm.e));
    return orientation === 'y' ? Math.abs((x / b) ** 2 + (y / a) ** 2 - 1) : Math.abs((x / a) ** 2 + (y / b) ** 2 - 1);
  }
  if (mode === 'hyperbola') {
    const a = prm.a, b = prm.a * Math.sqrt(Math.max(0, prm.e * prm.e - 1));
    return orientation === 'y' ? Math.abs((y / a) ** 2 - (x / b) ** 2 - 1) : Math.abs((x / a) ** 2 - (y / b) ** 2 - 1);
  }
  if (mode === 'parabola') {
    const p = prm.p;
    return orientation === 'y' ? Math.abs(x * x - 2 * p * y) : Math.abs(y * y - 2 * p * x);
  }
  if (mode === 'unified') {
    const d = prm.l / prm.e;
    return Math.abs(Math.hypot(x, y) - prm.e * Math.abs(x + d));
  }
  return NaN;
}

export function pointMeasures(mode, orientation, prm, P) {
  const x = P[0], y = P[1];
  if (mode === 'ellipse') {
    const c = prm.a * prm.e;
    const f1 = orient({ x: -c, y: 0 }, orientation), f2 = orient({ x: c, y: 0 }, orientation);
    const d1 = hypot(x - f1.x, y - f1.y), d2 = hypot(x - f2.x, y - f2.y);
    const dv = prm.a * prm.a / c;
    const distLine = orientation === 'y' ? Math.abs(y - (-dv)) : Math.abs(x - (-dv));
    return { d1, d2, sum: d1 + d2, diff: Math.abs(d1 - d2), dFocus: Math.min(d1, d2), dDirectrix: distLine };
  }
  if (mode === 'hyperbola') {
    const c = prm.a * prm.e;
    const f1 = orient({ x: -c, y: 0 }, orientation), f2 = orient({ x: c, y: 0 }, orientation);
    const d1 = hypot(x - f1.x, y - f1.y), d2 = hypot(x - f2.x, y - f2.y);
    return { d1, d2, sum: d1 + d2, diff: Math.abs(d1 - d2), dFocus: Math.min(d1, d2), dDirectrix: 0 };
  }
  if (mode === 'parabola') {
    const p = prm.p;
    const focus = orientation === 'y' ? { x: 0, y: p / 2 } : { x: p / 2, y: 0 };
    const dFocus = hypot(x - focus.x, y - focus.y);
    const dDirectrix = orientation === 'y' ? Math.abs(y + p / 2) : Math.abs(x + p / 2);
    return { dFocus, dDirectrix, ratio: dDirectrix > 1e-12 ? dFocus / dDirectrix : null };
  }
  if (mode === 'unified') {
    const d = prm.l / prm.e;
    const dFocus = Math.hypot(x, y);
    const dDirectrix = Math.abs(x + d);
    return { dFocus, dDirectrix, ratio: dDirectrix > 1e-12 ? dFocus / dDirectrix : null };
  }
  throw new Error('bad mode');
}

export function mirrorPointForSecondBranch(mode, prm, P) {
  if (mode !== 'unified' || prm.e <= 1) return null;
  const cH = prm.e * prm.l / (prm.e * prm.e - 1);
  return [-2 * cH - P[0], -P[1]];
}
