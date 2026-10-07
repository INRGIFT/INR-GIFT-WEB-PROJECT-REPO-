'use client';
import { ArrowRight } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { useSession } from '@/features/auth/session-context';
import { cn } from '@/lib/format';

type Target = readonly [label: string, href: string];
/**
 * A homepage call to action that knows whether the visitor is signed in. Signed out (and while the session is still
 * being read, so the first paint never shifts) it shows `out`, usually sign-in or sign-up with a return path; signed in
 * it shows `inside`, the product page itself. Protected pages stay protected either way: middleware decides access.
 */
export function SessionCta({ out, inside, variant = 'primary', className, arrow }: { out: Target; inside: Target; variant?: 'primary' | 'secondary' | 'inverse'; className?: string; arrow?: boolean }) {
  const { user, loading } = useSession();
  const [label, href] = user && !loading ? inside : out;
  return (
    <ButtonLink href={href} variant={variant} size="lg" className={cn('group', className)}>
      {label}{arrow && <ArrowRight size={16} aria-hidden className="transition-transform duration-micro group-hover:translate-x-0.5" />}
    </ButtonLink>
  );
}
