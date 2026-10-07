/**
 * INRGIFT glossary. Educational definitions only: no advice, no recommendations.
 * Read through the async getters in `src/services/content.ts` (the CMS seam), never imported by UI directly.
 * All examples use hypothetical numbers.
 */
import type { ContentLink, ContentMeta, GlossaryTerm } from './types';

const META: ContentMeta = {
  status: 'PUBLISHED',
  publishedAt: '2026-10-06',
  updatedAt: '2026-10-06',
  author: 'INRGIFT Research',
  reviewer: null,
};

const learn = (slug: string, label: string): ContentLink => ({ label, href: `/resources/learn/${slug}` });
const page = (href: string, label: string): ContentLink => ({ label, href });

const TERMS: GlossaryTerm[] = [
  {
    ...META,
    type: 'glossary_term',
    slug: 'market-capitalisation',
    term: 'Market capitalisation',
    aliases: ['Market cap'],
    definition: 'Market capitalisation is the total market value of a company’s outstanding shares at the current share price.',
    plain:
      'Market cap tells you how large a company is in the eyes of the market. It is the share price multiplied by the number of shares in issue. A high share price on its own says nothing about size, because two companies can have very different share counts.',
    formula: 'Market capitalisation = share price × shares outstanding',
    example:
      'A hypothetical company has 50 crore shares outstanding and a share price of ₹400. Its market capitalisation is ₹20,000 crore. If the price rises to ₹440, market cap rises to ₹22,000 crore with no change in the business.',
    why:
      'Market cap is the usual way to group companies into large, mid and small size bands and to weight them in many indices. It is also the starting point for enterprise value.',
    limitations:
      'Market cap ignores debt and cash, so it can misstate the value of the whole business. It also moves with every price change and can differ by share class or listing venue.',
    related: ['enterprise-value', 'p-e-ratio', 'index', 'share-class'],
    pages: [
      learn('market-cap-explained', 'Market cap explained'),
      page('/discover/heatmap', 'Market heatmap'),
      page('/discover/screener', 'Screener'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'p-e-ratio',
    term: 'P/E ratio',
    aliases: ['Price to earnings'],
    definition: 'The price-to-earnings ratio divides a company’s share price by its earnings per share.',
    plain:
      'The P/E ratio shows how many rupees the market is paying today for each rupee of annual profit. A higher P/E usually means the market expects faster or steadier growth, or sees lower risk. It is a quick comparison tool, not a measure of value on its own.',
    formula: 'P/E = share price ÷ earnings per share (EPS)',
    example:
      'A hypothetical share trades at ₹600 and the company earned ₹30 per share over the last twelve months. Its trailing P/E is 600 ÷ 30 = 20. If earnings fall to ₹20 while the price stays put, the P/E rises to 30.',
    why:
      'P/E is the most widely quoted valuation measure and makes it easy to compare companies within the same industry. Changes in P/E over time show how expectations have shifted.',
    limitations:
      'P/E is meaningless when earnings are negative and can be distorted by one-off gains or losses. It ignores debt, so EV / EBITDA is often used alongside it.',
    related: ['ev-ebitda', 'market-capitalisation', 'revenue-growth', 'roic'],
    pages: [
      learn('pe-ratio-explained', 'P/E ratio explained'),
      learn('reading-valuation', 'Reading valuation'),
      page('/discover/compare', 'Compare'),
      page('/stocks/AAPL', 'Apple research'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'ev-ebitda',
    term: 'EV / EBITDA',
    definition:
      'EV / EBITDA divides enterprise value by earnings before interest, taxes, depreciation and amortisation.',
    plain:
      'This ratio compares the value of the whole business, including debt, with a rough measure of its operating earnings. Because it sits before interest and tax, it is less affected by how a company is financed or where it pays tax. That makes it useful for comparing companies with different amounts of debt.',
    formula: 'EV / EBITDA = enterprise value ÷ EBITDA',
    example:
      'A hypothetical company has an enterprise value of ₹12,000 crore and annual EBITDA of ₹1,500 crore. Its EV / EBITDA is 8×. A peer with the same EBITDA and an enterprise value of ₹18,000 crore would be at 12×.',
    why:
      'It allows a fairer comparison across companies with different capital structures than P/E does. It is widely used in industries with heavy fixed assets.',
    limitations:
      'EBITDA ignores capital expenditure, so capital-hungry businesses can look cheaper than they are. The ratio is not meaningful for banks and insurers, whose debt is part of their operations.',
    related: ['enterprise-value', 'p-e-ratio', 'free-cash-flow', 'roic'],
    pages: [
      learn('enterprise-value-explained', 'Enterprise value explained'),
      learn('reading-valuation', 'Reading valuation'),
      page('/discover/screener', 'Screener'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'enterprise-value',
    term: 'Enterprise value',
    aliases: ['EV'],
    definition:
      'Enterprise value is the market value of a company’s equity plus its debt, minus its cash and cash equivalents.',
    plain:
      'Enterprise value estimates what the whole business is worth to everyone with a claim on it, not only shareholders. It adds debt because whoever owned the business would take that on, and subtracts cash because it could be used to pay debt down. It is the numerator in ratios such as EV / EBITDA.',
    formula: 'EV = market capitalisation + total debt − cash and cash equivalents',
    example:
      'A hypothetical company has a market cap of ₹10,000 crore, total debt of ₹3,000 crore and cash of ₹1,000 crore. Its enterprise value is 10,000 + 3,000 − 1,000 = ₹12,000 crore. A debt-free peer with the same market cap and ₹1,000 crore of cash would have an EV of ₹9,000 crore.',
    why:
      'EV puts companies with very different balance sheets on a comparable footing. It underpins several valuation multiples used in research.',
    limitations:
      'Definitions vary: some include leases, preference shares or minority interests, so figures from different sources may not match. Balance-sheet items are updated only at reporting dates, while market cap changes daily.',
    related: ['market-capitalisation', 'ev-ebitda', 'free-cash-flow'],
    pages: [
      learn('enterprise-value-explained', 'Enterprise value explained'),
      learn('reading-valuation', 'Reading valuation'),
      page('/discover/compare', 'Compare'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'free-cash-flow',
    term: 'Free cash flow',
    aliases: ['FCF'],
    definition:
      'Free cash flow is the cash a company generates from operations after paying for capital expenditure.',
    plain:
      'Profit is an accounting figure; free cash flow is closer to the cash that actually stays in the business. It is what remains after the company has paid for the equipment, buildings and systems it needs to keep running and grow. That cash can fund dividends, reduce debt or be reinvested.',
    formula: 'FCF = operating cash flow − capital expenditure',
    example:
      'A hypothetical company reports operating cash flow of ₹800 crore and spends ₹300 crore on new plant and machinery. Its free cash flow is ₹500 crore. If it then pays ₹200 crore in dividends, ₹300 crore is left for other uses.',
    why:
      'Free cash flow shows whether reported profits turn into cash. Persistent gaps between profit and FCF can point to working-capital strain or heavy investment needs.',
    limitations:
      'FCF can swing sharply from year to year when large projects start or finish. Companies define it differently, for example by treating leases or acquisitions in different ways.',
    related: ['enterprise-value', 'ev-ebitda', 'roic', 'revenue-growth'],
    pages: [
      learn('free-cash-flow-explained', 'Free cash flow explained'),
      page('/stocks/TSM', 'TSMC research'),
      page('/discover/screener', 'Screener'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'revenue-growth',
    term: 'Revenue growth',
    definition: 'Revenue growth is the percentage change in a company’s sales between two periods.',
    plain:
      'Revenue growth tells you how quickly the top line of a business is expanding or shrinking. It is usually quoted year on year, comparing a quarter or a full year with the same period a year earlier. Fast growth does not guarantee profit, so it is read together with margins and cash flow.',
    formula: 'Revenue growth = (current period revenue − prior period revenue) ÷ prior period revenue × 100',
    example:
      'A hypothetical company had revenue of ₹2,000 crore last year and ₹2,300 crore this year. Its revenue growth is (2,300 − 2,000) ÷ 2,000 × 100 = 15%. If half of the increase came from an acquisition, organic growth would be closer to 7.5%.',
    why:
      'Revenue growth is a basic measure of demand for a company’s products and a common input to valuation. Comparing it with peers shows whether a company is gaining or losing share.',
    limitations:
      'Headline growth can be flattered by acquisitions, price increases or currency movements. Seasonal businesses need year-on-year comparisons, not quarter-on-quarter ones.',
    related: ['p-e-ratio', 'free-cash-flow', 'roic'],
    pages: [
      learn('revenue-growth-explained', 'Revenue growth explained'),
      learn('currency-and-returns', 'Currency and returns'),
      page('/stocks/AAPL', 'Apple research'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'dividend-yield',
    term: 'Dividend yield',
    definition: 'Dividend yield is a company’s annual dividends per share expressed as a percentage of its share price.',
    plain:
      'Dividend yield shows how much cash a share has paid out in a year relative to its price. Because the price is in the denominator, the yield rises when the price falls, even if the dividend is unchanged. It describes past or declared payments, not a promise of future ones.',
    formula: 'Dividend yield = annual dividends per share ÷ share price × 100',
    example:
      'A hypothetical share pays ₹12 in dividends over a year and trades at ₹400. Its dividend yield is 12 ÷ 400 × 100 = 3%. If the price drops to ₹300 with the same dividend, the yield becomes 4%.',
    why:
      'Dividend yield helps compare the cash income profile of companies, funds and REITs. It is also used to compare equity income with bond yields.',
    limitations:
      'A very high yield can reflect a falling price and a dividend that may be cut. Trailing and forward yields use different dividend figures, and taxes on dividends differ by country.',
    related: ['ex-dividend-date', 'yield', 'reit', 'ffo'],
    pages: [
      learn('dividend-yield-explained', 'Dividend yield explained'),
      page('/reits/PLD', 'Prologis research'),
      page('/resources/calendar', 'Market calendar'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'ex-dividend-date',
    term: 'Ex-dividend date',
    definition:
      'The ex-dividend date is the first trading day on which a share no longer carries the right to the next declared dividend.',
    plain:
      'To receive a declared dividend, a holder must own the share before the ex-dividend date. Shares acquired on or after that date trade without the dividend attached. On the ex-date the share price usually adjusts down by roughly the dividend amount, all else equal.',
    example:
      'A hypothetical company declares a ₹10 dividend with an ex-dividend date of 15 March. A share acquired on 14 March carries the dividend; one acquired on 15 March does not. If the share closed at ₹500 on 14 March, it might open near ₹490 on 15 March, other things unchanged.',
    why:
      'The ex-date explains price drops that are not caused by news. It matters when reading total-return figures and dividend calendars.',
    limitations:
      'Settlement cycles differ by market, so the gap between the ex-date and the record date is not the same everywhere. The actual price move on the ex-date is mixed with all other market movement that day.',
    related: ['dividend-yield', 'trading-session', 'reit'],
    pages: [
      page('/resources/calendar', 'Market calendar'),
      learn('dividend-yield-explained', 'Dividend yield explained'),
      learn('market-calendar-methodology', 'Market calendar methodology'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'beta',
    term: 'Beta',
    definition: 'Beta measures how much an asset’s returns have moved relative to the returns of a benchmark index.',
    plain:
      'A beta of 1 means the asset has tended to move in line with the index. Above 1, it has moved more than the index; below 1, less. Beta is calculated from past returns, so it describes history rather than predicting the future.',
    formula: 'Beta = covariance(asset returns, index returns) ÷ variance(index returns)',
    example:
      'A hypothetical stock has a beta of 1.3 against the Nifty 50. On a day when the index falls 2%, the stock has historically tended to fall around 2.6%, though any single day can differ. A stock with a beta of 0.6 would have tended to move about 1.2%.',
    why:
      'Beta gives a quick sense of how sensitive an asset has been to broad market moves. It is widely used in risk comparisons and in cost-of-capital estimates.',
    limitations:
      'Beta depends on the index, time window and return frequency chosen, so published figures differ. It captures only market-related movement and says nothing about company-specific risk.',
    related: ['volatility', 'index', 'sharpe-ratio', 'maximum-drawdown'],
    pages: [
      learn('understanding-risk', 'Understanding risk'),
      page('/indices/NIFTY-50', 'Nifty 50'),
      page('/discover/compare', 'Compare'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'volatility',
    term: 'Volatility',
    definition: 'Volatility is the degree to which an asset’s returns vary around their average, usually measured as annualised standard deviation.',
    plain:
      'Volatility tells you how widely prices have swung. A highly volatile asset can move a long way in either direction over short periods. It measures the size of movements, not their direction.',
    formula: 'Annualised volatility = standard deviation of daily returns × √252',
    example:
      'A hypothetical stock’s daily returns have a standard deviation of 1.5%. Its annualised volatility is about 1.5% × √252 ≈ 23.8%. An index with a daily standard deviation of 0.8% would have annualised volatility of about 12.7%.',
    why:
      'Volatility is the most common single measure of risk and feeds into ratios such as Sharpe. It helps compare how bumpy different assets have been.',
    limitations:
      'It treats upward and downward moves the same way. Volatility changes over time, and a calm period can be followed by a sharp move that the past figure did not capture.',
    related: ['beta', 'sharpe-ratio', 'maximum-drawdown', 'liquidity'],
    pages: [
      learn('understanding-risk', 'Understanding risk'),
      learn('performance-calculation-methodology', 'Performance calculation methodology'),
      page('/discover/screener', 'Screener'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'expense-ratio',
    term: 'Expense ratio',
    definition: 'The expense ratio is the annual cost of running a fund, expressed as a percentage of its average net assets.',
    plain:
      'Every fund charges for management, administration and other running costs. These are deducted from the fund’s assets day by day, so you never see a separate bill. Over long periods, small differences in cost add up.',
    formula: 'Expense ratio = total annual fund operating expenses ÷ average net assets × 100',
    example:
      'A hypothetical ETF has an expense ratio of 0.20% and you hold ₹1,00,000 in it for a year. Roughly ₹200 of costs are deducted within the fund over that year. A fund charging 0.75% would deduct about ₹750 on the same amount.',
    why:
      'Cost is one of the few things known in advance about a fund. Comparing expense ratios is a standard step when reviewing funds that track similar indices.',
    limitations:
      'The expense ratio excludes some costs, such as transaction costs inside the fund and market spreads. A low expense ratio does not guarantee a low tracking difference.',
    related: ['etf', 'tracking-difference', 'tracking-error', 'assets-under-management'],
    pages: [
      learn('expense-ratio-explained', 'Expense ratio explained'),
      learn('etf-metrics-methodology', 'ETF metrics methodology'),
      page('/etfs/SPY', 'SPY research'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'tracking-error',
    term: 'Tracking error',
    definition:
      'Tracking error is the standard deviation of the difference between a fund’s returns and its benchmark index’s returns.',
    plain:
      'Tracking error measures how consistently a fund follows its index. A low figure means the fund’s returns have stayed close to the index from period to period. It measures the variability of the gap, not its size or direction.',
    formula: 'Tracking error = standard deviation of (fund return − index return), usually annualised',
    example:
      'A hypothetical index fund trails its index by between 0.01% and 0.03% every month. Its tracking error is very small because the gap is consistent. Another fund that is 0.5% ahead one month and 0.6% behind the next has a much higher tracking error.',
    why:
      'Tracking error shows how reliably an index fund delivers index-like returns. It is a core quality measure when comparing funds on the same index.',
    limitations:
      'A fund can have low tracking error yet still lag the index steadily because of costs; tracking difference captures that. Results depend on the measurement window and return frequency.',
    related: ['tracking-difference', 'etf', 'index', 'expense-ratio'],
    pages: [
      learn('tracking-error-explained', 'Tracking error explained'),
      learn('etf-metrics-methodology', 'ETF metrics methodology'),
      page('/etfs/SPY/review', 'SPY review'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'tracking-difference',
    term: 'Tracking difference',
    definition: 'Tracking difference is the gap between a fund’s total return and its benchmark index’s total return over a stated period.',
    plain:
      'Tracking difference answers a simple question: over this period, how far ahead of or behind the index did the fund end up? A negative figure means the fund trailed the index. Costs are usually the main reason a fund trails.',
    formula: 'Tracking difference = fund return − index return (over the same period)',
    example:
      'Over a year, a hypothetical index returns 12.00% and a fund tracking it returns 11.75%. The tracking difference is −0.25 percentage points. If the fund’s expense ratio is 0.20%, the remaining 0.05 points come from other factors such as cash drag or taxes on dividends.',
    why:
      'Tracking difference shows the real cost of holding a fund relative to its index. It is often more useful than the expense ratio alone.',
    limitations:
      'A single period can be unrepresentative, so several periods are worth checking. It depends on the index version used, such as price or total return and the tax treatment of dividends.',
    related: ['tracking-error', 'expense-ratio', 'etf', 'index'],
    pages: [
      learn('tracking-error-explained', 'Tracking error explained'),
      learn('etf-metrics-methodology', 'ETF metrics methodology'),
      page('/etfs/SPY/review', 'SPY review'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'assets-under-management',
    term: 'Assets under management (AUM)',
    aliases: ['AUM'],
    definition: 'Assets under management is the total market value of the assets held by a fund or managed by a firm.',
    plain:
      'AUM tells you how large a fund is. It changes when the value of the holdings moves and when money flows into or out of the fund. Size affects costs, liquidity and the likelihood that a fund stays open.',
    example:
      'A hypothetical ETF holds securities worth ₹4,000 crore. Its AUM is ₹4,000 crore. If markets rise 5% and investors add ₹100 crore, AUM rises to about ₹4,300 crore.',
    why:
      'Larger funds can spread fixed costs and often have tighter spreads. Very small funds are more likely to close or merge.',
    limitations:
      'Large AUM does not mean a fund is better or cheaper. Figures are reported at different frequencies and in different currencies, so comparisons need a common date and currency.',
    related: ['etf', 'expense-ratio', 'liquidity'],
    pages: [
      learn('aum-explained', 'AUM explained'),
      learn('etf-basics', 'ETF basics'),
      page('/etfs/SPY', 'SPY research'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'sharpe-ratio',
    term: 'Sharpe ratio',
    definition: 'The Sharpe ratio measures return in excess of a risk-free rate per unit of volatility.',
    plain:
      'The Sharpe ratio asks how much extra return an asset delivered for each unit of risk it carried. A higher figure means more excess return per unit of volatility over the period measured. It is a backward-looking comparison tool.',
    formula: 'Sharpe ratio = (return − risk-free rate) ÷ standard deviation of returns',
    example:
      'A hypothetical fund returned 14% in a year with volatility of 16%, while the risk-free rate was 6%. Its Sharpe ratio is (14 − 6) ÷ 16 = 0.5. A fund returning 11% with 8% volatility would have a Sharpe ratio of 0.625.',
    why:
      'It allows comparison of assets with different levels of risk on one scale. It is widely used in fund and strategy research.',
    limitations:
      'It assumes volatility captures risk fully and treats gains and losses alike. Results depend on the period and the risk-free rate chosen, which differs between countries.',
    related: ['volatility', 'maximum-drawdown', 'beta'],
    pages: [
      learn('understanding-risk', 'Understanding risk'),
      learn('performance-calculation-methodology', 'Performance calculation methodology'),
      page('/discover/compare', 'Compare'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'maximum-drawdown',
    term: 'Maximum drawdown',
    aliases: ['Drawdown'],
    definition: 'Maximum drawdown is the largest percentage fall from a peak to a subsequent trough over a given period.',
    plain:
      'Drawdown measures how far a price fell from its previous high before recovering. Maximum drawdown is the worst such fall in the period you are looking at. It shows the depth of past losses in a way volatility does not.',
    formula: 'Maximum drawdown = (trough value − peak value) ÷ peak value × 100',
    example:
      'A hypothetical index rises to 20,000, falls to 15,000 and later recovers. The drawdown is (15,000 − 20,000) ÷ 20,000 = −25%. If that was the deepest fall in the period, the maximum drawdown is −25%.',
    why:
      'Maximum drawdown shows how severe past declines have been and helps put volatility figures in context. It is often shown alongside recovery time.',
    limitations:
      'It depends heavily on the period chosen and records only the single worst episode. It says nothing about how often drawdowns happen or how long recovery took.',
    related: ['volatility', 'sharpe-ratio', 'beta'],
    pages: [
      learn('understanding-risk', 'Understanding risk'),
      learn('performance-calculation-methodology', 'Performance calculation methodology'),
      page('/indices/SP-500', 'S&P 500'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'market-breadth',
    term: 'Market breadth',
    definition: 'Market breadth describes how many constituents of a market or index are participating in its move.',
    plain:
      'An index can rise because a few large companies are rising while most others fall. Breadth looks underneath the headline number by counting how many stocks advanced versus declined. Broad participation and narrow participation can produce the same index move.',
    formula: 'Advance–decline ratio = number of advancing stocks ÷ number of declining stocks',
    example:
      'On a hypothetical day the Nifty 50 rises 0.8%, with 38 constituents up and 12 down. The advance–decline ratio is 38 ÷ 12 ≈ 3.2. On another day the index rises 0.8% with only 18 up and 32 down, which is much narrower.',
    why:
      'Breadth helps explain whether a market move is widespread or driven by a handful of heavyweights. The heatmap shows this visually.',
    limitations:
      'Breadth counts every stock equally, regardless of size. Different universes and thresholds give different readings, so figures from separate sources are not always comparable.',
    related: ['index', 'market-capitalisation', 'sector-allocation', 'moving-average'],
    pages: [
      page('/discover/heatmap', 'Market heatmap'),
      page('/markets/India', 'India market'),
      page('/indices/NIFTY-50', 'Nifty 50'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'liquidity',
    term: 'Liquidity',
    definition: 'Liquidity is the ease with which an asset can be traded in size without materially moving its price.',
    plain:
      'A liquid asset trades often, in large volumes, with a narrow gap between the best bid and the best offer. An illiquid one may trade rarely, and a sizeable trade can shift the price. Liquidity can change quickly, especially in stressed markets.',
    formula: 'Bid–ask spread (%) = (ask − bid) ÷ midpoint price × 100',
    example:
      'A hypothetical large-cap share has a best bid of ₹999.50 and best offer of ₹1,000.50, a spread of about 0.1%. A small-cap share with a bid of ₹98 and offer of ₹102 has a spread of about 4%. The second is far less liquid.',
    why:
      'Liquidity affects how reliable a quoted price is and how closely an ETF trades to its underlying value. Thinly traded instruments can show stale or jumpy prices.',
    limitations:
      'No single number captures liquidity; volume, spread and market depth all matter. An ETF can be more liquid than its own trading volume suggests, because the underlying holdings also matter.',
    related: ['volatility', 'etf', 'assets-under-management', 'trading-session'],
    pages: [
      learn('etf-basics', 'ETF basics'),
      learn('understanding-global-exchanges', 'Understanding global exchanges'),
      page('/markets/all', 'All markets'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'yield',
    term: 'Yield',
    definition: 'Yield is the income an asset produces, expressed as a percentage of its price or value.',
    plain:
      'Yield turns income into a rate so that different assets can be compared. For shares it usually means dividend yield; for bonds it can mean current yield or yield to maturity. The word is used loosely, so it is important to know which yield is being quoted.',
    formula: 'Current yield = annual income ÷ current price × 100',
    example:
      'A hypothetical bond pays ₹70 a year and trades at ₹1,000, giving a current yield of 7%. If its price falls to ₹950, the current yield rises to about 7.37%. The income is unchanged; only the price moved.',
    why:
      'Yields allow rough income comparisons across shares, bonds and REITs. Government bond yields are also a reference point for valuing other assets.',
    limitations:
      'Current yield ignores capital gains or losses and the timing of payments. Yields in different currencies are not directly comparable without considering inflation and currency movements.',
    related: ['yield-to-maturity', 'dividend-yield', 'coupon', 'duration'],
    pages: [
      page('/bonds/IN-10Y', 'India 10-year bond'),
      page('/bonds/US-10Y', 'US 10-year bond'),
      learn('dividend-yield-explained', 'Dividend yield explained'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'yield-to-maturity',
    term: 'Yield to maturity',
    aliases: ['YTM'],
    definition:
      'Yield to maturity is the annual rate of return a bond would deliver if held to maturity, with all payments made as scheduled and coupons reinvested at the same rate.',
    plain:
      'YTM combines the coupons and the gain or loss between today’s price and the face value repaid at maturity into one annual rate. It is the discount rate that makes the present value of all future payments equal the current price. When a bond’s price falls, its YTM rises, and the reverse.',
    formula: 'YTM is the rate r that solves: price = Σ coupon ÷ (1 + r)^t + face value ÷ (1 + r)^n',
    example:
      'A hypothetical 5-year bond with a ₹1,000 face value and a 7% annual coupon trades at ₹960. Because it will repay ₹1,000 at maturity, its YTM is about 8.0%, above the coupon rate. If it traded at ₹1,000, its YTM would equal the 7% coupon.',
    why:
      'YTM is the standard way to compare bonds with different coupons, prices and maturities. Government bond YTMs, such as the 10-year, are widely watched reference rates.',
    limitations:
      'It assumes no default and that coupons can be reinvested at the same rate, which rarely holds exactly. For callable bonds, yield to call or yield to worst may be more relevant.',
    related: ['yield', 'coupon', 'duration'],
    pages: [
      page('/bonds/IN-10Y', 'India 10-year bond'),
      page('/bonds/US-10Y', 'US 10-year bond'),
      page('/markets', 'Markets'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'duration',
    term: 'Duration',
    definition: 'Duration measures a bond’s sensitivity to changes in interest rates, expressed in years.',
    plain:
      'Duration tells you roughly how much a bond’s price will change if yields move. A bond with a duration of 7 would be expected to fall about 7% if yields rose by one percentage point. Longer maturities and lower coupons usually mean higher duration.',
    formula: 'Approximate price change (%) ≈ −modified duration × change in yield (percentage points)',
    example:
      'A hypothetical bond fund has a modified duration of 6 years. If yields rise from 7.0% to 7.5%, its price would be expected to fall about 6 × 0.5 = 3%. If yields fall by the same amount, the price would rise by roughly 3%.',
    why:
      'Duration is the main measure of interest-rate risk in bonds and bond funds. It helps compare how exposed different instruments are to rate changes.',
    limitations:
      'The approximation works best for small yield changes; larger moves need a convexity adjustment. It does not capture credit risk or changes in the shape of the yield curve.',
    related: ['yield-to-maturity', 'coupon', 'yield', 'volatility'],
    pages: [
      page('/bonds/US-10Y', 'US 10-year bond'),
      page('/bonds/IN-10Y', 'India 10-year bond'),
      learn('understanding-risk', 'Understanding risk'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'coupon',
    term: 'Coupon',
    definition: 'The coupon is the fixed interest a bond pays, stated as an annual percentage of its face value.',
    plain:
      'When a bond is issued, it promises to pay a set amount of interest each year until maturity. That rate, applied to the face value, is the coupon. It does not change when the bond’s market price moves.',
    formula: 'Annual coupon payment = coupon rate × face value',
    example:
      'A hypothetical bond with a face value of ₹1,000 and a 7.5% coupon pays ₹75 a year, often in two half-yearly instalments of ₹37.50. If its market price falls to ₹950, the coupon is still ₹75.',
    why:
      'The coupon sets the bond’s cash income and affects its duration. Comparing coupon with market yield shows whether a bond trades above or below face value.',
    limitations:
      'The coupon alone does not tell you the return from today’s price; yield to maturity does. Floating-rate bonds reset their coupons, so the current rate may not last.',
    related: ['yield-to-maturity', 'yield', 'duration'],
    pages: [
      page('/bonds/IN-10Y', 'India 10-year bond'),
      page('/bonds/US-10Y', 'US 10-year bond'),
      page('/markets', 'Markets'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'etf',
    term: 'ETF',
    aliases: ['Exchange-traded fund'],
    definition: 'An exchange-traded fund is a pooled investment fund whose units are listed and traded on a stock exchange throughout the trading session.',
    plain:
      'An ETF holds a basket of securities, often designed to track an index, and its units trade on an exchange like shares. Its price moves during the day and normally stays close to the value of its holdings. Many ETFs offer low-cost access to a whole market, sector or country.',
    example:
      'A hypothetical ETF tracks an index of 500 US companies and has a net asset value of ₹250 per unit. During the session its market price might range between ₹249.80 and ₹250.30. Its expense ratio of 0.10% is deducted within the fund over the year.',
    why:
      'ETFs are a common way to gain exposure to markets outside India. Research into an ETF looks at its index, costs, holdings, tracking and liquidity.',
    limitations:
      'ETF prices can move away from net asset value, especially when underlying markets are closed. Two ETFs on the same theme can hold very different baskets.',
    related: ['expense-ratio', 'tracking-error', 'assets-under-management', 'index', 'sector-allocation'],
    pages: [
      learn('etf-basics', 'ETF basics'),
      learn('etf-holdings-explained', 'ETF holdings explained'),
      page('/etfs/SPY', 'SPY research'),
      page('/etfs/SPY/review', 'SPY review'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'reit',
    term: 'REIT',
    aliases: ['Real estate investment trust'],
    definition:
      'A real estate investment trust is a listed vehicle that owns or finances income-producing property and distributes most of its taxable income to unitholders or shareholders.',
    plain:
      'A REIT lets investors hold a share of a property business, such as offices, warehouses or shopping centres, through an exchange listing. Rules in most countries require REITs to pay out a large share of their income. Their returns depend on rents, occupancy, interest rates and property values.',
    example:
      'A hypothetical warehouse REIT earns ₹500 crore a year in rent after costs and distributes 90% of distributable income. With 100 crore units in issue, that is about ₹4.50 per unit. At a unit price of ₹100, the distribution yield would be about 4.5%.',
    why:
      'REITs give listed access to property markets in India and abroad. They are analysed with property-specific measures such as FFO and occupancy.',
    limitations:
      'REIT rules, tax treatment and payout requirements differ between countries. Standard earnings measures can be misleading for REITs because of large depreciation charges.',
    related: ['ffo', 'dividend-yield', 'yield', 'sector-allocation'],
    pages: [
      page('/reits/PLD', 'Prologis research'),
      learn('dividend-yield-explained', 'Dividend yield explained'),
      page('/research', 'Research'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'ffo',
    term: 'FFO',
    aliases: ['Funds from operations'],
    definition: 'Funds from operations is a REIT earnings measure that adds back depreciation and amortisation and removes gains on property sales from net income.',
    plain:
      'Property is depreciated in the accounts even though buildings and land often hold or gain value. FFO adds that non-cash charge back so the recurring income from property is easier to see. It also removes one-off gains from property disposals.',
    formula: 'FFO = net income + depreciation and amortisation − gains on property sales',
    example:
      'A hypothetical REIT reports net income of ₹300 crore, depreciation of ₹200 crore and a ₹50 crore gain from the sale of a building. Its FFO is 300 + 200 − 50 = ₹450 crore. With 100 crore units, FFO per unit is ₹4.50.',
    why:
      'FFO is the standard earnings measure for REITs and the basis of the price-to-FFO multiple. It gives a clearer view of recurring property income than net income.',
    limitations:
      'FFO ignores the capital spending needed to maintain properties; adjusted FFO (AFFO) tries to account for it. Definitions vary by company and country.',
    related: ['reit', 'free-cash-flow', 'dividend-yield'],
    pages: [
      page('/reits/PLD', 'Prologis research'),
      learn('reading-valuation', 'Reading valuation'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'roic',
    term: 'ROIC',
    aliases: ['Return on invested capital'],
    definition: 'Return on invested capital measures after-tax operating profit as a percentage of the capital invested in a business.',
    plain:
      'ROIC shows how much profit a company generates from the money tied up in its operations, from both shareholders and lenders. A business that earns more on its capital than that capital costs is creating value. Comparing ROIC across peers shows which businesses use capital most efficiently.',
    formula: 'ROIC = NOPAT ÷ invested capital (NOPAT = operating profit × (1 − tax rate))',
    example:
      'A hypothetical company has operating profit of ₹1,000 crore and a 25% tax rate, so NOPAT is ₹750 crore. Its invested capital is ₹5,000 crore. ROIC is 750 ÷ 5,000 = 15%.',
    why:
      'ROIC is a widely used measure of business quality and capital efficiency. Trends in ROIC show whether new investment is earning as much as the existing business.',
    limitations:
      'Invested capital can be defined in several ways, for example with or without goodwill, so figures differ between sources. It is less meaningful for banks and insurers.',
    related: ['free-cash-flow', 'p-e-ratio', 'ev-ebitda', 'revenue-growth'],
    pages: [
      learn('reading-valuation', 'Reading valuation'),
      page('/stocks/TSM', 'TSMC research'),
      page('/discover/screener', 'Screener'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'rsi',
    term: 'RSI',
    aliases: ['Relative strength index'],
    definition: 'The relative strength index is a momentum indicator that compares the size of recent gains with recent losses on a scale of 0 to 100.',
    plain:
      'RSI summarises whether recent price moves have been mostly up or mostly down. Readings near 100 mean gains have dominated; readings near 0 mean losses have. It is commonly calculated over 14 periods.',
    formula: 'RSI = 100 − 100 ÷ (1 + average gain ÷ average loss), over 14 periods',
    example:
      'Over 14 hypothetical days a stock’s average daily gain is ₹6 and its average daily loss is ₹3. Relative strength is 6 ÷ 3 = 2, so RSI is 100 − 100 ÷ 3 ≈ 66.7. If gains and losses were equal, RSI would be 50.',
    why:
      'RSI gives a compact view of recent price momentum. It is one of the most widely shown technical indicators.',
    limitations:
      'RSI describes past price movement only and says nothing about the business. It can stay at high or low readings for long periods, and settings vary between sources.',
    related: ['moving-average', 'volatility', 'market-breadth'],
    pages: [
      learn('technical-indicators', 'Technical indicators'),
      page('/stocks/AAPL', 'Apple research'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'moving-average',
    term: 'Moving average',
    definition: 'A moving average is the average of an asset’s prices over a fixed number of recent periods, recalculated as each new period is added.',
    plain:
      'A moving average smooths out day-to-day noise to show the underlying direction of prices. Common windows are 50 and 200 trading days. A simple moving average weights every day equally; an exponential one gives more weight to recent days.',
    formula: 'Simple moving average = sum of closing prices over n periods ÷ n',
    example:
      'A hypothetical share closes at ₹100, ₹102, ₹101, ₹104 and ₹103 over five days. Its five-day simple moving average is 510 ÷ 5 = ₹102. On the sixth day the oldest price drops out and the newest is added.',
    why:
      'Moving averages help show trend direction on charts and are used in many other indicators. Comparing the price with a long moving average gives a quick sense of the longer-term trend.',
    limitations:
      'Moving averages lag the price because they are built from past data. In sideways markets they can cross back and forth frequently and give little information.',
    related: ['rsi', 'volatility', 'market-breadth'],
    pages: [
      learn('technical-indicators', 'Technical indicators'),
      page('/indices/NIFTY-50', 'Nifty 50'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'depositary-receipt',
    term: 'Depositary receipt (ADR/GDR)',
    aliases: ['ADR', 'GDR'],
    definition:
      'A depositary receipt is a certificate issued by a depositary bank that represents a stated number of a foreign company’s shares and trades in another market and currency.',
    plain:
      'Depositary receipts let a company’s shares be traded outside its home market. American depositary receipts (ADRs) trade in the US in US dollars; global depositary receipts (GDRs) are typically listed in London or Luxembourg. Each receipt can represent one share, several shares or a fraction of a share, so the ratio matters when comparing prices.',
    formula: 'Implied ADR price = home-market share price × shares per ADR ÷ exchange rate (home currency per US dollar)',
    example:
      'A hypothetical Indian company’s share trades at ₹1,500 in India, and each ADR represents 2 shares. At ₹84 per US dollar, the implied ADR price is 1,500 × 2 ÷ 84 ≈ $35.71. A quoted ADR price of $36.20 would be about 1.4% above that parity.',
    why:
      'Many international companies, including several from India and Taiwan, are researched through their US listings. Understanding the ratio and currency avoids misleading price comparisons.',
    limitations:
      'The receipt and home share trade in different sessions and currencies, so prices can drift apart. Holder rights, fees and the conversion ratio can change, and some programmes are delisted.',
    related: ['share-class', 'market-capitalisation', 'trading-session', 'ist'],
    pages: [
      page('/stocks/TSM', 'TSMC research'),
      learn('global-markets-from-india', 'Global markets from India'),
      learn('currency-and-returns', 'Currency and returns'),
      page('/fx/USD-INR', 'USD/INR'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'share-class',
    term: 'Share class',
    definition: 'A share class is a category of a company’s or fund’s shares that carries its own set of rights, such as voting, dividends or fees.',
    plain:
      'Some companies issue more than one class of shares, for example one with more votes per share than another. Funds also use classes that differ by fee, currency or whether income is paid out or reinvested. Each class can have its own ticker and price.',
    example:
      'A hypothetical company has Class A shares with one vote each and Class B shares with ten votes each, both listed. Class A trades at ₹1,020 and Class B at ₹1,000. To compute market cap, both classes must be counted at their own prices.',
    why:
      'Share classes affect market capitalisation, index inclusion and voting control. INRGIFT identifies each listing with its own instrument id so classes are not confused.',
    limitations:
      'Data sources do not always combine classes the same way, so market cap and per-share figures can differ. Rights attached to each class are set out in company documents, not in price data.',
    related: ['market-capitalisation', 'depositary-receipt', 'index'],
    pages: [
      learn('what-is-a-stock', 'What is a stock?'),
      learn('market-cap-explained', 'Market cap explained'),
      page('/resources/data', 'Data and methodology'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'index',
    term: 'Index',
    definition: 'An index is a rules-based measure of the combined performance of a defined group of securities.',
    plain:
      'An index tracks a basket of securities, such as the 50 largest companies on an exchange, using published rules for selection and weighting. Its level shows how that basket has performed over time. Index funds and ETFs try to replicate an index’s return.',
    example:
      'A hypothetical index starts at 1,000 points. Its constituents gain a weighted average of 2% over a week, so the index ends near 1,020. Because it is market-cap weighted, a 10% rise in its largest constituent moves the index more than a 10% rise in its smallest.',
    why:
      'Indices are benchmarks for whole markets, sectors and themes. They are the reference point for tracking error, tracking difference and beta.',
    limitations:
      'Index rules shape the result: weighting method, rebalancing and whether dividends are included all matter. Price indices exclude dividends, so they understate total return.',
    related: ['market-capitalisation', 'etf', 'tracking-error', 'market-breadth', 'sector-allocation'],
    pages: [
      page('/indices/NIFTY-50', 'Nifty 50'),
      page('/indices/SP-500', 'S&P 500'),
      page('/markets', 'Markets'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'sector-allocation',
    term: 'Sector allocation',
    definition: 'Sector allocation is the breakdown of a fund or index by the industry sectors of its holdings, as percentages of total value.',
    plain:
      'Sector allocation shows which parts of the economy a fund or index is exposed to. Two funds with similar names can have very different sector mixes. Allocation changes as prices move and as holdings are rebalanced.',
    formula: 'Sector weight = value of holdings in the sector ÷ total value of holdings × 100',
    example:
      'A hypothetical ETF holds ₹1,000 crore of securities, of which ₹320 crore is in technology and ₹180 crore in financials. Its sector allocation is 32% technology and 18% financials. If technology shares rise 10% and others are flat, technology’s weight rises to about 34%.',
    why:
      'Sector concentration is a major driver of how a fund behaves. Comparing allocations helps explain differences in returns between funds or indices.',
    limitations:
      'Classification systems differ, and some companies span several sectors. Published allocations are snapshots that may lag the current holdings.',
    related: ['country-allocation', 'etf', 'index', 'market-breadth'],
    pages: [
      learn('sector-allocation-explained', 'Sector allocation explained'),
      learn('etf-holdings-explained', 'ETF holdings explained'),
      page('/etfs/SPY', 'SPY research'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'country-allocation',
    term: 'Country allocation',
    definition: 'Country allocation is the breakdown of a fund or index by the countries its holdings are associated with, as percentages of total value.',
    plain:
      'Country allocation shows how much of a fund is exposed to each national market. A global fund can be dominated by one country if that market is very large. Country is usually assigned by listing, headquarters or primary revenue source, depending on the provider.',
    formula: 'Country weight = value of holdings in the country ÷ total value of holdings × 100',
    example:
      'A hypothetical global equity ETF holds ₹500 crore of securities, ₹320 crore of which is in US companies and ₹25 crore in Indian companies. Its country allocation is 64% US and 5% India. A rupee investor in this fund is also exposed to US dollar movements.',
    why:
      'Country exposure drives currency risk, economic sensitivity and trading-hour differences. It helps you see what a “global” fund actually holds.',
    limitations:
      'A company listed in one country can earn most of its revenue elsewhere, so country labels are approximate. Providers use different rules, so allocations for the same fund may not match.',
    related: ['sector-allocation', 'etf', 'index', 'depositary-receipt'],
    pages: [
      learn('country-allocation-explained', 'Country allocation explained'),
      learn('currency-and-returns', 'Currency and returns'),
      page('/markets/all', 'All markets'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'data-status',
    term: 'Data status',
    definition: 'Data status is the label INRGIFT shows on every data module to state how current the figures are and when they were last updated.',
    plain:
      'Each module carries a badge and an exact timestamp. LIVE means streaming during the session; DELAYED means quotes lag the exchange by a stated interval; END_OF_DAY means figures are from the last close; CLOSED means the market is shut and the last close is shown; UNAVAILABLE means the source has no data for this item; STALE means the data is older than expected; ERROR means the latest update failed. A dash (—) means a value is unavailable and n/a means it does not apply; missing values are never shown as zero.',
    example:
      'A hypothetical quote panel for a US share shows DELAYED with a timestamp of 21:15:00 IST, so prices are up to the stated delay behind the exchange. Its dividend yield shows n/a because the company does not pay dividends. Its forward P/E shows — because the estimate is unavailable from the source.',
    why:
      'Knowing how fresh a number is matters as much as the number itself, especially across time zones. Clear labels prevent old or missing data from being mistaken for current figures.',
    limitations:
      'Status describes the feed, not the accuracy of the underlying source. Timestamps are shown in IST, so they need converting when comparing with an exchange’s local time.',
    related: ['ist', 'trading-session', 'liquidity'],
    pages: [
      learn('understanding-data-status', 'Understanding data status'),
      page('/resources/data', 'Data and methodology'),
      page('/markets', 'Markets'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'ist',
    term: 'India Standard Time (IST)',
    definition: 'India Standard Time is the single time zone used across India, set at UTC+5:30 with no daylight saving.',
    plain:
      'INRGIFT shows times in IST so you can read every market on one clock. Because India does not change its clocks, the IST time of an overseas session shifts when that country starts or ends daylight saving. A session that opens at the same local time all year can open an hour earlier or later in IST.',
    formula: 'IST = UTC + 5 hours 30 minutes',
    example:
      'A US exchange that opens at 9:30 local time opens at 19:00 IST during US daylight saving time and at 20:00 IST during US standard time. The exchange did not change its hours; only the clocks in the US moved. The same applies to European markets around their clock changes.',
    why:
      'Global market hours, calendar events and data timestamps are easier to compare on one clock. It also explains why overseas session times in IST change twice a year.',
    limitations:
      'Clock-change dates differ between countries, so there are weeks when only some overseas sessions have shifted. Exchange holidays are separate from time-zone effects and need checking in the calendar.',
    related: ['trading-session', 'data-status', 'depositary-receipt'],
    pages: [
      learn('global-market-hours-in-ist', 'Global market hours in IST'),
      page('/resources/calendar', 'Market calendar'),
      page('/markets/all', 'All markets'),
    ],
  },
  {
    ...META,
    type: 'glossary_term',
    slug: 'trading-session',
    term: 'Trading session',
    definition: 'A trading session is the period during which an exchange accepts and matches trades in listed instruments.',
    plain:
      'Each exchange sets its own session hours, often with a pre-open period, a main session and sometimes a closing auction. Outside these hours prices do not change on that exchange, even if news breaks. Holidays and half days vary by market.',
    example:
      'A hypothetical day: India’s main equity session runs 9:15 to 15:30 IST, while the US main session runs 19:00 to 01:30 IST during US daylight saving time. An ETF listed in India that holds US shares trades during India’s session, when its underlying market is closed.',
    why:
      'Session times explain why data shows CLOSED or END_OF_DAY and why prices can gap at the next open. They matter when comparing assets listed in different time zones.',
    limitations:
      'Sessions change with daylight saving, holidays and special trading days. Extended-hours activity in some markets is thinner and may not be reflected in every data source.',
    related: ['ist', 'data-status', 'liquidity', 'ex-dividend-date'],
    pages: [
      learn('global-market-hours-in-ist', 'Global market hours in IST'),
      learn('understanding-global-exchanges', 'Understanding global exchanges'),
      page('/resources/calendar', 'Market calendar'),
    ],
  },
];

/** All glossary terms, sorted alphabetically by term. */
export const GLOSSARY_TERMS: GlossaryTerm[] = [...TERMS].sort((a, b) =>
  a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }),
);
