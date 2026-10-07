import type { Metadata } from 'next';
import { MobileBottomNav } from '@/components/layout/mobile-nav';
import { NotFoundBody } from '@/components/layout/not-found-body';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { isDemoData } from '@/lib/config';
import { getMarkets } from '@/services/market-data';

export const metadata: Metadata = { title: 'Page not found', robots: { index: false, follow: true } };
/** Unmatched URLs: the public shell around the recovery body, served with a genuine 404 status. */
export default async function NotFound() {
  const open = (await getMarkets()).filter((m) => m.session === 'OPEN').length;
  return (<><SiteHeader openCount={open} demo={isDemoData} /><main id="main"><NotFoundBody /></main><SiteFooter /><MobileBottomNav /></>);
}
