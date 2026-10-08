import { expect, test, type Page } from '@playwright/test';
import { signInDemo } from './fixtures';

/**
 * No horizontal page scroll at the phone and desktop widths the product is checked at (docs/QA.md). Wide content
 * (tables, chart range pills) scrolls inside its own container; the page itself never does. Runs once (desktop
 * project) and sets each viewport itself. Each failure names the elements that stick out, so the fix goes to the
 * component, never to a global overflow-x:hidden.
 */
const VIEWPORTS: [number, number][] = [[320, 568], [360, 800], [375, 812], [390, 844], [412, 915], [430, 932], [768, 1024], [1024, 768], [1280, 800], [1440, 900], [1920, 1080]];
const PUBLIC = ['/', '/about', '/support', '/account-closure', '/grievance-redressal', '/legal/risk-disclaimer', '/login', '/signup', '/this-page-does-not-exist'];
const SIGNED_IN = ['/app', '/discover/screener', '/discover/compare?s=RELIANCE,AAPL,SAP', '/discover/heatmap', '/markets', '/news', '/stocks/RELIANCE', '/account/profile', '/account/security'];

async function overflow(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth <= vw) return null;
    const scrolls = (el: Element | null) => { for (let n = el; n && n !== document.body; n = n.parentElement) if (/(auto|scroll)/.test(getComputedStyle(n).overflowX)) return true; return false; };
    const out = [...document.querySelectorAll('body *')].filter((el) => el.getBoundingClientRect().right > vw + 0.5 && !scrolls(el.parentElement)).slice(0, 5).map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`);
    return { scrollWidth: document.documentElement.scrollWidth, clientWidth: vw, offenders: out };
  });
}

test.describe('no horizontal page overflow', () => {
  test.skip(({ isMobile }) => isMobile, 'runs once, in the desktop project: viewports are set per test');
  test.setTimeout(240_000);
  test('public pages, signed out', async ({ page }) => {
    const failures: string[] = [];
    for (const [w, h] of VIEWPORTS) {
      await page.setViewportSize({ width: w, height: h });
      for (const path of PUBLIC) {
        await page.goto(path, { waitUntil: 'networkidle' });
        const o = await overflow(page);
        if (o) failures.push(`${w}x${h} ${path}: ${o.scrollWidth}>${o.clientWidth} ${o.offenders.join(', ')}`);
      }
    }
    expect(failures).toEqual([]);
  });
  test('workspace pages, signed in', async ({ page }) => {
    await signInDemo(page);
    const failures: string[] = [];
    for (const [w, h] of VIEWPORTS) {
      await page.setViewportSize({ width: w, height: h });
      for (const path of SIGNED_IN) {
        await page.goto(path, { waitUntil: 'networkidle' });
        const o = await overflow(page);
        if (o) failures.push(`${w}x${h} ${path}: ${o.scrollWidth}>${o.clientWidth} ${o.offenders.join(', ')}`);
      }
    }
    expect(failures).toEqual([]);
  });
});
