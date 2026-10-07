import { Badge, Panel } from '@/components/ui/primitives';
import { dateShort } from '@/lib/format';
import type { Exchange } from '@/lib/types';

const DAY = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
/**
 * Per-exchange calendar straight from configuration: time zone, sessions, breaks, auctions, trading days, holidays and
 * early closes. Nothing here is hard-coded per page; status elsewhere is derived from the same records.
 */
export function ExchangeCalendar({ exchanges, today }: { exchanges: Exchange[]; today: string }) {
  return (
    <Panel title="Exchanges and trading calendar" sub="Local exchange time" flush footer={<span>Status is derived from each exchange’s calendar. See <a className="link" href="/resources/learn/market-calendar-methodology">market calendar methodology</a>.</span>}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-ui">
          <thead><tr className="border-b border-line text-left text-caption text-faint"><th className="px-4 py-2 font-medium">Exchange</th><th className="px-3 py-2 font-medium">Regular session</th><th className="px-3 py-2 font-medium">Pre / post</th><th className="px-3 py-2 font-medium">Break</th><th className="px-3 py-2 font-medium">Auctions</th><th className="px-3 py-2 font-medium">Trading days</th><th className="px-4 py-2 font-medium">Upcoming closures</th></tr></thead>
          <tbody>
            {exchanges.map((e) => {
              const closures = Object.entries(e.holidays).filter(([d]) => d >= today).sort().slice(0, 3);
              const halves = Object.entries(e.halfDays ?? {}).filter(([d]) => d >= today).sort().slice(0, 2);
              return (
                <tr key={e.mic} className="border-t border-line align-top">
                  <td className="px-4 py-2.5"><span className="font-semibold">{e.name}</span><span className="block text-caption text-faint">{e.mic} · {e.timezone}</span></td>
                  <td className="num px-3 py-2.5">{e.open}–{e.close}</td>
                  <td className="num px-3 py-2.5 text-slate2">{e.preOpen ? `from ${e.preOpen}` : '—'}{e.postClose ? ` · to ${e.postClose}` : ''}</td>
                  <td className="num px-3 py-2.5 text-slate2">{e.breakStart ? `${e.breakStart}–${e.breakEnd}` : 'None'}</td>
                  <td className="num px-3 py-2.5 text-slate2">{[e.openingAuction && `Open ${e.openingAuction}`, e.closingAuction && `Close ${e.closingAuction}`].filter(Boolean).join(' · ') || '—'}</td>
                  <td className="px-3 py-2.5 text-slate2">{e.tradingDays.map((d) => DAY[d]).join(' ')}</td>
                  <td className="px-4 py-2.5">{closures.length || halves.length ? <ul className="space-y-0.5">{closures.map(([d, n]) => <li key={d}><span className="num">{dateShort(d)}</span> {n}</li>)}{halves.map(([d, t]) => <li key={d}><span className="num">{dateShort(d)}</span> <Badge tone="warn">Early close {t}</Badge></li>)}</ul> : <span className="text-faint">None scheduled</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
