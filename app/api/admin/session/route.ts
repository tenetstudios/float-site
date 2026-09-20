import { ReportError } from "@/lib/acquisition";
import { authUser, checkOrigin, config, failure, json, sessionCookie, token } from "@/lib/acquisition-server";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const cfg = config();
    if (!request.headers.get("content-type")?.startsWith("application/json")) throw new ReportError(400, "Invalid sign-in request.");
    const text = await request.text();
    if (text.length > 4096) throw new ReportError(400, "Invalid sign-in request.");
    let body;
    try { body = JSON.parse(text); } catch { throw new ReportError(400, "Invalid sign-in request."); }
    if (typeof body?.email !== "string" || body.email.length > 254 || !body.email.includes("@") || typeof body.password !== "string" || !body.password || body.password.length > 1024) throw new ReportError(400, "Enter your email and password.");
    const response = await fetch(`${cfg.url}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: cfg.publicKey, "Content-Type": "application/json" }, body: JSON.stringify({ email: body.email.trim(), password: body.password }), cache: "no-store", signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new ReportError(response.status === 429 ? 429 : response.status >= 500 ? 502 : 401, response.status === 429 ? "Too many sign-in attempts. Please wait before trying again." : "Sign-in failed. Check your credentials and try again.");
    const session = await response.json();
    if (typeof session.access_token !== "string" || !Number.isFinite(session.expires_in)) throw new ReportError(502, "Sign-in did not return a valid session.");
    await authUser(session.access_token, cfg);
    const result = json({ ok: true });
    result.cookies.set(sessionCookie(session.access_token, Math.max(0, Math.min(session.expires_in, 3600))));
    return result;
  } catch (error) { return failure(error); }
}
export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    const access = await token();
    let revoked = true;
    if (access) {
      try {
        const cfg = config();
        const response = await fetch(`${cfg.url}/auth/v1/logout?scope=local`, { method: "POST", headers: { apikey: cfg.publicKey, Authorization: `Bearer ${access}` }, cache: "no-store", signal: AbortSignal.timeout(10000) });
        revoked = response.ok || response.status === 401;
      } catch { revoked = false; }
    }
    const result = json({ ok: true, revoked });
    result.cookies.set(sessionCookie("", 0));
    return result;
  } catch (error) { return failure(error); }
}
