// QA part 2: interactions, guide modal, keyboard, layout (4 viewports), a11y, screenshots, errors.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { launchEdge, connectPage, sleep, waitFor, collectPageErrors } from './qa-lib.mjs';

const ROOT = 'D:/workspace/数学演示/圆锥曲线';
const URL_BASE = 'file:///' + encodeURI(ROOT) + '/index.html';
const URL0 = URL_BASE + '?mode=ellipse&a=4&e=0.55&axis=x&static=1&t=0.9';
const SHOTS = 'qa/screens';
fs.mkdirSync(SHOTS, { recursive: true });

const results = { part: 2, startedAt: new Date().toISOString(), target: null, checks: [], interactions: {}, modal: {}, layout: {}, a11y: {}, screenshots: [], errors: null };
let passN = 0, failN = 0;
function addCheck(id, ok, detail) {
  results.checks.push({ id, ok: !!ok, detail: detail === undefined ? null : detail });
  if (ok) { passN++; console.log('PASS', id, detail ? JSON.stringify(detail).slice(0, 240) : ''); }
  else { failN++; console.log('FAIL', id, detail ? JSON.stringify(detail).slice(0, 1400) : ''); }
}
function near(a, b, tol) { return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= (tol == null ? 1e-9 : tol); }
function sigExpr() {
  return "(function(){var cv=document.getElementById('scene');var im=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;var s=0,nz=0;for(var i=0;i<im.length;i+=16){s=(s*31+im[i]+(im[i+1]<<3)+(im[i+2]<<6)+(im[i+3]<<9))>>>0;if(im[i+3]>0)nz++;}return {sig:s,nz:nz,w:cv.width,h:cv.height};})()";
}
const edge = await launchEdge({ port: 9462, url: URL0 });
console.log('EDGE', edge.version.Browser);
let c = null;
try {
  c = await connectPage({ port: 9462 });
  await c.setViewport(1920, 1080, false);
  await c.bringToFront();
  await waitFor(async () => (await c.ev('document.documentElement.dataset.ready')) === 'true', 12000);
  await sleep(700);
  const _h = crypto.createHash('sha256').update(fs.readFileSync('index.html')).digest('hex').toUpperCase();
  results.target = { file: 'index.html', size: fs.statSync('index.html').size, mtime: fs.statSync('index.html').mtime.toISOString(), sha256: _h };
  async function shot(file, clip) { results.screenshots.push(await c.shot(SHOTS + '/' + file, clip)); }
  async function readDiag() { return c.evJson('window.__CONIC_LAB__.getDiagnostics()'); }
  async function readState() { return c.evJson('window.__CONIC_LAB__.getState()'); }
  async function sig() { return c.evJson(sigExpr()); }
  async function setMode(mode) { await c.ev("window.__CONIC_LAB__.setMode('" + mode + "');true"); await sleep(200); }
  async function apply(mode, params, orientation, phase) { await c.ev("window.__CONIC_LAB__.applyPreset(" + JSON.stringify(mode) + "," + JSON.stringify(params) + "," + JSON.stringify(orientation || 'x') + "," + (isFinite(phase) ? phase : 0.9) + ");true"); await sleep(180); }
  async function domSnapshot() {
    return c.evJson("(function(){function t(id){var e=document.getElementById(id);return e?e.textContent.replace(/\\s+/g,' ').trim():null;}return {liveName:t('liveName'),liveE:t('liveE'),familyChip:t('familyChip'),eqNumeric:t('eqNumeric'),eqSymbolic:(document.getElementById('eqSymbolic').textContent||'').replace(/\\s+/g,' ').trim(),orientationLabel:t('orientationLabel'),metricGrid:(document.getElementById('metricGrid').textContent||'').replace(/\\s+/g,' ').trim(),features:Array.prototype.map.call(document.querySelectorAll('#featureList .feature-row'),function(r){return r.textContent.replace(/\\s+/g,' ').trim();}),noteText:t('noteText'),stageNote:t('stageNote'),originChip:t('originChip'),defTitle:t('defTitle'),defFormula:(document.getElementById('defFormula').textContent||'').replace(/\\s+/g,' ').trim(),defValues:t('defValues'),pointReadout:t('pointReadout'),modeTabs:Array.prototype.map.call(document.querySelectorAll('.conic-tab'),function(b){return b.getAttribute('data-mode')+':'+b.getAttribute('aria-pressed');}),modeCards:Array.prototype.map.call(document.querySelectorAll('.mode-card'),function(b){return b.getAttribute('data-mode')+':'+b.getAttribute('aria-pressed');}),toggles:Array.prototype.map.call(document.querySelectorAll('.switch[data-toggle]'),function(b){return b.getAttribute('data-toggle')+':'+b.getAttribute('aria-pressed')+':'+(b.hidden?'hidden':'visible');}),axis:[document.getElementById('axisBtnX').getAttribute('aria-pressed'),document.getElementById('axisBtnY').getAttribute('aria-pressed')],rows:{a:!document.getElementById('rowA').hidden,e:!document.getElementById('rowE').hidden,p:!document.getElementById('rowP').hidden,l:!document.getElementById('rowL').hidden},quickHidden:document.getElementById('unifiedQuick').hidden,axisHidden:document.getElementById('axisSwitch').hidden,playText:document.getElementById('playBtnText').textContent,stagePlayAria:document.getElementById('stagePlay').getAttribute('aria-label'),stagePlayPressed:document.getElementById('stagePlay').getAttribute('aria-pressed'),bodyText:document.body.innerText};})()");
  }
  async function modalIsHidden() { return c.ev("(function(){var m=document.getElementById('guideModal');return !m.classList.contains('open') && getComputedStyle(m).visibility==='hidden';})()"); }
  async function modalSnapshot() {
    return c.evJson("(function(){var m=document.getElementById('guideModal');var p=m.querySelector('.modal-panel');var a=document.activeElement;return {open:m.classList.contains('open'),aria:m.getAttribute('aria-hidden'),visibility:getComputedStyle(m).visibility,role:p.getAttribute('role'),ariaModal:p.getAttribute('aria-modal'),labelledby:p.getAttribute('aria-labelledby'),title:document.getElementById('guideTitle').textContent,panelScrollTop:p.scrollTop,panelScrollHeight:p.scrollHeight,panelClientHeight:p.clientHeight,focusedClass:a&&String(a.className),focusedInside:p.contains(a),bodyModalOpen:document.body.classList.contains('modal-open'),appInert:document.querySelector('.app').hasAttribute('inert')};})()");
  }
  async function openGuideModal() {
    await waitFor(modalIsHidden, 4000, 60);
    await sleep(120);
    await c.clickSelector('#guideBtn');
    await waitFor(async () => (await c.ev("document.getElementById('guideModal').classList.contains('open')")), 4000, 60);
    await waitFor(async () => (await c.ev("document.activeElement && document.activeElement.classList.contains('modal-close')")), 2500, 60);
    await sleep(150);
    return modalSnapshot();
  }
  async function closeGuideViaEsc() {
    await c.key('Escape', 'Escape', { vk: 27 });
    await waitFor(modalIsHidden, 4000, 60);
    await sleep(150);
    return c.evJson("(function(){var m=document.getElementById('guideModal');return {open:m.classList.contains('open'),aria:m.getAttribute('aria-hidden'),bodyClass:document.body.classList.contains('modal-open'),appInert:document.querySelector('.app').hasAttribute('inert'),focusId:document.activeElement&&document.activeElement.id,focusClass:document.activeElement&&String(document.activeElement.className)};})()");
  }

  // ================= A. mode tabs / catalog cards =================
  const tabs = {};
  for (const mode of ['hyperbola', 'parabola', 'unified', 'ellipse']) {
    await c.clickSelector("button.conic-tab[data-mode='" + mode + "']");
    await sleep(300);
    const d = await readDiag();
    const dom = await domSnapshot();
    tabs[mode] = { diag: { mode: d.mode, name: d.name, curves: d.curves, derived: d.derived }, dom };
    addCheck('tabs.' + mode + '.switch', d.mode === mode && dom.modeTabs.filter(x => x.endsWith(':true')).length === 1 && dom.modeTabs.some(x => x === mode + ':true'), { mode: d.mode, tabs: dom.modeTabs });
    addCheck('tabs.' + mode + '.rows', mode === 'ellipse' || mode === 'hyperbola' ? (dom.rows.a && dom.rows.e && !dom.rows.p && !dom.rows.l)
      : mode === 'parabola' ? (!dom.rows.a && !dom.rows.e && dom.rows.p && !dom.rows.l)
        : (!dom.rows.a && dom.rows.e && !dom.rows.p && dom.rows.l), dom.rows);
    addCheck('tabs.' + mode + '.aux-controls', mode === 'unified' ? (dom.axisHidden === true && dom.quickHidden === false) : (dom.axisHidden === false && dom.quickHidden === true), { axisHidden: dom.axisHidden, quickHidden: dom.quickHidden });
    if (mode === 'hyperbola') addCheck('tabs.hyperbola.asym-toggle-visible', dom.toggles.some(t => t.indexOf('asymptote:true:visible') === 0), dom.toggles);
    else addCheck('tabs.' + mode + '.asym-toggle-hidden', dom.toggles.some(t => t.indexOf('asymptote:') === 0 && t.indexOf(':hidden') !== -1), dom.toggles);
  }
  results.interactions.tabs = tabs;
  // catalog card click
  await c.clickSelector("button.mode-card[data-mode='parabola']");
  await sleep(300);
  const cat = await readDiag();
  const catDom = await domSnapshot();
  addCheck('catalog.card-click', cat.mode === 'parabola' && catDom.modeCards.some(x => x === 'parabola:true') && catDom.modeTabs.some(x => x === 'parabola:true'), { mode: cat.mode, cards: catDom.modeCards });
  await c.clickSelector("button.mode-card[data-mode='ellipse']");
  await sleep(250);

  // ================= B. sliders =================
  async function clickSliderAt(sel, fraction) {
    const r = await c.evJson("(function(){var e=document.querySelector('" + sel + "');var b=e.getBoundingClientRect();return {x:b.left,y:b.top,w:b.width,h:b.height};})()");
    await c.mouseClick(r.x + r.w * fraction, r.y + r.h / 2);
    await sleep(250);
  }
  async function setRange(sel, value) {
    await c.ev("(function(){var e=document.querySelector('" + sel + "');e.value='" + value + "';e.dispatchEvent(new Event('input',{bubbles:true}));return true;})()");
    await sleep(250);
  }
  const sliderRes = {};
  await apply('ellipse', { a: 4, e: 0.55 }, 'x', 0.9);
  let sigBefore = await sig();
  await clickSliderAt('#rangeA', 0.72);
  let d = await readDiag(); let dom = await domSnapshot();
  const sigAfterA = await sig();
  sliderRes.ellipseA = { derived: d.derived, domVal: dom.eqNumeric, sigChanged: sigBefore.sig !== sigAfterA.sig };
  addCheck('slider.ellipse-a', d.derived.a > 4.0 && d.derived.a < 5.0 && sigBefore.sig !== sigAfterA.sig, sliderRes.ellipseA);
  await clickSliderAt('#rangeE', 0.3);
  d = await readDiag();
  sliderRes.ellipseE = { derived: d.derived };
  addCheck('slider.ellipse-e', d.derived.e < 0.55 && d.derived.e >= 0, sliderRes.ellipseE);
  // endpoints via input events (UI path)
  await setRange('#rangeE', 0);
  d = await readDiag(); dom = await domSnapshot();
  addCheck('slider.ellipse-e0-circle', d.name === '圆' && d.directrices.length === 0 && dom.bodyText.indexOf('NaN') === -1 && dom.bodyText.indexOf('Infinity') === -1, { name: d.name, directrices: d.directrices });
  await setRange('#rangeE', 0.85); await setRange('#rangeA', 5);
  d = await readDiag();
  addCheck('slider.ellipse-endpoints', d.derived.e === 0.85 && d.derived.a === 5 && !/NaN|Infinity/.test(JSON.stringify(d)), d.derived);
  // hyperbola sliders
  await setMode('hyperbola');
  await apply('hyperbola', { a: 2.2, e: 1.45 }, 'x', 0.9);
  await clickSliderAt('#rangeE', 0.8);
  d = await readDiag();
  sliderRes.hyperbolaE = { derived: d.derived };
  addCheck('slider.hyperbola-e', d.derived.e > 1.45 && d.derived.e <= 2, sliderRes.hyperbolaE);
  await setRange('#rangeE', 1.05); await setRange('#rangeA', 1.2);
  d = await readDiag();
  addCheck('slider.hyperbola-endpoints', near(d.derived.e, 1.05, 1e-9) && near(d.derived.a, 1.2, 1e-9) && !/NaN|Infinity/.test(JSON.stringify(d)), d.derived);
  // parabola slider
  await setMode('parabola');
  await clickSliderAt('#rangeP', 0.8);
  d = await readDiag();
  sliderRes.parabolaP = { derived: d.derived };
  addCheck('slider.parabola-p', d.derived.p > 3 && d.derived.p <= 5, sliderRes.parabolaP);
  await setRange('#rangeP', 1); const pMin = await readDiag();
  await setRange('#rangeP', 5); const pMax = await readDiag();
  addCheck('slider.parabola-endpoints', near(pMin.derived.p, 1, 1e-9) && near(pMax.derived.p, 5, 1e-9) && !/NaN|Infinity/.test(JSON.stringify(pMin) + JSON.stringify(pMax)), { min: pMin.derived, max: pMax.derived });
  // unified sliders: e across 1, l endpoints
  await setMode('unified');
  await apply('unified', { e: 0.65, l: 2.5 }, 'x', 0.9);
  await setRange('#rangeE', 0.98);
  const ue098 = await readDiag();
  addCheck('slider.unified-e-098', ue098.name === '椭圆' && ue098.curves[0].closed === false, { name: ue098.name, curves: ue098.curves });
  await setRange('#rangeE', 1.02);
  const ue102 = await readDiag();
  addCheck('slider.unified-e-102', ue102.name === '双曲线' && ue102.curves.length === 2, { name: ue102.name, curves: ue102.curves });
  await setRange('#rangeE', 1); const ue1 = await readDiag();
  addCheck('slider.unified-e-1', ue1.name === '抛物线' && ue1.curves.length === 1, { name: ue1.name, curves: ue1.curves });
  await setRange('#rangeL', 1.5); const ulMin = await readDiag();
  await setRange('#rangeL', 4); const ulMax = await readDiag();
  addCheck('slider.unified-l-endpoints', near(ulMin.derived.l, 1.5, 1e-9) && near(ulMax.derived.l, 4, 1e-9), { min: ulMin.derived, max: ulMax.derived });
  // quick e buttons
  await c.clickSelector("button.quick-btn[data-quick-e='1.6']");
  await sleep(300);
  const quick = await readDiag();
  const quickDom = await domSnapshot();
  addCheck('unified.quick-e', near(quick.derived.e, 1.6, 1e-9) && quickDom.modeTabs.length === 4, { derived: quick.derived, buttons: quickDom.modeTabs.length });
  results.interactions.sliders = sliderRes;

  // ================= C. axis switch =================
  const axisRes = {};
  await setMode('ellipse');
  await apply('ellipse', { a: 5, e: 0.6 }, 'x', 0.9);
  await c.clickSelector('#axisBtnY'); await sleep(300);
  let ad = await readDiag(); let adm = await domSnapshot();
  axisRes.ellipse = { derived: ad.derived, eq: ad.equation.numeric, foci: ad.foci, dir: ad.directrices, label: adm.orientationLabel, axis: adm.axis };
  addCheck('axis.ellipse-y', ad.orientation === 'y' && ad.foci[0].x === 0 && adm.orientationLabel === '焦点在 y 轴' && ad.directrices[0].type === 'h' && adm.axis.join(',') === 'false,true', axisRes.ellipse);
  await setMode('hyperbola');
  await apply('hyperbola', { a: 3, e: 5 / 3 }, 'x', 0.9);
  await c.clickSelector('#axisBtnY'); await sleep(300);
  ad = await readDiag(); adm = await domSnapshot();
  axisRes.hyperbola = { derived: ad.derived, asym: ad.asymptotes, eq: ad.equation.numeric, label: adm.orientationLabel, dir: ad.directrices };
  addCheck('axis.hyperbola-y', ad.orientation === 'y' && ad.asymptotes[0].indexOf('0.75') !== -1 && adm.orientationLabel === '实轴竖直' && ad.directrices[0].type === 'h', axisRes.hyperbola);
  await setMode('parabola');
  await apply('parabola', { p: 3 }, 'x', 0.9);
  await c.clickSelector('#axisBtnY'); await sleep(300);
  ad = await readDiag(); adm = await domSnapshot();
  axisRes.parabola = { eq: ad.equation.numeric, focus: ad.foci, dir: ad.directrices, label: adm.orientationLabel };
  addCheck('axis.parabola-y', ad.orientation === 'y' && ad.equation.numeric.indexOf('x² = 6.00y') !== -1 && adm.orientationLabel === '开口向上' && ad.directrices[0].type === 'h', axisRes.parabola);
  // unified: axis switch hidden; clicking coordinates not possible, verify hidden & button aria state unchanged
  await setMode('unified'); await sleep(250);
  const uniAxis = await domSnapshot();
  addCheck('axis.unified-hidden', uniAxis.axisHidden === true, uniAxis.axisHidden);
  results.interactions.axis = axisRes;

  // ================= D. display toggles (incl. labels hide auxiliary labels) =================
  await setMode('hyperbola');
  await apply('hyperbola', { a: 3, e: 5 / 3 }, 'x', 0.9);
  await sleep(300);
  const onSig = await sig();
  await shot('15-hyperbola-labels-on-1920.png');
  const toggleRes = {};
  for (const key of ['directrix', 'asymptote', 'labels']) {
    const sel = "button.switch[data-toggle='" + key + "']";
    const before = { aria: await c.ev("document.querySelector(\"" + sel + "\").getAttribute('aria-pressed')"), sig: await sig() };
    await c.clickSelector(sel); await sleep(300);
    const after = { aria: await c.ev("document.querySelector(\"" + sel + "\").getAttribute('aria-pressed')"), sig: await sig() };
    toggleRes[key] = { before, after };
    addCheck('toggle.' + key + '.aria', before.aria === 'true' && after.aria === 'false', { before: before.aria, after: after.aria });
    addCheck('toggle.' + key + '.canvas-change', before.sig.sig !== after.sig.sig, { same: before.sig.sig === after.sig.sig });
    if (key === 'labels') { await shot('16-hyperbola-labels-off-1920.png'); addCheck('toggle.labels.hides-aux-labels', onSig.sig !== after.sig.sig, { on: onSig.sig, off: after.sig.sig }); }
    await c.clickSelector(sel); await sleep(200);
  }
  const togglesBack = await domSnapshot();
  addCheck('toggle.restore-all-on', togglesBack.toggles.every(t => t.indexOf(':true:') !== -1), togglesBack.toggles);
  results.interactions.toggles = toggleRes;

  // ================= E. play / pause =================
  await setMode('unified'); await apply('unified', { e: 1.6, l: 2.5 }, 'x', 0.9);
  await c.bringToFront();
  await sleep(250);
  const beforePlay = await readState();
  const P1 = (await readDiag()).P;
  await c.clickSelector('#playBtn');
  await sleep(120);
  const playStart = { state: await readState(), dom: await domSnapshot() };
  await sleep(1100);
  const playLater = { state: await readState(), P: (await readDiag()).P };
  await shot('17-playing-mid-1920.png');
  await c.clickSelector('#playBtn'); await sleep(150);
  const pauseState = await readState();
  const PauseP = (await readDiag()).P;
  await sleep(700);
  const pauseLater = await readState();
  const pauseP2 = (await readDiag()).P;
  results.interactions.play = { beforePlay, P1, playStart, playLater, pauseState, PauseP, pauseLater, pauseP2 };
  addCheck('play.start', playStart.state.playing === true && playStart.dom.playText === '暂停动点' && playStart.dom.stagePlayPressed === 'true' && playStart.dom.stagePlayAria === '暂停动点 P', playStart);
  addCheck('play.phase-advances', playLater.state.phase - playStart.state.phase >= 0.05, { start: playStart.state.phase, later: playLater.state.phase, note: 'headless RAF 节流下只要求相位明显推进（>0.05）' });
  addCheck('play.P-moves', near(playLater.P[0], P1[0], 1e-6) === false || near(playLater.P[1], P1[1], 1e-6) === false, { P1: P1, P_later: playLater.P });
  addCheck('play.pause', pauseState.playing === false && pauseLater.playing === false && near(pauseLater.phase, pauseState.phase, 1e-9) && near(pauseP2[0], PauseP[0], 1e-9), { phase: [pauseState.phase, pauseLater.phase], P: [PauseP, pauseP2] });
  // stage play button toggle
  await c.clickSelector('#stagePlay'); await sleep(250);
  const stageOn = await readState();
  await c.clickSelector('#stagePlay'); await sleep(250);
  const stageOff = await readState();
  addCheck('play.stage-button', stageOn.playing === true && stageOff.playing === false, { on: stageOn.playing, off: stageOff.playing });

  // ================= F. reset =================
  await apply('unified', { e: 1.9, l: 3.2 }, 'y', 2.2);
  await c.clickSelector("button.switch[data-toggle='labels']"); await sleep(200);
  await c.ev('window.__CONIC_LAB__.setPlaying(true);true'); await sleep(200);
  await c.clickSelector('#resetBtn'); await sleep(400);
  const resetPlaying = (await readState()).playing;
  await c.ev('window.__CONIC_LAB__.setPlaying(false);true'); await sleep(150);
  const resetState = await readState();
  const resetDiag = await readDiag();
  const resetDom = await domSnapshot();
  results.interactions.reset = { state: resetState, derived: resetDiag.derived, mode: resetDiag.mode, dom: { playText: resetDom.playText, toggles: resetDom.toggles, axis: resetDom.axis }, toast: await c.ev("document.getElementById('toast').textContent") };
  addCheck('reset.params-defaults', resetDiag.mode === 'unified' && near(resetDiag.derived.e, 0.65, 1e-9) && near(resetDiag.derived.l, 2.5, 1e-9) && resetState.phase >= 0.9 && resetState.phase <= 1.6, { mode: resetDiag.mode, derived: resetDiag.derived, phase: resetState.phase, phaseNote: 'reset 后 playing=true，相位从 0.9 继续推进属预期' });
  addCheck('reset.orientation-and-phase', resetState.orientation === 'x', resetState.orientation);
  addCheck('reset.toggles-and-play', resetDom.toggles.every(t => t.indexOf(':true:') !== -1) && resetPlaying === true, { toggles: resetDom.toggles, playingAfterReset: resetPlaying });
  results.interactions.reset.playingAfterReset = resetPlaying;
  addCheck('reset.toast', (await c.ev("document.getElementById('toast').textContent")) === '已重置当前参数', results.interactions.reset.toast);

  // ================= G. keyboard =================
  await c.ev("(function(){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();document.body.focus();window.scrollTo(0,0);return true;})()");
  const keyModes = {};
  for (const key of ['2', '3', '4', '1']) {
    await c.key(key, 'Digit' + key, { vk: 48 + parseInt(key, 10), text: key });
    await sleep(250);
    keyModes[key] = (await readDiag()).mode;
  }
  await c.ev('window.__CONIC_LAB__.setPlaying(false);true'); await sleep(150);
  await c.key(' ', 'Space', { vk: 32, text: ' ' }); await sleep(250);
  const keyPlayOn = (await readState()).playing;
  await c.key(' ', 'Space', { vk: 32, text: ' ' }); await sleep(250);
  const keyPlayOff = (await readState()).playing;
  await c.ev("window.__CONIC_LAB__.applyPreset('ellipse',{a:5,e:0.6},'x',1.5);true"); await sleep(200);
  await c.ev('window.__CONIC_LAB__.setOrientation("y");true'); await sleep(200);
  await c.key('r', 'KeyR', { vk: 82, text: 'r' }); await sleep(350);
  const keyReset = { state: await readState(), diag: await readDiag() };
  await c.key('g', 'KeyG', { vk: 71, text: 'g' });
  await waitFor(async () => (await c.ev("document.getElementById('guideModal').classList.contains('open')")), 3000, 60);
  const keyGuide = await modalSnapshot();
  await c.key('Escape', 'Escape', { vk: 27 }); await sleep(350);
  const keyEsc = await c.ev("(function(){return {open:document.getElementById('guideModal').classList.contains('open'),focusId:document.activeElement&&document.activeElement.id};})()");
  results.interactions.keyboard = { keyModes, keyPlayOn, keyPlayOff, keyReset: { orientation: keyReset.state.orientation, params: keyReset.diag.derived }, keyGuide, keyEsc };
  addCheck('keyboard.1-4-modes', keyModes['2'] === 'hyperbola' && keyModes['3'] === 'parabola' && keyModes['4'] === 'unified' && keyModes['1'] === 'ellipse', keyModes);
  addCheck('keyboard.space-play', keyPlayOn === true && keyPlayOff === false, { on: keyPlayOn, off: keyPlayOff });
  addCheck('keyboard.r-reset', keyReset.state.orientation === 'x' && near(keyReset.diag.derived.a, 4, 1e-9) && near(keyReset.diag.derived.e, 0.55, 1e-9) && keyReset.diag.mode === 'ellipse', { orientation: keyReset.state.orientation, derived: keyReset.diag.derived });
  addCheck('keyboard.g-open-guide', keyGuide.open === true && keyGuide.focusedInside === true, { open: keyGuide.open, focused: keyGuide.focusedClass });
  addCheck('keyboard.esc-close-guide', keyEsc.open === false && keyEsc.focusId === 'guideBtn', keyEsc);

  // ================= H. guide modal full =================
  const gOpen = await openGuideModal();
  results.modal.open = gOpen;
  addCheck('guide.opens', gOpen.open === true && gOpen.aria === 'false' && gOpen.visibility === 'visible' && gOpen.bodyModalOpen === true, gOpen);
  addCheck('guide.scroll-reset-on-open', gOpen.panelScrollTop === 0, gOpen.panelScrollTop);
  addCheck('guide.focus-close', gOpen.focusedInside === true && String(gOpen.focusedClass).indexOf('modal-close') !== -1, gOpen.focusedClass);
  addCheck('guide.semantics', gOpen.role === 'dialog' && gOpen.ariaModal === 'true' && gOpen.labelledby === 'guideTitle' && gOpen.title.length > 0, { role: gOpen.role, ariaModal: gOpen.ariaModal, labelledby: gOpen.labelledby });
  addCheck('guide.background-inert', gOpen.appInert === true, gOpen.appInert);
  await shot('23-guide-modal-1920.png');
  const guideText = await c.ev("document.getElementById('guideModal').innerText");
  results.modal.text = guideText;
  // tab trap
  let escaped = 0; const tabSeq = [];
  for (let i = 0; i < 20; i++) {
    await c.key('Tab', 'Tab', { vk: 9 });
    const info = await c.evJson("(function(){var e=document.activeElement;return {inside:document.querySelector('#guideModal .modal-panel').contains(e),tag:e&&e.tagName,cls:e&&String(e.className).slice(0,40),id:e&&e.id};})()");
    if (!info.inside) escaped++;
    if (i < 6) tabSeq.push(info);
  }
  await c.cmd('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Shift', code: 'ShiftLeft', windowsVirtualKeyCode: 16, nativeVirtualKeyCode: 16, modifiers: 8 });
  await c.cmd('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, modifiers: 8 });
  await c.cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, modifiers: 8 });
  await c.cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Shift', code: 'ShiftLeft', windowsVirtualKeyCode: 16, nativeVirtualKeyCode: 16 });
  await sleep(150);
  const shiftInside = await c.ev("document.querySelector('#guideModal .modal-panel').contains(document.activeElement)");
  addCheck('guide.focus-trap', escaped === 0 && shiftInside === true, { escaped, total: 20, shiftInside });
  // scroll reset after close/reopen
  await c.ev("(function(){var p=document.querySelector('#guideModal .modal-panel');p.scrollTop=500;return p.scrollTop;})()");
  await sleep(200);
  const scrolled = await c.ev("document.querySelector('#guideModal .modal-panel').scrollTop");
  const escState = await closeGuideViaEsc();
  addCheck('guide.esc-close-focus-return', escState.open === false && escState.aria === 'true' && escState.appInert === false && escState.focusId === 'guideBtn', escState);
  const gOpen2 = await openGuideModal();
  addCheck('guide.scroll-reset-after-reopen', scrolled > 0 && gOpen2.panelScrollTop === 0, { scrolledBefore: scrolled, scrollOnReopen: gOpen2.panelScrollTop });
  const closeX = await c.clickSelector('#guideModal .modal-close');
  await waitFor(modalIsHidden, 3000, 60);
  const closedX = await c.ev("document.getElementById('guideModal').classList.contains('open')");
  await openGuideModal();
  await c.mouseClick(30, 30);
  await waitFor(modalIsHidden, 3000, 60);
  const closedBackdrop = await c.ev("document.getElementById('guideModal').classList.contains('open')");
  await openGuideModal();
  await c.bringToFront();
  const jumpSel = "button.guide-jump[data-jump='parabola']";
  await c.ev("(function(){var e=document.querySelector(" + JSON.stringify(jumpSel) + ");e.scrollIntoView({block:'center'});return true;})()");
  await sleep(300);
  let jumpRetried = false;
  await c.clickSelector(jumpSel);
  try {
    await waitFor(modalIsHidden, 5000, 80);
  } catch (e) {
    jumpRetried = true;
    await c.ev("document.querySelector(" + JSON.stringify(jumpSel) + ").click();true");
    await waitFor(modalIsHidden, 4000, 80);
  }
  await sleep(700);
  const jump = { mode: (await readDiag()).mode, open: await c.ev("document.getElementById('guideModal').classList.contains('open')"), retried: jumpRetried };
  results.modal.jumpRetried = jumpRetried;
  results.modal.close = { esc: escState, x: closedX, backdrop: closedBackdrop, jump };
  addCheck('guide.close-x', closedX === false, closedX);
  addCheck('guide.close-backdrop', closedBackdrop === false, closedBackdrop);
  addCheck('guide.jump-button', jump.open === false && jump.mode === 'parabola', jump);
  // guidance content checks
  const mustHave = ['两支', '准线', '渐近线', '离心率', '半通径', '推导', '易错', '焦点'];
  const missing = mustHave.filter(s => guideText.indexOf(s) === -1);
  addCheck('guide.content-keywords', missing.length === 0, missing);
  const forbidden = [/定义(?:只|仅)(?:给出|得到)?(?:双曲线的?)?(?:一|单)(?:支|条)/, /轨迹(?:只|仅)(?:是|为|有)(?:双曲线的?)?(?:一|单)(?:支|条)/];
  addCheck('guide.content-no-wrong-branch-claim', forbidden.every(re => !re.test(guideText)), forbidden.map(re => re.source));

  // ================= I. layout (4 viewports) =================
  const MEASURE = "(function(){function q(s){return document.querySelector(s);}function rect(e){if(!e)return null;var b=e.getBoundingClientRect();return {top:+b.top.toFixed(1),bottom:+b.bottom.toFixed(1),left:+b.left.toFixed(1),right:+b.right.toFixed(1),width:+b.width.toFixed(1),height:+b.height.toFixed(1)};}function panel(e){return {rect:rect(e),scrollHeight:e.scrollHeight,clientHeight:e.clientHeight};}var all=document.querySelectorAll('body *');var overflow=[];for(var i=0;i<all.length;i++){var e=all[i];if(e.closest('.ambient'))continue;if(e.closest('#guideModal'))continue;if(e.closest('#catalogTrack'))continue;var cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden')continue;var b=e.getBoundingClientRect();if(b.width===0&&b.height===0)continue;if(b.right>innerWidth+1||b.left<-1){overflow.push({tag:e.tagName,cls:String(e.className||'').slice(0,36),id:e.id||'',left:+b.left.toFixed(1),right:+b.right.toFixed(1)});}}var cv=document.getElementById('scene');var cards=Array.prototype.map.call(document.querySelectorAll('.mode-card'),function(c){var b=c.getBoundingClientRect();return {mode:c.getAttribute('data-mode'),w:+b.width.toFixed(1),left:+b.left.toFixed(1),top:+b.top.toFixed(1)};});return {innerW:innerWidth,innerH:innerHeight,docW:document.documentElement.scrollWidth,docH:document.documentElement.scrollHeight,bodyW:document.body.scrollWidth,bodyOverflow:getComputedStyle(document.body).overflow,header:rect(q('.topbar')),h1:rect(q('h1')),stage:rect(q('.stage-card')),scene:{css:rect(cv),w:cv.width,h:cv.height},controls:panel(q('.panel-controls')),details:panel(q('.panel-details')),catalog:rect(q('.catalog')),catalogTrack:(function(){var t=q('#catalogTrack');return {rect:rect(t),sw:t.scrollWidth,cw:t.clientWidth};})(),modeTabs:rect(q('#modeTabs')),axisSwitch:rect(q('#axisSwitch')),toggleGrid:rect(q('.toggle-grid')),playBtn:rect(q('#playBtn')),resetBtn:rect(q('#resetBtn')),quick:rect(q('#unifiedQuick')),cards:cards,sections:[{sel:'.stage-card',rect:rect(q('.stage-card'))},{sel:'.panel-controls',rect:rect(q('.panel-controls'))},{sel:'.panel-details',rect:rect(q('.panel-details'))},{sel:'.catalog',rect:rect(q('.catalog'))}],overflow:overflow};})()";
  async function measure(name, w, h, mobile, shotName) {
    await c.setViewport(w, h, mobile);
    await c.bringToFront();
    await c.ev('window.scrollTo(0,0);true');
    await setMode('ellipse'); await apply('ellipse', { a: 4, e: 0.55 }, 'x', 0.9);
    await sleep(650);
    const m = await c.evJson(MEASURE);
    results.layout[name] = m;
    if (shotName) await shot(shotName);
    return m;
  }
  const m1920 = await measure('1920x1080', 1920, 1080, false, '18-layout-1920x1080.png');
  addCheck('layout.1920.no-page-hoverflow', m1920.docW <= m1920.innerW + 1 && m1920.overflow.length === 0, { docW: m1920.docW, innerW: m1920.innerW, overflow: m1920.overflow.slice(0, 5), trackScroll: m1920.catalogTrack });
  addCheck('layout.1920.columns', m1920.controls.rect.right <= m1920.stage.left + 1 && m1920.stage.right <= m1920.details.rect.left + 1, { controlsRight: m1920.controls.rect.right, stage: [m1920.stage.left, m1920.stage.right], detailsLeft: m1920.details.rect.left });
  addCheck('layout.1920.in-viewport', m1920.stage.bottom <= m1920.innerH + 1 && m1920.catalog.bottom <= m1920.innerH + 1 && m1920.playBtn.bottom <= m1920.innerH && m1920.playBtn.top >= 0, { stageBottom: m1920.stage.bottom, catalogBottom: m1920.catalog.bottom, playBtn: m1920.playBtn });
  addCheck('layout.1920.panels-scroll', m1920.controls.scrollHeight - m1920.controls.clientHeight <= 2 && m1920.details.scrollHeight - m1920.details.clientHeight <= 2, { controls: [m1920.controls.scrollHeight, m1920.controls.clientHeight], details: [m1920.details.scrollHeight, m1920.details.clientHeight] });
  addCheck('layout.1920.canvas-size', m1920.scene.css.width > 600 && m1920.scene.css.height > 400 && Math.abs(m1920.scene.w / m1920.scene.h - m1920.scene.css.width / m1920.scene.css.height) < 0.02, m1920.scene);
  addCheck('layout.1920.catalog-cards', m1920.cards.length === 4 && m1920.cards.every(x => x.w > 100), m1920.cards);

  const m1366 = await measure('1366x768', 1366, 768, false, '19-layout-1366x768.png');
  addCheck('layout.1366.no-page-hoverflow', m1366.docW <= m1366.innerW + 1 && m1366.overflow.length === 0, { docW: m1366.docW, innerW: m1366.innerW, overflow: m1366.overflow.slice(0, 8), trackScroll: m1366.catalogTrack });
  addCheck('layout.1366.catalog-track-scrollable', m1366.catalogTrack.sw >= m1366.catalogTrack.cw && m1366.catalog.right <= m1366.innerW + 1, m1366.catalogTrack);
  addCheck('layout.1366.no-page-scroll', m1366.docH <= m1366.innerH + 1, { docH: m1366.docH, innerH: m1366.innerH });
  addCheck('layout.1366.play-visible', m1366.playBtn.top >= 0 && m1366.playBtn.bottom <= m1366.innerH && m1366.playBtn.width > 50, m1366.playBtn);
  addCheck('layout.1366.controls-visible', m1366.controls.rect.bottom <= m1366.innerH + 1 && m1366.modeTabs.width > 200, { controls: m1366.controls, modeTabs: m1366.modeTabs });
  addCheck('layout.1366.details-visible', m1366.details.rect.bottom <= m1366.innerH + 1 && m1366.details.scrollHeight - m1366.details.clientHeight <= 2, { details: m1366.details });
  addCheck('layout.1366.catalog-visible', m1366.catalog.bottom <= m1366.innerH + 1 && m1366.cards.length === 4, { catalog: m1366.catalog, cards: m1366.cards.length });
  addCheck('layout.1366.stage-size', m1366.stage.width >= 500 && m1366.stage.height >= 380, m1366.stage);

  const m1024 = await measure('1024x800', 1024, 800, false, '20-layout-1024x800.png');
  addCheck('layout.1024.no-page-hoverflow', m1024.docW <= m1024.innerW + 1 && m1024.overflow.length === 0, { docW: m1024.docW, innerW: m1024.innerW, overflow: m1024.overflow.slice(0, 8), trackScroll: m1024.catalogTrack });
  addCheck('layout.1024.catalog-track-scrollable', m1024.catalogTrack.sw > m1024.catalogTrack.cw && m1024.catalog.right <= m1024.innerW + 1, m1024.catalogTrack);
  addCheck('layout.1024.stack-order', m1024.stage.top < m1024.controls.rect.top && m1024.controls.rect.top < m1024.details.rect.top && m1024.details.rect.top < m1024.catalog.top, m1024.sections);
  addCheck('layout.1024.stage-fits', m1024.stage.width <= m1024.innerW && m1024.stage.height >= 400, m1024.stage);
  addCheck('layout.1024.widths', m1024.controls.rect.width <= m1024.innerW && m1024.details.rect.width <= m1024.innerW && m1024.catalog.width <= m1024.innerW, { controls: m1024.controls.rect.width, details: m1024.details.rect.width, catalog: m1024.catalog.width });
  addCheck('layout.1024.controls-operable', m1024.modeTabs.width > 300 && m1024.playBtn.width > 100, { modeTabs: m1024.modeTabs, playBtn: m1024.playBtn });

  const m390 = await measure('390x844', 390, 844, true, null);
  addCheck('layout.390.no-page-hoverflow', m390.docW <= m390.innerW + 1 && m390.overflow.length === 0, { docW: m390.docW, innerW: m390.innerW, overflow: m390.overflow.slice(0, 8), trackScroll: m390.catalogTrack });
  addCheck('layout.390.catalog-track-scrollable', m390.catalogTrack.sw > m390.catalogTrack.cw && m390.catalog.right <= m390.innerW + 1, m390.catalogTrack);
  const trackScrollTest = await c.evJson("(function(){var t=document.getElementById('catalogTrack');var c=document.querySelector('.mode-card');var before=c.getBoundingClientRect().left;t.scrollLeft=200;return {before:before,docW:document.documentElement.scrollWidth,innerW:innerWidth};})()");
  await sleep(250);
  const trackAfter = await c.evJson("(function(){var t=document.getElementById('catalogTrack');var c=document.querySelector('.mode-card');return {scrollLeft:t.scrollLeft,cardLeft:c.getBoundingClientRect().left,docW:document.documentElement.scrollWidth,innerW:innerWidth};})()");
  results.layout.catalogTrackScrollTest = { before: trackScrollTest, after: trackAfter };
  addCheck('layout.390.catalog-track-scrolls-inside', trackAfter.scrollLeft > 0 && trackAfter.cardLeft < trackScrollTest.before - 50 && trackAfter.docW <= trackAfter.innerW + 1, { before: trackScrollTest, after: trackAfter });
  await c.ev("document.getElementById('catalogTrack').scrollLeft=0;true"); await sleep(150);
  addCheck('layout.390.order', m390.stage.top < m390.controls.rect.top && m390.controls.rect.top < m390.details.rect.top && m390.details.rect.top < m390.catalog.top, m390.sections);
  addCheck('layout.390.header-fits', m390.header.height >= 50 && m390.h1.right <= m390.innerW + 1, { header: m390.header, h1: m390.h1 });
  addCheck('layout.390.stage-fits', m390.stage.width <= m390.innerW && m390.stage.height >= 450, m390.stage);
  addCheck('layout.390.controls-width', m390.controls.rect.width > 300 && m390.controls.rect.width <= m390.innerW, m390.controls.rect);
  addCheck('layout.390.cards', m390.cards.length === 4 && m390.cards.every(x => x.w > 150), m390.cards);
  // mobile screenshots at scroll positions
  await c.ev('window.scrollTo(0,0)'); await sleep(350);
  await shot('21-mobile-390x844-top.png');
  await c.ev("(function(){var e=document.querySelector('.panel-controls');window.scrollTo(0,e.getBoundingClientRect().top+window.scrollY-10);return true;})()"); await sleep(450);
  await shot('22-mobile-390x844-params.png');
  await c.ev("(function(){var e=document.querySelector('.catalog');window.scrollTo(0,e.getBoundingClientRect().top+window.scrollY-80);return true;})()"); await sleep(450);
  await shot('23-mobile-390x844-catalog.png');
  // mobile guide modal
  await c.ev('window.scrollTo(0,0)'); await sleep(300);
  const mobGuide = await openGuideModal();
  await shot('24-mobile-guide-modal.png');
  const mobGuideRect = await c.evJson("(function(){var p=document.querySelector('#guideModal .modal-panel');var b=p.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,w:b.width,h:b.height,scrollH:p.scrollHeight,clientH:p.clientHeight,open:document.getElementById('guideModal').classList.contains('open'),focusedInside:p.contains(document.activeElement)};})()");
  results.layout.mobileGuide = mobGuideRect;
  addCheck('layout.390.guide-modal-fits', mobGuide.open === true && mobGuideRect.open === true && mobGuideRect.left >= -1 && mobGuideRect.right <= 391 && mobGuideRect.top >= -1 && mobGuideRect.bottom <= 845 && mobGuideRect.focusedInside === true, mobGuideRect);
  await closeGuideViaEsc();
  await c.setViewport(1920, 1080, false); await sleep(500);

  // ================= J. accessibility basics =================
  const a11y = results.a11y;
  const buttons = await c.evJson("(function(){var out=[];document.querySelectorAll('button').forEach(function(b){var name=(b.getAttribute('aria-label')||b.innerText||b.textContent||b.getAttribute('title')||'').replace(/\\s+/g,' ').trim();out.push({id:b.id||'',cls:String(b.className).slice(0,36),name:name,ariaPressed:b.getAttribute('aria-pressed')});});return out;})()");
  a11y.buttons = buttons;
  const nameless = buttons.filter(b => !b.name);
  addCheck('a11y.buttons-named', nameless.length === 0, nameless);
  const ranges = await c.evJson("(function(){var out=[];document.querySelectorAll('input[type=range]').forEach(function(inp){var l=document.querySelector('label[for=\"'+inp.id+'\"]');out.push({id:inp.id,aria:inp.getAttribute('aria-label'),visibleLabel:l&&l.textContent.replace(/\\s+/g,' ').trim()});});return out;})()");
  a11y.ranges = ranges;
  addCheck('a11y.ranges-labeled', ranges.length === 4 && ranges.every(r => r.aria && r.visibleLabel), ranges);
  const staleLabel = await (async () => { await setMode('hyperbola'); await sleep(250); return c.evJson("(function(){var out=[];document.querySelectorAll('input[type=range]').forEach(function(inp){var l=document.querySelector('label[for=\"'+inp.id+'\"]');out.push({id:inp.id,aria:inp.getAttribute('aria-label'),visibleLabel:l&&l.textContent.replace(/\\s+/g,' ').trim(),rowVisible:!inp.closest('.param-row').hidden});});return out;})()"); })();
  a11y.rangesInHyperbola = staleLabel;
  const rangeMismatch = staleLabel.filter(r => r.rowVisible && r.aria && r.aria.indexOf('椭圆') !== -1);
  results.a11y.rangeLabelObservations = rangeMismatch;
  await setMode('unified'); await sleep(250);
  const unifiedRanges = await c.evJson("(function(){var out=[];document.querySelectorAll('input[type=range]').forEach(function(inp){var l=document.querySelector('label[for='+inp.id+']');out.push({id:inp.id,aria:inp.getAttribute('aria-label'),visibleLabel:l&&l.textContent.replace(/\\s+/g,' ').trim(),rowVisible:!inp.closest('.param-row').hidden});});return out;})()");
  results.a11y.rangesInUnified = unifiedRanges;
  const unifiedStale = unifiedRanges.filter(r => r.rowVisible && r.aria && r.aria.indexOf('椭圆') !== -1);
  addCheck('a11y.range-aria-mode-context', rangeMismatch.length === 0 && unifiedStale.length === 0, { hyperbola: rangeMismatch, unified: unifiedStale, note: '滑杆 aria-label 固定为椭圆模式文案，切到双曲线/统一视角后仍读作“椭圆…”（可见 label 已更新）' });
  await setMode('ellipse'); await sleep(200);
  await setMode('ellipse'); await sleep(250);
  const canvasA11y = await c.evJson("(function(){var cv=document.getElementById('scene');return {aria:cv.getAttribute('aria-label'),role:cv.getAttribute('role'),fallback:(cv.textContent||'').trim(),live:document.getElementById('liveName').textContent};})()");
  a11y.canvas = canvasA11y;
  addCheck('a11y.canvas-label', !!(canvasA11y.aria && canvasA11y.aria.length > 3), canvasA11y);
  // focus visible via Tab
  await c.ev("(function(){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();document.body.focus();return true;})()");
  await c.key('Tab', 'Tab', { vk: 9 }); await sleep(200);
  const focus1 = await c.evJson("(function(){var e=document.activeElement;var cs=getComputedStyle(e);return {tag:e.tagName,id:e.id,cls:String(e.className).slice(0,36),text:(e.innerText||'').replace(/\\s+/g,' ').trim().slice(0,24),focusVisible:(function(){try{return e.matches(':focus-visible')}catch(err){return null}})(),outlineWidth:cs.outlineWidth,outlineStyle:cs.outlineStyle};})()");
  a11y.firstTabFocus = focus1;
  addCheck('a11y.focus-visible', focus1.focusVisible === true && focus1.outlineStyle !== 'none' && parseFloat(focus1.outlineWidth) > 0, focus1);
  // aria-pressed on tabs/toggles/axis/quick after sync
  const pressed = await c.evJson("(function(){return {tabs:Array.prototype.map.call(document.querySelectorAll('.conic-tab'),function(b){return b.getAttribute('aria-pressed');}),toggles:Array.prototype.map.call(document.querySelectorAll('.switch'),function(b){return b.getAttribute('aria-pressed');}),axis:Array.prototype.map.call(document.querySelectorAll('[data-axis]'),function(b){return b.getAttribute('aria-pressed');}),cards:Array.prototype.map.call(document.querySelectorAll('.mode-card'),function(b){return b.getAttribute('aria-pressed');})};})()");
  a11y.pressed = pressed;
  addCheck('a11y.aria-pressed', pressed.tabs.filter(x => x === 'true').length === 1 && pressed.toggles.every(x => x === 'true' || x === 'false') && pressed.axis.filter(x => x === 'true').length === 1 && pressed.cards.filter(x => x === 'true').length === 1, pressed);
  // contrast probe (light)
  const contrast = await c.evJson("(function(){function parse(c){var m=c.match(/rgba?\\(([^)]+)\\)/);if(!m)return [0,0,0,0];var p=m[1].split(',').map(function(x){return parseFloat(x)});return [p[0],p[1],p[2],p.length>3?p[3]:1];}function mix(fg,bg){var a=fg[3];return [fg[0]*a+bg[0]*(1-a),fg[1]*a+bg[1]*(1-a),fg[2]*a+bg[2]*(1-a),1];}function lum(c){var s=c.slice(0,3).map(function(v){v=v/255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return 0.2126*s[0]+0.7152*s[1]+0.0722*s[2];}function ratio(a,b){var l1=lum(a),l2=lum(b);return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);}function effBg(e){var chain=[];var n=e;while(n&&n.tagName!=='HTML'){var cs=getComputedStyle(n);chain.push(parse(cs.backgroundColor));n=n.parentElement;}chain.push([7,15,26,1]);var bg=[7,15,26,1];for(var i=chain.length-1;i>=0;i--){var c2=chain[i];if(c2[3]>0)bg=mix(c2,bg);}return bg;}var sels=['.note-card p','.feature-row .k','.feature-row .v','.metric span','.metric strong','.mode-rel','.mode-eq','.param-foot','.block-label span','.def-values','.live-copy span','.catalog-hint','.hint span'];var out=[];sels.forEach(function(s){var e=document.querySelector(s);if(!e){out.push({sel:s,missing:true});return;}var cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden'){out.push({sel:s,hidden:true});return;}var fg=parse(cs.color);out.push({sel:s,color:cs.color,fontSize:cs.fontSize,ratio:+ratio(fg,effBg(e)).toFixed(2)});});return out;})()");
  a11y.contrast = contrast;
  const lowContrast = contrast.filter(x => x.ratio && x.ratio < 4.5);
  results.a11y.lowContrast = lowContrast;
  addCheck('a11y.contrast', lowContrast.length === 0, lowContrast);

  // ================= K. errors / no NaN =================
  const pageErrors = collectPageErrors(c.events);
  const diagErrors = await c.ev('window.__CONIC_LAB__.getDiagnostics().errors');
  const reqs = c.events.filter(e => e.method === 'Network.requestWillBeSent').map(e => e.params.request.url);
  const external = reqs.filter(u => !u.startsWith('file://') && !u.startsWith('data:'));
  const bodyText = await c.ev('document.body.innerText');
  results.errors = { pageErrors, diagErrors, runtimeExceptions: c.events.filter(e => e.method === 'Runtime.exceptionThrown').length, external, bodyNaN: /NaN|Infinity|undefined/.test(bodyText) };
  addCheck('errors.no-runtime-exceptions', results.errors.runtimeExceptions === 0, results.errors.runtimeExceptions);
  addCheck('errors.no-console-errors', pageErrors.length === 0, pageErrors.slice(0, 6));
  addCheck('errors.diag-empty', Array.isArray(diagErrors) && diagErrors.length === 0, diagErrors);
  addCheck('errors.no-external-network', external.length === 0, external);
  addCheck('errors.no-nan-in-dom', results.errors.bodyNaN === false, results.errors.bodyNaN);

  results.passCount = passN; results.failCount = failN;
} catch (err) {
  results.fatalError = String(err && err.stack || err);
  console.error('FATAL', err);
} finally {
  try { if (c) c.close(); } catch (e) {}
  try { await edge.kill(); } catch (e) {}
  fs.writeFileSync('qa/_tools/results-part2.json', JSON.stringify(results, null, 1));
  console.log('==== PART2 DONE pass=' + passN + ' fail=' + failN + ' ====');
}
