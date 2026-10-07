'use client';
import { Search, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useId, useState } from 'react';
import { cn } from '@/lib/format';

export interface FilterOption { value: string; label: string }
export interface NewsFilterValues { section: string; q?: string; market?: string; region?: string; assetClass?: string; hours?: number; source?: string; topic?: string; company?: string }

function Select({ name, label, value, options }: { name: string; label: string; value?: string | number; options: FilterOption[] }) {
  return (
    <label className="block min-w-0 text-[13px]"><span className="mb-1 block font-medium text-slate2">{label}</span>
      <select name={name} defaultValue={value === undefined ? '' : String(value)} className="field h-10 w-full">{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
    </label>
  );
}

/**
 * News search and filters: Search, Market, Region, Asset, Time, Source and Topic. A plain GET form (works without
 * JavaScript); on small screens the filters fold behind a Filters button so the feed stays first.
 */
export function NewsFilters({ values, markets, regions, assets, topics }: { values: NewsFilterValues; markets: FilterOption[]; regions: FilterOption[]; assets: FilterOption[]; topics: FilterOption[] }) {
  const id = useId();
  const active = [values.market, values.region, values.assetClass, values.hours, values.source, values.topic].filter((v) => v !== undefined && v !== '').length;
  const [open, setOpen] = useState(false);
  return (
    <form method="get" action="/resources/news" role="search" aria-label="Search and filter news" className="rounded-card border border-line bg-white p-3 shadow-card sm:p-4">
      {values.section !== 'most-relevant' && <input type="hidden" name="section" value={values.section} />}
      {values.company && <input type="hidden" name="company" value={values.company} />}
      <div className="flex flex-wrap items-end gap-2">
        <label className="block min-w-0 flex-1 basis-[220px] text-[13px]"><span className="mb-1 block font-medium text-slate2">Search news</span>
          <span className="relative block"><Search size={15} className="pointer-events-none absolute left-3 top-3 text-faint" aria-hidden />
            <input type="search" name="q" defaultValue={values.q ?? ''} maxLength={100} placeholder="Company, market, policy or event" className="field h-10 w-full pl-9" />
          </span>
        </label>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={`${id}-filters`} className="inline-flex h-10 items-center gap-2 rounded-ctl border border-line2 bg-white px-3 text-[13px] font-medium text-navy hover:border-faint lg:hidden">
          <SlidersHorizontal size={15} aria-hidden />Filters{active > 0 && <span className="num rounded-full bg-brand-soft px-1.5 text-[11px] font-semibold text-brand-ink">{active}</span>}
        </button>
        <button type="submit" className="inline-flex h-10 items-center rounded-ctl bg-brand px-4 font-medium text-white hover:bg-brand-ink">Apply</button>
        {(active > 0 || values.q) && <Link href={values.section === 'most-relevant' ? '/resources/news' : `/resources/news?section=${values.section}`} className="link inline-flex h-10 items-center px-1 text-[13px]">Clear filters</Link>}
      </div>
      <div id={`${id}-filters`} className={cn('mt-3 gap-3 sm:grid-cols-2 lg:grid lg:grid-cols-3 xl:grid-cols-6', open ? 'grid' : 'hidden')}>
        <Select name="market" label="Market" value={values.market} options={[{ value: '', label: 'All markets' }, ...markets]} />
        <Select name="region" label="Region" value={values.region} options={[{ value: '', label: 'All regions' }, ...regions]} />
        <Select name="assetClass" label="Asset" value={values.assetClass} options={[{ value: '', label: 'All asset classes' }, ...assets]} />
        <Select name="hours" label="Time" value={values.hours} options={[{ value: '', label: 'Last 48 hours' }, { value: '6', label: 'Last 6 hours' }, { value: '24', label: 'Last 24 hours' }, { value: '48', label: 'Last 48 hours' }]} />
        <label className="block min-w-0 text-[13px]"><span className="mb-1 block font-medium text-slate2">Source</span>
          <input name="source" defaultValue={values.source ?? ''} maxLength={40} pattern="[a-z0-9_.\-]{2,40}" placeholder="Source id, e.g. reuters" title="The news source id: lowercase letters, digits, dots, dashes or underscores" className="field h-10 w-full" />
        </label>
        <Select name="topic" label="Topic" value={values.topic} options={[{ value: '', label: 'All topics' }, ...topics]} />
      </div>
    </form>
  );
}
