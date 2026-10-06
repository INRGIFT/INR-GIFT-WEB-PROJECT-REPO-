/** Static explainer shown under the full heatmap. Describes the encoding only; it never interprets a move as a signal. */
export function HowToReadHeatmap() {
  const items: [string, string][] = [
    ['Tile size', 'Area is proportional to the chosen measure: market capitalisation in US dollars, traded value (volume × price) or fund AUM. Sizing by AUM shows funds only.'],
    ['Colour', 'With Performance, green tiles rose and red tiles fell over the chosen period; deeper colour means a larger move, up to the scale shown in the legend. With Volatility, deeper blue means larger annualised 30-day price swings. Grey means no value is available from the source.'],
    ['Labels', 'Every tile large enough to label prints its ticker and signed value, so colour is never the only cue. Hover or focus a tile for its full name.'],
    ['Drill-down', 'Group headers step one level down: Global → Region → Country → Sector → Industry → Asset. The breadcrumb steps back up. Select a tile for a quick view; double-click or press Enter to open its research page.'],
    ['Freshness', 'Markets close at different times, so tiles mix live, delayed and end-of-day values. Each asset shows its own status and timestamp in the quick view.'],
    ['What it is not', 'A heatmap shows what already happened. It is not a forecast, a ranking of quality or a recommendation.'],
  ];
  return (
    <section aria-labelledby="how-to-read" className="rounded-card border border-line bg-white p-5 shadow-card">
      <h2 id="how-to-read" className="text-h4 font-bold">How to read this heatmap</h2>
      <dl className="mt-3 grid gap-x-8 gap-y-3 md:grid-cols-2">
        {items.map(([t, d]) => <div key={t}><dt className="font-semibold">{t}</dt><dd className="mt-0.5 text-slate2">{d}</dd></div>)}
      </dl>
    </section>
  );
}
