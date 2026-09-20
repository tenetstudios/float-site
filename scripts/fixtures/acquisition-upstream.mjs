// Explicit opt-in, subprocess-only upstream fixture. Never loaded by application code.
import { createHash } from 'node:crypto';
if (process.env.FLOAT_TEST_AUTH_FIXTURE !== '1') throw new Error('Test fixture requires explicit opt-in');
const originalFetch = globalThis.fetch;
const usedCodes = new Set();
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url || input.toString());
  if (url.hostname !== 'fixture.supabase.co') return originalFetch(input, init);
  const headers = new Headers(init.headers);
  if (url.pathname === '/auth/v1/token') {
    const body = JSON.parse(init.body);
    const challenge = createHash('sha256').update(body.code_verifier || '').digest('base64url');
    if (url.searchParams.get('grant_type') !== 'pkce' || !['admin.' + challenge, 'nonadmin.' + challenge].includes(body.auth_code) || usedCodes.has(body.auth_code)) return Response.json({ error: 'invalid' }, { status: 400 });
    usedCodes.add(body.auth_code);
    return Response.json({ access_token: body.auth_code.startsWith('admin.') ? 'fixture-admin' : 'fixture-nonadmin', expires_in: 3600 });
  }
  if (url.pathname === '/auth/v1/user') {
    if (headers.get('authorization') === 'Bearer fixture-admin') return Response.json({ id: '569feb10-610c-4a20-aa02-8279ba0ee0c4' });
    if (headers.get('authorization') === 'Bearer fixture-nonadmin') return Response.json({ id: '00000000-0000-0000-0000-000000000001' });
    return Response.json({ error: 'invalid' }, { status: 401 });
  }
  if (url.pathname === '/auth/v1/logout') return new Response(null, { status: 204 });
  if (url.pathname === '/rest/v1/rpc/float_retention_report') {
    if (headers.get('apikey') !== 'sb_secret_fixture') return new Response(null, { status: 403 });
    const args = JSON.parse(init.body);
    if (args.p_source === 'missing') return Response.json({ code: 'PGRST202' }, { status: 404 });
    if (args.p_source === 'failure') return Response.json({ code: 'XX000' }, { status: 500 });
    const rate = { eligible: 100, retained: 25, pending: 1, unavailable: 2, percent: 25 };
    const summary = { installs: 103, tracked: 101, firstSeen: '2026-01-01T00:00:00Z', lastSeen: '2026-02-15T12:00:00Z', activeDays: 202, averageActiveDays: 2, averageSessions: 1, d1: rate, d7: rate, d30: { eligible: 0, retained: 0, pending: 103, unavailable: 0, percent: null } };
    return Response.json({ asOf: '2026-02-15', summary, activity: { activeDays: 200, sessionStarts: 100, sessionsPerActiveDay: 0.5 }, daily: [{ day: '2026-02-14', activeDays: 100, sessionStarts: 50, sessionsPerActiveDay: 0.5 }], cohorts: [{ values: ['2026-01-01'], metrics: summary }], inactivity: [{ label: 'Unavailable', installs: 2 }], breakdowns: { country: [], campaign: [], creator: [], source: [], platform: [], creatorCampaign: [] } });
  }
  if (url.pathname === '/rest/v1/rpc/float_acquisition_report') {
    if (headers.get('apikey') !== 'sb_secret_fixture') return new Response(null, { status: 403 });
    const args = JSON.parse(init.body);
    if (args.p_creator === 'failure') return new Response(null, { status: 500 });
    return Response.json({ summary: { total: 1201, paid: 401, organic: 400, unknown: 400 }, daily: [], countries: [], campaigns: [], creators: [], sources: [], platforms: [], campaignCountries: [], creatorReport: [] });
  }
  throw new Error('Unexpected fixture upstream URL');
};
