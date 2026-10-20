import fs from 'node:fs';
import { expectedGeometry, pointOnCurveResidual, pointMeasures, mirrorPointForSecondBranch } from './conic-math.mjs';
const presets = JSON.parse(fs.readFileSync('research/presets.json', 'utf8')).presets;
let bad = 0;
function near(a, b, tol) { return Math.abs(a - b) <= (tol || 1e-9) * Math.max(1, Math.abs(a), Math.abs(b)); }
for (const x of presets) {
  const o = x.orientation === 'vertical' ? 'y' : 'x';
  const g = expectedGeometry(x.mode, o, x.params);
  const ex = x.expected;
  // Compare independent geometry with presets.json expected (only geometry that is independent of page range clamps)
  let issues = [];
  if (x.mode !== 'unified') {
    if (ex.foci.length !== g.foci.length) issues.push('foci count');
  }
  const fset = ex.foci.slice().sort().map(p => p.join(',')).join('|');
  const gset = g.foci.slice().sort().map(p => p.map(v => Math.round(v * 1e9) / 1e9).join(',')).join('|');
  if (x.mode !== 'unified' && fset !== gset) issues.push('foci: expected ' + JSON.stringify(ex.foci) + ' got ' + JSON.stringify(g.foci));
  if (ex.semiLatusRectum != null && !near(ex.semiLatusRectum, g.semiLatusRectum, 1e-9)) issues.push('l');
  if (x.mode === 'hyperbola') {
    const slopes = (ex.asymptotes || []).map(a => a.slope).sort().join(',');
    const gs = g.asymptotes.map(a => a.slope).sort().join(',');
    if (slopes !== gs) issues.push('asym slopes expected ' + slopes + ' got ' + gs);
  }
  if (x.mode === 'parabola') {
    if (ex.foci.length !== 1 || !near(ex.foci[0][0], g.foci[0][0], 1e-9) || !near(ex.foci[0][1], g.foci[0][1], 1e-9)) issues.push('parabola focus');
  }
  // Point-on-curve residual from presets point coords
  const P = x.point.coords;
  if (x.mode !== 'unified') {
    const r = pointOnCurveResidual(x.mode, o, x.params, P);
    if (!(r < 1e-9)) issues.push('P residual ' + r);
  } else {
    const pp = { e: x.params.e, l: x.params.l };
    const d = pp.l / pp.e;
    const ratio = Math.hypot(P[0], P[1]) / Math.abs(P[0] + d);
    if (!near(ratio, pp.e, 1e-9)) issues.push('unified P ratio ' + ratio);
  }
  if (issues.length) { bad++; console.log('BAD', x.id, issues); }
  else console.log('OK ', x.id, '| l=', g.semiLatusRectum);
}
console.log('bad', bad);
