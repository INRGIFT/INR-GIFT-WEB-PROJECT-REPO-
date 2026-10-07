/**
 * INRGIFT learn library. Educational content only: no advice, no recommendations.
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
/* Investing basics                                                    */
/* ------------------------------------------------------------------ */

const BASICS: LearnArticle[] = [
  {
    ...META,
    type: 'article',
    slug: 'what-is-a-stock',
    section: 'Investing basics',
    title: 'What is a stock?',
    summary: 'A share is a part-ownership claim on a company. Its price reflects expectations about the future, which is why price and value are not the same thing.',
    keyPoints: [
      'A share is a fractional claim on a company’s assets, earnings and voting rights.',
      'The share price is set by the most recent trade, so it moves with expectations, not only with results.',
      'Market capitalisation, not the share price, tells you how large a company is.',
      'The same company can be listed in more than one place, in more than one currency.',
    ],
    sections: [
      {
        heading: 'A share is a claim on a business',
        paragraphs: [
          'A company that issues shares divides its ownership into many equal units. Each share gives its holder a proportional claim on what the company owns and earns, after everyone with a prior claim, such as lenders and suppliers, has been paid. Shareholders sit last in that line, which is why equity is described as the residual claim.',
          'Ownership usually carries a vote on matters put to shareholders, such as electing directors or approving large transactions. Some companies issue more than one share class with different voting rights, so two shares in the same company are not always identical.',
          'Shareholders do not own the company’s assets directly and cannot walk in and take a desk. Their claim works through the company: through dividends it pays, through the value of the business as a whole and, in a liquidation, through whatever is left after creditors.',
        ],
      },
      {
        heading: 'Why the price moves',
        paragraphs: [
          'A listed share has a price because people exchange it on a stock exchange. The last traded price is simply where the most recent exchange happened. It changes whenever participants revise what they think the company’s future cash flows are worth, or how much return they demand for the risk of waiting for them.',
          'This is why share prices can fall on good results and rise on bad ones. If a company reports 15% profit growth when the market expected 25%, the price may drop, because the future now looks a little less bright than it did the day before. Results matter mainly against expectations.',
          'Prices also move for reasons unrelated to the company: changes in interest rates, currency moves, flows into or out of a whole market, and shifts in sentiment. Over short periods these broad forces often dominate company-specific news.',
        ],
      },
      {
        heading: 'Share price is not company size',
        paragraphs: [
          'A share priced at ₹4,000 is not necessarily a bigger or more expensive company than one priced at ₹40. What matters is how many shares exist. Multiply the share price by the number of shares outstanding and you get market capitalisation, the market’s value of the whole equity.',
          'Splits and bonus issues show why the per-share price is arbitrary. If a company splits each share into ten, the price falls to roughly a tenth and the number of shares rises tenfold. Nothing about the business has changed, and market capitalisation stays the same.',
        ],
        example: 'Company A has 50 crore shares at ₹200, so its market capitalisation is ₹10,000 crore. Company B has 2 crore shares at ₹2,500, a market capitalisation of ₹5,000 crore. B’s share price is more than twelve times A’s, yet A is twice the size.',
      },
      {
        heading: 'Where shares are listed',
        paragraphs: [
          'Shares are listed on exchanges such as the NSE and BSE in India, the NYSE and Nasdaq in the United States, the London Stock Exchange or Deutsche Börse’s Xetra in Europe, and the Tokyo or Hong Kong exchanges in Asia. Each exchange has its own trading hours, currency and holiday calendar.',
          'A company can be listed in more than one place. Some foreign companies make their shares available in the United States through depositary receipts, where one receipt represents a fixed number of underlying shares. The receipt and the home listing are claims on the same company, but they trade in different currencies and at different times, so their prices are related but not identical.',
          'INRGIFT addresses every listing by an internal identifier rather than by ticker, because tickers are reused, differ between exchanges and change after corporate events.',
        ],
      },
      {
        heading: 'What shareholders receive',
        paragraphs: [
          'Returns to shareholders come from two sources: dividends, which are cash distributions out of profit, and changes in the share price. Together these make up total return. Some companies pay out much of their profit; others reinvest everything, aiming to grow the business so that future value is higher.',
          'Neither source is guaranteed. Dividends can be cut, and prices can fall below what anyone paid. A share has no maturity date and no promised payment, which is the main difference between owning equity and lending through a bond.',
        ],
      },
      {
        heading: 'Reading a stock on INRGIFT',
        paragraphs: [
          'Each stock page brings together the price chart, performance across periods, valuation multiples compared with sector medians, profitability, financial statements, dividends, technical indicators and a panel showing every listing of the same issuer. A data status badge on each module shows how fresh the figures are and which time zone the timestamp is in.',
          'Where a figure does not apply, such as a dividend yield for a company that pays none, the page shows n/a. Where a figure should exist but the source has not supplied it, the page shows a dash. Neither is ever displayed as zero.',
        ],
      },
    ],
    related: [
      learn('market-cap-explained', 'Market cap explained'),
      learn('how-to-read-a-stock-research-page', 'How to read a stock research page'),
      term('depositary-receipt', 'Depositary receipt (ADR/GDR)'),
      page('/stocks/RELIANCE', 'Example stock page: Reliance Industries'),
      page('/assets/stocks', 'Browse stocks'),
    ],
    glossary: ['market-capitalisation', 'share-class', 'depositary-receipt', 'dividend-yield', 'liquidity'],
  },
  {
    ...META,
    type: 'article',
    slug: 'market-cap-explained',
    section: 'Fundamental analysis',
    title: 'Market cap explained',
    summary: 'Market capitalisation is share price multiplied by shares outstanding. It measures the market value of a company’s equity and is the usual way to compare company size.',
    keyPoints: [
      'Market cap = share price × shares outstanding.',
      'It values the equity only; debt and cash are handled by enterprise value.',
      'Size labels such as large cap and small cap depend on the market and the index provider.',
      'Comparing companies in different currencies needs a common currency and a stated rate.',
    ],
    sections: [
      {
        heading: 'The calculation',
        paragraphs: [
          'Market capitalisation multiplies the current share price by the number of shares outstanding. The result is what the market, at that moment, implies the whole of the company’s equity is worth. It changes every time the price changes, even if nothing else about the company does.',
          'Data providers differ on which share count they use. Some use total shares issued, some exclude shares held by the company itself, and companies with several share classes may be added up across classes or shown per class. Small differences in market cap between sources usually come from this choice, not from errors.',
        ],
        example: 'A company has 120 crore shares outstanding and the last price is ₹850. Its market cap is 120 crore × ₹850 = ₹1,02,000 crore. If the price rises 5% to ₹892.50, market cap rises to ₹1,07,100 crore with no change in the business.',
      },
      {
        heading: 'Free float and why index weights differ',
        paragraphs: [
          'Not every share is available to the public. Promoters, governments or parent companies may hold large blocks that rarely change hands. Free-float market cap counts only shares that are realistically available, and most major index providers weight companies by free-float market cap rather than by total market cap.',
          'This matters in India, where promoter groups often hold a large proportion of shares. Two companies with the same total market cap can carry very different weights in the NIFTY 50 if one has a much smaller free float.',
        ],
      },
      {
        heading: 'Size bands',
        paragraphs: [
          'Companies are often grouped as large, mid or small cap. There is no single global rule. In India, the classification used for mutual fund categories ranks listed companies by average market cap and labels the top 100 as large cap, the next 150 as mid cap and the rest as small cap. US and global index providers use their own thresholds, often in dollars.',
          'A company that counts as large cap in a smaller market can be mid cap or small cap on a global scale. When comparing across markets, it is clearer to look at the market cap figure itself, in a common currency, than at the label.',
        ],
      },
      {
        heading: 'What market cap does not tell you',
        paragraphs: [
          'Market cap ignores debt. A company with a modest market cap and heavy borrowing can be a larger enterprise than its equity value suggests. Enterprise value adds debt and subtracts cash to describe the value of the whole business, which is why it is used for multiples such as EV/EBITDA.',
          'Market cap also says nothing about whether a company is cheap or expensive. A large market cap reflects high expectations, a large business, or both. Valuation multiples, which divide price by something the company produces, are needed to judge that.',
        ],
      },
      {
        heading: 'Comparing across currencies',
        paragraphs: [
          'A US company’s market cap is quoted in dollars, a Japanese company’s in yen and an Indian company’s in rupees. To compare them, all three must be converted at a stated exchange rate. INRGIFT shows market cap in the listing currency and an approximate INR value using a reference rate, labelled as approximate, so rupee-based readers can compare sizes on one scale.',
          'Because exchange rates move, a foreign company’s market cap in rupees can change even when its price in its home currency is flat.',
        ],
      },
    ],
    related: [
      learn('enterprise-value-explained', 'Enterprise value explained'),
      learn('reading-valuation', 'Reading valuation multiples'),
      term('market-capitalisation', 'Market capitalisation'),
      page('/discover/heatmap', 'Global heatmap, sized by market cap'),
      page('/discover/screener', 'Screen by market cap'),
    ],
    glossary: ['market-capitalisation', 'enterprise-value', 'index', 'share-class'],
  },
];

/* ------------------------------------------------------------------ */
/* Global markets                                                      */
/* ------------------------------------------------------------------ */

