# Runtime and visual audit — 6 Oct 2026

Production build (`next build` + `next start`) driven with Playwright (Chromium) at desktop 1440×900, tablet 820×1180
and mobile 390×844. Routes: `/`, `/markets`, `/markets/all`, `/markets/India`, `/assets`, `/assets/stocks`,
`/stocks/AAPL`, `/etfs/SPY`, `/indices/NIFTY-50`, `/fx/USD-INR`, `/commodities/NATGAS`, `/discover`,
`/discover/heatmap`, `/discover/screener`, `/discover/compare`, `/research`, `/research/stocks/aapl`,
`/resources/calendar`, `/resources/data`. Interactions: search, chart range, heatmap drill and quick view, screener
edit and `?sector=` shortcut, compare add, watch while signed out, NATGAS error state, API envelopes.

## What worked
- Every audited route returned 200 at all three widths. No hydration warnings, no uncaught page errors.
- Search (`/`, debounce, grouped results, Enter), heatmap drill-down and quick view, screener filter edits and
  sector shortcut, compare add/remove with URL sync, NATGAS chart error with Retry.
- API: envelopes, pagination (`page 2/18`), `INVALID_QUERY` 400, `NOT_FOUND` 404, `PROVIDER_ERROR` 502.

## Findings (P0 = blocks a core flow, P1 = visibly broken or misleading, P2 = polish)
| # | Pri | Finding | Resolution |
| --- | --- | --- | --- |
| 1 | P0 | `/login`, `/signup`, every `/app/*`, `/account/*`, `/notifications`, `/about`, `/pricing`, `/faq`, `/support`, `/contact`, `/legal/*` return 404 but are linked from header, footer and sidebar. Watch, alert and save send signed-out users to a 404. | Auth, workspace, account and static pages built. |
| 2 | P0 | Phones have no menu: Assets, Resources and Sign in are unreachable below `lg`/`sm`. | Mobile menu drawer with the full navigation and account links. |
| 3 | P1 | Google Fonts loaded by a render-blocking `<link>`; when the CDN is slow or blocked, first paint stalls until it times out (reproduced in headless Chromium). | Fonts self-hosted from `public/fonts` with `font-display: swap`. |
| 4 | P1 | Horizontal overflow on mobile: home 480px wide on a 390px screen (hero grid), compare 455px. | Grid children constrained (`min-w-0`), compare table scrolls inside its panel. |
| 5 | P1 | Charts on phones: SVG text scales with a 1000-unit viewBox, so axis labels render at about 4px. | Charts measure their container and draw at real pixel width. |
| 6 | P1 | Root layout sets `alternates.canonical: '/'`, inherited by pages without their own canonical (research notes, collections, research lists), pointing them at the home page. | Per-page canonical through one metadata helper; root canonical removed. |
| 7 | P1 | Compare metrics show two arrows on best/worst cells (marker ▲ plus the signed change ▲), which reads as an error. | Best/worst shown as a labelled chip, separate from the signed value. |
| 8 | P1 | List and aggregate API envelopes always report `dataStatus: DELAYED` regardless of contents. | Aggregates report the freshest status of their rows. |
| 9 | P1 | No `robots.txt`, sitemap, structured data, icons or OG image; no route-level loading or error boundaries. | Added. |
| 10 | P2 | Search drops characters typed immediately after opening (focus set in an effect). | Input auto-focuses on mount. |
| 11 | P2 | Session rail: the `24:00` axis label collides with the `IST` label. | Axis labels inset. |
| 12 | P2 | "Most active" ranks by share count across currencies, which is not comparable. | Ranked by traded value in USD. |
| 13 | P2 | Heatmap tile colours are muddy at small moves. | Scale retuned. |

Screens were captured to the session scratchpad and are not committed.
