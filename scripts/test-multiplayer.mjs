import test from 'node:test';import assert from 'node:assert/strict';
import {defaultMultiplayerFilters,parseMultiplayerFilters,multiplayerArgs} from '../lib/multiplayer.ts';
import {getMultiplayerReport} from '../lib/multiplayer-backend.ts';
const cfg={url:'https://fixture.supabase.co',publicKey:'public',secret:'sb_secret_fixture',admins:['admin']};
test('validates and parameterizes ranked reporting filters',()=>{
 for(const q of ['start=2026-02-30','region=a&region=b','platform=invalid','appVersion='+ 'x'.repeat(101),'start=2020-01-01&end=2026-01-01'])assert.throws(()=>parseMultiplayerFilters(new URLSearchParams(q)),{status:400});
 const a=multiplayerArgs(parseMultiplayerFilters(new URLSearchParams({country:'ca',region:"x' OR true--"})));assert.equal(a.p_country,'CA');assert.equal(a.p_region,"x' OR true--");
});
test('denies unauthenticated and non-admin users before reporting RPC',async()=>{
 await assert.rejects(getMultiplayerReport(undefined,defaultMultiplayerFilters(),cfg,()=>{throw Error('network');}),{status:401});
 await assert.rejects(getMultiplayerReport('token',defaultMultiplayerFilters(),cfg,async url=>{assert(url.endsWith('/auth/v1/user'));return Response.json({id:'other'});}),{status:403});
});
test('authorized request is server-only, parameterized and not cached; errors are sanitized',async()=>{
 for(const [code,status]of [['PGRST202',503],['42P01',503],['XX000',502]])await assert.rejects(getMultiplayerReport('token',defaultMultiplayerFilters(),cfg,async(url,init)=>{
  if(url.endsWith('/auth/v1/user'))return Response.json({id:'admin'});
  assert.equal(init.headers.apikey,cfg.secret);assert.equal(init.cache,'no-store');
  return Response.json({code,message:'private details'},{status:400});
 }),e=>e.status===status&&!e.message.includes('private'));
 const result=await getMultiplayerReport('token',defaultMultiplayerFilters(),cfg,async url=>Response.json(url.endsWith('/auth/v1/user')?{id:'admin'}:{matches:{total:1200}}));assert.equal(result.matches.total,1200);
});
