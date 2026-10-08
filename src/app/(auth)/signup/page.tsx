import { Suspense } from 'react';
import { SignupForm, AuthSkeleton } from '@/features/auth/forms';
import { oauthAvailability } from '@/features/auth/oauth-providers';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Create an account');
export default async function Page() {
  const oauth = await oauthAvailability();
  return <Suspense fallback={<AuthSkeleton />}><SignupForm oauth={oauth} /></Suspense>;
}
