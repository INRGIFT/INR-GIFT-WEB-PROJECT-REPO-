import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { isSupabaseConfigured } from '@/lib/config';
import { CONTACT_TOPICS, type ContactTopic } from '@/lib/contact';
import { rateLimit } from '@/lib/rate-limit';
import { supabaseServer } from '@/supabase/server';

const Body = z.object({
  name: z.string().trim().min(1, 'Enter your name.').max(80),
  email: z.string().trim().email('Enter a valid email address.').max(254),
  topic: z.enum(CONTACT_TOPICS.map(([t]) => t) as [ContactTopic, ...ContactTopic[]]),
  message: z.string().trim().min(10, 'Write at least a sentence so we can help.').max(4000),
  page: z.string().max(300).optional(),
  website: z.string().max(0).optional(), // honeypot: must stay empty
});

/** Contact form endpoint. Stores to Supabase (insert-only table) when configured; otherwise reports NOT_CONFIGURED. */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const rl = rateLimit(`contact:${ip}`, 5, 10 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Too many messages from this connection. Try again in a few minutes.' } }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: { code: 'INVALID_QUERY', message: parsed.error.issues[0]?.message ?? 'Check the form and try again.', fields: Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), i.message])) } }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ data: { reference: 'ok' } }); // silently drop bots
  if (!isSupabaseConfigured) return NextResponse.json({ error: { code: 'NOT_CONFIGURED', message: 'Message delivery is not configured in this environment.' } }, { status: 503 });
  const sb = await supabaseServer();
  const { website: _hp, ...row } = parsed.data;
  const { error } = await sb.from('support_requests').insert(row);
  if (error) return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Your message could not be saved. Try again in a moment.' } }, { status: 500 });
  return NextResponse.json({ data: { reference: new Date().toISOString().replace(/\D/g, '').slice(2, 14) } }, { status: 201 });
}
