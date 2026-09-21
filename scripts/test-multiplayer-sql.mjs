import {readFile} from 'node:fs/promises';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';
const root=resolve(process.env.FLOAT_APP_ROOT||'../float-app');
const {PGlite}=await import(pathToFileURL(resolve(root,'.cache/retention-sql/node_modules/@electric-sql/pglite/dist/index.js')).href);
const db=new PGlite();
try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;
 create function auth.jwt() returns jsonb language sql stable as $$select '{}'::jsonb$$;`);
 for(const name of ['001_player_profiles.sql','002_unique_usernames.sql','003_ranked_elo.sql','004_forfeit_penalties.sql','021_multiplayer_analytics.sql'])await db.exec(await readFile(resolve(root,'supabase/manual',name),'utf8'));
 for(const name of ['multiplayer-reporting.sql','multiplayer-reporting.sql','multiplayer-reporting.verify.sql']){await db.exec(await readFile(new URL('../sql/'+name,import.meta.url),'utf8'));console.log('PASS',name);}
 for(const role of ['anon','authenticated']){await db.exec('set role '+role);let denied=false;try{await db.query('select public.float_multiplayer_report(current_date,current_date)');}catch(e){denied=e.code==='42501';}await db.exec('reset role');if(!denied)throw Error('Reporting access not denied');}
 await db.exec('set role service_role');await db.query('select public.float_multiplayer_report(current_date,current_date)');console.log('PASS reporting execution permissions');
}finally{await db.close();}
