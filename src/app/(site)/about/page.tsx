import Link from 'next/link';
import { ButtonLink } from '@/components/ui/button';
import { PageContainer, PageHeader, Panel } from '@/components/ui/primitives';
import { SessionRail } from '@/features/markets/widgets';
import { pageMetadata } from '@/lib/seo';
import { breadcrumbs, JsonLd, organization } from '@/lib/structured-data';
import * as md from '@/services/market-data';

export const metadata = pageMetadata({ title: 'About INRGIFT', description: 'INRGIFT is a global market research and intelligence platform built from India: every market, every asset class, one research view, with India context.', path: '/about' });

const PRINCIPLES: [string, string][] = [
  ['Research, not advice', 'Pages describe data and context. There are no ratings, no price targets and nothing tailored to your circumstances.'],
  ['Every number has a source and a time', 'Each data module carries its status and an exact timestamp. Gaps are shown as gaps, never as zeros.'],
  ['India is the point of view', 'Sessions in IST, prices in rupees on request, and the exchange rate beside every foreign return.'],
  ['Your research stays yours', 'Watchlists, alerts and notes are private to your account and protected by row-level security.'],
];
export default async function AboutPage() {
  const [markets, all] = await Promise.all([md.getMarkets(), md.getAssets()]);
  const regions = new Set(markets.map((m) => m.region)).size;
  return (
    <PageContainer className="max-w-[1100px]">
      <JsonLd data={[organization(), breadcrumbs([['Home', '/'], ['About']])]} />
      <PageHeader crumbs={[['Home', '/'], ['About']]} title="Global markets, understood from India" lead="INRGIFT brings every market and asset class into one research view, read through the lens an Indian investor actually uses: rupees, IST and the exchange rate in between." />
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-card border border-line bg-line">{[[markets.length, 'markets'], [regions, 'regions'], [all.length, 'instruments covered']].map(([n, l]) => <div key={l as string} className="bg-white px-4 py-4"><p className="num font-display text-[28px] font-extrabold">{n}</p><p className="text-[13px] text-slate2">{l}</p></div>)}</div>
      <div className="grid gap-4 md:grid-cols-2">{PRINCIPLES.map(([t, d]) => <Panel key={t} title={t}><p className="text-slate2">{d}</p></Panel>)}</div>
      <Panel title="Why India time matters" sub="Regular sessions converted to IST"><SessionRail markets={['us', 'uk', 'jp', 'in'].map((id) => markets.find((m) => m.id === id)!)} now={new Date()} /></Panel>
      <section className="rounded-r-card border border-l-[3px] border-line border-l-saffron bg-white px-5 py-4">
        <h2 className="text-lg font-bold">What INRGIFT is not</h2>
        <p className="mt-1 max-w-[75ch] text-slate2">INRGIFT is a research and information platform. It is not a broker or an investment adviser, it does not hold client funds, and nothing on it is a recommendation. Read the <Link className="link" href="/legal/risk-disclosure">risk disclosure</Link> and the <Link className="link" href="/resources/data">data methodology</Link>.</p>
        <div className="mt-3 flex flex-wrap gap-2"><ButtonLink href="/markets" variant="primary">Explore markets</ButtonLink><ButtonLink href="/pricing">Plans</ButtonLink><ButtonLink href="/contact">Contact us</ButtonLink></div>
      </section>
    </PageContainer>
  );
}
