import fs from 'node:fs';
import crypto from 'node:crypto';
import { launchEdge, connectPage, sleep, waitFor } from './qa-lib.mjs';
const ROOT = 'D:/workspace/数学演示/圆锥曲线';
const URL_BASE = 'file:///' + encodeURI(ROOT) + '/index.html';
const edge = await launchEdge({ port: 9464, url: URL_BASE + '?mode=unified&e=0.65&l=2.5&static=1&t=1.0' });
let c = null;
try {
  c = await connectPage({ port: 9464 });
  await c.setViewport(1920, 1080, false);
  await c.bringToFront();
  await waitFor(async () => (await c.ev('document.documentElement.dataset.ready')) === 'true', 10000);
  await sleep(700);
  const diag = await c.evJson('window.__CONIC_LAB__.getDiagnostics()');
  const dom = await c.evJson("(function(){function t(id){var e=document.getElementById(id);return e?e.textContent.replace(/\\s+/g,' ').trim():null;}return {liveName:t('liveName'),eqNumeric:t('eqNumeric'),features:Array.prototype.map.call(document.querySelectorAll('#featureList .feature-row'),function(r){return r.textContent.replace(/\\s+/g,' ').trim();}),note:t('noteText'),defValues:t('defValues'),curves:window.__CONIC_LAB__.getDiagnostics().curves};})()");
  const out = { target: { size: fs.statSync('index.html').size, mtime: fs.statSync('index.html').mtime.toISOString(), sha256: crypto.createHash('sha256').update(fs.readFileSync('index.html')).digest('hex').toUpperCase() }, diag: { mode: diag.mode, name: diag.name, derived: diag.derived, equation: diag.equation, foci: diag.foci, directrices: diag.directrices, P: diag.P, definitionResidual: diag.definitionResidual, curves: diag.curves }, dom };
  fs.writeFileSync('qa/_tools/e065.json', JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out.diag, null, 1));
  await c.shot('qa/screens/08b-unified-e0.65-ellipse-1920.png');
} finally { try { if (c) c.close(); } catch(e){} await edge.kill(); }
