'use client';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SelectField, TextArea, TextField } from '@/components/ui/field';
import { Callout } from '@/components/ui/primitives';
import { useSession } from '@/features/auth/session-context';
import { CONTACT_TOPICS, type ContactTopic } from '@/lib/contact';

/** Contact form. Validates on the client, then posts to /api/contact, which validates again and stores the message. */
export function ContactForm() {
  const params = useSearchParams();
  const { user } = useSession();
  const raw = params.get('topic') ?? '';
  const known = CONTACT_TOPICS.some(([t]) => t === raw);
  const initialTopic: ContactTopic = known ? (raw as ContactTopic) : /plan/i.test(raw) ? 'plans' : 'support';
  const [f, setF] = useState({ name: user?.name ?? '', email: user?.email ?? '', topic: initialTopic, message: raw && !known ? `About: ${raw.slice(0, 60)}\n\n` : '', website: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'unconfigured' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const [ref, setRef] = useState('');
  const submit = async () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = 'Enter a valid email address.';
    if (f.message.trim().length < 10) e.message = 'Write at least a sentence so we can help.';
    setErrors(e); if (Object.keys(e).length) return;
    setState('sending');
    try {
      const r = await fetch('/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...f, page: document.referrer.slice(0, 300) || undefined }) });
      const j = await r.json();
      if (r.ok) { setRef(j.data.reference); setState('sent'); return; }
      if (j.error?.code === 'NOT_CONFIGURED') { setState('unconfigured'); return; }
      if (j.error?.fields) setErrors(j.error.fields);
      setMsg(j.error?.message ?? 'Your message could not be sent.'); setState('error');
    } catch { setMsg('The network request failed. Check your connection and try again.'); setState('error'); }
  };
  if (state === 'sent') return <Callout tone="success" title="Message received">Reference {ref}. We reply to {f.email} within two working days. For grievances, the timelines on the grievance page apply.</Callout>;
  return (
    <form noValidate onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-4">
      {state === 'error' && <Callout tone="error" title={msg} />}
      {state === 'unconfigured' && <Callout tone="warn" title="This environment does not deliver messages">It runs without a database, so your message was not stored. Nothing was sent. In production, messages are saved for the support team.</Callout>}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Name" autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} error={errors.name} maxLength={80} />
        <TextField label="Email" type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} error={errors.email} />
      </div>
      <SelectField label="Topic" value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value as ContactTopic })}>{CONTACT_TOPICS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</SelectField>
      <TextArea label="Message" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} error={errors.message} rows={7} maxLength={4000} hint="For a data issue, include the asset, the figure and where you saw it." />
      <div aria-hidden className="hidden"><label>Leave this empty<input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} /></label></div>
      <Button type="submit" variant="primary" size="lg" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Send message'}</Button>
      <p className="text-xs text-faint">We use your details only to answer this message. See the <a className="link" href="/legal/privacy">privacy policy</a>.</p>
    </form>
  );
}
