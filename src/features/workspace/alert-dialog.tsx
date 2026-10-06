'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { SelectField, TextField } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { ALERT_KINDS, alertProblem, needsThreshold } from '@/lib/alerts';
import { money } from '@/lib/format';
import type { Asset, WorkspaceTables } from '@/lib/types';
import { AssetPicker } from './ws-ui';
import { useWorkspace } from './workspace-context';

type Lite = Pick<Asset, 'id' | 'symbol' | 'name' | 'price' | 'currency'> & { m?: Asset['m'] };

/** Create or edit an alert. With no asset it shows a picker first. Alerts only notify. */
export function AlertDialog({ open, onClose, asset: given, existing }: { open: boolean; onClose: () => void; asset?: Lite | null; existing?: WorkspaceTables['alerts'] | null }) {
  const ws = useWorkspace();
  const toast = useToast();
  const [asset, setAsset] = useState<Lite | null>(given ?? null);
  const [kind, setKind] = useState<string>(existing?.kind ?? 'price_above');
  const [value, setValue] = useState(existing?.threshold != null ? String(existing.threshold) : '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [channel, setChannel] = useState<'in_app' | 'email'>(existing?.channel ?? 'in_app');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setAsset(given ?? null); setKind(existing?.kind ?? 'price_above'); setValue(existing?.threshold != null ? String(existing.threshold) : ''); setNote(existing?.note ?? ''); setChannel(existing?.channel ?? 'in_app'); setError(null); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const needs = needsThreshold(kind);
  const save = async () => {
    if (!asset) return setError('Choose an asset first.');
    const problem = alertProblem(kind, value, asset.m ? { price: asset.price, m: asset.m } : undefined);
    if (problem) return setError(problem);
    setBusy(true);
    const threshold = needs ? Number(value) : null;
    if (existing) { await ws.update('alerts', existing.id, { kind, threshold, note: note.trim() || null, channel, status: 'active', last_triggered_at: existing.kind === kind && existing.threshold === threshold ? existing.last_triggered_at : null }); toast('Alert updated'); onClose(); }
    else if (await ws.add('alerts', { instrument_id: asset.id, kind, threshold, status: 'active', channel, last_triggered_at: null, note: note.trim() || null })) { toast(`Alert created for ${asset.symbol}`); onClose(); }
    setBusy(false);
  };
  const placeholder = kind === 'price_above' && asset?.price ? String(Math.round(asset.price * 1.05 * 100) / 100) : kind === 'price_below' && asset?.price ? String(Math.round(asset.price * 0.95 * 100) / 100) : kind === 'pct_move' ? '3' : kind === 'valuation' ? '20' : '';
  return (
    <Dialog open={open} onClose={onClose} title={existing ? `Edit alert${asset ? ` for ${asset.symbol}` : ''}` : asset ? `Alert for ${asset.symbol}` : 'New alert'} footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save} disabled={busy}>{existing ? 'Save alert' : 'Create alert'}</Button></>}>
      <div className="space-y-4">
        {asset ? <p className="text-slate2">{asset.name}{asset.price != null && <> · last <span className="num font-medium text-navy">{money(asset.price, asset.currency)}</span></>}{!given && !existing && <button type="button" className="link ml-2 text-[13px]" onClick={() => setAsset(null)}>Change</button>}</p>
          : <div><p className="label">Asset</p><AssetPicker autoFocus onPick={(a) => { setAsset(a); setError(null); }} /></div>}
        <SelectField label="Notify me when" value={kind} onChange={(e) => { setKind(e.target.value); setError(null); }}>{ALERT_KINDS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}</SelectField>
        {needs && <TextField label={kind === 'pct_move' ? 'Move (%)' : kind === 'valuation' ? 'P/E' : `Price${asset ? ` (${asset.currency})` : ''}`} inputMode="decimal" value={value} onChange={(e) => { setValue(e.target.value); setError(null); }} placeholder={placeholder} error={error} />}
        {!needs && error && <p role="alert" className="text-[13px] text-down">{error}</p>}
        <SelectField label="Deliver to" value={channel} onChange={(e) => setChannel(e.target.value as 'in_app' | 'email')} hint={channel === 'email' && !ws.prefs.notifyEmail ? 'Email notifications are off in Settings; this alert will appear in INRGIFT only until you turn them on.' : undefined}><option value="in_app">INRGIFT notifications</option><option value="email">INRGIFT notifications and email</option></SelectField>
        <TextField label="Note to self" optional value={note} onChange={(e) => setNote(e.target.value)} maxLength={280} placeholder="Why this level matters" />
        <p className="text-xs text-faint">Alerts only send you a notification. Nothing else happens automatically.</p>
      </div>
    </Dialog>
  );
}
