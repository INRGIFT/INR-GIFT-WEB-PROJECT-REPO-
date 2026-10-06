import { OverviewPage } from '@/features/workspace/overview';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Workspace');
export default function Page() { return <OverviewPage />; }
