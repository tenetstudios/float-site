// Runs the actual production route handlers against an isolated Auth/RPC fixture.
// Requires npm run build. It does not connect to the live Supabase project.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
const base = 'http://localhost:3102';
const server = spawn(process.execPath, ['--import', './scripts/fixtures/acquisition-upstream.mjs', 'node_modules/next/dist/bin/next', 'start', '--port', '3102'], {
  windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, NODE_ENV: 'production', FLOAT_TEST_AUTH_FIXTURE: '1', SUPABASE_URL: 'https://fixture.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'fixture-public', SUPABASE_SECRET_KEY: 'sb_secret_fixture', SUPABASE_SERVICE_ROLE_KEY: '', FLOAT_ADMIN_USER_IDS: '569feb10-610c-4a20-aa02-8279ba0ee0c4' },
});
let output = '';
server.stdout.on('data', chunk => { output += chunk; }); server.stderr.on('data', chunk => { output += chunk; });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
try {
  let ready = false;
  for (let i = 0; i < 100; i++) { if (output.includes('Ready in')) { ready = true; break; } if (server.exitCode !== null) break; await pause(100); }
  assert(ready, `Fixture server starts: ${output}`);
  const api = (path, init = {}) => fetch(base + path, init);
  let response = await api('/api/admin/acquisition');
  assert.equal(response.status, 401, 'Direct unauthenticated API request rejected');
  assert.match(response.headers.get('cache-control'), /no-store/);
  response = await api('/api/admin/acquisition', { headers: { cookie: '__Host-float-admin=fixture-nonadmin' } });
  assert.equal(response.status, 403, 'Direct non-admin API request rejected');
  response = await api('/api/admin/acquisition', { headers: { cookie: '__Host-float-admin=forged-token' } });
  assert.equal(response.status, 401, 'Forged session rejected');
  const login = email => api('/api/admin/session', { method: 'POST', headers: { origin: base, 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'fixture-password' }) });
  response = await login('ordinary@example.test');
  assert.equal(response.status, 403); assert.equal(response.headers.get('set-cookie'), null, 'Non-admin never receives admin session');
  response = await login('admin@example.test');
  assert.equal(response.status, 200);
  const cookie = response.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/i); assert.match(cookie, /Secure/i); assert.match(cookie, /SameSite=strict/i);
  assert.deepEqual(await response.json(), { ok: true }, 'Tokens are not returned in JSON');
  const headers = { cookie: cookie.split(';')[0] };
  response = await api('/api/admin/acquisition?start=2026-01-01&end=2026-01-30&paid=unknown', { headers });
  assert.equal(response.status, 200); assert.equal((await response.json()).report.summary.total, 1201);
  response = await api('/api/admin/acquisition?paid=invalid', { headers }); assert.equal(response.status, 400);
  response = await api('/api/admin/acquisition?creator=failure', { headers }); assert.equal(response.status, 502);
  assert.equal((await response.json()).report, undefined, 'Database failures contain no zero report');
  response = await api('/admin/acquisition', { headers }); assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control'), /no-store/);
  response = await api('/api/admin/session', { method: 'DELETE', headers: { ...headers, origin: 'https://foreign.example' } }); assert.equal(response.status, 403);
  response = await api('/api/admin/session', { method: 'DELETE', headers: { ...headers, origin: base } }); assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie'), /Max-Age=0/i);
  console.log('PASS actual API: unauthenticated/non-admin/forged sessions, valid admin login/report, cookie security, filter validation, failures, caching, CSRF, sign-out');
} finally { server.kill(); }
