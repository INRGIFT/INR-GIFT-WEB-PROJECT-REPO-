'use client';
import { track } from '@/lib/telemetry/analytics';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox, CodeField, PasswordField, SelectField, TextField } from '@/components/ui/field';
import { Callout, Skeleton } from '@/components/ui/primitives';
import { AltLink, AuthCard, AuthForm, FormError, gateHref, maskEmail, maskPhone, PasswordRules, safeNext, useAuthAction, useCooldown, useNext, useRedirectIfSignedIn } from './auth-ui';
import { AuthError, isEmail, passwordProblem, type PhoneChallenge, type SmsPurpose } from './auth-service';
import { validateSignup, type SignupErrors, type SignupInput } from './policy';
import { emailOtpMinutes, smsSecondFactor } from '@/lib/config';
import { useSession } from './session-context';
import { COUNTRIES } from './countries';
import type { OAuthAvailability, OAuthProvider } from './oauth-providers';

const NOTICES: Record<string, [tone: 'warn' | 'success', text: string]> = {
  link: ['warn', 'That link could not be used. Request a new one below.'],
  expired: ['warn', 'That link has expired. Request a new one below.'],
  verified: ['success', smsSecondFactor ? 'Email verified. Sign in with your email and password to verify your mobile number.' : 'Email verified. Sign in with your email and password.'],
  oauth: ['warn', 'Sign-in with Google or Apple did not complete. Try again, or sign in with your email and password.'],
  'oauth-google': ['warn', 'Google sign-in did not complete. Try again, or sign in with your email and password.'],
  'oauth-apple': ['warn', 'Apple sign-in did not complete. Try again, or sign in with your email and password.'],
  reset: ['success', smsSecondFactor ? 'Password changed and other sessions signed out. Sign in with your new password; we will text a code to your phone.' : 'Password changed and other sessions signed out. Sign in with your new password.'],
};
const STEPS = 3;
/**
 * The pending SMS challenge for this tab (opaque id + masked number only), so coming back to the page within the
 * resend cooldown still shows the code box. Not security state: the server checks user, session, expiry and attempts.
 */
const PENDING = 'inrgift.sms.pending';
const savePending = (c: PhoneChallenge | null) => { try { if (c) sessionStorage.setItem(PENDING, JSON.stringify({ ...c, at: Date.now() })); else sessionStorage.removeItem(PENDING); } catch { /* storage unavailable */ } };
const loadPending = (purpose: SmsPurpose): PhoneChallenge | null => {
  try { const c = JSON.parse(sessionStorage.getItem(PENDING) ?? 'null') as (PhoneChallenge & { at: number }) | null; return c && c.purpose === purpose && Date.now() - c.at < 10 * 60_000 ? c : null; } catch { return null; }
};

/* ----------------------------------- Google, Apple ----------------------------------- */
const OAUTH_BUTTON: Record<OAuthProvider, { name: string; icon: string }> = { google: { name: 'Google', icon: '/brand/google-g.svg' }, apple: { name: 'Apple', icon: '/brand/apple-logo.svg' } };
/**
 * "Continue with Google" / "Continue with Apple" through Supabase OAuth (src/features/auth/auth-service.ts), above the
 * email form. Both buttons are always shown (owner decision, 8 Oct 2026). A provider that Supabase reports switched off
 * (src/features/auth/oauth-providers.ts) is never called: its button explains that this sign-in is not available yet,
 * and no session, user or redirect is created. A first social sign-in completes the same profile as an email sign-up
 * (name if the provider withheld it, mobile number, password, country, terms) before anything opens.
 */
