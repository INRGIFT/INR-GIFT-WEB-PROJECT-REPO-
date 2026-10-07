# Third-party notices

INRGIFT's own code is proprietary to INRGIFT and is not open source. INRGIFT includes third-party open-source
components, each under its own licence. INRGIFT's terms do not change those licences, and nothing in this file
licenses INRGIFT's own code. Keep this file current whenever a dependency is added, removed or upgraded
(`docs/CHARTS.md`, "Upgrading KLineChart", and the inventory below).

## KLineChart (charting library)

| | |
| --- | --- |
| Package | `klinecharts` on npm, pinned to exactly **10.0.3** (`package.json`; `package-lock.json` integrity `sha512-phvf5CyS7oGE46nuC+nxQxl9D+8+5w8q3reExh0oNeMV1Jws4X0CMHNkOI9xlNA/XWctNS5whZ3PqIJi8YM2Tw==`) |
| Source | Official repository https://github.com/klinecharts/KLineChart (the npm package's `repository` field) |
| Licence | Apache License, Version 2.0 |
| Copyright | Copyright (c) 2019 lihu |
| Modified by INRGIFT | No. INRGIFT uses the published package as is. If any KLineChart file is ever modified, mark the file as changed (Apache 2.0, section 4(b)) and record it here. |
| Where it runs | In the browser, loaded on demand by INRGIFT's chart component (`src/lib/charts/klinechart/`) |
| Market data | None. KLineChart is a drawing library; INRGIFT's market data comes from INRGIFT's own data providers and is labelled with its source and status on every chart. |

Licence and notice files distributed with KLineChart, copied unchanged (byte for byte; checked by `tests/charts.test.ts`):

- `public/licenses/klinecharts/LICENSE.txt` (KLineChart's `LICENSE`, Apache License 2.0), served at `/licenses/klinecharts/LICENSE.txt`
- `public/licenses/klinecharts/NOTICE.txt` (KLineChart's `NOTICE`), served at `/licenses/klinecharts/NOTICE.txt`
- `public/licenses/klinecharts/LICENSE-lightweight-charts.txt` (KLineChart's `licenses/LICENSE-lightweight-charts`, Apache License 2.0), served at `/licenses/klinecharts/LICENSE-lightweight-charts.txt`

KLineChart's NOTICE file, reproduced verbatim as Apache License 2.0 section 4(d) requires:

```
KLineChart
Copyright (c) 2019 lihu

TradingView Lightweight Charts
Copyright (с) 2019 TradingView, Inc. https://www.tradingview.com
```

KLineChart's own NOTICE file credits TradingView Lightweight Charts, whose licence (also Apache 2.0) KLineChart
distributes; INRGIFT reproduces that notice for that reason only. INRGIFT does not use TradingView's products,
services or APIs and has no agreement or relationship with TradingView, Inc. The authors of KLineChart do not
endorse or sponsor INRGIFT.

KLineChart's bundle also contains small helper functions from Microsoft's `tslib` under the 0BSD licence, which asks
for no notice; it is listed for completeness.

The same information is shown to users at `/legal/open-source` (public).

## Runtime dependency inventory

Direct dependencies in `package.json` at the time of writing (versions from `package-lock.json`). "Browser" means code
from the package is sent to visitors' browsers.

| Package | Version | Licence | Source | Browser |
| --- | --- | --- | --- | --- |
| klinecharts | 10.0.3 | Apache-2.0 | github.com/klinecharts/KLineChart | Yes (chart pages, on demand) |
| next | 15.5.27 | MIT | github.com/vercel/next.js | Yes |
| react | 19.3.0 | MIT | github.com/react/react | Yes |
| react-dom | 19.3.0 | MIT | github.com/react/react | Yes |
| @supabase/ssr | 0.12.7 | MIT | github.com/supabase/ssr | Yes |
| @supabase/supabase-js | 2.117.2 | MIT | github.com/supabase/supabase-js | Yes |
| lucide-react | 0.468.0 | ISC | github.com/lucide-icons/lucide | Yes |
| zod | 3.25.76 | MIT | github.com/colinhacks/zod | Yes |
| tailwindcss | 3.4.19 | MIT | github.com/tailwindlabs/tailwindcss | Generated CSS only |
| postcss | 8.5.29 | MIT | github.com/postcss/postcss | No (build) |
| autoprefixer | 10.6.1 | MIT | github.com/postcss/autoprefixer | No (build) |
| typescript | 5.9.3 | Apache-2.0 | github.com/microsoft/TypeScript | No (build) |
| @types/node, @types/react, @types/react-dom | 22.20.5, 19.3.0, 19.3.0 | MIT | github.com/DefinitelyTyped/DefinitelyTyped | No (build) |

Transitive dependencies are not listed here. Before a public launch, run a full licence scan of the production
dependency tree (for example `npx license-checker --production`) and have the result reviewed; the MIT and ISC
licences of the packages above also ask that their copyright and permission notices travel with copies.
