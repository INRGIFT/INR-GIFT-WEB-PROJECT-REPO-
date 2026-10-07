'use client';
import { ButtonLink } from '@/components/ui/button';
import { cn } from '@/lib/format';
import { useSession } from '@/features/auth/session-context';

/** Homepage calls to action: sign up and sign in when signed out; the workspace when signed in. */
export function HomeCtas({ compact }: { compact?: boolean }) {
  const { user, loading } = useSession();
  const secondary = 'border-white/25 bg-white/5 text-white hover:border-white/50 hover:bg-white/10';
  return (
    <div className={cn('flex flex-wrap items-center gap-2', !compact && 'mt-5')}>
      {loading ? <span className="skeleton h-11 w-64" aria-hidden /> : user ? (
        <>
          <ButtonLink href="/app" variant="primary" size="lg">Open your workspace</ButtonLink>
          <ButtonLink href="/markets" size="lg" className={secondary}>Explore markets</ButtonLink>
        </>
      ) : (
        <>
          <ButtonLink href="/signup" variant="primary" size="lg">Create your account</ButtonLink>
          <ButtonLink href="/login" size="lg" className={secondary}>Sign in</ButtonLink>
        </>
      )}
    </div>
  );
}
