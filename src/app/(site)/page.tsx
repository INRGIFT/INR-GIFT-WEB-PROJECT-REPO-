import { BookOpen, Compass, Globe2, Layers, Lock, Newspaper, ShieldCheck, Star } from 'lucide-react';
import Link from 'next/link';
import { PageContainer, Section } from '@/components/ui/primitives';
import { VideoModule } from '@/features/media/video-module';
import { HomeCtas } from '@/features/site/home-ctas';
import { JsonLd, organization } from '@/lib/structured-data';
import { pageMetadata, SITE } from '@/lib/seo';
import { smsSecondFactor } from '@/lib/config';
import { getVideos } from '@/services/content';
import * as md from '@/services/market-data';

/**
 * The only public product page. It explains INRGIFT and converts; it shows no market tables, prices, research or news
 * (all of which require a verified account, src/lib/route-registry.ts). Feature links lead to sign-in when signed out.
 */
export const metadata = pageMetadata({
  title: `${SITE.name} | ${SITE.slogan} · ${SITE.tagline}`, absoluteTitle: true, path: '/',
  description: `${SITE.promise} Research global stocks, ETFs, indices and currencies with India context.`,
});

const FEATURES = [
  { icon: Globe2, title: 'Markets', href: '/markets', body: 'Every covered exchange with its trading session on India time, holidays, auctions and benchmark index.' },
  { icon: Layers, title: 'Assets', href: '/assets', body: 'Stocks, ETFs, indices, currencies, commodities, bonds and REITs, each with performance, risk and identity.' },
  { icon: Compass, title: 'Discover', href: '/discover', body: 'A global heatmap, a screener with more than thirty metrics, and side-by-side comparison of up to four assets.' },
  { icon: BookOpen, title: 'Research', href: '/research', body: 'Structured notes on stocks, ETFs, markets, sectors, themes and countries, with sources, limitations and method.' },
  { icon: Newspaper, title: 'News', href: '/resources/news', body: 'Global business and market news filtered for market relevance and linked to the companies and markets it concerns.' },
  { icon: Star, title: 'Your workspace', href: '/app', body: 'Watchlists, alerts that notify you, saved screens and comparisons, notes and collections, private to your account.' },
] as const;

export default async function HomePage() {
  const [videos, markets] = await Promise.all([
    getVideos().then((v) => ['product-walkthrough', 'universal-search', 'heatmap-drill-down'].map((id) => v.find((x) => x.id === id)).filter((x): x is NonNullable<typeof x> => Boolean(x))),
    md.getMarkets(),
  ]);
  return (
    <>
      <section aria-labelledby="hero-title" className="relative overflow-hidden bg-navy text-white">
        {/* Quiet grid of longitude lines: the only decoration, drawn in CSS so it costs nothing to load. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px)] [background-size:calc(100%/12)_100%]" />
        <div className="relative mx-auto grid max-w-page items-center gap-8 px-4 py-12 md:px-6 md:py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:px-8">
          <div className="animate-fade-up">
            <p className="text-ui font-semibold uppercase tracking-[.22em] text-ice">{SITE.slogan}</p>
            <h1 id="hero-title" className="mt-3 text-[34px] font-extrabold leading-[1.08] md:text-display">{SITE.promise}</h1>
            <p className="mt-3 max-w-[60ch] text-lead text-white/75">{SITE.tagline}. Research stocks, ETFs, indices, currencies, commodities, bonds and REITs across {markets.length} markets, read in IST and rupees.</p>
            <HomeCtas />
            <p className="mt-3 text-[13px] text-white/60">A research and information platform. Not a broker or an investment adviser.</p>
          </div>
          <div className="rounded-card border border-white/10 bg-white p-5 text-navy shadow-pop">
            <h2 className="flex items-center gap-2 text-lead font-bold"><ShieldCheck size={20} aria-hidden className="text-brand" />Private by design</h2>
            <ul className="mt-3 space-y-2.5 text-[14px] text-slate2">
              <li><b className="text-navy">Three credentials.</b> Every account has an email, a mobile number and a password, and the email is verified before sign-in.</li>
              <li><b className="text-navy">{smsSecondFactor ? 'Two steps at every sign-in.' : 'Verified sign-in.'}</b> {smsSecondFactor ? 'Your password, then a code sent to your phone by SMS.' : 'A confirmed email and your password; SMS codes are being added.'}</li>
              <li><b className="text-navy">Your workspace is yours.</b> Watchlists, alerts and notes are visible only to you.</li>
            </ul>
          </div>
        </div>
      </section>
      <PageContainer>
        <JsonLd data={[organization()]} />
        <Section title="One research view of every market">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, href, body }) => (
              <li key={title}>
                <Link href={href} className="group flex h-full flex-col rounded-card border border-line bg-white p-4 transition-colors hover:border-brand">
                  <span className="flex items-center gap-2 font-bold"><Icon size={18} aria-hidden className="text-brand" />{title}</span>
                  <span className="mt-1.5 flex-1 text-[14px] text-slate2">{body}</span>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-faint"><Lock size={12} aria-hidden />Sign in to open</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
        <section className="rounded-r-card border border-l-[3px] border-line border-l-saffron bg-white px-5 py-4">
          <h2 className="text-lg font-bold">The view from India</h2>
          <p className="mt-1 max-w-[80ch] text-slate2">Every session is shown in IST, every price can be shown in rupees, and foreign returns come with the exchange rate that shapes them. Research describes the data, with sources and limitations; it never tells you what to do.</p>
        </section>
        {videos.length > 0 && (
          <Section title="See INRGIFT in action">
            <p className="-mt-1 mb-3 text-[13px] text-slate2">Recordings of the product using clearly labelled demo data.</p>
            <div className="grid gap-4 md:grid-cols-3">{videos.map((v) => <VideoModule key={v.id} video={v} compact />)}</div>
          </Section>
        )}
        <section aria-labelledby="cta-title" className="rounded-card bg-navy px-5 py-8 text-center text-white">
          <h2 id="cta-title" className="text-[24px] font-extrabold">Start researching every market</h2>
          <p className="mx-auto mt-1 max-w-[60ch] text-white/75">Create a free account with your email, mobile number and password.</p>
          <div className="mt-4 flex justify-center"><HomeCtas compact /></div>
        </section>
      </PageContainer>
    </>
  );
}
