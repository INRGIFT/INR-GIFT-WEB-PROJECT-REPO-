/**
 * Server-side cache for provider pages, per server instance. Fresh entries are served without calling the provider
 * (quota protection); entries older than the TTL are refetched; when the provider fails, the last good entry is
 * served as STALE for up to `staleMs`. Keys are built from validated parameters only (never raw browser input).
 */
interface Entry<T> { value: T; at: number }
export class TtlCache<T> {
  private map = new Map<string, Entry<T>>();
  constructor(private ttlMs: number, private staleMs: number, private max = 300) {}
  fresh(key: string, now = Date.now()): Entry<T> | null { const e = this.map.get(key); return e && now - e.at < this.ttlMs ? e : null; }
  stale(key: string, now = Date.now()): Entry<T> | null { const e = this.map.get(key); return e && now - e.at < this.staleMs ? e : null; }
  set(key: string, value: T, now = Date.now()) {
    this.map.delete(key);
    this.map.set(key, { value, at: now });
    while (this.map.size > this.max) this.map.delete(this.map.keys().next().value as string);
  }
  clear() { this.map.clear(); }
}
