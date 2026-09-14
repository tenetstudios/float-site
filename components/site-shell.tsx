import Image from "next/image";
import Link from "next/link";
import { navigation } from "@/lib/site";
export function Header() {
  return <header className="site-header"><Link className="wordmark" href="/" aria-label="Float home">FLOAT</Link><nav aria-label="Main navigation">{navigation.map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav><span className="header-release eyebrow">Coming October 2026</span></header>;
}
export function Footer() {
  return <footer className="site-footer"><div className="footer-top"><Link className="wordmark" href="/">FLOAT</Link><span className="eyebrow">Tenet Studios</span><Link href="/intelligence" className="footer-insignia" aria-label="Lion Intelligence archive"><Image src="/images/intelligence/intelligence-background-eyes-corrected.webp" alt="" width={1672} height={941} sizes="1672px" /></Link></div><div className="footer-bottom"><p>© {new Date().getFullYear()} Tenet Studios</p><nav aria-label="Footer navigation">{[...navigation, { href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" }, { href: "/contact", label: "Contact" }].map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav><a href="#main">Back to sky ↑</a></div></footer>;
}
