'use client';
import { Bell, Clock, Columns2, FileText, Filter, History, Inbox, LayoutDashboard, LayoutGrid, LifeBuoy, PanelLeft, Settings, Shield, Star, StickyNote, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { cn } from '@/lib/format';
import { WORKSPACE_NAV } from '@/lib/routes';
import type { TableName } from '@/lib/types';

const ICONS: Record<string, LucideIcon> = { LayoutDashboard, Star, Bell, Inbox, Filter, Columns2, LayoutGrid, Clock, FileText, StickyNote, History, Settings, Shield, LifeBuoy };

/** Personal research sidebar. Research data only: there is no portfolio, order or position entry. */
export function WorkspaceSidebar() {
  const pathname = usePathname();
  const { data } = useWorkspace();
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => { setCollapsed(localStorage.getItem('inrgift.sidebar') === '1'); }, []);
  const toggle = () => setCollapsed((c) => { localStorage.setItem('inrgift.sidebar', c ? '0' : '1'); return !c; });
  return (
    <aside aria-label="Personal workspace" className={cn('sticky top-16 hidden h-[calc(100vh-64px)] shrink-0 flex-col overflow-y-auto border-r border-line bg-white px-2.5 py-3 transition-[width] duration-200 ease-out md:flex', collapsed ? 'w-16' : 'w-[248px] max-lg:w-16')}>
      <nav className="flex-1">
        {WORKSPACE_NAV.map((g) => (
          <div key={g.group} className={g.group === 'System' ? 'mt-3 border-t border-line pt-2' : ''}>
            <p className={cn('px-2.5 pb-1.5 pt-3 text-[11px] font-semibold text-faint max-lg:sr-only', collapsed && 'sr-only')}>{g.group}</p>
            {g.items.map(([label, href, icon, table]) => {
              const Icon = ICONS[icon];
              const on = href === '/app' ? pathname === '/app' : pathname.startsWith(href);
              const count = table ? data[table as TableName].length : 0;
              const alertHot = table === 'alerts' && data.alerts.some((a) => a.status === 'triggered');
              return (
                <Link key={href} href={href} title={label} aria-current={on ? 'page' : undefined} className={cn('flex items-center gap-2.5 rounded-lg px-2.5 py-2 font-medium transition-colors duration-150', on ? 'bg-brand-soft text-brand-ink' : 'text-slate2 hover:bg-hover hover:text-navy', collapsed && 'justify-center', 'max-lg:justify-center')}>
                  <Icon size={18} strokeWidth={1.75} className="shrink-0" />
                  <span className={cn('flex-1 truncate max-lg:hidden', collapsed && 'hidden')}>{label}</span>
                  {count > 0 && <span className={cn('rounded-full px-1.5 text-[11px] max-lg:hidden', collapsed && 'hidden', alertHot ? 'bg-brand text-white' : on ? 'bg-white text-brand-ink' : 'bg-hover text-slate2')}>{count}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <button type="button" onClick={toggle} aria-expanded={!collapsed} className="mt-2 hidden items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate2 transition-colors hover:bg-hover hover:text-navy lg:flex"><PanelLeft size={18} strokeWidth={1.75} /><span className={collapsed ? 'sr-only' : ''}>Collapse sidebar</span></button>
    </aside>
  );
}
/** Horizontal workspace tabs for phones, where the sidebar is hidden. */
export function WorkspaceTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Workspace sections" className="sticky top-16 z-20 flex gap-1 overflow-x-auto border-b border-line bg-white px-3 py-2 md:hidden">
      {WORKSPACE_NAV.flatMap((g) => g.items as readonly (readonly [string, string, string, string | null])[]).map(([label, href]) => { const on = href === '/app' ? pathname === '/app' : pathname.startsWith(href); return <Link key={href} href={href} aria-current={on ? 'page' : undefined} className={cn('whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[13px] font-medium', on ? 'bg-brand-soft text-brand-ink' : 'text-slate2')}>{label}</Link>; })}
    </nav>
  );
}
