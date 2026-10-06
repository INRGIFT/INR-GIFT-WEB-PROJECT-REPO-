import type { Metadata } from 'next';
import { AssetDetail, assetMetadata } from '@/features/assets/asset-detail';

type Props = { params: Promise<{ pair: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { return assetMetadata('fx', (await params).pair); }
export default async function Page({ params }: Props) { return <AssetDetail cls="fx" slug={(await params).pair} />; }
