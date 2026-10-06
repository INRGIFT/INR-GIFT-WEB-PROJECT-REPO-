import { Bell, Database, KeyRound, LayoutGrid, Search, Star } from 'lucide-react';
import Link from 'next/link';
import { ButtonLink } from '@/components/ui/button';
import { PageContainer, PageHeader, Panel } from '@/components/ui/primitives';
import { pageMetadata } from '@/lib/seo';
import { breadcrumbs, JsonLd } from '@/lib/structured-data';
import { VideoModule } from '@/features/media/video-module';
import { getFaq, getVideos } from '@/services/content';

export const metadata = pageMetadata({ title: 'Support and help', description: 'How to search, build a watchlist, set alerts, use the screener and read data statuses on INRGIFT.', path: '/support' });
const GUIDES: [typeof Search, string, string[], string][] = [
  [Search, 'Find anything', ['Press / or Ctrl K anywhere to search.', 'Type a ticker, a company, a market or a theme.', 'Arrow keys move, Enter opens.'], '/resources/learn'],
  [Star, 'Build a watchlist', ['Sign in, then press the star on any asset, table row or heatmap tile.', 'Create more lists from Workspace › Watchlist.', 'Reorder, rename and export lists there.'], '/app/watchlist'],
  [Bell, 'Set an alert', ['Press the bell on an asset or row.', 'Choose a price level, a one-day move, a valuation level or an event.', 'Alerts appear in Notifications; they never act for you.'], '/app/alerts'],
  [LayoutGrid, 'Screen and compare', ['Build filters with match all, match any and nested groups.', 'The address bar is always a shareable link.', 'Tick up to four results and compare them.'], '/discover/screener'],
  [Database, 'Read data statuses', ['Every module shows Live, Delayed, End of day, Closed, Unavailable, Stale or Error with a time.', 'A dash means the source has no value; n/a means it does not apply.'], '/resources/data'],
  [KeyRound, 'Keep your account safe', ['Verify your email and phone.', 'Turn on two-step verification with an authenticator app.', 'Review activity under Account › Security.'], '/account/security'],
];
export default async function SupportPage() {
  const [faqAll, videos] = await Promise.all([getFaq(), getVideos()]);
  const faq = faqAll.slice(0, 5);
  return (
    <PageContainer className="max-w-[1100px]">
      <JsonLd data={breadcrumbs([['Home', '/'], ['Support']])} />
      <PageHeader crumbs={[['Home', '/'], ['Support']]} title="Support" lead="Short guides to the core workflows. If something looks wrong, tell us and include where you saw it." actions={<ButtonLink href="/contact" variant="primary">Contact us</ButtonLink>} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{GUIDES.map(([Icon, t, steps, href]) => (
        <section key={t} className="flex flex-col rounded-card border border-line bg-white p-4 shadow-card">
          <Icon size={20} strokeWidth={1.75} className="text-brand" aria-hidden />
          <h2 className="mt-2 text-base font-bold">{t}</h2>
          <ol className="mt-2 flex-1 list-decimal space-y-1 pl-4 text-[13px] text-slate2">{steps.map((s) => <li key={s}>{s}</li>)}</ol>
          <Link href={href} className="link mt-3 text-[13px] font-semibold">Open</Link>
        </section>))}</div>
      <section><h2 className="mb-3 text-lg font-bold">Video tutorials</h2><div className="grid gap-4 md:grid-cols-3">{videos.map((v) => <VideoModule key={v.id} video={v} compact />)}</div></section>
      <Panel title="Common questions" footer={<Link href="/faq" className="link ml-auto">All questions</Link>}>
        <dl className="space-y-3">{faq.map((f) => <div key={f.q}><dt className="font-semibold">{f.q}</dt><dd className="text-slate2">{f.a}</dd></div>)}</dl>
      </Panel>
    </PageContainer>
  );
}
