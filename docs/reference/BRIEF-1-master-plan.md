# INRGIFT 2.0 — MASTER PRODUCT + DESIGN + BUILD PROMPT FOR CLAUDE

## 0. ROLE

You are acting as the combined:
- Principal Product Designer
- Senior Fintech UX Architect
- Design Systems Lead
- Staff Frontend Engineer
- Data-product Architect
- Accessibility reviewer
- Responsive design specialist
- Premium financial-product art director

Your task is to design and build a completely new INRGIFT global financial-market intelligence platform.

Do not make a minor redesign of the existing site.
Do not make a broker clone.
Do not make a generic fintech landing page.

Build a premium, product-led global financial application that can scale to all supported global markets and asset classes.

The product should feel credible enough to sit visually between:
- the clarity and restraint of Zerodha,
- the market analytics and visual tooling of FYERS,
- the workflow density and discovery of Dhan,
- the research depth of INDmoney,
- the global-investing feel of Vested,

while remaining unmistakably INRGIFT.

Use competitor patterns as inspiration for information hierarchy and interaction quality only. Do not copy their branding, layouts, proprietary copy, or visual identity.

---

# 1. PRODUCT NORTH STAR

Brand:
INRGIFT

Positioning:
GLOBAL MARKET INTELLIGENCE FROM INDIA

Primary product promise:
EVERY MARKET. EVERY ASSET. ONE RESEARCH VIEW.

Supporting positioning:
Global markets, understood from India.

Core experience:
SEARCH → DISCOVER → SCREEN → COMPARE → RESEARCH → VISUALIZE → SAVE → WATCH → ALERT

The site is research-first, not execution-first.

The product does not need to become a brokerage interface just because it has live market data.

The product should help users understand global markets quickly, then move into deeper research.


## 3A. NON-NEGOTIABLE PRODUCT SCOPE

INRGIFT is NOT a trading platform.

Do not design or imply:
- brokerage execution
- buy/sell workflows
- order tickets
- positions
- portfolio tracking
- deposits or withdrawals
- trading account balances
- brokerage integrations
- execution confirmations
- trading P&L dashboards

The user workspace is for RESEARCH DATA only.

Personal workspace may contain:
- Watchlists
- Alerts
- Saved Screeners
- Saved Comparisons
- Collections
- Saved Research
- Notes
- Recent assets
- Search/history
- Preferences
- Notifications

The product can display prices, market values, performance, volume, fundamentals, valuation, technicals and other market data, but those are informational/research features.

Primary user action:
DISCOVER → UNDERSTAND → COMPARE → SAVE → MONITOR

Never:
DISCOVER → BUY → SELL


---

# 2. BUSINESS CONTEXT

INRGIFT is expanding from a limited six-market concept into a true global market platform.

Do NOT limit the architecture to:
- United States
- United Kingdom
- Japan
- Singapore
- Hong Kong
- UAE

Those are only examples from the previous site.

The new architecture must support any market that the data layer supports.

Potential regions:
- North America
- Latin America
- Europe
- Asia-Pacific
- Middle East
- Africa

Potential markets include, where data is available:
US, Canada, Mexico, Brazil, UK, Germany, France, Switzerland, Netherlands, Italy, Spain, Sweden, Norway, Denmark, Finland, Poland, Japan, China, Hong Kong, India, Singapore, South Korea, Taiwan, Australia, New Zealand, UAE, Saudi Arabia, South Africa, and other supported markets.

Do not hard-code the site around a fixed market count.

Build a dynamic market/exchange architecture.

---

# 3. INRGIFT BRAND FOUNDATION

Current INRGIFT visual colors extracted from the existing site:

Primary blue:
#245BFE

Deep navy:
#071A33

Secondary text/slate:
#4A5770

White:
#FFFFFF

Recommended neutral additions:
#F7F9FC
#EEF2F7
#E5EAF1
#D7DEE8

Recommended semantic data colors:
Positive: restrained financial green
Negative: restrained financial red
Warning: restrained amber
Informational: INRGIFT blue

IMPORTANT:
The brand should remain primarily blue/navy/white.

Do not turn the entire UI green/red because it contains market data.

Green/red should be used for market movement and semantic state only.

Indian accent:
Use saffron/orange and green sparingly as contextual accents only.
Do NOT make the entire interface tricolour.
The Indian identity should live in product perspective, wording, INR context, IST context, GIFT City positioning, and investor context.

---

# 4. TYPOGRAPHY

Preferred:
- Headings: Manrope
- UI/body: Inter

Hierarchy:
- Hero: 52–64px desktop
- Page title: 32–40px
- Section heading: 22–28px
- Card heading: 16–20px
- Body/UI: 14–16px
- Metadata: 12–13px
- Dense data table: 12–14px

Use clear hierarchy.

Avoid oversized typography everywhere.
Product pages should be denser than marketing pages.

---

# 5. VISUAL LANGUAGE

The visual design should communicate:
- premium
- trustworthy
- global
- data-rich
- calm
- intelligent
- precise

