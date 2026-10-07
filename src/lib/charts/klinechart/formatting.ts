import type { DeepPartial, Formatter, Styles } from 'klinecharts';
import { compact } from '@/lib/format';
import { INDICATOR_COLORS, PALETTE } from '../palette';
import { isIntraday, type ChartResolution } from '../types';

/**
 * Formatting and visual style for KLineChart, from INRGIFT's design tokens. Dates are always shown in the venue's own
 * time zone (the series carries it), so a Tokyo close reads as a Tokyo date.
 */
const fmt = new Map<string, Intl.DateTimeFormat>();
const dtf = (tz: string, opts: Intl.DateTimeFormatOptions) => {
  const key = `${tz}|${JSON.stringify(opts)}`;
  let f = fmt.get(key);
  if (!f) { f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, ...opts }); fmt.set(key, f); }
  return f;
};

/** Date text for the x-axis, crosshair and tooltip, by resolution, in `timezone`. */
export function formatBarTime(timestamp: number, resolution: ChartResolution, timezone: string, where: 'tooltip' | 'crosshair' | 'xAxis'): string {
  const d = new Date(timestamp);
  if (isIntraday(resolution)) {
    if (where === 'xAxis') return dtf(timezone, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);
    return dtf(timezone, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);
  }
  if (resolution === '1M') return dtf(timezone, { month: 'short', year: 'numeric' }).format(d);
  if (where === 'xAxis') return dtf(timezone, { day: '2-digit', month: 'short', ...(resolution === '1W' ? { year: '2-digit' } : {}) }).format(d);
  return dtf(timezone, { weekday: resolution === '1D' ? 'short' : undefined, day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

export function formatterFor(resolution: ChartResolution, timezone: string): Partial<Formatter> {
  return {
    formatDate: ({ timestamp, type }) => formatBarTime(timestamp, resolution, timezone, type),
    formatBigNumber: (v) => compact(Number(v)),
  };
}

export type CandleKind = 'candle_solid' | 'ohlc' | 'area';
const font = 'Inter, system-ui, sans-serif';
/** The INRGIFT chart style: quiet grid, token colours, up and down by colour and by candle shape (hollow or filled not used). */
export function stylesFor(kind: CandleKind, opts: { lineOnly?: boolean } = {}): DeepPartial<Styles> {
  const axisText = { color: PALETTE.faint, family: font, size: 11, weight: 'normal' };
  const crossText = { color: PALETTE.white, backgroundColor: PALETTE.navy, borderColor: PALETTE.navy, family: font, size: 11, borderRadius: 4, paddingLeft: 6, paddingRight: 6, paddingTop: 3, paddingBottom: 3 };
  return {
    grid: { show: true, horizontal: { show: true, color: PALETTE.line, style: 'dashed', dashedValue: [3, 3], size: 1 }, vertical: { show: false } },
    candle: {
      type: kind,
      bar: {
        compareRule: 'current_open',
        upColor: PALETTE.up, downColor: PALETTE.down, noChangeColor: PALETTE.slate,
        upBorderColor: PALETTE.up, downBorderColor: PALETTE.down, noChangeBorderColor: PALETTE.slate,
        upWickColor: PALETTE.up, downWickColor: PALETTE.down, noChangeWickColor: PALETTE.slate,
      },
      area: {
        lineSize: 2, lineColor: PALETTE.brand, smooth: false,
        backgroundColor: opts.lineOnly ? 'rgba(0,0,0,0)' : [{ offset: 0, color: 'rgba(36,91,254,0.16)' }, { offset: 1, color: 'rgba(36,91,254,0.01)' }],
        point: { show: false },
      },
      priceMark: {
        show: true,
        high: { show: true, color: PALETTE.slate, textFamily: font, textSize: 10 },
        low: { show: true, color: PALETTE.slate, textFamily: font, textSize: 10 },
        last: { show: true, upColor: PALETTE.up, downColor: PALETTE.down, noChangeColor: PALETTE.slate, line: { show: true, style: 'dashed', dashedValue: [4, 4], size: 1 }, text: { show: true, family: font, size: 11, color: PALETTE.white } },
      },
      // INRGIFT draws its own legend above the chart (chart-legend.tsx); the built-in candle tooltip stays off.
      tooltip: { showRule: 'none' },
    },
    indicator: {
      lines: INDICATOR_COLORS.map((color) => ({ color, size: 1.5, style: 'solid' })),
      bars: [{ upColor: 'rgba(10,115,80,0.45)', downColor: 'rgba(194,53,43,0.45)', noChangeColor: 'rgba(74,87,112,0.4)' }],
      tooltip: { showRule: 'always', showType: 'standard', title: { show: true, showName: true, showParams: true, color: PALETTE.slate, family: font, size: 11 }, legend: { color: PALETTE.slate, family: font, size: 11 } },
      lastValueMark: { show: false },
    },
    xAxis: { axisLine: { show: true, color: PALETTE.line }, tickLine: { show: false }, tickText: axisText },
    yAxis: { axisLine: { show: false }, tickLine: { show: false }, tickText: axisText },
    separator: { size: 1, color: PALETTE.line, fill: true, activeBackgroundColor: 'rgba(36,91,254,0.08)' },
    crosshair: {
      show: true,
      horizontal: { show: true, line: { show: true, style: 'dashed', dashedValue: [4, 3], size: 1, color: PALETTE.slate }, text: { show: true, ...crossText } },
      vertical: { show: true, line: { show: true, style: 'dashed', dashedValue: [4, 3], size: 1, color: PALETTE.slate }, text: { show: true, ...crossText } },
    },
    overlay: {
      point: { color: PALETTE.brand, borderColor: 'rgba(36,91,254,0.35)', borderSize: 1, radius: 5, activeColor: PALETTE.brand, activeBorderColor: 'rgba(36,91,254,0.35)', activeBorderSize: 3, activeRadius: 5 },
      line: { color: PALETTE.brand, size: 1.5, style: 'solid' },
      text: { color: PALETTE.white, backgroundColor: PALETTE.brand, family: font, size: 11 },
    },
  };
}
