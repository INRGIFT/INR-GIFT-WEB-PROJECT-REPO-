import type { ReactNode } from 'react';
import { MobileBottomNav } from '@/components/layout/mobile-nav';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { isDemoData } from '@/lib/config';
import { getMarkets } from '@/services/market-data';

export const dynamic = 'force-dynamic';
export default async function PublicLayout({ children }: { children: ReactNode }) {
  const open = (await getMarkets()).filter((m) => m.session === 'OPEN').length;
  return (<><SiteHeader openCount={open} demo={isDemoData} /><main id="main">{children}</main><SiteFooter /><MobileBottomNav /></>);
}
