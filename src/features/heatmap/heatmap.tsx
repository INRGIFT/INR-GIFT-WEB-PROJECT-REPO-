'use client';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button, buttonClass } from '@/components/ui/button';
import { DataStatus } from '@/components/ui/data-status';
import { Change, EmptyState, ErrorState, Panel, Segmented, Skeleton } from '@/components/ui/primitives';
import { Sparkline } from '@/components/ui/sparkline';
import { MetricCell, Price } from '@/features/assets/asset-table';
import { RowActions } from '@/features/workspace/action-buttons';
import { cn, pct } from '@/lib/format';
import { fmtMetric } from '@/lib/metrics';
import { assetHref, CLASS_LABEL } from '@/lib/routes';
import { squarify } from '@/lib/treemap';
import type { Asset, MetricKey } from '@/lib/types';
import { useApi } from '@/lib/use-api';

type Dim = 'region' | 'country' | 'exchange' | 'sector' | 'industry' | 'cls';
type Size = 'marketCap' | 'volume' | 'aum';
type Colour = 'd1' | 'w1' | 'm1' | 'ytd' | 'y1' | 'volatility';
const CHAIN: Record<Dim, Dim[]> = { region: ['region', 'country', 'sector', 'industry'], country: ['country', 'sector', 'industry'], exchange: ['exchange', 'sector', 'industry'], sector: ['sector', 'industry'], industry: ['industry'], cls: ['cls', 'sector', 'industry'] };
const DIM_LABEL: Record<Dim, string> = { region: 'Region', country: 'Country', exchange: 'Exchange', sector: 'Sector', industry: 'Industry', cls: 'Asset type' };
const SCALE: Record<Colour, number> = { d1: 3, w1: 6, m1: 12, ytd: 40, y1: 50, volatility: 45 };
const dimValue = (a: Asset, d: Dim) => (d === 'cls' ? CLASS_LABEL[a.cls].many : String(a[d] ?? 'Other'));

export function tileColour(v: number | null | undefined, metric: Colour): string {
  if (v == null) return '#C3CBD8';
  const mix = (a: number[], b: number[], t: number) => `rgb(${a.map((x, i) => Math.round(x + (b[i] - x) * t)).join(',')})`;
  if (metric === 'volatility') return mix([120, 134, 160], [23, 62, 190], Math.min(1, Math.max(0, (v - 12) / 33)));
  if (v === 0) return 'rgb(108,118,136)';
  // Square-root easing makes small moves visibly tinted while keeping large moves saturated.
  return mix([108, 118, 136], v > 0 ? [8, 128, 84] : [198, 46, 38], 0.3 + Math.sqrt(Math.min(1, Math.abs(v) / SCALE[metric])) * 0.7);
}
const sizeOf = (a: Asset, s: Size): number => { const usd = a.m.marketCap ?? a.m.aum ?? 0; return s === 'volume' ? Math.max(1, (a.m.volume ?? 0) * (a.price ?? 0)) : s === 'aum' ? (a.m.aum ?? 0) : usd; };

interface Props { compact?: boolean; assets?: Asset[]; initial?: { group?: Dim; path?: string[]; colour?: Colour } }
/**
 * Signature treemap. Group header drills one level; a tile selects (quick view) and double-click or Enter opens the asset.
 * In `compact` mode it is a preview: tiles link straight to the asset and headers open the full heatmap at that level.
 */
