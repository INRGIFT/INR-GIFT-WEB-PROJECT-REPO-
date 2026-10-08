'use client';
import { Columns3, Download, Link2, Plus, RotateCcw, Save, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, IconButton } from '@/components/ui/button';
import { EmptyState, ErrorState, NoResults, Panel, Segmented, SkeletonRows } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { AssetTable } from '@/features/assets/asset-table';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { cn } from '@/lib/format';
import { METRICS, METRIC_KEYS } from '@/lib/metrics';
import type { Asset, MetricKey } from '@/lib/types';
import { useApi } from '@/lib/use-api';
import { categoryOptions, countRules, decodeTree, DEFAULT_TREE, encodeTree, FIELD_GROUPS, fieldKind, fieldLabel, isGroup, OPS, runScreen, toCsv, updateAt, type CatField, type Field, type Group, type Node, type Op, type Rule } from './logic';

type Universe = 'all' | 'stock' | 'etf' | 'reit';
const UNIVERSES = [['all', 'All'], ['stock', 'Stocks'], ['etf', 'ETFs'], ['reit', 'REITs']] as const;
const DEFAULT_COLS: MetricKey[] = ['d1', 'y1', 'marketCap', 'pe', 'revenueGrowth', 'roic', 'dividendYield'];
const ctl = 'h-9 rounded-lg border border-line2 bg-white px-2 text-[13px] transition-colors hover:border-faint focus:border-brand focus:outline-none';

