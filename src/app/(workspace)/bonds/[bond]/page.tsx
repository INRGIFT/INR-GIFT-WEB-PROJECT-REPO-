import type { Metadata } from 'next';
import { AssetDetail, assetMetadata } from '@/features/assets/asset-detail';

type Props = { params: Promise<{ bond: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { return assetMetadata('bond', (await params).bond); }
export default async function Page({ params }: Props) { return <AssetDetail cls="bond" slug={(await params).bond} />; }
