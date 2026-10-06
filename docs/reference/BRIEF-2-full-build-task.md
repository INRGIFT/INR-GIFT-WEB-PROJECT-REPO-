# INRGIFT — CLAUDE MASTER BUILD TASK
## Build the complete product in one pass: frontend + backend + UX/UI + motion + auth + demo data + architecture

You are the lead product designer, UX architect, frontend engineer, backend engineer, data architect, security engineer, and QA engineer for INRGIFT.

Build the complete INRGIFT web application end-to-end in one coherent implementation. Do NOT stop at a prototype, landing page, UI shell, static mockup, or design concept. Build the actual production-structured application with working navigation, responsive UX, reusable components, API-first data architecture, Supabase-ready authentication and user workspace, demo market data, loading/error/empty states, charts, heatmaps, screeners, compare workflows, research views, animations, and polished visual details.

IMPORTANT PRODUCT RULE:
INRGIFT IS A GLOBAL MARKET RESEARCH / DISCOVERY / INTELLIGENCE PRODUCT.
IT IS NOT A BROKER AND NOT A TRADING APP.
Never build or expose portfolio, order placement, buy/sell, positions, brokerage, deposits, withdrawals, execution, or brokerage P&L functionality.
There must be NO portfolio route, component, nav item, CTA, or fake trading action anywhere.

Do not use Lovable.
Use a clean modern stack such as Next.js + TypeScript + Tailwind CSS + shadcn/ui-style primitives or an equivalent custom design system. Use Supabase for authentication and private user research data. The application must be structured so that a paid real global market-data provider can be connected later without redesigning the UI or domain model.

================================================================================
1. PRODUCT POSITIONING
================================================================================

Brand:
INRGIFT

Positioning:
GLOBAL MARKET INTELLIGENCE FROM INDIA

Primary product promise:
EVERY MARKET. EVERY ASSET. ONE RESEARCH VIEW.

Supporting line:
GLOBAL MARKETS, UNDERSTOOD FROM INDIA.

Core user workflow:
SEARCH → DISCOVER → SCREEN → COMPARE → RESEARCH → VISUALIZE → SAVE → WATCH → ALERT

The experience should feel like a premium global financial intelligence platform:
- research-first
- data-first
- fast
- trustworthy
- calm
- institutional quality without looking institutional or old-fashioned
- understandable to serious retail investors and researchers in India

It should NOT feel:
- like a broker
- like a trading terminal
- like a generic SaaS dashboard
- like a crypto product
- like a template assembled from cards
- like a marketing site with fake finance imagery
- like a neon trading platform

================================================================================
2. DESIGN DIRECTION — EXACT VISUAL SYSTEM
================================================================================

Create one unified design system and use it everywhere.

Brand colors:
- Primary blue: #245BFE
- Deep navy: #071A33
- Secondary text/slate: #4A5770
- White: #FFFFFF

Recommended neutrals:
- App background: #F7F9FC
- Soft surface: #F2F5F9
- Border: #E5EAF1
- Strong border: #D7DEE8
- Hover surface: #EEF2F7
- Muted background: #F8FAFC

Semantic palette:
- Positive: restrained green, not neon
- Negative: restrained red, not neon
- Warning: restrained amber
- Informational: blue family

Do not overuse semantic colors. Use color primarily for meaning.

Typography:
- Headings/display: Manrope
- Body/UI/data: Inter
- Use real font weights and optical hierarchy; avoid giant oversized headings on data-heavy pages.
- Display/hero headings: 700–800
- Section headings: 650–750
- Body: 400–500
- Labels: 500–600
- Numeric emphasis: 550–700
- Tabular metrics should use clear numeric alignment and consistent digit formatting.

Type scale should be deliberate, approximately:
- Display: 48–64px desktop, 34–42px mobile
- H1: 38–46px
- H2: 28–34px
- H3: 20–24px
- Large metric: 28–40px
- Body: 14–16px
- Small UI: 12–13px
- Micro labels: 11px only when genuinely useful

Use comfortable line-height:
- Display 1.05–1.15
- Headings 1.15–1.25
- Body 1.45–1.65

