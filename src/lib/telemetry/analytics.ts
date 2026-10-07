/**
 * Product analytics event layer. Typed events, consent-gated, no personal data, no vendor bound.
 *
 * - `track()` records nothing until the person grants analytics consent (stored in this browser).
 * - Events carry only the properties declared here: identifiers of public entities, counts and enums. Never an email,
 *   phone number, user id or free text a person typed (search queries are reduced to their length).
 * - A sink (Plausible, PostHog, GA4, a first-party endpoint…) is registered with `setAnalyticsSink`; none is wired
 *   today, so events stay in an in-memory ring buffer for debugging and tests.
 */
export interface AnalyticsEvents {
  page_view: { path: string };
  search: { queryLength: number; results: number };
  asset_open: { instrumentId: string; cls: string };
  chart_interaction: { instrumentId: string; action: 'range' | 'type' | 'overlay' | 'benchmark' | 'fullscreen'; value: string };
  heatmap_drilldown: { level: number; group: string };
  screen_created: { rules: number; universe: string };
  compare_created: { count: number };
  watchlist_add: { instrumentId: string };
  alert_created: { kind: string };
  research_open: { kind: string; slug: string };
  research_save: { refType: string };
  video_start: { videoId: string };
  video_complete: { videoId: string };
  signup_started: Record<string, never>;
  signup_completed: Record<string, never>;
  verification_completed: { step: 'email' | 'phone' | 'mfa' };
}
export type EventName = keyof AnalyticsEvents;
export interface AnalyticsRecord<K extends EventName = EventName> { name: K; props: AnalyticsEvents[K]; at: string }
type Sink = (e: AnalyticsRecord) => void;

const CONSENT_KEY = 'inrgift.consent.analytics';
const buffer: AnalyticsRecord[] = [];
let sink: Sink | null = null;

export const setAnalyticsSink = (s: Sink | null) => { sink = s; };
export const analyticsBuffer = (): readonly AnalyticsRecord[] => buffer;
export function analyticsConsent(): 'granted' | 'denied' {
  try { return typeof window !== 'undefined' && localStorage.getItem(CONSENT_KEY) === 'granted' ? 'granted' : 'denied'; } catch { return 'denied'; }
}
export function setAnalyticsConsent(v: 'granted' | 'denied') { try { localStorage.setItem(CONSENT_KEY, v); } catch { /* storage blocked: stays denied */ } }

export function track<K extends EventName>(name: K, props: AnalyticsEvents[K]) {
  if (typeof window === 'undefined' || analyticsConsent() !== 'granted') return;
  const rec: AnalyticsRecord<K> = { name, props, at: new Date().toISOString() };
  buffer.push(rec as AnalyticsRecord);
  if (buffer.length > 200) buffer.shift();
  try { sink?.(rec as AnalyticsRecord); } catch { /* a broken sink never breaks the product */ }
}
