'use client';
import { Bell, Bookmark, Check, Columns2, FileText, LineChart, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button, IconButton, buttonClass } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/format';
import { assetHref } from '@/lib/routes';
import type { Asset } from '@/lib/types';
import { AlertDialog } from './alert-dialog';
import { useWorkspace } from './workspace-context';

type Lite = Pick<Asset, 'id' | 'symbol' | 'name' | 'slug' | 'cls' | 'price' | 'currency'>;
export { ALERT_KINDS, alertLabel } from '@/lib/alerts';

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

export function AlertButton({ asset, compact, primary }: { asset: Lite & { m?: Asset['m'] }; compact?: boolean; primary?: boolean }) {
  const ws = useWorkspace();
  const [open, setOpen] = useState(false);
  const start = () => { if (ws.requireAuth()) setOpen(true); };
  return (
    <>
      {compact ? <IconButton label={`Create alert for ${asset.name}`} onClick={start}><Bell size={16} /></IconButton> : <Button variant={primary ? 'primary' : 'secondary'} onClick={start}><Bell size={17} />Add alert</Button>}
      <AlertDialog open={open} onClose={() => setOpen(false)} asset={asset} />
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
  return (
    <span className="inline-flex">
      <Link href={`${assetHref(asset)}#chart`} aria-label={`Chart ${asset.symbol}`} title={`Chart ${asset.symbol}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors duration-150 hover:bg-hover hover:text-brand-ink"><LineChart size={16} /></Link>
      <Link href={`${assetHref(asset)}#research`} aria-label={`Research ${asset.symbol}`} title={`Research ${asset.symbol}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors duration-150 hover:bg-hover hover:text-brand-ink"><FileText size={16} /></Link>
      <CompareButton asset={asset} compact /><WatchButton asset={asset} compact /><AlertButton asset={asset} compact />
    </span>
  );
}
/** Records an asset or document view in the signed-in user's history. Renders nothing. */
export function TrackView({ kind, title, href }: { kind: 'asset' | 'research'; title: string; href: string }) {
  const { track, ready } = useWorkspace();
  useEffect(() => { if (ready) track(kind, title, href); }, [ready, track, kind, title, href]);
  return null;
}
export function ResearchLink({ asset }: { asset: Lite }) { return <Link href={`${assetHref(asset)}#research`} className={buttonClass('secondary')}>View research</Link>; }