const GLOBAL: LearnArticle[] = [
  {
    ...META,
    type: 'article',
    slug: 'global-stock-markets-explained',
    section: 'Global markets',
    title: 'Global stock markets explained',
    summary: 'How the world’s stock markets are organised, how they differ, and why the same headline can mean different things in different markets.',
    keyPoints: [
      'A market is a country or region; an exchange is the venue where its securities are listed and traded.',
      'Markets differ in size, sector mix, currency, trading hours and disclosure rules.',
      'Benchmark indices summarise a market, but their sector weights shape what they actually measure.',
      'For a rupee-based reader, every foreign return has two parts: the asset and the currency.',
    ],
    sections: [
      {
        heading: 'Markets, exchanges and indices',
        paragraphs: [
          'Three words are often used loosely. A market is a country or region, such as India, the United States or Japan. An exchange is a regulated venue where securities are listed and traded, such as the NSE, the NYSE or the Tokyo Stock Exchange. An index is a rule-based basket that summarises part of a market, such as the NIFTY 50, the S&P 500 or the Nikkei 225.',
          'One market can have several exchanges. India has the NSE and BSE, and the IFSC exchanges at GIFT City. The United States has the NYSE, Nasdaq and others, with the same share able to trade on several venues. When INRGIFT says a market is open, it means the main regular session of its primary exchange is open.',
        ],
      },
      {
        heading: 'How markets differ',
        paragraphs: [
          'The largest markets by value are the United States, followed at a distance by markets such as Japan, China, India, the United Kingdom and the major continental European markets. Size affects how many companies are listed, how easily shares change hands and how much research coverage exists.',
          'Sector mix differs sharply. One market can be dominated by technology companies, another by banks and energy, another by industrial exporters. A broad index in each market therefore behaves very differently in the same economic conditions. When people compare “the US market” with “the Indian market”, they are partly comparing sectors.',
          'Rules differ too. Reporting calendars, accounting standards, dividend practices, settlement cycles, circuit breakers and limits on daily price moves vary by market. A figure that looks unusual may simply reflect a local convention.',
        ],
      },
      {
        heading: 'Developed, emerging and frontier',
        paragraphs: [
          'Index providers group markets into developed, emerging and frontier categories using criteria such as economic development, market size and liquidity, and ease of access for foreign investors. India is classified as an emerging market by the major providers. Classification changes are announced in advance and can move large amounts of index-tracking money.',
          'These labels describe market structure and access, not the quality of individual companies. A large company in an emerging market can be more established than a small one in a developed market.',
        ],
      },
      {
        heading: 'The currency layer',
        paragraphs: [
          'Every market prices its shares in its own currency. A reader in India who follows a US or Japanese share is exposed to the share price and to the exchange rate between that currency and the rupee. Over some periods the currency effect adds to the local return; over others it subtracts.',
          'INRGIFT shows prices in the listing currency first, with an approximate INR value beside them using a reference rate. Performance figures are calculated in the local currency unless a page says otherwise.',
        ],
        example: 'Suppose a Japanese index rises 8% in yen over a year while the yen falls 6% against the rupee. In rupee terms the return is about 1.08 × 0.94 − 1 = 1.5%, far less than the headline 8%.',
      },
      {
        heading: 'Following many markets at once',
        paragraphs: [
          'Because markets open in sequence around the clock, news from one region reaches the next as it opens. A large move in US technology shares overnight can colour the Asian session the following morning, and European trading in the Indian afternoon can set the tone for the US open in the Indian evening.',
          'The markets overview groups every covered market with its status, local time and session times in IST. The global heatmap shows the same universe at once, grouped by region, country or sector, so you can see where a move was broad and where it was concentrated.',
        ],
      },
    ],
    related: [
      learn('understanding-global-exchanges', 'Understanding global exchanges'),
      learn('global-markets-from-india', 'Global market hours in IST'),
      learn('currency-and-returns', 'How currency changes your return'),
      page('/markets', 'Markets overview'),
      page('/discover/heatmap', 'Global heatmap'),
    ],
    glossary: ['index', 'trading-session', 'liquidity', 'market-capitalisation', 'country-allocation'],
  },
  {
    ...META,
    type: 'article',
    slug: 'global-markets-from-india',
    section: 'Global markets',
    title: 'Global market hours in IST',
    summary: 'Asia trades through the Indian morning, Europe opens around midday and the United States opens in the evening. Daylight saving abroad shifts those times by an hour; IST never moves.',
    keyPoints: [
      'IST is UTC+5:30 and has no daylight saving, so foreign sessions shift against it during the year.',
      'Asian markets open before or around the NSE open and mostly close by the Indian afternoon.',
      'London and Frankfurt open around 12:30 to 13:30 IST, depending on the season.',
      'New York opens at 19:00 IST in the northern summer and 20:00 IST in winter.',
    ],
    sections: [
      {
        heading: 'Why IST is a useful anchor',
        paragraphs: [
          'India Standard Time is five and a half hours ahead of Coordinated Universal Time and does not observe daylight saving. The United States, the United Kingdom and the European Union all move their clocks forward in spring and back in autumn. Their exchanges keep the same local opening times, so in IST those sessions move by an hour twice a year.',
          'Japan, China, Hong Kong and Singapore do not use daylight saving, so their sessions sit at the same IST times all year. Australia does use daylight saving, but in the southern hemisphere summer, so its shift runs the opposite way to Europe and the United States.',
        ],
      },
      {
        heading: 'A day of sessions in IST',
        paragraphs: [
          'The times below are regular sessions in IST. Pre-open auctions, extended hours and holidays are not shown here; each market page lists them.',
        ],
        list: [
          'Tokyo: 05:30 to 12:00 IST, with a lunch break from 08:00 to 09:00 IST.',
          'Singapore (SGX securities): 06:30 to 14:30 IST.',
          'Hong Kong: 07:00 to 13:30 IST, with a lunch break from 09:30 to 10:30 IST.',
          'Shanghai and Shenzhen: 07:00 to 12:30 IST, with a lunch break from 09:00 to 10:30 IST.',
          'India (NSE and BSE): 09:15 to 15:30 IST, after a pre-open session from 09:00.',
          'London: 13:30 to 22:00 IST in winter; 12:30 to 21:00 IST during British Summer Time.',
          'Frankfurt (Xetra): 13:30 to 22:00 IST in winter; 12:30 to 21:00 IST during Central European Summer Time.',
          'New York (NYSE and Nasdaq): 20:00 to 02:30 IST in winter; 19:00 to 01:30 IST during US daylight saving time.',
        ],
      },
      {
        heading: 'The weeks when clocks disagree',
        paragraphs: [
          'The United States starts daylight saving on the second Sunday of March and ends it on the first Sunday of November. The United Kingdom and the European Union change on the last Sunday of March and the last Sunday of October. For a few weeks each spring and autumn, New York has moved and London has not, or the other way round.',
          'In those weeks the gap between the London close and the New York open is unusual, and schedules built on fixed IST times can be an hour out. INRGIFT derives each session from the exchange’s own time zone rules, so the IST times shown already account for the change on the correct date.',
        ],
        example: 'In mid-March, after the US clocks change but before the UK ones do, the NYSE opens at 19:00 IST while London is still on winter time and closes at 22:00 IST. The two sessions overlap for three hours instead of the usual two and a half.',
      },
      {
        heading: 'Overlaps worth knowing',
        paragraphs: [
          'The Indian session overlaps with the second half of the Asian day and, in the afternoon, with the first two to three hours of European trading. India and the United States never overlap in regular hours. US news released before the New York open, such as economic data at 08:30 New York time, arrives at 18:00 or 19:00 IST, after Indian markets have closed.',
          'This is why Indian market news often refers to overnight moves in the United States and to the early indication from GIFT Nifty, which trades in long sessions at GIFT City that cover much of the Asian, European and US day.',
        ],
      },
      {
        heading: 'How INRGIFT shows sessions',
        paragraphs: [
          'The markets overview places every covered market on an IST time axis with its current status and the time to the next open or close. Each market page lists the regular session, any lunch break, pre-open and after-hours periods, and upcoming holidays.',
          'Status is derived per exchange from its calendar, not assumed from the clock. A market that is closed for a public holiday shows as closed even during its usual hours, and a half-day session shows its shortened close.',
        ],
      },
    ],
    related: [
      learn('us-market-hours-in-india', 'US market hours in India'),
      learn('european-market-hours-in-india', 'European market hours in India'),
      learn('asian-market-hours-in-india', 'Asian market hours in India'),
      learn('market-calendar-methodology', 'Market calendar methodology'),
      term('ist', 'India Standard Time (IST)'),
      page('/markets', 'Markets overview with IST session times'),
    ],
    glossary: ['ist', 'trading-session', 'data-status'],
  },
  {
    ...META,
    type: 'article',
    slug: 'us-market-hours-in-india',
    section: 'Global markets',
    title: 'US market hours in India',
    summary: 'The NYSE and Nasdaq trade from 09:30 to 16:00 New York time: 19:00 to 01:30 IST in the northern summer and 20:00 to 02:30 IST in winter.',
    keyPoints: [
      'Regular US hours are 09:30 to 16:00 Eastern Time on both the NYSE and Nasdaq.',
      'In IST that is 19:00 to 01:30 during US daylight saving and 20:00 to 02:30 otherwise.',
      'Pre-market and after-hours sessions exist but are thinner, and prices there can be less representative.',
      'US company results and economic data are often released outside regular hours.',
    ],
    sections: [
      {
        heading: 'Regular session',
        paragraphs: [
          'The New York Stock Exchange and Nasdaq both run a regular session from 09:30 to 16:00 Eastern Time, Monday to Friday, except on US market holidays. The opening and closing prices come from auctions held at those times, and the official close is the price most data providers use for daily returns.',
          'Eastern Time is UTC−5 in winter (Eastern Standard Time) and UTC−4 during daylight saving (Eastern Daylight Time). IST is UTC+5:30 all year. The gap between New York and India is therefore 10 hours 30 minutes in winter and 9 hours 30 minutes in summer.',
        ],
        example: 'In July, 09:30 Eastern Daylight Time is 13:30 UTC, which is 19:00 IST. The 16:00 close is 20:00 UTC, or 01:30 IST the next calendar day. In January, both times are one hour later in IST: 20:00 and 02:30.',
      },
      {
        heading: 'When daylight saving changes',
        paragraphs: [
          'US daylight saving begins on the second Sunday of March and ends on the first Sunday of November. From the following Monday, the IST opening time moves: to 19:00 in March and back to 20:00 in November.',
          'Because a US session that ends after midnight IST crosses into the next calendar day in India, dates can be confusing. INRGIFT labels the US close with the New York trading date, and shows the IST time with its own date when the two differ.',
        ],
      },
      {
        heading: 'Extended hours',
        paragraphs: [
          'Many US venues allow trading before the open, from as early as 04:00 Eastern Time, and after the close, until 20:00 Eastern Time. Activity in these sessions is much thinner, spreads are usually wider, and prices can move sharply on small volumes.',
          'Pre-market prices are a rough indication of sentiment, not a reliable preview of the open. Daily performance figures on INRGIFT use regular-session closing prices; extended-hours moves are labelled as such where a provider supplies them.',
        ],
      },
      {
        heading: 'Holidays and early closes',
        paragraphs: [
          'US markets close for federal holidays such as Independence Day, Thanksgiving and Christmas, and for Good Friday. Some days, such as the day after Thanksgiving and some Christmas Eves, have an early close at 13:00 Eastern Time.',
          'Indian and US holidays rarely coincide. On an Indian holiday the US session still runs as normal, and the reverse is also true, which can make next-day comparisons uneven.',
        ],
      },
      {
        heading: 'Results and data outside the session',
        paragraphs: [
          'Most large US companies release quarterly results either before the open or after the close. For a reader in India, before-the-open releases typically land in the late afternoon or early evening IST and after-the-close releases in the early morning hours IST.',
          'Major US economic releases, such as employment and inflation data, are usually published at 08:30 Eastern Time, which is 18:00 or 19:00 IST. The earnings and economic calendars on INRGIFT show these events in IST with the source time zone alongside.',
        ],
      },
    ],
    related: [
      learn('global-markets-from-india', 'Global market hours in IST'),
      learn('market-calendar-methodology', 'Market calendar methodology'),
      term('trading-session', 'Trading session'),
      page('/markets/US', 'United States market page'),
      page('/resources/earnings', 'Earnings calendar'),
      page('/indices/SP-500', 'S&P 500'),
    ],
    glossary: ['trading-session', 'ist', 'liquidity'],
  },
  {
    ...META,
    type: 'article',
    slug: 'european-market-hours-in-india',
    section: 'Global markets',
    title: 'European market hours in India',
    summary: 'London and Frankfurt open during the Indian afternoon and close in the late evening IST. Their summer time starts and ends on different dates from the US.',
    keyPoints: [
      'London trades 08:00 to 16:30 local time; Xetra in Frankfurt trades 09:00 to 17:30 local time.',
      'Both map to 13:30 to 22:00 IST in winter and 12:30 to 21:00 IST in summer.',
      'European summer time runs from the last Sunday of March to the last Sunday of October.',
      'The Indian and European sessions overlap for two to three hours each weekday.',
    ],
    sections: [
      {
        heading: 'London',
        paragraphs: [
          'The London Stock Exchange runs continuous trading from 08:00 to 16:30 London time, with an opening auction before 08:00 and a closing auction after 16:30. London is on Greenwich Mean Time (UTC+0) in winter and British Summer Time (UTC+1) in summer.',
          'In IST, London trades from 13:30 to 22:00 in winter and from 12:30 to 21:00 in summer. The opening hour therefore overlaps with the last two to three hours of the Indian session.',
        ],
        example: 'In December, 08:00 GMT is 08:00 UTC, which is 13:30 IST. In June, 08:00 BST is 07:00 UTC, which is 12:30 IST. The local time stays fixed; only the IST equivalent moves.',
      },
      {
        heading: 'Frankfurt and continental Europe',
        paragraphs: [
          'Germany’s main electronic venue, Xetra, trades from 09:00 to 17:30 Central European Time. Central European Time is UTC+1 in winter and UTC+2 in summer, so Xetra’s hours in IST are the same as London’s: 13:30 to 22:00 in winter and 12:30 to 21:00 in summer.',
          'Most other large continental exchanges, including Euronext markets such as Paris and Amsterdam, follow similar local hours, so continental Europe tends to open and close together.',
        ],
      },
      {
        heading: 'Summer time dates',
        paragraphs: [
          'The United Kingdom and the European Union both move clocks forward on the last Sunday of March and back on the last Sunday of October. These are different dates from the United States, which changes on the second Sunday of March and the first Sunday of November.',
          'For a few weeks each year, the gap between the European close and the US open changes. INRGIFT calculates session times from each exchange’s own time zone, so this is reflected automatically on the markets overview.',
        ],
      },
      {
        heading: 'Why the overlap matters',
        paragraphs: [
          'Europe opening in the Indian afternoon means news from European companies and economic data released in the European morning arrives while Indian markets are still trading. Moves in European banks, energy or industrial companies can influence sentiment in related Indian sectors late in the day.',
          'After the Indian close, European trading continues for several hours and overlaps with the first part of the US session. By the time Indian markets reopen the next morning, two further regions have traded.',
        ],
      },
      {
        heading: 'Holidays',
        paragraphs: [
          'European exchanges close for some shared holidays, such as Good Friday, Easter Monday and Christmas, and for national holidays that differ by country. The UK has bank holidays that continental exchanges do not observe, and the reverse is also true.',
          'Each market page on INRGIFT lists upcoming holidays and half-days, and the calendar shows them alongside earnings and dividend events.',
        ],
      },
    ],
    related: [
      learn('global-markets-from-india', 'Global market hours in IST'),
      learn('us-market-hours-in-india', 'US market hours in India'),
      page('/markets/UK', 'United Kingdom market page'),
      page('/markets/Germany', 'Germany market page'),
      page('/resources/calendar', 'Market calendar'),
    ],
    glossary: ['trading-session', 'ist'],
  },
  {
    ...META,
    type: 'article',
    slug: 'asian-market-hours-in-india',
    section: 'Global markets',
    title: 'Asian market hours in India',
    summary: 'Tokyo opens before dawn in India, China and Hong Kong open around 07:00 IST, and several Asian markets pause for lunch. None of them use daylight saving.',
    keyPoints: [
      'Tokyo trades 05:30 to 12:00 IST with a lunch break from 08:00 to 09:00 IST.',
      'Hong Kong trades 07:00 to 13:30 IST with a lunch break from 09:30 to 10:30 IST.',
      'Shanghai and Shenzhen trade 07:00 to 09:00 and 10:30 to 12:30 IST.',
      'Japan, China, Hong Kong and Singapore keep the same IST times all year.',
    ],
    sections: [
      {
        heading: 'Japan',
        paragraphs: [
          'The Tokyo Stock Exchange trades from 09:00 to 15:30 Japan Standard Time, with a lunch break from 11:30 to 12:30. Japan Standard Time is UTC+9, three and a half hours ahead of IST, and Japan does not use daylight saving.',
          'In IST, the morning session runs from 05:30 to 08:00 and the afternoon session from 09:00 to 12:00. By the time Indian markets open at 09:15, Tokyo is already in its afternoon session.',
        ],
        example: 'A Tokyo close at 15:30 JST is 06:30 UTC. Adding five and a half hours gives 12:00 IST, the same time all year.',
      },
      {
        heading: 'Hong Kong and mainland China',
        paragraphs: [
          'Hong Kong Exchanges trades from 09:30 to 16:00 Hong Kong time with a lunch break from 12:00 to 13:00. Hong Kong time is UTC+8, two and a half hours ahead of IST, so the session runs from 07:00 to 13:30 IST with lunch from 09:30 to 10:30 IST.',
          'The Shanghai and Shenzhen exchanges trade from 09:30 to 11:30 and from 13:00 to 15:00 China Standard Time, also UTC+8. In IST that is 07:00 to 09:00 and 10:30 to 12:30. Mainland exchanges also apply daily price limits on most shares, which affects how sharply individual prices can move in one session.',
        ],
      },
      {
        heading: 'Singapore, Korea and Australia',
        paragraphs: [
          'SGX securities trading runs from 09:00 to 17:00 Singapore time (UTC+8), which is 06:30 to 14:30 IST. Korea Exchange trades from 09:00 to 15:30 Korea time (UTC+9), or 05:30 to 12:00 IST.',
          'Australia is the exception in the region: it observes daylight saving in the southern summer. The ASX opens at 10:00 Sydney time, which falls in the early hours IST, and the IST equivalent moves by an hour when Australian clocks change in October and April.',
        ],
      },
      {
        heading: 'Why lunch breaks matter',
        paragraphs: [
          'A lunch break splits the day into two sessions, each with its own open. News released during the break, such as a company announcement or official data, is reflected only when trading resumes, which can produce a gap at the afternoon open.',
          'INRGIFT shows a market in a lunch break as closed for that interval, with the time the afternoon session resumes. Prices shown during the break are the last prices from the morning session.',
        ],
      },
      {
        heading: 'Asia and the Indian morning',
        paragraphs: [
          'For readers in India, Asian markets provide the first trading reaction to overnight events in the United States and Europe. Because Tokyo, Seoul, Hong Kong and Shanghai have all traded for some time before 09:15 IST, their direction is often discussed in Indian pre-open commentary.',
          'These markets are not a forecast of the Indian session; their sector mix and local drivers differ. The heatmap can group Asian markets by country or sector to show whether a morning move is broad or limited to a few industries.',
        ],
      },
    ],
    related: [
      learn('global-markets-from-india', 'Global market hours in IST'),
      page('/markets/Japan', 'Japan market page'),
      page('/markets/Hong-Kong', 'Hong Kong market page'),
      term('trading-session', 'Trading session'),
      page('/discover/heatmap', 'Global heatmap'),
    ],
    glossary: ['trading-session', 'ist'],
  },
  {
    ...META,
    type: 'article',
    slug: 'understanding-global-exchanges',
    section: 'Global markets',
    title: 'Understanding global exchanges',
    summary: 'What an exchange does, how listing and trading differ, and why one company can appear on several exchanges with different prices and currencies.',
    keyPoints: [
      'Exchanges list securities, run trading sessions and publish official prices.',
      'A company has one issuer identity but can have several listings and securities.',
      'Session design, tick sizes, price limits and settlement cycles differ by exchange.',
      'Prices for the same company on two exchanges differ mainly through currency and timing.',
    ],
    sections: [
      {
        heading: 'What an exchange does',
        paragraphs: [
          'An exchange does three main jobs. It admits securities to listing, which requires the issuer to meet standards and make ongoing disclosures. It runs a trading system where bids and offers are matched during set sessions. And it publishes market data, including the official opening and closing prices used by index providers and funds.',
          'Exchanges work with clearing houses and depositories, which confirm who owns what after each trade and settle the cash and securities. In India, settlement for most equities happens on the next trading day; in the United States it is also the next business day. Settlement cycles elsewhere vary.',
        ],
      },
      {
        heading: 'Session design',
        paragraphs: [
          'Most exchanges open with an auction that gathers interest before continuous trading begins, run continuous trading through the day, and close with another auction. Some, mainly in Asia, add a lunch break. Some apply price bands that halt or limit trading in a share after a large move, and many have market-wide circuit breakers.',
          'Tick size, the smallest allowed price increment, and lot size, the minimum quantity, also differ. These details explain why prices in one market move in steps of ₹0.05 while another moves in fractions of a cent.',
        ],
      },
      {
        heading: 'Issuers, securities and listings',
        paragraphs: [
          'INRGIFT separates three ideas. An issuer is the company. A security is a specific instrument it has issued, such as a class of ordinary shares or a depositary receipt. A listing is that security admitted to trading on a particular exchange, in a particular currency, under a particular ticker.',
          'One issuer can therefore have several securities and several listings. An Indian company may list ordinary shares on both the NSE and BSE and have depositary receipts in New York or London. A European company may list the same shares in its home market and on a second exchange.',
        ],
      },
      {
        heading: 'Why prices differ between listings',
        paragraphs: [
          'Two listings of the same company usually trade close to each other once currency and the conversion ratio are accounted for. Remaining differences come from timing, because the two markets may not be open at the same time, from fees and restrictions that limit cross-market arbitrage, and from local demand.',
        ],
        example: 'Suppose one depositary receipt represents two ordinary shares. The home listing closes at ₹1,500, so two shares are worth ₹3,000. At a reference rate of ₹85 per dollar that is about $35.29. If the receipt trades at $36.00, it stands at a premium of about 2% to the converted home price.',
      },
      {
        heading: 'Exchanges at GIFT City',
        paragraphs: [
          'India also has exchanges in the International Financial Services Centre at GIFT City, Gujarat: NSE International Exchange (NSE IX) and India INX. They operate in foreign currency, mainly US dollars, under the IFSC regulator, and run much longer sessions than the domestic exchanges.',
        ],
      },
      {
        heading: 'Reading exchange information on INRGIFT',
        paragraphs: [
          'Each asset page has an issuer, securities and listings panel that shows every listing INRGIFT knows about for that issuer, with its exchange, currency, ticker and, for depositary receipts, the ratio to the underlying share. Market pages show each exchange’s session times, holidays and current status.',
        ],
      },
    ],
    related: [
      learn('global-stock-markets-explained', 'Global stock markets explained'),
      learn('gift-city', 'What GIFT City is'),
      term('depositary-receipt', 'Depositary receipt (ADR/GDR)'),
      term('share-class', 'Share class'),
      page('/markets/all', 'All markets'),
    ],
    glossary: ['depositary-receipt', 'share-class', 'trading-session', 'liquidity'],
  },
  {
    ...META,
    type: 'article',
    slug: 'gift-city',
    section: 'Global markets',
    title: 'What GIFT City is',
    summary: 'GIFT City in Gujarat hosts India’s International Financial Services Centre, where exchanges such as NSE IX operate in foreign currency under their own regulator.',
    keyPoints: [
      'GIFT City (Gujarat International Finance Tec-City) is near Gandhinagar, Gujarat.',
      'It hosts India’s first International Financial Services Centre (IFSC), regulated by the IFSCA.',
      'NSE IX and India INX operate there, with products mainly denominated in US dollars.',
      'GIFT Nifty, NIFTY 50 derivatives traded on NSE IX, is widely watched outside Indian market hours.',
    ],
    sections: [
      {
        heading: 'A financial centre with its own rules',
        paragraphs: [
          'Gujarat International Finance Tec-City, usually called GIFT City, is a planned business district near Gandhinagar. Part of it is designated as an International Financial Services Centre, a zone where financial institutions can offer services in foreign currency, largely to non-resident clients and to residents within limits set by Indian law.',
          'Financial activity in the IFSC is regulated by a single authority, the International Financial Services Centres Authority (IFSCA), set up in 2020. Before that, banking, securities and insurance in the zone were overseen by separate regulators.',
        ],
      },
      {
        heading: 'Exchanges at GIFT City',
        paragraphs: [
          'Two exchanges operate in the IFSC: NSE International Exchange (NSE IX), set up by the National Stock Exchange, and India International Exchange (India INX), set up by BSE. Products are mainly denominated in US dollars and include index and stock derivatives, commodity derivatives and currency contracts.',
          'IFSC exchanges run much longer sessions than the domestic market. Trading starts before the NSE opens and continues well into the night IST, covering much of the Asian, European and US trading day.',
        ],
      },
      {
        heading: 'GIFT Nifty',
        paragraphs: [
          'GIFT Nifty refers to NIFTY 50 futures and related contracts traded on NSE IX. These contracts were listed in Singapore for many years; in 2023 the trading moved to GIFT City, and the contracts became known as GIFT Nifty.',
          'Because GIFT Nifty trades when the NSE is closed, its price is used as an early indication of where the NIFTY 50 may open. It is a futures price in US dollars, not the index itself, so it can differ from the next NSE open because of interest-rate effects, the time left to expiry and news that arrives before 09:15 IST.',
        ],
        example: 'If the NIFTY 50 closed at 24,000 and GIFT Nifty is quoted at 24,150 the next morning, the implied difference is about 0.6%. Part of that gap reflects the futures premium, not only overnight news, so the cash index may open at a different level.',
      },
      {
        heading: 'Why it matters for global research',
        paragraphs: [
          'The IFSC is designed to bring international financial activity that used to take place offshore into an Indian jurisdiction. Over time it has added fund management, banking units, aircraft leasing and international listings, alongside the exchanges.',
          'For readers following markets from India, GIFT City matters mainly as a source of price information outside domestic hours and as part of the infrastructure for cross-border investment. The rules on who can use IFSC products, and how, are set by Indian regulators and change from time to time, so the regulator’s own publications are the reference.',
        ],
      },
      {
        heading: 'On INRGIFT',
        paragraphs: [
          'INRGIFT lists NSE IX among India’s venues on the India market page and shows GIFT Nifty alongside the domestic indices, with its own data status and timestamp so it is clear when the quote was last updated.',
        ],
      },
    ],
    related: [
      learn('understanding-global-exchanges', 'Understanding global exchanges'),
      learn('global-markets-from-india', 'Global market hours in IST'),
      page('/markets/India', 'India market page'),
      page('/indices/NIFTY-50', 'NIFTY 50'),
      term('trading-session', 'Trading session'),
    ],
    glossary: ['trading-session', 'index', 'ist'],
  },
  {
    ...META,
    type: 'guide',
    slug: 'how-to-research-a-new-market',
    section: 'Global markets',
    title: 'How to research a new market',
    summary: 'A structured way to get to know an unfamiliar stock market: its size, sectors, currency, calendar, index and largest companies, using INRGIFT’s market and discovery tools.',
    keyPoints: [
      'Start with structure: size, sector mix and the benchmark index.',
      'Check the currency and how it has moved against the rupee.',
      'Learn the session times in IST, the holidays and any local rules.',
      'Use the heatmap and screener to see the largest companies and how concentrated the market is.',
    ],
    sections: [
      {
        heading: 'Begin with the market page',
        paragraphs: [
          'Every covered market has a page with its exchanges, benchmark indices, currency, current status and session times in IST. Read this first. It answers the practical questions — when the market is open, what it is priced in, and which index is used as its summary — before you look at any individual company.',
          'Note how many listed companies INRGIFT covers in that market and how large the largest ones are. A market dominated by a handful of very large companies behaves differently from one with a broad spread of mid-sized firms.',
        ],
      },
      {
        heading: 'Understand the benchmark',
        paragraphs: [
          'Open the main index page and look at what it holds. Most broad indices weight companies by free-float market capitalisation, so the largest companies drive most of the movement. Check the sector weights: an index that is 35% financials will react to interest rates differently from one that is 35% technology.',
          'Compare the index’s performance over several periods with an index you already know, such as the NIFTY 50 or the S&P 500. Use the compare tool so both lines are rebased to the same starting value.',
        ],
      },
      {
        heading: 'Look at the currency',
        paragraphs: [
          'For a rupee-based reader, the currency is half the story. Check how the market’s currency has moved against the rupee over the same periods. A strong local index return can be reduced, or increased, by the currency.',
        ],
        example: 'Suppose a market’s index rose 12% over a year in local currency, and that currency fell 5% against the rupee. In rupee terms the return is about 1.12 × 0.95 − 1 = 6.4%. If the currency had risen 5% instead, the rupee return would be about 17.6%.',
      },
      {
        heading: 'A step-by-step pass',
        paragraphs: [
          'The steps below give a repeatable first look at any market. They take less than an hour and leave you with a list of the companies and sectors that matter most.',
        ],
        list: [
          'Read the market page: exchanges, currency, sessions in IST and upcoming holidays.',
          'Open the benchmark index and note its largest constituents and sector weights.',
          'Open the heatmap, set the universe to that country and group by sector to see where value sits.',
          'In the screener, filter to the country and sort by market cap to list the largest companies.',
          'Compare the benchmark with a familiar index over 1Y and 5Y, and check the currency over the same periods.',
          'Read INRGIFT country and market research for context on structure and drivers.',
          'Add the companies you want to follow to a watchlist, and set alerts for events you want to hear about.',
        ],
      },
      {
        heading: 'Learn the local conventions',
        paragraphs: [
          'Markets differ in reporting calendars, dividend timing, accounting standards and trading rules. Japanese companies often report on a fiscal year ending in March, as many Indian companies do; most US companies use the calendar year. Some markets pay dividends once a year, others quarterly. Mainland China applies daily price limits; many developed markets do not.',
          'These conventions affect how figures look. A trailing P/E calculated three weeks before an annual report can be based on very old earnings in a market that reports only twice a year.',
        ],
      },
      {
        heading: 'Keep the limitations in view',
        paragraphs: [
          'Coverage and data depth vary by market. Some fields may show a dash because the source does not yet supply them for that market. The data status on each module shows freshness and source, and the methodology pages describe how each figure is calculated.',
        ],
      },
    ],
    related: [
      learn('global-stock-markets-explained', 'Global stock markets explained'),
      learn('currency-and-returns', 'How currency changes your return'),
      learn('how-to-read-the-global-heatmap', 'How to read the global heatmap'),
      page('/research/countries', 'Country research'),
      page('/markets/all', 'All markets'),
    ],
    glossary: ['index', 'country-allocation', 'sector-allocation', 'trading-session', 'market-capitalisation'],
  },
];

