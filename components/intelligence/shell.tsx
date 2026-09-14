import Image from "next/image";
import Link from "next/link";

export function IntelligenceHeader() {
  return (
    <header className="intelligence-header">
      <div className="intelligence-identity">
        <span className="intelligence-insignia" aria-hidden="true">
          <Image src="/images/intelligence/footer-lion-insignia.png" alt="" width={1024} height={1536} sizes="48px" />
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
        <Link href="/">Home</Link>
        {["About", "Privacy", "Terms", "Safety", "Contact"].map(label => <Link key={label} href={`/${label.toLowerCase()}`}>{label}</Link>)}
      </nav>
    </footer>
  );
}
