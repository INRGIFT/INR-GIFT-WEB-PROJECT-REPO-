import Link from 'next/link';
import { ButtonLink } from '@/components/ui/button';
import { Badge, Change, PageContainer, Panel, Section } from '@/components/ui/primitives';
import { Heatmap } from '@/features/heatmap/heatmap';
import { IndexStrip, ModuleFoot, Movers, SectorPanel, SessionRail, freshest } from '@/features/markets/widgets';
import { HomeSearch } from '@/features/site/home-search';
import { dateShort, num } from '@/lib/format';
import { CLASS_LABEL, DIRECTORY_CLASS } from '@/lib/routes';
import type { Region } from '@/lib/types';
import * as md from '@/services/market-data';
import { JsonLd, organization, website } from '@/lib/structured-data';

const REGIONS: Region[] = ['North America', 'Latin America', 'Europe', 'Asia-Pacific', 'Middle East', 'Africa'];
const HEADLINE = ['SP-500', 'NASDAQ-COMPOSITE', 'NIFTY-50', 'GIFT-NIFTY', 'FTSE-100', 'DAX', 'NIKKEI-225', 'HANG-SENG', 'TAIEX', 'DOW-JONES'];

export default async function HomePage() {
  const [markets, all, themes, research, news, calendar, rates] = await Promise.all([md.getMarkets(), md.getAssets(), md.getThemes(), md.getResearch(), md.getNews({ limit: 5 }), md.getCalendar(), md.fxRates()]);
  const equities = all.filter((a) => md.EQUITY_LIKE.includes(a.cls));
  const stocks = all.filter((a) => a.cls === 'stock');
  const indices = HEADLINE.map((s) => all.find((a) => a.slug === s)!).filter(Boolean);
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const upcoming = calendar.filter((e) => e.date >= today).slice(0, 6);
  return (
    <PageContainer>
      <JsonLd data={[organization(), website()]} />
      <section className="grid items-end gap-6 pt-2 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div>
          <p className="text-[13px] font-semibold text-brand-ink">Global market intelligence from India</p>
          <h1 className="mt-1.5 text-[34px] font-extrabold leading-[1.08] md:text-[46px]">Every market. Every asset. One research view.</h1>
          <HomeSearch />
          <div className="mt-3 flex flex-wrap gap-2">{[['Apple', '/stocks/AAPL'], ['NVIDIA', '/stocks/NVDA'], ['NIFTY 50', '/indices/NIFTY-50'], ['Toyota', '/stocks/7203'], ['Gold', '/commodities/GOLD'], ['USD/INR', '/fx/USD-INR']].map(([l, h]) => <Link key={h} href={h} className="rounded-lg border border-line2 bg-white px-2.5 py-1 text-[13px] font-medium transition-colors hover:border-brand hover:text-brand-ink">{l}</Link>)}</div>
        </div>
        <div className="rounded-card border border-line bg-white p-4 shadow-card"><h2 className="mb-2.5 text-[15px] font-bold">Trading sessions on India time</h2><SessionRail markets={['us', 'uk', 'de', 'jp', 'hk', 'in'].map((id) => markets.find((m) => m.id === id)!)} now={now} /></div>
      </section>

      <nav aria-label="Market status by region" className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
        {REGIONS.map((r) => { const ms = markets.filter((m) => m.region === r), open = ms.filter((m) => m.session === 'OPEN').length; return <Link key={r} href={`/markets?region=${encodeURIComponent(r)}`} className="bg-white px-3.5 py-2.5 transition-colors hover:bg-bg"><span className="block font-semibold">{r}</span><span className={`text-xs ${open ? 'text-up' : 'text-slate2'}`}>{open === ms.length ? '● All open' : open ? `◐ ${open} of ${ms.length} open` : '○ Closed'}</span></Link>; })}
      </nav>

      <IndexStrip indices={indices} markets={markets} />

      <Panel title="Global heatmap" sub="Stocks by region, sized by market value, coloured by 1D change" footer={<ModuleFoot meta={freshest(stocks)} more={['Open full heatmap', '/discover/heatmap']} />}><Heatmap compact assets={stocks} /></Panel>
      <Movers list={equities} />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <SectorPanel list={stocks} />
        <Panel title="Themes" flush footer={<Link href="/discover/collections" className="link ml-auto">All collections</Link>}>
          {themes.slice(0, 5).map((t) => { const l = all.filter((a) => t.assetIds.includes(a.id)); const v = l.reduce((s, a) => s + (a.m.m1 ?? 0), 0) / (l.length || 1); return <Link key={t.id} href={`/discover/collections/${t.id}`} className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 transition-colors last:border-0 hover:bg-bg"><span><span className="block font-semibold">{t.name}</span><span className="text-xs text-faint">{l.length} assets</span></span><span className="text-right text-[13px]"><Change value={v} /><span className="block text-[11px] text-faint">1 month</span></span></Link>; })}
        </Panel>
      </div>

      <Section title="Asset classes" link={['All assets', '/assets']}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Object.entries(DIRECTORY_CLASS).map(([seg, cls]) => { const n = all.filter((a) => a.cls === cls).length; return <Link key={seg} href={`/assets/${seg}`} className="rounded-card border border-line bg-white p-3.5 transition-[border-color,box-shadow] duration-150 hover:border-brand hover:shadow-card"><span className="font-display text-[15px] font-bold">{CLASS_LABEL[cls].many}</span><span className="mt-0.5 block text-xs text-faint">{n ? `${n} covered` : 'Coverage not yet available'}</span></Link>; })}</div>
      </Section>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <Panel title="Upcoming" flush footer={<Link href="/resources/calendar" className="link ml-auto">Full calendar</Link>}>
          {upcoming.map((e) => <div key={e.id} className="flex gap-3 border-b border-line px-4 py-2.5 last:border-0"><span className="num w-[52px] shrink-0 text-xs font-semibold text-slate2">{dateShort(e.date).slice(0, 6)}</span><span className="min-w-0"><span className="block truncate font-medium">{e.title}</span><span className="text-xs text-faint"><Badge>{e.kind}</Badge> {e.detail}</span></span></div>)}
        </Panel>
        <Panel title="Research" flush footer={<Link href="/research" className="link ml-auto">All research</Link>}>
          {research.slice(0, 4).map((d) => <Link key={d.id} href={`/research/${d.kind}/${d.slug}`} className="block border-b border-line px-4 py-2.5 transition-colors last:border-0 hover:bg-bg"><span className="block font-semibold">{d.title}</span><span className="mt-1 flex flex-wrap gap-1.5 text-xs text-faint">{d.assetSymbol && <Badge tone="brand">{d.assetSymbol}</Badge>}<Badge>{d.topic}</Badge>{dateShort(d.publishedAt)}</span></Link>)}
        </Panel>
        <Panel title="Market news" flush footer={<Link href="/resources/news" className="link ml-auto">All news</Link>}>
          {news.map((n) => <Link key={n.id} href={n.url} className="block border-b border-line px-4 py-2.5 transition-colors last:border-0 hover:bg-bg"><span className="block font-semibold">{n.headline}</span><span className="mt-1 flex flex-wrap gap-1.5 text-xs text-faint"><Badge>{n.category}</Badge>{n.publisher} · {dateShort(n.publishedAt)}</span></Link>)}
        </Panel>
      </div>

      <section className="rounded-r-card border border-l-[3px] border-line border-l-saffron bg-white px-5 py-4">
        <h2 className="text-lg font-bold">The view from India</h2>
        <p className="mt-1 max-w-[80ch] text-slate2">Every session is shown in IST, every price can be shown in rupees, and foreign returns come with the exchange rate that shapes them. Reference rate today: USD/INR {num(rates.USD, 2)}. GIFT Nifty, traded at NSE IX in GIFT City, sits beside the domestic indices.</p>
        <div className="mt-3 flex flex-wrap gap-2"><ButtonLink href="/markets/India" size="sm">India market</ButtonLink><ButtonLink href="/fx/USD-INR" size="sm">USD/INR</ButtonLink><ButtonLink href="/resources/learn" size="sm">How currency changes returns</ButtonLink></div>
      </section>
    </PageContainer>
  );
}
