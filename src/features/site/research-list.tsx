import Link from 'next/link';
import { Badge, EmptyState } from '@/components/ui/primitives';
import { dateShort } from '@/lib/format';
import type { ResearchDoc } from '@/lib/types';

export function ResearchList({ docs }: { docs: ResearchDoc[] }) {
  if (!docs.length) return <EmptyState title="No research published here yet">New notes appear as they are published.</EmptyState>;
  return <>{docs.map((d) => (
    <Link key={d.id} href={`/research/${d.kind}/${d.slug}`} className="block border-b border-line px-4 py-3 transition-colors last:border-0 hover:bg-bg">
      <span className="block font-semibold">{d.title}</span><span className="mt-0.5 block text-slate2">{d.summary}</span>
      <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-faint">{d.assetSymbol && <Badge tone="brand">{d.assetSymbol}</Badge>}<Badge>{d.type}</Badge><Badge>{d.topic}</Badge>{dateShort(d.publishedAt)}</span>
    </Link>
  ))}</>;
}
