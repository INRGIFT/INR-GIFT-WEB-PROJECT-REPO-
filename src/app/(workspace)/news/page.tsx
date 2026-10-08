import type { Metadata } from 'next';
import { PageContainer } from '@/components/ui/primitives';
import { NewsFeed } from '@/features/news/news-feed';
import { pageMetadata } from '@/lib/seo';
import * as md from '@/services/market-data';
import { parseNewsQuery } from '@/services/news/news-query';
import { getNews } from '@/services/news/news-service';

type Props = { searchParams: Promise<Record<string, string | undefined>> };
/** Benchmarks in the news page's market pulse. Instruments the data source does not carry are left out. */
const PULSE = ['NIFTY-50', 'SENSEX', 'SP-500', 'NASDAQ-COMPOSITE', 'FTSE-100', 'NIKKEI-225', 'USD-INR', 'GOLD', 'BRENT', 'US-10Y'];

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  return pageMetadata({ title: 'Global market news', description: 'Market-moving news, macro developments, company events and financial intelligence.', path: '/news', index: Object.keys(sp).length ? 'faceted' : 'index' });
}

/** /news: GLOBAL MARKET NEWS, the canonical news page (/resources/news redirects here permanently, next.config.ts). */
export default async function NewsPage({ searchParams }: Props) {
  const query = parseNewsQuery(await searchParams);
  const [result, markets, pulseAssets] = await Promise.all([getNews(query), md.getMarkets(), Promise.all(PULSE.map((slug) => md.getAsset(undefined, slug)))]);
  const assets = pulseAssets.filter((a): a is NonNullable<typeof a> => Boolean(a));
  return <PageContainer wide><NewsFeed query={query} result={result} markets={markets} pulse={{ assets, markets, meta: md.freshest(assets) }} /></PageContainer>;
}
