'use client';
import { AnalyticsConsent } from '@/components/layout/analytics-consent';
import { CheckCircle2, CircleAlert, Download, LogOut, MonitorSmartphone, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Button, ButtonLink } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ChoiceChips, PasswordField, SelectField, Switch, TextField } from '@/components/ui/field';
import { Badge, Callout, EmptyState, PageContainer, PageHeader, Panel, RetryButton, Skeleton } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { authMessage, maskEmail, maskPhone, PasswordRules } from '@/features/auth/auth-ui';
import { passwordProblem, type SecurityEvent } from '@/features/auth/auth-service';
import { useSession } from '@/features/auth/session-context';
import { smsSecondFactor } from '@/lib/config';
import { TABLES } from '@/features/workspace/repo';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { dateShort, dateTimeIST } from '@/lib/format';
import { CLASS_LABEL } from '@/lib/routes';
import type { AssetClass, Region, Theme } from '@/lib/types';
import { useApi } from '@/lib/use-api';
import { useAccount } from './account-context';
import { CopyGiftId, GiftIdValue } from './gift-id';
import type { AccountProfile } from './types';

const crumbs = (label: string): [string, string?][] => [['Workspace', '/app'], ['Account'], [label]];
function Row({ label, value, action }: { label: ReactNode; value: ReactNode; action?: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line py-3 last:border-0"><dt className="w-40 shrink-0 text-[13px] text-faint">{label}</dt><dd className="min-w-0 flex-1">{value}</dd>{action && <dd className="shrink-0">{action}</dd>}</div>;
}
const Verified = ({ ok, yes = 'Verified', no = 'Not verified' }: { ok: boolean; yes?: string; no?: string }) => ok ? <Badge tone="up"><CheckCircle2 size={12} aria-hidden />{yes}</Badge> : <Badge tone="warn"><CircleAlert size={12} aria-hidden />{no}</Badge>;
function Loading() { return <PageContainer><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full rounded-card" /></PageContainer>; }
/** Shown wherever the server's account details failed: the page stays usable and offers a retry. */
function AccountError({ onRetry }: { onRetry: () => void }) {
  return <Callout tone="error" title="Your account details could not load." action={<RetryButton onRetry={onRetry} label="Try again" />}>Nothing has changed on your account. Check your connection and try again.</Callout>;
}
const METHOD: Record<NonNullable<AccountProfile['session']>['method'], string> = { password: 'Email and password', google: 'Google', other: 'Another method' };
const SMS_LATER = 'SMS verification will be available after 2Factor/DLT setup.';

/** The browser and platform of this device, from its own user agent. Read after mount (no server guess). */
function useThisDevice(): string | null {
  const [d, setD] = useState<string | null>(null);
  useEffect(() => {
    const ua = navigator.userAgent;
    const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
    const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : null;
    setD(os ? `${browser} on ${os}` : browser);
  }, []);
  return d;
}

/* ------------------------------------ Profile ------------------------------------ */

/**
 * INRGIFT ACCOUNT card: the GIFT ID (copyable) and the account's own facts as the server read them from the session
 * (GET /api/v1/me). Email and phone are masked. Nothing here is editable except through the panels below.
 */
export function AccountCard() {
  const { profile, loading, error, reload } = useAccount();
  if (loading && !profile) return <section aria-label="INRGIFT account" className="rounded-card border border-line bg-white p-5 shadow-card"><Skeleton className="h-4 w-32" /><Skeleton className="mt-3 h-7 w-56" /><Skeleton className="mt-5 h-24 w-full" /></section>;
  if (!profile) return error ? <AccountError onRetry={reload} /> : null;
  return (
    <section aria-labelledby="account-card" className="overflow-hidden rounded-card border border-line bg-white shadow-card">
      <div className="border-b border-line bg-soft/60 px-5 py-4">
        <h2 id="account-card" className="text-micro font-semibold uppercase tracking-[.12em] text-faint">INRGIFT account</h2>
        <p className="mt-3 text-[13px] font-medium text-slate2">GIFT ID</p>
        {profile.giftId ? <div className="mt-1 flex flex-wrap items-center gap-3"><GiftIdValue giftId={profile.giftId} className="text-[20px]" /><CopyGiftId giftId={profile.giftId} /></div>
          : <p className="mt-1 text-[13px] text-slate2">Your GIFT ID is being assigned. It will appear here.</p>}
        <p className="mt-3 max-w-[60ch] text-[13px] text-slate2">Your GIFT ID is your permanent INRGIFT account reference. Use it when contacting INRGIFT support.</p>
      </div>
      <dl className="grid gap-x-6 px-5 py-2 sm:grid-cols-2">
        <CardField label="Full name" value={profile.name} />
        <CardField label="Email" value={profile.email ? <span className="flex flex-wrap items-center gap-2">{maskEmail(profile.email)}<Verified ok={profile.emailVerified} yes="✓ Verified" /></span> : '—'} />
        <CardField label="Phone" value={profile.phone ? maskPhone(profile.phone) : 'Not added'} />
        <CardField label="Country" value={profile.country ?? 'Not provided'} />
        <CardField label="Account created" value={profile.createdAt ? <time dateTime={profile.createdAt}>{dateShort(profile.createdAt)}</time> : '—'} />
        <CardField label="Sign-in methods" value={[profile.passwordSet ? 'Email and password' : null, profile.providers.includes('google') ? 'Google' : null].filter(Boolean).join(' · ') || '—'} />
      </dl>
    </section>
  );
}
const CardField = ({ label, value }: { label: string; value: ReactNode }) => <div className="border-b border-line py-3 sm:[&:nth-last-child(-n+2)]:border-0 [&:last-child]:border-0"><dt className="text-xs text-faint">{label}</dt><dd className="mt-0.5 font-medium text-navy">{value}</dd></div>;

export function ProfilePage() {
  const { user, auth, refresh } = useSession();
  const { profile, reload } = useAccount();
  const ws = useWorkspace();
  const toast = useToast();
  const router = useRouter();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [typed, setTyped] = useState('');
  const current = profile?.name ?? user?.name ?? '';
  useEffect(() => { if (current) setName(current); }, [current]);
  if (!user) return <Loading />;
  const save = async () => { if (!name.trim()) return setError('Enter your name.'); setBusy(true); setError(null); try { await auth.updateName(name.trim()); await refresh(); reload(); toast('Profile saved'); } catch (e) { setError(authMessage(e)); } finally { setBusy(false); } };
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), profile: { giftId: profile?.giftId ?? null, name: current, email: user.email, phone: user.phone, country: profile?.country ?? null }, preferences: ws.prefs, workspace: ws.data }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `inrgift-export-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url); toast('Export downloaded');
  };
  const clearAll = async () => {
    for (const t of TABLES) for (const r of ws.data[t]) await ws.remove(t, r.id);
    setConfirmClear(false); setTyped(''); toast('Workspace data deleted'); router.push('/app');
  };
  const rows = TABLES.reduce((s, t) => s + ws.data[t].length, 0);
  const google = (profile?.providers ?? user.providers).includes('google');
  const emailVerified = profile?.emailVerified ?? user.emailVerified;
  const phone = profile?.phone ?? user.phone;
  return (
    <PageContainer className="max-w-[880px]">
      <PageHeader crumbs={crumbs('Profile')} title="Profile" lead="Your INRGIFT account, how you are verified and how we reach you." />
      <AccountCard />
      <Panel title="Personal information">
        <div className="max-w-md space-y-4">
          {error && <Callout tone="error" title={error} />}
          <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" />
          <Button variant="primary" onClick={save} disabled={busy || !name.trim() || name.trim() === current}>{busy ? 'Saving…' : 'Save changes'}</Button>
        </div>
        <p className="mt-4 text-xs text-faint">To change your email address or country of residence, <Link className="link" href="/support">contact support</Link> from the email address on the account and quote your GIFT ID. This protects against account takeover.</p>
      </Panel>
      <Panel title="Verification">
        <dl>
          <Row label="Email" value={<span className="flex flex-wrap items-center gap-2">{user.email ? maskEmail(user.email) : '—'} {user.email && <Verified ok={emailVerified} />}</span>} action={user.email && !emailVerified ? <ButtonLink size="sm" href="/verify?next=/account/profile">Verify</ButtonLink> : undefined} />
          <Row label="Mobile number" value={<span className="flex flex-wrap items-center gap-2">{phone ? maskPhone(phone) : 'Not added'} {phone && (smsSecondFactor ? <Verified ok={profile?.phoneVerified ?? user.phoneVerified} /> : <Badge>Saved</Badge>)}</span>}
            action={smsSecondFactor ? <ButtonLink size="sm" href="/verify-phone?mode=change&next=/account/profile">Change number</ButtonLink> : undefined} />
          <Row label="Google" value={google ? <Badge tone="up"><CheckCircle2 size={12} aria-hidden />Connected</Badge> : <span className="text-slate2">Not connected</span>} />
        </dl>
        {!smsSecondFactor && <p className="mt-2 text-xs text-faint">{SMS_LATER}</p>}
      </Panel>
      <Panel title="Security" tools={<ButtonLink size="sm" href="/account/security">Manage</ButtonLink>}>
        <dl>
          <Row label="Password" value={profile ? <Verified ok={profile.passwordSet} yes="Set" no="Not set" /> : <Skeleton className="h-5 w-16" />} />
          <Row label="Last sign-in" value={profile?.lastSignInAt ? <time dateTime={profile.lastSignInAt}>{dateTimeIST(profile.lastSignInAt)}</time> : '—'} />
          <Row label="This session" value={profile?.session ? `${METHOD[profile.session.method]}${profile.session.startedAt ? `, since ${dateTimeIST(profile.session.startedAt)}` : ''}` : auth.mode === 'demo' ? 'Demo session in this browser' : '—'} action={<ButtonLink size="sm" href="/account/sessions">Sessions</ButtonLink>} />
        </dl>
      </Panel>
      <Panel title="Preferences" tools={<ButtonLink size="sm" href="/account/settings">Edit</ButtonLink>}>
        {!ws.ready ? <Skeleton className="h-16 w-full" /> : (
          <dl>
            <Row label="Display currency" value={ws.prefs.currency === 'INR' ? 'Indian rupees (₹), converted at the reference rate' : 'Home currency of each asset'} />
            <Row label="Time zone" value={ws.prefs.timezone} />
            <Row label="Notifications" value={[ws.prefs.notifyInApp ? 'In INRGIFT' : null, ws.prefs.notifyEmail ? 'By email' : null].filter(Boolean).join(' · ') || 'Off'} />
          </dl>
        )}
      </Panel>
      <Panel title="Your data">
        <p className="text-slate2">{ws.ready ? `You hold ${rows} saved items: watchlists, alerts, screens, comparisons, collections, research, notes, history and notifications.` : 'Counting your saved items…'}</p>
        <div className="mt-4 flex flex-wrap gap-2"><Button onClick={exportData} disabled={!ws.ready}><Download size={16} aria-hidden />Export as JSON</Button><Button variant="danger" onClick={() => setConfirmClear(true)} disabled={!rows}><Trash2 size={16} aria-hidden />Delete workspace data</Button></div>
        <p className="mt-3 text-xs text-faint">Deleting removes saved research data but keeps your sign-in. To close the account entirely, see <Link className="link" href="/account-closure">account closure</Link>.</p>
      </Panel>
      <Dialog open={confirmClear} onClose={() => setConfirmClear(false)} title="Delete all workspace data?" footer={<><Button onClick={() => setConfirmClear(false)}>Cancel</Button><Button variant="danger" disabled={typed !== 'DELETE'} onClick={clearAll}>Delete {rows} items</Button></>}>
        <p className="text-slate2">This removes every watchlist, alert, saved screen, comparison, collection, saved note and your history. It cannot be undone. Export first if you want a copy.</p>
        <TextField className="mt-4" label={<>Type <b>DELETE</b> to confirm</>} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
      </Dialog>
    </PageContainer>
  );
}

/* ------------------------------------ Preferences ------------------------------------ */
const TZ = [['Asia/Kolkata', 'India (IST)'], ['Asia/Dubai', 'Gulf (GST)'], ['Asia/Singapore', 'Singapore (SGT)'], ['Europe/London', 'United Kingdom'], ['America/New_York', 'US Eastern'], ['UTC', 'UTC']] as const;
const LOCALES = [['en-IN', 'English (India): 1,00,000'], ['en-GB', 'English (UK): 100,000'], ['en-US', 'English (US): 100,000']] as const;
const REGIONS: Region[] = ['Asia-Pacific', 'North America', 'Europe', 'Middle East', 'Latin America', 'Africa'];
const CLASSES: AssetClass[] = ['stock', 'etf', 'index', 'fx', 'commodity', 'bond', 'reit'];
export function SettingsPage() {
  const ws = useWorkspace();
  const toast = useToast();
  const themes = useApi<Theme[]>('/api/v1/themes');
  const set = (patch: Parameters<typeof ws.setPrefs>[0], msg = 'Preferences saved') => { ws.setPrefs(patch); toast(msg); };
  const p = ws.prefs;
  if (!ws.ready) return <Loading />;
  return (
    <PageContainer className="max-w-[880px]">
      <PageHeader crumbs={crumbs('Preferences')} title="Preferences" lead="Changes save as you make them and apply on every device you sign in on." />
      <Panel title="Display">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Display currency" hint="Converted at the reference rate; approximate." value={p.currency} onChange={(e) => set({ currency: e.target.value as 'LOCAL' | 'INR' })}><option value="LOCAL">Home currency of each asset</option><option value="INR">Indian rupees (₹)</option></SelectField>
          <SelectField label="Time zone" hint="Used for dates and session times." value={p.timezone} onChange={(e) => set({ timezone: e.target.value })}>{TZ.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</SelectField>
          <SelectField label="Number format" value={p.locale} onChange={(e) => set({ locale: e.target.value })}>{LOCALES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</SelectField>
        </div>
      </Panel>
      <Panel title="Interests" sub="Shapes market order and suggestions">
        <div className="space-y-5">
          <ChoiceChips label="Regions" options={REGIONS.map((r) => [r, r] as const)} value={p.regions} onChange={(v) => set({ regions: v })} />
          <ChoiceChips label="Asset classes" options={CLASSES.map((c) => [c, CLASS_LABEL[c].many] as const)} value={p.assetClasses} onChange={(v) => set({ assetClasses: v })} />
          {themes.data ? <ChoiceChips label="Themes" options={themes.data.map((t) => [t.id, t.name] as const)} value={p.themes} onChange={(v) => set({ themes: v })} /> : themes.error ? <Callout tone="error" title="Themes could not load" action={<Button size="sm" onClick={themes.reload}>Retry</Button>} /> : <Skeleton className="h-10 w-full" />}
        </div>
      </Panel>
      <Panel title="Privacy"><AnalyticsConsent /></Panel>
      <Panel title="Notifications">
        <Switch checked={p.notifyInApp} onChange={(v) => set({ notifyInApp: v })} label="In INRGIFT" description="Alerts, research updates and account notices in the bell menu." />
        <Switch checked={p.notifyEmail} onChange={(v) => set({ notifyEmail: v })} label="By email" description="A copy of each triggered alert. Account and security notices are always sent." />
        <p className="mt-2 text-xs text-faint">Alerts only send you a notification. Nothing else happens automatically.</p>
      </Panel>
    </PageContainer>
  );
}

/* ------------------------------------ Security ------------------------------------ */
/**
 * Password, sign-in identities (email, Google), verification and sessions. With the SMS second factor switched on,
 * the code is required at every sign-in and cannot be turned off; the number can only be replaced by verifying a new
 * one (VerifyPhone ?mode=change). Until then the page says so plainly.
 */
export function SecurityPage() {
  const { user, auth } = useSession();
  const { profile } = useAccount();
  const toast = useToast();
  const router = useRouter();
  const [events, setEvents] = useState<SecurityEvent[] | null>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState('');
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const uid = user?.id;
  useEffect(() => { if (!uid) return; void auth.activity().then(setEvents).catch(() => setEvents([])); }, [auth, uid]);
  if (!user) return <Loading />;
  const changePw = async () => { const p = passwordProblem(pw); if (p) return setPwErr(p); setBusy(true); try { await auth.updatePassword(pw); setPwOpen(false); setPw(''); toast('Password changed'); setEvents(await auth.activity()); } catch (e) { setPwErr(authMessage(e)); } finally { setBusy(false); } };
  const signOut = async (scope: 'local' | 'global') => { await auth.signOut(scope); router.push(scope === 'global' ? '/login' : '/'); router.refresh(); };
  const google = (profile?.providers ?? user.providers).includes('google');
  const passwordSet = profile?.passwordSet ?? !user.missing.includes('password');
  const activated = user.emailVerified && (!smsSecondFactor || user.phoneVerified);
  return (
    <PageContainer className="max-w-[880px]">
      <PageHeader crumbs={crumbs('Security')} title="Security" lead="Your password, how you sign in, how your account is verified, and where you are signed in." />
      {!activated && <Callout tone="warn" title="Account not fully verified">{smsSecondFactor ? 'Email and phone verification are both required.' : 'Verify your email address to finish setting up the account.'}</Callout>}
      <Panel title="Password">
        <dl>
          <Row label="Password" value={<Verified ok={passwordSet} yes="Set" no="Not set" />} action={<Button size="sm" onClick={() => { setPwErr(null); setPwOpen(true); }}>Change password</Button>} />
        </dl>
        <p className="mt-3 text-[13px] text-slate2">Forgot your password? <Link className="link" href="/forgot-password">Reset it by email</Link>{smsSecondFactor ? '; you will also confirm a code sent to your phone' : ''}. Changing your password also ends your sessions on other devices.</p>
      </Panel>
      <Panel title="Sign-in identity">
        <dl>
          <Row label="Email address" value={<span className="flex flex-wrap items-center gap-2">{user.email ?? '—'} {passwordSet && <Badge>With password</Badge>}</span>} />
          <Row label="Google" value={google ? <Badge tone="up"><CheckCircle2 size={12} aria-hidden />Connected</Badge> : <span className="text-slate2">Not connected</span>} />
        </dl>
        <p className="mt-2 text-xs text-faint">Every session starts with your email and password or with Google. INRGIFT never signs you in with a link or a code alone.</p>
      </Panel>
      <Panel title="Verification">
        <dl>
          <Row label="Email" value={<span className="flex flex-wrap items-center gap-2">{user.email ? maskEmail(user.email) : '—'} <Verified ok={user.emailVerified} no="Pending" /></span>} />
          <Row label="Phone" value={<span className="flex flex-wrap items-center gap-2">{user.phone ? maskPhone(user.phone) : '—'} {smsSecondFactor ? <Verified ok={user.phoneVerified} no="Pending" /> : user.phone ? <Badge>Saved</Badge> : null}</span>} action={smsSecondFactor ? <ButtonLink size="sm" href="/verify-phone?mode=change&next=/account/security">Change number</ButtonLink> : undefined} />
          <Row label="SMS two-factor" value={<span className="flex flex-wrap items-center gap-2">{smsSecondFactor ? 'Code sent to your phone at every sign-in' : 'Not yet active'} <Verified ok={smsSecondFactor && user.phoneVerified} yes="Enabled" no="Pending" /></span>} />
        </dl>
        {smsSecondFactor
          ? <p className="mt-3 text-[13px] text-slate2">Two-factor authentication is required for every INRGIFT account and cannot be turned off. Each sign-in needs your email, your password and a code sent to your phone.</p>
          : <p className="mt-3 text-[13px] text-slate2">{SMS_LATER} Once it is switched on, every sign-in will also need a code sent to the mobile number on your account.</p>}
        {smsSecondFactor && <p className="mt-2 text-[13px] text-slate2">Lost this phone? <Link className="link" href="/support?topic=security">Recover your account</Link>. Support confirms your identity before the old number is removed; you then sign in with your email and password and verify a new number.</p>}
      </Panel>
      <Panel title="Sessions" tools={<ButtonLink size="sm" href="/account/sessions">Session details</ButtonLink>}>
        <dl>
          <Row label="This session" value={profile?.session ? `${METHOD[profile.session.method]}${profile.session.startedAt ? `, since ${dateTimeIST(profile.session.startedAt)}` : ''}` : auth.mode === 'demo' ? 'Demo session in this browser' : 'Signed in'} />
        </dl>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => signOut('local')}><LogOut size={14} aria-hidden />Sign out</Button>
          {auth.mode === 'supabase' && <Button size="sm" onClick={() => signOut('global')}><LogOut size={14} aria-hidden />Sign out on all devices</Button>}
        </div>
      </Panel>
      <Panel title="Recent security activity" flush>
        {!events ? <div className="p-4"><Skeleton className="h-20 w-full" /></div> : !events.length ? <EmptyState title="No activity recorded yet" /> : <ul>{events.slice(0, 12).map((e, i) => <li key={i} className="flex flex-wrap justify-between gap-2 border-b border-line px-4 py-2.5 last:border-0"><span>{e.label}</span><span className="num text-xs text-faint">{dateTimeIST(e.at)}</span></li>)}</ul>}
      </Panel>
      <Dialog open={pwOpen} onClose={() => setPwOpen(false)} title="Change password" footer={<><Button onClick={() => setPwOpen(false)}>Cancel</Button><Button variant="primary" onClick={changePw} disabled={busy}>{busy ? 'Saving…' : 'Save password'}</Button></>}>
        <PasswordField label="New password" autoComplete="new-password" value={pw} onChange={(e) => { setPw(e.target.value); setPwErr(null); }} error={pwErr} />
        <PasswordRules value={pw} />
      </Dialog>
    </PageContainer>
  );
}

/* ------------------------------------ Sessions ------------------------------------ */
/**
 * Only what INRGIFT can verify: this session's sign-in method and start (from its token), when the current access token
 * renews, and this device's browser. Supabase does not let a browser list other sessions, so none are invented; signing
 * out everywhere is offered instead.
 */
export function SessionsPage() {
  const { user, auth } = useSession();
  const { profile, loading, error, reload } = useAccount();
  const router = useRouter();
  const device = useThisDevice();
  const [busy, setBusy] = useState<'local' | 'global' | null>(null);
  if (!user) return <Loading />;
  const signOut = async (scope: 'local' | 'global') => { setBusy(scope); try { await auth.signOut(scope); router.push(scope === 'global' ? '/login' : '/'); router.refresh(); } finally { setBusy(null); } };
  const s = profile?.session ?? null;
  return (
    <PageContainer className="max-w-[880px]">
      <PageHeader crumbs={crumbs('Sessions')} title="Sessions" lead="Where you are signed in to INRGIFT, and how to sign out." />
      {error && !profile && <AccountError onRetry={reload} />}
      <Panel title="This device" tools={<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-up"><span aria-hidden>●</span>Current session</span>}>
        <dl>
          <Row label="Device" value={device ? <span className="inline-flex items-center gap-2"><MonitorSmartphone size={16} className="text-faint" aria-hidden />{device}</span> : <Skeleton className="h-5 w-32" />} />
          <Row label="Signed in with" value={s ? METHOD[s.method] : loading ? <Skeleton className="h-5 w-32" /> : auth.mode === 'demo' ? 'Demo account' : '—'} />
          <Row label="Signed in at" value={s?.startedAt ? <time dateTime={s.startedAt}>{dateTimeIST(s.startedAt)}</time> : loading ? <Skeleton className="h-5 w-40" /> : '—'} />
          <Row label="Access renews" value={s?.tokenExpiresAt ? <>Automatically while you use INRGIFT. The current access token is valid until <time dateTime={s.tokenExpiresAt}>{dateTimeIST(s.tokenExpiresAt)}</time>.</> : auth.mode === 'demo' ? 'Demo sessions do not expire' : 'Automatically while you use INRGIFT'} />
          <Row label="Last sign-in" value={profile?.lastSignInAt ? <time dateTime={profile.lastSignInAt}>{dateTimeIST(profile.lastSignInAt)}</time> : '—'} />
        </dl>
        <Button className="mt-3" size="sm" onClick={() => signOut('local')} disabled={busy !== null}><LogOut size={14} aria-hidden />{busy === 'local' ? 'Signing out…' : 'Sign out of this device'}</Button>
      </Panel>
      <Panel title="Other devices">
        {auth.mode === 'supabase' ? (
          <>
            <p className="text-slate2">INRGIFT cannot list your sessions on other devices from this page. If you signed in somewhere you no longer use, or you are not sure, sign out on all devices: every session ends, including this one, and each device needs your password (or Google) again.</p>
            <Button className="mt-4" variant="danger" size="sm" onClick={() => signOut('global')} disabled={busy !== null}><LogOut size={14} aria-hidden />{busy === 'global' ? 'Signing out…' : 'Sign out on all devices'}</Button>
          </>
        ) : <p className="text-slate2">Demo sessions exist only in this browser. There are no other devices to sign out.</p>}
        <p className="mt-3 text-xs text-faint">Changing your password also ends your sessions on other devices. If you think someone else has used your account, change your password and <Link className="link" href="/support?topic=security">contact support</Link> with your GIFT ID.</p>
      </Panel>
    </PageContainer>
  );
}
