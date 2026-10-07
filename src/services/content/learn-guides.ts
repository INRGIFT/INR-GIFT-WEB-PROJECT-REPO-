/**
 * INRGIFT learn library: product guides and methodology. Educational content only: no advice, no recommendations.
 * Read through the async getters in `src/services/content.ts` (the CMS seam), never imported by UI directly.
 */
import type { ContentLink, ContentMeta, LearnArticle } from './types';

const META: ContentMeta = {
  status: 'PUBLISHED',
  publishedAt: '2026-10-06',
  updatedAt: '2026-10-06',
  author: 'INRGIFT Research',
  reviewer: null,
};

const learn = (slug: string, label: string): ContentLink => ({ label, href: `/resources/learn/${slug}` });
const term = (slug: string, label: string): ContentLink => ({ label, href: `/resources/glossary/${slug}` });
const page = (href: string, label: string): ContentLink => ({ label, href });

/* ------------------------------------------------------------------ */
/* Global markets                                                      */
/* ------------------------------------------------------------------ */

const MARKET_HOURS: LearnArticle[] = [
  {
    ...META,
    type: 'article',
    slug: 'global-market-hours-in-ist',
    section: 'Global markets',
    title: 'Global market hours in IST',
    summary: 'Every exchange keeps its own local hours, breaks and holidays. Converted to Indian Standard Time, those hours shift by an hour whenever the US or Europe changes its clocks, while India never does.',
    keyPoints: [
      'IST is UTC+5:30 all year; India does not observe daylight saving time.',
      'NYSE opens at 19:00 IST in the US summer and 20:00 IST in the US winter.',
      'London and Xetra open at 12:30 IST in the European summer and 13:30 IST in winter.',
      'Several Asian exchanges pause for a midday break, so their session has two halves.',
      'INRGIFT derives each exchange’s status from its calendar records, never from a fixed clock.',
    ],
    sections: [
      {
        heading: 'Why one clock is not enough',
        paragraphs: [
          'A global market day does not start and end at one moment. Tokyo opens while Mumbai is still asleep, India and the Gulf overlap with late Asian trading, Europe opens in the Indian afternoon and New York runs through the Indian evening and into the early hours of the next day. Following markets from India means translating a dozen local clocks into one.',
          'Indian Standard Time is fixed at UTC+5:30 throughout the year. Many other countries move their clocks forward in their summer and back in their winter. Because India stays still, the IST time at which a foreign exchange opens changes twice a year even though the exchange’s local hours do not change at all.',
          'The US and Europe also change their clocks on different dates, a few weeks apart in spring and autumn. For those short windows, the gap between New York and London is one hour shorter than usual, and the IST conversion of each moves on its own date.',
        ],
      },
      {
        heading: 'The main sessions in IST',
        paragraphs: [
          'The list below shows regular sessions as most readers in India will see them. Times are the regular continuous session only; pre-open and closing auctions are covered separately in the calendar.',
          'Asian sessions are the most stable in IST terms because Japan, Hong Kong and mainland China do not observe daylight saving time. Their IST times are the same all year. European and US times are the ones that move.',
        ],
        list: [
          'NSE (India): 09:15–15:30 IST, with a pre-open session from 09:00.',
          'Tokyo: opens 05:30 IST, with a midday break from 11:30 to 12:30 Tokyo time.',
          'Hong Kong: opens 07:00 IST, with a midday break from 12:00 to 13:00 Hong Kong time.',
          'Shanghai: opens 07:00 IST, with a midday break from 11:30 to 13:00 Shanghai time.',
          'London: opens 12:30 IST in UK summer and 13:30 IST in UK winter.',
          'Xetra (Frankfurt): opens 12:30 IST in summer and 13:30 IST in winter.',
          'NYSE and Nasdaq: open 19:00 IST in US summer and 20:00 IST in US winter.',
        ],
      },
      {
        heading: 'Midday breaks, auctions and half days',
        paragraphs: [
          'Some exchanges stop trading in the middle of the day. Tokyo pauses from 11:30 to 12:30 local time, Hong Kong from 12:00 to 13:00 and Shanghai from 11:30 to 13:00. During a break the market is not open, so prices shown for that exchange will not change until the afternoon session starts.',
          'Many exchanges also run auctions, where interest is collected for a short period and matched at a single price. The London closing auction, for example, runs from 16:30 to 16:35 London time, after continuous trading ends. Closing prices on such markets often come from the auction rather than from the last continuous trade.',
          'Holidays, early closes and special closures complete the picture. US exchanges close early on some days around holidays, and any exchange can close for an unscheduled event. A market that is shut for a local holiday shows its last close, labelled as closed, rather than a stale value presented as current.',
        ],
      },
      {
        heading: 'Working through a daylight saving change',
        paragraphs: [
          'The simplest way to handle clock changes is to remember the local hours and the offset, not the IST time. NYSE always opens at 09:30 New York time. In the US summer New York is UTC−4, which is 9 hours 30 minutes behind IST; in winter it is UTC−5, which is 10 hours 30 minutes behind.',
          'The same reasoning applies to London, which is UTC+1 in summer and UTC+0 in winter, and to Frankfurt, which is UTC+2 in summer and UTC+1 in winter. Both open at 08:00 and 09:00 local time respectively, which lands on the same IST time.',
        ],
        example: 'NYSE opens at 09:30 New York time. In July, New York is UTC−4 and IST is UTC+5:30, a difference of 9 h 30 min, so the open is 19:00 IST. In January, New York is UTC−5, a difference of 10 h 30 min, so the open is 20:00 IST. The close at 16:00 New York time becomes 01:30 IST in summer and 02:30 IST in winter, on the next calendar day in India.',
      },
      {
        heading: 'How INRGIFT shows market status',
        paragraphs: [
          'Each exchange on INRGIFT has a calendar record with its time zone, regular session, any pre-open or post-close session, midday breaks, auctions, holidays and early closes. The open or closed status you see is derived from those records at the moment you look, so it stays correct across clock changes without anyone editing a list of IST times.',
          'Every data module also carries a data status badge and an exact timestamp in IST. When a market is closed, the badge says so and the value shown is the last close. Hovering over or focusing on the badge shows the source and the exchange’s own time zone, so you can always tell which local session a number belongs to.',
          'The markets pages group exchanges by region and show which are open now. The calendar page lists upcoming holidays and early closes, which is the quickest way to check whether a market will be shut on a given day.',
        ],
      },
    ],
    related: [
      learn('us-market-hours-in-india', 'US market hours in India'),
      learn('european-market-hours-in-india', 'European market hours in India'),
      learn('asian-market-hours-in-india', 'Asian market hours in India'),
      learn('market-calendar-methodology', 'Market calendar methodology'),
      page('/markets/all', 'All markets and their status'),
      page('/resources/calendar', 'Market calendar'),
    ],
    glossary: ['ist', 'trading-session', 'data-status', 'index'],
  },
];

/* ------------------------------------------------------------------ */
/* Using INRGIFT                                                       */
/* ------------------------------------------------------------------ */

