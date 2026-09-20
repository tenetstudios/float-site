export const DAY = 86_400_000;
export const TOP = 50;
export type Filters = { start: string; end: string; campaign: string; creator: string; country: string; platform: string; paid: string };
export type Group = { values: (string | null)[]; installs: number };
export type Report = {
  summary: { total: number; paid: number; organic: number; unknown: number };
  daily: { day: string; installs: number }[];
  countries: Group[]; campaigns: Group[]; creators: Group[]; sources: Group[];
  platforms: Group[]; campaignCountries: Group[]; creatorReport: Group[];
  regions?: Group[]; referrals?: Group[];
};
export function dateRange(days: number, now = new Date()): Filters {
  const end = now.toISOString().slice(0, 10);
  return { start: new Date(Date.parse(end) - (days - 1) * DAY).toISOString().slice(0, 10), end, campaign: "", creator: "", country: "", platform: "", paid: "all" };
}
export class ReportError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
export function parseFilters(params: URLSearchParams): Filters {
  const filters = dateRange(30);
  const allowed = Object.keys(filters);
  for (const key of params.keys()) {
    if (!allowed.includes(key) || params.getAll(key).length !== 1) throw new ReportError(400, "Invalid report filters.");
  }
  for (const key of allowed as (keyof Filters)[]) {
    const value = params.get(key);
    if (value !== null) filters[key] = value.trim();
  }
  for (const date of [filters.start, filters.end]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new ReportError(400, "Choose valid calendar dates.");
  }
  const days = (Date.parse(filters.end) - Date.parse(filters.start)) / DAY + 1;
  if (days < 1 || days > 366) throw new ReportError(400, "Choose a date range of 1 to 366 days.");
  for (const key of ["campaign", "creator", "country", "platform"] as const) {
    if (filters[key].length > 200 || /[\x00-\x1f\x7f]/.test(filters[key])) throw new ReportError(400, "Filter values must be at most 200 characters without control characters.");
  }
  if (filters.country && !/^[a-zA-Z]{2}$/.test(filters.country)) throw new ReportError(400, "Use a two-letter country code.");
  filters.country = filters.country.toUpperCase();
  if (!["all", "paid", "organic", "unknown"].includes(filters.paid)) throw new ReportError(400, "Invalid paid status.");
  return filters;
}
export function rpcArgs(f: Filters) {
  return { p_start: f.start, p_end: f.end, p_campaign: f.campaign || null, p_creator: f.creator || null, p_country: f.country || null, p_platform: f.platform || null, p_paid: f.paid };
}
