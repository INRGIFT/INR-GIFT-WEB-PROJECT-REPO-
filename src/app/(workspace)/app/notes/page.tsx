import { NotesPage } from '@/features/workspace/notes-collections';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Notes');
export default function Page() { return <NotesPage />; }
