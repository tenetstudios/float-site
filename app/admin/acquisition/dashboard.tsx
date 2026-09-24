"use client";
import SortableTable from "../sortable-table";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import MetricSections from "../metric-sections";
import { dateRange, TOP, type Filters, type Group, type Report } from "@/lib/acquisition";
import styles from "./dashboard.module.css";

const number = (value: number) => value.toLocaleString("en-US");
const columns: { key: keyof Omit<Report, "summary" | "daily">; title: string; labels: string[] }[] = [
  { key: "countries", title: "Countries · device-locale estimates", labels: ["Country"] },
  { key: "campaigns", title: "Campaigns", labels: ["Campaign ID", "Campaign name"] },
  { key: "creators", title: "Creators", labels: ["Creator code"] },
  { key: "regions", title: "Countries & regions · device-locale estimates", labels: ["Country", "Region"] },
  { key: "referrals", title: "Referral codes", labels: ["Referral code"] },
  { key: "sources", title: "Sources & mediums", labels: ["Source", "Medium"] },
  { key: "platforms", title: "Platforms & app versions", labels: ["Platform", "App version"] },
  { key: "campaignCountries", title: "Campaign + country", labels: ["Campaign ID", "Campaign name", "Country"] },
  { key: "creatorReport", title: "Creator report", labels: ["Creator code", "Campaign name", "Country", "Source"] },
];
function Breakdown({ title, labels, rows }: { title: string; labels: string[]; rows: Group[] }) {
  return <section className={styles.panel}><h2>{title}</h2><p className={styles.muted}>Top {TOP} groups by installs · filters apply</p><div className={styles.tableScroll} tabIndex={0} role="region" aria-label={`${title} table`}><SortableTable labels={[...labels, "Installs"]} rows={rows.map(row => [...row.values.map(value => ({ value, content: value === null ? <em>Unknown</em> : value === "" ? <em>Empty value</em> : value })), { value: row.installs, content: number(row.installs) }])} /></div>{!rows.length && <p className={styles.muted}>No matching installations.</p>}</section>;
}
export default function Dashboard({ authorized, initialMessage }: { authorized: boolean; initialMessage: string }) {
  const [signedIn, setSignedIn] = useState(authorized);
  const [message, setMessage] = useState(initialMessage);
  const [loginBusy, setLoginBusy] = useState(false);
  const [draft, setDraft] = useState<Filters>(() => dateRange(30));
  const [filters, setFilters] = useState<Filters>(() => dateRange(30));
  const [preset, setPreset] = useState("30");
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ report: Report; updatedAt: string; query: string } | null>(null);
  const query = new URLSearchParams(filters).toString();
  const sequence = useRef(0);
  useEffect(() => {
    if (!signedIn) return;
    let disposed = false;
    let active: AbortController | null = null;
    const generation = ++sequence.current;
    async function load() {
      if (active || disposed || document.visibilityState !== "visible") return;
      const controller = new AbortController();
      active = controller;
      const timeout = setTimeout(() => controller.abort(), 35000);
      setBusy(true);
      setMessage("");
      try {
        const response = await fetch(`/api/admin/acquisition?${query}`, { cache: "no-store", signal: controller.signal });
        const body = await response.json();
        if (disposed || generation !== sequence.current) return;
        if (!response.ok) {
          if ([401, 403].includes(response.status)) { setSignedIn(false); setResult(null); }
          throw new Error(body.error || "The report could not be loaded.");
        }
        setResult({ ...body, query });
      } catch (error) {
        if (!disposed && generation === sequence.current) setMessage(error instanceof Error && error.name !== "AbortError" ? error.message : "The report request timed out. Please retry.");
      } finally {
        clearTimeout(timeout);
        active = null;
        if (!disposed && generation === sequence.current) setBusy(false);
      }
    }
    void load();
    const timer = setInterval(() => void load(), 60000);
    const visible = () => { if (document.visibilityState === "visible") void load(); };
    document.addEventListener("visibilitychange", visible);
    return () => { disposed = true; active?.abort(); clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
  }, [signedIn, query, refresh]);
  async function login() {
    setLoginBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/auth/google", { method: "POST", signal: AbortSignal.timeout(25000) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Sign-in failed.");
      window.location.assign(body.url);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Sign-in failed."); }
    finally { setLoginBusy(false); }
  }
  async function logout() {
    setLoginBusy(true);
    try {
      const response = await fetch("/api/admin/session", { method: "DELETE", signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error("Sign-out failed. Please retry.");
      const body = await response.json();
      sequence.current++; setSignedIn(false); setResult(null); setBusy(false);
      setMessage(body.revoked ? "" : "Signed out of this browser. Supabase could not revoke the session; it will expire automatically.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Sign-out failed."); }
    finally { setLoginBusy(false); }
  }
  const unauthorized = useCallback(() => { sequence.current++; setSignedIn(false); setResult(null); setBusy(false); setMessage("Your session expired or this account is not authorized. Please sign in again."); }, []);
  const report = result?.query === query ? result.report : null;
  const update = (key: keyof Filters, value: string) => setDraft(current => ({ ...current, [key]: value }));
  return <main id="main" className={styles.shell}>
    <header className={styles.header}><div><Link className={styles.brand} href="/">FLOAT <span>/ PRIVATE ADMIN</span></Link><h1>Admin analytics</h1><p>Acquisition, retention and the metrics behind Float.</p></div>{signedIn && <button disabled={loginBusy} onClick={() => void logout()}>Sign out</button>}</header>
    {message && <div role="alert" className={styles.error}>{message}{signedIn && <button disabled={busy} onClick={() => setRefresh(n => n + 1)}>Retry</button>}</div>}
    {!signedIn ? <section className={`${styles.panel} ${styles.login}`}><h2>Admin sign-in</h2><p>Choose the Google account you use in Float. Access is limited to approved administrators.</p><div className={styles.signInAction}><button disabled={loginBusy} onClick={() => void login()}>{loginBusy ? "Opening Google…" : "Sign in with Google"}</button></div><p className={styles.muted}>Sessions last up to one hour. Sign in again when your session expires.</p></section> : <>
      <details className={styles.category} open><summary><span>01 · Acquisition</span><small>Install dates, attribution and audiences</small></summary><div className={styles.categoryContent}>
      <form className={styles.panel} onSubmit={event => { event.preventDefault(); setFilters({ ...draft }); setRefresh(n => n + 1); }}>
        <div className={styles.filterHeading}><h2>Report filters</h2><span>Reporting timezone: UTC</span></div>
        <div className={styles.filters}>
          <label>Period<select value={preset} onChange={event => { const value = event.target.value; setPreset(value); if (value !== "custom") { const range = dateRange(Number(value)); setDraft(current => ({ ...current, start: range.start, end: range.end })); } }}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="custom">Custom dates</option></select></label>
          <label>From<input type="date" required value={draft.start} onChange={e => { setPreset("custom"); update("start", e.target.value); }} /></label>
          <label>Through (inclusive)<input type="date" required value={draft.end} onChange={e => { setPreset("custom"); update("end", e.target.value); }} /></label>
          <label>Paid status<select value={draft.paid} onChange={e => update("paid", e.target.value)}><option value="all">All statuses</option><option value="paid">Paid</option><option value="organic">Organic / unpaid</option><option value="unknown">Unknown</option></select></label>
          <label>Campaign ID or name<input value={draft.campaign} maxLength={200} placeholder="All campaigns" onChange={e => update("campaign", e.target.value)} /></label>
          <label>Creator code<input value={draft.creator} maxLength={200} placeholder="All creators" onChange={e => update("creator", e.target.value)} /></label>
          <label>Country code<input value={draft.country} maxLength={2} placeholder="All countries (e.g. CA)" onChange={e => update("country", e.target.value)} /></label>
          <label>Platform<input value={draft.platform} maxLength={200} placeholder="All platforms" onChange={e => update("platform", e.target.value)} /></label>
        </div><div className={styles.actions}><button type="submit">Apply filters</button><button type="button" disabled={busy} onClick={() => setRefresh(n => n + 1)}>Refresh now</button><p className={styles.muted}>Text filters use exact matches. Maximum range: 366 days.</p></div>
      </form>
      <div className={styles.status} role="status"><span>{busy ? "Loading report…" : message ? "Report unavailable · retry above" : "Refreshes every 60 seconds while visible"}</span><span>Last updated: {result?.query === query ? `${new Date(result.updatedAt).toISOString().replace("T", " ").slice(0, 19)} UTC` : "Not yet loaded"}</span></div>
      {report && <div aria-busy={busy}>{message && <p className={styles.stale}>Showing the last successful report. These figures may be out of date.</p>}<p className={styles.period}>{filters.start} – {filters.end} · inclusive UTC calendar days</p>
        <section className={styles.cards} aria-label="Install summary">{([["Total installs", report.summary.total], ["Paid installs", report.summary.paid], ["Organic / unpaid", report.summary.organic], ["Unknown paid status", report.summary.unknown]] as const).map(([label, count]) => <div className={styles.panel} key={label}><h2>{label}</h2><strong>{number(count)}</strong></div>)}</section>
        {report.summary.total === 0 && <p className={styles.empty}>No installations match this period and these filters.</p>}
        <section className={styles.panel}><h2>Daily installs</h2><p className={styles.muted}>Observed first launches · UTC</p><div className={styles.chart} role="img" aria-label={`Daily installations from ${filters.start} through ${filters.end}. Exact values are in the daily table below.`}>{report.daily.map(day => <div key={day.day} title={`${day.day}: ${number(day.installs)} installs`} style={{ height: `${Math.max(day.installs > 0 ? 1 : 0, day.installs / Math.max(1, ...report.daily.map(d => d.installs)) * 100)}%` }} />)}</div><div className={styles.axis}><span>{filters.start}</span><span>{filters.end}</span></div><details><summary>View daily values</summary><div className={styles.tableScroll}><SortableTable labels={["Date (UTC)", "Installs"]} rows={report.daily.map(day => [{ value: day.day }, { value: day.installs, content: number(day.installs) }])} /></div></details></section>
        <div className={styles.breakdowns}>{columns.map(column => report[column.key] ? <Breakdown key={column.key} title={column.title} labels={column.labels} rows={report[column.key]!} /> : <section className={styles.panel} key={column.key}><h2>{column.title}</h2><p>Reporting update required. Re-run the updated acquisition-reporting.sql file to enable this breakdown.</p></section>)}</div>
      </div>}
      <footer className={styles.notes}><h2>Reading this report</h2><p>Each row in the source represents one installation, not a unique account. Dates use observed first-launch time, not server receipt time. Existing installations were first observed when tracking was introduced.</p><p>Attribution is client-reported and is not independently verified ad-network data. Country is estimated from device locale. Unknown paid status is separate from organic / unpaid. Missing grouping values appear as Unknown.</p></footer>
      </div></details><MetricSections onUnauthorized={unauthorized} />
    </>}
  </main>;
}
