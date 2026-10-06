'use client';
import { Search } from 'lucide-react';
import { useOpenSearch } from '@/features/search/search-command';

export function HomeSearch() {
  const open = useOpenSearch();
  return (
    <button type="button" onClick={open} className="mt-5 flex h-12 w-full max-w-[620px] items-center gap-3 rounded-ctl border-[1.5px] border-line2 bg-white px-4 text-left text-[15px] text-faint shadow-card transition-colors hover:border-brand">
      <Search size={18} /><span className="flex-1 truncate">Search stocks, ETFs, indices, currencies, commodities…</span><kbd className="hidden rounded border border-line2 px-1.5 text-[11px] font-medium text-slate2 sm:inline">/</kbd>
    </button>
  );
}
