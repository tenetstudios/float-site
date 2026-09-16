import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/site-shell";
import { pageMetadata } from "@/lib/site";
import styles from "./campaign.module.css";

export const metadata = pageMetadata(
  "Solo Campaign",
  "/campaign",
  "A sky full of challenges. How far can you go? Explore new worlds, unlock new defenses, and take on the Lion Army in Float’s solo campaign.",
);

const features = [
  { title: "Explore New Worlds", lines: ["Unique islands, new enemies,", "and escalating challenges."] },
  { title: "Unlock New Defenses", lines: ["Discover new frogs, upgrades,", "and powerful strategies."] },
  { title: "Take on the Lion Army", lines: ["Face new threats, epic battles,", "and massive bosses."] },
];

const steps = [
  { title: "Choose a Mission", copy: "Select a chapter and deploy to a new island.", icon: "map" },
  { title: "Defend and Survive", copy: "Build, upgrade, and stop the lion assaults.", icon: "swords" },
  { title: "Earn Rewards", copy: "Unlock new frogs, upgrades, and harder missions.", icon: "star" },
] as const;

function CampaignIcon({ name }: { name: "gamepad" | "map" | "swords" | "star" }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      {name === "gamepad" && <>
        <path d="M19 14h26c9 0 18 31 11 36-5 4-13-8-17-8H25c-4 0-12 12-17 8C1 45 10 14 19 14Z" fill="currentColor" />
        <path d="M21 23v14m-7-7h14" stroke="#7924df" strokeWidth="4" strokeLinecap="round" />
        <circle cx="43" cy="25" r="3" fill="#7924df" /><circle cx="49" cy="33" r="3" fill="#7924df" />
      </>}
      {name === "map" && <>
        <path d="m13 7 39 2-4 47-39-2Z" fill="#f2cc8e" stroke="#b37d43" strokeWidth="2" />
        <path d="M14 7C2 0 1 15 12 15m38 33c13-4 14 13 2 10M9 48C0 44 0 57 10 56M51 9c12 2 13-10 4-9" stroke="#bb8551" strokeWidth="5" strokeLinecap="round" />
        <path d="m20 43 5-11 11 3 6-14" stroke="#9c6b40" strokeWidth="3" strokeLinecap="round" strokeDasharray="3 5" />
        <path d="m34 15 10 9m-1-10-10 11" stroke="#80512e" strokeWidth="3" strokeLinecap="round" />
      </>}
      {name === "swords" && <>
        <path d="m8 4 13 4 34 39-8 8L8 18Z" fill="#c6d9ed" stroke="#8eabc3" strokeWidth="2" />
        <path d="M9 5 50 50" stroke="#eff7ff" strokeWidth="3" />
        <path d="m39 53 13-14m-4 13 9 9" stroke="#a66a26" strokeWidth="7" strokeLinecap="round" />
        <path d="m56 4-13 4L9 47l8 8 39-37Z" fill="#e2edf8" stroke="#8eabc3" strokeWidth="2" />
        <path d="M55 5 14 50" stroke="#afc6de" strokeWidth="3" />
        <path d="M25 53 12 39m4 13-9 9" stroke="#a66a26" strokeWidth="7" strokeLinecap="round" />
      </>}
      {name === "star" && <>
        <path d="m32 3 9 18 20 3-15 15 4 21-18-10-18 10 4-21L3 24l20-3Z" fill="#ffc42d" stroke="#e8a015" strokeWidth="2" strokeLinejoin="round" />
        <path d="m32 3 1 30L3 24l20-3Z" fill="#ffe68a" /><path d="m33 33 17 27-18-10-18 10Z" fill="#eea012" />
        <path d="m33 33 28-9-15 15 4 21Z" fill="#fbb21b" />
      </>}
    </svg>
  );
}

function CampaignSign({ small = false }: { small?: boolean }) {
  if (small) {
    return <h2 id="campaign-steps-title" className={styles.howSign}>
      <Image src="/images/campaign/how-it-works-board.webp" alt="" fill sizes="(max-width: 600px) 90vw, 35vw" />
      <span>How It Works</span>
    </h2>;
  }

  return <h1 id="campaign-title" className={styles.heroSign}>
    <Image src="/images/campaign/campaign-title-board.webp" alt="" fill sizes="(max-width: 600px) 96vw, 50vw" preload />
    <span className="sr-only">Campaign — Solo</span>
  </h1>;
}

export default function CampaignPage() {
  return <>
    <main id="main" className={styles.page}>
      <Link href="/" className={styles.homeLink} aria-label="Float home">Float</Link>
      <Image className={styles.scenery} src="/images/campaign/sky-scene.webp" alt="" width={1182} height={1330} sizes="100vw" preload />
      <section className={styles.hero} aria-labelledby="campaign-title">
        <CampaignSign />
        <div className={styles.intro}>
          <p>A sky full of challenges.<br />How far can you go?</p>
          <button className={styles.playButton} type="button" popoverTarget="campaign-availability">
            <CampaignIcon name="gamepad" />Play Campaign<span aria-hidden="true">›</span>
          </button>
        </div>
      </section>

      <div className={styles.content}>
        <section className={styles.features} aria-label="Campaign features">
          {features.map(feature => <article className={styles.feature} key={feature.title}>
            <div className={styles.imageSlot} aria-hidden="true" />
            <h2>{feature.title}</h2>
            <p>{feature.lines.map(line => <span key={line}>{line}</span>)}</p>
          </article>)}
        </section>

        <section className={styles.howItWorks} aria-labelledby="campaign-steps-title">
          <CampaignSign small />
          <ol className={styles.steps}>
            {steps.map((step, index) => <li key={step.title}>
              <span className={styles.stepNumber} aria-hidden="true">{index + 1}</span>
              <CampaignIcon name={step.icon} />
              <div><h3>{step.title}</h3><p>{step.copy}</p></div>
            </li>)}
          </ol>
        </section>
      </div>

      <div id="campaign-availability" popover="auto" role="dialog" aria-labelledby="campaign-availability-title" className={styles.availability}>
        <h2 id="campaign-availability-title">Coming October 2026</h2>
        <button type="button" popoverTarget="campaign-availability" popoverTargetAction="hide" aria-label="Close">×</button>
      </div>
    </main>
    <Footer />
  </>;
}
