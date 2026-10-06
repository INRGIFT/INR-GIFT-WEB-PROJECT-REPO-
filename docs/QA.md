# QA

## Verified so far (in the build sandbox, before handover)
- `npm run typecheck` passes.
- `npm test` passes: 7 tests in `tests/smoke.test.ts` (provider classes and ids, all seven data-status cases, null for
  missing fundamentals/holdings, cross-listing, OHLCV through the quality gate, calendar break/Sunday/holiday,
  nested screener evaluation, share-link round trip and rejection, treemap area).
- `npm run build` passes.
- HTTP smoke test against `next start`: 40 public pages and API endpoints returned 200; `/app` redirects to `/login`;
  the Natural Gas series returns 502 as designed.

## Not verified
- **No page has been looked at in a browser.** Layout, spacing, overflow, hydration warnings and console errors are unchecked.
- No interaction has been exercised (search, watch, alert dialog, screener edits, compare, heatmap drill).
- No Supabase project has been connected; migrations have not been run.
- No accessibility audit, no cross-browser or device testing, no Lighthouse run. ESLint is not configured.

## Tests to add
Unit: `format.ts`, `metrics.ts`, `calendar.ts` (lastClose, istHours, DST), `validation.ts` failure cases,
`providers/index.ts` fallback → STALE, `rate-limit.ts`, screener `updateAt` / `toCsv`.
API: route handler for each endpoint family, invalid query → 400, unknown → 404.
Component (add Testing Library): DataStatus, AssetTable sort/paginate, AlertButton validation, Screener filter builder.
Auth: demo adapter flows including lockout; Supabase adapter with a mocked client.
E2E (`e2e/`, Playwright config exists, desktop + Pixel 7): the journey below, plus a responsive smoke and error-state checks.

## Acceptance journey
1 land on home · 2 search AAPL · 3 open stock page · 4 switch chart period · 5 open research · 6 add to watchlist ·
7 create alert · 8 compare AAPL/NVDA/MSFT · 9 open heatmap · 10 drill down · 11 open screener · 12 build filter ·
13 save screen · 14 sign up · 15 verify email · 16 verify phone · 17 enrol MFA · 18 enter workspace ·
19 see private watchlist · 20 refresh session · 21 reset password · 22 log out · 23 sign in again.
Steps 1–5 and 8–12 are possible today; the rest need the auth and workspace pages.

## Release checklist per route
Spacing and type consistent · hover/focus/disabled states · loading, empty, error, unavailable, stale states ·
mobile, tablet, desktop · no overflow · keyboard path · no trading language · no portfolio UI · no dead buttons ·
no console or hydration errors · DataStatus present on every data module.
