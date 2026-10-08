import { config } from '@/lib/config';
import { log } from '@/lib/telemetry/log';
import { sendEmail } from '@/services/email/email-service';
import type { RenderedEmail } from '@/services/email/templates';
import { digestEmail, EVENTS, isEventType, type NotificationCategory, type RenderContext } from './catalog';

/**
 * The notification dispatcher: takes due events from the outbox (public.notification_events, migration 0009), decides
 * what each one becomes, and sends through the one Resend adapter. Never throws; every outcome is written back.
 *
 *   recipient   the account's own email from Supabase Auth (never an address from the event), only once confirmed:
 *               until then the event waits (up to 7 days, then it is skipped)
 *   mandatory   security, account and support events: always sent, immediately
 *   optional    watchlist, alerts, research: skipped when switched off; batched into a digest when the account chose
 *               hourly/daily, or after IMMEDIATE_CAP immediate emails in the last hour (anti-spam)
 *   sending     Resend's Idempotency-Key is the event id, so a retry never delivers twice; "sent" is recorded only
 *               when Resend accepted the email
 *   failure     retried with backoff (2, 4, 8, 16 minutes), then marked failed after MAX_ATTEMPTS
 */
export interface EventRow { id: string; user_id: string; event_type: string; category: NotificationCategory; mandatory: boolean; payload: Record<string, unknown>; occurred_at: string; attempts: number; created_at: string }
export interface Recipient {
  email: string | null; confirmed: boolean; firstName: string | null; timeZone: string;
  prefs: { product: boolean; watchlist: boolean; alerts: boolean; research: boolean; digest: 'immediate' | 'hourly' | 'daily' | 'off' };
}
export interface EventPatch { status?: 'pending' | 'sent' | 'failed' | 'skipped' | 'digest'; attempts?: number; next_attempt_at?: string; failure_reason?: string | null; provider_message_id?: string; recipient?: string; sent_at?: string; digest_id?: string }
export interface NotificationStore {
  claim(userId: string | null, limit: number): Promise<EventRow[]>;
  claimDigest(userId: string): Promise<EventRow[]>;
  digestUsers(): Promise<{ userId: string; oldest: string }[]>;
  recipient(userId: string): Promise<Recipient | null>;
  immediateSentSince(userId: string, sinceIso: string): Promise<number>;
  update(ids: string[], patch: EventPatch): Promise<void>;
}
export type Sender = (to: string, mail: RenderedEmail, kind: string, idempotencyKey: string) => Promise<{ ok: true; id: string } | { ok: false; code: string }>;
export type InstrumentNames = (ids: string[]) => Promise<Map<string, string>>;

export const MAX_ATTEMPTS = 5;
export const IMMEDIATE_CAP = 10;
const UNVERIFIED_GRACE_MS = 7 * 86400_000;
const DIGEST_WINDOW_MS = { hourly: 3600_000, daily: 86400_000 } as const;

export function formatTime(iso: string, timeZone: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  try { return `${new Intl.DateTimeFormat('en-GB', { timeZone, day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(d)} (${timeZone})`; }
  catch { return `${d.toISOString().replace('T', ' ').slice(0, 16)} (UTC)`; }
}
const allowed = (r: Recipient, c: NotificationCategory) => r.prefs.product && (c === 'watchlist' ? r.prefs.watchlist : c === 'alerts' ? r.prefs.alerts : c === 'research' ? r.prefs.research : true);
const instrumentIds = (rows: EventRow[]) => [...new Set(rows.flatMap((r) => [r.payload.instrument_id, ...(Array.isArray(r.payload.instrument_ids) ? r.payload.instrument_ids : [])]).filter((x): x is string => typeof x === 'string'))];

export interface DispatchDeps { store: NotificationStore; send: Sender; names: InstrumentNames; now?: () => Date; site?: string; demoData?: boolean }
function context(r: Recipient, names: Map<string, string>, occurredAt: string, d: DispatchDeps): RenderContext {
  return {
    firstName: r.firstName, eventTime: formatTime(occurredAt, r.timeZone), site: (d.site ?? config.siteUrl).replace(/\/$/, ''),
    demoData: d.demoData ?? config.provider === 'demo',
    instrument: (id) => (typeof id === 'string' ? names.get(id) ?? null : null),
    time: (iso) => (typeof iso === 'string' ? formatTime(iso, r.timeZone) : null),
  };
}

