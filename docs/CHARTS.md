# Financial charts (KLineChart)

INRGIFT draws its financial charts with **KLineChart**, an open-source canvas charting library. There is one chart
component (`FinancialChart`) and one data path. TradingView is not used: no TradingView library, licence, branding,
link or agreement is part of INRGIFT (see "Licence" for the one notice KLineChart itself carries).

## Dependency

| | |
| --- | --- |
| Package | `klinecharts` (npm), pinned to exactly `10.0.3` in `package.json` (no `^`), integrity in `package-lock.json` |
| Source | https://github.com/klinecharts/KLineChart (official repository, the package's `repository` field) |
| Licence | Apache License 2.0, copyright (c) 2019 lihu. INRGIFT's own code stays proprietary. |
| Runtime deps | None (zero-dependency package) |
| Loaded | In the browser only, on demand, as its own chunk (`src/lib/charts/klinechart/lifecycle.ts`). It reads `window` at import, so it is never imported on the server. |
| Modified | No. Used as published. |

## Licence and notices (where they live)

- `THIRD_PARTY_NOTICES.md` (repository root, also in the GoDaddy zip): what is used, licence, copyright, KLineChart's
  NOTICE text verbatim, and the dependency inventory.
- `public/licenses/klinecharts/` — `LICENSE.txt`, `NOTICE.txt`, `LICENSE-lightweight-charts.txt`: byte-for-byte copies
  of the files in the npm package, served publicly under `/licenses/klinecharts/` (the route registry lets `/licenses/`
  through as static files).
- `/legal/open-source` (public page, `src/services/content/legal.ts`): the same facts for users, the NOTICE text
  verbatim, and links to the licence texts. Linked from the footer, the legal index and every chart's footer.
- `tests/charts.test.ts` fails if the installed version, licence or notice files drift from these copies.

The production build's minifier drops the `@license` comment banner from the shipped KLineChart chunk (checked on
the 7 Oct 2026 build). The licence and NOTICE are delivered alongside instead, at `/licenses/klinecharts/` and on
`/legal/open-source` (Apache 2.0, sections 4(a) and 4(d), for code distributed in compiled form). If counsel wants the
banner inside the JavaScript file as well, keep license comments in the minifier settings or add a post-build step.

KLineChart's NOTICE credits *TradingView Lightweight Charts* and the package ships that project's Apache 2.0 licence.
Apache 2.0 section 4(d) requires keeping NOTICE attribution notices, so INRGIFT reproduces it as plain text on the
notices page and in `THIRD_PARTY_NOTICES.md`. No TradingView logo, link, badge or terms appear anywhere in the product.

## Architecture

```
FinancialChart (src/features/charts/financial-chart.tsx, client)
  → INRGIFT chart adapter (src/lib/charts/klinechart/: adapter, formatting, indicators, lifecycle)
    → GET /api/v1/assets/:id/chart?range=&resolution=   (protected; or a server component passes the series)
      → chart data service (src/services/chart-data.ts)
        → market-data service (src/services/market-data.ts) → getProvider() (src/providers/index.ts)
          → DemoProvider today (labelled DEMO) → a licensed provider later
```

- The browser never calls a market-data vendor and never sees a provider key: it calls INRGIFT's API, which is behind
  the same verified-session gate as every other `/api/v1` route. Server components (asset, market, research pages)
  call the chart data service directly and pass the first series to the chart, so it draws without a request.
- **Contract** (`src/lib/charts/types.ts`, library-neutral): `instrumentId` (immutable `ins_######`), slug and symbol
  for display, listing (exchange, MIC, market, country, venue time zone), native `currency` (ISO 4217, never
  converted), `unit` (price, points, rate), `range`, `resolution`, `supported` resolutions, `bars` (UTC epoch ms open
  time, OHLC, volume or null), `status` (LIVE, DELAYED, END_OF_DAY, CLOSED, UNAVAILABLE, STALE, ERROR, DEMO),
  `session` (the venue's session or null), `source`, `timezone`, `asOf`, `retrievedAt`, `last` (price, previous
  close, change, change %), precisions, `quarantined` (bars dropped by validation) and `realtime: false`.
- **Resolutions**: the contract can carry 1m, 5m, 15m, 30m, 1h, 4h, 1D, 1W and 1M. A series offers only its source
  resolution (inferred from bar spacing) and coarser ones made from whole bars (`aggregateBars`); nothing finer is
  invented. Asking for an unsupported one returns `400 UNSUPPORTED_RESOLUTION` with the supported list, and the chart
  says so with buttons for the alternatives. Demo: 1D range → 5-minute bars, 5D → 30-minute, 1M–1Y → daily,
  3Y–5Y → weekly, MAX → monthly.
- **Calendars**: bar times come from the venue's own calendar (`src/lib/calendar.ts`: trading days, holidays, half
  days, breaks; `src/lib/charts/bars.ts`). Intraday bars sit inside sessions; a closed market gets no new bar; the
  chart stays viewable and says the market is closed and when the data is from. Spot FX and commodity references use
  a weekday UTC venue and show "No single exchange session".
