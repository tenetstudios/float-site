// Dependency-free browser checks through Chrome's DevTools protocol.
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const base = process.env.ARCHIVE_TEST_URL || 'http://localhost:3100';
const profile = await mkdtemp(join(tmpdir(), 'lion-archive-browser-'));
const browser = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--disable-gpu-sandbox', '--no-sandbox', '--no-first-run', '--remote-debugging-port=9337', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
try {
  let version;
  for (let attempt = 0; attempt < 50; attempt++) {
    try { version = await fetch('http://localhost:9337/json/version').then(r => r.json()); break; } catch { await pause(100); }
  }
  assert(version, 'Chrome debugging endpoint is available');
  socket = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
  let sequence = 0;
  const pending = new Map();
  const errors = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (!message.id) return;
    const handler = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) handler.reject(new Error(JSON.stringify(message.error))); else handler.resolve(message.result);
  });
  function send(method, params = {}, sessionId) {
    const id = ++sequence;
    return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params, sessionId })); });
  }
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const command = (method, params) => send(method, params, sessionId);
  const evaluate = async expression => {
    const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  await command('Runtime.enable');
  await command('Page.enable');
  await command('Page.bringToFront');
  await command('Page.navigate', { url: base });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await evaluate('document.querySelector(".dossier-cover") !== null && [...document.images].every(i => i.complete)')) break;
    await pause(150);
  }
  await pause(500);
  await mkdir('artifacts', { recursive: true });
  const key = async (key, code, virtualKey) => {
    await command('Input.dispatchKeyEvent', { type: 'keyDown', key, code, text: key === 'Enter' ? '\r' : key === ' ' ? ' ' : undefined, windowsVirtualKeyCode: virtualKey });
    await command('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: virtualKey });
  };
  for (const [width, height] of [[320,568],[375,667],[390,844],[430,932],[768,1024],[1024,768],[1440,900],[1920,1080]]) {
    await command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await pause(300);
    assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'), `${width}: closed horizontal overflow`);
    assert(await evaluate('document.documentElement.scrollHeight <= innerHeight + 1'), `${width}: closed vertical overflow`);
    if (width === 390 || width === 1440) {
      await evaluate('document.activeElement.blur()');
      const shot = await command('Page.captureScreenshot', { format: 'png' });
      await writeFile(`artifacts/archive-${width}-closed.png`, Buffer.from(shot.data, 'base64'));
    }
    await evaluate('document.querySelector(".dossier-cover").focus()');
    await key('Enter', 'Enter', 13);
    await pause(450);
    assert(await evaluate('document.querySelector(".dossier-hero").classList.contains("is-open")'), `${width}: Enter opens folder`);
    assert(await evaluate('document.activeElement.getAttribute("role") === "tab"'), `${width}: focus enters tabs`);
    await key('End', 'End', 35);
    assert(await evaluate('document.activeElement.id === "tab-known-personnel"'), `${width}: End selects final tab`);
    await key('ArrowRight', 'ArrowRight', 39);
    assert(await evaluate('document.activeElement.id === "tab-field-reports"'), `${width}: arrow wraps to first tab`);
    for (let index = 0; index < 5; index++) {
      await evaluate(`document.querySelectorAll('[role="tab"]')[${index}].click()`);
      assert(await evaluate(`document.querySelectorAll('[role="tabpanel"]')[${index}].hidden === false && document.querySelectorAll('[role="tabpanel"]:not([hidden])').length === 1`), `${width}: tab ${index}`);
    }
    assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'), `${width}: open horizontal overflow`);
    assert(await evaluate('document.documentElement.scrollHeight <= innerHeight + 1'), `${width}: open vertical overflow`);
    await pause(300);
    if (width === 390 || width === 1440) {
      const shot = await command('Page.captureScreenshot', { format: 'png' });
      await writeFile(`artifacts/archive-${width}-open.png`, Buffer.from(shot.data, 'base64'));
    }
    await key('Escape', 'Escape', 27);
    await pause(400);
    assert(await evaluate('document.activeElement.classList.contains("dossier-cover")'), `${width}: close restores focus`);
    console.log(`PASS ${width}×${height}: viewport, open, five tabs, keyboard, close`);
  }
  await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  assert(await evaluate('getComputedStyle(document.querySelector(".dossier-cover")).transitionDuration === "0s"'), 'Reduced motion disables transitions');
  await key(' ', 'Space', 32);
  await pause(100);
  assert(await evaluate('document.querySelector(".dossier-hero").classList.contains("is-open")'), 'Space opens folder');
  await evaluate('document.querySelector(".dossier-toolbar button").click()');
  await pause(100);
  assert(await evaluate('!document.querySelector(".dossier-hero").classList.contains("is-open")'), 'Close file button closes folder');
  for (const route of ['/about','/privacy','/terms','/safety','/contact','/game','/campaign','/multiplayer','/media']) {
    assert.equal((await fetch(base + route)).status, 200, route);
  }
  assert.deepEqual(errors, [], 'No browser runtime exceptions');
  console.log('PASS reduced motion, Space, close button, all retained/new routes, no runtime exceptions');
} finally {
  socket?.close();
  browser.kill();
}


