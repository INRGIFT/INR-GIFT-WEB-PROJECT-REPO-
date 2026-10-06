import { ProfilePage } from '@/features/account/account-pages';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Profile');
export default function Page() { return <ProfilePage />; }