Buttons:
- Height 40px standard
- Height 44px primary/action
- Height 32–36px compact controls
- Radius 10–12px
- Medium font weight
- Primary: #245BFE with white text
- Secondary: white or soft-gray with border
- Tertiary/ghost: transparent with strong hover state
- Destructive: muted red, only when actually destructive
- Never use pill buttons everywhere; reserve pills for filters/statuses where appropriate.
- Button text should be short and action-oriented: Explore, Compare, Screen, Save, Add Alert, View Research, etc.

Inputs/search:
- 44–48px height for primary search
- 40–44px for standard controls
- clear focus ring
- subtle border
- no oversized rounded “chat” shapes
- search should feel like a professional market terminal/research command bar, but remain accessible

Cards:
- Radius 12–14px
- 1px border
- extremely light shadow only where hierarchy requires it
- generous internal spacing
- no excessive floating-card stacking
- prefer sections and well-aligned surfaces over dozens of disconnected cards

Charts:
- charts are part of the visual identity
- no decorative chart noise
- thin gridlines
- high readability
- smooth but restrained interaction
- consistent time-range controls
- benchmark overlays where useful
- tooltip design must be premium and compact
- support light/dark chart themes if practical, but default product theme is light

Spacing:
Use a consistent 4px base with 8px rhythm.
Desktop content should generally use a 1200–1440px max-width.
Large data pages can use wider 1440–1600px canvas where justified.
Mobile gutters 16px.
Tablet 24px.
Desktop 24–40px depending on section.

Borders:
Use borders to establish hierarchy rather than heavy shadows.

Icons:
Use Lucide or equivalent professional outline icon set.
Icon stroke width around 1.75–2.
Do not mix icon families.

Backgrounds:
Primarily light, calm, premium workspaces.
Do not use giant gradients as page backgrounds.
Use subtle blue-tinted accents sparingly.

No stock photos.
No generic finance illustrations.
No meaningless decorative 3D graphics.
No glassmorphism-heavy UI.
No excessive blur.

================================================================================
3. BRAND EXPERIENCE
================================================================================

The emotional qualities should be:
Clarity
Control
Trust
Depth
Speed
Calm confidence

Design benchmark:
A premium global financial research product that combines the information architecture discipline of a serious market terminal with the usability of a modern consumer product.

The interface should progressively reveal complexity:
- basic overview first
- advanced controls available when needed
- detailed research one layer deeper
- no overwhelming wall of numbers by default

================================================================================
4. RESPONSIVE UX
================================================================================

Build desktop-first but fully responsive.

Desktop:
- top navigation
- optional authenticated left sidebar
- wide research/data canvas
- multi-column layouts
- richer comparison and screening controls

Tablet:
- collapsible sidebar
- reduced density
- responsive tables
- condensed controls

Mobile:
- top header
- compact search
- horizontally scrollable tabs where needed
- sticky contextual controls
- bottom navigation:
  Home
  Markets
  Discover
  Research
  Workspace

On mobile, prioritize the core journey:
search → asset → research → compare/save/watch

Tables:
- never let mobile become unreadable
- use responsive column prioritization
- allow horizontal scroll when required
- preserve sticky symbol/name column for key financial tables where practical

================================================================================
5. GLOBAL NAVIGATION
================================================================================

Public top navigation:
Markets
Assets
Discover
Research
Resources

Header utilities:
- universal search
- market/currency context
- notification icon when authenticated
- account/avatar
- sign in / sign up when public

Do not put:
Portfolio
Orders
Positions
Brokerage
Trading
Buy/Sell

Authenticated workspace sidebar:

MY WORKSPACE
- Overview
- Watchlist
- Alerts

DISCOVER
- Saved Screens
- Saved Comparisons
- Collections
- Recent

RESEARCH
- Saved Research
- Notes
- History

SYSTEM
- Settings
- Help

Do not put portfolio anywhere.

================================================================================
6. FULL INFORMATION ARCHITECTURE / ROUTES
================================================================================

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
 /faq
 /support
 /contact
 /login
 /signup
 /verify
 /verify-phone
 /forgot-password
 /reset-password
 /legal/privacy
 /legal/terms
 /legal/cookies
 /legal/risk-disclosure
 /legal/refund
 /legal/grievance

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

Build route structure cleanly with reusable layouts and route-level loading/error boundaries.

================================================================================
7. HOMEPAGE — PRODUCT-LED, NOT MARKETING-HEAVY
================================================================================

The homepage should quickly communicate that INRGIFT is a market research platform.

