// QA part 1: environment, preset matrix via real clicks, independent math checks, robustness.
import fs from 'node:fs';
import { launchEdge, connectPage, sleep, waitFor, collectPageErrors } from './qa-lib.mjs';
import { section, analyzeGeo, classifyGeo, NAME_BY_TYPE, normalize, support, randomUnitVector } from './geom.mjs';

const PORT = 9444;
const URL = 'file:///D:/workspace/%E6%95%B0%E5%AD%A6%E6%BC%94%E7%A4%BA/index.html?preset=regular-hexagon&static=1';
const SHOTS = 'qa/shots';
fs.mkdirSync(SHOTS, { recursive: true });
const expected = JSON.parse(fs.readFileSync('qa/_tools/expected.json', 'utf8'));
import crypto from 'node:crypto';
const targetFile = 'index.html';
const targetBuf = fs.readFileSync(targetFile);
const targetMeta = { file: 'index.html', size: targetBuf.length, sha256: crypto.createHash('sha256').update(targetBuf).digest('hex').toUpperCase(), mtime: fs.statSync(targetFile).mtime.toISOString() };
const results = {
  part: 1, startedAt: new Date().toISOString(), target: targetMeta, env: {}, checks: [], presets: [],
  math: {}, robustness: {}, screenshots: [], consoleErrors: [], runtimeExceptions: []
};
let passN = 0, failN = 0;
function addCheck(id, ok, detail) {
  results.checks.push({ id, ok: !!ok, detail: detail === undefined ? null : detail });
  if (ok) { passN++; console.log('PASS', id, detail ? JSON.stringify(detail).slice(0, 240) : ''); }
  else { failN++; console.log('FAIL', id, detail ? JSON.stringify(detail).slice(0, 1200) : ''); }
}
function num(v) { return typeof v === 'number' ? v : NaN; }
function close(a, b, tol) { return Math.abs(a - b) <= tol; }
function sortedNum(arr) { return arr.slice().sort((x, y) => x - y); }

