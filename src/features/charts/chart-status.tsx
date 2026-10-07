import { StatusBadge } from '@/components/ui/data-status';
import { SESSION_LABEL } from '@/lib/calendar';
import type { ChartSeries } from '@/lib/charts/types';
import { cn } from '@/lib/format';

/**
 * "07 Oct 2026, 15:30 IST" in the venue's own time zone, with the zone's short name. en-GB has no abbreviation for
 * India ("GMT+5:30"), so India Standard Time is written as IST, as everywhere else in INRGIFT.
 */
export function asOfText(iso: string, timezone: string): string {
  try {
    const text = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short' }).format(new Date(iso));
    return timezone === 'Asia/Kolkata' || timezone === 'Asia/Calcutta' ? text.replace(/GMT\+5:30$/, 'IST') : text;
  } catch { return iso; }
}

/** Status, market session and as-of time: always shown together, in words and glyphs, never by colour alone. */
export function ChartStatusChips({ series, className }: { series: ChartSeries; className?: string }) {
  const session = series.session ? `${SESSION_LABEL[series.session]}${series.holidayName ? ` · ${series.holidayName}` : ''}` : 'No single exchange session';
  return (
    <p className={cn('flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate2', className)}>
      <StatusBadge status={series.status} />
      <span className="inline-flex items-center gap-1"><span aria-hidden className={cn('text-[9px]', series.session === 'OPEN' ? 'text-up' : 'text-faint')}>{series.session === 'OPEN' ? '●' : '○'}</span><span><span className="sr-only">Market session: </span>{session}</span></span>
      {series.asOf && <span>As of <time dateTime={series.asOf}>{asOfText(series.asOf, series.timezone)}</time></span>}
    </p>
  );
}

/** Notices that change how the chart should be read: demo values, a stale copy, a closed market, dropped bars. */
export function ChartNotices({ series }: { series: ChartSeries }) {
  const closed = series.session === 'CLOSED' || series.session === 'HOLIDAY';
  const notes: [string, string, string][] = [];
  if (series.status === 'DEMO') notes.push(['◇', 'text-warn', 'Demo data: simulated values for development and previews, not market prices.']);
  if (series.status === 'STALE') notes.push(['◐', 'text-warn', 'Served from the last good copy after a provider failure. Values may be out of date.']);
  if (closed) notes.push(['○', 'text-slate2', `Market ${series.session === 'HOLIDAY' ? `holiday${series.holidayName ? ` (${series.holidayName})` : ''}` : 'closed'}. The chart shows data up to the last session${series.asOf ? `, ${asOfText(series.asOf, series.timezone)}` : ''}; no new bars are added until it reopens.`]);
  if (series.quarantined > 0) notes.push(['◆', 'text-slate2', `${series.quarantined} ${series.quarantined === 1 ? 'bar' : 'bars'} failed validation and ${series.quarantined === 1 ? 'is' : 'are'} not shown.`]);
  if (!notes.length) return null;
  return <ul className="space-y-1 text-xs text-slate2">{notes.map(([g, tone, text]) => <li key={text} className="flex gap-1.5"><span aria-hidden className={tone}>{g}</span><span>{text}</span></li>)}</ul>;
}
