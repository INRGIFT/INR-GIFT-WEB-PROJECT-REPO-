import { cn, dateTimeIST, timeIST } from '@/lib/format';
import type { DataMeta, DataStatus as Status } from '@/lib/types';

export const STATUS_LABEL: Record<Status, string> = { LIVE: 'Live', DELAYED: 'Delayed · 15 min', END_OF_DAY: 'End of day', CLOSED: 'Closed', UNAVAILABLE: 'Unavailable', STALE: 'Stale', ERROR: 'Error' };
const TONE: Record<Status, string> = { LIVE: 'bg-up/10 text-up', DELAYED: 'bg-warn/10 text-warn', END_OF_DAY: 'bg-brand-soft text-brand-ink', CLOSED: 'bg-hover text-slate2', UNAVAILABLE: 'bg-hover text-slate2', STALE: 'bg-warn/10 text-warn', ERROR: 'bg-down/10 text-down' };
/** Each status has its own glyph shape, so it is distinguishable without colour. */
const GLYPH: Record<Status, string> = { LIVE: '●', DELAYED: '▲', END_OF_DAY: '■', CLOSED: '○', UNAVAILABLE: '◌', STALE: '◐', ERROR: '◆' };

export function statusLine(meta: Pick<DataMeta, 'timestamp' | 'dataStatus'>): string {
  const t = meta.timestamp;
  switch (meta.dataStatus) {
    case 'LIVE': return `Updated ${timeIST(t)}`;
    case 'DELAYED': return `As of ${timeIST(t)}`;
    case 'END_OF_DAY': return `Close, ${dateTimeIST(t)}`;
    case 'CLOSED': return `Market closed. Last close ${dateTimeIST(t)}`;
    case 'UNAVAILABLE': return `Data unavailable from source. Last available ${dateTimeIST(t)}`;
    case 'STALE': return `Last updated ${dateTimeIST(t)}. A newer value is overdue`;
    case 'ERROR': return `Request failed at ${timeIST(t)}`;
  }
}
export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold', TONE[status], className)}><span aria-hidden className="text-[8px] leading-none">{GLYPH[status]}</span>{STATUS_LABEL[status]}</span>;
}
/** Badge + exact timestamp. Hover or focus shows source and timezone. */
export function DataStatus({ meta, showTime = true, className }: { meta: DataMeta; showTime?: boolean; className?: string }) {
  const tip = `Source: ${meta.source}. Exchange time zone: ${meta.timezone}. Ingested ${dateTimeIST(meta.ingestedAt)}.`;
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-faint', className)} title={tip} tabIndex={0} aria-label={`${STATUS_LABEL[meta.dataStatus]}. ${statusLine(meta)}. ${tip}`}>
      <StatusBadge status={meta.dataStatus} />
      {showTime && <span>{statusLine(meta)}</span>}
    </span>
  );
}