Suggested structure:
1. Header
2. Strong compact hero:
   GLOBAL MARKET INTELLIGENCE FROM INDIA
   EVERY MARKET. EVERY ASSET. ONE RESEARCH VIEW.
   Search-first interaction
3. Market status strip
4. Global indices snapshot
5. Global heatmap preview
6. Top movers
7. Sector snapshot
8. Asset discovery
9. Themes
10. Upcoming calendar
11. Research / insights
12. Latest global market news
13. India context
14. Footer

The homepage must feel useful even before sign-in.

Do not make the hero 60% of the page.
Do not create a generic SaaS hero with giant whitespace and meaningless gradients.

================================================================================
8. MARKETS EXPERIENCE
================================================================================

Markets overview:
- global market status
- indices
- country/region grouping
- session status
- market open/closed/delayed badges
- major movers
- market breadth
- sector performance
- currencies
- key macro events

Global markets should be dynamically data-driven, not hardcoded to only six countries.

Regions:
- North America
- Latin America
- Europe
- Asia-Pacific
- Middle East
- Africa
and future provider-supported regions

Market examples:
US, Canada, Mexico, Brazil, UK, Germany, France, Switzerland, Netherlands, Italy, Spain, Sweden, Norway, Denmark, Finland, Poland, Japan, China, Hong Kong, India, Singapore, South Korea, Taiwan, Australia, New Zealand, UAE, Saudi Arabia, South Africa, plus future supported markets.

Market counts should come from config/database, not hardcoded page text.

================================================================================
9. ASSET EXPERIENCE
================================================================================

Asset classes:
Primary:
- Stocks
- ETFs
- Indices
- FX

Secondary:
- Commodities
- Bonds
- REITs
- Funds

Architect the domain so more classes can be added later.

Asset pages should be research-first.

Generic asset detail structure:
1. identity/header
2. quote / status
3. chart
4. overview
5. performance
6. valuation / fundamentals when applicable
7. technicals when applicable
8. related instruments
9. dividends / corporate actions when applicable
10. news
11. research
12. notes / watch / alerts
13. source + data status

Asset header actions:
- Watch
- Alert
- Compare
- Research
No Buy/Sell action.

================================================================================
10. STOCK RESEARCH EXPERIENCE
================================================================================

Create professional equity research pages with:
- company identity
- listing / exchange
- price and timestamp
- market status
- performance
- market cap
- valuation
- growth
- margins
- profitability
- leverage
- efficiency
- dividends
- technical summary
- earnings
- corporate actions
- peers
- related news
- research documents
- notes
- compare/watch/alert actions

Avoid pretending every metric exists for every security.
Show:
Available
Unavailable
Not applicable
rather than fake zeros.

================================================================================
11. ETF RESEARCH EXPERIENCE
================================================================================

ETF pages should be especially deep.

Include:
1. Overview
2. Performance
3. Holdings
4. Allocation
5. Sector exposure
6. Geographic exposure
7. Fees
8. AUM
9. Tracking
10. Distributions
11. Risk
12. Related ETFs
13. News/research
14. Save/watch/alert

Support:
- holdings table
- top holdings
- concentration
- country weights
- sector weights
- asset mix
- issuer information
- expense ratio
- distribution history
- benchmark where available

================================================================================
12. INDICES / FX / COMMODITIES / BONDS / REITS
================================================================================

Build first-class detail templates for each.

Indices:
- quote
- performance
- chart
- constituents where available
- sector/country exposure when available
- related ETFs

FX:
- pair
- spot quote
- performance
- chart
- market/session context
- related pairs

Commodities:
- benchmark quote
- chart
- contract/reference context
- performance
- related instruments

Bonds:
- identity
- issuer
- maturity
- coupon/yield fields where available
- duration/risk fields where available
- chart/data as supported

REITs:
- quote
- valuation
- yield/distributions
- fundamentals
- property/segment metadata when available

================================================================================
13. GLOBAL HEATMAP — SIGNATURE FEATURE
================================================================================

This should feel like a flagship INRGIFT product.

Controls:
- Universe
- Group by
- Tile size
- Colour metric
- Period

Group by:
- Region
- Country
- Exchange
- Sector
- Industry
- Asset type

Tile size:
- Market cap
- Volume
- AUM

Colour metric:
- 1D
- 1W
- 1M
- YTD
- 1Y
- Volatility

