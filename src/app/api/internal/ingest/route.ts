import { timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { validateCandles } from '@/lib/validation';

/**
 * Server-protected ingestion endpoint. A scheduled job or vendor webhook posts raw OHLCV here.
 * Requires the shared secret in `x-ingest-secret`; it is never callable from the browser.
 * This build validates and reports; persisting to `ohlcv` / `data_quarantine` (0002_market_data.sql)
 * with the service-role client is the one step left for the real ingest.
 */
const Body = z.object({ instrumentId: z.string().regex(/^ins_\d{6}$/), source: z.string().min(1).max(40), candles: z.array(z.object({ t: z.string(), o: z.number(), h: z.number(), l: z.number(), c: z.number(), v: z.number() })).max(5000) });

export async function POST(req: NextRequest) {
  const secret = process.env.INGEST_SECRET ?? '';
  const given = req.headers.get('x-ingest-secret') ?? '';
  const ok = secret.length > 0 && given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret));
  if (!ok) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authorised.' } }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: 'INVALID_BODY', message: 'Body does not match the ingest schema.' } }, { status: 400 });
  const { clean, quarantined, issues } = validateCandles(parsed.data.candles);
  return NextResponse.json({ data: { accepted: clean.length, quarantined: quarantined.length, issues: issues.slice(0, 50) }, meta: { timestamp: new Date().toISOString(), source: parsed.data.source, dataStatus: 'LIVE' } });
}
