'use client';
import { ArrowDown, ArrowUp, Columns2, Download, MoreHorizontal, Pencil, Plus, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button, IconButton } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/data-status';
import { Dialog } from '@/components/ui/dialog';
import { TextField } from '@/components/ui/field';
import { Menu } from '@/components/ui/menu';
import { Callout, Change, EmptyState, Panel, SkeletonRows } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { AssetIdentity, MetricCell } from '@/features/assets/asset-table';
import { ModuleFootClient } from './module-foot';
import { cn, dateShort } from '@/lib/format';
import type { Asset, MetricKey, ResearchDoc, WorkspaceTables } from '@/lib/types';
import { useApi } from '@/lib/use-api';
import { AlertButton } from './action-buttons';
import { AssetPicker, useAssets, WsPage } from './ws-ui';
import { useWorkspace } from './workspace-context';

type List = WorkspaceTables['watchlists'];
type Item = WorkspaceTables['watchlist_items'];
const COLS: MetricKey[] = ['d1', 'w1', 'm1', 'y1'];

export function WatchlistPage() {
  const ws = useWorkspace();
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const lists = useMemo(() => [...ws.data.watchlists].sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at)), [ws.data.watchlists]);
  const activeId = lists.find((l) => l.id === params.get('list'))?.id ?? lists[0]?.id;
  const active = lists.find((l) => l.id === activeId);
  const items = useMemo(() => ws.data.watchlist_items.filter((i) => i.watchlist_id === activeId).sort((a, b) => a.position - b.position), [ws.data.watchlist_items, activeId]);
  const md = useAssets(items.map((i) => i.instrument_id));
  const research = useApi<ResearchDoc[]>(items.length ? '/api/v1/research' : null);
  const [dialog, setDialog] = useState<null | { mode: 'create' | 'rename'; list?: List }>(null);
  const [confirm, setConfirm] = useState<List | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const select = (id: string) => router.replace(`/app/watchlist?list=${id}`, { scroll: false });
  const move = async (rows: { id: string; position: number }[], i: number, dir: -1 | 1, table: 'watchlists' | 'watchlist_items') => {
    const j = i + dir; if (j < 0 || j >= rows.length) return;
    const order = [...rows]; [order[i], order[j]] = [order[j], order[i]];
    await Promise.all(order.map((r, k) => (r.position !== k ? ws.update(table, r.id, { position: k }) : null)));
  };
  const add = async (a: Asset) => {
    if (!activeId) return;
    if (items.some((i) => i.instrument_id === a.id)) return toast(`${a.symbol} is already in ${active?.name}`);
    if (await ws.add('watchlist_items', { watchlist_id: activeId, instrument_id: a.id, position: items.length })) toast(`${a.symbol} added to ${active?.name}`);
  };
  const exportCsv = () => {
    const rows = items.map((i) => md.map.get(i.instrument_id)).filter((a): a is Asset => Boolean(a));
    const csv = [['Symbol', 'Name', 'Exchange', 'Currency', 'Price', '1D %', '1W %', '1M %', '1Y %'], ...rows.map((a) => [a.symbol, a.name, a.exchange, a.currency, a.price ?? '', a.m.d1 ?? '', a.m.w1 ?? '', a.m.m1 ?? '', a.m.y1 ?? ''])].map((r) => r.map((v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v)).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); const el = document.createElement('a'); el.href = url; el.download = `${active?.name ?? 'watchlist'}.csv`; el.click(); URL.revokeObjectURL(url);
  };
  const latestDoc = (a: Asset) => research.data?.find((d) => d.assetSlug === a.slug);
  const alertsFor = (id: string) => ws.data.alerts.filter((x) => x.instrument_id === id && x.status !== 'paused').length;
  return (
    <WsPage title="Watchlist" wide lead="Assets you follow, in as many lists as you need. Prices are live from the active data source." actions={<Button variant="primary" onClick={() => setDialog({ mode: 'create' })}><Plus size={16} />New list</Button>}>
      {!lists.length ? <Panel title="No watchlists yet"><EmptyState title="Create your first list" action={<Button variant="primary" onClick={() => setDialog({ mode: 'create' })}>Create a list</Button>}>Group assets by idea, market or theme. Star any asset across INRGIFT to add it.</EmptyState></Panel> : (
        <div className="grid items-start gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <nav aria-label="Your lists" className="rounded-card border border-line bg-white p-1.5 shadow-card">
            <ul className="space-y-0.5">
              {lists.map((l, i) => { const on = l.id === activeId, n = ws.data.watchlist_items.filter((x) => x.watchlist_id === l.id).length; return (
                <li key={l.id} className={cn('group flex items-center gap-1 rounded-lg pr-1 transition-colors duration-micro', on ? 'bg-brand-soft' : 'hover:bg-hover')}>
                  <button type="button" onClick={() => select(l.id)} aria-current={on ? 'true' : undefined} className={cn('min-w-0 flex-1 truncate px-2.5 py-2 text-left font-medium', on ? 'text-brand-ink' : 'text-navy')}>{l.name}</button>
                  <span className="text-[11px] text-faint">{n}</span>
                  <Menu label={`Options for ${l.name}`} align="right" width="min-w-[180px]" triggerClassName="flex h-7 w-7 items-center justify-center rounded-md text-faint hover:bg-white hover:text-navy" trigger={() => <MoreHorizontal size={15} />}
                    items={[{ kind: 'action', label: 'Rename', icon: <Pencil size={14} />, onSelect: () => setDialog({ mode: 'rename', list: l }) }, { kind: 'action', label: 'Move up', icon: <ArrowUp size={14} />, onSelect: () => move(lists, i, -1, 'watchlists') }, { kind: 'action', label: 'Move down', icon: <ArrowDown size={14} />, onSelect: () => move(lists, i, 1, 'watchlists') }, { kind: 'separator' }, { kind: 'action', label: 'Delete list', icon: <Trash2 size={14} />, danger: true, onSelect: () => setConfirm(l) }]} />
                </li>); })}
            </ul>
          </nav>
          <Panel flush title={active?.name ?? 'Watchlist'} sub={`${items.length} ${items.length === 1 ? 'asset' : 'assets'}`}
            tools={<div className="flex flex-wrap items-center gap-2">{picked.length >= 2 && <Button size="sm" variant="primary" onClick={() => router.push(`/discover/compare?s=${picked.map((id) => md.map.get(id)?.slug).filter(Boolean).join(',')}`)}><Columns2 size={14} />Compare {picked.length}</Button>}<Button size="sm" onClick={exportCsv} disabled={!items.length}><Download size={14} />CSV</Button></div>}
            footer={<ModuleFootClient meta={md.meta} />}>
            <div className="border-b border-line px-4 py-3"><AssetPicker label={`Add an asset to ${active?.name}`} exclude={items.map((i) => i.instrument_id)} onPick={add} /></div>
            {md.error && <div className="p-4"><Callout tone="error" title="Prices could not load" action={<Button size="sm" onClick={md.reload}>Retry</Button>}>Your list is safe; only the market data request failed.</Callout></div>}
            {!items.length ? <EmptyState title={`${active?.name} is empty`}>Search above, or use the star on any asset page, table, heatmap or screener result.</EmptyState> : md.loading && !md.map.size ? <SkeletonRows rows={Math.min(8, items.length)} /> : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead><tr className="text-xs text-faint">
                    <th scope="col" className="w-10 border-b border-line px-3 py-2.5"><span className="sr-only">Select to compare</span></th>
                    <th scope="col" className="sticky left-0 z-10 border-b border-line bg-white px-3 py-2.5 text-left font-semibold">Asset</th>
                    <th scope="col" className="border-b border-line px-3 py-2.5 text-right font-semibold">Price</th>
                    {COLS.map((c) => <th key={c} scope="col" className="border-b border-line px-3 py-2.5 text-right font-semibold">{c === 'd1' ? '1D' : c === 'w1' ? '1W' : c === 'm1' ? '1M' : '1Y'}</th>)}
                    <th scope="col" className="hidden border-b border-line px-3 py-2.5 text-left font-semibold xl:table-cell">Latest research</th>
                    <th scope="col" className="border-b border-line px-3 py-2.5 text-right font-semibold">Data</th>
                    <th scope="col" className="border-b border-line px-2"><span className="sr-only">Actions</span></th>
                  </tr></thead>
                  <tbody>
                    {items.map((it, i) => { const a = md.map.get(it.instrument_id); const doc = a && latestDoc(a); return (
                      <tr key={it.id} className="group/row border-b border-line last:border-0 hover:bg-bg">
                        <td className="px-3 py-2"><input type="checkbox" className="h-4 w-4 accent-brand" aria-label={`Select ${a?.symbol ?? 'asset'} to compare`} checked={picked.includes(it.instrument_id)} disabled={!a || (!picked.includes(it.instrument_id) && picked.length >= 4)} onChange={() => setPicked((p) => (p.includes(it.instrument_id) ? p.filter((x) => x !== it.instrument_id) : [...p, it.instrument_id]))} /></td>
                        <td className="sticky left-0 z-[1] bg-white px-3 py-2 group-hover/row:bg-bg">{a ? <AssetIdentity asset={a} /> : <span className="text-faint">Instrument {it.instrument_id} is no longer covered</span>}</td>
                        <td className="num px-3 py-2 text-right font-medium">{a ? ws.showPrice(a) : '—'}</td>
                        {COLS.map((c) => <td key={c} className="px-3 py-2 text-right">{a ? <MetricCell k={c} v={a.m[c]} /> : '—'}</td>)}
                        <td className="hidden max-w-[260px] px-3 py-2 xl:table-cell">{doc ? <Link href={`/research/${doc.kind}/${doc.slug}`} className="block truncate hover:text-brand-ink" title={doc.title}>{doc.title}<span className="block text-[11px] text-faint">{dateShort(doc.publishedAt)}</span></Link> : <span className="text-faint">—</span>}</td>
                        <td className="px-3 py-2 text-right">{a && <StatusBadge status={a.status} />}</td>
                        <td className="whitespace-nowrap px-2 py-2 text-right">
                          {a && <AlertButton asset={a} compact />}{alertsFor(it.instrument_id) > 0 && <span className="sr-only">{alertsFor(it.instrument_id)} alerts set</span>}
                          <IconButton label="Move up" onClick={() => move(items, i, -1, 'watchlist_items')} disabled={i === 0}><ArrowUp size={15} /></IconButton>
                          <IconButton label="Move down" onClick={() => move(items, i, 1, 'watchlist_items')} disabled={i === items.length - 1}><ArrowDown size={15} /></IconButton>
                          <IconButton label={`Remove ${a?.symbol ?? 'item'} from ${active?.name}`} onClick={async () => { await ws.remove('watchlist_items', it.id); toast(`${a?.symbol ?? 'Asset'} removed`); }}><X size={15} /></IconButton>
                        </td>
                      </tr>); })}
                  </tbody>
                </table>
              </div>
            )}
            {items.length > 0 && md.map.size > 0 && <Summary assets={items.map((i) => md.map.get(i.instrument_id)).filter((a): a is Asset => Boolean(a))} />}
          </Panel>
        </div>
      )}
      <ListDialog state={dialog} onClose={() => setDialog(null)} onCreated={select} count={lists.length} />
      <Dialog open={Boolean(confirm)} onClose={() => setConfirm(null)} title={`Delete “${confirm?.name}”?`} footer={<><Button onClick={() => setConfirm(null)}>Cancel</Button><Button variant="danger" onClick={async () => { const l = confirm!; setConfirm(null); await ws.remove('watchlists', l.id); toast(`“${l.name}” deleted`); router.replace('/app/watchlist'); }}>Delete list</Button></>}>
        <p className="text-slate2">The list and its {ws.data.watchlist_items.filter((x) => x.watchlist_id === confirm?.id).length} assets are removed. Alerts and notes on those assets are kept.</p>
      </Dialog>
    </WsPage>
  );
}
function Summary({ assets }: { assets: Asset[] }) {
  const avg = (k: MetricKey) => { const v = assets.map((a) => a.m[k]).filter((x): x is number => x != null); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
  const up = assets.filter((a) => (a.m.d1 ?? 0) > 0).length;
  return <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-line bg-soft/60 px-4 py-2.5 text-[13px]"><span className="text-faint">Equal-weighted average</span><span>1D <Change value={avg('d1')} /></span><span>1M <Change value={avg('m1')} /></span><span>1Y <Change value={avg('y1')} /></span><span className="text-slate2">{up} of {assets.length} up today</span></div>;
}
function ListDialog({ state, onClose, onCreated, count }: { state: null | { mode: 'create' | 'rename'; list?: List }; onClose: () => void; onCreated: (id: string) => void; count: number }) {
  const ws = useWorkspace();
  const toast = useToast();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const open = Boolean(state);
  const key = state ? `${state.mode}-${state.list?.id}` : '';
  const [lastKey, setLastKey] = useState('');
  if (open && key !== lastKey) { setLastKey(key); setName(state?.list?.name ?? ''); setError(null); }
  const save = async () => {
    const n = name.trim(); if (!n) return setError('Give the list a name.'); if (n.length > 60) return setError('Use 60 characters or fewer.');
    if (ws.data.watchlists.some((l) => l.name.toLowerCase() === n.toLowerCase() && l.id !== state?.list?.id)) return setError('You already have a list with that name.');
    if (state?.mode === 'rename' && state.list) { await ws.update('watchlists', state.list.id, { name: n }); toast('List renamed'); onClose(); return; }
    const row = await ws.add('watchlists', { name: n, position: count });
    if (row) { toast(`“${n}” created`); onClose(); onCreated(row.id); }
  };
  return (
    <Dialog open={open} onClose={onClose} title={state?.mode === 'rename' ? 'Rename list' : 'New watchlist'} footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>{state?.mode === 'rename' ? 'Save' : 'Create list'}</Button></>}>
      <form onSubmit={(e) => { e.preventDefault(); void save(); }}><TextField label="Name" value={name} onChange={(e) => { setName(e.target.value); setError(null); }} error={error} maxLength={60} placeholder="e.g. Semiconductors, India banks" autoFocus /></form>
    </Dialog>
  );
}
