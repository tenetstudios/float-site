import Image from "next/image";
import Link from "next/link";
import { ArtworkSlot } from "@/components/artwork-slot";
import { artwork, frogUnits, lionUnits, navigation, trailer } from "@/lib/site";

const modes = [
  { slug: "campaign", label: "Solo", title: "Campaign", lines: ["Fight through escalating missions.", "Master both sides.", "Meet the problem at the end."], note: "Situation developing." },
  { slug: "multiplayer", label: "PVP", title: "Multiplayer", lines: ["Build your wall.", "Send your balloons.", "Break theirs first."], note: "Someone will regret this." },
  { slug: "sandbox", label: "Free play", title: "Sandbox", lines: ["Build anything.", "Test everything.", "See what happens."], note: "Supervision not provided." },
];
export function PortalHero() {
  return (
    <header className="sky-hero" aria-labelledby="portal-title">
      <h1 id="portal-title" className="sr-only">Float</h1>
      <Image
        src="/images/hero/float-web-hero.png"
        alt="Float written in clouds above floating castles, with red and gold lion balloons in a bright blue sky"
        width={1916}
        height={821}
        sizes="100vw"
        preload
        className="sky-hero-image"
      />
      <nav className="sky-hero-links" aria-label="Main navigation">
        {navigation.map(item => (
          <Link key={item.href} href={item.href}>{item.label}<span aria-hidden="true">↗</span></Link>
        ))}
      </nav>
    </header>
  );
}
export function ModeDoors() {
  return <section className="portal-modes" id="modes" aria-label="Game modes"><div className="mode-doors">{modes.map((mode, index) => <Link className={`mode-door mode-${mode.slug}`} href={`/${mode.slug}`} key={mode.slug} aria-labelledby={`${mode.slug}-title`} aria-describedby={`${mode.slug}-copy`}><div className="mode-art"><ArtworkSlot asset={artwork[mode.slug]} contain={mode.slug === "campaign"} position="50% 50%" preload={mode.slug === "campaign"} sizes="(max-width: 700px) 94vw, 32vw" /><span className="mode-number" aria-hidden="true">0{index + 1}</span><span className="mode-label eyebrow">{mode.label}</span></div><div className="mode-copy"><div className="mode-title-row"><h3 id={`${mode.slug}-title`}>{mode.title}</h3><span className="mode-arrow" aria-hidden="true">↗</span></div><p id={`${mode.slug}-copy`}>{mode.lines.map(line => <span key={line}>{line}</span>)}</p><p className="mode-note">{mode.note}</p></div></Link>)}</div></section>;
}
export function GameGlimpse() {
  return <section className="game-glimpse" aria-labelledby="glimpse-title"><div className="glimpse-heading"><h2 id="glimpse-title" className="eyebrow">Known assets</h2><p>Frogs defend. Lions ascend.</p></div><div className="glimpse-sides">{[{ title: "Frogs", asset: artwork.frogsKnownAssets, units: frogUnits, position: "center", role: "Ground crew" }, { title: "Lions", asset: artwork.lionsKnownAssets, units: lionUnits, position: "center", role: "Air traffic" }].map(side => <figure className={`glimpse-side glimpse-${side.title.toLowerCase()}`} key={side.title}><ArtworkSlot asset={side.asset} position={side.position} sizes="(max-width: 700px) 94vw, 45vw" /><figcaption><div><h3>{side.title}</h3><span className="eyebrow">{side.role}</span></div><p>{side.units.map(unit => unit.alt).join(" / ")}</p></figcaption></figure>)}</div></section>;
}
export function PortalCinematic() {
  return <section className="portal-cinematic" aria-labelledby="cinematic-title"><div className="portal-section-heading"><h2 id="cinematic-title">Float cinematic</h2><span className="eyebrow">{trailer.embedUrl || trailer.src ? "Now showing" : "Coming soon"}</span></div><div className="portal-screen">{trailer.embedUrl ? <iframe src={trailer.embedUrl} title="Float cinematic" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" /> : trailer.src ? <video controls preload="none" poster={trailer.poster} aria-label="Float cinematic"><source src={trailer.src} /></video> : <div className="portal-screen-placeholder"><span className="eyebrow">Float / Tenet Studios</span><div><p>FLOAT</p><span className="eyebrow">Cinematic coming soon</span></div><span className="eyebrow">The sky is only the beginning.</span></div>}</div></section>;
}
export function PortalRelease() {
  return <section className="portal-release" aria-labelledby="release-title"><Image src="/images/hero/float-key-art.png" alt="" fill sizes="100vw" className="release-sky" /><div><h2 id="release-title">FLOAT</h2><p>Coming October 2026</p><div className="portal-stores" aria-label="Store availability"><button disabled>App Store<small>Coming soon</small></button><button disabled>Google Play<small>Coming soon</small></button></div><small>The sky situation remains unresolved.</small></div></section>;
}
