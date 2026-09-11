import Image from "next/image";
import Link from "next/link";
import { ArtworkSlot } from "@/components/artwork-slot";
import { artwork, frogUnits, lionUnits, multiplayerCopy, trailer } from "@/lib/site";

export function SectionHeading({ number, label, title, children }: { number: string; label: string; title: string; children?: React.ReactNode }) {
  return <div className="section-heading"><p className="eyebrow"><span>{number} /</span> {label}</p><h2>{title}</h2>{children}</div>;
}

export function StorePlaceholders() {
  return <div className="store-links" aria-label="Store availability"><span className="store-placeholder"><span className="store-symbol" aria-hidden="true">↗</span><span><small>Coming soon on the</small>App Store</span></span><span className="store-placeholder"><span className="store-symbol" aria-hidden="true">▷</span><span><small>Coming soon on</small>Google Play</span></span></div>;
}

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-backdrop" aria-hidden="true"><ArtworkSlot asset={{ ...artwork.hero, alt: "" }} position="50% 73%" sizes="620px" /></div>
      <ArtworkSlot asset={artwork.hero} className="hero-art" contain preload sizes="(max-width: 760px) 100vw, (max-width: 1100px) 58vw, 620px" />
      <div className="hero-copy">
        <p className="eyebrow">A very airborne rivalry.</p>
        <h1 id="hero-title" className="sr-only">FLOAT</h1>
        <p className="hero-tagline">Frogs defend.<br /><span>Lions ascend.</span></p>
        <p className="hero-description">Build your defense.<br /> Launch your balloons.</p>
        <p className="hero-date">Coming October 2026</p>
        <div className="hero-actions"><a className="button button-gold" href="#cinematic"><span aria-hidden="true">▷</span> Watch Trailer</a><a className="button button-white" href="#release">Coming Soon</a></div>
      </div>
      <a className="hero-scroll" href="#this-is-float">Welcome to the standoff <span aria-hidden="true">↓</span></a>
    </section>
  );
}

export function ThisIsFloat() {
  return (
    <section className="this-is-float" id="this-is-float">
      <ArtworkSlot asset={artwork.hero} className="overview-art" position="50% 76%" />
      <div className="overview-copy"><p className="eyebrow">This is Float</p><h2>BUILD.<br />DEFEND.<br /><span>OUTLAST.</span></h2><p>One side builds Frog defenses. The other launches Lion Balloons. Things get out of hand. Fast.</p><Link className="text-link" href="/game">Meet the game <span aria-hidden="true">↗</span></Link></div>
    </section>
  );
}

export function GameSideSection() {
  return (
    <div id="sides">
      <section className="faction-section frogs">
        <ArtworkSlot asset={artwork.frogs} className="faction-art" position="43% 52%" />
        <div className="faction-copy"><p className="eyebrow">The Frogs / Ground crew</p><h2>DEFEND<br />THE WALL<span>.</span></h2><p>Deploy frogs.<br />Reinforce your position.<br />Turn the sky into a no-fly zone.</p><div className="faction-motto">SMALL FROGS.<br /><span>BIG FIREPOWER.</span></div><Link className="text-link" href="/game#units">Meet the defenders ↗</Link></div>
      </section>
      <section className="faction-section lions">
        <ArtworkSlot asset={artwork.lions} className="faction-art" position="42% 50%" />
        <div className="faction-copy"><p className="eyebrow">The Lions / Air superiority</p><h2>ASCEND<span>.</span></h2><p>Launch balloon formations.<br />Break the defense.<br />Bring in bombers, gunships and siege airships.</p><div className="faction-motto">BIG MANES.<br /><span>BIGGER PLANS.</span></div><Link className="text-link" href="/game#units">Meet the fleet ↗</Link></div>
      </section>
    </div>
  );
}

