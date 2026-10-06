import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { MobileBottomNav } from '@/components/layout/mobile-nav';
import { SiteHeader } from '@/components/layout/site-header';
import { WorkspaceSidebar, WorkspaceTabs } from '@/components/layout/workspace-sidebar';
import { isDemoData } from '@/lib/config';
import { getMarkets } from '@/services/market-data';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };
export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const open = (await getMarkets()).filter((m) => m.session === 'OPEN').length;
  return (
    <>
      <SiteHeader openCount={open} demo={isDemoData} />
      <WorkspaceTabs />
      <div className="flex"><WorkspaceSidebar /><main id="main" className="min-w-0 flex-1 pb-24 md:pb-10">{children}</main></div>
      <MobileBottomNav />
    </>
  );
}
