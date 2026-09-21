"use client";
import {useEffect,useState} from 'react';
import {defaultMultiplayerFilters,type MultiplayerFilters,type MultiplayerReport} from '@/lib/multiplayer';
import {formatEngagementDuration} from '@/lib/engagement';
import styles from './acquisition/dashboard.module.css';
const number=(v:number|null)=>v===null?'—':v.toLocaleString('en-US',{maximumFractionDigits:1});
const ms=(v:number|null)=>v===null?'—':`${number(v)} ms`;
function Table({title,labels,rows}:{title:string;labels:string[];rows:(string|number)[][]}){
 return <section className={styles.panel}><h2>{title}</h2><div className={styles.tableScroll} role="region" aria-label={title} tabIndex={0}><table><thead><tr>{labels.map(l=><th key={l} scope="col">{l}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((v,j)=><td key={j}>{typeof v==='number'?number(v):v}</td>)}</tr>)}</tbody></table></div>{!rows.length&&<p>No matching observations.</p>}</section>;
}
export default function MultiplayerPanel({onUnauthorized}:{onUnauthorized:()=>void}){
 const [draft,setDraft]=useState(defaultMultiplayerFilters),[filters,setFilters]=useState(defaultMultiplayerFilters);
 const [refresh,setRefresh]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [result,setResult]=useState<{query:string;report:MultiplayerReport;updatedAt:string}|null>(null);
 const query=new URLSearchParams(filters).toString();
 useEffect(()=>{
  let disposed=false,active:AbortController|null=null;
  async function load(){
   if(disposed||active||document.visibilityState!=='visible')return;
   const controller=new AbortController();active=controller;const timeout=setTimeout(()=>controller.abort(),45000);
   setBusy(true);setError('');
   try{
    const response=await fetch(`/api/admin/multiplayer?${query}`,{cache:'no-store',signal:controller.signal});const body=await response.json();
    if(disposed)return;
    if([401,403].includes(response.status)){onUnauthorized();return;}
    if(!response.ok){if(response.status===503)setResult(null);throw Error(body.error||'Multiplayer reporting is unavailable.');}
    setResult({query,report:body.report,updatedAt:body.updatedAt});
   }catch(e){if(!disposed)setError(e instanceof Error&&e.name!=='AbortError'?e.message:'Multiplayer request timed out. Please retry.');}
   finally{clearTimeout(timeout);active=null;if(!disposed)setBusy(false);}
  }
  void load();const timer=setInterval(()=>void load(),60000);const visible=()=>{if(document.visibilityState==='visible')void load();};document.addEventListener('visibilitychange',visible);
  return()=>{disposed=true;active?.abort();clearInterval(timer);document.removeEventListener('visibilitychange',visible);};
 },[query,refresh,onUnauthorized]);
 const report=result?.query===query?result.report:null;
 const set=(key:keyof MultiplayerFilters,value:string)=>setDraft(f=>({...f,[key]:value}));
 return <div data-multiplayer-panel>
  <p className={styles.muted}>Ranked only. Casual and friend matches are not included.</p>
  <form className={styles.panel} onSubmit={e=>{e.preventDefault();setFilters({...draft});setRefresh(n=>n+1);}}><h2>Multiplayer filters · UTC</h2><div className={styles.filters}>
   {(['start','end'] as const).map(k=><label key={k}>{k==='start'?'Start date':'Through (inclusive)'}<input type="date" required value={draft[k]} onChange={e=>set(k,e.target.value)}/></label>)}
   <label>Platform<select value={draft.platform} onChange={e=>set('platform',e.target.value)}><option value="">All</option>{['ios','android','web'].map(p=><option key={p}>{p}</option>)}</select></label>
   {([['country','Player country (device locale)'],['region','Server region'],['appVersion','App version']] as const).map(([k,label])=><label key={k}>{label}<input value={draft[k]} maxLength={k==='country'?2:100} placeholder="All" onChange={e=>set(k,e.target.value)}/></label>)}
   </div><div className={styles.actions}><button type="submit">Apply multiplayer filters</button><button type="button" disabled={busy} onClick={()=>setRefresh(n=>n+1)}>Refresh multiplayer</button></div></form>
  <div className={styles.status} role="status"><span>{busy?'Loading multiplayer…':'Refreshes every 60 seconds while visible and open'}</span><span>Last updated: {result?.query===query?new Date(result.updatedAt).toISOString().replace('T',' ').slice(0,19)+' UTC':'Not yet loaded'}</span></div>
  {error&&<div className={styles.error} role="alert"><p>{error}</p><button disabled={busy} onClick={()=>setRefresh(n=>n+1)}>Retry multiplayer</button></div>}
  {report&&<div aria-busy={busy}>
   {error&&<p className={styles.stale}>Showing the last successful multiplayer report. These figures may be out of date.</p>}
   <p className={styles.period}>Queue starts and match starts: {filters.start} through {filters.end} UTC, inclusive.</p>
   {!report.matches.total&&!report.queues.total&&<p className={styles.empty}>No ranked matches or queue observations match these filters.</p>}
   <section className={styles.cards} aria-label="Multiplayer summary">{[
    ['Ranked matches',number(report.matches.total)],['Completed matches',number(report.matches.completed)],
    ['Queue attempts observed',number(report.queues.total)],['Average matched wait',formatEngagementDuration(report.queues.averageMatchedSeconds)],
    ['Disconnects observed',number(report.participants.disconnects)],['Reconnects observed',number(report.participants.reconnects)],
    ['Average round-trip latency',ms(report.participants.averageRttMs)],['Surrenders',number(report.matches.surrenders)],['Timeout forfeits',number(report.matches.timeoutForfeits)]
   ].map(([label,value])=><section key={label} className={styles.panel}><h2>{label}</h2><strong className={styles.engagementValue}>{value}</strong></section>)}</section>
   <p className={styles.period}>Telemetry covers {number(report.participants.observedMatches)} of {number(report.matches.total)} selected matches · {number(report.participants.total)} participant observations · {number(report.queues.waitSamples)} matched wait samples · {number(report.participants.latencySamples)} RTT samples from {number(report.participants.measuredParticipants)} participants · Maximum RTT: {ms(report.participants.maximumRttMs)}</p>
   <Table title="Queue outcomes" labels={['Outcome','Attempts']} rows={[
    ['Matched',report.queues.matched],['Cancelled',report.queues.cancelled],['Reservation expired',report.queues.timedOut],['Failed',report.queues.failed],['Unknown end',report.queues.unknown],['Unresolved',report.queues.unresolved]]}/>
   <Table title="Ranked match outcomes" labels={['Outcome','Matches']} rows={[
    ['Completed',report.matches.completed],['Draws (included in completed)',report.matches.draws],['Pending',report.matches.pending],['Void',report.matches.void],['Server-failure classification (included in void)',report.matches.serverFailureVoids]]}/>
   <Table title="Observed participant record in this date range" labels={['Wins','Losses','Draws']} rows={[[report.participants.wins,report.participants.losses,report.participants.draws]]}/>
   <p className={styles.muted}>These are participant outcomes, not lifetime player records. One decisive match normally contributes one win and one loss; player filters can select only one side.</p>
   <Table title="Ranked matches by day" labels={['UTC match-start date','Matches','Completed']} rows={report.daily.map(d=>[d.day,d.matches,d.completed])}/>
   <Table title="Server regions · top 50 by observed participants" labels={['Server region','Observed matches','Participants','Disconnects','RTT samples','Average RTT']} rows={report.regions.map(r=>[r.region??'Unknown',r.matches,r.participants,r.disconnects,r.samples,ms(r.average_rtt_ms)])}/>
   <Table title="Opponent countries · device-locale estimates · top 50" labels={['Player country','Opponent country','Participants','Wins','Losses','Draws']} rows={report.opponents.map(r=>[r.country??'Unknown',r.opponent??'Unknown',r.participants,r.wins,r.losses,r.draws])}/>
  </div>}
  <section className={styles.panel}><h2>Faction and unavailable metrics</h2><p>Faction: both attack and defense. Ranked sides A/B do not identify Lion/Frog factions.</p><p>Opponent geographic region: unavailable. Device-locale countries are estimates, not verified locations.</p><p>Rematch rate: unavailable until explicit rematch offers and responses are tracked.</p></section>
  <footer className={styles.notes}><p>Match totals include historical matches without telemetry when no participant filters are selected. Country, platform, server region and app-version filters restrict matches to those with a matching observed participant. Queue filters apply independently at queue start.</p><p>Wait averages include matched queues with measured durations only. RTT is weighted by sample count; missing responses are not zero or packet loss. Observed disconnect counts do not prove complete coverage. Server-failure voids can include both players disconnecting and do not establish a hosting outage. Late uploads and settlement can revise history.</p></footer>
 </div>;
}
