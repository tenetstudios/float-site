import Image from "next/image";
import Link from "next/link";
import { pageMetadata } from "@/lib/site";
import styles from "./multiplayer.module.css";

export const metadata = pageMetadata(
  "Multiplayer",
  "/multiplayer",
  "Defend as frogs. Attack as lions. Face off above the clouds in Float’s 1v1 online PvP.",
);

const features = [
  { title: "Play as Frogs", lines: ["Build, defend, and hold the skies", "with clever strategy."] },
  { title: "Play as Lions", lines: ["Launch aerial assaults and", "overwhelm enemy defenses."] },
  { title: "1v1 Online PvP", lines: ["Real players. Real battles.", "See who rules the sky."] },
];

const steps = [
  { title: "Build Defense", copy: "Set up cannons and fortify your floating island.", icon: "wall" },
  { title: "Launch Assault", copy: "Send in your forces and break their lines.", icon: "balloon" },
  { title: "Survive or Break Through", copy: "Outplay your opponent and claim victory.", icon: "swords" },
] as const;

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      {name === "gamepad" && <><path d="M14 10h20c8 0 13 25 8 28-4 3-10-6-13-7H19c-3 1-9 10-13 7C1 35 6 10 14 10Z" fill="currentColor" /><path d="M15 17v12m-6-6h12" stroke="#7c2bec" strokeWidth="4" strokeLinecap="round" /><circle cx="33" cy="19" r="2.5" fill="#7c2bec" /><circle cx="38" cy="25" r="2.5" fill="#7c2bec" /></>}
      {name === "play" && <path d="M13 7a3 3 0 0 1 4-2l25 16a4 4 0 0 1 0 6L17 43a3 3 0 0 1-4-2Z" fill="currentColor" />}
      {name === "wall" && <g stroke="#73695f" strokeWidth="1.3" strokeLinejoin="round"><path d="m6 29 9-4 12 4-9 5Z" fill="#d7cabb" /><path d="M6 29v12l12 5V34Z" fill="#a99c8e" /><path d="m18 34 9-5v12l-9 5Z" fill="#80786f" /><path d="m24 26 10-4 12 4-10 5Z" fill="#e3d5c2" /><path d="M24 26v14l12 5V31Z" fill="#b7a58e" /><path d="m36 31 10-5v14l-10 5Z" fill="#887a68" /><path d="m15 9 10-4 12 4-10 5Z" fill="#ddd3c5" /><path d="M15 9v15l12 5V14Z" fill="#b6aa9b" /><path d="m27 14 10-5v15l-10 5Z" fill="#877f74" /></g>}
      {name === "balloon" && <><path d="m13 27 6 13m16-13-6 13" stroke="#8f5729" strokeWidth="2" /><rect x="18" y="38" width="12" height="9" rx="2" fill="#aa6b32" /><path d="M24 1C2 1 0 24 17 32l7 5 7-5C48 24 46 1 24 1Z" fill="#f04435" /><ellipse cx="24" cy="17" rx="13" ry="16" fill="#ff6040" /><path d="m14 10 5-3 5 4 5-4 5 3-3 7 3 6-10 8-10-8 3-6Z" fill="#ffc43d" /><circle cx="20" cy="17" r="1.7" fill="#953d28" /><circle cx="28" cy="17" r="1.7" fill="#953d28" /><path d="m21 22 3 3 3-3Z" fill="#953d28" /></>}
      {name === "swords" && <><path d="m7 3 10 3 27 31-7 7L6 13Z" fill="#c7d8ee" /><path d="m7 3 33 37" stroke="#879db9" strokeWidth="3" /><path d="m29 39 10-10M37 41l7 5" stroke="#98662e" strokeWidth="5" strokeLinecap="round" /><path d="m41 3-10 3L4 37l7 7 31-31Z" fill="#dce9f5" /><path d="M41 3 8 37" stroke="#879db9" strokeWidth="3" /><path d="M19 39 9 29m2 12-7 5" stroke="#98662e" strokeWidth="5" strokeLinecap="round" /></>}
    </svg>
  );
}

export default function MultiplayerPage() {
  return (
    <div className={styles.page}>
      <Image src="/images/multiplayer/sky-scene-lion-crew.webp" alt="" fill sizes="100vw" preload className={styles.scenery} />
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Float home">Float</Link>
      </header>

      <main id="main" className={styles.main}>
        <section className={styles.hero} aria-labelledby="multiplayer-title">
          <h1 id="multiplayer-title" className="sr-only">Multiplayer — Online PvP</h1>
          <div className={styles.intro}>
            <p>Defend <span>as frogs.</span> Attack <span>as lions.</span> Face off above the clouds.</p>
            <div className={styles.actions}>
              <button type="button" className={styles.primary} popoverTarget="multiplayer-availability"><Icon name="gamepad" />Play Multiplayer<span aria-hidden="true">›</span></button>
              <a href="#how-it-works" className={styles.secondary}><Icon name="play" />How It Works<span aria-hidden="true">›</span></a>
            </div>
          </div>
        </section>

        <section className={styles.features} aria-label="Multiplayer features">
          {features.map(feature => (
            <article className={styles.feature} key={feature.title}>
              <div className={styles.imageSlot} aria-hidden="true" />
              <h2>{feature.title}</h2>
              <p>{feature.lines.map(line => <span key={line}>{line}</span>)}</p>
            </article>
          ))}
        </section>

        <section id="how-it-works" className={styles.howItWorks} aria-labelledby="match-title">
          <h2 id="match-title" className={styles.matchSign}>How a Match Works</h2>
          <ol className={styles.steps}>
            {steps.map((step, index) => (
              <li key={step.title}>
                <span className={styles.stepNumber} aria-hidden="true">{index + 1}</span>
                <Icon name={step.icon} className={styles.stepIcon} />
                <div><h3>{step.title}</h3><p>{step.copy}</p></div>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <div id="multiplayer-availability" popover="auto" className={styles.availability}>
        <h2>Coming October 2026</h2>
        <button type="button" popoverTarget="multiplayer-availability" popoverTargetAction="hide" aria-label="Close">×</button>
      </div>
    </div>
  );
}
