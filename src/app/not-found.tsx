import type { Metadata } from 'next';
import { MobileBottomNav } from '@/components/layout/mobile-nav';
import { NotFoundBody } from '@/components/layout/not-found-body';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';

export const metadata: Metadata = { title: 'Page not found', robots: { index: false, follow: true } };
/** Unmatched URLs: the public shell around the recovery body, served with a genuine 404 status. */
export default function NotFound() {
  return (<><SiteHeader /><main id="main"><NotFoundBody /></main><SiteFooter /><MobileBottomNav /></>);
}