/** Sends due events (all accounts, or one). Returns counts by outcome. */
export async function dispatchPending(d: DispatchDeps, opts: { userId?: string | null; limit?: number } = {}): Promise<Record<string, number>> {
  const now = (d.now ?? (() => new Date()))();
  const counts: Record<string, number> = { sent: 0, failed: 0, retry: 0, skipped: 0, digest: 0, deferred: 0 };
  let rows: EventRow[];
  try { rows = await d.store.claim(opts.userId ?? null, opts.limit ?? 50); } catch (e) { log('warn', 'notify_claim_failed', { reason: e instanceof Error ? e.message.slice(0, 60) : 'unknown' }); return counts; }
  if (!rows.length) return counts;
  const names = await d.names(instrumentIds(rows)).catch(() => new Map<string, string>());
  const recipients = new Map<string, Recipient | null>();
  for (const row of rows) {
    try {
      if (!recipients.has(row.user_id)) recipients.set(row.user_id, await d.store.recipient(row.user_id));
      const r = recipients.get(row.user_id) ?? null;
      if (!isEventType(row.event_type)) { await d.store.update([row.id], { status: 'skipped', failure_reason: 'unknown_type' }); counts.skipped++; continue; }
      if (!r || !r.email) { await d.store.update([row.id], { status: 'skipped', failure_reason: r ? 'no_email' : 'no_account' }); counts.skipped++; continue; }
      if (!r.confirmed) {
        if (now.getTime() - Date.parse(row.created_at) > UNVERIFIED_GRACE_MS) { await d.store.update([row.id], { status: 'skipped', failure_reason: 'unverified' }); counts.skipped++; }
        else { await d.store.update([row.id], { status: 'pending', attempts: row.attempts - 1, next_attempt_at: new Date(now.getTime() + 3600_000).toISOString() }); counts.deferred++; }
        continue;
      }
      const def = EVENTS[row.event_type];
      if (!def.mandatory) {
        if (!allowed(r, def.category) || r.prefs.digest === 'off') { await d.store.update([row.id], { status: 'skipped', failure_reason: 'preference' }); counts.skipped++; continue; }
        if (r.prefs.digest !== 'immediate') { await d.store.update([row.id], { status: 'digest' }); counts.digest++; continue; }
        const recent = await d.store.immediateSentSince(row.user_id, new Date(now.getTime() - 3600_000).toISOString());
        if (recent >= IMMEDIATE_CAP) { await d.store.update([row.id], { status: 'digest', failure_reason: 'rate_cap' }); counts.digest++; continue; }
      }
      const mail = def.render(row.payload, context(r, names, row.occurred_at, d));
      const res = await d.send(r.email, mail, row.event_type, row.id);
      if (res.ok) {
        await d.store.update([row.id], { status: 'sent', provider_message_id: res.id, recipient: r.email, sent_at: now.toISOString(), failure_reason: null });
        counts.sent++;
      } else if (row.attempts >= MAX_ATTEMPTS) {
        await d.store.update([row.id], { status: 'failed', failure_reason: res.code.slice(0, 60) }); counts.failed++;
      } else {
        await d.store.update([row.id], { status: 'pending', failure_reason: res.code.slice(0, 60), next_attempt_at: new Date(now.getTime() + 2 ** row.attempts * 60_000).toISOString() }); counts.retry++;
      }
      log('info', 'notify_result', { id: row.id, type: row.event_type, outcome: res.ok ? 'sent' : 'failed', provider_id: res.ok ? res.id : null });
    } catch (e) {
      // An unexpected error leaves the row for the next run (claims older than 10 minutes return to the queue).
      log('warn', 'notify_dispatch_error', { id: row.id, reason: e instanceof Error ? e.message.slice(0, 60) : 'unknown' });
    }
  }
  return counts;
}

/** Sends one summary per account whose digest window has passed (hourly, daily, or the hourly cap). */
export async function runDigests(d: DispatchDeps): Promise<number> {
  const now = (d.now ?? (() => new Date()))();
  let sent = 0;
  const users = await d.store.digestUsers().catch(() => []);
  for (const u of users) {
    try {
      const r = await d.store.recipient(u.userId);
      if (!r || !r.email || !r.confirmed) continue;
      const period = r.prefs.digest === 'daily' ? 'daily' : 'hourly';
      if (now.getTime() - Date.parse(u.oldest) < DIGEST_WINDOW_MS[period]) continue;
      const rows = await d.store.claimDigest(u.userId);
      if (!rows.length) continue;
      const ids = rows.map((x) => x.id);
      const keep = rows.filter((x) => isEventType(x.event_type) && (EVENTS[x.event_type as keyof typeof EVENTS].mandatory || (allowed(r, x.category) && r.prefs.digest !== 'off')));
      if (!keep.length) { await d.store.update(ids, { status: 'skipped', failure_reason: 'preference' }); continue; }
      const names = await d.names(instrumentIds(keep)).catch(() => new Map<string, string>());
      const items = keep.map((x) => { const ctx = context(r, names, x.occurred_at, d); return { subject: EVENTS[x.event_type as keyof typeof EVENTS].render(x.payload, ctx).subject, time: ctx.eventTime }; });
      const digestId = crypto.randomUUID();
      const res = await d.send(r.email, digestEmail(items, { firstName: r.firstName, site: (d.site ?? config.siteUrl).replace(/\/$/, '') }, period), 'DIGEST', digestId);
      if (res.ok) { await d.store.update(keep.map((x) => x.id), { status: 'sent', provider_message_id: res.id, recipient: r.email, sent_at: now.toISOString(), digest_id: digestId }); sent++; }
      else await d.store.update(ids, { status: 'digest', failure_reason: res.code.slice(0, 60) });
      const dropped = ids.filter((id) => !keep.some((k) => k.id === id));
      if (dropped.length && res.ok) await d.store.update(dropped, { status: 'skipped', failure_reason: 'preference' });
    } catch (e) { log('warn', 'notify_digest_error', { reason: e instanceof Error ? e.message.slice(0, 60) : 'unknown' }); }
  }
  return sent;
}

/** The production sender: the one Resend adapter, with the event id as Resend's idempotency key. */
export const resendSender: Sender = (to, mail, kind, key) => sendEmail(to, mail, kind, { idempotencyKey: key });
