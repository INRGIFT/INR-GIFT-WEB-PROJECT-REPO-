'use client';
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/format';

export interface TabItem { id: string; label: ReactNode; content: ReactNode; count?: number }

/**
 * WAI-ARIA tabs with a sliding indicator. Arrow keys, Home and End move between tabs; only the active tab is in the
 * tab order. Content fades in on change (collapsed by prefers-reduced-motion).
 */
export function Tabs({ items, value, onChange, label, className, panelClassName }: { items: TabItem[]; value?: string; onChange?: (id: string) => void; label: string; className?: string; panelClassName?: string }) {
  const [inner, setInner] = useState(items[0]?.id);
  const active = value ?? inner;
  const set = (id: string) => { setInner(id); onChange?.(id); };
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const idx = Math.max(0, items.findIndex((t) => t.id === active));
  const onKey = (e: KeyboardEvent) => {
    const n = items.length;
    const next = e.key === 'ArrowRight' ? (idx + 1) % n : e.key === 'ArrowLeft' ? (idx - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    set(items[next].id);
    refs.current[next]?.focus();
  };
  const current = items[idx];
  return (
    <div className={className}>
      <div role="tablist" aria-label={label} onKeyDown={onKey} className="scrollbar-none flex gap-1 overflow-x-auto border-b border-line">
        {items.map((t, i) => {
          const on = i === idx;
          return (
            <button key={t.id} ref={(el) => { refs.current[i] = el; }} id={`${base}-t-${t.id}`} role="tab" type="button" aria-selected={on} aria-controls={`${base}-p-${t.id}`} tabIndex={on ? 0 : -1} onClick={() => set(t.id)}
              className={cn('relative -mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-[13px] font-semibold transition-colors duration-micro', on ? 'text-brand-ink' : 'text-slate2 hover:text-navy')}>
              {t.label}{t.count != null && <span className={cn('rounded-full px-1.5 text-[11px] font-medium', on ? 'bg-brand-soft text-brand-ink' : 'bg-hover text-slate2')}>{t.count}</span>}
              <span aria-hidden className={cn('absolute inset-x-2 bottom-0 h-0.5 rounded bg-brand transition-[opacity,transform] duration-panel ease-out', on ? 'scale-x-100 opacity-100' : 'scale-x-50 opacity-0')} />
            </button>
          );
        })}
      </div>
      {current && <div key={current.id} id={`${base}-p-${current.id}`} role="tabpanel" aria-labelledby={`${base}-t-${current.id}`} tabIndex={0} className={cn('animate-fade-in focus-visible:outline-offset-4', panelClassName)}>{current.content}</div>}
    </div>
  );
}