Interaction:
Global → Region → Country → Sector → Industry → Asset

Features:
- hover details
- tooltip
- click through
- smooth transitions between hierarchy levels
- legend
- filters
- search
- responsive layout

Heatmap should gracefully handle unavailable metrics.

================================================================================
14. SCREENER
================================================================================

Build a serious global screener.

Categories:
Fundamental
Valuation
Technical
Risk
Growth
Dividend
Market
Asset metadata

Support:
- AND
- OR
- nested groups
- ranges
- greater/less than
- in-list
- text filters
- country
- region
- exchange
- sector
- industry
- market cap
- currency
- asset type

Custom columns:
Allow users to select visible columns.

Actions:
Chart
Research
Compare
Watch
Alert

Saving:
- save screen
- rename
- duplicate
- delete
- share-ready URL architecture
- export architecture
- recent screens

Build a polished filter-builder UX.
Do not make the screener look like an admin form.

================================================================================
15. COMPARE
================================================================================

Support up to 4 assets.

Assets can be:
- stocks
- ETFs
- indices where meaningful

Comparison sections:
- price
- performance
- risk
- valuation
- fundamentals
- dividends
- technicals
- fees for ETFs
- other relevant metadata

Features:
- normalized performance chart
- period selector
- benchmark option where supported
- aligned metrics
- better/worse/neutral visual cues
- save comparison
- recent comparison history

Comparison should remain readable on mobile.

================================================================================
16. DISCOVER
================================================================================

Discover hub:
- heatmap
- screener
- compare
- trending
- collections
- movers
- sectors
- themes
- popular assets
- region discovery

Create editorial-quality section hierarchy while keeping the product research-focused.

================================================================================
17. RESEARCH
================================================================================

Research hub:
- stocks
- ETFs
- markets
- themes

Research content types:
- structured research
- educational notes
- market commentary
- data-driven insights
- methodology

Avoid personalized investment advice.

Do not add:
- buy rating
- sell rating
- personalized target price
- “you should buy”
without an explicit reviewed legal/compliance product decision.

================================================================================
18. RESOURCES
================================================================================

Implement:
News
Earnings
Dividends
IPO
Calendar
Learn
Glossary
Data / Methodology

Calendar should include:
- earnings
- dividends
- IPOs
- market holidays
- macro events when supported

================================================================================
19. INDIA CONTEXT
================================================================================

India should be a subtle differentiator, not the entire brand.

Useful context:
- INR conversion
- IST market session context
- USD/INR
- currency impact
- “India context” modules
- GIFT City perspective where relevant

Do not overuse Indian flags, orange/green themes, or patriotic decoration.

================================================================================
20. SEARCH — CORE PRODUCT
================================================================================

Universal search is critical.

Search everything:
- company
- ticker
- ETF
- index
- FX pair
- commodity
- bond
- REIT
- country
- exchange
- sector
- industry
- research
- themes

Search UX:
- keyboard friendly
- instant suggestions
- grouped by asset class
- symbol + name + exchange/country
- recent searches
- empty state with examples
- no-results state with useful alternatives
- slash shortcut or equivalent desktop affordance

On asset pages, searching another asset should be frictionless.

================================================================================
21. AUTHENTICATION
================================================================================

Use Supabase Auth with:
- email/password
- phone OTP
- email verification
- phone verification
- password reset
- MFA

Preferred MFA:
TOTP authenticator
Phone MFA can also be supported.

Signup:
email/password
→ email verification
→ phone OTP verification
→ MFA enrollment
→ onboarding
→ workspace

Login:
email/password OR phone OTP
→ MFA when required
→ workspace

Security:
- resend cooldown
- attempt/rate-limit states
- error states
- expired token states
- session handling
- secure cookie-based SSR session architecture
- no service-role key in client code

Security page should show:
- email verified
- phone verified
- TOTP status
- MFA status
- active sessions
- security activity

================================================================================
22. USER WORKSPACE / SUPABASE DATABASE
================================================================================

Private tables:
profiles
user_preferences
watchlists
watchlist_items
alerts
saved_screens
saved_comparisons
saved_research
notes
recent_history
notifications

RLS:
- auth.uid() = user_id
- child records checked against parent ownership
- never trust client-supplied ownership fields

No portfolio schema.
No order schema.
No position schema.
No brokerage schema.

