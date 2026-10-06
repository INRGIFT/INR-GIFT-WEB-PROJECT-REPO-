'use client';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { Button, buttonClass } from '@/components/ui/button';
import { PageContainer, Skeleton } from '@/components/ui/primitives';

/** Skeleton shown while a route's server data streams in. Mirrors the common page shape so nothing jumps. */
export function PageSkeleton({ wide }: { wide?: boolean }) {
  return (
    <PageContainer wide={wide}>
      <div role="status" aria-label="Loading page" className="space-y-5">
        <div className="space-y-2.5"><Skeleton className="h-3 w-40" /><Skeleton className="h-8 w-72 max-w-full" /><Skeleton className="h-4 w-[34rem] max-w-full" /></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-card" />)}</div>
        <Skeleton className="h-[320px] w-full rounded-card" />
        <div className="grid gap-4 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-card" />)}</div>
      </div>
    </PageContainer>
  );
}
/** Route error boundary body. Names what failed, offers Retry, and keeps navigation available. */
export function RouteError({ error, reset, area = 'This page' }: { error: Error & { digest?: string }; reset: () => void; area?: string }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <PageContainer>
      <div role="alert" className="mx-auto flex max-w-lg flex-col items-center rounded-card border border-line bg-white px-6 py-12 text-center shadow-card">
        <AlertTriangle size={26} className="text-down" strokeWidth={1.75} />
        <h1 className="mt-3 text-xl font-bold">{area} could not load</h1>
        <p className="mt-1.5 text-slate2">A request failed while building it. Your saved data is safe. Try again, or go somewhere else and come back.</p>
        {error.digest && <p className="mt-2 text-xs text-faint">Reference {error.digest}</p>}
        <div className="mt-5 flex flex-wrap justify-center gap-2"><Button variant="primary" onClick={reset}><RotateCcw size={15} />Try again</Button><Link href="/" className={buttonClass('secondary')}>Go to home</Link><Link href="/resources/data" className={buttonClass('ghost')}>Data status</Link></div>
      </div>
    </PageContainer>
  );
}
