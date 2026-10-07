'use client';
import { track } from '@/lib/telemetry/analytics';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox, CodeField, PasswordField, SelectField, TextField } from '@/components/ui/field';
import { Callout, Skeleton } from '@/components/ui/primitives';
import { Tabs } from '@/components/ui/tabs';
import { AltLink, AuthCard, AuthForm, FormError, maskEmail, maskPhone, PasswordRules, safeNext, useAuthAction, useCooldown, useNext, useRedirectIfSignedIn } from './auth-ui';
import { isEmail, isPhone, normalizePhone, passwordProblem } from './auth-service';
import { useSession } from './session-context';

const COUNTRIES = ['India', 'United Arab Emirates', 'Singapore', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'Japan', 'Saudi Arabia', 'Other'];
const CALLBACK_ERRORS: Record<string, string> = { link: 'That link could not be used. Request a new one below.', expired: 'That link has expired. Request a new one below.' };

/* ------------------------------------ Login ------------------------------------ */
export function LoginForm() {
  const next = useNext();
  const params = useSearchParams();
  const { ready } = useRedirectIfSignedIn(next);
  const err = params.get('error');
  if (!ready) return <AuthSkeleton />;
  return (
    <AuthCard title="Sign in to INRGIFT" lead="Your watchlists, alerts and saved research are waiting." footer={<>New to INRGIFT? <AltLink href={`/signup${next !== '/app' ? `?next=${encodeURIComponent(next)}` : ''}`}>Create an account</AltLink></>}>
      {err && CALLBACK_ERRORS[err] && <Callout tone="warn" className="mb-4" title={CALLBACK_ERRORS[err]} />}
      <Tabs label="Sign-in method" items={[{ id: 'email', label: 'Email and password', content: <EmailLogin next={next} /> }, { id: 'phone', label: 'Phone code', content: <PhoneLogin next={next} /> }]} panelClassName="pt-5" />
    </AuthCard>
  );
}
function EmailLogin({ next }: { next: string }) {
  const { auth, refresh } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const { busy, error, run } = useAuthAction();
  const emailErr = touched && !isEmail(email.trim()) ? 'Enter the email address you signed up with.' : null;
  const pwErr = touched && !password ? 'Enter your password.' : null;
  const submit = () => { setTouched(true); if (!isEmail(email.trim()) || !password) return; void run(async () => { const { mfaRequired } = await auth.signIn(email.trim(), password); if (mfaRequired) router.push(`/mfa?mode=challenge&next=${encodeURIComponent(next)}`); else { await refresh(); router.replace(next); router.refresh(); } }); };
  return (
    <AuthForm onSubmit={submit}>
      <FormError error={error} />
      <TextField label="Email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} error={emailErr} autoFocus />
      <PasswordField label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={pwErr} />
      <div className="flex justify-end"><AltLink href="/forgot-password">Forgot password?</AltLink></div>
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
    </AuthForm>
  );
}
function PhoneLogin({ next }: { next: string }) {
  const { auth, refresh } = useSession();
  const router = useRouter();
  const [phone, setPhone] = useState('+91 ');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const cool = useCooldown(30);
  const { busy, error, setError, run } = useAuthAction();
  const send = () => { const p = normalizePhone(phone); if (!isPhone(p)) return setError('Enter the number with its country code, for example +91 98765 43210.'); void run(async () => { await auth.sendPhoneOtp(p, 'login'); setSentTo(p); cool.start(); }); };
  const verify = () => { if (code.length !== 6) return setError('Enter the six-digit code.'); void run(async () => { const { mfaRequired } = await auth.verifyPhoneOtp(sentTo!, code, 'login'); if (mfaRequired) router.push(`/mfa?mode=challenge&next=${encodeURIComponent(next)}`); else { await refresh(); router.replace(next); router.refresh(); } }); };
  if (!sentTo) return (
    <AuthForm onSubmit={send}>
      <FormError error={error} />
      <TextField label="Mobile number" type="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} hint="Use the number you verified on your account. Standard SMS rates may apply." autoFocus />
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>{busy ? 'Sending…' : 'Send code'}</Button>
    </AuthForm>
  );
  return (
    <AuthForm onSubmit={verify}>
      <p className="text-slate2">We sent a six-digit code to <b className="text-navy">{maskPhone(sentTo)}</b>.</p>
      <FormError error={error} />
      <CodeField value={code} onChange={setCode} autoFocus />
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>{busy ? 'Checking…' : 'Verify and sign in'}</Button>
      <p className="flex flex-wrap items-center justify-between gap-2 text-[13px]"><button type="button" className="link" onClick={() => { setSentTo(null); setCode(''); }}>Use a different number</button><button type="button" className="link disabled:text-faint disabled:no-underline" disabled={cool.left > 0 || busy} onClick={send}>{cool.left > 0 ? `Resend in ${cool.left}s` : 'Resend code'}</button></p>
    </AuthForm>
  );
}

