import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { CompanyContact } from '@/components/layout/company-contact';
import { PageContainer, PageHeader, Panel } from '@/components/ui/primitives';
import { COMPANY, LEGAL_PATHS } from '@/lib/company';
import { pageMetadata } from '@/lib/seo';
import { breadcrumbs, JsonLd, organization } from '@/lib/structured-data';

export const metadata = pageMetadata({ title: 'About INRGIFT', description: 'INRGIFT is a global market research and intelligence platform built from India. Invest Beyond Borders: every market, every asset, one research view.', path: LEGAL_PATHS.about });

/** Only capabilities that exist in the product today. */
const CAPABILITIES: [string, string][] = [
  ['Global market discovery', 'Exchanges across regions with their trading sessions on India time, holidays and benchmark indices, and instruments across stocks, ETFs, indices, currencies, commodities, bonds and REITs.'],
  ['Screening', 'A screener with more than thirty metrics, nested filter groups and shareable links.'],
  ['Comparative analysis', 'Side-by-side comparison of up to four assets, with performance, risk and identity details.'],
  ['Visualisation', 'Price charts with indicators and a global heatmap you can drill into from the world to a single company.'],
  ['Research', 'Structured notes on stocks, ETFs, markets, sectors, themes and countries, each with sources, limitations and method.'],
  ['News and context', 'Business and market news filtered for relevance and linked to the companies and markets it concerns.'],
  ['Your workspace', 'Watchlists, alerts that notify you, saved screens and comparisons, notes and collections, private to your account.'],
];
const AUDIENCE = ['Individual investors in India who want to understand markets beyond India', 'People who research before they decide and want sources and timestamps with every figure', 'Students and professionals learning how global markets, currencies and asset classes fit together'];

export default function AboutPage() {
  return (
    <PageContainer className="max-w-[1100px]">
      <JsonLd data={[organization(), breadcrumbs([['Home', '/'], ['About']])]} />
      <PageHeader crumbs={[['Home', '/'], ['About']]} title="About INRGIFT" lead={COMPANY.descriptor} />
      <section className="rounded-card bg-navy px-6 py-8 text-white">
        <p className="text-ui font-semibold uppercase tracking-[.22em] text-ice">{COMPANY.tagline}</p>
        <p className="mt-2 font-display text-[28px] font-extrabold leading-tight md:text-[34px]">{COMPANY.promise}</p>
        <p className="mt-3 max-w-[70ch] text-white/75">INRGIFT is a global market research and intelligence platform built from India. It brings markets and asset classes from around the world into one research view, read the way an Indian investor reads them: in rupees, on India time, with the exchange rate in between.</p>
      </section>
      <section aria-labelledby="workflow">
        <h2 id="workflow" className="mb-3 text-lg font-bold">One research workflow</h2>
        <ol className="flex flex-wrap items-center gap-2 text-[14px]">{COMPANY.workflow.map((s, i) => <li key={s} className="flex items-center gap-2"><span className="rounded-full border border-line bg-white px-3 py-1 font-semibold text-navy">{s}</span>{i < COMPANY.workflow.length - 1 && <ArrowRight size={14} aria-hidden className="text-faint" />}</li>)}</ol>
      </section>
      <section aria-labelledby="capabilities">
        <h2 id="capabilities" className="mb-3 text-lg font-bold">What INRGIFT does</h2>
        <div className="grid gap-4 md:grid-cols-2">{CAPABILITIES.map(([t, d]) => <Panel key={t} title={t}><p className="text-slate2">{d}</p></Panel>)}</div>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Who it is for"><ul className="list-disc space-y-1.5 pl-5 text-slate2">{AUDIENCE.map((a) => <li key={a}>{a}</li>)}</ul></Panel>
        <Panel title="Research, not execution">
          <p className="text-slate2">INRGIFT is a research, data and discovery platform. It is not a broker, an exchange or an investment adviser. It does not place or execute orders, hold money or securities, or give personalised recommendations. Alerts notify you; they never act for you. Read the <Link className="link" href={LEGAL_PATHS.risk}>risk disclaimer</Link>.</p>
        </Panel>
      </div>
      <section aria-labelledby="contact" className="grid gap-4 rounded-card border border-line bg-white p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <h2 id="contact" className="text-lg font-bold">Contact</h2>
          <p className="mt-1 text-slate2">Questions about INRGIFT, your account or our policies: visit <Link className="link" href={LEGAL_PATHS.support}>Support</Link> or write to us.</p>
        </div>
        <CompanyContact title={null} />
      </section>
    </PageContainer>
  );
}
