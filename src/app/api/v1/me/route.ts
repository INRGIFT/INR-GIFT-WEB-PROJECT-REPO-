import { NextResponse } from 'next/server';
import { accountProfile } from '@/features/account/account-server';
import { readServerSession } from '@/features/auth/server-facts';
import { authMode } from '@/lib/config';
import { supabaseServer } from '@/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const json = (status: number, body: unknown) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });

/**
 * GET /api/v1/me: the signed-in person's own account (GIFT ID, name, email, phone, country, verification, sign-in
 * methods, dates, this session). Identity comes only from the Supabase session cookie, checked here again even though
 * middleware already requires a verified session. No parameters: there is no way to ask for anyone else.
 */
export async function GET() {
  if (authMode !== 'supabase') return json(404, { error: { code: 'NOT_AVAILABLE', message: 'Account details are kept in this browser in demo mode.' } });
  const sb = await supabaseServer();
  const session = await readServerSession(sb);
  if (!session) return json(401, { error: { code: 'UNAUTHENTICATED', message: 'Sign in to use INRGIFT.' } });
  if (session.gate !== 'ok') return json(403, { error: { code: 'VERIFICATION_REQUIRED', step: session.gate, message: 'Finish verifying your account to use INRGIFT.' } });
  return json(200, { data: await accountProfile(sb, session) });
}