/* ------------------------------------------------------------------ */
/* Fundamental analysis                                                */
/* ------------------------------------------------------------------ */

const FUNDAMENTALS: LearnArticle[] = [
  {
    ...META,
    type: 'article',
    slug: 'reading-valuation',
    section: 'Fundamental analysis',
    title: 'Reading valuation multiples',
    summary: 'P/E, forward P/E, price to book, EV/EBITDA and price to sales each compare price with something different. A multiple only means something next to a comparison.',
    keyPoints: [
      'A multiple divides a price or value by something the business produces or owns.',
      'Equity multiples (P/E, P/B) use market cap; enterprise multiples (EV/EBITDA, EV/Sales) use enterprise value.',
      'Multiples need context: the company’s own history, its sector and its growth rate.',
      'A negative or tiny denominator makes a multiple meaningless, so it is shown as n/a.',
    ],
    sections: [
      {
        heading: 'What a multiple is',
        paragraphs: [
          'A valuation multiple is a ratio between what the market charges for a business and something the business produces or owns: earnings, sales, cash flow or book value. It turns companies of very different sizes into comparable numbers, in the same way that price per kilogram lets you compare packets of different weights.',
          'Multiples are shorthand. Behind each one is an assumption about future growth, profitability and risk. A high multiple means the market is paying a lot for each unit of today’s output, usually because it expects that output to grow or to be unusually durable.',
        ],
      },
      {
        heading: 'The common multiples',
        paragraphs: [
          'Each multiple answers a slightly different question, and the right one depends on the kind of business.',
        ],
        list: [
          'P/E (price to earnings): share price ÷ earnings per share. How much is paid for each rupee of profit.',
          'Forward P/E: price ÷ expected earnings per share for the next twelve months or next fiscal year. Depends on estimates.',
          'P/B (price to book): share price ÷ book value per share. Most used for banks and insurers, where assets are mostly financial.',
          'P/S (price to sales): market cap ÷ revenue. Useful when profits are negative or cyclical.',
          'EV/EBITDA: enterprise value ÷ earnings before interest, tax, depreciation and amortisation. Compares companies with different debt levels.',
          'EV/Sales: enterprise value ÷ revenue. Like P/S but debt-neutral.',
          'P/FCF: market cap ÷ free cash flow. How much is paid for each rupee of cash the business generates after investment.',
        ],
      },
      {
        heading: 'Equity value versus enterprise value',
        paragraphs: [
          'Multiples built on market cap measure the value of shareholders’ equity only, so they belong with figures that belong to shareholders, such as net profit. Multiples built on enterprise value measure the whole business, debt included, so they belong with figures earned before lenders are paid, such as EBITDA or revenue.',
          'Mixing the two is a common error. Comparing market cap with EBITDA flatters a heavily indebted company, because its equity is small relative to the operating earnings that also have to service debt.',
        ],
        example: 'Two companies each earn ₹500 crore of EBITDA and have a market cap of ₹4,000 crore. Company A has no debt and ₹500 crore of cash, so EV is ₹3,500 crore and EV/EBITDA is 7.0×. Company B has ₹2,000 crore of net debt, so EV is ₹6,000 crore and EV/EBITDA is 12.0×. Their market caps are identical; their businesses are priced very differently.',
      },
      {
        heading: 'Context is everything',
        paragraphs: [
          'A P/E of 30 is neither high nor low on its own. It may be below the company’s own ten-year average, above its sector median, and reasonable for a company growing earnings at 25% a year but expensive for one growing at 5%. Read a multiple against at least one of three references: history, peers and growth.',
          'Sectors carry structurally different multiples. Software companies with high margins and little capital need usually trade at higher multiples than utilities or steel producers. Comparing a multiple across sectors says more about the sectors than about the companies.',
        ],
      },
      {
        heading: 'When multiples break',
        paragraphs: [
          'A multiple with a negative or near-zero denominator is not meaningful. A loss-making company has no sensible P/E, and a company with tiny profits can show a P/E of several hundred. INRGIFT shows n/a where the denominator is negative, rather than a negative multiple.',
          'Accounting one-offs also distort multiples. A large gain from disposing of a division inflates earnings for one year and makes the trailing P/E look low. Where possible, compare with multiples based on underlying or adjusted figures and read the financial statements for the cause.',
        ],
      },
      {
        heading: 'How INRGIFT shows valuation',
        paragraphs: [
          'The valuation section on each stock page shows the main multiples beside the median for the company’s sector, so the comparison is built in. The screener can filter on any multiple, including relative filters such as P/E below a stated value, and the compare tool lines up up to four companies side by side.',
        ],
      },
    ],
    related: [
      learn('pe-ratio-explained', 'P/E ratio explained'),
      learn('enterprise-value-explained', 'Enterprise value explained'),
      term('ev-ebitda', 'EV / EBITDA'),
      page('/discover/screener', 'Screen by valuation'),
      page('/discover/compare', 'Compare companies'),
    ],
    glossary: ['p-e-ratio', 'ev-ebitda', 'enterprise-value', 'market-capitalisation', 'free-cash-flow'],
  },
  {
    ...META,
    type: 'article',
    slug: 'pe-ratio-explained',
    section: 'Fundamental analysis',
    title: 'P/E ratio explained',
    summary: 'The price-to-earnings ratio divides the share price by earnings per share. It is the most quoted valuation measure and one of the easiest to misread.',
    keyPoints: [
      'P/E = share price ÷ earnings per share (EPS).',
      'Trailing P/E uses the last twelve months of reported earnings; forward P/E uses estimates.',
      'Earnings yield, the inverse of P/E, allows comparison with bond yields.',
      'P/E is not meaningful for loss-making companies and is distorted by one-off items.',
    ],
    sections: [
      {
        heading: 'The formula',
        paragraphs: [
          'The P/E ratio divides the current share price by earnings per share. Earnings per share is net profit attributable to ordinary shareholders divided by the number of shares outstanding. The same result comes from dividing market capitalisation by total net profit.',
          'Read literally, P/E is the number of years of current profit it would take to add up to the price, if profit stayed flat and was all paid out. That reading is too simple, because profit rarely stays flat, but it gives an intuition for why a P/E of 50 implies high expectations.',
        ],
        example: 'A company earned ₹2,400 crore of net profit over the last four quarters and has 80 crore shares, so EPS is ₹30. At a share price of ₹750, the trailing P/E is 750 ÷ 30 = 25×. Its earnings yield is 1 ÷ 25 = 4%.',
      },
      {
        heading: 'Trailing and forward',
        paragraphs: [
          'Trailing P/E uses reported earnings for the last twelve months. It is factual but backward-looking. Forward P/E uses an estimate of earnings for the next twelve months or the next fiscal year. It looks ahead but depends on estimates that can be wrong and are revised often.',
          'For a company with rapidly growing profits, the forward P/E will be well below the trailing one. For a company whose profits are expected to fall, the reverse is true. A large gap between the two is a signal to look at what is driving the expected change.',
        ],
      },
      {
        heading: 'Growth and the PEG ratio',
        paragraphs: [
          'Because P/E depends heavily on expected growth, some readers divide it by the expected annual earnings growth rate to get the PEG ratio. A P/E of 30 with expected growth of 30% gives a PEG of 1.0; a P/E of 15 with growth of 5% gives a PEG of 3.0.',
          'PEG adds context but also adds an estimate, and it treats all growth as equal regardless of how durable or capital-hungry it is. It is a rough adjustment, not a precise valuation.',
        ],
      },
      {
        heading: 'Earnings yield and interest rates',
        paragraphs: [
          'Inverting P/E gives the earnings yield: EPS ÷ price. A P/E of 20 corresponds to an earnings yield of 5%. Comparing earnings yield with government bond yields is one way to think about how equity valuations relate to interest rates. When bond yields rise, the income available without equity risk rises, and equity multiples often come under pressure.',
          'Earnings yield is not the same as cash returned. Companies keep part of their profit to reinvest, and profit is an accounting figure that can differ from cash generated.',
        ],
      },
      {
        heading: 'Common pitfalls',
        paragraphs: [
          'Several situations make P/E misleading. Check for these before drawing conclusions.',
        ],
        list: [
          'Losses: a negative EPS gives no meaningful P/E; INRGIFT shows n/a.',
          'One-off items: asset sales, write-downs or tax credits can inflate or depress a single year’s profit.',
          'Cyclical peaks: at the top of a cycle, profits are high and P/E looks low just before profits fall.',
          'Share count changes: large issuance or repurchases change EPS without changing total profit.',
          'Different accounting standards: profit under Ind AS, IFRS and US GAAP is broadly similar but not identical.',
        ],
      },
      {
        heading: 'Using P/E on INRGIFT',
        paragraphs: [
          'Stock pages show trailing and, where available, forward P/E beside the sector median. The screener can filter by P/E using operators such as at most, between or below a field, so you can, for example, list companies whose P/E is below their sector median. The compare tool shows P/E for up to four companies at once.',
        ],
      },
    ],
    related: [
      learn('reading-valuation', 'Reading valuation multiples'),
      term('p-e-ratio', 'P/E ratio'),
      learn('revenue-growth-explained', 'Revenue growth explained'),
      page('/discover/screener', 'Screen by P/E'),
      page('/stocks/AAPL', 'Example stock page: Apple'),
    ],
    glossary: ['p-e-ratio', 'market-capitalisation', 'yield', 'revenue-growth'],
  },
  {
    ...META,
    type: 'article',
    slug: 'enterprise-value-explained',
    section: 'Fundamental analysis',
    title: 'Enterprise value explained',
    summary: 'Enterprise value adds debt to market capitalisation and subtracts cash, giving a value for the whole business that does not depend on how it is financed.',
    keyPoints: [
      'EV = market cap + total debt − cash and cash equivalents.',
      'Some definitions also add preferred equity and minority interests.',
      'EV is the base for debt-neutral multiples such as EV/EBITDA and EV/Sales.',
      'EV is less meaningful for banks and insurers, whose debt is part of their operations.',
    ],
    sections: [
      {
        heading: 'The idea',
        paragraphs: [
          'Market capitalisation values only the shareholders’ part of a company. A business is also financed by lenders, and any acquirer of the whole company would take on its debt and receive its cash. Enterprise value tries to capture that whole: the value of the operating business regardless of the mix of debt and equity used to fund it.',
          'Think of a house financed with a mortgage attached. The price you pay the seller is the equity. The total cost of the house includes the mortgage you take over. Any cash left in the house reduces what you are effectively paying.',
        ],
      },
      {
        heading: 'The calculation',
        paragraphs: [
          'The basic formula is market cap plus total debt minus cash and cash equivalents. Total debt includes short-term and long-term borrowings and, under current accounting standards, usually lease liabilities. Fuller definitions also add preferred shares and minority interests, the share of subsidiaries owned by outsiders, because those are claims on the consolidated business too.',
          'Debt minus cash is often called net debt. A company with more cash than debt has negative net debt, and its enterprise value is below its market cap.',
        ],
        example: 'A company has a market cap of ₹20,000 crore, total debt of ₹6,000 crore and cash of ₹1,500 crore. Its enterprise value is 20,000 + 6,000 − 1,500 = ₹24,500 crore. If its EBITDA is ₹3,500 crore, EV/EBITDA is 24,500 ÷ 3,500 = 7.0×.',
      },
      {
        heading: 'Why use EV',
        paragraphs: [
          'EV allows fair comparison between companies with different financing. Two companies with identical operations can have very different market caps if one borrowed heavily and the other did not. Their EVs will be similar, because the extra debt shows up on one side and the smaller equity on the other.',
          'This is why EV is paired with measures of operating performance that come before interest is paid, such as EBITDA, EBIT and revenue. The ratio then compares the value of the whole business with what the whole business earns.',
        ],
      },
      {
        heading: 'Where EV does not fit',
        paragraphs: [
          'For banks, insurers and other financial companies, borrowing and lending are the business itself. Customer funds and borrowings are raw materials, not just financing, so enterprise value is not a useful measure. Price to book and P/E are more common for these companies, and INRGIFT shows EV-based multiples as n/a for them.',
          'EV also depends on balance sheet figures that are updated only when a company reports, while market cap changes every trading day. Between reports, EV mixes a current price with debt and cash figures that may be months old.',
        ],
      },
      {
        heading: 'Practical cautions',
        paragraphs: [
          'Cash is not always free. Cash held in a country with capital controls, cash needed for daily operations, or cash pledged against loans is not fully available to an acquirer. Some analysts subtract only excess cash for this reason.',
          'Debt-like items such as pension deficits, large provisions or guarantees are not always in the reported debt figure. For companies where these are significant, reported EV can understate the true claims on the business.',
        ],
      },
    ],
    related: [
      learn('market-cap-explained', 'Market cap explained'),
      learn('reading-valuation', 'Reading valuation multiples'),
      term('enterprise-value', 'Enterprise value'),
      term('ev-ebitda', 'EV / EBITDA'),
      page('/discover/compare', 'Compare companies'),
    ],
    glossary: ['enterprise-value', 'ev-ebitda', 'market-capitalisation', 'free-cash-flow'],
  },
  {
    ...META,
    type: 'article',
    slug: 'revenue-growth-explained',
    section: 'Fundamental analysis',
    title: 'Revenue growth explained',
    summary: 'Revenue growth measures how fast a company’s sales are increasing. Its quality depends on where it comes from: volume, price, currency or acquisitions.',
    keyPoints: [
      'Revenue growth = (revenue this period ÷ revenue in the comparable period) − 1.',
      'Compare like periods: year on year for quarters, and use multi-year averages to smooth noise.',
      'Organic growth excludes acquisitions and currency effects.',
      'Growth only creates value if it is earned at returns above the cost of capital.',
    ],
    sections: [
      {
        heading: 'Measuring growth',
        paragraphs: [
          'Revenue growth compares sales in one period with sales in a comparable earlier period. For quarterly results the usual comparison is year on year, against the same quarter a year earlier, because many businesses are seasonal. Quarter-on-quarter comparisons can be useful for non-seasonal businesses but often mislead.',
          'Over several years, the compound annual growth rate (CAGR) gives the constant yearly rate that would take revenue from its starting value to its ending value. It smooths good and bad years into one figure.',
        ],
        example: 'Revenue grew from ₹4,000 crore to ₹6,400 crore over four years. Total growth is 60%. The CAGR is (6,400 ÷ 4,000)^(1/4) − 1 = 1.6^0.25 − 1 ≈ 12.5% a year, not 60 ÷ 4 = 15%.',
      },
      {
        heading: 'Where growth comes from',
        paragraphs: [
          'Revenue can rise because the company sold more units, charged higher prices, earned more in rupees because foreign currencies strengthened, or bought another business. Each source has different implications. Volume growth suggests rising demand or market share. Price growth suggests pricing power or inflation. Currency and acquisition growth may not repeat.',
          'Organic growth strips out acquisitions, disposals and currency effects to show the underlying business. Many companies report organic growth in their results commentary; where they do not, the notes to the accounts often allow an estimate.',
        ],
      },
      {
        heading: 'Growth and profitability together',
        paragraphs: [
          'Sales growth on its own does not guarantee rising profit. If costs grow faster than revenue, margins shrink. If growth requires heavy capital spending or working capital, cash flow can fall even as revenue rises. Read revenue growth alongside operating margin, free cash flow and return on invested capital.',
          'Growth adds value when the return on the capital needed to achieve it exceeds the cost of that capital. A company growing 20% a year at a 6% return on capital may be destroying value if its cost of capital is 11%.',
        ],
      },
      {
        heading: 'Reading growth across markets',
        paragraphs: [
          'Inflation differs between countries, so nominal growth rates are not directly comparable. Ten percent growth in a market with 5% inflation is roughly 5% real growth; ten percent in a market with 2% inflation is roughly 8%. Currency also matters: a US company’s dollar revenue growth converted to rupees will be higher if the dollar strengthened over the period.',
          'Fiscal years differ too. Many Indian and Japanese companies report on April–March years, while most US companies use calendar years. Trailing twelve-month figures help align them.',
        ],
      },
      {
        heading: 'What to look for',
        paragraphs: [
          'A useful first check is consistency: steady growth over several years usually says more than one exceptional year. A second check is whether growth is broad across segments or concentrated in one product or region. INRGIFT’s financials section shows revenue by year and quarter, and the screener’s growth filters can list companies by one-year and multi-year revenue growth.',
        ],
      },
    ],
    related: [
      learn('free-cash-flow-explained', 'Free cash flow explained'),
      learn('pe-ratio-explained', 'P/E ratio explained'),
      term('revenue-growth', 'Revenue growth'),
      term('roic', 'Return on invested capital (ROIC)'),
      page('/discover/screener', 'Screen by growth'),
    ],
    glossary: ['revenue-growth', 'roic', 'free-cash-flow'],
  },
  {
    ...META,
    type: 'article',
    slug: 'free-cash-flow-explained',
    section: 'Fundamental analysis',
    title: 'Free cash flow explained',
    summary: 'Free cash flow is operating cash flow minus capital expenditure: the cash a business generates after the investment needed to sustain and grow it.',
    keyPoints: [
      'FCF = operating cash flow − capital expenditure.',
      'It is harder to flatter than accounting profit, because it tracks actual cash.',
      'FCF yield = free cash flow ÷ market cap, and FCF margin = free cash flow ÷ revenue.',
      'FCF is lumpy: one year of heavy investment can make it negative without signalling trouble.',
    ],
    sections: [
      {
        heading: 'From profit to cash',
        paragraphs: [
          'Net profit is an accounting measure. It includes non-cash charges such as depreciation, recognises sales when earned rather than when paid, and treats capital spending as an asset rather than a cost. A company can report rising profit while its cash balance shrinks.',
          'The cash flow statement reconciles profit to cash. Operating cash flow starts from profit, adds back non-cash charges and adjusts for changes in working capital: receivables, inventories and payables. Capital expenditure, the money spent on plant, equipment and other long-lived assets, appears in the investing section.',
        ],
      },
      {
        heading: 'The calculation',
        paragraphs: [
          'Free cash flow is operating cash flow minus capital expenditure. It is the cash available, after keeping the business running and growing, to pay dividends, repurchase shares, reduce debt or make acquisitions.',
        ],
        example: 'A company reports operating cash flow of ₹1,800 crore and capital expenditure of ₹700 crore. Free cash flow is ₹1,100 crore. With revenue of ₹9,000 crore, the FCF margin is about 12.2%. With a market cap of ₹22,000 crore, the FCF yield is 1,100 ÷ 22,000 = 5%.',
      },
      {
        heading: 'Why readers watch it',
        paragraphs: [
          'Free cash flow is harder to shape with accounting choices than earnings. Sustained gaps between profit and FCF are worth investigating: they may come from customers paying more slowly, inventory building up, or capital spending that never seems to end.',
          'FCF is also the source of shareholder distributions over time. Dividends paid out of borrowed money or asset sales cannot continue indefinitely, while dividends covered by FCF have a firmer base.',
        ],
      },
      {
        heading: 'Reading FCF carefully',
        paragraphs: [
          'Capital expenditure is lumpy. A company building a new plant may show negative FCF for two or three years before the investment starts earning. Looking at FCF over several years, or comparing capital spending with depreciation, gives a fairer picture than one year alone.',
          'Definitions vary. Some providers deduct lease payments, interest paid or acquisitions; others do not. Under Ind AS and IFRS, interest paid may sit in operating or financing cash flows depending on the company’s choice, which changes FCF. INRGIFT states which definition it uses in the methodology notes for each source.',
          'For banks and insurers, cash flow statements reflect lending and customer funding and free cash flow is not a meaningful measure. It is shown as n/a for these companies.',
        ],
      },
      {
        heading: 'Where to find it on INRGIFT',
        paragraphs: [
          'The financials section of a stock page shows operating cash flow, capital expenditure and free cash flow by year. The valuation section shows price to free cash flow where FCF is positive. The screener includes FCF margin and FCF yield among its fundamental filters.',
        ],
      },
    ],
    related: [
      learn('enterprise-value-explained', 'Enterprise value explained'),
      learn('dividend-yield-explained', 'Dividend yield explained'),
      term('free-cash-flow', 'Free cash flow'),
      page('/discover/screener', 'Screen by free cash flow'),
      page('/stocks/NVDA', 'Example stock page: NVIDIA'),
    ],
    glossary: ['free-cash-flow', 'roic', 'yield', 'dividend-yield'],
  },
  {
    ...META,
    type: 'article',
    slug: 'dividend-yield-explained',
    section: 'Fundamental analysis',
    title: 'Dividend yield explained',
    summary: 'Dividend yield is annual dividends per share divided by the share price. A high yield can reflect a generous payer or a falling price, so the payout behind it matters.',
    keyPoints: [
      'Dividend yield = annual dividends per share ÷ share price.',
      'Trailing yield uses dividends paid in the last twelve months; indicated yield annualises the latest declared rate.',
      'The payout ratio shows how much of profit the dividend uses.',
      'To receive a dividend, shares must be held before the ex-dividend date.',
    ],
    sections: [
      {
        heading: 'The calculation',
        paragraphs: [
          'Dividend yield divides the dividends paid per share over a year by the current share price. It expresses the cash distribution as a percentage of what the share costs today, which makes companies of different share prices comparable.',
          'Because the price is in the denominator, yield rises when the price falls even if the dividend does not change. A sharply rising yield is often a sign of a falling price, and sometimes of a market expecting the dividend to be cut.',
        ],
        example: 'A company paid an interim dividend of ₹6 and a final dividend of ₹10 over the last twelve months, a total of ₹16 per share. At a price of ₹640, the trailing dividend yield is 16 ÷ 640 = 2.5%. If the price fell to ₹400 with no change in dividend, the yield would be 4.0%.',
      },
      {
        heading: 'Trailing and indicated yield',
        paragraphs: [
          'Trailing yield uses dividends actually paid in the last twelve months. Indicated or forward yield annualises the most recent declared dividend, for example multiplying a quarterly dividend by four. For companies that pay regular quarterly amounts, as many US companies do, the two are close. For companies that pay one large annual dividend and irregular specials, they can differ widely.',
          'Special dividends, one-off distributions from unusual profits or asset sales, inflate trailing yield for a year. They are worth separating from the regular payment.',
        ],
      },
      {
        heading: 'Is the dividend covered?',
        paragraphs: [
          'The payout ratio divides dividends by earnings. A payout of 40% leaves 60% of profit for reinvestment or debt reduction. A payout above 100% means the company is paying more than it earns, which cannot last unless profits recover. Comparing dividends with free cash flow gives a cash-based view of the same question.',
          'Mature, stable businesses such as utilities and consumer staples tend to have higher payout ratios. Fast-growing companies often pay little or nothing, preferring to reinvest.',
        ],
      },
      {
        heading: 'Dates that matter',
        paragraphs: [
          'A dividend has several dates. The declaration date is when the board announces it. The record date is when the company checks its register of shareholders. The ex-dividend date is set so that anyone acquiring the share on or after it is not entitled to the dividend; in markets with next-day settlement, it usually falls on the record date. The payment date is when cash is paid.',
          'On the ex-dividend date the share price usually opens lower by roughly the dividend amount, because new holders will not receive it.',
        ],
      },
      {
        heading: 'Taxes and currency',
        paragraphs: [
          'Dividends from foreign companies may be subject to withholding tax in the company’s home country, and to tax in India, with relief depending on the tax treaty between the two countries. The headline yield is a gross figure before these deductions.',
          'For a rupee-based reader, dividends from a foreign company are paid in its currency, so their rupee value moves with the exchange rate. INRGIFT shows yields in local terms and dividend amounts in the paying currency.',
        ],
      },
      {
        heading: 'On INRGIFT',
        paragraphs: [
          'Stock and ETF pages show trailing yield, dividend history and upcoming ex-dividend dates. The dividends calendar lists upcoming events across covered markets, and you can create an alert to be notified before an ex-dividend date. For companies that do not pay dividends, yield is shown as n/a, not zero.',
        ],
      },
    ],
    related: [
      learn('free-cash-flow-explained', 'Free cash flow explained'),
      term('dividend-yield', 'Dividend yield'),
      term('ex-dividend-date', 'Ex-dividend date'),
      page('/resources/dividends', 'Dividends calendar'),
      learn('how-alerts-work', 'How alerts work'),
    ],
    glossary: ['dividend-yield', 'ex-dividend-date', 'yield', 'free-cash-flow'],
  },
];

