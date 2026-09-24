-- Run after engagement-reporting.sql. Temporary fixtures only; always rolls back.
begin;
create temporary table engagement_attempts (like public.player_gameplay_attempts including defaults);
create temporary table engagement_placements (like public.player_gameplay_placements including defaults);
create temporary table engagement_acquisition (install_id text,country_code text,platform text,campaign_id text,campaign_name text,creator_code text,app_version text);
insert into engagement_acquisition values ('fixture-install','CA','ios','campaign-id','Marketing campaign','creator','old-acquisition-version');
insert into engagement_attempts(attempt_id,install_id,mode,mission_id,content_version,difficulty,app_version,started_at,ended_at,outcome,restart_reason,active_gameplay_ms,duration_complete)
select md5(i::text)::uuid,'fixture-install','campaign','mission-id','v1','standard','gameplay-version',
 '2026-01-01 00:00:00+00'::timestamptz,
 case when i%6<4 then '2026-01-01 00:05:00+00'::timestamptz else null end,
 case i%6 when 0 then 'completed' when 1 then 'completed' when 2 then 'failed' when 3 then 'abandoned' when 4 then 'unknown' else 'in_progress' end,
 case i%3 when 0 then 'retry' when 1 then 'restart' else 'replay' end,
 case i%6 when 0 then 60000 when 1 then null else 999999 end,true
from generate_series(1,1200) i;
-- A placement after the attempt-date window still belongs to the selected attempt.
insert into engagement_placements(event_id,attempt_id,placed_at,unit_type,phase)
select gen_random_uuid(),attempt_id,'2026-01-02 00:00:00+00','wall','preparing' from engagement_attempts;
insert into engagement_placements(event_id,attempt_id,placed_at,unit_type,phase)
select gen_random_uuid(),attempt_id,'2026-01-01 00:00:01+00','frog:quick','running' from engagement_attempts;
insert into engagement_attempts(attempt_id,install_id,mission_id,content_version,difficulty,app_version,started_at,outcome)
values (gen_random_uuid(),'fixture-install','outside','v1','hard','other','2025-12-31 23:59:59.999+00','unknown'),
 (gen_random_uuid(),'fixture-install','outside','v1','hard','other','2026-01-02 00:00:00+00','unknown');
