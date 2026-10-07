'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSession } from '@/features/auth/session-context';
import type { AccountProfile } from './types';

/**
 * The signed-in account's details (GIFT ID, name, verification, dates), read once per account from the server
 * (auth.getProfile → GET /api/v1/me in production) and shared by the sidebar, top bar, dashboard and account pages.
 * Keyed on the account id, so token refreshes do not refetch. Failures are reported with a retry, never as blank data.
 */
interface AccountState { profile: AccountProfile | null; loading: boolean; error: string | null; reload: () => void }
const Ctx = createContext<AccountState | null>(null);
const TIMEOUT_MS = 12_000;

export function AccountProvider({ children }: { children: ReactNode }) {
  const { auth, user } = useSession();
  const uid = user?.id ?? null;
  const [state, setState] = useState<Omit<AccountState, 'reload'>>({ profile: null, loading: false, error: null });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!uid) { setState({ profile: null, loading: false, error: null }); return; }
    let live = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.race([auth.getProfile(), new Promise<never>((_, no) => setTimeout(() => no(new Error('timeout')), TIMEOUT_MS))])
      .then((profile) => { if (live) setState({ profile, loading: false, error: null }); })
      .catch(() => { if (live) setState((s) => ({ ...s, loading: false, error: 'Your account details could not load.' })); });
    return () => { live = false; };
  }, [uid, tick, auth]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  const value = useMemo(() => ({ ...state, reload }), [state, reload]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useAccount(): AccountState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAccount must be used inside <AccountProvider>');
  return v;
}
/** Initials from a name ("Kisna Soni" → "KS"); "ME" when there is no name. */
export const initialsOf = (name?: string | null) => (name ?? '').trim().split(/\s+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'ME';
