'use client';
import { AnalyticsConsent } from '@/components/layout/analytics-consent';
import { CheckCircle2, CircleAlert, Download, LogOut, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Button, ButtonLink } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ChoiceChips, CodeField, PasswordField, SelectField, Switch, TextField } from '@/components/ui/field';
import { Badge, Callout, EmptyState, PageContainer, PageHeader, Panel, Skeleton } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { authMessage, maskPhone, PasswordRules } from '@/features/auth/auth-ui';
import { passwordProblem, type SecurityEvent } from '@/features/auth/auth-service';
import { useSession } from '@/features/auth/session-context';
import { TABLES } from '@/features/workspace/repo';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { dateTimeIST } from '@/lib/format';
import { CLASS_LABEL } from '@/lib/routes';
import type { AssetClass, Region, Theme } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const crumbs = (label: string): [string, string?][] => [['Workspace', '/app'], ['Account'], [label]];
function Row({ label, value, action }: { label: ReactNode; value: ReactNode; action?: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line py-3 last:border-0"><dt className="w-40 shrink-0 text-[13px] text-faint">{label}</dt><dd className="min-w-0 flex-1">{value}</dd>{action && <dd className="shrink-0">{action}</dd>}</div>;
}
const Verified = ({ ok, yes = 'Verified', no = 'Not verified' }: { ok: boolean; yes?: string; no?: string }) => ok ? <Badge tone="up"><CheckCircle2 size={12} />{yes}</Badge> : <Badge tone="warn"><CircleAlert size={12} />{no}</Badge>;
function Loading() { return <PageContainer><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full rounded-card" /></PageContainer>; }

/* ------------------------------------ Profile ------------------------------------ */
export function ProfilePage() {
  const { user, auth, refresh } = useSession();
  const ws = useWorkspace();
  const toast = useToast();
  const router = useRouter();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [typed, setTyped] = useState('');
  useEffect(() => { if (user) setName(user.name); }, [user]);
  if (!user) return <Loading />;
  const save = async () => { if (!name.trim()) return setError('Enter your name.'); setBusy(true); setError(null); try { await auth.updateName(name.trim()); await refresh(); toast('Profile saved'); } catch (e) { setError(authMessage(e)); } finally { setBusy(false); } };
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), profile: { name: user.name, email: user.email, phone: user.phone }, preferences: ws.prefs, workspace: ws.data }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `inrgift-export-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url); toast('Export downloaded');
  };
  const clearAll = async () => {
    for (const t of TABLES) for (const r of ws.data[t]) await ws.remove(t, r.id);
    setConfirmClear(false); setTyped(''); toast('Workspace data deleted'); router.push('/app');
  };
  const rows = TABLES.reduce((s, t) => s + ws.data[t].length, 0);
  return (
    <PageContainer className="max-w-[880px]">
      <PageHeader crumbs={crumbs('Profile')} title="Profile" lead="How you appear in INRGIFT and how we reach you." />
      <Panel title="Personal details">
        <div className="max-w-md space-y-4">
          {error && <Callout tone="error" title={error} />}
          <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" />
          <Button variant="primary" onClick={save} disabled={busy || name.trim() === user.name}>{busy ? 'Saving…' : 'Save changes'}</Button>
        </div>
      </Panel>
      <Panel title="Contact">
        <dl>
          <Row label="Email" value={<span className="flex flex-wrap items-center gap-2">{user.email ?? '—'} {user.email && <Verified ok={user.emailVerified} />}</span>} action={user.email && !user.emailVerified ? <ButtonLink size="sm" href={`/verify?email=${encodeURIComponent(user.email)}&next=/account/profile`}>Verify</ButtonLink> : undefined} />
          <Row label="Mobile" value={<span className="flex flex-wrap items-center gap-2">{user.phone ? maskPhone(user.phone) : 'Not added'} {user.phone && <Verified ok={user.phoneVerified} />}</span>} action={<ButtonLink size="sm" href="/verify-phone?mode=change&next=/account/profile">Change number</ButtonLink>} />
        </dl>
        <p className="mt-2 text-xs text-faint">To change your email address, contact support from the address on the account. This protects against account takeover.</p>
      </Panel>
      <Panel title="Your data">
        <p className="text-slate2">You hold {rows} saved items: watchlists, alerts, screens, comparisons, collections, research, notes, history and notifications.</p>
        <div className="mt-4 flex flex-wrap gap-2"><Button onClick={exportData}><Download size={16} />Export as JSON</Button><Button variant="danger" onClick={() => setConfirmClear(true)} disabled={!rows}><Trash2 size={16} />Delete workspace data</Button></div>
        <p className="mt-3 text-xs text-faint">Deleting removes saved research data but keeps your sign-in. To close the account entirely, <Link className="link" href="/support">contact support</Link>.</p>
      </Panel>
      <Dialog open={confirmClear} onClose={() => setConfirmClear(false)} title="Delete all workspace data?" footer={<><Button onClick={() => setConfirmClear(false)}>Cancel</Button><Button variant="danger" disabled={typed !== 'DELETE'} onClick={clearAll}>Delete {rows} items</Button></>}>
        <p className="text-slate2">This removes every watchlist, alert, saved screen, comparison, collection, saved note and your history. It cannot be undone. Export first if you want a copy.</p>
        <TextField className="mt-4" label={<>Type <b>DELETE</b> to confirm</>} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
      </Dialog>
    </PageContainer>
  );
}

/* ------------------------------------ Settings ------------------------------------ */
const TZ = [['Asia/Kolkata', 'India (IST)'], ['Asia/Dubai', 'Gulf (GST)'], ['Asia/Singapore', 'Singapore (SGT)'], ['Europe/London', 'United Kingdom'], ['America/New_York', 'US Eastern'], ['UTC', 'UTC']] as const;
const LOCALES = [['en-IN', 'English (India): 1,00,000'], ['en-GB', 'English (UK): 100,000'], ['en-US', 'English (US): 100,000']] as const;
const REGIONS: Region[] = ['Asia-Pacific', 'North America', 'Europe', 'Middle East', 'Latin America', 'Africa'];
const CLASSES: AssetClass[] = ['stock', 'etf', 'index', 'fx', 'commodity', 'bond', 'reit'];
export function SettingsPage() {
  const ws = useWorkspace();
  const toast = useToast();
  const themes = useApi<Theme[]>('/api/v1/themes');
  const set = (patch: Parameters<typeof ws.setPrefs>[0], msg = 'Settings saved') => { ws.setPrefs(patch); toast(msg); };
  const p = ws.prefs;
  if (!ws.ready) return <Loading />;
  return (
    <PageContainer className="max-w-[880px]">
      <PageHeader crumbs={crumbs('Settings')} title="Settings" lead="Changes save as you make them and apply on every device you sign in on." />
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
 * Email, phone and password are all required credentials, and the SMS code is the second factor at every sign-in.
 * Two-factor cannot be turned off; the number can only be replaced by verifying a new one (VerifyPhone ?mode=change).
 */
export function SecurityPage() {
  const { user, auth } = useSession();
  const toast = useToast();
  const router = useRouter();
  const [events, setEvents] = useState<SecurityEvent[] | null>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState('');
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { void auth.activity().then(setEvents).catch(() => setEvents([])); }, [auth, user]);
  if (!user) return <Loading />;
  const changePw = async () => { const p = passwordProblem(pw); if (p) return setPwErr(p); setBusy(true); try { await auth.updatePassword(pw); setPwOpen(false); setPw(''); toast('Password changed'); setEvents(await auth.activity()); } catch (e) { setPwErr(authMessage(e)); } finally { setBusy(false); } };
  const activated = user.emailVerified && user.phoneVerified;
  return (
    <PageContainer className="max-w-[880px]">
      <PageHeader crumbs={crumbs('Security')} title="Security" lead="Your sign-in credentials, two-factor authentication and recent activity." />
      {!activated && <Callout tone="warn" title="Account not fully activated">Email and phone verification are both required.</Callout>}
      <Panel title="Sign-in credentials">
        <dl>
          <Row label="Email" value={<span className="flex flex-wrap items-center gap-2">{user.email ?? '—'} <Verified ok={user.emailVerified} no="Pending" /></span>} />
          <Row label="Phone" value={<span className="flex flex-wrap items-center gap-2">{user.phone ? maskPhone(user.phone) : '—'} <Verified ok={user.phoneVerified} no="Pending" /></span>} action={<ButtonLink size="sm" href="/verify-phone?mode=change&next=/account/security">Change number</ButtonLink>} />
          <Row label="Password" value={<span className="flex flex-wrap items-center gap-2">Configured <Verified ok yes="Set" /></span>} action={<Button size="sm" onClick={() => { setPwErr(null); setPwOpen(true); }}>Change</Button>} />
          <Row label="SMS two-factor" value={<span className="flex flex-wrap items-center gap-2">Code sent to your phone at every sign-in <Verified ok={user.phoneVerified} yes="Enabled" no="Pending" /></span>} />
        </dl>
        <p className="mt-3 text-[13px] text-slate2">Two-factor authentication is required for every INRGIFT account and cannot be turned off. Each sign-in needs your email, your password and a code sent to your phone.</p>
        <p className="mt-2 text-[13px] text-slate2">Forgot your password? <Link className="link" href="/forgot-password">Reset it by email</Link>; you will also confirm a code sent to your phone.</p>
        <p className="mt-2 text-[13px] text-slate2">Lost this phone? <Link className="link" href="/support?topic=lost-phone">Recover your account</Link>. Support confirms your identity before the old number is removed; you then sign in with your email and password and verify a new number.</p>
      </Panel>
      <Panel title="Current session" tools={<Button size="sm" onClick={async () => { await auth.signOut(); router.push('/'); router.refresh(); }}><LogOut size={14} />Sign out</Button>}>
        <dl><Row label="This device" value={typeof navigator !== 'undefined' ? navigator.userAgent.replace(/\(.*?\)/g, '').split(' ').slice(-2).join(' ') : '—'} /><Row label="Sign-in method" value={auth.mode === 'demo' ? 'Demo account (this browser only)' : 'Secure session cookie, refreshed automatically'} /></dl>
        <p className="mt-2 text-xs text-faint">{auth.mode === 'supabase' ? 'Sessions on other devices cannot be listed from the browser. Changing your password signs out other sessions when they next refresh.' : 'Demo sessions exist only in this browser.'}</p>
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
