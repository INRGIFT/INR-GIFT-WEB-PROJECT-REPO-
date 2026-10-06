import Link from 'next/link';
import type { ReactNode } from 'react';
import { AlertTriangle, Inbox } from 'lucide-react';
import { cn, pct } from '@/lib/format';

export function Card({ className, children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('min-w-0 rounded-card border border-line bg-white shadow-card', className)} {...rest}>{children}</div>;
}
/** Titled surface used for every data module: header, optional tools, body, optional footer. */
export function Panel({ title, sub, tools, footer, flush, className, children, id }: { title: ReactNode; sub?: ReactNode; tools?: ReactNode; footer?: ReactNode; flush?: boolean; className?: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className={cn('min-w-0 rounded-card border border-line bg-white shadow-card', className)}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-4 py-3">
        <h2 className="text-[15px] font-bold">{title}</h2>
        {sub && <span className="text-xs text-faint">{sub}</span>}
        <span className="flex-1" />
        {tools}
      </header>
      <div className={flush ? '' : 'p-4'}>{children}</div>
      {footer && <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-4 py-2 text-xs text-faint">{footer}</footer>}
    </section>
  );
}
export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'brand' | 'up' | 'down' | 'warn'; className?: string }) {
  const tones = { neutral: 'bg-hover text-slate2', brand: 'bg-brand-soft text-brand-ink', up: 'bg-up/10 text-up', down: 'bg-down/10 text-down', warn: 'bg-warn/10 text-warn' };
  return <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold', tones[tone], className)}>{children}</span>;
}
/** Signed percentage with an arrow, so direction never depends on colour alone. */
export function Change({ value, dp = 2, className }: { value: number | null | undefined; dp?: number; className?: string }) {
  if (value == null) return <span className={cn('num text-faint', className)} title="Unavailable from source">—</span>;
  return <span className={cn('num', value > 0 ? 'text-up' : value < 0 ? 'text-down' : 'text-slate2', className)}>{value > 0 ? '▲ ' : value < 0 ? '▼ ' : ''}{pct(value, dp)}</span>;
}
export function Metric({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="bg-white px-3.5 py-3">
      <dt className="text-xs text-faint">{label}</dt>
      <dd className="num mt-0.5 text-[15px] font-semibold" title={hint}>{value}</dd>
    </div>
  );
}
export function MetricGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={cn('grid grid-cols-2 gap-px overflow-hidden rounded-ctl border border-line bg-line sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6', className)}>{children}</dl>;
}
export function Skeleton({ className }: { className?: string }) { return <div className={cn('skeleton h-4', className)} aria-hidden />; }
export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return <div className="space-y-3 p-4" role="status" aria-label="Loading">{Array.from({ length: rows }, (_, i) => <Skeleton key={i} className={i === rows - 1 ? 'w-3/5' : 'w-full'} />)}</div>;
}
export function EmptyState({ title, children, action, icon }: { title: string; children?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-3 text-faint">{icon ?? <Inbox size={22} strokeWidth={1.75} />}</div>
      <p className="font-display text-[15px] font-bold">{title}</p>
      {children && <p className="mt-1 max-w-md text-slate2">{children}</p>}
      {action && <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
export function ErrorState({ title = 'This could not load', children, action }: { title?: string; children?: ReactNode; action?: ReactNode }) {
  return <EmptyState title={title} action={action} icon={<AlertTriangle size={22} strokeWidth={1.75} className="text-down" />}>{children}</EmptyState>;
}
export function InlineError({ children }: { children: ReactNode }) { return <p role="alert" className="mt-1.5 text-[13px] text-down">{children}</p>; }
export function Breadcrumbs({ items }: { items: [string, string?][] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-2 text-xs text-faint">
      <ol className="flex flex-wrap gap-1.5">{items.map(([label, href], i) => <li key={i} className="flex gap-1.5">{i > 0 && <span aria-hidden>/</span>}{href ? <Link href={href} className="text-slate2 hover:text-brand-ink">{label}</Link> : <span aria-current="page">{label}</span>}</li>)}</ol>
    </nav>
  );
}
export function PageContainer({ children, wide, className }: { children: ReactNode; wide?: boolean; className?: string }) {
  return <div className={cn('mx-auto w-full space-y-5 px-4 py-6 md:px-6 lg:px-8', wide ? 'max-w-wide' : 'max-w-page', className)}>{children}</div>;
}
export function PageHeader({ title, lead, actions, crumbs }: { title: ReactNode; lead?: ReactNode; actions?: ReactNode; crumbs?: [string, string?][] }) {
  return (
    <header>
      {crumbs && <Breadcrumbs items={crumbs} />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[28px] font-extrabold md:text-[34px]">{title}</h1>
          {lead && <p className="mt-1.5 max-w-[70ch] text-[15px] text-slate2">{lead}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
export function Section({ title, link, children, className }: { title: string; link?: [string, string]; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      <div className="mb-3 flex items-baseline justify-between gap-3"><h2 className="text-lg font-bold">{title}</h2>{link && <Link className="link text-[13px]" href={link[1]}>{link[0]}</Link>}</div>
      {children}
    </section>
  );
}
/** Stateless segmented control. `onChange` makes it usable only from client components. */
export function Segmented<T extends string>({ value, options, onChange, label, size = 'md' }: { value: T; options: readonly (readonly [T, string])[]; onChange: (v: T) => void; label: string; size?: 'sm' | 'md' }) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-0.5 rounded-ctl bg-hover p-[3px]">
      {options.map(([v, text]) => (
        <button key={v} type="button" aria-pressed={v === value} onClick={() => onChange(v)} className={cn('rounded-lg font-medium transition-[background-color,color,box-shadow] duration-150', size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-[13px]', v === value ? 'bg-white text-navy shadow-card' : 'text-slate2 hover:text-navy')}>{text}</button>
      ))}
    </div>
  );
}
export function Bar({ label, value, max = 100, href, suffix }: { label: string; value: number; max?: number; href?: string; suffix?: ReactNode }) {
  const body = (<><span className="truncate">{label}</span><span className="h-2.5 rounded bg-hover"><span className="block h-full rounded bg-brand transition-[width] duration-300 ease-out" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} /></span><span className="num text-right">{suffix}</span></>);
  const cls = 'grid grid-cols-[minmax(90px,150px)_1fr_64px] items-center gap-3 py-1.5 text-[13px]';
  return href ? <Link href={href} className={cn(cls, 'hover:text-brand-ink')}>{body}</Link> : <div className={cls}>{body}</div>;
}
/** Diverging bar centred on zero. */
export function DivergingBar({ label, value, scale = 3, href }: { label: string; value: number; scale?: number; href?: string }) {
  const w = Math.min(50, (Math.abs(value) / scale) * 50);
  const body = (<><span className="truncate">{label}</span><span className="relative h-2.5 rounded bg-hover"><span className="absolute inset-y-[-3px] left-1/2 w-px bg-line2" /><span className={cn('absolute inset-y-0 rounded', value >= 0 ? 'bg-up' : 'bg-down')} style={value >= 0 ? { left: '50%', width: `${w}%` } : { right: '50%', width: `${w}%` }} /></span><span className="text-right"><Change value={value} /></span></>);
  const cls = 'grid grid-cols-[minmax(90px,170px)_1fr_84px] items-center gap-3 py-1.5 text-[13px]';
  return href ? <Link href={href} className={cn(cls, 'text-navy hover:text-brand-ink')}>{body}</Link> : <div className={cls}>{body}</div>;
}