Use:
- white and soft-gray workspaces
- subtle borders
- restrained shadows
- 10–14px radius
- generous whitespace on marketing surfaces
- denser layouts on market/product surfaces
- strong table alignment
- clear metric hierarchy
- minimal decorative imagery
- restrained animation
- subtle hover/focus states
- charts as the visual language rather than stock illustrations

Do NOT use:
- generic fintech illustrations
- giant stock-photo hero images
- excessive gradients
- glassmorphism everywhere
- excessive rounded pills
- loud neon trading-terminal aesthetics
- cluttered dashboard cards
- giant marketing paragraphs

---

# 6. APP SHELL

Every authenticated product page uses one common shell.

Desktop:

HEADER
- INRGIFT logo/wordmark
- Markets
- Assets
- Discover
- Research
- Resources
- global search
- display currency selector
- market-status shortcut
- notifications
- profile

SIDEBAR
- personal workspace


SIDEBAR PERSONAL DATA ONLY:
- Overview
- Watchlist
- Alerts
- Saved Screens
- Saved Comparisons
- Collections
- Saved Research
- Notes
- Recent
- History
- Settings
- Help

Do not put Portfolio anywhere in the sidebar.

Main sidebar:

MY WORKSPACE
- Overview
- Watchlist
- Alerts

DISCOVER
- Saved Screens
- Collections
- Recent

RESEARCH
- Saved Research
- Notes
- History

Bottom:
- Settings
- Help
- Profile shortcut

Sidebar:
- expanded: ~248px
- collapsed: ~64px

Header:
- ~64–68px

Mobile:
- top header
- search row
- bottom navigation:
  Home / Markets / Discover / Research / Workspace

---

# 7. GLOBAL HEADER

The global header must become simpler because the personal sidebar handles user data.

Desktop layout:

[INRGIFT] [Markets] [Assets] [Discover] [Research] [Resources]

                 [ Search anything... ]

                                   [INR] [Market status] [Bell] [Avatar]

Search is a first-class product interaction.

Search should cover:
- stocks
- ETFs
- indices
- currencies
- commodities
- bonds
- REITs
- markets
- exchanges
- research
- news
- collections
- themes

Keyboard shortcut:
Cmd/Ctrl + K

Search overlay:
- recent
- assets
- markets
- research
- news
- collections

Do not put portfolio value in the global header.

Do not put watchlists in the global header.

Those belong in the personal workspace.

---

# 8. PERSONAL SIDEBAR

The sidebar is a PERSONAL INTELLIGENCE WORKSPACE.

Show small counters when data exists:
- 12 watched
- 4 alerts
- 7 saved screens

Do not expose every feature as an icon.

Expanded sidebar example:

MY WORKSPACE
Overview
Watchlist
Portfolio
Alerts

DISCOVER
Saved Screens
Collections
Recent

RESEARCH
Saved Research
Notes
History

Settings
Help

The sidebar must support:
- hover
- active state
- collapsed mode
- keyboard navigation
- mobile drawer
- unread badge states

---

# 9. CORE INFORMATION ARCHITECTURE

Top navigation:

MARKETS
- Global Overview
- Markets Directory
- Heatmap
- Market Calendar

ASSETS
- Stocks
- ETFs
- Indices
- Currencies
- Commodities
- Bonds
- REITs
- Funds
- ADR/GDR where supported

DISCOVER
- Screener
- Compare
- Movers
- Collections
- Trending
- 52-week highs/lows

RESEARCH
- Stock Research
- ETF Research
- Market Research
- Themes
- Insights

RESOURCES
- News
- Earnings
- Dividends
- IPOs
- Learning
- Glossary
- Data & Methodology

PERSONAL:
- Overview
- Watchlist
- Portfolio
- Alerts
- Saved Screens
- Saved Research
- Notes
- History
- Settings
- Security

---

# 10. PUBLIC VS AUTHENTICATED EXPERIENCE

Public pages:
- Home
- Markets
- Assets
- Discover pages
- Research
- Resources
- About
- Pricing
- FAQ
- Support
- Contact
- Legal
- Login / Signup

Authenticated pages:
- personal overview
- watchlist
- alerts
- saved screens
- saved research
- notes
- history
- profile
- settings
- security

Public pages should NOT show a user sidebar.

Authenticated pages should use the full application shell.

---

# 11. HOMEPAGE

URL:
/

Purpose:
Make the homepage feel like a premium global market command center.

IMPORTANT:
Do not make it a long storytelling page like the current INRGIFT homepage.

It should show the product immediately.

Order:

1. Header
2. compact global market status strip
3. hero/search
4. global index strip
5. global heatmap
6. market movers
7. sectors
8. assets
9. themes
10. calendar
11. research
12. news
13. India-context block
14. CTA/footer

Hero:

"Invest globally. Understand everything."

Supporting:
"Every market. Every asset. One research view."

Primary search:
"Search stocks, ETFs, indices, currencies, commodities..."

Suggested examples:
NVIDIA
S&P 500
Toyota
Gold
USD/INR

CTA:
Explore Global Markets
Explore Assets

Do NOT use a giant hero illustration.

The first viewport should feel like a product.

---

# 12. GLOBAL MARKET STATUS STRIP

Immediately below hero/search:

Region labels:
Americas
Europe
Asia-Pacific
Middle East & Africa
India

