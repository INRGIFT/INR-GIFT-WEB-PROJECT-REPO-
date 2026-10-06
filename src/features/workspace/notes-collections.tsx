'use client';
import { LayoutGrid, Pencil, Plus, Search, StickyNote, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button, ButtonLink, IconButton } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { TextArea, TextField } from '@/components/ui/field';
import { Badge, Callout, Change, EmptyState, Panel, SkeletonRows } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { AssetIdentity, MetricCell } from '@/features/assets/asset-table';
import { cn, dateTimeIST } from '@/lib/format';
import { assetHref, collectionHref } from '@/lib/routes';
import type { Asset, Theme, WorkspaceTables } from '@/lib/types';
import { useApi } from '@/lib/use-api';
import { AssetPicker, useAssets, WsPage } from './ws-ui';
import { useWorkspace } from './workspace-context';

type Note = WorkspaceTables['notes'];
const parseTags = (s: string) => [...new Set(s.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 8);

/** Create or edit a note, optionally linked to one asset. */
export function NoteEditor({ open, onClose, note, asset }: { open: boolean; onClose: () => void; note?: Note | null; asset?: Pick<Asset, 'id' | 'symbol' | 'name'> | null }) {
  const ws = useWorkspace();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [linked, setLinked] = useState<Pick<Asset, 'id' | 'symbol' | 'name'> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState<string | null>(null);
  const key = open ? `${note?.id ?? 'new'}-${asset?.id ?? ''}` : null;
  if (key && key !== seen) { setSeen(key); setTitle(note?.title ?? ''); setBody(note?.body ?? ''); setTags(note?.tags.join(', ') ?? ''); setLinked(asset ?? null); setError(null); }
  if (!open && seen) setSeen(null);
  const save = async () => {
    if (!title.trim()) return setError('Give the note a title so you can find it later.');
    const row = { title: title.trim().slice(0, 120), body: body.trim(), tags: parseTags(tags), instrument_id: note ? note.instrument_id : linked?.id ?? null };
    if (note) { await ws.update('notes', note.id, { ...row, updated_at: new Date().toISOString() }); toast('Note updated'); onClose(); }
    else if (await ws.add('notes', row)) { toast('Note saved'); onClose(); }
  };
  return (
    <Dialog open={open} onClose={onClose} title={note ? 'Edit note' : 'New note'} footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>Save note</Button></>}>
      <div className="space-y-4">
        <TextField label="Title" value={title} onChange={(e) => { setTitle(e.target.value); setError(null); }} maxLength={120} error={error} autoFocus />
        <TextArea label="Note" value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="What you noticed, what to check next" />
        <TextField label="Tags" optional hint="Separate with commas." value={tags} onChange={(e) => setTags(e.target.value)} placeholder="earnings, valuation" />
        {!note && (linked ? <p className="text-[13px] text-slate2">Linked to <b className="text-navy">{linked.name} ({linked.symbol})</b> {!asset && <button type="button" className="link ml-1" onClick={() => setLinked(null)}>Remove link</button>}</p>
          : <div><p className="label">Linked asset <span className="font-normal text-faint">(optional)</span></p><AssetPicker label="Link an asset" onPick={(a) => setLinked(a)} /></div>)}
      </div>
    </Dialog>
  );
}

