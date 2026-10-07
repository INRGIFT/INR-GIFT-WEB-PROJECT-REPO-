'use client';
import { CheckCircle2, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/primitives';
import { cn } from '@/lib/format';
import { useAccount } from './account-context';

/** Copies text with the Clipboard API, falling back to a hidden selection for browsers that block it. */
async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* fall back */ }
  try {
    const t = document.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    const ok = document.execCommand('copy');
    t.remove();
    return ok;
  } catch { return false; }
}

/** "Copy GIFT ID" → "GIFT ID copied ✓" for a few seconds. Announced to screen readers. */
export function CopyGiftId({ giftId, className }: { giftId: string; className?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  useEffect(() => { if (state !== 'copied') return; const t = setTimeout(() => setState('idle'), 3000); return () => clearTimeout(t); }, [state]);
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button type="button" onClick={async () => setState((await copyText(giftId)) ? 'copied' : 'failed')}
        className={cn('inline-flex h-9 items-center gap-1.5 rounded-ctl border px-3 text-[13px] font-semibold transition-colors', state === 'copied' ? 'border-up/40 bg-up/5 text-up' : 'border-line2 bg-white text-navy hover:border-brand hover:text-brand-ink', className)}>
        {state === 'copied' ? <CheckCircle2 size={15} aria-hidden /> : <Copy size={15} aria-hidden />}{state === 'copied' ? 'GIFT ID copied ✓' : 'Copy GIFT ID'}
      </button>
      <span role="status" aria-live="polite" className="sr-only">{state === 'copied' ? 'GIFT ID copied' : ''}</span>
      {state === 'failed' && <span role="alert" className="text-xs text-down">This browser blocked copying. Select the GIFT ID and copy it.</span>}
    </span>
  );
}

/** The GIFT ID itself: monospaced and selectable in one click. */
export function GiftIdValue({ giftId, className }: { giftId: string; className?: string }) {
  return <span className={cn('select-all font-mono text-[17px] font-bold tracking-[.08em] text-navy', className)}>{giftId}</span>;
}

/**
 * Post-sign-up confirmation (end of onboarding): "Your INRGIFT account is ready." with the GIFT ID, Copy GIFT ID and
 * Continue to INRGIFT. Not a modal: the person can continue at once. Honest when the GIFT ID is not there yet.
 */
export function AccountReadyCard({ onContinue, busy }: { onContinue: () => void; busy?: boolean }) {
  const { profile, loading, error, reload } = useAccount();
  return (
    <div className="rounded-card border border-line bg-white p-6 shadow-card sm:p-7">
      <p className="flex items-center gap-2 text-up"><CheckCircle2 size={22} aria-hidden /><span className="sr-only">Done.</span></p>
      <h1 className="mt-2 text-[24px] font-extrabold">Your INRGIFT account is ready.</h1>
      <div className="mt-5 rounded-card border border-line bg-soft/60 p-4">
        <p className="text-micro font-semibold uppercase tracking-[.1em] text-faint">GIFT ID</p>
        {loading && !profile ? <Skeleton className="mt-2 h-6 w-44" />
          : profile?.giftId ? <div className="mt-1.5 flex flex-wrap items-center gap-3"><GiftIdValue giftId={profile.giftId} /><CopyGiftId giftId={profile.giftId} /></div>
          : error ? <p className="mt-1.5 text-[13px] text-slate2">Your GIFT ID could not load just now. <button type="button" onClick={reload} className="link">Try again</button> or find it later on your profile.</p>
          : <p className="mt-1.5 text-[13px] text-slate2">Your GIFT ID is being assigned. You will find it on your profile.</p>}
        <p className="mt-3 text-[13px] text-slate2">Keep your GIFT ID handy when contacting INRGIFT support.</p>
      </div>
      <button type="button" onClick={onContinue} disabled={busy} className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-ctl bg-brand px-5 font-semibold text-white transition-colors hover:bg-brand-ink disabled:opacity-60 sm:w-auto">Continue to INRGIFT</button>
    </div>
  );
}
