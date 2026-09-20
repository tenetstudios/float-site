// Imported only through acquisition-server.ts in the application.
import { ReportError, rpcArgs, type Filters } from "./acquisition.ts";

export function config(env = process.env) {
  const url = env.SUPABASE_URL?.replace(/\/$/, "");
  const publicKey = env.SUPABASE_PUBLISHABLE_KEY;
  const secret = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  const admins = (env.FLOAT_ADMIN_USER_IDS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!url || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) || !publicKey || !secret || !admins.length || admins.some(id => !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(id))) throw new ReportError(503, "Admin reporting is not configured. Follow docs/acquisition.md.");
  return { url, publicKey, secret, admins };
}
export async function authUser(token: string | undefined, cfg = config(), fetcher = fetch) {
  if (!token) throw new ReportError(401, "Sign in to view acquisition reports.");
  const response = await fetcher(`${cfg.url}/auth/v1/user`, { headers: { apikey: cfg.publicKey, Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(15000) });
  if ([401, 403].includes(response.status)) throw new ReportError(401, "Your session expired. Please sign in again.");
  if (!response.ok) throw new ReportError(502, "Sign-in verification is unavailable. Try again.");
  const user = await response.json();
  if (typeof user.id !== "string" || !cfg.admins.includes(user.id.toLowerCase())) throw new ReportError(403, "This account is not authorized to view acquisition reports.");
  return user.id as string;
}
export async function getReport(token: string | undefined, filters: Filters, cfg = config(), fetcher = fetch) {
  await authUser(token, cfg, fetcher);
  const headers: Record<string, string> = { apikey: cfg.secret, "Content-Type": "application/json" };
  // Modern secret keys belong only in apikey; legacy service-role keys are JWTs.
  if (!cfg.secret.startsWith("sb_secret_")) headers.Authorization = `Bearer ${cfg.secret}`;
  const response = await fetcher(`${cfg.url}/rest/v1/rpc/float_acquisition_report`, { method: "POST", headers, body: JSON.stringify(rpcArgs(filters)), cache: "no-store", signal: AbortSignal.timeout(25000) });
  if (!response.ok) throw new ReportError(502, "The acquisition report could not be loaded. Check database setup and try again.");
  return response.json();
}
