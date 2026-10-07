# UX system

## Access (7 Oct 2026): homepage-only public
**Public:** `/` and the compliance pages `/terms-and-conditions`, `/privacy-policy`, `/about`, `/support`, `/account-closure`, `/grievance-redressal`, `/legal/*` (see `docs/DECISIONS.md`). **Auth infrastructure:** `/login` `/signup` `/verify` `/verify-phone` `/forgot-password`
`/reset-password` `/auth/*`. **Everything else requires a fully verified account** (email + phone + password; plus an SMS
code in this session once the SMS second factor is switched on), including markets, assets, discover, research, resources, search, about, pricing and FAQ.
Signed out, any product link or URL goes to `/login?next=<path+query>`; "Create your account" keeps `next`; after
verification the person lands on the original page. The header keeps its navigation and search for discovery; they lead
to sign-in when signed out. The homepage (redesigned 7 Oct 2026, owner brief) previews the product with a server-prepared
snapshot: labelled DEMO values while the demo provider is active, no prices with a licensed provider unless
`PUBLIC_MARKET_DATA=on` (`src/features/home/snapshot.ts`); it never calls `/api/v1`, and every product link still
leads to sign-in.
Route list below describes what exists; access is decided only by `src/lib/route-registry.ts`.

## Shells
- **Public `(site)`**: header + main + footer; the mobile bottom tab bar only for signed-in members. No sidebar.
- **Authenticated `(workspace)`** (every product page: markets, assets, discover, research, resources, search, `/app`,
  account): `AppShell` (`src/components/layout/app-shell.tsx`). Fixed sidebar 264px, collapsible to 76px (remembered
  per browser), groups **Workspace** (Home, Discover, Markets, Screeners, Compare, Research, News, Watchlists, Alerts,
  Saved Research) · **Account** (Profile, Security, Sessions, Preferences) · **Support** (Support, Grievance Redressal,
  Account Closure) · **More** (saved screens and comparisons, collections, notes, recent, history, notifications,
  calendar, learn). Bottom: the signed-in person (initials, name, masked email, GIFT ID, email verification). Top bar:
  page title, search, display currency, notifications bell only when there are notifications, account menu (name,
  masked email, GIFT ID, Profile, Security, Sessions, Preferences, Sign out). Below 1024px the sidebar is a drawer
  behind the menu button. Navigation lives in `APP_NAV` (`src/lib/routes.ts`).
- **Auth `(auth)`**: two-column, navy brand panel left, form right. Built; brand panel shows a live IST session read-out.

## Navigation (`src/lib/routes.ts`)
Public header (`src/components/layout/site-header.tsx`, `SITE_NAV`): logo · Markets · Discover · Screeners · Compare ·
Research · News · Search · **Sign In** · **Get Started** (signed in: Open Workspace, notifications, account menu).
Below `lg` the six destinations, search and support/legal links move into the menu drawer; the header keeps the logo,
Sign In, Get Started and the menu button. Footer (`FOOTER_COLUMNS`): Product, Account, Support, Legal (with
Open-source notices), Company, the research-only statement and the published contact details.
Signed in, product pages use the app shell sidebar (`APP_NAV`, above). Counters only when the data loaded. Never Portfolio.

## Route map and status
✅ built · ✅ not built

Public: ✅ `/` · ✅ `/markets` `/markets/all` `/markets/[market]` · ✅ `/assets` `/assets/[cls]` (stocks, etfs, indices,
fx, commodities, bonds, reits, funds) · ✅ `/stocks/[symbol]` `/etfs/[symbol]` `/indices/[index]` `/fx/[pair]`
`/commodities/[commodity]` `/bonds/[bond]` `/reits/[reit]` · ✅ `/discover` `/discover/heatmap` `/discover/screener`
`/discover/compare` `/discover/collections` `/discover/collections/[id]` `/discover/trending` · ✅ `/research`
`/research/[kind]` `/research/[kind]/[slug]` · ✅ `/resources/[kind]` (news, earnings, dividends, ipo, calendar, learn,
glossary, data) · ✅ `/about` `/pricing` `/faq` `/support` `/contact` · ✅ `/legal/[doc]` · ✅ `/resources` `/resources/learn/[slug]` `/resources/glossary/[slug]` `/search` `/etfs/[symbol]/review`
Auth: ✅ `/login` `/signup` `/verify` `/verify-phone` `/mfa` `/forgot-password` `/reset-password` `/onboarding` · ✅ `/auth/callback`
Authenticated: ✅ `/app` · ✅ `/app/[section]` (watchlist, alerts, screens, comparisons, collections, recent, research,
notes, history) · ✅ `/account/[section]` (profile, settings = Preferences, security, sessions) · ✅ `/notifications`

