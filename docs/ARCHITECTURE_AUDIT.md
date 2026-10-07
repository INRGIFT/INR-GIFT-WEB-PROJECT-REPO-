# Architecture audit (7 Oct 2026)

A check of the rules in `CLAUDE.md` against the code. Commands used are listed so the audit can be repeated.

| Rule | Result | How checked |
| --- | --- | --- |
| Only `src/providers` and `src/services` import seed data or vendors | Pass | `grep -rn "providers/demo" src --include=*.ts* \| grep -v "^src/providers\|^src/services"` returns nothing |
| Provider selection only in `config.ts` + `providers/index.ts` | Pass | Components never branch on the provider. `isDemoData` is read only to show the "Demo data" label (layouts, asset description); indexing reads `config.isIndexable` |
| Instruments keyed by `ins_######`, slugs in URLs | Pass | Identity tests in `tests/api.test.ts` |
| `undefined` = n/a, `null` = unavailable, never fake zeros | Pass | Unit tests on missing metrics |
| DataStatus on data modules | Pass | Release checklist; e2e failure cases show statuses |
| Private data through `WorkspaceRepo`; no `user_id` from the client | Pass | RLS suite (`npm run test:db`); service-role key absent from client bundles (grep of `.next/static`) |
| Metrics from `src/lib/metrics.ts` | Pass | Screener, tables and compare import the registry |
| Routes in `routes.ts` / `route-registry.ts` | Pass | Middleware and robots read the registry |
| Tokens only; raw hex only in SVG renderers | Pass with note | Compare uses the chart series colours inline for the swatch dot, which matches the chart line colour |
| Metadata via `pageMetadata()` / `privateMetadata()` | Pass | Entity pages call `notFound()` in `generateMetadata` |
| Content only via `src/services/content.ts` getters | Pass | Pages import getters; data lives in `src/services/content/` |

## Findings fixed in this pass
- Unknown entities returned 200 because of the route-level loading boundary. Removed (DECISIONS).
- `/sitemap.xml` was missing and unknown section ids crashed with a 500. Added an index and an empty default.
- Section sitemaps listed URLs while the site was closed. They are now empty when not indexable.
- Axe failures for contrast and link styling. Tokens and `.link` fixed.
- The header overflowed at 1024 px. Breakpoints adjusted.
- `chart_interaction` was declared but never sent. Now wired.

## Known structural debts
- `(site)` routes render dynamically. There is no ISR or per-module streaming yet.
- The rate limiter is in-memory per instance.
- CSP needs `'unsafe-inline'`.
- Alert evaluation runs in the browser.
- NSE IX overnight sessions are not modelled.
