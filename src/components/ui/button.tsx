import Link from 'next/link';
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/format';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'inverse';
type Size = 'sm' | 'md' | 'lg';
const base = 'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-ctl font-medium transition-[background-color,border-color,transform,box-shadow] duration-150 ease-out active:scale-[.98] disabled:pointer-events-none disabled:opacity-50';
const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-ink',
  secondary: 'border border-line2 bg-white text-navy hover:border-faint hover:bg-soft',
  ghost: 'text-slate2 hover:bg-hover hover:text-navy',
  danger: 'border border-down/30 bg-white text-down hover:bg-down/5',
  /** Secondary action on navy surfaces (homepage hero and bands). */
  inverse: 'border border-white/30 bg-white/[.04] text-white hover:border-white/70 hover:bg-white/10',
};
/** Heights from the control tokens: compact 32, standard 40, primary/action 44 (docs/DESIGN-SYSTEM.md). */
const sizes: Record<Size, string> = { sm: 'h-ctl-sm px-3 text-ui', md: 'h-ctl px-4 text-body', lg: 'h-ctl-lg px-5 text-body' };
/** Primary buttons default to the 44 px action height; pass `size` to use a compact or standard one in toolbars. */
export const buttonClass = (variant: Variant = 'secondary', size?: Size, extra?: string) => cn(base, variants[variant], sizes[size ?? (variant === 'primary' ? 'lg' : 'md')], extra);

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; size?: Size }
export function Button({ variant, size, className, type = 'button', ...rest }: Props) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}
export function ButtonLink({ variant, size, className, ...rest }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}
/** Icon-only button. `label` is required so screen readers always get a name. */
export function IconButton({ label, active, className, children, ...rest }: Omit<Props, 'variant' | 'size'> & { label: string; active?: boolean; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} className={cn('inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 active:scale-95', active ? 'text-brand' : 'text-faint hover:bg-hover hover:text-brand-ink', className)} {...rest}>
      {children}
    </button>
  );
}
