import type { Metadata } from 'next';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { EmptyState, NoResults, PageContainer, PageHeader, Panel } from '@/components/ui/primitives';
import { AssetTable } from '@/features/assets/asset-table';
import { SESSION_LABEL } from '@/lib/calendar';
import { collectionHref, marketHref } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import * as md from '@/services/market-data';

type Props = { searchParams: Promise<{ q?: string }> };
/** Search results never get indexed: the canonical is /search and robots are noindex, follow. */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> { const { q } = await searchParams; return pageMetadata({ title: q ? `Search: ${q.slice(0, 60)}` : 'Search', description: 'Search INRGIFT for assets, markets, research and themes.', path: '/search', index: 'faceted' }); }

/** Full search results page. Works without JavaScript and is the target of the site's SearchAction. */
export default async function SearchPage({ searchParams }: Props) {
  const q = ((await searchParams).q ?? '').trim().slice(0, 80);
  const r = q ? await md.search(q) : null;
  const total = r ? r.assets.length + r.markets.length + r.research.length + r.themes.length + r.more.length : 0;
  return (
    <PageContainer>
      <PageHeader title="Search" lead={q ? `${total} results for “${q}”` : 'Search assets, markets, research and themes.'} />
      <form action="/search" role="search" className="flex max-w-xl gap-2">
        <label className="relative flex-1"><span className="sr-only">Search INRGIFT</span><Search size={16} className="absolute left-3 top-3 text-faint" aria-hidden /><input name="q" defaultValue={q} className="field pl-9" placeholder="Ticker, company, market or theme" autoFocus={!q} /></label>
        <button type="submit" className="h-10 rounded-ctl bg-brand px-4 font-medium text-white hover:bg-brand-ink">Search</button>
      </form>
      {r && !total && <Panel title="No results"><NoResults query={q}>Try a ticker such as AAPL, a company name, a market such as Japan, or <Link className="link" href="/discover/screener">use the screener</Link>.</NoResults></Panel>}
      {r && r.assets.length > 0 && <Panel flush title="Assets" sub={`${r.assets.length}`}><AssetTable rows={r.assets} columns={['d1', 'y1', 'marketCap']} initialSort={null} /></Panel>}
      <div className="grid items-start gap-4 lg:grid-cols-3">
        {r && r.markets.length > 0 && <Panel flush title="Markets"><ul>{r.markets.map((m) => <li key={m.id}><Link href={marketHref(m.slug)} className="row-link"><span className="block font-semibold">{m.name}</span><span className="text-xs text-faint">{m.exchanges.map((e) => e.name).join(' · ')} · {SESSION_LABEL[m.session]}</span></Link></li>)}</ul></Panel>}
        {r && r.research.length > 0 && <Panel flush title="Research"><ul>{r.research.map((d) => <li key={d.href}><Link href={d.href} className="row-link"><span className="block font-semibold">{d.title}</span><span className="text-xs text-faint">{d.kind}</span></Link></li>)}</ul></Panel>}
        {r && r.themes.length > 0 && <Panel flush title="Themes"><ul>{r.themes.map((t) => <li key={t.id}><Link href={collectionHref(t.id)} className="row-link font-semibold">{t.name}</Link></li>)}</ul></Panel>}
        {r && r.more.length > 0 && <Panel flush title="Exchanges, sectors, news and guides"><ul>{r.more.map((m) => <li key={m.group + m.href + m.label}><Link href={m.href} className="row-link"><span className="block font-semibold">{m.label}</span><span className="text-xs text-faint">{m.group} · {m.hint}</span></Link></li>)}</ul></Panel>}
      </div>
    </PageContainer>
  );
}
