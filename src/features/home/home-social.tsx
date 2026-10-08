import { ExternalLink, Instagram } from 'lucide-react';
import type { ReactNode } from 'react';
import { COMPANY } from '@/lib/company';
import { dateTimeIST } from '@/lib/format';
import { getLatestSocial } from '@/services/social/social-service';
import type { SocialFeed, SocialPlatform, SocialPost } from '@/services/social/social-types';

const LIMIT_MS = 6000;
const XMark = ({ size = 14 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden focusable="false" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" /></svg>
);
const ACCOUNT: Record<SocialPlatform, { name: string; label: string; href: string; icon: ReactNode }> = {
  instagram: { name: 'Instagram', label: COMPANY.social[0].label, href: COMPANY.social[0].href, icon: <Instagram size={15} aria-hidden /> },
  x: { name: 'X', label: COMPANY.social[1].label, href: COMPANY.social[1].href, icon: <XMark /> },
};

function PostCard({ p }: { p: SocialPost }) {
  const a = ACCOUNT[p.platform];
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-card border border-line bg-white">
      {p.media && (
        <a href={p.permalink} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden className="block aspect-[16/9] overflow-hidden bg-soft">
          {/* eslint-disable-next-line @next/next/no-img-element -- platform CDN image, shown as returned; no optimiser proxy */}
          <img src={p.media.url} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" width={640} height={360} className="h-full w-full object-cover" />
        </a>
      )}
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] text-faint">
          <span className="inline-flex items-center gap-1.5 font-semibold text-navy">{a.icon}{p.author ? `@${p.author}` : a.name}</span>
          {p.published_at && <><span aria-hidden>·</span><time dateTime={p.published_at}>{dateTimeIST(p.published_at)}</time></>}
          {p.media?.kind === 'video' && <><span aria-hidden>·</span><span>Video</span></>}
        </p>
        {p.text && <p className="mt-2 break-words text-[14px] leading-relaxed text-slate2 [overflow-wrap:anywhere]">{p.text}</p>}
        <a href={p.permalink} target="_blank" rel="noopener noreferrer" className="link mt-auto inline-flex items-center gap-1 pt-3 text-[13px] font-semibold">
          View on {a.name}<ExternalLink size={13} aria-hidden /><span className="sr-only"> (opens {a.name} in a new tab)</span>
        </a>
      </div>
    </article>
  );
}
function Follow({ platform, children }: { platform: SocialPlatform; children: string }) {
  const a = ACCOUNT[platform];
  return (
    <div className="flex min-w-0 flex-col justify-between gap-3 rounded-card border border-dashed border-line2 bg-white p-4">
      <p className="text-[14px] text-slate2">{children}</p>
      <a href={a.href} target="_blank" rel="noopener noreferrer me" className="link inline-flex items-center gap-1.5 text-[13px] font-semibold">{a.icon}Follow {a.label}<span className="sr-only"> (opens {a.name} in a new tab)</span></a>
    </div>
  );
}
function Column({ f }: { f: SocialFeed }) {
  const a = ACCOUNT[f.platform];
  return (
    <section aria-label={`Latest from ${a.label}`} className="min-w-0">
      <h3 className="flex flex-wrap items-center gap-2 text-[13px] font-semibold uppercase tracking-[.14em] text-faint">{a.icon}{a.label}</h3>
      {f.status === 'STALE' && f.retrievedAt && <p className="mt-1 text-xs text-faint">{f.notice} Showing posts retrieved {dateTimeIST(f.retrievedAt)}.</p>}
      <div className="mt-3 grid gap-3">
        {f.posts.length ? f.posts.map((p) => <PostCard key={p.id} p={p} />)
          : f.status === 'NOT_CONFIGURED' ? <Follow platform={f.platform}>{`The latest ${a.name} posts appear here once the official ${a.name} connection is set up.`}</Follow>
          : f.status === 'UNAVAILABLE' ? <Follow platform={f.platform}>{`${a.name} posts are unavailable right now${f.notice ? `: ${f.notice.replace(/\.$/, '').toLowerCase()}` : ''}. Nothing is shown in their place.`}</Follow>
          : <Follow platform={f.platform}>{`No ${a.name} posts yet.`}</Follow>}
      </div>
    </section>
  );
}

async function load(): Promise<SocialFeed[] | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { return await Promise.race([getLatestSocial(), new Promise<null>((resolve) => { timer = setTimeout(() => resolve(null), LIMIT_MS); })]); }
  catch { return null; }
  finally { clearTimeout(timer); }
}

/**
 * "Latest from INRGIFT": the newest posts of the two official accounts (COMPANY.social) through the server-side social
 * service (official APIs, cached; src/services/social). Streams in its own Suspense boundary, so a slow or failing
 * platform never holds up the page; each platform fails on its own. Only what the platform returned is shown (author,
 * time, text, image, link): no engagement counts, and never a post that was not fetched.
 */
export async function HomeSocial() {
  const feeds = await load();
  if (!feeds) return <div className="grid gap-4 md:grid-cols-2">{(['instagram', 'x'] as const).map((p) => <Follow key={p} platform={p}>{`${ACCOUNT[p].name} posts could not load just now.`}</Follow>)}</div>;
  return <div className="grid gap-6 md:grid-cols-2">{feeds.map((f) => <Column key={f.platform} f={f} />)}</div>;
}
export function HomeSocialSkeleton() {
  return <div className="grid gap-6 md:grid-cols-2" role="status" aria-label="Loading posts">{[0, 1].map((i) => <div key={i} className="space-y-3"><div className="skeleton h-4 w-40" /><div className="skeleton h-40 w-full" /></div>)}</div>;
}
