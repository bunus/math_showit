// QA part 1: load/env, four-mode readings, independent math, presets comparison,
// unified branches/clipping, parameter endpoints, URL params, errors.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { launchEdge, connectPage, sleep, waitFor, collectPageErrors } from './qa-lib.mjs';
import { expectedGeometry, pointOnCurveResidual, pointMeasures, mirrorPointForSecondBranch } from './conic-math.mjs';

const ROOT = 'D:/workspace/数学演示/圆锥曲线';
const URL_BASE = 'file:///' + encodeURI(ROOT) + '/index.html';
const URL0 = URL_BASE + '?mode=ellipse&a=5&e=0.6&axis=x&static=1&t=0.9';
const SHOTS = 'qa/screens';
fs.mkdirSync(SHOTS, { recursive: true });
const presetsJson = JSON.parse(fs.readFileSync('research/presets.json', 'utf8')).presets;

const results = { part: 1, startedAt: new Date().toISOString(), target: null, env: {}, checks: [], scenarios: [], presets: [], unified: {}, endpoints: [], urlParams: [], screenshots: [], errors: null };
let passN = 0, failN = 0;
function addCheck(id, ok, detail) {
  results.checks.push({ id, ok: !!ok, detail: detail === undefined ? null : detail });
  if (ok) { passN++; console.log('PASS', id, detail ? JSON.stringify(detail).slice(0, 240) : ''); }
  else { failN++; console.log('FAIL', id, detail ? JSON.stringify(detail).slice(0, 1600) : ''); }
}
function absNear(a, b, tol) { return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= (tol == null ? 1e-9 : tol); }
function relNear(a, b, tol) { return absNear(a, b, (tol == null ? 1e-9 : tol) * Math.max(1, Math.abs(a), Math.abs(b))); }
function sortedPairs(list) { return list.map(p => [p.x != null ? p.x : p[0], p.y != null ? p.y : p[1]]).map(p => p.map(v => Math.round(v * 1e9) / 1e9).join(',')).sort().join('|'); }
function fociPairs(diag) { return (diag.foci || []).map(f => [f.x, f.y]); }
function sortedFoci(list) { return list.map(p => [round9(p[0]), round9(p[1])].join(',')).sort().join('|'); }
function uniquePairs(list) { const m = new Map(); list.forEach(p => { m.set(round9(p[0]) + ',' + round9(p[1]), [p[0], p[1]]); }); return Array.from(m.values()); }
function round9(v) { return Math.round(v * 1e9) / 1e9; }
function sortedDirectrices(list) { return list.map(d => (d.type === 'v' ? 'vertical' : d.type === 'h' ? 'horizontal' : d.type) + ':' + round9(d.value)).sort().join('|'); }
function expDirectrices(list) { return list.map(d => d.type + ':' + round9(d.value)).sort().join('|'); }
function parseNumberTokens(text) {
  const out = [];
  const re = /[−-]?\d+(?:\.\d+)?/g; let m;
  while ((m = re.exec(String(text))) !== null) out.push(parseFloat(m[0].replace('−', '-')));
  return out;
}
function findFeature(snap, key) {
  for (const row of snap.features) { if (row.indexOf(key) === 0) return row.slice(key.length).trim(); }
  return null;
}
function nonFinitePaths(obj, prefix, out) {
  out = out || []; prefix = prefix || '$';
  if (typeof obj === 'number') { if (!Number.isFinite(obj)) out.push(prefix + '=' + obj); return out; }
  if (Array.isArray(obj)) { obj.forEach((v, i) => nonFinitePaths(v, prefix + '[' + i + ']', out)); return out; }
  if (obj && typeof obj === 'object') { Object.keys(obj).forEach(k => nonFinitePaths(obj[k], prefix + '.' + k, out)); return out; }
  return out;
}
function expectedPageName(mode, params) {
  if (mode === 'ellipse') return params.e < 1e-9 ? '圆' : '椭圆';
  if (mode === 'hyperbola') return '双曲线';
  if (mode === 'parabola') return '抛物线';
  return params.e < 1 - 1e-9 ? '椭圆' : (params.e > 1 + 1e-9 ? '双曲线' : '抛物线');
}
const SNAP = "(function(){function t(id){var e=document.getElementById(id);return e?e.textContent.replace(/\\s+/g,' ').trim():null;}var feats=Array.prototype.map.call(document.querySelectorAll('#featureList .feature-row'),function(r){return r.textContent.replace(/\\s+/g,' ').trim();});var cv=document.getElementById('scene');var im=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;var s=0,nz=0;for(var i=0;i<im.length;i+=16){s=(s*31+im[i]+(im[i+1]<<3)+(im[i+2]<<6)+(im[i+3]<<9))>>>0;if(im[i+3]>0)nz++;}return {diag:window.__CONIC_LAB__.getDiagnostics(),state:window.__CONIC_LAB__.getState(),liveName:t('liveName'),liveE:t('liveE'),familyChip:t('familyChip'),eqSymbolic:(document.getElementById('eqSymbolic').textContent||'').replace(/\\s+/g,' ').trim(),eqNumeric:t('eqNumeric'),relationText:t('relationText'),eRangeText:t('eRangeText'),orientationLabel:t('orientationLabel'),metricGrid:(document.getElementById('metricGrid').textContent||'').replace(/\\s+/g,' ').trim(),features:feats,noteText:t('noteText'),defTitle:t('defTitle'),defFormula:(document.getElementById('defFormula').textContent||'').replace(/\\s+/g,' ').trim(),defValues:t('defValues'),pointReadout:t('pointReadout'),stageNote:t('stageNote'),originChip:t('originChip'),modeTabs:Array.prototype.map.call(document.querySelectorAll('.conic-tab'),function(b){return b.getAttribute('data-mode')+':'+b.getAttribute('aria-pressed');}),modeCards:Array.prototype.map.call(document.querySelectorAll('.mode-card'),function(b){return b.getAttribute('data-mode')+':'+b.getAttribute('aria-pressed');}),toggles:Array.prototype.map.call(document.querySelectorAll('.switch[data-toggle]'),function(b){return b.getAttribute('data-toggle')+':'+b.getAttribute('aria-pressed');}),axis:[document.getElementById('axisBtnX').getAttribute('aria-pressed'),document.getElementById('axisBtnY').getAttribute('aria-pressed')],rows:{a:!document.getElementById('rowA').hidden,e:!document.getElementById('rowE').hidden,p:!document.getElementById('rowP').hidden,l:!document.getElementById('rowL').hidden},quickHidden:document.getElementById('unifiedQuick').hidden,axisHidden:document.getElementById('axisSwitch').hidden,canvas:{sig:s,nz:nz,w:cv.width,h:cv.height}};})()";

