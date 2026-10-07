'use client';
import type { Chart, KLineData } from 'klinecharts';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Change, ErrorState, RetryButton, UnavailableState } from '@/components/ui/primitives';
import { alignRebased, periodFor, rebaseBars, staticDataLoader, symbolFor, toKLineData } from '@/lib/charts/klinechart/adapter';
import { formatBarTime, formatterFor, stylesFor } from '@/lib/charts/klinechart/formatting';
import { INDICATORS, indicatorById, type IndicatorDef } from '@/lib/charts/klinechart/indicators';
import { createChart, destroyChart } from '@/lib/charts/klinechart/lifecycle';
import { SERIES_STYLES } from '@/lib/charts/palette';
import { RANGES, RESOLUTION_LABEL, type ChartResolution, type ChartSeries } from '@/lib/charts/types';
import { cn, num } from '@/lib/format';
import { track } from '@/lib/telemetry/analytics';
import type { ChartRange } from '@/lib/types';
import { ChartDataInfo } from './chart-data-info';
import { ChartLegend, type LegendBar } from './chart-legend';
import { ChartNotices, ChartStatusChips } from './chart-status';
import { ChartToolbar, type ChartKind, type ChartScale } from './chart-toolbar';
import { useChartSeries, useChartSeriesList } from './use-chart-series';

export interface ChartInstrument { idOrSlug: string; symbol: string; name?: string }
export interface FinancialChartProps {
  instrument: ChartInstrument;
  /** A series the server already loaded (public pages pass this and set `fetchable` false). */
  initialSeries?: ChartSeries | null;
  /** Load other ranges and comparisons from /api/v1 (signed-in pages). */
  fetchable?: boolean;
  defaultRange?: ChartRange;
  ranges?: ChartRange[];
  /** full: every control · compact: ranges, type, zoom · hero: chart, header and legend only. */
  variant?: 'full' | 'compact' | 'hero';
  height?: number;
  /** Offered as a "vs" toggle: switches the chart to change-from-start lines. */
  benchmark?: { idOrSlug: string; label: string } | null;
  /** Always shown as change-from-start lines next to the main instrument (Compare page). */
  compareWith?: { idOrSlug: string; label: string }[];
  defaultIndicators?: IndicatorDef['id'][];
  /** "status" drops the name and price line when the page header already shows them. */
  header?: 'full' | 'status';
  className?: string;
}

/**
 * INRGIFT's one financial chart. KLineChart draws; this component owns data, state and accessibility:
 * INRGIFT API (or a server-loaded series) → chart adapter → KLineChart. Bars carry their source, status, native
 * currency, venue time zone and as-of time, and those are always shown. No realtime: the providers do not stream,
 * so nothing ticks. Loading, empty, unavailable, stale, closed-market, unsupported-interval and error states are all
 * explicit, and none of them spins for ever.
 */
