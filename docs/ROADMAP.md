# Roadmap and status

Keep this file current. It is the handover record.

## Done (compiles, builds, returns 200)
- Project config, design tokens, global styles.
- `src/lib`: types, format, metrics registry, routes/nav, config, market calendar, validation, treemap, rng, rate limit, `useApi`.
- Provider layer: contract, `DemoProvider` with seed and all demo edge cases, `RealProvider` stub, fallback chain.
- Services: market data, search, movers, sectors, breadth, calendar, research, themes; editorial content.
- API: `/api/v1` router (33 routes), `/api/internal/ingest` (validation only).
- Supabase: browser/server clients, middleware guard, `/auth/callback`, migrations 0001 and 0002 (**never executed**).
- Auth logic: Supabase and demo adapters, session context. Workspace logic: repo (Supabase + local), context, prefs.
- UI primitives and shells: header, footer, sidebar, mobile nav, workspace layout.
- Features: universal search, asset table/directory/detail (7 classes), ChartShell + SvgChart, heatmap, screener,
  compare, watch/alert/compare/save actions, asset notes, session rail, index strip, movers, sector panel.
- Pages: home, markets (overview, directory, detail), assets hub, 8 class directories, 7 detail routes, discover hub,
  heatmap, screener, compare, collections (+detail), trending, research hub/list/document, 8 resources pages, 404.
- 7 smoke tests.

## Not done — build in this order
1. **Run it and look at it.** `npm run dev`, walk every built route at desktop and phone widths, fix visual, overflow,
   hydration and console issues. Nothing has been seen rendered.
2. **Auth pages** in a new `(auth)` route group with a shared two-column layout: `/login` (email+password and phone
   OTP tabs), `/signup`, `/verify`, `/verify-phone`, `/mfa` (enrol + challenge), `/forgot-password`, `/reset-password`,
   `/onboarding` (currency, regions/markets, asset classes, themes, suggested watchlist; skippable). Use `useSession().auth` only.
3. **Workspace pages** under `(workspace)`: `/app` overview; `/app/[section]` for watchlist (multiple lists: create,
   rename, delete, reorder, add/remove), alerts (create, edit, pause, resume, delete, history), screens (open,
   rename, duplicate, delete), comparisons, collections, recent, research (tags), notes, history (clear); `/notifications`.
   Use `useWorkspace()` only.
4. **Account pages**: `/account/profile`, `/account/settings` (currency, locale, timezone, notification prefs),
   `/account/security`.
5. **Static pages**: `/about`, `/pricing`, `/faq`, `/support`, `/contact`, `/legal/[doc]` — content already in `src/services/content.ts`.
6. **Route-level `loading.tsx` and `error.tsx`** for `(site)` and `(workspace)`; mobile menu drawer for the full top nav.
7. **Supabase for real**: create project, run both migrations, enable phone + TOTP, set env, test the full journey.
8. **Tests**: units, API, component, Playwright journey (see `docs/QA.md`). Add ESLint.
9. **SEO**: sitemap, robots, JSON-LD, OG image, icons (see `docs/SEO.md`). Fonts via `next/font`.
10. **Depth**: dedicated eight-step ETF review view; index constituents; alert editing and trigger evaluation job;
    watchlist "latest research/news" columns; saved-screen history; chart drawing tools, zoom/pan, more indicators
    (RSI, MACD, Bollinger, ATR, VWAP — the v1 prototype had RSI and Bollinger).
11. **Ingestion persistence** and entitlement checks; caching/ISR; table virtualization.
12. **Real provider** once purchased (`docs/PROVIDERS.md`).

## Known issues and debts
- Header/sidebar/footer link to routes that 404 until steps 2–5 land (`/login`, `/signup`, `/support`, `/about`, …).
  "Sign up" in the header and every watch/alert/save action for signed-out users redirect to `/login`.
- Below `lg`, top-nav dropdowns are hidden; only bottom-nav destinations are directly reachable.
- NSE IX hours (06:30–02:45) cross midnight; `sessionState` does not model overnight sessions. Only the first
  exchange of each market drives status today, so it has no visible effect yet.
- ETF tracking difference is estimated from the expense ratio in demo mode.
- Funds: directory exists and shows a no-coverage state; there is no `/funds/[id]` route (briefs list none).
- Rate limiter is in-memory per instance. No CSP header.
- Demo auth accepts any password; it must never be enabled on a public deployment.
- LEGAL copy is an unreviewed draft.
- No dark theme. No logo asset. `public/` is empty.
- All `(site)` routes are dynamic; no caching strategy yet.

## Blockers needing the owner
Supabase project and keys · SMS provider for phone OTP · market-data vendor choice and contract · official logo and
brand assets · lawyer-reviewed legal text and a named grievance officer · decision on company logo licensing.
