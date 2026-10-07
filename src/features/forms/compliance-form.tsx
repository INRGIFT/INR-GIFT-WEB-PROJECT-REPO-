'use client';
import { useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox, SelectField, TextArea, TextField } from '@/components/ui/field';
import { Callout } from '@/components/ui/primitives';
import { cn } from '@/lib/format';
import { FORMS, validateForm, type FormKind, type FormValues } from './definitions';

/**
 * Support, grievance and account-closure form (definitions.ts). Checks in the browser, then posts to
 * /api/forms/<kind>, which checks again and emails the support inbox through Resend. The success message is shown only
 * after the server accepted the submission; a closure request is described as submitted, never as done.
 */
export function ComplianceForm({ kind, successTitle, successText, initial = {} }: { kind: FormKind; successTitle: string; successText: string; initial?: FormValues }) {
  const def = FORMS[kind];
  const params = useSearchParams();
  const topic = params.get('topic');
  const startCategory: FormValues = kind === 'support' && topic && def.fields.find((f) => f.name === 'category')?.options?.some(([o]) => o === topic) ? { category: topic } : {};
  const [v, setV] = useState<FormValues>(() => ({ ...Object.fromEntries(def.fields.map((f) => [f.name, f.type === 'checkbox' ? false : ''])), ...initial, ...startCategory }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [ref, setRef] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const started = useRef(Date.now());
  const formRef = useRef<HTMLFormElement>(null);
  const set = (k: string, val: string | boolean) => { setV((x) => ({ ...x, [k]: val })); if (errors[k]) setErrors((e) => { const n = { ...e }; delete n[k]; return n; }); };

  const submit = async () => {
    const check = validateForm(kind, v);
    setErrors(check.errors);
    if (Object.keys(check.errors).length) {
      setState('error'); setMessage('Some fields need attention.');
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"] input')?.focus());
      return;
    }
    setState('sending'); setMessage('');
    try {
      const r = await fetch(`/api/forms/${kind}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ ...check.values, website: honeypot, elapsedMs: Date.now() - started.current }) });
      const j = (await r.json().catch(() => ({}))) as { data?: { reference?: string }; error?: { message?: string; fields?: Record<string, string> } };
      if (r.ok && j.data?.reference) { setRef(j.data.reference); setState('sent'); return; }
      if (j.error?.fields) setErrors(j.error.fields);
      setMessage(j.error?.message ?? 'This could not be sent. Please try again, or email support@inrgift.com.'); setState('error');
    } catch { setMessage('The network request failed. Check your connection and try again, or email support@inrgift.com.'); setState('error'); }
  };

  if (state === 'sent') return (
    <div role="status" aria-live="polite"><Callout tone="success" title={successTitle}><p>{successText}</p><p className="mt-1">Reference: <b className="num">{ref}</b>. Keep it for any follow-up.</p></Callout></div>
  );
  return (
    <form ref={formRef} noValidate onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-4" aria-describedby={state === 'error' ? `${kind}-form-error` : undefined}>
      {state === 'error' && message && <div id={`${kind}-form-error`}><Callout tone="error" title={message} /></div>}
      <div className="grid gap-4 sm:grid-cols-2">
        {def.fields.map((f) => {
          const err = errors[f.name] ?? null;
          const wide = cn((f.wide || f.type === 'checkbox' || f.type === 'textarea') && 'sm:col-span-2');
          if (f.type === 'checkbox') return (
            <div key={f.name} className={wide} data-invalid={err ? 'true' : undefined}>
              <Checkbox checked={Boolean(v[f.name])} onChange={(x) => set(f.name, x)} label={<>{f.label}{f.required && <span className="sr-only"> (required)</span>}</>} />
              {err && <p role="alert" className="mt-1 text-[13px] text-down">{err}</p>}
            </div>
          );
          if (f.type === 'select') return (
            <SelectField key={f.name} className={wide} label={f.label} hint={f.hint} error={err} required={f.required} value={String(v[f.name])} onChange={(e) => set(f.name, e.target.value)}>
              <option value="">{f.required ? 'Choose…' : 'Choose (optional)'}</option>
              {f.options!.map(([o, l]) => <option key={o} value={o}>{l}</option>)}
            </SelectField>
          );
          if (f.type === 'textarea') return <TextArea key={f.name} className={wide} label={f.label} hint={f.hint} error={err} required={f.required} rows={7} maxLength={f.max} value={String(v[f.name])} onChange={(e) => set(f.name, e.target.value)} />;
          return <TextField key={f.name} className={wide} label={f.label} hint={f.hint} error={err} required={f.required} type={f.type} autoComplete={f.autoComplete} inputMode={f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : undefined} maxLength={f.max} value={String(v[f.name])} onChange={(e) => set(f.name, e.target.value)} />;
        })}
      </div>
      <div aria-hidden className="hidden"><label>Leave this empty<input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} /></label></div>
      <Button type="submit" variant="primary" size="lg" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : def.submitLabel}</Button>
    </form>
  );
}
