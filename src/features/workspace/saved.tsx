'use client';
import { Clock, Columns2, Copy, ExternalLink, FileText, Filter, Pencil, Tag, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button, ButtonLink, IconButton } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { TextField } from '@/components/ui/field';
import { Badge, Callout, Change, EmptyState, Panel, Segmented } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { countRules, decodeTree, runScreen } from '@/features/screener/logic';
import { cn, dateTimeIST } from '@/lib/format';
import type { Asset, WorkspaceTables } from '@/lib/types';
import { useApi } from '@/lib/use-api';
import { groupByDay, useAssets, WsPage } from './ws-ui';
import { useWorkspace } from './workspace-context';

/** Small rename dialog shared by screens, comparisons and collections. */
export function RenameDialog({ open, title, initial, onSave, onClose, max = 80 }: { open: boolean; title: string; initial: string; onSave: (name: string) => Promise<void> | void; onClose: () => void; max?: number }) {
  const [name, setName] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState('');
  if (open && seen !== initial) { setSeen(initial); setName(initial); setError(null); }
  const save = async () => { const n = name.trim(); if (!n) return setError('Enter a name.'); await onSave(n.slice(0, max)); onClose(); };
  return <Dialog open={open} onClose={onClose} title={title} footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>Save</Button></>}><form onSubmit={(e) => { e.preventDefault(); void save(); }}><TextField label="Name" value={name} onChange={(e) => { setName(e.target.value); setError(null); }} maxLength={max} error={error} autoFocus /></form></Dialog>;
}
function ConfirmDelete({ open, what, onConfirm, onClose }: { open: boolean; what: string; onConfirm: () => void; onClose: () => void }) {
  return <Dialog open={open} onClose={onClose} title={`Delete ${what}?`} footer={<><Button onClick={onClose}>Cancel</Button><Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>Delete</Button></>}><p className="text-slate2">This cannot be undone.</p></Dialog>;
}

