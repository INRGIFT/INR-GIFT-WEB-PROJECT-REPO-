import { Suspense } from 'react';
import { oauthAvailability } from '@/features/auth/oauth-providers';
import { HomeHero } from '@/features/home/hero';
import { HomeNews, HomeNewsSkeleton, NewsCategories, NewsCta } from '@/features/home/home-news';
import { HomeSocial, HomeSocialSkeleton } from '@/features/home/home-social';
import { HomeSection, SectionHeading } from '@/features/home/home-ui';
import { MarketStrip } from '@/features/home/market-strip';
import { BuiltInIndia, FinalCta, Infrastructure, Trust, WorkspacePreview } from '@/features/home/platform';
import { ComparePreview, ResearchPreview, ScreenPreview } from '@/features/home/previews';
import { RevealObserver } from '@/features/home/reveal';
import { SessionCta } from '@/features/home/session-cta';
import { getHomeSnapshot, HOME_VIDEO_IDS } from '@/features/home/snapshot';
import { VideoShowcase } from '@/features/home/video-showcase';
import { Workflow } from '@/features/home/workflow';
import { WorldMarkets } from '@/features/home/world-markets';
import { pageMetadata } from '@/lib/seo';
import { JsonLd, organization } from '@/lib/structured-data';
import { getVideos } from '@/services/content';

/**
 * The public homepage. Everything on it is prepared on the server (src/features/home/snapshot.ts) through the same
 * services as the product; it calls no /api route and no vendor from the browser. Market values are shown only under
 * the public-display policy in snapshot.ts (demo values labelled DEMO and kept out of search snippets). Every product
 * link leads to the product, which stays behind sign-in (src/lib/route-registry.ts).
 */
export const metadata = pageMetadata({
  title: 'INRGIFT | Global Market Intelligence From India', absoluteTitle: true, path: '/',
  description: 'Global market intelligence from India. Research stocks, ETFs, indices, currencies, commodities and bonds; screen, compare and follow market news in one view.',
});

export default async function HomePage() {
  const [snap, videos, oauth] = await Promise.all([
    getHomeSnapshot(),
    getVideos().then((all) => HOME_VIDEO_IDS.map((id) => all.find((v) => v.id === id)).filter((v): v is NonNullable<typeof v> => Boolean(v))),
    oauthAvailability().catch(() => ({ google: false, apple: false })),
  ]);
  return (
    <>
      <JsonLd data={[organization()]} />
      <RevealObserver />
      <HomeHero />
      <MarketStrip snap={snap} />
      <WorldMarkets snap={snap} />
      <Workflow />
      <ScreenPreview snap={snap} />
      <ComparePreview snap={snap} />
      <ResearchPreview snap={snap} />
      <HomeSection id="news" surface="tint">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <SectionHeading id="news" eyebrow="News" title="Know what moved the market." lead="Business and market news from NewsData.io, filtered for market relevance and linked to the companies and markets it mentions. Every headline links to its publisher." />
          <div data-reveal><NewsCta /></div>
        </div>
        <div data-reveal className="mt-10"><Suspense fallback={<HomeNewsSkeleton />}><HomeNews /></Suspense></div>
        <NewsCategories />
      </HomeSection>
      <HomeSection id="social" bordered>
        <SectionHeading id="social" eyebrow="Latest from INRGIFT" title="Follow INRGIFT." lead="The newest posts from INRGIFT's official Instagram and X accounts." />
        <div data-reveal className="mt-10"><Suspense fallback={<HomeSocialSkeleton />}><HomeSocial /></Suspense></div>
      </HomeSection>
      {videos.length > 0 && (
        <HomeSection id="tours" surface="navy">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
            <SectionHeading id="tours" tone="dark" eyebrow="Product tours" title="See how INRGIFT works." lead="Explore the platform through three quick visual guides." />
            <div data-reveal><SessionCta out={['Explore the Platform', '/signup']} inside={['Explore the Platform', '/app']} variant="inverse" arrow /></div>
          </div>
          <div data-reveal className="mt-12"><VideoShowcase videos={videos} /></div>
          <p className="mt-10 text-xs text-white/55">Screen recordings of INRGIFT using clearly labelled demo data. Captions are on by default; nothing downloads until you press play.</p>
        </HomeSection>
      )}
      <Infrastructure />
      <WorkspacePreview />
      <BuiltInIndia snap={snap} />
      <Trust oauth={oauth} />
      <FinalCta />
    </>
  );
}