Each:
Open / Closed / Pre-market / Holiday

Then index ticker:
S&P 500
NASDAQ
Dow
FTSE 100
DAX
Nikkei
Hang Seng
NIFTY 50
etc.

Each tile:
- name
- value
- 1D change
- mini sparkline
- status
- timestamp

---

# 13. MARKETS OVERVIEW

URL:
/markets

Purpose:
Full global market dashboard.

Modules:
- market sessions
- global indices
- global heatmap
- sector performance
- gainers
- losers
- most active
- FX
- commodities
- market news
- calendar

Top controls:
Region
Country
Market status
Asset class
Currency

Do not make this page visually identical to Home.
Home = quick global snapshot.
Markets = deeper dashboard.

---

# 14. MARKETS DIRECTORY

URL:
/markets/all

Purpose:
Scalable directory of all supported global markets.

Filters:
- region
- country
- exchange
- currency
- status
- asset coverage

Market cards/rows:
- market name
- exchanges
- currency
- local time
- IST time
- session status
- instruments covered
- headline indices

No hard-coded “six markets” language.

---

# 15. MARKET DETAIL

URL:
/markets/[market]

Example:
/markets/united-states

Header:
United States
NYSE · NASDAQ · NYSE Arca
USD
Open / Closed

Modules:
- headline indices
- market performance
- heatmap
- sectors
- gainers
- losers
- most active
- stocks
- ETFs
- currency
- news
- calendar
- related markets

Use one reusable market-detail template for every market.

---

# 16. GLOBAL HEATMAP

URL:
/discover/heatmap

This is a signature INRGIFT product.

Controls:
- Universe
- Group by
- Tile size
- Colour metric
- Time period

Group options:
- global market
- region
- country
- exchange
- sector
- industry
- asset type

Tile size:
- market cap
- volume
- AUM
- equal weight

Colour:
- 1D
- 1W
- 1M
- YTD
- 1Y
- volatility

Interactions:
- hover tooltip
- click opens quick detail
- double click opens asset page
- drill-down breadcrumbs

Breadcrumb:
Global → US → Technology → Semiconductors → NVIDIA

Use responsive zoom/pan.

---

# 17. ASSETS HUB

URL:
/assets

Hero:
"Explore global assets"

Sub:
"Every market. Every asset class. One research layer."

Asset classes:
- Stocks
- ETFs
- Indices
- Currencies
- Commodities
- Bonds
- REITs
- Funds
- ADR/GDR
- crypto where legally/product-wise appropriate

Browse:
- by market
- by sector
- by theme
- by behaviour

Behaviour:
- top gainers
- top losers
- most active
- 52-week highs
- 52-week lows
- high dividend
- high growth
- high volatility

---

# 18. STOCK DIRECTORY

URL:
/assets/stocks

Controls:
- search
- market
- region
- country
- exchange
- sector
- market cap
- currency

Tabs:
Overview
Valuation
Dividends
Growth
Trend

Table:
Company
Price
1D
1W
1Y
Market Cap
P/E
Forward P/E
Revenue Growth
ROIC
Dividend Yield
Beta
Volume
Watch

Every row:
- Research
- Chart
- Compare
- Watch
- Alert

---

# 19. STOCK DETAIL

URL:
/stocks/[exchange-symbol]

Header:
Company
Exchange
Ticker
Market
Currency
Market status

Hero metric:
Current price
1D change
1D percentage
timestamp
status badge

Actions:
Watch
Compare
Create Alert

Chart:
1D
5D
1M
3M
6M
YTD
1Y
3Y
5Y
MAX

Chart types:
Candle
Line
Area

Tools:
Indicators
Compare
Draw
Fullscreen
Volume
Crosshair
Zoom
Pan

Indicators:
SMA
EMA
RSI
MACD
Bollinger Bands
ATR
VWAP
Volume

Research tabs:
Overview
Valuation
Financials
Growth
Profitability
Risk
Dividends
Corporate Actions
Peers
News
Research

Use data-rich tables and charts.

---

# 20. INDEX DIRECTORY + DETAIL

Directory:
/assets/indices

Detail:
/indices/[index]

Metrics:
- current level
- 1D
- 1W
- 1M
- YTD
- 1Y
- 5Y
- breadth
- constituents
- sector weights
- top contributors
- top detractors
- related ETFs
- related market

---

# 21. ETF DIRECTORY

URL:
/assets/etfs

Filters:
- market
- issuer
- strategy
- sector
- geography
- benchmark
- asset class

Table:
ETF
Price
1D
1Y
3Y
5Y
AUM
Expense Ratio
Yield
Volume
Benchmark
Holdings count
Watch

Categories:
- broad market
- technology
- dividend
- bond
- commodity
- international
- sector
- thematic
- factor
- ESG
- emerging markets

---

# 22. ETF DETAIL

URL:
/etfs/[symbol]

Hero:
ETF name
exchange
ticker
strategy
price
1D move
status
timestamp

Modules:
- objective
- benchmark
- expense ratio
- AUM
- volume
- holdings
- sector allocation
- geographic allocation
- performance
- risk
- tracking difference
- distribution history
- related ETFs
- news
- research