/* ------------------------------------ Sign up ------------------------------------ */
export function SignupForm() {
  const { auth } = useSession();
  const router = useRouter();
  const next = useNext('/onboarding');
  const { ready } = useRedirectIfSignedIn('/app');
  const [f, setF] = useState({ name: '', email: '', country: 'India', password: '', terms: false });
  const [touched, setTouched] = useState(false);
  const { busy, error, run } = useAuthAction();
  const errs = { name: !f.name.trim() ? 'Enter your name.' : null, email: !isEmail(f.email.trim()) ? 'Enter a valid email address.' : null, password: passwordProblem(f.password), terms: !f.terms ? 'Accept the terms to continue.' : null };
  const show = (k: keyof typeof errs) => (touched ? errs[k] : null);
  const submit = () => { setTouched(true); if (Object.values(errs).some(Boolean)) return; track('signup_started', {}); void run(async () => { await auth.signUp({ email: f.email.trim(), password: f.password, name: f.name.trim(), country: f.country }); track('signup_completed', {}); router.push(`/verify?email=${encodeURIComponent(f.email.trim())}&next=${encodeURIComponent(next)}`); }); };
  if (!ready) return <AuthSkeleton />;
  return (
    <AuthCard title="Create your account" lead="Free. Research tools stay open without an account; an account keeps your work." step={[1, 4, 'Account']} footer={<>Already have an account? <AltLink href="/login">Sign in</AltLink></>}>
      <AuthForm onSubmit={submit}>
        <FormError error={error} />
        <TextField label="Full name" autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} error={show('name')} maxLength={80} autoFocus />
        <TextField label="Email" type="email" autoComplete="email" inputMode="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} error={show('email')} />
        <SelectField label="Country of residence" value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })}>{COUNTRIES.map((c) => <option key={c}>{c}</option>)}</SelectField>
        <div><PasswordField label="Password" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} error={touched ? errs.password : null} /><PasswordRules value={f.password} /></div>
        <div><Checkbox checked={f.terms} onChange={(v) => setF({ ...f, terms: v })} label={<>I accept the <AltLink href="/legal/terms">terms</AltLink> and <AltLink href="/legal/privacy">privacy policy</AltLink>, and understand INRGIFT does not give investment advice.</>} />{show('terms') && <p role="alert" className="mt-1 text-[13px] text-down">{errs.terms}</p>}</div>
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</Button>
      </AuthForm>
    </AuthCard>
  );
}

/* --------------------------------- Verify email --------------------------------- */
export function VerifyEmail() {
  const { auth, user, refresh } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') ?? user?.email ?? '';
  const next = safeNext(params.get('next'), '/onboarding');
  const cool = useCooldown(45);
  const [sent, setSent] = useState(false);
  const { busy, error, run } = useAuthAction();
  useEffect(() => { if (user?.emailVerified) router.replace(`/verify-phone?next=${encodeURIComponent(next)}`); }, [user, router, next]);
  return (
    <AuthCard title="Check your email" step={[2, 4, 'Verify email']} lead={email ? <>We sent a verification link to <b className="text-navy">{maskEmail(email)}</b>. Open it on this device to continue.</> : 'We sent a verification link to your email address.'}
      footer={<>Wrong address? <AltLink href="/signup">Start again</AltLink></>}>
      <div className="space-y-4">
        <FormError error={error} />
        {sent && <Callout tone="success" title="A new link is on its way." >Links expire after one hour. Check spam if it has not arrived in a few minutes.</Callout>}
        {auth.mode === 'demo' && <Button variant="primary" size="lg" className="w-full" disabled={busy} onClick={() => run(async () => { await auth.confirmEmail?.(); track('verification_completed', { step: 'email' }); await refresh(); router.push(`/verify-phone?next=${encodeURIComponent(next)}`); })}>Open the verification link (demo)</Button>}
        <Button size="lg" className="w-full" disabled={!email || cool.left > 0 || busy} onClick={() => run(async () => { await auth.resendEmail(email); setSent(true); cool.start(); })}>{cool.left > 0 ? `Resend available in ${cool.left}s` : 'Resend the link'}</Button>
      </div>
    </AuthCard>
  );
}

