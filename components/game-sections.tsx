import Link from "next/link";
import { ArtworkSlot } from "@/components/artwork-slot";
import { artwork, frogUnits, lionUnits, multiplayerCopy, trailer, type Artwork } from "@/lib/site";

export function SectionHeading({ number, label, title, children }: { number: string; label: string; title: string; children?: React.ReactNode }) {
  return <div className="section-heading"><p className="eyebrow">{number} / {label}</p><h2>{title}</h2>{children}</div>;
}

function TechnicalFields({ entries }: { entries: { label: string; value: string }[] }) {
  return <dl className="technical-fields">{entries.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

export function StorePlaceholders() {
  return <div className="store-links" aria-label="Store availability"><div className="store-placeholder"><span>App Store</span><small>Coming soon</small></div><div className="store-placeholder"><span>Google Play</span><small>Coming soon</small></div></div>;
}

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <h1 id="hero-title" className="sr-only">FLOAT — Field Report 001</h1>
      <div className="report-masthead"><p className="eyebrow">Field report 001</p><p className="eyebrow">Coming October 2026</p></div>
      <figure className="opening-figure">
        <ArtworkSlot asset={artwork.hero} className="hero-art" position="50% 43%" preload sizes="100vw" />
        <figcaption><p>Aerial activity has increased.</p><span className="eyebrow">Float / Situation report</span><a href="#situation" aria-label="Read the current situation">Continue <span aria-hidden="true">↓</span></a></figcaption>
      </figure>
    </section>
  );
}

export function SituationStrip() {
  return <section className="situation-strip" id="situation" aria-labelledby="situation-title"><h2 id="situation-title">Current situation</h2><TechnicalFields entries={[{ label: "Lions", value: "Ascending" }, { label: "Frogs", value: "Present" }, { label: "Wall", value: "Holding" }, { label: "Outcome", value: "Pending" }]} /></section>;
}

function AssetReport({ designation, reference, asset, entries, caption, className, position }: { designation: string; reference: string; asset: Artwork; entries: { label: string; value: string }[]; caption: string; className: string; position: string }) {
  return (
    <section className={`asset-report ${className}`}>
      <div className="asset-heading"><h2>{designation}</h2><span className="eyebrow">{reference}</span></div>
      <figure><ArtworkSlot asset={asset} className="asset-study" position={position} sizes="(max-width: 760px) 100vw, 1000px" /><figcaption>{caption}</figcaption></figure>
      <aside className="asset-record" aria-label={`${designation} field record`}><p className="eyebrow">Field observation</p><TechnicalFields entries={entries} /><span className="record-mark" aria-hidden="true">{reference}</span></aside>
    </section>
  );
}

export function ThisIsFloat() {
  return <div className="field-observations"><AssetReport designation="Defensive asset / Frog" reference="FIG. 01" asset={artwork.frogs} entries={[{ label: "Status", value: "Active" }, { label: "Role", value: "Prevent ascension" }]} caption="Appears unbothered." className="frog-report" position="35% 35%" /><AssetReport designation="Hostile airframe / Lion Balloon" reference="FIG. 02" asset={artwork.lions} entries={[{ label: "Altitude", value: "Unhelpful" }, { label: "Direction", value: "This way" }, { label: "Threat", value: "Increasing" }]} caption="Unfortunately airborne." className="lion-report" position="60% 35%" /></div>;
}

export function GameSideSection() {
  return (
    <section className="doctrine-section" id="sides">
      <div className="doctrine-heading"><p className="eyebrow">Opposing doctrines</p><p>Frogs defend. Lions ascend.</p></div>
      <div className="doctrine-grid">
        <article className="doctrine frog-doctrine"><p className="eyebrow">01 / Your side</p><ArtworkSlot asset={artwork.frogs} position="35% 48%" className="doctrine-art" sizes="(max-width: 760px) 100vw, 50vw" /><div className="doctrine-copy"><h2>Defensive doctrine</h2><p>Build walls.<br />Deploy frogs.<br />Escalate as required.</p><p className="caption">More frogs remain an approved response.</p></div></article>
        <article className="doctrine lion-doctrine"><p className="eyebrow">02 / The problem</p><ArtworkSlot asset={artwork.lions} position="38% 50%" className="doctrine-art" sizes="(max-width: 760px) 100vw, 50vw" /><div className="doctrine-copy"><h2>Ascension doctrine</h2><p>Launch balloons.<br />Apply pressure.<br />Ignore objections.</p><p className="caption">They continue to arrive.</p></div></article>
      </div>
    </section>
  );
}

export function CampaignSection() {
  return (
    <section className="operations-section">
      <div className="operations-heading"><SectionHeading number="03" label="Campaign dossier" title="FIELD OPERATIONS" /><span className="eyebrow">Single-player / Free campaign</span></div>
      <div className="operations-grid"><div className="operation-file"><p className="file-label eyebrow">Operational requirements</p><ol className="mission-rows"><li><span>01</span><div><h3>Mission progression</h3><p>Escalating Frog and Lion rosters.</p></div></li><li><span>02</span><div><h3>Hard Mode</h3><p>Optional.</p></div></li><li><span>03</span><div><h3>Mastery</h3><p>No lives lost.</p></div></li></ol><p className="caption">Further escalation is anticipated.</p><Link className="text-link" href="/campaign">Campaign file <span aria-hidden="true">↗</span></Link></div><figure className="operation-figure"><ArtworkSlot asset={artwork.campaign} position="50% 68%" sizes="(max-width: 760px) 100vw, 45vw" /><figcaption>Operational environment / Escalating aerial incidents.</figcaption></figure></div>
    </section>
  );
}

