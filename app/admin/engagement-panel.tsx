"use client";
import { useEffect, useRef, useState } from "react";
import { defaultEngagementFilters, unitLabels, type EngagementFilters, type EngagementGroup, type EngagementMetrics, type EngagementReport } from "@/lib/engagement";
import styles from "./acquisition/dashboard.module.css";
import { missionLabel } from "@/lib/engagement-missions";
const number = (n: number | null) => n === null ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: 2 });
const duration = (n: number | null) => n === null ? "—" : `${number(n)} s`;
const rate = (m: EngagementMetrics) => m.completionRate === null ? "—" : `${number(m.completionRate)}% (${number(m.completed)} / ${number(m.decided)})`;
function Performance({ title, labels, rows }: { title: string; labels: string[]; rows: EngagementGroup[] }) {
  return <section className={styles.panel}><h2>{title}</h2><p className={styles.muted}>Top 50 groups by attempts · all selected attempts contribute to totals</p><div className={styles.tableScroll} role="region" aria-label={title} tabIndex={0}><table><thead><tr>{labels.map(label => <th key={label} scope="col">{label}</th>)}{["Attempts", "Installations", "Completed", "Failed", "Abandoned", "Unknown", "In progress", "Completion rate", "Avg. active duration · completed", "Measured samples", "Retries", "Restarts", "Replays", "Placements"].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.values.map((value, j) => <td key={j}>{value ?? "Unknown"}</td>)}{[row.metrics.attempts, row.metrics.installations, row.metrics.completed, row.metrics.failed, row.metrics.abandoned, row.metrics.unknown, row.metrics.inProgress].map((n, j) => <td key={j}>{number(n)}</td>)}<td>{rate(row.metrics)}</td><td>{duration(row.metrics.averageActiveSeconds)}</td>{[row.metrics.durationSamples, row.metrics.retries, row.metrics.restarts, row.metrics.replays, row.metrics.placements].map((n, j) => <td key={j}>{number(n)}</td>)}</tr>)}</tbody></table></div>{!rows.length && <p>No matching attempts.</p>}</section>;
}
export default function EngagementPanel({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [draft, setDraft] = useState(defaultEngagementFilters);
  const [filters, setFilters] = useState(defaultEngagementFilters);
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [setup, setSetup] = useState(false);
  const [result, setResult] = useState<{ query: string; updatedAt: string; report: EngagementReport } | null>(null);
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
        const response = await fetch(`/api/admin/engagement?${query}`, { cache: "no-store", signal: controller.signal });
        const body = await response.json();
        if (disposed || current !== generation.current) return;
        if ([401, 403].includes(response.status)) { onUnauthorized(); return; }
        if (!response.ok) { setSetup(response.status === 503); if (response.status === 503) setResult(null); throw new Error(body.error || "Engagement reporting is unavailable."); }
        setResult({ query, updatedAt: body.updatedAt, report: body.report });
      } catch (e) {
        if (!disposed && current === generation.current) setError(e instanceof Error && e.name !== "AbortError" ? e.message : "Engagement request timed out. Please retry.");
      } finally { clearTimeout(timeout); active = null; if (!disposed && current === generation.current) setBusy(false); }
    }
    void load();
    const timer = setInterval(() => void load(), 60000);
    const visible = () => { if (document.visibilityState === "visible") void load(); };
    document.addEventListener("visibilitychange", visible);
    return () => { disposed = true; active?.abort(); clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
  }, [query, refresh, onUnauthorized]);
  const report = result?.query === query ? result.report : null;
  const update = (key: keyof EngagementFilters, value: string) => setDraft(f => ({ ...f, [key]: value }));
  const outcomes = ["completed", "failed", "abandoned", "unknown", "inProgress"] as const;
  const colors = ["#4c9343", "#bf4949", "#a97728", "#8993a4", "#168cc9"];
  const maximum = Math.max(1, ...(report?.daily.map(d => d.attempts) ?? []));
  return <div data-engagement-panel>
    <form className={styles.panel} onSubmit={e => { e.preventDefault(); setFilters({ ...draft }); setRefresh(n => n + 1); }}><h2>Engagement filters · UTC</h2><p className={styles.muted}>Select campaign attempts by started_at. Placements belong to those attempts, even when placed after the selected end date.</p><div className={styles.filters}>
      {([["start", "Attempt start date from"], ["end", "Through (inclusive)"]] as const).map(([key, label]) => <label key={key}>{label}<input type="date" required value={draft[key]} onChange={e => update(key, e.target.value)} /></label>)}
      {([["country", "Country code (device locale)"], ["platform", "Platform"], ["campaign", "Acquisition campaign ID or name"], ["creator", "Creator code"], ["appVersion", "Gameplay app version"]] as const).map(([key, label]) => <label key={key}>{label}<input value={draft[key]} maxLength={key === "country" ? 2 : 200} placeholder="All" onChange={e => update(key, e.target.value)} /></label>)}
      <label>Difficulty<select value={draft.difficulty} onChange={e => update("difficulty", e.target.value)}><option value="">All difficulties</option><option value="standard">Standard</option><option value="hard">Hard</option></select></label>
    </div><div className={styles.actions}><button type="submit">Apply engagement filters</button><button type="button" disabled={busy} onClick={() => setRefresh(n => n + 1)}>Refresh engagement</button><span className={styles.muted}>Exact matches · 1–366 calendar days</span></div></form>
    <div className={styles.status} role="status"><span>{busy ? "Loading engagement…" : "Refreshes every 60 seconds while visible and open"}</span><span>Last updated: {result?.query === query ? new Date(result.updatedAt).toISOString().replace("T", " ").slice(0, 19) + " UTC" : "Not yet loaded"}</span></div>
    {error && <div className={styles.error} role="alert"><div>{setup && <h2>Engagement setup required</h2>}{error}</div><button disabled={busy} onClick={() => setRefresh(n => n + 1)}>Retry engagement</button></div>}
    {report && <div aria-busy={busy}>{error && <p className={styles.stale}>Showing the last successful engagement report. These figures may be out of date.</p>}<p className={styles.period}>Attempt starts: {filters.start} through {filters.end} UTC, inclusive · end boundary is midnight after the final date</p>
      {!report.summary.attempts && <p className={styles.empty}>No campaign attempts match these filters.</p>}
      <section className={styles.cards} aria-label="Engagement summary">{[["Campaign attempts", number(report.summary.attempts)], ["Distinct installations", number(report.summary.installations)], ["Completed attempts", number(report.summary.completed)], ["Failed attempts", number(report.summary.failed)], ["Abandoned attempts", number(report.summary.abandoned)], ["Completion rate", rate(report.summary)], ["Average active duration — completed attempts", duration(report.summary.averageActiveSeconds)], ["Retry count", number(report.summary.retries)], ["Successful placements recorded", number(report.summary.placements)]].map(([label, value]) => <div className={styles.panel} key={label}><h2>{label}</h2><strong className={styles.engagementValue}>{value}</strong></div>)}</section>
      <p className={styles.period}>Unknown outcomes: {number(report.summary.unknown)} · In progress: {number(report.summary.inProgress)} · Complete duration samples: {number(report.summary.durationSamples)}</p>
      <section className={styles.panel}><h2>Attempts over time</h2><p className={styles.muted}>UTC attempt-start dates, colored by current outcome. Late results can revise history.</p><div className={styles.outcomeLegend}>{outcomes.map((key, i) => <span key={key}><i style={{ background: colors[i] }} />{key === "inProgress" ? "In progress" : key}</span>)}</div><div className={styles.chart} role="img" aria-label="Daily campaign attempts by outcome. Exact counts appear in the table below.">{report.daily.map(day => <div key={day.day} className={styles.outcomeBar} title={`${day.day}: ${number(day.attempts)} attempts`} style={{ height: `${day.attempts / maximum * 100}%` }}>{outcomes.map((key, i) => <span key={key} style={{ flex: day[key], background: colors[i] }} />)}</div>)}</div><div className={styles.axis}><span>{filters.start}</span><span>{filters.end}</span></div><details><summary>View daily outcome counts</summary><div className={styles.tableScroll}><table><thead><tr>{["UTC date", "Attempts", "Completed", "Failed", "Abandoned", "Unknown", "In progress"].map(s => <th key={s} scope="col">{s}</th>)}</tr></thead><tbody>{report.daily.map(day => <tr key={day.day}><td>{day.day}</td><td>{number(day.attempts)}</td>{outcomes.map(key => <td key={key}>{number(day[key])}</td>)}</tr>)}</tbody></table></div></details></section>
      <Performance title="Mission performance" labels={["Mission / ID", "Content version", "Difficulty"]} rows={report.missions.map(row => ({ ...row, values: [missionLabel(row.values[0] ?? "Unknown", row.values[1] ?? ""), ...row.values.slice(1)] }))} />
      <section className={styles.panel}><h2>Retry / restart / replay</h2><p>Retries after failure: {number(report.summary.retries)}</p><p>Restarts after abandonment: {number(report.summary.restarts)}</p><p>Replays after completion: {number(report.summary.replays)}</p><p className={styles.muted}>Counts child attempts with the recorded restart_reason in this attempt-start window. Parents may fall outside the window.</p></section>
      <section className={styles.panel}><h2>Unit usage · accepted placement actions</h2><p>Placements per placing attempt: {number(report.summary.placementsPerPlacingAttempt)} · {number(report.summary.placements)} recorded placements / {number(report.summary.placingAttempts)} attempts with placements</p><p className={styles.muted}>Older versions may not record placements. Missing rows are not proof of zero use. Counts exclude rejected actions, prebuilt defenses, repairs, upgrades, removals and balloon sending; they are not surviving units, purchases or coins spent.</p><div className={styles.tableScroll} role="region" aria-label="Unit placement counts" tabIndex={0}><table><thead><tr>{["Unit", "Database key", "Phase", "Placements", "Distinct attempts using unit in phase"].map(s => <th key={s} scope="col">{s}</th>)}</tr></thead><tbody>{report.units.map(row => <tr key={`${row.unit}:${row.phase}`}><td>{unitLabels[row.unit] ?? row.unit}</td><td>{row.unit}</td><td>{row.phase}</td><td>{number(row.placements)}</td><td>{number(row.attempts)}</td></tr>)}</tbody></table></div>{!report.units.length && <p>No placement records for these attempts. Coverage is unknown.</p>}<p className={styles.muted}>Top 50 unit/phase groups. Attempts can appear in more than one group.</p></section>
      <Performance title="Country engagement · device-locale estimates" labels={["Country"]} rows={report.breakdowns.country} />
      <Performance title="Acquisition campaign engagement" labels={["Acquisition campaign ID", "Acquisition campaign name"]} rows={report.breakdowns.campaign} />
      <Performance title="Creator engagement" labels={["Creator code"]} rows={report.breakdowns.creator} />
    </div>}
    <footer className={styles.notes}><p>Completion rate = completed / (completed + failed + abandoned). Unknown and in-progress outcomes are excluded. Active duration uses only completed attempts with complete, non-null active_gameplay_ms; inactive time and partial durations are excluded. “—” means no eligible denominator.</p><p>Campaign gameplay is client-reported. Mission IDs are shown as recorded; acquisition campaigns are marketing attribution, not mission names. Session lifecycle reporting belongs to Retention. Account XP and multiplayer match metrics remain not connected.</p></footer>
  </div>;
}