Create clean types and data-access functions.
Keep provider/data tables separate from user-private tables.

================================================================================
23. BACKEND / DATA ARCHITECTURE
================================================================================

Frontend NEVER directly reads mock JSON or external provider URLs.

Architecture:
UI
→ INRGIFT API
→ data services
→ DemoProvider now
→ RealProvider later

Provider interface should support:
searchAssets
getAsset
getQuote
getOHLCV
getFundamentals
getValuation
getTechnicals
getDividends
getCorporateActions
getETFProfile
getETFHoldings
getETFAllocations
getIndexData
getFX
getCommodities
getBonds
getREITs
getNews
getMarket
getMarketSessions

API examples:
GET /api/v1/markets
GET /api/v1/markets/:market
GET /api/v1/exchanges
GET /api/v1/assets
GET /api/v1/assets/search
GET /api/v1/assets/:id
GET /api/v1/assets/:id/price
GET /api/v1/assets/:id/ohlcv
GET /api/v1/assets/:id/fundamentals
GET /api/v1/assets/:id/valuation
GET /api/v1/assets/:id/technicals
GET /api/v1/assets/:id/dividends
GET /api/v1/assets/:id/news
GET /api/v1/assets/:id/research
GET /api/v1/etfs
GET /api/v1/etfs/:id/holdings
GET /api/v1/etfs/:id/allocations
GET /api/v1/indices
GET /api/v1/fx
GET /api/v1/commodities
GET /api/v1/bonds
GET /api/v1/reits
GET /api/v1/heatmap
GET /api/v1/movers
GET /api/v1/sectors
GET /api/v1/calendar
GET /api/v1/earnings
GET /api/v1/dividends
GET /api/v1/news
GET /api/v1/research
GET /api/v1/themes
GET /api/v1/search

Internal ingestion routes must be server protected.

API envelope:
{
  "data": ...,
  "meta": {
    "timestamp": "...",
    "source": "demo-provider",
    "dataStatus": "LIVE"
  }
}

List responses also contain pagination metadata.

Error envelope:
{
  "error": {
    "code": "DATA_UNAVAILABLE",
    "message": "..."
  }
}

================================================================================
24. NORMALIZED MARKET DATA MODEL
================================================================================

Core normalized entities:
regions
countries
exchanges
market_holidays
issuers
instruments
listings
market_prices
ohlcv
fundamentals
valuation_metrics
technical_metrics
dividends
corporate_actions
etf_profiles
etf_holdings
etf_allocations
index_profiles
fx_pairs
commodity_profiles
bond_profiles
reit_profiles
news_articles
news_assets
research_documents
research_assets
themes
theme_assets
calendar_events
data_sources
data_entitlements

Identity model:
Company/Issuer
→ Security/Share Class
→ Listing
→ Exchange/MIC
→ Provider Symbol

Use immutable internal instrument_id.
Never use ticker as the primary internal identity.

Support:
- cross-listings
- ADR/GDR
- multiple share classes

================================================================================
25. DEMO PROVIDER / DEMO DATA
================================================================================

Build a realistic DemoProvider that looks and behaves like a real data service.

Seed examples across:
US
India
Japan
UK
Germany
France
Singapore
Hong Kong
Canada
Australia
South Korea
Taiwan
UAE
Saudi Arabia

Example assets:
NVDA
AAPL
MSFT
AMZN
GOOGL
TSM
7203
SAP
RELIANCE
SPY
QQQ
VOO
GLD

Include demo cases for:
LIVE
DELAYED
END_OF_DAY
CLOSED
UNAVAILABLE
STALE
ERROR

Also include examples of:
- no fundamentals
- no ETF holdings
- cross-listed security
- FX
- commodity
- bond
- REIT
- market holiday

Do not use fake data carelessly in the interface.
Label demo data visibly in development mode.

================================================================================
26. DATA STATUS / TRUST UX
================================================================================

Every market-data response should carry:
- source
- timestamp
- timezone
- ingested_at
- status

Allowed statuses:
LIVE
DELAYED
END_OF_DAY
CLOSED
UNAVAILABLE
STALE
ERROR

Never show indefinite “Updating...”.

Display status elegantly:
- small status badge
- exact timestamp
- tooltip with source/methodology where relevant

Build a reusable DataStatus component.

================================================================================
27. DATA QUALITY / FALLBACK ARCHITECTURE
================================================================================

