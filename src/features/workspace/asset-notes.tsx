'use client';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button, IconButton } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState, InlineError, Panel } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { dateShort } from '@/lib/format';
import { useWorkspace } from './workspace-context';

export function NoteDialog({ open, onClose, instrumentId, assets }: { open: boolean; onClose: () => void; instrumentId?: string | null; assets?: { id: string; label: string }[] }) {
  const ws = useWorkspace();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [linked, setLinked] = useState(instrumentId ?? '');
  const [error, setError] = useState('');
  const save = async () => {
    if (!title.trim()) return setError('Give the note a title so you can find it later.');
    const saved = await ws.add('notes', { title: title.trim().slice(0, 120), body: body.trim(), tags: tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 8), instrument_id: (instrumentId ?? linked) || null });
    if (saved) { setTitle(''); setBody(''); setTags(''); setError(''); onClose(); toast('Note saved'); }
  };
  return (
    <Dialog open={open} onClose={onClose} title="New note" footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>Save note</Button></>}>
      <label className="label" htmlFor="note-title">Title</label>
      <input id="note-title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} aria-invalid={Boolean(error)} />
      {error && <InlineError>{error}</InlineError>}
      <label className="label mt-3" htmlFor="note-body">Note</label>
      <textarea id="note-body" className="field h-28 py-2" value={body} onChange={(e) => setBody(e.target.value)} />
      <label className="label mt-3" htmlFor="note-tags">Tags <span className="font-normal text-faint">(comma separated)</span></label>
      <input id="note-tags" className="field" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="earnings, valuation" />
      {assets && !instrumentId && (<><label className="label mt-3" htmlFor="note-asset">Linked asset</label><select id="note-asset" className="field" value={linked} onChange={(e) => setLinked(e.target.value)}><option value="">None</option>{assets.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</select></>)}
    </Dialog>
  );
}
/** Notes linked to one asset, shown on its detail page. */
export function AssetNotes({ instrumentId, symbol }: { instrumentId: string; symbol: string }) {
  const ws = useWorkspace();
  const [open, setOpen] = useState(false);
  const notes = ws.data.notes.filter((n) => n.instrument_id === instrumentId);
  return (
    <Panel title={`Your notes on ${symbol}`} flush tools={<Button size="sm" onClick={() => ws.requireAuth() && setOpen(true)}><Plus size={14} />Add note</Button>}>
      {notes.length ? <ul>{notes.map((n) => <li key={n.id} className="flex gap-3 border-b border-line px-4 py-3 last:border-0"><div className="min-w-0 flex-1"><p className="font-semibold">{n.title}</p>{n.body && <p className="mt-0.5 whitespace-pre-wrap text-slate2">{n.body}</p>}<p className="mt-1 text-xs text-faint">{dateShort(n.created_at)}{n.tags.length > 0 && ` · ${n.tags.join(', ')}`}</p></div><IconButton label="Delete note" onClick={() => ws.remove('notes', n.id)}><Trash2 size={15} /></IconButton></li>)}</ul>
        : <EmptyState title="No notes yet">Notes you link to {symbol} appear here and in your workspace. They are private to you.</EmptyState>}
      <NoteDialog open={open} onClose={() => setOpen(false)} instrumentId={instrumentId} />
    </Panel>
  );
}
