import Link from "next/link";
import { navigation } from "@/lib/site";

export function Header() {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="Float home">FLOAT</Link>
      <span className="header-identifier eyebrow">Tenet Studios / Field communications</span>
      <nav aria-label="Main navigation">{navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top"><Link className="wordmark" href="/">FLOAT</Link><p className="eyebrow">End of report</p><span className="eyebrow">Tenet Studios</span></div>
      <div className="footer-bottom"><p>© {new Date().getFullYear()} Tenet Studios</p><nav aria-label="Footer navigation">{[...navigation, { href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" }, { href: "/contact", label: "Contact" }].map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav><a href="#main">Return to top ↑</a></div>
    </footer>
  );
}