/* ---------------------------------- Saved screens ---------------------------------- */
export function ScreensPage() {
  const ws = useWorkspace();
  const toast = useToast();
  const universe = useApi<Asset[]>(ws.data.saved_screens.length ? '/api/v1/heatmap?universe=all' : null);
  const [rename, setRename] = useState<WorkspaceTables['saved_screens'] | null>(null);
  const [del, setDel] = useState<WorkspaceTables['saved_screens'] | null>(null);
  const href = (s: WorkspaceTables['saved_screens']) => `/discover/screener?u=${s.universe}&q=${s.definition}&name=${encodeURIComponent(s.name)}`;
  return (
    <WsPage title="Saved screens" lead="Each screen re-runs against today's data when you open it." actions={<ButtonLink href="/discover/screener" variant="primary"><Filter size={16} />New screen</ButtonLink>}>
      {universe.error && <Callout tone="error" title="Match counts could not load" action={<Button size="sm" onClick={universe.reload}>Retry</Button>} />}
      {!ws.data.saved_screens.length ? <Panel title="No saved screens"><EmptyState icon={<Filter size={22} />} title="Build and save a screen" action={<ButtonLink href="/discover/screener" variant="primary">Open the screener</ButtonLink>}>Combine filters with match all, match any and nested groups, then press Save.</EmptyState></Panel> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ws.data.saved_screens.map((s) => {
            const tree = decodeTree(s.definition);
            const matches = tree && universe.data ? runScreen(tree, universe.data.filter((a) => s.universe === 'all' || a.cls === s.universe)) : null;
            return (
              <article key={s.id} className="flex flex-col rounded-card border border-line bg-white p-4 shadow-card">
                <h2 className="text-base font-bold"><Link href={href(s)} className="hover:text-brand-ink">{s.name}</Link></h2>
                <p className="mt-1 text-[13px] text-slate2">{tree ? `${countRules(tree)} filters` : 'Definition could not be read'} · {s.universe === 'all' ? 'All asset types' : `${s.universe.toUpperCase()}s`}</p>
                <p className="mt-3 text-[13px]">{matches ? <><b className="num font-display text-lg">{matches.length}</b> <span className="text-slate2">assets match today</span></> : universe.loading ? <span className="text-faint">Counting matches…</span> : <span className="text-faint">—</span>}</p>
                {matches && matches.length > 0 && <p className="mt-1 truncate text-xs text-faint">{matches.slice(0, 5).map((a) => a.symbol).join(' · ')}{matches.length > 5 && ' …'}</p>}
                <p className="mt-2 text-xs text-faint">Saved {dateTimeIST(s.created_at)}</p>
                <div className="mt-auto flex flex-wrap gap-1 pt-3">
                  <ButtonLink size="sm" variant="primary" href={href(s)}><ExternalLink size={14} />Open</ButtonLink>
                  <IconButton label={`Rename ${s.name}`} onClick={() => setRename(s)}><Pencil size={15} /></IconButton>
                  <IconButton label={`Duplicate ${s.name}`} onClick={async () => { if (await ws.add('saved_screens', { name: `${s.name} (copy)`.slice(0, 80), definition: s.definition, universe: s.universe })) toast('Screen duplicated'); }}><Copy size={15} /></IconButton>
                  <IconButton label={`Delete ${s.name}`} onClick={() => setDel(s)}><Trash2 size={15} /></IconButton>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <RenameDialog open={Boolean(rename)} title="Rename screen" initial={rename?.name ?? ''} onClose={() => setRename(null)} onSave={async (n) => { await ws.update('saved_screens', rename!.id, { name: n }); toast('Screen renamed'); }} />
      <ConfirmDelete open={Boolean(del)} what={`“${del?.name}”`} onClose={() => setDel(null)} onConfirm={async () => { await ws.remove('saved_screens', del!.id); toast('Screen deleted'); }} />
    </WsPage>
  );
}

/* -------------------------------- Saved comparisons -------------------------------- */
export function ComparisonsPage() {
  const ws = useWorkspace();
  const toast = useToast();
  const md = useAssets(ws.data.saved_comparisons.flatMap((c) => c.instrument_ids));
  const [rename, setRename] = useState<WorkspaceTables['saved_comparisons'] | null>(null);
  const [del, setDel] = useState<WorkspaceTables['saved_comparisons'] | null>(null);
  return (
    <WsPage title="Saved comparisons" lead="Two to four assets side by side. Opening one reloads current data." actions={<ButtonLink href="/discover/compare" variant="primary"><Columns2 size={16} />New comparison</ButtonLink>}>
      {md.error && <Callout tone="error" title="Prices could not load" action={<Button size="sm" onClick={md.reload}>Retry</Button>} />}
      {!ws.data.saved_comparisons.length ? <Panel title="No saved comparisons"><EmptyState icon={<Columns2 size={22} />} title="Compare, then save" action={<ButtonLink href="/discover/compare" variant="primary">Open compare</ButtonLink>}>Add up to four assets in Compare and press Save comparison.</EmptyState></Panel> : (
        <Panel flush title={`${ws.data.saved_comparisons.length} comparisons`}>
          <ul>{ws.data.saved_comparisons.map((c) => { const assets = c.instrument_ids.map((id) => md.map.get(id)).filter((a): a is Asset => Boolean(a)); const href = `/discover/compare?s=${assets.map((a) => a.slug).join(',')}`; const best = [...assets].sort((x, y) => (y.m.y1 ?? -1e9) - (x.m.y1 ?? -1e9))[0]; return (
            <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3 last:border-0">
              <div className="min-w-0 flex-1"><Link href={href} className="font-semibold hover:text-brand-ink">{c.name}</Link><p className="mt-0.5 flex flex-wrap gap-x-3 text-[13px] text-slate2">{assets.length ? assets.map((a) => <span key={a.id}>{a.symbol} <Change value={a.m.y1} dp={1} /></span>) : md.loading ? 'Loading…' : 'Assets no longer covered'}</p></div>
              {best && <span className="text-xs text-faint">Best over 1Y: <b className="text-navy">{best.symbol}</b></span>}
              <span className="flex"><ButtonLink size="sm" href={href}>Open</ButtonLink><IconButton label={`Rename ${c.name}`} onClick={() => setRename(c)}><Pencil size={15} /></IconButton><IconButton label={`Delete ${c.name}`} onClick={() => setDel(c)}><Trash2 size={15} /></IconButton></span>
            </li>); })}</ul>
        </Panel>
      )}
      <RenameDialog open={Boolean(rename)} title="Rename comparison" initial={rename?.name ?? ''} onClose={() => setRename(null)} onSave={async (n) => { await ws.update('saved_comparisons', rename!.id, { name: n }); toast('Comparison renamed'); }} />
      <ConfirmDelete open={Boolean(del)} what={`“${del?.name}”`} onClose={() => setDel(null)} onConfirm={async () => { await ws.remove('saved_comparisons', del!.id); toast('Comparison deleted'); }} />
    </WsPage>
  );
}

/* ---------------------------------- Saved research ---------------------------------- */
export function SavedResearchPage() {
  const ws = useWorkspace();
  const toast = useToast();
  const [tag, setTag] = useState('');
  const [editing, setEditing] = useState<WorkspaceTables['saved_research'] | null>(null);
  const [tags, setTags] = useState('');
  const all = ws.data.saved_research;
  const allTags = useMemo(() => [...new Set(all.flatMap((r) => r.tags))].sort(), [all]);
  const rows = all.filter((r) => !tag || r.tags.includes(tag));
  return (
    <WsPage title="Saved research" lead="Research notes and asset pages you bookmarked. Tag them to find them later.">
      {!all.length ? <Panel title="Nothing saved yet"><EmptyState icon={<FileText size={22} />} title="Save research as you read" action={<ButtonLink href="/research" variant="primary">Browse research</ButtonLink>}>Press Save on any research note or asset page.</EmptyState></Panel> : (
        <Panel flush title={`${rows.length} saved`} tools={allTags.length > 0 && <div className="flex flex-wrap items-center gap-1.5"><Tag size={14} className="text-faint" aria-hidden /><button type="button" aria-pressed={!tag} onClick={() => setTag('')} className={cn('rounded-full px-2 py-0.5 text-xs font-medium', !tag ? 'bg-brand-soft text-brand-ink' : 'text-slate2 hover:bg-hover')}>All</button>{allTags.map((t) => <button key={t} type="button" aria-pressed={tag === t} onClick={() => setTag(tag === t ? '' : t)} className={cn('rounded-full px-2 py-0.5 text-xs font-medium', tag === t ? 'bg-brand-soft text-brand-ink' : 'text-slate2 hover:bg-hover')}>{t}</button>)}</div>}>
          {!rows.length ? <EmptyState title={`Nothing tagged “${tag}”`} /> : <ul>{rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-4 py-3 last:border-0">
              <div className="min-w-0 flex-1"><Link href={r.href} className="font-semibold hover:text-brand-ink">{r.title}</Link><p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-faint"><Badge>{r.ref_type === 'document' ? 'Research note' : 'Asset page'}</Badge>{r.tags.map((t) => <Badge key={t} tone="brand">{t}</Badge>)}Saved {dateTimeIST(r.created_at)}</p></div>
              <span className="flex"><IconButton label="Edit tags" onClick={() => { setEditing(r); setTags(r.tags.join(', ')); }}><Tag size={15} /></IconButton><IconButton label={`Remove ${r.title}`} onClick={async () => { await ws.remove('saved_research', r.id); toast('Removed from saved research'); }}><Trash2 size={15} /></IconButton></span>
            </li>))}</ul>}
        </Panel>
      )}
      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit tags" footer={<><Button onClick={() => setEditing(null)}>Cancel</Button><Button variant="primary" onClick={async () => { await ws.update('saved_research', editing!.id, { tags: [...new Set(tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 8) }); setEditing(null); toast('Tags saved'); }}>Save tags</Button></>}>
        <TextField label="Tags" hint="Separate with commas, up to eight." value={tags} onChange={(e) => setTags(e.target.value)} placeholder="earnings, semiconductors" autoFocus />
      </Dialog>
    </WsPage>
  );
}

/* ------------------------------- Recent and history ------------------------------- */
const KINDS = [['all', 'All'], ['asset', 'Assets'], ['research', 'Research'], ['screen', 'Screens'], ['comparison', 'Comparisons']] as const;
export function RecentPage() {
  const ws = useWorkspace();
  const seen = new Set<string>();
  const recent = ws.data.recent_history.filter((r) => (seen.has(r.href) ? false : (seen.add(r.href), true))).slice(0, 24);
  return (
    <WsPage title="Recent" lead="The last things you opened, one entry each, for quick return.">
      {!recent.length ? <Panel title="Nothing yet"><EmptyState icon={<Clock size={22} />} title="Your recent pages appear here" action={<ButtonLink href="/markets" variant="primary">Explore markets</ButtonLink>}>Open an asset, research note, screen or comparison.</EmptyState></Panel> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{recent.map((r) => <Link key={r.id} href={r.href} className="card-link p-4"><Badge>{r.kind}</Badge><p className="mt-2 font-semibold leading-snug">{r.title}</p><p className="mt-1 text-xs text-faint">{dateTimeIST(r.created_at)}</p></Link>)}</div>
      )}
    </WsPage>
  );
}
export function HistoryPage() {
  const ws = useWorkspace();
  const toast = useToast();
  const [kind, setKind] = useState<(typeof KINDS)[number][0]>('all');
  const [confirm, setConfirm] = useState(false);
  const rows = ws.data.recent_history.filter((r) => kind === 'all' || r.kind === kind);
  return (
    <WsPage title="History" lead="Everything you have opened while signed in. Only you can see it." actions={<Button variant="danger" onClick={() => setConfirm(true)} disabled={!ws.data.recent_history.length}><Trash2 size={16} />Clear history</Button>}>
      <Panel flush title={`${rows.length} entries`} tools={<Segmented size="sm" label="Filter history" value={kind} onChange={setKind} options={KINDS} />}>
        {!rows.length ? <EmptyState title="No history">{kind === 'all' ? 'Pages you open while signed in are listed here.' : 'Nothing of this kind yet.'}</EmptyState> : groupByDay(rows).map(([day, list]) => (
          <section key={day}><h3 className="bg-soft px-4 py-1.5 text-xs font-semibold text-slate2">{day}</h3>
            <ul>{list.map((r) => <li key={r.id} className="flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-0"><span className="num w-12 shrink-0 text-xs text-faint">{new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(r.created_at))}</span><Badge>{r.kind}</Badge><Link href={r.href} className="min-w-0 flex-1 truncate font-medium hover:text-brand-ink">{r.title}</Link><IconButton label={`Remove ${r.title} from history`} onClick={() => ws.remove('recent_history', r.id)}><X size={15} /></IconButton></li>)}</ul>
          </section>
        ))}
      </Panel>
      <Dialog open={confirm} onClose={() => setConfirm(false)} title="Clear all history?" footer={<><Button onClick={() => setConfirm(false)}>Cancel</Button><Button variant="danger" onClick={async () => { const all = ws.data.recent_history; setConfirm(false); for (const r of all) await ws.remove('recent_history', r.id); toast('History cleared'); }}>Clear {ws.data.recent_history.length} entries</Button></>}>
        <p className="text-slate2">Recent pages and history are removed. Saved items, alerts and notes are not affected.</p>
      </Dialog>
    </WsPage>
  );
}