do $verify$
declare definition text; r jsonb;
begin
 if has_function_privilege('anon','public.float_engagement_report(date,date,text,text,text,text,text,text)','EXECUTE')
 or has_function_privilege('authenticated','public.float_engagement_report(date,date,text,text,text,text,text,text)','EXECUTE')
 or not has_function_privilege('service_role','public.float_engagement_report(date,date,text,text,text,text,text,text)','EXECUTE') then raise exception 'FAIL privileges'; end if;
 if (select prosecdef from pg_proc where oid='public.float_engagement_report(date,date,text,text,text,text,text,text)'::regprocedure) then raise exception 'FAIL security invoker'; end if;
 definition := pg_get_functiondef('public.float_engagement_report(date,date,text,text,text,text,text,text)'::regprocedure);
 definition := replace(definition,'public.float_engagement_report','pg_temp.fixture_engagement_report');
 definition := replace(definition,'public.player_gameplay_attempts','pg_temp.engagement_attempts');
 definition := replace(definition,'public.player_gameplay_placements','pg_temp.engagement_placements');
 definition := replace(definition,'public.player_acquisition','pg_temp.engagement_acquisition');
 execute definition;
 perform set_config('TimeZone','America/Toronto',true);
 r := pg_temp.fixture_engagement_report('2026-01-01','2026-01-01');
 if (r#>>'{summary,attempts}')::int is distinct from 1200 or (r#>>'{summary,installations}')::int is distinct from 1 then raise exception 'FAIL totals / distinct installs / UTC'; end if;
 if (r#>>'{summary,completionRate}')::numeric is distinct from 50 or (r#>>'{summary,decided}')::int is distinct from 800 then raise exception 'FAIL abandoned denominator'; end if;
 if (r#>>'{summary,unknown}')::int is distinct from 200 or (r#>>'{summary,inProgress}')::int is distinct from 200 then raise exception 'FAIL unresolved outcomes'; end if;
 if (r#>>'{summary,averageActiveSeconds}')::numeric is distinct from 60 or (r#>>'{summary,durationSamples}')::int is distinct from 200 then raise exception 'FAIL completed measured durations'; end if;
 -- All outcomes contribute once, even with multiple placements per attempt.
 if (r#>>'{summary,totalActiveSeconds}')::numeric is distinct from 811999.20
 or (r#>>'{summary,playtimeSamples}')::int is distinct from 1000
 or (r#>>'{summary,missingPlaytimeSamples}')::int is distinct from 200
 or (r#>>'{summary,partialPlaytimeSamples}')::int is distinct from 0
 or (r#>>'{missions,0,metrics,totalActiveSeconds}')::numeric is distinct from 811999.20
 or (r#>>'{breakdowns,country,0,metrics,totalActiveSeconds}')::numeric is distinct from 811999.20
 or (r#>>'{breakdowns,campaign,0,metrics,totalActiveSeconds}')::numeric is distinct from 811999.20
 or (r#>>'{breakdowns,creator,0,metrics,totalActiveSeconds}')::numeric is distinct from 811999.20 then raise exception 'FAIL all-outcome playtime / coverage / join multiplication'; end if;
 if (r#>>'{summary,retries}')::int is distinct from 400 or (r#>>'{summary,restarts}')::int is distinct from 400 or (r#>>'{summary,replays}')::int is distinct from 400 then raise exception 'FAIL retry reasons'; end if;
 if (r#>>'{summary,placements}')::int is distinct from 2400 or (r#>>'{summary,placementsPerPlacingAttempt}')::numeric is distinct from 2 or (r#>>'{summary,placingAttempts}')::int is distinct from 1200 then raise exception 'FAIL placement join multiplication'; end if;
 if (r#>>'{missions,0,metrics,attempts}')::int is distinct from 1200 or (r#>>'{units,0,attempts}')::int is distinct from 1200 then raise exception 'FAIL mission/unit aggregation'; end if;
 if (r#>>'{breakdowns,country,0,metrics,attempts}')::int is distinct from 1200 or (r#>>'{daily,0,attempts}')::int is distinct from 1200 then raise exception 'FAIL daily/acquisition counts'; end if;
 r := pg_temp.fixture_engagement_report('2026-01-01','2026-01-01','CA','ios','Marketing campaign','creator','standard','gameplay-version');
 if (r#>>'{summary,attempts}')::int is distinct from 1200 then raise exception 'FAIL combined filters / attempt app version'; end if;
 r := pg_temp.fixture_engagement_report('2026-01-01','2026-01-01',null,null,null,null,null,'old-acquisition-version');
 if (r#>>'{summary,attempts}')::int is distinct from 0 or r#>'{summary,completionRate}' is distinct from 'null'::jsonb or r->'missions' is distinct from '[]'::jsonb then raise exception 'FAIL empty / zero denominator'; end if;
 if r#>'{summary,totalActiveSeconds}' is distinct from 'null'::jsonb
 or (r#>>'{summary,playtimeSamples}')::int is distinct from 0
 or (r#>>'{summary,missingPlaytimeSamples}')::int is distinct from 0 then raise exception 'FAIL empty playtime'; end if;
 -- Partial completed duration must not enter the mean; real zero is a valid measurement.
 insert into pg_temp.engagement_attempts(attempt_id,install_id,mission_id,content_version,difficulty,started_at,ended_at,outcome,active_gameplay_ms,duration_complete)
 values (gen_random_uuid(),'fixture-install','duration','v1','standard','2026-02-01 00:00+00','2026-02-01 00:05+00','completed',90000,false),
 (gen_random_uuid(),'fixture-install','duration','v1','standard','2026-02-01 00:00+00','2026-02-01 00:05+00','completed',0,true);
 r := pg_temp.fixture_engagement_report('2026-02-01','2026-02-01');
 if (r#>>'{summary,durationSamples}')::int is distinct from 1 or (r#>>'{summary,averageActiveSeconds}')::numeric is distinct from 0 or r#>'{summary,placementsPerPlacingAttempt}' is distinct from 'null'::jsonb then raise exception 'FAIL partial/null/zero measurements'; end if;
 if (r#>>'{summary,totalActiveSeconds}')::numeric is distinct from 90
 or (r#>>'{summary,playtimeSamples}')::int is distinct from 2
 or (r#>>'{summary,partialPlaytimeSamples}')::int is distinct from 1 then raise exception 'FAIL partial playtime included'; end if;
 update pg_temp.engagement_attempts set active_gameplay_ms=0 where mission_id='duration';
 r := pg_temp.fixture_engagement_report('2026-02-01','2026-02-01');
 if (r#>>'{summary,totalActiveSeconds}')::numeric is distinct from 0 then raise exception 'FAIL measured zero playtime'; end if;
 insert into pg_temp.engagement_attempts(attempt_id,install_id,mission_id,content_version,difficulty,started_at,outcome)
 select gen_random_uuid(),'missing-attribution','group-'||i,'v1','hard','2026-03-01 00:00+00','unknown' from generate_series(1,60) i;
 r := pg_temp.fixture_engagement_report('2026-03-01','2026-03-01');
 if jsonb_array_length(r->'missions') is distinct from 50 or (r#>>'{summary,attempts}')::int is distinct from 60 or r#>'{breakdowns,country,0,values}' is distinct from '[null]'::jsonb or r#>'{summary,completionRate}' is distinct from 'null'::jsonb then raise exception 'FAIL limits / unknown attribution / unresolved denominator'; end if;
 if r#>'{summary,totalActiveSeconds}' is distinct from 'null'::jsonb
 or (r#>>'{summary,missingPlaytimeSamples}')::int is distinct from 60
 or (r#>>'{summary,playtimeSamples}')::int is distinct from 0 then raise exception 'FAIL all-missing playtime'; end if;
 begin
 perform pg_temp.fixture_engagement_report('2026-01-02','2026-01-01'); raise exception 'FAIL invalid dates';
 exception when invalid_parameter_value then null; end;
 raise notice 'PASS engagement: auth grants, >1000 attempts, placements, date bounds, durations, outcomes, retry reasons, filters, limits';
end $verify$;
rollback;