- **No realtime**: the KLineChart data loader serves fetched bars only and has no `subscribeBar`. Nothing ticks.
- **Status**: the chart header always shows the status badge, the market session and the as-of time in the venue's
  time zone; the footer shows source, currency (as quoted, not converted), time zone and bar count. Demo data is
  `DEMO` everywhere: `demoLabelled()` in `src/providers/index.ts` relabels the demo provider's simulated LIVE,
  DELAYED, END_OF_DAY and CLOSED, so no demo value is ever presented as live.
- **Volume** is shown only for instruments that have it (`asset.m.volume` defined: stocks, ETFs, REITs). Indices, FX,
  commodities and bonds get no volume pane even if a source sends numbers.
- **Indicators** offered: MA (20, 50), EMA (20, 50), Bollinger (20, 2), Volume (20), OBV (30), RSI (14) — KLineChart
  built-ins checked against the standard formulas — and MACD (12, 26, 9), which is INRGIFT's own
  (`src/lib/indicators.ts` `macd`) because the built-in draws the histogram as 2 × (MACD − signal).
- **Comparison**: the Compare page and an asset page's "vs benchmark" switch to change-from-start lines (%), each
  instrument rebased from its first bar; other series are matched to the main series by bar time (intraday), date,
  ISO week or month in their own venue time zone, and a missing day leaves a gap.
- **Drawing tools**: trend line, horizontal and vertical lines, ray, parallel channel, price line, Fibonacci
  retracement, note (KLineChart overlays). Kept in the page only.
- **States**: skeleton while loading (15-second timeout), error with Try again, unavailable (no bars), stale, closed
  market, unsupported interval, library failed to start. While a new range loads, the previous chart stays.
- **Accessibility**: the chart area is focusable; arrow keys move a crosshair bar by bar and read the bar out, + and −
  zoom, Home and End jump; every control is a labelled button or select; a text summary describes the series.
- **Caching**: the browser keeps chart responses for the page's life (1 minute intraday, 10 minutes otherwise) and
  cancels superseded requests; protected API responses stay `private, no-store` at the HTTP layer.

## Where charts appear

Asset pages (all classes, with "vs" the market's headline index), market pages (headline index), research notes about
one asset, and the Compare page (comparison lines). The screener's "Chart" action opens the asset page chart.
Public pages may show a chart only from series the server prepared under the public display policy
(`src/features/home/snapshot.ts`): the homepage hero passes NIFTY 50 for 1M, 1Y and 5Y as `preloaded`, and its period
switch uses those without any request (the chart API stays protected). The hero variant shows no toolbar beyond the
period switch and no link to the protected methodology page. Because those bars travel inside the page, the homepage
rounds them to the precision the chart displays (`compactBars`), which keeps the HTML small.

Fit: each series is drawn whole. The right margin is set to 16 px (`setOffsetRightDistance`); KLineChart's 80 px
default had pushed a period's first bars off the left edge.

## Replacing DemoProvider with a licensed provider

1. Implement `getOHLCV(id, range)` in the provider (`src/providers/provider.ts` contract) with bars on the venue
   calendar, UTC timestamps, native currency, and `null` when the source has nothing. Keep entitlement statuses
   honest (LIVE only for a real-time entitlement, DELAYED with its delay).
2. Select it with `MARKET_DATA_PROVIDER` (`src/lib/config.ts`). It is not wrapped by `demoLabelled`, so its own
   statuses show.
3. If the provider has finer bars (1m, 15m, 1h…), nothing in the chart changes: `supported` widens automatically.
4. Check redistribution and display rights for each exchange before showing its data, and before any public display.
5. Realtime later: add `subscribeBar` in the chart adapter's data loader fed by an INRGIFT server stream; never connect
   the browser to the vendor.

## Upgrading KLineChart safely

1. Read the release notes and the official repository's `LICENSE` and `NOTICE` for the new version.
2. `npm install klinecharts@<exact version> --save-exact`.
3. Copy `LICENSE`, `NOTICE` and everything in `licenses/` from `node_modules/klinecharts/` into
   `public/licenses/klinecharts/` (with `.txt`), and update `THIRD_PARTY_NOTICES.md` and `/legal/open-source` if the
   notice text changed.
4. Update the version in `tests/charts.test.ts`, `THIRD_PARTY_NOTICES.md` and this file.
5. `npm run typecheck && npm test && npm run build`, then the chart e2e tests (`e2e/charts.spec.ts`), and look at an
   asset chart, the Compare page and a market page on desktop and mobile.
6. If any KLineChart file is ever modified (instead of configured), mark it as modified (Apache 2.0, section 4(b)),
   keep its notices, and say so in `THIRD_PARTY_NOTICES.md`.

## Verifying third-party licensing during upgrades

- `npm view klinecharts@<version> license repository` and the official repository's `LICENSE`.
- `diff node_modules/klinecharts/NOTICE public/licenses/klinecharts/NOTICE.txt` (the unit test does this).
- Run a production licence scan (for example `npx license-checker --production`) and review new licences.
