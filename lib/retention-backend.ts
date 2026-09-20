// Application imports this only through the server-only module below.
import { authUser, config } from "./acquisition-backend.ts";
import { ReportError } from "./acquisition.ts";
import { retentionArgs, type RetentionFilters } from "./retention.ts";
export async function getRetentionReport(token: string | undefined, filters: RetentionFilters, cfg = config(), fetcher = fetch) {
  await authUser(token, cfg, fetcher);
  const headers: Record<string, string> = { apikey: cfg.secret, "Content-Type": "application/json" };
  if (!cfg.secret.startsWith("sb_secret_")) headers.Authorization = `Bearer ${cfg.secret}`;
  const response = await fetcher(`${cfg.url}/rest/v1/rpc/float_retention_report`, { method: "POST", headers, body: JSON.stringify(retentionArgs(filters)), cache: "no-store", signal: AbortSignal.timeout(25000) });
  if (!response.ok) {
    let code = "";
    try { code = (await response.json()).code; } catch { /* Never reflect upstream error details. */ }
    if (["PGRST202", "42P01", "42883", "42703"].includes(code)) throw new ReportError(503, "Retention setup required. Install the mobile retention backend and website reporting SQL described in docs/retention.md.");
    throw new ReportError(502, "Retention reporting is unavailable. Please retry.");
  }
  return response.json();
}
