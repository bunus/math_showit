// Minimal CDP client + Edge launcher for QA — independent from project scratch scripts.
import fs from 'node:fs';
import { spawn } from 'node:child_process';

export const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
export const TMP_ROOT = 'C:\\Users\\LHH\\AppData\\Local\\Temp\\qa-edge-visual-qa';

function cdpBase() {
  return 'http://127.0.0.1:' + (process.env.QA_CDP_PORT || '9444');
}

export async function listTargets() {
  const res = await fetch(cdpBase() + '/json/list');
  return res.json();
}

export async function newPageTarget(url) {
  const res = await fetch(cdpBase() + '/json/new?' + encodeURI(url), { method: 'PUT' });
  if (!res.ok) throw new Error('new target failed ' + res.status + ' ' + await res.text());
  return res.json();
}

export function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export async function waitFor(fn, timeoutMs, intervalMs) {
  const t0 = Date.now();
  const timeout = timeoutMs || 5000;
  while (Date.now() - t0 < timeout) {
    try { const v = await fn(); if (v) return v; } catch (e) {}
    await sleep(intervalMs || 100);
  }
  throw new Error('waitFor timeout after ' + timeout);
}

export async function launchEdge(opts) {
  const o = opts || {};
  const port = o.port || 9444;
  const profile = o.profile || (TMP_ROOT + '\\profile-' + port);
  fs.rmSync(profile, { recursive: true, force: true });
  fs.mkdirSync(profile, { recursive: true });
  const args = [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--no-default-browser-check', '--remote-debugging-port=' + port,
    '--user-data-dir=' + profile, '--window-size=1920,1080',
    '--force-device-scale-factor=1', '--edge-skip-compat-layer-relaunch',
    '--disable-background-networking', 'about:blank'
  ];
  const proc = spawn(EDGE_PATH, args, { stdio: 'ignore', windowsHide: true });
  let version = null;
  for (let i = 0; i < 50; i++) {
    try { const res = await fetch('http://127.0.0.1:' + port + '/json/version'); version = await res.json(); break; }
    catch (e) { await sleep(300); }
  }
  if (!version) { try { proc.kill(); } catch (e) {} throw new Error('Edge did not expose CDP on ' + port); }
  const kill = async () => {
    try { spawn('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }); } catch (e) {}
    await sleep(600);
  };
  return { proc, port, version, profile, kill };
}

export async function connectPage(opts) {
  const o = opts || {};
  if (o.port) process.env.QA_CDP_PORT = String(o.port);
  let page = null;
  if (o.newTarget) {
    page = await newPageTarget(o.url || 'about:blank');
  } else {
    const list = await listTargets();
    page = list.find(t => t.type === 'page' && t.url.indexOf('index.html') !== -1) || list.find(t => t.type === 'page');
  }
  if (!page) throw new Error('no page target');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let nextId = 0;
  const pending = new Map();
  const events = [];
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id);
      if (m.error) p.reject(new Error(JSON.stringify(m.error))); else p.resolve(m.result);
    } else if (m.method) {
      events.push(m);
    }
  });
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  function cmd(method, params) {
    return new Promise((res, rej) => {
      const id = ++nextId;
      pending.set(id, { resolve: res, reject: rej });
      ws.send(JSON.stringify({ id, method, params: params || {} }));
    });
  }
  async function ev(expression) {
    const r = await cmd('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
    if (r.exceptionDetails) throw new Error('eval failed: ' + JSON.stringify(r.exceptionDetails).slice(0, 1000));
    return r.result ? r.result.value : null;
  }
  async function evJson(expression) {
    const v = await ev(expression);
    return typeof v === 'string' ? JSON.parse(v) : v;
  }
  async function shot(file) {
    const r = await cmd('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
    return file;
  }
  async function mouseClick(x, y) {
    await cmd('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none' });
    await cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  }
  async function clickSelector(selector) {
    const rect = await evJson("(function(){var e=document.querySelector(" + JSON.stringify(selector) + ");if(!e)return null;e.scrollIntoView({block:'center',inline:'center'});var r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height,visible:r.width>0&&r.height>0};})()");
    if (!rect || !rect.visible) throw new Error('element not clickable: ' + selector + ' ' + JSON.stringify(rect));
    await mouseClick(rect.x, rect.y);
    return rect;
  }
  async function key(keyName, code, opts) {
    const o = opts || {};
    const vk = o.vk || 0;
    const base = { key: keyName, code: code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: o.modifiers || 0 };
    const down = Object.assign({ type: 'keyDown' }, base, o.text ? { text: o.text } : {});
    await cmd('Input.dispatchKeyEvent', down);
    await cmd('Input.dispatchKeyEvent', Object.assign({ type: 'keyUp' }, base));
  }
  async function typeText(text) {
    await cmd('Input.insertText', { text: text });
  }
  async function setViewport(width, height, mobile) {
    await cmd('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: !!mobile });
    await sleep(500);
  }
  async function navigate(url) {
    const before = events.length;
    const p = new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('navigate timeout')), 15000);
      const check = setInterval(() => {
        for (let i = before; i < events.length; i++) {
          if (events[i].method === 'Page.loadEventFired') { clearInterval(check); clearTimeout(t); resolve(true); return; }
        }
      }, 40);
    });
    await cmd('Page.navigate', { url });
    await p;
  }
  await cmd('Runtime.enable');
  await cmd('Page.enable');
  await cmd('Log.enable');
  await cmd('Network.enable');
  return { cmd, ev, evJson, shot, mouseClick, clickSelector, key, typeText, setViewport, navigate, events, ws, close: () => ws.close(), page, port: process.env.QA_CDP_PORT };
}

export function collectPageErrors(events) {
  const out = [];
  for (const e of events) {
    if (e.method === 'Runtime.exceptionThrown') {
      const d = e.params.exceptionDetails;
      out.push({ kind: 'exception', text: (d.exception && d.exception.description) || d.text });
    }
    if (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error') {
      out.push({ kind: 'console.error', text: e.params.args.map(a => a.value || a.description || '').join(' ') });
    }
    if (e.method === 'Log.entryAdded' && e.params.entry.level === 'error') {
      out.push({ kind: 'log.error', text: e.params.entry.text + ' ' + (e.params.entry.url || '') });
    }
  }
  return out;
}
