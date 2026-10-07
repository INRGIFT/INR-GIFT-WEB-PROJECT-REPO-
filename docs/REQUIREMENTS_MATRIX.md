# Requirements matrix

Status against the full-web build brief (Oct 2026).

**Built:** implemented and verified in this repo.
**Partial:** implemented with a stated gap.
**External:** needs an owner action, licence or vendor.
**Deferred:** intentionally not done; see `docs/DECISIONS.md`.

| Area | Status | Evidence / gap |
| --- | --- | --- |
| Research-only scope (no trading concepts) | Built | `tests/smoke.test.ts`, `tests/api.test.ts` check payloads; copy rules in `docs/CONTENT.md` |
| Official brand, tagline INVEST BEYOND BORDERS | Built | `docs/BRAND_ASSET_INVENTORY.md`; files used unmodified via `brand-logo.tsx` |
| Design tokens | Built | `tailwind.config.ts`, `docs/DESIGN-SYSTEM.md`; contrast-checked by axe |
| Shell: header, sidebar groups, mobile nav | Built | `src/components/layout/*`; e2e on desktop and Pixel 7 |
| Universal search (all entity kinds, Ctrl/⌘+K, recent, combobox, noindex) | Built | `search-command.tsx`, `/search` X-Robots-Tag tested in `e2e/quality.spec.ts`; tutorial recorded |
| Data flow UI → API → service → provider | Built | `docs/ARCHITECTURE.md`; `docs/ARCHITECTURE_AUDIT.md` |
| Identity Issuer → Security → Listing → MIC → provider symbol; no invented ISIN/FIGI | Built | `src/lib/types.ts` identity types; ISIN is `null` unless supplied |
| DataStatus on every data module | Built | `DataStatus` component; release checklist in `docs/QA.md` |
| Data quality, stale fallback | Built | `withFallback` proxy → STALE; failure cases in e2e |
| Market calendar from data; 28-market universe | Built | Seed exchanges with sessions, auctions and holidays; `exchange-calendar.tsx` |
| Stock, ETF, index, FX, commodity, bond and REIT pages | Built | Route registry samples return 200 (e2e) |
| Heatmap, screener, compare (no "best asset") | Built | Compare marks Highest/Lowest per metric, no verdict |
| Research: six kinds, structured format, no invented authors | Built | Author "INRGIFT Research" (organisation); reviewer field null until named |
| News kinds and summaries, no republishing | Partial | Demo-generated items only; licensed news source is External |
| Calendar with time zone, source and related page | Built | `/resources/calendar` |
| Discover hub, workspace, auth | Built | e2e account journey (demo auth) |
| Auth against Supabase in production | External | Supabase project live; SMTP, SMS and Site URL are owner settings |
| CMS content types and statuses | Built | `src/services/content/types.ts`; only PUBLISHED/UPDATED shown |
| Learn library (~38) and detailed glossary | Built | 44 guides, 36 terms |
| Videos incl. "INRGIFT in 60 seconds" and "Universal search" | Built | 8 recordings in `public/media`, captions, transcripts, chapters |
| Motion and reduced motion | Built | Reduced-motion test in e2e |
| SEO: metadata, canonical, robots, sitemap, structured data, quality gate, titles | Built | `src/lib/seo.ts`, `indexability.ts`, sitemap index; demo guard keeps the site closed |
| Event / Dataset structured data | Deferred | Would describe demo data as real |
| Accessibility | Partial | Axe (WCAG 2 A/AA) clean on 12 pages; no manual screen-reader pass yet |
| Performance | Partial | Pages render dynamically; caching/ISR is on the roadmap; no Lighthouse run |
| Security headers incl. CSP | Built | `next.config.mjs`; checked on the standalone bundle; `'unsafe-inline'` noted in DECISIONS |
| Analytics events | Partial | 16 typed events wired and consent-gated; no vendor (External) |
| Observability | Partial | JSON logs, `/api/health`, `reportError`; no vendor reporter (External) |
| Useful 404s with real status | Built | e2e asserts 404 on unknown stock, market, research and path |
| Responsive at 375/390/768/1024/1280/1440 | Built | e2e overflow test at all six widths |
| Tests: a11y, reduced motion, failure cases, critical journey | Built | 64 Playwright tests, 51 unit/API tests |
| GoDaddy packaging | Built | Bundle built, unpacked, booted and probed; host setup is External |
| Live market data (NSE) | External | Adapter built, not connected; no endpoints invented |
| Legal text, grievance officer | External | Labelled drafts; lawyer review required |
| Server-side alert job | Partial | Alerts are evaluated in the browser; scheduled job not built |
