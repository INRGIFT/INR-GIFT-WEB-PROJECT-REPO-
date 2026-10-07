'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getAuth, type AuthAdapter, type AuthUser } from './auth-service';

/**
 * `account` is any signed-in session, including one still completing email, phone or SMS verification; the auth
 * screens use it. `user` is set only when the account is fully activated and this session passed the SMS challenge
 * (gate 'ok'); everything else in the app (header, workspace, notes) reads `user`, so a partial session is never
 * treated as signed in.
 */
interface Session { user: AuthUser | null; account: AuthUser | null; loading: boolean; auth: AuthAdapter; refresh: () => Promise<AuthUser | null> }
const Ctx = createContext<Session | null>(null);
export function useSession(): Session { const v = useContext(Ctx); if (!v) throw new Error('useSession must be used inside <SessionProvider>'); return v; }

export function SessionProvider({ children }: { children: ReactNode }) {
  const auth = useMemo(() => getAuth(), []);
  const [account, setAccount] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => { const u = await auth.getUser().catch(() => null); setAccount(u); setLoading(false); return u; }, [auth]);
  useEffect(() => { void refresh(); return auth.onChange(() => void refresh()); }, [auth, refresh]);
  const user = account?.gate === 'ok' ? account : null;
  return <Ctx.Provider value={{ user, account, loading, auth, refresh }}>{children}</Ctx.Provider>;
}
