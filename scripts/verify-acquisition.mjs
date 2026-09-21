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
      if (url.startsWith('/api/admin/engagement?')) {
        const f = window.fixture; f.engagementCalls = (f.engagementCalls || 0) + 1;
        f.engagementActive = (f.engagementActive || 0) + 1; f.engagementMax = Math.max(f.engagementMax || 0, f.engagementActive);
        const { engagementStatus, engagementDelay, engagementTotal } = f;
        try {
          await new Promise(resolve => setTimeout(resolve, engagementDelay || 0));
          if (engagementStatus) return Response.json({error:'Engagement setup required.'},{status:engagementStatus});
          const response = await originalFetch(input, { ...init, signal: undefined });
          const body = await response.json();
          if (body.report && engagementTotal !== undefined) body.report.summary.attempts = engagementTotal;
          return Response.json(body,{status:response.status});
        } finally { f.engagementActive--; }
      }
      if (url.startsWith('/api/admin/retention?')) {
        const f = window.fixture;
        f.retentionCalls = (f.retentionCalls || 0) + 1;
        f.retentionActive = (f.retentionActive || 0) + 1;
        f.retentionMax = Math.max(f.retentionMax || 0, f.retentionActive);
        const { retentionStatus, retentionDelay, retentionTotal } = f;
        try {
          // Ignore abort deliberately so the client must reject stale generations.
          await new Promise(resolve => setTimeout(resolve, retentionDelay || 0));
          if (retentionStatus) return Response.json({ error: 'Retention setup required.' }, { status: retentionStatus });
          const response = await originalFetch(input, { ...init, signal: undefined });
          const body = await response.json();
          if (body.report && retentionTotal !== undefined) body.report.summary.installs = retentionTotal;
          return Response.json(body, { status: response.status });
        } finally { f.retentionActive--; }
      }
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
  await command('Page.navigate', { url: `${base}/admin` });
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
  assert.equal(await evaluate('document.querySelectorAll("details > summary > span").length'), 7, 'Seven collapsible categories');
  await evaluate('window.fixture.retentionStatus = 503; document.querySelector("#retention > summary").click()');
  await until('document.querySelector("[data-retention-panel]")?.textContent.includes("Retention setup required")');
  assert.equal(await evaluate('document.querySelectorAll("[data-retention-panel] strong").length'), 0, 'Missing backend never shows zeros');
  await evaluate(`window.fixture.retentionStatus = 0; Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Retry retention').click()`);
  await until('document.querySelector("[data-retention-panel]")?.textContent.includes("25% · 25 / 100")');
  assert(await evaluate('document.querySelector("[data-retention-panel]").textContent.includes("Pending")'));
  assert(await evaluate('document.querySelector("[data-retention-panel]").textContent.includes("Unavailable")'));
  await evaluate('window.fixture.retentionDelay = 300; window.fixture.retentionMax = 0; window.fixture.tick(); window.fixture.tick()');
  await until('window.fixture.retentionActive === 0');
  assert.equal(await evaluate('window.fixture.retentionMax'), 1, 'Retention timers do not overlap');
  const retentionCalls = await evaluate('window.fixture.retentionCalls');
  await evaluate('window.fixture.visible = false; window.fixture.tick()');
  assert.equal(await evaluate('window.fixture.retentionCalls'), retentionCalls, 'Hidden retention does not refresh');
  await evaluate('window.fixture.visible = true; window.fixture.retentionTotal = 999; window.fixture.retentionDelay = 800; window.fixture.tick()');
  await until('window.fixture.retentionActive === 1');
  await evaluate(`window.fixture.retentionTotal = 222; window.fixture.retentionDelay = 0; const input = Array.from(document.querySelectorAll('[data-retention-panel] label')).find(l => l.textContent === 'Source').querySelector('input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'new-source'); input.dispatchEvent(new Event('input', { bubbles: true }));`);
  await evaluate('document.querySelector("[data-retention-panel] form").requestSubmit()');
  await until('document.querySelector("[data-retention-panel] strong")?.textContent === "222"');
  await pause(900);
  assert.equal(await evaluate('document.querySelector("[data-retention-panel] strong").textContent'), '222', 'Retention ignores stale filter results');
  for (const width of [320, 390, 1440]) {
    await command('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
    assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Retention responsive without page overflow');
  }
  await evaluate('window.fixture.engagementStatus = 503; document.querySelector("#engagement > summary").click()');
  await until('document.querySelector("[data-engagement-panel]")?.textContent.includes("Engagement setup required")');
  assert.equal(await evaluate('document.querySelectorAll("[data-engagement-panel] strong").length'),0);
  await evaluate(`window.fixture.engagementStatus = 0; Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Retry engagement').click()`);
  await until('document.querySelector("[data-engagement-panel] strong")?.textContent === "1,200"');
  assert(await evaluate('document.querySelector("[data-engagement-panel]").textContent.includes("50% (400 / 800)")'));
  assert(await evaluate('document.querySelector("[data-engagement-panel]").textContent.includes("frog:quick")'));
  await evaluate('window.fixture.engagementDelay = 300; window.fixture.engagementMax = 0; window.fixture.tick(); window.fixture.tick()');
  await until('window.fixture.engagementActive === 0');
  assert.equal(await evaluate('window.fixture.engagementMax'),1);
  const engagementCalls = await evaluate('window.fixture.engagementCalls');
  await evaluate('window.fixture.visible = false; window.fixture.tick()');
  assert.equal(await evaluate('window.fixture.engagementCalls'),engagementCalls);
  await evaluate('window.fixture.visible = true; window.fixture.engagementTotal = 999; window.fixture.engagementDelay = 800; window.fixture.tick()');
  await until('window.fixture.engagementActive === 1');
  await evaluate(`window.fixture.engagementTotal = 222; window.fixture.engagementDelay = 0; const engagementField = Array.from(document.querySelectorAll('[data-engagement-panel] label')).find(l => l.textContent === 'Creator code').querySelector('input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(engagementField,'updated'); engagementField.dispatchEvent(new Event('input',{bubbles:true}));`);
  await evaluate('document.querySelector("[data-engagement-panel] form").requestSubmit()');
  await until('document.querySelector("[data-engagement-panel] strong")?.textContent === "222"');
  await pause(900);
  assert.equal(await evaluate('document.querySelector("[data-engagement-panel] strong").textContent'),'222');
  await evaluate(`window.fixture.engagementStatus=502; Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Refresh engagement').click()`);
  await until('document.querySelector("[data-engagement-panel]")?.textContent.includes("Showing the last successful engagement report")');
  await evaluate(`window.fixture.engagementStatus=0; delete window.fixture.engagementTotal; const emptyField=Array.from(document.querySelectorAll('[data-engagement-panel] label')).find(l=>l.textContent==='Creator code').querySelector('input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(emptyField,'empty'); emptyField.dispatchEvent(new Event('input',{bubbles:true}));`);
  await evaluate('document.querySelector("[data-engagement-panel] form").requestSubmit()');
  await until('document.querySelector("[data-engagement-panel]")?.textContent.includes("No campaign attempts match")');
  assert(await evaluate('document.querySelector("[data-engagement-panel]").textContent.includes("—")'));
  for(const width of [320,390,1440]) {
    await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
    assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'),'Engagement mobile layout');
  }
  await evaluate('document.querySelector("#engagement > summary").click()');
  await until('!document.querySelector("[data-engagement-panel]")');
  console.log('PASS engagement setup, aggregates, empty/error states, visible-only refresh, stale responses and mobile layout');
  await evaluate('document.querySelector("#multiplayer > summary").click()');
  await until('document.querySelector("[data-multiplayer-panel] strong")?.textContent === "1,200"');
  assert(await evaluate('document.querySelector("[data-multiplayer-panel]").textContent.includes("100 ms")'));
  assert(await evaluate('document.querySelector("[data-multiplayer-panel]").textContent.includes("Rematch rate: unavailable")'));
  for(const width of [320,390,1440]) {
    await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
    assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'),'Multiplayer responsive layout');
  }
  await evaluate(`const f=Array.from(document.querySelectorAll('[data-multiplayer-panel] label')).find(l=>l.textContent==='Server region').querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(f,'empty');f.dispatchEvent(new Event('input',{bubbles:true}));`);
  await evaluate('document.querySelector("[data-multiplayer-panel] form").requestSubmit()');
  await until('document.querySelector("[data-multiplayer-panel]")?.textContent.includes("No ranked matches or queue observations")');
  assert(await evaluate('document.querySelector("[data-multiplayer-panel]").textContent.includes("—")'));
  await evaluate('document.querySelector("#multiplayer > summary").click()');
  await until('!document.querySelector("[data-multiplayer-panel]")');
  console.log('PASS multiplayer accordion, totals, RTT, missing metrics, filters, empty state and responsive layout');
  assert(await evaluate('document.body.textContent.includes("Not connected")'));
  await evaluate(`document.querySelector('details > summary').click(); document.querySelector('#retention').scrollIntoView()`);
  const retentionShot = await command('Page.captureScreenshot', { format: 'png' });
  await writeFile('artifacts/admin-retention.png', Buffer.from(retentionShot.data, 'base64'));
  await evaluate('document.querySelector("#retention > summary").click()');
  await until('!document.querySelector("[data-retention-panel]")');
  console.log('PASS seven collapsible categories, retention setup/retry/metrics, pending/unavailable, responsive layout, planned metrics');
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
