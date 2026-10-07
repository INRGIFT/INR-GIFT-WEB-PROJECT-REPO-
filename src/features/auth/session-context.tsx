'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { GATE_PATH } from './policy';
import { getAuth, signingOutHere, type AuthAdapter, type AuthUser } from './auth-service';
import { classifyPath } from '@/lib/route-registry';
import { safeReturnPath } from '@/lib/return-url';

/**
 * `account` is any signed-in session, including one still completing email, profile, phone or SMS steps; the auth
 * screens use it. `user` is set only when every step is complete (gate 'ok'); everything else in the app (header,
 * workspace, notes) reads `user`, so a partial session is never treated as signed in. `loading` stays true until the
 * first answer from Supabase, so nothing protected renders on a guess; `checkFailed` says the last check could not
 * reach Supabase (the last known state is kept, never turned into a sign-out).
 *
 * This is display state only. Access is decided on the server (middleware, route handlers, RLS). The context follows
 * Supabase: auth events (sign-in, sign-out, token refresh, including from other tabs) and a re-check whenever the tab
 * becomes visible again, so a session that expired or was revoked elsewhere is noticed. If the session ends or loses
 * its gate while a protected page is open, the page is left for the sign-in step (a full navigation, so no client
 * cache of the protected page survives).
 */
interface Session { user: AuthUser | null; account: AuthUser | null; loading: boolean; checkFailed: boolean; auth: AuthAdapter; refresh: () => Promise<AuthUser | null> }
const Ctx = createContext<Session | null>(null);
export function useSession(): Session { const v = useContext(Ctx); if (!v) throw new Error('useSession must be used inside <SessionProvider>'); return v; }

const CHECK_TIMEOUT_MS = 10_000;
const same = (a: AuthUser | null, b: AuthUser | null) => a === b || (a !== null && b !== null && JSON.stringify(a) === JSON.stringify(b));

export function SessionProvider({ children }: { children: ReactNode }) {
  const auth = useMemo(() => getAuth(), []);
  const [account, setAccount] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkFailed, setCheckFailed] = useState(false);
  const seq = useRef(0);
  const last = useRef<AuthUser | null>(null);
  const wasOk = useRef(false);
  // Only the latest check may update state, so a slow answer from before a sign-out can never restore the old user.
  // An unchanged answer keeps the same object, so consumers keyed on it do not reload.
  const refresh = useCallback(async () => {
    const mine = ++seq.current;
    let u: AuthUser | null;
    try {
      u = await Promise.race([auth.getUser(), new Promise<never>((_, no) => setTimeout(() => no(new Error('timeout')), CHECK_TIMEOUT_MS))]);
    } catch {
      if (mine === seq.current) { setCheckFailed(true); setLoading(false); }
      return last.current;
    }
    if (mine === seq.current) {
      setCheckFailed(false);
      setAccount((prev) => { const next = same(prev, u) ? prev : u; last.current = next; return next; });
      setLoading(false);
    }
    return u;
  }, [auth]);
  useEffect(() => {
    void refresh();
    const off = auth.onChange(() => void refresh());
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { off(); document.removeEventListener('visibilitychange', onVisible); };
  }, [auth, refresh]);
  useEffect(() => {
    if (loading) return;
    const ok = account?.gate === 'ok';
    if (wasOk.current && !ok && !signingOutHere() && classifyPath(window.location.pathname) === 'protected') {
      const here = safeReturnPath(`${window.location.pathname}${window.location.search}`);
      const step = account ? GATE_PATH[account.gate as Exclude<typeof account.gate, 'ok'>] : '/login';
      window.location.replace(`${step}?next=${encodeURIComponent(here)}`);
    }
    wasOk.current = ok;
  }, [account, loading]);
  const user = account?.gate === 'ok' ? account : null;
  const value = useMemo(() => ({ user, account, loading, checkFailed, auth, refresh }), [user, account, loading, checkFailed, auth, refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
