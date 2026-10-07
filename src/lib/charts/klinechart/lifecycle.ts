import type { Chart, Options } from 'klinecharts';
import { COMPARE_TEMPLATE, MACD_TEMPLATE, REBASED_AXIS } from './indicators';

/**
 * KLineChart lifecycle. The library touches `window` when it is imported, so it is loaded only in the browser, on
 * demand (a separate chunk), once per page; INRGIFT's own indicators and axis are registered on that first load.
 * Server rendering never imports it.
 */
type KLineCharts = typeof import('klinecharts');
let loading: Promise<KLineCharts> | null = null;
export function loadKLineCharts(): Promise<KLineCharts> {
  if (typeof window === 'undefined') return Promise.reject(new Error('KLineChart runs in the browser only.'));
  loading ??= import('klinecharts').then((k) => {
    k.registerIndicator(MACD_TEMPLATE);
    k.registerIndicator(COMPARE_TEMPLATE);
    k.registerYAxis(REBASED_AXIS);
    return k;
  }).catch((e) => { loading = null; throw e; });
  return loading;
}

/** Creates a chart in `el`, disposing anything a previous mount left there (React strict mode mounts twice). */
export async function createChart(el: HTMLElement, options: Options): Promise<{ chart: Chart; k: KLineCharts }> {
  const k = await loadKLineCharts();
  k.dispose(el);
  const chart = k.init(el, options);
  if (!chart) throw new Error('The chart could not start in this browser.');
  return { chart, k };
}
export async function destroyChart(el: HTMLElement | null) {
  if (!el || !loading) return;
  try { (await loading).dispose(el); } catch { /* already gone */ }
}

/** Drawing tools offered in the toolbar: KLineChart's built-in overlays, by name. */
export const DRAWING_TOOLS: { name: string; label: string }[] = [
  { name: 'segment', label: 'Trend line' },
  { name: 'horizontalStraightLine', label: 'Horizontal line' },
  { name: 'verticalStraightLine', label: 'Vertical line' },
  { name: 'rayLine', label: 'Ray' },
  { name: 'parallelStraightLine', label: 'Parallel channel' },
  { name: 'priceLine', label: 'Price line' },
  { name: 'fibonacciLine', label: 'Fibonacci retracement' },
  { name: 'simpleAnnotation', label: 'Note' },
];
