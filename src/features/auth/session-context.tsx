'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getAuth, type AuthAdapter, type AuthUser } from './auth-service';

interface Session { user: AuthUser | null; loading: boolean; auth: AuthAdapter; refresh: () => Promise<AuthUser | null> }
const Ctx = createContext<Session | null>(null);
export function useSession(): Session { const v = useContext(Ctx); if (!v) throw new Error('useSession must be used inside <SessionProvider>'); return v; }

export function SessionProvider({ children }: { children: ReactNode }) {
  const auth = useMemo(() => getAuth(), []);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => { const u = await auth.getUser().catch(() => null); setUser(u); setLoading(false); return u; }, [auth]);
  useEffect(() => { void refresh(); return auth.onChange(() => void refresh()); }, [auth, refresh]);
  return <Ctx.Provider value={{ user, loading, auth, refresh }}>{children}</Ctx.Provider>;
}
