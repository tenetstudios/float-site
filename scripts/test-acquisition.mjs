import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dateRange, parseFilters, rpcArgs } from '../lib/acquisition.ts';
import { authUser, config, getReport } from '../lib/acquisition-backend.ts';

const admin = '569feb10-610c-4a20-aa02-8279ba0ee0c4';
const cfg = { url: 'https://fixture.supabase.co', publicKey: 'fixture-public', secret: 'sb_secret_fixture', admins: [admin] };
test('calendar presets include today in UTC across month/year/leap boundaries', () => {
  assert.equal(dateRange(30, new Date('2026-01-01T00:00:00Z')).start, '2025-12-03');
  assert.equal(dateRange(7, new Date('2024-03-01T23:59:59Z')).start, '2024-02-24');
});
test('filters reject impossible dates, oversized ranges, duplicates, unknown keys and invalid paid status', () => {
  for (const query of ['start=2026-02-30', 'start=2026-02-02&end=2026-02-01', 'start=2024-01-01&end=2026-01-01', 'paid=no', 'paid=paid&paid=unknown', 'secret=yes', 'country=Canada', `creator=${'x'.repeat(201)}`]) assert.throws(() => parseFilters(new URLSearchParams(query)), { status: 400 });
});
test('all filters are parameterized and paid NULL remains a distinct status', () => {
  const args = rpcArgs(parseFilters(new URLSearchParams({ start: '2026-01-01', end: '2026-01-30', campaign: "a' OR 1=1--", creator: 'Creator', country: 'ca', platform: 'ios', paid: 'unknown' })));
  assert.deepEqual(args, { p_start: '2026-01-01', p_end: '2026-01-30', p_campaign: "a' OR 1=1--", p_creator: 'Creator', p_country: 'CA', p_platform: 'ios', p_paid: 'unknown' });
});
test('configuration fails closed for missing credentials or allowlist', () => {
  assert.throws(() => config({}), { status: 503 });
  assert.throws(() => config({ SUPABASE_URL: cfg.url, SUPABASE_PUBLISHABLE_KEY: cfg.publicKey, SUPABASE_SECRET_KEY: cfg.secret, FLOAT_ADMIN_USER_IDS: '' }), { status: 503 });
});
test('unauthenticated requests never reach the database', async () => {
  await assert.rejects(getReport(undefined, dateRange(30), cfg, () => { throw new Error('No fetch allowed'); }), { status: 401 });
});
test('non-admin verified accounts cannot call reporting RPC', async () => {
  let calls = 0;
  await assert.rejects(getReport('user-token', dateRange(30), cfg, async url => {
    calls++; assert(url.endsWith('/auth/v1/user')); return Response.json({ id: 'ordinary-user' });
  }), { status: 403 });
  assert.equal(calls, 1);
});
test('valid admin is reverified before every report; secret never authenticates user', async () => {
  const calls = [];
  const report = { summary: { total: 1201, paid: 401, organic: 400, unknown: 400 } };
  const fetcher = async (url, init) => {
    calls.push(url);
    assert.equal(init.cache, 'no-store');
    if (url.endsWith('/auth/v1/user')) { assert.equal(init.headers.apikey, cfg.publicKey); assert.equal(init.headers.Authorization, 'Bearer user-token'); return Response.json({ id: admin }); }
    assert.equal(init.headers.apikey, cfg.secret);
    assert.equal(init.headers.Authorization, undefined);
    assert.equal(JSON.parse(init.body).p_paid, 'all');
    return Response.json(report);
  };
  assert.deepEqual(await getReport('user-token', dateRange(30), cfg, fetcher), report);
  await getReport('user-token', dateRange(30), cfg, fetcher);
  assert.equal(calls.filter(url => url.endsWith('/auth/v1/user')).length, 2);
});
test('invalid sessions and backend outages do not become zero reports', async () => {
  await assert.rejects(authUser('expired', cfg, async () => new Response('', { status: 401 })), { status: 401 });
  await assert.rejects(authUser('token', cfg, async () => new Response('', { status: 500 })), { status: 502 });
  await assert.rejects(getReport('token', dateRange(30), cfg, async url => url.endsWith('/auth/v1/user') ? Response.json({ id: admin }) : new Response('', { status: 500 })), { status: 502 });
});
test('legacy service-role JWT is sent only to the RPC', async () => {
  await getReport('token', dateRange(7), { ...cfg, secret: 'legacy-jwt' }, async (url, init) => {
    if (url.endsWith('/auth/v1/user')) return Response.json({ id: admin });
    assert.equal(init.headers.Authorization, 'Bearer legacy-jwt'); return Response.json({});
  });
});
