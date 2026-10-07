'use client';
import { countRules, decodeTree } from '@/features/screener/logic';
import { track } from '@/lib/telemetry/analytics';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useToast } from '@/components/ui/toast';
import { useSession } from '@/features/auth/session-context';
import { money } from '@/lib/format';
import type { Asset, TableName, UserPrefs } from '@/lib/types';
import { DEFAULT_PREFS, makeRepo, TABLES, type NewRow, type Row, type WorkspaceRepo } from './repo';

type All = { [K in TableName]: Row<K>[] };
const EMPTY: All = { watchlists: [], watchlist_items: [], alerts: [], saved_screens: [], saved_comparisons: [], saved_research: [], notes: [], recent_history: [], notifications: [], collections: [] };
const ANON_PREFS = 'inrgift.prefs.anon';

interface Workspace {
  ready: boolean;
  data: All;
  /** Tables that could not be loaded this time (their modules show an error with Retry, never a false "empty"). */
  failed: TableName[];
  /** Loads every table again. */
  reload: () => void;
  prefs: UserPrefs;
  rates: Record<string, number>;
  setPrefs: (patch: Partial<UserPrefs>) => void;
  /** Returns false and sends the visitor to sign in when there is no session. */
  requireAuth: () => boolean;
  add: <T extends TableName>(table: T, row: NewRow<T>) => Promise<Row<T> | null>;
  update: <T extends TableName>(table: T, id: string, patch: Partial<Row<T>>) => Promise<void>;
  remove: (table: TableName, id: string) => Promise<void>;
  isWatched: (instrumentId: string) => boolean;
  toggleWatch: (asset: Pick<Asset, 'id' | 'symbol'>, watchlistId?: string) => Promise<void>;
  track: (kind: Row<'recent_history'>['kind'], title: string, href: string) => void;
  /** Price in the visitor's display currency. */
  showPrice: (a: Pick<Asset, 'price' | 'currency'>) => string;
}
const Ctx = createContext<Workspace | null>(null);
export function useWorkspace(): Workspace { const v = useContext(Ctx); if (!v) throw new Error('useWorkspace must be used inside <WorkspaceProvider>'); return v; }

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  // Reference FX rates are market data: loaded through the protected API once someone is signed in, never embedded
  // in public pages.
  const [rates, setRates] = useState<Record<string, number>>({});
  const rateUser = user?.id ?? null;
  useEffect(() => {
    if (!rateUser) { setRates({}); return; }
    let live = true;
    fetch('/api/v1/fx-rates').then((r) => (r.ok ? r.json() : null)).then((j) => { if (live && j?.data) setRates(j.data as Record<string, number>); }).catch(() => {});
    return () => { live = false; };
  }, [rateUser]);
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const repo = useRef<WorkspaceRepo | null>(null);
  const [data, setData] = useState<All>(EMPTY);
  const [failed, setFailed] = useState<TableName[]>([]);
  const [prefs, setPrefsState] = useState<UserPrefs>(DEFAULT_PREFS);
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);
  // Keyed on the account id, not the user object: token refreshes, tab focus and other auth events produce a new object
  // for the same account and must not reload (and blank) the workspace.
  const uid = user?.id ?? null;

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    if (!uid) {
      repo.current = null; setData(EMPTY); setFailed([]); setReady(true);
      try { setPrefsState({ ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(ANON_PREFS) ?? '{}') }); } catch { /* keep defaults */ }
      return;
    }
    const r = repo.current && tick > 0 ? repo.current : makeRepo(uid);
    repo.current = r;
    if (tick === 0) setReady(false);
    const timeout = <T,>(p: Promise<T>) => Promise.race([p, new Promise<never>((_, no) => setTimeout(() => no(new Error('timeout')), 15_000))]);
    Promise.allSettled([timeout(r.loadAll()), timeout(r.getPrefs())]).then(([all, p]) => {
      if (cancelled) return;
      if (all.status === 'fulfilled') { setData(all.value.data); setFailed(all.value.failed); } else setFailed([...TABLES]);
      if (p.status === 'fulfilled') setPrefsState(p.value);
      setReady(true);
    });
    return () => { cancelled = true; };
  }, [uid, loading, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  const requireAuth = useCallback(() => { if (user) return true; router.push(`/login?next=${encodeURIComponent(pathname)}`); return false; }, [user, router, pathname]);
  const add = useCallback(async <T extends TableName>(table: T, row: NewRow<T>) => {
    if (!repo.current) return null;
    try { const saved = await repo.current.insert(table, row); setData((d) => ({ ...d, [table]: [saved, ...d[table]] })); trackSave(table, row as Record<string, unknown>); return saved; } catch { toast('That could not be saved. Try again.'); return null; }
  }, [toast]);
  const update = useCallback(async <T extends TableName>(table: T, id: string, patch: Partial<Row<T>>) => {
    setData((d) => ({ ...d, [table]: d[table].map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
    try { await repo.current?.update(table, id, patch); } catch { toast('That change could not be saved.'); }
  }, [toast]);
  const remove = useCallback(async (table: TableName, id: string) => {
    setData((d) => ({ ...d, [table]: d[table].filter((r) => r.id !== id), ...(table === 'watchlists' ? { watchlist_items: d.watchlist_items.filter((i) => i.watchlist_id !== id) } : {}) }));
    try { await repo.current?.remove(table, id); } catch { toast('That could not be deleted.'); }
  }, [toast]);
  const setPrefs = useCallback((patch: Partial<UserPrefs>) => {
    setPrefsState((p) => { const next = { ...p, ...patch }; if (repo.current) void repo.current.setPrefs(next); else localStorage.setItem(ANON_PREFS, JSON.stringify(next)); return next; });
  }, []);
  const isWatched = useCallback((id: string) => data.watchlist_items.some((i) => i.instrument_id === id), [data.watchlist_items]);
  const toggleWatch = useCallback(async (asset: Pick<Asset, 'id' | 'symbol'>, watchlistId?: string) => {
    if (!requireAuth()) return;
    const existing = data.watchlist_items.filter((i) => i.instrument_id === asset.id && (!watchlistId || i.watchlist_id === watchlistId));
    if (existing.length) { await Promise.all(existing.map((i) => remove('watchlist_items', i.id))); toast(`${asset.symbol} removed from watchlist`); return; }
    let list: string | undefined = watchlistId ?? data.watchlists[data.watchlists.length - 1]?.id;
    if (!list) list = (await add('watchlists', { name: 'My watchlist', position: 0 }))?.id;
    if (!list) return;
    await add('watchlist_items', { watchlist_id: list, instrument_id: asset.id, position: data.watchlist_items.length });
    toast(`${asset.symbol} added to watchlist`);
  }, [data.watchlist_items, data.watchlists, requireAuth, remove, add, toast]);
  const track = useCallback((kind: Row<'recent_history'>['kind'], title: string, href: string) => {
    if (!repo.current) return;
    setData((d) => {
      if (d.recent_history[0]?.href === href) return d;
      d.recent_history.filter((r) => r.href === href).forEach((r) => void repo.current?.remove('recent_history', r.id));
      void repo.current?.insert('recent_history', { kind, title, href }).then((saved) => setData((x) => ({ ...x, recent_history: [saved, ...x.recent_history.filter((r) => r.href !== href)].slice(0, 40) })));
      return d;
    });
  }, []);
  const showPrice = useCallback((a: Pick<Asset, 'price' | 'currency'>) => (a.price == null ? '—' : prefs.currency === 'INR' && a.currency !== 'INR' && rates[a.currency] ? money(a.price * rates[a.currency], 'INR') : money(a.price, a.currency)), [prefs.currency, rates]);

  const value = useMemo(() => ({ ready, data, failed, reload, prefs, rates, setPrefs, requireAuth, add, update, remove, isWatched, toggleWatch, track, showPrice }), [ready, data, failed, reload, prefs, rates, setPrefs, requireAuth, add, update, remove, isWatched, toggleWatch, track, showPrice]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Product analytics for saves. Only entity ids and enums, never names, notes or other text a person typed. */
function trackSave(table: string, row: Record<string, unknown>) {
  if (table === 'watchlist_items') track('watchlist_add', { instrumentId: String(row.instrument_id ?? '') });
  else if (table === 'alerts') track('alert_created', { kind: String(row.kind ?? '') });
  else if (table === 'saved_screens') { const tree = decodeTree(String(row.definition ?? '')); track('screen_created', { rules: tree ? countRules(tree) : 0, universe: String(row.universe ?? 'all') }); }
  else if (table === 'saved_comparisons') track('compare_created', { count: Array.isArray(row.instrument_ids) ? row.instrument_ids.length : 0 });
  else if (table === 'saved_research') track('research_save', { refType: String(row.ref_type ?? '') });
}
