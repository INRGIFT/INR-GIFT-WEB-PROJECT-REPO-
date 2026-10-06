import { Onboarding } from '@/features/auth/onboarding';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Set up your workspace');
export default function Page() { return <Onboarding />; }
