# Design tokens — BSR Market Intelligence

## Color

| Token | Value | Role |
|---|---|---|
| `--ink-950` | `#0A1D24` | Page text, sidebar background |
| `--ink-800` | `#16343D` | Sidebar hover, strong headings |
| `--ink-600` | `#3F5960` | Secondary text |
| `--ink-400` | `#4B5F65` | Muted labels, metadata (≥4.5:1 on paper, surface, surface-2) |
| `--paper` | `#F4F1E9` | App background |
| `--surface` | `#FCFBF7` | Cards, panels |
| `--surface-2` | `#EDE9DF` | Recessed areas, table headers |
| `--line` | `#D9D3C6` | Hairline borders |
| `--line-strong` | `#BEB5A4` | Emphasized dividers |
| `--copper` | `#B45B2D` | Primary accent, selection, AI provenance |
| `--copper-soft` | `#EAD2C1` | Accent wash |
| `--teal` | `#1D6A63` | Secondary data series, positive-neutral |
| `--positive` | `#2C7656` | Price up / success |
| `--negative` | `#AC423C` | Price down / error |
| `--warning` | `#9A6A18` | Delayed, pending, caution |
| `--restricted` | `#75405F` | Restricted classification |
| `--focus` | `#2C6E9C` | Focus ring |
| `--white` | `#FFFFFF` | Elevated surfaces |

Semantic red/green are reserved for direction and validation, never decoration. Classification uses a muted label + icon, not color alone.

## Dark theme

Dark mode keeps the same research-desk identity rather than inverting the product into a trading terminal. The page becomes deep petrol, surfaces lift slightly, and copper brightens for attention. Text, chart series, chips and heat cells resolve from tokens, so a theme switch re-renders both layout and SVG charts.

| Token | Dark value | Role |
|---|---|---|
| `--ink-950` | `#EEF4F1` | Primary text |
| `--ink-800` | `#D3E0DB` | Strong headings |
| `--ink-600` | `#ADC0BB` | Secondary text |
| `--ink-400` | `#93A8A3` | Muted labels (≥4.5:1 on dark surfaces) |
| `--paper` | `#07161B` | App background |
| `--surface` | `#0E232A` | Cards, panels |
| `--surface-2` | `#132D35` | Recessed areas, table headers |
| `--surface-elevated` | `#16343D` | Modals, report paper |
| `--line` | `#28444C` | Hairline borders |
| `--line-strong` | `#3A5A63` | Emphasized dividers |
| `--copper` | `#E09566` | Accent, selection, chart series |
| `--copper-dark` | `#E8AB83` | Accent text on dark |
| `--copper-wash` | `#3D261B` | Selected icon background |
| `--accent-bg` | `#B45B2D` | Copper button/avatar background with white text |
| `--nav-bg` | `#050F14` | Sidebar and sign-in brand ground |
| `--inverse-bg` | `#16343D` | Quick-query panel, toast, user bubble |
| `--chart-grid` | `#28444C` | Chart grid |
| `--heat-high` / `--heat-mid` | `#3C2B22` / `#22332F` | Correlation heat cells |

Theme rules:

- `data-theme="light|dark"` is set on `<html>` before first paint from `localStorage` key `bsr.theme`; without a saved choice it follows `prefers-color-scheme`.
- The switch is a two-button segmented control with visible text on wide screens and an accessible text label with icon at narrow widths.
- `color-scheme` follows the active theme so native form controls and scrollbars match.
- Print forces light tokens so a dark-screen report does not produce a dark PDF.
- Chart series, sparklines and forecast bars read `--copper`, `--teal`, `--positive` and `--negative` from the active theme at render time.

## Type

- Display: `"Be Vietnam Pro", "Segoe UI", Aptos, system-ui, -apple-system, sans-serif` at 38/30px, weight 400/500 — page titles, briefing headlines and report titles. The display face is the same Vietnamese-complete sans as the body; hierarchy comes from scale, leading and spacing rather than a second serif family. The design prototype loads Be Vietnam Pro from Google Fonts for preview fidelity; the application runs under CSP `font-src 'self'`, so it uses the same stack from locally installed fonts and falls back to Segoe UI/Aptos. Display tracking stays at or above −0.01em so stacked diacritics (ấ ầ ể ữ ộ) are not clipped. The earlier `Noto Serif`/Georgia stack was not actually rendered and has been removed from the token.
- Body/UI: `"Be Vietnam Pro", "Segoe UI", Aptos, system-ui, -apple-system, sans-serif` — navigation, labels, prose.
- Figures: `"Cascadia Mono", "SFMono-Regular", Consolas, monospace` — prices, percentages, timestamps, IDs.
- Scale: 11 / 12 / 13 / 14 / 16 / 20 / 28 / 38 px. Page title 38px desktop, 30px narrow. Table text 13px. Metadata 11–12px.
- Weights: 400 body, 500 emphasis, 600 labels, 700 figures. Display uses 400/500 only.

## Space, shape, elevation

- 4px base; common steps 4, 8, 12, 16, 20, 24, 32, 48.
- Radius: 2px controls, 4px cards, 999px pills. Avoid pill-heavy layouts.
- Border: 1px `--line`; selected state uses 2px copper inset or left rule.
- Shadow: `0 1px 2px rgba(10,29,36,.05), 0 8px 24px rgba(10,29,36,.06)` only for drawers/popovers.
- Density: compact but readable; 44px table rows, 56px nav items.

## Motion

- 120–180ms ease-out for drawers, hover, disclosure. Respect `prefers-reduced-motion`.
- No auto-rotating carousels or animated tickers.

## Charts

- Series: copper `#B45B2D`, teal `#1D6A63`, slate `#547078`, gold `#9A6A18`, plum `#75405F`.
- Grid: `#E2DDD1`; axis text `#4B5F65`; event marker: copper diamond with ink outline.
- Always label units; provide a table alternative; show missing data as gaps, not zero.