/* ------------------------------------------------------------------ */
/* Technical analysis, risk and currencies                             */
/* ------------------------------------------------------------------ */

const MARKET_BEHAVIOUR: LearnArticle[] = [
  {
    ...META,
    type: 'article',
    slug: 'technical-indicators',
    section: 'Technical analysis',
    title: 'Moving averages and RSI',
    summary: 'Moving averages describe trend and the relative strength index describes momentum. Both summarise what price has already done; neither predicts what it will do.',
    keyPoints: [
      'A simple moving average (SMA) is the average closing price over a set window, such as 50 or 200 days.',
      'An exponential moving average (EMA) gives more weight to recent prices, so it reacts faster.',
      'RSI compares the size of recent gains with recent losses on a 0 to 100 scale.',
      'Indicators are descriptive. They do not predict outcomes and work poorly in some conditions.',
    ],
    sections: [
      {
        heading: 'Simple moving averages',
        paragraphs: [
          'A simple moving average takes the closing prices over the last N trading days, adds them up and divides by N. Each day the oldest price drops out and the newest comes in, so the average moves along with the price but more smoothly. Short windows, such as 20 days, follow price closely. Long windows, such as 200 days, change slowly and describe the longer trend.',
          'Common readings compare price with its averages. Price above a rising 200-day average is usually described as a long-term uptrend; price below a falling one as a downtrend. When a shorter average crosses above a longer one, the event is often called a golden cross; the reverse is a death cross. These labels describe what has happened, not what will.',
        ],
        example: 'Closing prices over five days are ₹100, ₹102, ₹101, ₹105 and ₹107. The 5-day SMA is (100 + 102 + 101 + 105 + 107) ÷ 5 = ₹103. If the next close is ₹110, the ₹100 drops out and the new SMA is (102 + 101 + 105 + 107 + 110) ÷ 5 = ₹105.',
      },
      {
        heading: 'Exponential moving averages',
        paragraphs: [
          'An exponential moving average weights recent prices more than older ones. Each day, the new EMA equals the previous EMA plus a fraction of the difference between today’s close and the previous EMA. The fraction, called the smoothing factor, is usually 2 ÷ (N + 1). For a 20-day EMA it is about 0.095.',
          'Because of this weighting, an EMA turns sooner than an SMA of the same length after a change in direction. That responsiveness comes at a cost: it also reacts more to short-lived moves.',
        ],
      },
      {
        heading: 'Relative strength index',
        paragraphs: [
          'The relative strength index, developed by J. Welles Wilder, measures the balance of recent gains and losses, usually over 14 periods. It averages the gains on up days and the losses on down days, divides the first by the second to get relative strength (RS), and converts it to a 0 to 100 scale with RSI = 100 − 100 ÷ (1 + RS).',
          'Readings above 70 are conventionally called overbought and below 30 oversold. These words describe a stretch of unusually one-sided moves. In a strong trend, RSI can stay above 70 or below 30 for long periods while price keeps moving the same way.',
        ],
        example: 'Over 14 days, the average gain on up days is ₹1.20 and the average loss on down days is ₹0.80. RS = 1.20 ÷ 0.80 = 1.5, so RSI = 100 − 100 ÷ 2.5 = 60.',
      },
      {
        heading: 'Bollinger bands and volume',
        paragraphs: [
          'Bollinger bands draw lines two standard deviations above and below a 20-day simple moving average. The bands widen when prices become more volatile and narrow when they calm down. Price touching a band shows an unusually large move relative to recent volatility, not a turning point.',
          'Volume adds context. A price move on volume well above its average involved more participants than a move on thin volume. INRGIFT shows volume in a separate pane under the price chart.',
        ],
      },
      {
        heading: 'Limits of indicators',
        paragraphs: [
          'Every indicator is a transformation of past prices. It cannot contain information that is not in those prices, and it is always late: a moving average confirms a trend only after the trend is under way. In sideways markets, trend indicators give frequent false signals; in trending markets, momentum indicators such as RSI flag extremes too early.',
          'Indicators also depend on settings. A 14-day RSI and a 9-day RSI on the same chart can give different readings. Choosing the setting that would have worked best in the past is a common way to overestimate how useful an indicator is.',
        ],
      },
      {
        heading: 'On INRGIFT charts',
        paragraphs: [
          'Asset charts can overlay SMA, EMA and Bollinger bands, and show volume or RSI in a lower pane. The technicals section lists current values such as price relative to the 50-day and 200-day averages and the 14-day RSI. The screener’s technical filters let you compare price with a moving average using the above field and below field operators.',
        ],
      },
    ],
    related: [
      term('moving-average', 'Moving average'),
      term('rsi', 'Relative strength index (RSI)'),
      learn('understanding-risk', 'Volatility, beta and drawdown'),
      page('/discover/screener', 'Screen by technical indicators'),
      page('/indices/NIFTY-50', 'NIFTY 50 chart'),
    ],
    glossary: ['moving-average', 'rsi', 'volatility'],
  },
  {
    ...META,
    type: 'article',
    slug: 'understanding-risk',
    section: 'Risk',
    title: 'Beta, volatility and drawdown explained',
    summary: 'Volatility measures how widely returns vary, beta measures sensitivity to a benchmark, and maximum drawdown measures the deepest fall. Each answers a different question.',
    keyPoints: [
      'Annualised volatility = standard deviation of daily returns × √252.',
      'Beta measures how much an asset has tended to move when its benchmark moves.',
      'Maximum drawdown is the largest peak-to-trough fall over a period.',
      'All three are measured on past data and change with the period chosen.',
    ],
    sections: [
      {
        heading: 'Volatility',
        paragraphs: [
          'Volatility is the standard deviation of returns: a measure of how far individual returns tend to spread around their average. A share whose daily returns are mostly within ±0.5% is less volatile than one that regularly moves ±3%.',
          'Volatility is usually calculated from daily returns and then annualised so that assets can be compared on one scale. Because daily returns are roughly independent, variance grows in proportion to time, so standard deviation grows with the square root of time. Multiplying daily standard deviation by the square root of 252, the approximate number of trading days in a year, gives annualised volatility.',
        ],
        example: 'A share’s daily returns over the last year have a standard deviation of 1.5%. Its annualised volatility is 1.5% × √252 ≈ 1.5% × 15.87 ≈ 23.8%. An index with daily standard deviation of 0.9% has annualised volatility of about 14.3%.',
      },
      {
        heading: 'Beta',
        paragraphs: [
          'Beta measures how much an asset’s returns have moved with a benchmark’s returns. Statistically, it is the covariance of the asset’s returns with the benchmark’s, divided by the variance of the benchmark’s returns. A beta of 1.0 means the asset has tended to move in line with the benchmark; 1.5 means about 1.5 times as much; 0.5 means about half as much.',
          'Beta captures only the part of risk linked to the benchmark. A share with low beta can still be very volatile if most of its moves come from company-specific news. Beta also depends on the benchmark chosen: a US technology share has one beta against the S&P 500 and another against a global index.',
        ],
      },
      {
        heading: 'Maximum drawdown',
        paragraphs: [
          'Maximum drawdown is the largest percentage fall from a peak to a subsequent trough before a new peak is reached. It answers the question volatility does not: how bad was the worst stretch? Two assets with the same volatility can have very different drawdowns if one fell steadily for a long period.',
          'Drawdown also shows how long recovery took. A 50% fall needs a 100% rise to get back to the previous peak, which is why deep drawdowns can take years to recover.',
        ],
        example: 'An index peaks at 20,000, falls to 14,000 and later recovers. The drawdown is (14,000 − 20,000) ÷ 20,000 = −30%. To return to 20,000 from 14,000 requires a rise of 6,000 ÷ 14,000 ≈ 42.9%.',
      },
      {
        heading: 'Reading them together',
        paragraphs: [
          'Each measure describes a different aspect of risk. Volatility describes the typical size of moves, beta the link to the broader market, and drawdown the worst experience over the period. A sensible reading looks at all three, over more than one period.',
          'Risk-adjusted measures such as the Sharpe ratio combine return and volatility into one number: excess return over a risk-free rate, divided by volatility. They are useful for comparing assets with different risk levels but inherit all the limitations of volatility as a risk measure.',
        ],
      },
      {
        heading: 'Limitations',
        paragraphs: [
          'These measures are calculated from the past. A share that has been calm for three years can become volatile quickly when its circumstances change. Results also depend on the period: a one-year beta and a five-year beta for the same share can differ substantially.',
          'Volatility treats rises and falls the same way and assumes a fairly regular distribution of returns. Real returns include occasional very large moves that standard deviation understates. For a rupee-based reader, the currency adds its own volatility to foreign assets.',
        ],
      },
      {
        heading: 'On INRGIFT',
        paragraphs: [
          'The risk section of asset pages shows annualised volatility, beta against the stated benchmark and maximum drawdown for several periods. The screener’s risk filters include all three, and the heatmap can colour tiles by volatility instead of performance. The performance calculation methodology describes each formula in detail.',
        ],
      },
    ],
    related: [
      learn('performance-calculation-methodology', 'Performance calculation methodology'),
      term('beta', 'Beta'),
      term('volatility', 'Volatility'),
      term('maximum-drawdown', 'Maximum drawdown'),
      term('sharpe-ratio', 'Sharpe ratio'),
      page('/discover/heatmap', 'Heatmap coloured by volatility'),
    ],
    glossary: ['volatility', 'beta', 'maximum-drawdown', 'sharpe-ratio', 'index'],
  },
  {
    ...META,
    type: 'article',
    slug: 'currency-and-returns',
    section: 'Currencies',
    title: 'How currency changes your return',
    summary: 'For a rupee-based reader, a foreign asset’s return combines the asset’s move in its own currency with the move in that currency against the rupee.',
    keyPoints: [
      'Rupee return = (1 + local return) × (1 + currency return) − 1.',
      'Adding the two returns is a close approximation only when both are small.',
      'Currency can add to or subtract from returns, and its effect can dominate over short periods.',
      'INRGIFT calculates performance in local currency and shows INR values as approximate.',
    ],
    sections: [
      {
        heading: 'Two returns, multiplied',
        paragraphs: [
          'When a rupee-based reader follows a US share, two prices matter: the share price in dollars, and the number of rupees per dollar. If both rise, the rupee value rises by more than either alone. If the share rises but the dollar weakens, part of the gain disappears in rupee terms.',
          'The returns compound rather than add. The rupee return equals one plus the local return, multiplied by one plus the currency return, minus one. For small moves, adding them is close enough; for large moves, the cross term matters.',
        ],
        example: 'A US share rises 10% in dollars over a year, and USD/INR rises from 84.00 to 86.52, a 3% gain for the dollar. The rupee return is 1.10 × 1.03 − 1 = 13.3%. If the dollar had fallen 3% instead, the rupee return would be 1.10 × 0.97 − 1 = 6.7%.',
      },
      {
        heading: 'Reading currency quotes',
        paragraphs: [
          'A quote such as USD/INR 85.00 means one US dollar costs 85 rupees. If the quote rises, the dollar has strengthened and the rupee has weakened. For a rupee-based reader with dollar assets, a rising USD/INR adds to returns.',
          'Some pairs are quoted the other way round, with the rupee as the base. Always check which currency is on the left before reading the direction of a move.',
        ],
      },
      {
        heading: 'Why currencies move',
        paragraphs: [
          'Over long periods, currencies of countries with higher inflation have tended to weaken against those with lower inflation, because each unit buys less. Over shorter periods, interest rate differences, trade balances, capital flows and central bank actions drive exchange rates, and moves can be sharp and unpredictable.',
          'The rupee has weakened against the US dollar over most long periods, partly reflecting India’s higher inflation. That history does not determine future moves, and there have been long stretches where the rupee was stable or stronger.',
        ],
      },
      {
        heading: 'Currency within a fund',
        paragraphs: [
          'An ETF that holds shares in several countries carries several currency exposures at once. A global fund priced in dollars still has exposure to the euro, yen and other currencies through its underlying shares. Some funds hedge currency, which removes most of the currency effect at a cost; most broad index ETFs do not.',
          'Country allocation therefore doubles as a rough currency allocation for an unhedged fund.',
        ],
      },
      {
        heading: 'How INRGIFT handles currency',
        paragraphs: [
          'Prices and performance are shown in the asset’s listing currency, because that is what the exchange publishes. An approximate INR value is shown alongside using a reference exchange rate, with its source and timestamp. It is labelled as approximate because the reference rate is not the rate any particular bank or service would apply.',
          'The USD/INR page shows the reference rate and its history, and the compare tool can place a foreign index beside USD/INR to show how much of a rupee return came from currency.',
        ],
      },
    ],
    related: [
      page('/fx/USD-INR', 'USD/INR reference rate'),
      page('/assets/fx', 'Currencies'),
      learn('global-stock-markets-explained', 'Global stock markets explained'),
      learn('country-allocation-explained', 'Country allocation explained'),
      learn('performance-calculation-methodology', 'Performance calculation methodology'),
    ],
    glossary: ['country-allocation', 'volatility', 'etf'],
  },
];

