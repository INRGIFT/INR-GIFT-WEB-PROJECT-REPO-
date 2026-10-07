# Roadmap and status

Keep this file current. It is the handover record. Start with `docs/CURRENT_STATE.md` and `docs/RELEASE_READINESS.md`;
see also `docs/REQUIREMENTS_MATRIX.md`, `docs/ARCHITECTURE_AUDIT.md`, `docs/DECISIONS.md` and the runtime audit `docs/AUDIT.md`.

## Done (typecheck, 51 unit/API tests, 64 Playwright tests on desktop and Pixel 7, local and live RLS checks, build, standalone bundle)
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
  0004 support requests (insert-only), 0005 server-owned phone verification. `npm run test:db` applies all of them to
  a local Postgres and runs the RLS suite.
- **Connectors (docs/CONNECTORS.md):** Supabase on `@supabase/ssr` 0.12 with publishable key, `getClaims()`
  middleware, `/auth/confirm` token-hash route and email templates; NSE source adapter + `NSEMarketDataProvider`
  (not connected); LogoProvider (Logo.dev or none) with ticker-tile fallback and attribution.

- **Brand (October 2026):** official logo library integrated unmodified (header, footer, auth, favicon, PWA, share
  images, emails); `docs/BRAND_ASSET_INVENTORY.md`.
- **Supabase live:** project `odiflbsoitgktylaksng` (ap-south-1) with migrations 0001–0006; security advisors clean;
  live RLS check passed. App reads it when `NEXT_PUBLIC_SUPABASE_*` are set (`.env.local` locally).
- **GoDaddy deployment:** `npm run package:godaddy` builds `inrgift-godaddy.zip` (cPanel: no node_modules, pinned
  runtime package.json, then Run NPM Install; fixes the ENOTEMPTY install failure) and `inrgift-standalone.zip` (VPS).
  Both verified to install/boot from a clean folder;
  `docs/DEPLOY.md`.
- **Product gaps closed:** design tokens (status, focus, type scale, control heights, breakpoints); sidebar groups per
  spec; heatmap Colour metric + Period + "How to read this heatmap"; screener strict and field-to-field comparisons,
  Chart/Research row actions, fixture tests; sector and country research; structured research articles (takeaways,
  why it matters, charts, interpretation, limitations, methodology, sources, author/reviewer, disclosure); typed
  identity model (issuer → security → listing) with ADR/GDR ratios and share classes, `/assets/:id/identity` and an
  asset-page panel; NoResults / UnavailableState / RetryButton; chart Unavailable state; seven recorded tutorials.
- **Full-web pass (7 Oct 2026):**
  - Route registry driving the guard, X-Robots-Tag and robots.
  - Universal search across every entity kind.
  - Useful 404 pages with genuine 404 status.
  - Home and discover hub.
  - 28 markets with auctions and calendars; bonds and REITs.
  - News kinds with summaries; calendar time zone and source.
  - Compare section toggles and identity rows; asset connections panel.
  - Entity quality gate for indexing; sitemap index.
  - CSP; consent-gated analytics (16 events); JSON logs and `/api/health`.
  - CMS-shaped content: 44 learn guides and 36 detailed glossary terms.
  - "INRGIFT in 60 seconds" and "Universal search" tutorials.
  - Quality e2e suite: axe, six widths, reduced motion, failure cases.

## Not done — next, in order
1. **Supabase dashboard settings (owner):** Site URL and redirect URLs once the domain is known, the two email
   templates, custom SMTP (Resend), SMS provider (phone OTP) and TOTP. Then a real sign-up round trip on the deployed site.
2. **Server-side alert job:** run `evaluateAlert` (src/lib/alerts.ts) on a schedule with the service role, write
   notifications and send email for `channel = 'email'`. Today alerts are evaluated in the browser while INRGIFT is open.
3. **NSE** (`docs/CONNECTORS.md`): implement `NseSource` against the licensed spec, load the security master,
   implement `NseInstrumentMap`; move editorial research/themes/calendar out of DemoProvider; ingestion persistence for `/api/internal/ingest`; entitlement checks.
4. **Caching:** `(site)` routes are dynamic; add revalidated provider reads and Suspense streaming per module
   (boundaries inside pages, below `notFound()`, so 404 status is kept; see `docs/DECISIONS.md`).
5. **Depth:** index constituents from the provider; MACD/ATR/VWAP; chart drawing tools, zoom and pan;
   saved-screen history; table virtualization once the universe is large.
6. **Dependency maintenance (deferred by the owner):** ESLint and the Next.js upgrade that clears the PostCSS
   advisory, as one separate pass.
7. **Content:** lawyer-reviewed legal text and a named grievance officer; MP4 copies of tutorials for older Safari;
   research written and reviewed by named people (the reviewer field is ready).

## Known issues and debts
- NSE IX hours cross midnight; `sessionState` does not model overnight sessions (only the first exchange of a market
  drives status, so there is no visible effect yet).
- ETF tracking difference is estimated from the expense ratio in demo mode.
- Rate limiter is in-memory per instance. CSP needs `'unsafe-inline'` (no nonce).
- No route-level loading skeleton in `(site)` (removed to keep genuine 404 status).
- Analytics and error reporting have no vendor sink; Event/Dataset JSON-LD deferred.
- Demo auth accepts any password; it must never be enabled on a public deployment.
- Supabase cannot list other sessions from the browser; the security page says so.
- Primary buttons default to 44px; some dense toolbars pass `size` explicitly. Older components use arbitrary text sizes
  that match the type scale steps.

## Blockers needing the owner
Domain name and GoDaddy plan type (cPanel Node.js or VPS) · SMS provider for phone OTP · Resend key and verified
domain · NSE product, licence and credentials (later) · lawyer-reviewed legal text and grievance officer ·
analytics and error-reporting vendors.
