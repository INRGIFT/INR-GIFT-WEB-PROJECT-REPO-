import { Suspense } from 'react';
import { SignupForm, AuthSkeleton } from '@/features/auth/forms';
import { googleSignInAvailable } from '@/features/auth/google';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Create an account');
export default async function Page() {
  const google = await googleSignInAvailable();
  return <Suspense fallback={<AuthSkeleton />}><SignupForm google={google} /></Suspense>;
}