const USING_A: LearnArticle[] = [
  {
    ...META,
    type: 'guide',
    slug: 'how-inrgift-works',
    section: 'Using INRGIFT',
    title: 'How INRGIFT works',
    summary: 'INRGIFT is a research platform for global markets, built from India. It brings prices, fundamentals, research and education together, shows how fresh every figure is, and does not act on anything for you.',
    keyPoints: [
      'INRGIFT is for research only: it is not a broker and cannot place anything in a market.',
      'Every data module shows a data status badge and an exact IST timestamp.',
      'Discovery tools, research notes and the learn library are open to everyone; watchlists, alerts and saved screens need a sign-in.',
      'Missing values are shown as a dash or n/a, never as zero.',
    ],
    sections: [
      {
        heading: 'What INRGIFT is for',
        paragraphs: [
          'INRGIFT helps readers in India understand markets beyond India: how exchanges in the US, Europe and Asia are organised, what a company or fund looks like in numbers, and how those numbers compare with others. It is a research and learning tool. It has no way to place anything in a market and gives no recommendations.',
          'The tagline, Invest Beyond Borders, describes the subject matter rather than an action. The aim is to make it easier to read foreign markets carefully, with the context an Indian reader needs: IST timings, approximate rupee values and plain explanations of unfamiliar terms.',
        ],
      },
      {
        heading: 'The main areas',
        paragraphs: [
          'The site is organised around a few areas that work together. You can start from any of them and move to the others through links on each page.',
        ],
        list: [
          'Markets: regions, countries and exchanges, with indices and open or closed status.',
          'Discover: the global heatmap, the screener, compare and curated collections.',
          'Asset pages: stocks, ETFs, REITs, indices, currencies and more, each with its own research layout.',
          'Research: structured notes on stocks, ETFs, markets, themes, sectors and countries.',
          'Resources: news, the market calendar, the learn library, the glossary and data documentation.',
          'Workspace: watchlists, alerts and saved screens, private to your sign-in.',
        ],
      },
      {
        heading: 'How data reaches the page',
        paragraphs: [
          'Every figure follows the same route: the page asks the INRGIFT API, the API asks INRGIFT’s data services, and the data services ask a provider adapter. The browser never calls a data vendor directly. This keeps licensing, validation and freshness checks in one place.',
          'This build runs on a demo data provider. It produces data with a realistic shape and scale, but the prices are not current, and the header shows a Demo data label so this is always visible. When a licensed source is connected, the same pages will read from it without changing how they look.',
          'Before data is shown it passes quality checks: prices must be internally consistent, volumes non-negative and timestamps valid. Rows that fail are held back rather than displayed.',
        ],
      },
      {
        heading: 'Reading freshness and gaps',
        paragraphs: [
          'Each module shows a data status badge such as LIVE, DELAYED, END_OF_DAY or CLOSED, with the exact time of the data in IST. Each status has its own glyph, so colour is not the only cue. Hovering over or focusing on the badge shows the source and the exchange’s own time zone.',
          'Where a value does not apply, such as a dividend yield for a company that pays no dividend, the page shows n/a. Where a value should exist but is not available, it shows a dash. Neither is ever filled in as zero, because a zero would look like a real measurement.',
        ],
      },
      {
        heading: 'Public pages and your workspace',
        paragraphs: [
          'Markets, asset pages, discovery tools, research and learning are open without signing in. Signing in adds a private workspace with watchlists, alerts, saved screens and saved comparisons, and lets you keep private notes on asset pages.',
          'Workspace data is private to your sign-in. The database applies row-level security, so each person can read only their own rows, and the app never sends a user id from the browser. Alerts in the workspace notify you when a condition is met; they never act on anything.',
          'If you are new, a practical route is to open the heatmap for a quick view of the day, use search to reach an asset page, and read the matching guide in this section whenever a page uses a term you have not met before.',
        ],
      },
    ],
    related: [
      learn('how-search-works', 'How search works'),
      learn('understanding-data-status', 'Understanding data status'),
      learn('understanding-data-sources', 'Understanding data sources'),
      learn('global-markets-from-india', 'Global markets from India'),
      page('/discover', 'Discover'),
      page('/faq', 'Frequently asked questions'),
    ],
    glossary: ['data-status', 'ist', 'index', 'etf'],
  },
  {
    ...META,
    type: 'guide',
    slug: 'how-search-works',
    section: 'Using INRGIFT',
    title: 'How search works',
    summary: 'Universal search opens from anywhere with / or Ctrl/Cmd+K. Results are grouped by asset class and by type of page, so you can reach a stock, an exchange, a research note or a glossary term from one box.',
    keyPoints: [
      'Press / or Ctrl+K (Cmd+K on a Mac) on any page to open search.',
      'Results are grouped: asset classes first, then markets, research, themes, exchanges, sectors, industries, news and learn.',
      'Arrow keys move through results, Enter opens one, Esc closes search.',
      'Recent searches are kept in this browser only.',
    ],
    sections: [
      {
        heading: 'Opening search',
        paragraphs: [
          'Search is available on every page. Press the forward slash key, or Ctrl+K on Windows and Linux or Cmd+K on a Mac, and the search panel opens with the cursor already in the box. You can also select the search field in the header with a mouse or by tapping on a phone.',
          'The keyboard shortcuts are ignored while you are typing in another field, such as a note or a screener value, so they do not interrupt text entry. Esc closes the panel and returns focus to where you were.',
        ],
      },
      {
        heading: 'How results are grouped',
        paragraphs: [
          'Results appear in labelled groups rather than one long list. Instruments come first, split by asset class: stocks, ETFs, indices, FX, commodities, bonds and REITs. Then come pages about places and topics: markets, research, themes, exchanges, sectors, industries, news and learn articles.',
          'Grouping matters because the same word can mean several things. Typing a company name may return its stock, a depositary receipt listed elsewhere, ETFs whose names contain the word, a research note on the company and a sector page. Seeing them side by side makes it clear which one you want.',
          'Search also helps with places and topics. Typing an exchange name leads to the exchange page with its hours and status; typing a sector or industry leads to the page that lists its members across markets; typing a term such as expense ratio leads to the learn article or glossary entry that explains it.',
          'Instruments are matched on names, tickers and other identifiers, but INRGIFT addresses each instrument internally by a fixed id. Two listings that share a ticker on different exchanges are therefore shown as separate results with their exchange and currency.',
        ],
      },
      {
        heading: 'Moving with the keyboard',
        paragraphs: [
          'Search is designed to be used without a mouse. The steps below take you from any page to an asset page in a few keystrokes.',
        ],
        list: [
          'Press / or Ctrl/Cmd+K to open search.',
          'Type a name, ticker, exchange, sector or topic.',
          'Use the up and down arrow keys to move between results across groups.',
          'Press Enter to open the highlighted result.',
          'Press Esc at any point to close search without leaving the page.',
        ],
      },
      {
        heading: 'Recent searches and all results',
        paragraphs: [
          'When the search box is empty, the panel shows your recent searches. These are kept in this browser only. They are not stored in your workspace, are not shared between devices and disappear if you clear the browser’s site data.',
          'The panel shows the top matches in each group. If you want to see more, choose All results, which opens a full search page with the same groups and more entries in each. Search result pages are not indexed by search engines, so what you search for does not become a public page.',
        ],
      },
      {
        heading: 'When search does not find something',
        paragraphs: [
          'If nothing matches, try a shorter or more general term, a different spelling of the company name, or the exchange name. Company names often differ between their home listing and their foreign listings, and tickers can differ by exchange.',
          'Search covers the instruments in the active data source. In this build that is a demo data provider, so the universe is representative rather than complete. For browsing rather than looking up a known name, the screener and the markets pages are usually faster routes.',
        ],
      },
    ],
    related: [
      learn('how-inrgift-works', 'How INRGIFT works'),
      learn('how-to-read-a-stock-research-page', 'How to read a stock research page'),
      learn('understanding-global-exchanges', 'Understanding global exchanges'),
      page('/markets', 'Markets'),
      page('/discover/screener', 'Global stock screener'),
    ],
    glossary: ['depositary-receipt', 'etf', 'reit', 'index'],
  },
  {
    ...META,
    type: 'guide',
    slug: 'how-to-read-a-stock-research-page',
    section: 'Using INRGIFT',
    title: 'How to read a stock research page',
    summary: 'A stock page on INRGIFT moves from price to business to context: header and chart first, then valuation, profitability, financials and dividends, then the listings, connections, peers and research around the company.',
    keyPoints: [
      'The header shows price, change, data status, an exact timestamp and an approximate INR value.',
      'Valuation is shown against the median of covered stocks, which is context, not a verdict.',
      'The listings panel shows every listing of the same issuer, including depositary receipts and share classes.',
      'Missing figures are shown as a dash or n/a, never as zero.',
    ],
    sections: [
      {
        heading: 'The header and chart',
        paragraphs: [
          'The header gives the last price in the listing currency, the change on the day with a sign and an arrow, the data status badge and the exact timestamp in IST. An approximate INR value sits alongside, converted at a reference rate for the currency and labelled as approximate.',
          'The chart covers periods from one day to the full history. You can switch between area, line and candle views and add a 20-day simple moving average, a 50-day exponential moving average and Bollinger bands. A lower pane shows volume or RSI, and you can overlay a benchmark to see the stock against its home index.',
          'The crosshair works with the keyboard as well as the mouse: focus the chart and use the arrow keys to move through dates, reading the value at each point.',
        ],
      },
      {
        heading: 'Overview, performance and valuation',
        paragraphs: [
          'The overview gathers the most-used metrics in one place: market cap, P/E, dividend yield, beta and similar figures. The performance module shows returns across standard periods, calculated from closing prices in the listing currency.',
          'Valuation multiples are shown next to the median of the stocks INRGIFT covers. A P/E above the median is not a sign that a stock is expensive in any absolute sense, and one below it is not a sign of value. Different businesses deserve different multiples; the median simply gives a reference point.',
        ],
        example: 'If a company’s P/E is 32 and the median of covered stocks is 21, the company is priced at about 1.5 times the median on earnings. That can reflect higher expected growth, steadier earnings or simply optimism. The comparison raises the question; the rest of the page helps answer it.',
      },
      {
        heading: 'Business quality and financials',
        paragraphs: [
          'The profitability, leverage and risk module brings together margins, return on capital, debt measures, volatility and beta. Reading these together shows whether the business earns well on what it uses, how much it relies on borrowing and how much its price has moved.',
          'The financials module lists revenue, net income, margin, EPS, operating cash flow, capital expenditure and free cash flow over several periods. Trends usually say more than a single year: rising revenue with falling free cash flow, for example, is worth reading about in the company’s own reports.',
          'Dividends and the technical summary follow. The dividends module shows yield, payment history and ex-dividend dates where they apply. The technical summary describes moving averages, RSI and related indicators in neutral terms; it does not produce signals.',
        ],
      },
      {
        heading: 'Listings and connections',
        paragraphs: [
          'The issuer, securities and listings panel shows every listing of the same company that INRGIFT knows about: cross-listings on other exchanges, ADRs or GDRs with their ratio to the underlying share, and separate share classes. An ISIN is shown only when the source supplies it.',
          'The connections panel places the stock in context: its market, exchange, sector and industry, its home index, ETFs that hold it, themes it belongs to and research that mentions it. Each item is a link, so you can move from a company to its sector or to a fund that holds it in one step.',
        ],
      },
      {
        heading: 'Peers, news, research and your notes',
        paragraphs: [
          'The peers module lists comparable companies with the same key metrics, and the news and research modules collect coverage of the company. Research notes follow a fixed structure with methodology, limitations and sources, and contain no ratings or price targets.',
          'If you are signed in, you can keep private notes on the page. They are visible only to you. The page actions let you add the stock to a watchlist, set an alert, open it in compare or save it, all of which keep you informed rather than acting in a market.',
          'Every module carries its own data status, because different parts of the page can come from different updates. A price may be DELAYED while the financials reflect the last reported period; each badge tells you which is which.',
        ],
      },
    ],
    related: [
      learn('reading-valuation', 'Reading valuation multiples'),
      learn('pe-ratio-explained', 'P/E ratio explained'),
      learn('free-cash-flow-explained', 'Free cash flow explained'),
      learn('how-to-compare-stocks', 'How to compare stocks'),
      page('/stocks/AAPL', 'Example stock page: Apple'),
    ],
    glossary: ['p-e-ratio', 'market-capitalisation', 'free-cash-flow', 'depositary-receipt', 'share-class', 'moving-average'],
  },
  {
    ...META,
    type: 'guide',
    slug: 'how-to-read-the-global-heatmap',
    section: 'Using INRGIFT',
    title: 'How to read the global heatmap',
    summary: 'The heatmap draws each asset as a tile: size shows how large it is, colour shows how it has moved or how volatile it is. You can regroup it, change the period and drill from the whole world down to a single asset.',
    keyPoints: [
      'Tile size can show market cap, volume or AUM; colour can show performance or volatility.',
      'Group by region, country, exchange, sector, industry or asset type.',
      'Click group headers to drill from Global down to a single asset; the breadcrumb steps back.',
      'Every labelled tile prints its signed value, and grey means no value is available.',
    ],
    sections: [
      {
        heading: 'What the tiles mean',
        paragraphs: [
          'Each tile on the heatmap is one asset. Its area is proportional to the size measure you choose, and its colour reflects the colour metric. Tiles are grouped into blocks, such as regions or sectors, so you can see at a glance which parts of the market are large and which have moved.',
          'Colour is never the only cue. Every tile large enough to carry a label prints its value with a sign, so a reader who cannot distinguish the colours still sees +1.8% or −2.4%. A grey tile means no value is available for the chosen metric and period; it is not the same as a zero change.',
        ],
      },
      {
        heading: 'The controls',
        paragraphs: [
          'Five controls change what the heatmap shows. Changing one does not reset the others, so you can build up a view step by step.',
        ],
        list: [
          'Universe: all assets, stocks only, ETFs only or REITs only.',
          'Group by: region, country, exchange, sector, industry or asset type.',
          'Tile size: market cap, volume or AUM. AUM applies to funds, so choosing it shows funds only.',
          'Colour metric: performance over the chosen period, or volatility.',
          'Period: 1D, 1W, 1M, YTD or 1Y. Volatility is always the annualised 30-day figure.',
        ],
      },
      {
        heading: 'Drilling down and stepping back',
        paragraphs: [
          'The heatmap starts at a global view. Clicking a group header narrows the view to that group, following the path Global, Region, Country, Sector, Industry and finally Asset. At each level the tiles are redrawn so the selected group fills the space.',
          'The breadcrumb above the map shows where you are. Selecting an earlier step in the breadcrumb takes you back to that level, so you can move from a single industry in Japan back to the whole of Asia without starting again.',
          'Drilling is useful for checking whether a broad move is shared or concentrated. A region that looks strongly positive may owe most of that to one large country, and within it to one sector.',
        ],
      },
      {
        heading: 'Quick view and opening an asset',
        paragraphs: [
          'Selecting a tile opens a quick view with the price, returns across periods, the data status and actions such as adding to a watchlist or opening compare. This lets you check several tiles without leaving the map.',
          'Double-clicking a tile, or pressing Enter when a tile has keyboard focus, opens the full asset page. The heatmap can be used entirely with the keyboard: move focus between tiles and group headers and use Enter to act.',
        ],
      },
      {
        heading: 'Reading it carefully',
        paragraphs: [
          'Size and colour answer different questions. A large green tile is a big asset that has risen; a small red tile is a small asset that has fallen. Because size usually follows market cap, the largest companies dominate the picture, and many small moves can be hard to see.',
          'Performance is measured in each listing’s own currency. A US stock and a Japanese stock with the same colour have moved by similar percentages in dollars and yen respectively, not in rupees. Volatility colours show how much prices have varied, not which direction they moved.',
        ],
        example: 'With Group by set to sector and Period set to 1D, a technology block where most tiles read around +1.5% while one very large tile reads +4.0% suggests a move led by that one company. Switching Tile size to volume can show whether activity was concentrated there too.',
      },
    ],
    related: [
      learn('market-cap-explained', 'Market cap explained'),
      learn('understanding-risk', 'Understanding risk'),
      learn('performance-calculation-methodology', 'Performance calculation methodology'),
      page('/discover/heatmap', 'Global heatmap'),
      term('market-breadth', 'Market breadth'),
    ],
    glossary: ['market-capitalisation', 'volatility', 'assets-under-management', 'market-breadth', 'sector-allocation'],
  },
];