/* --------------------------------- Verify phone --------------------------------- */
export function VerifyPhone() {
  const { auth, user, loading, refresh } = useSession();
  const router = useRouter();
  const next = useNext('/onboarding');
  const [phone, setPhone] = useState('+91 ');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const cool = useCooldown(30);
  const { busy, error, setError, run } = useAuthAction();
  useEffect(() => { if (!loading && !user) router.replace(`/login?next=${encodeURIComponent('/verify-phone')}`); }, [user, loading, router]);
  const after = `/mfa?mode=enrol&next=${encodeURIComponent(next)}`;
  if (loading || !user) return <AuthSkeleton />;
  const send = () => { const p = normalizePhone(phone); if (!isPhone(p)) return setError('Enter the number with its country code, for example +91 98765 43210.'); void run(async () => { await auth.sendPhoneOtp(p, 'verify'); setSentTo(p); cool.start(); }); };
  const verify = () => { if (code.length !== 6) return setError('Enter the six-digit code.'); void run(async () => { await auth.verifyPhoneOtp(sentTo!, code, 'verify'); track('verification_completed', { step: 'phone' }); await refresh(); router.push(after); }); };
  return (
    <AuthCard title="Verify your mobile number" step={[3, 4, 'Verify phone']} lead="A verified number lets you sign in with a code and helps recover the account." footer={<button type="button" className="link" onClick={() => router.push(after)}>Skip for now</button>}>
      {user.phoneVerified && !sentTo ? <div className="space-y-4"><Callout tone="success" title={`${maskPhone(user.phone ?? '')} is already verified.`} /><Button variant="primary" size="lg" className="w-full" onClick={() => router.push(after)}>Continue</Button></div> : !sentTo ? (
        <AuthForm onSubmit={send}>
          <FormError error={error} />
          <TextField label="Mobile number" type="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} hint="Include the country code. We only use it for sign-in codes and security notices." autoFocus />
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>{busy ? 'Sending…' : 'Send code'}</Button>
        </AuthForm>
      ) : (
        <AuthForm onSubmit={verify}>
          <p className="text-slate2">Enter the code sent to <b className="text-navy">{maskPhone(sentTo)}</b>.</p>
          <FormError error={error} />
          <CodeField value={code} onChange={setCode} autoFocus />
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>{busy ? 'Verifying…' : 'Verify number'}</Button>
          <p className="flex flex-wrap justify-between gap-2 text-[13px]"><button type="button" className="link" onClick={() => { setSentTo(null); setCode(''); }}>Change number</button><button type="button" className="link disabled:text-faint disabled:no-underline" disabled={cool.left > 0 || busy} onClick={send}>{cool.left > 0 ? `Resend in ${cool.left}s` : 'Resend code'}</button></p>
        </AuthForm>
      )}
    </AuthCard>
  );
}

