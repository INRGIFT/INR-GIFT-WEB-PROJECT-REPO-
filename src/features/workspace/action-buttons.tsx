'use client';
import { Bell, Bookmark, Check, Columns2, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button, IconButton, buttonClass } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { InlineError } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { cn, money } from '@/lib/format';
import { assetHref } from '@/lib/routes';
import type { Asset } from '@/lib/types';
import { useWorkspace } from './workspace-context';

type Lite = Pick<Asset, 'id' | 'symbol' | 'name' | 'slug' | 'cls' | 'price' | 'currency'>;
export const ALERT_KINDS = [['price_above', 'Price rises above', true], ['price_below', 'Price falls below', true], ['pct_move', 'Daily move exceeds (%)', true], ['high_52w', 'Reaches a 52-week high', false], ['low_52w', 'Reaches a 52-week low', false], ['valuation', 'P/E falls below', true], ['earnings', 'Earnings date is announced', false], ['dividend', 'Dividend is declared', false], ['news', 'News is published', false], ['research', 'Research is updated', false]] as const;
export const alertLabel = (kind: string, threshold: number | null) => { const k = ALERT_KINDS.find((x) => x[0] === kind); return k ? `${k[1]}${threshold != null ? ` ${threshold}` : ''}` : kind; };

export function WatchButton({ asset, compact }: { asset: Lite; compact?: boolean }) {
  const ws = useWorkspace();
  const on = ws.isWatched(asset.id);
  const [pulse, setPulse] = useState(false);
  const click = () => { setPulse(true); setTimeout(() => setPulse(false), 300); void ws.toggleWatch(asset); };
  const icon = <Star size={compact ? 16 : 17} className={cn(pulse && 'animate-confirm')} fill={on ? 'currentColor' : 'none'} />;
  if (compact) return <IconButton label={on ? `Remove ${asset.name} from watchlist` : `Add ${asset.name} to watchlist`} aria-pressed={on} active={on} onClick={click}>{icon}</IconButton>;
  return <Button aria-pressed={on} onClick={click} className={on ? 'border-brand bg-brand-soft text-brand-ink' : ''}>{icon}{on ? 'Watching' : 'Watch'}</Button>;
}

const CMP_KEY = 'inrgift.compare';
export const readCompare = (): string[] => { try { return JSON.parse(sessionStorage.getItem(CMP_KEY) ?? '[]'); } catch { return []; } };
export const writeCompare = (slugs: string[]) => sessionStorage.setItem(CMP_KEY, JSON.stringify(slugs.slice(0, 4)));
/** Adds to the compare tray (kept for the browser session) and, in full size, opens Compare. */
export function CompareButton({ asset, compact }: { asset: Lite; compact?: boolean }) {
  const toast = useToast();
  const router = useRouter();
  const add = (go: boolean) => {
    const cur = readCompare();
    if (!cur.includes(asset.slug)) {
      if (cur.length >= 4) { toast('Compare holds four assets. Remove one first.'); if (!go) return; }
      else { writeCompare([...cur, asset.slug]); if (!go) toast(`${asset.symbol} added to compare (${cur.length + 1} of 4)`); }
    } else if (!go) toast(`${asset.symbol} is already in compare`);
    if (go) router.push(`/discover/compare?s=${readCompare().join(',')}`);
  };
  if (compact) return <IconButton label={`Add ${asset.name} to compare`} onClick={() => add(false)}><Columns2 size={16} /></IconButton>;
  return <Button onClick={() => add(true)}><Columns2 size={17} />Compare</Button>;
}

export function AlertButton({ asset, compact, primary }: { asset: Lite; compact?: boolean; primary?: boolean }) {
  const ws = useWorkspace();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<string>('price_above');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const needs = ALERT_KINDS.find((k) => k[0] === kind)?.[2] ?? false;
  const start = () => { if (ws.requireAuth()) { setError(''); setOpen(true); } };
  const save = async () => {
    const n = Number(value);
    if (needs && (!value.trim() || Number.isNaN(n) || n <= 0)) return setError('Enter a number greater than zero.');
    const saved = await ws.add('alerts', { instrument_id: asset.id, kind, threshold: needs ? n : null, status: 'active', channel: 'in_app', last_triggered_at: null });
    if (saved) { setOpen(false); setValue(''); toast('Alert created'); }
  };
  return (
    <>
      {compact ? <IconButton label={`Create alert for ${asset.name}`} onClick={start}><Bell size={16} /></IconButton> : <Button variant={primary ? 'primary' : 'secondary'} onClick={start}><Bell size={17} />Add alert</Button>}
      <Dialog open={open} onClose={() => setOpen(false)} title={`Alert for ${asset.symbol}`} footer={<><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" onClick={save}>Create alert</Button></>}>
        <p className="text-slate2">{asset.name}{asset.price != null && <> · last {money(asset.price, asset.currency)}</>}</p>
        <label className="label mt-4" htmlFor="alert-kind">Notify me when</label>
        <select id="alert-kind" className="field" value={kind} onChange={(e) => { setKind(e.target.value); setError(''); }}>{ALERT_KINDS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}</select>
        {needs && (<><label className="label mt-4" htmlFor="alert-value">Value</label><input id="alert-value" className="field" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder={kind.startsWith('price') && asset.price != null ? String(Math.round(asset.price * 1.05 * 100) / 100) : '5'} aria-invalid={Boolean(error)} />{error && <InlineError>{error}</InlineError>}</>)}
        <p className="mt-3 text-xs text-faint">Alerts notify you inside INRGIFT. They never place an order.</p>
      </Dialog>
    </>
  );
}

/** Saves a research document or asset page to Saved Research. */
export function SaveButton({ refType, refId, title, href }: { refType: 'document' | 'asset'; refId: string; title: string; href: string }) {
  const ws = useWorkspace();
  const toast = useToast();
  const existing = ws.data.saved_research.find((r) => r.ref_type === refType && r.ref_id === refId);
  const click = async () => {
    if (!ws.requireAuth()) return;
    if (existing) { await ws.remove('saved_research', existing.id); toast('Removed from saved research'); return; }
    if (await ws.add('saved_research', { ref_type: refType, ref_id: refId, title, href, tags: [] })) toast('Saved to your research');
  };
  return <Button aria-pressed={Boolean(existing)} onClick={click} className={existing ? 'border-brand bg-brand-soft text-brand-ink' : ''}>{existing ? <Check size={17} /> : <Bookmark size={17} />}{existing ? 'Saved' : 'Save'}</Button>;
}
export function RowActions({ asset }: { asset: Lite }) {
  return <span className="inline-flex"><CompareButton asset={asset} compact /><WatchButton asset={asset} compact /><AlertButton asset={asset} compact /></span>;
}
/** Records an asset or document view in the signed-in user's history. Renders nothing. */
export function TrackView({ kind, title, href }: { kind: 'asset' | 'research'; title: string; href: string }) {
  const { track, ready } = useWorkspace();
  useEffect(() => { if (ready) track(kind, title, href); }, [ready, track, kind, title, href]);
  return null;
}
export function ResearchLink({ asset }: { asset: Lite }) { return <Link href={`${assetHref(asset)}#research`} className={buttonClass('secondary')}>View research</Link>; }
