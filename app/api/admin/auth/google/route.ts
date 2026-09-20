import { createHash, randomBytes } from "node:crypto";
import { checkOrigin, config, failure, json, pkceCookie } from "@/lib/acquisition-server";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const cfg = config();
    const verifier = randomBytes(32).toString("base64url");
    const authorize = new URL(`${cfg.url}/auth/v1/authorize`);
    authorize.searchParams.set("provider", "google");
    authorize.searchParams.set("redirect_to", new URL("/api/admin/auth/callback", request.url).href);
    authorize.searchParams.set("code_challenge", createHash("sha256").update(verifier).digest("base64url"));
    authorize.searchParams.set("code_challenge_method", "s256");
    authorize.searchParams.set("prompt", "select_account");
    const response = json({ url: authorize.href });
    response.cookies.set(pkceCookie(verifier));
    return response;
  } catch (error) { return failure(error); }
}
