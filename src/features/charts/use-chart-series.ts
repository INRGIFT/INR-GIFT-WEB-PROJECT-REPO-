'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isIntraday, type ChartError, type ChartResolution, type ChartSeries } from '@/lib/charts/types';
import type { ChartRange } from '@/lib/types';

/**
 * Chart bars for the browser, from INRGIFT's own API (GET /api/v1/assets/:id/chart): never from a market-data vendor,
 * and never with a provider key. Responses are kept in memory for the page's lifetime (1 minute for intraday bars,
 * 10 minutes otherwise), requests are cancelled when the view changes, and a slow answer times out instead of
 * spinning for ever. While a new view loads, the previous series stays on screen.
 */
export type SeriesError = { code: ChartError['code'] | 'UNAUTHENTICATED' | 'TIMEOUT' | 'NETWORK'; message: string; supported?: ChartResolution[] };
export interface SeriesState { series: ChartSeries | null; error: SeriesError | null; loading: boolean; reload: () => void }

const cache = new Map<string, { at: number; series: ChartSeries }>();
const ttl = (s: ChartSeries) => (isIntraday(s.resolution) ? 60_000 : 600_000);
const TIMEOUT_MS = 15_000;
const keyOf = (id: string, range: ChartRange, resolution: ChartResolution | null) => `${id}|${range}|${resolution ?? 'native'}`;
const matches = (s: ChartSeries, id: string, range: ChartRange, resolution: ChartResolution | null) => (s.slug === id || s.instrumentId === id) && s.range === range && (resolution === null || s.resolution === resolution);

export function useChartSeries(id: string | null, range: ChartRange, resolution: ChartResolution | null, opts: { initial?: ChartSeries | null; enabled?: boolean } = {}): SeriesState {
  const enabled = opts.enabled ?? true;
  const initial = opts.initial && id && matches(opts.initial, id, range, resolution) ? opts.initial : null;
  const [state, setState] = useState<Omit<SeriesState, 'reload'>>({ series: initial, error: null, loading: !initial && Boolean(id) && enabled });
  const [tick, setTick] = useState(0);
  const force = useRef(false);
  useEffect(() => {
    if (!id) { setState({ series: null, error: null, loading: false }); return; }
    if (initial && !force.current) { setState({ series: initial, error: null, loading: false }); return; }
    if (!enabled) { setState((s) => ({ ...s, loading: false, error: s.series ? null : { code: 'UNAUTHENTICATED', message: 'Sign in to change this chart.' } })); return; }
    const key = keyOf(id, range, resolution);
    const hit = cache.get(key);
    if (hit && !force.current && Date.now() - hit.at < ttl(hit.series)) { setState({ series: hit.series, error: null, loading: false }); return; }
    force.current = false;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort('timeout'), TIMEOUT_MS);
    setState((s) => ({ ...s, loading: true, error: null }));
    const qs = new URLSearchParams({ range, ...(resolution ? { resolution } : {}) });
    fetch(`/api/v1/assets/${encodeURIComponent(id)}/chart?${qs}`, { signal: ctl.signal, credentials: 'same-origin', cache: 'no-store' })
      .then(async (r) => {
        const j = await r.json().catch(() => null) as { data?: ChartSeries; error?: SeriesError } | null;
        if (r.status === 401 || r.status === 403) throw Object.assign(new Error('Sign in to load this chart.'), { code: 'UNAUTHENTICATED' as const });
        if (!r.ok || !j?.data) throw Object.assign(new Error(j?.error?.message ?? 'The chart could not load.'), { code: (j?.error?.code ?? 'PROVIDER_ERROR') as SeriesError['code'], supported: j?.error?.supported });
        return j.data;
      })
      .then((series) => { cache.set(key, { at: Date.now(), series }); setState({ series, error: null, loading: false }); })
      .catch((e: Error & { code?: SeriesError['code']; supported?: ChartResolution[] }) => {
        if (ctl.signal.aborted && ctl.signal.reason !== 'timeout') return;
        const error: SeriesError = ctl.signal.reason === 'timeout' ? { code: 'TIMEOUT', message: 'The chart took too long to load.' }
          : e.code ? { code: e.code, message: e.message, supported: e.supported } : { code: 'NETWORK', message: 'The chart could not be reached. Check your connection.' };
        setState((s) => ({ ...s, loading: false, error }));
      })
      .finally(() => clearTimeout(timer));
    return () => { clearTimeout(timer); ctl.abort('superseded'); };
  }, [id, range, resolution, enabled, tick, initial]);
  const reload = useCallback(() => { force.current = true; setTick((t) => t + 1); }, []);
  return useMemo(() => ({ ...state, reload }), [state, reload]);
}

/** Several series for comparison lines, each failing on its own (a missing line is reported, never invented). */
export function useChartSeriesList(items: { idOrSlug: string; label: string }[], range: ChartRange, resolution: ChartResolution | null, enabled: boolean) {
  const key = items.map((i) => i.idOrSlug).join(',');
  const [state, setState] = useState<{ series: Record<string, ChartSeries | null>; failed: string[]; loading: boolean }>({ series: {}, failed: [], loading: false });
  useEffect(() => {
    if (!key || !enabled) { setState({ series: {}, failed: [], loading: false }); return; }
    const ctl = new AbortController();
    setState((s) => ({ ...s, loading: true }));
    Promise.all(key.split(',').map(async (id) => {
      const k = keyOf(id, range, resolution);
      const hit = cache.get(k);
      if (hit && Date.now() - hit.at < ttl(hit.series)) return [id, hit.series] as const;
      try {
        const qs = new URLSearchParams({ range, ...(resolution ? { resolution } : {}) });
        const r = await fetch(`/api/v1/assets/${encodeURIComponent(id)}/chart?${qs}`, { signal: ctl.signal, credentials: 'same-origin', cache: 'no-store' });
        const j = await r.json().catch(() => null) as { data?: ChartSeries } | null;
        if (!r.ok || !j?.data || !j.data.bars.length) return [id, null] as const;
        cache.set(k, { at: Date.now(), series: j.data });
        return [id, j.data] as const;
      } catch { return [id, null] as const; }
    })).then((rows) => {
      if (ctl.signal.aborted) return;
      setState({ series: Object.fromEntries(rows), failed: rows.filter(([, s]) => !s).map(([id]) => id), loading: false });
    });
    return () => ctl.abort();
  }, [key, range, resolution, enabled]);
  return state;
}
