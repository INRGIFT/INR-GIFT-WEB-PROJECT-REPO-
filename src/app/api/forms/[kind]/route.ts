import { createHash, randomBytes } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { FORMS, isFormKind, optionLabel, validateForm, type FormKind, type FormValues } from '@/features/forms/definitions';
import { COMPANY } from '@/lib/company';
import { config, isSupabaseConfigured } from '@/lib/config';
import { rateLimit } from '@/lib/rate-limit';
import { configured } from '@/lib/server-env';
import { log } from '@/lib/telemetry/log';
import { sendEmail } from '@/services/email/email-service';
import { formSubmission } from '@/services/email/templates';
import { supabaseServer } from '@/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY = 16_000;
/** A human takes longer than this to fill any of the forms; faster posts are dropped as automated. */
const MIN_FILL_MS = 1200;
const TITLES: Record<FormKind, string> = { support: 'Support request', grievance: 'Grievance', 'account-closure': 'Account closure request' };
const PREFIX: Record<FormKind, string> = { support: 'SUP', grievance: 'GRV', 'account-closure': 'CLS' };
/** Account-closure requests already sent, by hashed email, so a repeat within a day returns the same reference. */
const recentClosures = new Map<string, { ref: string; at: number }>();

const json = (status: number, body: unknown) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const fail = (status: number, code: string, message: string, fields?: Record<string, string>) => json(status, { error: { code, message, ...(fields ? { fields } : {}) } });
const ipOf = (req: NextRequest) => req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'local';
/** Same-origin only: a browser always sends Origin on a cross-site POST, so a foreign origin is refused (CSRF). */
function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // non-browser clients; rate limits and validation still apply
  let host: string;
  try { host = new URL(origin).host; } catch { return false; }
  const allowed = new Set([req.nextUrl.host, req.headers.get('x-forwarded-host') ?? '', req.headers.get('host') ?? '']);
  try { allowed.add(new URL(config.siteUrl).host); } catch { /* ignore */ }
  return allowed.has(host);
}
const reference = (kind: FormKind) => `INR-${PREFIX[kind]}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomBytes(4).toString('hex').toUpperCase()}`;

/** Who submitted, as far as the server can tell: whether a signed-in session's email matches the one given. */
async function sessionMatch(email: string): Promise<string> {
  if (!isSupabaseConfigured) return 'Not checked (sign-in not configured here)';
  try {
    const { data } = await (await supabaseServer()).auth.getUser();
    if (!data.user?.email) return 'Not signed in when submitting';
    return data.user.email.toLowerCase() === email.toLowerCase() ? 'Yes: submitted from a signed-in session with this email' : 'No: signed in with a different email';
  } catch { return 'Could not be checked'; }
}

/**
 * Public form endpoint for /support, /grievance-redressal and /account-closure. Sends the submission to the support
 * inbox through Resend (server only; the API key never reaches the browser). It never closes or deletes anything:
 * an account-closure submission is a request that support handles. Safe errors only; no internal details.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!isFormKind(kind)) return fail(404, 'NOT_FOUND', 'Unknown form.');
  if (!sameOrigin(req)) return fail(403, 'FORBIDDEN', 'This form can only be sent from inrgift.com.');
  if (!(req.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return fail(415, 'UNSUPPORTED', 'Send the form as JSON.');
  const ip = ipOf(req);
  if (!rateLimit(`form:${kind}:${ip}`, 5, 10 * 60_000).ok || !rateLimit(`form:${kind}:all`, 300, 60 * 60_000).ok) return fail(429, 'RATE_LIMITED', 'Too many submissions from this connection. Try again in a few minutes, or email support@inrgift.com.');
  const raw = await req.text().catch(() => '');
  if (raw.length > MAX_BODY) return fail(413, 'TOO_LARGE', 'The form is too long. Shorten the message and try again.');
  let body: Record<string, unknown>;
  try { const parsed = JSON.parse(raw) as unknown; if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(); body = parsed as Record<string, unknown>; }
  catch { return fail(400, 'INVALID_QUERY', 'Check the form and try again.'); }
  // Honeypot and fill time: automated posts get a neutral answer and nothing is sent.
  const elapsed = typeof body.elapsedMs === 'number' ? body.elapsedMs : 0;
  if ((typeof body.website === 'string' && body.website.length > 0) || elapsed < MIN_FILL_MS) return json(202, { data: { received: true } });
  const { values, errors } = validateForm(kind, body);
  if (Object.keys(errors).length) return fail(400, 'INVALID_QUERY', 'Some fields need attention.', errors);
  const email = String(values.email);

  const emailKey = createHash('sha256').update(email.toLowerCase()).digest('hex');
  if (kind === 'account-closure') {
    const prev = recentClosures.get(emailKey);
    if (prev && Date.now() - prev.at < 24 * 60 * 60_000) return json(200, { data: { reference: prev.ref, duplicate: true } });
  }
  if (!rateLimit(`form:${kind}:email:${emailKey}`, 3, 60 * 60_000).ok) return fail(429, 'RATE_LIMITED', 'Several requests have already been sent for this email address. Please wait for our reply.');
  if (!configured.email()) return fail(503, 'NOT_CONFIGURED', `This form cannot be sent right now. Please email ${COMPANY.supportEmail} instead.`);

  const ref = reference(kind);
  const rows = rowsFor(kind, values);
  rows.push(['Reference', ref], ['Submitted at', new Date().toISOString()]);
  if (kind === 'account-closure') rows.push(['Signed-in session check', await sessionMatch(email)]);
  const subject = kind === 'account-closure' ? 'INRGIFT Account Closure Request'
    : kind === 'grievance' ? `INRGIFT Grievance ${ref}: ${String(values.subject).slice(0, 120)}`
    : `INRGIFT Support: ${optionLabel(FORMS.support.fields.find((f) => f.name === 'category')!, String(values.category))}: ${String(values.subject).slice(0, 120)}`;
  const inbox = process.env.SUPPORT_INBOX_EMAIL?.trim() || COMPANY.supportEmail;
  const sent = await sendEmail(inbox, formSubmission(subject, `${TITLES[kind]} ${ref}`, rows), `form_${kind}`, { replyTo: email });
  if (!sent.ok) {
    log('warn', 'form_send_failed', { kind, code: sent.code });
    return fail(502, 'SEND_FAILED', `Your ${kind === 'support' ? 'message' : 'request'} could not be sent. Please try again, or email ${COMPANY.supportEmail}.`);
  }
  if (kind === 'account-closure') {
    recentClosures.set(emailKey, { ref, at: Date.now() });
    if (recentClosures.size > 5000) recentClosures.clear();
  }
  log('info', 'form_submitted', { kind, reference: ref });
  return json(201, { data: { reference: ref } });
}

/** The submission as label/value rows, in form order. Checkboxes read "Confirmed". */
function rowsFor(kind: FormKind, v: FormValues): [string, string][] {
  return FORMS[kind].fields
    .filter((f) => v[f.name] !== '' && v[f.name] !== undefined)
    .map((f) => [f.type === 'checkbox' ? `Confirmed: ${f.label}` : f.label, f.type === 'checkbox' ? (v[f.name] ? 'Yes' : 'No') : f.type === 'select' ? optionLabel(f, String(v[f.name])) : String(v[f.name])] as [string, string]);
}
