import { NextResponse, type NextRequest } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { parseNewsQuery } from '@/services/news/news-query';
import { getNews } from '@/services/news/news-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/news/feed: INRGIFT's filtered, ranked news (section, topic, region, market, assetClass, company, source,
 * hours, relevance, q, cursor). Browser → INRGIFT → news service → NewsData.io; the provider is never called from the
 * browser and its errors are never passed through.
 */
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const rl = rateLimit(`news:${ip}`, req.nextUrl.searchParams.get('q') ? 20 : 60);
  if (!rl.ok) return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Too many news requests. Try again in a minute.' } }, { status: 429 });
  const r = await getNews(parseNewsQuery(Object.fromEntries(req.nextUrl.searchParams)));
  return NextResponse.json({ data: r.articles, meta: { status: r.status, provider: r.provider, retrievedAt: r.retrievedAt, notice: r.notice ?? null, excluded: r.excluded }, pagination: { nextCursor: r.nextCursor } }, { headers: { 'Cache-Control': 'private, max-age=60' } });
}
