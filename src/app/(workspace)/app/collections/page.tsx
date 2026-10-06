import { CollectionsPage } from '@/features/workspace/notes-collections';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Collections');
export default function Page() { return <CollectionsPage />; }
