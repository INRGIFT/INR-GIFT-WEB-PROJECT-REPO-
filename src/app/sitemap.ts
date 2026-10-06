import type { MetadataRoute } from 'next';
import { assetHref, collectionHref, DIRECTORY_CLASS, glossaryHref, learnHref, marketHref, researchHref } from '@/lib/routes';
import { absoluteUrl } from '@/lib/seo';
import { getGlossary, getLearnArticles, getLegalDocs } from '@/services/content';
import * as md from '@/services/market-data';

/**
 * Sitemap index split by section so each file stays small as coverage grows (served at /sitemap/<id>.xml).
 * Only canonical, indexable URLs are listed: no faceted, private or search URLs.
 */
const SECTIONS = ['core', 'markets', 'assets', 'research', 'resources'] as const;
export async function generateSitemaps() { return SECTIONS.map((id) => ({ id })); }
type Entry = MetadataRoute.Sitemap[number];
const u = (path: string, priority = 0.6, changeFrequency: Entry['changeFrequency'] = 'daily', lastModified?: string | Date): Entry => ({ url: absoluteUrl(path), priority, changeFrequency, ...(lastModified ? { lastModified } : {}) });

export default async function sitemap({ id }: { id: (typeof SECTIONS)[number] }): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  switch (id) {
    case 'core': return [u('/', 1, 'hourly', now), ...['/markets', '/markets/all', '/assets', '/discover', '/discover/heatmap', '/discover/screener', '/discover/compare', '/discover/trending', '/discover/collections', '/research', '/resources'].map((p) => u(p, 0.8, 'hourly', now)), ...['/about', '/pricing', '/faq', '/support', '/contact'].map((p) => u(p, 0.4, 'monthly')), ...(await getLegalDocs()).map((d) => u(`/legal/${d.slug}`, 0.2, 'yearly'))];
    case 'markets': return (await md.getMarkets()).map((m) => u(marketHref(m.slug), 0.8, 'hourly', now));
    case 'assets': { const all = await md.getAssets(); return [...Object.keys(DIRECTORY_CLASS).map((c) => u(`/assets/${c}`, 0.7)), ...all.map((a) => u(assetHref(a), a.cls === 'stock' || a.cls === 'etf' ? 0.7 : 0.6, 'hourly', now)), ...all.filter((a) => a.cls === 'etf').map((a) => u(`${assetHref(a)}/review`, 0.6, 'weekly'))]; }
    case 'research': { const [docs, themes] = await Promise.all([md.getResearch(), md.getThemes()]); return [...(['stocks', 'etfs', 'markets', 'themes'] as const).map((k) => u(`/research/${k}`, 0.7)), ...docs.map((d) => u(researchHref(d), 0.7, 'weekly', d.publishedAt)), ...themes.map((t) => u(collectionHref(t.id), 0.6))]; }
    case 'resources': { const [learn, terms] = await Promise.all([getLearnArticles(), getGlossary()]); return [...['news', 'earnings', 'dividends', 'ipo', 'calendar', 'learn', 'glossary', 'data'].map((k) => u(`/resources/${k}`, 0.6)), ...learn.map((a) => u(learnHref(a.slug), 0.5, 'monthly')), ...terms.map((t) => u(glossaryHref(t.slug), 0.5, 'monthly'))]; }
  }
}
