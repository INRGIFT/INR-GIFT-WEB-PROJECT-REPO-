#!/usr/bin/env node
/**
 * Records the product tutorials from the running app (real product footage, demo data), with captions and a poster.
 *
 *   node scripts/record-tutorials.mjs http://localhost:3000 [id …]
 *
 * For each tutorial it writes public/media/<id>.webm, <id>.jpg (poster), <id>.en.vtt and <id>.json (duration,
 * transcript, chapters), which src/services/content.ts reads. Run against a demo-mode production build
 * (NEXT_PUBLIC_AUTH_MODE=demo) so no real account is involved. Requires ffmpeg.
 */
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.argv[2] ?? 'http://localhost:3000';
const only = new Set(process.argv.slice(3));
const OUT = 'public/media';
const TMP = join(OUT, '.rec');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const smooth = async (page, y, ms = 1200) => { await page.evaluate(([to, d]) => { const s = window.scrollY, t0 = performance.now(); const step = (t) => { const k = Math.min(1, (t - t0) / d); window.scrollTo(0, s + (to - s) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }, [y, ms]); await wait(ms + 150); };
const to = async (page, path) => { await page.goto(BASE + path, { waitUntil: 'networkidle' }); await wait(500); };
const top = (page, selector) => page.evaluate((s) => { const el = document.querySelector(s); return el ? el.getBoundingClientRect().top + window.scrollY - 90 : 0; }, selector);

/** Each step: the caption shown while it plays, and the actions. Captions only describe what is on screen. */
const TUTORIALS = {
  'product-walkthrough': { title: 'INRGIFT in 60 seconds', start: '/', steps: [
    ['INRGIFT is a research view of global markets, built from India.', async (p) => { await wait(2600); }],
    ['Trading sessions are shown on India time, with each market’s status.', async (p) => { await smooth(p, 260); await wait(1600); }],
    ['Markets lists every covered exchange with its session and index.', async (p) => { await to(p, '/markets'); await wait(1800); }],
    ['The global heatmap sizes assets by value and colours them by change.', async (p) => { await to(p, '/discover/heatmap'); await wait(2200); }],
    ['The screener filters stocks, ETFs and REITs on more than thirty metrics.', async (p) => { await to(p, '/discover/screener'); await wait(2200); }],
    ['Compare puts up to four assets side by side on one rebased chart.', async (p) => { await to(p, '/discover/compare?s=AAPL,MSFT,NVDA'); await wait(2400); }],
    ['Research notes describe the data, with sources, limitations and method.', async (p) => { await to(p, '/research'); await wait(2400); }],
  ] },
  'universal-search': { title: 'Universal search', start: '/markets', steps: [
    ['Press / or Ctrl+K on any page to open universal search.', async (p) => { await wait(600); await p.keyboard.press('Control+k'); await wait(1400); }],
    ['Recent searches and suggestions appear before you type.', async (p) => { await wait(1600); }],
    ['Type a market, exchange, sector or company. Results are grouped by kind.', async (p) => { await p.keyboard.type('techno', { delay: 140 }); await wait(1800); }],
    ['Arrow keys move through results; Enter opens one.', async (p) => { for (let i = 0; i < 3; i++) { await p.keyboard.press('ArrowDown'); await wait(350); } await wait(600); }],
    ['A ticker works too: here is Reliance on NSE.', async (p) => { await p.keyboard.press('Control+a'); await p.keyboard.type('RELIANCE', { delay: 110 }); await wait(1400); await p.keyboard.press('Enter'); await p.waitForLoadState('networkidle'); await wait(1600); }],
    ['No match? Search suggests the screener, markets and collections instead.', async (p) => { await p.keyboard.press('Control+k'); await wait(500); await p.keyboard.type('zzzz', { delay: 120 }); await wait(2000); await p.keyboard.press('Escape'); await wait(500); }],
  ] },
  'research-an-asset': { title: 'Research any asset in a minute', start: '/', steps: [
    ['Start anywhere: press / to open universal search.', async (p) => { await wait(800); await p.keyboard.press('/'); await wait(1200); }],
    ['Type a ticker or a name. Results are grouped by asset class.', async (p) => { await p.keyboard.type('NVIDIA', { delay: 120 }); await wait(1400); }],
    ['Enter opens the research page.', async (p) => { await p.keyboard.press('Enter'); await p.waitForLoadState('networkidle'); await wait(1600); }],
    ['Every module shows its data status and an exact time in IST.', async (p) => { await wait(2200); }],
    ['Change the period, and read any point with the crosshair.', async (p) => { await p.getByRole('button', { name: '1Y', exact: true }).first().click().catch(() => {}); await wait(900); const box = await p.locator('#chart svg').first().boundingBox(); if (box) { for (let i = 1; i <= 8; i++) { await p.mouse.move(box.x + (box.width * i) / 9, box.y + box.height / 2); await wait(160); } } await wait(600); }],
    ['Scroll for valuation, fundamentals, peers and identity.', async (p) => { await smooth(p, 1100, 1600); await wait(1200); await smooth(p, 2200, 1600); await wait(1000); }],
  ] },
  'heatmap-drill-down': { title: 'Read the global heatmap', start: '/discover/heatmap', steps: [
    ['Tiles are sized by market value and coloured by the change you choose.', async (p) => { await wait(2400); }],
    ['Switch the period to one month to see the trend instead of today.', async (p) => { await p.getByRole('group', { name: 'Period' }).getByRole('button', { name: '1M' }).click().catch(() => {}); await wait(2000); }],
    ['Select a region header to drill down a level.', async (p) => { await p.getByTitle('Drill into Asia-Pacific').click().catch(() => {}); await wait(2000); }],
    ['Then a country, then a sector.', async (p) => { await p.locator('button[title^="Drill into"]').first().click().catch(() => {}); await wait(1500); await p.locator('button[title^="Drill into"]').first().click().catch(() => {}); await wait(1500); }],
    ['Select a tile for a quick view with price, returns and actions.', async (p) => { await p.locator('[aria-label^="Heatmap grouped"] button[aria-pressed]').first().click().catch(() => {}); await wait(2200); }],
    ['The breadcrumb takes you back to the global view.', async (p) => { await p.getByRole('navigation', { name: 'Drill-down' }).getByRole('button', { name: 'Global' }).click().catch(() => {}); await wait(1800); }],
  ] },
  'build-a-screen': { title: 'Build and save a screen', start: '/discover/screener', steps: [
    ['The screener starts with an example: large companies growing fast or paying a dividend.', async (p) => { await wait(2600); }],
    ['Choose the universe: stocks, ETFs, REITs or all.', async (p) => { await p.getByRole('group', { name: 'Universe' }).getByRole('button', { name: 'Stocks' }).click().catch(() => {}); await wait(1800); }],
    ['Add a filter. Each one has a field, a condition and a value.', async (p) => { await p.getByRole('button', { name: /^Filter$/ }).first().click().catch(() => {}); await wait(1500); }],
    ['Results update as you type, with every metric explained.', async (p) => { await smooth(p, 520); await wait(2000); }],
    ['Groups combine filters with match all or match any.', async (p) => { await smooth(p, 0, 800); await p.getByRole('group', { name: 'Match' }).first().getByRole('button', { name: 'Match any' }).click().catch(() => {}); await wait(1800); }],
    ['The address bar is always a shareable link. Name the screen and save it to your workspace.', async (p) => { await wait(2600); }],
  ] },
  'etf-review': { title: 'Review an ETF in eight steps', start: '/etfs/SPY/review', steps: [
    ['The eight-step review reads one ETF the same way every time.', async (p) => { await wait(2400); }],
    ['Objective and cost: what the fund tracks and what it charges each year.', async (p) => { await smooth(p, await top(p, 'section[id]')); await wait(1800); }],
    ['Size and liquidity: how large the fund is and how much it trades.', async (p) => { await smooth(p, (await top(p, 'section[id]:nth-of-type(2)')) || 900); await wait(1800); }],
    ['Holdings and allocation: concentration by company, sector and country.', async (p) => { await smooth(p, 1700, 1400); await wait(1800); }],
    ['Performance and risk: returns, volatility and the deepest fall.', async (p) => { await smooth(p, 2600, 1400); await wait(1800); }],
    ['Each step shows its data status. It describes the fund; it does not recommend it.', async (p) => { await smooth(p, 3400, 1400); await wait(1800); }],
  ] },
  'market-hours': { title: 'Market hours on India time', start: '/markets', steps: [
    ['Every exchange’s regular hours, converted to India Standard Time.', async (p) => { await wait(2400); }],
    ['Blue bars are open now; the saffron line marks the current time in IST.', async (p) => { await smooth(p, 220); await wait(2200); }],
    ['Status comes from each exchange’s calendar: holidays and early closes included.', async (p) => { await wait(2000); }],
    ['Open a market for its hours, today’s status, index and covered listings.', async (p) => { await to(p, '/markets/India'); await wait(2400); }],
    ['Prices carry the same status and timestamp everywhere they appear.', async (p) => { await smooth(p, 700, 1400); await wait(1800); }],
  ] },
  methodology: { title: 'How to read data status and methodology', start: '/resources/data', steps: [
    ['Every number on INRGIFT carries a status and an exact timestamp.', async (p) => { await wait(2400); }],
    ['Live, delayed, end of day, closed, unavailable, stale and error each have their own badge and glyph.', async (p) => { await smooth(p, 300); await wait(2600); }],
    ['The page names the current data source and how the data flows.', async (p) => { await smooth(p, await top(p, '#data-source')); await wait(2200); }],
    ['A dash means the source has no value; n/a means the metric does not apply. Nothing is filled with zeros.', async (p) => { await smooth(p, 1400, 1400); await wait(2600); }],
    ['Research describes data. It carries no ratings, no price targets and no advice.', async (p) => { await smooth(p, 2000, 1400); await wait(2200); }],
  ] },
};

const vttTime = (s) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = (s % 60).toFixed(3).padStart(6, '0'); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${x}`; };
mkdirSync(TMP, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });
for (const [id, t] of Object.entries(TUTORIALS)) {
  if (only.size && !only.has(id)) continue;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: TMP, size: { width: 1280, height: 720 } }, reducedMotion: 'no-preference' });
  const t0 = Date.now();
  const page = await ctx.newPage();
  await page.goto(BASE + t.start, { waitUntil: 'networkidle' });
  await wait(600);
  const lead = (Date.now() - t0) / 1000; // trimmed: loading the first page is not part of the tutorial
  const cues = [];
  for (const [text, run] of t.steps) {
    const s = (Date.now() - t0) / 1000 - lead;
    await run(page);
    // Hold each caption long enough to read: about 0.33 s a word plus a beat, whatever the action took.
    const need = 1.2 + text.split(/\s+/).length * 0.33, took = (Date.now() - t0) / 1000 - lead - s;
    if (took < need) await wait((need - took) * 1000);
    cues.push([s, (Date.now() - t0) / 1000 - lead, text]);
  }
  await wait(400);
  await page.close(); await ctx.close();
  const raw = join(TMP, readdirSync(TMP).find((f) => f.endsWith('.webm')));
  const dur = cues[cues.length - 1][1] + 0.4;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', lead.toFixed(2), '-i', raw, '-t', dur.toFixed(2), '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '40', '-row-mt', '1', '-an', join(OUT, `${id}.webm`)]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', (cues[0][1] * 0.8).toFixed(2), '-i', join(OUT, `${id}.webm`), '-frames:v', '1', '-q:v', '4', join(OUT, `${id}.jpg`)]);
  rmSync(raw);
  writeFileSync(join(OUT, `${id}.en.vtt`), 'WEBVTT\n\n' + cues.map(([a, b, x], i) => `${i + 1}\n${vttTime(a)} --> ${vttTime(b)}\n${x}\n`).join('\n'));
  writeFileSync(join(OUT, `${id}.json`), JSON.stringify({ id, title: t.title, durationSeconds: Math.round(dur), transcript: cues.map((c) => c[2]), chapters: cues.map(([a, , x]) => [Number(a.toFixed(1)), x.split(/[:.,;]/)[0].slice(0, 48)]) }, null, 2) + '\n');
  console.log(`${id}: ${dur.toFixed(1)} s, ${cues.length} captions`);
}
await browser.close();
rmSync(TMP, { recursive: true, force: true });