function SocialSignIn({ next, oauth }: { next: string; oauth: OAuthAvailability }) {
  const { auth, refresh } = useSession();
  const router = useRouter();
  const [pending, setPending] = useState<OAuthProvider | null>(null);
  const { busy, error, setError, run } = useAuthAction();
  const providers = ['google', 'apple'] as const;
  const go = (provider: OAuthProvider) => {
    if (!oauth[provider]) { setError(`${OAUTH_BUTTON[provider].name} sign-in is not available yet. Sign in or create your account with your email and password.`); return; }
    setPending(provider);
    void run(async () => {
      try {
        await auth.signInWithOAuth(provider, next);
        if (auth.mode === 'demo') { await refresh(); const u = await auth.getUser(); router.replace(gateHref(u?.gate ?? 'login', next)); }
      } finally { setPending(null); }
    });
  };
  return (
    <div className="mb-5">
      <div className="space-y-2.5">
        <FormError error={error} />
        {providers.map((p) => (
          <Button key={p} type="button" size="lg" className="w-full" disabled={busy} onClick={() => go(p)}>
            <img src={OAUTH_BUTTON[p].icon} alt="" width={18} height={18} aria-hidden />{pending === p ? `Opening ${OAUTH_BUTTON[p].name}…` : `Continue with ${OAUTH_BUTTON[p].name}`}
          </Button>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-3 text-xs font-medium text-faint"><span aria-hidden className="h-px flex-1 bg-line" />Or continue with email<span aria-hidden className="h-px flex-1 bg-line" /></div>
    </div>
  );
}

/* ------------------------------------ Login ------------------------------------ */
/** Google, Apple (when enabled), or email + password. With the SMS second factor on, an SMS code follows either way. */
export function LoginForm({ oauth = { google: false, apple: false } }: { oauth?: OAuthAvailability }) {
  const next = useNext();
  const params = useSearchParams();
  const { ready } = useRedirectIfSignedIn(next);
  const { auth, refresh } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const { busy, error, run } = useAuthAction();
  const noticeKey = params.get('error') ?? params.get('notice') ?? '';
  const provider = params.get('provider');
  const notice = NOTICES[noticeKey === 'oauth' && (provider === 'google' || provider === 'apple') ? `oauth-${provider}` : noticeKey];
  const emailErr = touched && !isEmail(email.trim()) ? 'Enter the email address you signed up with.' : null;
  const pwErr = touched && !password ? 'Enter your password.' : null;
  const submit = () => {
    setTouched(true); setUnconfirmed(false);
    if (!isEmail(email.trim()) || !password) return;
    void run(async () => {
      try {
        const gate = await auth.signIn(email.trim(), password);
        await refresh();
        // Without the SMS step, the first sign-in after the emailed link is where a new account meets onboarding.
        const firstSignIn = !smsSecondFactor && gate === 'ok' && params.get('notice') === 'verified';
        router.replace(firstSignIn ? `/onboarding${next !== '/app' ? `?next=${encodeURIComponent(next)}` : ''}` : gateHref(gate, next));
      } catch (e) { if (e instanceof AuthError && e.code === 'EMAIL_UNCONFIRMED') setUnconfirmed(true); throw e; }
    });
  };
  if (!ready) return <AuthSkeleton />;
  return (
    <AuthCard title="Sign in to INRGIFT" lead={smsSecondFactor ? 'Then a code sent to your phone.' : 'Global market intelligence from India.'} footer={<>New to INRGIFT? <AltLink href={`/signup${next !== '/app' ? `?next=${encodeURIComponent(next)}` : ''}`}>Create account</AltLink></>}>
      {notice && <Callout tone={notice[0]} className="mb-4" title={notice[1]} />}
      <SocialSignIn next={next} oauth={oauth} />
      <AuthForm onSubmit={submit}>
        <FormError error={error} />
        {unconfirmed && <p className="text-[13px]"><a href={`/verify${nextSuffix(next, '?')}`} className="link font-semibold" onClick={() => rememberEmail(email.trim())}>Verify your email with the 6-digit code</a></p>}
        <TextField label="Email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} error={emailErr} autoFocus />
        <PasswordField label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={pwErr} />
        <div className="flex justify-end"><AltLink href="/forgot-password">Forgot password?</AltLink></div>
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
      </AuthForm>
    </AuthCard>
  );
}

/* ------------------------------------ Sign up ------------------------------------ */
/**
 * The address waiting for its sign-up code, kept for this tab so a refresh can resume step 2. Only the address: the
 * code and the password are never stored anywhere (the password stays in memory for the automatic step-3 sign-in).
 */
const PENDING_EMAIL = 'inrgift.verify.email';
const rememberEmail = (e: string | null) => { try { if (e) sessionStorage.setItem(PENDING_EMAIL, e); else sessionStorage.removeItem(PENDING_EMAIL); } catch { /* storage unavailable */ } };
const recallEmail = () => { try { return sessionStorage.getItem(PENDING_EMAIL) ?? ''; } catch { return ''; } };
const nextSuffix = (next: string, sep: '?' | '&') => (next !== '/app' ? `${sep}next=${encodeURIComponent(next)}` : '');

/**
 * Sign-up in three steps on one page:
 *   1. Account       name, email, mobile number, country, password, terms → Supabase signUp
 *   2. Verify email  the six-digit code Supabase generated, delivered by Resend → verifyOtp (type 'email')
 *   3. Finish        signs in with the password just chosen (kept in memory only), then the mobile-number step:
 *                    the SMS code when the SMS second factor is on, otherwise a confirmation of the saved number
 * then onboarding and the workspace. A refresh during step 2 resumes it (?step=verify); step 3 then asks for the
 * password because it is no longer in memory.
 */
export function SignupForm({ oauth = { google: false, apple: false } }: { oauth?: OAuthAvailability }) {
  const { auth } = useSession();
  const next = useNext();
  const params = useSearchParams();
  const { ready } = useRedirectIfSignedIn(next);
  const [stage, setStage] = useState<'account' | 'email' | 'finish'>(() => (params.get('step') === 'verify' ? 'email' : 'account'));
  const [email, setEmail] = useState(() => (params.get('step') === 'verify' ? recallEmail() : ''));
  const secret = useRef<string | null>(null);
  const sentAt = useRef<number | null>(null);
  const [f, setF] = useState<SignupInput & { country: string }>({ name: '', email: '', phone: '+91 ', country: 'India', password: '', confirm: '', terms: false });
  const [touched, setTouched] = useState(false);
  const [taken, setTaken] = useState<SignupErrors>({});
  const { busy, error, run } = useAuthAction();
  const errs = { ...validateSignup(f), ...taken };
  const show = (k: keyof SignupErrors) => (touched || taken[k] ? errs[k] ?? null : null);
  const set = (k: keyof typeof f, v: string | boolean) => { setF({ ...f, [k]: v }); if (k in taken) setTaken({ ...taken, [k]: undefined }); };
  const submit = () => {
    setTouched(true);
    if (Object.values(validateSignup(f)).some(Boolean)) return;
    track('signup_started', {});
    void run(async () => {
      try {
        await auth.signUp({ name: f.name.trim(), email: f.email.trim(), phone: f.phone, password: f.password, country: f.country, next });
      } catch (e) {
        if (e instanceof AuthError && e.code === 'DUPLICATE_EMAIL') { setTaken({ email: e.message }); return; }
        if (e instanceof AuthError && e.code === 'DUPLICATE_PHONE') { setTaken({ phone: e.message }); return; }
        throw e;
      }
      track('signup_completed', {});
      secret.current = f.password;
      sentAt.current = Date.now();
      const address = f.email.trim();
      setEmail(address); rememberEmail(address);
      setF((x) => ({ ...x, password: '', confirm: '' }));
      window.history.replaceState(null, '', `/signup?step=verify${nextSuffix(next, '&')}`);
      setStage('email');
    });
  };
  if (!ready) return <AuthSkeleton />;
  if (stage === 'email') return <EmailCodeStep email={email} sentAt={sentAt} next={next} onVerified={(address) => { setEmail(address); setStage('finish'); }} />;
  if (stage === 'finish') return <FinishSignup email={email} secret={secret} next={next} />;
  return (
    <AuthCard title="Create your account" lead="Every INRGIFT account has three credentials: email, mobile number and password." step={[1, STEPS, 'Account']} footer={<>Already have an account? <AltLink href={`/login${nextSuffix(next, '?')}`}>Sign in</AltLink></>}>
      <SocialSignIn next={next} oauth={oauth} />
      <AuthForm onSubmit={submit}>
        <FormError error={error} />
        <TextField label="Full name" autoComplete="name" value={f.name} onChange={(e) => set('name', e.target.value)} error={show('name')} maxLength={80} autoFocus />
        <TextField label="Email" type="email" autoComplete="email" inputMode="email" value={f.email} onChange={(e) => set('email', e.target.value)} error={show('email')} hint="We send a 6-digit code to this address to verify it." />
        <TextField label="Mobile number" type="tel" autoComplete="tel" inputMode="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} error={show('phone')} hint={smsSecondFactor ? 'With country code. Each sign-in asks for a code sent here by SMS.' : 'With country code. Required for every account; SMS verification of this number is switched on later.'} />
        <SelectField label="Country of residence" value={f.country} onChange={(e) => set('country', e.target.value)}>{COUNTRIES.map((c) => <option key={c}>{c}</option>)}</SelectField>
        <div><PasswordField label="Password" autoComplete="new-password" value={f.password} onChange={(e) => set('password', e.target.value)} error={show('password')} /><PasswordRules value={f.password} /></div>
        <PasswordField label="Confirm password" autoComplete="new-password" value={f.confirm} onChange={(e) => set('confirm', e.target.value)} error={show('confirm')} />
        <div><Checkbox checked={f.terms} onChange={(v) => set('terms', v)} label={<>I accept the <AltLink href="/terms-and-conditions">Terms and Conditions</AltLink> and have read the <AltLink href="/privacy-policy">Privacy Policy</AltLink>, and I understand INRGIFT does not give investment advice.</>} />{show('terms') && <p role="alert" className="mt-1 text-[13px] text-down">{errs.terms}</p>}</div>
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</Button>
      </AuthForm>
    </AuthCard>
  );
}

/* --------------------------------- Verify email --------------------------------- */
/**
 * Step 2: the six-digit code. Supabase answers a wrong and an expired code alike, so the message is chosen by time:
 * past the configured lifetime since the code was sent → expired, otherwise → incorrect. The code lives only in this
 * input until it is submitted.
 */
function EmailCodeStep({ email: initial, sentAt, next, onVerified }: { email: string; sentAt: React.MutableRefObject<number | null>; next: string; onVerified: (email: string) => void }) {
  const { auth } = useSession();
  const [email, setEmail] = useState(initial);
  const [askEmail, setAskEmail] = useState(!initial);
  const [code, setCode] = useState('');
  const [verified, setVerified] = useState(false);
  const [resent, setResent] = useState(false);
  const cool = useCooldown(60);
  const { busy, error, setError, run } = useAuthAction();
  useEffect(() => { if (sentAt.current) cool.start(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const address = email.trim();
  const verify = () => {
    setResent(false);
    if (!isEmail(address)) { setAskEmail(true); return setError('Enter the email address you signed up with.'); }
    if (code.length > 6) return setError(`That code has ${code.length} digits. INRGIFT verification codes have 6 digits: request a new code below.`);
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code from the email.');
    void run(async () => {
      try { await auth.verifyEmailOtp(address, code); }
      catch (e) {
        setCode('');
        const expired = e instanceof AuthError && e.code === 'INVALID' && sentAt.current !== null && Date.now() - sentAt.current > emailOtpMinutes * 60_000;
        if (expired) throw new AuthError('EXPIRED', 'This verification code has expired. Request a new code.');
        throw e;
      }
      rememberEmail(null);
      track('verification_completed', { step: 'email' });
      setVerified(true);
      setTimeout(() => onVerified(address), 900);
    });
  };
  const resend = () => {
    if (!isEmail(address)) { setAskEmail(true); return setError('Enter the email address you signed up with.'); }
    void run(async () => { await auth.resendEmail(address, next); sentAt.current = Date.now(); rememberEmail(address); setResent(true); setCode(''); cool.start(); });
  };
  return (
    <AuthCard title="Verify your email" step={[2, STEPS, 'Verify email']}
      lead={address && !askEmail ? <>We sent a 6-digit verification code to <b className="text-navy">{maskEmail(address)}</b>.</> : 'Enter the email address you signed up with and the 6-digit code we sent to it.'}
      footer={<>Wrong address? <AltLink href={`/signup${nextSuffix(next, '?')}`}>Start again</AltLink></>}>
      {verified ? (
        <div role="status" aria-live="polite"><Callout tone="success" title="Email verified ✓">Continuing to the last step…</Callout></div>
      ) : (
        <AuthForm onSubmit={verify}>
          <FormError error={error} />
          {resent && <Callout tone="success" title="A new code is on its way.">It replaces the previous code. Check spam if it has not arrived in a few minutes.</Callout>}
          {askEmail && <TextField label="Email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
          <CodeField label="Email verification code" value={code} onChange={setCode} autoFocus={!askEmail} hint={`The code expires ${emailOtpMinutes >= 60 && emailOtpMinutes % 60 === 0 ? `${emailOtpMinutes / 60} hour${emailOtpMinutes === 60 ? '' : 's'}` : `${emailOtpMinutes} minutes`} after it is sent and works once.`} />
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>{busy ? 'Verifying…' : 'Verify email'}</Button>
          <p className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
            <span className="text-slate2">Did not get it? Check spam.</span>
            <button type="button" className="link disabled:text-faint disabled:no-underline" disabled={cool.left > 0 || busy} onClick={resend}>{cool.left > 0 ? `Resend code in ${cool.left}s` : 'Resend code'}</button>
          </p>
        </AuthForm>
      )}
    </AuthCard>
  );
}

/**
 * Step 3. The code confirmed the email but does not open the account: the password does (policy.ts). With the
 * password still in memory from step 1 the sign-in is automatic; otherwise (a resumed step 2) it is asked for. Then:
 * the SMS step on /verify-phone when the SMS second factor is on, or a confirmation of the saved mobile number.
 */
function FinishSignup({ email, secret, next }: { email: string; secret: React.MutableRefObject<string | null>; next: string }) {
  const { auth, account, refresh } = useSession();
  const router = useRouter();
  const [phase, setPhase] = useState<'signing-in' | 'password' | 'phone'>(() => (secret.current ? 'signing-in' : 'password'));
  const [pw, setPw] = useState('');
  const [touched, setTouched] = useState(false);
  const started = useRef(false);
  const { busy, error, run } = useAuthAction();
  const signIn = async (password: string) => {
    const gate = await auth.signIn(email, password);
    await refresh();
    if (gate === 'ok') setPhase('phone');
    else router.replace(gateHref(gate, next));
  };
  useEffect(() => {
    if (phase !== 'signing-in' || started.current) return;
    started.current = true;
    const password = secret.current;
    secret.current = null; // used once, then forgotten
    void run(async () => { try { await signIn(password ?? ''); } catch (e) { setPhase('password'); throw e; } });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps
  if (phase === 'signing-in') return <AuthCard title="Signing you in" step={[3, STEPS, 'Mobile number']}><div role="status" aria-live="polite" className="space-y-3"><p className="text-slate2">Email verified ✓. Opening your account…</p><Skeleton className="h-11 w-full" /></div></AuthCard>;
  if (phase === 'password') return (
    <AuthCard title="Sign in to finish" step={[3, STEPS, 'Mobile number']} lead={<>Your email <b className="text-navy">{maskEmail(email)}</b> is verified. Enter your password to continue.</>}>
      <AuthForm onSubmit={() => { setTouched(true); if (pw) void run(() => signIn(pw)); }}>
        <FormError error={error} />
        <PasswordField label="Password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} error={touched && !pw ? 'Enter your password.' : null} autoFocus />
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>{busy ? 'Signing in…' : 'Continue'}</Button>
      </AuthForm>
    </AuthCard>
  );
  return (
    <AuthCard title="Your mobile number" step={[3, STEPS, 'Mobile number']} lead="Email verified ✓ and you are signed in.">
      <div className="space-y-4">
        <div className="rounded-ctl border border-line bg-bg px-4 py-3">
          <p className="text-xs font-semibold text-faint">Mobile number on your account</p>
          <p className="num mt-0.5 text-lg font-bold text-navy">{account?.phone ? maskPhone(account.phone) : '—'}</p>
        </div>
        <Callout tone="info" title="SMS verification is not switched on yet">Your number is saved on your account. When SMS verification starts, we will ask you to confirm it with a code.</Callout>
        <Button variant="primary" size="lg" className="w-full" onClick={() => router.replace(`/onboarding${nextSuffix(next, '?')}`)}>Continue</Button>
      </div>
    </AuthCard>
  );
}

/** /verify: step 2 on its own (from the sign-in page, or a refreshed tab), then step 3 asks for the password. */
export function VerifyEmail() {
  const next = useNext();
  const { account } = useSession();
  const [stage, setStage] = useState<'email' | 'finish'>('email');
  const [email, setEmail] = useState('');
  const [ready, setReady] = useState(false);
  const secret = useRef<string | null>(null);
  const sentAt = useRef<number | null>(null);
  useEffect(() => { setEmail(recallEmail() || account?.email || ''); setReady(true); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!ready) return <AuthSkeleton />;
  return stage === 'email'
    ? <EmailCodeStep email={email} sentAt={sentAt} next={next} onVerified={(address) => { setEmail(address); setStage('finish'); }} />
    : <FinishSignup email={email} secret={secret} next={next} />;
}

/* ----------------------------- SMS code entry (shared) ----------------------------- */
function CodeStep({ challenge, onVerify, onResend, busy, error, submitLabel, extra }: { challenge: PhoneChallenge; onVerify: (code: string) => void; onResend: () => void; busy: boolean; error: string | null; submitLabel: string; extra?: ReactNode }) {
  const [code, setCode] = useState('');
  const cool = useCooldown(30);
  useEffect(() => { cool.start(); setCode(''); }, [challenge.challengeId]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <AuthForm onSubmit={() => onVerify(code)}>
      <p className="text-slate2">We sent a six-digit code by SMS to <b className="text-navy">{maskPhone(challenge.phone)}</b>. It expires in five minutes.</p>
      <FormError error={error} />
      <CodeField label="SMS code" value={code} onChange={setCode} autoFocus />
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>{busy ? 'Checking…' : submitLabel}</Button>
      <p className="flex flex-wrap items-center justify-between gap-2 text-[13px]">{extra ?? <span />}<button type="button" className="link disabled:text-faint disabled:no-underline" disabled={cool.left > 0 || busy} onClick={onResend}>{cool.left > 0 ? `Send a new code in ${cool.left}s` : 'Send a new code'}</button></p>
    </AuthForm>
  );
}

/* --------------------------------- Verify phone --------------------------------- */
/**
 * Every SMS step happens here, with codes sent and checked by 2Factor.in through INRGIFT's server:
 *   gate 'verify-phone'  first verification of the account's number (required; no skip)
 *   gate 'sms'           the code at every sign-in, after email + password
 *   ?mode=change         a new number on an activated account (needs this session's SMS code already); the number
 *                        changes only after the code sent to the new number matches
 */
export function VerifyPhone() {
  const { auth, account, loading, refresh } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const change = params.get('mode') === 'change';
  const next = safeNext(params.get('next'), change ? '/account/security' : '/app');
  const purpose: SmsPurpose | null = !account ? null : change ? (smsSecondFactor && account.gate === 'ok' ? 'change' : null) : account.gate === 'verify-phone' ? 'signup' : account.gate === 'sms' ? 'login' : null;
  const [phone, setPhone] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<PhoneChallenge | null>(null);
  const autoSent = useRef(false);
  const { busy, error, setError, run } = useAuthAction();
  useEffect(() => {
    if (loading) return;
    if (!account) { router.replace(`/login?next=${encodeURIComponent(change ? '/account/security' : next)}`); return; }
    if (!purpose) router.replace(gateHref(account.gate, next));
  }, [loading, account, purpose, change, next, router]);
  useEffect(() => { if (account && phone === null) setPhone(change ? '+91 ' : account.phone ?? '+91 '); }, [account, change, phone]);
  const send = () => void run(async () => { const c = await auth.sendSms(purpose!, purpose === 'signup' || purpose === 'change' ? phone ?? undefined : undefined); savePending(c); setChallenge(c); });
  // A code already sent from this tab is reused; at sign-in the number is known, so the first code goes out at once.
  useEffect(() => {
    if (!purpose || autoSent.current) return;
    autoSent.current = true;
    const pending = loadPending(purpose);
    if (pending) setChallenge(pending); else if (purpose === 'login') send();
  }, [purpose]); // eslint-disable-line react-hooks/exhaustive-deps
  if (loading || !account || !purpose || phone === null) return <AuthSkeleton />;
  const verify = (code: string) => {
    if (code.length !== 6) return setError('Enter the six-digit code.');
    void run(async () => {
      await auth.verifySms(challenge!, code);
      savePending(null);
      if (purpose !== 'login') track('verification_completed', { step: 'phone' });
      const u = await refresh();
      router.replace(purpose === 'signup' && u?.gate === 'ok' ? `/onboarding${next !== '/app' ? `?next=${encodeURIComponent(next)}` : ''}` : next);
    });
  };
  const signOutLink = <button type="button" className="link" onClick={async () => { await auth.signOut(); router.replace('/login'); }}>Sign out</button>;
  if (purpose === 'login') return (
    <AuthCard title="Enter the code sent to your phone" lead="Your password was correct. Confirm it is you with the SMS code to open your workspace."
      footer={<>Lost access to this phone? <AltLink href="/support?topic=lost-phone">Recover your account</AltLink></>}>
      {!challenge ? (error ? <div className="space-y-3"><FormError error={error} /><Button size="lg" className="w-full" onClick={send} disabled={busy}>Send a code</Button></div> : <AuthSkeleton />) : (
        <CodeStep challenge={challenge} busy={busy} error={error} submitLabel="Verify and continue" onVerify={verify} onResend={send} extra={signOutLink} />
      )}
    </AuthCard>
  );
  return (
    <AuthCard title={change ? 'Change your mobile number' : 'Verify your mobile number'} step={change ? undefined : [3, STEPS, 'Verify phone']}
      lead={change ? 'Enter the new number. It replaces the current one only after you confirm the code we send to it.' : 'Your number is your second sign-in step: every sign-in asks for a code sent to it. This step is required.'}
      footer={change ? <AltLink href="/account/security">Keep the current number</AltLink> : <>Finish later? {signOutLink}</>}>
      {!challenge ? (
        <AuthForm onSubmit={send}>
          <FormError error={error} />
          <TextField label="Mobile number" type="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} hint="With country code. Standard SMS rates may apply." autoFocus />
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>{busy ? 'Sending…' : 'Send code'}</Button>
        </AuthForm>
      ) : (
        <CodeStep challenge={challenge} busy={busy} error={error} submitLabel="Verify number" onVerify={verify} onResend={send}
          extra={<button type="button" className="link" onClick={() => { savePending(null); setChallenge(null); }}>Use a different number</button>} />
      )}
    </AuthCard>
  );
}

/** Older links to /mfa land on the SMS step. */
export function MfaPage() {
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => { router.replace(`/verify-phone${params.get('next') ? `?next=${encodeURIComponent(params.get('next')!)}` : ''}`); }, [router, params]);
  return <AuthSkeleton />;
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
    <AuthCard title="Reset your password" lead={sent ? <>If an account uses <b className="text-navy">{maskEmail(email.trim())}</b>, a reset link is on its way. It expires in one hour.{smsSecondFactor ? ' You will also need your phone.' : ''}</> : `Enter your email and we will send a link to choose a new password.${smsSecondFactor ? ' You will also confirm a code sent to your phone.' : ''}`} footer={<>Remembered it? <AltLink href="/login">Sign in</AltLink></>}>
      {!sent ? (
        <AuthForm onSubmit={submit}>
          <FormError error={error} />
          <TextField label="Email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</Button>
        </AuthForm>
      ) : (
        <div className="space-y-3">
          <FormError error={error} />
          {auth.mode === 'demo' && <a href="/reset-password?demo=1" className="inline-flex h-11 w-full items-center justify-center rounded-ctl bg-brand px-5 font-medium text-white hover:bg-brand-ink">Open the reset link (demo)</a>}
          <Button size="lg" className="w-full" disabled={cool.left > 0 || busy} onClick={submit}>{cool.left > 0 ? `Resend available in ${cool.left}s` : 'Send again'}</Button>
        </div>
      )}
    </AuthCard>
  );
}
/**
 * The reset link opens a recovery session, which never reaches the workspace. If the account has a verified phone,
 * the SMS code is required before the password can change; the phone factor is never removed. Afterwards every
 * session is signed out and the person signs in again with email, the new password and an SMS code.
 */
export function ResetPassword() {
  const { auth, refresh, account, loading } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const [opening, setOpening] = useState(auth.mode === 'demo' && params.get('demo') === '1');
  const [challenge, setChallenge] = useState<PhoneChallenge | null>(null);
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState(false);
  const { busy, error, setError, run } = useAuthAction();
  useEffect(() => { if (opening) void auth.openRecoveryLink?.().then(() => refresh()).finally(() => setOpening(false)); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const problem = passwordProblem(pw), mismatch = confirm && pw !== confirm ? 'The two passwords do not match.' : null;
  if (loading || opening) return <AuthSkeleton />;
  if (!account) return <AuthCard title="This reset link has expired" lead="Reset links work once and expire after one hour."><a href="/forgot-password" className="inline-flex h-11 w-full items-center justify-center rounded-ctl bg-brand px-5 font-medium text-white hover:bg-brand-ink">Request a new link</a></AuthCard>;
  const needsSms = smsSecondFactor && account.phoneVerified && !account.smsVerified;
  if (needsSms) return (
    <AuthCard title="Confirm it is you" lead="Before choosing a new password, enter the code we send to your phone. A password reset never removes your phone verification."
      footer={<>Lost access to this phone? <AltLink href="/support?topic=lost-phone">Recover your account</AltLink></>}>
      {!challenge ? (
        <div className="space-y-3"><FormError error={error} /><Button variant="primary" size="lg" className="w-full" disabled={busy} onClick={() => run(async () => setChallenge(await auth.sendSms('reset')))}>{busy ? 'Sending…' : 'Send code to my phone'}</Button></div>
      ) : (
        <CodeStep challenge={challenge} busy={busy} error={error} submitLabel="Verify" onResend={() => run(async () => setChallenge(await auth.sendSms('reset')))}
          onVerify={(code) => { if (code.length !== 6) return setError('Enter the six-digit code.'); void run(async () => { await auth.verifySms(challenge, code); await refresh(); }); }} />
      )}
    </AuthCard>
  );
  const submit = () => {
    setTouched(true);
    if (problem || !confirm || mismatch) return;
    void run(async () => { await auth.updatePassword(pw); await auth.signOut('global'); await refresh(); router.replace('/login?notice=reset'); });
  };
  return (
    <AuthCard title="Choose a new password" lead={`After saving, every session is signed out. Sign in again with your email and the new password${smsSecondFactor ? ', then an SMS code' : ''}.`}>
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

/* ------------------------------- Complete profile ------------------------------- */
/**
 * After a first Google or Apple sign-in: the account model still needs a name (Apple shares one only if the person
 * chooses to), a mobile number, a password (so email + password also works), country and acceptance of the terms.
 * Only the missing fields are asked for; the server checks them again (/api/auth/complete-profile). An Apple "Hide My
 * Email" relay address is a real, working address and is kept as the account email. Nothing opens until this is done.
 */
const isAppleRelay = (email: string | null) => Boolean(email && /@privaterelay\.appleid\.com$/i.test(email));
export function CompleteProfile() {
  const { auth, account, loading, refresh } = useSession();
  const router = useRouter();
  const next = useNext();
  const [f, setF] = useState({ name: '', phone: '+91 ', country: 'India', password: '', confirm: '', terms: false });
  const [touched, setTouched] = useState(false);
  const { busy, error, setError, run } = useAuthAction();
  useEffect(() => {
    if (loading) return;
    if (!account) { router.replace(`/login${next !== '/app' ? `?next=${encodeURIComponent(next)}` : ''}`); return; }
    if (account.gate !== 'profile') router.replace(gateHref(account.gate, next));
    // Prefill only a name the person or provider actually gave (not the email's local part used as a display fallback).
    else setF((x) => (x.name ? x : { ...x, name: account.missing.includes('name') ? '' : account.name, phone: account.phone ?? x.phone }));
  }, [loading, account, next, router]);
  if (loading || !account || account.gate !== 'profile') return <AuthSkeleton />;
  const need = (k: 'phone' | 'password' | 'country' | 'terms') => account.missing.includes(k);
  const errs: Record<string, string | null> = {
    name: f.name.trim() ? null : 'Enter your name.',
    phone: validateSignup({ name: 'x', email: 'a@b.cd', phone: f.phone, password: 'aaaaaaaaa1!', confirm: 'aaaaaaaaa1!', terms: true }).phone ?? null,
    password: need('password') ? passwordProblem(f.password) : null,
    confirm: need('password') && f.confirm !== f.password ? 'The two passwords do not match.' : null,
    terms: need('terms') && !f.terms ? 'Accept the Terms and Conditions and the Privacy Policy to continue.' : null,
  };
  const show = (k: string) => (touched ? errs[k] : null);
  const submit = () => {
    setTouched(true); setError(null);
    if (Object.values(errs).some(Boolean)) return;
    void run(async () => {
      const gate = await auth.completeProfile({ name: f.name.trim(), phone: f.phone, country: f.country, ...(need('password') ? { password: f.password } : {}), ...(need('terms') ? { terms: f.terms } : {}) });
      await refresh();
      router.replace(gate === 'ok' ? `/onboarding${next !== '/app' ? `?next=${encodeURIComponent(next)}` : ''}` : gateHref(gate, next));
    });
  };
  return (
    <AuthCard title="Complete your INRGIFT profile" lead={<>Signed in as <b className="text-navy">{account.email ? maskEmail(account.email) : 'your social account'}</b>{isAppleRelay(account.email) ? ' (an Apple private relay address; emails from INRGIFT reach you through Apple)' : ''}. Every INRGIFT account also has a name, a mobile number and a password.</>}
      footer={<>Not you? <button type="button" className="link" onClick={async () => { await auth.signOut(); router.replace('/login'); }}>Sign out</button></>}>
      <AuthForm onSubmit={submit}>
        <FormError error={error} />
        <TextField label="Full name" autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} error={show('name')} maxLength={80} />
        <TextField label="Mobile number" type="tel" autoComplete="tel" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} error={show('phone')} hint={smsSecondFactor ? 'With country code. Each sign-in asks for a code sent here by SMS.' : 'With country code. Required for every account; SMS verification of this number is switched on later.'} />
        <SelectField label="Country of residence" value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })}>{COUNTRIES.map((c) => <option key={c}>{c}</option>)}</SelectField>
        {need('password') && <>
          <div><PasswordField label="Password" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} error={show('password')} hint="So you can also sign in with your email and password." /><PasswordRules value={f.password} /></div>
          <PasswordField label="Confirm password" autoComplete="new-password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} error={show('confirm')} />
        </>}
        {need('terms') && <div><Checkbox checked={f.terms} onChange={(v) => setF({ ...f, terms: v })} label={<>I accept the <AltLink href="/terms-and-conditions">Terms and Conditions</AltLink> and the <AltLink href="/privacy-policy">Privacy Policy</AltLink>, and understand INRGIFT does not give investment advice.</>} />{show('terms') && <p role="alert" className="mt-1 text-[13px] text-down">{errs.terms}</p>}</div>}
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>{busy ? 'Saving…' : 'Save and continue'}</Button>
      </AuthForm>
    </AuthCard>
  );
}
