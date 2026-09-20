// Runs real PostgreSQL locally using the optional runtime already used by float-app.
// No network, production credentials, or source-record changes.
import { readFile, access } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const mobileRoot = resolve(process.env.FLOAT_APP_ROOT || '../float-app');
const runtime = resolve(process.env.PGLITE_MODULE || `${mobileRoot}/.cache/retention-sql/node_modules/@electric-sql/pglite/dist/index.js`);
await access(runtime).catch(() => { throw new Error('Local PostgreSQL test runtime missing. See docs/retention.md; no SQL was tested.'); });
const { PGlite } = await import(pathToFileURL(runtime).href);
const db = new PGlite();
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    grant usage on schema auth to anon,authenticated,service_role;`);
  for (const name of ['016_player_acquisition.sql', '017_player_retention.sql', 'verify_player_retention.sql']) {
    await db.exec(await readFile(resolve(mobileRoot, 'supabase/manual', name), 'utf8'));
    console.log('PASS mobile dependency', name);
  }
  for (const name of ['acquisition-reporting.sql', 'acquisition-reporting.verify.sql', 'retention-reporting.sql', 'retention-reporting.sql', 'retention-reporting.verify.sql']) {
    try { await db.exec(await readFile(new URL('../sql/' + name, import.meta.url), 'utf8')); }
    catch (error) { throw new Error(`${name}: ${error.message}`, { cause: error }); }
    console.log('PASS website SQL', name);
  }
  for (const role of ['anon', 'authenticated']) {
    await db.exec(`set role ${role}`);
    let denied = false;
    try { await db.query("select public.float_retention_report(current_date,current_date,current_date,current_date)"); }
    catch (error) { denied = error.code === '42501'; }
    await db.exec('reset role');
    if (!denied) throw new Error(`${role} was not denied`);
  }
  await db.exec('set role service_role');
  await db.query('select public.float_retention_report(current_date,current_date,current_date,current_date)');
  console.log('PASS actual RPC execution permissions');
} finally { await db.close(); }
