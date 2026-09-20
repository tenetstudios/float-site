"use client";
import { useEffect, useRef, useState } from "react";
import { defaultRetentionFilters, type RetentionFilters, type RetentionGroup, type RetentionRate, type RetentionReport } from "@/lib/retention";
import styles from "./acquisition/dashboard.module.css";
const count = (n: number | null) => n === null ? "Unavailable" : n.toLocaleString("en-US", { maximumFractionDigits: 2 });
function Rate({ rate }: { rate: RetentionRate }) {
  return <><span>{rate.eligible ? `${count(rate.percent)}% · ${count(rate.retained)} / ${count(rate.eligible)}` : rate.pending ? "Pending" : "Unavailable"}</span><small className={styles.rateNote}>{count(rate.pending)} pending · {count(rate.unavailable)} unavailable</small></>;
}
function Cohorts({ title, labels, rows, heatmap = false }: { title: string; labels: string[]; rows: RetentionGroup[]; heatmap?: boolean }) {
  return <section className={styles.panel}><h2>{title}</h2><p className={styles.muted}>{heatmap ? "Each row is an acquisition first-seen UTC cohort. Darker blue means higher exact-day retention." : "Top 50 groups by acquisition installs · selected cohorts"}</p><div className={styles.tableScroll} tabIndex={0} role="region" aria-label={title}><table><thead><tr>{labels.map(label => <th key={label} scope="col">{label}</th>)}<th scope="col">Installs / tracked</th>{[1, 7, 30].map(n => <th key={n} scope="col">D{n} · retained / eligible</th>)}<th scope="col">Avg. lifetime active days</th><th scope="col">Avg. lifetime sessions</th></tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.values.map((value, j) => <td key={j}>{value ?? "Unknown"}</td>)}<td>{count(row.metrics.installs)} / {count(row.metrics.tracked)}</td>{(["d1", "d7", "d30"] as const).map(key => <td key={key} style={heatmap ? { background: row.metrics[key].percent === null ? "#edf0f4" : `rgba(14,142,247,${.08 + row.metrics[key].percent / 100 * .35})` } : undefined}><Rate rate={row.metrics[key]} /></td>)}<td>{count(row.metrics.averageActiveDays)}</td><td>{count(row.metrics.averageSessions)}</td></tr>)}</tbody></table></div>{!rows.length && <p className={styles.muted}>No matching cohorts.</p>}</section>;
}
export default function RetentionPanel({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [draft, setDraft] = useState(defaultRetentionFilters);
  const [filters, setFilters] = useState(defaultRetentionFilters);
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [setup, setSetup] = useState(false);
  const [result, setResult] = useState<{ query: string; updatedAt: string; report: RetentionReport } | null>(null);
  const generation = useRef(0);
  const query = new URLSearchParams(filters).toString();
  useEffect(() => {
    let disposed = false;
    let active: AbortController | null = null;
    const current = ++generation.current;
    async function load() {
      if (disposed || active || document.visibilityState !== "visible") return;
      const controller = new AbortController(); active = controller;
      const timeout = setTimeout(() => controller.abort(), 45000);
      setBusy(true); setError(""); setSetup(false);
      try {
        const response = await fetch(`/api/admin/retention?${query}`, { cache: "no-store", signal: controller.signal });
        const body = await response.json();
        if (disposed || current !== generation.current) return;
        if ([401, 403].includes(response.status)) { onUnauthorized(); return; }
        if (!response.ok) { setSetup(response.status === 503); if (response.status === 503) setResult(null); throw new Error(body.error || "Retention reporting is unavailable."); }
        setResult({ query, updatedAt: body.updatedAt, report: body.report });
      } catch (e) {
        if (!disposed && current === generation.current) setError(e instanceof Error && e.name !== "AbortError" ? e.message : "Retention request timed out. Please retry.");
      } finally { clearTimeout(timeout); active = null; if (!disposed && current === generation.current) setBusy(false); }
    }
    void load();
    const timer = setInterval(() => void load(), 60000);
    const visible = () => { if (document.visibilityState === "visible") void load(); };
    document.addEventListener("visibilitychange", visible);
    return () => { disposed = true; active?.abort(); clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
  }, [query, refresh, onUnauthorized]);
  const report = result?.query === query ? result.report : null;
  const update = (key: keyof RetentionFilters, value: string) => setDraft(f => ({ ...f, [key]: value }));
  return <div data-retention-panel>
    <form className={styles.panel} onSubmit={e => { e.preventDefault(); setFilters({ ...draft }); setRefresh(n => n + 1); }}><h2>Retention filters · UTC</h2><p className={styles.muted}>Cohort dates select installations for every report. Activity dates further limit only the sessions-per-day report.</p><div className={styles.filters}>
      {([["start", "Cohort first-seen from"], ["end", "Cohort first-seen through"], ["activityStart", "Activity window from"], ["activityEnd", "Activity window through"]] as const).map(([key, label]) => <label key={key}>{label}<input type="date" required value={draft[key]} onChange={e => update(key, e.target.value)} /></label>)}
      {([["country", "Country code (device locale)"], ["campaign", "Campaign ID or name"], ["creator", "Creator code"], ["source", "Source"], ["platform", "Platform"]] as const).map(([key, label]) => <label key={key}>{label}<input value={draft[key]} placeholder="All" maxLength={key === "country" ? 2 : 200} onChange={e => update(key, e.target.value)} /></label>)}
    </div><div className={styles.actions}><button type="submit">Apply retention filters</button><button type="button" disabled={busy} onClick={() => setRefresh(n => n + 1)}>Refresh retention</button><span className={styles.muted}>Exact matches · each date range: 1–366 days, inclusive</span></div></form>
    <div className={styles.status} role="status"><span>{busy ? "Loading retention…" : "Refreshes every 60 seconds while visible and open"}</span><span>Last updated: {result?.query === query ? new Date(result.updatedAt).toISOString().replace("T", " ").slice(0, 19) + " UTC" : "Not yet loaded"}</span></div>
    {error && <div className={styles.error} role="alert"><div>{setup && <h2>Retention setup required</h2>}{error}</div><button disabled={busy} onClick={() => setRefresh(n => n + 1)}>Retry retention</button></div>}
    {report && <div aria-busy={busy}>{error && <p className={styles.stale}>Showing the last successful retention report. These figures may be out of date.</p>}<p className={styles.period}>Selected cohorts: {filters.start} – {filters.end} · as of {report.asOf} UTC</p>
      {report.summary.installs === 0 ? <p className={styles.empty}>No installations match these cohort filters.</p> : report.summary.tracked === 0 && <p className={styles.empty}>No retention telemetry for these installations yet. Retention measurements are unavailable.</p>}
      <div className={styles.cards}>{[["Cohort installations", count(report.summary.installs)], ["Tracked installations", count(report.summary.tracked)], ["Avg. lifetime active days", count(report.summary.averageActiveDays)], ["Avg. lifetime sessions", count(report.summary.averageSessions)]].map(([label, value]) => <section className={styles.panel} key={label}><h2>{label}</h2><strong>{value}</strong></section>)}</div>
      <section className={styles.panel}><h2>Observed activity</h2><p>Earliest cohort first_seen_at: {report.summary.firstSeen ?? "Unavailable"}</p><p>Latest measured last_seen_at: {report.summary.lastSeen ?? "Unavailable"}</p><p>Total observed lifetime installation-active-days: {report.summary.tracked ? count(report.summary.activeDays) : "Unavailable"}</p><p className={styles.muted}>These are population aggregates, not individual account or installation records. Lifetime averages use tracked installations only and can include incomplete historical coverage.</p></section>
      <Cohorts title="D1 / D7 / D30 cohort retention" labels={["First-seen date (UTC)"]} rows={report.cohorts} heatmap />
      <section className={styles.panel}><h2>Sessions per active day</h2><p>Activity window: {filters.activityStart} – {filters.activityEnd} UTC · selected cohorts only</p><p>{count(report.activity.sessionsPerActiveDay)} sessions per installation-active-day · {count(report.activity.sessionStarts)} observed starts / {count(report.activity.activeDays)} observed active days</p><p className={styles.muted}>Continued activity across midnight can add an active day with zero new session starts. No observed rows means an unavailable rate, not zero retention.</p><div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Daily sessions"><table><thead><tr><th scope="col">UTC activity date</th><th scope="col">Session starts</th><th scope="col">Installation-active-days</th><th scope="col">Sessions / active day</th></tr></thead><tbody>{report.daily.map(row => <tr key={row.day}><td>{row.day}</td><td>{count(row.sessionStarts)}</td><td>{count(row.activeDays)}</td><td>{count(row.sessionsPerActiveDay)}</td></tr>)}</tbody></table></div></section>
      <section className={styles.panel}><h2>Days since last session</h2><p className={styles.muted}>From the last session start’s UTC date, not last_seen_at. Untracked installations are Unavailable.</p><div className={styles.tableScroll}><table><thead><tr><th scope="col">Days since session start</th><th scope="col">Installations</th></tr></thead><tbody>{report.inactivity.map(row => <tr key={row.label}><td>{row.label}</td><td>{count(row.installs)}</td></tr>)}</tbody></table></div></section>
      {([{ key: "country", title: "Country retention · device-locale estimate", labels: ["Country"] }, { key: "campaign", title: "Campaign acquisition + retention", labels: ["Campaign ID", "Campaign name"] }, { key: "creator", title: "Creator acquisition + retention", labels: ["Creator"] }, { key: "source", title: "Source retention", labels: ["Source"] }, { key: "platform", title: "Platform retention", labels: ["Platform"] }, { key: "creatorCampaign", title: "Creator / campaign report", labels: ["Creator", "Campaign ID", "Campaign name", "Country"] }] as const).map(group => <Cohorts key={group.key} title={group.title} labels={[...group.labels]} rows={report.breakdowns[group.key]} />)}
    </div>}
    <p className={styles.notes}>Exact-day retention requires activity on cohort day +1, +7 or +30. The entire target UTC day must have finished, and tracking must have begun by its start. Unfinished days are Pending; mature days without coverage are Unavailable. Offline uploads may revise history. All counts refer to installations.</p>
  </div>;
}
