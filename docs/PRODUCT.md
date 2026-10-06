# Product

**Brand:** INRGIFT · **Positioning:** Global market intelligence from India
**Promise:** Every market. Every asset. One research view. · **Supporting line:** Global markets, understood from India.

## What it is
A research-first, data-first web application for serious retail investors and researchers in India to understand
global markets. Core workflow:

`SEARCH → DISCOVER → SCREEN → COMPARE → RESEARCH → VISUALIZE → SAVE → WATCH → ALERT`

## What it is not (final boundary)
Not a broker, trading terminal, or adviser. No portfolio, holdings, P&L, orders, positions, buy/sell, brokerage
links, deposits, withdrawals or balances — in UI, routes, schema, types or copy. No buy/sell ratings, no price targets,
no "you should buy". Brief 1 contained leftover Portfolio mentions (sections 8, 9, 45, 47, 90); the owner confirmed
the research-only rule overrides them.

## Feel
Clarity, control, trust, depth, speed, calm confidence. Institutional quality without looking old. Must not read as a
broker, a neon terminal, a crypto product, a generic SaaS dashboard, or a marketing site.
Benchmarks for inspiration only (never copy): Zerodha clarity, FYERS analytics, Dhan discovery, INDmoney research
depth, Vested global feel.

## Scope
- **Markets:** data-driven, never a fixed count. Regions: North America, Latin America, Europe, Asia-Pacific,
  Middle East, Africa. 19 markets are seeded; the list comes from provider config.
- **Asset classes:** primary — stocks, ETFs, indices, FX; secondary — commodities, bonds, REITs, funds. Extensible.
- **Personal workspace (research data only):** Overview, Watchlist, Alerts, Saved Screens, Saved Comparisons,
  Collections, Saved Research, Notes, Recent, History, Settings, Help.
- **India context is strategic, not decorative:** IST sessions, INR conversion, USD/INR, currency-adjusted framing,
  GIFT City / NSE IX / GIFT Nifty. Saffron is one accent line; no flags, no tricolour UI.

## Signature features
Global heatmap (drill region → country → sector → industry → asset), global screener (nested AND/OR), four-way
compare, eight-step ETF review, 24-hour IST session rail, universal search.

## Business model
Free today. Planned tiers (Free / Pro / Enterprise) differ by data depth and research features, never by trading
benefits. Plan copy lives in `src/services/content.ts` (`PLANS`).

## Data stance
Live global data will be licensed later. Until then the app runs on `DemoProvider`, visibly labelled "Demo data".
The provider interface is the production contract; swapping vendors must not change UI or API.
