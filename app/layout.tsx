import type { Metadata } from "next";
import { Header, Footer } from "@/components/site-shell";
import { description, siteUrl } from "@/lib/site";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Float — Frogs Defend. Lions Ascend.", template: "%s | Float" },
  description,
  applicationName: "Float",
  openGraph: { type: "website", siteName: "Float", locale: "en_US", title: "Float — Frogs Defend. Lions Ascend.", description },
  twitter: { card: "summary", title: "Float — Frogs Defend. Lions Ascend.", description },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a><Header /><main id="main">{children}</main><Footer /></body></html>;
}
