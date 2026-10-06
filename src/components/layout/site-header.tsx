'use client';
import { Bell, ChevronDown, Globe2, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ButtonLink } from '@/components/ui/button';
import { useSession } from '@/features/auth/session-context';
import { useOpenSearch } from '@/features/search/search-command';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { cn } from '@/lib/format';
import { NAV } from '@/lib/routes';

export function Logo({ light }: { light?: boolean }) {
  return (
    <Link href="/" aria-label="INRGIFT home" className={cn('flex items-center gap-2 font-display text-lg font-extrabold tracking-wide', light ? 'text-white' : 'text-navy')}>
      <span aria-hidden className="relative block h-[26px] w-[26px] rounded-[7px] bg-brand"><span className="absolute inset-[6px] rounded-full border-2 border-white" /><span className="absolute bottom-1 left-3 top-1 w-0.5 bg-white" /></span>
      <span className="hidden sm:inline">INRGIFT</span>
    </Link>
  );
}
const ACTIVE: Record<string, RegExp> = { Markets: /^\/markets/, Assets: /^\/(assets|stocks|etfs|indices|fx|commodities|bonds|reits)/, Discover: /^\/discover/, Research: /^\/research/, Resources: /^\/resources/ };

export function SiteHeader({ openCount, demo }: { openCount: number; demo: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const openSearch = useOpenSearch();
  const { user, loading, auth } = useSession();
  const ws = useWorkspace();
  const [menu, setMenu] = useState<string | null>(null);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => setMenu(null), [pathname]);
  useEffect(() => {
    const away = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setMenu(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null); };
    document.addEventListener('mousedown', away); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, []);
  const unread = ws.data.notifications.filter((n) => !n.read).length;
  const initials = (user?.name ?? '').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'ME';
  const pop = 'absolute top-[calc(100%+6px)] z-40 min-w-[240px] animate-pop-in rounded-card border border-line2 bg-white p-1.5 shadow-pop';
  const item = 'block w-full rounded-lg px-2.5 py-2 text-left text-navy transition-colors hover:bg-hover';
  return (
    <header ref={ref} className="sticky top-0 z-30 border-b border-line bg-white">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow-pop">Skip to content</a>
      <div className="mx-auto flex h-16 max-w-wide items-center gap-2 px-4 md:px-6 lg:px-8">
        <Logo />
        <nav aria-label="Primary" className="ml-4 hidden items-center gap-0.5 lg:flex">
          {NAV.map((n) => (
            <div key={n.label} className="relative">
              <button type="button" aria-expanded={menu === n.label} aria-haspopup="true" onClick={() => setMenu(menu === n.label ? null : n.label)} className={cn('relative flex items-center gap-1 rounded-lg px-2.5 py-2 font-medium transition-colors', ACTIVE[n.label].test(pathname) ? 'text-brand-ink' : 'text-slate2 hover:bg-hover hover:text-navy')}>
                {n.label}<ChevronDown size={14} className={cn('transition-transform duration-150', menu === n.label && 'rotate-180')} />
                <span className={cn('absolute inset-x-2.5 -bottom-[13px] h-0.5 rounded bg-brand transition-opacity duration-200', ACTIVE[n.label].test(pathname) ? 'opacity-100' : 'opacity-0')} />
              </button>
              {menu === n.label && <div className={cn(pop, 'left-0')}>{n.items.map(([label, href, hint]) => <Link key={href + label} href={href} className={item}>{label}{hint && <span className="block text-xs text-faint">{hint}</span>}</Link>)}</div>}
            </div>
          ))}
        </nav>
        <button type="button" onClick={openSearch} className="mx-auto flex h-10 min-w-0 max-w-[460px] flex-1 items-center gap-2 rounded-ctl border border-line2 bg-bg px-3 text-faint transition-colors hover:border-brand" aria-label="Search everything">
          <Search size={16} /><span className="flex-1 truncate text-left">Search assets, markets, research…</span><kbd className="hidden rounded border border-line2 bg-white px-1.5 text-[11px] font-medium text-slate2 md:inline">/</kbd>
        </button>
        <div className="flex items-center gap-1">
          <label className="sr-only" htmlFor="hdr-ccy">Display currency</label>
          <select id="hdr-ccy" value={ws.prefs.currency} onChange={(e) => ws.setPrefs({ currency: e.target.value as 'LOCAL' | 'INR' })} className="hidden h-9 rounded-ctl border border-line2 bg-white px-2 text-[13px] font-medium md:block"><option value="LOCAL">Local</option><option value="INR">INR ₹</option></select>
          <Link href="/markets" title="Market status" className="hidden h-9 items-center gap-1.5 rounded-ctl px-2 text-[13px] text-slate2 transition-colors hover:bg-hover hover:text-navy xl:flex"><Globe2 size={17} />{openCount} open</Link>
          {demo && <Link href="/resources/data" title="Demo data. Connect a live provider to enable production market feeds." className="hidden rounded-md bg-warn/10 px-1.5 py-0.5 text-[11px] font-semibold text-warn md:block">Demo data</Link>}
          {loading ? <span className="skeleton h-9 w-24" /> : user ? (
            <>
              <Link href="/notifications" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} className="relative flex h-9 w-9 items-center justify-center rounded-ctl text-slate2 transition-colors hover:bg-hover hover:text-navy"><Bell size={18} />{unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-brand" />}</Link>
              <div className="relative">
                <button type="button" aria-label="Account menu" aria-expanded={menu === 'account'} onClick={() => setMenu(menu === 'account' ? null : 'account')} className="flex h-9 w-9 items-center justify-center rounded-full bg-navy font-display text-xs font-bold text-white transition-transform active:scale-95">{initials}</button>
                {menu === 'account' && (
                  <div className={cn(pop, 'right-0')}>
                    <p className="px-2.5 py-2"><span className="block font-semibold">{user.name}</span><span className="block truncate text-xs text-faint">{user.email ?? user.phone}</span></p>
                    {[['Workspace', '/app'], ['Profile', '/account/profile'], ['Settings', '/account/settings'], ['Security', '/account/security']].map(([l, h]) => <Link key={h} href={h} className={item}>{l}</Link>)}
                    <button type="button" className={item} onClick={async () => { await auth.signOut(); router.push('/'); router.refresh(); }}>Sign out</button>
                  </div>
                )}
              </div>
            </>
          ) : (<><ButtonLink href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">Sign in</ButtonLink><ButtonLink href="/signup" variant="primary" size="sm">Sign up</ButtonLink></>)}
        </div>
      </div>
    </header>
  );
}
