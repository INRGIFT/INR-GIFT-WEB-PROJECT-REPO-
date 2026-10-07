# SEO

## Access-driven indexing (7 Oct 2026)
Only the public pages (homepage and compliance pages) can be indexed; they show no market data, so they are indexable even while the product serves demo data (`SITE_INDEXABLE=false` closes them). Every product page requires sign-in:
middleware sends `X-Robots-Tag: noindex, nofollow` and `Cache-Control: private, no-store`, `pageMetadata()` emits
`noindex` for any non-public path, robots.txt allows only those pages (`Allow: /$`, `/terms-and-conditions$`, … `/legal/`; `Disallow: /`; with SITE_INDEXABLE=false it disallows
everything while the site serves demo data), and the sitemap (`/sitemap.xml` → `/sitemap/core.xml`) lists only the
public pages. The entity quality gate and per-entity titles below still shape titles and share text for signed-in
users, but no product URL is published to crawlers. Sections below describe the earlier public-site design.

## Implemented
- Root metadata in `src/app/layout.tsx`: `metadataBase`, title template `%s | INRGIFT`, description, Open Graph basics, canonical.
- Per-route `metadata` / `generateMetadata` with canonical on markets, assets, discover, research, resources.
- Asset pages: `assetMetadata()` builds title/description/canonical/OG from the instrument.
- Research documents: article Open Graph with `publishedTime`.
- Clean URLs: `/stocks/AAPL`, `/etfs/SPY`, `/indices/NIFTY-50`, `/fx/USD-INR`, `/markets/India`, `/discover/screener`.
  Slugs are public; immutable ids stay internal.
- `(workspace)` layout sets `robots: noindex`; middleware adds `X-Robots-Tag: noindex, nofollow` to private routes.
- Semantic headings, breadcrumbs, internal linking between market ↔ asset ↔ research ↔ collection.

## Also implemented (Oct 2026)
- `src/lib/seo.ts` `pageMetadata()`: canonical, Open Graph, Twitter and robots for every route; `index: 'faceted'`
  for filtered states (`/markets?region=`, `/resources/news?category=`, screener, heatmap and compare parameters,
  `/search`), `privateMetadata()` for auth, account and workspace.
- **Indexing guard:** nothing is indexable while the provider is demo (`config.isIndexable`, override with
  `SITE_INDEXABLE`); robots.txt then disallows everything.
- `app/robots.ts`; `app/sitemap.ts` split into core, markets, assets, research and resources (`/sitemap/<id>.xml`).
- JSON-LD (`src/lib/structured-data.tsx`): Organization and WebSite with SearchAction (home), BreadcrumbList,
  Corporation / InvestmentFund / FinancialProduct identity for instruments (never prices), Place for markets,
  Article for research and learn, DefinedTerm and DefinedTermSet for the glossary, FAQPage.
- Entity and internal linking: glossary terms link to live metric rankings and the screener; research notes link
  terms, peers, markets and collections; learn articles link terms and tutorials.
- `app/icon.svg`, `app/opengraph-image.tsx`.

## Also implemented (7 Oct 2026)
- Entity titles per class, e.g. "AAPL Stock: Price, Performance, Valuation & Research | INRGIFT" (`src/lib/indexability.ts`).
- Entity quality gate: an asset is indexable only with an id, price, status, source, at least four metrics and a
  description of at least 40 characters; a market needs covered listings. Failing pages are noindex and left out of
  the sitemap.
- Unknown entities return a genuine 404 status (`notFound()` in `generateMetadata`; no route-level loading boundary).
- `/sitemap.xml` is a sitemap index over the section files; both are empty while the site is not indexable.
- Indexing rules per route live in `src/lib/route-registry.ts`.
- Deferred: Event and Dataset JSON-LD (would describe demo data as real; see `docs/DECISIONS.md`).

## Still to do
Per-page OG images for assets and research · hreflang if regional editions appear · static generation or ISR once
caching lands.

