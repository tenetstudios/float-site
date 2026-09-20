// Explicit opt-in, subprocess-only upstream fixture. Never loaded by application code.
if (process.env.FLOAT_TEST_AUTH_FIXTURE !== '1') throw new Error('Test fixture requires explicit opt-in');
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url || input.toString());
  if (url.hostname !== 'fixture.supabase.co') return originalFetch(input, init);
  const headers = new Headers(init.headers);
  if (url.pathname === '/auth/v1/token') {
    const body = JSON.parse(init.body);
    if (body.password !== 'fixture-password') return Response.json({ error: 'invalid' }, { status: 400 });
    return Response.json({ access_token: body.email === 'admin@example.test' ? 'fixture-admin' : 'fixture-nonadmin', expires_in: 3600 });
  }
  if (url.pathname === '/auth/v1/user') {
    if (headers.get('authorization') === 'Bearer fixture-admin') return Response.json({ id: '569feb10-610c-4a20-aa02-8279ba0ee0c4' });
    if (headers.get('authorization') === 'Bearer fixture-nonadmin') return Response.json({ id: '00000000-0000-0000-0000-000000000001' });
    return Response.json({ error: 'invalid' }, { status: 401 });
  }
  if (url.pathname === '/auth/v1/logout') return new Response(null, { status: 204 });
  if (url.pathname === '/rest/v1/rpc/float_acquisition_report') {
    if (headers.get('apikey') !== 'sb_secret_fixture') return new Response(null, { status: 403 });
    const args = JSON.parse(init.body);
    if (args.p_creator === 'failure') return new Response(null, { status: 500 });
    return Response.json({ summary: { total: 1201, paid: 401, organic: 400, unknown: 400 }, daily: [], countries: [], campaigns: [], creators: [], sources: [], platforms: [], campaignCountries: [], creatorReport: [] });
  }
  throw new Error('Unexpected fixture upstream URL');
};
