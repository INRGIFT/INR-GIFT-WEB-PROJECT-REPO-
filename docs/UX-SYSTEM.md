# UX system

## Access (7 Oct 2026): homepage-only public
**Public:** `/` and the compliance pages `/terms-and-conditions`, `/privacy-policy`, `/about`, `/support`, `/account-closure`, `/grievance-redressal`, `/legal/*` (see `docs/DECISIONS.md`). **Auth infrastructure:** `/login` `/signup` `/verify` `/verify-phone` `/forgot-password`
`/reset-password` `/auth/*`. **Everything else requires a fully verified account** (email + phone + password; plus an SMS
code in this session once the SMS second factor is switched on), including markets, assets, discover, research, resources, search, about, pricing and FAQ.
Signed out, any product link or URL goes to `/login?next=<path+query>`; "Create your account" keeps `next`; after
verification the person lands on the original page. The header keeps its navigation and search for discovery; they lead
to sign-in when signed out. The homepage is a conversion page: no market tables, prices, research or news feeds.
Route list below describes what exists; access is decided only by `src/lib/route-registry.ts`.

## Shells
- **Public `(site)`**: header + main + footer + mobile bottom nav. No sidebar.
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
Top: Markets · Assets · Discover · Research · Resources (dropdowns). Utilities: search, display currency, open-market
count, Demo data label, notifications + avatar when signed in, Sign in / Sign up otherwise.
Public pages (homepage and compliance pages) keep the site header, footer and mobile bottom nav.
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
- Home is product, not marketing: compact hero with search, session rail, region status, index strip, heatmap
  preview, movers, sectors, themes, asset classes, calendar/research/news, India context. Hero must not dominate.
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
Heatmap aspect changes on phones. Compare table scrolls with a sticky metric column. Below `lg` a menu drawer carries the full navigation, account links and currency.

## Search
`/` or Ctrl/Cmd+K. Debounced `/api/v1/search`, grouped by asset class then markets, research, themes. Arrow keys,
Enter, Esc. Recent searches (localStorage), examples when empty, alternatives on no results.
Ranking: exact ticker → exact name → ticker prefix → name prefix → contains → sector/industry.

## Accessibility
Skip link, semantic landmarks, labelled icon buttons, `aria-sort` on tables, `aria-pressed` on toggles, native
`<dialog>` for modals, chart `aria-label` summaries, reduced-motion support. Not yet audited with a screen reader.
