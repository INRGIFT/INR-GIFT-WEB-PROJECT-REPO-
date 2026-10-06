import { RecentPage } from '@/features/workspace/saved';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Recent');
export default function Page() { return <RecentPage />; }
