'use client';
import { Search } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { PageContainer, PageHeader, Skeleton } from '@/components/ui/primitives';
import { cn } from '@/lib/format';
import { CLASS_LABEL } from '@/lib/routes';
import type { Asset, Envelope } from '@/lib/types';
import type { SearchResults } from '@/services/market-data';
import { useWorkspace } from './workspace-context';

/** Standard frame for every workspace page: breadcrumbs, title, lead and actions, then a ready gate. */
export function WsPage({ title, lead, actions, children, wide }: { title: string; lead?: ReactNode; actions?: ReactNode; children: ReactNode; wide?: boolean }) {
  const { ready } = useWorkspace();
  return (
    <PageContainer wide={wide}>
      <PageHeader crumbs={title === 'Overview' ? undefined : [['Workspace', '/app'], [title]]} title={title} lead={lead} actions={actions} />
      {ready ? children : <div role="status" aria-label="Loading your workspace" className="space-y-3"><Skeleton className="h-24 w-full rounded-card" /><Skeleton className="h-64 w-full rounded-card" /></div>}
    </PageContainer>
  );
}

/** Live market data for a set of instrument ids, read through the public API. */
export function useAssets(ids: string[]) {
  const key = useMemo(() => [...new Set(ids)].sort().join(','), [ids]);
  const [state, setState] = useState<{ map: Map<string, Asset>; loading: boolean; error: string | null; meta: Envelope<Asset[]>['meta'] | null }>({ map: new Map(), loading: Boolean(key), error: null, meta: null });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!key) { setState({ map: new Map(), loading: false, error: null, meta: null }); return; }
    const ctl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    fetch(`/api/v1/assets?ids=${encodeURIComponent(key)}&pageSize=500`, { signal: ctl.signal })
      .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j?.error?.message ?? 'Request failed.'); return j as Envelope<Asset[]>; })
      .then((j) => setState({ map: new Map(j.data.map((a) => [a.id, a])), loading: false, error: null, meta: j.meta }))
      .catch((e: Error) => { if (e.name !== 'AbortError') setState((s) => ({ ...s, loading: false, error: e.message || 'Market data could not load.' })); });
    return () => ctl.abort();
  }, [key, tick]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}

/**
 * Accessible asset search for workspace forms (add to watchlist, collection or alert). Combobox pattern:
 * type to search, arrow keys to move, Enter to pick, Escape to close.
 */
export function AssetPicker({ onPick, label = 'Add an asset', exclude = [], placeholder = 'Search by name or ticker', autoFocus }: { onPick: (a: Asset) => void; label?: string; exclude?: string[]; placeholder?: string; autoFocus?: boolean }) {
  const id = useId();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Asset[]>([]);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!q.trim()) { setItems([]); setState('idle'); return; }
    const ctl = new AbortController();
    setState('loading');
    const t = setTimeout(() => fetch(`/api/v1/search?q=${encodeURIComponent(q)}`, { signal: ctl.signal }).then((r) => (r.ok ? r.json() : Promise.reject(new Error()))).then((j: { data: SearchResults }) => { setItems(j.data.assets.filter((a) => !exclude.includes(a.id))); setActive(0); setState('idle'); }).catch((e) => { if (e?.name !== 'AbortError') setState('error'); }), 140);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); }; document.addEventListener('mousedown', away); return () => document.removeEventListener('mousedown', away); }, []);
  const pick = (a: Asset) => { onPick(a); setQ(''); setItems([]); setOpen(false); };
  return (
    <div ref={box} className="relative w-full max-w-sm">
      <label htmlFor={id} className="sr-only">{label}</label>
      <Search size={15} className="pointer-events-none absolute left-3 top-3 text-faint" aria-hidden />
      <input id={id} role="combobox" aria-expanded={open && Boolean(q)} aria-controls={`${id}-list`} aria-activedescendant={items[active] ? `${id}-o-${active}` : undefined} aria-autocomplete="list" autoComplete="off" autoFocus={autoFocus}
        className="field pl-9" placeholder={placeholder} value={q} onFocus={() => setOpen(true)} onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(items.length - 1, i + 1)); } else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); } else if (e.key === 'Enter' && items[active]) { e.preventDefault(); pick(items[active]); } else if (e.key === 'Escape') setOpen(false); }} />
      {open && q.trim() && (
        <div id={`${id}-list`} role="listbox" aria-label={label} className="absolute z-40 mt-1.5 max-h-72 w-full animate-pop-in overflow-auto rounded-card border border-line2 bg-white p-1 shadow-pop">
          {state === 'loading' && !items.length ? <p className="px-3 py-2 text-[13px] text-faint" role="status">Searching…</p>
            : state === 'error' ? <p className="px-3 py-2 text-[13px] text-down" role="alert">Search did not respond. Type again to retry.</p>
            : !items.length ? <p className="px-3 py-2 text-[13px] text-slate2">No assets match “{q}”. Try a ticker such as AAPL.</p>
            : items.map((a, i) => <button key={a.id} id={`${id}-o-${i}`} role="option" aria-selected={i === active} type="button" onMouseEnter={() => setActive(i)} onClick={() => pick(a)} className={cn('flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left', i === active && 'bg-brand-soft')}><span className="min-w-0 flex-1 truncate font-medium">{a.name}</span><span className="shrink-0 text-xs text-faint">{a.symbol} · {CLASS_LABEL[a.cls].one}</span></button>)}
        </div>
      )}
    </div>
  );
}
/** Day label for grouped lists: Today, Yesterday or a date. */
export function dayLabel(iso: string, now = new Date()) {
  const d = new Date(iso);
  const key = (x: Date) => x.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  if (key(d) === key(now)) return 'Today';
  if (key(d) === key(new Date(now.getTime() - 86400000))) return 'Yesterday';
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long' }).format(d);
}
export function groupByDay<T extends { created_at: string }>(rows: T[]): [string, T[]][] {
  const m = new Map<string, T[]>();
  for (const r of rows) { const k = dayLabel(r.created_at); m.set(k, [...(m.get(k) ?? []), r]); }
  return [...m];
}
