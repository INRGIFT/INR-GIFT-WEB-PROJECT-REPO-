import { ScreensPage } from '@/features/workspace/saved';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Saved screens');
export default function Page() { return <ScreensPage />; }
