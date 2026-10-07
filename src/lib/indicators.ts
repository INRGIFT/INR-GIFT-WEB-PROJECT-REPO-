/** Technical indicators on a close series. Pure functions; `null` where the window is not yet full. */
export const sma = (c: number[], n: number): (number | null)[] => {
  let sum = 0;
  return c.map((x, i) => { sum += x; if (i >= n) sum -= c[i - n]; return i < n - 1 ? null : sum / n; });
};
export const ema = (c: number[], n: number): (number | null)[] => {
  if (!c.length) return [];
  const k = 2 / (n + 1);
  let e = c[0];
  return c.map((x, i) => { e = i === 0 ? x : x * k + e * (1 - k); return i < n - 1 ? null : e; });
};
/** Bollinger bands: SMA(n) ± k standard deviations. */
export function bollinger(c: number[], n = 20, k = 2): { mid: (number | null)[]; upper: (number | null)[]; lower: (number | null)[] } {
  const mid = sma(c, n);
  const upper: (number | null)[] = [], lower: (number | null)[] = [];
  c.forEach((_, i) => {
    const m = mid[i];
    if (m == null) { upper.push(null); lower.push(null); return; }
    const win = c.slice(i - n + 1, i + 1);
    const sd = Math.sqrt(win.reduce((s, x) => s + (x - m) ** 2, 0) / n);
    upper.push(m + k * sd); lower.push(m - k * sd);
  });
  return { mid, upper, lower };
}
/** Wilder's RSI. */
export function rsi(c: number[], n = 14): (number | null)[] {
  const out: (number | null)[] = c.map(() => null);
  if (c.length <= n) return out;
  let gain = 0, loss = 0;
  for (let i = 1; i <= n; i++) { const d = c[i] - c[i - 1]; if (d >= 0) gain += d; else loss -= d; }
  gain /= n; loss /= n;
  out[n] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  for (let i = n + 1; i < c.length; i++) {
    const d = c[i] - c[i - 1];
    gain = (gain * (n - 1) + Math.max(d, 0)) / n;
    loss = (loss * (n - 1) + Math.max(-d, 0)) / n;
    out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  }
  return out;
}
/** Percentage change from the first value, for rebased comparison lines. */
export const rebase = (c: number[]): number[] => (c.length ? c.map((x) => (x / c[0] - 1) * 100) : []);
/** EMA seeded with the simple average of its first `n` values (the TA-Lib convention used for MACD). */
function seededEma(values: number[], n: number): (number | null)[] {
  const out: (number | null)[] = values.map(() => null);
  if (values.length < n || n < 1) return out;
  const k = 2 / (n + 1);
  let e = values.slice(0, n).reduce((a, b) => a + b, 0) / n;
  out[n - 1] = e;
  for (let i = n; i < values.length; i++) { e = values[i] * k + e * (1 - k); out[i] = e; }
  return out;
}
/**
 * MACD (Appel): MACD line = EMA(fast) − EMA(slow); signal = EMA(signal) of the MACD line; histogram = MACD − signal.
 * The histogram is the plain difference (no ×2 scaling).
 */
export function macd(c: number[], fast = 12, slow = 26, signal = 9): { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] } {
  const f = seededEma(c, fast), s = seededEma(c, slow);
  const line = c.map((_, i) => (f[i] != null && s[i] != null ? f[i]! - s[i]! : null));
  const start = line.findIndex((v) => v != null);
  const sig: (number | null)[] = c.map(() => null);
  if (start >= 0) seededEma(line.slice(start) as number[], signal).forEach((v, j) => { sig[start + j] = v; });
  return { macd: line, signal: sig, histogram: line.map((m, i) => (m != null && sig[i] != null ? m - sig[i]! : null)) };
}
