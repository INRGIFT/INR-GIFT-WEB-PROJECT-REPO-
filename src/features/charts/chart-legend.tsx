import { Change } from '@/components/ui/primitives';
import { formatBarTime } from '@/lib/charts/klinechart/formatting';
import type { ChartSeries } from '@/lib/charts/types';
import { cn, compact, num } from '@/lib/format';

export interface LegendBar { timestamp: number; open: number; high: number; low: number; close: number; volume?: number }

/**
 * Open, high, low, close (and volume) of the bar under the crosshair, or the latest bar. In relative mode values are
 * percent change from the start of the period. Change is against the previous bar's close.
 */
export function ChartLegend({ bar, prevClose, series, relative, className }: { bar: LegendBar | null; prevClose: number | null; series: ChartSeries; relative: boolean; className?: string }) {
  if (!bar) return null;
  const v = (x: number) => (relative ? `${x > 0 ? '+' : x < 0 ? '−' : ''}${num(Math.abs(x), 2)}%` : num(x, series.pricePrecision));
  const change = prevClose != null && !relative && prevClose !== 0 ? (bar.close / prevClose - 1) * 100 : null;
  const cells: [string, string][] = [['O', v(bar.open)], ['H', v(bar.high)], ['L', v(bar.low)], ['C', v(bar.close)]];
  return (
    <div className={cn('flex min-h-[20px] flex-wrap items-center gap-x-3 gap-y-0.5 text-xs', className)}>
      <span className="font-medium text-slate2">{formatBarTime(bar.timestamp, series.resolution, series.timezone, 'tooltip')}</span>
      {cells.map(([k, text]) => <span key={k} className="num whitespace-nowrap"><span className="text-faint">{k}</span> <span className="font-medium text-navy">{text}</span></span>)}
      {change != null && <span className="text-[12px]"><Change value={change} /></span>}
      {bar.volume != null && !relative && <span className="num whitespace-nowrap"><span className="text-faint">Vol</span> <span className="font-medium text-navy">{compact(bar.volume)}</span></span>}
    </div>
  );
}
