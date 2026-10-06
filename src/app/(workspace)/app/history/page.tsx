import { HistoryPage } from '@/features/workspace/saved';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('History');
export default function Page() { return <HistoryPage />; }
