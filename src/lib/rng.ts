/** Deterministic pseudo-random helpers so demo data is stable across requests and tests. */
export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
export function rng(seed: string): () => number {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Geometric walk of `n` points ending at 1.0 whose total change equals `changePct`. */
export function walk(seed: string, n: number, changePct: number, sd: number): number[] {
  const r = rng(seed);
  const w = [0];
  for (let i = 1; i < n; i++) w.push(w[i - 1] + (r() + r() + r() - 1.5) * sd);
  const start = -Math.log(1 + changePct / 100);
  return w.map((x, i) => Math.exp(x - (w[n - 1] * i) / (n - 1) + start * (1 - i / (n - 1))));
}
