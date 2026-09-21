import { dateRange, parseFilters, ReportError } from './acquisition.ts';
export type MultiplayerFilters = {start:string;end:string;country:string;platform:string;region:string;appVersion:string};
export function defaultMultiplayerFilters():MultiplayerFilters {
 const {start,end}=dateRange(30);return {start,end,country:'',platform:'',region:'',appVersion:''};
}
export function parseMultiplayerFilters(params:URLSearchParams):MultiplayerFilters {
 const f=defaultMultiplayerFilters();
 for(const key of params.keys())if(!Object.hasOwn(f,key)||params.getAll(key).length!==1)throw new ReportError(400,'Invalid multiplayer filters.');
 for(const key of Object.keys(f) as (keyof MultiplayerFilters)[])f[key]=params.get(key)?.trim()??f[key];
 f.country=parseFilters(new URLSearchParams({start:f.start,end:f.end,country:f.country})).country;
 if(!['','ios','android','web'].includes(f.platform)||[f.region,f.appVersion].some(v=>v.length>100||/[\x00-\x1f\x7f]/.test(v)))throw new ReportError(400,'Invalid platform, server region or version.');
 return f;
}
export function multiplayerArgs(f:MultiplayerFilters){return {p_start:f.start,p_end:f.end,p_country:f.country||null,p_platform:f.platform||null,p_region:f.region||null,p_app_version:f.appVersion||null};}
export type MultiplayerReport={
 matches:{total:number;completed:number;pending:number;void:number;draws:number;surrenders:number;timeoutForfeits:number;serverFailureVoids:number};
 queues:{total:number;matched:number;cancelled:number;timedOut:number;failed:number;unknown:number;unresolved:number;averageMatchedSeconds:number|null;waitSamples:number};
 participants:{total:number;observedMatches:number;wins:number;losses:number;draws:number;disconnects:number;reconnects:number;latencySamples:number;measuredParticipants:number;averageRttMs:number|null;maximumRttMs:number|null};
 daily:{day:string;matches:number;completed:number}[];
 regions:{region:string|null;participants:number;matches:number;disconnects:number;samples:number;average_rtt_ms:number|null}[];
 opponents:{country:string|null;opponent:string|null;participants:number;wins:number;losses:number;draws:number}[];
};
