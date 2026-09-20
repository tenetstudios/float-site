# Private acquisition reporting

Dashboard: `/admin/acquisition`. This website uses the same Supabase project as Float; it does not add tracking or modify the mobile app.

## Local configuration

An ignored `.env.local` has been prepared in the website root with your supplied project URL, publishable key and administrator UUID. Open it in your editor and fill **one** server credential:

```env
SUPABASE_SECRET_KEY=your_actual_sb_secret_key
```

Alternatively, leave that empty and use the legacy key:

```env
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
```

Find these in your Supabase project's **Settings → API Keys**. A modern secret key is preferred; a legacy `service_role` JWT is also supported. Never use a publishable/anon key for this server credential. Never prefix it with `NEXT_PUBLIC_`. Do not paste it into chat or commit it. `.env.local` is excluded from Git; `.env.example` contains only safe placeholders.

On another machine, copy `.env.example` to `.env.local`, then fill these variables:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | `https://ytvnwiiwhgevvpcdmezw.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | The project's publishable key (legacy anon also supported) |
| `SUPABASE_SECRET_KEY` | Modern server-only secret key |
| `SUPABASE_SERVICE_ROLE_KEY` | Alternative legacy service-role JWT; not needed when secret key is set |
| `FLOAT_ADMIN_USER_IDS` | Comma-separated allowed Supabase Auth user UUIDs |

Your supplied admin UUID is `569feb10-610c-4a20-aa02-8279ba0ee0c4`. To authorize another account, add its UUID to `FLOAT_ADMIN_USER_IDS` and restart/redeploy. Registration and user-editable metadata cannot grant access. Empty or invalid configuration fails closed.

Choose **Sign in with Google**, then select the same Google account you use in the Float app. You do not need a separate password. Supabase verifies the Google identity, and the website verifies that the resulting Supabase user UUID is in the admin allowlist. Other Google accounts cannot access reports.

## Google sign-in setup

In the same Supabase project, open **Authentication → URL Configuration → Redirect URLs** and add:

```text
http://localhost:3000/api/admin/auth/callback
https://floatgame.io/api/admin/auth/callback
```

The production URL above uses the domain currently configured in `lib/site.ts`. If you serve the site on `www.floatgame.io` or another host, add that host's exact `/api/admin/auth/callback` URL too. For local development on a different port, add the exact URL with that port. Keep existing mobile redirect URLs and the existing Site URL; do not replace them. No new website environment variables or SQL changes are needed for Google sign-in.

Check **Authentication → Sign In / Providers → Google**. Browser OAuth needs a Google **Web application** client ID and its matching client secret. Native Google sign-in working in the app does not by itself prove browser OAuth is configured. If multiple client IDs are configured, keep the mobile IDs and place the web client ID first, following Supabase's provider instructions.

For that web OAuth client in Google Cloud, the authorized redirect URI is the **Supabase** callback:

```text
https://ytvnwiiwhgevvpcdmezw.supabase.co/auth/v1/callback
```

This is different from the website callback added to Supabase's redirect list. The Google client secret belongs in Supabase's Google provider settings, not in the website's `.env.local`. Do not replace the Supabase server secret with a Google client secret. If your Google OAuth app is in Testing mode, your Google account must be permitted as a test user.

After deployment, visit `/admin/acquisition`, choose Sign in with Google and select your Float account. If sign-in fails, confirm both callback configurations above and that the site's server environment uses the same Supabase project and allowed UUID. Start the flow again after a cancellation or expiration. Starting sign-in in a second tab replaces the first tab's pending attempt.

References: [Supabase Google provider setup](https://supabase.com/docs/guides/auth/social-login/auth-google) and [redirect URL allowlist](https://supabase.com/docs/guides/auth/redirect-urls).

## Manual SQL execution order

Use the SQL editor for the same Supabase project. Nothing here automatically executes production SQL.

1. Confirm the mobile project's SQL **016** is installed and `public.player_acquisition` matches the supplied schema. Its actual definition was not available in this website repository.
2. Review and run **`sql/acquisition-reporting.sql`**. It creates indexes and the protected aggregate RPC in one transaction. No original rows, RLS policies, or table grants are changed. The existing `service_role` must already have trusted SELECT access as described in the task.
3. Run **`sql/acquisition-reporting.verify.sql`** in full. It inspects deployed RPC privileges and tests the deployed function body against temporary fixtures, then ends with `ROLLBACK`. Look for the `PASS` notice. If an assertion fails in a persistent SQL session, issue `ROLLBACK` before retrying. Fixtures never enter `public.player_acquisition`.
4. Configure environment variables, restart the website, and sign in to verify live reports.

The SQL files intentionally have no migration number because the shared mobile sequence could not be verified. Index creation uses normal transactional indexes and may temporarily block writes; inspect existing equivalent indexes and schedule the manual setup appropriately for the table's size. Compare query plans on representative real data before adding further indexes. The range index supports every report; campaign/creator/country/platform plus date indexes support selective filters. No low-selectivity paid-status index is added by default.

The verification covers over 1,000 installations, all paid states, inclusive UTC boundaries under a non-UTC database timezone, campaign ID/name, combined filters, null groups, empty ranges and Top 50 limits. It does not prove query performance against production volumes.

## Run and deploy

From `C:\Users\Party\Desktop\float-site`:

```powershell
npm install
npm run dev
```

Open `http://localhost:3000/admin/acquisition`. Restart the server after changing `.env.local`. Sessions last at most one hour and require signing in again when expired. Auto-refresh updates reports, not authentication sessions.

