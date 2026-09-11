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
  return <section className="hero"><div className="hero-topline"><span className="eyebrow"><span className="status-dot" /> Strategy. With a serious air problem.</span><span className="eyebrow">01 — The standoff</span></div><div className="hero-stage"><ArtworkSlot asset={artwork.hero} label="The battlefield is taking shape. Artwork coming soon." className="hero-art" preload /><div className="hero-title"><p className="eyebrow">Welcome to</p><h1>FLOAT<span className="title-period">.</span></h1><p className="hero-tagline"><span>Frogs defend.</span><span>Lions ascend.</span></p></div><span className="hero-side-note eyebrow">Ground control meets animal ambition</span></div><div className="hero-bottom"><div><p className="hero-description">Build your defense. Launch your balloons.<br />Break the other side before they break you.</p><div className="hero-actions"><a className="button" href="#cinematic"><span aria-hidden="true">▷</span> Watch trailer <small>Coming soon</small></a><a className="text-link" href="#sides">Enter the standoff <span aria-hidden="true">↓</span></a></div></div><div className="hero-release"><p className="eyebrow">Coming October 2026</p><StorePlaceholders /></div></div></section>;
}

export function GameSideSection() {
  return <section className="section" id="sides"><SectionHeading number="02" label="Choose your side" title="Nature’s most unnecessary rivalry."><p>One wall. Two very different approaches to conflict resolution.</p></SectionHeading><div className="sides-grid"><article className="side frogs"><div className="side-top"><span className="eyebrow">01 / Ground crew</span><span aria-hidden="true">↙</span></div><h3>FROGS</h3><ArtworkSlot asset={artwork.frogs} contain /><div className="side-copy"><h4>Stand your ground.</h4><p>Defend the wall. Deploy specialized frogs. Build increasingly ridiculous anti-air defenses.</p></div></article><span className="versus" aria-hidden="true">VS</span><article className="side lions"><div className="side-top"><span className="eyebrow">02 / Air superiority</span><span aria-hidden="true">↗</span></div><h3>LIONS</h3><ArtworkSlot asset={artwork.lions} contain /><div className="side-copy"><h4>Make an entrance.</h4><p>Launch balloon formations. Overwhelm the defense. Bring in bombers, gunships and siege airships.</p></div></article></div></section>;
}

export function CampaignSection() {
  return <section className="section campaign-section"><div className="campaign-copy"><SectionHeading number="03" label="The free campaign" title="Start small. End with a BIG problem."><p>Work through mission-based progression with an escalating Frog and Lion roster. The sky only gets more crowded.</p></SectionHeading><ul className="feature-list"><li><span>01</span>Take on optional Hard Mode</li><li><span>02</span>Master missions with no lives lost</li><li><span>03</span>Face the campaign-only BIG BOSS Balloon</li></ul><p className="muted">The final encounter? We’re keeping that one under wraps.</p><Link className="text-link" href="/campaign">Explore the campaign ↗</Link></div><ArtworkSlot asset={artwork.campaign} label="Campaign artwork coming soon" className="campaign-art" /></section>;
}

export function MultiplayerSection() {
  return <section className="section multiplayer-section"><SectionHeading number="04" label="Multiplayer" title={multiplayerCopy.title}><p>{multiplayerCopy.description}</p></SectionHeading><div className="versus-loop" aria-label="Build, attack, reverse roles"><span>BUILD<span className="lime">↓</span></span><span>ATTACK<span className="amber">↑</span></span><p className="eyebrow">Switch sides. Rethink everything. ↺</p></div><Link className="text-link" href="/multiplayer">Meet your next rivalry ↗</Link></section>;
}

export function UnitShowcase() {
  return <section className="section" id="units"><SectionHeading number="05" label="The escalation" title="Well, that escalated quickly."><p>From the first frog on the wall to a Royal Airship on the horizon. Reinforce your walls. Prepare for siege warfare.</p></SectionHeading>{[{ name: "The defense", units: frogUnits, tone: "lime" }, { name: "The offense", units: lionUnits, tone: "amber" }].map(({ name, units, tone }) => <div className="unit-roster" key={name}><h3 className={`eyebrow ${tone}`}>{name} <span aria-hidden="true">→</span></h3><ol className="unit-grid">{units.map((unit, i) => <li key={unit.alt}><div className="unit-index">{String(i + 1).padStart(2, "0")}<span aria-hidden="true">↗</span></div><ArtworkSlot asset={unit} label="Art coming soon" contain /><h4>{unit.alt}</h4></li>)}</ol></div>)}</section>;
}

export function TrailerSection() {
  return <section className="section" id="cinematic"><div className="cinematic-frame">{trailer.embedUrl ? <iframe src={trailer.embedUrl} title="Float cinematic trailer" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" /> : trailer.src ? <video controls preload="none" poster={trailer.poster} aria-label="Float cinematic trailer"><source src={trailer.src} />Your browser does not support video playback.</video> : <div className="cinematic-placeholder"><span className="eyebrow cinematic-label">06 / From the world of Float</span><span className="play-placeholder" aria-hidden="true">▷</span><h2>FLOAT CINEMATIC</h2><p className="eyebrow">Coming Soon</p><span className="cinematic-footnote">Some rivalries deserve a bigger screen.</span></div>}</div></section>;
}

export function ReleaseCTA() {
  return <section className="release-section" id="release"><p className="eyebrow">Clear your schedule. And the skies.</p><h2>FLOAT<span>.</span></h2><p className="release-date">Coming October 2026</p><StorePlaceholders /><p className="release-note">Frogs defend. Lions ascend. You decide what happens next.</p></section>;
}

export function PageIntro({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return <section className="page-intro"><p className="eyebrow">Float / {label}</p><h1>{title}</h1><div className="intro-copy">{children}</div></section>;
}
