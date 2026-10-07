import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { isDemoData } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };
/**
 * Every authenticated product page (workspace, markets, assets, discover, research, news, account) inside the
 * application shell. Access is enforced before this renders (src/middleware.ts); the shell only displays.
 */
export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return <AppShell demo={isDemoData}>{children}</AppShell>;
}
