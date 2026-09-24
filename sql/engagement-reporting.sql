-- Website-only manual reporting SQL. Prerequisite: existing mobile migrations 018–020.
-- Does not recreate mobile schema or call ingestion RPCs. Shared mobile sequence observed through 020.
begin;
create or replace function public.float_engagement_report(
 p_start date,p_end date,p_country text default null,p_platform text default null,
 p_campaign text default null,p_creator text default null,p_difficulty text default null,p_app_version text default null
) returns jsonb language plpgsql stable security invoker set search_path=pg_catalog as $report$
declare result jsonb;
begin
 if p_start is null or p_end is null or not isfinite(p_start) or not isfinite(p_end) or p_end<p_start or p_end-p_start>365 then
 raise exception 'Choose 1 to 366 calendar days' using errcode='22023'; end if;
 if exists(select 1 from unnest(array[p_country,p_platform,p_campaign,p_creator,p_difficulty,p_app_version]) v where length(v)>200 or v ~ '[[:cntrl:]]')
 or (p_country is not null and p_country !~ '^[A-Z]{2}$')
 or (p_difficulty is not null and p_difficulty not in ('standard','hard')) then
 raise exception 'Invalid filter' using errcode='22023'; end if;
 with selected as materialized (
 select g.attempt_id,g.install_id,g.started_at,g.mission_id,g.content_version,g.difficulty,g.outcome,
 g.active_gameplay_ms,g.duration_complete,g.restart_reason,
 a.country_code,a.campaign_id,a.campaign_name,a.creator_code
 from public.player_gameplay_attempts g left join public.player_acquisition a on a.install_id=g.install_id
 where g.mode='campaign' and g.started_at >= (p_start::timestamp at time zone 'UTC')
 and g.started_at < ((p_end+1)::timestamp at time zone 'UTC')
 and (p_country is null or a.country_code=p_country) and (p_platform is null or a.platform=p_platform)
 and (p_campaign is null or a.campaign_id=p_campaign or a.campaign_name=p_campaign)
 and (p_creator is null or a.creator_code=p_creator) and (p_difficulty is null or g.difficulty=p_difficulty)
 and (p_app_version is null or g.app_version=p_app_version)
 ), placements as materialized (
 select p.attempt_id,p.unit_type,p.phase from public.player_gameplay_placements p join selected s using(attempt_id)
 ), per_attempt as (
 select attempt_id,count(*) as placement_count from placements group by attempt_id
 ), scoped as materialized (
 select s.*,coalesce(p.placement_count,0) as placement_count from selected s left join per_attempt p using(attempt_id)
 ), daily as (
 select (started_at at time zone 'UTC')::date as report_date,count(*) as attempts,
 count(*) filter(where outcome='completed') as completed,count(*) filter(where outcome='failed') as failed,count(*) filter(where outcome='abandoned') as abandoned,count(*) filter(where outcome='unknown') as unknown,count(*) filter(where outcome='in_progress') as in_progress
 from scoped group by 1
 )
 select jsonb_build_object(
 'summary',(select jsonb_build_object('attempts',count(*),'installations',count(distinct install_id),
'completed',count(*) filter(where outcome='completed'),'failed',count(*) filter(where outcome='failed'),'abandoned',count(*) filter(where outcome='abandoned'),'unknown',count(*) filter(where outcome='unknown'),
'inProgress',count(*) filter(where outcome='in_progress'),
'decided',count(*) filter(where outcome in ('completed','failed','abandoned')),
'completionRate',round(100.0*count(*) filter(where outcome='completed')/nullif(count(*) filter(where outcome in ('completed','failed','abandoned')),0),2),
'averageActiveSeconds',round(avg(active_gameplay_ms) filter(where outcome='completed' and duration_complete and active_gameplay_ms is not null)/1000.0,2),
'durationSamples',count(*) filter(where outcome='completed' and duration_complete and active_gameplay_ms is not null),
 'totalActiveSeconds',round(sum(active_gameplay_ms)/1000.0,2),
 'playtimeSamples',count(active_gameplay_ms),
 'partialPlaytimeSamples',count(*) filter(where active_gameplay_ms is not null and duration_complete is not true),
 'missingPlaytimeSamples',count(*) filter(where active_gameplay_ms is null),
'retries',count(*) filter(where restart_reason='retry'),'restarts',count(*) filter(where restart_reason='restart'),'replays',count(*) filter(where restart_reason='replay'),
'placements',coalesce(sum(placement_count),0),'placingAttempts',count(*) filter(where placement_count>0),
'placementsPerPlacingAttempt',round(sum(placement_count)::numeric/nullif(count(*) filter(where placement_count>0),0),2)) from scoped),
 'daily',(select jsonb_agg(jsonb_build_object('day',d.report_date::text,'attempts',coalesce(c.attempts,0),
 'completed',coalesce(c.completed,0),'failed',coalesce(c.failed,0),'abandoned',coalesce(c.abandoned,0),
 'unknown',coalesce(c.unknown,0),'inProgress',coalesce(c.in_progress,0)) order by d.report_date)
 from (select p_start+i as report_date from generate_series(0,p_end-p_start) i) d left join daily c using(report_date)),
 'missions',(select coalesce(jsonb_agg(jsonb_build_object('values',vals,'metrics',metrics) order by attempts desc,vals::text),'[]'::jsonb)
 from (select jsonb_build_array(mission_id,content_version,difficulty) as vals,count(*) as attempts,jsonb_build_object('attempts',count(*),'installations',count(distinct install_id),
'completed',count(*) filter(where outcome='completed'),'failed',count(*) filter(where outcome='failed'),'abandoned',count(*) filter(where outcome='abandoned'),'unknown',count(*) filter(where outcome='unknown'),
'inProgress',count(*) filter(where outcome='in_progress'),
'decided',count(*) filter(where outcome in ('completed','failed','abandoned')),
'completionRate',round(100.0*count(*) filter(where outcome='completed')/nullif(count(*) filter(where outcome in ('completed','failed','abandoned')),0),2),
'averageActiveSeconds',round(avg(active_gameplay_ms) filter(where outcome='completed' and duration_complete and active_gameplay_ms is not null)/1000.0,2),
'durationSamples',count(*) filter(where outcome='completed' and duration_complete and active_gameplay_ms is not null),
 'totalActiveSeconds',round(sum(active_gameplay_ms)/1000.0,2),
 'playtimeSamples',count(active_gameplay_ms),
 'partialPlaytimeSamples',count(*) filter(where active_gameplay_ms is not null and duration_complete is not true),
 'missingPlaytimeSamples',count(*) filter(where active_gameplay_ms is null),
'retries',count(*) filter(where restart_reason='retry'),'restarts',count(*) filter(where restart_reason='restart'),'replays',count(*) filter(where restart_reason='replay'),
'placements',coalesce(sum(placement_count),0),'placingAttempts',count(*) filter(where placement_count>0),
'placementsPerPlacingAttempt',round(sum(placement_count)::numeric/nullif(count(*) filter(where placement_count>0),0),2)) as metrics from scoped
 group by mission_id,content_version,difficulty order by count(*) desc,jsonb_build_array(mission_id,content_version,difficulty)::text limit 50) g),
 'units',(select coalesce(jsonb_agg(jsonb_build_object('unit',unit_type,'phase',phase,'placements',placements,'attempts',attempts) order by placements desc,unit_type,phase),'[]'::jsonb)
 from (select unit_type,phase,count(*) as placements,count(distinct attempt_id) as attempts from placements group by unit_type,phase order by count(*) desc,unit_type,phase limit 50) u),
 'breakdowns',jsonb_build_object('country',(select coalesce(jsonb_agg(jsonb_build_object('values',vals,'metrics',metrics) order by attempts desc,vals::text),'[]'::jsonb)
 from (select jsonb_build_array(country_code) as vals,count(*) as attempts,jsonb_build_object('attempts',count(*),'installations',count(distinct install_id),
'completed',count(*) filter(where outcome='completed'),'failed',count(*) filter(where outcome='failed'),'abandoned',count(*) filter(where outcome='abandoned'),'unknown',count(*) filter(where outcome='unknown'),
'inProgress',count(*) filter(where outcome='in_progress'),
'decided',count(*) filter(where outcome in ('completed','failed','abandoned')),
'completionRate',round(100.0*count(*) filter(where outcome='completed')/nullif(count(*) filter(where outcome in ('completed','failed','abandoned')),0),2),
'averageActiveSeconds',round(avg(active_gameplay_ms) filter(where outcome='completed' and duration_complete and active_gameplay_ms is not null)/1000.0,2),
'durationSamples',count(*) filter(where outcome='completed' and duration_complete and active_gameplay_ms is not null),
 'totalActiveSeconds',round(sum(active_gameplay_ms)/1000.0,2),
 'playtimeSamples',count(active_gameplay_ms),
 'partialPlaytimeSamples',count(*) filter(where active_gameplay_ms is not null and duration_complete is not true),
 'missingPlaytimeSamples',count(*) filter(where active_gameplay_ms is null),
'retries',count(*) filter(where restart_reason='retry'),'restarts',count(*) filter(where restart_reason='restart'),'replays',count(*) filter(where restart_reason='replay'),
'placements',coalesce(sum(placement_count),0),'placingAttempts',count(*) filter(where placement_count>0),
'placementsPerPlacingAttempt',round(sum(placement_count)::numeric/nullif(count(*) filter(where placement_count>0),0),2)) as metrics from scoped
 group by country_code order by count(*) desc,jsonb_build_array(country_code)::text limit 50) g),'campaign',(select coalesce(jsonb_agg(jsonb_build_object('values',vals,'metrics',metrics) order by attempts desc,vals::text),'[]'::jsonb)
 from (select jsonb_build_array(campaign_id,campaign_name) as vals,count(*) as attempts,jsonb_build_object('attempts',count(*),'installations',count(distinct install_id),
'completed',count(*) filter(where outcome='completed'),'failed',count(*) filter(where outcome='failed'),'abandoned',count(*) filter(where outcome='abandoned'),'unknown',count(*) filter(where outcome='unknown'),
'inProgress',count(*) filter(where outcome='in_progress'),
'decided',count(*) filter(where outcome in ('completed','failed','abandoned')),
'completionRate',round(100.0*count(*) filter(where outcome='completed')/nullif(count(*) filter(where outcome in ('completed','failed','abandoned')),0),2),
'averageActiveSeconds',round(avg(active_gameplay_ms) filter(where outcome='completed' and duration_complete and active_gameplay_ms is not null)/1000.0,2),
'durationSamples',count(*) filter(where outcome='completed' and duration_complete and active_gameplay_ms is not null),
 'totalActiveSeconds',round(sum(active_gameplay_ms)/1000.0,2),
 'playtimeSamples',count(active_gameplay_ms),
 'partialPlaytimeSamples',count(*) filter(where active_gameplay_ms is not null and duration_complete is not true),
 'missingPlaytimeSamples',count(*) filter(where active_gameplay_ms is null),
'retries',count(*) filter(where restart_reason='retry'),'restarts',count(*) filter(where restart_reason='restart'),'replays',count(*) filter(where restart_reason='replay'),
'placements',coalesce(sum(placement_count),0),'placingAttempts',count(*) filter(where placement_count>0),
'placementsPerPlacingAttempt',round(sum(placement_count)::numeric/nullif(count(*) filter(where placement_count>0),0),2)) as metrics from scoped
 group by campaign_id,campaign_name order by count(*) desc,jsonb_build_array(campaign_id,campaign_name)::text limit 50) g),'creator',(select coalesce(jsonb_agg(jsonb_build_object('values',vals,'metrics',metrics) order by attempts desc,vals::text),'[]'::jsonb)
 from (select jsonb_build_array(creator_code) as vals,count(*) as attempts,jsonb_build_object('attempts',count(*),'installations',count(distinct install_id),
'completed',count(*) filter(where outcome='completed'),'failed',count(*) filter(where outcome='failed'),'abandoned',count(*) filter(where outcome='abandoned'),'unknown',count(*) filter(where outcome='unknown'),
'inProgress',count(*) filter(where outcome='in_progress'),
'decided',count(*) filter(where outcome in ('completed','failed','abandoned')),
'completionRate',round(100.0*count(*) filter(where outcome='completed')/nullif(count(*) filter(where outcome in ('completed','failed','abandoned')),0),2),
'averageActiveSeconds',round(avg(active_gameplay_ms) filter(where outcome='completed' and duration_complete and active_gameplay_ms is not null)/1000.0,2),
'durationSamples',count(*) filter(where outcome='completed' and duration_complete and active_gameplay_ms is not null),
 'totalActiveSeconds',round(sum(active_gameplay_ms)/1000.0,2),
 'playtimeSamples',count(active_gameplay_ms),
 'partialPlaytimeSamples',count(*) filter(where active_gameplay_ms is not null and duration_complete is not true),
 'missingPlaytimeSamples',count(*) filter(where active_gameplay_ms is null),
'retries',count(*) filter(where restart_reason='retry'),'restarts',count(*) filter(where restart_reason='restart'),'replays',count(*) filter(where restart_reason='replay'),
'placements',coalesce(sum(placement_count),0),'placingAttempts',count(*) filter(where placement_count>0),
'placementsPerPlacingAttempt',round(sum(placement_count)::numeric/nullif(count(*) filter(where placement_count>0),0),2)) as metrics from scoped
 group by creator_code order by count(*) desc,jsonb_build_array(creator_code)::text limit 50) g))
 ) into result;
 return result;
end $report$;
revoke all on function public.float_engagement_report(date,date,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.float_engagement_report(date,date,text,text,text,text,text,text) to service_role;
notify pgrst,'reload schema';
commit;
