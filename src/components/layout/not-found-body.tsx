import Link from 'next/link';
import { HomeSearch } from '@/features/site/home-search';

const POPULAR: [string, string][] = [['Global markets', '/markets'], ['India', '/markets/India'], ['United States', '/markets/US'], ['Apple (AAPL)', '/stocks/AAPL'], ['NIFTY 50', '/indices/NIFTY-50'], ['SPDR S&P 500 (SPY)', '/etfs/SPY'], ['USD / INR', '/fx/USD-INR'], ['Global heatmap', '/discover/heatmap'], ['Screener', '/discover/screener'], ['Research', '/research']];

/** Recovery for a missing page: search, popular destinations and the main sections. Used by both 404 boundaries. */
export function NotFoundBody({ what = 'page' }: { what?: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center md:py-24">
      <p className="text-ui font-semibold text-faint">404 · Not found</p>
      <h1 className="mt-2 text-h1 font-extrabold">We couldn’t find that {what}.</h1>
      <p className="mt-2 text-lead text-slate2">The address may be mistyped, or the market or asset is not covered yet. Search for it, or start from one of these.</p>
      <div className="mx-auto flex justify-center"><HomeSearch /></div>
      <nav aria-label="Popular destinations" className="mt-6 flex flex-wrap justify-center gap-2">{POPULAR.map(([l, h]) => <Link key={h} href={h} className="chip">{l}</Link>)}</nav>
      <p className="mt-8 text-ui text-slate2"><Link className="link" href="/">Home</Link> · <Link className="link" href="/markets/all">All markets</Link> · <Link className="link" href="/assets">All assets</Link> · <Link className="link" href="/support">Support</Link></p>
    </div>
  );
}
