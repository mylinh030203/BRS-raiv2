# Screen map — BSR Market Intelligence

Canonical prototype entry: `docs/design/prototype/index.html` (hash routes). Demo data is synthetic and labelled in the shell.

| ID | Screen / route | Purpose | Entry / exit | Priority content | States |
|---|---|---|---|---|---|
| S0 | Sign in `#login` | Choose a demo role and enter the workspace | Entry from app; exit to Overview | Product identity, role cards, security note | Default, loading (demo sign-in has no credential input, so no invalid state) |
| S1 | Overview `#overview` | Answer "what changed and why" in one screen | Default after sign-in; links to all modules | Market tape, metric cards with previous value and quality, Brent/WTI chart, key drivers, highlights with source/published/AI basis, AI briefing with change and BSR impact, quick query, data quality | Default, restricted hidden, stale data, briefing versions, drawer, light/dark |
| S2 | Market Data `#market-data` | Explore and compare time series with provenance | From Overview cards/tape; exit to News/Analysis | Instrument rail, range tabs, comparison chart, event markers, observation table, crack formula card | Default, single/compare, empty range, restricted instrument hidden, table view |
| S3 | Market News `#news` | Triage, filter and assess news with source attribution | From Overview highlights; exit to detail drawer/AI | Filter bar, feed, source attribution, duplicate links, feedback, coverage comparison | Default, filtered empty, processing, duplicate, restricted hidden, detail drawer |
| S4 | Forecast `#forecast` | Compare forecast versions and accuracy | From nav/Overview; exit to version drawer | Forecast table, source/horizon filters, accuracy metrics, error by source and horizon, version history, explicit no-trend note | Default, missing actual, version drawer, empty filter |
| S5 | Analysis `#analysis` | Inspect deterministic analytics and evidence | From nav/Market Data; exit to report | Evidence stack (observation/correlation/hypothesis/conclusion), seven-question impact frame, metrics, correlation matrix, assumptions, recommendation | Default, insufficient data, restricted hidden |
| S6 | AI Assistant `#assistant` | Ask permission-scoped questions and generate reports | From quick query/nav; exit to report builder | Chat, suggested prompts, structured answer table, citations, tool trace, attach, create-report and open-analysis actions | Default, processing, restricted refusal, fallback, error |
| S7 | Reports `#reports` | Build, version and export reports | From nav/assistant; exit to preview/print | Report list, builder, preview, regenerate as a new report from the same scope/adjust, version history, source ledger | Default, generating, export denied, preview drawer, regenerated report |
| S8 | Administration `#admin` | Inspect users, sources, AI executions and audit | Admin-only nav; exit to audit detail | Role matrix, data sources, AI execution table, audit log | Default, unauthorized (nav hidden + route denied), empty filter |
| S9 | Global overlays | Quick input, metric detail, news detail, forecast version, report preview, command search, notifications | Any screen | Contextual detail and actions | Open/close, focus return, validation error, success |
| S10 | Theme & language preferences | Switch display mode and language | Sign-in and top bar | Light/dark switch, VI/EN, persisted choice, system preference on first load | Light, dark, narrow icon-only theme control, print forced light |

## Key flows

1. **Morning triage:** sign in as Leadership → Overview → read tape and briefing → open Brent card drawer → inspect chart and sources → ask quick AI query → answer with citations.
2. **News review:** sign in as Market Intelligence → News → filter Geopolitics → open item → compare source coverage → mark important → feedback saved.
3. **Forecast check:** Forecast → filter Brent → open version history → compare EIA vs BSR → inspect error metrics.
4. **Report:** Reports → choose On-demand → set range → generate → preview → print/export (permission-gated) → version appears.
5. **Permission boundary:** switch to Internal → Restricted physical card and nav admin disappear; direct `#admin` shows denied state; AI question about physical price returns a refusal without data.
6. **Quick input:** Overview → Quick input → manual tab → choose instrument, value, timestamp, source → preview → confirm → toast + audit entry.
7. **Theme:** Sign in → top bar “Tối” → all screens, charts and drawers switch to dark → reload keeps dark → “Sáng” returns to light.
8. **Report revision:** Reports → preview a stored report → Regenerate creates a new report with the same type and date range; the original report and its immutable versions remain → Adjust loads the stored scope into the builder.

## Responsive behavior

- ≥1200px: sidebar expanded, 12-column content grid, right provenance rail.
- 768–1199px: sidebar collapsed by default, two-column content, rail moves below.
- <768px: off-canvas sidebar, single column, market tape scrolls horizontally, tables scroll, drawers full width; the theme switch keeps its icon and moves its text to the accessible label.

## Evidence locators

- Prototype: `docs/design/prototype/index.html#overview`, `#market-data`, `#news`, `#forecast`, `#analysis`, `#assistant`, `#reports`, `#admin`, `#login`.
- Theme switch: sign-in preferences and top bar, group label “Chế độ hiển thị”. Stored in `localStorage` key `bsr.theme`; first load follows `prefers-color-scheme`.
- Design review: `docs/design/review/REVIEW.md`.