## Acceptance flows (more important than isolated polish)
1. Search → asset → chart → metrics → compare → save → alert.
2. Market → heatmap → sector → company → research → watchlist.
3. Screener → filter → result → chart/research → compare → save.
4. Sign up (step 1 account) → six-digit email code (step 2) → mobile number (step 3; SMS code once switched on) →
   onboarding → "Your INRGIFT account is ready." (GIFT ID) → workspace home ("Hola AMIGO").
The 23-step journey in `docs/QA.md` is the e2e target.

## Page patterns
- Home (`src/app/(site)/page.tsx`, sections in `src/features/home/`), in order: hero ("INVEST BEYOND BORDERS.",
  Explore Markets / Get Started, KLineChart NIFTY 50 with 1M/1Y/5Y prepared on the server, six facts: market status,
  exchange, currency, data source, session, research snapshot) · global market snapshot (indices, equities, FX,
  commodities, bonds, ETFs; status and time) · "Every market. Every asset. One research view." (the trading day on
  India time by region, every covered market, asset classes) · research workflow (Search → … → Alert in three phases)
  · "See how INRGIFT works." (the three existing tours as a player and playlist) · screener preview (the screener's own
  starting example, run on the server) · compare preview (registered metrics) · research note anatomy · news
  (NewsData.io headlines or an honest state) · data infrastructure and the status legend · private workspace (real
  labels and empty states) · "Built in India. Designed for global markets." · trust (security, data, privacy, support
  and legal routes) · "See the world differently." · footer. Demo values carry the DEMO status and sit in
  `data-nosnippet` regions.
- One asset template (`features/assets/asset-detail.tsx`) for all classes: identity → quote/status → chart → overview
  → performance → class modules → peers/related → research + news → India context → notes → source line.
  Header actions: Watch, Add alert, Compare, Research. Never Buy/Sell.
- Progressive disclosure: overview first, advanced controls on demand, detail one layer deeper.

## States (every data module)
loading (skeleton, never a blank page or giant spinner) · success · empty (says what to do next) · unavailable
("Data unavailable from source", last-available timestamp) · error (names the module, offers Retry, page keeps
rendering) · stale. Statuses: LIVE, DELAYED, END_OF_DAY, CLOSED, UNAVAILABLE, STALE, ERROR.
Demo cases wired into the seed: Saudi Arabia UNAVAILABLE, Brazil STALE, Natural Gas ERROR, China holiday CLOSED,
EMAAR no fundamentals, INDA no holdings, TSM/2330 cross-listing, funds no coverage.

## Responsive
Desktop first, designed per breakpoint. Tables: sticky header and first column, horizontal scroll, never squeezed.
Homepage: the market snapshot is a 6-column strip from 1280 px, 3 × 2 from 1024 px and a swipeable row below; the
covered-market list folds into one disclosure on phones; the preview tables fit a 375 px screen without scrolling.
Heatmap aspect changes on phones. Compare table scrolls with a sticky metric column. Below `lg` a menu drawer carries the full navigation, account links and currency.

## Search
`/` or Ctrl/Cmd+K. Debounced `/api/v1/search`, grouped by asset class then markets, research, themes. Arrow keys,
Enter, Esc. Recent searches (localStorage), examples when empty, alternatives on no results.
Ranking: exact ticker → exact name → ticker prefix → name prefix → contains → sector/industry.

## Accessibility
Skip link, semantic landmarks, labelled icon buttons, `aria-sort` on tables, `aria-pressed` on toggles, native
`<dialog>` for modals, chart `aria-label` summaries, reduced-motion support. Not yet audited with a screen reader.