const edge = await launchEdge({ port: PORT, profile: 'C:\\Users\\LHH\\AppData\\Local\\Temp\\qa-edge-visual-qa\\p1' });
console.log('EDGE', edge.version.Browser, 'pid', edge.proc.pid);
let c = null;
try {
  c = await connectPage({ port: PORT, newTarget: true, url: 'about:blank' });
  await c.setViewport(1920, 1080, false);
  await c.navigate(URL);
  await waitFor(async () => (await c.ev('document.documentElement.dataset.ready')) === 'true', 10000);
  await sleep(700);

  // ---------- environment / load ----------
  const env = await c.ev("(function(){var d=window.__CUBE_LAB__.getDiagnostics();return {href:location.href,title:document.title,ua:navigator.userAgent,innerW:innerWidth,innerH:innerHeight,dpr:devicePixelRatio,ready:document.documentElement.dataset.ready,version:document.documentElement.dataset.version,apiVersion:window.__CUBE_LAB__.version,presetCount:document.querySelectorAll('.shape-tile').length,canvasCount:document.querySelectorAll('canvas').length,diagErrors:d.errors,resources:performance.getEntriesByType('resource').map(function(r){return r.name;}),shape:d.shape&&d.shape.name,presetMatches:d.presetMatches};})()");
  results.env = env;
  addCheck('env.ready', env.ready === 'true' && !!env.apiVersion, { ready: env.ready, apiVersion: env.apiVersion });
  addCheck('env.preset-count-12', env.presetCount === 12, env.presetCount);
  addCheck('env.two-canvases', env.canvasCount === 2, env.canvasCount);
  addCheck('env.no-resources', env.resources.length === 0, env.resources);
  addCheck('env.diag-errors-empty', Array.isArray(env.diagErrors) && env.diagErrors.length === 0, env.diagErrors);
  addCheck('env.default-regular-hexagon', env.shape === '正六边形' && env.presetMatches === true, { shape: env.shape, match: env.presetMatches });
  const homeCamera = await c.ev('window.__CUBE_LAB__.getDiagnostics().camera');
  results.env.homeCamera = homeCamera;

  results.screenshots.push(await c.shot(SHOTS + '/01-hero-1920-regular-hexagon.png'));

  // ---------- catalog structure ----------
  const catalog = await c.ev("(function(){return {ids:Array.prototype.map.call(document.querySelectorAll('.shape-tile'),function(t){return t.getAttribute('data-id');}),labels:Array.prototype.map.call(document.querySelectorAll('.shape-tile'),function(t){return {id:t.getAttribute('data-id'),sides:t.querySelector('.tile-sides').textContent,name:t.querySelector('.tile-name').textContent,pressed:t.getAttribute('aria-pressed')};}),tally:(document.querySelector('.catalog-tally')||{}).textContent||'',groupHeads:Array.prototype.map.call(document.querySelectorAll('.catalog-head h2'),function(h){return h.textContent;})};})()");
  results.catalog = catalog;
  addCheck('catalog.order', JSON.stringify(catalog.ids) === JSON.stringify(expected.presets.map(p => p.id)), catalog.ids);
  addCheck('catalog.tally-12', catalog.tally.replace(/\s/g, '').indexOf('12个代表形态') !== -1, catalog.tally);

  // ---------- preset matrix via real mouse clicks ----------
  const SHOT_IDS = ['equilateral-triangle', 'pentagon', 'rhombus', 'isosceles-trapezoid', 'hexagon'];
  const shotIndex = { 'equilateral-triangle': '02', 'pentagon': '03', 'rhombus': '04', 'isosceles-trapezoid': '05', 'hexagon': '06' };
  const stateExpr = "(function(){var d=window.__CUBE_LAB__.getDiagnostics();var sc=document.getElementById('shapeCanvas');var ctx=sc.getContext('2d');var im=ctx.getImageData(0,0,sc.width,sc.height).data;var nz=0;var sig=0;for(var i=0;i<im.length;i+=4){if(im[i+3]>0){nz++;sig=((sig*33)^(im[i]+(im[i+1]<<3)+(im[i+2]<<6)+(im[i+3]<<9)))>>>0;}}return {diag:d,active:document.querySelector('.shape-tile.active')?document.querySelector('.shape-tile.active').getAttribute('data-id'):null,liveName:document.getElementById('liveName').textContent,liveSides:document.getElementById('liveSides').textContent,shapeNameZh:document.getElementById('shapeNameZh').textContent,shapeNameEn:document.getElementById('shapeNameEn').textContent,sidePill:document.getElementById('sidePill').textContent,perimeter:document.getElementById('perimeterVal').textContent,area:document.getElementById('areaVal').textContent,angle:document.getElementById('angleVal').textContent,props:Array.prototype.map.call(document.querySelectorAll('#propertyChips .prop-chip'),function(x){return x.textContent;}),note:document.getElementById('noteText').textContent,faceCount:document.getElementById('faceCount').textContent,faceOn:document.querySelectorAll('.face-chip.on').length,faceHint:document.getElementById('faceHint').textContent,canvasPixels:nz,canvasSig:sig,canvasW:sc.width,canvasH:sc.height,dataSection:document.documentElement.dataset.section,dataSides:document.documentElement.dataset.sides};})()";

  for (let pi = 0; pi < expected.presets.length; pi++) {
    const p = expected.presets[pi];
    const clickRect = await c.clickSelector("button.shape-tile[data-id='" + p.id + "']");
    await waitFor(async () => (await c.ev('window.__CUBE_LAB__.getDiagnostics().tweening')) === false, 4000, 80);
    await sleep(180);
    const st = await c.evJson(stateExpr);
    const d = st.diag;
    const row = { id: p.id, clickRect: clickRect, page: st, expected: { name: p.name, type: p.type, sides: p.sides, parallelPairCount: p.parallelPairCount, unitSides: p.unitSides, angles: p.angles, rightCount: p.rightCount, allSidesEqual: p.allSidesEqual, allAnglesEqual: p.allAnglesEqual } };
    results.presets.push(row);
    const shape = d.shape || {};
    const okId = d.activePresetId === p.id;
    const okMatch = d.presetMatches === true && st.active === p.id;
    const okSides = shape.sides === p.sides && st.dataSides === String(p.sides);
    const okName = shape.name === p.name && st.shapeNameZh === p.name && st.liveName === p.name;
    const okType = shape.classification === p.type;
    const pageSides = (shape.sideLengthsUnit || []).slice();
    const expSides = p.unitSides.slice();
    const sideDiff = (pageSides.length === expSides.length) ? Math.max.apply(null, sortedNum(pageSides).map((v, i) => Math.abs(v - sortedNum(expSides)[i]))) : Infinity;
    const pageAngles = [num(shape.minAngle), num(shape.maxAngle)];
    const expMin = Math.min.apply(null, p.angles), expMax = Math.max.apply(null, p.angles);
    const angDiff = Math.max(Math.abs(pageAngles[0] - expMin), Math.abs(pageAngles[1] - expMax));
    const okPairs = ((shape.parallelPairs || []).length) === p.parallelPairCount;
    const okFaces = shape.sides === (shape.cutFaces || []).length && st.faceOn === p.sides && st.faceCount.replace(/\s/g, '') === (p.sides + '/6');
    const okCanvas = st.canvasPixels > 200 && st.canvasW > 50 && st.canvasH > 50;
    const okTexts = st.perimeter !== '—' && st.area !== '—' && st.angle !== '—' && st.props.length > 0 && st.note.length > 5;
    addCheck('preset.' + p.id + '.id+match', okId && okMatch, { activePresetId: d.activePresetId, presetMatches: d.presetMatches, activeTile: st.active });
    addCheck('preset.' + p.id + '.sides', okSides, { page: shape.sides, expected: p.sides });
    addCheck('preset.' + p.id + '.name', okName, { page: shape.name, dom: st.shapeNameZh, live: st.liveName, expected: p.name });
    addCheck('preset.' + p.id + '.classification', okType, { page: shape.classification, expected: p.type });
    addCheck('preset.' + p.id + '.side-lengths', sideDiff <= 5e-4, { maxDiff: sideDiff, page: pageSides, expected: expSides });
    addCheck('preset.' + p.id + '.angles', angDiff <= 0.01, { maxDiff: angDiff, page: pageAngles, expected: [expMin, expMax] });
    addCheck('preset.' + p.id + '.parallel-pairs', okPairs, { page: (shape.parallelPairs || []).length, expected: p.parallelPairCount });
    addCheck('preset.' + p.id + '.face-chips', okFaces, { cutFaces: (shape.cutFaces || []).length, faceOn: st.faceOn, faceCount: st.faceCount, hint: st.faceHint });
    addCheck('preset.' + p.id + '.shape-canvas-painted', okCanvas, { pixels: st.canvasPixels, w: st.canvasW, h: st.canvasH, sig: st.canvasSig });
    addCheck('preset.' + p.id + '.metric-and-note-text', okTexts, { perimeter: st.perimeter, area: st.area, angle: st.angle, props: st.props, note: st.note.slice(0, 40) });
    if (p.sides === 3) {
      addCheck('preset.' + p.id + '.acute-triangle', Math.max.apply(null, p.angles) < 90 && num(shape.maxAngle) < 90.01, { maxAngle: shape.maxAngle, expected: expMax });
    }
    if (p.sides === 4) {
      addCheck('preset.' + p.id + '.has-parallel-pair', p.parallelPairCount >= 1, { pairs: shape.parallelPairs });
      if (p.type === 'rhombus') addCheck('preset.rhombus.non-square', p.allSidesEqual && p.rightCount === 0, { unitSides: p.unitSides, angles: p.angles });
      const ss = p.unitSides.slice().sort((a, b) => a - b);
      const middlePairEqual = Math.abs(ss[1] - ss[2]) <= 0.004 * Math.max(ss[1], ss[2]);
      if (p.type === 'trapezoid') addCheck('preset.trapezoid.legs-unequal-no-right', middlePairEqual === false && p.rightCount === 0, { sortedUnitSides: ss, angles: p.angles });
      if (p.type === 'isosceles-trapezoid') addCheck('preset.isosceles-trapezoid.legs-equal', middlePairEqual === true && p.parallelPairCount === 1, { sortedUnitSides: ss });
    }
    if (p.sides === 5) {
      addCheck('preset.pentagon.two-parallel-pairs-not-regular', p.parallelPairCount === 2 && !p.allSidesEqual && !p.allAnglesEqual, { pairs: p.parallelPairCount, unitSides: p.unitSides });
    }
    if (p.sides === 6) {
      addCheck('preset.' + p.id + '.three-parallel-pairs', p.parallelPairCount === 3, { pairs: shape.parallelPairs });
      if (p.id === 'regular-hexagon') addCheck('preset.regular-hexagon.regular', p.allSidesEqual && p.allAnglesEqual && Math.abs(Math.min.apply(null, p.angles) - 120) < 1e-6, { angles: p.angles, sides: p.unitSides });
      if (p.id === 'hexagon') addCheck('preset.hexagon.general', !p.allSidesEqual && !p.allAnglesEqual, { angles: p.angles, sides: p.unitSides });
    }
    if (SHOT_IDS.indexOf(p.id) !== -1) {
      const f = await c.shot(SHOTS + '/' + shotIndex[p.id] + '-preset-' + p.id + '-1920.png');
      results.screenshots.push(f);
    }
  }
  const sigs = results.presets.map(r => r.page.canvasSig);
  addCheck('preset.shape-canvases-distinct', new Set(sigs).size === sigs.length, { distinct: new Set(sigs).size, total: sigs.length });

  // ---------- independent math checks via setPlane ----------
  const math = results.math;

  // 1) slanted square: n=(1,2,0)/sqrt5, d = (3 - 4/sqrt5)/sqrt5  (research 9.4)
  {
    const n = normalize([1, 2, 0]);
    const d = (3 - 4 / Math.sqrt(5)) / Math.sqrt(5);
    const r = await c.evJson("(function(){var r=window.__CUBE_LAB__.setPlane([" + n.join(',') + "]," + d + ");return r.shape;})()");
    const exp = analyzeGeo(section(n, d));
    const ind = classifyGeo(exp, section(n, d).coords2D);
    const ok = r && r.sides === 4 && r.name === '正方形' && exp.rightCount === 4 && exp.allSidesEqual && ind === 'square' && Math.abs(r.sideLengthsUnit[0] - 1) < 0.005;
    math.slantedSquare = { page: r && { name: r.name, sides: r.sides, unitSides: r.sideLengthsUnit, minAngle: r.minAngle, maxAngle: r.maxAngle }, expected: { type: ind, unitSides: exp.unitSides, angles: exp.angles, d: d } };
    addCheck('math.slanted-square-exists', ok, math.slantedSquare);
  }
  // 2) equiangular but not equilateral hexagon: n=(1,1,1)/sqrt3, d=0.1
  {
    const n = normalize([1, 1, 1]);
    const d = 0.1;
    const r = await c.evJson("(function(){var r=window.__CUBE_LAB__.setPlane([" + n.join(',') + "]," + d + ");return r.shape;})()");
    const sec = section(n, d); const exp = analyzeGeo(sec); const ind = classifyGeo(exp, sec.coords2D);
    const sides = exp.unitSides.slice().sort((a, b) => a - b);
    const ok = r && r.sides === 6 && r.name === '等角六边形' && ind === 'equiangular-hexagon' && Math.abs(exp.angles[0] - 120) < 1e-6 && (sides[5] - sides[0]) > 0.05;
    math.equiangularHexagon = { page: r && { name: r.name, sides: r.sides, minAngle: r.minAngle, maxAngle: r.maxAngle, sideLengthsUnit: r.sideLengthsUnit }, expected: { type: ind, angles: exp.angles, unitSides: exp.unitSides } };
    addCheck('math.equiangular-hexagon-not-regular', ok, math.equiangularHexagon);
  }
  // 3) random planes: invariants + classification agreement (deterministic seed)
  {
    function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
    const rand = mulberry32(20261019);
    const N = 300;
    const violations = [];
    const mismatches = [];
    const counts = { 3: 0, 4: 0, 5: 0, 6: 0 };
    for (let i = 0; i < N; i++) {
      const n = randomUnitVector(rand);
      const h = support(n);
      const d = (rand() * 2 - 1) * 0.92 * h;
      const sec = section(n, d);
      if (!sec) { violations.push({ i: i, kind: 'null-section-inside-support', n: n, d: d, h: h }); continue; }
      const a = analyzeGeo(sec);
      const t = classifyGeo(a, sec.coords2D);
      const m = a.unitSides.length;
      counts[m] = (counts[m] || 0) + 1;
      const dg = await c.evJson("(function(){var r=window.__CUBE_LAB__.setPlane([" + n.join(',') + "]," + d + ");var s=r.shape;return {name:s&&s.name,type:s&&s.classification,sides:s&&s.sides,pairs:s&&s.parallelPairs.length,minAngle:s&&s.minAngle,maxAngle:s&&s.maxAngle,unitSides:s&&s.sideLengthsUnit};})()");
      if (!dg || dg.sides !== m) { violations.push({ i: i, kind: 'page-null-or-sides', n: n, d: d, page: dg, independentSides: m }); continue; }
      const strictRight = a.angles.filter(x => Math.abs(x - 90) < 1e-8).length;
      if (m === 3) {
        if (a.maxAngle >= 90 - 1e-8) violations.push({ i: i, kind: 'triangle-not-acute', angles: a.angles });
        if (!(dg.maxAngle < 89.999)) violations.push({ i: i, kind: 'page-triangle-not-acute', page: dg });
      } else if (m === 4) {
        if (a.pairs.length < 1) violations.push({ i: i, kind: 'quad-no-parallel-pair', angles: a.angles });
        if (strictRight > 0 && a.pairs.length !== 2) violations.push({ i: i, kind: 'EXACT-right-trapezoid', n: n, d: d, angles: a.angles, pairs: a.pairs });
        if (dg.pairs < 1) violations.push({ i: i, kind: 'page-quad-no-pair', page: dg });
      } else if (m === 5) {
        if (a.pairs.length !== 2) violations.push({ i: i, kind: 'pentagon-pair-count', pairs: a.pairs });
        if (a.allSidesEqual && a.allAnglesEqual) violations.push({ i: i, kind: 'regular-pentagon', angles: a.angles, sides: a.sides });
        if (dg.name === '正五边形') violations.push({ i: i, kind: 'page-regular-pentagon', page: dg });
      } else if (m === 6) {
        if (a.pairs.length !== 3) violations.push({ i: i, kind: 'hexagon-pair-count', pairs: a.pairs });
        if (dg.pairs !== 3) violations.push({ i: i, kind: 'page-hexagon-pair-count', page: dg });
      }
      if (dg.type !== t) {
        const minAbsNormal = Math.min(Math.abs(n[0]), Math.abs(n[1]), Math.abs(n[2]));
        const sideNearEqual = (function () { const ss = a.unitSides.slice().sort((x, y) => x - y); return (ss[1] - ss[0]) < 0.01 * ss[1] || (ss[2] - ss[1]) < 0.01 * ss[2] || (ss[3] - ss[2]) < 0.01 * ss[3]; })();
        const nearBoundary = (m === 4) && (minAbsNormal < 0.02 || sideNearEqual || a.angles.some(x => Math.abs(x - 90) < 1.5));
        mismatches.push({ i: i, n: n, d: d, pageName: dg.name, pageType: dg.type, independentType: t, independentAngles: a.angles, independentSides: a.unitSides, allSidesEqual: a.allSidesEqual, allAnglesEqual: a.allAnglesEqual, rightCount: a.rightCount, pairs: a.pairs.length, minAbsNormal: minAbsNormal, nearBoundary: nearBoundary });
      }
    }
    math.randomSample = { N: N, counts: counts, violations: violations, classificationMismatches: mismatches };
    addCheck('math.random-sample-no-theorem-violations', violations.length === 0, { count: violations.length, sample: violations.slice(0, 8) });
    addCheck('math.random-sample-classification-agreement', mismatches.every(x => x.nearBoundary), { mismatchCount: mismatches.length, allNearToleranceBoundary: mismatches.every(x => x.nearBoundary), sample: mismatches.slice(0, 6) });
    addCheck('math.random-sample-all-four-side-counts', counts[3] > 0 && counts[4] > 0 && counts[5] > 0 && counts[6] > 0, counts);
  }
  // 4) regular-hexagon necessity: d=0, normals with unequal |n_i| must not be regular
  {
    function mulberry32b(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
    const rand = mulberry32b(777);
    const bad = [], skipped = [], checked = { six: 0 };
    for (let i = 0; i < 120; i++) {
      let n = normalize([rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1]);
      const absn = n.map(Math.abs);
      if (Math.max(absn[0], absn[1], absn[2]) - Math.min(absn[0], absn[1], absn[2]) < 0.01) { skipped.push(n); continue; }
      const r = await c.evJson("(function(){var r=window.__CUBE_LAB__.setPlane([" + n.join(',') + "],0);return {name:r.shape&&r.shape.name,sides:r.shape&&r.shape.sides};})()");
      if (r && r.sides === 6) {
        checked.six++;
        if (r.name === '正六边形') bad.push({ n: n, name: r.name });
      }
    }
    math.regularHexagonNecessity = { checked: checked, violations: bad, skippedNearEqual: skipped.length };
    addCheck('math.regular-hexagon-needs-equal-normal-components', bad.length === 0, { sixGonsChecked: checked.six, violations: bad });
  }
  // 5) exact regular hexagon positive
  {
    const n = normalize([1, 1, 1]);
    const r = await c.evJson("(function(){var r=window.__CUBE_LAB__.setPlane([" + n.join(',') + "],0);return r.shape;})()");
    const ok = r && r.sides === 6 && r.name === '正六边形' && Math.abs(r.minAngle - 120) < 1e-6 && Math.abs(Math.max.apply(null, r.sideLengthsUnit) - Math.min.apply(null, r.sideLengthsUnit)) < 1e-6;
    addCheck('math.regular-hexagon-positive', ok, r && { name: r.name, minAngle: r.minAngle, maxAngle: r.maxAngle, sides: r.sideLengthsUnit });
  }
  // 6) empty / tangent states
  {
    const n = normalize([1, 1, 1]);
    const outside = await c.evJson("(function(){var r=window.__CUBE_LAB__.setPlane([" + n.join(',') + "],1.9);return {shape:r.shape,empty:document.getElementById('stageEmpty').classList.contains('show'),strong:document.querySelector('#stageEmpty strong').textContent,span:document.querySelector('#stageEmpty span').textContent,live:document.getElementById('liveName').textContent,faceCount:document.getElementById('faceCount').textContent,shapeName:document.getElementById('shapeNameZh').textContent};})()");
    results.emptyState = outside;
    addCheck('state.outside-cube-empty', outside.shape === null && outside.empty === true && outside.live === '无截面' && outside.shapeName === '无截面' && outside.strong === '平面已移出正方体', outside);
    await sleep(200);
    results.screenshots.push(await c.shot(SHOTS + '/11-empty-state-1920.png'));
    const tangent = await c.evJson("(function(){var r=window.__CUBE_LAB__.setPlane([" + n.join(',') + "]," + Math.sqrt(3) + ");return {shape:r.shape,empty:document.getElementById('stageEmpty').classList.contains('show'),strong:document.querySelector('#stageEmpty strong').textContent,span:document.querySelector('#stageEmpty span').textContent,live:document.getElementById('liveName').textContent};})()");
    results.tangentState = tangent;
    addCheck('state.tangent-vertex', tangent.shape === null && tangent.empty === true && tangent.strong === '平面与正方体相切', tangent);
  }

  // ---------- robustness ----------
  await c.ev("window.__CUBE_LAB__.applyPreset('regular-hexagon')");
  await sleep(300);
  const ids = expected.presets.map(p => p.id);
  for (let round = 0; round < 2; round++) {
    for (const id of ids) {
      await c.clickSelector("button.shape-tile[data-id='" + id + "']");
      await sleep(90);
    }
  }
  await sleep(1600);
  const rapid = await c.ev("(function(){var d=window.__CUBE_LAB__.getDiagnostics();var sc=document.getElementById('shapeCanvas');var im=sc.getContext('2d').getImageData(0,0,sc.width,sc.height).data;var nz=0;for(var i=3;i<im.length;i+=4){if(im[i]>0){nz++;}}return {activePresetId:d.activePresetId,shape:d.shape&&d.shape.name,sides:d.shape&&d.shape.sides,match:d.presetMatches,errors:d.errors.slice(),painted:nz};})()");
  results.robustness.rapidSwitching = rapid;
  addCheck('robust.rapid-preset-switching', rapid.activePresetId === 'hexagon' && rapid.shape === '一般六边形' && rapid.match === true && rapid.painted > 200 && rapid.errors.length === 0, rapid);
  // random slider-like state changes
  for (let i = 0; i < 40; i++) {
    const th = Math.random() * 360, ph = Math.random() * 180 - 90, dd = Math.random() * 3.6 - 1.8;
    await c.ev("(function(){var t=document.getElementById('thetaRange');t.value='" + th.toFixed(1) + "';t.dispatchEvent(new Event('input',{bubbles:true}));var p=document.getElementById('phiRange');p.value='" + ph.toFixed(1) + "';p.dispatchEvent(new Event('input',{bubbles:true}));var q=document.getElementById('dRange');q.value='" + dd.toFixed(3) + "';q.dispatchEvent(new Event('input',{bubbles:true}));return true;})()");
  }
  await sleep(300);
  const afterSliders = await c.ev("(function(){var d=window.__CUBE_LAB__.getDiagnostics();return {errors:d.errors.slice(),playing:d.playing,tweening:d.tweening,shape:d.shape&&d.shape.name,plane:d.plane};})()");
  results.robustness.randomSliderEvents = afterSliders;
  addCheck('robust.random-slider-events', afterSliders.errors.length === 0 && afterSliders.playing === false, afterSliders);

  // console/runtime errors
  const pageErrors = collectPageErrors(c.events);
  results.consoleErrors = pageErrors;
  results.runtimeExceptions = c.events.filter(e => e.method === 'Runtime.exceptionThrown').length;
  addCheck('errors.no-runtime-exceptions', results.runtimeExceptions === 0, results.runtimeExceptions);
  addCheck('errors.no-console-or-log-errors', pageErrors.length === 0, pageErrors.slice(0, 5));
  const finalDiagErrors = await c.ev('window.__CUBE_LAB__.getDiagnostics().errors');
  results.finalDiagErrors = finalDiagErrors;
  addCheck('errors.diag-empty-at-end', Array.isArray(finalDiagErrors) && finalDiagErrors.length === 0, finalDiagErrors);

  // network: ensure no external requests
  const reqs = c.events.filter(e => e.method === 'Network.requestWillBeSent').map(e => e.params.request.url);
  results.networkRequests = reqs;
  const external = reqs.filter(u => !u.startsWith('file://') && !u.startsWith('data:'));
  addCheck('robust.no-external-network', external.length === 0, external);

  results.passCount = passN;
  results.failCount = failN;
} catch (err) {
  results.fatalError = String(err && err.stack || err);
  console.error('FATAL', err);
} finally {
  try { if (c) c.close(); } catch (e) {}
  try { await edge.kill(); } catch (e) {}
  fs.writeFileSync('qa/_tools/results-part1.json', JSON.stringify(results, null, 1));
  console.log('==== PART1 DONE pass=' + passN + ' fail=' + failN + ' ====');
  console.log('RESULT_FILE qa/_tools/results-part1.json');
}
