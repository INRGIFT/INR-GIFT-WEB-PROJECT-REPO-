import { TutorialDisclosure } from '@/features/media/video-module';
import { notFound } from 'next/navigation';
import { getVideoFor } from '@/services/content';
import type { Metadata } from 'next';
import { EtfReview } from '@/features/assets/etf-review';
import { assetHref } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import * as md from '@/services/market-data';

type Props = { params: Promise<{ symbol: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await md.getAsset('etf', (await params).symbol);
  return a ? pageMetadata({ title: `${a.symbol} ETF review: cost, size, liquidity, holdings and risk`, description: `${a.name} examined in eight steps: objective, cost, size, liquidity, holdings, allocation, performance and risk, against other covered ETFs.`, path: `${assetHref(a)}/review` }) : notFound();
}
export default async function Page({ params }: Props) {
  const [{ symbol }, video] = await Promise.all([params, getVideoFor('page:etf-review')]);
  return <><EtfReview slug={symbol} />{video && <div className="mx-auto w-full max-w-page px-4 pb-8 md:px-6 lg:px-8"><TutorialDisclosure video={video} label="How the eight-step review works" /></div>}</>;
}
