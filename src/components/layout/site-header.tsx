'use client';
import { Bell, ChevronDown, Globe2, LogOut, Menu as MenuIcon, Search, Settings, Shield, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ButtonLink, buttonClass } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { Menu } from '@/components/ui/menu';
import { Kbd } from '@/components/ui/primitives';
import { useSession } from '@/features/auth/session-context';
import { useOpenSearch } from '@/features/search/search-command';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { cn } from '@/lib/format';
import { ACCOUNT_NAV, NAV } from '@/lib/routes';

export { Logo } from '@/components/brand/brand-logo';
import { Logo } from '@/components/brand/brand-logo';
const ACTIVE: Record<string, RegExp> = { Markets: /^\/markets/, Assets: /^\/(assets|stocks|etfs|indices|fx|commodities|bonds|reits)/, Discover: /^\/discover/, Research: /^\/research/, Resources: /^\/resources/ };
const initialsOf = (name?: string | null) => (name ?? '').split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'ME';

export function SiteHeader({ openCount, demo }: { openCount: number; demo: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const openSearch = useOpenSearch();
  const { user, loading, auth } = useSession();
  const ws = useWorkspace();
  const [drawer, setDrawer] = useState(false);
  useEffect(() => setDrawer(false), [pathname]);
  const unread = ws.data.notifications.filter((n) => !n.read).length;
  const signOut = async () => { await auth.signOut(); router.push('/'); router.refresh(); };
  const currency = (
    <select aria-label="Display currency" value={ws.prefs.currency} onChange={(e) => ws.setPrefs({ currency: e.target.value as 'LOCAL' | 'INR' })} className="h-9 rounded-ctl border border-line2 bg-white px-2 text-[13px] font-medium transition-colors hover:border-faint">
      <option value="LOCAL">Local currency</option><option value="INR">INR ₹</option>
    </select>
  );
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur-sm supports-[backdrop-filter]:bg-white/90">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow-pop">Skip to content</a>
      <div className="mx-auto flex h-[var(--header-h)] max-w-wide items-center gap-2 px-4 md:px-6 lg:px-8">
        <button type="button" onClick={() => setDrawer(true)} aria-label="Open menu" aria-expanded={drawer} className="-ml-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-ctl text-slate2 transition-colors hover:bg-hover hover:text-navy lg:hidden"><MenuIcon size={20} /></button>
        <Logo />
        <nav aria-label="Primary" className="ml-4 hidden items-center gap-0.5 lg:flex">
          {NAV.map((n) => {
            const on = ACTIVE[n.label].test(pathname);
            return (
              <Menu key={n.label} label={`${n.label} menu`} items={[{ label: `${n.label} overview`, href: n.href, hint: n.hint }, { kind: 'separator' }, ...n.items.map(([label, href, hint]) => ({ label, href, hint: hint || undefined }))]}
                triggerClassName={cn('relative flex items-center gap-1 rounded-lg px-2.5 py-2 font-medium transition-colors duration-micro', on ? 'text-brand-ink' : 'text-slate2 hover:bg-hover hover:text-navy')}
                trigger={(open) => (<>{n.label}<ChevronDown size={14} className={cn('transition-transform duration-micro', open && 'rotate-180')} /><span aria-hidden className={cn('absolute inset-x-2.5 -bottom-[17px] h-0.5 rounded bg-brand transition-opacity duration-panel', on ? 'opacity-100' : 'opacity-0')} /></>)} />
            );
          })}
        </nav>
        <button type="button" onClick={openSearch} className="mx-auto flex h-10 min-w-0 max-w-[460px] flex-1 items-center gap-2 rounded-ctl border border-line2 bg-bg px-3 text-faint transition-colors duration-micro hover:border-brand" aria-label="Search everything" aria-keyshortcuts="/ Control+K Meta+K">
          <Search size={16} className="shrink-0" /><span className="flex-1 truncate text-left">Search assets, markets, research…</span><span className="hidden md:inline"><Kbd>/</Kbd></span>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <div className="hidden md:block">{currency}</div>
          <Link href="/markets" title="Markets open right now" className="hidden h-9 items-center gap-1.5 rounded-ctl px-2 text-[13px] text-slate2 transition-colors hover:bg-hover hover:text-navy 2xl:flex"><Globe2 size={17} />{openCount} open</Link>
          {demo && <Link href="/resources/data#data-source" title="Demo data. Connect a live provider to enable production market feeds." className="hidden rounded-md bg-warn/10 px-1.5 py-0.5 text-[11px] font-semibold text-warn sm:block">Demo data</Link>}
          {loading ? <span className="skeleton h-9 w-20" aria-hidden /> : user ? (
            <>
              <Link href="/notifications" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} className="relative flex h-9 w-9 items-center justify-center rounded-ctl text-slate2 transition-colors hover:bg-hover hover:text-navy"><Bell size={18} />{unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-brand px-0.5 text-[9px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>}</Link>
              <Menu label="Account menu" align="right" triggerClassName="flex h-9 w-9 items-center justify-center rounded-full bg-navy font-display text-xs font-bold text-white transition-transform duration-micro active:scale-95"
                trigger={() => initialsOf(user.name)}
                items={[{ kind: 'heading', label: <span className="block text-[13px] font-semibold text-navy">{user.name}<span className="block truncate text-xs font-normal text-faint">{user.email ?? user.phone}</span></span> }, { kind: 'separator' },
                  { label: 'Workspace', href: '/app', icon: <User size={15} /> }, { label: 'Settings', href: '/account/settings', icon: <Settings size={15} /> }, { label: 'Security', href: '/account/security', icon: <Shield size={15} /> }, { kind: 'separator' },
                  { kind: 'action', label: 'Sign out', onSelect: signOut, icon: <LogOut size={15} /> }]} />
            </>
          ) : (<><ButtonLink href={`/login?next=${encodeURIComponent(pathname)}`} variant="ghost" size="sm" className="hidden sm:inline-flex">Sign in</ButtonLink><ButtonLink href="/signup" variant="primary" size="sm">Sign up</ButtonLink></>)}
        </div>
      </div>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Menu" footer={user ? <button type="button" onClick={signOut} className={buttonClass('secondary', 'md', 'w-full')}><LogOut size={16} />Sign out</button> : <div className="grid grid-cols-2 gap-2"><ButtonLink href={`/login?next=${encodeURIComponent(pathname)}`}>Sign in</ButtonLink><ButtonLink href="/signup" variant="primary">Sign up</ButtonLink></div>}>
        <nav aria-label="Main menu" className="p-2">
          {user && (<div className="mb-2 border-b border-line pb-2"><p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold text-faint">Signed in as {user.name}</p>{ACCOUNT_NAV.map(([l, h]) => <Link key={h} href={h} className="block rounded-lg px-2.5 py-2 font-medium hover:bg-hover">{l}</Link>)}</div>)}
          {NAV.map((n) => (
            <details key={n.label} className="group" open={ACTIVE[n.label].test(pathname)}>
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-2.5 py-2.5 font-semibold hover:bg-hover [&::-webkit-details-marker]:hidden">{n.label}<ChevronDown size={16} className="text-faint transition-transform duration-micro group-open:rotate-180" /></summary>
              <div className="mb-1 ml-2.5 border-l border-line pl-2">
                <Link href={n.href} className="block rounded-lg px-2.5 py-1.5 text-[13px] text-slate2 hover:bg-hover hover:text-navy">{n.label} overview</Link>
                {n.items.map(([label, href]) => <Link key={href + label} href={href} aria-current={pathname === href ? 'page' : undefined} className={cn('block rounded-lg px-2.5 py-1.5 text-[13px] hover:bg-hover', pathname === href ? 'font-semibold text-brand-ink' : 'text-slate2 hover:text-navy')}>{label}</Link>)}
              </div>
            </details>
          ))}
          <div className="mt-3 space-y-3 border-t border-line px-2.5 pt-4">
            <label className="block"><span className="label">Display currency</span>{currency}</label>
            <p className="text-xs text-faint">{openCount} markets open now · <Link className="link" href="/markets">Sessions</Link>{demo && <> · <span className="font-semibold text-warn">Demo data</span></>}</p>
          </div>
        </nav>
      </Drawer>
    </header>
  );
}
