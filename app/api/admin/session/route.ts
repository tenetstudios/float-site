import { checkOrigin, config, failure, json, sessionCookie, token } from "@/lib/acquisition-server";
export const dynamic = "force-dynamic";
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