Research CTA:
"Open 8-step ETF review"

---

# 23. ETF RESEARCH

URL:
/research/etfs

Signature framework:

01 Objective
02 Cost
03 Size
04 Liquidity
05 Holdings
06 Allocation
07 Performance
08 Risk

Each step:
- metric
- definition
- current reading
- historical chart where appropriate
- methodology
- research commentary

Optional research scores:
Cost
Liquidity
Diversification
Performance
Risk

Clearly label as:
"INRGIFT Research Score"

Never phrase as financial advice.

---

# 24. FX

Directory:
/assets/fx

Detail:
/fx/[pair]

Examples:
USD/INR
EUR/INR
GBP/INR
JPY/INR
USD/JPY
EUR/USD

Metrics:
spot/reference price
1D
1W
1M
1Y
volatility
high/low
chart
currency context
India context

Show:
"Approx INR value"
where appropriate.

---

# 25. COMMODITIES

Directory:
/assets/commodities

Examples:
Gold
Silver
Crude
Natural Gas
Copper
etc.

Detail:
price
contract/reference
currency
1D
1W
1M
1Y
chart
drivers
related equities
news
research

---

# 26. BONDS

Directory:
/assets/bonds

Filters:
- country
- issuer
- currency
- maturity
- yield
- credit quality

Detail:
price
yield
coupon
maturity
duration
credit rating
issuer
risk
yield history

---

# 27. REITs

Directory:
/assets/reits

Detail:
price
yield
FFO
occupancy
debt
market cap
property type
geography
distribution history

---

# 28. DISCOVER HUB

URL:
/discover

Feature:
The central discovery workspace.

Modules:
- Screener
- Heatmap
- Compare
- Movers
- Collections
- Trending
- 52-week highs/lows
- New listings where supported

Make this page feel like the product engine.

---

# 29. SCREENER

URL:
/discover/screener

This should be a serious global research workstation.

Top:
Universe
Stocks / ETFs / All
Region
Market

Filter builder:
- market
- sector
- industry
- market cap
- revenue
- revenue growth
- EPS
- EPS growth
- margins
- ROE
- ROIC
- P/E
- Forward P/E
- P/B
- EV/EBITDA
- dividend yield
- beta
- volatility
- RSI
- moving average
- volume
- performance
- risk

Support:
- AND
- OR
- nested groups

Top actions:
Save
Share
Duplicate
Export

Results:
live match count
customizable columns
sort
pagination / virtualization

Row actions:
Chart
Research
Compare
Watch
Alert

Saved screens can be personal.

---

# 30. COMPARE

URL:
/discover/compare

Support up to 4 assets.

Can mix:
- stocks
- ETFs
- indices where applicable

Top:
relative performance chart

Metrics:
- price
- 1D
- 1Y
- 3Y
- 5Y
- market cap
- revenue
- growth
- EPS
- P/E
- Forward P/E
- EV/EBITDA
- ROE
- ROIC
- beta
- volatility
- dividend
- ETF-specific metrics

Subtle best-in-row highlight.

Actions:
Save
Share
Watch

---

# 31. COLLECTIONS

URL:
/discover/collections

Examples:
- AI & Semiconductors
- Mega Caps
- Global Banks
- Dividend Leaders
- Clean Energy
- Healthcare
- Defence
- Robotics
- Emerging Markets
- Global ETFs

Collection detail:
- performance
- heatmap
- assets
- countries
- sectors
- related ETFs
- news
- research

---

# 32. TRENDING

URL:
/discover/trending

Tabs:
Stocks
ETFs
Indices
Markets
Themes

Rank by:
- price activity
- volume
- momentum
- search interest
- watchlist interest

Clearly distinguish measured metrics from editorial ranking.

---

# 33. RESEARCH HUB

URL:
/research

Purpose:
Premium market-intelligence content.

Tabs:
All
Markets
Stocks
ETFs
Themes
Macro

Modules:
- Featured
- Latest
- Trending
- Most read
- Market insights
- ETF frameworks
- global themes

Cards should always identify:
- asset
- market
- topic
- timestamp

---

# 34. STOCK RESEARCH

URL:
/research/stocks

Research structure:
- company
- what changed
- why it matters
- valuation
- growth
- profitability
- risk
- what to monitor
- peers
- related news

No buy/sell language unless backed by future compliance and product policy.

---

# 35. MARKET RESEARCH

URL:
/research/markets

For each market:
- current trend
- breadth
- sector leadership
- valuation context
- volatility
- currency
- macro drivers
- key risks
- notable movers
- upcoming events

---

# 36. THEMES

URL:
/research/themes

Examples:
- AI
- semiconductors
- defence
- energy
- healthcare
- banks
- robotics
- EV
- dividends
- emerging markets

Theme page:
- definition
- global performance
- constituent heatmap
- top companies
- ETFs
- markets
- sectors
- recent news
- research

---

# 37. NEWS

URL:
/resources/news

Categories:
Global
US
Europe
Asia
India
Technology
Energy
Financials
Macro

Each item:
- publisher
- timestamp
- headline
- related asset
- related market
- category
- source link

Prioritize:
- relevance
- recency
- source quality