/* ------------------------------------ MFA ------------------------------------ */
export function MfaPage() {
  const { auth, user, loading, refresh } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const mode = params.get('mode') === 'challenge' ? 'challenge' : 'enrol';
  const next = safeNext(params.get('next'), mode === 'enrol' ? '/onboarding' : '/app');
  const [enrol, setEnrol] = useState<{ factorId: string; secret: string; qr?: string } | null>(null);
  const [factor, setFactor] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const { busy, error, setError, run } = useAuthAction();
  useEffect(() => {
    if (loading) return;
    if (mode === 'challenge') { void auth.mfaFactorId().then((id) => { if (id) setFactor(id); else router.replace('/login'); }); return; }
    if (!user) { router.replace(`/login?next=${encodeURIComponent('/mfa?mode=enrol')}`); return; }
    if (user.mfaEnrolled) { router.replace(next); return; }
    void run(async () => setEnrol(await auth.mfaEnroll()));
  }, [loading, mode, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const verify = () => { if (code.length !== 6) return setError('Enter the six-digit code from your authenticator app.'); void run(async () => { await auth.mfaVerify(mode === 'challenge' ? factor! : enrol!.factorId, code); if (mode !== 'challenge') track('verification_completed', { step: 'mfa' }); await refresh(); router.replace(next); router.refresh(); }); };
  if (mode === 'challenge') return (
    <AuthCard title="Two-step verification" lead="Open your authenticator app and enter the current code for INRGIFT." footer={<>Lost access to your authenticator? <AltLink href="/support">Contact support</AltLink></>}>
      {!factor ? <AuthSkeleton /> : (
        <AuthForm onSubmit={verify}>
          <FormError error={error} />
          <CodeField label="Authenticator code" value={code} onChange={setCode} autoFocus />
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>{busy ? 'Verifying…' : 'Verify'}</Button>
          <button type="button" className="link text-[13px]" onClick={async () => { await auth.signOut(); router.replace('/login'); }}>Cancel and sign out</button>
        </AuthForm>
      )}
    </AuthCard>
  );
  return (
    <AuthCard title="Protect your account" step={[4, 4, 'Two-step verification']} lead="Add an authenticator app such as Google Authenticator, Microsoft Authenticator or 1Password. You will enter a code from it when you sign in." footer={<button type="button" className="link" onClick={() => router.push(next)}>Skip for now. You can enrol later in Security.</button>}>
      {!enrol ? (error ? <FormError error={error} /> : <AuthSkeleton />) : (
        <AuthForm onSubmit={verify}>
          <ol className="space-y-4 text-[14px]">
            <li><p className="font-semibold">1. Scan this code with your app</p>
              {enrol.qr ? <img src={enrol.qr} alt="QR code for your authenticator app" width={168} height={168} className="mt-2 rounded-lg border border-line" /> : <p className="mt-1 text-slate2">Your app can also add the account from the key below.</p>}
            </li>
            <li><p className="font-semibold">2. Or enter this key by hand</p><code className="num mt-1.5 block select-all break-all rounded-lg bg-soft px-3 py-2 text-[13px] tracking-wider">{enrol.secret.replace(/(.{4})/g, '$1 ').trim()}</code></li>
            <li><p className="font-semibold">3. Enter the six-digit code it shows</p></li>
          </ol>
          <FormError error={error} />
          <CodeField label="Authenticator code" value={code} onChange={setCode} />
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>{busy ? 'Verifying…' : 'Turn on two-step verification'}</Button>
        </AuthForm>
      )}
    </AuthCard>
  );
}

/* ------------------------------- Password recovery ------------------------------- */
export function ForgotPassword() {
  const { auth } = useSession();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const cool = useCooldown(45);
  const { busy, error, setError, run } = useAuthAction();
  const submit = () => { if (!isEmail(email.trim())) return setError('Enter the email address on your account.'); void run(async () => { await auth.resetPassword(email.trim()); setSent(true); cool.start(); }); };
  return (
    <AuthCard title="Reset your password" lead={sent ? <>If an account uses <b className="text-navy">{maskEmail(email.trim())}</b>, a reset link is on its way. It expires in one hour.</> : 'Enter your email and we will send a link to choose a new password.'} footer={<>Remembered it? <AltLink href="/login">Sign in</AltLink></>}>
      {!sent ? (
        <AuthForm onSubmit={submit}>
          <FormError error={error} />
          <TextField label="Email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</Button>
        </AuthForm>
      ) : (
        <div className="space-y-3">
          <FormError error={error} />
          {auth.mode === 'demo' && <a href="/reset-password" className="inline-flex h-11 w-full items-center justify-center rounded-ctl bg-brand px-5 font-medium text-white hover:bg-brand-ink">Open the reset link (demo)</a>}
          <Button size="lg" className="w-full" disabled={cool.left > 0 || busy} onClick={submit}>{cool.left > 0 ? `Resend available in ${cool.left}s` : 'Send again'}</Button>
        </div>
      )}
    </AuthCard>
  );
}
export function ResetPassword() {
  const { auth, refresh, user, loading } = useSession();
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState(false);
  const [done, setDone] = useState(false);
  const { busy, error, run } = useAuthAction();
  const problem = passwordProblem(pw), mismatch = confirm && pw !== confirm ? 'The two passwords do not match.' : null;
  const submit = () => { setTouched(true); if (problem || !confirm || mismatch) return; void run(async () => { await auth.updatePassword(pw); await refresh(); setDone(true); }); };
  if (!loading && !user && auth.mode === 'supabase') return <AuthCard title="This reset link has expired" lead="Reset links work once and expire after one hour."><a href="/forgot-password" className="inline-flex h-11 w-full items-center justify-center rounded-ctl bg-brand px-5 font-medium text-white hover:bg-brand-ink">Request a new link</a></AuthCard>;
  if (done) return <AuthCard title="Password changed" lead="Use your new password the next time you sign in. Other devices stay signed in until their session ends."><Button variant="primary" size="lg" className="w-full" onClick={() => router.push('/app')}>Go to your workspace</Button></AuthCard>;
  return (
    <AuthCard title="Choose a new password" lead="This link signs you in for this change only.">
      <AuthForm onSubmit={submit}>
        <FormError error={error} />
        <div><PasswordField label="New password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} error={touched ? problem : null} autoFocus /><PasswordRules value={pw} /></div>
        <PasswordField label="Confirm new password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={touched ? (mismatch ?? (!confirm ? 'Type the password again.' : null)) : null} />
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>{busy ? 'Saving…' : 'Save new password'}</Button>
      </AuthForm>
    </AuthCard>
  );
}
export function AuthSkeleton() { return <div className="w-full max-w-[420px] space-y-3" role="status" aria-label="Loading"><Skeleton className="h-7 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="mt-6 h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-11 w-full" /></div>; }