export function FinancialChart({ instrument, initialSeries = null, fetchable = true, defaultRange = '1Y', ranges = RANGES, variant = 'full', height, benchmark = null, compareWith, defaultIndicators, header = 'full', className }: FinancialChartProps) {
  const summaryId = useId();
  const [range, setRange] = useState<ChartRange>(initialSeries?.range ?? defaultRange);
  const [resolution, setResolution] = useState<ChartResolution | null>(null);
  const [kind, setKind] = useState<ChartKind>(variant === 'hero' ? 'area' : 'candle_solid');
  const [scale, setScale] = useState<ChartScale>('normal');
  const [indicators, setIndicators] = useState<IndicatorDef['id'][]>(defaultIndicators ?? (variant === 'full' ? ['VOL'] : []));
  const [benchOn, setBenchOn] = useState(false);
  const [full, setFull] = useState(false);
  const [tool, setTool] = useState<string | null>(null);
  const [hover, setHover] = useState<{ bar: LegendBar; prevClose: number | null } | null>(null);
  const [announce, setAnnounce] = useState('');
  const [libError, setLibError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const main = useChartSeries(instrument.idOrSlug, range, resolution, { initial: initialSeries, enabled: fetchable });
  const series = main.series;
  const comparisons = useMemo(() => (compareWith?.length ? compareWith : benchOn && benchmark ? [benchmark] : []), [compareWith, benchOn, benchmark]);
  const relative = comparisons.length > 0;
  const others = useChartSeriesList(comparisons, range, series?.resolution ?? null, relative && fetchable && Boolean(series));
  const hasBars = Boolean(series?.bars.length);
  const hasVolume = Boolean(series?.bars.some((b) => b.v != null));
  const ev = (action: 'range' | 'type' | 'overlay' | 'benchmark' | 'fullscreen', value: string) => track('chart_interaction', { instrumentId: series?.instrumentId ?? instrument.idOrSlug, action, value });

  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const barsRef = useRef<KLineData[]>([]);
  const shown = useRef(new Set<string>());
  const compareIds = useRef<string[]>([]);
  const kbdIndex = useRef<number | null>(null);
  const raf = useRef(0);
  const latest = useRef(series);
  latest.current = series;

  const onCross = useCallback((data?: unknown) => {
    const c = (data ?? {}) as { kLineData?: KLineData; dataIndex?: number };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      if (!c.kLineData) { setHover(null); return; }
      const list = chartRef.current?.getDataList() ?? [];
      const i = c.dataIndex ?? list.indexOf(c.kLineData);
      setHover({ bar: c.kLineData as LegendBar, prevClose: i > 0 ? list[i - 1]?.close ?? null : null });
    });
  }, []);

  // Create the chart once there are bars to draw; dispose it when the component goes away. KLineChart is loaded
  // here, in the browser only.
  useEffect(() => {
    const el = hostRef.current;
    const s = latest.current;
    if (!hasBars || !el || !s) return;
    let live = true;
    setLibError(null);
    createChart(el, { styles: stylesFor('candle_solid'), timezone: s.timezone, locale: 'en-US', formatter: formatterFor(s.resolution, s.timezone), thousandsSeparator: { sign: ',' } })
      .then(({ chart }) => {
        if (!live) { void destroyChart(el); return; }
        chartRef.current = chart;
        chart.setDataLoader(staticDataLoader(() => barsRef.current));
        chart.subscribeAction('onCrosshairChange', onCross);
        setReady(true);
      })
      .catch(() => { if (live) setLibError('The chart could not start in this browser.'); });
    const ro = new ResizeObserver(() => chartRef.current?.resize());
    ro.observe(el);
    return () => {
      live = false; ro.disconnect(); cancelAnimationFrame(raf.current);
      chartRef.current?.unsubscribeAction('onCrosshairChange');
      chartRef.current = null; shown.current.clear(); compareIds.current = [];
      setReady(false);
      void destroyChart(el);
    };
  }, [hasBars, onCross]);

  // Bars, symbol, period, time zone and formatting follow the loaded series (relative mode: change from start, %).
  useEffect(() => {
    const chart = chartRef.current;
    if (!ready || !chart || !series?.bars.length) return;
    barsRef.current = toKLineData(relative ? rebaseBars(series.bars) : series.bars);
    chart.setTimezone(series.timezone);
    chart.setFormatter(formatterFor(series.resolution, series.timezone));
    chart.setSymbol(symbolFor({ ...series, pricePrecision: relative ? 2 : series.pricePrecision }, `${series.range}|${series.resolution}|${relative ? 'rel' : 'abs'}`));
    chart.setPeriod(periodFor(series.resolution));
    chart.resetData();
    // Show the whole selected period: bar width from the pane width (within KLineChart's limits), latest bar at right.
    const width = chart.getSize('candle_pane', 'main')?.width ?? hostRef.current?.clientWidth ?? 800;
    chart.setBarSpace(Math.max(1.5, Math.min(24, (width - 24) / (series.bars.length + 1))));
    chart.scrollToRealTime();
    kbdIndex.current = null;
    setHover(null);
  }, [ready, series, relative]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!ready || !chart) return;
    const line = relative || kind === 'line';
    chart.setStyles(stylesFor(line || kind === 'area' ? 'area' : kind, { lineOnly: line }));
    chart.overrideYAxis({ paneId: 'candle_pane', name: relative ? 'inrgift_rebased' : scale });
  }, [ready, kind, scale, relative]);

  // Indicators: only the offered ones, only where they apply (volume indicators need volume; price overlays are off
  // in relative mode, where the main pane shows percentages).
  useEffect(() => {
    const chart = chartRef.current;
    if (!ready || !chart) return;
    const want = new Set(INDICATORS.filter((d) => indicators.includes(d.id) && (!d.needsVolume || hasVolume) && (!relative || d.pane === 'sub')).map((d) => d.id as string));
    for (const id of [...shown.current]) if (!want.has(id)) { chart.removeIndicator({ id: `ind_${id}` }); shown.current.delete(id); }
    for (const id of want) {
      if (shown.current.has(id)) continue;
      const d = indicatorById(id as IndicatorDef['id']);
      const paneId = d.pane === 'main' ? 'candle_pane' : `pane_${d.id}`;
      chart.createIndicator({ id: `ind_${d.id}`, name: d.name, calcParams: d.calcParams, paneId }, d.pane === 'main');
      if (d.pane === 'sub') chart.setPaneOptions({ id: paneId, height: 86, minHeight: 56 });
      shown.current.add(id);
    }
  }, [ready, indicators, relative, hasVolume]);

  // Comparison lines (relative mode), aligned to the main series' bars; a missing day leaves a gap.
  useEffect(() => {
    const chart = chartRef.current;
    if (!ready || !chart) return;
    compareIds.current.forEach((id) => chart.removeIndicator({ id }));
    compareIds.current = [];
    if (!relative || !series?.bars.length) return;
    comparisons.forEach((c, i) => {
      const other = others.series[c.idOrSlug];
      if (!other || other.instrumentId === series.instrumentId) return;
      const style = SERIES_STYLES[(i + 1) % SERIES_STYLES.length];
      const id = `cmp_${i}`;
      chart.createIndicator({ id, name: 'INRGIFT_COMPARE', paneId: 'candle_pane', extendData: { label: c.label, values: Object.fromEntries(alignRebased(series, other)) }, styles: { lines: [{ color: style.color, size: 1.75, style: style.dash.length ? 'dashed' : 'solid', dashedValue: style.dash, smooth: false }] } }, true);
      compareIds.current.push(id);
    });
  }, [ready, relative, series, others.series, comparisons]);

  useEffect(() => {
    if (!full) return;
    const esc = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') setFull(false); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', esc);
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [full]);

  const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const zoom = (dir: 'in' | 'out') => chartRef.current?.zoomAtCoordinate(dir === 'in' ? 1.25 : 0.8, undefined, reduced() ? 0 : 160);
  const toLatest = () => chartRef.current?.scrollToRealTime(reduced() ? 0 : 200);
  const draw = (name: string) => {
    const chart = chartRef.current;
    if (!chart) return;
    setTool(name);
    chart.createOverlay({ name, onDrawEnd: () => setTool(null) });
    hostRef.current?.focus();
  };
  const describe = (b: KLineData, s: ChartSeries) => `${formatBarTime(b.timestamp, s.resolution, s.timezone, 'tooltip')}: open ${num(b.open, s.pricePrecision)}, high ${num(b.high, s.pricePrecision)}, low ${num(b.low, s.pricePrecision)}, close ${num(b.close, s.pricePrecision)}${relative ? ' percent' : ''}${b.volume != null ? `, volume ${num(b.volume, 0)}` : ''}.`;
  // Keyboard: arrows move a crosshair bar by bar (read out), + and − zoom, Home and End jump, Escape clears.
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const chart = chartRef.current;
    const list = chart?.getDataList() ?? [];
    if (!chart || !list.length || !series) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      const cur = kbdIndex.current ?? list.length;
      const i = e.key === 'Home' ? 0 : e.key === 'End' ? list.length - 1 : Math.max(0, Math.min(list.length - 1, cur + (e.key === 'ArrowRight' ? 1 : -1)));
      kbdIndex.current = i;
      const vr = chart.getVisibleRange();
      if (i < vr.from || i >= vr.to) chart.scrollToDataIndex(i);
      const px = chart.convertToPixel({ dataIndex: i, value: list[i].close }, { paneId: 'candle_pane' }) as { x?: number; y?: number };
      if (px.x != null && px.y != null) chart.executeAction('onCrosshairChange', { x: px.x, y: px.y, paneId: 'candle_pane' });
      setHover({ bar: list[i] as LegendBar, prevClose: i > 0 ? list[i - 1].close : null });
      setAnnounce(describe(list[i], series));
    } else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoom('in'); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoom('out'); }
    else if (e.key === 'Escape' && !full) { kbdIndex.current = null; setHover(null); chart.executeAction('onCrosshairChange', null as never); }
  };

  const lastBar = series?.bars.length ? series.bars[series.bars.length - 1] : null;
  const legendBar: LegendBar | null = hover?.bar ?? (lastBar ? (() => { const b = toKLineData(relative && series ? rebaseBars(series.bars).slice(-1) : [lastBar])[0]; return b as LegendBar; })() : null);
  const legendPrev = hover ? hover.prevClose : series && series.bars.length > 1 ? (relative ? rebaseBars(series.bars).slice(-2)[0].c : series.bars[series.bars.length - 2].c) : null;
  const canvasH = height ?? (full ? 520 : variant === 'hero' ? 300 : variant === 'compact' ? 300 : 380) + (variant === 'full' && !full ? indicators.filter((i) => indicatorById(i).pane === 'sub').length * 40 : 0);
  const name = series?.name ?? instrument.name ?? instrument.symbol;
  const unsupported = main.error?.code === 'UNSUPPORTED_RESOLUTION';

  return (
    <section aria-label={`${name} chart`} className={cn('min-w-0 rounded-card border border-line bg-white shadow-card', full && 'fixed inset-0 z-[60] flex flex-col overflow-auto rounded-none', className)}>
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 pt-3">
        <div className={cn('min-w-0', header === 'status' && !relative && 'sr-only')}>
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-display text-[16px] font-bold text-navy">{name}</span>
            <span className="text-xs text-faint">{series ? `${series.symbol} · ${series.listing.exchange} · ${series.currency}` : instrument.symbol}</span>
          </p>
          {series && !relative && series.last.price != null && (
            <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
              <span className="num font-display text-[22px] font-extrabold text-navy">{num(series.last.price, series.pricePrecision)}</span>
              <span className="text-xs font-medium text-faint">{series.unit === 'points' ? 'pts' : series.currency}</span>
              {series.last.change != null && <span className={cn('num text-[13px] font-semibold', series.last.change > 0 ? 'text-up' : series.last.change < 0 ? 'text-down' : 'text-slate2')}>{series.last.change > 0 ? '+' : series.last.change < 0 ? '−' : ''}{num(Math.abs(series.last.change), series.pricePrecision)}</span>}
              <span className="text-[13px]"><Change value={series.last.changePct} /></span>
            </p>
          )}
          {relative && (
            <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs" aria-label="Lines">
              {[{ label: series?.symbol ?? instrument.symbol, i: 0, missing: false }, ...comparisons.map((c, j) => ({ label: c.label, i: j + 1, missing: others.failed.includes(c.idOrSlug) }))].map((l) => {
                const st = SERIES_STYLES[l.i % SERIES_STYLES.length];
                return <li key={`${l.label}-${l.i}`} className="inline-flex items-center gap-1.5"><svg width="22" height="6" aria-hidden><line x1="0" y1="3" x2="22" y2="3" stroke={st.color} strokeWidth="2" strokeDasharray={st.dash.join(' ')} /></svg><span className={cn('font-medium', l.missing ? 'text-faint line-through' : 'text-navy')}>{l.label}</span>{l.missing && <span className="text-faint">no data for this period</span>}</li>;
              })}
            </ul>
          )}
        </div>
        {series && <ChartStatusChips series={series} />}
      </header>
      <ChartToolbar
        variant={variant} ranges={ranges} range={range} onRange={fetchable ? (r) => { setRange(r); setResolution(null); ev('range', r); } : undefined}
        resolution={series?.resolution ?? '1D'} supported={series?.supported ?? []} onResolution={fetchable ? (r) => { setResolution(r); ev('range', `${range}:${r}`); } : undefined}
        kind={kind} onKind={(k) => { setKind(k); ev('type', k); }} relative={relative} scale={scale} onScale={(s) => { setScale(s); ev('type', `scale:${s}`); }}
        indicators={indicators} onIndicators={(ids) => { setIndicators(ids); ev('overlay', ids.join('+') || 'none'); }} hasVolume={hasVolume}
        activeTool={tool} onDraw={draw} onClearDrawings={() => { chartRef.current?.removeOverlay(); setTool(null); }}
        onZoom={zoom} onLatest={toLatest}
        benchmark={benchmark && !compareWith?.length && fetchable ? { label: benchmark.label, on: benchOn, toggle: () => { setBenchOn((b) => !b); ev('benchmark', benchmark.idOrSlug); } } : null}
        full={full} onFull={() => { setFull((f) => !f); ev('fullscreen', full ? 'off' : 'on'); }}
      />
      <div className="space-y-1.5 px-4 pt-2">
        {series && hasBars && <ChartLegend bar={legendBar} prevClose={legendPrev} series={series} relative={relative} />}
        {series && <ChartNotices series={series} />}
        {tool && <p role="status" className="text-xs font-medium text-brand-ink">Drawing: click points on the chart to place it. Press Escape to cancel.</p>}
      </div>
      <div className={cn('relative px-1 pb-2 pt-1 sm:px-2', full && 'flex-1')}>
        {unsupported ? (
          <div className="px-3 py-6">
            <ErrorState title={`${resolution ? RESOLUTION_LABEL[resolution] : 'This interval'} is not available here`} action={<>{(main.error?.supported ?? []).map((r) => <button key={r} type="button" onClick={() => setResolution(r)} className="inline-flex h-9 items-center rounded-ctl border border-line2 bg-white px-3 text-[13px] font-medium hover:border-faint">{RESOLUTION_LABEL[r]}</button>)}</>}>The source has no such bars for {range}. Choose an interval it has.</ErrorState>
          </div>
        ) : main.error && !series ? (
          <div className="px-3 py-6"><ErrorState title={main.error.code === 'UNAUTHENTICATED' ? 'Sign in to load this chart' : 'The chart could not load'} action={main.error.code === 'UNAUTHENTICATED' ? undefined : <RetryButton onRetry={main.reload} label="Try again" />}>{main.error.message} Other parts of the page are not affected.</ErrorState></div>
        ) : libError ? (
          <div className="px-3 py-6"><ErrorState title="The chart could not start" action={<RetryButton onRetry={() => window.location.reload()} label="Reload" />}>{libError}</ErrorState></div>
        ) : !series ? (
          <div role="status" aria-label="Loading chart" className="px-2 py-1"><div aria-hidden className="skeleton w-full rounded-lg" style={{ height: canvasH }} /></div>
        ) : !hasBars ? (
          <UnavailableState title="Price history unavailable from source">{`${series.source} has no ${series.range} price history for ${series.symbol}. Nothing is estimated or filled in.`}</UnavailableState>
        ) : (
          <>
            <div ref={hostRef} tabIndex={0} role="group" aria-roledescription="chart" aria-label={`${name}, ${RESOLUTION_LABEL[series.resolution].toLowerCase()} bars. Arrow keys move between bars, plus and minus zoom, Home and End jump.`} aria-describedby={summaryId} onKeyDown={onKey}
              className="w-full rounded-lg outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" style={{ height: full ? 'calc(100vh - 220px)' : canvasH, minHeight: 220 }} />
            {(main.loading || others.loading) && <span role="status" className="absolute right-4 top-3 rounded-md bg-white/90 px-2 py-0.5 text-xs font-medium text-slate2 shadow-card">Loading…</span>}
            {main.error && series && <p role="alert" className="px-3 pt-1 text-xs text-down">{main.error.message} Showing the previous view. <button type="button" className="link" onClick={main.reload}>Try again</button></p>}
          </>
        )}
        <p id={summaryId} className="sr-only">{series && lastBar ? `${name} ${series.range}: ${series.bars.length} ${RESOLUTION_LABEL[series.resolution].toLowerCase()} bars from ${formatBarTime(series.bars[0].t, series.resolution, series.timezone, 'tooltip')} to ${formatBarTime(lastBar.t, series.resolution, series.timezone, 'tooltip')}. Last close ${num(lastBar.c, series.pricePrecision)} ${series.unit === 'points' ? 'points' : series.currency}. Status: ${series.status}.` : ''}</p>
        <p aria-live="polite" className="sr-only">{announce}</p>
      </div>
      {series && hasBars && <ChartDataInfo series={series} relative={relative} />}
    </section>
  );
}