News should link directly to assets/research.

---

# 38. EARNINGS CALENDAR

URL:
/resources/earnings

Views:
- today
- tomorrow
- this week
- next week
- calendar

Filters:
country
market
sector
market cap

Columns:
company
date
time
EPS estimate
revenue estimate
previous EPS
surprise where available

---

# 39. DIVIDEND CALENDAR

URL:
/resources/dividends

Columns:
company
ex-date
record date
pay date
amount
yield
frequency

Calendar and table view.

---

# 40. IPO CALENDAR

URL:
/resources/ipo

Tabs:
Upcoming
Priced
Listed
Recent

Filters:
country
exchange
sector

---

# 41. MARKET CALENDAR

URL:
/resources/calendar

Events:
- market holidays
- earnings
- dividends
- IPOs
- economic releases
- central bank decisions

Global timeline:
Today
Tomorrow
This week
Next week

---

# 42. LEARNING

URL:
/resources/learn

Sections:
- investing basics
- stocks
- ETFs
- fundamental analysis
- technical analysis
- risk
- global markets
- currencies
- portfolio construction

Premium editorial layout.
No childish illustrations.

---

# 43. GLOSSARY

URL:
/resources/glossary

Searchable.

Each entry:
- definition
- formula
- why it matters
- example
- related metrics
- related research

---

# 44. DATA + METHODOLOGY

URL:
/resources/data

Critical trust page.

Explain:
- data providers
- market coverage
- update frequency
- live vs delayed
- end-of-day
- exchange mapping
- market hours
- corporate actions
- ETF methodology
- research methodology
- calculations

Every major financial UI should expose a link back to relevant methodology.

---

# 45. USER OVERVIEW

URL:
/app

Authenticated only.

Header:
"Good morning, [user]."

Sub:
"Your global market workspace"

Modules:
- watchlist snapshot
- portfolio snapshot
- alerts
- saved screens
- recent research
- global market strip

---

# 46. WATCHLIST

URL:
/app/watchlist

Support multiple watchlists:
- All
- US Tech
- Global ETFs
- India
- My Ideas

Table:
asset
price
1D
1W
1M
1Y
volume
alert status

Quick actions:
chart
research
compare
remove
alert

---

# 47. PORTFOLIO

URL:

Phase 1:
manual portfolio

Phase 2:
broker/bank connection if product later supports it

Overview:
- total value
- day P&L
- total P&L
- allocation
- sectors
- markets
- currencies

Holdings:
asset
quantity
average
current
P&L

Do not imply trading execution until it exists.

---

# 48. ALERTS

URL:
/app/alerts

Alert types:
- price
- percentage move
- 52-week high/low
- technical
- earnings
- dividend
- news
- market event

Alert card:
condition
asset
status
created
last triggered

---

# 49. SAVED SCREENS

URL:
/app/screens

Card:
name
universe
filters
current match count
last updated

Actions:
open
edit
duplicate
delete
share

---

# 50. SAVED RESEARCH

URL:
/app/research

User can save:
- assets
- research pages
- articles
- themes
- ETF reviews

Organize with folders/tags.

---

# 51. NOTES

URL:
/app/notes

A personal research notebook.

Each note:
title
body
tags
linked assets
created
updated

Asset-linked notes should appear on the asset detail page.

---

# 52. HISTORY

URL:
/app/history

Show:
recent assets
recent screeners
recent comparisons
recent research
recent themes

Support clear-history control.

---

# 53. SEARCH

URL:
/search

But also accessible as Cmd/Ctrl+K command palette.

Search results grouped by:
- Assets
- Markets
- Research
- News
- Collections

---

# 54. LOGIN PAGE

URL:
/login

Desktop:
two-column layout.

Left:
INRGIFT
"Global markets. One intelligence platform."
"Research the world from India."

Right:
sign-in card.

Fields:
Email
Password

Links:
Forgot password
Create account

Alternative:
Continue with Google if later supported

Security message:
"Your watchlists, research and preferences are private."

Visual:
minimal, premium, calm.
No stock-photo background.
No giant chart clutter.

---

# 55. SIGNUP PAGE

URL:
/signup

Right-side form.

Fields:
Full name
Email
Country
Password
Confirm password

Terms checkbox.

CTA:
Create account

Progress:
1 Account
2 Verify
3 Personalise
4 Complete

After verification:
market preferences
asset interests
themes
currency
timezone

---

# 56. VERIFICATION PAGE

URL:
/verify

Message:
"Check your inbox"

Show masked email.

Actions:
Resend
Change email

Do not leak full email.

---

# 57. FORGOT PASSWORD

URL:
/forgot-password

Minimal:
email
send reset link

---

# 58. RESET PASSWORD

URL:
/reset-password

Fields:
new password
confirm password

Password rules visible.

---

# 59. ONBOARDING

URL:
/onboarding

Step 1:
Markets

Step 2:
Assets

Step 3:
Themes

Step 4:
Workspace

Allow skip.

Save preferences.

---

# 60. PROFILE

URL:
/account/profile

Fields:
name
email
country
currency
timezone
language

---

# 61. SETTINGS

URL:
/account/settings

Sections:
- general
- notifications
- display
- data preferences
- privacy
- accessibility

