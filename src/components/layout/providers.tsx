'use client';
import type { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/toast';
import { PageViewTracker } from '@/components/layout/analytics-consent';
import { SessionProvider } from '@/features/auth/session-context';
import { SearchProvider } from '@/features/search/search-command';
import { AlertEngine } from '@/features/workspace/alert-engine';
import { WorkspaceProvider } from '@/features/workspace/workspace-context';

export function Providers({ rates, children }: { rates: Record<string, number>; children: ReactNode }) {
  return (
    <ToastProvider>
      <SessionProvider>
        <WorkspaceProvider rates={rates}>
          <SearchProvider>{children}</SearchProvider>
          <AlertEngine />
          <PageViewTracker />
        </WorkspaceProvider>
      </SessionProvider>
    </ToastProvider>
  );
}