Validation:
- OHLC consistency
- nonnegative volume
- timestamp validity
- sequence checks
- currency validity
- exchange validity
- duplicate detection
- stale detection
- split/dividend adjustment checks

Invalid data should be quarantinable.

Provider fallback architecture:
Primary
→ Secondary
→ Last-known-good

Record provenance.

Data entitlements should exist in the schema so the frontend knows whether a piece of market data may be displayed.

================================================================================
28. MARKET CALENDAR
================================================================================

Do NOT hardcode weekday/time rules.

Use exchange-specific session metadata:
- timezone
- regular session
- pre-market
- post-market
- breaks
- holidays
- half-days
- auctions
- special closures

Create a market calendar service that powers market status UI.

================================================================================
29. CHART ARCHITECTURE
================================================================================

Abstract charts behind a ChartShell component.

Use a charting solution that can later be swapped without rewriting pages.
Prefer TradingView Lightweight Charts or equivalent if licensing/attribution is compatible.

Chart capabilities:
- line
- area
- candlestick
- volume
- benchmark comparison
- range selector
- tooltip
- crosshair
- responsive resize
- loading skeleton
- empty state
- unavailable state

Do not hardwire the entire application directly to the chart library.

================================================================================
30. ANIMATION / MOTION SYSTEM
================================================================================

Animations should make the interface feel premium, not flashy.

Use a consistent motion language:
- 120–180ms micro interactions
- 180–280ms panel transitions
- 250–400ms route/section reveals when useful

Use easing such as:
ease-out
cubic-bezier(0.22, 1, 0.36, 1)

Use motion for:
- dropdown opening
- filter chips
- tab transitions
- sidebar collapse
- modal entry
- toast
- skeleton completion
- heatmap drilldown
- compare transitions
- saved/watch/alert confirmations
- chart range changes
- hover elevation

Use subtle page section reveal only on marketing/editorial areas.
Data-heavy dashboards should prioritize speed.

Respect prefers-reduced-motion.
Never make critical information dependent on animation.

Microinteraction details:
- buttons compress slightly on press
- hover surfaces brighten subtly
- active nav indicator animates smoothly
- watch/save action confirms with small scale/check transition
- alert creation confirms with concise toast
- skeletons use low-contrast shimmer, not flashy gradients

================================================================================
31. LOADING / EMPTY / ERROR STATES
================================================================================

Every major component needs:
- loading
- success
- empty
- unavailable
- error
- stale where relevant

Create reusable:
Skeleton
EmptyState
ErrorState
DataStatus
InlineError
Toast
Retry
NoResults

Avoid blank white pages during loading.

Examples:
“No fundamentals available for this security.”
“Data unavailable from source.”
“Market closed.”
“Last updated 14:32 IST.”
“Demo data — connect a live provider to enable production market feeds.”

================================================================================
32. ACCESSIBILITY
================================================================================

Target WCAG-conscious UX.

Requirements:
- keyboard navigation
- visible focus states
- semantic HTML
- ARIA where needed
- accessible dialogs
- screen-reader labels for icon-only buttons
- sufficient contrast
- no color-only meaning
- reduced motion support
- logical tab order
- skip-to-content where appropriate

================================================================================
33. PERFORMANCE
================================================================================

Prioritize:
- fast initial render
- route-level streaming/loading where useful
- image-free lightweight visual language
- code splitting
- dynamic imports for heavy charts/heatmaps
- memoized expensive calculations
- virtualized long lists/tables where needed
- server-side rendering / server components where appropriate
- client components only when interaction requires them

Avoid unnecessary dependencies.

================================================================================
34. COMPONENT / DESIGN SYSTEM ARCHITECTURE
================================================================================

Create reusable primitives:
Button
IconButton
Input
SearchBox
Select
Combobox
Tabs
Badge
StatusBadge
Card
Panel
Metric
MetricGrid
Table
DataTable
Pagination
Tooltip
Popover
Dropdown
Dialog
Drawer
Toast
Breadcrumbs
SegmentedControl
FilterChip
FilterBuilder
DateRange
ChartShell
ChartToolbar
Heatmap
EmptyState
ErrorState
Skeleton
DataStatus
SaveButton
WatchButton
AlertButton
CompareButton
AssetHeader
AssetIdentity
ResearchSection
NewsList
CalendarList

