'use client';
import { Bell, CheckCheck, Pause, Pencil, Play, Plus, RotateCcw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button, IconButton } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Badge, Callout, EmptyState, Panel, Segmented } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { AssetIdentity } from '@/features/assets/asset-table';
import { alertLabel } from '@/lib/alerts';
import { cn, dateTimeIST } from '@/lib/format';
import type { WorkspaceTables } from '@/lib/types';
import { AlertDialog } from './alert-dialog';
import { groupByDay, useAssets, WsPage } from './ws-ui';
import { useWorkspace } from './workspace-context';

type Alert = WorkspaceTables['alerts'];
type Filter = 'all' | 'active' | 'triggered' | 'paused';
const STATUS: Record<Alert['status'], [string, 'up' | 'warn' | 'neutral' | 'brand', string]> = { active: ['Active', 'up', '●'], triggered: ['Triggered', 'brand', '◆'], paused: ['Paused', 'neutral', '❚❚'] };

export function AlertsPage() {
  const ws = useWorkspace();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<Alert | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Alert | null>(null);
  const alerts = useMemo(() => [...ws.data.alerts].sort((a, b) => (b.last_triggered_at ?? b.created_at).localeCompare(a.last_triggered_at ?? a.created_at)), [ws.data.alerts]);
  const md = useAssets(alerts.map((a) => a.instrument_id));
  const shown = alerts.filter((a) => filter === 'all' || a.status === filter);
  const count = (s: Filter) => (s === 'all' ? alerts.length : alerts.filter((a) => a.status === s).length);
  const history = ws.data.notifications.filter((n) => n.ref_id && ws.data.alerts.some((a) => a.id === n.ref_id));
  const set = async (a: Alert, status: Alert['status'], msg: string) => { await ws.update('alerts', a.id, { status }); toast(msg); };
  const editingAsset = editing ? md.map.get(editing.instrument_id) ?? null : null;
  return (
    <WsPage title="Alerts" lead="Price, move, valuation, calendar, news and research alerts. Checked every minute while INRGIFT is open." actions={<Button variant="primary" onClick={() => setCreating(true)}><Plus size={16} />New alert</Button>}>
      <Callout tone="info" title="Alerts only send you a notification.">Triggered level alerts pause themselves until you re-arm them; news, research and calendar alerts keep watching for the next item.</Callout>
      <Panel flush title="Your alerts" tools={<Segmented size="sm" label="Filter alerts" value={filter} onChange={setFilter} options={(['all', 'active', 'triggered', 'paused'] as const).map((f) => [f, `${f[0].toUpperCase()}${f.slice(1)} ${count(f)}`] as const)} />}>
        {md.error && <div className="p-4"><Callout tone="error" title="Prices could not load" action={<Button size="sm" onClick={md.reload}>Retry</Button>} /></div>}
        {!alerts.length ? <EmptyState icon={<Bell size={22} />} title="No alerts yet" action={<Button variant="primary" onClick={() => setCreating(true)}>Create an alert</Button>}>Set one here or with the bell on any asset page, table or watchlist row.</EmptyState>
          : !shown.length ? <EmptyState title={`No ${filter} alerts`}>Choose another filter to see the rest.</EmptyState> : (
          <ul>{shown.map((a) => { const asset = md.map.get(a.instrument_id); const [label, tone, glyph] = STATUS[a.status]; return (
            <li key={a.id} className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3 last:border-0', a.status === 'triggered' && 'bg-brand-soft/40')}>
              <div className="w-full min-w-[180px] sm:w-56">{asset ? <AssetIdentity asset={asset} /> : <span className="text-faint">{md.loading ? 'Loading…' : 'Instrument not covered'}</span>}</div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{alertLabel(a.kind, a.threshold)}</p>
                <p className="text-xs text-faint">{asset?.price != null && <>Now {ws.showPrice(asset)} · </>}Created {dateTimeIST(a.created_at)}{a.last_triggered_at && <> · Last triggered {dateTimeIST(a.last_triggered_at)}</>}{a.channel === 'email' && ' · Email copy'}</p>
                {a.note && <p className="mt-0.5 text-[13px] text-slate2">“{a.note}”</p>}
              </div>
              <Badge tone={tone}><span aria-hidden className="text-[9px]">{glyph}</span>{label}</Badge>
              <span className="flex">
                {a.status === 'active' ? <IconButton label="Pause alert" onClick={() => set(a, 'paused', 'Alert paused')}><Pause size={15} /></IconButton>
                  : a.status === 'paused' ? <IconButton label="Resume alert" onClick={() => set(a, 'active', 'Alert resumed')}><Play size={15} /></IconButton>
                  : <IconButton label="Re-arm alert" onClick={() => set(a, 'active', 'Alert re-armed')}><RotateCcw size={15} /></IconButton>}
                <IconButton label="Edit alert" onClick={() => setEditing(a)}><Pencil size={15} /></IconButton>
                <IconButton label="Delete alert" onClick={() => setDeleting(a)}><Trash2 size={15} /></IconButton>
              </span>
            </li>); })}</ul>
        )}
      </Panel>
      <Panel flush title="Trigger history" sub={`${history.length} events`}>
        {!history.length ? <EmptyState title="Nothing has triggered yet">When an alert fires, it is recorded here and in your notifications.</EmptyState> : groupByDay(history).map(([day, rows]) => (
          <section key={day}><h3 className="bg-soft px-4 py-1.5 text-xs font-semibold text-slate2">{day}</h3>
            <ul>{rows.map((n) => <li key={n.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-4 py-2.5 last:border-0"><span className="min-w-0">{n.href ? <Link href={n.href} className="font-medium hover:text-brand-ink">{n.title}</Link> : <span className="font-medium">{n.title}</span>}{n.body && <span className="block text-[13px] text-slate2">{n.body}</span>}</span><span className="num text-xs text-faint">{dateTimeIST(n.created_at)}</span></li>)}</ul>
          </section>
        ))}
      </Panel>
      <AlertDialog open={creating} onClose={() => setCreating(false)} />
      <AlertDialog open={Boolean(editing)} onClose={() => setEditing(null)} existing={editing} asset={editingAsset ?? (editing ? { id: editing.instrument_id, symbol: editing.instrument_id, name: 'This asset', price: null, currency: '' } : null)} />
      <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Delete this alert?" footer={<><Button onClick={() => setDeleting(null)}>Cancel</Button><Button variant="danger" onClick={async () => { const a = deleting!; setDeleting(null); await ws.remove('alerts', a.id); toast('Alert deleted'); }}>Delete</Button></>}>
        <p className="text-slate2">{deleting && alertLabel(deleting.kind, deleting.threshold)}. Past notifications from it are kept.</p>
      </Dialog>
    </WsPage>
  );
}

/* ---------------------------------- Notifications ---------------------------------- */
type NFilter = 'all' | 'unread' | 'market' | 'research' | 'account' | 'system';
export function NotificationsPage() {
  const ws = useWorkspace();
  const toast = useToast();
  const [filter, setFilter] = useState<NFilter>('all');
  const rows = useMemo(() => [...ws.data.notifications].sort((a, b) => b.created_at.localeCompare(a.created_at)).filter((n) => filter === 'all' || (filter === 'unread' ? !n.read : n.category === filter)), [ws.data.notifications, filter]);
  const unread = ws.data.notifications.filter((n) => !n.read);
  const markAll = async () => { await Promise.all(unread.map((n) => ws.update('notifications', n.id, { read: true }))); toast('All marked as read'); };
  return (
    <WsPage title="Notifications" lead="Triggered alerts, research updates and account notices." actions={<Button onClick={markAll} disabled={!unread.length}><CheckCheck size={16} />Mark all read</Button>}>
      <Panel flush title={`${unread.length} unread`} tools={<Segmented size="sm" label="Filter notifications" value={filter} onChange={setFilter} options={[['all', 'All'], ['unread', 'Unread'], ['market', 'Market'], ['research', 'Research'], ['account', 'Account'], ['system', 'System']] as const} />}>
        {!rows.length ? <EmptyState icon={<Bell size={22} />} title={filter === 'all' ? 'No notifications yet' : 'Nothing here'}>{filter === 'all' ? 'Alerts you create will report here when they trigger.' : 'Choose another filter.'}</EmptyState> : groupByDay(rows).map(([day, list]) => (
          <section key={day}><h3 className="bg-soft px-4 py-1.5 text-xs font-semibold text-slate2">{day}</h3>
            <ul>{list.map((n) => (
              <li key={n.id} className={cn('flex items-start gap-3 border-b border-line px-4 py-3 last:border-0', !n.read && 'bg-brand-soft/40')}>
                <span aria-hidden className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-brand')} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{n.href ? <Link href={n.href} onClick={() => !n.read && ws.update('notifications', n.id, { read: true })} className="hover:text-brand-ink">{n.title}</Link> : n.title}{!n.read && <span className="sr-only"> (unread)</span>}</p>
                  {n.body && <p className="text-[13px] text-slate2">{n.body}</p>}
                  <p className="mt-0.5 text-xs text-faint"><Badge>{n.category}</Badge> {dateTimeIST(n.created_at)}</p>
                </div>
                <span className="flex shrink-0">
                  <IconButton label={n.read ? 'Mark as unread' : 'Mark as read'} onClick={() => ws.update('notifications', n.id, { read: !n.read })}><CheckCheck size={15} /></IconButton>
                  <IconButton label="Delete notification" onClick={() => ws.remove('notifications', n.id)}><Trash2 size={15} /></IconButton>
                </span>
              </li>
            ))}</ul>
          </section>
        ))}
      </Panel>
    </WsPage>
  );
}
