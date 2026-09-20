import type { Metadata } from "next";
import { authUser, config, token } from "@/lib/acquisition-server";
import { ReportError } from "@/lib/acquisition";
import Dashboard from "./acquisition/dashboard";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Acquisition | Admin", robots: { index: false, follow: false } };
export default async function AcquisitionPage({ searchParams }: { searchParams: Promise<{ auth_error?: string }> }) {
  let authorized = false;
  let message = "";
  try { await authUser(await token(), config()); authorized = true; }
  catch (error) {
    if (!(error instanceof ReportError) || error.status !== 401) message = error instanceof ReportError ? error.message : "Sign-in verification is unavailable. Please try again.";
  }
  const { auth_error } = await searchParams;
  if (!authorized && auth_error) {
    message = auth_error === "unauthorized" ? "This Google account is not authorized. Choose the account you use in Float."
      : auth_error === "configuration" ? "Admin reporting is not configured. Follow docs/acquisition.md."
      : "Google sign-in was cancelled, expired, or could not be completed. Please try again.";
  }
  return <Dashboard authorized={authorized} initialMessage={message} />;
}