const USING_B: LearnArticle[] = [
  {
    ...META,
    type: 'guide',
    slug: 'how-to-use-the-global-stock-screener',
    section: 'Using INRGIFT',
    title: 'How to use the global stock screener',
    summary: 'The screener filters stocks, ETFs and REITs across markets by rules you build from fields, operators and values. Results update as you type, the address bar always holds a shareable link and screens can be saved to your workspace.',
    keyPoints: [
      'Rules combine a field, an operator and a value; groups combine rules with Match all or Match any.',
      'Above field and below field compare two metrics of the same asset, such as P/E below forward P/E.',
      'An asset with a missing value never matches a numeric rule.',
      'The URL is always a shareable link to the current screen; saved screens live in your workspace.',
    ],
    sections: [
      {
        heading: 'Choosing a universe and fields',
        paragraphs: [
          'Start by choosing the universe: all assets, stocks, ETFs or REITs. The universe sets which instruments are considered before any rule is applied, and some fields apply only to some universes. Fund fields, for example, have values only for ETFs.',
          'Fields are grouped so they are easier to find. Asset metadata covers name, asset type, region, country, exchange, sector, industry and currency. Market covers price, volume and market cap, which is expressed in billions of US dollars so that companies in different currencies can be filtered on one scale. The remaining groups are performance, valuation, fundamental, growth, dividend, risk, technical and fund.',
        ],
      },
      {
        heading: 'Building rules',
        paragraphs: [
          'Each rule is a field, an operator and a value. Numeric fields accept at least, at most, above, below, equals and between. Text and category fields accept is, is not, is any of and contains, so you can limit a screen to several countries at once or to company names containing a word.',
          'Two operators compare one metric with another for the same asset: above field and below field. These are useful when the question is relative rather than absolute, such as whether a stock’s price is above its own 200-day moving average, or whether its trailing P/E is below its forward P/E.',
        ],
        list: [
          'Choose a universe.',
          'Add a rule and pick a field from a group.',
          'Choose an operator and enter a value, or a second field for above field and below field.',
          'Add more rules, and group them where you need Match any.',
          'Review the results, adjust columns and save the screen if you want to return to it.',
        ],
      },
      {
        heading: 'Combining rules with groups',
        paragraphs: [
          'Rules sit inside groups. A group set to Match all keeps only assets that pass every rule in it, which is a logical AND. A group set to Match any keeps assets that pass at least one rule, which is a logical OR. Groups can be nested inside other groups, so you can express questions like “in India or Japan, and with a dividend yield of at least 2%”.',
          'Missing values are handled strictly. If an asset has no value for a field, it never matches a numeric rule on that field, whichever operator you use. This avoids treating unavailable data as zero and quietly letting assets through, but it also means a screen can exclude assets simply because the source has no figure for them.',
        ],
        example: 'A screen with Universe set to stocks, a Match all group containing “Country is any of India, Japan”, “Market cap at least 10” and “P/E below field forward P/E” keeps stocks in either country with a market cap of at least US$10 billion whose trailing P/E is lower than their forward P/E. A stock with no forward P/E is excluded.',
      },
      {
        heading: 'Working with results',
        paragraphs: [
          'Results update live as you change rules. Columns are configurable, so you can show the fields that matter for the question you are asking and hide the rest. Sorting by a column arranges the results by that field.',
          'Each row has actions: open the chart, open research, add to compare, add to a watchlist or set an alert. Export CSV downloads the current results with the visible columns, which is useful for your own notes and calculations.',
        ],
      },
      {
        heading: 'Sharing and saving screens',
        paragraphs: [
          'The address bar always reflects the current screen, so copying the URL gives a link that reopens the same universe, rules and columns. Shared filter links are not indexed by search engines.',
          'If you are signed in, you can save a screen to your workspace. Saved screens can be opened, renamed, duplicated and deleted from the screens page. A saved screen stores the rules, not the results, so reopening it later applies the same rules to the data at that time.',
          'A screen is a way of narrowing a large universe to a list worth reading about. It is not a judgement on any of the assets in the list, and the next step is usually the asset page or a comparison.',
        ],
      },
    ],
    related: [
      learn('reading-valuation', 'Reading valuation multiples'),
      learn('how-to-compare-stocks', 'How to compare stocks'),
      learn('technical-indicators', 'Technical indicators'),
      page('/discover/screener', 'Global stock screener'),
      page('/app/screens', 'Saved screens'),
    ],
    glossary: ['p-e-ratio', 'market-capitalisation', 'dividend-yield', 'moving-average', 'sector-allocation'],
  },
  {
    ...META,
    type: 'guide',
    slug: 'how-to-compare-stocks',
    section: 'Using INRGIFT',
    title: 'How to compare stocks',
    summary: 'Compare places up to four stocks, ETFs, REITs or indices side by side, with a rebased performance chart and sections for identity, price, performance, risk, valuation, fundamentals, dividends, technicals and fund details.',
    keyPoints: [
      'Compare up to four stocks, ETFs, REITs or indices at once.',
      'The chart rebases every line to 0% at the start of the period, with an optional benchmark.',
      'Each row marks the highest and lowest value; higher is not automatically better.',
      'Comparisons can be saved to your workspace.',
    ],
    sections: [
      {
        heading: 'Setting up a comparison',
        paragraphs: [
          'Open compare from the discover menu, or use the compare action on an asset page, a screener row or a heatmap quick view. You can add up to four instruments, mixing stocks, ETFs, REITs and indices. Mixing types is allowed, but some rows will show n/a where a metric does not apply, such as an expense ratio for a stock.',
          'Choose a period and a benchmark. The benchmark can be the S&P 500 or the NIFTY 50, and it appears on the chart as a reference line so you can see whether the instruments moved with their broad market or apart from it.',
        ],
      },
      {
        heading: 'Reading the rebased chart',
        paragraphs: [
          'Prices of different instruments are on different scales and in different currencies, so plotting raw prices would make comparison difficult. The compare chart rebases every line to 0% at the start of the period and shows the percentage change from there.',
          'Each line is calculated in the instrument’s own listing currency. A US stock’s line shows its dollar return and an Indian stock’s line its rupee return. Currency moves are therefore not included, which matters when comparing across markets.',
        ],
        example: 'Over one year, stock A rises from US$150 to US$180 and stock B from ₹1,200 to ₹1,380. Rebased, A ends at +20% and B at +15%. The chart shows A above B, but a reader converting both to rupees would also need to account for the change in USD/INR over the year.',
      },
      {
        heading: 'The comparison table',
        paragraphs: [
          'Below the chart, the table is divided into sections: identity, price, performance, risk, valuation, fundamentals, dividends, technicals and fund details. Sections you do not need can be hidden, which keeps the table short when you are focused on one question.',
          'In each row, the highest and lowest values are marked. These marks are descriptive. A higher P/E is not better or worse in itself, and a higher volatility is not a fault; it depends on what you are trying to understand. The marks only make it quicker to see the range.',
          'Where a value is unavailable, the cell shows a dash; where it does not apply, n/a. Neither is counted when marking the highest and lowest values.',
        ],
      },
      {
        heading: 'Comparing fairly',
        paragraphs: [
          'Comparisons are most informative between similar things: companies in the same industry, funds tracking similar indices or indices of similar markets. Comparing a bank with a software company on margins mostly shows how different the businesses are.',
        ],
        list: [
          'Check that the period is long enough to include more than one market phase.',
          'Look at risk rows next to performance rows; a higher return with much higher volatility tells a different story.',
          'Check the currency of each instrument before reading returns across markets.',
          'Read the data status of each column; one instrument may be on a closed market.',
        ],
      },
      {
        heading: 'Saving and returning',
        paragraphs: [
          'If you are signed in, you can save a comparison to your workspace and reopen it later. A saved comparison keeps the instruments, period, benchmark and hidden sections; the values are refreshed from the data source each time you open it.',
          'From compare you can move on to each asset page for detail, or to research notes on the companies or sectors involved. Comparison is a way to frame questions, and the asset pages are where they are answered.',
        ],
      },
    ],
    related: [
      learn('how-to-compare-etfs', 'How to compare ETFs'),
      learn('currency-and-returns', 'Currency and returns'),
      learn('performance-calculation-methodology', 'Performance calculation methodology'),
      page('/discover/compare', 'Compare'),
      page('/indices/NIFTY-50', 'NIFTY 50'),
    ],
    glossary: ['volatility', 'p-e-ratio', 'beta', 'index', 'expense-ratio'],
  },
  {
    ...META,
    type: 'guide',
    slug: 'how-watchlists-work',
    section: 'Using INRGIFT',
    title: 'How watchlists work',
    summary: 'Watchlists are named lists of instruments you want to follow. They live in your private workspace, can be reordered, renamed, compared and exported, and are protected by row-level security in the database.',
    keyPoints: [
      'Watchlists need a sign-in and are private to your account.',
      'You can keep several named lists and add instruments from any asset page or table row.',
      'Lists can be reordered, renamed, deleted, compared and exported as CSV.',
      'A watchlist follows instruments; it records nothing about money or quantities.',
    ],
    sections: [
      {
        heading: 'What a watchlist is',
        paragraphs: [
          'A watchlist is a named list of instruments you want to keep an eye on: stocks, ETFs, REITs, indices or currencies. It shows each one with its latest price, change, data status and a few key metrics, so you can check them together rather than opening each page.',
          'A watchlist holds instruments only. It does not record quantities, prices paid or values, because INRGIFT is a research tool and not a record of anything you own. Adding an instrument to a list is simply a way of saying you want to follow it.',
        ],
      },
      {
        heading: 'Creating and filling lists',
        paragraphs: [
          'Watchlists are part of the workspace, so you need to sign in. You can keep several lists, for example one per market or one per research topic, and give each a name that makes sense to you.',
        ],
        list: [
          'Sign in and open the watchlist page in your workspace.',
          'Create a list and give it a name.',
          'Add instruments from any asset page using the watch action, or from a row in the screener, a table or a heatmap quick view.',
          'Choose which list to add to if you have more than one.',
        ],
      },
      {
        heading: 'Managing lists',
        paragraphs: [
          'Within a list, you can reorder instruments so the ones you check most often sit at the top. Lists can be renamed or deleted, and deleting a list removes only the list, not anything else in your workspace.',
          'Selecting several instruments in a list lets you open them together in compare, which is a quick way to move from following a group of names to looking at them side by side. Export CSV downloads the list with its visible columns for your own records.',
          'Each row carries the same data status as the rest of INRGIFT. If one market is closed and another open, you will see CLOSED next to one instrument and a different status next to another, each with its own timestamp in IST.',
        ],
      },
      {
        heading: 'Privacy and security',
        paragraphs: [
          'Your watchlists are private to your account. The database applies row-level security, which means every query is restricted to rows owned by the signed-in user at the database level, not just in the app. The app never sends a user id from the browser; the database fills it in from the authenticated session.',
          'This design means that even a faulty request from the browser cannot read or change another person’s lists. Watchlists are not shared publicly and are not visible to other users.',
        ],
      },
      {
        heading: 'Using watchlists with alerts',
        paragraphs: [
          'A watchlist shows the current state of instruments when you look at it. If you want to know when something specific happens, such as a price crossing a level or a dividend event, set an alert on the instrument. Alerts notify you; they never act on anything.',
          'Many readers keep a short list of instruments they are actively reading about and a longer list for broader context. Because lists are cheap to create and delete, it is reasonable to make one for a single research question and remove it when you are done.',
          'A watchlist and an alert answer different needs. The list is for regular review, when you choose to look; the alert is for a specific condition you do not want to miss between reviews. Using both together keeps the number of notifications low while still giving you a single place to scan the instruments you follow.',
        ],
      },
    ],
    related: [
      learn('how-alerts-work', 'How alerts work'),
      learn('how-to-compare-stocks', 'How to compare stocks'),
      learn('understanding-data-status', 'Understanding data status'),
      page('/app/watchlist', 'Your watchlists'),
      page('/support', 'Support'),
    ],
    glossary: ['data-status', 'etf', 'index'],
  },
  {
    ...META,
    type: 'guide',
    slug: 'how-alerts-work',
    section: 'Using INRGIFT',
    title: 'How alerts work',
    summary: 'Alerts tell you when a condition you set is met: a price level, a large daily move, a new 52-week high or low, a valuation threshold, an earnings or dividend event, news or a research or data change. They only notify.',
    keyPoints: [
      'Alerts notify you; they never act on anything in a market.',
      'Kinds include price above or below, one-day % move, 52-week high or low, valuation, earnings, dividend, news and research or data changes.',
      'Alerts are evaluated only against quotes with a valid status, never on an error or unavailable quote.',
      'Each alert is active, paused or triggered, and keeps a history.',
    ],
    sections: [
      {
        heading: 'What an alert does',
        paragraphs: [
          'An alert is a condition attached to an instrument. When the condition is met, INRGIFT sends you an in-app notification. That is all an alert does: it does not place anything in a market, change a watchlist or act on your behalf in any way.',
          'Alerts need a sign-in because they live in your private workspace. Like watchlists, they are protected by row-level security in the database, so only you can see or change them.',
        ],
      },
      {
        heading: 'Kinds of alert',
        paragraphs: [
          'Different questions call for different conditions. Price alerts suit a level you are watching; move alerts suit unusual days; event alerts suit company news you do not want to miss.',
        ],
        list: [
          'Price above or price below a level you set.',
          'One-day % move larger than a threshold, in either direction.',
          'New 52-week high or new 52-week low.',
          'Valuation threshold, such as P/E crossing a value.',
          'Earnings event or dividend event for the company.',
          'News about the instrument.',
          'Research or data change, such as a new research note or a revised figure.',
        ],
      },
      {
        heading: 'How alerts are evaluated',
        paragraphs: [
          'Alerts are checked against quotes that carry a valid data status. If a quote is in ERROR or UNAVAILABLE, the alert is not evaluated on it, so a failed request or a missing value can never trigger an alert by accident. The alert is checked again when a valid quote arrives.',
          'The timing of an alert follows the data. If the source for an instrument is DELAYED, the alert can only fire once the delayed quote shows the condition. A market that is CLOSED will not trigger a price alert until it reopens and a new price arrives.',
        ],
        example: 'You set a one-day move alert at 5% on a stock that closed at ₹800. The next day it reaches ₹842, a move of 5.25%, and the alert triggers. If the quote had instead been in ERROR, nothing would happen, because error quotes are never evaluated.',
      },
      {
        heading: 'Statuses and management',
        paragraphs: [
          'Each alert has a status. Active alerts are being checked. Paused alerts are kept but not checked. Triggered alerts have fired and stay triggered until you re-arm them, which avoids a stream of repeated notifications while a price hovers around a level.',
          'From the alerts page you can pause, resume, re-arm, edit or delete any alert, and view its history to see when it fired and on what value. The history is useful for checking how often a condition has been met before deciding whether to keep it.',
        ],
      },
      {
        heading: 'Notifications',
        paragraphs: [
          'Notifications appear in the app. An email channel is planned but not yet available, so for now you will see triggered alerts when you next open INRGIFT.',
          'A notification names the instrument and the condition, includes the value that met it where there is one (for example the last price or the P/E), and records when it fired. It links to the asset page, where the current value, its data status and its timestamp in IST are shown, so you can read what happened in context. That is the purpose of an alert.',
          'Keeping a small number of specific alerts is usually more useful than many broad ones. An alert that fires every day stops carrying information.',
        ],
      },
    ],
    related: [
      learn('how-watchlists-work', 'How watchlists work'),
      learn('understanding-data-status', 'Understanding data status'),
      term('ex-dividend-date', 'Ex-dividend date'),
      page('/app/alerts', 'Your alerts'),
      page('/resources/calendar', 'Market calendar'),
    ],
    glossary: ['data-status', 'p-e-ratio', 'ex-dividend-date', 'volatility'],
  },
  {
    ...META,
    type: 'guide',
    slug: 'how-research-works',
    section: 'Using INRGIFT',
    title: 'How research works',
    summary: 'INRGIFT research notes cover stocks, ETFs, markets, themes, sectors and countries in a fixed structure: takeaways, context, analysis, limitations, methodology and sources. They contain no ratings, price targets or recommendations.',
    keyPoints: [
      'Research covers stocks, ETFs, markets, themes, sectors and countries.',
      'Every note follows the same structure, including limitations, methodology and sources.',
      'Notes are written by the INRGIFT Research desk and carry no ratings, price targets or recommendations.',
      'Figures are computed from the active data source and carry the same data status rules.',
    ],
    sections: [
      {
        heading: 'What the research section covers',
        paragraphs: [
          'Research on INRGIFT is organised by kind: stocks, ETFs, markets, themes, sectors and countries. A stock note looks at one company; a sector note at an industry group across markets; a country note at an economy and its listed market as a whole.',
          'The purpose is explanation. A note sets out what the numbers show, why they matter and what they cannot tell you. It does not say whether anything is a good or bad idea to own, and it carries no rating or price target.',
        ],
      },
      {
        heading: 'The structure of a note',
        paragraphs: [
          'Every note uses the same sections, so you always know where to find each kind of information. Once you are familiar with the layout, you can read a new note quickly and go straight to the parts you need.',
        ],
        list: [
          'Key takeaways: the main points in a few lines.',
          'Why it matters: the context for the topic.',
          'Analysis, with charts and tables.',
          'Interpretation: what the evidence suggests and what it does not.',
          'Limitations: what the analysis cannot show.',
          'Methodology and sources.',
          'Author, reviewer, related assets and research, glossary terms and a disclosure.',
        ],
      },
      {
        heading: 'Authors, review and disclosure',
        paragraphs: [
          'Notes are written by the INRGIFT Research desk rather than by named individuals. Each note shows its reviewer; where a note has not been separately reviewed, it says so plainly rather than leaving the field blank.',
          'Every note ends with a disclosure explaining that it is educational research and not advice. Notes do not contain recommendations, ratings or price targets, and the language is kept neutral: a valuation above the median is described as above the median, not as expensive or attractive.',
        ],
      },
      {
        heading: 'Where the numbers come from',
        paragraphs: [
          'Figures in research notes are computed from the active data source, the same one that powers the rest of INRGIFT. In this build that is a demo data provider, so figures have a realistic shape and scale but are not current market values.',
          'Because notes and asset pages share a source, a number in a note will match the same number on the asset page at the same time. Charts and tables in notes follow the same rules for missing data: a dash for unavailable, n/a for not applicable, never zero.',
          'The methodology section of each note explains how its calculations were made, such as which period was used for returns or which group of companies formed a median. That lets you repeat the reasoning with different choices.',
        ],
      },
      {
        heading: 'Reading research well',
        paragraphs: [
          'Start with the key takeaways, then read the limitations before the analysis. Knowing what a note cannot show makes it easier to read the rest with the right weight.',
          'Each note links to related assets, related research and glossary terms. Following those links is often the fastest way to fill gaps: from a sector note to the largest companies in it, or from an unfamiliar ratio to its glossary entry. Research is a starting point for your own reading, not a conclusion.',
          'When a note and an asset page seem to disagree, check the data status and timestamp on each. A note may describe figures as of its publication date, while the asset page shows the latest values. The methodology section states which period a note used, so differences of this kind can be traced rather than guessed at.',
        ],
      },
    ],
    related: [
      learn('how-to-research-a-new-market', 'How to research a new market'),
      learn('understanding-data-sources', 'Understanding data sources'),
      page('/research', 'Research'),
      page('/research/sectors', 'Sector research'),
      page('/research/countries', 'Country research'),
    ],
    glossary: ['data-status', 'sector-allocation', 'country-allocation', 'index'],
  },
];

