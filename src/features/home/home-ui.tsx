import type { ReactNode } from 'react';
import { cn } from '@/lib/format';

/**
 * Homepage layout primitives. One rhythm for every section (8 px grid: 80/112 px vertical padding, 1360 px page
 * width, 16/24/32 px gutters) so the page reads as one composition, not a stack of unrelated blocks.
 */
export type Surface = 'white' | 'tint' | 'navy';
const SURFACE: Record<Surface, string> = { white: 'bg-white text-navy', tint: 'bg-bg text-navy', navy: 'bg-navy text-white' };

export function HomeSection({ id, surface = 'white', children, className, labelledBy, bordered }: { id: string; surface?: Surface; children: ReactNode; className?: string; labelledBy?: string; bordered?: boolean }) {
  return (
    <section id={id} aria-labelledby={labelledBy ?? `${id}-title`} className={cn('relative', SURFACE[surface], bordered && 'border-t border-line', className)}>
      <div className="mx-auto max-w-page px-4 py-20 md:px-6 md:py-28 lg:px-8">{children}</div>
    </section>
  );
}

/** Eyebrow, heading and lead. Headings are sentence case statements; the eyebrow carries the section's subject. */
export function SectionHeading({ id, eyebrow, title, lead, tone = 'light', align = 'left', className, children }: { id: string; eyebrow: string; title: ReactNode; lead?: ReactNode; tone?: 'light' | 'dark'; align?: 'left' | 'center'; className?: string; children?: ReactNode }) {
  const dark = tone === 'dark';
  return (
    <header data-reveal className={cn(align === 'center' && 'mx-auto text-center', 'max-w-[760px]', className)}>
      <p className={cn('eyebrow flex items-center gap-3', align === 'center' && 'justify-center', dark ? 'text-ice' : 'text-brand-ink')}>
        <span aria-hidden className="h-px w-7 bg-saffron" />{eyebrow}
      </p>
      <h2 id={`${id}-title`} className={cn('mt-4 font-display text-[32px] font-extrabold leading-[1.06] tracking-[-0.015em] md:text-[44px]', dark ? 'text-white' : 'text-navy')}>{title}</h2>
      {lead && <p className={cn('mt-5 text-[17px] leading-relaxed', align === 'center' && 'mx-auto', 'max-w-[62ch]', dark ? 'text-white/75' : 'text-slate2')}>{lead}</p>}
      {children}
    </header>
  );
}

/** A labelled note that the values beside it are simulated (DEMO) — never omitted where demo values are shown. */
export function DemoNote({ className, tone = 'light' }: { className?: string; tone?: 'light' | 'dark' }) {
  return (
    <p className={cn('flex items-start gap-1.5 text-xs', tone === 'dark' ? 'text-white/60' : 'text-faint', className)}>
      <span aria-hidden className={tone === 'dark' ? 'text-saffron' : 'text-warn'}>◇</span>
      <span>Demo data: simulated values from INRGIFT's demo provider, shown to preview the product. Not market prices.</span>
    </p>
  );
}
