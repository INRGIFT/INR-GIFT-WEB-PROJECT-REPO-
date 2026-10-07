# QA

## Verified (7 Oct 2026)
- `npm test`: 51 tests. Playwright: 64 tests (32 desktop, 32 Pixel 7) in `e2e/journey.spec.ts` and `e2e/quality.spec.ts`.
  The quality suite covers:
  - every registered public route answers 200, and private routes redirect to sign-in with `next`
  - unknown stock, market, research and paths return 404 with recovery links
  - search and auth pages are noindex; health is ok; CSP is present
  - axe (WCAG 2 A/AA, serious and critical) on 12 key pages
  - no horizontal overflow at 375, 390, 768, 1024, 1280 and 1440 px
  - reduced motion
  - failure cases: chart failure, unavailable market, stale market, missing holdings, no search results, compare
    with a missing asset, unauthorised ingest, invalid page size and a bad auth link
- GoDaddy bundle unpacked and booted; pages, 404, API, health, media and headers probed.

## Verified earlier (6 Oct 2026)
- `npm run typecheck`, `npm run build` pass.
- `npm test`: 31 tests. `smoke.test.ts` (provider, statuses, nulls, cross-listing, quality gate, calendar, screener,
  treemap), `units.test.ts` (format, missing metrics, calendar incl. DST and half days, quality gate failures,
  fallback to STALE, rate limit, indicators, screener edits and CSV, alerts, safe redirects), `api.test.ts`
  (envelopes, pagination, id/slug identity, error codes, nulls, ids lookup, rate limit, no trading concepts, contact).
- Playwright (`e2e/journey.spec.ts`, desktop and Pixel 7): public research flow; full account journey (sign up,
  verify email and phone, MFA enrol, onboarding, watchlist, alert, sign out, sign in with MFA challenge); guarded
  routes; password recovery; error and unavailable states.
- Browser audit: 45 routes × 3 widths (135 checks) with no overflow, no hydration or runtime errors; signed-in
  workspace pages at desktop and phone width. See `docs/AUDIT.md`.

Run e2e against a running server: `E2E_BASE_URL=http://localhost:3000 PW_CHROMIUM_PATH=/path/to/chrome npm run test:e2e`.

## Not verified
- Anything against a real Supabase project (auth emails, SMS, TOTP, RLS) or a live data vendor.
- Screen-reader walkthrough, Lighthouse, Safari and Firefox. Axe is automated only. ESLint is deferred by the owner.

## Acceptance journey
1 land on home · 2 search AAPL · 3 open stock page · 4 switch chart period · 5 open research · 6 add to watchlist ·
7 create alert · 8 compare AAPL/NVDA/MSFT · 9 open heatmap · 10 drill down · 11 open screener · 12 build filter ·
13 save screen · 14 sign up · 15 verify email · 16 verify phone · 17 enrol MFA · 18 enter workspace ·
19 see private watchlist · 20 refresh session · 21 reset password · 22 log out · 23 sign in again.
All 23 steps run in demo mode (`e2e/journey.spec.ts` covers them in five tests); against Supabase they still need to be run.

## Release checklist per route
Spacing and type consistent · hover/focus/disabled states · loading, empty, error, unavailable, stale states ·
mobile, tablet, desktop · no overflow · keyboard path · no trading language · no portfolio UI · no dead buttons ·
no console or hydration errors · DataStatus present on every data module.
