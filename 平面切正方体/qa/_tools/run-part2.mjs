// QA part 2: interactions, empty states, keyboard, modal, layout/responsive, accessibility, visual evidence.
import fs from 'node:fs';
import { launchEdge, connectPage, sleep, waitFor, collectPageErrors } from './qa-lib.mjs';
import { section, analyzeGeo, classifyGeo, normalize } from './geom.mjs';

const PORT = 9446;
const URL = 'file:///D:/workspace/%E6%95%B0%E5%AD%A6%E6%BC%94%E7%A4%BA/index.html?preset=regular-hexagon';
const SHOTS = 'qa/shots';
fs.mkdirSync(SHOTS, { recursive: true });
const expected = JSON.parse(fs.readFileSync('qa/_tools/expected.json', 'utf8'));
import crypto from 'node:crypto';
const targetFile = 'index.html';
const targetBuf = fs.readFileSync(targetFile);
const targetMeta = { file: 'index.html', size: targetBuf.length, sha256: crypto.createHash('sha256').update(targetBuf).digest('hex').toUpperCase(), mtime: fs.statSync(targetFile).mtime.toISOString() };
const results = { part: 2, startedAt: new Date().toISOString(), target: targetMeta, checks: [], interactions: {}, emptyStates: {}, layout: {}, a11y: {}, contentAudit: {}, screenshots: [], runtimeExceptions: 0, consoleErrors: [] };
let passN = 0, failN = 0;
function addCheck(id, ok, detail) {
  results.checks.push({ id, ok: !!ok, detail: detail === undefined ? null : detail });
  if (ok) { passN++; console.log('PASS', id, detail ? JSON.stringify(detail).slice(0, 240) : ''); }
  else { failN++; console.log('FAIL', id, detail ? JSON.stringify(detail).slice(0, 1400) : ''); }
}
function near(a, b, tol) { return Math.abs(a - b) <= tol; }

