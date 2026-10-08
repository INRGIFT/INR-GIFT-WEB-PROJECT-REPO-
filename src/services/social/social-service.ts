import { log } from '@/lib/telemetry/log';
import { configured, serverEnv } from '@/lib/server-env';
import { TtlCache } from '@/services/news/news-cache';
import { ProviderError } from '@/services/providers/http';
import { instagram } from './instagram';
import { byNewest } from './social-normalize';
import type { SocialFeed, SocialPlatform, SocialPost } from './social-types';
import { xApi } from './x';

/**
 * INRGIFT social service: homepage → this service → official platform API → normalise → cache. Server only; the
 * browser never calls Instagram or X and no credential leaves the server. Each platform is fetched, cached and failed
 * on its own, so one outage never hides the other or the page. Nothing is shown in place of missing posts.
 *   Cache  SOCIAL_CACHE_SECONDS (default 1800, minimum 300) per platform; after a provider failure the last good posts
 *          are served for up to 24 hours, marked STALE with their retrieval time.
 */
const TTL = () => Math.max(300, Number(process.env.SOCIAL_CACHE_SECONDS) || 1800) * 1000;
const cache = new TtlCache<{ posts: SocialPost[]; retrievedAt: string }>(TTL(), 24 * 3600_000, 4);
export const clearSocialCache = () => cache.clear();
export const SOCIAL_POSTS_PER_PLATFORM = 2;

type Source = { latest(limit: number, now?: Date): Promise<SocialPost[]> };
let overrides: Partial<Record<SocialPlatform, Source | null>> = {};
/** Tests inject mocked platform sources here (null = not configured). */
export const setSocialSources = (o: Partial<Record<SocialPlatform, Source | null>>) => { overrides = o; };
function source(p: SocialPlatform): Source | null {
  if (p in overrides) return overrides[p] ?? null;
  if (p === 'instagram') return configured.instagram() ? instagram({ accessToken: serverEnv.instagramAccessToken(), userId: serverEnv.instagramUserId() }) : null;
  return configured.x() ? xApi({ bearerToken: serverEnv.xBearerToken(), userId: serverEnv.xUserId() }) : null;
}
const NOTICE: Partial<Record<string, string>> = { RATE_LIMITED: 'The platform is limiting requests right now.', INVALID_KEY: 'The connection to the platform needs renewing.', TIMEOUT: 'The platform did not answer in time.' };

async function feed(platform: SocialPlatform, now: Date): Promise<SocialFeed> {
  const src = source(platform);
  if (!src) return { platform, status: 'NOT_CONFIGURED', posts: [], retrievedAt: null };
  const hit = cache.fresh(platform, now.getTime());
  if (hit) return { platform, status: 'CACHED', posts: hit.value.posts, retrievedAt: hit.value.retrievedAt };
  try {
    const posts = (await src.latest(SOCIAL_POSTS_PER_PLATFORM + 3, now)).sort(byNewest).slice(0, SOCIAL_POSTS_PER_PLATFORM);
    const value = { posts, retrievedAt: now.toISOString() };
    cache.set(platform, value, now.getTime());
    return { platform, status: 'FRESH', ...value };
  } catch (e) {
    const code = e instanceof ProviderError ? e.code : 'UNAVAILABLE';
    log('warn', 'social_provider_failed', { platform, code });
    const stale = cache.stale(platform, now.getTime());
    const notice = NOTICE[code] ?? 'The platform is unavailable right now.';
    return stale ? { platform, status: 'STALE', posts: stale.value.posts, retrievedAt: stale.value.retrievedAt, notice } : { platform, status: 'UNAVAILABLE', posts: [], retrievedAt: null, notice };
  }
}
/** Both official accounts, each newest first. Never throws. */
export async function getLatestSocial(now = new Date()): Promise<SocialFeed[]> {
  return Promise.all((['instagram', 'x'] as const).map((p) => feed(p, now)));
}
