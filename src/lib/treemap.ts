export interface Rect<T> { item: T; x: number; y: number; w: number; h: number }
/** Squarified treemap. `value` must be positive; returns rectangles that tile the given box. */
export function squarify<T>(items: T[], value: (t: T) => number, x: number, y: number, w: number, h: number): Rect<T>[] {
  const total = items.reduce((s, i) => s + value(i), 0);
  if (total <= 0 || w <= 0 || h <= 0) return [];
  let rest = items.map((item) => ({ item, area: (value(item) / total) * w * h })).filter((r) => r.area > 0).sort((a, b) => b.area - a.area);
  const out: Rect<T>[] = [];
  while (rest.length) {
    const short = Math.min(w, h) || 1e-9;
    const worst = (row: typeof rest) => {
      const s = row.reduce((a, b) => a + b.area, 0);
      const mx = Math.max(...row.map((r) => r.area));
      const mn = Math.min(...row.map((r) => r.area));
      return Math.max((short * short * mx) / (s * s), (s * s) / (short * short * mn));
    };
    const row = [rest[0]];
    let i = 1;
    while (i < rest.length && worst([...row, rest[i]]) <= worst(row)) row.push(rest[i++]);
    const s = row.reduce((a, b) => a + b.area, 0);
    if (w >= h) {
      const cw = s / h; let cy = y;
      for (const r of row) { out.push({ item: r.item, x, y: cy, w: cw, h: r.area / cw }); cy += r.area / cw; }
      x += cw; w -= cw;
    } else {
      const rh = s / w; let cx = x;
      for (const r of row) { out.push({ item: r.item, x: cx, y, w: r.area / rh, h: rh }); cx += r.area / rh; }
      y += rh; h -= rh;
    }
    rest = rest.slice(i);
  }
  return out;
}
