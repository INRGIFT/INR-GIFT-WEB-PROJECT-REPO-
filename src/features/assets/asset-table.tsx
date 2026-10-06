'use client';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { AssetLogo } from '@/components/ui/asset-logo';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/data-status';
import { Change, EmptyState } from '@/components/ui/primitives';
import { RowActions } from '@/features/workspace/action-buttons';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { cn } from '@/lib/format';
import { fmtMetric, isDirectional, METRICS } from '@/lib/metrics';
import { assetHref, CLASS_LABEL } from '@/lib/routes';
import type { Asset, MetricKey } from '@/lib/types';

export function AssetIdentity({ asset, sub }: { asset: Asset; sub?: ReactNode }) {
  return (
    <Link href={assetHref(asset)} className="group flex min-w-[170px] items-center gap-2.5 text-navy">
      <AssetLogo asset={asset} size={36} className="rounded-lg text-[10px]" />
      <span className="min-w-0">
        <span className="block max-w-[220px] truncate font-semibold transition-colors group-hover:text-brand-ink">{asset.name}</span>
        <span className="block truncate text-[11px] text-faint">{sub ?? `${asset.symbol} · ${asset.exchange} · ${asset.cls === 'stock' ? asset.sector : CLASS_LABEL[asset.cls].one}`}</span>
      </span>
    </Link>
  );
}
export function MetricCell({ k, v }: { k: MetricKey; v: number | null | undefined }) {
  if (v != null && isDirectional(k)) return <Change value={v} />;
  const f = fmtMetric(k, v);
  return <span className={cn('num', f.state !== 'ok' && 'text-faint')} title={f.state === 'unavailable' ? 'Unavailable from source' : f.state === 'na' ? 'Not applicable to this asset type' : undefined}>{f.text}</span>;
}
type SortKey = MetricKey | 'price' | 'name';

/** Shared financial table: sticky header and first column, sortable, paginated, with row actions. */
export function AssetTable({ rows, columns, pageSize = 25, initialSort, showStatus = true, actions = true, empty }: { rows: Asset[]; columns: MetricKey[]; pageSize?: number; initialSort?: { key: SortKey; dir: 1 | -1 } | null; showStatus?: boolean; actions?: boolean; empty?: ReactNode }) {
  const { showPrice, rates } = useWorkspace();
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(initialSort === undefined ? { key: 'marketCap', dir: -1 } : initialSort);
  const [page, setPage] = useState(1);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const val = (a: Asset): number | string | null => sort.key === 'name' ? a.name : sort.key === 'price' ? (a.price == null ? null : a.price * (rates[a.currency] ?? 1)) : sort.key === 'marketCap' ? (a.m.marketCap ?? a.m.aum ?? null) : (a.m[sort.key] ?? null);
    return [...rows].sort((x, y) => { const a = val(x), b = val(y); if (a == null) return 1; if (b == null) return -1; return (typeof a === 'string' ? a.localeCompare(b as string) : a - (b as number)) * sort.dir; });
  }, [rows, sort, rates]);
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pg = Math.min(page, pages);
  const view = sorted.slice((pg - 1) * pageSize, pg * pageSize);
  if (!rows.length) return <>{empty ?? <EmptyState title="No assets to show">Change a filter or widen the universe.</EmptyState>}</>;
  const th = (key: SortKey, label: string, left?: boolean) => {
    const active = sort?.key === key;
    return (
      <th key={key} scope="col" aria-sort={active ? (sort!.dir > 0 ? 'ascending' : 'descending') : 'none'} className={cn('sticky top-0 z-10 whitespace-nowrap border-b border-line bg-white px-3 py-2.5 text-xs font-semibold text-faint', left ? 'left-0 z-20 text-left' : 'text-right')}>
        <button type="button" onClick={() => { setSort(active ? { key, dir: (sort!.dir * -1) as 1 | -1 } : { key, dir: key === 'name' ? 1 : -1 }); setPage(1); }} className="inline-flex items-center gap-1 hover:text-navy" title={key in METRICS ? METRICS[key as MetricKey].label : undefined}>
          {label}{active && (sort!.dir > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
        </button>
      </th>
    );
  };
  return (
    <div>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead><tr>{th('name', 'Asset', true)}{th('price', 'Price')}{columns.map((c) => th(c, METRICS[c].short))}{showStatus && <th scope="col" className="sticky top-0 border-b border-line bg-white px-3 py-2.5 text-right text-xs font-semibold text-faint">Data</th>}{actions && <th scope="col" className="sticky top-0 border-b border-line bg-white px-3"><span className="sr-only">Actions</span></th>}</tr></thead>
          <tbody>
            {view.map((a) => (
              <tr key={a.id} className="group/row border-b border-line last:border-0">
                <td className="sticky left-0 z-[1] bg-white px-3 py-2 transition-colors group-hover/row:bg-bg"><AssetIdentity asset={a} /></td>
                <td className="num px-3 py-2 text-right font-medium transition-colors group-hover/row:bg-bg">{showPrice(a)}</td>
                {columns.map((c) => <td key={c} className="px-3 py-2 text-right transition-colors group-hover/row:bg-bg"><MetricCell k={c} v={a.m[c]} /></td>)}
                {showStatus && <td className="px-3 py-2 text-right transition-colors group-hover/row:bg-bg"><StatusBadge status={a.status} /></td>}
                {actions && <td className="px-2 py-2 text-right transition-colors group-hover/row:bg-bg"><RowActions asset={a} /></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5 text-xs text-faint">
          <span>{(pg - 1) * pageSize + 1}–{Math.min(pg * pageSize, sorted.length)} of {sorted.length}</span>
          <span className="flex items-center gap-1"><Button size="sm" variant="ghost" disabled={pg <= 1} onClick={() => setPage(pg - 1)} aria-label="Previous page"><ChevronLeft size={15} /></Button><span>Page {pg} of {pages}</span><Button size="sm" variant="ghost" disabled={pg >= pages} onClick={() => setPage(pg + 1)} aria-label="Next page"><ChevronRight size={15} /></Button></span>
        </nav>
      )}
    </div>
  );
}
/** Compact three-column list for movers. `values` replaces the metric cell per asset id (server-rendered nodes). */
export function MiniList({ rows, metric, values }: { rows: Asset[]; metric: MetricKey; values?: Record<string, ReactNode> }) {
  const { showPrice } = useWorkspace();
  if (!rows.length) return <EmptyState title="Nothing to rank">No assets with a current value.</EmptyState>;
  return <ul>{rows.map((a) => <li key={a.id} className="flex items-center gap-3 border-b border-line px-4 py-2 last:border-0 hover:bg-bg"><div className="min-w-0 flex-1"><AssetIdentity asset={a} sub={`${a.symbol} · ${a.country}`} /></div><span className="num text-[13px] font-medium">{showPrice(a)}</span><span className="w-[84px] text-right text-[13px]">{values?.[a.id] ?? <MetricCell k={metric} v={a.m[metric]} />}</span></li>)}</ul>;
}
export function Price({ asset, className }: { asset: Pick<Asset, 'price' | 'currency'>; className?: string }) { const { showPrice } = useWorkspace(); return <span className={cn('num', className)}>{showPrice(asset)}</span>; }
