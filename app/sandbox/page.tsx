import Image from "next/image";
import { Footer } from "@/components/site-shell";
import { pageMetadata } from "@/lib/site";
import styles from "./sandbox.module.css";

const baseMetadata = pageMetadata("Sandbox", "/sandbox", "Create. Experiment. See what’s possible. Build your own floating islands in Float’s Sandbox, coming October 2026.");
export const metadata = {
  ...baseMetadata,
  openGraph: { ...baseMetadata.openGraph, images: [{ url: "/images/sandbox/builder-scene.webp", width: 1182, height: 1330, alt: "Frog builders construct floating islands in yellow hardhats" }] },
  twitter: { ...baseMetadata.twitter, images: ["/images/sandbox/builder-scene.webp"] },
};

const features = [
  { title: "Build Without Limits", lines: ["Design your own floating islands", "with total creative freedom."] },
  { title: "Test and Experiment", lines: ["Try new defenses, strategies,", "and wild ideas."] },
  { title: "Share Your Creations", lines: ["Build, refine, and show off", "your best islands."] },
];

const steps = [
  { title: "Place and Build", lines: ["Use a full set of tools to", "create your island."], icon: "blocks" },
  { title: "Test Your Ideas", lines: ["Spawn waves, tweak", "defenses, and iterate."], icon: "tools" },
  { title: "Save and Share", lines: ["Save your creations and", "share them with the community."], icon: "check" },
] as const;

function SandboxIcon({ name }: { name: "gamepad" | "blocks" | "tools" | "check" }) {
  return <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
    {name === "gamepad" && <>
      <path d="M19 14h26c9 0 18 31 11 36-5 4-13-8-17-8H25c-4 0-12 12-17 8C1 45 10 14 19 14Z" fill="currentColor" />
      <path d="M21 23v14m-7-7h14" stroke="#7924df" strokeWidth="4" strokeLinecap="round" />
      <circle cx="43" cy="25" r="3" fill="#7924df" /><circle cx="49" cy="33" r="3" fill="#7924df" />
    </>}
    {name === "blocks" && <g stroke="#8a7c6b" strokeWidth="1.5" strokeLinejoin="round">
      <path d="m4 36 17-6 18 6-17 7Z" fill="#e2d3c1" /><path d="M4 36v18l18 7V43Z" fill="#b6a18c" /><path d="m22 43 17-7v18l-17 7Z" fill="#8e7c6a" />
      <path d="m32 33 14-6 15 6-14 6Z" fill="#ede0cd" /><path d="M32 33v18l15 7V39Z" fill="#c3af96" /><path d="m47 39 14-6v18l-14 7Z" fill="#a18b73" />
      <path d="m17 9 16-6 19 6-17 7Z" fill="#e8dccd" /><path d="M17 9v21l18 7V16Z" fill="#bead9a" /><path d="m35 16 17-7v21l-17 7Z" fill="#978573" />
    </g>}
    {name === "tools" && <>
      <path d="m13 10 41 44" stroke="#8a541f" strokeWidth="10" strokeLinecap="round" /><path d="m17 14 35 38" stroke="#dba44f" strokeWidth="5" strokeLinecap="round" />
      <path d="M8 3a15 15 0 0 0 13 25l7-7A15 15 0 0 0 13 1l8 10-9 9-9-9Z" fill="#b5cada" stroke="#7894ac" strokeWidth="2" />
      <path d="M50 11 11 54" stroke="#865421" strokeWidth="10" strokeLinecap="round" /><path d="M47 15 13 52" stroke="#dba44f" strokeWidth="5" strokeLinecap="round" />
      <path d="M55 3a15 15 0 0 1-13 25l-7-7a15 15 0 0 1 15-20l-8 10 9 9 9-9Z" fill="#d4e3ee" stroke="#7894ac" strokeWidth="2" />
    </>}
    {name === "check" && <>
      <circle cx="32" cy="32" r="29" fill="#2f994c" stroke="#217740" strokeWidth="2" /><path d="M8 25C12 5 39-1 53 19 38 8 18 13 8 25Z" fill="#8bd091" />
      <path d="m17 32 10 10 21-24" stroke="white" strokeWidth="8" strokeLinejoin="round" />
    </>}
  </svg>;
}

function SandboxSign({ small = false }: { small?: boolean }) {
  return small
    ? <h2 id="sandbox-steps-title" className={styles.howSign}><span className="sr-only">How It Works</span><Image src="/images/sandbox/how-it-works.webp" alt="" fill sizes="(max-width: 600px) 90vw, 35vw" /></h2>
    : <h1 id="sandbox-title" className={styles.heroSign}><span className="sr-only">Sandbox — Build Freely</span><Image src="/images/sandbox/sandbox-title.webp" alt="" fill sizes="(max-width: 600px) 96vw, 48vw" preload /></h1>;
}

export default function SandboxPage() {
  return <>
    <main id="main" className={styles.page}>
      <Image src="/images/sandbox/builder-scene.webp" alt="" width={1182} height={1330} sizes="100vw" preload className={styles.scenery} />
      <section className={styles.hero} aria-labelledby="sandbox-title">
        <SandboxSign />
        <div className={styles.intro}>
          <p>Create. Experiment.<br />See what’s possible.</p>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} popoverTarget="sandbox-availability"><SandboxIcon name="gamepad" />Open Sandbox<span aria-hidden="true">›</span></button>
            <a href="#how-it-works" className={styles.secondary}>How It Works<span aria-hidden="true">↓</span></a>
          </div>
        </div>
      </section>
      <div className={styles.content}>
        <section className={styles.features} aria-label="Sandbox features">
          {features.map(feature => <article className={styles.feature} key={feature.title}>
            <div className={styles.imageSlot} aria-hidden="true" />
            <h2>{feature.title}</h2>
            <p>{feature.lines.map(line => <span key={line}>{line}</span>)}</p>
          </article>)}
        </section>
        <section id="how-it-works" className={styles.howItWorks} aria-labelledby="sandbox-steps-title">
          <SandboxSign small />
          <ol className={styles.steps}>
            {steps.map((step, index) => <li key={step.title}>
              <span className={styles.stepNumber} aria-hidden="true">{index + 1}</span>
              <SandboxIcon name={step.icon} />
              <div><h3>{step.title}</h3><p>{step.lines.map(line => <span key={line}>{line}</span>)}</p></div>
            </li>)}
          </ol>
        </section>
      </div>
      <div id="sandbox-availability" popover="auto" role="dialog" aria-labelledby="sandbox-availability-title" className={styles.availability}>
        <h2 id="sandbox-availability-title">Coming October 2026</h2>
        <button type="button" popoverTarget="sandbox-availability" popoverTargetAction="hide" aria-label="Close">×</button>
      </div>
    </main>
    <Footer showIntelligenceInsignia={false} />
  </>;
}
