-- Manual website reporting deployment AFTER float-app SQL 017.
-- Unnumbered to avoid reserving a number in the separately maintained mobile sequence.
-- Does not change source records, existing grants, or RLS.
begin;
create or replace function public.float_retention_report(
 p_start date, p_end date, p_activity_start date, p_activity_end date,
 p_country text default null, p_campaign text default null, p_creator text default null,
 p_source text default null, p_platform text default null
) returns jsonb language plpgsql stable security invoker set search_path = pg_catalog
as $report$
declare result jsonb;
begin
 if p_start is null or p_end is null or p_activity_start is null or p_activity_end is null
 or not isfinite(p_start) or not isfinite(p_end) or not isfinite(p_activity_start) or not isfinite(p_activity_end)
 or p_end < p_start or p_end-p_start > 365 or p_activity_end < p_activity_start or p_activity_end-p_activity_start > 365 then
 raise exception 'Date ranges must contain 1 to 366 days' using errcode='22023'; end if;
 if exists(select 1 from unnest(array[p_country,p_campaign,p_creator,p_source,p_platform]) v where length(v)>200 or v ~ '[[:cntrl:]]')
 or (p_country is not null and p_country !~ '^[A-Z]{2}$') then
 raise exception 'Invalid filter' using errcode='22023'; end if;
 with population as materialized (
 select a.install_id, a.first_seen_at, (a.first_seen_at at time zone 'UTC')::date as cohort_date,
 a.country_code,a.campaign_id,a.campaign_name,a.creator_code,a.acquisition_source,a.platform,
 r.tracking_started_at,r.last_seen_at,r.last_session_started_at,r.active_day_count,r.total_session_count,
 r.d1_eligible,r.d7_eligible,r.d30_eligible,r.d1_retained,r.d7_retained,r.d30_retained,
 r.days_since_last_session, (now() at time zone 'UTC')::date as today
 from public.player_acquisition a left join public.player_retention_reporting r using(install_id)
 where a.first_seen_at >= (p_start::timestamp at time zone 'UTC')
 and a.first_seen_at < ((p_end+1)::timestamp at time zone 'UTC')
 and (p_country is null or a.country_code=p_country)
 and (p_campaign is null or a.campaign_id=p_campaign or a.campaign_name=p_campaign)
 and (p_creator is null or a.creator_code=p_creator)
 and (p_source is null or a.acquisition_source=p_source)
 and (p_platform is null or a.platform=p_platform)
 ), activity as materialized (
 select d.activity_date,d.session_count
 from public.player_daily_activity d join population p using(install_id)
 where d.activity_date between p_activity_start and p_activity_end
 ), daily as (
 select activity_date,count(*) as active_days,sum(session_count) as starts from activity group by activity_date
 ), inactive as (
 select case when last_session_started_at is null then 'Unavailable'
 when days_since_last_session <= 0 then 'Today'
 when days_since_last_session <= 6 then '1–6 days'
 when days_since_last_session <= 29 then '7–29 days' else '30+ days' end as label
 from population
 )
 select jsonb_build_object(
 'asOf',(now() at time zone 'UTC')::date::text,
 'summary',(select jsonb_build_object(
'installs',count(*),'tracked',count(tracking_started_at),
'firstSeen',min(first_seen_at),'lastSeen',max(last_seen_at),
'activeDays',coalesce(sum(active_day_count),0),
'averageActiveDays',round(avg(active_day_count),2),'averageSessions',round(avg(total_session_count),2),
'd1',jsonb_build_object('eligible',count(*) filter(where d1_eligible),'retained',count(*) filter(where d1_eligible and d1_retained),
'pending',count(*) filter(where today <= cohort_date + 1),
'unavailable',count(*) filter(where today > cohort_date + 1 and not coalesce(d1_eligible,false)),
'percent',round(100.0*count(*) filter(where d1_eligible and d1_retained)/nullif(count(*) filter(where d1_eligible),0),2)),
'd7',jsonb_build_object('eligible',count(*) filter(where d7_eligible),'retained',count(*) filter(where d7_eligible and d7_retained),
'pending',count(*) filter(where today <= cohort_date + 7),
'unavailable',count(*) filter(where today > cohort_date + 7 and not coalesce(d7_eligible,false)),
'percent',round(100.0*count(*) filter(where d7_eligible and d7_retained)/nullif(count(*) filter(where d7_eligible),0),2)),
'd30',jsonb_build_object('eligible',count(*) filter(where d30_eligible),'retained',count(*) filter(where d30_eligible and d30_retained),
'pending',count(*) filter(where today <= cohort_date + 30),
'unavailable',count(*) filter(where today > cohort_date + 30 and not coalesce(d30_eligible,false)),
'percent',round(100.0*count(*) filter(where d30_eligible and d30_retained)/nullif(count(*) filter(where d30_eligible),0),2))) from population),
 'activity',(select jsonb_build_object('activeDays',count(*),'sessionStarts',coalesce(sum(session_count),0),
 'sessionsPerActiveDay',round(sum(session_count)::numeric/nullif(count(*),0),2)) from activity),
 'daily',(select jsonb_agg(jsonb_build_object('day',dates.report_date::text,'activeDays',coalesce(d.active_days,0),
 'sessionStarts',coalesce(d.starts,0),'sessionsPerActiveDay',round(d.starts::numeric/nullif(d.active_days,0),2)) order by dates.report_date)
 from (select p_activity_start+i as report_date from generate_series(0,p_activity_end-p_activity_start) i) dates
 left join daily d on d.activity_date=dates.report_date),
 'cohorts',(select coalesce(jsonb_agg(jsonb_build_object('values',jsonb_build_array(cohort_date::text),'metrics',metrics) order by cohort_date desc),'[]'::jsonb)
 from (select cohort_date,jsonb_build_object(
'installs',count(*),'tracked',count(tracking_started_at),
'firstSeen',min(first_seen_at),'lastSeen',max(last_seen_at),
'activeDays',coalesce(sum(active_day_count),0),
'averageActiveDays',round(avg(active_day_count),2),'averageSessions',round(avg(total_session_count),2),
'd1',jsonb_build_object('eligible',count(*) filter(where d1_eligible),'retained',count(*) filter(where d1_eligible and d1_retained),
'pending',count(*) filter(where today <= cohort_date + 1),
'unavailable',count(*) filter(where today > cohort_date + 1 and not coalesce(d1_eligible,false)),
'percent',round(100.0*count(*) filter(where d1_eligible and d1_retained)/nullif(count(*) filter(where d1_eligible),0),2)),
'd7',jsonb_build_object('eligible',count(*) filter(where d7_eligible),'retained',count(*) filter(where d7_eligible and d7_retained),
'pending',count(*) filter(where today <= cohort_date + 7),
'unavailable',count(*) filter(where today > cohort_date + 7 and not coalesce(d7_eligible,false)),
'percent',round(100.0*count(*) filter(where d7_eligible and d7_retained)/nullif(count(*) filter(where d7_eligible),0),2)),
'd30',jsonb_build_object('eligible',count(*) filter(where d30_eligible),'retained',count(*) filter(where d30_eligible and d30_retained),
'pending',count(*) filter(where today <= cohort_date + 30),
'unavailable',count(*) filter(where today > cohort_date + 30 and not coalesce(d30_eligible,false)),
'percent',round(100.0*count(*) filter(where d30_eligible and d30_retained)/nullif(count(*) filter(where d30_eligible),0),2))) as metrics from population group by cohort_date) c),
 'inactivity',(select coalesce(jsonb_agg(jsonb_build_object('label',label,'installs',installs) order by case label when 'Today' then 0 when '1–6 days' then 1 when '7–29 days' then 2 when '30+ days' then 3 else 4 end),'[]'::jsonb)
 from (select label,count(*) as installs from inactive group by label) i),
 'breakdowns',jsonb_build_object(
 'country',(select coalesce(jsonb_agg(jsonb_build_object('values',vals,'metrics',metrics) order by installs desc,vals::text),'[]'::jsonb)
 from (select jsonb_build_array(country_code) as vals,count(*) as installs,jsonb_build_object(
'installs',count(*),'tracked',count(tracking_started_at),
'firstSeen',min(first_seen_at),'lastSeen',max(last_seen_at),
'activeDays',coalesce(sum(active_day_count),0),
'averageActiveDays',round(avg(active_day_count),2),'averageSessions',round(avg(total_session_count),2),
'd1',jsonb_build_object('eligible',count(*) filter(where d1_eligible),'retained',count(*) filter(where d1_eligible and d1_retained),
'pending',count(*) filter(where today <= cohort_date + 1),
'unavailable',count(*) filter(where today > cohort_date + 1 and not coalesce(d1_eligible,false)),
'percent',round(100.0*count(*) filter(where d1_eligible and d1_retained)/nullif(count(*) filter(where d1_eligible),0),2)),
'd7',jsonb_build_object('eligible',count(*) filter(where d7_eligible),'retained',count(*) filter(where d7_eligible and d7_retained),
'pending',count(*) filter(where today <= cohort_date + 7),
'unavailable',count(*) filter(where today > cohort_date + 7 and not coalesce(d7_eligible,false)),
'percent',round(100.0*count(*) filter(where d7_eligible and d7_retained)/nullif(count(*) filter(where d7_eligible),0),2)),
'd30',jsonb_build_object('eligible',count(*) filter(where d30_eligible),'retained',count(*) filter(where d30_eligible and d30_retained),
'pending',count(*) filter(where today <= cohort_date + 30),
'unavailable',count(*) filter(where today > cohort_date + 30 and not coalesce(d30_eligible,false)),
'percent',round(100.0*count(*) filter(where d30_eligible and d30_retained)/nullif(count(*) filter(where d30_eligible),0),2))) as metrics
 from population group by country_code order by count(*) desc,jsonb_build_array(country_code)::text limit 50) g),
'campaign',(select coalesce(jsonb_agg(jsonb_build_object('values',vals,'metrics',metrics) order by installs desc,vals::text),'[]'::jsonb)
 from (select jsonb_build_array(campaign_id,campaign_name) as vals,count(*) as installs,jsonb_build_object(
'installs',count(*),'tracked',count(tracking_started_at),
'firstSeen',min(first_seen_at),'lastSeen',max(last_seen_at),
'activeDays',coalesce(sum(active_day_count),0),
'averageActiveDays',round(avg(active_day_count),2),'averageSessions',round(avg(total_session_count),2),
'd1',jsonb_build_object('eligible',count(*) filter(where d1_eligible),'retained',count(*) filter(where d1_eligible and d1_retained),
'pending',count(*) filter(where today <= cohort_date + 1),
'unavailable',count(*) filter(where today > cohort_date + 1 and not coalesce(d1_eligible,false)),
'percent',round(100.0*count(*) filter(where d1_eligible and d1_retained)/nullif(count(*) filter(where d1_eligible),0),2)),
'd7',jsonb_build_object('eligible',count(*) filter(where d7_eligible),'retained',count(*) filter(where d7_eligible and d7_retained),
'pending',count(*) filter(where today <= cohort_date + 7),
'unavailable',count(*) filter(where today > cohort_date + 7 and not coalesce(d7_eligible,false)),
'percent',round(100.0*count(*) filter(where d7_eligible and d7_retained)/nullif(count(*) filter(where d7_eligible),0),2)),
'd30',jsonb_build_object('eligible',count(*) filter(where d30_eligible),'retained',count(*) filter(where d30_eligible and d30_retained),
'pending',count(*) filter(where today <= cohort_date + 30),
'unavailable',count(*) filter(where today > cohort_date + 30 and not coalesce(d30_eligible,false)),
'percent',round(100.0*count(*) filter(where d30_eligible and d30_retained)/nullif(count(*) filter(where d30_eligible),0),2))) as metrics
 from population group by campaign_id,campaign_name order by count(*) desc,jsonb_build_array(campaign_id,campaign_name)::text limit 50) g),
'creator',(select coalesce(jsonb_agg(jsonb_build_object('values',vals,'metrics',metrics) order by installs desc,vals::text),'[]'::jsonb)
 from (select jsonb_build_array(creator_code) as vals,count(*) as installs,jsonb_build_object(
'installs',count(*),'tracked',count(tracking_started_at),
'firstSeen',min(first_seen_at),'lastSeen',max(last_seen_at),
'activeDays',coalesce(sum(active_day_count),0),
'averageActiveDays',round(avg(active_day_count),2),'averageSessions',round(avg(total_session_count),2),
'd1',jsonb_build_object('eligible',count(*) filter(where d1_eligible),'retained',count(*) filter(where d1_eligible and d1_retained),
'pending',count(*) filter(where today <= cohort_date + 1),
'unavailable',count(*) filter(where today > cohort_date + 1 and not coalesce(d1_eligible,false)),
'percent',round(100.0*count(*) filter(where d1_eligible and d1_retained)/nullif(count(*) filter(where d1_eligible),0),2)),
'd7',jsonb_build_object('eligible',count(*) filter(where d7_eligible),'retained',count(*) filter(where d7_eligible and d7_retained),
'pending',count(*) filter(where today <= cohort_date + 7),
'unavailable',count(*) filter(where today > cohort_date + 7 and not coalesce(d7_eligible,false)),
'percent',round(100.0*count(*) filter(where d7_eligible and d7_retained)/nullif(count(*) filter(where d7_eligible),0),2)),
'd30',jsonb_build_object('eligible',count(*) filter(where d30_eligible),'retained',count(*) filter(where d30_eligible and d30_retained),
'pending',count(*) filter(where today <= cohort_date + 30),
'unavailable',count(*) filter(where today > cohort_date + 30 and not coalesce(d30_eligible,false)),
'percent',round(100.0*count(*) filter(where d30_eligible and d30_retained)/nullif(count(*) filter(where d30_eligible),0),2))) as metrics
 from population group by creator_code order by count(*) desc,jsonb_build_array(creator_code)::text limit 50) g),
'source',(select coalesce(jsonb_agg(jsonb_build_object('values',vals,'metrics',metrics) order by installs desc,vals::text),'[]'::jsonb)
 from (select jsonb_build_array(acquisition_source) as vals,count(*) as installs,jsonb_build_object(
'installs',count(*),'tracked',count(tracking_started_at),
'firstSeen',min(first_seen_at),'lastSeen',max(last_seen_at),
'activeDays',coalesce(sum(active_day_count),0),
'averageActiveDays',round(avg(active_day_count),2),'averageSessions',round(avg(total_session_count),2),
'd1',jsonb_build_object('eligible',count(*) filter(where d1_eligible),'retained',count(*) filter(where d1_eligible and d1_retained),
'pending',count(*) filter(where today <= cohort_date + 1),
'unavailable',count(*) filter(where today > cohort_date + 1 and not coalesce(d1_eligible,false)),
'percent',round(100.0*count(*) filter(where d1_eligible and d1_retained)/nullif(count(*) filter(where d1_eligible),0),2)),
'd7',jsonb_build_object('eligible',count(*) filter(where d7_eligible),'retained',count(*) filter(where d7_eligible and d7_retained),
'pending',count(*) filter(where today <= cohort_date + 7),
'unavailable',count(*) filter(where today > cohort_date + 7 and not coalesce(d7_eligible,false)),
'percent',round(100.0*count(*) filter(where d7_eligible and d7_retained)/nullif(count(*) filter(where d7_eligible),0),2)),
'd30',jsonb_build_object('eligible',count(*) filter(where d30_eligible),'retained',count(*) filter(where d30_eligible and d30_retained),
'pending',count(*) filter(where today <= cohort_date + 30),
'unavailable',count(*) filter(where today > cohort_date + 30 and not coalesce(d30_eligible,false)),
'percent',round(100.0*count(*) filter(where d30_eligible and d30_retained)/nullif(count(*) filter(where d30_eligible),0),2))) as metrics
 from population group by acquisition_source order by count(*) desc,jsonb_build_array(acquisition_source)::text limit 50) g),
'platform',(select coalesce(jsonb_agg(jsonb_build_object('values',vals,'metrics',metrics) order by installs desc,vals::text),'[]'::jsonb)
 from (select jsonb_build_array(platform) as vals,count(*) as installs,jsonb_build_object(
'installs',count(*),'tracked',count(tracking_started_at),
'firstSeen',min(first_seen_at),'lastSeen',max(last_seen_at),
'activeDays',coalesce(sum(active_day_count),0),
'averageActiveDays',round(avg(active_day_count),2),'averageSessions',round(avg(total_session_count),2),
'd1',jsonb_build_object('eligible',count(*) filter(where d1_eligible),'retained',count(*) filter(where d1_eligible and d1_retained),
'pending',count(*) filter(where today <= cohort_date + 1),
'unavailable',count(*) filter(where today > cohort_date + 1 and not coalesce(d1_eligible,false)),
'percent',round(100.0*count(*) filter(where d1_eligible and d1_retained)/nullif(count(*) filter(where d1_eligible),0),2)),
'd7',jsonb_build_object('eligible',count(*) filter(where d7_eligible),'retained',count(*) filter(where d7_eligible and d7_retained),
'pending',count(*) filter(where today <= cohort_date + 7),
'unavailable',count(*) filter(where today > cohort_date + 7 and not coalesce(d7_eligible,false)),
'percent',round(100.0*count(*) filter(where d7_eligible and d7_retained)/nullif(count(*) filter(where d7_eligible),0),2)),
'd30',jsonb_build_object('eligible',count(*) filter(where d30_eligible),'retained',count(*) filter(where d30_eligible and d30_retained),
'pending',count(*) filter(where today <= cohort_date + 30),
'unavailable',count(*) filter(where today > cohort_date + 30 and not coalesce(d30_eligible,false)),
'percent',round(100.0*count(*) filter(where d30_eligible and d30_retained)/nullif(count(*) filter(where d30_eligible),0),2))) as metrics
 from population group by platform order by count(*) desc,jsonb_build_array(platform)::text limit 50) g),
'creatorCampaign',(select coalesce(jsonb_agg(jsonb_build_object('values',vals,'metrics',metrics) order by installs desc,vals::text),'[]'::jsonb)
 from (select jsonb_build_array(creator_code,campaign_id,campaign_name,country_code) as vals,count(*) as installs,jsonb_build_object(
'installs',count(*),'tracked',count(tracking_started_at),
'firstSeen',min(first_seen_at),'lastSeen',max(last_seen_at),
'activeDays',coalesce(sum(active_day_count),0),
'averageActiveDays',round(avg(active_day_count),2),'averageSessions',round(avg(total_session_count),2),
'd1',jsonb_build_object('eligible',count(*) filter(where d1_eligible),'retained',count(*) filter(where d1_eligible and d1_retained),
'pending',count(*) filter(where today <= cohort_date + 1),
'unavailable',count(*) filter(where today > cohort_date + 1 and not coalesce(d1_eligible,false)),
'percent',round(100.0*count(*) filter(where d1_eligible and d1_retained)/nullif(count(*) filter(where d1_eligible),0),2)),
'd7',jsonb_build_object('eligible',count(*) filter(where d7_eligible),'retained',count(*) filter(where d7_eligible and d7_retained),
'pending',count(*) filter(where today <= cohort_date + 7),
'unavailable',count(*) filter(where today > cohort_date + 7 and not coalesce(d7_eligible,false)),
'percent',round(100.0*count(*) filter(where d7_eligible and d7_retained)/nullif(count(*) filter(where d7_eligible),0),2)),
'd30',jsonb_build_object('eligible',count(*) filter(where d30_eligible),'retained',count(*) filter(where d30_eligible and d30_retained),
'pending',count(*) filter(where today <= cohort_date + 30),
'unavailable',count(*) filter(where today > cohort_date + 30 and not coalesce(d30_eligible,false)),
'percent',round(100.0*count(*) filter(where d30_eligible and d30_retained)/nullif(count(*) filter(where d30_eligible),0),2))) as metrics
 from population group by creator_code,campaign_id,campaign_name,country_code order by count(*) desc,jsonb_build_array(creator_code,campaign_id,campaign_name,country_code)::text limit 50) g)
 )) into result;
 return result;
end
$report$;
revoke all on function public.float_retention_report(date,date,date,date,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.float_retention_report(date,date,date,date,text,text,text,text,text) to service_role;
notify pgrst,'reload schema';
commit;
