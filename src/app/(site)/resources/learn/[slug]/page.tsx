import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ButtonLink } from '@/components/ui/button';
import { Badge, PageContainer, PageHeader, Panel } from '@/components/ui/primitives';
import { VideoModule } from '@/features/media/video-module';
import { glossaryHref, learnHref } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { breadcrumbs, JsonLd, learningResource } from '@/lib/structured-data';
import { getLearnArticle, getLearnArticles, getVideoFor, termsMentionedIn } from '@/services/content';

type Props = { params: Promise<{ slug: string }> };
export async function generateStaticParams() { return (await getLearnArticles()).map((a) => ({ slug: a.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const a = await getLearnArticle((await params).slug); return a ? pageMetadata({ title: a.title, description: `${a.summary} A short explainer from INRGIFT Learn.`, path: learnHref(a.slug), type: 'article' }) : { title: 'Not found' }; }
const readMinutes = (words: number) => Math.max(1, Math.round(words / 200));
export default async function LearnArticlePage({ params }: Props) {
  const { slug } = await params;
  const [a, all] = await Promise.all([getLearnArticle(slug), getLearnArticles()]);
  if (!a) notFound();
  const text = [a.title, a.summary, ...a.body].join(' ');
  const [terms, video] = await Promise.all([termsMentionedIn(text), getVideoFor(`learn:${a.slug}`)]);
  const more = all.filter((x) => x.slug !== a.slug && x.section === a.section).concat(all.filter((x) => x.slug !== a.slug && x.section !== a.section)).slice(0, 4);
  const path = learnHref(a.slug);
  return (
    <PageContainer className="max-w-[1100px]">
      <JsonLd data={[learningResource(a, path), breadcrumbs([['Resources', '/resources'], ['Learn', '/resources/learn'], [a.title]])]} />
      <PageHeader crumbs={[['Resources', '/resources'], ['Learn', '/resources/learn'], [a.section]]} title={a.title} lead={a.summary} />
      <p className="flex flex-wrap items-center gap-2 text-xs text-faint"><Badge>{a.section}</Badge>{readMinutes(text.split(/\s+/).length)} min read · Educational, not advice</p>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          {video && <VideoModule video={video} />}
          <article className="prose-doc rounded-card border border-line bg-white px-6 py-5">{a.body.map((p, i) => <p key={i}>{p}</p>)}</article>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24">
          {terms.length > 0 && <Panel title="Terms in this article" flush><ul>{terms.map((t) => <li key={t.slug}><Link href={glossaryHref(t.slug)} className="row-link py-2.5"><span className="block font-semibold">{t.term}</span><span className="line-clamp-2 text-xs text-slate2">{t.definition}</span></Link></li>)}</ul></Panel>}
          <Panel title="Keep learning" flush><ul>{more.map((x) => <li key={x.slug}><Link href={learnHref(x.slug)} className="row-link py-2.5"><span className="block font-semibold">{x.title}</span><span className="text-xs text-faint">{x.section}</span></Link></li>)}</ul></Panel>
          <ButtonLink href="/resources/glossary" className="w-full">Open the glossary</ButtonLink>
        </aside>
      </div>
    </PageContainer>
  );
}
