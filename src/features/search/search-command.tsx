'use client';
import { track } from '@/lib/telemetry/analytics';
import { Search } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/format';
import { assetHref, CLASS_LABEL, marketHref } from '@/lib/routes';
import type { SearchResults } from '@/services/market-data';
import { useSession } from '@/features/auth/session-context';
import { loginHref } from '@/lib/return-url';

const Ctx = createContext<() => void>(() => {});
export const useOpenSearch = () => useContext(Ctx);
interface Item { label: string; hint: string; href: string }
const RECENT = 'inrgift.search.recent';
const EXAMPLES: Item[] = [{ label: 'Apple', hint: 'AAPL · Stock', href: '/stocks/AAPL' }, { label: 'NIFTY 50', hint: 'Index', href: '/indices/NIFTY-50' }, { label: 'SPDR S&P 500 ETF Trust', hint: 'SPY · ETF', href: '/etfs/SPY' }, { label: 'USD / INR', hint: 'Currency pair', href: '/fx/USD-INR' }, { label: 'Gold', hint: 'Commodity', href: '/commodities/GOLD' }, { label: 'Japan', hint: 'Market', href: '/markets/Japan' }];

/** Universal search. Opens with "/" or Ctrl/Cmd+K, navigable entirely by keyboard. */
export function SearchProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useSession();
  const [open, setOpen] = useState(false);
  // A shortcut pressed while the session is still being read waits for it, instead of treating a member as signed out.
  const pending = useRef(false);
  const [q, setQ] = useState('');
  const [res, setRes] = useState<SearchResults | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<Item[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const opener = useRef<Element | null>(null);

  // Search reads protected data: a signed-out visitor is sent to sign in (and back here afterwards).
  const show = useCallback(() => { if (loading) { pending.current = true; return; } if (!user) { router.push(loginHref(pathname === '/' ? '/search' : pathname)); return; } opener.current = document.activeElement; setQ(''); setRes(null); setActive(0); try { setRecent(JSON.parse(localStorage.getItem(RECENT) ?? '[]')); } catch { setRecent([]); } setOpen(true); }, [user, loading, router, pathname]);
  useEffect(() => { if (!loading && pending.current) { pending.current = false; show(); } }, [loading, show]);
  const close = useCallback(() => { setOpen(false); (opener.current as HTMLElement | null)?.focus?.(); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName ?? '') || (e.target as HTMLElement)?.isContentEditable;
      if ((e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) { e.preventDefault(); show(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show]);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  useEffect(() => {
    if (!open || !q.trim()) { setRes(null); setState('idle'); return; }
    const ctl = new AbortController();
    setState('loading');
    const t = setTimeout(() => {
      fetch(`/api/v1/search?q=${encodeURIComponent(q)}`, { signal: ctl.signal }).then((r) => (r.ok ? r.json() : Promise.reject())).then((j) => { setRes(j.data); setState('idle'); setActive(0); }).catch((e) => { if (e?.name !== 'AbortError') setState('error'); });
    }, 120);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q, open]);

  const groups = useMemo((): [string, Item[]][] => {
    if (!q.trim()) return [...(recent.length ? [['Recent searches', recent] as [string, Item[]]] : []), ['Try searching for', EXAMPLES]];
    if (!res) return [];
    const byClass = new Map<string, Item[]>();
    for (const a of res.assets) { const k = CLASS_LABEL[a.cls].many; byClass.set(k, [...(byClass.get(k) ?? []), { label: a.name, hint: `${a.symbol} · ${a.exchange} · ${a.country}`, href: assetHref(a) }]); }
    return [...byClass, ['Markets', res.markets.map((m) => ({ label: m.name, hint: m.exchanges.map((e) => e.name).join(', '), href: marketHref(m.slug) }))], ['Research', res.research.map((r) => ({ label: r.title, hint: r.kind, href: r.href }))], ['Themes', res.themes.map((t) => ({ label: t.name, hint: 'Collection', href: `/discover/collections/${t.id}` }))], ...(['Exchanges', 'Sectors', 'Industries', 'News', 'Learn'] as const).map((g) => [g, (res.more ?? []).filter((m) => m.group === g)])].filter(([, items]) => (items as Item[]).length) as [string, Item[]][];
  }, [q, res, recent]);
  const flat = groups.flatMap(([, items]) => items);
  const go = (item: Item) => {
    if (q.trim()) track('search', { queryLength: q.trim().length, results: flat.length });
    const next = [item, ...recent.filter((r) => r.href !== item.href)].slice(0, 5);
    localStorage.setItem(RECENT, JSON.stringify(next));
    setOpen(false);
    router.push(item.href);
  };
  let n = -1;
  return (
    <Ctx.Provider value={show}>
      {children}
      {open && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center bg-navy/45 px-4 pt-[9vh]" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div role="dialog" aria-modal="true" aria-label="Search" className="flex max-h-[78vh] w-full max-w-[640px] animate-pop-in flex-col overflow-hidden rounded-card border border-line2 bg-white shadow-pop">
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search size={18} className="text-faint" />
              <input ref={input} autoFocus value={q} onChange={(e) => setQ(e.target.value)} role="combobox" aria-expanded aria-controls="search-results" aria-activedescendant={flat[active] ? `sr-${active}` : undefined} autoComplete="off" placeholder="Search assets, markets, exchanges, sectors, research, news" className="h-[52px] w-full bg-transparent text-[15px] outline-none placeholder:text-faint"
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(flat.length - 1, i + 1)); }
                  else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
                  else if (e.key === 'Enter' && flat[active]) { e.preventDefault(); go(flat[active]); }
                  else if (e.key === 'Escape') close();
                  else if (e.key === 'Tab') e.preventDefault();
                }} />
              {state === 'loading' && <span className="text-xs text-faint" role="status">Searching</span>}
            </div>
            <div id="search-results" role="listbox" aria-label="Search results" className="overflow-auto p-1.5">
              {state === 'error' && <p role="alert" className="px-3 py-6 text-center text-slate2">Search is not responding. Check your connection and type again.</p>}
              {state !== 'error' && q.trim() && res && !flat.length && (
                <div className="px-3 py-6 text-center"><p className="font-display font-bold">No results for “{q}”</p><p className="mt-1 text-slate2">Try a ticker such as AAPL, a company name, a market such as Japan, or browse instead.</p><div className="mt-3 flex justify-center gap-2 text-[13px]">{[['Screener', '/discover/screener'], ['All markets', '/markets/all'], ['Collections', '/discover/collections']].map(([l, h]) => <button key={h} type="button" className="link" onClick={() => go({ label: l, hint: '', href: h })}>{l}</button>)}</div></div>
              )}
              {groups.map(([title, items]) => (
                <div key={title}>
                  <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold text-faint">{title}</p>
                  {items.map((it) => { n += 1; const i = n; return (
                    <button key={it.href + it.label} id={`sr-${i}`} role="option" aria-selected={i === active} type="button" onMouseEnter={() => setActive(i)} onClick={() => go(it)} className={cn('flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left', i === active && 'bg-brand-soft')}>
                      <span className="min-w-0 flex-1 truncate font-medium">{it.label}</span><span className="shrink-0 truncate text-xs text-faint">{it.hint}</span>
                    </button>
                  ); })}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-4 py-2 text-[11px] text-faint"><span>↑ ↓ to move</span><span>Enter to open</span><span>Esc to close</span>{q.trim() && <button type="button" className="link ml-auto text-xs" onClick={() => go({ label: q, hint: '', href: `/search?q=${encodeURIComponent(q.trim())}` })}>All results for “{q.trim().slice(0, 30)}”</button>}</div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
