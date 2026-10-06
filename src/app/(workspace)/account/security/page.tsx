import { SecurityPage } from '@/features/account/account-pages';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Security');
export default function Page() { return <SecurityPage />; }
