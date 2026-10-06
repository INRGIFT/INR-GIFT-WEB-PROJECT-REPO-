'use client';
import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/format';

export type MenuEntry =
  | { kind?: 'link'; label: ReactNode; href: string; hint?: ReactNode; icon?: ReactNode }
  | { kind: 'action'; label: ReactNode; onSelect: () => void; hint?: ReactNode; icon?: ReactNode; danger?: boolean }
  | { kind: 'separator' }
  | { kind: 'heading'; label: ReactNode };

/**
 * Dropdown menu. Opens on click, Enter, Space or ArrowDown; arrow keys move between items; Escape and outside
 * clicks close it and return focus to the trigger. Used by the header navigation, account menu and row overflow menus.
 */
export function Menu({ trigger, items, align = 'left', className, triggerClassName, label, width = 'min-w-[240px]' }: { trigger: (open: boolean) => ReactNode; items: MenuEntry[]; align?: 'left' | 'right'; className?: string; triggerClassName?: string; label: string; width?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const focusables = () => Array.from(list.current?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? []);
  const close = useCallback((refocus = true) => { setOpen(false); if (refocus) btn.current?.focus(); }, []);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) close(false); };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open, close]);
  const move = (dir: 1 | -1 | 'first' | 'last') => {
    const els = focusables(); if (!els.length) return;
    const i = els.indexOf(document.activeElement as HTMLElement);
    const next = dir === 'first' ? 0 : dir === 'last' ? els.length - 1 : (i + dir + els.length) % els.length;
    els[next].focus();
  };
  const onTriggerKey = (e: KeyboardEvent) => { if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); requestAnimationFrame(() => move('first')); } };
  const onListKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Home') { e.preventDefault(); move('first'); }
    else if (e.key === 'End') { e.preventDefault(); move('last'); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'Tab') close(false);
  };
  const item = 'flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-navy outline-none transition-colors duration-micro hover:bg-hover focus-visible:bg-hover focus-visible:outline-none';
  return (
    <div ref={root} className={cn('relative', className)}>
      <button ref={btn} type="button" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined} aria-label={label} onClick={() => setOpen((o) => !o)} onKeyDown={onTriggerKey} className={triggerClassName}>{trigger(open)}</button>
      {open && (
        <div ref={list} id={id} role="menu" aria-label={label} onKeyDown={onListKey} className={cn('absolute top-[calc(100%+6px)] z-40 animate-pop-in rounded-card border border-line2 bg-white p-1.5 shadow-pop', align === 'right' ? 'right-0' : 'left-0', width)}>
          {items.map((it, i) => {
            if (it.kind === 'separator') return <div key={i} role="separator" className="my-1 border-t border-line" />;
            if (it.kind === 'heading') return <p key={i} className="px-2.5 pb-1 pt-2 text-[11px] font-semibold text-faint">{it.label}</p>;
            const body = <>{it.icon && <span className="mt-0.5 text-faint">{it.icon}</span>}<span className="min-w-0"><span className="block">{it.label}</span>{it.hint && <span className="block text-xs text-faint">{it.hint}</span>}</span></>;
            if (it.kind === 'action') return <button key={i} type="button" role="menuitem" className={cn(item, it.danger && 'text-down')} onClick={() => { close(false); it.onSelect(); }}>{body}</button>;
            return <Link key={i} href={it.href} role="menuitem" className={item} onClick={() => close(false)}>{body}</Link>;
          })}
        </div>
      )}
    </div>
  );
}
