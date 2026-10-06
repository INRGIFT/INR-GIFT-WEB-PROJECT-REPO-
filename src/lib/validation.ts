import type { Candle } from './types';

export interface QualityIssue { index: number; code: 'OHLC_INCONSISTENT' | 'NEGATIVE_VOLUME' | 'BAD_TIMESTAMP' | 'OUT_OF_SEQUENCE' | 'DUPLICATE' | 'NON_POSITIVE_PRICE' | 'UNADJUSTED_JUMP'; detail: string }

/**
 * Data-quality gate applied to every OHLCV series before it reaches the API.
 * Rows that fail are quarantined (returned separately) rather than silently shown.
 */
export function validateCandles(candles: Candle[], opts: { maxGapPct?: number } = {}): { clean: Candle[]; quarantined: Candle[]; issues: QualityIssue[] } {
  const issues: QualityIssue[] = [];
  const bad = new Set<number>();
  const seen = new Set<string>();
  const flag = (index: number, code: QualityIssue['code'], detail: string) => { issues.push({ index, code, detail }); bad.add(index); };
  let prevT = -Infinity;
  let prevClose: number | null = null;
  candles.forEach((c, i) => {
    const t = Date.parse(c.t);
    if (Number.isNaN(t)) return flag(i, 'BAD_TIMESTAMP', c.t);
    if (seen.has(c.t)) return flag(i, 'DUPLICATE', c.t);
    seen.add(c.t);
    if (t < prevT) flag(i, 'OUT_OF_SEQUENCE', c.t);
    prevT = Math.max(prevT, t);
    if (!(c.o > 0 && c.h > 0 && c.l > 0 && c.c > 0)) return flag(i, 'NON_POSITIVE_PRICE', JSON.stringify(c));
    if (c.h < Math.max(c.o, c.c) || c.l > Math.min(c.o, c.c) || c.h < c.l) flag(i, 'OHLC_INCONSISTENT', `h=${c.h} l=${c.l} o=${c.o} c=${c.c}`);
    if (c.v < 0) flag(i, 'NEGATIVE_VOLUME', String(c.v));
    // A very large close-to-close jump usually means a split or dividend was not adjusted.
    if (prevClose != null && Math.abs(c.c / prevClose - 1) * 100 > (opts.maxGapPct ?? 45)) flag(i, 'UNADJUSTED_JUMP', `${prevClose} → ${c.c}`);
    if (!bad.has(i)) prevClose = c.c;
  });
  return { clean: candles.filter((_, i) => !bad.has(i)), quarantined: candles.filter((_, i) => bad.has(i)), issues };
}
export const isStale = (timestamp: string, maxAgeMs: number, now = Date.now()) => now - Date.parse(timestamp) > maxAgeMs;
export const isValidCurrency = (c: string) => /^[A-Z]{3}$/.test(c);
export const isValidMic = (m: string) => /^[A-Z0-9]{4}$/.test(m);
