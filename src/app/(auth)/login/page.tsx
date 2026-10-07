import { Suspense } from 'react';
import { LoginForm, AuthSkeleton } from '@/features/auth/forms';
import { googleSignInAvailable } from '@/features/auth/google';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Sign in');
export default async function Page() {
  const google = await googleSignInAvailable();
  return <Suspense fallback={<AuthSkeleton />}><LoginForm google={google} /></Suspense>;
}
