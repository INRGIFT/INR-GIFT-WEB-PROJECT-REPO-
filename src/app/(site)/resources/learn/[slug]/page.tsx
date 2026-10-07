import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ButtonLink } from '@/components/ui/button';
import { Badge, PageContainer, PageHeader, Panel } from '@/components/ui/primitives';
import { VideoModule } from '@/features/media/video-module';
import { dateShort } from '@/lib/format';
import { glossaryHref, learnHref } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { breadcrumbs, JsonLd, learningResource } from '@/lib/structured-data';
import { articleText, getLearnArticle, getLearnArticles, getTerm, getVideoFor } from '@/services/content';

type Props = { params: Promise<{ slug: string }> };
const TYPE_LABEL = { article: 'Explainer', guide: 'Product guide', methodology: 'Methodology' } as const;
const anchor = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
export async function generateStaticParams() { return (await getLearnArticles()).map((a) => ({ slug: a.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const a = await getLearnArticle((await params).slug); return a ? pageMetadata({ title: a.title, description: a.summary, path: learnHref(a.slug), type: 'article', publishedTime: a.publishedAt, modifiedTime: a.updatedAt }) : notFound(); }

export default async function LearnArticlePage({ params }: Props) {
  const { slug } = await params;
  const [a, all] = await Promise.all([getLearnArticle(slug), getLearnArticles()]);
  if (!a) notFound();
  const [terms, video] = await Promise.all([Promise.all(a.glossary.map((s) => getTerm(s))).then((t) => t.filter((x): x is NonNullable<typeof x> => x !== null)), getVideoFor(`learn:${a.slug}`)]);
  const minutes = Math.max(1, Math.round(articleText(a).split(/\s+/).length / 200));
  const more = all.filter((x) => x.slug !== a.slug && x.section === a.section).concat(all.filter((x) => x.slug !== a.slug && x.section !== a.section)).slice(0, 4);
  const path = learnHref(a.slug);
  return (
    <PageContainer className="max-w-[1100px]">
      <JsonLd data={[learningResource(a, path), breadcrumbs([['Resources', '/resources'], ['Learn', '/resources/learn'], [a.title]])]} />
      <PageHeader crumbs={[['Resources', '/resources'], ['Learn', '/resources/learn'], [a.section]]} title={a.title} lead={a.summary} />
      <p className="flex flex-wrap items-center gap-2 text-xs text-faint"><Badge>{a.section}</Badge><Badge tone="brand">{TYPE_LABEL[a.type]}</Badge>{minutes} min read · By {a.author}{a.reviewer ? ` · Reviewed by ${a.reviewer}` : ''} · Updated {dateShort(a.updatedAt)} · Educational, not advice</p>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          {a.keyPoints.length > 0 && (
            <section aria-labelledby="key-points" className="rounded-card border border-brand/20 bg-brand-soft/50 px-5 py-4">
              <h2 id="key-points" className="text-lead font-bold">Key points</h2>
              <ul className="mt-2 space-y-1.5 text-lead text-slate2">{a.keyPoints.map((t) => <li key={t} className="flex gap-2.5"><span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />{t}</li>)}</ul>
            </section>
          )}
          {video && <VideoModule video={video} />}
          <nav aria-label="In this article" className="rounded-card border border-line bg-white px-4 py-3"><p className="mb-1.5 text-xs font-semibold text-faint">In this article</p><ol className="flex flex-wrap gap-x-4 gap-y-1 text-ui">{a.sections.map((s, i) => <li key={s.heading}><a className="link" href={`#${anchor(s.heading)}`}><span className="num mr-1 text-faint">{i + 1}.</span>{s.heading}</a></li>)}</ol></nav>
          <article className="prose-doc rounded-card border border-line bg-white px-6 py-5">
            {a.sections.map((s) => (
              <section key={s.heading} id={anchor(s.heading)} className="scroll-mt-24">
                <h2>{s.heading}</h2>
                {s.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
                {s.list && <ul>{s.list.map((l) => <li key={l}>{l}</li>)}</ul>}
                {s.example && <aside className="mb-3 max-w-[72ch] rounded-lg border-l-[3px] border-brand bg-soft px-4 py-3 text-[15px] text-slate2"><b className="text-navy">Example. </b>{s.example}</aside>}
              </section>
            ))}
          </article>
          {a.related.length > 0 && <Panel title="Related on INRGIFT" flush><ul className="grid sm:grid-cols-2">{a.related.map((l) => <li key={l.href}><Link href={l.href} className="row-link py-2.5 font-semibold">{l.label}</Link></li>)}</ul></Panel>}
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
