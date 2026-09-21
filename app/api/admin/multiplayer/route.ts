import {parseMultiplayerFilters} from '@/lib/multiplayer';
import {getMultiplayerReport} from '@/lib/multiplayer-server';
import {failure,json,token} from '@/lib/acquisition-server';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 try{const filters=parseMultiplayerFilters(new URL(request.url).searchParams);return json({report:await getMultiplayerReport(await token(),filters),filters,updatedAt:new Date().toISOString()});}
 catch(error){return failure(error);}
}
