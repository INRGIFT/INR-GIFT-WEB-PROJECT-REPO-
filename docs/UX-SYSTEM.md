# UX system

## Shells
- **Public `(site)`**: header + main + footer + mobile bottom nav. No sidebar.
- **Authenticated `(workspace)`**: header + personal sidebar (248px, collapses to 64px; icons only below `lg`) +
  horizontal section tabs on phones + bottom nav. Pages: overview, watchlist, alerts, notifications, screens, comparisons, collections, recent, research, notes, history.
- **Auth `(auth)`**: two-column, navy brand panel left, form right. Built; brand panel shows a live IST session read-out.

## Navigation (`src/lib/routes.ts`)
Top: Markets · Assets · Discover · Research · Resources (dropdowns). Utilities: search, display currency, open-market
count, Demo data label, notifications + avatar when signed in, Sign in / Sign up otherwise.
Mobile bottom nav: Home · Markets · Discover · Research · Workspace.
Sidebar groups: My workspace (Overview, Watchlist, Alerts) · Discover (Saved Screens, Saved Comparisons, Collections,
Recent) · Research (Saved Research, Notes, History) · System (Settings, Help). Counters when data exists. Never Portfolio.

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
notes, history) · ✅ `/account/[section]` (profile, settings, security) · ✅ `/notifications`

## Acceptance flows (more important than isolated polish)
1. Search → asset → chart → metrics → compare → save → alert.
2. Market → heatmap → sector → company → research → watchlist.
3. Screener → filter → result → chart/research → compare → save.
4. Sign up → verify email → verify phone → enrol MFA → onboarding → workspace.
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
