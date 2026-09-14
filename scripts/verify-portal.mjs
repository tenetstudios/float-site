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
  await mkdir('artifacts', { recursive: true });
  await command('Page.navigate', { url: base });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await evaluate('document.querySelectorAll(".mode-door").length === 3')) break;
    await pause(100);
  }
  for (const [width, height] of [[320,700],[390,844],[768,1024],[1024,768],[1440,900],[1920,1080]]) {
    await command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await pause(200);
    assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'), `${width}: no horizontal overflow`);
    assert(await evaluate('![...document.querySelectorAll("h1,h2,h3,nav")].some(e => /field reports/i.test(e.textContent))'), 'No promoted field reports');
    const boxes = await evaluate('[...document.querySelectorAll(".mode-door")].map(e => { const r = e.getBoundingClientRect(); return { x:r.x, y:r.y, width:r.width, height:r.height }; })');
    assert(boxes.every(b => b.height > 550), `${width}: substantial posters`);
    if (width <= 700) assert(boxes[1].y > boxes[0].y && boxes[2].y > boxes[1].y, 'Mobile posters stack');
    else assert(boxes.every(b => b.y === boxes[0].y), 'Desktop posters align');
    assert(await evaluate('Math.abs(document.querySelector(".portal-screen").clientWidth / document.querySelector(".portal-screen").clientHeight - 16/9) < .03'), '16:9 cinematic');
    for (const slug of ['campaign', 'multiplayer', 'sandbox']) {
      await evaluate(`document.querySelector('.mode-${slug}').focus()`);
      assert(await evaluate(`document.activeElement.getAttribute('href') === '/${slug}'`), 'Card can receive keyboard focus');
    }
    if (width === 390 || width === 1440) {
      await evaluate('document.activeElement.blur(); document.querySelectorAll("img" ).forEach(i => i.loading = "eager" ); window.scrollTo({top:0, behavior:"instant"})');
      await pause(1000);
      const shot = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
      await writeFile(`artifacts/portal-${width}.png`, Buffer.from(shot.data, 'base64'));
    }
    console.log(`PASS ${width}: layout, poster size, focus, cinematic`);
  }
  await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  assert(await evaluate('getComputedStyle(document.querySelector(".mode-art img")).transitionDuration === "0s"'), 'Reduced motion');
  await evaluate('document.querySelector(".mode-sandbox").focus()');
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', windowsVirtualKeyCode: 13 });
  await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  for (let attempt = 0; attempt < 50; attempt++) {
    if (await evaluate('location.pathname === "/sandbox"')) break;
    await pause(100);
  }
  assert(await evaluate('location.pathname === "/sandbox"'), 'Enter navigates to Sandbox');
  for (const route of ['/','/game','/campaign','/multiplayer','/sandbox','/media','/privacy','/terms','/contact','/intelligence']) {
    assert.equal((await fetch(base + route)).status, 200, route);
  }
  assert.deepEqual(errors, [], 'No browser runtime exceptions');
  console.log('PASS reduced motion, Enter navigation, required routes, no runtime exceptions');
} finally {
  socket?.close();
  browser.kill();
}
