'use client';
import { Search } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/primitives';
import { glossaryHref } from '@/lib/routes';

interface Term { term: string; slug: string; definition: string; formula?: string; why: string; related: string[]; aliases?: string[] }
export function GlossaryList({ terms }: { terms: Term[] }) {
  const [q, setQ] = useState('');
  const s = q.trim().toLowerCase();
  const name = new Map(terms.map((t) => [t.slug, t.term]));
  const list = terms.filter((t) => !s || `${t.term} ${(t.aliases ?? []).join(' ')} ${t.definition}`.toLowerCase().includes(s));
  return (
    <>
      <label className="relative block max-w-md"><span className="sr-only">Search the glossary</span><Search size={16} className="absolute left-3 top-3 text-faint" /><input className="field pl-9" placeholder="Search terms" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      {list.length ? <dl className="grid gap-3 lg:grid-cols-2">{list.map((t) => (
        <div key={t.term} className="rounded-card border border-line bg-white p-4">
          <dt className="font-display text-base font-bold"><Link href={glossaryHref(t.slug)} className="hover:text-brand-ink">{t.term}</Link></dt>
          <dd className="mt-1 text-slate2">{t.definition}</dd>
          {t.formula && <dd className="mt-2 rounded-lg bg-soft px-3 py-1.5 text-[13px]"><span className="text-faint">Formula </span>{t.formula}</dd>}
          <dd className="mt-2 text-[13px]"><span className="font-semibold">Why it matters. </span><span className="text-slate2">{t.why}</span></dd>
          <dd className="mt-2 flex flex-wrap gap-1.5 text-xs text-faint">Related{t.related.filter((r) => name.has(r)).map((r) => <Link key={r} href={glossaryHref(r)} className="rounded-md bg-hover px-1.5 py-0.5 font-medium text-slate2 hover:text-brand-ink">{name.get(r)}</Link>)}</dd>
        </div>
      ))}</dl> : <div className="rounded-card border border-line bg-white"><EmptyState title={`No term matches “${q}”`}>Try a shorter word, or clear the search to see every term.</EmptyState></div>}
    </>
  );
}
