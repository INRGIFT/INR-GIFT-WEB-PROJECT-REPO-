import { Suspense } from 'react';
import { VerifyPhone, AuthSkeleton } from '@/features/auth/forms';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Verify your phone');
export default function Page() { return <Suspense fallback={<AuthSkeleton />}><VerifyPhone /></Suspense>; }
