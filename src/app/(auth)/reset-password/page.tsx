import { Suspense } from 'react';
import { ResetPassword, AuthSkeleton } from '@/features/auth/forms';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Choose a new password');
export default function Page() { return <Suspense fallback={<AuthSkeleton />}><ResetPassword /></Suspense>; }
