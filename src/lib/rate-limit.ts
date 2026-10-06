/**
 * Fixed-window rate limiter. In-memory, so it is per server instance: adequate for one node and for development.
 * Replace `store` with Redis/Upstash for multi-instance production; the call site does not change.
 */
const store = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, limit = 120, windowMs = 60_000, now = Date.now()): { ok: boolean; remaining: number; reset: number } {
  const hit = store.get(key);
  if (!hit || hit.reset <= now) {
    store.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1, reset: now + windowMs };
  }
  hit.count += 1;
  return { ok: hit.count <= limit, remaining: Math.max(0, limit - hit.count), reset: hit.reset };
}
