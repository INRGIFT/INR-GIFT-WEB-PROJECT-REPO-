# Architecture

```
Browser ─ Server Components ───────────────┐
        └ Client Components ─ /api/v1/* ───┤
                                           ▼
                         src/services/market-data.ts   (validation, aggregation, envelopes)
                                           ▼
                         src/providers/index.ts        getProvider() + fallback chain
                              primary → secondary → last-known-good (served as STALE)
                                           ▼
                 DemoProvider (now)            RealProvider (later, same interface)
```
Private data: Client → `useWorkspace()` → `WorkspaceRepo` → Supabase (RLS) or localStorage in demo mode.

## Folders
```
src/app/(site)        public routes            src/app/(workspace)  workspace, account, notifications
src/app/(auth)        auth and onboarding      src/app/api/contact  contact form endpoint
src/app/api/v1        read API router          src/app/api/internal protected ingestion
src/app/auth/callback Supabase code exchange   src/middleware.ts    session refresh + route guard
src/components/ui     primitives               src/components/layout shells
src/features/*        assets, auth, charts, compare, heatmap, markets, screener, search, site, workspace
src/lib               types, format, metrics, routes, config, calendar, validation, treemap, rng, rate-limit, use-api
src/providers         provider.ts (contract), demo/, real/, index.ts (selection + fallback)
src/services          market-data.ts, content.ts
src/supabase          client.ts (browser), server.ts (cookie-bound)
supabase/migrations   0001_user_workspace.sql, 0002_market_data.sql
tests/                vitest        e2e/  Playwright journeys        docs/
```

## Key decisions
- **One provider contract** (`MarketDataProvider`, 24 methods). `RealProvider` is a stub that throws `NOT_CONFIGURED`.
  See `docs/PROVIDERS.md`.
- **Services, not fetch, on the server.** Server components import services; the HTTP API exposes the same services.
- **API as one catch-all router** (`api/v1/[...path]/route.ts`) with a route table, zod query validation, rate
  limiting and uniform envelopes. Keep it; do not split into dozens of route files.
- **Metric registry** (`lib/metrics.ts`) drives columns, screener fields, compare rows and formatting.
- **Market calendar** (`lib/calendar.ts`) derives session state from exchange metadata (time zone, hours, breaks,
  trading days, holidays, half-days). No hard-coded weekday rules. `dataStatusFor()` maps session + entitlement to status.
- **Data quality gate** (`lib/validation.ts`): OHLC consistency, volume, timestamps, order, duplicates, unadjusted
  jumps; failures are quarantined.
- **Charts** behind `ChartShell` → `SvgChart`. To adopt Lightweight Charts, replace `SvgChart` and keep `ChartRenderProps`.
- **Auth and workspace behind adapters** so the app runs with zero configuration and switches to Supabase by env.
- **Screener logic is pure** (`features/screener/logic.ts`); state lives in the URL (`?u=&q=`), which is the share link.
- **Alerts:** `src/lib/alerts.ts` is a pure evaluator; `features/workspace/alert-engine.tsx` runs it in the browser
  each minute for the signed-in user. A scheduled server job should reuse the same function (ROADMAP).
- **Content seam:** pages read editorial content and videos only through async getters in `services/content.ts`.
- **Demo determinism:** seeded PRNG (`lib/rng.ts`); `DemoProvider` takes an injectable clock for tests.

## Environment
See `.env.example`. With nothing set: provider = demo, auth = demo, workspace = localStorage.

## Performance notes
All `(site)` routes are `force-dynamic` because session status depends on the clock. Next step: cache provider reads
with short revalidation and stream slow modules with Suspense. Heatmap/screener/compare fetch client-side.
Lists are small today; virtualize `AssetTable` when a real universe arrives.
