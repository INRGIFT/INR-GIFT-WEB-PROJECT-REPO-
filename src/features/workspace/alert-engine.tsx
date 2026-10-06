'use client';
import { useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/toast';
import { evaluateAlert, staysActive } from '@/lib/alerts';
import { assetHref } from '@/lib/routes';
import type { Asset, CalendarEvent, Envelope, NewsItem, ResearchDoc, Technicals } from '@/lib/types';
import { useWorkspace } from './workspace-context';

const INTERVAL = 60_000;
const get = async <T,>(url: string): Promise<T | null> => { try { const r = await fetch(url); if (!r.ok) return null; return ((await r.json()) as Envelope<T>).data; } catch { return null; } };

/**
 * Evaluates the signed-in user's active alerts against current data while the app is open: on load, then every
 * minute and when the tab becomes visible. Fired alerts write a notification (linked by ref_id) and level alerts
 * move to "triggered". A scheduled server job should run the same `evaluateAlert` for email delivery; see docs/ROADMAP.md.
 */
export function AlertEngine() {
  const ws = useWorkspace();
  const toast = useToast();
  const latest = useRef(ws);
  latest.current = ws;
  const running = useRef(false);
  const activeKey = ws.data.alerts.filter((a) => a.status === 'active').map((a) => a.id).join(',');
  useEffect(() => {
    if (!ws.ready || !activeKey) return;
    const run = async () => {
      if (running.current || document.visibilityState === 'hidden') return;
      running.current = true;
      try {
        const w = latest.current;
        const active = w.data.alerts.filter((a) => a.status === 'active');
        if (!active.length) return;
        const ids = [...new Set(active.map((a) => a.instrument_id))];
        const kinds = new Set(active.map((a) => a.kind));
        const [assets, events, news, research] = await Promise.all([
          get<Asset[]>(`/api/v1/assets?ids=${encodeURIComponent(ids.join(','))}&pageSize=500`),
          kinds.has('earnings') || kinds.has('dividend') ? get<CalendarEvent[]>('/api/v1/calendar') : null,
          kinds.has('news') ? get<NewsItem[]>('/api/v1/news?pageSize=200') : null,
          kinds.has('research') ? get<ResearchDoc[]>('/api/v1/research') : null,
        ]);
        if (!assets) return;
        const byId = new Map(assets.map((a) => [a.id, a]));
        const tech = new Map<string, Technicals | null>();
        for (const id of new Set(active.filter((a) => a.kind === 'high_52w' || a.kind === 'low_52w').map((a) => a.instrument_id))) tech.set(id, await get<Technicals>(`/api/v1/assets/${id}/technicals`));
        const now = new Date();
        for (const alert of active) {
          const asset = byId.get(alert.instrument_id);
          if (!asset) continue;
          const r = evaluateAlert(alert, { asset, technicals: tech.get(asset.id), events: events ?? [], news: news ?? [], research: research ?? [], now });
          if (!r.fired) continue;
          await w.update('alerts', alert.id, { last_triggered_at: now.toISOString(), status: staysActive(alert.kind) ? 'active' : 'triggered' });
          await w.add('notifications', { category: alert.kind === 'research' ? 'research' : 'market', title: r.title!, body: r.body ?? '', href: assetHref(asset), read: false, ref_id: alert.id });
          if (w.prefs.notifyInApp) toast(r.title!);
        }
      } finally { running.current = false; }
    };
    void run();
    const t = setInterval(run, INTERVAL);
    const vis = () => { if (document.visibilityState === 'visible') void run(); };
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', vis); };
  }, [ws.ready, activeKey, toast]);
  return null;
}
