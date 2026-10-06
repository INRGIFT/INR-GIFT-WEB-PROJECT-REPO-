'use client';
import { useCallback, useEffect, useState } from 'react';
import type { Envelope, ErrorEnvelope } from './types';

export interface ApiState<T> { data: T | null; meta: Envelope<T>['meta'] | null; error: string | null; loading: boolean; reload: () => void }
/** Client-side reader for the INRGIFT API envelope. `null` url skips the request. */
export function useApi<T>(url: string | null): ApiState<T> {
  const [state, setState] = useState<Omit<ApiState<T>, 'reload'>>({ data: null, meta: null, error: null, loading: Boolean(url) });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!url) { setState({ data: null, meta: null, error: null, loading: false }); return; }
    const ctl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    fetch(url, { signal: ctl.signal })
      .then(async (r) => { const j = (await r.json()) as Envelope<T> | ErrorEnvelope; if (!r.ok || 'error' in j) throw new Error('error' in j ? j.error.message : 'Request failed.'); return j; })
      .then((j) => setState({ data: j.data, meta: j.meta, error: null, loading: false }))
      .catch((e: Error) => { if (e.name !== 'AbortError') setState({ data: null, meta: null, error: e.message || 'Request failed.', loading: false }); });
    return () => ctl.abort();
  }, [url, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
