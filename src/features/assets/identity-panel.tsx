import Link from 'next/link';
import { Badge, Panel } from '@/components/ui/primitives';
import { assetHref } from '@/lib/routes';
import type { InstrumentIdentity } from '@/lib/types';

/**
 * Issuer → securities (share classes, depositary receipts) → listings (MIC, ticker, currency) → provider symbols.
 * Uncovered listings are shown as reference rows without prices. Identifiers the source does not provide show "—".
 */
export function IdentityPanel({ identity, current }: { identity: InstrumentIdentity; current: string }) {
  const { issuer, securities, listings } = identity;
  if (listings.length < 2 && securities.length < 2) return null; // a single listing adds nothing beyond the overview
  const sec = new Map(securities.map((s) => [s.key, s]));
  return (
    <Panel title="Issuer, securities and listings" sub={issuer.name} flush footer={<span>Prices on this page are for the highlighted listing. A depositary receipt trades in its own currency and represents the stated number of ordinary shares. Source: {identity.source}.</span>}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-[13px]">
          <caption className="sr-only">Listings of {issuer.name}</caption>
          <thead><tr className="border-b border-line text-left text-xs text-faint"><th className="px-4 py-2 font-medium">Security</th><th className="px-3 py-2 font-medium">Exchange (MIC)</th><th className="px-3 py-2 font-medium">Ticker</th><th className="px-3 py-2 font-medium">Currency</th><th className="px-3 py-2 font-medium">Represents</th><th className="px-3 py-2 font-medium">ISIN</th><th className="px-4 py-2 font-medium">Coverage</th></tr></thead>
          <tbody>
            {listings.map((l) => {
              const s = sec.get(l.securityKey);
              const under = s?.underlyingKey ? listings.find((x) => x.securityKey === s.underlyingKey) : null;
              const here = l.instrumentId === current;
              return (
                <tr key={`${l.mic}:${l.ticker}`} className={here ? 'bg-brand-soft/40' : 'border-t border-line'} aria-current={here ? 'true' : undefined}>
                  <td className="px-4 py-2"><span className="font-semibold">{s?.name ?? l.ticker}</span> <Badge>{s?.shareClass ?? '—'}</Badge>{l.primary && <Badge tone="brand" className="ml-1">Primary</Badge>}</td>
                  <td className="px-3 py-2">{l.exchange} <span className="text-faint">({l.mic})</span></td>
                  <td className="num px-3 py-2">{l.covered && l.slug && l.cls && !here ? <Link className="link" href={assetHref({ slug: l.slug, cls: l.cls })}>{l.ticker}</Link> : l.ticker}</td>
                  <td className="px-3 py-2">{l.currency}</td>
                  <td className="px-3 py-2 text-slate2">{s?.ratio ? `${s.ratio}${under ? ` (${under.ticker})` : ''}` : '—'}</td>
                  <td className="px-3 py-2 text-faint">{s?.isin ?? '—'}</td>
                  <td className="px-4 py-2">{here ? 'This page' : l.covered ? 'Covered' : <span className="text-faint">Reference only</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
