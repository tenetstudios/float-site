-- Run AFTER mobile SQL 017 and website retention-reporting.sql. Always rolls back.
-- Uses isolated temporary fixtures, not production installations or sessions.
begin;
create temporary table report_acquisition (
 install_id text, first_seen_at timestamptz, country_code text, campaign_id text,
 campaign_name text, creator_code text, acquisition_source text, platform text
);
create temporary table report_retention (like public.player_retention including defaults);
create temporary table report_daily (like public.player_daily_activity including defaults);
insert into report_acquisition
select 'fixture-'||i, ((now() at time zone 'UTC')::date-40)::timestamp at time zone 'UTC',
 'CA','campaign-id','Campaign name','creator','source','ios' from generate_series(1,1200) i;
insert into report_retention(install_id,first_seen_at,tracking_started_at,last_seen_at,last_session_started_at,
 active_day_count,total_session_count,d1_retained,d7_retained,d30_retained)
select install_id,first_seen_at,first_seen_at,now(),now()-interval '2 days',2,1,
 (substring(install_id from 9)::int % 2)=0,(substring(install_id from 9)::int % 3)=0,(substring(install_id from 9)::int % 4)=0
from report_acquisition;
insert into report_daily(install_id,activity_date,session_count)
select install_id,(now() at time zone 'UTC')::date-1,substring(install_id from 9)::int % 2 from report_acquisition;
insert into report_daily(install_id,activity_date,session_count)
select install_id,(now() at time zone 'UTC')::date,0 from report_acquisition;
insert into report_acquisition values
 ('untracked',((now() at time zone 'UTC')::date-40)::timestamp at time zone 'UTC','US',null,null,null,null,'android'),
 ('late',((now() at time zone 'UTC')::date-40)::timestamp at time zone 'UTC','US',null,null,null,null,'android'),
 ('young',((now() at time zone 'UTC')::date)::timestamp at time zone 'UTC','US',null,null,null,null,'android');
