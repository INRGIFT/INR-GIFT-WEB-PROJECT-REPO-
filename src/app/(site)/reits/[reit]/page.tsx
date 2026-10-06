import type { Metadata } from 'next';
import { AssetDetail, assetMetadata } from '@/features/assets/asset-detail';

type Props = { params: Promise<{ reit: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { return assetMetadata('reit', (await params).reit); }
export default async function Page({ params }: Props) { return <AssetDetail cls="reit" slug={(await params).reit} />; }
