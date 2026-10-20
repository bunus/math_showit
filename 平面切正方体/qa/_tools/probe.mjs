import fs from 'node:fs';
import { launchEdge, connectPage, sleep, waitFor } from './qa-lib.mjs';
const edge = await launchEdge({ port: 9447, profile: 'C:\\Users\\LHH\\AppData\\Local\\Temp\\qa-edge-visual-qa\\probe' });
let c = null;
try {
  c = await connectPage({ port: 9447, newTarget: true, url: 'about:blank' });
  await c.setViewport(1920, 1080, false);
  await c.navigate('file:///D:/workspace/%E6%95%B0%E5%AD%A6%E6%BC%94%E7%A4%BA/index.html?preset=regular-hexagon');
  await waitFor(async () => (await c.ev('document.documentElement.dataset.ready')) === 'true', 8000);
  await sleep(600);
  const reduced = await c.ev("window.matchMedia('(prefers-reduced-motion: reduce)').matches");
  const staticMode = await c.ev("window.__CUBE_LAB__.getDiagnostics().activePresetId");
  console.log('reduced-motion', reduced, 'active', staticMode);
  // guide focus probe
  await c.clickSelector('#guideBtn');
  await sleep(400);
  const focusInfo = await c.evJson("(function(){var m=document.getElementById('guideModal');var p=m.querySelector('.modal-panel');var close=m.querySelector('.modal-close');return {open:m.classList.contains('open'),activeTag:document.activeElement&&document.activeElement.tagName,activeId:document.activeElement&&document.activeElement.id,activeCls:document.activeElement&&String(document.activeElement.className),closeExists:!!close,closeTabIndex:close&&close.tabIndex,lastFocusWasGuide:true,contains:close?close.contains(document.activeElement):null,panelContains:p.contains(document.activeElement)};})()");
  console.log('GUIDE FOCUS', JSON.stringify(focusInfo));
  // try focusing close manually and observe
  await c.ev("document.querySelector('#guideModal .modal-close').focus();true");
  await sleep(100);
  console.log('AFTER MANUAL FOCUS', await c.ev("document.activeElement.tagName + '|' + document.activeElement.className"));
  // close, then test tween timing
  await c.key('Escape','Escape',{vk:27}); await sleep(300);
  // fly-in test: square then click pentagon; measure tweening over time
  await c.ev("window.__CUBE_LAB__.applyPreset('square');true");
  await sleep(300);
  const t0 = Date.now();
  await c.clickSelector("button.shape-tile[data-id='pentagon']");
  const samples = [];
  for (let i = 0; i < 10; i++) {
    const s = await c.evJson("(function(){var d=window.__CUBE_LAB__.getDiagnostics();return {t:d.tweening,d:d.plane.d,name:d.shape&&d.shape.name};})()");
    samples.push({ t: Date.now() - t0, ...s });
    await sleep(120);
  }
  console.log('FLYIN SAMPLES', JSON.stringify(samples));
  // rAF rate probe
  const fps = await c.ev("new Promise(function(res){var n=0,t0=performance.now();function f(){n++;if(performance.now()-t0<1000){requestAnimationFrame(f);}else{res(n);}}requestAnimationFrame(f);})");
  console.log('RAFRATE ~', fps);
  console.log('matchMedia', await c.ev("window.matchMedia('(prefers-reduced-motion: reduce)').matches"));
} finally {
  try { if (c) c.close(); } catch (e) {}
  await edge.kill();
}
