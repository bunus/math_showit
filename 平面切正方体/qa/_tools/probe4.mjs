import { launchEdge, connectPage, sleep, waitFor } from './qa-lib.mjs';
const edge = await launchEdge({ port: 9450, profile: 'C:\\Users\\LHH\\AppData\\Local\\Temp\\qa-edge-visual-qa\\probe4' });
let c = null;
try {
  c = await connectPage({ port: 9450, newTarget: true, url: 'about:blank' });
  await c.setViewport(1920, 1080, false);
  await c.navigate('file:///D:/workspace/%E6%95%B0%E5%AD%A6%E6%BC%94%E7%A4%BA/index.html?preset=regular-hexagon');
  await waitFor(async () => (await c.ev('document.documentElement.dataset.ready')) === 'true', 8000);
  await sleep(700);
  async function closed() {
    return c.ev("(function(){var m=document.getElementById('guideModal');return !m.classList.contains('open') && getComputedStyle(m).visibility==='hidden';})()");
  }
  async function state() {
    return c.evJson("(function(){var m=document.getElementById('guideModal');var p=m.querySelector('.modal-panel');var a=document.activeElement;return {open:m.classList.contains('open'),vis:getComputedStyle(m).visibility,activeTag:a&&a.tagName,activeId:a&&a.id,activeCls:a&&String(a.className).slice(0,30),inside:p.contains(a),backdropHit:document.elementFromPoint(1802,37)===document.getElementById('guideBtn')};})()");
  }
  const rows = [];
  for (let i = 0; i < 8; i++) {
    await waitFor(closed, 3000, 60);
    await sleep(100);
    await c.clickSelector('#guideBtn');
    await sleep(450);
    const s = await state();
    rows.push({ i, method: 'mouse', ...s });
    await c.key('Escape','Escape',{vk:27});
    await sleep(300);
  }
  for (let i = 0; i < 4; i++) {
    await waitFor(closed, 3000, 60);
    await c.ev("document.activeElement&&document.activeElement.blur();document.body.focus();true");
    await c.key('g','KeyG',{vk:71,text:'g'});
    await sleep(450);
    const s = await state();
    rows.push({ i, method: 'key', ...s });
    await c.key('Escape','Escape',{vk:27});
    await sleep(300);
  }
  console.log(JSON.stringify(rows, null, 1));
  // focus trap during a verified-open modal
  await waitFor(closed, 3000, 60);
  await c.clickSelector('#guideBtn');
  await waitFor(async () => (await c.ev("document.getElementById('guideModal').classList.contains('open')")), 3000, 60);
  await sleep(400);
  console.log('open state before tab', JSON.stringify(await state()));
  const tabs=[];
  for (let i=0;i<12;i++){ await c.key('Tab','Tab',{vk:9}); tabs.push(await c.evJson("(function(){var a=document.activeElement;return {tag:a&&a.tagName,id:a&&a.id,cls:a&&String(a.className).slice(0,30),inside:document.querySelector('#guideModal .modal-panel').contains(a)};})()")); }
  console.log('TABS', JSON.stringify(tabs));
} finally { try { if (c) c.close(); } catch(e){} await edge.kill(); }
