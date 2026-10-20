import { launchEdge, connectPage, sleep, waitFor, collectPageErrors } from './qa-lib.mjs';
const edge = await launchEdge({ port: 9451, profile: 'C:\\Users\\LHH\\AppData\\Local\\Temp\\qa-edge-visual-qa\\probe-url' });
let c = null;
const out = {};
try {
  c = await connectPage({ port: 9451, newTarget: true, url: 'about:blank' });
  await c.setViewport(1920, 1080, false);
  await c.navigate('file:///D:/workspace/%E6%95%B0%E5%AD%A6%E6%BC%94%E7%A4%BA/index.html?preset=square&static=1&yaw=0.5&pitch=0.2&dist=8.5');
  await waitFor(async () => (await c.ev('document.documentElement.dataset.ready')) === 'true', 8000);
  await sleep(600);
  out.urlParams = await c.evJson("(function(){var d=window.__CUBE_LAB__.getDiagnostics();return {active:d.activePresetId,shape:d.shape&&d.shape.name,camera:d.camera,errors:d.errors};})()");
  // click pentagon tile: in fixed build static=1 must no longer force immediate; tween should run
  await c.clickSelector("button.shape-tile[data-id='pentagon']");
  await sleep(80);
  out.afterClick = await c.evJson("(function(){var d=window.__CUBE_LAB__.getDiagnostics();return {tweening:d.tweening,shape:d.shape&&d.shape.name,active:d.activePresetId};})()");
  await waitFor(async () => (await c.ev('window.__CUBE_LAB__.getDiagnostics().tweening')) === false, 8000, 100);
  await sleep(150);
  out.afterTween = await c.evJson("(function(){var d=window.__CUBE_LAB__.getDiagnostics();return {tweening:d.tweening,shape:d.shape&&d.shape.name,active:d.activePresetId,match:d.presetMatches};})()");
  // invalid preset fallback
  await c.navigate('file:///D:/workspace/%E6%95%B0%E5%AD%A6%E6%BC%94%E7%A4%BA/index.html?preset=bogus');
  await waitFor(async () => (await c.ev('document.documentElement.dataset.ready')) === 'true', 8000);
  await sleep(500);
  out.invalidPreset = await c.evJson("(function(){var d=window.__CUBE_LAB__.getDiagnostics();return {active:d.activePresetId,shape:d.shape&&d.shape.name,errors:d.errors};})()");
  out.pageErrors = collectPageErrors(c.events).slice(0,5);
} finally { try { if (c) c.close(); } catch(e){} await edge.kill(); }
console.log(JSON.stringify(out, null, 2));
