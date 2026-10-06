'use client';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button, IconButton } from '@/components/ui/button';
import { Badge, EmptyState, Panel } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { dateTimeIST } from '@/lib/format';
import type { WorkspaceTables } from '@/lib/types';
import { useSession } from '@/features/auth/session-context';
import { NoteEditor } from './notes-collections';
import { useWorkspace } from './workspace-context';

/** Notes linked to one asset, shown on its detail page. Private to the signed-in user. */
export function AssetNotes({ instrumentId, symbol, name }: { instrumentId: string; symbol: string; name?: string }) {
  const ws = useWorkspace();
  const { user } = useSession();
  const toast = useToast();
  const [editing, setEditing] = useState<WorkspaceTables['notes'] | null | 'new'>(null);
  const notes = ws.data.notes.filter((n) => n.instrument_id === instrumentId).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  return (
    <Panel title={`Your notes on ${symbol}`} flush tools={<Button size="sm" onClick={() => ws.requireAuth() && setEditing('new')}><Plus size={14} />Add note</Button>}>
      {notes.length ? <ul>{notes.map((n) => (
        <li key={n.id} className="flex gap-3 border-b border-line px-4 py-3 last:border-0">
          <div className="min-w-0 flex-1"><p className="font-semibold">{n.title}</p>{n.body && <p className="mt-0.5 whitespace-pre-wrap text-slate2">{n.body}</p>}<p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-faint">{n.tags.map((t) => <Badge key={t} tone="brand">{t}</Badge>)}{dateTimeIST(n.updated_at)}</p></div>
          <IconButton label={`Edit ${n.title}`} onClick={() => setEditing(n)}><Pencil size={15} /></IconButton>
          <IconButton label={`Delete ${n.title}`} onClick={async () => { await ws.remove('notes', n.id); toast('Note deleted'); }}><Trash2 size={15} /></IconButton>
        </li>))}</ul>
        : <EmptyState title="No notes yet">{!user ? `Sign in to keep private notes on ${symbol}.` : `Notes you link to ${symbol} appear here and in your workspace. Only you can read them.`}</EmptyState>}
      <NoteEditor open={Boolean(editing)} onClose={() => setEditing(null)} note={editing === 'new' ? null : editing} asset={{ id: instrumentId, symbol, name: name ?? symbol }} />
    </Panel>
  );
}