---

# 62. SECURITY

URL:
/account/security

Features:
password
2FA
sessions
login history
devices
sign out other sessions

---

# 63. NOTIFICATION CENTER

URL:
/notifications

Groups:
- market
- research
- account
- system

Unread count.

---

# 64. SUPPORT

URL:
/support

Search-first help center.

Categories:
- account
- markets
- data
- charts
- screeners
- watchlists
- alerts
- research

---

# 65. FAQ

URL:
/faq

Do not leave empty.

Categories:
Account
Data
Markets
Assets
Research
Security
Pricing

---

# 66. ABOUT

URL:
/about

Hero:
"Global markets, understood from India."

Sections:
- why INRGIFT
- global vision
- research approach
- data philosophy
- security
- no trading / no advice

Indian context:
India → GIFT City → global markets

Keep it sophisticated.

---

# 67. PRICING

URL:
/pricing

Remove any placeholder configuration text.

Initial state:
Free today.

Clearly show included features.

Later architecture:
Free
Pro
Research Pro
Team

Pricing cards should be ready to expand.

---

# 68. CONTACT

URL:
/contact

Categories:
- general
- partnerships
- data
- press
- support

---

# 69. LEGAL

Routes:
- /legal/privacy
- /legal/terms
- /legal/cookies
- /legal/risk-disclosure
- /legal/refund
- /legal/grievance

Use consistent legal template.

---

# 70. SYSTEM STATES

Every data-heavy page must support:

LIVE
DELAYED
END OF DAY
CLOSED
NO DATA
DATA UNAVAILABLE
ERROR
LOADING

Never use endless:
"Updating..."

Every numeric value must have a timestamp when possible.

Example:

"Delayed · 15 min"
"Updated 10:42 IST"

Where data is unavailable:
"Data unavailable from current source."
"Last available: [timestamp]"

---

# 71. ERROR PAGES

404:
"We couldn't find that market."

500:
"Something went wrong."
Show retry.

Empty state:
Explain what to do next.

Loading:
Skeletons, not giant spinners.

Partial data:
Render the page with clear per-module availability.

---

# 72. INDIA-FIRST CONTEXT LAYER

Indian context should appear intelligently.

Examples:
- INR conversion
- IST market hours
- USD/INR context
- local session times
- currency-adjusted performance
- "For Indian investors" research context
- India/global sector relationships

Do not make the entire visual interface overtly patriotic.

The India identity should be strategic, not decorative.

---

# 73. DATA ARCHITECTURE

Design frontend interfaces around normalized data.

Normalized Asset:

assetId
name
ticker
assetType
market
country
region
exchange
currency
price
change
changePct
volume
marketCap
timestamp
dataStatus
fundamentals
valuation
technicals
risk
dividends
corporateActions
holdings
allocation
news
metadata

Normalized Market:

marketId
name
country
region
currency
timezone
localTime
istTime
sessionStatus
hours
exchanges
indices
coverage

Do not couple the UI to provider-specific field names.

---

# 74. DATA PROVIDER ABSTRACTION

Use:

FRONTEND
↓
INRGIFT API
↓
NORMALIZATION LAYER
↓
PROVIDER ADAPTERS
↓
DATA PROVIDERS

The UI must not know provider implementation details.

Provider fallback should be possible.

Cache normalized records where appropriate.

---

# 75. CHART ARCHITECTURE

Charts should be components, not one-off pages.

Capabilities:
- line
- candle
- area
- volume
- comparison
- normalized performance
- indicators
- drawing
- crosshair
- zoom
- pan
- fullscreen

Use a shared chart shell across stocks, ETFs, indices, FX and commodities.

---

# 76. TABLE SYSTEM

All market tables should share:
- sticky header
- aligned numbers
- sortable columns
- customizable columns
- row hover
- responsive overflow
- keyboard focus
- watch button
- quick actions

On mobile:
- pinned asset/company column
- horizontal scroll for metrics
- condensed secondary data

Use virtualization when the dataset becomes large.

---

# 77. SEARCH SYSTEM

Search should be global and fast.

Ranking priority:
1. exact ticker
2. exact name
3. alias
4. exchange/ticker combination
5. market
6. research
7. news

Provide keyboard navigation.

---

# 78. ACCESSIBILITY

Minimum:
- keyboard navigation
- visible focus rings
- accessible labels
- semantic HTML
- adequate contrast
- chart text alternatives
- data status not conveyed by color alone
- table headers correctly associated
- reduced-motion preference
- screen-reader friendly controls

---

# 79. RESPONSIVE DESIGN

Breakpoints:
- desktop
- tablet
- mobile

Desktop:
full sidebar + multi-column dashboards

Tablet:
collapsible sidebar + dense cards

Mobile:
bottom navigation + drawer sidebar
full-width charts
horizontal table scroll
stacked research sections

Never simply shrink desktop CSS.

Design intentionally for each breakpoint.

---

# 80. ANIMATION

Use subtle, purposeful motion.

Examples:
- sidebar collapse
- search overlay
- heatmap drill-down
- card hover
- table refresh
- chart transition

Avoid:
- excessive parallax
- bouncing widgets
- distracting number animations

