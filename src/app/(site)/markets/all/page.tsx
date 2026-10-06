import type { Metadata } from 'next';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/data-status';
import { PageContainer, PageHeader } from '@/components/ui/primitives';
import { SESSION_LABEL } from '@/lib/calendar';
import { hhmm } from '@/lib/format';
import { marketHref } from '@/lib/routes';
import * as md from '@/services/market-data';

export const metadata: Metadata = { title: 'Markets directory', description: 'Every market INRGIFT covers, with exchanges, currency, hours in IST and data status.', alternates: { canonical: '/markets/all' } };

export default async function MarketsDirectory() {
  const [markets, all] = await Promise.all([md.getMarkets(), md.getAssets({ cls: ['index'] })]);
  const regions = [...new Set(markets.map((m) => m.region))];
  return (
    <PageContainer>
      <PageHeader crumbs={[['Markets', '/markets'], ['Directory']]} title="Markets directory" lead={`${markets.length} markets across ${regions.length} regions. Coverage is read from configuration, so this list grows as data sources are added.`} />
      {regions.map((r) => (
        <section key={r}>
          <h2 className="mb-3 text-lg font-bold">{r}</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {markets.filter((m) => m.region === r).map((m) => (
              <Link key={m.id} href={marketHref(m.slug)} className="rounded-card border border-line bg-white p-4 transition-[border-color,box-shadow] duration-150 hover:border-brand hover:shadow-card">
                <div className="flex items-start justify-between gap-2"><h3 className="text-base font-bold">{m.name}</h3><StatusBadge status={m.dataStatus} /></div>
                <p className="mt-0.5 text-[13px] text-slate2">{m.exchanges.map((e) => e.name).join(' · ')}</p>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
                  <div><dt className="text-xs text-faint">Currency</dt><dd className="font-medium">{m.currency}</dd></div>
                  <div><dt className="text-xs text-faint">Session</dt><dd className="font-medium">{SESSION_LABEL[m.session]}{m.holidayName ? ` · ${m.holidayName}` : ''}</dd></div>
                  <div><dt className="text-xs text-faint">Local time</dt><dd className="num font-medium">{m.localTime}</dd></div>
                  <div><dt className="text-xs text-faint">Hours (IST)</dt><dd className="num font-medium">{hhmm(m.istOpen)}–{hhmm(m.istClose)}</dd></div>
                  <div><dt className="text-xs text-faint">Instruments covered</dt><dd className="num font-medium">{m.assetCount}</dd></div>
                  <div><dt className="text-xs text-faint">Headline index</dt><dd className="truncate font-medium">{all.find((a) => a.marketId === m.id)?.name ?? '—'}</dd></div>
                </dl>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </PageContainer>
  );
}
