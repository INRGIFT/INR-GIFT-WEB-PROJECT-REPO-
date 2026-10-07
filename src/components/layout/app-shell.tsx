'use client';
import {
  Bell, BadgeCheck, Bookmark, CalendarDays, ChevronDown, Clock, Columns2, Compass, DoorOpen, FileText, Filter, Globe2, GraduationCap, History, Inbox,
  LayoutDashboard, LayoutGrid, LifeBuoy, LogOut, Menu as MenuIcon, MessageSquareWarning, MonitorSmartphone, Newspaper, PanelLeftClose, PanelLeftOpen,
  Search, Settings, Shield, SlidersHorizontal, Star, StickyNote, UserRound, type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { BrandMark } from '@/components/brand/brand-logo';
import { Drawer } from '@/components/ui/drawer';
import { Menu } from '@/components/ui/menu';
import { Kbd, Skeleton } from '@/components/ui/primitives';
import { initialsOf, useAccount } from '@/features/account/account-context';
import { maskEmail } from '@/features/auth/auth-ui';
import { useSession } from '@/features/auth/session-context';
import { useOpenSearch } from '@/features/search/search-command';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { cn } from '@/lib/format';
import { APP_NAV, APP_NAV_MORE, appTitle, type AppNavItem } from '@/lib/routes';

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard, Compass, Globe2, SlidersHorizontal, Columns2, FileText, Newspaper, Star, Bell, Bookmark, UserRound, Shield, MonitorSmartphone,
  Settings, LifeBuoy, MessageSquareWarning, DoorOpen, Filter, LayoutGrid, StickyNote, Clock, History, Inbox, CalendarDays, GraduationCap,
};
const COLLAPSED_KEY = 'inrgift.sidebar';

/**
 * The authenticated application frame: a fixed, collapsible vertical sidebar (Workspace, Account, Support, More, and
 * the signed-in person at the bottom), a top bar (page title, search, notifications when there are any, account menu)
 * and, below 1024 px, the same navigation in a drawer. Research only: there is no order, position or portfolio entry.
 */
export function AppShell({ children, demo }: { children: ReactNode; demo: boolean }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  useEffect(() => { try { setCollapsed(localStorage.getItem(COLLAPSED_KEY) === '1'); } catch { /* storage unavailable */ } }, []);
  useEffect(() => setDrawer(false), [pathname]);
  const toggle = () => setCollapsed((c) => { try { localStorage.setItem(COLLAPSED_KEY, c ? '0' : '1'); } catch { /* ignore */ } return !c; });
  return (
    <div className="min-h-screen bg-bg">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow-pop">Skip to content</a>
      <aside id="app-sidebar" aria-label="Application" className={cn('fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-white transition-[width] duration-200 ease-out lg:flex', collapsed ? 'w-[76px]' : 'w-[264px]')}>
        {/* Brand guidelines: the horizontal lockup is at least 220 px wide; collapsed, the emblem at 36 px tall. */}
        <div className="flex h-[var(--header-h)] shrink-0 items-center justify-center border-b border-line px-2">
          <Link href="/app" aria-label="INRGIFT workspace home" className="rounded-md">{collapsed ? <BrandMark lockup="emblem" height={36} decorative /> : <BrandMark lockup="horizontal" height={57} decorative />}</Link>
        </div>
        <SidebarNav collapsed={collapsed} />
        <button type="button" onClick={toggle} aria-controls="app-sidebar" aria-expanded={!collapsed}
          className={cn('mx-2.5 mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-faint transition-colors hover:bg-hover hover:text-navy', collapsed && 'justify-center px-0')}>
          {collapsed ? <PanelLeftOpen size={18} aria-hidden /> : <PanelLeftClose size={18} aria-hidden />}<span className={collapsed ? 'sr-only' : ''}>{collapsed ? 'Expand sidebar' : 'Collapse sidebar'}</span>
        </button>
        <UserCard collapsed={collapsed} />
      </aside>
      <div className={cn('flex min-h-screen min-w-0 flex-col transition-[padding] duration-200 ease-out', collapsed ? 'lg:pl-[76px]' : 'lg:pl-[264px]')}>
        <TopBar onMenu={() => setDrawer(true)} demo={demo} drawerOpen={drawer} />
        <main id="main" className="min-w-0 flex-1 pb-14">{children}</main>
      </div>
      <Drawer open={drawer} onClose={() => setDrawer(false)} title="INRGIFT">
        <div className="flex min-h-full flex-col">
          <SidebarNav collapsed={false} />
          <UserCard collapsed={false} />
        </div>
      </Drawer>
    </div>
  );
}

