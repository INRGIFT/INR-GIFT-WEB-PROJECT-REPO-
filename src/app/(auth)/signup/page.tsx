import { Suspense } from 'react';
import { SignupForm, AuthSkeleton } from '@/features/auth/forms';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Create an account');
export default function Page() { return <Suspense fallback={<AuthSkeleton />}><SignupForm /></Suspense>; }
