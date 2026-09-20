# Engagement reporting in Admin

Expand **03 · Engagement** on `/admin`. This replaces the existing placeholder; there is no separate Engagement page. Acquisition, Retention and the four other planned sections remain in the same dashboard. The panel loads on opening, polls every 60 seconds while visible/open, supports manual refresh and cancels polling on close. Filters apply on submission; stale responses cannot overwrite new filters.

## Manual deployment

The mobile schema was inspected through migrations **018_gameplay_attempts.sql**, **019_gameplay_retry_duration.sql**, **020_gameplay_placements.sql**, their query examples and the placement documentation in the sibling float-app repository. Those migrations are prerequisites already owned by float-app. **Do not recreate or rerun them as part of this website deployment.**

In the same Supabase project's SQL editor, run only these website files in order:

1. `sql/engagement-reporting.sql`
2. `sql/engagement-reporting.verify.sql`

The second file uses temporary fixtures and ends with ROLLBACK. Original gameplay/acquisition rows are never modified by verification. If a persistent SQL session reports an aborted transaction, run ROLLBACK before retrying. The reporting function is security-invoker, service-role-only, and read-only. It does not invoke ingestion functions or change table grants/RLS. Missing backend tables/columns or a missing reporting function produces a setup-required state, not zero metrics.

The website uses descriptive unnumbered reporting SQL, consistent with its existing acquisition/retention files. The separately maintained mobile sequence is already through 020; no mobile migration number is reserved or altered. Existing attempt started_at, install_id, mission and placement attempt_id indexes support these queries. Inspect production query plans and actual volumes before introducing additional indexes.

After manual SQL setup, push/deploy through the existing Vercel workflow and open `https://www.floatgame.io/admin`. No new environment variables or Google settings are required: existing `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (or legacy `SUPABASE_SERVICE_ROLE_KEY`) and `FLOAT_ADMIN_USER_IDS` are reused. No production migrations or deployment were performed during implementation.

## Definitions

| Metric | Definition |
| --- | --- |
| Selected attempts | Campaign attempts with started_at >= UTC start midnight and < midnight after the inclusive end date |
| Installations | Distinct install_id values across selected attempts, never accounts/people |
| Completion rate | Completed / (completed + failed + abandoned); unknown and in_progress shown separately and excluded |
| Active duration | Average active_gameplay_ms / 1000, only for completed attempts with duration_complete=true and a non-null value; measured sample count shown |
| Retry / restart / replay | Child attempt's explicit restart_reason; parent can be outside the selected date range; no inferred timestamp chains |
| Placements | All accepted placement rows belonging to selected attempts, even when placed_at is outside the attempt-start window |
| Placements per placing attempt | Total recorded placements / distinct attempts with recorded placements |
| Daily attempts | Counted by UTC started_at date with current outcome breakdown |

NULL averages and zero-denominator rates show “—”. A measured zero duration remains a valid observation. Failed, abandoned, incomplete and NULL durations do not enter the completed-attempt duration mean; ended_at minus started_at is never substituted.

Country, platform, acquisition campaign ID/name and creator filters use acquisition dimensions. Difficulty and app-version filters use the attempt. Text filters are exact matches, country codes normalize to uppercase and ranges are bounded to 366 days. Acquisitions with missing dimensions are Unknown. Marketing campaign labels are separate from campaign-mode mission IDs.

Mission performance groups by mission_id, content_version and difficulty. Friendly names use a display-only snapshot of the actual float-app campaign catalog for campaign-v1 (the version recorded by its native engagement adapter). Exact IDs remain visible. Unknown IDs or content versions fall back to the raw ID. Refresh this snapshot when the mobile catalog changes; historical display labels are not independently versioned beyond the recorded content version. Unit labels are readable aliases alongside the exact stored keys, grouped by phase; distinct attempts are counted within each unit/phase group and are not additive across groups.

Mission and acquisition breakdowns are Top 50 by attempt count. Unit/phase rows are capped at 50 (the current 13 types × 3 phases fit within that bound). Summary/daily totals are not truncated. Placements are aggregated per attempt before joining counts to attempts, preventing multiplication of outcomes and duration samples.

## Coverage and remaining scope

Gameplay telemetry is client-reported. Older versions may lack duration or placement instrumentation. Missing placement rows do not prove zero use, and no percentage across all historical attempts assumes complete coverage. Counts reflect accepted actions, not surviving defenses, purchases or coins spent. Repairs, upgrades, removals, prebuilt defenses, rejected actions and balloon sending are excluded by the existing backend instrumentation.

Session lifecycle belongs to Retention. XP, multiplayer match length/results, monetization and new tracking events are not added. Campaign mission reporting does not claim multiplayer map coverage. Offline uploads and late attempt results may revise historical reports.

## Files and validation

- `app/admin/engagement-panel.tsx`: filters, summary cards, outcome chart, mission/unit/acquisition reports and failure states.
- `app/admin/metric-sections.tsx`, `app/admin/acquisition/dashboard.module.css`: existing accordion integration and shared styling.
- `lib/engagement.ts`, `engagement-missions.ts`, `engagement-backend.ts`, `engagement-server.ts`, `app/api/admin/engagement/route.ts`: validated filters, types, server-only protected reporting.
- `sql/engagement-reporting.sql`, `sql/engagement-reporting.verify.sql`: manual deployment and rollback-only verification.
- `scripts/test-engagement.mjs`, extended local SQL/API/browser scripts and fixtures, `package.json`: tests.
- `README.md`, `docs/retention.md`, `docs/engagement.md`: setup and scope documentation.

```powershell
npm run test:engagement
npm run test:reporting:sql
npm run lint
npm run build
npm run test:acquisition:api -- --browser
```

Local SQL tests initialize an isolated PostgreSQL runtime with actual mobile schema prerequisites; this does not rerun migrations against the live project. They cover 1,200 attempts/2,400 placements, distinct installations, nonmultiplying joins, UTC boundaries, NULL/partial/zero durations, unknown/in-progress outcomes, completion denominators, retry reasons, combined filters, Top 50 limits and real database execution permissions. API/browser tests use isolated synthetic upstream responses, not live credentials. Live telemetry delivery and production performance remain deployment checks.
