import Image from "next/image";
import Link from "next/link";

export function IntelligenceHeader() {
  return (
    <header className="intelligence-header">
      <div className="intelligence-identity">
        <span className="intelligence-insignia" aria-hidden="true">
          <Image src="/images/intelligence/intelligence-background-eyes-corrected.webp" alt="" width={1672} height={941} sizes="1672px" />
        </span>
        <h1>Lion Intelligence Directorate</h1>
      </div>
      <p className="intelligence-clearance">Clearance: Command<span>Archive access // authorized</span></p>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="intelligence-footer">
      <div className="intelligence-downloads">
        <span>Get the game</span>
        <button disabled><span>App Store</span><small>Coming soon</small></button>
        <button disabled><span>Google Play</span><small>Coming soon</small></button>
      </div>
      <nav aria-label="Footer navigation">
        {["About", "Privacy", "Terms", "Safety", "Contact"].map(label => <Link key={label} href={`/${label.toLowerCase()}`}>{label}</Link>)}
      </nav>
    </footer>
  );
}
