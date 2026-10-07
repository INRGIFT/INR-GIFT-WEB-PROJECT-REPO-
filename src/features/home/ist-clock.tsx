'use client';
import { useEffect, useState } from 'react';

const fmt = (d: Date) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);
/** The time in India, to the minute. Starts from the server's value (no hydration mismatch), then follows the clock. */
export function IstClock({ initial }: { initial: string }) {
  const [now, setNow] = useState(initial);
  useEffect(() => {
    const tick = () => setNow(fmt(new Date()));
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);
  return <time suppressHydrationWarning>{now}</time>;
}
