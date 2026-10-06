# SEO

## Implemented
- Root metadata in `src/app/layout.tsx`: `metadataBase`, title template `%s · INRGIFT`, description, Open Graph basics, canonical.
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

## Still to do
Per-page OG images for assets and research · hreflang if regional editions appear · static generation or ISR once
caching lands.

