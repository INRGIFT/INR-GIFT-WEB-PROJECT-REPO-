import Link from 'next/link';
import { DataStatus } from '@/components/ui/data-status';
import type { DataMeta, Envelope } from '@/lib/types';

/** Footer for client-fetched data modules: status, timestamp and the methodology link. Safe in client components. */
export function ModuleFootClient({ meta }: { meta: Envelope<unknown>['meta'] | null }) {
  if (!meta) return null;
  const full: DataMeta = { timezone: 'UTC', ingestedAt: meta.timestamp, ...meta };
  return <><DataStatus meta={full} /><Link href="/resources/data" className="hover:text-brand-ink">Methodology</Link></>;
}
