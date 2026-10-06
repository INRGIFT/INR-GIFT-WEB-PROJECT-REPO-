import { ComparisonsPage } from '@/features/workspace/saved';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Saved comparisons');
export default function Page() { return <ComparisonsPage />; }
