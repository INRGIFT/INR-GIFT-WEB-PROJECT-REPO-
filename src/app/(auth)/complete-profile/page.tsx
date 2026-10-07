import { Suspense } from 'react';
import { CompleteProfile, AuthSkeleton } from '@/features/auth/forms';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Finish setting up your account');
export default function Page() { return <Suspense fallback={<AuthSkeleton />}><CompleteProfile /></Suspense>; }
