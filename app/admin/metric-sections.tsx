"use client";
import { useState } from "react";
import RetentionPanel from "./retention-panel";
import EngagementPanel from "./engagement-panel";
import styles from "./acquisition/dashboard.module.css";
const planned = [
  { title: "Multiplayer", description: "Matchmaking, match outcomes and connection quality.", metrics: ["Queue start / end", "Matchmaking wait time", "Match result", "Disconnects", "Surrender / forfeit", "Faction played", "Win / loss record", "Opponent region", "Server region", "Ping / latency", "Rematch rate"] },
  { title: "Monetization", description: "Advertising, memberships and purchases.", metrics: ["Ad impression type", "Rewarded-ad accepted / completed", "Interstitial impressions", "Membership start / cancel / renew", "Cosmetic purchase", "SKU", "Price / currency", "Refunds", "Lifetime spend"] },
  { title: "Progression", description: "Player advancement and unlocks.", metrics: ["Account level", "Campaign chapter / mission progress", "First-attempt clears", "Protected retries used", "Cosmetics unlocked", "Earned vs. purchased cosmetic source"] },
  { title: "Technical health", description: "App stability and service reliability.", metrics: ["Crashes", "Failed API calls", "Match desyncs", "Server disconnects", "App version", "Device / OS"] },
];
export default function MetricSections({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [retentionOpen, setRetentionOpen] = useState(false);
  const [engagementOpen, setEngagementOpen] = useState(false);
  return <><details className={styles.category} id="retention" onToggle={e => setRetentionOpen(e.currentTarget.open)}><summary><span>02 · Retention</span><small>Cohorts, active days and sessions</small></summary><div className={styles.categoryContent}>{retentionOpen && <RetentionPanel onUnauthorized={onUnauthorized} />}</div></details>
    <details className={styles.category} id="engagement" onToggle={e => setEngagementOpen(e.currentTarget.open)}><summary><span>03 · Engagement</span><small>Campaign attempts, outcomes and placements</small></summary><div className={styles.categoryContent}>{engagementOpen && <EngagementPanel onUnauthorized={onUnauthorized} />}</div></details>
    {planned.map((section, i) => <details className={styles.category} key={section.title}><summary><span>{String(i + 4).padStart(2, "0")} · {section.title}</span><small>Not connected yet</small></summary><div className={styles.categoryContent}><p>{section.description}</p><p className={styles.placeholderNote}>Planned reporting. Data is not connected to this dashboard yet; no measurements are shown.</p><div className={styles.metricGrid}>{section.metrics.map(metric => <section className={styles.metricPlaceholder} key={metric}><h3>{metric}</h3><p>Not connected</p></section>)}</div></div></details>)}
  </>;
}
