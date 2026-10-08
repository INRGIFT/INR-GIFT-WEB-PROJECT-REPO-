'use client';
import { Bell, LayoutDashboard, LogOut, Menu as MenuIcon, Search, Settings, Shield } from 'lucide-react';
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
import { LEGAL_PATHS } from '@/lib/company';
import { cn } from '@/lib/format';
import { loginHref } from '@/lib/return-url';

export { Logo } from '@/components/brand/brand-logo';
import { Logo } from '@/components/brand/brand-logo';

/** The public navigation. Every item is a product page behind sign-in; signed out, middleware sends it to sign-in and back. */
export const SITE_NAV: [label: string, href: string, active: RegExp][] = [
  ['Markets', '/markets', /^\/(markets|assets|stocks|etfs|indices|fx|commodities|bonds|reits)(\/|$)/],
  ['Discover', '/discover', /^\/discover(?!\/(screener|compare))(\/|$)/],
  ['Screeners', '/discover/screener', /^\/discover\/screener(\/|$)/],
  ['Compare', '/discover/compare', /^\/discover\/compare(\/|$)/],
  ['Research', '/research', /^\/research(\/|$)/],
  ['News', '/news', /^\/news(\/|$)/],
];
const SUPPORT_LINKS: [string, string][] = [['Support', LEGAL_PATHS.support], ['Grievance Redressal', LEGAL_PATHS.grievance], ['Account Closure', LEGAL_PATHS.accountClosure], ['About', LEGAL_PATHS.about], ['Legal', LEGAL_PATHS.legal]];
const initialsOf = (name?: string | null) => (name ?? '').split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'ME';

/**
 * Header for the public pages (homepage and compliance pages): logo, six product destinations, search, and sign-in or
 * the account. Compact on every width; below `lg` the destinations move into a drawer and the header keeps the logo,
 * Sign In, Get Started and the menu button.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const openSearch = useOpenSearch();
  const { user, loading, auth } = useSession();
  const ws = useWorkspace();
  const [drawer, setDrawer] = useState(false);
  useEffect(() => setDrawer(false), [pathname]);
  const unread = ws.data.notifications.filter((n) => !n.read).length;
  const signOut = async () => { await auth.signOut(); router.push('/'); router.refresh(); };
  const signInHref = pathname === '/' ? '/login' : loginHref(pathname);
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur-sm supports-[backdrop-filter]:bg-white/85">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow-pop">Skip to content</a>
      <div className="mx-auto flex h-[var(--header-h)] max-w-wide items-center gap-2 px-4 md:px-6 lg:px-8">
        <Logo />
        <nav aria-label="Primary" className="ml-6 hidden items-center gap-0.5 lg:flex xl:ml-8">
          {SITE_NAV.map(([label, href, re]) => {
            const on = re.test(pathname);
            return (
              <Link key={href} href={href} aria-current={on ? 'page' : undefined} className={cn('relative rounded-lg px-3 py-2 text-[14px] font-medium transition-colors duration-micro', on ? 'text-brand-ink' : 'text-slate2 hover:bg-hover hover:text-navy')}>
                {label}<span aria-hidden className={cn('absolute inset-x-3 -bottom-[17px] h-0.5 rounded bg-brand transition-opacity duration-panel', on ? 'opacity-100' : 'opacity-0')} />
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={openSearch} aria-label="Search" aria-keyshortcuts="/ Control+K Meta+K" className="hidden h-9 items-center gap-2 rounded-ctl px-2.5 text-[14px] font-medium text-slate2 transition-colors duration-micro hover:bg-hover hover:text-navy sm:inline-flex">
            <Search size={17} aria-hidden /><span className="hidden xl:inline">Search</span><span className="hidden items-center gap-0.5 xl:inline-flex"><Kbd>⌘</Kbd><Kbd>K</Kbd></span>
          </button>
          {loading ? <span className="skeleton h-9 w-[168px]" aria-hidden /> : user ? (
            <>
              <ButtonLink href="/app" variant="primary" size="sm" className="hidden sm:inline-flex">Open Workspace</ButtonLink>
              <Link href="/notifications" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} className="relative hidden h-9 w-9 items-center justify-center rounded-ctl text-slate2 transition-colors hover:bg-hover hover:text-navy sm:flex"><Bell size={18} />{unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-brand px-0.5 text-[9px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>}</Link>
              <Menu label="Account menu" align="right" triggerClassName="flex h-9 w-9 items-center justify-center rounded-full bg-navy font-display text-xs font-bold text-white transition-transform duration-micro active:scale-95"
                trigger={() => initialsOf(user.name)}
                items={[{ kind: 'heading', label: <span className="block text-[13px] font-semibold text-navy">{user.name}<span className="block truncate text-xs font-normal text-faint">{user.email ?? user.phone}</span></span> }, { kind: 'separator' },
                  { label: 'Workspace', href: '/app', icon: <LayoutDashboard size={15} /> }, { label: 'Preferences', href: '/account/settings', icon: <Settings size={15} /> }, { label: 'Security', href: '/account/security', icon: <Shield size={15} /> }, { kind: 'separator' },
                  { kind: 'action', label: 'Sign out', onSelect: signOut, icon: <LogOut size={15} /> }]} />
            </>
          ) : (
            <>
              <ButtonLink href={signInHref} variant="ghost" size="sm" className="px-2.5 font-semibold text-navy sm:px-3">Sign In</ButtonLink>
              <ButtonLink href="/signup" variant="primary" size="sm" className="px-3">Get Started</ButtonLink>
            </>
          )}
          <button type="button" onClick={() => setDrawer(true)} aria-label="Open menu" aria-expanded={drawer} className="-mr-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-ctl text-slate2 transition-colors hover:bg-hover hover:text-navy lg:hidden"><MenuIcon size={20} /></button>
        </div>
      </div>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Menu" footer={user ? <div className="grid gap-2"><ButtonLink href="/app" variant="primary">Open Workspace</ButtonLink><button type="button" onClick={signOut} className={buttonClass('secondary', 'md', 'w-full')}><LogOut size={16} />Sign out</button></div> : <div className="grid grid-cols-2 gap-2"><ButtonLink href={signInHref}>Sign In</ButtonLink><ButtonLink href="/signup" variant="primary">Get Started</ButtonLink></div>}>
        <nav aria-label="Main menu" className="p-2">
          <button type="button" onClick={() => { setDrawer(false); openSearch(); }} className="mb-2 flex h-11 w-full items-center gap-2 rounded-ctl border border-line2 bg-bg px-3 text-left text-faint"><Search size={16} aria-hidden />Search assets, markets, research…</button>
          <ul>
            {SITE_NAV.map(([label, href, re]) => <li key={href}><Link href={href} aria-current={re.test(pathname) ? 'page' : undefined} className={cn('block rounded-lg px-2.5 py-2.5 text-[15px] font-semibold hover:bg-hover', re.test(pathname) ? 'text-brand-ink' : 'text-navy')}>{label}</Link></li>)}
          </ul>
          <p className="mt-4 border-t border-line px-2.5 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-[.14em] text-faint">Support and legal</p>
          <ul>{SUPPORT_LINKS.map(([label, href]) => <li key={href}><Link href={href} className="block rounded-lg px-2.5 py-2 text-[14px] text-slate2 hover:bg-hover hover:text-navy">{label}</Link></li>)}</ul>
        </nav>
      </Drawer>
    </header>
  );
}
