import type { ReactNode } from 'react';
import { MobileBottomNav } from '@/components/layout/mobile-nav';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';

export const dynamic = 'force-dynamic';
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (<><SiteHeader /><main id="main">{children}</main><SiteFooter /><MobileBottomNav /></>);
}
