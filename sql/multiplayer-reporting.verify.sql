-- Run as postgres after reporting SQL. All fixtures roll back.
begin;
do $$
declare a uuid:=gen_random_uuid();b uuid:=gen_random_uuid();m uuid;q uuid; i integer; r jsonb; tag text:='verify_'||gen_random_uuid()::text;
begin
 insert into auth.users(id) values(a),(b);
 insert into public.profiles(id) values(a),(b) on conflict do nothing;
 for i in 1..1200 loop
  m:=gen_random_uuid();
  insert into public.ranked_matches(id,player_a,player_b,started_at,completed_at,result,rating_a_before,rating_a_after,rating_b_before,rating_b_after,end_reason)
  values(m,a,b,'2026-01-01 00:00:00+00','2026-01-01 00:01:00+00','a_win',1000,1016,1000,984,'normal');
  insert into public.multiplayer_analytics_events(event_id,kind,occurred_at,user_id,match_id,server_region,country_code,platform,app_version,receipt)
  values(gen_random_uuid(),'participant',now(),a,m,tag,'CA','ios','1','{}'),(gen_random_uuid(),'participant',now(),b,m,tag,'BR','android','2','{}');
  insert into public.multiplayer_analytics_events(event_id,kind,occurred_at,user_id,match_id,sample_count,total_rtt_ms,max_rtt_ms,receipt)
  values(gen_random_uuid(),'latency',now(),a,m,2,100,60,'{}'),(gen_random_uuid(),'latency',now(),a,m,1,200,200,'{}');
 end loop;
 -- Outside the inclusive end date; same metadata must not leak into totals.
 m:=gen_random_uuid();
 insert into public.ranked_matches(id,player_a,player_b,started_at)values(m,a,b,'2026-01-02 00:00:00+00');
 insert into public.multiplayer_analytics_events(event_id,kind,occurred_at,user_id,match_id,server_region,receipt) values(gen_random_uuid(),'participant',now(),a,m,tag,'{}');
 for i in 1..2 loop
  q:=gen_random_uuid();
  insert into public.multiplayer_analytics_events(event_id,kind,occurred_at,user_id,queue_id,server_region,receipt)
  values(gen_random_uuid(),'queue_start','2026-01-01 00:00:00+00',a,q,tag,'{}');
  insert into public.multiplayer_analytics_events(event_id,kind,occurred_at,user_id,queue_id,match_id,server_region,outcome,receipt)
  values(gen_random_uuid(),'queue_end','2026-01-01 00:00:00+00'::timestamptz+case when i=1 then interval '10 seconds' else interval '60 seconds' end,a,q,case when i=1 then m else null end,tag,case when i=1 then 'matched' else 'cancelled' end,'{}');
 end loop;
 perform set_config('TimeZone','America/Toronto',true);
 r:=public.float_multiplayer_report('2026-01-01','2026-01-01',null,null,tag);
 assert (r#>>'{matches,total}')::int=1200,'complete distinct matches and UTC bounds';
 assert (r#>>'{participants,total}')::int=2400,'participants not multiplied by latency windows';
 assert (r#>>'{participants,averageRttMs}')::numeric=100,'weighted latency';
 assert (r#>>'{participants,latencySamples}')::int=3600;
 assert (r#>>'{participants,wins}')::int=1200 and (r#>>'{participants,losses}')::int=1200;
 assert (r#>>'{queues,averageMatchedSeconds}')::numeric=10,'cancelled waits excluded';
 r:=public.float_multiplayer_report('2026-01-01','2026-01-01','BR','android',tag,'2');
 assert (r#>>'{matches,total}')::int=1200 and (r#>>'{participants,total}')::int=1200;
 assert r#>'{participants,averageRttMs}'='null'::jsonb,'unmeasured is not zero';
 r:=public.float_multiplayer_report('2026-01-01','2026-01-01','CA','android',tag);
 assert (r#>>'{matches,total}')::int=0 and jsonb_array_length(r->'regions')=0;
 assert not has_function_privilege('anon','public.float_multiplayer_report(date,date,text,text,text,text)','EXECUTE');
 assert not has_function_privilege('authenticated','public.float_multiplayer_report(date,date,text,text,text,text)','EXECUTE');
end $$;
rollback;
