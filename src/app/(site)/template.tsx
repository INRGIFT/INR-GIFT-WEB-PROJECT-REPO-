import type { ReactNode } from 'react';

/** Re-mounts on navigation, giving every route a short fade-in (removed under prefers-reduced-motion). */
export default function Template({ children }: { children: ReactNode }) { return <div className="animate-fade-in">{children}</div>; }
