import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { description, siteUrl } from "@/lib/site";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Float — Frogs Defend. Lions Ascend.", template: "%s | Float" },
  description,
  applicationName: "Float",
  icons: { icon: "/images/brand/float-icon.png", apple: "/images/brand/float-icon.png" },
  openGraph: { type: "website", siteName: "Float", locale: "en_US", title: "Float — Frogs Defend. Lions Ascend.", description },
  twitter: { card: "summary", title: "Float — Frogs Defend. Lions Ascend.", description },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a>{children}<Analytics /></body></html>;
}
