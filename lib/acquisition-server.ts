import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ReportError } from "./acquisition";
export { config, authUser, getReport } from "./acquisition-backend";
export const COOKIE = process.env.NODE_ENV === "production" ? "__Host-float-admin" : "float-admin";
export const privateHeaders = { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" };
export async function token() { return (await cookies()).get(COOKIE)?.value; }
export function json(body: unknown, status = 200) { return NextResponse.json(body, { status, headers: privateHeaders }); }
export function failure(error: unknown) {
  return json({ error: error instanceof ReportError ? error.message : "The service is unavailable. Please try again." }, error instanceof ReportError ? error.status : 502);
}
export function checkOrigin(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) throw new ReportError(403, "This request is not allowed.");
}
export function sessionCookie(value: string, maxAge: number) {
  return { name: COOKIE, value, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge };
}
export const PKCE_COOKIE = process.env.NODE_ENV === "production" ? "__Host-float-admin-pkce" : "float-admin-pkce";
export function pkceCookie(value: string, maxAge = 600) {
  return { ...sessionCookie(value, maxAge), name: PKCE_COOKIE };
}
