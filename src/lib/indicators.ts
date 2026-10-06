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
