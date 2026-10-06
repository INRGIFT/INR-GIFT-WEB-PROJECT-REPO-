import { Suspense } from 'react';
import { ForgotPassword, AuthSkeleton } from '@/features/auth/forms';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Reset your password');
export default function Page() { return <Suspense fallback={<AuthSkeleton />}><ForgotPassword /></Suspense>; }
