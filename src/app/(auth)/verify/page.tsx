import { Suspense } from 'react';
import { VerifyEmail, AuthSkeleton } from '@/features/auth/forms';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Verify your email');
export default function Page() { return <Suspense fallback={<AuthSkeleton />}><VerifyEmail /></Suspense>; }
