import { Suspense } from 'react';
import { LoginForm, AuthSkeleton } from '@/features/auth/forms';
import { oauthAvailability } from '@/features/auth/oauth-providers';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Sign in');
export default async function Page() {
  const oauth = await oauthAvailability();
  return <Suspense fallback={<AuthSkeleton />}><LoginForm oauth={oauth} /></Suspense>;
}
