# Admin analytics and retention

All seven sections are on `/admin`, behind the existing Google sign-in and UUID allowlist. Each section expands/collapses independently. Acquisition remains available; retention loads when opened. Engagement, Multiplayer, Monetization, Progression and Technical health are clearly marked **Not connected** and list the requested metrics without fabricated data. No mobile tracking or external billing/ad/telemetry integration was added in this website change.

## Manual setup order

No production SQL or website deployment is performed automatically. The existing environment variables, Google callback and admin allowlist are reused.

1. The existing mobile **016_player_acquisition.sql** must be installed.
2. From `C:\Users\Party\Desktop\float-app\supabase\manual`, run **017_player_retention.sql**, then **verify_player_retention.sql**, if not already installed/verified. An updated native Float app must send retention events before measurements are available. The website cannot reconstruct untracked history.
3. In this website, run **sql/acquisition-reporting.sql**, then **sql/acquisition-reporting.verify.sql** to add region and referral-code aggregates. Older installations of this RPC continue serving existing acquisition reports; the new panels show an update-required message until the SQL is updated.
4. Run **sql/retention-reporting.sql**.
5. Run **sql/retention-reporting.verify.sql** in full. It tests the deployed function and view definitions with temporary fixtures and ends with ROLLBACK. It does not insert fixtures into the original acquisition/retention/session tables. On an error in a persistent SQL session, issue ROLLBACK before retrying.
6. Deploy the website through the existing Vercel workflow. Open `/admin` and expand Retention.

The website SQL is deliberately unnumbered to avoid taking a number from the separately maintained mobile migration sequence (observed through 017). The reporting RPC is security-invoker with execution restricted to service_role. Original table permissions and RLS are unchanged. Existing first-seen indexes and the daily-activity `(install_id, activity_date)` unique index support the queries; inspect actual production query plans before adding more indexes.

## Metric definitions

All metrics count installations, not unique accounts. Every report starts from the filtered acquisition population and LEFT JOINs retention, so installations without telemetry remain in cohort sizes.

| Metric | Meaning |
| --- | --- |
| Cohort | UTC acquisition first_seen_at calendar date |
| Tracked | Installation has a retention tracking_started_at |
| D1/D7/D30 retained | Backend exact-day flag is true AND the installation is eligible for that day |
| Eligible | Target UTC date has fully ended, and tracking began at or before the beginning of that target day |
| Pending | Target date has not fully ended; excluded from the rate denominator |
| Unavailable | Target date ended without sufficient measurement coverage, including no retention record |
| Rate | Retained / eligible; numerator and denominator shown together, never averaged across cohort percentages |
| Lifetime active days | Distinct installation-active-day count reported by the backend; total and average over tracked installations |
| Lifetime session count | Average backend session-start count over tracked installations |
| first_seen_at / last_seen_at | Earliest acquisition first-seen and latest measured foreground activity in the filtered population, displayed as aggregates |
| Sessions per active day | Total session starts / installation-active-day rows in the independent UTC activity window, for the selected cohorts |
| Sessions per day | Daily start count, daily active-installation count and their ratio; continued sessions can add active days with no new starts |
| Days since last session | Backend days_since_last_session, based on last_session_started_at UTC date, not last_seen_at |

Lifetime averages are observations since tracking began; they do not assume older missing activity was zero and are not labeled as complete first-30-day averages. No first-30-day average is reported. Empty populations are labeled empty; no measurable denominator is labeled unavailable. Countries are device-locale estimates. Late offline uploads can revise historical results.

The heatmap uses D1/D7/D30 cells in the cohort table. Gray cells are Pending or Unavailable; numeric values always show retained/eligible and counts excluded for maturity/coverage. Group reports include acquisition counts alongside retention. Country, campaign, creator, source, platform and creator/campaign/country breakdowns are Top 50, while totals and cohort reports include all matching installations. Each date range is limited to 366 days; cohorts and daily rows are therefore bounded.

## Filters and failure handling

Cohort start/end, country, campaign ID or name, creator, source and platform apply to every retention report. The independent activity start/end limits only sessions-per-day metrics. Exact-match text filters and UTC boundaries are validated on the server.

The browser requests only aggregates through `/api/admin/retention`. The server verifies the session and allowlist before calling PostgreSQL. Every response is private/no-store. Missing RPC/tables/columns return setup-required; transient/database failures return errors, never fabricated zero reports. Authorization failures clear the dashboard. The open retention panel refreshes every 60 seconds while the page is visible, on return to the tab, or manually. Closing it cancels polling. Requests are serialized per panel; filter changes abort old requests and discard stale responses.

## Validation

```powershell
npm run test:acquisition
npm run test:retention
npm run test:reporting:sql
npm run lint
npm run build
npm run test:acquisition:api -- --browser
```

The SQL test uses the optional PGlite PostgreSQL runtime already cached by the adjacent float-app project; it is not an application dependency. Override `FLOAT_APP_ROOT` for a different mobile workspace, or `PGLITE_MODULE` with an absolute path to its `dist/index.js`. If unavailable, the test fails with a clear message rather than claiming SQL passed. It loads actual mobile 016/017 migrations, mobile retention verification, both website reporting RPCs and their verification scripts into an isolated database, and exercises actual anon/authenticated/service-role permissions. No live project credentials are used.

Tests include >1,000 rows, maturity and coverage exclusions, exact UTC coverage boundaries, untracked installs, combined filters, midnight continuation days, zero denominators, Top 50, and setup/error handling. API/browser checks use isolated fixtures. Live migration installation, mobile telemetry delivery and production query performance remain manual checks.

## Files

- `app/admin/acquisition/dashboard.tsx` and `dashboard.module.css`: seven collapsible categories and acquisition additions.
- `app/admin/metric-sections.tsx`: retention accordion and five planned metric sections.
- `app/admin/retention-panel.tsx`: retention filters, cohort heatmap/tables, activity and breakdowns.
- `app/admin/page.tsx`: admin analytics page metadata.
- `lib/retention.ts`, `retention-backend.ts`, `retention-server.ts`, `app/api/admin/retention/route.ts`: validated protected retention reporting.
- `lib/acquisition.ts`, `sql/acquisition-reporting.sql`, `sql/acquisition-reporting.verify.sql`: region/referral aggregates and compatibility.
- `sql/retention-reporting.sql`, `sql/retention-reporting.verify.sql`: manual reporting SQL and rollback-only fixtures.
- `scripts/test-retention.mjs`, `scripts/test-reporting-sql.mjs`, existing API/browser test scripts and fixtures: automated verification.
- `package.json`, `README.md`, documentation: commands and setup.
