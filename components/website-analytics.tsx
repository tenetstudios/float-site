"use client";
import { Analytics } from "@vercel/analytics/next";
import { usePathname } from "next/navigation";
export default function WebsiteAnalytics() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <Analytics beforeSend={event => new URL(event.url).pathname.startsWith("/admin") ? null : event} />;
}
