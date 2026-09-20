import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ReportError } from "@/lib/acquisition";
import { authUser, config, PKCE_COOKIE, pkceCookie, privateHeaders, sessionCookie } from "@/lib/acquisition-server";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const destination = new URL("/admin", request.url);
  let access: string | undefined;
  let lifetime = 0;
  try {
    const cfg = config();
    const params = new URL(request.url).searchParams;
    const verifier = (await cookies()).get(PKCE_COOKIE)?.value;
    const code = params.get("code");
    if (params.has("error")) throw new ReportError(401, "cancelled");
    if (!code || code.length > 2048 || params.getAll("code").length !== 1 || !verifier || !/^[A-Za-z0-9_-]{43}$/.test(verifier)) throw new ReportError(401, "expired");
    const response = await fetch(`${cfg.url}/auth/v1/token?grant_type=pkce`, {
      method: "POST", headers: { apikey: cfg.publicKey, "Content-Type": "application/json" },
      body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
      cache: "no-store", signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new ReportError(response.status >= 500 ? 502 : 401, "exchange");
    const session = await response.json();
    if (typeof session.access_token !== "string" || !Number.isFinite(session.expires_in) || session.expires_in <= 0) throw new ReportError(502, "session");
    await authUser(session.access_token, cfg);
    access = session.access_token;
    lifetime = Math.min(session.expires_in, 3600);
  } catch (error) {
    // Never forward provider error strings, credentials, or caller-supplied redirect destinations.
    destination.searchParams.set("auth_error", error instanceof ReportError && error.status === 403 ? "unauthorized" : error instanceof ReportError && error.status === 503 ? "configuration" : "signin");
  }
  const result = NextResponse.redirect(destination, { status: 303, headers: privateHeaders });
  result.cookies.set(pkceCookie("", 0));
  result.cookies.set(sessionCookie(access || "", lifetime));
  return result;
}