export function NotesPage() {
  const ws = useWorkspace();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('');
  const [editing, setEditing] = useState<Note | null | 'new'>(null);
  const [del, setDel] = useState<Note | null>(null);
  const md = useAssets(ws.data.notes.map((n) => n.instrument_id).filter((x): x is string => Boolean(x)));
  const tags = useMemo(() => [...new Set(ws.data.notes.flatMap((n) => n.tags))].sort(), [ws.data.notes]);
  const s = q.trim().toLowerCase();
  const rows = [...ws.data.notes].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).filter((n) => (!tag || n.tags.includes(tag)) && (!s || `${n.title} ${n.body} ${md.map.get(n.instrument_id ?? '')?.symbol ?? ''}`.toLowerCase().includes(s)));
  return (
    <WsPage title="Notes" lead="Private research notes, optionally linked to an asset. Linked notes also appear on that asset's page." actions={<Button variant="primary" onClick={() => setEditing('new')}><Plus size={16} />New note</Button>}>
      {!ws.data.notes.length ? <Panel title="No notes yet"><EmptyState icon={<StickyNote size={22} />} title="Write your first note" action={<Button variant="primary" onClick={() => setEditing('new')}>New note</Button>}>Capture what you noticed and what to check next. Only you can read notes.</EmptyState></Panel> : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative w-full max-w-xs"><span className="sr-only">Search notes</span><Search size={15} className="absolute left-3 top-3 text-faint" aria-hidden /><input className="field pl-9" placeholder="Search notes" value={q} onChange={(e) => setQ(e.target.value)} /></label>
            {tags.map((t) => <button key={t} type="button" aria-pressed={tag === t} onClick={() => setTag(tag === t ? '' : t)} className={cn('rounded-full border px-2.5 py-1 text-xs font-medium transition-colors', tag === t ? 'border-brand bg-brand-soft text-brand-ink' : 'border-line2 bg-white text-slate2 hover:border-faint')}>{t}</button>)}
          </div>
          {!rows.length ? <Panel title="No matches"><EmptyState title={`No notes match${q ? ` “${q}”` : ''}${tag ? ` tagged ${tag}` : ''}`}>Clear the search or tag filter.</EmptyState></Panel> : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{rows.map((n) => { const a = n.instrument_id ? md.map.get(n.instrument_id) : null; return (
              <article key={n.id} className="flex flex-col rounded-card border border-line bg-white p-4 shadow-card">
                <div className="flex items-start gap-2"><h2 className="min-w-0 flex-1 text-[15px] font-bold">{n.title}</h2><IconButton label={`Edit ${n.title}`} onClick={() => setEditing(n)}><Pencil size={15} /></IconButton><IconButton label={`Delete ${n.title}`} onClick={() => setDel(n)}><Trash2 size={15} /></IconButton></div>
                {n.body && <p className="mt-1 line-clamp-6 whitespace-pre-wrap text-[13px] text-slate2">{n.body}</p>}
                <div className="mt-auto pt-3">
                  {a && <Link href={assetHref(a)} className="mb-2 inline-flex items-center gap-1.5 rounded-lg bg-soft px-2 py-1 text-xs font-medium hover:text-brand-ink">{a.symbol} · {a.name}</Link>}
                  <p className="flex flex-wrap items-center gap-1.5 text-xs text-faint">{n.tags.map((t) => <Badge key={t} tone="brand">{t}</Badge>)}Updated {dateTimeIST(n.updated_at)}</p>
                </div>
              </article>); })}</div>
          )}
        </>
      )}
      <NoteEditor open={Boolean(editing)} onClose={() => setEditing(null)} note={editing === 'new' ? null : editing} />
      <Dialog open={Boolean(del)} onClose={() => setDel(null)} title="Delete this note?" footer={<><Button onClick={() => setDel(null)}>Cancel</Button><Button variant="danger" onClick={async () => { const n = del!; setDel(null); await ws.remove('notes', n.id); toast('Note deleted'); }}>Delete</Button></>}><p className="text-slate2">“{del?.title}” will be removed. This cannot be undone.</p></Dialog>
    </WsPage>
  );
}

