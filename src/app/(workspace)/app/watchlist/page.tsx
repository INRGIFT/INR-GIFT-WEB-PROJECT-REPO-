import { Suspense } from 'react';
import { PageSkeleton } from '@/components/layout/route-states';
import { WatchlistPage } from '@/features/workspace/watchlist';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Watchlist');
export default function Page() { return <Suspense fallback={<PageSkeleton wide />}><WatchlistPage /></Suspense>; }
