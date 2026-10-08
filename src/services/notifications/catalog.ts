import { alertLabel } from '@/lib/alerts';
import { COMPANY } from '@/lib/company';
import { detailEmail, type RenderedEmail } from '@/services/email/templates';

/**
 * Every notification INRGIFT sends outside the Supabase Auth hook, by event type. Only events that correspond to real
 * product functionality are listed: each is produced by a database trigger (migration 0009) or by a server route after
 * the action succeeded. Authentication emails (sign-up code, password reset, email change, Google/Apple identity
 * linked) stay on the Send Email Hook (src/app/api/hooks/send-email/route.ts).
 *
 *   security  always sent, immediately (new sign-in, password, phone, sessions)
 *   account   always sent (welcome, GIFT ID, profile)
 *   support   always sent (support, grievance, account-closure acknowledgements)
 *   watchlist / alerts / research   optional: preferences, digests and the hourly cap apply
 */
export type NotificationCategory = 'security' | 'account' | 'support' | 'watchlist' | 'alerts' | 'research';
export const EVENT_TYPES = [
  'USER_WELCOME', 'GIFT_ID_ASSIGNED', 'PROFILE_UPDATED', 'PROFILE_COMPLETED',
  'NEW_SESSION', 'PASSWORD_CHANGED', 'PHONE_CHANGED', 'SESSIONS_REVOKED',
  'SUPPORT_REQUEST_RECEIVED', 'GRIEVANCE_RECEIVED', 'ACCOUNT_CLOSURE_REQUEST_RECEIVED',
  'WATCHLIST_CREATED', 'WATCHLIST_UPDATED', 'WATCHLIST_DELETED', 'WATCHLIST_ITEM_ADDED', 'WATCHLIST_ITEM_REMOVED',
  'ALERT_CREATED', 'ALERT_UPDATED', 'ALERT_DELETED', 'ALERT_TRIGGERED',
  'RESEARCH_SAVED', 'RESEARCH_REMOVED', 'SCREEN_SAVED', 'COMPARISON_SAVED',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/** What a template may use: the event's own record, the account and resolved instrument names. Nothing else. */
export interface RenderContext {
  firstName: string | null;
  /** Event time, formatted in the account's time zone with the zone named (e.g. "08 Oct 2026, 11:48 (Asia/Kolkata)"). */
  eventTime: string;
  site: string;
  /** The active data source is the demo provider: market references say so. */
  demoData: boolean;
  instrument(id: unknown): string | null;
  time(iso: unknown): string | null;
}
type P = Record<string, unknown>;
interface EventDef { category: NotificationCategory; mandatory: boolean; render(p: P, c: RenderContext): RenderedEmail; inApp?: (p: P) => { title: string; body: string; href: string } }

const SECURITY_FOOT = `If you did not do this, reset your password and contact ${COMPANY.supportEmail} immediately.`;
const ACTIVITY_FOOT = 'You can choose which activity emails you receive in Preferences.';
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const inst = (p: P, c: RenderContext) => c.instrument(p.instrument_id) ?? 'An instrument that is no longer listed';
const internal = (c: RenderContext, href: unknown, fallback: string) => `${c.site}${typeof href === 'string' && /^\/(?!\/)[^\s]*$/.test(href) ? href : fallback}`;
const CHANGED_LABEL: Record<string, string> = { name: 'Name', country: 'Country', condition: 'Condition', threshold: 'Level', delivery: 'Delivery', note: 'Note', status: 'Status' };
const changed = (p: P) => (Array.isArray(p.changed) ? p.changed.filter((x): x is string => typeof x === 'string').map((x) => CHANGED_LABEL[x] ?? x).join(', ') : '');
const condition = (p: P) => alertLabel(String(p.kind ?? ''), typeof p.threshold === 'number' ? p.threshold : p.threshold != null && Number.isFinite(Number(p.threshold)) ? Number(p.threshold) : null);
const STATUS: Record<string, string> = { active: 'Watching', paused: 'Paused', triggered: 'Triggered' };
const METHOD: Record<string, string> = { password: 'Email and password', google: 'Google', apple: 'Apple', oauth: 'Google or Apple' };

export const EVENTS: Record<EventType, EventDef> = {
  USER_WELCOME: { category: 'account', mandatory: true, render: (_p, c) => detailEmail('Welcome to INRGIFT', {
    firstName: c.firstName, intro: 'Your email address is verified and your INRGIFT account is ready.',
    after: [`INRGIFT is ${COMPANY.descriptor.toLowerCase()}: research global stocks, ETFs, indices, currencies, commodities and bonds; screen, compare, save research and follow market news in one view.`,
      'INRGIFT is a research and information platform. It is not a broker or an investment adviser, and nothing on it is a recommendation.',
      'Next: open your workspace, set your display preferences and build a watchlist.'],
    action: { label: 'Open your workspace', href: `${c.site}/app` } }) },
  GIFT_ID_ASSIGNED: { category: 'account', mandatory: true, render: (p, c) => detailEmail('Your INRGIFT GIFT ID', {
    firstName: c.firstName, intro: 'Your permanent INRGIFT GIFT ID is:', rows: [['GIFT ID', str(p.gift_id) ?? '—']],
    after: ['It identifies your INRGIFT account for good: it never changes and is never given to anyone else.', 'It is not a password, a one-time code or a sign-in credential, and nobody can use it to sign in.', 'Quote it when you contact support. Do not post it publicly.'],
    action: { label: 'View your profile', href: `${c.site}/account/profile` } }) },
  PROFILE_UPDATED: { category: 'account', mandatory: true, render: (p, c) => detailEmail('Your INRGIFT profile was updated', {
    firstName: c.firstName, intro: 'Your profile was recently updated.', rows: [['Changed', changed(p) || '—'], ['Time', c.eventTime]], foot: SECURITY_FOOT,
    action: { label: 'Review your profile', href: `${c.site}/account/profile` } }) },
  PROFILE_COMPLETED: { category: 'account', mandatory: true, render: (_p, c) => detailEmail('Your INRGIFT profile is complete', {
    firstName: c.firstName, intro: 'Your INRGIFT profile is complete: your workspace is open.', rows: [['Time', c.eventTime]], foot: SECURITY_FOOT,
    action: { label: 'Open your workspace', href: `${c.site}/app` } }) },
  NEW_SESSION: { category: 'security', mandatory: true, render: (p, c) => detailEmail('New sign-in to your INRGIFT account', {
    firstName: c.firstName, intro: 'Your INRGIFT account was just signed in to.',
    rows: [['Time', c.eventTime], ['Signed in with', METHOD[String(p.method)] ?? 'Your account credentials'], ...(str(p.device) ? [['Device', String(p.device)] as [string, string]] : [])],
    after: ['If this was you, there is nothing to do.'], foot: `If you do not recognise this sign-in, sign out on all devices from Security, reset your password and contact ${COMPANY.supportEmail}.`,
    action: { label: 'Review security', href: `${c.site}/account/security` } }), inApp: () => ({ title: 'New sign-in to your account', body: 'If this was not you, sign out on all devices and reset your password.', href: '/account/security' }) },
  PASSWORD_CHANGED: { category: 'security', mandatory: true, render: (p, c) => detailEmail('Your INRGIFT password was changed', {
    firstName: c.firstName, intro: 'The password on your INRGIFT account was changed.', rows: [['Time', c.eventTime]],
    after: p.others_signed_out === true ? ['Your other sessions were signed out.'] : [], foot: SECURITY_FOOT }), inApp: () => ({ title: 'Your password was changed', body: 'If this was not you, contact support immediately.', href: '/account/security' }) },
  PHONE_CHANGED: { category: 'security', mandatory: true, render: (p, c) => detailEmail('Your INRGIFT mobile number was changed', {
    firstName: c.firstName, intro: 'The mobile number on your INRGIFT account was changed.', rows: [['New number', str(p.masked_phone) ?? '—'], ['Time', c.eventTime]], foot: SECURITY_FOOT }) },
  SESSIONS_REVOKED: { category: 'security', mandatory: true, render: (_p, c) => detailEmail('INRGIFT sessions signed out', {
    firstName: c.firstName, intro: 'Every session of your INRGIFT account was signed out, on all devices.', rows: [['Time', c.eventTime]],
    after: ['Each device needs your password (or Google or Apple) to sign in again.'], foot: SECURITY_FOOT }), inApp: () => ({ title: 'All sessions were signed out', body: 'Every device must sign in again.', href: '/account/security' }) },
  SUPPORT_REQUEST_RECEIVED: { category: 'support', mandatory: true, render: (p, c) => detailEmail('INRGIFT support request received', {
    firstName: c.firstName, intro: 'We received your support request.', rows: [['Reference', str(p.reference) ?? '—'], ['Topic', str(p.topic) ?? '—'], ['Submitted', c.eventTime]],
    after: [`Our team replies by email from ${COMPANY.supportEmail}. Quote the reference above in any follow-up.`] }) },
  GRIEVANCE_RECEIVED: { category: 'support', mandatory: true, render: (p, c) => detailEmail('INRGIFT grievance request received', {
    firstName: c.firstName, intro: 'We received your grievance.', rows: [['Reference', str(p.reference) ?? '—'], ['Category', str(p.topic) ?? '—'], ['Submitted', c.eventTime]],
    after: [`We reply by email from ${COMPANY.supportEmail}. Quote the reference above in any follow-up.`] }) },
  ACCOUNT_CLOSURE_REQUEST_RECEIVED: { category: 'support', mandatory: true, render: (p, c) => detailEmail('INRGIFT account closure request received', {
    firstName: c.firstName, intro: 'Your account closure request has been submitted.', rows: [['Reference', str(p.reference) ?? '—'], ...(str(p.gift_id) ? [['GIFT ID', String(p.gift_id)] as [string, string]] : []), ['Submitted', c.eventTime]],
    after: ['The closure process takes 2 working days once the request is submitted. Your account stays open until then.'], foot: `If you did not make this request, contact ${COMPANY.supportEmail} immediately.` }) },
  WATCHLIST_CREATED: { category: 'watchlist', mandatory: false, render: (p, c) => detailEmail('Your INRGIFT watchlist was created', {
    firstName: c.firstName, intro: 'A new watchlist was created in your workspace.', rows: [['Watchlist', str(p.name) ?? '—'], ['Time', c.eventTime]], foot: ACTIVITY_FOOT, action: { label: 'Open watchlists', href: `${c.site}/app/watchlist` } }) },
  WATCHLIST_UPDATED: { category: 'watchlist', mandatory: false, render: (p, c) => detailEmail('Your INRGIFT watchlist was updated', {
    firstName: c.firstName, intro: 'A watchlist was renamed.', rows: [['Watchlist', str(p.name) ?? '—'], ['Previously', str(p.previous_name) ?? '—'], ['Time', c.eventTime]], foot: ACTIVITY_FOOT, action: { label: 'Open watchlists', href: `${c.site}/app/watchlist` } }) },
  WATCHLIST_DELETED: { category: 'watchlist', mandatory: false, render: (p, c) => detailEmail('Your INRGIFT watchlist was deleted', {
    firstName: c.firstName, intro: 'A watchlist was deleted from your workspace.', rows: [['Watchlist', str(p.name) ?? '—'], ['Time', c.eventTime]], foot: ACTIVITY_FOOT }) },
  WATCHLIST_ITEM_ADDED: { category: 'watchlist', mandatory: false, render: (p, c) => detailEmail('Added to your INRGIFT watchlist', {
    firstName: c.firstName, intro: 'An instrument was added to a watchlist.', rows: [['Instrument', inst(p, c)], ['Watchlist', str(p.watchlist_name) ?? '—'], ['Time', c.eventTime]], foot: ACTIVITY_FOOT, action: { label: 'Open watchlists', href: `${c.site}/app/watchlist` } }) },
  WATCHLIST_ITEM_REMOVED: { category: 'watchlist', mandatory: false, render: (p, c) => detailEmail('Removed from your INRGIFT watchlist', {
    firstName: c.firstName, intro: 'An instrument was removed from a watchlist.', rows: [['Instrument', inst(p, c)], ['Watchlist', str(p.watchlist_name) ?? '—'], ['Time', c.eventTime]], foot: ACTIVITY_FOOT }) },
  ALERT_CREATED: { category: 'alerts', mandatory: false, render: (p, c) => detailEmail('INRGIFT alert created', {
    firstName: c.firstName, intro: 'A new alert is watching for you. Alerts only notify you; nothing else happens automatically.',
    rows: [['Instrument', inst(p, c)], ['Condition', condition(p)], ['Status', STATUS[String(p.status)] ?? '—'], ['Delivery', p.channel === 'email' ? 'In INRGIFT and by email' : 'In INRGIFT'], ['Created', c.eventTime]],
    foot: ACTIVITY_FOOT, action: { label: 'Open alerts', href: `${c.site}/app/alerts` } }) },
  ALERT_UPDATED: { category: 'alerts', mandatory: false, render: (p, c) => detailEmail('Your INRGIFT alert was updated', {
    firstName: c.firstName, intro: 'An alert was changed.', rows: [['Instrument', inst(p, c)], ['Changed', changed(p) || '—'], ['Condition now', condition(p)], ['Status', STATUS[String(p.status)] ?? '—'], ['Time', c.eventTime]],
    foot: ACTIVITY_FOOT, action: { label: 'Open alerts', href: `${c.site}/app/alerts` } }) },
  ALERT_DELETED: { category: 'alerts', mandatory: false, render: (p, c) => detailEmail('Your INRGIFT alert was removed', {
    firstName: c.firstName, intro: 'An alert was removed.', rows: [['Instrument', inst(p, c)], ['Condition', condition(p)], ['Time', c.eventTime]], foot: ACTIVITY_FOOT }) },
  ALERT_TRIGGERED: { category: 'alerts', mandatory: false, render: (p, c) => detailEmail(`INRGIFT alert triggered: ${inst(p, c)}`, {
    firstName: c.firstName, intro: 'Your alert condition was met. Alerts only notify you; nothing else happens automatically.',
    rows: [['Instrument', inst(p, c)], ['Condition', condition(p)], ['Triggered', c.time(p.triggered_at) ?? c.eventTime], ['Data', c.demoData ? 'Demo provider: simulated values, not market prices' : 'As shown on the instrument page, with its source and time']],
    after: ['The value that met the condition, with its source, status and time, is on the instrument page.'], foot: ACTIVITY_FOOT, action: { label: 'Open alerts', href: `${c.site}/app/alerts` } }) },
  RESEARCH_SAVED: { category: 'research', mandatory: false, render: (p, c) => detailEmail('Research saved to INRGIFT', {
    firstName: c.firstName, intro: 'Research was saved to your workspace.', rows: [['Title', str(p.title) ?? '—'], ['Time', c.eventTime]], foot: ACTIVITY_FOOT, action: { label: 'Open it in INRGIFT', href: internal(c, p.href, '/app/research') } }) },
  RESEARCH_REMOVED: { category: 'research', mandatory: false, render: (p, c) => detailEmail('Saved research removed', {
    firstName: c.firstName, intro: 'Research was removed from your saved items.', rows: [['Title', str(p.title) ?? '—'], ['Time', c.eventTime]], foot: ACTIVITY_FOOT }) },
  SCREEN_SAVED: { category: 'research', mandatory: false, render: (p, c) => detailEmail('INRGIFT screener saved', {
    firstName: c.firstName, intro: 'A screen was saved to your workspace.', rows: [['Screen', str(p.name) ?? '—'], ['Time', c.eventTime]], foot: ACTIVITY_FOOT, action: { label: 'Open saved screens', href: `${c.site}/app/screens` } }) },
  COMPARISON_SAVED: { category: 'research', mandatory: false, render: (p, c) => detailEmail('Your INRGIFT comparison was saved', {
    firstName: c.firstName, intro: 'A comparison was saved to your workspace.',
    rows: [['Comparison', str(p.name) ?? '—'], ['Instruments', Array.isArray(p.instrument_ids) ? p.instrument_ids.map((i) => c.instrument(i) ?? String(i)).join(', ') : '—'], ['Time', c.eventTime]],
    foot: ACTIVITY_FOOT, action: { label: 'Open saved comparisons', href: `${c.site}/app/comparisons` } }) },
};
export const isEventType = (t: string): t is EventType => (EVENT_TYPES as readonly string[]).includes(t);

/** One email for a batch of optional activity (hourly or daily digest, or the hourly cap). */
export function digestEmail(items: { subject: string; time: string }[], c: Pick<RenderContext, 'firstName' | 'site'>, period: 'hourly' | 'daily'): RenderedEmail {
  return detailEmail('Your INRGIFT activity summary', {
    firstName: c.firstName, intro: `${items.length} change${items.length === 1 ? '' : 's'} in your workspace since your last ${period === 'daily' ? 'daily' : 'hourly'} summary:`,
    rows: items.slice(0, 50).map((i) => [i.time, i.subject]), after: items.length > 50 ? [`And ${items.length - 50} more.`] : [],
    foot: ACTIVITY_FOOT, action: { label: 'Open your workspace', href: `${c.site}/app` } });
}
