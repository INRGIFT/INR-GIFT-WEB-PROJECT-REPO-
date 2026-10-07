import Link from 'next/link';
import { Panel } from '@/components/ui/primitives';
import type { ConnectionGroup } from '@/services/market-data';

/** Internal links from an asset to its market, exchange, sector, industry, indices, funds, themes and research. */
export function ConnectionsPanel({ groups }: { groups: ConnectionGroup[] }) {
  if (!groups.length) return null;
  return (
    <Panel title="Connections" sub="Where this asset sits in the global map">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {groups.map((g) => (
          <nav key={g.title} aria-label={g.title}>
            <h3 className="mb-1.5 text-caption font-semibold text-faint">{g.title}</h3>
            <ul className="space-y-1">{g.items.map((c) => <li key={c.href + c.label}><Link href={c.href} className="group block rounded-md py-0.5"><span className="font-medium text-navy group-hover:text-brand-ink">{c.label}</span>{c.hint && <span className="block text-caption text-faint">{c.hint}</span>}</Link></li>)}</ul>
          </nav>
        ))}
      </div>
    </Panel>
  );
}