insert into report_retention(install_id,first_seen_at,tracking_started_at,last_seen_at,active_day_count,total_session_count,d1_retained,d7_retained,d30_retained)
select install_id,first_seen_at,now(),now(),1,1,true,true,true from report_acquisition where install_id in ('late','young');
do $verify$
declare definition text; r jsonb; today date := (now() at time zone 'UTC')::date;
begin
 if has_function_privilege('anon','public.float_retention_report(date,date,date,date,text,text,text,text,text)','EXECUTE')
 or has_function_privilege('authenticated','public.float_retention_report(date,date,date,date,text,text,text,text,text)','EXECUTE')
 or not has_function_privilege('service_role','public.float_retention_report(date,date,date,date,text,text,text,text,text)','EXECUTE') then raise exception 'FAIL RPC permissions'; end if;
 if (select prosecdef from pg_proc where oid='public.float_retention_report(date,date,date,date,text,text,text,text,text)'::regprocedure) then raise exception 'FAIL security invoker'; end if;
 definition := pg_get_viewdef('public.player_retention_reporting'::regclass,true);
 definition := replace(definition,'public.player_retention','pg_temp.report_retention');
 -- pg_get_viewdef may omit public when it is in the caller search path.
 definition := replace(definition,'FROM player_retention ', 'FROM pg_temp.report_retention ');
 execute 'create temporary view fixture_retention_view as '||definition;
 definition := pg_get_functiondef('public.float_retention_report(date,date,date,date,text,text,text,text,text)'::regprocedure);
 definition := replace(definition,'public.float_retention_report','pg_temp.fixture_retention_report');
 definition := replace(definition,'public.player_retention_reporting','pg_temp.fixture_retention_view');
 definition := replace(definition,'public.player_acquisition','pg_temp.report_acquisition');
 definition := replace(definition,'public.player_daily_activity','pg_temp.report_daily');
 execute definition;
 perform set_config('TimeZone','America/Toronto',true);
 r := pg_temp.fixture_retention_report(today-40,today,today-1,today);
 if (r#>>'{summary,installs}')::int is distinct from 1203 or (r#>>'{summary,tracked}')::int is distinct from 1202 then raise exception 'FAIL large population or untracked exclusion'; end if;
 if r#>'{summary,d1}' is distinct from '{"eligible":1200,"retained":600,"pending":1,"unavailable":2,"percent":50}'::jsonb then raise exception 'FAIL D1 coverage: %',r#>'{summary,d1}'; end if;
 if (r#>>'{summary,d7,retained}')::int is distinct from 400 or (r#>>'{summary,d30,retained}')::int is distinct from 300 then raise exception 'FAIL D7/D30'; end if;
 if r->'activity' is distinct from '{"activeDays":2400,"sessionStarts":600,"sessionsPerActiveDay":0.25}'::jsonb then raise exception 'FAIL ratio and midnight continuation: %',r->'activity'; end if;
 if (r#>>'{daily,1,sessionStarts}')::int is distinct from 0 or (r#>>'{daily,1,activeDays}')::int is distinct from 1200 then raise exception 'FAIL continuation day'; end if;
 if (r#>>'{cohorts,0,metrics,d1,pending}')::int is distinct from 1 then raise exception 'FAIL pending cohort'; end if;
 if not exists(select 1 from jsonb_array_elements(r->'inactivity') x where x->>'label'='1–6 days' and (x->>'installs')::int=1200) then raise exception 'FAIL last session start distinct from last seen'; end if;
 r := pg_temp.fixture_retention_report(today-40,today,today-1,today,'CA','Campaign name','creator','source','ios');
 if (r#>>'{summary,installs}')::int is distinct from 1200 or (r#>>'{breakdowns,creatorCampaign,0,metrics,installs}')::int is distinct from 1200 then raise exception 'FAIL combined filters'; end if;
 r := pg_temp.fixture_retention_report(today-40,today,today-1,today,'US');
 if (r#>>'{summary,d1,percent}') is not null or (r#>>'{activity,sessionsPerActiveDay}') is not null then raise exception 'FAIL zero denominator'; end if;
 r := pg_temp.fixture_retention_report(today-40,today,today-1,today,null,null,null,'no-matches');
 if (r#>>'{summary,installs}')::int is distinct from 0 or r->'cohorts' is distinct from '[]'::jsonb then raise exception 'FAIL empty results'; end if;
 begin
  perform pg_temp.fixture_retention_report(today,today-1,today,today);
  raise exception 'FAIL invalid dates accepted';
 exception when invalid_parameter_value then null; end;
 -- Include exactly UTC midnight at start; exclude midnight after the selected end.
 insert into pg_temp.report_acquisition values ('outside',(today+1)::timestamp at time zone 'UTC',null,null,null,null,null,null);
 r := pg_temp.fixture_retention_report(today,today,today,today);
 if (r#>>'{summary,installs}')::int is distinct from 1 then raise exception 'FAIL UTC cohort bounds'; end if;
 insert into pg_temp.report_acquisition select 'group-'||i,(today-10)::timestamp at time zone 'UTC',null,'group-'||i,null,null,null,null from generate_series(1,60) i;
 r := pg_temp.fixture_retention_report(today-10,today-10,today,today);
 if jsonb_array_length(r#>'{breakdowns,campaign}') is distinct from 50 or (r#>>'{summary,installs}')::int is distinct from 60 then raise exception 'FAIL Top 50 truncates only breakdowns'; end if;
 insert into pg_temp.report_acquisition values
  ('boundary-covered',(today-8)::timestamp at time zone 'UTC','GB',null,null,null,null,null),
  ('boundary-late',(today-8)::timestamp at time zone 'UTC','GB',null,null,null,null,null),
  ('target-today',(today-7)::timestamp at time zone 'UTC','GB',null,null,null,null,null);
 insert into pg_temp.report_retention(install_id,first_seen_at,tracking_started_at,last_seen_at,d7_retained)
 select install_id,first_seen_at,case when install_id='boundary-late' then ((today-1)::timestamp at time zone 'UTC')+interval '1 millisecond'
 when install_id='boundary-covered' then (today-1)::timestamp at time zone 'UTC' else first_seen_at end,now(),true
 from pg_temp.report_acquisition where country_code='GB';
 r := pg_temp.fixture_retention_report(today-8,today,today,today,'GB');
 if r#>'{summary,d7}' is distinct from '{"eligible":1,"retained":1,"pending":1,"unavailable":1,"percent":100}'::jsonb then raise exception 'FAIL coverage midnight or unfinished target day'; end if;
 raise notice 'PASS retention report: permissions, 1000+ rows, coverage/maturity, denominators, filters, UTC, continuation days, inactivity, empty, Top 50';
end
$verify$;
rollback;
