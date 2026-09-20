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
  const begin = async () => {
    const start = await api('/api/admin/auth/google', { method: 'POST', headers: { origin: base } });
    assert.equal(start.status, 200);
    const cookie = start.headers.get('set-cookie');
    assert.match(cookie, /HttpOnly/i); assert.match(cookie, /SameSite=lax/i); assert.match(cookie, /Max-Age=600/i);
    const body = await start.json();
    const url = new URL(body.url);
    assert.equal(url.origin, 'https://fixture.supabase.co');
    assert.equal(url.searchParams.get('provider'), 'google');
    assert.equal(url.searchParams.get('code_challenge_method'), 's256');
    assert.equal(url.searchParams.get('redirect_to'), base + '/api/admin/auth/callback');
    assert.equal(body.access_token, undefined);
    return { cookie: cookie.split(';')[0], challenge: url.searchParams.get('code_challenge') };
  };
  const finish = (flow, who = 'admin') => api('/api/admin/auth/callback?code=' + who + '.' + flow.challenge, { headers: { cookie: flow.cookie }, redirect: 'manual' });
  response = await api('/api/admin/auth/google', { method: 'POST', headers: { origin: 'https://foreign.example' } }); assert.equal(response.status, 403);
  response = await api('/api/admin/session', { method: 'POST', headers: { origin: base } }); assert.equal(response.status, 405, 'Password endpoint removed');
  response = await api('/api/admin/auth/callback?code=forged&next=https://foreign.example', { redirect: 'manual' });
  assert.equal(response.headers.get('location'), base + '/admin?auth_error=signin', 'Missing verifier rejected; redirect cannot be changed');
  const wrong = await begin();
  response = await finish({ ...wrong, challenge: 'incorrect' });
  assert.match(response.headers.get('location'), /auth_error=signin/);
  response = await api('/api/admin/auth/callback?error=access_denied&error_description=DO_NOT_REFLECT', { redirect: 'manual' });
  assert.match(response.headers.get('location'), /auth_error=signin/); assert(!response.headers.get('location').includes('DO_NOT_REFLECT'));
  response = await finish(await begin(), 'nonadmin');
  assert.match(response.headers.get('location'), /auth_error=unauthorized/);
  assert(!response.headers.get('set-cookie').includes('fixture-nonadmin'), 'Non-admin never receives session');
  const flow = await begin();
  response = await finish(flow);
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), base + '/admin');
  const cookie = response.headers.getSetCookie().find(c => c.startsWith('__Host-float-admin='));
  assert.match(cookie, /HttpOnly/i); assert.match(cookie, /Secure/i); assert.match(cookie, /SameSite=lax/i);
  assert.match(response.headers.getSetCookie().find(c => c.startsWith('__Host-float-admin-pkce=')), /Max-Age=0/i);
  response = await finish(flow); assert.match(response.headers.get('location'), /auth_error=signin/, 'Consumed code rejected');
  const headers = { cookie: cookie.split(';')[0] };
  response = await api('/api/admin/retention'); assert.equal(response.status, 401);
  response = await api('/api/admin/retention', { headers: { cookie: '__Host-float-admin=fixture-nonadmin' } }); assert.equal(response.status, 403);
  response = await api('/api/admin/retention', { headers }); assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.equal((await response.json()).report.summary.d1.percent, 25);
  response = await api('/api/admin/retention?source=missing', { headers }); assert.equal(response.status, 503);
  response = await api('/api/admin/retention?source=failure', { headers }); assert.equal(response.status, 502);
  response = await api('/api/admin/retention?activityStart=invalid', { headers }); assert.equal(response.status, 400);
  console.log('PASS retention API: authentication, allowlist, aggregates, no-store, setup-required, errors, validation');
  response = await api('/api/admin/engagement'); assert.equal(response.status, 401);
  response = await api('/api/admin/engagement', { headers: { cookie: '__Host-float-admin=fixture-nonadmin' } }); assert.equal(response.status, 403);
  response = await api('/api/admin/engagement', { headers }); assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.equal((await response.json()).report.summary.attempts, 1200);
  response = await api('/api/admin/engagement?creator=missing', { headers }); assert.equal(response.status, 503);
  response = await api('/api/admin/engagement?creator=failure', { headers }); assert.equal(response.status, 502);
  response = await api('/api/admin/engagement?difficulty=easy', { headers }); assert.equal(response.status, 400);
  console.log('PASS engagement API: auth, aggregates, setup/errors, validation and caching');
  response = await api('/api/admin/acquisition?start=2026-01-01&end=2026-01-30&paid=unknown', { headers });
  assert.equal(response.status, 200); assert.equal((await response.json()).report.summary.total, 1201);
  response = await api('/api/admin/acquisition?paid=invalid', { headers }); assert.equal(response.status, 400);
  response = await api('/api/admin/acquisition?creator=failure', { headers }); assert.equal(response.status, 502);
  assert.equal((await response.json()).report, undefined, 'Database failures contain no zero report');
  response = await api('/admin', { headers }); assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control'), /no-store/);
  response = await api('/admin/acquisition', { redirect: 'manual' });
  assert.equal(response.status, 307);
  assert.equal(response.headers.get('location'), '/admin');
  response = await api('/api/admin/session', { method: 'DELETE', headers: { ...headers, origin: 'https://foreign.example' } }); assert.equal(response.status, 403);
  response = await api('/api/admin/session', { method: 'DELETE', headers: { ...headers, origin: base } }); assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie'), /Max-Age=0/i);
  console.log('PASS actual API: unauthenticated/non-admin/forged sessions, valid admin login/report, cookie security, filter validation, failures, caching, CSRF, sign-out');
  console.log('PASS Google PKCE: challenge, verifier binding, cancellation, code replay, callback cookies, allowlist, fixed redirects, password endpoint removed');
  if (process.argv.includes('--browser')) {
    const browserTests = spawn(process.execPath, ['scripts/verify-acquisition.mjs'], { windowsHide: true, stdio: 'inherit', env: { ...process.env, ACQUISITION_TEST_URL: base, FLOAT_TEST_AUTH_FIXTURE: '1' } });
    const exitCode = await new Promise(resolve => browserTests.on('exit', resolve));
    assert.equal(exitCode, 0, 'Browser checks pass');
  }
} finally { server.kill(); }
