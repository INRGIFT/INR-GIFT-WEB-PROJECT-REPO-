import { config, type ProviderKind } from '@/lib/config';
import { DemoProvider } from './demo';
import type { MarketDataProvider } from './provider';
import { ProviderError } from './provider';
import { NSEMarketDataProvider } from './nse';
import { createNseSource } from './nse/source';
import { RealProvider } from './real';

const make = (kind: ProviderKind): MarketDataProvider => (kind === 'nse' ? new NSEMarketDataProvider(createNseSource()) : kind === 'real' ? new RealProvider() : new DemoProvider());

/** Last-known-good cache, keyed by method + arguments. Records provenance so the UI can label the result STALE. */
const lastGood = new Map<string, { value: unknown; at: number; source: string }>();

/**
 * Fallback chain: primary → secondary → last-known-good.
 * Every successful call refreshes the cache; a failure walks down the chain.
 * A value served from cache has its `meta.dataStatus` (when present) rewritten to STALE.
 */
export function withFallback(primary: MarketDataProvider, secondary: MarketDataProvider | null): MarketDataProvider {
  const stale = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(stale);
    if (v && typeof v === 'object' && 'meta' in v) { const o = v as { meta: { dataStatus: string }; status?: string }; return { ...o, ...(o.status ? { status: 'STALE' } : {}), meta: { ...o.meta, dataStatus: 'STALE' } }; }
    return v;
  };
  return new Proxy(primary, {
    get(target, prop: string) {
      const original = (target as unknown as Record<string, unknown>)[prop];
      if (typeof original !== 'function') return original;
      return async (...args: unknown[]) => {
        const key = `${prop}:${JSON.stringify(args)}`;
        for (const p of [primary, secondary]) {
          if (!p) continue;
          try {
            const value = await (p as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>)[prop](...args);
            lastGood.set(key, { value, at: Date.now(), source: p.name });
            return value;
          } catch (e) {
            if (p === (secondary ?? primary) || !secondary) { const hit = lastGood.get(key); if (hit) return stale(hit.value); throw e instanceof ProviderError ? e : new ProviderError('PROVIDER_ERROR', 'The market-data provider did not respond.'); }
          }
        }
        throw new ProviderError('PROVIDER_ERROR', 'No market-data provider is available.');
      };
    },
  });
}

let instance: MarketDataProvider | null = null;
/** The only place the application obtains a provider. */
export function getProvider(): MarketDataProvider {
  instance ??= withFallback(make(config.provider), config.fallbackProvider ? make(config.fallbackProvider) : null);
  return instance;
}
export type { MarketDataProvider } from './provider';
export { ProviderError } from './provider';
