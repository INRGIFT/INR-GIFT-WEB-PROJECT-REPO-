# API contract — `/api/v1`

Implemented in `src/app/api/v1/[...path]/route.ts`. GET only. Rate limited (240/min per IP, in-memory).
`Cache-Control: public, s-maxage=15, stale-while-revalidate=60`.

Success: `{ "data": …, "meta": { "timestamp", "source", "dataStatus", "timezone"?, "ingestedAt"? }, "pagination"?: { page, pageSize, total, totalPages } }`
Error: `{ "error": { "code", "message" } }` — codes: INVALID_QUERY 400, NOT_FOUND 404, RATE_LIMITED 429,
NOT_ENTITLED 403, PROVIDER_ERROR / DATA_UNAVAILABLE 502, NOT_CONFIGURED 503, INTERNAL_ERROR 500.

Query params (zod-validated): `page`, `pageSize` (≤500), `q`, `class` (comma list; accepts `stocks`/`stock` etc.),
`market`, `region`, `sector`, `range` (1D 5D 1M 3M 6M YTD 1Y 3Y 5Y MAX), `kind`, `universe` (all|stock|etf|reit), `ids`
(comma list of ids or slugs, up to 4000 characters; used by the workspace).
Lists and aggregates report the freshest `dataStatus` of their rows; content endpoints report `END_OF_DAY`.
`:id` accepts an instrument id or a slug.

| Endpoint | Returns |
| --- | --- |
| `markets`, `markets/:market`, `exchanges` | MarketView[] / MarketView / exchanges |
| `assets` | paginated Asset[] (filters above) |
| `search`, `assets/search` | `{ assets, markets, research, themes }` |
| `assets/:id` | Asset |
| `assets/:id/price` | Quote |
| `assets/:id/ohlcv?range=` | Candle[] or null (validated) |
| `assets/:id/chart?range=&resolution=` | `ChartSeries` (`src/lib/charts/types.ts`): bars + listing, native currency, venue time zone, status, session, source, as-of. `400 UNSUPPORTED_RESOLUTION` with `supported` when the source has no such bars; `502 PROVIDER_ERROR`; `404` for an unknown instrument. Protected like every `/api/v1` route. |
| `assets/:id/identity` | InstrumentIdentity or null (issuer, securities, listings) |
| `research?kind=` | ResearchDoc[]; kinds stocks, etfs, markets, themes, sectors, countries; structured fields filled by `structureDoc` |
| `assets/:id/fundamentals` `valuation` `technicals` `dividends` `news` `research` | per-asset blocks, null when unavailable |
| `etfs`, `etfs/:id/holdings`, `etfs/:id/allocations` | ETF list / holdings / allocations |
| `indices` `fx` `commodities` `bonds` `reits` | class lists |
| `heatmap?universe=` | Asset[] for stock/etf/reit |
| `movers` `sectors` | aggregates |
| `calendar?kind=` `earnings` `dividends` | CalendarEvent[] |
| `news?kind=<category>` `research?kind=` `themes` `fx-rates` | content and reference rates |

Internal: `POST /api/internal/ingest` with header `x-ingest-secret` — validates an OHLCV batch, returns accepted /
quarantined counts. Not callable without the secret.

`POST /api/contact` — `{ name, email, topic, message, page? }`, zod-validated, 5 per 10 minutes per IP, honeypot
field; 201 with a reference, 400 with field errors, 503 `NOT_CONFIGURED` without Supabase.

Covered by `tests/api.test.ts`. Originally verified by HTTP smoke test: `markets`, `search`, `assets/AAPL/ohlcv` (200), `etfs/SPY/holdings` (200),
`assets/NATGAS/ohlcv` (502 by design). Not yet covered by automated API tests.
