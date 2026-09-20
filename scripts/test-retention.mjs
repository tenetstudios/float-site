import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultRetentionFilters, parseRetentionFilters, retentionArgs } from '../lib/retention.ts';
import { getRetentionReport } from '../lib/retention-backend.ts';
const admin = '569feb10-610c-4a20-aa02-8279ba0ee0c4';
const cfg = { url: 'https://fixture.supabase.co', publicKey: 'fixture-public', secret: 'sb_secret_fixture', admins: [admin] };
test('retention validates both independent date ranges and all parameters', () => {
  for (const query of ['activityStart=2026-02-30', 'activityStart=2020-01-01&activityEnd=2026-01-01', 'start=2026-01-02&end=2026-01-01', 'source=a&source=b', 'paid=all', 'toString=bad', `source=${'a'.repeat(201)}`]) assert.throws(() => parseRetentionFilters(new URLSearchParams(query)), { status: 400 });
  const f = parseRetentionFilters(new URLSearchParams({ country: 'ca', source: "x' OR true--" }));
  assert.equal(retentionArgs(f).p_country, 'CA');
  assert.equal(retentionArgs(f).p_source, "x' OR true--");
});
test('retention authenticates before calling database and rejects non-admins', async () => {
  await assert.rejects(getRetentionReport(undefined, defaultRetentionFilters(), cfg, () => { throw new Error('No network expected'); }), { status: 401 });
  await assert.rejects(getRetentionReport('token', defaultRetentionFilters(), cfg, async url => {
    assert(url.endsWith('/auth/v1/user')); return Response.json({ id: 'not-admin' });
  }), { status: 403 });
});
test('missing backend is setup-required; database failures are never empty reports', async () => {
  const upstream = (status, body) => async url => url.endsWith('/auth/v1/user') ? Response.json({ id: admin }) : Response.json(body, { status });
  await assert.rejects(getRetentionReport('token', defaultRetentionFilters(), cfg, upstream(404, { code: 'PGRST202' })), { status: 503 });
  await assert.rejects(getRetentionReport('token', defaultRetentionFilters(), cfg, upstream(400, { code: '42P01' })), { status: 503 });
  await assert.rejects(getRetentionReport('token', defaultRetentionFilters(), cfg, upstream(500, { message: 'private detail' })), { status: 502, message: 'Retention reporting is unavailable. Please retry.' });
});