/* ------------------------------------------------------------------ */
/* ETFs                                                                */
/* ------------------------------------------------------------------ */

const ETF_ARTICLES: LearnArticle[] = [
  {
    ...META,
    type: 'article',
    slug: 'etf-basics',
    section: 'ETFs',
    title: 'What is an ETF?',
    summary: 'An exchange-traded fund is a pooled fund whose units are listed on an exchange. Most track an index, so their job is to match it closely at low cost.',
    keyPoints: [
      'An ETF holds a basket of securities and issues units that trade on an exchange through the day.',
      'Most ETFs track an index; their aim is to match it, not beat it.',
      'Cost (expense ratio), size (AUM) and accuracy (tracking difference) do most of the work in reading an ETF.',
      'Creation and redemption by authorised participants keep the market price close to the value of the basket.',
    ],
    sections: [
      {
        heading: 'A fund that is listed',
        paragraphs: [
          'An exchange-traded fund pools money from many investors and uses it to hold a set of securities: shares, bonds, commodities or a mix. Like a mutual fund, it is managed by a fund house and has a net asset value (NAV) per unit. Unlike a traditional mutual fund, its units are listed on an exchange and change hands throughout the trading session at market prices.',
          'ETFs exist in most major markets. In India, they are listed on the NSE and BSE and track indices such as the NIFTY 50, as well as gold and government bonds. In the United States, they cover almost every asset class, sector and country.',
        ],
      },
      {
        heading: 'Index tracking',
        paragraphs: [
          'Most ETFs are passive: they aim to reproduce the return of a stated index. Some hold every security in the index at its index weight, an approach called full replication. Others hold a representative sample, which is common for indices with thousands of constituents or illiquid bonds. A smaller group uses derivatives to deliver the index return synthetically.',
          'Active ETFs also exist, where a manager selects securities. Their aim and risks resemble those of an actively managed mutual fund, but with exchange listing.',
        ],
      },
      {
        heading: 'How the price stays close to value',
        paragraphs: [
          'An ETF’s market price can drift from its NAV. Large institutions called authorised participants keep them close. If the price is above NAV, they can deliver the underlying basket to the fund in exchange for new units, which adds supply. If the price is below NAV, they can return units to the fund for the basket, which reduces supply. This creation and redemption mechanism is what distinguishes ETFs from closed-end funds.',
          'The mechanism works best when the underlying securities are liquid and trade at the same time as the ETF. An ETF listed in India holding US shares trades when US markets are closed, so its price relies on estimates of the basket’s value and can show larger premiums or discounts.',
        ],
        example: 'An ETF has an indicative NAV of ₹250.00 per unit and is quoted at ₹252.50. It stands at a premium of 2.50 ÷ 250.00 = 1.0% to NAV. A premium of that size in a liquid domestic equity ETF would be unusual; in a fund holding foreign shares outside their trading hours, it is more common.',
      },
      {
        heading: 'Three numbers to read first',
        paragraphs: [
          'The expense ratio is the annual cost of running the fund, taken from its assets. Assets under management (AUM) show how large it is, which affects its durability and often its liquidity. Tracking difference shows how far the fund’s return has fallen short of, or exceeded, its index over a period, combining costs and every other source of slippage.',
          'Beyond these, look at what the fund holds: the number of holdings, the weight of the top ten, and the sector and country allocation. Two ETFs with similar names can track quite different indices.',
        ],
      },
      {
        heading: 'Risks to understand',
        paragraphs: [
          'An ETF carries the market risk of whatever it holds. A diversified index fund reduces company-specific risk but not the risk of the whole market falling. Sector and thematic ETFs concentrate risk in one area. Leveraged and inverse ETFs, available in some markets, reset daily and can behave very differently from their index over longer periods.',
          'Liquidity matters too. A thinly traded ETF can have a wide gap between bid and offer prices, and premiums or discounts to NAV can persist.',
        ],
      },
      {
        heading: 'ETFs on INRGIFT',
        paragraphs: [
          'Each ETF page shows its strategy, benchmark, expense ratio, AUM, holdings, sector and country allocation, performance against its benchmark, and dividend history. Structured ETF reviews walk through cost, liquidity and holdings in a fixed format.',
        ],
      },
    ],
    related: [
      learn('expense-ratio-explained', 'Expense ratio explained'),
      learn('how-to-compare-etfs', 'How to compare ETFs'),
      term('etf', 'Exchange-traded fund (ETF)'),
      page('/assets/etfs', 'Browse ETFs'),
      page('/etfs/SPY', 'Example ETF page: SPY'),
    ],
    glossary: ['etf', 'expense-ratio', 'assets-under-management', 'tracking-difference', 'index', 'liquidity'],
  },
  {
    ...META,
    type: 'article',
    slug: 'etf-holdings-explained',
    section: 'ETFs',
    title: 'ETF holdings explained',
    summary: 'An ETF’s holdings are the securities it owns. Their number, weights and concentration show what the fund actually gives exposure to, which a name alone cannot.',
    keyPoints: [
      'Holdings are the individual securities in the fund, each with a weight as a share of assets.',
      'Holdings count says how many securities there are; concentration says how much the largest ones matter.',
      'Top-10 weight is a simple concentration measure used by INRGIFT.',
      'Holdings data is published with a lag and changes when the index rebalances.',
    ],
    sections: [
      {
        heading: 'What holdings data contains',
        paragraphs: [
          'Fund issuers publish lists of the securities each ETF owns, usually with the weight of each as a percentage of net assets, the number of shares and the market value. Many ETFs publish this daily; others publish monthly or quarterly. The list shows exactly what the fund owns on that date, which may differ slightly from its index because of sampling, cash and timing.',
          'Weights add up to roughly 100%, with a small amount in cash or cash-like instruments to meet expenses and flows. Funds that use derivatives may show futures or swaps among their holdings.',
        ],
      },
      {
        heading: 'Count versus concentration',
        paragraphs: [
          'A fund with 500 holdings sounds diversified, but if the ten largest make up 35% of assets, its returns will be driven heavily by those ten. Holdings count tells you breadth; concentration tells you how much the top names dominate.',
          'Market-cap-weighted indices become more concentrated when their largest companies outperform. Equal-weighted or capped indices limit this by design, at the cost of higher turnover.',
        ],
        example: 'Suppose a fund’s ten largest holdings weigh 9%, 7%, 6%, 5%, 4%, 3%, 3%, 2%, 2% and 2%. Its top-10 weight is 43%. A second fund with the same index name but a 10% cap per company and wider coverage might have a top-10 weight of 28%.',
      },
      {
        heading: 'Overlap between funds',
        paragraphs: [
          'Different ETFs often hold many of the same companies. A broad US index fund, a US technology fund and a global fund may all have large weights in the same handful of US technology companies. Looking at holdings side by side shows where exposure is being duplicated.',
          'Overlap is easiest to judge by comparing the largest holdings and the sector allocation of each fund, since small weights contribute little.',
        ],
      },
      {
        heading: 'Index changes and rebalancing',
        paragraphs: [
          'Index providers review their indices on a schedule, often quarterly or semi-annually, adding and removing companies and resetting weights or caps. Tracking ETFs adjust their holdings around those dates. Corporate events such as mergers, spin-offs and share issuance also change holdings between reviews.',
          'Because holdings change, any snapshot is valid only for its date. INRGIFT shows the as-of date beside every holdings table.',
        ],
      },
      {
        heading: 'Look-through to sectors and countries',
        paragraphs: [
          'Aggregating holdings by sector or country gives the fund’s sector allocation and country allocation. These views are often more useful than the list itself for a broad fund, because they show the economic exposure in a few rows.',
          'Classification matters. A company may be domiciled in one country, listed in a second and earn most revenue in a third. Allocation tables usually use the provider’s country of classification, which is typically based on domicile and primary listing.',
        ],
      },
      {
        heading: 'Where holdings are unavailable',
        paragraphs: [
          'Not every source supplies holdings for every fund. When holdings are not available for an ETF, INRGIFT shows a dash with the data status UNAVAILABLE rather than an empty table that could be mistaken for a fund with no holdings.',
        ],
      },
    ],
    related: [
      learn('sector-allocation-explained', 'Sector allocation explained'),
      learn('country-allocation-explained', 'Country allocation explained'),
      learn('etf-metrics-methodology', 'ETF metrics methodology'),
      page('/etfs/INDA', 'Example ETF page: INDA'),
      term('etf', 'Exchange-traded fund (ETF)'),
    ],
    glossary: ['etf', 'sector-allocation', 'country-allocation', 'index', 'data-status'],
  },
  {
    ...META,
    type: 'article',
    slug: 'expense-ratio-explained',
    section: 'ETFs',
    title: 'Expense ratio explained',
    summary: 'The expense ratio is the annual cost of running a fund, expressed as a percentage of its assets. It is deducted inside the fund, so it shows up as a lower return rather than a bill.',
    keyPoints: [
      'Expense ratio = annual fund operating costs ÷ average net assets.',
      'It is taken gradually from fund assets and reflected in NAV each day.',
      'Small differences compound into large differences over long periods.',
      'It excludes some costs, such as transaction costs inside the fund and spreads paid to transact in units.',
    ],
    sections: [
      {
        heading: 'What it covers',
        paragraphs: [
          'The expense ratio, called the total expense ratio (TER) in India and many other markets, covers the fund’s ongoing costs: the management fee, custody, administration, audit, index licensing and similar items. It is expressed as an annual percentage of average net assets.',
          'The fund does not send investors a bill. Instead, the cost accrues daily and is deducted from fund assets, so NAV is slightly lower each day than it would otherwise be. The effect is visible only as a gap between the fund’s return and its index.',
        ],
      },
      {
        heading: 'Why small numbers matter',
        paragraphs: [
          'For index funds, the expense ratio is one of the few things that reliably separates two funds tracking the same index. A difference of 0.5% a year sounds trivial, but it compounds every year.',
        ],
        example: 'Suppose an index returns 10% a year for 20 years. A fund charging 0.05% a year grows ₹1,00,000 to about ₹6,66,600. A fund charging 0.75% grows the same amount to about ₹5,87,000. The 0.70 percentage point difference in cost leaves about 12% less at the end.',
      },
      {
        heading: 'What it does not include',
        paragraphs: [
          'The expense ratio does not include the fund’s internal transaction costs from rebalancing, which show up in tracking difference instead. It does not include the bid-offer spread paid when units change hands on the exchange, or any fees charged by intermediaries. Some funds also earn income from lending securities, which can offset part of the expense ratio.',
          'For a complete view of cost, read the expense ratio together with tracking difference, which captures everything that made the fund’s return differ from its index.',
        ],
      },
      {
        heading: 'Typical ranges',
        paragraphs: [
          'Costs vary by asset class and market. Broad index ETFs on large, liquid markets tend to be the cheapest. Funds on narrow themes, smaller markets, bonds with complex structures, or active strategies tend to cost more. The figure is set by the fund house and can change, so the as-of date matters.',
          'Regulators set disclosure rules and, in some markets, upper limits on total expense ratios. In India, the Securities and Exchange Board of India (SEBI) sets such limits for mutual funds, including ETFs.',
        ],
      },
      {
        heading: 'On INRGIFT',
        paragraphs: [
          'Every ETF page shows the expense ratio with its source date. The screener’s fund filters include expense ratio, so you can list ETFs in a category with an expense ratio at most a given level, and the compare tool shows it beside AUM and tracking figures for up to four funds.',
        ],
      },
    ],
    related: [
      learn('tracking-error-explained', 'Tracking error explained'),
      learn('how-to-compare-etfs', 'How to compare ETFs'),
      term('expense-ratio', 'Expense ratio'),
      term('tracking-difference', 'Tracking difference'),
      page('/discover/screener', 'Screen ETFs by cost'),
    ],
    glossary: ['expense-ratio', 'tracking-difference', 'etf'],
  },
  {
    ...META,
    type: 'article',
    slug: 'tracking-error-explained',
    section: 'ETFs',
    title: 'Tracking error explained',
    summary: 'Tracking difference measures how far a fund’s return fell short of its index; tracking error measures how consistently it followed the index. They are different numbers and both matter.',
    keyPoints: [
      'Tracking difference = fund return − index return over a period.',
      'Tracking error = standard deviation of the periodic differences between fund and index returns.',
      'A fund can have a steady (low tracking error) but costly (negative tracking difference) record.',
      'Use the fund’s NAV return, not its market price return, to measure tracking.',
    ],
    sections: [
      {
        heading: 'Two related measures',
        paragraphs: [
          'Index funds aim to match their index. Two numbers describe how well they do it. Tracking difference is the simple gap between the fund’s return and the index’s return over a period, such as one year. It is usually negative, because the fund has costs and the index does not.',
          'Tracking error is the standard deviation of the differences between fund and index returns, measured over many short periods such as days or months and usually annualised. It describes how tightly the fund follows the index from period to period, regardless of whether it lags on average.',
        ],
      },
      {
        heading: 'A worked example',
        paragraphs: [
          'Comparing two funds shows why both numbers are needed. A fund can lag its index by a steady amount every month, which gives a negative tracking difference but low tracking error. Another can be on average close to the index but swing above and below it, which gives a small tracking difference and high tracking error.',
        ],
        example: 'Over one year, an index returns 12.00%. Fund A returns 11.80%, a tracking difference of −0.20%; its monthly differences are all close to −0.017%, so its tracking error is very low. Fund B returns 11.95%, a tracking difference of −0.05%, but its monthly differences range from −0.6% to +0.5%, so its annualised tracking error is much higher.',
      },
      {
        heading: 'What causes the gap',
        paragraphs: [
          'Several sources make a fund’s return differ from its index. Some reduce returns steadily; others add noise.',
        ],
        list: [
          'Expense ratio: a steady deduction from returns.',
          'Transaction costs when the fund rebalances or handles flows.',
          'Cash drag: the small part of assets held in cash does not earn the index return.',
          'Sampling: holding a subset of the index instead of every constituent.',
          'Dividend timing and withholding tax differences between the fund and the index methodology.',
          'Securities lending income, which can partly offset costs.',
          'Valuation timing, where the fund and index use prices from different moments.',
        ],
      },
      {
        heading: 'NAV versus market price',
        paragraphs: [
          'Tracking should be measured using the fund’s NAV, which reflects the value of what it holds. The market price of ETF units can sit at a premium or discount to NAV, which adds noise unrelated to how well the fund manager tracks the index. Market price return is still what a holder actually experiences, so both views are informative.',
        ],
      },
      {
        heading: 'Reading the numbers',
        paragraphs: [
          'For a long-term reader, tracking difference over several years is often the most practical measure of what an index fund costs in total. Tracking error is more useful for judging how reliably a fund delivers its index exposure over shorter horizons.',
          'Both depend on the period measured. A single year can include unusual events, such as a large index reconstitution, that do not repeat.',
        ],
      },
      {
        heading: 'On INRGIFT',
        paragraphs: [
          'ETF pages show the fund’s performance against its benchmark for several periods, along with tracking difference where the data is available. The ETF metrics methodology describes how each figure is calculated and what INRGIFT does when NAV data is missing.',
        ],
      },
    ],
    related: [
      learn('expense-ratio-explained', 'Expense ratio explained'),
      learn('etf-metrics-methodology', 'ETF metrics methodology'),
      term('tracking-error', 'Tracking error'),
      term('tracking-difference', 'Tracking difference'),
      page('/etfs/SPY/review', 'Example ETF review: SPY'),
    ],
    glossary: ['tracking-error', 'tracking-difference', 'expense-ratio', 'volatility', 'etf'],
  },
  {
    ...META,
    type: 'article',
    slug: 'aum-explained',
    section: 'ETFs',
    title: 'AUM explained',
    summary: 'Assets under management is the total market value of what a fund holds. It indicates size and durability, but it is not a measure of quality or of how easily units change hands.',
    keyPoints: [
      'AUM = units outstanding × NAV per unit.',
      'AUM changes with market moves and with money flowing in or out.',
      'Very small funds face a higher risk of closure or merger.',
      'An ETF’s liquidity depends mainly on the liquidity of its underlying securities, not only on its own AUM.',
    ],
    sections: [
      {
        heading: 'What AUM measures',
        paragraphs: [
          'Assets under management is the total market value of a fund’s assets, net of liabilities. For an ETF it equals the number of units outstanding multiplied by NAV per unit. It is the simplest measure of how large a fund is.',
          'For a fund house, total AUM across all funds measures the size of the business. On INRGIFT, AUM refers to a single fund unless the page says otherwise.',
        ],
        example: 'An ETF has 4 crore units outstanding and a NAV of ₹212.50. Its AUM is 4 crore × ₹212.50 = ₹850 crore. If the index rises 2% and no units are created or redeemed, AUM rises to about ₹867 crore.',
      },
      {
        heading: 'Why AUM changes',
        paragraphs: [
          'AUM moves for two reasons. Market performance changes the value of existing assets. Flows change the number of units, as authorised participants create new units when demand rises and redeem them when it falls. Separating the two shows whether a fund is growing because its market rose or because more money is choosing it.',
          'A fund whose AUM rose 20% in a year when its index rose 20% has had roughly no net flows. A fund whose AUM rose 60% has attracted substantial new money.',
        ],
      },
      {
        heading: 'Why size matters',
        paragraphs: [
          'Fund houses earn fees as a percentage of AUM. A very small fund may not cover its fixed costs, which raises the chance that it will be closed or merged into another fund. Closure does not usually mean a loss of assets, but it returns money at an unplanned time, which can have tax consequences.',
          'Larger funds can also have advantages in securities lending income and in spreading fixed costs, which can help keep tracking difference small.',
        ],
      },
      {
        heading: 'AUM and liquidity',
        paragraphs: [
          'A common mistake is to treat AUM as the measure of how easily an ETF can be transacted. Because units can be created and redeemed, an ETF’s effective liquidity depends largely on the liquidity of the securities it holds. A small ETF holding large, liquid shares can usually handle sizeable flows through creation and redemption.',
          'On-exchange volume and the bid-offer spread matter more for smaller transactions. A large fund with wide spreads is not necessarily more liquid in practice than a smaller fund with tight spreads.',
        ],
      },
      {
        heading: 'On INRGIFT',
        paragraphs: [
          'ETF pages show AUM in the fund’s currency with an approximate INR value. The heatmap can size ETF tiles by AUM instead of market cap, and the screener can filter ETFs with AUM at least a chosen level. AUM figures carry their as-of date because issuers update them at different frequencies.',
        ],
      },
    ],
    related: [
      learn('etf-basics', 'What is an ETF?'),
      learn('how-to-compare-etfs', 'How to compare ETFs'),
      term('assets-under-management', 'Assets under management (AUM)'),
      term('liquidity', 'Liquidity'),
      page('/discover/heatmap', 'Heatmap sized by AUM'),
    ],
    glossary: ['assets-under-management', 'liquidity', 'etf'],
  },
  {
    ...META,
    type: 'article',
    slug: 'sector-allocation-explained',
    section: 'ETFs',
    title: 'Sector allocation explained',
    summary: 'Sector allocation shows how a fund or index is divided across parts of the economy. It explains much of why two broad funds behave differently.',
    keyPoints: [
      'Sector allocation groups holdings by industry classification and sums their weights.',
      'Most providers use a standard classification with around eleven top-level sectors.',
      'Broad market indices can be heavily tilted towards one or two sectors.',
      'Classification is a judgement; some companies straddle sectors.',
    ],
    sections: [
      {
        heading: 'What it shows',
        paragraphs: [
          'Sector allocation takes every holding in a fund or index, assigns it to a sector, and adds up the weights. The result is a short table, such as financials 32%, information technology 14%, energy 11% and so on, that summarises the fund’s economic exposure.',
          'For a broad fund with hundreds of holdings, sector allocation is often more informative than the holdings list itself. It shows which parts of the economy will drive returns.',
        ],
      },
      {
        heading: 'Classification systems',
        paragraphs: [
          'Most index providers use a hierarchical classification: sectors at the top, then industry groups, industries and sub-industries. The widely used Global Industry Classification Standard (GICS) has eleven sectors, including information technology, financials, health care, consumer discretionary, consumer staples, industrials, energy, materials, utilities, real estate and communication services.',
          'Other systems exist, and some Indian index providers use their own groupings. INRGIFT uses one consistent classification across markets for its heatmap and screener so that sectors can be compared globally, and notes where a source uses a different scheme.',
        ],
      },
      {
        heading: 'Why it matters',
        paragraphs: [
          'Sectors respond differently to the same conditions. Banks are sensitive to interest rates and credit cycles; energy to commodity prices; technology to growth expectations and discount rates; consumer staples less to the economic cycle. A fund’s sector mix therefore shapes how it behaves when conditions change.',
          'Broad indices are not sector-neutral. Different countries’ benchmarks have very different sector weights, so a comparison of “India versus the US” is partly a comparison of financials and energy against technology.',
        ],
        example: 'Suppose Index A is 35% financials and 10% technology, and Index B is 12% financials and 30% technology. If financials rise 10% and technology falls 10% while other sectors are flat, Index A gains about 3.5% − 1.0% = 2.5% and Index B loses about 3.0% − 1.2% = 1.8%, before any other differences.',
      },
      {
        heading: 'Limits of classification',
        paragraphs: [
          'Each company gets one sector, but many companies have several businesses. A conglomerate with energy, retail and telecom divisions is assigned by its largest source of revenue or profit, so its sector label only partly describes it. Classification changes, such as the creation of a communication services sector in 2018, can also move companies between sectors overnight.',
          'Sector allocation describes exposure at one date. It shifts as prices move and as the index rebalances.',
        ],
      },
      {
        heading: 'On INRGIFT',
        paragraphs: [
          'ETF and index pages show sector allocation as a bar chart with exact weights and an as-of date. The heatmap groups any universe by sector or industry, and sector research pages explain the drivers of each sector across markets.',
        ],
      },
    ],
    related: [
      learn('country-allocation-explained', 'Country allocation explained'),
      learn('etf-holdings-explained', 'ETF holdings explained'),
      term('sector-allocation', 'Sector allocation'),
      page('/research/sectors', 'Sector research'),
      page('/discover/heatmap', 'Heatmap grouped by sector'),
    ],
    glossary: ['sector-allocation', 'country-allocation', 'index', 'etf'],
  },
  {
    ...META,
    type: 'article',
    slug: 'country-allocation-explained',
    section: 'ETFs',
    title: 'Country allocation explained',
    summary: 'Country allocation shows how a fund’s assets are divided by country. It describes market and currency exposure, but where a company is classified is not always where it earns its money.',
    keyPoints: [
      'Country allocation sums holding weights by each company’s country classification.',
      'For an unhedged fund, it is also a rough guide to currency exposure.',
      'Global indices are weighted by market value, so the largest markets dominate.',
      'Domicile, listing and revenue can point to three different countries for one company.',
    ],
    sections: [
      {
        heading: 'What it shows',
        paragraphs: [
          'Country allocation groups a fund’s holdings by country and adds up the weights. For a single-country fund, such as one tracking an Indian index, it is close to 100% one country. For a global or regional fund, it shows how the assets are spread.',
          'Because most global indices are weighted by free-float market capitalisation, they reflect the relative size of each stock market. The United States has been the largest component of global equity indices by a wide margin, and India’s weight in emerging market indices has grown over time.',
        ],
      },
      {
        heading: 'How companies are assigned',
        paragraphs: [
          'Index providers assign each company a country using rules that consider where it is incorporated, where its shares are primarily listed, and sometimes where its headquarters or operations are. Most companies are straightforward. Some are not: a company incorporated in one country, listed in another and operating mainly in a third can be classified differently by different providers.',
          'Country classification is not a measure of economic exposure. A large consumer goods company classified as Swiss may earn most of its revenue outside Switzerland, and a US-listed technology company may earn most of its revenue abroad.',
        ],
      },
      {
        heading: 'Country allocation as currency exposure',
        paragraphs: [
          'For a fund that does not hedge currency, country allocation approximates currency exposure, because each holding is priced in its local currency. A global fund priced in dollars that is 30% outside the United States has substantial non-dollar exposure even though its unit price is in dollars.',
        ],
        example: 'Suppose a global ETF is 60% US, 10% Japan, 8% UK, 7% euro area and 15% other markets. If every share is flat in local currency but the yen falls 10% against the dollar, the fund’s dollar NAV falls by about 10% × 10% = 1.0% from the Japanese weight alone.',
      },
      {
        heading: 'Single-country funds from India',
        paragraphs: [
          'Funds listed abroad that track Indian shares, such as US-listed India ETFs, have near-100% India allocation but are priced in dollars. Their dollar return combines the Indian market’s rupee return with the rupee’s move against the dollar. For a dollar-based reader the rupee is a source of currency risk; for a rupee-based reader comparing such a fund with a domestic index fund, the two currency conversions largely cancel out.',
        ],
      },
      {
        heading: 'Reading it alongside sectors',
        paragraphs: [
          'Country and sector allocation interact. A fund overweight in one country is often overweight in that country’s dominant sectors as well. Looking at both tables together shows whether a tilt is really about a country or about the sectors that country happens to contain.',
        ],
      },
      {
        heading: 'On INRGIFT',
        paragraphs: [
          'ETF pages show country allocation with exact weights and an as-of date. Country research pages describe each market’s structure, and the heatmap can group any universe by region and country to see how much each contributes.',
        ],
      },
    ],
    related: [
      learn('sector-allocation-explained', 'Sector allocation explained'),
      learn('currency-and-returns', 'How currency changes your return'),
      term('country-allocation', 'Country allocation'),
      page('/research/countries', 'Country research'),
      page('/etfs/INDA', 'Example ETF page: INDA'),
    ],
    glossary: ['country-allocation', 'sector-allocation', 'index', 'etf'],
  },
  {
    ...META,
    type: 'guide',
    slug: 'how-to-compare-etfs',
    section: 'ETFs',
    title: 'How to compare ETFs',
    summary: 'A structured way to compare exchange-traded funds: start with the index, then cost, tracking, size, liquidity and what the funds actually hold.',
    keyPoints: [
      'Compare what each fund tracks before comparing anything else.',
      'Cost is best judged by tracking difference, with the expense ratio as its main component.',
      'Check size and liquidity, including bid-offer spreads, not just AUM.',
      'Use holdings, sector and country allocation to see real differences between similar names.',
    ],
    sections: [
      {
        heading: 'Start with the index',
        paragraphs: [
          'Two ETFs with similar names can track different indices. One “world” fund may include emerging markets and small companies; another may cover only large companies in developed markets. One “technology” fund may follow a sector classification; another may follow a theme. Before comparing anything else, confirm that the funds track the same index, or understand how their indices differ.',
          'If the indices differ, performance differences mostly reflect the indices, not the funds. Comparing costs across funds tracking different indices is only a partial comparison.',
        ],
      },
      {
        heading: 'Then cost and tracking',
        paragraphs: [
          'For funds tracking the same index, cost is usually the main difference. The expense ratio is the visible part; tracking difference over several years captures it together with transaction costs, cash drag, tax treatment and securities lending income. A fund with a slightly higher expense ratio can have a smaller tracking difference.',
          'Tracking error adds information about consistency. For most long-term comparisons, tracking difference over three or more years is the more useful figure.',
        ],
        example: 'Fund A has an expense ratio of 0.07% and a three-year average tracking difference of −0.12% a year. Fund B has an expense ratio of 0.10% and a tracking difference of −0.08%. Despite its higher stated fee, Fund B has lagged its index by less.',
      },
      {
        heading: 'Size and liquidity',
        paragraphs: [
          'Check AUM for durability: very small funds are more likely to be closed. For liquidity, look at average daily volume and the typical bid-offer spread, and remember that the liquidity of the underlying securities is what allows authorised participants to create and redeem units.',
          'For funds holding foreign securities, check how the price behaves relative to NAV during hours when the underlying market is closed. Premiums and discounts can be larger and more persistent.',
        ],
      },
      {
        heading: 'A comparison checklist',
        paragraphs: [
          'The compare tool on INRGIFT lines up these fields for up to four funds. Working through them in this sequence avoids being misled by a single headline figure.',
        ],
        list: [
          'Benchmark index and strategy (full replication, sampling or synthetic).',
          'Expense ratio and tracking difference over one, three and five years.',
          'AUM, average volume and listing exchange.',
          'Number of holdings and top-10 weight.',
          'Sector and country allocation.',
          'Distribution policy (distributing or accumulating) and dividend yield.',
          'Currency of listing and any currency hedging.',
          'Domicile, which can affect withholding tax on dividends.',
        ],
      },
      {
        heading: 'Using the compare tool',
        paragraphs: [
          'Add up to four ETFs to the compare tool from their pages, from the screener or from a watchlist. The rebased chart starts every fund at 100 on the same date, so lines can be compared directly, and a benchmark can be added. The fund details section shows cost, size and allocation side by side, and the risk section shows volatility and maximum drawdown.',
          'A comparison can be saved to your workspace or shared by its URL.',
        ],
      },
      {
        heading: 'What comparison cannot tell you',
        paragraphs: [
          'Past tracking and costs are a reasonable guide to future costs, but not a guarantee. Fees change, indices are revised and fund houses merge funds. INRGIFT compares funds on published, sourced data; it does not rank funds or say which is suitable for any reader.',
        ],
      },
    ],
    related: [
      learn('tracking-error-explained', 'Tracking error explained'),
      learn('expense-ratio-explained', 'Expense ratio explained'),
      learn('how-to-compare-stocks', 'How to compare stocks'),
      page('/discover/compare', 'Compare tool'),
      page('/etfs/SPY/review', 'Example ETF review: SPY'),
    ],
    glossary: ['expense-ratio', 'tracking-difference', 'tracking-error', 'assets-under-management', 'liquidity'],
  },
];

export const LEARN_ARTICLES: LearnArticle[] = [...BASICS, ...GLOBAL, ...FUNDAMENTALS, ...MARKET_BEHAVIOUR, ...ETF_ARTICLES];
