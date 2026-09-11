import Link from "next/link";
import { navigation } from "@/lib/site";

export function Header() {
  return <header className="site-header"><Link className="wordmark" href="/" aria-label="Float home">FLOAT<span aria-hidden="true">↗</span></Link><nav aria-label="Main navigation">{navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav><Link className="header-release" href="/#release"><span className="status-dot" />Coming October 2026<span aria-hidden="true">↗</span></Link></header>;
}

export function Footer() {
  return <footer className="site-footer"><div className="footer-top"><Link className="wordmark" href="/">FLOAT</Link><p>A little absurd. A lot at stake.</p><span className="eyebrow">Tenet Studios</span></div><div className="footer-bottom"><p>© {new Date().getFullYear()} Tenet Studios</p><nav aria-label="Footer navigation">{[...navigation, { href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" }, { href: "/contact", label: "Contact" }].map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav><a href="#main">Back to top ↑</a></div></footer>;
}