/* ------------------------------------------------------------------ */
/* Methodology                                                         */
/* ------------------------------------------------------------------ */

const METHODOLOGY_A: LearnArticle[] = [
  {
    ...META,
    type: 'methodology',
    slug: 'understanding-data-status',
    section: 'Methodology',
    title: 'Understanding data status',
    summary: 'Every data module on INRGIFT carries a status badge and an exact timestamp in IST. The status tells you how fresh the value is and why; the timestamp tells you exactly when it applies.',
    keyPoints: [
      'Seven statuses: LIVE, DELAYED, END_OF_DAY, CLOSED, UNAVAILABLE, STALE and ERROR.',
      'Each status has its own glyph, so colour is never the only cue.',
      'Every module shows an exact IST timestamp; hover or focus shows the source and exchange time zone.',
      'A dash means unavailable, n/a means not applicable, and nothing is ever zero-filled.',
    ],
    sections: [
      {
        heading: 'Why every module has a status',
        paragraphs: [
          'Market data arrives at different speeds from different places. A price can be seconds old, fifteen minutes old or from yesterday’s close, and a page can mix all three. Without a label, a reader cannot tell a current price from an old one, and the difference matters.',
          'INRGIFT therefore attaches a data status and an exact timestamp to every data module. There is never an open-ended “Updating…” message; a module either shows a value with its status and time, or shows that the value is unavailable or failed.',
        ],
      },
      {
        heading: 'The seven statuses',
        paragraphs: [
          'Each status describes a specific situation. They are mutually exclusive, so one module has exactly one status at a time.',
        ],
        list: [
          'LIVE: within seconds of the exchange.',
          'DELAYED: typically 15 minutes behind the exchange, as the data licence requires.',
          'END_OF_DAY: the official closing value for the session.',
          'CLOSED: the market is closed; the last close is shown.',
          'UNAVAILABLE: the source has no value; the last available value is shown where possible.',
          'STALE: a newer value is overdue, so the value shown may be out of date.',
          'ERROR: the request for the value failed.',
        ],
      },
      {
        heading: 'Reading the timestamp',
        paragraphs: [
          'The timestamp next to each badge is exact and in IST. It is the time the value applies to, not the time the page loaded. For a delayed quote it is the exchange time of the quote converted to IST; for an end-of-day value it is the close of that session.',
          'Hovering over the badge, or focusing it with the keyboard, shows the data source and the exchange’s own time zone. This helps when a session crosses midnight in India, as US sessions do, because the IST date of a value can differ from the exchange’s local date.',
        ],
        example: 'A US stock shows DELAYED with a timestamp of 21:42 IST in January. The value applies to a trade about 15 minutes before that, at 11:12 New York time. The tooltip shows the source and America/New_York as the exchange time zone.',
      },
      {
        heading: 'Glyphs and accessibility',
        paragraphs: [
          'Each status has its own glyph as well as its own colour. A reader who cannot distinguish the colours, or who is using a screen reader, still gets the status from the glyph and the text label. This follows the general INRGIFT rule that colour is never the only cue.',
          'Price changes follow the same principle: a change is shown with a sign and an up or down marker, not only in green or red.',
        ],
      },
      {
        heading: 'Dashes, n/a and zeros',
        paragraphs: [
          'Missing data is shown in two distinct ways. A dash means the value should exist but is not available: the source has not supplied it, or it failed validation. n/a means the value does not apply, such as a dividend yield for a company that pays no dividend, or an expense ratio for a stock.',
          'INRGIFT never fills a missing value with zero. A zero is a real measurement: a 0% change means the price did not move. Showing zero for missing data would make an unknown look like a fact and could distort averages, screens and alerts.',
          'This is why screens exclude assets with missing values from numeric rules, and why alerts are never evaluated against ERROR or UNAVAILABLE quotes.',
        ],
      },
    ],
    related: [
      learn('understanding-data-sources', 'Understanding data sources'),
      learn('market-data-methodology', 'Market data methodology'),
      learn('data-quality-methodology', 'Data quality methodology'),
      term('data-status', 'Data status'),
      page('/resources/data', 'Data documentation'),
    ],
    glossary: ['data-status', 'ist', 'trading-session'],
  },
  {
    ...META,
    type: 'methodology',
    slug: 'understanding-data-sources',
    section: 'Methodology',
    title: 'Understanding data sources',
    summary: 'INRGIFT reads all market data through its own API and data services, which call provider adapters on the server. This build runs on a demo provider; licensed sources plug into the same path.',
    keyPoints: [
      'The path is always UI → INRGIFT API → data services → provider adapter.',
      'This build runs on a demo data provider and the header shows a Demo data label.',
      'A fallback chain runs primary → secondary → last-known-good, served as STALE.',
      'INRGIFT never calls data vendors from the browser.',
    ],
    sections: [
      {
        heading: 'The data path',
        paragraphs: [
          'Every figure on INRGIFT travels the same way. The page asks the INRGIFT API; the API asks INRGIFT’s data services; the data services ask a provider adapter, which talks to the actual source. Nothing in the browser calls a data vendor directly.',
          'Keeping one path has practical benefits. Licensing rules, validation and freshness checks are applied in one place. Pages do not need to know which source is active, and a new source can be connected by adding an adapter rather than changing every page.',
        ],
      },
      {
        heading: 'The demo provider',
        paragraphs: [
          'This build runs on a demo data provider. It produces instruments, prices, fundamentals and history with a realistic shape and scale, so every page, chart and calculation behaves as it would with real data. The values are not current market prices.',
          'The header shows a Demo data label while the demo provider is active, so this is always visible. Research figures, screens, comparisons and alerts all use the same demo data, which keeps them consistent with each other even though they do not reflect today’s market.',
        ],
      },
      {
        heading: 'Licensed sources',
        paragraphs: [
          'Real market data is licensed. Exchanges and vendors set terms for how their data can be displayed, including whether it may be shown live or must be delayed. INRGIFT connects only sources licensed for display, and the data status of each value reflects those terms.',
          'An adapter for a licensed NSE source exists but is not connected in this build. When access is in place, Indian quotes can come from that adapter through the same path; each module will then show that source and its status, and the Demo data label will describe only what still comes from the demo provider.',
        ],
      },
      {
        heading: 'Fallbacks and last-known-good',
        paragraphs: [
          'Sources fail from time to time. The data services use a fallback chain: they try the primary source first, then a secondary source, and if both fail they serve the last-known-good value. A last-known-good value is always labelled STALE, never presented as current.',
          'If no value is available at all, the module shows UNAVAILABLE or ERROR with a dash. This keeps the reader informed about what is known and what is not.',
        ],
        list: [
          'Primary source answers: value shown with its normal status.',
          'Primary fails, secondary answers: value shown with the secondary source named in the tooltip.',
          'Both fail, a previous value exists: last-known-good shown as STALE.',
          'Nothing available: UNAVAILABLE or ERROR, with a dash.',
        ],
      },
      {
        heading: 'Seeing the source',
        paragraphs: [
          'Hovering over or focusing a data status badge shows the source and the exchange time zone for that value. The data documentation page explains the sources and the statuses they can carry.',
          'Because different modules on one page can come from different sources or updates, it is normal to see different statuses side by side. Reading the badge on each module is the reliable way to know what you are looking at.',
          'If a figure looks wrong, the support page explains how to report it. Reports are checked against the source and the validation rules described in the data quality methodology.',
          'The separation between pages and sources also protects readers. Credentials for data vendors stay on the server, licence terms are applied before any value leaves INRGIFT, and a page cannot accidentally show data the licence does not allow it to show.',
        ],
      },
    ],
    related: [
      learn('understanding-data-status', 'Understanding data status'),
      learn('data-quality-methodology', 'Data quality methodology'),
      learn('how-inrgift-works', 'How INRGIFT works'),
      page('/resources/data', 'Data documentation'),
      page('/support', 'Support'),
    ],
    glossary: ['data-status', 'ist'],
  },
  {
    ...META,
    type: 'methodology',
    slug: 'market-data-methodology',
    section: 'Methodology',
    title: 'Market data methodology',
    summary: 'How INRGIFT turns source quotes into the prices, changes, volumes and INR values shown on the site: listing currency, previous close, closing prices, approximate conversion and consistent handling of missing values.',
    keyPoints: [
      'Prices are shown in the listing’s own currency; INR values are approximate.',
      'The day’s change is measured against the previous close.',
      'Instruments are identified by a fixed internal id, not by ticker.',
      'Every value carries a data status and an exact IST timestamp.',
    ],
    sections: [
      {
        heading: 'Instruments and listings',
        paragraphs: [
          'INRGIFT identifies every instrument by a fixed internal id and uses a readable slug in URLs. Tickers are not used as identifiers because they are reused, differ between exchanges and change after corporate events. The same company can have several listings, each with its own id, exchange and currency.',
          'Each listing’s data is kept in its own currency and time zone. A depositary receipt in New York and the underlying share in its home market are separate listings, linked through the issuer, with the receipt ratio recorded where the source provides it.',
        ],
      },
      {
        heading: 'Prices, changes and volume',
        paragraphs: [
          'The price shown is the latest value available from the source, with its status. The change on the day is the difference between that value and the previous session’s close, shown in currency and as a percentage, with a sign and an up or down marker.',
          'Volume is the number of shares or units exchanged in the session so far, or for the full session once it has ended. Volume is never negative; a negative value fails validation and is not shown.',
        ],
        example: 'A stock closed yesterday at ₹1,250.00 and the latest delayed quote is ₹1,268.75. The change is +₹18.75, or +1.50% (18.75 ÷ 1,250 × 100), shown as ▲ +1.50%.',
      },
      {
        heading: 'Closing prices and history',
        paragraphs: [
          'Historical charts and period returns use closing prices for each session. On exchanges with a closing auction, the official close usually comes from that auction. Where a market is closed for a holiday, no row is created for that day, so history does not contain fake flat days.',
          'Corporate actions such as splits and dividends change the price series. History is checked for unexplained jumps that suggest a missing adjustment, and rows that fail that check are held back rather than shown.',
        ],
      },
      {
        heading: 'Approximate INR values',
        paragraphs: [
          'Many INRGIFT readers think in rupees, so foreign prices and market caps also carry an approximate INR value. It is calculated with a reference exchange rate for each currency and is always labelled as approximate.',
          'The reference rate is not a live dealing rate, and the actual rupee amount for any real transaction would differ. The INR value exists to give a sense of scale, such as how large a foreign company is in rupee terms, not to price anything precisely.',
        ],
      },
      {
        heading: 'Missing values and status',
        paragraphs: [
          'Every value carries a status and a timestamp. If the source has no value, the module shows a dash with UNAVAILABLE; if a value does not apply, it shows n/a. Neither is converted into zero at any stage.',
          'Values that pass through the fallback chain to last-known-good are shown as STALE. This keeps the market data on the page honest about its age, which matters more than always having a number to show.',
          'The same rules apply wherever a value appears. A price on a stock page, in a screener row, in a watchlist and in compare comes from the same data services with the same status, so the four views agree with each other at the same moment.',
          'Derived figures inherit the limits of their inputs. A market cap built from a delayed price is itself delayed, and a 1D change built from an unavailable previous close is shown as a dash rather than estimated.',
        ],
      },
    ],
    related: [
      learn('understanding-data-status', 'Understanding data status'),
      learn('performance-calculation-methodology', 'Performance calculation methodology'),
      learn('currency-and-returns', 'Currency and returns'),
      page('/fx/USD-INR', 'USD/INR'),
      page('/resources/data', 'Data documentation'),
    ],
    glossary: ['data-status', 'depositary-receipt', 'market-capitalisation', 'liquidity', 'trading-session'],
  },
];

