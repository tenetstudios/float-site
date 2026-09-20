// Local browser verification with synthetic API responses. No production data access.
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const base = process.env.ACQUISITION_TEST_URL || 'http://localhost:3100';
assert.equal(process.env.FLOAT_TEST_AUTH_FIXTURE, '1', 'Run npm run test:acquisition:api -- --browser to use an isolated Auth fixture');
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Browser fixture tests must use a local website');
const profile = await mkdtemp(join(tmpdir(), 'float-acquisition-test-'));
const browser = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--disable-gpu-sandbox', '--no-sandbox', '--no-first-run', '--remote-debugging-port=9341', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
try {
  let version;
  for (let i = 0; i < 60; i++) { try { version = await fetch('http://localhost:9341/json/version').then(r => r.json()); break; } catch { await pause(100); } }
  assert(version, 'Chrome starts');
  socket = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
  let sequence = 0;
  const pending = new Map();
  const errors = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (!message.id) return;
    const handler = pending.get(message.id); pending.delete(message.id);
    if (message.error) handler.reject(new Error(JSON.stringify(message.error))); else handler.resolve(message.result);
  });
  function send(method, params = {}, sessionId) { const id = ++sequence; return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params, sessionId })); }); }
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const command = (method, params) => send(method, params, sessionId);
  const evaluate = async expression => {
    const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const until = async expression => { for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await pause(100); } throw new Error(`Timed out: ${expression}\n${await evaluate('document.body.innerText.slice(0, 2500)')}`); };
  await command('Runtime.enable'); await command('Page.enable');
  await command('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.fixture = { status: 200, total: 1201, delay: 0, calls: 0, active: 0, maxActive: 0, visible: true, tick: null };
    Object.defineProperty(document, 'visibilityState', { get: () => window.fixture.visible ? 'visible' : 'hidden' });
    const originalInterval = window.setInterval;
    window.setInterval = (fn, delay, ...args) => { if (delay === 60000) window.fixture.tick = fn; return originalInterval(fn, delay, ...args); };
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const url = String(input);
      if (url === '/api/admin/auth/google') {
        const response = await originalFetch(input, init);
        if (!response.ok) return response;
        const authorize = new URL((await response.json()).url);
        return Response.json({ url: location.origin + '/api/admin/auth/callback?code=admin.' + authorize.searchParams.get('code_challenge') });
      }
      if (!url.startsWith('/api/admin/acquisition?')) return originalFetch(input, init);
      const f = window.fixture; f.calls++; f.active++; f.maxActive = Math.max(f.maxActive, f.active);
      const { status, total, delay } = f;
      const params = new URL(url, location.origin).searchParams;
      await new Promise(resolve => setTimeout(resolve, delay));
      f.active--;
      if (status !== 200) return Response.json({ error: status === 403 ? 'This account is not authorized.' : 'Synthetic report failure' }, { status });
      const group = (values) => total ? [{ values, installs: total }] : [];
      return Response.json({ updatedAt: new Date().toISOString(), report: {
        summary: { total, paid: total ? 401 : 0, organic: total ? 400 : 0, unknown: total ? 400 : 0 },
        daily: [{ day: params.get('start'), installs: total }, { day: params.get('end'), installs: 0 }],
        countries: group(['CA']), campaigns: group(['fixture-campaign', 'Synthetic campaign']), creators: group(['creator']),
        sources: group(['source', null]), platforms: group(['ios', '1.0']), campaignCountries: group(['fixture-campaign', 'Synthetic campaign', 'CA']),
        creatorReport: group(['creator', 'Synthetic campaign', 'CA', 'source'])
      }});
    };
  ` });
  await command('Page.navigate', { url: `${base}/admin/acquisition` });
  await until('document.body?.textContent.includes("Sign in with Google")');
  await pause(1500); // Allow the server-rendered sign-in form to hydrate.
  assert.equal(await evaluate('document.querySelectorAll("input[type=password]").length'), 0);
  await evaluate(`Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Sign in with Google').click()`);
  await until('document.querySelector("strong")?.textContent === "1,201"');
  assert.equal(await evaluate(`document.querySelectorAll('section[aria-label="Install summary"] strong').length`), 4);
  assert(await evaluate('document.body.textContent.includes("Unknown paid status")'), 'NULL status visible');
  assert(await evaluate('document.body.textContent.includes("device-locale estimates")'), 'Country caveat visible');
  await mkdir('artifacts', { recursive: true });
  for (const width of [320, 390, 768, 1440]) {
    await command('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false }); await pause(100);
    assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'), `${width}px no document overflow`);
    if ([390, 1440].includes(width)) { const shot = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); await writeFile(`artifacts/acquisition-${width}.png`, Buffer.from(shot.data, 'base64')); }
  }
  console.log('PASS sign-in UI, summary, reporting caveats, mobile/desktop layout');
  const clickRefresh = `Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Refresh now').click()`;
  await evaluate(`window.fixture.status = 502; ${clickRefresh}`);
  await until('document.body.textContent.includes("Showing the last successful report")');
  assert.equal(await evaluate('document.querySelector("strong").textContent'), '1,201', 'Failure does not fabricate zeros');
  await evaluate(`window.fixture.status = 200; window.fixture.total = 0; ${clickRefresh}`);
  await until('document.body.textContent.includes("No installations match this period")');
  assert.equal(await evaluate('document.querySelector("strong").textContent'), '0');
  console.log('PASS retry, retained stale data on failure, empty state');
  await evaluate('window.fixture.total = 1201; window.fixture.delay = 300; window.fixture.maxActive = 0; window.fixture.tick(); window.fixture.tick()');
  await until('document.querySelector("strong")?.textContent === "1,201"');
  assert.equal(await evaluate('window.fixture.maxActive'), 1, 'Scheduled refreshes cannot overlap');
  const calls = await evaluate('window.fixture.calls');
  await evaluate('window.fixture.visible = false; window.fixture.tick()');
  assert.equal(await evaluate('window.fixture.calls'), calls, 'Hidden page does not refresh');
  await evaluate('window.fixture.visible = true; document.dispatchEvent(new Event("visibilitychange"))');
  await until('window.fixture.active === 0');
  assert.equal(await evaluate('window.fixture.calls'), calls + 1, 'Tab visibility refreshes');
  // The fixture intentionally ignores abort to verify the stale-response generation guard.
  await evaluate(`window.fixture.total = 999; window.fixture.delay = 800; ${clickRefresh}`);
  await until('window.fixture.active === 1');
  await evaluate(`window.fixture.total = 222; window.fixture.delay = 0; const field = Array.from(document.querySelectorAll('input')).find(e => e.placeholder === 'All creators'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(field, 'new-creator'); field.dispatchEvent(new Event('input', { bubbles: true }));`);
  await evaluate('document.querySelector("form").requestSubmit()');
  await until('document.querySelector("strong")?.textContent === "222"');
  await pause(900);
  assert.equal(await evaluate('document.querySelector("strong").textContent'), '222', 'Older filters never overwrite newer results');
  console.log('PASS visible-only timer, no overlapping refreshes, stale-response protection');
  await evaluate(`window.fixture.status = 403; ${clickRefresh}`);
  await until('document.body?.textContent.includes("Sign in with Google")');
  assert.equal(await evaluate('document.querySelectorAll("strong").length'), 0, 'Unauthorized session clears report data');
  assert(await evaluate('document.body.textContent.includes("not authorized")'));
  assert.deepEqual(errors, [], 'No browser runtime errors');
  const response = await fetch(`${base}/api/admin/acquisition`);
  assert([401, 503].includes(response.status), 'Actual direct API rejects unauthenticated or unconfigured access');
  assert.match(response.headers.get('cache-control'), /no-store/);
  const csrf = await fetch(`${base}/api/admin/auth/google`, { method: 'POST', headers: { Origin: 'https://untrusted.example' } });
  assert.equal(csrf.status, 403, 'Actual session endpoint rejects foreign origins');
  console.log('PASS unauthorized UI, direct API rejection, private cache headers, same-origin checks');
} finally { socket?.close(); browser.kill(); }
