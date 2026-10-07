import Link from 'next/link';
import { RESOLUTION_LABEL, type ChartSeries } from '@/lib/charts/types';

/**
 * Provenance under every chart: source, native currency (never converted), venue time zone, bar resolution and count.
 * The charting library is credited with a link to INRGIFT's open-source notices; it supplies no market data.
 */
export function ChartDataInfo({ series, relative }: { series: ChartSeries; relative: boolean }) {
  const unit = series.unit === 'points' ? 'Index points' : series.unit === 'rate' ? `Rate in ${series.currency} per unit` : `Prices in ${series.currency}`;
  return (
    <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-4 py-2 text-xs text-faint">
      <span>Source: {series.source}</span>
      <span>{relative ? 'Change from the start of the period, %' : `${unit} (as quoted, not converted)`}</span>
      <span>Times: {series.timezone}</span>
      <span>{series.bars.length} bars · {RESOLUTION_LABEL[series.resolution]} · {series.listing.exchange}{series.listing.mic && series.listing.mic !== 'XGLB' ? ` (${series.listing.mic})` : ''}</span>
      <Link href="/resources/data" className="hover:text-brand-ink">Methodology</Link>
      <Link href="/legal/open-source" className="ml-auto hover:text-brand-ink">Charts: KLineChart (open source)</Link>
    </footer>
  );
}
