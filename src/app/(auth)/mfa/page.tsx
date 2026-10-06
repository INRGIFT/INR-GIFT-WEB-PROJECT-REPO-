import { Suspense } from 'react';
import { MfaPage, AuthSkeleton } from '@/features/auth/forms';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Two-step verification');
export default function Page() { return <Suspense fallback={<AuthSkeleton />}><MfaPage /></Suspense>; }
