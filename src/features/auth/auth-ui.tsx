'use client';
import { Check, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Callout } from '@/components/ui/primitives';
import { cn } from '@/lib/format';
import { AuthError, DEMO_CODE } from './auth-service';
import { safeReturnPath } from '@/lib/return-url';
import { GATE_PATH, type Gate } from './policy';
import { useSession } from './session-context';

/** Same-origin path (with query) from `?next=`, or the fallback. One rule for the whole site: src/lib/return-url.ts. */
export const safeNext = (raw: string | null | undefined, fallback = '/app') => safeReturnPath(raw, fallback);
export function useNext(fallback = '/app') { const p = useSearchParams(); return safeNext(p.get('next'), fallback); }
/** Where a session goes next: the destination when activated, otherwise the step it still has to complete. */
export function gateHref(gate: Gate, next = '/app'): string {
  if (gate === 'ok') return next;
  return `${GATE_PATH[gate]}${next !== '/app' ? `?next=${encodeURIComponent(next)}` : ''}`;
}
export const maskEmail = (e: string) => { const [u, d] = e.split('@'); return d ? `${u.slice(0, 2)}${'•'.repeat(Math.max(1, u.length - 2))}@${d}` : e; };
export const maskPhone = (p: string) => (p.length > 6 ? `${p.slice(0, 3)} ••••• ${p.slice(-3)}` : p);
export const authMessage = (e: unknown) => (e instanceof AuthError ? e.message : 'That did not work. Check your connection and try again.');

/** Countdown before a code or email can be sent again. */
export function useCooldown(seconds = 30) {
  const [left, setLeft] = useState(0);
  useEffect(() => { if (left <= 0) return; const t = setTimeout(() => setLeft((s) => s - 1), 1000); return () => clearTimeout(t); }, [left]);
  return { left, start: useCallback(() => setLeft(seconds), [seconds]) };
}
/** Runs an async auth step with a busy flag and a friendly error. */
export function useAuthAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async (fn: () => Promise<void>) => { setBusy(true); setError(null); try { await fn(); } catch (e) { setError(authMessage(e)); } finally { setBusy(false); } }, []);
  return { busy, error, setError, run };
}
/**
 * Sends visitors who arrive already signed in on to their destination, or to the verification step their session
 * still needs, instead of showing a sign-in form. A session that must sign in with the password again (gate 'login',
 * for example after a recovery link) stays on the form. Only the state at arrival counts: once the form itself signs
 * someone in, the form decides where to go next.
 */
export function useRedirectIfSignedIn(to: string) {
  const { account, loading } = useSession();
  const router = useRouter();
  const decided = useRef<string | 'stay' | null>(null);
  if (!loading && decided.current === null) decided.current = account && account.gate !== 'login' ? gateHref(account.gate, to) : 'stay';
  useEffect(() => { if (decided.current && decided.current !== 'stay') router.replace(decided.current); }, [loading, router]);
  return { ready: decided.current === 'stay' };
}

export function AuthCard({ title, lead, children, footer, step }: { title: string; lead?: ReactNode; children: ReactNode; footer?: ReactNode; step?: [number, number, string] }) {
  return (
    <div className="w-full max-w-[420px] animate-fade-up">
      {step && <p className="mb-3 text-xs font-semibold text-brand-ink">Step {step[0]} of {step[1]} · {step[2]}</p>}
      <h1 className="text-[26px] font-extrabold leading-tight">{title}</h1>
      {lead && <p className="mt-1.5 text-slate2">{lead}</p>}
      <DemoNotice />
      <div className="mt-6">{children}</div>
      {footer && <div className="mt-6 border-t border-line pt-5 text-[13px] text-slate2">{footer}</div>}
    </div>
  );
}
export function AuthForm({ onSubmit, children, className }: { onSubmit: () => void; children: ReactNode; className?: string }) {
  return <form noValidate className={cn('space-y-4', className)} onSubmit={(e: FormEvent) => { e.preventDefault(); onSubmit(); }}>{children}</form>;
}
export function FormError({ error }: { error: string | null }) { return error ? <Callout tone="error" title={error} /> : null; }
function DemoNotice() {
  const { auth } = useSession();
  if (auth.mode !== 'demo') return null;
  return <p className="mt-4 rounded-ctl border border-warn/30 bg-warn/5 px-3 py-2 text-[13px] text-slate2"><b className="text-warn">Demo mode.</b> Accounts and data stay in this browser and no email or SMS is sent. Every email and SMS code is <span className="num font-semibold text-navy">{DEMO_CODE}</span>.</p>;
}
/** Live password rules, shown as a checklist with text, not colour alone. */
export function PasswordRules({ value }: { value: string }) {
  const rules: [string, boolean][] = [['At least 10 characters', value.length >= 10], ['A number', /\d/.test(value)], ['A symbol', /[^\w\s]/.test(value)]];
  return <ul className="mt-2 grid grid-cols-1 gap-1 text-xs sm:grid-cols-3" aria-label="Password requirements">{rules.map(([l, ok]) => <li key={l} className={cn('flex items-center gap-1', ok ? 'text-up' : 'text-faint')}>{ok ? <Check size={13} aria-hidden /> : <X size={13} aria-hidden />}{l}<span className="sr-only">{ok ? ' met' : ' not met'}</span></li>)}</ul>;
}
export function AltLink({ children, href }: { children: ReactNode; href: string }) { return <Link href={href} className="link font-semibold">{children}</Link>; }
