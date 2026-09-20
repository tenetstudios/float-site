import { dateRange, parseFilters, ReportError } from "./acquisition.ts";
export type RetentionFilters = { start: string; end: string; activityStart: string; activityEnd: string; country: string; campaign: string; creator: string; source: string; platform: string };
export function defaultRetentionFilters(): RetentionFilters {
  const f = dateRange(30);
  return { start: f.start, end: f.end, activityStart: f.start, activityEnd: f.end, country: "", campaign: "", creator: "", source: "", platform: "" };
}
export function parseRetentionFilters(params: URLSearchParams): RetentionFilters {
  const f = defaultRetentionFilters();
  for (const key of params.keys()) {
    if (!Object.hasOwn(f, key) || params.getAll(key).length !== 1) throw new ReportError(400, "Invalid retention filters.");
  }
  for (const key of Object.keys(f) as (keyof RetentionFilters)[]) f[key] = params.get(key)?.trim() ?? f[key];
  const common = parseFilters(new URLSearchParams({ start: f.start, end: f.end, country: f.country, campaign: f.campaign, creator: f.creator, platform: f.platform }));
  parseFilters(new URLSearchParams({ start: f.activityStart, end: f.activityEnd }));
  if (f.source.length > 200 || /[\x00-\x1f\x7f]/.test(f.source)) throw new ReportError(400, "Invalid source filter.");
  f.country = common.country;
  return f;
}
export function retentionArgs(f: RetentionFilters) {
  return { p_start: f.start, p_end: f.end, p_activity_start: f.activityStart, p_activity_end: f.activityEnd,
    p_country: f.country || null, p_campaign: f.campaign || null, p_creator: f.creator || null, p_source: f.source || null, p_platform: f.platform || null };
}
export type RetentionRate = { eligible: number; retained: number; pending: number; unavailable: number; percent: number | null };
export type RetentionMetrics = { installs: number; tracked: number; firstSeen: string | null; lastSeen: string | null; activeDays: number; averageActiveDays: number | null; averageSessions: number | null; d1: RetentionRate; d7: RetentionRate; d30: RetentionRate };
export type RetentionGroup = { values: (string | null)[]; metrics: RetentionMetrics };
export type RetentionReport = {
  asOf: string; summary: RetentionMetrics;
  activity: { activeDays: number; sessionStarts: number; sessionsPerActiveDay: number | null };
  daily: { day: string; activeDays: number; sessionStarts: number; sessionsPerActiveDay: number | null }[];
  cohorts: RetentionGroup[];
  inactivity: { label: string; installs: number }[];
  breakdowns: { country: RetentionGroup[]; campaign: RetentionGroup[]; creator: RetentionGroup[]; source: RetentionGroup[]; platform: RetentionGroup[]; creatorCampaign: RetentionGroup[] };
};