export function CampaignSection() {
  return (
    <section className="campaign-section">
      <ArtworkSlot asset={artwork.campaign} className="campaign-art" position="50% 65%" />
      <div className="campaign-copy"><p className="eyebrow">One wall. A whole adventure.</p><h2>THE FREE<br />CAMPAIGN</h2><p>Mission by mission. Frog by frog.<br />The sky only gets more crowded.</p><ul className="campaign-features"><li>Escalating Frog &amp; Lion rosters</li><li>Optional Hard Mode</li><li>No-lives-lost mastery</li></ul><p className="boss-tease">And a campaign-only<br /><strong>BIG BOSS FINALE.</strong></p><Link className="button button-gold" href="/campaign">Your campaign awaits ↗</Link></div>
    </section>
  );
}

export function MultiplayerSection() {
  return (
    <section className="multiplayer-section">
      <div className="match-art" aria-hidden="true"><ArtworkSlot asset={{ ...artwork.frogs, alt: "" }} position="36% 54%" sizes="50vw" /><ArtworkSlot asset={{ ...artwork.lions, alt: "" }} position="38% 50%" sizes="50vw" /></div>
      <div className="multiplayer-copy"><p className="eyebrow">Multiplayer / Two sides. One rivalry.</p><h2><span>BUILD</span><em>VS</em><span>ASCEND</span></h2><p>{multiplayerCopy.description}</p><Link className="button button-white" href="/multiplayer">Challenge the other side ↗</Link></div>
    </section>
  );
}

export function UnitShowcase() {
  return (
    <section className="unit-section" id="units">
      <SectionHeading number="05" label="Meet the escalation" title="WELL, THAT ESCALATED."><p>From a frog on the wall to a Royal Airship on the horizon.</p></SectionHeading>
      {[
        { name: "FROGS", units: frogUnits, tone: "frog-roster", label: "The defense" },
        { name: "LIONS", units: lionUnits, tone: "lion-roster", label: "The offense" },
      ].map(({ name, units, tone, label }) => (
        <div className={`unit-roster ${tone}`} key={name}>
          <div className="roster-heading"><h3>{name}</h3><p className="eyebrow">{label} <span aria-hidden="true">/</span> Scroll to explore →</p></div>
          <div className="unit-scroll" tabIndex={0} role="region" aria-label={`${name} unit progression, scroll horizontally`}>
            <ol className="unit-track">{units.map((unit, i) => <li key={unit.alt}><span className="unit-index">{String(i + 1).padStart(2, "0")}</span><ArtworkSlot asset={unit} contain sizes="(max-width: 760px) 72vw, 300px" /><h4>{unit.alt}</h4></li>)}</ol>
          </div>
        </div>
      ))}
    </section>
  );
}

export function TrailerSection() {
  return (
    <section className="cinematic-section" id="cinematic">
      <div className="cinematic-heading"><p className="eyebrow">From the world of Float</p><h2>FLOAT CINEMATIC</h2><p>Coming Soon</p></div>
      <div className="cinematic-frame">{trailer.embedUrl ? <iframe src={trailer.embedUrl} title="Float cinematic trailer" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" /> : trailer.src ? <video controls preload="none" poster={trailer.poster} aria-label="Float cinematic trailer"><source src={trailer.src} />Your browser does not support video playback.</video> : <div className="cinematic-placeholder"><ArtworkSlot asset={artwork.lions} position="50% 45%" sizes="90vw" /><div className="cinematic-overlay"><span className="play-placeholder" aria-hidden="true">▷</span><p className="eyebrow">The sky is not ready.</p><span>Trailer coming soon</span></div></div>}</div>
    </section>
  );
}

export function ReleaseCTA() {
  return <section className="release-section" id="release"><Image src="/images/brand/float-icon.png" alt="Float app icon" width={112} height={112} className="release-icon" /><p className="eyebrow">See you above the battlefield.</p><h2>FLOAT</h2><p className="release-date">Coming October 2026</p><StorePlaceholders /><p className="release-note">Frogs defend. Lions ascend.</p></section>;
}

export function PageIntro({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return <section className="page-intro"><p className="eyebrow">Float / {label}</p><h1>{title}</h1><div className="intro-copy">{children}</div></section>;
}
