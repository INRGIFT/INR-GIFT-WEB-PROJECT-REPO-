import { Suspense } from 'react';
import { LoginForm, AuthSkeleton } from '@/features/auth/forms';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Sign in');
export default function Page() { return <Suspense fallback={<AuthSkeleton />}><LoginForm /></Suspense>; }
