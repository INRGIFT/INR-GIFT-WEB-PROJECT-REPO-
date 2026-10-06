# Roadmap and status

Keep this file current. It is the handover record. Runtime audit: `docs/AUDIT.md`.

## Done (typecheck, 31 unit/API tests, 5 Playwright journeys on desktop and Pixel 7, build)
- **Foundations:** self-hosted Inter and Manrope; design tokens incl. motion durations; primitives (Button, Tabs,
  Menu, Drawer, Dialog, form fields incl. password, one-time code, switch, checkbox, choice chips, Callout,
  Pagination, Kbd); keyboard-accessible header menus; phone/tablet navigation drawer; route loading, error,
  template (fade) and global-error boundaries; overflow-safe grids and scroll containers.
- **Data layer:** provider contract, DemoProvider, fallback to last-known-good (STALE), `/api/v1` router with
  honest aggregate status, `ids` lookup for workspaces, `/api/contact`.
- **Charts:** ChartShell + SvgChart drawn at real pixel size; area/line/candles; SMA 20, EMA 50, Bollinger;
  volume or RSI pane; benchmark; full screen; keyboard crosshair. MultiLineChart for Compare.
- **Public product:** home, markets (overview, directory, detail), assets (hub, 8 directories, 7 detail types),
  eight-step ETF review, discover (heatmap, screener, compare, collections, trending), research (hub, lists, notes
  with live tables, terms and method box), resources hub, news, earnings, dividends, IPO, calendar, learn (+ article
  pages), glossary (+ term pages linked to live data), data and methodology, search page, about, pricing, FAQ,
  support, contact, legal.
- **Auth (`(auth)` group):** login (email+password, phone code), signup, verify email, verify phone, MFA enrol and
  challenge, forgot and reset password, five-step onboarding.
- **Account:** profile (export, delete workspace data), settings, security.
- **Workspace:** overview, watchlists (multiple; create, rename, reorder, delete, add by search, compare selected,
  CSV), alerts (create, edit, pause, resume, re-arm, delete, history) with a client alert engine, notifications,
  saved screens (live match counts), saved comparisons, saved research (tags), notes (search, tags, edit), personal
  collections, recent, history (clear).
- **SEO:** metadata engine with canonicals and faceted/private noindex; robots; split sitemaps; JSON-LD
  (organisation, website, breadcrumbs, instruments, markets, articles, defined terms, FAQ); icon; OG image;
  demo-data indexing guard.
- **Media:** three captioned tutorial recordings of the product with chapters, transcripts and posters.
- **Migrations:** 0001 workspace, 0002 market data, 0003 collections/alert notes/notification refs,
  0004 support requests (insert-only).

## Not done — next, in order
1. **Supabase for real:** create the project, run 0001–0004, enable phone (SMS provider) and TOTP, configure email
   templates and redirect URLs, set env, and run `e2e/journey.spec.ts` against it. None of this has been executed.
2. **Server-side alert job:** run `evaluateAlert` (src/lib/alerts.ts) on a schedule with the service role, write
   notifications and send email for `channel = 'email'`. Today alerts are evaluated in the browser while INRGIFT is open.
3. **Real provider** (`docs/PROVIDERS.md`) and ingestion persistence for `/api/internal/ingest`; entitlement checks.
4. **Caching:** `(site)` routes are dynamic; add revalidated provider reads and Suspense streaming per module.
5. **Depth:** index constituents from the provider; MACD/ATR/VWAP; chart drawing tools, zoom and pan;
   saved-screen history; table virtualization once the universe is large.
6. **Dependency maintenance (deferred by the owner):** ESLint and the Next.js upgrade that clears the PostCSS
   advisory, as one separate pass.
7. **Content:** lawyer-reviewed legal text and a named grievance officer; official logo; more tutorials (MP4 copies
   for older Safari).

## Known issues and debts
- NSE IX hours cross midnight; `sessionState` does not model overnight sessions (only the first exchange of a market
  drives status, so there is no visible effect yet).
- ETF tracking difference is estimated from the expense ratio in demo mode.
- Rate limiter is in-memory per instance. No CSP header yet.
- Demo auth accepts any password; it must never be enabled on a public deployment.
- Supabase cannot list other sessions from the browser; the security page says so.
- Social card uses the default sans font (Satori cannot read woff2).

## Blockers needing the owner
Supabase project and keys · SMS provider for phone OTP · email provider for alert email · market-data vendor and
licence · official logo · lawyer-reviewed legal text and grievance officer.