function RuleRow({ rule, assets, onChange, onRemove }: { rule: Rule; assets: Asset[]; onChange: (r: Rule) => void; onRemove: () => void }) {
  const kind = fieldKind(rule.field);
  const options = kind === 'category' ? categoryOptions(assets, rule.field as CatField) : [];
  const picked = rule.value.split('|').filter(Boolean);
  const setField = (f: Field) => { const k = fieldKind(f); onChange({ field: f, op: OPS[k][0][0], value: k === 'category' ? (categoryOptions(assets, f as CatField)[0] ?? '') : '' }); };
  return (
    <div className="flex animate-fade-up flex-wrap items-center gap-1.5 rounded-lg bg-white p-1.5 shadow-card ring-1 ring-line">
      <select aria-label="Field" className={cn(ctl, 'max-w-[190px] font-medium')} value={rule.field} onChange={(e) => setField(e.target.value as Field)}>{FIELD_GROUPS.map(([g, fields]) => <optgroup key={g} label={g}>{fields.map((f) => <option key={f} value={f}>{f === 'marketCap' || f === 'aum' ? `${fieldLabel(f).replace(' (USD)', '')} ($B)` : fieldLabel(f)}</option>)}</optgroup>)}</select>
      <select aria-label="Condition" className={ctl} value={rule.op} onChange={(e) => { const op = e.target.value as Op; const toField = op === 'gtf' || op === 'ltf', wasField = rule.op === 'gtf' || rule.op === 'ltf'; onChange({ ...rule, op, ...(op !== 'in' && kind === 'category' ? { value: picked[0] ?? '' } : toField !== wasField ? { value: '' } : {}) }); }}>{OPS[kind].map(([o, l]) => <option key={o} value={o}>{l}</option>)}</select>
      {kind === 'number' && (rule.op === 'gtf' || rule.op === 'ltf') && <select aria-label="Compared field" className={cn(ctl, 'max-w-[220px]')} value={rule.value} onChange={(e) => onChange({ ...rule, value: e.target.value })}><option value="">Choose a field</option>{FIELD_GROUPS.map(([g, fs]) => { const nums = fs.filter((f) => fieldKind(f) === 'number' && f !== rule.field); return nums.length ? <optgroup key={g} label={g}>{nums.map((f) => <option key={f} value={f}>{fieldLabel(f)}</option>)}</optgroup> : null; })}</select>}
      {kind === 'number' && rule.op !== 'gtf' && rule.op !== 'ltf' && (<><input aria-label={rule.op === 'between' ? 'Minimum' : 'Value'} type="number" step="any" className={cn(ctl, 'w-24')} value={rule.value} onChange={(e) => onChange({ ...rule, value: e.target.value })} placeholder="Value" />{rule.op === 'between' && <><span className="text-xs text-faint">and</span><input aria-label="Maximum" type="number" step="any" className={cn(ctl, 'w-24')} value={rule.value2 ?? ''} onChange={(e) => onChange({ ...rule, value2: e.target.value })} placeholder="Max" /></>}</>)}
      {kind === 'text' && <input aria-label="Text" className={cn(ctl, 'w-40')} value={rule.value} onChange={(e) => onChange({ ...rule, value: e.target.value })} placeholder="e.g. bank" />}
      {kind === 'category' && rule.op !== 'in' && <select aria-label="Value" className={cn(ctl, 'max-w-[200px]')} value={rule.value} onChange={(e) => onChange({ ...rule, value: e.target.value })}>{options.map((o) => <option key={o}>{o}</option>)}</select>}
      {kind === 'category' && rule.op === 'in' && <div className="flex max-w-full flex-wrap gap-1">{options.map((o) => { const on = picked.includes(o); return <button key={o} type="button" aria-pressed={on} onClick={() => onChange({ ...rule, value: (on ? picked.filter((p) => p !== o) : [...picked, o]).join('|') })} className={cn('rounded-full border px-2 py-0.5 text-xs font-medium transition-colors duration-150', on ? 'border-brand bg-brand-soft text-brand-ink' : 'border-line2 text-slate2 hover:border-faint')}>{o}</button>; })}</div>}
      <IconButton label="Remove filter" onClick={onRemove} className="ml-auto"><X size={15} /></IconButton>
    </div>
  );
}
function GroupBox({ group, path, assets, edit }: { group: Group; path: number[]; assets: Asset[]; edit: (path: number[], fn: (n: Node) => Node | null) => void }) {
  const add = (n: Node) => edit(path, (g) => ({ ...(g as Group), rules: [...(g as Group).rules, n] }));
  return (
    <div className={cn('rounded-ctl border p-2.5', path.length ? 'border-line2 bg-white' : 'border-line bg-bg', path.length === 1 && 'border-l-[3px] border-l-brand/40')}>
      <div className="flex flex-wrap items-center gap-2">
        <Segmented size="sm" label="Match" value={group.op} onChange={(op) => edit(path, (g) => ({ ...(g as Group), op }))} options={[['AND', 'Match all'], ['OR', 'Match any']] as const} />
        <Button size="sm" onClick={() => add({ field: 'pe', op: 'lte', value: '30' })}><Plus size={14} />Filter</Button>
        {path.length < 2 && <Button size="sm" onClick={() => add({ op: 'OR', rules: [{ field: 'y1', op: 'gte', value: '20' }] })}><Plus size={14} />Group</Button>}
        {path.length > 0 && <IconButton label="Remove group" className="ml-auto" onClick={() => edit(path, () => null)}><X size={15} /></IconButton>}
      </div>
      <div className="mt-2 space-y-2">
        {group.rules.length === 0 && <p className="px-1 text-xs text-faint">No filters here, so this group matches everything.</p>}
        {group.rules.map((n, i) => isGroup(n) ? <GroupBox key={i} group={n} path={[...path, i]} assets={assets} edit={edit} /> : <RuleRow key={i} rule={n} assets={assets} onChange={(r) => edit([...path, i], () => r)} onRemove={() => edit([...path, i], () => null)} />)}
      </div>
    </div>
  );
}