Data refresh should feel alive but calm.

---

# 81. PERFORMANCE

Priorities:
- fast first paint
- progressive data rendering
- skeleton states
- lazy-load heavy charts
- virtualized large tables
- cache static research
- incremental updates for live data
- avoid layout shifts

Do not block the whole page while one data module loads.

---

# 82. SEO + INDEXABILITY

Public pages should have:
- meaningful titles
- metadata
- OG tags
- canonical URLs
- structured data where appropriate
- clean routes
- crawlable research pages

Authenticated pages do not need to be SEO-focused.

---

# 83. DESIGN TOKENS

Create central tokens for:
- colours
- typography
- spacing
- radius
- shadows
- control heights
- sidebar widths
- breakpoints
- chart colors
- status badges

No random per-page values.

---

# 84. COMPONENT LIBRARY

Create reusable components for:

AppShell
Header
Sidebar
MobileNav
SearchCommand
MarketTicker
MarketCard
AssetRow
AssetTable
MetricCard
StatusBadge
Sparkline
ChartShell
Heatmap
FilterBuilder
FilterChip
CompareTable
NewsCard
ResearchCard
CalendarTable
WatchlistRow
AlertCard
CollectionCard
EmptyState
ErrorState
Skeleton
Modal
Drawer
Toast
Tooltip
Tabs
SegmentedControl
Select
DateRangeControl

---

# 85. PAGE TEMPLATES

Create reusable templates:

MarketOverviewTemplate
MarketDetailTemplate
AssetDirectoryTemplate
StockDetailTemplate
ETFDetailTemplate
IndexDetailTemplate
FXDetailTemplate
CommodityDetailTemplate
BondDetailTemplate
REITDetailTemplate
ResearchListTemplate
ResearchDetailTemplate
CalendarTemplate
AuthTemplate
SettingsTemplate
WorkspaceTemplate

---

# 86. CONTENT STYLE

Tone:
- precise
- intelligent
- confident
- calm
- Indian but global
- not salesy

Avoid:
"revolutionary"
"game-changing"
"best-ever"
"guaranteed"
"profit"
"get rich"

Use:
"research"
"understand"
"compare"
"track"
"explore"
"monitor"
"data"
"market context"

---

# 87. FINANCIAL DISCLAIMER LANGUAGE

The product is research/information oriented.

Do not represent research scores as financial advice.

Use clear:
"INRGIFT is a research platform, not a broker or investment adviser."

Data availability and latency should be transparent.

---

# 88. FOOTER

Keep footer premium and compact.

Company:
About
Contact
FAQ
Support

Explore:
Markets
Assets
Research
Learn
Calendar

Legal:
Privacy
Terms
Cookie
Risk Disclosure
Refund
Grievance

Account:
Sign in
Create account

Social:
X
Instagram
etc. where applicable

Risk statement.

Copyright.

No giant SEO keyword dump.

---

# 89. DESIGN QUALITY BAR

A page is not finished merely because it renders.

Each page must pass:

Visual hierarchy
Spacing consistency
Responsive behavior
Accessibility
Loading states
Empty states
Error states
Data-status states
Navigation
Hover/focus
Mobile behavior
Typography
Table alignment
Chart clarity
No placeholder content
No broken copy
No accidental config placeholders

---

# 90. CLAUDE BUILD PROCESS

Follow this implementation order:

PHASE 1:
Create design tokens
Create AppShell
Create Header
Create Sidebar
Create Search
Create responsive navigation

PHASE 2:
Home
Markets Overview
Market Directory
Market Detail
Heatmap

PHASE 3:
Assets Hub
Stocks Directory
Stock Detail
ETF Directory
ETF Detail
Index
FX
Commodities
Bonds
REITs

PHASE 4:
Discover
Screener
Compare
Collections
Trending

PHASE 5:
Research
Stock Research
ETF Research
Market Research
Themes
News
Calendar
Earnings
Dividends
IPO

PHASE 6:
User workspace
Overview
Watchlist
Portfolio
Alerts
Saved Screens
Saved Research
Notes
History

PHASE 7:
Auth
Login
Signup
Verification
Forgot password
Reset password
Onboarding
Profile
Settings
Security

PHASE 8:
Trust
About
Pricing
FAQ
Support
Contact
Data & Methodology
Legal

PHASE 9:
System states
404
500
Loading
Empty
No Data
Delayed
Closed
EOD

---

# 91. IMPLEMENTATION GUIDANCE

Prefer a modern component architecture.

If using Next.js:
- App Router
- Server Components where appropriate
- Client Components only where interaction requires them
- shared layout
- route-level loading
- error boundaries
- metadata
- responsive design
- accessible primitives

Keep domain logic separate from presentation.

Suggested layers:
components/
features/
lib/
data/
types/
app/

Do not put all business logic inside page components.

---

# 92. ROUTE MAP

Public:
/ 
/markets
/markets/all
/markets/[market]

/assets
/assets/stocks
/assets/etfs
/assets/indices
/assets/fx
/assets/commodities
/assets/bonds
/assets/reits
/assets/funds

