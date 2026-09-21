-- Website reporting only. Run after float-app 021_multiplayer_analytics.sql.
begin;
create or replace function public.float_multiplayer_report(p_start date,p_end date,p_country text default null,p_platform text default null,p_region text default null,p_app_version text default null)
returns jsonb language plpgsql stable security invoker set search_path=pg_catalog as $$
declare report_result jsonb;
begin
 if p_start is null or p_end is null or not isfinite(p_start) or not isfinite(p_end) or p_end<p_start or p_end-p_start>365 then
 raise exception 'Choose 1 to 366 calendar days' using errcode='22023';end if;
 if exists(select 1 from unnest(array[p_country,p_platform,p_region,p_app_version]) v where length(v)>100 or v ~ '[[:cntrl:]]')
 or (p_country is not null and p_country !~ '^[A-Z]{2}$') or (p_platform is not null and p_platform not in ('ios','android','web')) then
 raise exception 'Invalid multiplayer filter' using errcode='22023';end if;
 with participants as materialized (
 select * from public.multiplayer_participant_reporting
 where started_at >= p_start::timestamp at time zone 'UTC' and started_at < (p_end+1)::timestamp at time zone 'UTC'
 and (p_country is null or locale_country_code=p_country) and (p_platform is null or platform=p_platform)
 and (p_region is null or server_region=p_region) and (p_app_version is null or app_version=p_app_version)
 ), matches as materialized (
 select m.* from public.ranked_matches m where started_at>=p_start::timestamp at time zone 'UTC' and started_at<(p_end+1)::timestamp at time zone 'UTC'
 and ((p_country is null and p_platform is null and p_region is null and p_app_version is null)
 or exists(select 1 from participants p where p.match_id=m.id))
 ), queues as materialized (
 select * from public.multiplayer_queue_reporting
 where started_at>=p_start::timestamp at time zone 'UTC' and started_at<(p_end+1)::timestamp at time zone 'UTC'
 and (p_country is null or locale_country_code=p_country) and (p_platform is null or platform=p_platform)
 and (p_region is null or server_region=p_region) and (p_app_version is null or app_version=p_app_version)
 ), days as (select p_start+i as day from generate_series(0,p_end-p_start) i), daily as (
 select (started_at at time zone 'UTC')::date as day,count(*) as matches,count(*) filter(where result in ('a_win','b_win','draw')) as completed from matches group by 1
 )
 select jsonb_build_object(
 'matches',(select jsonb_build_object('total',count(*),'completed',count(*) filter(where result in ('a_win','b_win','draw')),
 'pending',count(*) filter(where result is null),'void',count(*) filter(where result='void'),
 'draws',count(*) filter(where result='draw'),'surrenders',count(*) filter(where end_reason='surrender'),
 'timeoutForfeits',count(*) filter(where end_reason='reconnect_timeout'),
 'serverFailureVoids',count(*) filter(where result='void' and end_reason='server_failure')) from matches),
 'queues',(select jsonb_build_object('total',count(*),'matched',count(*) filter(where outcome='matched'),
 'cancelled',count(*) filter(where outcome='cancelled'),'timedOut',count(*) filter(where outcome='timed_out'),
 'failed',count(*) filter(where outcome='failed'),'unknown',count(*) filter(where outcome='unknown'),
 'unresolved',count(*) filter(where outcome='unresolved'),
 'averageMatchedSeconds',avg(wait_seconds) filter(where outcome='matched'),
 'waitSamples',count(wait_seconds) filter(where outcome='matched')) from queues),
 'participants',(select jsonb_build_object('total',count(*),'observedMatches',count(distinct match_id),
 'wins',count(*) filter(where player_result='win'),'losses',count(*) filter(where player_result='loss'),
 'draws',count(*) filter(where player_result='draw'),'disconnects',coalesce(sum(disconnects),0),'reconnects',coalesce(sum(reconnects),0),
 'latencySamples',coalesce(sum(latency_samples),0),'measuredParticipants',count(*) filter(where latency_samples>0),
 'averageRttMs',sum(total_ms)::numeric/nullif(sum(latency_samples),0),'maximumRttMs',max(max_ms)) from participants),
 'daily',(select jsonb_agg(jsonb_build_object('day',d.day,'matches',coalesce(x.matches,0),'completed',coalesce(x.completed,0)) order by d.day) from days d left join daily x using(day)),
 'regions',(select coalesce(jsonb_agg(to_jsonb(r) order by r.participants desc,r.region nulls last),'[]'::jsonb) from (
 select server_region as region,count(*) as participants,count(distinct match_id) as matches,
 coalesce(sum(disconnects),0) as disconnects,coalesce(sum(latency_samples),0) as samples,
 sum(total_ms)::numeric/nullif(sum(latency_samples),0) as average_rtt_ms
 from participants group by server_region order by count(*) desc,server_region nulls last limit 50) r),
 'opponents',(select coalesce(jsonb_agg(to_jsonb(o) order by o.participants desc,o.country nulls last,o.opponent nulls last),'[]'::jsonb) from (
 select locale_country_code as country,opponent_locale_country_code as opponent,count(*) as participants,
 count(*) filter(where player_result='win') as wins,count(*) filter(where player_result='loss') as losses,
 count(*) filter(where player_result='draw') as draws from participants group by locale_country_code,opponent_locale_country_code
 order by count(*) desc,locale_country_code nulls last,opponent_locale_country_code nulls last limit 50) o)
 ) into report_result;
 return report_result;
end $$;
revoke all on function public.float_multiplayer_report(date,date,text,text,text,text) from public,anon,authenticated;
grant execute on function public.float_multiplayer_report(date,date,text,text,text,text) to service_role;
notify pgrst,'reload schema';
commit;
