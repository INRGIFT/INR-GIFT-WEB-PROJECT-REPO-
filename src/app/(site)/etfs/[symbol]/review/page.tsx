import type { Metadata } from 'next';
import { EtfReview } from '@/features/assets/etf-review';
import { assetHref } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import * as md from '@/services/market-data';

type Props = { params: Promise<{ symbol: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await md.getAsset('etf', (await params).symbol);
  return a ? pageMetadata({ title: `${a.symbol} ETF review: cost, size, liquidity, holdings and risk`, description: `${a.name} examined in eight steps: objective, cost, size, liquidity, holdings, allocation, performance and risk, against other covered ETFs.`, path: `${assetHref(a)}/review` }) : { title: 'Not found' };
}
export default async function Page({ params }: Props) { return <EtfReview slug={(await params).symbol} />; }
