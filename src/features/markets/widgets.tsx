import Link from 'next/link';
import { DataStatus, StatusBadge } from '@/components/ui/data-status';
import { Change, DivergingBar, Panel } from '@/components/ui/primitives';
import { Sparkline } from '@/components/ui/sparkline';
import { MiniList } from '@/features/assets/asset-table';
import { SESSION_LABEL } from '@/lib/calendar';
import { cn, hhmm, num, priceDp } from '@/lib/format';
import { assetHref, marketHref } from '@/lib/routes';
import type { Asset, DataMeta, MarketView } from '@/lib/types';
import { movers, sectors } from '@/services/market-data';

/** Freshest status among the rows, for a module that mixes markets. */
export const freshest = (list: { meta: DataMeta }[]): DataMeta | null => { const order = ['LIVE', 'DELAYED', 'STALE', 'END_OF_DAY', 'CLOSED', 'UNAVAILABLE', 'ERROR']; return [...list].sort((a, b) => order.indexOf(a.meta.dataStatus) - order.indexOf(b.meta.dataStatus))[0]?.meta ?? null; };
export function ModuleFoot({ meta, more }: { meta: DataMeta | null; more?: [string, string] }) {
  return (<>{meta && <DataStatus meta={meta} />}<Link href="/resources/data" className="hover:text-brand-ink">Methodology</Link>{more && <Link href={more[1]} className="link ml-auto">{more[0]}</Link>}</>);
}

/** 24-hour IST axis showing each market's regular session and the current time. */
export function SessionRail({ markets, now }: { markets: MarketView[]; now: Date }) {
  const ist = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
  const nowH = Number(ist.slice(0, 2)) + Number(ist.slice(3)) / 60;
  return (
    <div>
      <div className="grid grid-cols-[minmax(84px,150px)_1fr] items-center gap-x-3 gap-y-1.5 text-xs sm:grid-cols-[minmax(84px,150px)_1fr_104px]">
        <span /><div className="relative h-4 text-[11px] text-faint">{[0, 6, 12, 18, 24].map((h) => <span key={h} className="absolute -translate-x-1/2" style={{ left: `${(h / 24) * 100}%` }}>{String(h % 24).padStart(2, '0')}:00</span>)}</div><span className="hidden text-faint sm:block">IST</span>
        {markets.map((m) => {
          const segs = m.istClose < m.istOpen ? [[m.istOpen, 24], [0, m.istClose]] : [[m.istOpen, m.istClose]];
          const open = m.session === 'OPEN';
          return (
            <div key={m.id} className="contents">
              <Link href={marketHref(m.slug)} className="truncate font-medium text-navy hover:text-brand-ink">{m.name}</Link>
              <div className="relative h-3.5 rounded bg-hover" title={`${m.name}: ${hhmm(m.istOpen)} to ${hhmm(m.istClose)} IST`}>
                {segs.map(([a, b], i) => <span key={i} className={cn('absolute inset-y-0 rounded', open ? 'bg-brand' : 'bg-line2')} style={{ left: `${(a / 24) * 100}%`, width: `${((b - a) / 24) * 100}%` }} />)}
                <span className="absolute inset-y-[-4px] w-0.5 bg-saffron" style={{ left: `${(nowH / 24) * 100}%` }} />
              </div>
              <span className={cn('hidden sm:block', open ? 'text-navy' : 'text-faint')}>{m.session === 'HOLIDAY' ? 'Holiday' : SESSION_LABEL[m.session]}{open && ` · ${m.localTime}`}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-2.5 text-xs text-faint">Bars show regular trading hours converted to India Standard Time. The saffron line marks now, {ist} IST.</p>
    </div>
  );
}
export function IndexTile({ a, market }: { a: Asset; market?: MarketView }) {
  return (
    <Link href={assetHref(a)} className="block w-[196px] shrink-0 snap-start rounded-card border border-line bg-white p-3 text-navy transition-[border-color,box-shadow] duration-150 hover:border-brand hover:shadow-card">
      <p className="truncate font-semibold">{a.name}</p>
      <p className="mt-0.5 flex items-baseline justify-between gap-2"><span className="num font-display text-[17px] font-bold">{a.price == null ? '—' : num(a.price, priceDp(a.price))}</span><Change value={a.m.d1} /></p>
      <div className="my-1"><Sparkline seed={a.id} change={a.m.d1} width={170} /></div>
      <p className="flex items-center justify-between gap-2"><StatusBadge status={a.status} />{market && <span className="text-[11px] text-faint">{SESSION_LABEL[market.session]}</span>}</p>
    </Link>
  );
}
export function IndexStrip({ indices, markets }: { indices: Asset[]; markets: MarketView[] }) {
  const by = new Map(markets.map((m) => [m.id, m]));
  return <div className="flex snap-x gap-3 overflow-x-auto pb-1" aria-label="Indices">{indices.map((a) => <IndexTile key={a.id} a={a} market={by.get(a.marketId)} />)}</div>;
}
export function Movers({ list }: { list: Asset[] }) {
  const m = movers(list);
  const meta = freshest(list);
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Panel title="Top gainers" flush footer={<ModuleFoot meta={meta} />}><MiniList rows={m.gainers} metric="d1" /></Panel>
      <Panel title="Top losers" flush footer={<ModuleFoot meta={meta} />}><MiniList rows={m.losers} metric="d1" /></Panel>
      <Panel title="Most active" sub="by volume" flush footer={<ModuleFoot meta={meta} />}><MiniList rows={m.active} metric="volume" /></Panel>
    </div>
  );
}
export function SectorPanel({ list, title = 'Sector performance' }: { list: Asset[]; title?: string }) {
  const s = sectors(list);
  return <Panel title={title} sub="Cap-weighted 1D change" footer={<ModuleFoot meta={freshest(list)} />}>{s.length ? s.map((x) => <DivergingBar key={x.sector} label={x.sector} value={x.change} href={`/discover/screener?sector=${encodeURIComponent(x.sector)}`} />) : <p className="text-slate2">No sector data for this selection.</p>}</Panel>;
}
