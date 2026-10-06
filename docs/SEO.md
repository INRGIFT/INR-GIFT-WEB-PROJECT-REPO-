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

## To do
`app/sitemap.ts` (markets, assets, research, resources from services) · `app/robots.ts` · JSON-LD (Organization,
BreadcrumbList, Article for research, FinancialProduct/Corporation where appropriate) · OG image route ·
favicon and app icons · per-page descriptions for static pages once built · decide canonical for `/markets?region=`
and `/resources/news?category=` (currently canonical to the base page) · static generation or ISR for content pages.

## Rules
No keyword-stuffed footers. Titles describe the page. Demo data must not be presented to crawlers as live prices:
keep the Demo label and do not ship demo mode to a public production domain.