const edge = await launchEdge({ port: 9460, url: URL0 });
console.log('EDGE', edge.version.Browser);
let c = null;
try {
  c = await connectPage({ port: 9460 });
  await c.setViewport(1920, 1080, false);
  await c.bringToFront();
  await waitFor(async () => (await c.ev('document.documentElement.dataset.ready')) === 'true', 12000);
  await sleep(800);
  const _h = crypto.createHash('sha256').update(fs.readFileSync('index.html')).digest('hex').toUpperCase();
  const targetMeta = { file: 'index.html', size: fs.statSync('index.html').size, mtime: fs.statSync('index.html').mtime.toISOString(), sha256: _h };
  results.target = targetMeta;

  // ---------- env / load ----------
  const env = await c.evJson("(function(){var d=window.__CONIC_LAB__.getDiagnostics();return {title:document.title,ready:document.documentElement.dataset.ready,version:document.documentElement.dataset.version,api:!!window.__CONIC_LAB__,innerW:innerWidth,innerH:innerHeight,dpr:devicePixelRatio,scrollW:document.documentElement.scrollWidth,canvases:document.querySelectorAll('canvas').length,diagErrors:d.errors,resources:performance.getEntriesByType('resource').map(function(r){return r.name;}),mode:d.mode,name:d.name,playing:d.playing,modes:window.__CONIC_LAB__.modes()};})()");
  results.env = env;
  addCheck('env.ready', env.ready === 'true' && env.api === true, { ready: env.ready, api: env.api });
  addCheck('env.title', env.title.indexOf('圆锥曲线') !== -1, env.title);
  addCheck('env.modes-four', env.modes.length === 4 && env.modes.map(m => m.id).join(',') === 'ellipse,hyperbola,parabola,unified', env.modes);
  addCheck('env.diag-errors-empty', Array.isArray(env.diagErrors) && env.diagErrors.length === 0, env.diagErrors);
  addCheck('env.one-canvas', env.canvases === 1, env.canvases);
  addCheck('env.no-external-resources', env.resources.length === 0, env.resources);

  async function apply(mode, params, orientation, phase) {
    await c.ev("window.__CONIC_LAB__.applyPreset(" + JSON.stringify(mode) + "," + JSON.stringify(params) + "," + JSON.stringify(orientation || 'x') + "," + (isFinite(phase) ? phase : 0.9) + ");true");
    await sleep(180);
  }
  async function snap() { return c.evJson(SNAP); }
  async function shot(file) { results.screenshots.push(await c.shot(SHOTS + '/' + file)); }

  // ---------- scenario matrix ----------
  const SCENARIOS = [
    { id: 'ellipse-h-E1', mode: 'ellipse', params: { a: 5, e: 0.6 }, orientation: 'x', phase: 0.9, preset: 'E1-ellipse-h-a5-e06', shot: '01-ellipse-horizontal-1920.png' },
    { id: 'ellipse-v-E2', mode: 'ellipse', params: { a: 5, e: 0.6 }, orientation: 'y', phase: 0.9, preset: 'E2-ellipse-v-a5-e06', shot: '02-ellipse-vertical-1920.png' },
    { id: 'circle-E3', mode: 'ellipse', params: { a: 4, e: 0 }, orientation: 'x', phase: 0.9, preset: 'E3-circle-a4-e0', shot: '03-ellipse-circle-e0-1920.png' },
    { id: 'hyperbola-h-H1', mode: 'hyperbola', params: { a: 3, e: 5 / 3 }, orientation: 'x', phase: 0.9, preset: 'H1-hyperbola-h-a3-e1667', shot: '04-hyperbola-horizontal-1920.png' },
    { id: 'hyperbola-v-H2', mode: 'hyperbola', params: { a: 3, e: 5 / 3 }, orientation: 'y', phase: 0.9, preset: 'H2-hyperbola-v-a3-e1667', shot: '05-hyperbola-vertical-1920.png' },
    { id: 'parabola-h-P1', mode: 'parabola', params: { p: 4 }, orientation: 'x', phase: 0.9, preset: 'P1-parabola-h-p4', shot: '06-parabola-horizontal-1920.png' },
    { id: 'parabola-v-P2', mode: 'parabola', params: { p: 3 }, orientation: 'y', phase: 0.9, preset: 'P2-parabola-v-p3', shot: '07-parabola-vertical-1920.png' },
    { id: 'unified-e065-U1', mode: 'unified', params: { e: 0.6, l: 3.2 }, orientation: 'x', phase: 1.0, preset: 'U1-unified-ellipse-l32-e06', shot: '08-unified-e0.6-ellipse-1920.png' },
    { id: 'unified-e1-U2', mode: 'unified', params: { e: 1, l: 4 }, orientation: 'x', phase: 1.0, preset: 'U2-unified-parabola-l4-e1', shot: '09-unified-e1-parabola-1920.png' },
    { id: 'unified-e1667-U4', mode: 'unified', params: { e: 5 / 3, l: 16 / 9 }, orientation: 'x', phase: 1.2, preset: 'U4-unified-hyperbola-l169-e53', shot: '10-unified-e1.6667-two-branches-1920.png' },
    { id: 'unified-e16', mode: 'unified', params: { e: 1.6, l: 2.5 }, orientation: 'x', phase: 0.9, preset: null, shot: '11-unified-e1.6-two-branches-1920.png' },
    { id: 'unified-e098-clip', mode: 'unified', params: { e: 0.98, l: 2.5 }, orientation: 'x', phase: 1.0, preset: null, shot: '12-unified-e0.98-clipped-1920.png' }
  ];
  const presetById = {};
  presetsJson.forEach(p => { presetById[p.id] = p; });

  for (const sc of SCENARIOS) {
    await apply(sc.mode, sc.params, sc.orientation, sc.phase);
    const s = await snap();
    const d = s.diag;
    const exp = expectedGeometry(sc.mode, sc.orientation, sc.params);
    const row = { id: sc.id, scenario: sc, snapshot: s, expected: exp };
    results.scenarios.push(row);
    const nonFinite = nonFinitePaths(d);
    addCheck('scenario.' + sc.id + '.mode-name', d.mode === sc.mode && d.name === expectedPageName(sc.mode, sc.params), { mode: d.mode, name: d.name });
    addCheck('scenario.' + sc.id + '.no-nonfinite', nonFinite.length === 0, nonFinite.slice(0, 8));
    const expOrigin = sc.mode === 'unified' ? '原点 = 焦点 F' : (sc.mode === 'parabola' ? '原点 = 顶点 O' : '原点 = 中心 O');
    addCheck('scenario.' + sc.id + '.origin-annotation', (s.stageNote || '').indexOf(expOrigin) !== -1 && (s.originChip || '').indexOf(sc.mode === 'unified' ? '焦点在原点' : (sc.mode === 'parabola' ? '顶点在原点' : '中心在原点')) !== -1, { stageNote: s.stageNote, originChip: s.originChip });
    const expOrientation = sc.mode === 'ellipse' ? (sc.params.e === 0 ? '圆心在原点' : (sc.orientation === 'x' ? '焦点在 x 轴' : '焦点在 y 轴'))
      : sc.mode === 'hyperbola' ? (sc.orientation === 'x' ? '实轴水平' : '实轴竖直')
        : sc.mode === 'parabola' ? (sc.orientation === 'x' ? '开口向右' : '开口向上')
          : '焦点在原点 · 准线在左';
    addCheck('scenario.' + sc.id + '.orientation-label', s.orientationLabel === expOrientation, { page: s.orientationLabel, expected: expOrientation });
    const expDefFormula = sc.params.e === 0 ? '|PO| = a'
      : sc.mode === 'ellipse' ? '|PF₁| + |PF₂| = 2a'
        : sc.mode === 'hyperbola' ? '| |PF₁| − |PF₂| | = 2a'
          : sc.mode === 'parabola' ? '|PF| = d(P, ℓ)' : '|PF| / d(P, ℓ) = e';
    addCheck('scenario.' + sc.id + '.def-formula', (s.defFormula || '').replace(/\s+/g, '') === expDefFormula.replace(/\s+/g, ''), { page: s.defFormula, expected: expDefFormula });
    const prTokens = parseNumberTokens(s.pointReadout || '');
    addCheck('scenario.' + sc.id + '.point-readout', prTokens.length >= 2 && absNear(prTokens[0], d.P[0], 0.011) && absNear(prTokens[1], d.P[1], 0.011), { text: s.pointReadout, P: d.P });
    addCheck('scenario.' + sc.id + '.def-values-text', typeof s.defValues === 'string' && s.defValues.length > 6 && s.defValues.indexOf('NaN') === -1 && s.defValues.indexOf('Infinity') === -1, s.defValues);
    // derived values
    if (sc.mode === 'ellipse') {
      const g = d.derived;
      addCheck('scenario.' + sc.id + '.derived', relNear(g.a, exp.a) && relNear(g.b, exp.b) && relNear(g.c, exp.c) && relNear(g.e, exp.e), g);
      addCheck('scenario.' + sc.id + '.circle-special', sc.params.e === 0 ? (d.directrices.length === 0 && s.features.join(' ').indexOf('圆没有准线') !== -1) : true, { directrices: d.directrices, features: s.features });
    } else if (sc.mode === 'hyperbola') {
      const g = d.derived;
      addCheck('scenario.' + sc.id + '.derived', relNear(g.a, exp.a) && relNear(g.b, exp.b) && relNear(g.c, exp.c) && relNear(g.e, exp.e), g);
    } else if (sc.mode === 'parabola') {
      addCheck('scenario.' + sc.id + '.derived', relNear(d.derived.p, exp.p) && d.derived.e === 1, d.derived);
    } else {
      const g = d.derived;
      addCheck('scenario.' + sc.id + '.derived', relNear(g.e, exp.e) && relNear(g.l, exp.l) && relNear(g.d, exp.d), g);
    }
    // foci
    const pageFoci = sortedFoci(uniquePairs(fociPairs(d)));
    const expFoci = sortedFoci(uniquePairs(exp.foci));
    addCheck('scenario.' + sc.id + '.foci', pageFoci === expFoci, { page: fociPairs(d), expected: exp.foci });
    // directrices
    const pageDir = sortedDirectrices(d.directrices);
    const expDir = expDirectrices(exp.directrices);
    addCheck('scenario.' + sc.id + '.directrices', pageDir === expDir, { page: d.directrices, expected: exp.directrices });
    // asymptotes (hyperbola)
    if (sc.mode === 'hyperbola') {
      const labels = d.asymptotes || [];
      const parsed = labels.map(l => { const m = String(l).match(/±\s*([0-9.]+)/); return m ? parseFloat(m[1]) : null; });
      const expSlopes = exp.asymptotes.map(a => Math.abs(a.slope));
      const ok = labels.length === 2 && parsed.every(v => v != null) && parsed.every(v => expSlopes.some(e => absNear(v, e, 0.006)));
      addCheck('scenario.' + sc.id + '.asymptotes', ok, { labels: labels, parsed: parsed, expectedAbsSlopes: expSlopes });
    }
    // equation numeric
    const numeric = d.equation.numeric || '';
    if (sc.mode === 'ellipse') {
      if (sc.params.e === 0) {
        const nums = parseNumberTokens(numeric);
        addCheck('scenario.' + sc.id + '.equation-numeric', absNear(nums[nums.length - 1], exp.a * exp.a, 0.011), numeric);
      } else {
        const nums = parseNumberTokens(numeric);
        const want = sc.orientation === 'x' ? [exp.a * exp.a, exp.b * exp.b] : [exp.b * exp.b, exp.a * exp.a];
        addCheck('scenario.' + sc.id + '.equation-numeric', nums.length >= 2 && absNear(nums[0], want[0], 0.011) && absNear(nums[1], want[1], 0.011), { numeric, want });
      }
    } else if (sc.mode === 'hyperbola') {
      const nums = parseNumberTokens(numeric);
      const want = sc.orientation === 'x' ? [exp.a * exp.a, exp.b * exp.b] : [exp.a * exp.a, exp.b * exp.b];
      addCheck('scenario.' + sc.id + '.equation-numeric', nums.length >= 2 && absNear(nums[0], want[0], 0.011) && absNear(nums[1], want[1], 0.011), { numeric, want });
    } else if (sc.mode === 'parabola') {
      const nums = parseNumberTokens(numeric);
      addCheck('scenario.' + sc.id + '.equation-numeric', absNear(nums[nums.length - 1], 2 * exp.p, 0.011), numeric);
    } else {
      const m = String(numeric).match(/r = ([0-9.]+) \/ \(1 − ([0-9.]+) cos θ\)/);
      addCheck('scenario.' + sc.id + '.equation-numeric', !!m && absNear(parseFloat(m[1]), exp.l, 0.011) && absNear(parseFloat(m[2]), exp.e, 0.011), { numeric, expected: { l: exp.l, e: exp.e } });
    }
    // P on curve, definition residual, distances
    const P = d.P;
    const residual = pointOnCurveResidual(sc.mode, sc.orientation, sc.params, P);
    addCheck('scenario.' + sc.id + '.P-on-curve', residual <= 1e-9, { residual: residual, P: P });
    addCheck('scenario.' + sc.id + '.definition-residual', d.definitionResidual != null && Math.abs(d.definitionResidual) <= 1e-9, { residual: d.definitionResidual });
    const ind = pointMeasures(sc.mode, sc.orientation, sc.params, P);
    const distOk = Object.keys(ind).every(k => d.distances[k] == null || absNear(d.distances[k], ind[k], 1e-9));
    addCheck('scenario.' + sc.id + '.distances-independent', distOk, { page: d.distances, independent: ind });
    if (sc.mode === 'ellipse') {
      addCheck('scenario.' + sc.id + '.invariant-sum', absNear(ind.sum, 2 * exp.a, 1e-9), { sum: ind.sum, target: 2 * exp.a });
    } else if (sc.mode === 'hyperbola') {
      addCheck('scenario.' + sc.id + '.invariant-diff', absNear(ind.diff, 2 * exp.a, 1e-9), { diff: ind.diff, target: 2 * exp.a });
    } else if (sc.mode === 'parabola') {
      addCheck('scenario.' + sc.id + '.invariant-ratio1', absNear(ind.dFocus, ind.dDirectrix, 1e-9), { dFocus: ind.dFocus, dDirectrix: ind.dDirectrix });
    } else {
      addCheck('scenario.' + sc.id + '.invariant-ratio-e', absNear(ind.ratio, exp.e, 1e-9), { ratio: ind.ratio, e: exp.e });
    }
    // DOM features vs expected values
    const focusRow = findFeature(s, '焦点');
    if (sc.mode === 'unified') {
      addCheck('scenario.' + sc.id + '.feature-focus', focusRow !== null && focusRow.indexOf('F(0, 0)') !== -1, focusRow);
    } else {
      const tokens = parseNumberTokens(focusRow || '');
      const flat = exp.foci.flat();
      const okFocusText = tokens.length === flat.length && flat.every((v, i) => absNear(tokens[i], v, 0.011));
      addCheck('scenario.' + sc.id + '.feature-focus', okFocusText, { text: focusRow, expectedTokens: flat, tokens });
    }
    const dirRow = findFeature(s, '准线');
    if (sc.params.e === 0) {
      addCheck('scenario.' + sc.id + '.feature-directrix', dirRow !== null && dirRow.indexOf('圆没有准线') !== -1, dirRow);
    } else if (sc.mode === 'unified') {
      const tokens = parseNumberTokens(dirRow || '');
      addCheck('scenario.' + sc.id + '.feature-directrix', tokens.length >= 1 && absNear(tokens[0], -exp.d, 0.011), { text: dirRow, expected: -exp.d });
    } else {
      const tokens = parseNumberTokens(dirRow || '').map(v => Math.abs(v));
      const want = exp.directrices.map(x => Math.abs(x.value));
      const okDir = want.every(v => tokens.some(t => absNear(t, v, 0.011)));
      addCheck('scenario.' + sc.id + '.feature-directrix', okDir, { text: dirRow, expected: exp.directrices });
    }
    if (sc.mode === 'ellipse' && sc.params.e > 0) {
      const lRow = findFeature(s, '通径');
      const tokens = parseNumberTokens(lRow || '');
      addCheck('scenario.' + sc.id + '.feature-latus-rectum', tokens.length >= 1 && absNear(tokens[0], 2 * exp.semiLatusRectum, 0.011), { text: lRow, expected: 2 * exp.semiLatusRectum });
    }
    if (sc.mode === 'unified') {
      const lRow = findFeature(s, '半通径');
      const tokens = parseNumberTokens(lRow || '');
      addCheck('scenario.' + sc.id + '.feature-semi-latus', tokens.length >= 1 && absNear(tokens[0], exp.semiLatusRectum, 0.011), { text: lRow, expected: exp.semiLatusRectum });
    }
    if (sc.mode === 'hyperbola') {
      const asymRow = findFeature(s, '渐近线');
      const tokens = parseNumberTokens(asymRow || '');
      const want = Math.abs(exp.asymptotes[0].slope);
      addCheck('scenario.' + sc.id + '.feature-asymptote', tokens.length >= 1 && absNear(tokens[0], want, 0.006), { text: asymRow, expected: want });
    }
    // preset cross-check from research/presets.json
    if (sc.preset) {
      const pr = presetById[sc.preset];
      const ex = pr.expected;
      let focusMatch, dirMatch;
      if (sc.mode === 'unified') {
        focusMatch = pageFoci === '0,0' && ex.foci.some(p => p[0] === 0 && p[1] === 0);
        dirMatch = (d.directrices || []).length >= 1 && ex.directrices.some(x => {
          const type = d.directrices[0].type === 'v' ? 'vertical' : 'horizontal';
          return x.type === type && absNear(d.directrices[0].value, x.value, 1e-9);
        });
      } else {
        focusMatch = sortedFoci(uniquePairs(ex.foci)) === pageFoci;
        dirMatch = ex.directrices.length === 0
          ? (d.directrices || []).length === 0
          : expDirectrices(ex.directrices) === pageDir;
      }
      let asymMatch = true;
      if (ex.asymptotes && ex.asymptotes.length) {
        const labels = d.asymptotes || [];
        if (sc.mode === 'unified') {
          // unified 视角页面不绘制渐近线（buildUnified asymptotes: []），记录为观察项而非失败
          asymMatch = true;
          results.presets.push({ preset: sc.preset, observation: 'unified mode does not render asymptotes (page design)' });
        } else {
          asymMatch = labels.length === 2 && labels.every(l => { const m = String(l).match(/±\s*([0-9.]+)/); return m && ex.asymptotes.some(a => absNear(Math.abs(a.slope), parseFloat(m[1]), 0.006)); });
        }
      }
      let lMatch = true, lSource = '';
      if (sc.mode === 'unified') {
        const lRow = findFeature(s, '半通径'); const tok = parseNumberTokens(lRow || ''); lMatch = tok.length >= 1 && absNear(tok[0], ex.semiLatusRectum, 0.011); lSource = 'feature:' + lRow;
      } else if (sc.mode === 'ellipse' && sc.params.e !== 0) {
        const lRow = findFeature(s, '通径'); const tok = parseNumberTokens(lRow || ''); lMatch = tok.length >= 1 && absNear(tok[0], 2 * ex.semiLatusRectum, 0.011); lSource = 'feature:' + lRow;
      } else if (sc.mode === 'ellipse' && sc.params.e === 0) {
        lMatch = absNear(d.derived.a, ex.semiLatusRectum, 1e-9); lSource = 'derived.a';
      } else if (sc.mode === 'hyperbola') {
        lMatch = absNear(d.derived.b * d.derived.b / d.derived.a, ex.semiLatusRectum, 1e-9); lSource = 'derived b^2/a';
      } else if (sc.mode === 'parabola') {
        const nums = parseNumberTokens(s.metricGrid || '');
        lMatch = nums.length >= 1 && absNear(nums[nums.length - 1], 2 * ex.semiLatusRectum, 0.011); lSource = 'metricGrid:' + s.metricGrid;
      }
      addCheck('preset.' + sc.preset + '.matches-json', focusMatch && dirMatch && asymMatch && lMatch, { focusMatch, dirMatch, asymMatch, lMatch, lSource, pageFoci: fociPairs(d), pageDirectrices: d.directrices, pageAsym: d.asymptotes });
      results.presets.push({ preset: sc.preset, scenario: sc.id, focusMatch, dirMatch, asymMatch, lMatch, lSource, page: { foci: fociPairs(d), directrices: d.directrices, asymptotes: d.asymptotes, equation: d.equation, derived: d.derived } });
    }
    // screenshot
    if (sc.shot) await shot(sc.shot);
  }

  // ---------- out-of-range presets (U3 l=1, U5 e=0) clamp behavior ----------
  await apply('unified', { e: 2, l: 1 }, 'x', 1.0);
  const u3 = await snap();
  results.presets.push({ preset: 'U3-unified-hyperbola-l1-e2', clamped: true, page: { derived: u3.diag.derived, name: u3.diag.name, curves: u3.diag.curves } });
  addCheck('preset.U3.out-of-ui-range-clamped', absNear(u3.diag.derived.l, 1.5, 1e-9) && u3.diag.curves.length === 2 && nonFinitePaths(u3.diag).length === 0, { presetL: 1, pageL: u3.diag.derived.l, curves: u3.diag.curves.length });
  await apply('unified', { e: 0, l: 3 }, 'x', 1.0);
  const u5 = await snap();
  results.presets.push({ preset: 'U5-unified-circle-l3-e0', clamped: true, page: { derived: u5.diag.derived, name: u5.diag.name, curves: u5.diag.curves } });
  addCheck('preset.U5.out-of-ui-range-clamped', absNear(u5.diag.derived.e, 0.35, 1e-9) && u5.diag.curves.length === 1 && nonFinitePaths(u5.diag).length === 0, { presetE: 0, pageE: u5.diag.derived.e, name: u5.diag.name });

  // ---------- unified branch / clipping ----------
  await apply('unified', { e: 1.6, l: 2.5 }, 'x', 0.9);
  const ue16 = await snap();
  const expU16 = expectedGeometry('unified', 'x', { e: 1.6, l: 2.5 });
  const P16 = ue16.diag.P;
  const mirror = mirrorPointForSecondBranch('unified', { e: 1.6, l: 2.5 }, P16);
  const mirrorMeasures = pointMeasures('unified', 'x', { e: 1.6, l: 2.5 }, mirror);
  const mirrorResidual = pointOnCurveResidual('unified', 'x', { e: 1.6, l: 2.5 }, mirror);
  results.unified.e16 = { diag: ue16.diag, note: ue16.noteText, stageNote: ue16.stageNote, mirror, mirrorMeasures, mirrorResidual };
  addCheck('unified.e16.two-branches', ue16.diag.curves.length === 2 && ue16.diag.curves[1].dim === true, ue16.diag.curves);
  addCheck('unified.e16.branch-copy-text', ue16.noteText.indexOf('两支') !== -1 && ue16.noteText.indexOf('中心对称') !== -1, { note: ue16.noteText });
  results.unified.stageNoteObservation = { stageNote: ue16.stageNote, note: ue16.noteText, noteAbout: 'buildUnified() 计算了更详细的 stageNote（如「统一视角：e > 1 → 双曲线（两支） · 焦点在原点」），但 updateStaticUI 始终只写 originNote + P 文案，故该字段未显示；属轻微死字段/文案缺失，不影响主面板说明。' };
  addCheck('unified.e16.second-branch-satisfies-definition', mirrorResidual <= 1e-9 && absNear(mirrorMeasures.ratio, 1.6, 1e-9), { residual: mirrorResidual, ratio: mirrorMeasures.ratio });
  addCheck('unified.e16.P-focus-side', P16[0] > -expU16.d + 1e-9, { P: P16, directrixX: -expU16.d });

  // e 刚过 1：另一支中心在 5l 之外，视野只显示含焦点的一支，note 需要说明
  await apply('unified', { e: 1.05, l: 4 }, 'x', 1.0);
  const ufar = await snap();
  results.unified.e105far = { diag: ufar.diag, note: ufar.noteText };
  addCheck('unified.e105-far-branch-note', ufar.diag.curves.length === 2 && ufar.diag.name === '双曲线' && ufar.noteText.indexOf('另一支离得很远') !== -1 && ufar.noteText.indexOf('只显示含焦点的一支') !== -1, { note: ufar.noteText, curves: ufar.diag.curves });
  await c.shot('qa/screens/13-unified-e1.05-far-branch-note-1920.png'); results.screenshots.push('qa/screens/13-unified-e1.05-far-branch-note-1920.png');
  // 准线在视野外提示：截取舞台左下角区域 2x
  const stageRect = await c.evJson("(function(){var b=document.getElementById('stage').getBoundingClientRect();return {x:b.left,y:b.top,w:b.width,h:b.height};})()");
  await apply('ellipse', { a: 5, e: 0.6 }, 'x', 0.9);
  await sleep(250);
  await c.shot('qa/screens/14-directrix-offscreen-hint-2x.png', { x: stageRect.x + 4, y: stageRect.y + stageRect.h - 130, width: 330, height: 120, scale: 2 });
  results.screenshots.push('qa/screens/14-directrix-offscreen-hint-2x.png');

  await apply('unified', { e: 0.98, l: 2.5 }, 'x', 1.0);
  const ue098 = await snap();
  results.unified.e098 = { diag: ue098.diag, note: ue098.noteText, stageNote: ue098.stageNote, eRangeText: ue098.eRangeText };
  addCheck('unified.e098.clipped-open', ue098.diag.curves.length === 1 && ue098.diag.curves[0].closed === false && ue098.diag.name === '椭圆', ue098.diag.curves);
  addCheck('unified.e098.clip-message', ue098.noteText.indexOf('断开') !== -1 && ue098.noteText.indexOf('视野') !== -1, ue098.noteText);
  addCheck('unified.e098.no-fill', ue098.diag.curves[0].fill !== true, ue098.diag.curves[0]);

  await apply('unified', { e: 0.65, l: 2.5 }, 'x', 1.0);
  const ue065 = await snap();
  addCheck('unified.e065.closed-ellipse', ue065.diag.curves.length === 1 && ue065.diag.curves[0].closed === true && ue065.diag.name === '椭圆', ue065.diag.curves);

  await apply('unified', { e: 1, l: 2.5 }, 'x', 1.0);
  const ue1 = await snap();
  addCheck('unified.e1.parabola', ue1.diag.name === '抛物线' && ue1.diag.curves.length === 1 && ue1.diag.curves[0].closed === false && ue1.eRangeText.indexOf('e = 1') !== -1, { curves: ue1.diag.curves, eRange: ue1.eRangeText });

  // guide text wording audit
  await c.ev("document.getElementById('guideBtn').click();true"); await sleep(400);
  const guideText = await c.ev("document.getElementById('guideModal').innerText");
  await c.ev("document.querySelector('#guideModal .modal-close').click();true"); await sleep(300);
  results.unified.guideText = guideText;
  const forbidden = [
    { id: 'definition-only-one-branch', re: /定义(?:只|仅|只给出|只得到)(?:给出|得到)?(?:双曲线的?)?(?:一|单)(?:支|条)/ },
    { id: 'trajectory-only-one-branch', re: /轨迹(?:只|仅)(?:是|为|有)(?:双曲线的?)?(?:一|单)(?:支|条)/ },
    { id: 'hyperbola-one-branch-claim', re: /双曲线(?:只|仅)有(?:一|单)(?:支|条)/ }
  ];
  const textAll = guideText + '\n' + ue16.noteText + '\n' + ue16.stageNote;
  const hitList = forbidden.filter(f => f.re.test(textAll));
  results.unified.forbiddenHits = hitList.map(f => f.id);
  addCheck('unified.wording.no-definition-one-branch', hitList.length === 0, hitList.map(f => f.id));
  addCheck('unified.wording.explains-both-branches', guideText.indexOf('两支') !== -1 && guideText.indexOf('只描出含焦点的一支') !== -1 && guideText.indexOf('中心对称') !== -1, { hasTwoBranches: guideText.indexOf('两支') !== -1, hasPolarNote: guideText.indexOf('只描出含焦点的一支') !== -1, hasSymmetry: guideText.indexOf('中心对称') !== -1 });

  // ---------- parameter endpoints ----------
  const endpoints = [
    { id: 'ellipse-circle-min', mode: 'ellipse', params: { a: 2, e: 0 }, orientation: 'x' },
    { id: 'ellipse-max', mode: 'ellipse', params: { a: 5, e: 0.85 }, orientation: 'x' },
    { id: 'ellipse-min-flat', mode: 'ellipse', params: { a: 2, e: 0.85 }, orientation: 'y' },
    { id: 'hyperbola-min', mode: 'hyperbola', params: { a: 1.2, e: 1.05 }, orientation: 'x' },
    { id: 'hyperbola-max', mode: 'hyperbola', params: { a: 3.2, e: 2 }, orientation: 'x' },
    { id: 'hyperbola-max-v', mode: 'hyperbola', params: { a: 3.2, e: 2 }, orientation: 'y' },
    { id: 'parabola-min', mode: 'parabola', params: { p: 1 }, orientation: 'x' },
    { id: 'parabola-max', mode: 'parabola', params: { p: 5 }, orientation: 'x' },
    { id: 'parabola-max-v', mode: 'parabola', params: { p: 5 }, orientation: 'y' },
    { id: 'unified-min', mode: 'unified', params: { e: 0.35, l: 1.5 }, orientation: 'x' },
    { id: 'unified-min-e-max-l', mode: 'unified', params: { e: 0.35, l: 4 }, orientation: 'x' },
    { id: 'unified-max', mode: 'unified', params: { e: 2.2, l: 1.5 }, orientation: 'x' },
    { id: 'unified-max-both', mode: 'unified', params: { e: 2.2, l: 4 }, orientation: 'x' },
    { id: 'unified-parabola-min-l', mode: 'unified', params: { e: 1, l: 1.5 }, orientation: 'x' },
    { id: 'unified-parabola-max-l', mode: 'unified', params: { e: 1, l: 4 }, orientation: 'x' }
  ];
  for (const ep of endpoints) {
    let err = null;
    try { await apply(ep.mode, ep.params, ep.orientation, 3.2); } catch (e) { err = String(e.message || e); }
    const s = err ? null : await snap();
    const d = s ? s.diag : null;
    const nonFinite = d ? nonFinitePaths(d) : ['apply failed'];
    let residual = null, onCurve = null;
    if (d && d.P) {
      residual = d.definitionResidual;
      onCurve = pointOnCurveResidual(ep.mode, ep.orientation, ep.params, d.P);
    }
    results.endpoints.push({ id: ep.id, params: ep.params, derived: d && d.derived, definitionResidual: residual, onCurve: onCurve, curves: d && d.curves, errors: nonFinite, applyError: err });
    addCheck('endpoint.' + ep.id, !err && nonFinite.length === 0 && residual != null && Math.abs(residual) <= 1e-9 && onCurve != null && onCurve <= 1e-9 && d.equation.numeric.length > 0, { derived: d && d.derived, residual: residual, onCurve: onCurve, curves: d && d.curves });
  }

  // ---------- URL parameters ----------
  const URL_CASES = [
    { id: 'url-ellipse', url: URL_BASE + '?mode=ellipse&a=5&e=0.6&axis=x&static=1&t=0.95', expect: { mode: 'ellipse', name: '椭圆', playing: false, phase: 0.95, orientation: 'x', a: 5, e: 0.6 } },
    { id: 'url-hyperbola-v', url: URL_BASE + '?mode=hyperbola&a=2.2&e=1.45&axis=y&static=1&t=1.2', expect: { mode: 'hyperbola', name: '双曲线', playing: false, phase: 1.2, orientation: 'y', a: 2.2, e: 1.45 } },
    { id: 'url-parabola', url: URL_BASE + '?mode=parabola&p=3&axis=x&static=1&t=1.2', expect: { mode: 'parabola', name: '抛物线', playing: false, phase: 1.2, orientation: 'x', p: 3 } },
    { id: 'url-unified-e16', url: URL_BASE + '?mode=unified&e=1.6&l=2.5&static=1&t=2.0', expect: { mode: 'unified', name: '双曲线', playing: false, phase: 2.0, e: 1.6, l: 2.5 } },
    { id: 'url-unified-e098', url: URL_BASE + '?mode=unified&e=0.98&l=2.5&static=1', expect: { mode: 'unified', name: '椭圆', playing: false, e: 0.98, l: 2.5 } },
    { id: 'url-circle', url: URL_BASE + '?mode=ellipse&a=4&e=0&axis=x&static=1', expect: { mode: 'ellipse', name: '圆', playing: false, a: 4, e: 0 } },
    { id: 'url-paused', url: URL_BASE + '?mode=ellipse&paused=1', expect: { mode: 'ellipse', playing: false } },
    { id: 'url-bad-mode', url: URL_BASE + '?mode=bogus', expect: { mode: 'ellipse', name: '椭圆' } }
  ];
  for (const uc of URL_CASES) {
    await c.navigate(uc.url);
    await waitFor(async () => (await c.ev('document.documentElement.dataset.ready')) === 'true', 10000);
    await sleep(450);
    const st = await c.evJson("(function(){var s=window.__CONIC_LAB__.getState();var d=window.__CONIC_LAB__.getDiagnostics();return {state:s,diag:{mode:d.mode,name:d.name,derived:d.derived,curves:d.curves,eRange:d.equation.eRange},errors:d.errors,playing:d.playing,bodyText:(document.body.innerText||'')};})()");
    const row = { id: uc.id, url: uc.url, expect: uc.expect, got: st };
    results.urlParams.push(row);
    const e = uc.expect; const okParts = { mode: st.state.mode === e.mode, playing: e.playing == null || st.state.playing === e.playing };
    if (e.name) okParts.name = st.diag.name === e.name;
    if (e.orientation) okParts.orientation = st.state.orientation === e.orientation;
    if (e.phase != null) okParts.phase = Math.abs(st.state.phase - e.phase) <= 1e-9;
    if (e.a != null) okParts.a = relNear(st.state.params[Object.keys(st.state.params).find(k => st.state.params[k].a != null)] ? st.state.params[st.state.mode].a : NaN, e.a);
    addCheck('url.' + uc.id, Object.keys(okParts).every(k => okParts[k]) && st.errors.length === 0 && !/NaN|Infinity|undefined/.test(st.bodyText), { okParts, state: st.state, name: st.diag.name });
  }

  // ---------- errors / network ----------
  const pageErrors = collectPageErrors(c.events);
  const diagErrors = await c.ev('window.__CONIC_LAB__.getDiagnostics().errors');
  const reqs = c.events.filter(e => e.method === 'Network.requestWillBeSent').map(e => e.params.request.url);
  const external = reqs.filter(u => !u.startsWith('file://') && !u.startsWith('data:'));
  results.errors = { pageErrors, diagErrors, runtimeExceptions: c.events.filter(e => e.method === 'Runtime.exceptionThrown').length, networkRequests: reqs, external };
  addCheck('errors.no-runtime-exceptions', results.errors.runtimeExceptions === 0, results.errors.runtimeExceptions);
  addCheck('errors.no-console-or-log-errors', pageErrors.length === 0, pageErrors.slice(0, 6));
  addCheck('errors.diag-empty', Array.isArray(diagErrors) && diagErrors.length === 0, diagErrors);
  addCheck('errors.no-external-network', external.length === 0, external);

  results.passCount = passN; results.failCount = failN;
} catch (err) {
  results.fatalError = String(err && err.stack || err);
  console.error('FATAL', err);
} finally {
  try { if (c) c.close(); } catch (e) {}
  try { await edge.kill(); } catch (e) {}
  fs.writeFileSync('qa/_tools/results-part1.json', JSON.stringify(results, null, 1));
  console.log('==== PART1 DONE pass=' + passN + ' fail=' + failN + ' ====');
}
