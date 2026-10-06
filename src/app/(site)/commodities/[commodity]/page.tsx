import type { Metadata } from 'next';
import { AssetDetail, assetMetadata } from '@/features/assets/asset-detail';

type Props = { params: Promise<{ commodity: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { return assetMetadata('commodity', (await params).commodity); }
export default async function Page({ params }: Props) { return <AssetDetail cls="commodity" slug={(await params).commodity} />; }
