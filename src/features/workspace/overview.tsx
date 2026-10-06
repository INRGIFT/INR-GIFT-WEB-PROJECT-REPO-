'use client';
import { Bell, Columns2, FileText, Filter, Map as MapIcon, Search, Star, StickyNote } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { ButtonLink } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/data-status';
import { Badge, Callout, Change, EmptyState, Panel, SkeletonRows } from '@/components/ui/primitives';
import { AssetIdentity } from '@/features/assets/asset-table';
import { useSession } from '@/features/auth/session-context';
import { useOpenSearch } from '@/features/search/search-command';
import { alertLabel } from '@/lib/alerts';
import { cn, dateShort, dateTimeIST } from '@/lib/format';
import type { MarketView, ResearchDoc, Theme } from '@/lib/types';
import { useApi } from '@/lib/use-api';
import { ModuleFootClient } from './module-foot';
import { useAssets, WsPage } from './ws-ui';
import { useWorkspace } from './workspace-context';

const greet = () => { const h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', hourCycle: 'h23' }).format(new Date())); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

/** Personal research home: what changed in the things you follow, and where to pick up. */
export function OverviewPage() {
  const ws = useWorkspace();
  const { user } = useSession();
  const openSearch = useOpenSearch();
  const firstList = [...ws.data.watchlists].sort((a, b) => a.position - b.position)[0];
  const watchIds = useMemo(() => ws.data.watchlist_items.filter((i) => i.watchlist_id === firstList?.id).sort((a, b) => a.position - b.position).map((i) => i.instrument_id), [ws.data.watchlist_items, firstList?.id]);
  const alertIds = ws.data.alerts.map((a) => a.instrument_id);
  const md = useAssets([...watchIds, ...alertIds]);
  const research = useApi<ResearchDoc[]>('/api/v1/research');
  const themes = useApi<Theme[]>('/api/v1/themes');
  const markets = useApi<MarketView[]>('/api/v1/markets');
  const watched = watchIds.map((id) => md.map.get(id)).filter((a): a is NonNullable<typeof a> => Boolean(a));
  const movers = [...watched].filter((a) => a.m.d1 != null).sort((a, b) => Math.abs(b.m.d1!) - Math.abs(a.m.d1!)).slice(0, 3);
  const followedThemeIds = new Set((themes.data ?? []).filter((t) => ws.prefs.themes.includes(t.id)).map((t) => t.id));
  const slugs = new Set(watched.map((a) => a.slug));
  const forYou = (research.data ?? []).filter((d) => (d.assetSlug && slugs.has(d.assetSlug)) || (d.themeId && followedThemeIds.has(d.themeId))).slice(0, 5);
  const fallbackResearch = (research.data ?? []).slice(0, 4);
  const unread = ws.data.notifications.filter((n) => !n.read);
  const triggered = ws.data.alerts.filter((a) => a.status === 'triggered');
  const open = (markets.data ?? []).filter((m) => m.session === 'OPEN');
  const stats: [string, number, string, typeof Star, string?][] = [
    ['Watchlist', ws.data.watchlist_items.length, '/app/watchlist', Star, `${ws.data.watchlists.length} ${ws.data.watchlists.length === 1 ? 'list' : 'lists'}`],
    ['Active alerts', ws.data.alerts.filter((a) => a.status === 'active').length, '/app/alerts', Bell, triggered.length ? `${triggered.length} triggered` : undefined],
    ['Saved screens', ws.data.saved_screens.length, '/app/screens', Filter],
    ['Notes', ws.data.notes.length, '/app/notes', StickyNote],
  ];
  return (
    <WsPage title="Overview" lead={<>{greet()}{user ? `, ${user.name.split(' ')[0]}` : ''}. {markets.data ? `${open.length} of ${markets.data.length} markets are open right now.` : 'Checking market sessions…'}</>}>
      {!ws.prefs.onboardedAt && <Callout tone="info" title="Finish setting up your workspace" action={<ButtonLink size="sm" variant="primary" href="/onboarding">Continue setup</ButtonLink>}>Choose a display currency, the regions you follow and a starter watchlist. It takes a minute.</Callout>}
      {unread.length > 0 && <Callout tone={triggered.length ? 'warn' : 'info'} title={`${unread.length} unread ${unread.length === 1 ? 'notification' : 'notifications'}`} action={<ButtonLink size="sm" href="/notifications">Open</ButtonLink>}>{unread[0].title}</Callout>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([label, n, href, Icon, sub]) => <Link key={label} href={href} className="card-link p-4"><span className="flex items-center justify-between text-faint"><span className="text-[13px] font-medium text-slate2">{label}</span><Icon size={17} aria-hidden /></span><span className="num mt-1 block font-display text-[26px] font-extrabold">{n}</span>{sub && <span className="text-xs text-faint">{sub}</span>}</Link>)}
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel flush title={firstList ? firstList.name : 'Watchlist'} sub={watchIds.length ? `${watchIds.length} assets` : undefined} tools={<ButtonLink size="sm" href="/app/watchlist">Manage</ButtonLink>} footer={<ModuleFootClient meta={md.meta} />}>
          {md.error ? <div className="p-4"><Callout tone="error" title="Prices could not load" action={<button type="button" className="link text-[13px]" onClick={md.reload}>Retry</button>} /></div>
            : !watchIds.length ? <EmptyState icon={<Star size={22} />} title="Your watchlist is empty" action={<><button type="button" onClick={openSearch} className="inline-flex h-10 items-center gap-2 rounded-ctl bg-brand px-4 font-medium text-white hover:bg-brand-ink"><Search size={16} />Find an asset</button><ButtonLink href="/discover/heatmap">Browse the heatmap</ButtonLink></>}>Star any asset to follow its price, research and news here.</EmptyState>
            : md.loading && !watched.length ? <SkeletonRows rows={5} /> : (
            <ul>{watched.slice(0, 8).map((a) => <li key={a.id} className="flex items-center gap-3 border-b border-line px-4 py-2 last:border-0 hover:bg-bg"><div className="min-w-0 flex-1"><AssetIdentity asset={a} /></div><span className="num hidden text-[13px] font-medium sm:block">{ws.showPrice(a)}</span><span className="w-[84px] text-right text-[13px]"><Change value={a.m.d1} /></span><span className="hidden w-[100px] text-right md:block"><StatusBadge status={a.status} /></span></li>)}</ul>
          )}
          {movers.length > 0 && <p className="border-t border-line bg-soft/60 px-4 py-2 text-[13px] text-slate2">Biggest moves today: {movers.map((a, i) => <span key={a.id}>{i > 0 && ', '}<b className="text-navy">{a.symbol}</b> <Change value={a.m.d1} /></span>)}</p>}
        </Panel>
        <div className="space-y-4">
          <Panel flush title="Alerts" tools={<ButtonLink size="sm" href="/app/alerts">All alerts</ButtonLink>}>
            {!ws.data.alerts.length ? <EmptyState icon={<Bell size={20} />} title="No alerts">Use the bell on any asset to be told when a level, move or event happens.</EmptyState> : <ul>{[...ws.data.alerts].sort((a, b) => Number(b.status === 'triggered') - Number(a.status === 'triggered')).slice(0, 5).map((al) => { const a = md.map.get(al.instrument_id); return <li key={al.id} className={cn('border-b border-line px-4 py-2.5 last:border-0', al.status === 'triggered' && 'bg-brand-soft/40')}><p className="font-medium">{a?.symbol ?? '…'} · {alertLabel(al.kind, al.threshold)}</p><p className="text-xs text-faint">{al.status === 'triggered' ? `Triggered ${dateTimeIST(al.last_triggered_at!)}` : al.status === 'paused' ? 'Paused' : 'Watching'}</p></li>; })}</ul>}
          </Panel>
          <Panel flush title="Pick up where you left off" tools={<ButtonLink size="sm" href="/app/history">History</ButtonLink>}>
            {!ws.data.recent_history.length ? <EmptyState title="Nothing yet">Pages you open appear here.</EmptyState> : <ul>{ws.data.recent_history.slice(0, 5).map((r) => <li key={r.id}><Link href={r.href} className="row-link py-2.5"><span className="block truncate font-medium">{r.title}</span><span className="text-xs text-faint">{r.kind} · {dateTimeIST(r.created_at)}</span></Link></li>)}</ul>}
          </Panel>
        </div>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel flush title={forYou.length ? 'Research on what you follow' : 'Latest research'} tools={<ButtonLink size="sm" href="/research">All research</ButtonLink>}>
          {research.error ? <div className="p-4"><Callout tone="error" title="Research could not load" action={<button type="button" className="link text-[13px]" onClick={research.reload}>Retry</button>} /></div> : research.loading ? <SkeletonRows rows={4} /> : <ul>{(forYou.length ? forYou : fallbackResearch).map((d) => <li key={d.id}><Link href={`/research/${d.kind}/${d.slug}`} className="row-link"><span className="block font-semibold">{d.title}</span><span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-faint">{d.assetSymbol && <Badge tone="brand">{d.assetSymbol}</Badge>}<Badge>{d.type}</Badge>{dateShort(d.publishedAt)}</span></Link></li>)}</ul>}
        </Panel>
        <Panel title="Research tools">
          <div className="grid grid-cols-2 gap-2">{([['Screener', '/discover/screener', Filter], ['Compare', '/discover/compare', Columns2], ['Heatmap', '/discover/heatmap', MapIcon], ['Saved research', '/app/research', FileText]] as const).map(([l, h, Icon]) => <Link key={h} href={h} className="flex items-center gap-2.5 rounded-ctl border border-line px-3 py-3 font-medium transition-colors hover:border-brand hover:text-brand-ink"><Icon size={17} className="text-brand" aria-hidden />{l}</Link>)}</div>
          <p className="mt-3 text-xs text-faint">INRGIFT is a research and information platform. It is not a broker or an investment adviser.</p>
        </Panel>
      </div>
    </WsPage>
  );
}