/stocks/[symbol]
/etfs/[symbol]
/indices/[index]
/fx/[pair]
/commodities/[commodity]
/bonds/[bond]
/reits/[reit]

/discover
/discover/heatmap
/discover/screener
/discover/compare
/discover/collections
/discover/trending

/research
/research/stocks
/research/etfs
/research/markets
/research/themes

/resources/news
/resources/earnings
/resources/dividends
/resources/ipo
/resources/calendar
/resources/learn
/resources/glossary
/resources/data

/about
/pricing
/support
/faq
/contact

/login
/signup
/verify
/forgot-password
/reset-password

Authenticated:
/app
/app/watchlist
/app/alerts
/app/screens
/app/research
/app/notes
/app/history

/account/profile
/account/settings
/account/security

/notifications

/legal/privacy
/legal/terms
/legal/cookies
/legal/risk-disclosure
/legal/refund
/legal/grievance

---

# 93. DEFAULT DEMO DATA

For the visual prototype only, use realistic-looking but clearly demo/static data.

Do not imply demo values are current market prices.

When production API is connected, the data must come from the normalized API.

Recommended demo assets:
- NVIDIA / NVDA
- Apple / AAPL
- Microsoft / MSFT
- Amazon / AMZN
- Alphabet / GOOGL
- TSMC / TSM
- Toyota / 7203
- SAP / SAP
- Reliance / RELIANCE
- SPY
- QQQ
- VOO
- GLD

Use these only as prototype examples.

---

# 94. VISUAL BENCHMARK

The visual target:

Zerodha:
clarity + restraint

FYERS:
market depth + analytics

Dhan:
workflow density + discovery

INDmoney:
research depth

Vested:
global market feel

INRGIFT:
global breadth + India perspective + research intelligence

Do NOT visually replicate any benchmark exactly.

---

# 95. HOMEPAGE ACCEPTANCE TEST

A first-time user should understand within 5 seconds:

1. What INRGIFT is.
2. That it covers global markets.
3. That they can search assets.
4. That the product contains serious market intelligence.

The first viewport must not require scrolling to understand those four things.

---

# 96. PRODUCT EXPERIENCE ACCEPTANCE TEST

A user should be able to:

Search an asset
→ open asset
→ open chart
→ inspect metrics
→ compare
→ save
→ create alert

OR

Market
→ heatmap
→ sector
→ company
→ research
→ watchlist

OR

Screener
→ filter
→ result
→ chart
→ research
→ compare
→ save

These flows are more important than isolated visual polish.

---

# 97. FINAL QUALITY STANDARD

The finished product should look like a serious premium financial application.

The reaction we want:

"This looks like a global financial intelligence platform."

Not:
"This looks like a stock website."

Not:
"This looks like a broker clone."

Not:
"This looks like a generic SaaS template."

INRGIFT should feel:
- global
- premium
- calm
- intelligent
- trustworthy
- data-first
- research-first
- distinctly Indian in perspective

---

# 98. FINAL BUILD INSTRUCTION TO CLAUDE

Do not stop at wireframes.

Produce the actual high-fidelity product UI.

Start with:
1. App shell
2. Homepage
3. Markets Overview
4. Heatmap
5. Assets Hub
6. Stock Detail
7. ETF Detail
8. Screener
9. Compare
10. Login
11. Signup

Then use the same design system to complete all remaining routes.

Every screen should be:
- connected
- responsive
- interactive
- coherent
- polished
- production-minded

Do not leave placeholder config text.
Do not leave empty FAQ/support.
Do not leave endless Updating states.
Do not invent unsupported live market claims.

Where real API values are unavailable, explicitly use demo/static data in prototype mode.

Keep the architecture ready for a production global data API.

---

# 99. ONE-SENTENCE CREATIVE DIRECTION

Design INRGIFT as:

" A premium global financial intelligence workspace built from India — combining calm fintech simplicity with professional market analytics, research depth, global asset discovery, and a personal investor workspace. "


---

# 100. FINAL PRODUCT RULE — RESEARCH ONLY

INRGIFT is a premium GLOBAL MARKET INTELLIGENCE PLATFORM.

Its core job is:
- discover global markets
- explore global assets
- analyse prices
- inspect charts
- screen securities
- compare assets
- understand fundamentals
- research ETFs
- follow themes
- read market news
- monitor earnings/dividends/events
- save research
- create alerts
- maintain personal watchlists

It does NOT execute trades.

The design must never accidentally look like a brokerage:
- no Buy button
- no Sell button
- no Order button
- no Portfolio tab
- no Positions tab
- no Trading tab
- no account balance
- no cash balance
- no trade P&L dashboard
- no brokerage/order workflow

The premium feeling should come from:
DATA QUALITY
VISUAL ANALYTICS
RESEARCH DEPTH
GLOBAL COVERAGE
FAST DISCOVERY
PERSONAL RESEARCH WORKSPACE
TRUST + TRANSPARENCY

North-star workflow:

SEARCH
→ GLOBAL MARKET
→ HEATMAP
→ ASSET
→ CHART
→ FUNDAMENTALS
→ RESEARCH
→ COMPARE
→ SAVE
→ WATCH
→ ALERT

This is the final INRGIFT 2.0 product boundary.
