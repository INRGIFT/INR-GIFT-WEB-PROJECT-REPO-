'use client';
import { Compass, FileText, Globe2, Home, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/format';

const ITEMS = [['Home', '/', Home, /^\/$/], ['Markets', '/markets', Globe2, /^\/(markets|assets|stocks|etfs|indices|fx|commodities|bonds|reits)/], ['Discover', '/discover', Compass, /^\/discover/], ['Research', '/research', FileText, /^\/(research|resources)/], ['Workspace', '/app', User, /^\/(app|account|notifications)/]] as const;
export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Mobile" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      {ITEMS.map(([label, href, Icon, re]) => { const on = re.test(pathname); return <Link key={href} href={href} aria-current={on ? 'page' : undefined} className={cn('flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors', on ? 'text-brand-ink' : 'text-slate2')}><Icon size={19} strokeWidth={on ? 2.2 : 1.75} />{label}</Link>; })}
    </nav>
  );
}
