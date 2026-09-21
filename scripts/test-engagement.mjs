import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultEngagementFilters, parseEngagementFilters, engagementArgs, formatEngagementDuration } from '../lib/engagement.ts';
import { getEngagementReport } from '../lib/engagement-backend.ts';
import { missionLabel } from '../lib/engagement-missions.ts';
test('mission labels preserve IDs and fall back for unknown versions', () => {
 assert.equal(missionLabel('chapter-1-1','campaign-v1'),'balloons (chapter-1-1)');
 assert.equal(missionLabel('chapter-1-1','future-version'),'chapter-1-1');
 assert.equal(missionLabel('unknown','campaign-v1'),'unknown');
});
const cfg = { url: 'https://fixture.supabase.co', publicKey: 'public', secret: 'sb_secret_fixture', admins: ['admin'] };
test('validates dates, dimensions and duplicates; parameterizes exact matches', () => {
 for (const query of ['start=2026-02-30','difficulty=easy','appVersion='+ 'a'.repeat(201),'creator=x&creator=y','toString=x','start=2020-01-01&end=2026-01-01']) assert.throws(() => parseEngagementFilters(new URLSearchParams(query)), { status: 400 });
 const args = engagementArgs(parseEngagementFilters(new URLSearchParams({ country: 'ca', campaign: "x' OR true--", appVersion: '2.0' })));
 assert.equal(args.p_country,'CA'); assert.equal(args.p_campaign,"x' OR true--"); assert.equal(args.p_app_version,'2.0');
});
test('denies unauthenticated/non-admin access before RPC', async () => {
 await assert.rejects(getEngagementReport(undefined,defaultEngagementFilters(),cfg,()=>{ throw new Error('No network'); }),{status:401});
 await assert.rejects(getEngagementReport('token',defaultEngagementFilters(),cfg,async url=>{ assert(url.endsWith('/auth/v1/user')); return Response.json({id:'other'}); }),{status:403});
});
test('distinguishes missing reporting from errors, without leaking database messages', async () => {
 for (const [code,expected] of [['PGRST202',503],['42P01',503],['XX000',502]]) {
 await assert.rejects(getEngagementReport('token',defaultEngagementFilters(),cfg,async (url,init)=>{
 if(url.endsWith('/auth/v1/user')) return Response.json({id:'admin'});
 assert.equal(init.headers.apikey,cfg.secret); assert.equal(init.cache,'no-store');
 return Response.json({code,message:'private database details'},{status:400});
 }),{status:expected});
 }
});

test('duration displays RPC seconds as minutes/seconds without treating missing samples as zero', () => {
 assert.equal(formatEngagementDuration(null), '\u2014');
 assert.equal(formatEngagementDuration(0), '0m 00s');
 assert.equal(formatEngagementDuration(60), '1m 00s');
 assert.equal(formatEngagementDuration(125.4), '2m 05s');
 assert.equal(formatEngagementDuration(59.99), '1m 00s');
 assert.equal(formatEngagementDuration(3600), '60m 00s');
 assert.equal(formatEngagementDuration(NaN), '\u2014');
});