For a production deployment, use a Next.js-compatible **Node server** host (not static export). Set the same environment-variable names privately in the host's project settings, then build with `npm run build` and run with `npm start` (or use the host's Next.js integration). Use HTTPS so the production `__Host-` secure session cookie works. Forward the original host/protocol correctly through a reverse proxy so same-origin sign-in/sign-out checks succeed. Visit `https://your-website/admin/acquisition`. No deployment was performed by this change.

## Reporting behavior and security

- All aggregation occurs in PostgreSQL. One scalar JSON RPC response contains only summary counts, daily counts and explicitly selected grouping dimensions. Supabase's default row limit does not truncate totals. Each breakdown independently returns Top 50 groups; summary and daily counts include all matches.
- Report dates use `first_seen_at`: UTC start midnight through midnight after the inclusive end date. The default is 30 calendar days including today; maximum custom range is 366 days. Filters use exact, case-sensitive matching except country input is normalized to uppercase. Campaign input matches ID or name. Changing inputs requires Apply filters.
- NULL paid status is unknown, not organic. Counts represent installations, not unique accounts. Device locale estimates country; client-reported attribution is unverified. Original pre-tracking installs appear when tracking first observed them.
- Browser-visible data never includes installation IDs, user IDs, secret hashes, URLs or raw attribution. A live Auth user lookup and server allowlist check precede every RPC call. The RPC is security-invoker and executable only by the trusted service role, not anon/authenticated/PUBLIC.
- Google sign-in uses PKCE with a random verifier held in a 10-minute HTTP-only cookie. The code is exchanged on the server, then the user is verified against the admin allowlist before a session is issued. Callback responses clear the verifier and redirect only to the admin page; provider errors are not reflected. Cookies use SameSite=Lax to support the external Google redirect, with Secure and `__Host-` names in production. The session access token is never returned as JSON, and no refresh token is persisted. There is no password endpoint. Extra Supabase MFA challenge screens are not implemented.
- Sign-in/sign-out enforce same-origin requests. Pages and API responses prohibit shared caching. The admin route is noindex, not included in the sitemap, and excluded from the existing website analytics component.
- Refresh occurs every 60 seconds while visible and on return to the tab. In-flight refreshes do not overlap; filter changes cancel the previous request and discard stale responses. Failures retain only same-filter previously successful data with a stale warning, never fabricated zeros.

## Validation

```powershell
npm run test:acquisition
npm run lint
npx tsc --noEmit
npm run build
npm run test:acquisition:api
# Starts an isolated server for Google callback and browser checks:
npm run test:acquisition:api -- --browser
```

Node 22.18+ or Node 24 is needed for the dependency-free TypeScript unit tests. Browser verification uses local Chrome, isolated synthetic responses, and writes screenshots to ignored `artifacts/`; it never requests production analytics. Set `CHROME_PATH` if Chrome is installed elsewhere. The API test harness starts the fixture server on port 3102 and supplies the browser's URL automatically.

SQL fixtures are supplied for manual verification; they are not run by the Node tests. Live account authentication, SQL execution and real report accuracy remain setup checks until you supply the private credential and install the SQL.

Implementation validation completed: 9 unit tests; actual production-route integration tests against an isolated Supabase fixture (admin, non-admin, anonymous and forged sessions, cookies, filters, errors, sign-out and caching); Chrome checks at 320/390/768/1440px, empty/error states, visible-only refresh and stale-response rejection; TypeScript, ESLint and production build. PostgreSQL was not available locally, so the SQL verification file has not been executed. No live credentials were used and no deployment was performed.

Google sign-in validation also passed: PKCE challenge/verifier binding, missing or wrong verifier, cancelled sign-in, consumed-code replay, unauthorized Google account rejection, fixed callback destinations, secure cookies, removal of password sign-in, and the browser's sign-in → callback → dashboard flow against isolated fixtures. A real Google account exchange still requires the provider and redirect settings above and was not attempted by these tests.

An additional run of the existing `scripts/verify-portal.mjs` passed its 320/390px checks but failed `768: substantial posters` (its homepage poster-height assertion). Homepage poster markup and styles were not changed by this task; that unrelated failure remains unresolved.

## Files changed

- `app/admin/acquisition/{page.tsx,dashboard.tsx,dashboard.module.css}`: authorized page and dashboard.
- `app/api/admin/{session,acquisition}/route.ts`: sign-out and protected aggregate API; `app/api/admin/auth/{google,callback}/route.ts`: Google sign-in and PKCE callback.
- `lib/acquisition.ts`, `lib/acquisition-backend.ts`, `lib/acquisition-server.ts`: filters, types, Supabase access, authorization and cookies.
- `sql/acquisition-reporting.sql`, `sql/acquisition-reporting.verify.sql`: manual database setup and rollback-only tests.
- `scripts/test-acquisition.mjs`, `scripts/test-acquisition-api.mjs`, `scripts/fixtures/acquisition-upstream.mjs`, `scripts/verify-acquisition.mjs`: unit, API and browser verification.
- `components/website-analytics.tsx`, `app/layout.tsx`: exclude the private admin route from existing analytics.
- `next.config.ts`: private-page headers; `tsconfig.json`: support the dependency-free TypeScript test imports; `package.json`: test commands.
- `.gitignore`, `.env.example`, `README.md`, `docs/acquisition.md`: configuration protection and instructions. The prepared `.env.local` is ignored and not part of the tracked changes.

Implementation references: [Supabase API key handling](https://supabase.com/docs/guides/getting-started/api-keys) and [Supabase Auth REST endpoints](https://github.com/supabase/auth/blob/master/README.md).
