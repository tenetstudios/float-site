-- Manual verification AFTER acquisition-reporting.sql. Always rolls back.
-- Requires a SQL-editor/postgres session with permission to inspect functions.
-- Uses a temporary fixture table: never inserts into or changes real acquisition rows.
begin;
create temporary table acquisition_fixture (
  first_seen_at timestamptz, is_paid boolean, country_code text, campaign_id text,
  campaign_name text, creator_code text, acquisition_source text, acquisition_medium text,
  platform text, app_version text
);
insert into acquisition_fixture
select '2026-01-01 00:00:00+00'::timestamptz, case i % 3 when 0 then true when 1 then false else null end,
       'CA', 'fixture-campaign', 'Fixture campaign', 'fixture-creator', 'fixture-source', 'fixture-medium', 'ios', '1.0'
from generate_series(1, 1200) i;
insert into acquisition_fixture values
 ('2025-12-31 23:59:59.999+00', true, 'CA', null, null, null, null, null, null, null),
 ('2026-01-02 23:59:59.999+00', true, 'US', null, null, null, null, null, 'android', null),
 ('2026-01-03 00:00:00+00', true, 'CA', null, null, null, null, null, null, null);
insert into acquisition_fixture
select '2026-01-04 12:00+00', null, 'CA', 'group-' || i, null, null, null, null, null, null from generate_series(1, 60) i;

-- Test the deployed function body against only the isolated fixtures.
do $verify$
declare definition text; r jsonb;
begin
  if has_function_privilege('anon', 'public.float_acquisition_report(date,date,text,text,text,text,text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.float_acquisition_report(date,date,text,text,text,text,text)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.float_acquisition_report(date,date,text,text,text,text,text)', 'EXECUTE') then
    raise exception 'FAIL: report RPC privileges';
  end if;
  if (select prosecdef from pg_proc where oid = 'public.float_acquisition_report(date,date,text,text,text,text,text)'::regprocedure) then
    raise exception 'FAIL: expected security invoker';
  end if;
  definition := pg_get_functiondef('public.float_acquisition_report(date,date,text,text,text,text,text)'::regprocedure);
  definition := replace(definition, 'public.float_acquisition_report', 'pg_temp.fixture_report');
  definition := replace(definition, 'public.player_acquisition', 'pg_temp.acquisition_fixture');
  execute definition;
  perform set_config('TimeZone', 'America/Toronto', true);
  r := pg_temp.fixture_report('2026-01-01', '2026-01-02');
  if r->'summary' <> '{"total":1201,"paid":401,"organic":400,"unknown":400}'::jsonb then raise exception 'FAIL: >1000 / paid partition: %', r->'summary'; end if;
  if r->'daily' <> '[{"day":"2026-01-01","installs":1200},{"day":"2026-01-02","installs":1}]'::jsonb then raise exception 'FAIL: UTC boundaries'; end if;
  r := pg_temp.fixture_report('2026-01-01','2026-01-02','fixture-campaign','fixture-creator','CA','ios','unknown');
  if (r #>> '{summary,total}')::int <> 400 then raise exception 'FAIL: combined filters / null paid'; end if;
  if (r #>> '{creatorReport,0,installs}')::int <> 400 or (r #>> '{campaignCountries,0,installs}')::int <> 400 then raise exception 'FAIL: breakdown filters'; end if;
  r := pg_temp.fixture_report('2026-01-01','2026-01-02','Fixture campaign',null,null,null,'organic');
  if (r #>> '{summary,total}')::int <> 400 then raise exception 'FAIL: campaign name / organic'; end if;
  r := pg_temp.fixture_report('2026-01-01','2026-01-02',null,null,'US','android','paid');
  if (r #>> '{summary,total}')::int <> 1 or r #> '{campaigns,0,values}' <> '[null,null]'::jsonb then raise exception 'FAIL: country/platform/null grouping'; end if;
  r := pg_temp.fixture_report('2026-01-04','2026-01-04');
  if jsonb_array_length(r->'campaigns') <> 50 or (r #>> '{summary,total}')::int <> 60 then raise exception 'FAIL: bounded groups must not truncate totals'; end if;
  r := pg_temp.fixture_report('2026-02-01','2026-02-02');
  if (r #>> '{summary,total}')::int <> 0 or r->'campaigns' <> '[]'::jsonb or jsonb_array_length(r->'daily') <> 2 then raise exception 'FAIL: empty report'; end if;
  begin
    perform pg_temp.fixture_report('2026-02-02','2026-02-01');
    raise exception 'FAIL: invalid range accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform pg_temp.fixture_report('2026-01-01','2026-01-01',null,null,null,null,'invalid');
    raise exception 'FAIL: invalid status accepted';
  exception when invalid_parameter_value then null; end;
  raise notice 'PASS: permissions, >1000 rows, paid/null partition, UTC boundaries, filters, grouped reports, Top 50, empty results and invalid inputs';
end
$verify$;
rollback;