Create shared layout primitives:
PageContainer
PageHeader
Section
SplitPane where needed
WorkspaceLayout
PublicLayout
AuthenticatedLayout
MobileBottomNav

================================================================================
35. DATA TABLE UX
================================================================================

Financial tables need:
- aligned numeric columns
- sticky headers
- sort
- filter
- row hover
- row actions
- pagination
- loading skeleton
- empty state
- mobile adaptation

Use consistent number formatting:
- currency
- percentages
- large numbers
- decimals
- dates
- volume
- market cap

Do not randomly vary precision.

================================================================================
36. NOTIFICATIONS / ALERTS
================================================================================

Alerts are research alerts, not trade alerts.

Examples:
- price crosses threshold
- percentage move
- valuation threshold
- dividend event
- earnings event
- major data/research change

Alert UX:
- create
- edit
- pause
- resume
- delete
- history
- notification channel architecture

Never translate alerts into orders.

================================================================================
37. WATCHLISTS / SAVED RESEARCH
================================================================================

Watchlists:
- create
- rename
- delete
- reorder
- add/remove asset
- show status
- show performance
- show latest research/news

Saved research:
- save
- organize
- tag
- recent
- notes

Collections:
- organize related assets/research

Recent history:
- assets
- screens
- comparisons
- research

================================================================================
38. SETTINGS / ACCOUNT
================================================================================

Profile:
- name
- profile information

Preferences:
- default currency
- locale
- timezone
- market display preferences
- notification preferences

Security:
- email
- phone
- MFA
- sessions
- security activity

Do not include brokerage settings.

================================================================================
39. SEO / PUBLIC CONTENT
================================================================================

Public pages should have:
- semantic metadata
- title templates
- descriptions
- Open Graph basics
- canonical architecture
- structured internal linking

Asset pages should be indexable when public.
Private workspace pages should not be indexed.

================================================================================
40. SEO-FRIENDLY URL ARCHITECTURE
================================================================================

Prefer clean URLs:
 /stocks/AAPL
 /stocks/NVDA
 /etfs/SPY
 /indices/NIFTY-50
 /markets/US
 /markets/Japan
 /discover/heatmap
 /discover/screener

Internally still use immutable IDs.

================================================================================
41. SECURITY
================================================================================

Never expose:
- Supabase service-role key
- provider secret keys
- private credentials

Use:
- server-side environment variables
- secure session handling
- RLS
- input validation
- authorization checks
- rate limiting architecture
- safe error messages
- secure headers where appropriate

Validate all user-controlled input.

================================================================================
42. ONBOARDING
================================================================================

After signup:
- welcome
- choose default currency
- choose regions/markets of interest
- choose asset classes
- choose themes/interests
- suggest initial watchlist/research collection
- enter workspace

Do not force users to configure everything.
Allow skip.

================================================================================
43. UX COPY
================================================================================

Tone:
clear
intelligent
professional
calm
direct

Avoid:
hype
“make money fast”
guaranteed returns
aggressive trading language
clickbait

Good wording:
“Explore global markets”
“Research this asset”
“Compare”
“Add to watchlist”
“Create alert”
“View holdings”
“See market context”
“Data source”
“Last updated”

================================================================================
44. PRICING / PLAN UX
================================================================================

Create pricing page architecture for future plans, but do not invent complex entitlements beyond what is needed.

Possible structure:
Free
Pro
Future/Enterprise

Make pricing focused on research functionality and data depth, not trading benefits.

================================================================================
45. FOOTER / TRUST
================================================================================

Footer should include:
- product links
- resources
- legal
- data/methodology
- privacy
- terms
- risk disclosure
- support
- contact

Include a subtle statement clarifying that INRGIFT is a research/information platform and not a broker.

================================================================================
46. DEMO MODE
================================================================================

Because live global market data will be purchased later:
- implement full application with DemoProvider
- make demo mode realistic
- make provider interface production-ready
- show a small “Demo Data” indicator in development/demo environment
- centralize provider selection in configuration
- do not scatter mock-data conditions throughout UI components

The future integration should be:
UI unchanged
API unchanged where possible
Provider adapter swapped/configured

================================================================================
47. CODE QUALITY
================================================================================

Use:
- TypeScript strict mode
- clean domain types
- feature-oriented folders
- reusable hooks
- shared utilities
- schema validation
- clear API contracts
- no giant monolithic component files

