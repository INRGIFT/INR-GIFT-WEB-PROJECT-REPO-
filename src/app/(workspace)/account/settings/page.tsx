import { SettingsPage } from '@/features/account/account-pages';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Preferences');
export default function Page() { return <SettingsPage />; }
