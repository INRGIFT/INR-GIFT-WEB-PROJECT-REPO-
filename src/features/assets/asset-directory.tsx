'use client';
import { Search } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { EmptyState, Panel, Segmented } from '@/components/ui/primitives';
import { DEFAULT_COLUMNS } from '@/lib/metrics';
import { CLASS_LABEL } from '@/lib/routes';
import type { Asset, AssetClass, MetricKey } from '@/lib/types';
import { AssetTable } from './asset-table';

const VIEWS: Partial<Record<AssetClass, [string, MetricKey[]][]>> = {
  stock: [['Overview', DEFAULT_COLUMNS.stock], ['Valuation', ['marketCap', 'pe', 'fpe', 'pb', 'evEbitda']], ['Growth', ['revenueGrowth', 'epsGrowth', 'netMargin', 'roe', 'roic']], ['Dividends', ['dividendYield', 'y1', 'y5', 'beta']], ['Trend', ['d1', 'w1', 'm1', 'rsi', 'sma50Gap', 'volatility']]],
  etf: [['Overview', DEFAULT_COLUMNS.etf], ['Performance', ['d1', 'm1', 'ytd', 'y1', 'y3', 'y5']], ['Risk', ['beta', 'volatility', 'maxDrawdown']]],
};
/** Class directory: search, facet filters, column views and the shared table. */
export function AssetDirectory({ rows, cls, footer }: { rows: Asset[]; cls: AssetClass; footer?: ReactNode }) {
  const views = VIEWS[cls] ?? [['Overview', DEFAULT_COLUMNS[cls]]];
  const [view, setView] = useState(views[0][0]);
  const [q, setQ] = useState('');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('');
  const [sector, setSector] = useState('');
  const uniq = (f: (a: Asset) => string | undefined) => [...new Set(rows.map(f).filter((v): v is string => Boolean(v)))].sort();
  const filtered = useMemo(() => { const s = q.trim().toLowerCase(); return rows.filter((a) => (!s || `${a.name} ${a.symbol}`.toLowerCase().includes(s)) && (!region || a.region === region) && (!country || a.country === country) && (!sector || (cls === 'etf' ? a.industry : a.sector) === sector)); }, [rows, q, region, country, sector, cls]);
  const sel = 'field h-9 w-auto min-w-[130px] text-[13px]';
  const facet = (label: string, value: string, set: (v: string) => void, options: string[]) => options.length > 1 && <label><span className="sr-only">{label}</span><select className={sel} value={value} onChange={(e) => set(e.target.value)}><option value="">{label}: all</option>{options.map((o) => <option key={o}>{o}</option>)}</select></label>;
  return (
    <Panel flush title={`${filtered.length} ${filtered.length === 1 ? CLASS_LABEL[cls].one.toLowerCase() : CLASS_LABEL[cls].many}`} footer={footer} tools={views.length > 1 && <Segmented size="sm" label="Columns" value={view} onChange={setView} options={views.map(([v]) => [v, v] as const)} />}>
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5">
        <label className="relative"><span className="sr-only">Search this directory</span><Search size={14} className="absolute left-2.5 top-2.5 text-faint" /><input className="field h-9 w-52 pl-8 text-[13px]" placeholder="Name or ticker" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        {facet('Region', region, setRegion, uniq((a) => a.region))}
        {facet('Market', country, setCountry, uniq((a) => a.country))}
        {facet(cls === 'etf' ? 'Strategy' : 'Sector', sector, setSector, uniq((a) => (cls === 'etf' ? a.industry : a.sector)))}
      </div>
      <AssetTable key={view} rows={filtered} columns={views.find(([v]) => v === view)![1]} initialSort={cls === 'stock' || cls === 'reit' ? { key: 'marketCap', dir: -1 } : cls === 'etf' ? { key: 'aum', dir: -1 } : null} empty={<EmptyState title="Nothing matches these filters">Clear the search or set a filter back to “all”.</EmptyState>} />
    </Panel>
  );
}
