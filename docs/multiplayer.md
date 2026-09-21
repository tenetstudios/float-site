# Ranked multiplayer reporting

This is the Multiplayer accordion on the existing Analytics page, not a new
dashboard route. It uses the existing admin session/allowlist and server-only
Supabase credentials. No browser receives raw participant IDs or service keys.

## SQL Editor run order

1. In float-app, install `021_multiplayer_analytics.sql` and run its verification
   if not already done. Existing ranked migrations 003/004 are prerequisites.
2. Run float-site `sql/multiplayer-reporting.sql`.
3. Run `sql/multiplayer-reporting.verify.sql` as postgres; fixtures roll back.
4. Deploy float-site. Enable `FLOAT_MULTIPLAYER_ANALYTICS_ENABLED=true` on the
   updated game server and deploy the updated mobile app for metadata/RTT.
   `GAME_SERVER_REGION` is optional; unset means unknown.

Do not rerun older app migrations over newer settlement functions. No live SQL
is applied by the implementation or local test commands.

## Definitions

Dates are inclusive UTC calendar dates; SQL uses next-day midnight as the exclusive
upper bound. Queue cohorts use queue started_at; match cohorts use match started_at.
No filters: match totals include historical ranked settlement without telemetry.
Participant filters (locale country, platform, server region, version) select
matches with at least one matching observed participant, counted once. Participant
metrics include only matching participants. Queue filters apply to queue metadata.
Country/platform/version values are client observations, not verified geography.

Wait averages use only matched queues with valid measured durations. Unresolved
queues are not zero waits or assumed cancellations. RTT sums total milliseconds
and divides by total samples. Missing RTT is NULL. Disconnects are observed events,
not claims of complete historical coverage. `server_failure` includes ambiguous
two-player outages and is not proof of a hosting failure. Late uploads change history.

The participant win/loss table is scoped to the selected period and observed
participants, not a lifetime leaderboard. Authoritative lifetime player records
remain in player_ratings and public profiles. Both players attack and defend;
no Lion/Frog assignment is inferred. Geographic opponent region and rematch rate
are unavailable. Casual/friend matches are excluded. Region/opponent breakdowns
show Top 50 groups, while summary metrics aggregate all records in scope.

## Validation

- `node --test scripts/test-multiplayer.mjs`
- `node scripts/test-multiplayer-sql.mjs` (uses float-app's optional local PGlite)
- `npm run build`
- Existing admin API/browser regression suite: `npm run test:acquisition:api -- --browser`

SQL verification covers 1,200 matches, 2,400 participant records, multiple latency
windows, weighted RTT, NULL measurements, UTC bounds, combined filters, empty
results and actual service-role execution permissions.
