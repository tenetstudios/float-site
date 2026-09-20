-- Manual deployment only. Shared mobile migration numbering could not be verified.
-- Prerequisite: SQL 016 and public.player_acquisition already exist.
-- Review existing indexes before running. No source records or RLS policies change.
begin;

create index if not exists float_acq_report_seen_idx on public.player_acquisition (first_seen_at);
create index if not exists float_acq_report_campaign_idx on public.player_acquisition (campaign_id, first_seen_at);
create index if not exists float_acq_report_campaign_name_idx on public.player_acquisition (campaign_name, first_seen_at);
create index if not exists float_acq_report_creator_idx on public.player_acquisition (creator_code, first_seen_at);
create index if not exists float_acq_report_country_idx on public.player_acquisition (country_code, first_seen_at);
create index if not exists float_acq_report_platform_idx on public.player_acquisition (platform, first_seen_at);

create or replace function public.float_acquisition_report(
  p_start date, p_end date,
  p_campaign text default null, p_creator text default null,
  p_country text default null, p_platform text default null,
  p_paid text default 'all'
) returns jsonb
language plpgsql stable security invoker
set search_path = pg_catalog
as $function$
declare result jsonb;
begin
  if p_start is null or p_end is null or not isfinite(p_start) or not isfinite(p_end)
     or p_end < p_start or p_end - p_start > 365 then
    raise exception 'Date range must contain 1 to 366 days' using errcode = '22023';
  end if;
  if p_paid is null or p_paid not in ('all', 'paid', 'organic', 'unknown') then
    raise exception 'Invalid paid status' using errcode = '22023';
  end if;
  if exists (select 1 from unnest(array[p_campaign, p_creator, p_country, p_platform]) v
             where length(v) > 200 or v ~ '[[:cntrl:]]')
     or (p_country is not null and p_country !~ '^[A-Z]{2}$') then
    raise exception 'Invalid filter' using errcode = '22023';
  end if;
  with filtered as materialized (
    select first_seen_at, is_paid, country_code, region_code, referral_code, campaign_id, campaign_name,
           creator_code, acquisition_source, acquisition_medium, platform, app_version
    from public.player_acquisition
    where first_seen_at >= (p_start::timestamp at time zone 'UTC')
      and first_seen_at < ((p_end + 1)::timestamp at time zone 'UTC')
      and (p_campaign is null or campaign_id = p_campaign or campaign_name = p_campaign)
      and (p_creator is null or creator_code = p_creator)
      and (p_country is null or country_code = p_country)
      and (p_platform is null or platform = p_platform)
      and (p_paid = 'all' or (p_paid = 'paid' and is_paid is true)
           or (p_paid = 'organic' and is_paid is false)
           or (p_paid = 'unknown' and is_paid is null))
  ), daily_counts as (
    select (first_seen_at at time zone 'UTC')::date AS report_date, count(*) AS installs
    from filtered group by 1
  )
  select jsonb_build_object(
    'summary', (select jsonb_build_object('total', count(*),
      'paid', count(*) filter (where is_paid is true),
      'organic', count(*) filter (where is_paid is false),
      'unknown', count(*) filter (where is_paid is null)) from filtered),
    'daily', (select jsonb_agg(jsonb_build_object('day', days.report_date::text, 'installs', coalesce(d.installs, 0)) order by days.report_date)
      from (select p_start + i AS report_date from generate_series(0, p_end - p_start) i) days
      left join daily_counts d on d.report_date = days.report_date),
    'countries', (select coalesce(jsonb_agg(jsonb_build_object('values', vals, 'installs', installs) order by installs desc, vals::text), '[]'::jsonb) from (select jsonb_build_array(country_code) vals, count(*) installs from filtered group by country_code order by count(*) desc, jsonb_build_array(country_code)::text limit 50) g),
    'campaigns', (select coalesce(jsonb_agg(jsonb_build_object('values', vals, 'installs', installs) order by installs desc, vals::text), '[]'::jsonb) from (select jsonb_build_array(campaign_id, campaign_name) vals, count(*) installs from filtered group by campaign_id, campaign_name order by count(*) desc, jsonb_build_array(campaign_id, campaign_name)::text limit 50) g),
    'regions', (select coalesce(jsonb_agg(jsonb_build_object('values', vals, 'installs', installs) order by installs desc, vals::text), '[]'::jsonb) from (select jsonb_build_array(country_code, region_code) vals, count(*) installs from filtered group by country_code, region_code order by count(*) desc, jsonb_build_array(country_code, region_code)::text limit 50) g),
    'referrals', (select coalesce(jsonb_agg(jsonb_build_object('values', vals, 'installs', installs) order by installs desc, vals::text), '[]'::jsonb) from (select jsonb_build_array(referral_code) vals, count(*) installs from filtered group by referral_code order by count(*) desc, jsonb_build_array(referral_code)::text limit 50) g),
    'creators', (select coalesce(jsonb_agg(jsonb_build_object('values', vals, 'installs', installs) order by installs desc, vals::text), '[]'::jsonb) from (select jsonb_build_array(creator_code) vals, count(*) installs from filtered group by creator_code order by count(*) desc, jsonb_build_array(creator_code)::text limit 50) g),
    'sources', (select coalesce(jsonb_agg(jsonb_build_object('values', vals, 'installs', installs) order by installs desc, vals::text), '[]'::jsonb) from (select jsonb_build_array(acquisition_source, acquisition_medium) vals, count(*) installs from filtered group by acquisition_source, acquisition_medium order by count(*) desc, jsonb_build_array(acquisition_source, acquisition_medium)::text limit 50) g),
    'platforms', (select coalesce(jsonb_agg(jsonb_build_object('values', vals, 'installs', installs) order by installs desc, vals::text), '[]'::jsonb) from (select jsonb_build_array(platform, app_version) vals, count(*) installs from filtered group by platform, app_version order by count(*) desc, jsonb_build_array(platform, app_version)::text limit 50) g),
    'campaignCountries', (select coalesce(jsonb_agg(jsonb_build_object('values', vals, 'installs', installs) order by installs desc, vals::text), '[]'::jsonb) from (select jsonb_build_array(campaign_id, campaign_name, country_code) vals, count(*) installs from filtered group by campaign_id, campaign_name, country_code order by count(*) desc, jsonb_build_array(campaign_id, campaign_name, country_code)::text limit 50) g),
    'creatorReport', (select coalesce(jsonb_agg(jsonb_build_object('values', vals, 'installs', installs) order by installs desc, vals::text), '[]'::jsonb) from (select jsonb_build_array(creator_code, campaign_name, country_code, acquisition_source) vals, count(*) installs from filtered group by creator_code, campaign_name, country_code, acquisition_source order by count(*) desc, jsonb_build_array(creator_code, campaign_name, country_code, acquisition_source)::text limit 50) g)
  ) into result;
  return result;
end
$function$;

revoke all on function public.float_acquisition_report(date, date, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.float_acquisition_report(date, date, text, text, text, text, text) to service_role;
comment on function public.float_acquisition_report(date, date, text, text, text, text, text) is
  'Backend-only installation aggregates. UTC first_seen_at, inclusive dates, top 50 groups. No identifiers or raw attribution.';
notify pgrst, 'reload schema';
commit;