export function Screener() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const ws = useWorkspace();
  const [universe, setUniverse] = useState<Universe>('all');
  const [tree, setTree] = useState<Group>(DEFAULT_TREE);
  const [cols, setCols] = useState<MetricKey[]>(DEFAULT_COLS);
  const [name, setName] = useState('');
  const [colsOpen, setColsOpen] = useState(false);
  const hydrated = useRef(false);
  const api = useApi<Asset[]>(`/api/v1/heatmap?universe=${universe}`);

  // Read state from the URL once: ?q=<encoded tree>&u=<universe>, or shortcut params from other pages.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const u = params.get('u') as Universe | null;
    if (u && UNIVERSES.some(([k]) => k === u)) setUniverse(u);
    const q = params.get('q');
    const decoded = q ? decodeTree(q) : null;
    if (decoded) return setTree(decoded);
    const quick = (['sector', 'country', 'region'] as const).flatMap((f) => (params.get(f) ? [{ field: f, op: 'is' as Op, value: params.get(f)! }] : []));
    if (quick.length) setTree({ op: 'AND', rules: quick });
    if (params.get('name')) setName(params.get('name')!);
  }, [params]);
  const shareUrl = () => `/discover/screener?u=${universe}&q=${encodeTree(tree)}`;
  useEffect(() => { if (hydrated.current) window.history.replaceState(null, '', shareUrl()); /* keeps the address bar shareable */ }, [tree, universe]); // eslint-disable-line react-hooks/exhaustive-deps

  const edit = (path: number[], fn: (n: Node) => Node | null) => setTree((t) => updateAt(t, path, fn));
  const results = useMemo(() => (api.data ? runScreen(tree, api.data) : []), [api.data, tree]);
  const save = async () => {
    if (!ws.requireAuth()) return;
    const title = name.trim() || `Screen ${ws.data.saved_screens.length + 1}`;
    if (await ws.add('saved_screens', { name: title, definition: encodeTree(tree), universe })) { ws.track('screen', title, shareUrl()); toast(`“${title}” saved`); }
  };
  const share = async () => { try { await navigator.clipboard.writeText(window.location.origin + shareUrl()); toast('Link copied'); } catch { toast('Copy the address from your browser bar'); } };
  const exportCsv = () => { const url = URL.createObjectURL(new Blob([toCsv(results, cols)], { type: 'text/csv' })); const a = document.createElement('a'); a.href = url; a.download = `inrgift-screen-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url); toast(`Exported ${results.length} rows`); };

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(340px,420px)_minmax(0,1fr)]">
      <Panel title="Filters" sub={`${countRules(tree)} active`} tools={<Button size="sm" variant="ghost" onClick={() => { setTree({ op: 'AND', rules: [] }); setName(''); router.replace('/discover/screener'); }}><RotateCcw size={14} />Reset</Button>}>
        <p className="mb-1.5 text-xs text-faint">Universe</p>
        <Segmented label="Universe" value={universe} onChange={setUniverse} options={UNIVERSES} />
        <div className="mt-3"><GroupBox group={tree} path={[]} assets={api.data ?? []} edit={edit} /></div>
        <p className="mt-3 text-xs text-faint">A filter on a metric the source does not supply for an asset excludes that asset. Market cap and AUM are in billions of US dollars.</p>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          <label className="sr-only" htmlFor="screen-name">Screen name</label>
          <input id="screen-name" className="field h-10 min-w-0 flex-1" placeholder="Name this screen" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          <Button variant="primary" onClick={save}><Save size={16} />Save</Button>
        </div>
      </Panel>
      <Panel flush title="Results" sub={<span aria-live="polite"><b className="text-navy">{api.data ? results.length : '…'}</b>{api.data ? ` of ${api.data.length} match` : ''}</span>}
        tools={<div className="relative flex flex-wrap items-center gap-1.5">
          <Button size="sm" onClick={share}><Link2 size={14} />Share</Button>
          <Button size="sm" onClick={exportCsv} disabled={!results.length}><Download size={14} />Export</Button>
          <Button size="sm" aria-expanded={colsOpen} onClick={() => setColsOpen((o) => !o)}><Columns3 size={14} />Columns</Button>
          {colsOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-30 max-h-80 w-60 animate-pop-in overflow-auto rounded-card border border-line2 bg-white p-1.5 shadow-pop" role="group" aria-label="Visible columns">
              {METRIC_KEYS.map((k) => <label key={k} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-hover"><input type="checkbox" className="accent-brand" checked={cols.includes(k)} onChange={() => setCols((c) => METRIC_KEYS.filter((x) => (x === k ? !c.includes(k) : c.includes(x))))} />{METRICS[k].label}</label>)}
            </div>
          )}
        </div>}>
        {api.loading && !api.data ? <SkeletonRows rows={8} /> : api.error ? <ErrorState title="Results could not load" action={<Button onClick={api.reload}>Retry</Button>}>{api.error}</ErrorState>
          : <AssetTable rows={results} columns={cols} pageSize={20} empty={<NoResults>No assets match these filters. Remove a filter, switch a group to “Match any”, or widen the universe.</NoResults>} />}
      </Panel>
    </div>
  );
}
