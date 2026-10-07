'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { analyticsConsent, setAnalyticsConsent, track } from '@/lib/telemetry/analytics';

/** Records a page view (path only) when, and only when, analytics consent has been granted. */
export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => { track('page_view', { path: pathname }); }, [pathname]);
  return null;
}

/** Opt-in switch for product analytics. Off by default; stored in this browser only. */
export function AnalyticsConsent() {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(analyticsConsent() === 'granted'), []);
  return (
    <label className="flex items-start gap-3">
      <input type="checkbox" className="mt-1 h-4 w-4 accent-brand" checked={on} onChange={(e) => { setAnalyticsConsent(e.target.checked ? 'granted' : 'denied'); setOn(e.target.checked); }} />
      <span><span className="font-semibold">Share anonymous product analytics</span><span className="block text-ui text-slate2">Which pages and tools are used, as counts and public identifiers only: never your email, phone, notes or search text. Off unless you turn it on; stored in this browser.</span></span>
    </label>
  );
}