function NavLink({ item, collapsed, count }: { item: AppNavItem; collapsed: boolean; count?: number }) {
  const pathname = usePathname();
  const on = item.match.test(pathname);
  const Icon = ICONS[item.icon] ?? FileText;
  return (
    <Link href={item.href} title={collapsed ? item.label : undefined} aria-current={on ? 'page' : undefined}
      className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors duration-150', collapsed && 'justify-center px-0', on ? 'bg-brand-soft text-brand-ink' : 'text-slate2 hover:bg-hover hover:text-navy')}>
      <Icon size={18} strokeWidth={on ? 2.1 : 1.75} className="shrink-0" aria-hidden />
      <span className={cn('flex-1 truncate', collapsed && 'sr-only')}>{item.label}</span>
      {!collapsed && count !== undefined && count > 0 && <span className={cn('num rounded-full px-1.5 text-[11px] font-semibold', on ? 'bg-white text-brand-ink' : 'bg-hover text-slate2')}>{count}</span>}
    </Link>
  );
}

function SidebarNav({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const ws = useWorkspace();
  const moreActive = APP_NAV_MORE.some((i) => i.match.test(pathname));
  const countOf = (i: AppNavItem) => (i.table && ws.ready && !ws.failed.includes(i.table) ? ws.data[i.table].length : undefined);
  return (
    <nav aria-label="Workspace navigation" className="min-h-0 flex-1 overflow-y-auto px-2.5 py-3">
      {APP_NAV.map((g) => (
        <div key={g.group} className="mb-3">
          <p className={cn('px-3 pb-1.5 pt-2 text-micro font-semibold uppercase tracking-[.1em] text-faint', collapsed && 'sr-only')}>{g.group}</p>
          <ul className="space-y-0.5">{g.items.map((i) => <li key={i.href}><NavLink item={i} collapsed={collapsed} count={countOf(i)} /></li>)}</ul>
        </div>
      ))}
      {collapsed ? (
        <ul className="space-y-0.5 border-t border-line pt-3">{APP_NAV_MORE.map((i) => <li key={i.href}><NavLink item={i} collapsed /></li>)}</ul>
      ) : (
        <details className="group border-t border-line pt-2" open={moreActive}>
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2 text-micro font-semibold uppercase tracking-[.1em] text-faint hover:bg-hover hover:text-navy [&::-webkit-details-marker]:hidden">More<ChevronDown size={14} className="transition-transform duration-150 group-open:rotate-180" aria-hidden /></summary>
          <ul className="mt-0.5 space-y-0.5">{APP_NAV_MORE.map((i) => <li key={i.href}><NavLink item={i} collapsed={false} /></li>)}</ul>
        </details>
      )}
    </nav>
  );
}

/** The signed-in person: initials, full name, masked email, GIFT ID and email verification. Real values only. */
function UserCard({ collapsed }: { collapsed: boolean }) {
  const { user, loading } = useSession();
  const { profile, loading: profileLoading, error, reload } = useAccount();
  if (loading || (user && profileLoading && !profile)) return <div className="border-t border-line p-3"><Skeleton className={cn('h-12', collapsed ? 'w-12' : 'w-full')} /></div>;
  if (!user) return null;
  const name = profile?.name ?? user.name;
  const email = profile?.email ?? user.email;
  const verified = profile?.emailVerified ?? user.emailVerified;
  return (
    <div className="shrink-0 border-t border-line p-2.5">
      <Link href="/account/profile" title={collapsed ? `${name}${profile?.giftId ? ` · ${profile.giftId}` : ''}` : undefined} className={cn('flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-hover', collapsed && 'justify-center')}>
        <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy font-display text-[13px] font-bold text-white">{initialsOf(name)}</span>
        <span className={cn('min-w-0 flex-1', collapsed && 'sr-only')}>
          <span className="block truncate text-[14px] font-semibold text-navy">{name}</span>
          {email && <span className="block truncate text-xs text-slate2">{maskEmail(email)}</span>}
          {profile?.giftId ? <span className="num mt-0.5 block truncate text-[11px] font-semibold tracking-wide text-brand-ink"><span className="sr-only">GIFT ID </span>{profile.giftId}</span>
            : error ? null : <span className="mt-0.5 block text-[11px] text-faint">GIFT ID being assigned</span>}
          <span className={cn('mt-0.5 flex items-center gap-1 text-[11px] font-medium', verified ? 'text-up' : 'text-warn')}><BadgeCheck size={12} aria-hidden />{verified ? 'Email verified' : 'Email not verified'}</span>
        </span>
      </Link>
      {error && !collapsed && <button type="button" onClick={reload} className="link mt-1 px-2 text-xs">Account details did not load. Retry</button>}
    </div>
  );
}

function TopBar({ onMenu, demo, drawerOpen }: { onMenu: () => void; demo: boolean; drawerOpen: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const openSearch = useOpenSearch();
  const { user, auth, checkFailed } = useSession();
  const { profile } = useAccount();
  const ws = useWorkspace();
  const notes = ws.data.notifications;
  const unread = notes.filter((n) => !n.read).length;
  const signOut = async () => { await auth.signOut(); router.push('/'); router.refresh(); };
  const name = profile?.name ?? user?.name ?? '';
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur-sm supports-[backdrop-filter]:bg-white/90">
      <div className="flex h-[var(--header-h)] items-center gap-2 px-3 sm:px-4 lg:px-6">
        <button type="button" onClick={onMenu} aria-label="Open menu" aria-expanded={drawerOpen} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ctl text-slate2 transition-colors hover:bg-hover hover:text-navy lg:hidden"><MenuIcon size={20} /></button>
        <Link href="/app" aria-label="INRGIFT workspace home" className="shrink-0 lg:hidden"><BrandMark lockup="emblem" height={30} decorative /></Link>
        <p className="min-w-0 truncate font-display text-[16px] font-bold text-navy sm:text-[17px]">{appTitle(pathname)}</p>
        <div className="flex min-w-0 flex-1 justify-center px-2">
          <button type="button" onClick={openSearch} className="hidden h-search w-full max-w-[460px] items-center gap-2 rounded-ctl border border-line2 bg-bg px-3 text-faint transition-colors duration-micro hover:border-brand md:flex" aria-label="Search everything" aria-keyshortcuts="/ Control+K Meta+K">
            <Search size={16} className="shrink-0" aria-hidden /><span className="flex-1 truncate text-left">Search assets, markets, research…</span><span className="hidden items-center gap-1 xl:flex"><Kbd>⌘</Kbd><Kbd>K</Kbd></span>
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={openSearch} aria-label="Search everything" className="flex h-9 w-9 items-center justify-center rounded-ctl text-slate2 transition-colors hover:bg-hover hover:text-navy md:hidden"><Search size={18} /></button>
          <select aria-label="Display currency" value={ws.prefs.currency} onChange={(e) => ws.setPrefs({ currency: e.target.value as 'LOCAL' | 'INR' })} className="hidden h-9 rounded-ctl border border-line2 bg-white px-2 text-[13px] font-medium transition-colors hover:border-faint sm:block">
            <option value="LOCAL">Local</option><option value="INR">₹ INR</option>
          </select>
          {demo && <Link href="/resources/data#data-source" title="Demo data. Connect a live provider to enable production market feeds." className="hidden rounded-md bg-warn/10 px-1.5 py-0.5 text-[11px] font-semibold text-warn sm:block">Demo data</Link>}
          {checkFailed && <span role="status" className="hidden rounded-md bg-warn/10 px-1.5 py-0.5 text-[11px] font-semibold text-warn md:block">Reconnecting…</span>}
          {notes.length > 0 && <Link href="/notifications" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} className="relative flex h-9 w-9 items-center justify-center rounded-ctl text-slate2 transition-colors hover:bg-hover hover:text-navy"><Bell size={18} />{unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-brand px-0.5 text-[9px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>}</Link>}
          {user && (
            <Menu label="Account menu" align="right" triggerClassName="flex h-9 w-9 items-center justify-center rounded-full bg-navy font-display text-xs font-bold text-white transition-transform duration-micro active:scale-95"
              trigger={() => initialsOf(name)}
              items={[
                { kind: 'heading', label: <span className="block text-[13px] font-semibold text-navy">{name}{user.email && <span className="block truncate text-xs font-normal text-faint">{maskEmail(user.email)}</span>}{profile?.giftId && <span className="num mt-0.5 block text-[11px] font-semibold text-brand-ink">GIFT ID {profile.giftId}</span>}</span> },
                { kind: 'separator' },
                { label: 'Profile', href: '/account/profile', icon: <UserRound size={15} /> },
                { label: 'Security', href: '/account/security', icon: <Shield size={15} /> },
                { label: 'Sessions', href: '/account/sessions', icon: <MonitorSmartphone size={15} /> },
                { label: 'Preferences', href: '/account/settings', icon: <Settings size={15} /> },
                { kind: 'separator' },
                { kind: 'action', label: 'Sign out', onSelect: signOut, icon: <LogOut size={15} /> },
              ]} />
          )}
        </div>
      </div>
    </header>
  );
}
