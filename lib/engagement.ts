import { dateRange, parseFilters, ReportError } from "./acquisition.ts";
export type EngagementFilters = { start: string; end: string; country: string; platform: string; campaign: string; creator: string; difficulty: string; appVersion: string };
export function defaultEngagementFilters(): EngagementFilters {
  const { start, end } = dateRange(30);
  return { start, end, country: "", platform: "", campaign: "", creator: "", difficulty: "", appVersion: "" };
}
export function parseEngagementFilters(params: URLSearchParams): EngagementFilters {
  const f = defaultEngagementFilters();
  for (const key of params.keys()) if (!Object.hasOwn(f, key) || params.getAll(key).length !== 1) throw new ReportError(400, "Invalid engagement filters.");
  for (const key of Object.keys(f) as (keyof EngagementFilters)[]) f[key] = params.get(key)?.trim() ?? f[key];
  const common = parseFilters(new URLSearchParams({ start: f.start, end: f.end, country: f.country, platform: f.platform, campaign: f.campaign, creator: f.creator }));
  f.country = common.country;
  if (!["", "standard", "hard"].includes(f.difficulty) || f.appVersion.length > 200 || /[\x00-\x1f\x7f]/.test(f.appVersion)) throw new ReportError(400, "Invalid difficulty or app version.");
  return f;
}
export function engagementArgs(f: EngagementFilters) {
  return { p_start: f.start, p_end: f.end, p_country: f.country || null, p_platform: f.platform || null, p_campaign: f.campaign || null, p_creator: f.creator || null, p_difficulty: f.difficulty || null, p_app_version: f.appVersion || null };
}
export type EngagementMetrics = { attempts: number; installations: number; completed: number; failed: number; abandoned: number; unknown: number; inProgress: number; decided: number; completionRate: number | null; averageActiveSeconds: number | null; durationSamples: number; totalActiveSeconds: number | null; playtimeSamples: number; partialPlaytimeSamples: number; missingPlaytimeSamples: number; retries: number; restarts: number; replays: number; placements: number; placingAttempts: number; placementsPerPlacingAttempt: number | null };
export type EngagementGroup = { values: (string | null)[]; metrics: EngagementMetrics };
export type EngagementReport = { summary: EngagementMetrics; daily: { day: string; attempts: number; completed: number; failed: number; abandoned: number; unknown: number; inProgress: number }[]; missions: EngagementGroup[]; units: { unit: string; phase: string; placements: number; attempts: number }[]; breakdowns: { country: EngagementGroup[]; campaign: EngagementGroup[]; creator: EngagementGroup[] } };
export const unitLabels: Record<string, string> = { wall: "Wall", nails: "Nails", glue: "Glue", "frog:level1": "Level 1 frog", "frog:quick": "Quick frog", "frog:spotter": "Spotter frog", "frog:sniper": "Sniper frog", "frog:flak": "Flak frog", "frog:rocket": "Rocket frog", "frog:antiAircraft": "Anti-aircraft frog", "frog:twin": "Twin frog", "frog:tactical": "Tactical frog", "frog:armoured": "Armoured frog" };

// Reporting RPC values are already seconds, not milliseconds.
export function formatEngagementDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return "\u2014";
  const rounded = Math.round(seconds);
  return `${Math.floor(rounded / 60)}m ${String(rounded % 60).padStart(2, "0")}s`;
}

// Totals can span many hours; keep the completed-attempt average formatter unchanged.
export function formatEngagementPlaytime(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return "\u2014";
  const rounded = Math.round(seconds);
  if (rounded < 3600) return formatEngagementDuration(seconds);
  return `${Math.floor(rounded / 3600)}h ${String(Math.floor(rounded % 3600 / 60)).padStart(2, "0")}m ${String(rounded % 60).padStart(2, "0")}s`;
}