const METHODOLOGY_B: LearnArticle[] = [
  {
    ...META,
    type: 'methodology',
    slug: 'performance-calculation-methodology',
    section: 'Methodology',
    title: 'Performance calculation methodology',
    summary: 'How INRGIFT calculates period returns, YTD, the one-day change, volatility, maximum drawdown, beta and the rebased lines in compare, and why returns are shown in the listing’s own currency.',
    keyPoints: [
      'Period returns use closing prices in the listing’s local currency.',
      'YTD starts from the last close of the previous year; 1D is measured against the previous close.',
      'Volatility is the standard deviation of daily returns × √252.',
      'Beta is measured against the home index; compare rebases every line to 0%.',
      'INR values are approximate, using a reference rate per currency.',
    ],
    sections: [
      {
        heading: 'Period returns',
        paragraphs: [
          'A period return is the percentage change between the closing price at the start of the period and the latest closing price. INRGIFT calculates every period return in the listing’s own currency, so a US stock’s return is in dollars and an Indian stock’s in rupees.',
          'YTD, or year to date, starts from the last close of the previous calendar year. 1D compares the latest value with the previous session’s close. Other periods, such as 1W, 1M and 1Y, start from the close on or immediately before the start date, so holidays do not leave a gap.',
        ],
        example: 'A stock closed the previous year at ₹500 and closes today at ₹560. YTD return = (560 ÷ 500) − 1 = 12.0%. If yesterday’s close was ₹552, the 1D change is (560 ÷ 552) − 1 = +1.45%.',
      },
      {
        heading: 'Volatility',
        paragraphs: [
          'Volatility measures how much a price has varied. INRGIFT computes the daily return for each session, takes the standard deviation of those returns and multiplies by the square root of 252, the approximate number of sessions in a year. The result is an annualised figure that can be compared across instruments.',
          'The heatmap’s volatility colour uses an annualised 30-day figure. Volatility says nothing about direction: a price that rose steadily and one that fell steadily can have similar volatility.',
        ],
        example: 'If the standard deviation of daily returns over the window is 1.2%, annualised volatility is 1.2% × √252 ≈ 1.2% × 15.87 ≈ 19.0%.',
      },
      {
        heading: 'Maximum drawdown and beta',
        paragraphs: [
          'Maximum drawdown is the largest fall from a peak to a later trough within the period, expressed as a percentage of the peak. It describes the worst decline someone following the price through that period would have seen, which volatility alone does not show.',
          'Beta measures how much an instrument has tended to move with its home index. A beta of 1.0 means it moved in line with the index on average; above 1.0, more than the index; below 1.0, less. Beta is measured against the home index of each listing, so an Indian stock’s beta is against an Indian index and a US stock’s against a US index.',
        ],
        list: [
          'Find the running peak of closing prices through the period.',
          'At each close, measure the fall from that running peak.',
          'Maximum drawdown is the largest such fall.',
        ],
      },
      {
        heading: 'Rebased lines in compare',
        paragraphs: [
          'Compare rebases each line to 0% at the start of the chosen period and plots the percentage change from there. This lets instruments with very different prices and currencies sit on one chart.',
          'Each rebased line is in the instrument’s own currency. The benchmark line, S&P 500 or NIFTY 50, is calculated the same way. Comparing lines in different currencies therefore compares local-currency returns, not returns in a single currency.',
        ],
      },
      {
        heading: 'Currency and INR values',
        paragraphs: [
          'Because returns are in local currency, they exclude currency effects. For a reader in India, the rupee experience of a foreign asset also depends on how the exchange rate moved over the same period. INRGIFT shows approximate INR values using a reference rate per currency, labelled as approximate, to give a sense of scale.',
          'Returns are price returns unless stated otherwise. Where a module shows a figure that includes dividends, it says so. Missing closes are never filled with zeros or copied values; if the start or end close is unavailable, the return is shown as a dash.',
        ],
      },
    ],
    related: [
      learn('understanding-risk', 'Understanding risk'),
      learn('currency-and-returns', 'Currency and returns'),
      learn('how-to-compare-stocks', 'How to compare stocks'),
      term('maximum-drawdown', 'Maximum drawdown'),
      page('/discover/compare', 'Compare'),
    ],
    glossary: ['volatility', 'maximum-drawdown', 'beta', 'index', 'sharpe-ratio'],
  },
  {
    ...META,
    type: 'methodology',
    slug: 'etf-metrics-methodology',
    section: 'Methodology',
    title: 'ETF metrics methodology',
    summary: 'How INRGIFT presents ETF metrics: expense ratio, AUM, holdings count, top-10 concentration, sector and country allocation, distribution yield, and the difference between tracking difference and tracking error.',
    keyPoints: [
      'Expense ratio is the annual cost of running the fund, as a percentage of assets.',
      'Top-10 concentration shows how much of the fund sits in its ten largest holdings.',
      'Tracking difference is fund return minus index return; tracking error is the volatility of that difference.',
      'The eight-step ETF review walks through these metrics in a fixed sequence.',
    ],
    sections: [
      {
        heading: 'Cost and size',
        paragraphs: [
          'The expense ratio is the annual cost of running the fund, expressed as a percentage of its assets. It is taken from the fund’s own documents and is deducted from the fund’s assets over the year, so it reduces returns gradually rather than appearing as a separate charge.',
          'Assets under management, or AUM, is the total value of the assets the fund holds. INRGIFT shows AUM in the fund’s currency with an approximate INR value. AUM is also the tile size option on the heatmap for funds. Larger funds are often, though not always, more liquid; liquidity also depends on the underlying securities.',
        ],
        example: 'A fund with an expense ratio of 0.20% and assets of US$10,000 incurs about US$20 per year in running costs for every US$10,000 of assets, deducted gradually within the fund.',
      },
      {
        heading: 'What the fund holds',
        paragraphs: [
          'The holdings count is the number of distinct securities in the fund. Top-10 concentration is the combined weight of the ten largest holdings. A fund with 500 holdings and a top-10 concentration of 30% is still noticeably exposed to a handful of companies.',
          'Sector allocation and country allocation show how the fund’s assets are spread by sector and by country. They are calculated from the holdings data supplied by the source and are shown as percentages that add to roughly 100%, with any unclassified remainder shown separately.',
        ],
      },
      {
        heading: 'Distribution yield',
        paragraphs: [
          'Distribution yield relates the fund’s recent distributions to its price. It shows what the fund has paid out in the recent past, not what it will pay in future. Funds that reinvest income show no distribution yield, which INRGIFT displays as n/a rather than zero.',
        ],
      },
      {
        heading: 'Tracking difference and tracking error',
        paragraphs: [
          'Index funds aim to follow an index, and two measures describe how closely they do. Tracking difference is the fund’s return minus the index’s return over a period. It is usually slightly negative because of costs, and is best read as a cost measure: how much the fund lagged the index in total.',
          'Tracking error is the volatility of that difference over time, the standard deviation of the gap between fund and index returns. A fund can have a steady small tracking difference and a low tracking error, or a small average difference that swings a lot, which shows as a high tracking error.',
          'The two answer different questions. Tracking difference tells you how much following the index cost over the period; tracking error tells you how consistently the fund followed it.',
        ],
        example: 'Over a year the index returns 10.0% and the fund 9.8%. Tracking difference = 9.8% − 10.0% = −0.2%. If the monthly gaps were steady near −0.02%, tracking error is low; if they swung between −0.5% and +0.4%, tracking error is higher even though the annual difference is the same.',
      },
      {
        heading: 'The eight-step ETF review',
        paragraphs: [
          'The ETF review page walks through these metrics in a fixed sequence so that funds can be read the same way each time. It covers what the fund tracks, its cost, its size, its holdings and concentration, its sector and country exposure, its tracking and its distributions.',
          'The review describes each fund; it does not score or rank funds. Comparing two funds is best done with compare, which shows the same fund details side by side.',
        ],
      },
    ],
    related: [
      learn('etf-basics', 'ETF basics'),
      learn('expense-ratio-explained', 'Expense ratio explained'),
      learn('tracking-error-explained', 'Tracking error explained'),
      learn('how-to-compare-etfs', 'How to compare ETFs'),
      page('/etfs/SPY/review', 'Example ETF review'),
      page('/etfs/SPY', 'Example ETF page'),
    ],
    glossary: ['expense-ratio', 'assets-under-management', 'tracking-difference', 'tracking-error', 'sector-allocation', 'country-allocation'],
  },
  {
    ...META,
    type: 'methodology',
    slug: 'data-quality-methodology',
    section: 'Methodology',
    title: 'Data quality methodology',
    summary: 'Before market data reaches a page, INRGIFT checks it for internal consistency, valid timestamps, duplicates, unexplained jumps, currency and exchange consistency and staleness. Rows that fail are quarantined and never shown.',
    keyPoints: [
      'OHLC values must be consistent: the high at or above open and close, the low at or below them.',
      'Volume must be non-negative and timestamps valid and in sequence.',
      'Unexplained jumps are flagged as likely missing split or dividend adjustments.',
      'Failing rows are quarantined and never shown; batches are validated on ingestion.',
    ],
    sections: [
      {
        heading: 'Why checks are needed',
        paragraphs: [
          'Market data passes through several systems before it reaches a page, and errors can enter at any step: a mistyped value, a missing adjustment, a duplicated record or a timestamp in the wrong time zone. A single bad row can distort a chart, a return, a screen result or an alert.',
          'INRGIFT validates data as it is ingested, batch by batch, and quarantines rows that fail. A quarantined row is never shown. Where that leaves a gap, the page shows a dash and the appropriate status rather than the bad value or a zero.',
        ],
      },
      {
        heading: 'The checks',
        paragraphs: [
          'Each check targets a specific kind of error. Together they catch most problems that would otherwise be visible to readers.',
        ],
        list: [
          'OHLC consistency: the high is at least the open and the close; the low is at most the open and the close.',
          'Volume: never negative.',
          'Timestamps: valid, in the expected time zone and in sequence.',
          'Duplicates: one row per instrument per session.',
          'Unadjusted jumps: large moves without a matching corporate action, likely a missing split or dividend adjustment.',
          'Currency and exchange consistency: each row matches its listing’s currency and exchange.',
          'Staleness: a newer value that is overdue is detected and the value is marked STALE.',
        ],
      },
      {
        heading: 'Examples of failures',
        paragraphs: [
          'Some failures are obvious once stated. A daily row with a high below its close cannot be correct, and neither can a volume of −1,200. Others need context: a 50% fall in one day may be a genuine event or a two-for-one split recorded without adjustment.',
        ],
        example: 'A row reads open 102.0, high 101.5, low 99.8, close 101.9. The high (101.5) is below both the open and the close, so the row fails OHLC consistency and is quarantined. Separately, a stock that falls from ₹1,000 to ₹500 overnight with no price-moving news and a 1:2 split recorded the next week is flagged as an unadjusted jump.',
      },
      {
        heading: 'What quarantine means for pages',
        paragraphs: [
          'Quarantine removes a row from everything readers see: charts, returns, screens, compare and alerts. Calculations that need the missing row show a dash rather than a figure built on bad data.',
          'When a corrected row arrives from the source, it passes through the same checks and, if valid, replaces the gap. History is never patched by guessing or by copying the previous day.',
          'Staleness is handled through data status rather than quarantine. A value that is old but valid is shown as STALE, so the reader can see it and judge its age.',
        ],
      },
      {
        heading: 'Limits of automated checks',
        paragraphs: [
          'Automated checks catch inconsistent and impossible values, but they cannot confirm that a plausible value is correct. A price that is wrong by a small amount and still consistent with its own high and low will pass.',
          'For that reason the source of every value is visible through the data status tooltip, and the support page explains how to report a figure that looks wrong. Reports are checked against the source.',
          'Checks are also run in sequence. Structural checks, such as timestamps and duplicates, run first, because a value cannot be judged for plausibility until it is clear which instrument and session it belongs to. Plausibility checks, such as unadjusted jumps, run afterwards on the rows that remain.',
        ],
      },
    ],
    related: [
      learn('understanding-data-sources', 'Understanding data sources'),
      learn('market-data-methodology', 'Market data methodology'),
      learn('understanding-data-status', 'Understanding data status'),
      page('/resources/data', 'Data documentation'),
      page('/support', 'Support'),
    ],
    glossary: ['data-status', 'trading-session', 'liquidity'],
  },
  {
    ...META,
    type: 'methodology',
    slug: 'market-calendar-methodology',
    section: 'Methodology',
    title: 'Market calendar methodology',
    summary: 'INRGIFT derives each exchange’s open or closed status from calendar records: time zone, regular session, pre-open and post-close, midday breaks, auctions, holidays, early closes and special closures. Nothing is hard-coded in IST.',
    keyPoints: [
      'Each exchange has a time zone, a regular session and optional pre-open, post-close, breaks and auctions.',
      'Holidays, early closes and special closures are stored as calendar records.',
      'Status is derived per exchange from these records at the moment you look.',
      'IST conversions shift when the US or Europe change their clocks; IST itself never changes.',
    ],
    sections: [
      {
        heading: 'What a calendar record holds',
        paragraphs: [
          'Each exchange has a calendar record. It stores the exchange’s time zone and its regular session in local time, plus any pre-open session, post-close session, midday break and auction windows. Separate entries store holidays, early closes or half days, and special closures announced at short notice.',
          'Times are stored in local exchange time with a named time zone rather than as fixed offsets. A named time zone carries its own daylight saving rules, so the conversion to IST is always correct for the date in question.',
        ],
        list: [
          'Time zone, such as America/New_York or Asia/Tokyo.',
          'Regular session, such as 09:30–16:00 for NYSE.',
          'Optional pre-open and post-close sessions.',
          'Midday breaks, such as Tokyo 11:30–12:30, Hong Kong 12:00–13:00 and Shanghai 11:30–13:00.',
          'Auctions, such as the London closing auction 16:30–16:35.',
          'Holidays, early closes and special closures.',
        ],
      },
      {
        heading: 'Deriving status',
        paragraphs: [
          'When a page asks whether an exchange is open, INRGIFT takes the current moment, converts it to the exchange’s local time and checks the calendar record. Is today a holiday? Is it an early close? Is the time inside the regular session but within a midday break? The answer gives the status.',
          'Because status is derived each time, nothing is hard-coded. There is no fixed list saying “NYSE opens at 19:00 IST”; that fact is the result of a calculation that also produces 20:00 IST in the US winter.',
        ],
      },
      {
        heading: 'Daylight saving and IST',
        paragraphs: [
          'IST is UTC+5:30 throughout the year. When the US moves its clocks forward in March, NYSE’s 09:30 local open moves from 20:00 IST to 19:00 IST. When the UK moves its clocks forward, London’s 08:00 local open moves from 13:30 IST to 12:30 IST, and Xetra’s 09:00 local open makes the same move.',
          'The US and Europe change clocks on different dates. For a few weeks each spring and autumn, the gap between New York and London is unusual, and the IST times of each move on their own dates. Deriving status from named time zones handles this without special cases.',
        ],
        example: 'On a Monday in early March after the US clock change but before the UK one, NYSE opens at 19:00 IST while London still opens at 13:30 IST. Two weeks later, after the UK change, London opens at 12:30 IST.',
      },
      {
        heading: 'NSE and Indian sessions',
        paragraphs: [
          'The NSE regular session runs from 09:15 to 15:30 IST, with a pre-open session from 09:00. Since India does not observe daylight saving, these times are the same all year. Indian holidays and any special sessions are stored as calendar records in the same way as for other exchanges.',
          'A market that is closed for a holiday shows CLOSED with its last close. A market in a midday break is also shown as not open, so its prices are not expected to change until the afternoon session.',
        ],
      },
      {
        heading: 'Where the calendar appears',
        paragraphs: [
          'The markets pages show each exchange’s current status. The calendar page lists upcoming holidays, early closes and other events. Data status badges use the same calendar, which is why a closed market’s values are labelled CLOSED rather than STALE.',
          'Calendar records are updated as exchanges publish their schedules. If an exchange announces a special closure, the record changes and every page that depends on it follows.',
        ],
      },
    ],
    related: [
      learn('global-market-hours-in-ist', 'Global market hours in IST'),
      learn('us-market-hours-in-india', 'US market hours in India'),
      learn('understanding-global-exchanges', 'Understanding global exchanges'),
      page('/resources/calendar', 'Market calendar'),
      page('/markets/all', 'All markets'),
    ],
    glossary: ['ist', 'trading-session', 'data-status', 'index'],
  },
];

/** Product guides, global market hours and methodology articles for the learn library. */
export const LEARN_GUIDES: LearnArticle[] = [...MARKET_HOURS, ...USING_A, ...USING_B, ...METHODOLOGY_A, ...METHODOLOGY_B];
