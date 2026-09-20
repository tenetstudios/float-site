import type { Metadata } from "next";
import { authUser, config, token } from "@/lib/acquisition-server";
import { ReportError } from "@/lib/acquisition";
import Dashboard from "./dashboard";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Acquisition | Admin", robots: { index: false, follow: false } };
export default async function AcquisitionPage() {
  let authorized = false;
  let message = "";
  try { await authUser(await token(), config()); authorized = true; }
  catch (error) {
    if (!(error instanceof ReportError) || error.status !== 401) message = error instanceof ReportError ? error.message : "Sign-in verification is unavailable. Please try again.";
  }
  return <Dashboard authorized={authorized} initialMessage={message} />;
}