export function MultiplayerSection() {
  return (
    <section className="exercises-section">
      <SectionHeading number="04" label="Multiplayer" title="LIVE EXERCISES"><p>One player builds the problem.<br />The other player sends more problems.</p></SectionHeading>
      <div className="tactical-diagram" aria-label="Defender and attacker exchange roles"><div className="tactical-side defender"><p className="eyebrow">Position 01</p><h3>DEFENDER</h3><p>Frogs / Walls / Poor Sleep</p><span className="tactical-line" aria-hidden="true" /></div><div className="role-exchange"><span aria-hidden="true">⇄</span><p className="eyebrow">Roles reverse</p></div><div className="tactical-side attacker"><p className="eyebrow">Position 02</p><h3>ATTACKER</h3><p>Balloons / Siege / Worse Intentions</p><span className="tactical-line" aria-hidden="true" /></div></div>
      <div className="exercise-footer"><p>{multiplayerCopy.description}</p><Link className="text-link" href="/multiplayer">Exercise briefing ↗</Link></div>
    </section>
  );
}

const inventoryNotes: Record<string, string> = {
  "Basic Frog": "Present.",
  "Rocket Frog": "Escalation approved.",
  "Flak Frog": "Classification: Probably excessive.",
  "Anti-Aircraft Frog": "Classification: Definitely excessive.",
  "Lion Balloon": "Observed.",
  "Shield Balloon": "Objections anticipated.",
  "War Balloon": "Bombs confirmed.",
  "Dread Balloon": "Continued observation advised.",
  "Royal Airship": "Situation deteriorating.",
};

export function UnitShowcase() {
  return (
    <section className="inventory-section" id="units">
      {[
        { title: "DEFENSIVE INVENTORY", units: frogUnits, tone: "frog-inventory", prefix: "D" },
        { title: "KNOWN LION ACTIVITY", units: lionUnits, tone: "lion-inventory", prefix: "A" },
      ].map(({ title, units, tone, prefix }) => (
        <div className={`inventory ${tone}`} key={title}>
          <div className="inventory-heading"><h2>{title}</h2><p className="eyebrow">Designation index / {prefix}</p></div>
          <div className="inventory-scroll" role="region" tabIndex={0} aria-label={`${title}, scroll horizontally for all entries`}><ol className="inventory-grid">{units.map((unit, i) => <li key={unit.alt}><p className="eyebrow">{prefix}—{String(i + 1).padStart(2, "0")}</p><ArtworkSlot asset={unit} contain label="Visual record pending" sizes="(max-width: 760px) 75vw, 270px" /><p className="designation-label">Designation</p><h3>{unit.alt}</h3><p className="caption">{inventoryNotes[unit.alt]}</p></li>)}</ol></div>
        </div>
      ))}
    </section>
  );
}

export function ClassifiedThreat() {
  return <section className="classified-section" aria-labelledby="classified-title"><span className="eyebrow">Campaign only / Final entry</span><div><h2 id="classified-title">CLASSIFIED</h2><p className="eyebrow">Final campaign threat</p><p className="caption">Details withheld.</p></div><span className="classification-code eyebrow">BIG BOSS / Record sealed</span></section>;
}

export function TrailerSection() {
  return (
    <section className="cinematic-section" id="cinematic">
      <div className="screening-heading"><div><p className="eyebrow">Visual record</p><h2>FLOAT CINEMATIC</h2></div><TechnicalFields entries={[{ label: "Status", value: "Incoming" }]} /></div>
      <div className="cinematic-frame">{trailer.embedUrl ? <iframe src={trailer.embedUrl} title="Float cinematic trailer" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" /> : trailer.src ? <video controls preload="none" poster={trailer.poster} aria-label="Float cinematic trailer"><source src={trailer.src} />Your browser does not support video playback.</video> : <div className="screening-placeholder"><p className="eyebrow">Visual record / 001</p><div><span className="screening-cross" aria-hidden="true">+</span><p>Awaiting transmission.</p><span className="eyebrow">Coming soon</span></div><span className="eyebrow">Float / Tenet Studios</span></div>}</div>
      <div className="screening-footer"><span>Briefing room / Visual documentation</span><span>Release pending</span></div>
    </section>
  );
}

export function ReleaseCTA() {
  return <section className="release-section" id="release"><div className="deployment-heading"><p className="eyebrow">Deployment</p><h2>OCTOBER 2026</h2><p className="caption">Assuming the wall holds.</p></div><div className="deployment-platforms"><p className="eyebrow">Planned distribution</p><StorePlaceholders /></div></section>;
}

export function PageIntro({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return <section className="page-intro"><p className="eyebrow">Float / {label}</p><h1>{title}</h1><div className="intro-copy">{children}</div></section>;
}