/* ------------------------------------ Collections ------------------------------------ */
type Coll = WorkspaceTables['collections'];
export function CollectionsPage() {
  const ws = useWorkspace();
  const toast = useToast();
  const themes = useApi<Theme[]>('/api/v1/themes');
  const [editing, setEditing] = useState<Coll | null | 'new'>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [del, setDel] = useState<Coll | null>(null);
  const colls = ws.data.collections;
  const current = colls.find((c) => c.id === (openId ?? colls[0]?.id));
  const md = useAssets(current?.instrument_ids ?? []);
  const followed = (themes.data ?? []).filter((t) => ws.prefs.themes.includes(t.id));
  const addTo = async (c: Coll, a: Asset) => { if (c.instrument_ids.includes(a.id)) return toast(`${a.symbol} is already in ${c.name}`); if (c.instrument_ids.length >= 100) return toast('A collection holds up to 100 assets'); await ws.update('collections', c.id, { instrument_ids: [...c.instrument_ids, a.id] }); toast(`${a.symbol} added to ${c.name}`); };
  return (
    <WsPage title="Collections" lead="Your own groups of assets across markets, plus the curated themes you follow." actions={<Button variant="primary" onClick={() => setEditing('new')}><Plus size={16} />New collection</Button>}>
      {!colls.length ? <Panel title="No collections yet"><EmptyState icon={<LayoutGrid size={22} />} title="Group assets around an idea" action={<Button variant="primary" onClick={() => setEditing('new')}>Create a collection</Button>}>For example “Indian IT exporters” or “Global luxury”. Collections can mix markets and asset classes.</EmptyState></Panel> : (
        <div className="grid items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <nav aria-label="Your collections" className="rounded-card border border-line bg-white p-1.5 shadow-card"><ul className="space-y-0.5">{colls.map((c) => { const on = c.id === current?.id; return <li key={c.id}><button type="button" onClick={() => setOpenId(c.id)} aria-current={on ? 'true' : undefined} className={cn('flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left font-medium transition-colors', on ? 'bg-brand-soft text-brand-ink' : 'hover:bg-hover')}><span className="truncate">{c.name}</span><span className="text-[11px] text-faint">{c.instrument_ids.length}</span></button></li>; })}</ul></nav>
          {current && (
            <Panel flush title={current.name} sub={current.description || undefined} tools={<span className="flex"><IconButton label="Edit collection" onClick={() => setEditing(current)}><Pencil size={15} /></IconButton><IconButton label="Delete collection" onClick={() => setDel(current)}><Trash2 size={15} /></IconButton></span>}>
              <div className="border-b border-line px-4 py-3"><AssetPicker label={`Add to ${current.name}`} exclude={current.instrument_ids} onPick={(a) => addTo(current, a)} /></div>
              {md.error && <div className="p-4"><Callout tone="error" title="Prices could not load" action={<Button size="sm" onClick={md.reload}>Retry</Button>} /></div>}
              {!current.instrument_ids.length ? <EmptyState title="Empty collection">Search above to add stocks, ETFs, indices, currencies or commodities.</EmptyState> : md.loading && !md.map.size ? <SkeletonRows rows={4} /> : (
                <>
                  <div className="overflow-x-auto"><table className="w-full border-collapse text-[13px]"><thead><tr className="text-xs text-faint"><th scope="col" className="border-b border-line px-4 py-2.5 text-left font-semibold">Asset</th><th scope="col" className="border-b border-line px-3 py-2.5 text-right font-semibold">Price</th><th scope="col" className="border-b border-line px-3 py-2.5 text-right font-semibold">1D</th><th scope="col" className="border-b border-line px-3 py-2.5 text-right font-semibold">1M</th><th scope="col" className="border-b border-line px-3 py-2.5 text-right font-semibold">1Y</th><th scope="col" className="border-b border-line"><span className="sr-only">Remove</span></th></tr></thead>
                    <tbody>{current.instrument_ids.map((id) => { const a = md.map.get(id); return <tr key={id} className="border-b border-line last:border-0 hover:bg-bg"><td className="px-4 py-2">{a ? <AssetIdentity asset={a} /> : <span className="text-faint">Not covered</span>}</td><td className="num px-3 py-2 text-right">{a ? ws.showPrice(a) : '—'}</td><td className="px-3 py-2 text-right"><MetricCell k="d1" v={a?.m.d1} /></td><td className="px-3 py-2 text-right"><MetricCell k="m1" v={a?.m.m1} /></td><td className="px-3 py-2 text-right"><MetricCell k="y1" v={a?.m.y1} /></td><td className="px-2 text-right"><IconButton label={`Remove ${a?.symbol ?? 'asset'}`} onClick={() => ws.update('collections', current.id, { instrument_ids: current.instrument_ids.filter((x) => x !== id) })}><X size={15} /></IconButton></td></tr>; })}</tbody>
                  </table></div>
                  {md.map.size >= 2 && <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3"><ButtonLink size="sm" href={`/discover/compare?s=${current.instrument_ids.slice(0, 4).map((id) => md.map.get(id)?.slug).filter(Boolean).join(',')}`}>Compare the first {Math.min(4, md.map.size)}</ButtonLink><span className="text-[13px] text-slate2">Equal-weighted 1M <Change value={avg([...md.map.values()], 'm1')} /> · 1Y <Change value={avg([...md.map.values()], 'y1')} /></span></div>}
                </>
              )}
            </Panel>
          )}
        </div>
      )}
      <Panel flush title="Themes you follow" sub="Curated by INRGIFT" tools={<ButtonLink size="sm" href="/account/settings">Choose themes</ButtonLink>}>
        {themes.loading ? <SkeletonRows rows={3} /> : themes.error ? <div className="p-4"><Callout tone="error" title="Themes could not load" action={<Button size="sm" onClick={themes.reload}>Retry</Button>} /></div> : !followed.length ? <EmptyState title="Not following any themes">Pick themes in Settings, or browse <Link className="link" href="/discover/collections">all collections</Link>.</EmptyState> : <ul>{followed.map((t) => <li key={t.id}><Link href={collectionHref(t.id)} className="row-link"><span className="block font-semibold">{t.name}</span><span className="text-[13px] text-slate2">{t.description} · {t.assetIds.length} assets</span></Link></li>)}</ul>}
      </Panel>
      <CollectionDialog open={Boolean(editing)} coll={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onCreated={setOpenId} />
      <Dialog open={Boolean(del)} onClose={() => setDel(null)} title={`Delete “${del?.name}”?`} footer={<><Button onClick={() => setDel(null)}>Cancel</Button><Button variant="danger" onClick={async () => { const c = del!; setDel(null); setOpenId(null); await ws.remove('collections', c.id); toast('Collection deleted'); }}>Delete</Button></>}><p className="text-slate2">The collection is removed. The assets themselves, and any alerts or notes on them, are not affected.</p></Dialog>
    </WsPage>
  );
}
const avg = (l: Asset[], k: 'm1' | 'y1') => { const v = l.map((a) => a.m[k]).filter((x): x is number => x != null); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
function CollectionDialog({ open, coll, onClose, onCreated }: { open: boolean; coll: Coll | null; onClose: () => void; onCreated: (id: string) => void }) {
  const ws = useWorkspace();
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState<string | null>(null);
  const key = open ? coll?.id ?? 'new' : null;
  if (key && key !== seen) { setSeen(key); setName(coll?.name ?? ''); setDescription(coll?.description ?? ''); setError(null); }
  if (!open && seen) setSeen(null);
  const save = async () => {
    const n = name.trim(); if (!n) return setError('Give the collection a name.');
    if (coll) { await ws.update('collections', coll.id, { name: n.slice(0, 80), description: description.trim().slice(0, 280) }); toast('Collection saved'); onClose(); return; }
    const row = await ws.add('collections', { name: n.slice(0, 80), description: description.trim().slice(0, 280), instrument_ids: [] });
    if (row) { toast(`“${n}” created`); onCreated(row.id); onClose(); }
  };
  return (
    <Dialog open={open} onClose={onClose} title={coll ? 'Edit collection' : 'New collection'} footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>{coll ? 'Save' : 'Create'}</Button></>}>
      <div className="space-y-4"><TextField label="Name" value={name} onChange={(e) => { setName(e.target.value); setError(null); }} maxLength={80} error={error} autoFocus /><TextArea label="Description" optional value={description} onChange={(e) => setDescription(e.target.value)} maxLength={280} rows={3} /></div>
    </Dialog>
  );
}
