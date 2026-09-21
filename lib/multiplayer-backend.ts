import { authUser, config } from './acquisition-backend.ts';
import { ReportError } from './acquisition.ts';
import { multiplayerArgs,type MultiplayerFilters } from './multiplayer.ts';
export async function getMultiplayerReport(token:string|undefined,filters:MultiplayerFilters,cfg=config(),fetcher=fetch){
 await authUser(token,cfg,fetcher);
 const headers:Record<string,string>={apikey:cfg.secret,'Content-Type':'application/json'};
 if(!cfg.secret.startsWith('sb_secret_'))headers.Authorization=`Bearer ${cfg.secret}`;
 const response=await fetcher(`${cfg.url}/rest/v1/rpc/float_multiplayer_report`,{method:'POST',headers,body:JSON.stringify(multiplayerArgs(filters)),cache:'no-store',signal:AbortSignal.timeout(25000)});
 if(!response.ok){
  let code='';try{code=(await response.json()).code;}catch{}
  if(['PGRST202','42P01','42883','42703'].includes(code))throw new ReportError(503,'Multiplayer setup required. Install app SQL 021, then website sql/multiplayer-reporting.sql.');
  throw new ReportError(502,'Multiplayer reporting is unavailable. Please retry.');
 }
 return response.json();
}
