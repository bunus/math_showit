import { launchEdge, connectPage, sleep, waitFor } from './qa-lib.mjs';
const edge = await launchEdge({ port: 9448, profile: 'C:\\Users\\LHH\\AppData\\Local\\Temp\\qa-edge-visual-qa\\probe2' });
let c = null;
try {
  c = await connectPage({ port: 9448, newTarget: true, url: 'about:blank' });
  await c.setViewport(1920, 1080, false);
  await c.navigate('file:///D:/workspace/%E6%95%B0%E5%AD%A6%E6%BC%94%E7%A4%BA/index.html?preset=regular-hexagon');
  await waitFor(async () => (await c.ev('document.documentElement.dataset.ready')) === 'true', 8000);
  await sleep(500);
  function active() { return c.evJson("(function(){var e=document.activeElement;return {tag:e&&e.tagName,id:e&&e.id,cls:e&&String(e.className)};})()"); }
  // 1) JS click
  await c.ev("document.getElementById('guideBtn').click();true"); await sleep(300);
  console.log('JS CLICK ->', JSON.stringify(await active()));
  await c.key('Escape','Escape',{vk:27}); await sleep(300);
  console.log('AFTER ESC ->', JSON.stringify(await active()));
  // 2) real mouse click, sample immediately
  await c.ev("document.activeElement&&document.activeElement.blur();document.body.focus();true");
  const rect = await c.evJson("(function(){var b=document.getElementById('guideBtn').getBoundingClientRect();return {x:b.left+b.width/2,y:b.top+b.height/2};})()");
  await c.cmd('Input.dispatchMouseEvent',{type:'mouseMoved',x:rect.x,y:rect.y});
  await c.cmd('Input.dispatchMouseEvent',{type:'mousePressed',x:rect.x,y:rect.y,button:'left',clickCount:1});
  await c.cmd('Input.dispatchMouseEvent',{type:'mouseReleased',x:rect.x,y:rect.y,button:'left',clickCount:1});
  console.log('REAL CLICK immediate ->', JSON.stringify(await active()));
  await sleep(400);
  console.log('REAL CLICK +400 ->', JSON.stringify(await active()));
  await c.key('Escape','Escape',{vk:27}); await sleep(300);
  // 3) keyboard G from body
  await c.ev("document.activeElement&&document.activeElement.blur();document.body.focus();true");
  await c.key('g','KeyG',{vk:71,text:'g'}); await sleep(300);
  console.log('KEY G ->', JSON.stringify(await active()));
  // modal open? check focus after manually moving
  const open = await c.ev("document.getElementById('guideModal').classList.contains('open')");
  console.log('OPEN', open);
  // tab sequence inside modal
  const seq = [];
  for (let i=0;i<8;i++){ await c.key('Tab','Tab',{vk:9}); seq.push(await active()); }
  console.log('TAB SEQ', JSON.stringify(seq));
  // aria-live updates while playing: count mutations of liveName in 800ms
  await c.key('Escape','Escape',{vk:27}); await sleep(300);
  await c.ev("document.getElementById('stagePlay').click();true");
  await sleep(100);
  const mut = await c.ev("new Promise(function(res){var n=0;var el=document.getElementById('liveName');var mo=new MutationObserver(function(m){n+=m.length;});mo.observe(el,{childList:true,characterData:true,subtree:true});setTimeout(function(){mo.disconnect();res(n);},800);})");
  console.log('liveName mutations in 800ms while playing', mut);
  await c.ev("document.getElementById('stagePlay').click();true");
} finally { try { if (c) c.close(); } catch(e){} await edge.kill(); }
