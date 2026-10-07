import { SessionsPage } from '@/features/account/account-pages';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Sessions');
export default function Page() { return <SessionsPage />; }
