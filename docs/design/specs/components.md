# Components — BSR Market Intelligence

## App shell

- **Sidebar** (264px, collapsible to 72px): wordmark, module groups, active route marked by copper left rule and warm surface; bottom shows data-policy summary and user. Collapse control uses `aria-expanded`; icons have accessible names. On narrow widths it becomes an off-canvas panel with a visible trigger and backdrop.
- **Top bar** (64px): breadcrumb, as-of timestamp with freshness dot, global search trigger, notifications, theme switch, language switch, role switcher (demo), user menu. Sticky.
- **Market tape** (48px): horizontally scrollable key values with unit, change and status; not auto-animated. Restricted values absent for unauthorized roles.

## Data display

- **Metric card**: label, value + unit, absolute and percentage change, previous value, quality state, sparkline, source + market/ingestion time, data-status chip, classification mark. Entire card is a button opening a detail drawer. Keyboard focus visible. The drawer exposes previous value, absolute/percentage change, both timestamps, data status, quality and classification as a definition list.
- **Data status chip**: text + dot, not color alone. Real-time = teal dot; Delayed/EOD = warning; Manual = slate outline.
- **Classification tag**: `P`/`I`/`C`/`R` + label; restricted tag includes lock icon.
- **Provenance line**: source · market time · ingested time, monospace timestamps, 11px. Always present on analytical claims.
- **Time-series chart**: line/area, optional comparison series, event markers, hover/focus tooltip, table view toggle, range tabs, unit label, missing data gaps.
- **Data table**: sticky header, right-aligned numeric columns, monospace figures, 44px rows, row action opens detail. Horizontal scroll wrapper at narrow widths.
- **Source ledger**: ordered list of citation chips with source, time and object ID. Used by briefing, analysis, report and AI answers.
- **Highlight row**: headline, type chip (`Source fact` / `AI interpretation`), source, published time, topics and, for AI content, an explicit basis line. Source facts and AI interpretation never share the same styling.

## AI surfaces

- **AI response block**: distinct copper left rule + "AI interpretation" label; optional structured result table; create-report and open-analysis actions; evidence chips beneath; tool trace disclosure. Source facts are quoted with attribution; calculations are labelled "Deterministic".
- **Chat composer**: textarea, attach control, send button, suggested prompts. Enter sends, Shift+Enter newline. Processing indicator is textual and announced.
- **Briefing card**: version, generated time, data cut-off, headline, 24h moves, drivers, watch list, change-vs-previous block, potential BSR impact block, source ledger. "Regenerate" creates a new local version while preserving prior.
- **Report builder**: type, date range, scope, preview, generate; version list and PDF print action. Export disabled with explanation when unauthorized. Report preview adds Regenerate (new immutable version), Adjust (loads the stored scope into the builder) and a version history list.

## Feedback and states

- **Drawer**: right-side, 480–560px, focus moves into panel, ESC/close returns focus, backdrop click closes. Header, scroll body, footer actions.
- **Dialog**: centered for quick input, max 640px, explicit cancel/confirm, input retained on validation error.
- **Toast**: bottom-right, announced politely, auto-dismiss after 5s, dismiss control.
- **Empty state**: explains what is missing and the next permitted action.
- **Error state**: what failed, what was retained, retry path.
- **Disabled state**: visible reason via text or tooltip, not opacity alone.
- **Permission state**: unauthorized data is absent; a "Restricted data hidden" note may explain the boundary without revealing content.
- **Theme switch**: two-button segmented control with sun/moon icons, `aria-pressed`, persisted in `localStorage`; wide screens show "Sáng/Tối", narrow screens keep the icon and accessible label.

## Analysis

- **Evidence stack**: four adjacent levels (observed data, statistical correlation, explanatory hypothesis, evidence-supported conclusion), each with a label and one-sentence explanation; collapses to two columns and then one at narrow widths.
- **Market impact frame**: seven numbered questions (event, affected markets, mechanism, supporting evidence, what could change the read, what to watch next, uncertainty); the last item spans the row.
- **Forecast accuracy breakdown**: error by source and by horizon, each with MAE and sample size `n`; a note states that a quality trend needs at least three evaluation periods and is not invented for a one-period demo.