Keep components composable.

Recommended conceptual structure:
app/
components/
features/
lib/
services/
providers/
types/
db/
supabase/
styles/
public/

Separate:
UI
domain logic
data access
provider integration
database
auth

================================================================================
48. TESTING
================================================================================

Include:
- unit tests for key utilities
- component tests for critical components where practical
- API/service tests
- auth flow tests
- screener logic tests
- responsive smoke tests
- error state tests

Critical acceptance journeys:
1. visitor lands on homepage
2. searches for AAPL
3. opens stock page
4. switches chart period
5. opens research
6. adds watchlist
7. creates alert
8. compares AAPL/NVDA/MSFT
9. opens global heatmap
10. drills down
11. opens screener
12. builds filter
13. saves screen
14. signs up
15. verifies email
16. verifies phone
17. enrolls MFA
18. enters workspace
19. sees private watchlist
20. refreshes session safely
21. resets password
22. logs out
23. reopens and authenticates

================================================================================
49. DEMO SEED CONTENT
================================================================================

Seed enough realistic data to make every major page visually complete:
- multiple regions
- multiple countries
- exchanges
- indices
- stocks
- ETFs
- FX pairs
- commodities
- bonds
- REITs
- sectors
- industries
- themes
- calendar events
- news
- research
- technical metrics
- fundamentals
- valuation
- dividends

No page should feel unfinished just because live APIs are not connected.

================================================================================
50. FINAL QUALITY BAR
================================================================================

Before considering the build complete, inspect every route.

Check:
- spacing consistency
- typography consistency
- hover states
- focus states
- disabled states
- loading states
- empty states
- error states
- stale states
- responsive behavior
- animation consistency
- no accidental trading language
- no portfolio UI
- no broken routes
- no fake dead buttons
- no duplicated visual patterns that should be components
- no console errors
- no obvious hydration errors
- no inaccessible dialogs
- no overflow bugs
- no mobile navigation problems

The product should look like a serious company could launch it, even though the market data is currently demo data.

================================================================================
51. EXECUTION ORDER
================================================================================

Execute in this order without waiting for intermediate approval:

A. Establish project architecture and design tokens.
B. Build the global component/design system.
C. Build public layout and authenticated workspace layout.
D. Build navigation, search, responsive shell, and mobile bottom nav.
E. Build DemoProvider + normalized data model + API layer.
F. Build markets and asset pages.
G. Build charts and research modules.
H. Build heatmap.
I. Build screener.
J. Build compare.
K. Build discover/research/resources.
L. Build Supabase auth flows.
M. Build private workspace data with RLS-ready queries.
N. Build watchlists, alerts, saved screens, saved comparisons, saved research, notes, history, notifications.
O. Build settings/security.
P. Add loading/error/empty/stale states.
Q. Add motion and microinteractions.
R. Add SEO, accessibility, performance optimization.
S. Add tests.
T. Perform a complete visual + functional pass over the entire app.
U. Fix inconsistencies before stopping.

Do not stop after the first working version.
Do not ask for approval between these phases unless there is a genuinely blocking external dependency.
Use sensible demo values and clearly mark them as demo data.

================================================================================
52. DELIVERABLE
================================================================================

Deliver:
1. Complete working frontend
2. Complete backend/API architecture
3. Demo market data provider
4. Supabase-auth-ready integration
5. Private user workspace data model
6. Reusable design system
7. Responsive desktop/tablet/mobile UX
8. Motion/animation system
9. Error/loading/empty states
10. Full route architecture above
11. Clean code organization
12. Testing coverage for critical flows
13. Environment variable template
14. Clear README
15. Provider interface documentation explaining exactly where a future real data provider will be connected

Most important:
DO NOT BUILD A PRETEND PRODUCT.
BUILD THE REAL PRODUCT STRUCTURE NOW, WITH DEMO DATA AS THE CURRENT DATA SOURCE.

The result should be:
PREMIUM
FAST
RESEARCH-FIRST
GLOBAL
RESPONSIVE
ACCESSIBLE
ANIMATED WITH RESTRAINT
DATA-DENSE WHERE NEEDED
EASY TO UNDERSTAND
READY FOR REAL DATA LATER

INRGIFT = GLOBAL MARKET INTELLIGENCE FROM INDIA.
