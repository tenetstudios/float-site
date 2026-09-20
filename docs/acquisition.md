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

Use the email and password belonging to that **existing Supabase Auth account**. This implementation does not create accounts, set passwords, or add social sign-in. If the account uses only Apple/Google/another provider, email/password sign-in needs to be enabled for that same account through your existing account-management flow before using this screen. Do not create a replacement account with a different UUID and expect access.

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
- The access token lives in a same-site, HTTP-only cookie, secure in production. It is never returned as JSON. No refresh token is persisted. Passwords are forwarded only to Supabase Auth and never logged/stored. Supabase enforces its configured sign-in limits; if your project requires CAPTCHA/MFA, that additional flow is not implemented in this screen.
- Sign-in/sign-out enforce same-origin requests. Pages and API responses prohibit shared caching. The admin route is noindex, not included in the sitemap, and excluded from the existing website analytics component.
- Refresh occurs every 60 seconds while visible and on return to the tab. In-flight refreshes do not overlap; filter changes cancel the previous request and discard stale responses. Failures retain only same-filter previously successful data with a stale warning, never fabricated zeros.

## Validation

```powershell
npm run test:acquisition
npm run lint
npx tsc --noEmit
npm run build
npm run test:acquisition:api
# With a local server running:
node scripts/verify-acquisition.mjs
```

Node 22.18+ or Node 24 is needed for the dependency-free TypeScript unit tests. Browser verification uses local Chrome, isolated synthetic responses, and writes screenshots to ignored `artifacts/`; it never requests production analytics. Override `ACQUISITION_TEST_URL` and `CHROME_PATH` if needed.

SQL fixtures are supplied for manual verification; they are not run by the Node tests. Live account authentication, SQL execution and real report accuracy remain setup checks until you supply the private credential and install the SQL.

Implementation validation completed: 9 unit tests; actual production-route integration tests against an isolated Supabase fixture (admin, non-admin, anonymous and forged sessions, cookies, filters, errors, sign-out and caching); Chrome checks at 320/390/768/1440px, empty/error states, visible-only refresh and stale-response rejection; TypeScript, ESLint and production build. PostgreSQL was not available locally, so the SQL verification file has not been executed. No live credentials were used and no deployment was performed.

An additional run of the existing `scripts/verify-portal.mjs` passed its 320/390px checks but failed `768: substantial posters` (its homepage poster-height assertion). Homepage poster markup and styles were not changed by this task; that unrelated failure remains unresolved.

## Files changed

- `app/admin/acquisition/{page.tsx,dashboard.tsx,dashboard.module.css}`: authorized page and dashboard.
- `app/api/admin/{session,acquisition}/route.ts`: sign-in/sign-out and protected aggregate API.
- `lib/acquisition.ts`, `lib/acquisition-backend.ts`, `lib/acquisition-server.ts`: filters, types, Supabase access, authorization and cookies.
- `sql/acquisition-reporting.sql`, `sql/acquisition-reporting.verify.sql`: manual database setup and rollback-only tests.
- `scripts/test-acquisition.mjs`, `scripts/test-acquisition-api.mjs`, `scripts/fixtures/acquisition-upstream.mjs`, `scripts/verify-acquisition.mjs`: unit, API and browser verification.
- `components/website-analytics.tsx`, `app/layout.tsx`: exclude the private admin route from existing analytics.
- `next.config.ts`: private-page headers; `tsconfig.json`: support the dependency-free TypeScript test imports; `package.json`: test commands.
- `.gitignore`, `.env.example`, `README.md`, `docs/acquisition.md`: configuration protection and instructions. The prepared `.env.local` is ignored and not part of the tracked changes.

Implementation references: [Supabase API key handling](https://supabase.com/docs/guides/getting-started/api-keys) and [Supabase Auth REST endpoints](https://github.com/supabase/auth/blob/master/README.md).
