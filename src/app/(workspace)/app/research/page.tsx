import { SavedResearchPage } from '@/features/workspace/saved';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Saved research');
export default function Page() { return <SavedResearchPage />; }