const edge = await launchEdge({ port: PORT, profile: 'C:\\Users\\LHH\\AppData\\Local\\Temp\\qa-edge-visual-qa\\p2' });
console.log('EDGE', edge.version.Browser);
let c = null;
try {
  c = await connectPage({ port: PORT, newTarget: true, url: 'about:blank' });
  await c.setViewport(1920, 1080, false);
  await c.navigate(URL);
  await waitFor(async () => (await c.ev('document.documentElement.dataset.ready')) === 'true', 10000);
  await sleep(700);
  const homeCamera = await c.ev('window.__CUBE_LAB__.getDiagnostics().camera');
  results.homeCamera = homeCamera;
  await c.ev("window.__QA={sig:function(id){var cv=document.getElementById(id);if(!cv)return null;var im=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;var s=0,nz=0;for(var i=0;i<im.length;i+=4){if(im[i+3]>0){nz++;s=(s*33+im[i]+(im[i+1]<<3)+(im[i+2]<<6))>>>0;}}return {nz:nz,sig:s,w:cv.width,h:cv.height};},empty:function(){return {show:document.getElementById('stageEmpty').classList.contains('show'),strong:document.querySelector('#stageEmpty strong').textContent,span:document.querySelector('#stageEmpty span').textContent,live:document.getElementById('liveName').textContent,faceCount:document.getElementById('faceCount').textContent,faceHint:document.getElementById('faceHint').textContent,shapeName:document.getElementById('shapeNameZh').textContent,note:document.getElementById('noteText').textContent,playing:window.__CUBE_LAB__.getDiagnostics().playing,d:window.__CUBE_LAB__.getDiagnostics().plane.d};}};true");

  async function clipShot(file, selector, scale) {
    const r = await c.evJson("(function(){var e=document.querySelector(" + JSON.stringify(selector) + ");if(!e)return null;var b=e.getBoundingClientRect();return {x:b.left,y:b.top,width:b.width,height:b.height};})()");
    const shot = await c.cmd('Page.captureScreenshot', { format: 'png', clip: { x: r.x, y: r.y, width: r.width, height: r.height, scale: scale || 1 }, captureBeyondViewport: false });
    fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
    results.screenshots.push(file);
    return file;
  }
  async function sig(id) { return c.evJson("window.__QA.sig('" + id + "')"); }
  async function applyPreset(id) { await c.ev("window.__CUBE_LAB__.applyPreset('" + id + "');true"); await sleep(120); }
  async function readDiag() { return c.evJson('window.__CUBE_LAB__.getDiagnostics()'); }
  async function modalIsHidden() {
    return c.ev("(function(){var m=document.getElementById('guideModal');return !m.classList.contains('open') && getComputedStyle(m).visibility==='hidden';})()");
  }
  async function modalSnapshot() {
    return c.evJson("(function(){var m=document.getElementById('guideModal');var p=m.querySelector('.modal-panel');var a=document.activeElement;return {open:m.classList.contains('open'),aria:m.getAttribute('aria-hidden'),visibility:getComputedStyle(m).visibility,role:p.getAttribute('role'),ariaModal:p.getAttribute('aria-modal'),labelledby:p.getAttribute('aria-labelledby'),title:document.getElementById('guideTitle').textContent,cards:m.querySelectorAll('.guide-card').length,focusedClass:a&&String(a.className),focusedInside:p.contains(a),bodyModalOpen:document.body.classList.contains('modal-open'),panelScrollHeight:p.scrollHeight,panelClientHeight:p.clientHeight};})()");
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
    await sleep(120);
    return c.evJson("(function(){var m=document.getElementById('guideModal');return {open:m.classList.contains('open'),aria:m.getAttribute('aria-hidden'),bodyClass:document.body.classList.contains('modal-open'),focusId:document.activeElement&&document.activeElement.id,focusClass:document.activeElement&&String(document.activeElement.className)};})()");
  }

  // ================= A. playback =================
  await applyPreset('square');
  const dBefore = (await readDiag()).plane.d;
  await c.clickSelector('#stagePlay');
  await sleep(120);
  const playing = await c.evJson("(function(){var d=window.__CUBE_LAB__.getDiagnostics();return {playing:d.playing,btnText:document.getElementById('playBtnText').textContent,stageAria:document.getElementById('stagePlay').getAttribute('aria-label'),playState:document.getElementById('playState').textContent,sweep:document.getElementById('sweepValue').textContent,d:d.plane.d,shape:d.shape&&d.shape.name,live:document.getElementById('liveName').textContent,catalogActive:document.querySelectorAll('.shape-tile.active').length};})()");
  await sleep(900);
  const playing2 = await c.evJson("(function(){var d=window.__CUBE_LAB__.getDiagnostics();return {playing:d.playing,d:d.plane.d,shape:d.shape&&d.shape.name,sweep:document.getElementById('sweepValue').textContent,fill:document.getElementById('sweepFill').style.width,playState:document.getElementById('playState').textContent};})()");
  results.interactions.playbackStart = { before: dBefore, afterStart: playing, after900: playing2 };
  results.screenshots.push(await c.shot(SHOTS + '/09-playing-mid-1920.png'));
  addCheck('play.start-sets-state', playing.playing === true && playing.btnText === '暂停切割' && playing.stageAria === '暂停切割动画' && playing.catalogActive === 0, playing);
  addCheck('play.plane-moves', near(playing2.d, playing.d, 1e-9) === false && near(playing2.d, dBefore, 1e-6) === false, { dBefore: dBefore, dStart: playing.d, d900: playing2.d });
  addCheck('play.sweep-ui-updates', playing2.sweep.indexOf('d = ') === 0 && playing2.fill !== '0%', { sweep: playing2.sweep, fill: playing2.fill });
  // pause via left button
  await c.clickSelector('#playBtn');
  await sleep(150);
  const paused = await c.evJson("(function(){var d=window.__CUBE_LAB__.getDiagnostics();return {playing:d.playing,text:document.getElementById('playBtnText').textContent,d:d.plane.d,playState:document.getElementById('playState').textContent};})()");
  await sleep(600);
  const paused2 = await readDiag();
  results.interactions.pause = { immediate: paused, after600: { playing: paused2.playing, d: paused2.plane.d } };
  addCheck('play.pause-stops', paused.playing === false && paused.text === '继续切割' && near(paused2.plane.d, paused.d, 1e-9), results.interactions.pause);

  // ================= B. catalog fly-in transition =================
  await applyPreset('square');
  await sleep(300);
  const clickRes = await c.clickSelector("button.shape-tile[data-id='pentagon']");
  await sleep(60);
  const midTween = await c.evJson("(function(){var d=window.__CUBE_LAB__.getDiagnostics();var active=document.querySelector('.shape-tile.active');return {tweening:d.tweening,d:d.plane.d,normal:d.plane.normal,shape:d.shape&&d.shape.name,activeTile:active&&active.getAttribute('data-id'),playing:d.playing};})()");
  results.screenshots.push(await c.shot(SHOTS + '/10-catalog-flyin-1920.png'));
  await waitFor(async () => (await c.ev('window.__CUBE_LAB__.getDiagnostics().tweening')) === false, 8000, 80);
  await sleep(200);
  const endTween = await c.evJson("(function(){var d=window.__CUBE_LAB__.getDiagnostics();return {tweening:d.tweening,shape:d.shape&&d.shape.name,sides:d.shape&&d.shape.sides,active:d.activePresetId,match:d.presetMatches};})()");
  results.interactions.flyin = { mid: midTween, end: endTween };
  addCheck('flyin.mid-transition-active', midTween.tweening === true && midTween.shape !== '五边形' && midTween.activeTile === 'pentagon', midTween);
  addCheck('flyin.lands-on-preset', endTween.tweening === false && endTween.shape === '五边形' && endTween.active === 'pentagon' && endTween.match === true, endTween);

  // ================= C. sliders (real mouse clicks) =================
  await applyPreset('regular-hexagon');
  async function clickSliderAt(sel, fraction) {
    const r = await c.evJson("(function(){var e=document.querySelector('" + sel + "');var b=e.getBoundingClientRect();return {x:b.left,y:b.top,w:b.width,h:b.height};})()");
    await c.mouseClick(r.x + r.w * fraction, r.y + r.h / 2);
    await sleep(200);
    return c.evJson("(function(){var d=window.__CUBE_LAB__.getDiagnostics();return {theta:document.getElementById('thetaRange').value,phi:document.getElementById('phiRange').value,dv:document.getElementById('dRange').value,dVal:document.getElementById('dVal').textContent,thetaVal:document.getElementById('thetaVal').textContent,phiVal:document.getElementById('phiVal').textContent,normal:d.plane.normal,d:d.plane.d,activePresetId:d.activePresetId,shape:d.shape&&d.shape.name};})()");
  }
  const beforeSliders = await c.evJson("(function(){var d=window.__CUBE_LAB__.getDiagnostics();return {normal:d.plane.normal,d:d.plane.d,theta:document.getElementById('thetaRange').value,phi:document.getElementById('phiRange').value};})()");
  const afterTheta = await clickSliderAt('#thetaRange', 0.72);
  const afterPhi = await clickSliderAt('#phiRange', 0.85);
  const afterD = await clickSliderAt('#dRange', 0.62);
  results.interactions.sliders = { before: beforeSliders, afterTheta: afterTheta, afterPhi: afterPhi, afterD: afterD };
  addCheck('slider.theta-changes-normal', JSON.stringify(afterTheta.normal) !== JSON.stringify(beforeSliders.normal) && Number(afterTheta.theta) !== Number(beforeSliders.theta) && afterTheta.activePresetId === null, afterTheta);
  addCheck('slider.phi-changes-normal', JSON.stringify(afterPhi.normal) !== JSON.stringify(afterTheta.normal) && Number(afterPhi.phi) !== Number(afterTheta.phi), afterPhi);
  addCheck('slider.d-changes-plane-d', near(afterD.d, afterPhi.d, 1e-9) === false && afterD.dVal !== '', afterD);
  addCheck('slider.manual-edit-clears-preset', afterD.activePresetId === null, afterD.activePresetId);

  // ================= D. toggles =================
  await applyPreset('regular-hexagon');
  await sleep(250);
  const toggleResults = {};
  for (const key of ['plane', 'faces', 'labels']) {
    const sel = "button.switch[data-toggle='" + key + "']";
    const before = { aria: await c.ev("document.querySelector(\"" + sel + "\").getAttribute('aria-pressed')"), scene: await sig('scene'), shape: await sig('shapeCanvas') };
    await c.clickSelector(sel);
    await sleep(300);
    const after = { aria: await c.ev("document.querySelector(\"" + sel + "\").getAttribute('aria-pressed')"), scene: await sig('scene'), shape: await sig('shapeCanvas') };
    toggleResults[key] = { before, after };
    addCheck('toggle.' + key + '.aria-pressed', before.aria === 'true' && after.aria === 'false', { before: before.aria, after: after.aria });
    addCheck('toggle.' + key + '.renders-change', before.scene.sig !== after.scene.sig || before.shape.sig !== after.shape.sig, { sceneSame: before.scene.sig === after.scene.sig, shapeSame: before.shape.sig === after.shape.sig });
    await c.clickSelector(sel);
    await sleep(200);
  }
  results.interactions.toggles = toggleResults;
  addCheck('toggle.labels-affects-2d-canvas', toggleResults.labels.before.shape.sig !== toggleResults.labels.after.shape.sig, { before: toggleResults.labels.before.shape.sig, after: toggleResults.labels.after.shape.sig });

  // ================= E. auto-rotate =================
  const yawBefore = (await readDiag()).camera.yaw;
  await c.clickSelector('#autoRotateBtn');
  await sleep(150);
  const rotOn = await c.evJson("(function(){return {pressed:document.getElementById('autoRotateBtn').getAttribute('aria-pressed'),yaw:window.__CUBE_LAB__.getDiagnostics().camera.yaw};})()");
  await sleep(800);
  const rotLater = (await readDiag()).camera.yaw;
  await c.clickSelector('#autoRotateBtn');
  await sleep(120);
  const rotOff = await c.evJson("(function(){return {pressed:document.getElementById('autoRotateBtn').getAttribute('aria-pressed'),yaw:window.__CUBE_LAB__.getDiagnostics().camera.yaw};})()");
  await sleep(500);
  const rotStopped = (await readDiag()).camera.yaw;
  results.interactions.autoRotate = { yawBefore, rotOn, rotLater, rotOff, rotStopped };
  addCheck('autoRotate.starts-and-moves', rotOn.pressed === 'true' && Math.abs(rotLater - rotOn.yaw) > 0.02, { onYaw: rotOn.yaw, laterYaw: rotLater });
  addCheck('autoRotate.stops', rotOff.pressed === 'false' && Math.abs(rotStopped - rotOff.yaw) < 0.01, { offYaw: rotOff.yaw, stoppedYaw: rotStopped });

  // ================= F. reset view =================
  await c.ev('window.__CUBE_LAB__.setCamera(0.2,-0.7,9.4)');
  await sleep(150);
  const camChanged = (await readDiag()).camera;
  await c.clickSelector('#resetViewBtn');
  await waitFor(async () => { const cam = (await readDiag()).camera; return Math.abs(cam.yaw - homeCamera.yaw) < 2e-3 && Math.abs(cam.pitch - homeCamera.pitch) < 2e-3 && Math.abs(cam.dist - homeCamera.dist) < 3e-3; }, 5000, 120);
  const camReset = (await readDiag()).camera;
  results.interactions.resetView = { home: homeCamera, changed: camChanged, reset: camReset };
  addCheck('resetView.returns-home', near(camReset.yaw, homeCamera.yaw, 1e-3) && near(camReset.pitch, homeCamera.pitch, 1e-3) && near(camReset.dist, homeCamera.dist, 1e-3), results.interactions.resetView);

  // ================= G. reset all =================
  await applyPreset('square');
  await c.clickSelector("button.switch[data-toggle='labels']");
  await sleep(150);
  await c.clickSelector('#stagePlay');
  await sleep(300);
  await c.clickSelector('#resetBtn');
  await sleep(500);
  const resetAll = await c.evJson("(function(){var d=window.__CUBE_LAB__.getDiagnostics();return {active:d.activePresetId,shape:d.shape&&d.shape.name,playing:d.playing,btnText:document.getElementById('playBtnText').textContent,pressed:Array.prototype.map.call(document.querySelectorAll('.switch[data-toggle]'),function(b){return b.getAttribute('data-toggle')+':'+b.getAttribute('aria-pressed');}),camera:d.camera,empty:document.getElementById('stageEmpty').classList.contains('show'),toast:document.getElementById('toast').textContent,toastShown:document.getElementById('toast').classList.contains('show')};})()");
  results.interactions.resetAll = resetAll;
  addCheck('reset.all-defaults', resetAll.active === 'regular-hexagon' && resetAll.shape === '正六边形' && resetAll.playing === false && resetAll.pressed.join(',') === 'plane:true,faces:true,labels:true' && resetAll.empty === false, resetAll);
  addCheck('reset.camera-home', near(resetAll.camera.yaw, homeCamera.yaw, 1e-3) && near(resetAll.camera.pitch, homeCamera.pitch, 1e-3) && near(resetAll.camera.dist, homeCamera.dist, 1e-3), resetAll.camera);
  addCheck('reset.toast-feedback', resetAll.toast === '已重置画面', resetAll.toast);

  // ================= H. keyboard shortcuts =================
  await c.ev("(function(){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();document.body.focus();window.scrollTo(0,0);return true;})()");
  await c.key(' ', 'Space', { vk: 32, text: ' ' });
  await sleep(250);
  const spaceOn = (await readDiag()).playing;
  await c.key(' ', 'Space', { vk: 32, text: ' ' });
  await sleep(250);
  const spaceOff = (await readDiag()).playing;
  await c.ev('window.__CUBE_LAB__.setCamera(0.15,-0.5,9.2)');
  await sleep(120);
  const camBeforeR = (await readDiag()).camera;
  await c.key('r', 'KeyR', { vk: 82, text: 'r' });
  await waitFor(async () => { const cam = (await readDiag()).camera; return Math.abs(cam.yaw - homeCamera.yaw) < 2e-3 && Math.abs(cam.pitch - homeCamera.pitch) < 2e-3; }, 5000, 120);
  const camAfterR = (await readDiag()).camera;
  await c.key('g', 'KeyG', { vk: 71, text: 'g' });
  await waitFor(async () => (await c.ev("document.getElementById('guideModal').classList.contains('open')")), 3000, 60);
  await waitFor(async () => (await c.ev("document.activeElement && document.activeElement.classList.contains('modal-close')")), 2500, 60);
  await sleep(120);
  const guideByG = await modalSnapshot();
  const guideEsc = await closeGuideViaEsc();
  results.interactions.keyboard = { spaceOn, spaceOff, camBeforeR, camAfterR, guideByG, guideEsc };
  addCheck('keyboard.space-toggles-play', spaceOn === true && spaceOff === false, { spaceOn, spaceOff });
  addCheck('keyboard.r-resets-view', near(camAfterR.yaw, homeCamera.yaw, 1e-3) && near(camAfterR.pitch, homeCamera.pitch, 1e-3), { before: camBeforeR, after: camAfterR });
  addCheck('keyboard.g-opens-guide', guideByG.open === true && guideByG.aria === 'false', guideByG);
  addCheck('keyboard.esc-closes-guide', guideEsc.open === false && guideEsc.aria === 'true' && guideEsc.bodyClass === false, guideEsc);
  addCheck('keyboard.esc-returns-focus', guideEsc.focusId === 'guideBtn', guideEsc);

  // ================= I. guide modal =================
  const guideOpen = await openGuideModal();
  results.interactions.guideOpen = guideOpen;
  addCheck('guide.opens-and-locks-scroll', guideOpen.open === true && guideOpen.aria === 'false' && guideOpen.bodyModalOpen === true && guideOpen.visibility === 'visible', guideOpen);
  addCheck('a11y.guide-moves-focus-into-dialog', guideOpen.focusedInside === true && String(guideOpen.focusedClass).indexOf('modal-close') !== -1, { focusedClass: guideOpen.focusedClass, inside: guideOpen.focusedInside });
  addCheck('guide.dialog-semantics', guideOpen.role === 'dialog' && guideOpen.ariaModal === 'true' && guideOpen.labelledby === 'guideTitle' && guideOpen.title.length > 0 && guideOpen.cards === 4, guideOpen);
  results.screenshots.push(await c.shot(SHOTS + '/07-guide-modal-top-1920.png'));
  await c.ev("(function(){var p=document.querySelector('#guideModal .modal-panel');p.scrollTop=p.scrollHeight;return p.scrollTop;})()");
  await sleep(300);
  results.screenshots.push(await c.shot(SHOTS + '/08-guide-modal-bottom-1920.png'));
  const guideText = await c.ev("document.getElementById('guideModal').innerText");
  results.guideText = guideText;
  const guideClosedEsc = await closeGuideViaEsc();
  addCheck('guide.close-esc-and-focus-return', guideClosedEsc.open === false && guideClosedEsc.aria === 'true' && guideClosedEsc.bodyClass === false && guideClosedEsc.focusId === 'guideBtn', guideClosedEsc);
  // open -> close via X button
  await openGuideModal();
  await c.clickSelector('#guideModal .modal-close');
  await waitFor(modalIsHidden, 4000, 60);
  const closedX = await c.ev("document.getElementById('guideModal').classList.contains('open')");
  // open -> close via backdrop
  await openGuideModal();
  await c.mouseClick(30, 30);
  await waitFor(modalIsHidden, 4000, 60);
  const closedBackdrop = await c.ev("document.getElementById('guideModal').classList.contains('open')");
  // guide jump link
  await openGuideModal();
  await c.clickSelector("button.guide-jump[data-jump='square']");
  await waitFor(modalIsHidden, 4000, 60);
  await waitFor(async () => (await c.ev('window.__CUBE_LAB__.getDiagnostics().tweening')) === false, 8000, 100);
  await sleep(150);
  const jump = await c.evJson("(function(){var d=window.__CUBE_LAB__.getDiagnostics();return {open:document.getElementById('guideModal').classList.contains('open'),active:d.activePresetId,shape:d.shape&&d.shape.name,tweening:d.tweening};})()");
  results.interactions.guideClose = { esc: guideClosedEsc, xButtonOpen: closedX, backdropOpen: closedBackdrop, jump: jump };
  addCheck('guide.close-x-button', closedX === false, closedX);
  addCheck('guide.close-backdrop', closedBackdrop === false, closedBackdrop);
  addCheck('guide.jump-applies-preset', jump.open === false && jump.active === 'square' && jump.shape === '正方形', jump);

  // ================= J. empty / tangent states (and stale-text bug probe) =================
  // J1 fresh null state via API: tangent message should appear
  await applyPreset('regular-hexagon');
  await c.ev('window.__CUBE_LAB__.setPlane([0.5773502691896258,0.5773502691896258,0.5773502691896258],1.75);true');
  await sleep(250);
  const tangentFresh = await c.evJson('window.__QA.empty()');
  // J2 rotate while still outside -> support shrinks, distance to support grows; overlay text must update to '移出'
  await c.ev("(function(){var q=document.getElementById('phiRange');q.value='60';q.dispatchEvent(new Event('input',{bubbles:true}));return true;})()");
  await sleep(300);
  const tangentRotated = await c.evJson('window.__QA.empty()');
  const diagRot = await readDiag();
  results.emptyStates = { tangentFresh, tangentRotated, planeAfterRotate: diagRot.plane, supportAfterRotate: diagRot.plane.support };
  results.screenshots.push(await c.shot(SHOTS + '/18-empty-stale-state-1920.png'));
  addCheck('empty.fresh-tangent-message', tangentFresh.show === true && tangentFresh.strong === '平面与正方体相切', tangentFresh);
  addCheck('empty.tangent-to-outside-updates', tangentRotated.show === true && tangentRotated.strong === '平面已移出正方体', { shown: tangentRotated.strong, expected: '平面已移出正方体', planeD: diagRot.plane.d, support: diagRot.plane.support, distanceBeyondSupport: Math.abs(diagRot.plane.d) - diagRot.plane.support });
  // J3 API outside -> tangent (reverse direction)
  await applyPreset('regular-hexagon');
  await c.ev('window.__CUBE_LAB__.setPlane([0.5773502691896258,0.5773502691896258,0.5773502691896258],1.9);true');
  await sleep(200);
  const outsideFresh = await c.evJson('window.__QA.empty()');
  await c.ev('window.__CUBE_LAB__.setPlane([0.5773502691896258,0.5773502691896258,0.5773502691896258],' + Math.sqrt(3) + ');true');
  await sleep(200);
  const tangentAfterOutside = await c.evJson('window.__QA.empty()');
  results.emptyStates.outsideFresh = outsideFresh;
  results.emptyStates.tangentAfterOutside = tangentAfterOutside;
  addCheck('empty.outside-message', outsideFresh.show === true && outsideFresh.strong === '平面已移出正方体', outsideFresh);
  addCheck('empty.outside-to-tangent-updates', tangentAfterOutside.strong === '平面与正方体相切', { shown: tangentAfterOutside.strong, expected: '平面与正方体相切' });
  // restore default view for layout work
  await c.ev("window.__CUBE_LAB__.applyPreset('regular-hexagon');window.__CUBE_LAB__.setCamera(" + homeCamera.yaw + ',' + homeCamera.pitch + ',' + homeCamera.dist + ');true');
  await sleep(250);

  // ================= K. content audit =================
  const pageText = await c.ev('document.body.innerText');
  results.contentAudit.pageTextLength = pageText.length;
  const mustHave = ['三角形截面一定都是锐角三角形', '不会出现正五边形', '直角梯形', '三组对边', '正六边形', '3、4、5、6'];
  // guide text carries most statements; visible page text carries tiles/notes
  const guideMust = ['锐角三角形', '不会出现直角或钝角', '正五边形', '直角梯形', '三组对边', '体对角线', '3、4、5、6'];
  const missingGuide = guideMust.filter(s => guideText.indexOf(s) === -1);
  addCheck('content.guide-key-claims-present', missingGuide.length === 0, missingGuide);
  const badTokens = ['undefined', 'NaN', 'null', 'TODO', '�', '&lt;'];
  const foundBad = badTokens.filter(t => pageText.indexOf(t) !== -1);
  addCheck('content.no-render-artifacts', foundBad.length === 0, foundBad);
  const overclaims = [];
  const checkPatterns = [
    { re: /唯一的正六边形/g, note: '唯一性措辞可能误导（实际有 4 个符号置换平面，形状全等）' },
    { re: /正五边形[^。；\n]{0,12}(可以|能|存在|可能)/g, note: '可能声称正五边形存在' },
    { re: /直角梯形[^。；\n]{0,8}(可以|能|存在|可能出现)/g, note: '可能声称直角梯形存在' },
    { re: /(?:任意|所有)三角形[^。；\n]{0,10}(直角|钝角)/g, note: '三角形角的错误表述' }
  ];
  for (const p of checkPatterns) {
    let m;
    const re = new RegExp(p.re.source, 'g');
    while ((m = re.exec(guideText)) !== null) overclaims.push({ match: m[0], context: guideText.slice(Math.max(0, m.index - 30), m.index + 40), note: p.note });
  }
  results.contentAudit.guideOverclaimFindings = overclaims;
  const around = (txt, needle, ctx) => { const i = txt.indexOf(needle); if (i < 0) return null; const c = ctx || 40; return txt.slice(Math.max(0, i - c), i + needle.length + c); };
  const uncertain = { uniqueHex: around(guideText, '唯一的正六边形'), atelier: guideText.length, checks: {
    triangleAcute: around(guideText, '锐角三角形'), rightTrapezoid: around(guideText, '直角梯形'),
    regularPentagon: around(guideText, '不可能出现正五边形截面'), hexParallel: around(guideText, '三组对边分别平行'),
    regularHex: around(guideText, '正六边形'), maxSides: around(guideText, '3、4、5、6'),
    allPresetsNonDegenerate: around(guideText, '所有预设均为非退化截面') } };
  const claimArtifacts = ['undefined', 'NaN', 'null', 'TODO', '\uFFFD'].filter(t => guideText.indexOf(t) !== -1);
  results.contentAudit.claimContexts = uncertain;
  results.contentAudit.guideArtifactTokens = claimArtifacts;
  addCheck('content.claims-have-context', !!(uncertain.checks.triangleAcute && uncertain.checks.rightTrapezoid && uncertain.checks.regularPentagon && uncertain.checks.hexParallel && uncertain.checks.regularHex), uncertain);
  addCheck('content.guide-no-artifacts', claimArtifacts.length === 0, claimArtifacts);

  // ================= L. accessibility =================
  const a11y = results.a11y;
  const buttons = await c.evJson("(function(){var out=[];document.querySelectorAll('button').forEach(function(b){var name=(b.getAttribute('aria-label')||b.innerText||b.textContent||b.getAttribute('title')||'').replace(/\s+/g,' ').trim();out.push({id:b.id||'',cls:String(b.className).slice(0,40),name:name,hasAriaPressed:b.hasAttribute('aria-pressed')});});return out;})()");
  a11y.buttons = buttons;
  const namelessButtons = buttons.filter(b => !b.name);
  addCheck('a11y.all-buttons-named', namelessButtons.length === 0, namelessButtons);
  const ranges = await c.evJson("(function(){var out=[];document.querySelectorAll('input[type=range]').forEach(function(inp){var lbl=inp.getAttribute('aria-label');if(!lbl){var l=document.querySelector('label[for=\"'+inp.id+'\"]');lbl=l?l.innerText:'';}out.push({id:inp.id,label:lbl&&lbl.trim(),hasLabelTag:!!document.querySelector('label[for=\"'+inp.id+'\"]')});});return out;})()");
  a11y.ranges = ranges;
  addCheck('a11y.range-inputs-labeled', ranges.length === 3 && ranges.every(r => r.label && r.label.length > 0), ranges);
  const canvasA11y = await c.evJson("(function(){var sc=document.getElementById('shapeCanvas');var scene=document.getElementById('scene');return {shape:{aria:sc.getAttribute('aria-label'),role:sc.getAttribute('role'),fallback:(sc.textContent||'').trim()},scene:{aria:scene.getAttribute('aria-label'),role:scene.getAttribute('role'),fallback:(scene.textContent||'').trim()},liveRegion:{ariaLive:document.getElementById('liveName').getAttribute('aria-live'),text:document.getElementById('liveName').textContent}};})()");
  a11y.canvas = canvasA11y;
  addCheck('a11y.shape-canvas-has-name', !!(canvasA11y.shape.aria && canvasA11y.shape.aria.length > 2), canvasA11y.shape);
  addCheck('a11y.live-region-present', canvasA11y.liveRegion.ariaLive === 'polite', canvasA11y.liveRegion);
  // focus visibility via real Tab
  await c.ev("(function(){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();document.body.focus();return true;})()");
  await c.key('Tab', 'Tab', { vk: 9 });
  await sleep(200);
  const focus1 = await c.evJson("(function(){var e=document.activeElement;var cs=getComputedStyle(e);return {tag:e.tagName,id:e.id,cls:String(e.className).slice(0,40),text:(e.innerText||'').replace(/\s+/g,' ').trim().slice(0,30),focusVisible:(function(){try{return e.matches(':focus-visible')}catch(err){return null}})(),outlineWidth:cs.outlineWidth,outlineStyle:cs.outlineStyle,outlineColor:cs.outlineColor};})()");
  a11y.firstTabFocus = focus1;
  addCheck('a11y.keyboard-focus-visible', focus1.focusVisible === true && focus1.outlineStyle !== 'none' && parseFloat(focus1.outlineWidth) > 0, focus1);
  // focus trap probe with modal open (opened through the real button)
  const trapOpen = await openGuideModal();
  let escaped = 0;
  const tabSeq = [];
  for (let i = 0; i < 20; i++) {
    await c.key('Tab', 'Tab', { vk: 9 });
    const info = await c.evJson("(function(){var e=document.activeElement;return {inside:document.querySelector('#guideModal .modal-panel').contains(e),tag:e&&e.tagName,id:e&&e.id,cls:e&&String(e.className).slice(0,40)};})()");
    if (!info.inside) escaped++;
    if (i < 8) tabSeq.push(info);
  }
  // shift+Tab backwards one step must stay inside as well
  await c.cmd('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Shift', code: 'ShiftLeft', windowsVirtualKeyCode: 16, nativeVirtualKeyCode: 16, modifiers: 8 });
  await c.cmd('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, modifiers: 8 });
  await c.cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, modifiers: 8 });
  await c.cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Shift', code: 'ShiftLeft', windowsVirtualKeyCode: 16, nativeVirtualKeyCode: 16 });
  await sleep(150);
  const shiftTabInside = await c.ev("document.querySelector('#guideModal .modal-panel').contains(document.activeElement)");
  a11y.focusTrap = { initialFocusInside: trapOpen.focusedInside, escapedTabs: escaped, totalTabs: 20, shiftTabInside: shiftTabInside, firstTabs: tabSeq };
  addCheck('a11y.dialog-traps-focus', trapOpen.focusedInside === true && escaped === 0 && shiftTabInside === true, a11y.focusTrap);
  results.screenshots.push(await c.shot(SHOTS + '/19-guide-tab-probe-1920.png'));
  await closeGuideViaEsc();
  const contrast = await c.evJson("(function(){function parse(c){var m=c.match(/rgba?\\(([^)]+)\\)/);if(!m)return [0,0,0,0];var p=m[1].split(',').map(function(x){return parseFloat(x)});return [p[0],p[1],p[2],p.length>3?p[3]:1];}function mix(fg,bg){var a=fg[3];return [fg[0]*a+bg[0]*(1-a),fg[1]*a+bg[1]*(1-a),fg[2]*a+bg[2]*(1-a),1];}function lum(c){var s=c.slice(0,3).map(function(v){v=v/255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return 0.2126*s[0]+0.7152*s[1]+0.0722*s[2];}function ratio(a,b){var l1=lum(a),l2=lum(b);return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);}function effBg(e){var chain=[];var n=e;while(n&&n.tagName!=='HTML'){var cs=getComputedStyle(n);chain.push(parse(cs.backgroundColor));n=n.parentElement;}chain.push([5,11,13,1]);var bg=[5,11,13,1];for(var i=chain.length-1;i>=0;i--){var c=chain[i];if(c[3]>0)bg=mix(c,bg);}return bg;}var sels=['.note-card p','.tile-name','.metric span','.block-label','.catalog-head p','.panel-head p','.slider-top label','#faceHint','.instruction span','.eq-foot span','.live-copy span','.shape-card-foot span','.tile-en','.mini-conclusion strong','.d-support-note'];var out=[];sels.forEach(function(s){var e=document.querySelector(s);if(!e){out.push({sel:s,missing:true});return;}var cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden'){out.push({sel:s,hidden:true});return;}var fg=parse(cs.color);var bg=effBg(e);var r=ratio(fg,bg);out.push({sel:s,color:cs.color,fontSize:cs.fontSize,fontWeight:cs.fontWeight,ratio:+r.toFixed(2)});});return out;})()");
  a11y.contrast = contrast;
  const lowContrast = contrast.filter(x => x.ratio && x.ratio < 4.5);
  addCheck('a11y.contrast-small-text', lowContrast.length === 0, lowContrast);

  // ================= M. layout checks + screenshots =================
  const measureExpr = "(function(){function q(s){return document.querySelector(s);}function rect(e){if(!e)return null;var b=e.getBoundingClientRect();return {top:+b.top.toFixed(1),bottom:+b.bottom.toFixed(1),left:+b.left.toFixed(1),right:+b.right.toFixed(1),width:+b.width.toFixed(1),height:+b.height.toFixed(1)};}function panel(e){return {rect:rect(e),scrollHeight:e.scrollHeight,clientHeight:e.clientHeight,overflowY:getComputedStyle(e).overflowY};}var track=q('#catalogTrack');var tiles=Array.prototype.map.call(document.querySelectorAll('.shape-tile'),function(t){var r=t.getBoundingClientRect();return {id:t.getAttribute('data-id'),w:+r.width.toFixed(1),left:+r.left.toFixed(1),top:+r.top.toFixed(1)};});var overflow=[];var all=document.querySelectorAll('body *');for(var i=0;i<all.length;i++){var e=all[i];if(e.closest('#catalogTrack'))continue;if(e.closest('#guideModal'))continue;if(e.closest('.ambient'))continue;var cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden')continue;var b=e.getBoundingClientRect();if(b.width===0&&b.height===0)continue;if(b.right>innerWidth+1||b.left<-1){overflow.push({tag:e.tagName,cls:String(e.className||'').slice(0,36),id:e.id||'',left:+b.left.toFixed(1),right:+b.right.toFixed(1)});}}return {innerW:innerWidth,innerH:innerHeight,docScrollW:document.documentElement.scrollWidth,docScrollH:document.documentElement.scrollHeight,bodyScrollW:document.body.scrollWidth,header:rect(q('.topbar')),h1:rect(q('h1')),topActions:rect(q('.top-actions')),stage:rect(q('.stage-card')),stagePlay:rect(q('#stagePlay')),playBtn:rect(q('#playBtn')),playbar:rect(q('.playbar')),catalog:rect(q('.catalog')),catalogTrack:rect(track),trackScroll:{sw:track.scrollWidth,cw:track.clientWidth},tiles:tiles,panels:{controls:panel(q('.panel-controls')),detail:panel(q('.panel-detail'))},shapeCanvas:rect(q('#shapeCanvas')),detailKey:{shapeName:rect(q('#shapeNameZh')),metrics:rect(q('.metric-grid')),property:rect(q('.property-block')),note:rect(q('.note-card')),why:rect(q('.mini-conclusion'))},controlsKey:{equation:rect(q('.equation-box')),sliders:rect(q('.sliders')),buttons:rect(q('.control-buttons')),switches:rect(q('.switch-grid')),face:rect(q('.face-block')),instruction:rect(q('.instruction'))},overflow:overflow,sections:[{sel:'.stage-card',rect:rect(q('.stage-card'))},{sel:'.panel-detail',rect:rect(q('.panel-detail'))},{sel:'.panel-controls',rect:rect(q('.panel-controls'))},{sel:'.catalog',rect:rect(q('.catalog'))}],bodyOverflow:getComputedStyle(document.body).overflow,visibleTiles:tiles.filter(function(t){return t.w>0;}).length,catalogTileOrder:tiles.map(function(t){return t.id;})};})()";
  async function measureViewport(name, w, h, mobile, shotName) {
    await c.setViewport(w, h, mobile);
    await c.ev("window.__CUBE_LAB__.applyPreset('regular-hexagon');window.scrollTo(0,0);true");
    await sleep(700);
    const m = await c.evJson(measureExpr);
    results.layout[name] = m;
    if (shotName) results.screenshots.push(await c.shot(SHOTS + '/' + shotName));
    return m;
  }
  const m1920 = await measureViewport('1920x1080', 1920, 1080, false, null);
  addCheck('layout.1920.no-horizontal-scroll', m1920.docScrollW <= m1920.innerW + 1 && m1920.overflow.length === 0, { scrollW: m1920.docScrollW, innerW: m1920.innerW, overflow: m1920.overflow.slice(0, 5) });
  addCheck('layout.1920.three-columns', m1920.panels.controls.rect.right <= m1920.stage.left + 1 && m1920.stage.right <= m1920.panels.detail.rect.left + 1, { controlsRight: m1920.panels.controls.rect.right, stage: [m1920.stage.left, m1920.stage.right], detailLeft: m1920.panels.detail.rect.left });
  addCheck('layout.1920.all-panels-in-viewport', m1920.stage.bottom <= m1920.innerH + 1 && m1920.catalog.bottom <= m1920.innerH + 1 && m1920.panels.controls.rect.bottom <= m1920.innerH + 1 && m1920.panels.detail.rect.bottom <= m1920.innerH + 1, { innerH: m1920.innerH, stageBottom: m1920.stage.bottom, catalogBottom: m1920.catalog.bottom });
  addCheck('layout.1920.play-button-visible', !!m1920.playBtn && m1920.playBtn.top >= 0 && m1920.playBtn.bottom <= m1920.innerH && m1920.playBtn.width > 40, m1920.playBtn);
  addCheck('layout.1920.catalog-tile-order', JSON.stringify(m1920.catalogTileOrder) === JSON.stringify(expected.presets.map(p => p.id)) && m1920.visibleTiles === 12, { visible: m1920.visibleTiles, order: m1920.catalogTileOrder.length });

  const m1366 = await measureViewport('1366x768', 1366, 768, false, '12-layout-1366x768.png');
  addCheck('layout.1366.no-horizontal-scroll', m1366.docScrollW <= m1366.innerW + 1 && m1366.overflow.length === 0, { scrollW: m1366.docScrollW, innerW: m1366.innerW, overflow: m1366.overflow.slice(0, 8) });
  addCheck('layout.1366.no-vertical-page-scroll', m1366.docScrollH <= m1366.innerH + 1, { docH: m1366.docScrollH, innerH: m1366.innerH });
  addCheck('layout.1366.play-button-visible', !!m1366.playBtn && m1366.playBtn.top >= 0 && m1366.playBtn.bottom <= m1366.innerH && m1366.playBtn.width > 40 && m1366.playBtn.top >= m1366.stage.top, m1366.playBtn);
  addCheck('layout.1366.left-panel-content', m1366.controlsKey.buttons && m1366.controlsKey.buttons.bottom <= m1366.innerH + 1, { buttons: m1366.controlsKey.buttons, scroll: m1366.panels.controls });
  addCheck('layout.1366.right-panel-content', m1366.detailKey.metrics && m1366.detailKey.metrics.bottom <= m1366.innerH + 1 && m1366.detailKey.note && m1366.detailKey.note.bottom <= m1366.innerH + 1, { metrics: m1366.detailKey.metrics, note: m1366.detailKey.note, scroll: m1366.panels.detail });
  addCheck('layout.1366.panel-internal-scroll-small', m1366.panels.controls.scrollHeight - m1366.panels.controls.clientHeight <= 120 && m1366.panels.detail.scrollHeight - m1366.panels.detail.clientHeight <= 120, { controls: [m1366.panels.controls.scrollHeight, m1366.panels.controls.clientHeight], detail: [m1366.panels.detail.scrollHeight, m1366.panels.detail.clientHeight] });
  addCheck('layout.1366.catalog-tiles-visible', m1366.visibleTiles === 12 && m1366.catalog.height > 100, { visible: m1366.visibleTiles, catalogH: m1366.catalog.height });
  addCheck('layout.1366.shape-canvas-drawn-size', m1366.shapeCanvas.width > 200 && m1366.shapeCanvas.height > 120, m1366.shapeCanvas);

  const m1024 = await measureViewport('1024x768', 1024, 768, false, '13-layout-1024x768.png');
  addCheck('layout.1024.no-horizontal-scroll', m1024.docScrollW <= m1024.innerW + 1 && m1024.overflow.length === 0, { scrollW: m1024.docScrollW, innerW: m1024.innerW, overflow: m1024.overflow.slice(0, 8) });
  addCheck('layout.1024.stack-order', m1024.stage.top < m1024.panels.detail.rect.top && m1024.panels.detail.rect.top < m1024.panels.controls.rect.top && m1024.panels.controls.rect.top < m1024.catalog.top, m1024.sections);
  addCheck('layout.1024.stage-height', m1024.stage.height >= 380 && m1024.stage.height <= 570, m1024.stage);
  addCheck('layout.1024.widths-fit', m1024.stage.width <= m1024.innerW && m1024.panels.detail.rect.width <= m1024.innerW && m1024.panels.controls.rect.width <= m1024.innerW, { stage: m1024.stage.width, detail: m1024.panels.detail.rect.width, controls: m1024.panels.controls.rect.width });
  addCheck('layout.1024.play-button-visible', m1024.stagePlay && m1024.stagePlay.top >= 0 && m1024.stagePlay.width > 20, m1024.stagePlay);

  const m390 = await measureViewport('390x844', 390, 844, true, null);
  addCheck('layout.390.no-horizontal-scroll', m390.docScrollW <= m390.innerW + 1 && m390.overflow.length === 0, { scrollW: m390.docScrollW, innerW: m390.innerW, overflow: m390.overflow.slice(0, 8) });
  addCheck('layout.390.stack-order', m390.stage.top < m390.panels.detail.rect.top && m390.panels.detail.rect.top < m390.panels.controls.rect.top && m390.panels.controls.rect.top < m390.catalog.top, m390.sections);
  addCheck('layout.390.header-wraps-and-fits', m390.header.height >= 60 && m390.topActions.right <= m390.innerW + 1 && m390.h1.right <= m390.innerW + 1, { header: m390.header, h1: m390.h1, actions: m390.topActions });
  addCheck('layout.390.stage-fits', m390.stage.width <= m390.innerW && m390.stage.height >= 430, m390.stage);
  addCheck('layout.390.catalog-order-and-size', JSON.stringify(m390.catalogTileOrder) === JSON.stringify(expected.presets.map(p => p.id)) && m390.catalog.height >= 150, { order: m390.catalogTileOrder.length, catalogH: m390.catalog.height });
  addCheck('layout.390.detail-panel-visible-width', m390.panels.detail.rect.width > 300 && m390.panels.detail.rect.width <= m390.innerW, m390.panels.detail.rect);
  // mobile screenshots at meaningful scroll positions
  async function scrollToSel(sel, offset) {
    await c.ev("(function(){var e=document.querySelector('" + sel + "');window.scrollTo(0,Math.max(0,e.getBoundingClientRect().top+window.scrollY+(" + offset + ")));return window.scrollY;})()");
    await sleep(450);
  }
  await c.ev('window.scrollTo(0,0)'); await sleep(400);
  results.screenshots.push(await c.shot(SHOTS + '/14-mobile-390x844-top.png'));
  await scrollToSel('.panel-detail', -10);
  results.screenshots.push(await c.shot(SHOTS + '/15-mobile-390x844-detail.png'));
  await scrollToSel('.panel-controls', -10);
  results.screenshots.push(await c.shot(SHOTS + '/16-mobile-390x844-controls.png'));
  await scrollToSel('.catalog', -80);
  results.screenshots.push(await c.shot(SHOTS + '/17-mobile-390x844-catalog.png'));
  // mobile guide modal
  await c.ev('window.scrollTo(0,0)'); await sleep(300);
  const mobileGuideOpen = await openGuideModal();
  results.screenshots.push(await c.shot(SHOTS + '/20-mobile-guide-modal.png'));
  const mobileGuide = await c.evJson("(function(){var p=document.querySelector('#guideModal .modal-panel');var b=p.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,w:b.width,h:b.height,scrollH:p.scrollHeight,clientH:p.clientHeight,open:document.getElementById('guideModal').classList.contains('open'),focusedInside:p.contains(document.activeElement)};})()");
  results.layout.mobileGuide = mobileGuide;
  addCheck('layout.390.guide-modal-fits', mobileGuideOpen.open === true && mobileGuide.open === true && mobileGuide.left >= -1 && mobileGuide.right <= 391 && mobileGuide.top >= -1 && mobileGuide.bottom <= 845 && mobileGuide.focusedInside === true, mobileGuide);
  await closeGuideViaEsc();

  // ================= N. 2D true-shape crops at 1920 for evidence =================
  await c.setViewport(1920, 1080, false);
  await c.ev('window.scrollTo(0,0);true');
  await sleep(500);
  const cropIds = ['equilateral-triangle', 'pentagon', 'rhombus', 'isosceles-trapezoid', 'hexagon', 'regular-hexagon'];
  for (const id of cropIds) {
    await applyPreset(id);
    await sleep(400);
    await clipShot(SHOTS + '/21-shape-' + id + '-2x.png', '.shape-card', 2);
  }

  // ================= O. errors =================
  const pageErrors = collectPageErrors(c.events);
  results.consoleErrors = pageErrors;
  results.runtimeExceptions = c.events.filter(e => e.method === 'Runtime.exceptionThrown').length;
  addCheck('errors.no-runtime-exceptions', results.runtimeExceptions === 0, results.runtimeExceptions);
  addCheck('errors.no-console-errors', pageErrors.length === 0, pageErrors.slice(0, 5));
  const finalErrors = await c.ev('window.__CUBE_LAB__.getDiagnostics().errors');
  addCheck('errors.diag-empty-at-end', Array.isArray(finalErrors) && finalErrors.length === 0, finalErrors);

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
