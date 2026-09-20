// Application access is through the server-only wrapper.
import { authUser, config } from "./acquisition-backend.ts";
import { ReportError } from "./acquisition.ts";
import { engagementArgs, type EngagementFilters } from "./engagement.ts";
export async function getEngagementReport(token: string | undefined, filters: EngagementFilters, cfg = config(), fetcher = fetch) {
  await authUser(token, cfg, fetcher);
  const headers: Record<string, string> = { apikey: cfg.secret, "Content-Type": "application/json" };
  if (!cfg.secret.startsWith("sb_secret_")) headers.Authorization = `Bearer ${cfg.secret}`;
  const response = await fetcher(`${cfg.url}/rest/v1/rpc/float_engagement_report`, { method: "POST", headers, body: JSON.stringify(engagementArgs(filters)), cache: "no-store", signal: AbortSignal.timeout(25000) });
  if (!response.ok) {
    let code = "";
    try { code = (await response.json()).code; } catch { /* Do not reflect database messages. */ }
    if (["PGRST202", "42P01", "42883", "42703"].includes(code)) throw new ReportError(503, "Engagement setup required. See docs/engagement.md for the website reporting SQL and backend prerequisites.");
    throw new ReportError(502, "Engagement reporting is unavailable. Please retry.");
  }
  return response.json();
}
