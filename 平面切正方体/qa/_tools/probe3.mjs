import { launchEdge, connectPage, sleep, waitFor } from './qa-lib.mjs';
const edge = await launchEdge({ port: 9449, profile: 'C:\\Users\\LHH\\AppData\\Local\\Temp\\qa-edge-visual-qa\\probe3' });
let c = null;
try {
  c = await connectPage({ port: 9449, newTarget: true, url: 'about:blank' });
  await c.setViewport(1920, 1080, false);
  await c.navigate('file:///D:/workspace/%E6%95%B0%E5%AD%A6%E6%BC%94%E7%A4%BA/index.html?preset=regular-hexagon');
  await waitFor(async () => (await c.ev('document.documentElement.dataset.ready')) === 'true', 8000);
  await sleep(700);
  const state = () => c.evJson("(function(){var m=document.getElementById('guideModal');return {open:m.classList.contains('open'),aria:m.getAttribute('aria-hidden'),active:document.activeElement&&document.activeElement.tagName+'#'+(document.activeElement.id||document.activeElement.className),vis:getComputedStyle(m).visibility,z:getComputedStyle(m).zIndex};})()");
  await c.ev("document.activeElement&&document.activeElement.blur();document.body.focus();true");
  await c.key('g','KeyG',{vk:71,text:'g'}); await sleep(350);
  console.log('after G', JSON.stringify(await state()));
  await c.key('Escape','Escape',{vk:27}); await sleep(400);
  console.log('after ESC', JSON.stringify(await state()));
  const r = await c.clickSelector('#guideBtn');
  console.log('clicked guideBtn rect', JSON.stringify(r));
  console.log('immediately', JSON.stringify(await state()));
  await sleep(400);
  console.log('after 400', JSON.stringify(await state()));
  await sleep(700);
  console.log('after 1100', JSON.stringify(await state()));
} finally { try { if (c) c.close(); } catch(e){} await edge.kill(); }
