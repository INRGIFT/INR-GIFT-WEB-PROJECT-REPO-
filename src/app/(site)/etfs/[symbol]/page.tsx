import type { Metadata } from 'next';
import { AssetDetail, assetMetadata } from '@/features/assets/asset-detail';

type Props = { params: Promise<{ symbol: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { return assetMetadata('etf', (await params).symbol); }
export default async function Page({ params }: Props) { return <AssetDetail cls="etf" slug={(await params).symbol} />; }