export function Heatmap({ compact, assets, initial }: Props) {
  const router = useRouter();
  const [universe, setUniverse] = useState<'all' | 'stock' | 'etf' | 'reit'>('all');
  const [group, setGroup] = useState<Dim>(initial?.group ?? 'region');
  const [size, setSize] = useState<Size>('marketCap');
  const [colour, setColour] = useState<Colour>(initial?.colour ?? 'd1');
  const [path, setPath] = useState<string[]>(initial?.path ?? []);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const api = useApi<Asset[]>(assets ? null : `/api/v1/heatmap?universe=${universe}`);
  const all = assets ?? api.data;
  const chain = CHAIN[group];
  const dim = chain[path.length] as Dim | undefined;

  const layout = useMemo(() => {
    if (!all) return null;
    const q = query.trim().toLowerCase();
    let list = all.filter((a) => sizeOf(a, size) > 0 && (!q || `${a.name} ${a.symbol}`.toLowerCase().includes(q)));
    path.forEach((v, i) => { list = list.filter((a) => dimValue(a, chain[i]) === v); });
    const H = compact ? 38 : 50;
    const groups = new Map<string, Asset[]>();
    for (const a of list) { const k = dim ? dimValue(a, dim) : 'All'; groups.set(k, [...(groups.get(k) ?? []), a]); }
    const outer = squarify([...groups], ([, l]) => l.reduce((s, a) => s + sizeOf(a, size), 0), 0, 0, 100, H);
    return { H, count: list.length, groups: outer.map((g) => ({ key: g.item[0], x: g.x, y: g.y, w: g.w, h: g.h, tiles: squarify(g.item[1], (a) => sizeOf(a, size), 0, 0, g.w, g.h) })) };
  }, [all, query, path, chain, dim, size, compact]);

  const label = (v: number | null | undefined) => (v == null ? 'n/a' : colour === 'volatility' ? fmtMetric('volatility', v).text : pct(v, SCALE[colour] > 10 ? 1 : 2));
  const sel = selected && all ? all.find((a) => a.id === selected) : null;
  const drill = (key: string) => { if (compact) router.push(`/discover/heatmap?group=${group}&path=${encodeURIComponent([...path, key].join('|'))}`); else { setPath([...path, key]); setSelected(null); } };
  const sizeNote = size === 'aum' ? 'Sizing by AUM shows funds only.' : null;

  const map = api.loading && !all ? <Skeleton className={cn('w-full', compact ? 'aspect-[2.6/1]' : 'aspect-[2/1]')} /> : api.error ? <ErrorState title="The heatmap could not load" action={<Button onClick={api.reload}>Retry</Button>}>{api.error}</ErrorState> : !layout || !layout.count ? <EmptyState title="No assets at this level">{query ? 'Nothing matches that search here. Clear it or step back up the breadcrumb.' : sizeNote ?? 'Step back up the breadcrumb or change the universe.'}</EmptyState> : (
    <>
      <div role="group" aria-label={`Heatmap grouped by ${dim ? DIM_LABEL[dim].toLowerCase() : 'asset'}`} className={cn('relative w-full overflow-hidden rounded-lg bg-hover', compact ? 'aspect-[1/1.1] sm:aspect-[2.6/1]' : 'aspect-[1/1.2] sm:aspect-[2/1]')}>
        {layout.groups.map((g) => (
          <div key={g.key} className="absolute overflow-hidden border-2 border-white transition-[left,top,width,height] duration-300 ease-out" style={{ left: `${g.x}%`, top: `${(g.y / layout.H) * 100}%`, width: `${g.w}%`, height: `${(g.h / layout.H) * 100}%` }}>
            {dim && <button type="button" onClick={() => drill(g.key)} title={`Drill into ${g.key}`} className="absolute inset-x-0 top-0 z-[1] h-5 truncate bg-navy px-1.5 text-left text-[11px] font-semibold text-white transition-colors hover:bg-brand">{g.key}</button>}
            <div className={cn('absolute inset-x-0 bottom-0', dim ? 'top-5' : 'top-0')}>
              {g.tiles.map((t) => {
                const a = t.item, v = a.m[colour as MetricKey];
                const big = t.w > 5 && t.h > (compact ? 4 : 5), mid = t.w > 2.6 && t.h > 2.6;
                const style = { left: `${(t.x / g.w) * 100}%`, top: `${(t.y / g.h) * 100}%`, width: `${(t.w / g.w) * 100}%`, height: `${(t.h / g.h) * 100}%`, background: tileColour(v, colour) };
                const cls = cn('absolute overflow-hidden border border-white px-1 py-0.5 text-left text-[11px] leading-tight text-white transition-[left,top,width,height,background-color] duration-300 ease-out hover:z-[2] hover:outline hover:outline-2 hover:-outline-offset-2 hover:outline-navy focus-visible:z-[2]', selected === a.id && 'z-[2] outline outline-2 -outline-offset-2 outline-navy');
                const inner = big ? <><b className="block font-display text-xs">{a.symbol}</b>{label(v)}</> : mid ? <b className="font-display text-[10px]">{a.symbol}</b> : null;
                const tip = `${a.name} (${a.symbol}) ${label(v)}`;
                return compact ? <Link key={a.id} href={assetHref(a)} title={tip} aria-label={tip} className={cls} style={style}>{inner}</Link>
                  : <button key={a.id} type="button" title={tip} aria-label={tip} aria-pressed={selected === a.id} className={cls} style={style} onClick={() => setSelected(a.id)} onDoubleClick={() => router.push(assetHref(a))} onKeyDown={(e) => { if (e.key === 'Enter') router.push(assetHref(a)); }}>{inner}</button>;
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-faint">
        {colour === 'volatility' ? <>Lower{[12, 28, 45].map((v) => <span key={v} className="h-2.5 w-6 rounded-sm" style={{ background: tileColour(v, colour) }} />)}Higher volatility</> : <>−{SCALE[colour]}%{[-1, -0.33, 0, 0.33, 1].map((k) => <span key={k} className="h-2.5 w-6 rounded-sm" style={{ background: tileColour(k * SCALE[colour], colour) }} />)}+{SCALE[colour]}%</>}
        <span className="h-2.5 w-6 rounded-sm" style={{ background: tileColour(null, colour) }} />n/a
        <span className="ml-auto">Every tile prints its signed value, so colour is never the only cue.</span>
      </div>
    </>
  );
  if (compact) return map;

  const seg = <T extends string>(lbl: string, value: T, set: (v: T) => void, options: readonly (readonly [T, string])[]) => <div className="flex items-center gap-2"><span className="text-xs text-faint">{lbl}</span><Segmented size="sm" label={lbl} value={value} onChange={set} options={options} /></div>;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 rounded-card border border-line bg-white p-3.5 shadow-card">
        {seg('Universe', universe, (v) => { setUniverse(v); setPath([]); setSelected(null); }, [['all', 'All'], ['stock', 'Stocks'], ['etf', 'ETFs'], ['reit', 'REITs']] as const)}
        {seg('Group by', group, (v) => { setGroup(v); setPath([]); setSelected(null); }, (Object.keys(DIM_LABEL) as Dim[]).map((d) => [d, DIM_LABEL[d]] as const))}
        {seg('Tile size', size, setSize, [['marketCap', 'Market cap'], ['volume', 'Volume'], ['aum', 'AUM']] as const)}
        {seg('Colour', colour, setColour, [['d1', '1D'], ['w1', '1W'], ['m1', '1M'], ['ytd', 'YTD'], ['y1', '1Y'], ['volatility', 'Volatility']] as const)}
        <label className="relative ml-auto"><span className="sr-only">Filter tiles by name or ticker</span><Search size={14} className="absolute left-2.5 top-2.5 text-faint" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find in map" className="field h-9 w-44 pl-8" /></label>
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,2.2fr)_minmax(280px,1fr)]">
        <Panel title="Map" sub={layout ? `${layout.count} assets` : undefined} footer={api.meta && <><DataStatus meta={{ timezone: 'UTC', ingestedAt: api.meta.timestamp, ...api.meta }} showTime={false} /><span>Statuses vary by market; see each asset</span><Link href="/resources/data" className="hover:text-brand-ink">Methodology</Link></>}>
          <nav aria-label="Drill-down" className="mb-2.5 flex flex-wrap items-center gap-1.5 text-[13px]">
            <button type="button" className={path.length ? 'link' : 'font-semibold'} onClick={() => { setPath([]); setSelected(null); }}>Global</button>
            {path.map((p, i) => <span key={p} className="flex items-center gap-1.5"><span aria-hidden className="text-faint">→</span><button type="button" className={i < path.length - 1 ? 'link' : 'font-semibold'} onClick={() => { setPath(path.slice(0, i + 1)); setSelected(null); }}>{p}</button></span>)}
            {dim && <span className="text-faint">· grouped by {DIM_LABEL[dim].toLowerCase()}</span>}
          </nav>
          {map}
        </Panel>
        <aside aria-live="polite" className="rounded-card border border-line bg-white shadow-card">
          {sel ? (
            <div className="animate-fade-up p-4" key={sel.id}>
              <p className="font-display text-base font-bold">{sel.name}</p>
              <p className="text-xs text-faint">{sel.symbol} · {sel.exchange} · {sel.country} · {sel.cls === 'stock' ? sel.industry : CLASS_LABEL[sel.cls].one}</p>
              <p className="mt-3 flex items-baseline gap-2.5"><Price asset={sel} className="font-display text-2xl font-extrabold" /><Change value={sel.m.d1} /></p>
              <div className="my-2"><Sparkline seed={sel.id + 'm'} change={sel.m.m1} width={260} height={44} /></div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">{(['w1', 'm1', 'ytd', 'y1', sel.cls === 'etf' ? 'aum' : 'marketCap', sel.cls === 'etf' ? 'expenseRatio' : 'pe'] as MetricKey[]).map((k) => <div key={k} className="flex justify-between gap-2 border-b border-line py-1"><dt className="text-faint">{k === 'w1' ? '1 week' : k === 'm1' ? '1 month' : k === 'ytd' ? 'YTD' : k === 'y1' ? '1 year' : k === 'aum' ? 'AUM' : k === 'marketCap' ? 'Market cap' : k === 'pe' ? 'P/E' : 'Expense'}</dt><dd><MetricCell k={k} v={sel.m[k]} /></dd></div>)}</dl>
              <div className="mt-3"><DataStatus meta={sel.meta} /></div>
              <div className="mt-4 flex flex-wrap items-center gap-2"><Link href={assetHref(sel)} className={buttonClass('primary')}>Research this asset</Link><RowActions asset={sel} /></div>
            </div>
          ) : <EmptyState title="Select a tile">A quick view with price, returns and actions appears here. Group headers drill one level down; double-click a tile to open it.</EmptyState>}
        </aside>
      </div>
    </div>
  );
}
