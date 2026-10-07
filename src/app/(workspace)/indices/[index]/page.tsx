import type { Metadata } from 'next';
import { AssetDetail, assetMetadata } from '@/features/assets/asset-detail';

type Props = { params: Promise<{ index: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { return assetMetadata('index', (await params).index); }
export default async function Page({ params }: Props) { return <AssetDetail cls="index" slug={(await params).index} />; }
