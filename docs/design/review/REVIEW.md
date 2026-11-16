# Design review — BSR Market Intelligence prototype

## Revision 2 — PDF-aligned design and dual theme (2026-11-16)

Scope: reconcile the prototype with the design requirements in `BSR Market Intelligence Requirements (2).pdf` (navigation, market snapshot fields, provenance in highlights, AI briefing, forecast accuracy, analysis evidence levels, AI assistant, reporting) and add a persisted light/dark theme switch. Prototype only; backend and `app/static` are unchanged.

Implemented in `docs/design/prototype/assets/{styles.css,app.js,data.js,i18n.js}` and `docs/design/prototype/index.html`:

- Light and dark token sets, pre-paint theme restore, sign-in and top-bar segmented switch, persisted `bsr.theme`, system preference on first load, print forced to light tokens.
- Snapshot cards add previous value and quality state; the observation drawer exposes previous value, absolute/percentage change, both timestamps, status, quality and classification.
- Highlights expose source and published/generated time, with an explicit basis line for AI interpretation.
- AI briefing adds change-vs-previous and potential BSR impact blocks.
- Forecast adds MAE by source and horizon with sample size; a note states that a quality trend needs three evaluation periods instead of inventing one.
- Analysis adds a four-level evidence stack and a seven-question market impact frame.
- Assistant crack answer includes a structured table and create-report/open-analysis actions; the report builder receives the assistant question.
- Report preview adds regenerate (new immutable version), adjust (loads stored scope) and version history.
- New UI copy is added to the Vietnamese catalog; generated report titles are translated by a pattern.

Self-verification evidence (not an independent verdict):

| Check | Result |
|---|---|
| `node --check` on `app.js`, `i18n.js`, `data.js` | PASS (no syntax errors) |
| Browser diagnostics after login, overview, forecast, analysis, assistant, reports, regenerate, mobile | No console errors or failed requests |
| axe-core WCAG 2.0/2.1/2.2 A+AA, overview light | 0 violations; 1 incomplete (user labels overlap, chart SVG text); 2 omitted |
| axe-core WCAG 2.0/2.1/2.2 A+AA, overview dark | 0 violations; same incomplete rule |
| Theme switch on sign-in and top bar | Switches and re-renders; reload keeps the saved theme |
| Theme switch bug found during verification | `closeOverlays()` threw on the sign-in screen because the drawer did not exist; guarded, then re-tested |
| Mobile 390×844 top bar | Breadcrumb hid, theme/language/role controls no longer overlap; icon-only theme control keeps its accessible label |
| Report generate → regenerate | New v2 created, v1 retained in history, toast and title localized |
| AI crack query | Structured table, sources, tool trace, create-report and open-analysis actions rendered |
| Market Data and News, dark | Tables, charts, status chips and restricted-source rows inspected with the dark tokens |

Rendered evidence: `.rai/screenshots/browser/final-light-overview.png`, `final-dark-overview.png`, `final-login-dark.png`, `final-analysis-dark.png`, `final-market-data-dark.png`, `final-news-dark.png`, `final-mobile-light.png`, `final-mobile-dark-topbar.png`, `final-mobile-topbar-fixed.png`, `rev-dark-forecast.png`.

Known gaps: `window.print`/PDF output was not exercised (CSS forces light tokens); manual screen-reader and full keyboard journey were not run; axe reports one incomplete color-contrast rule for overlapping top-bar labels and chart SVG text, which requires manual review.

### Independent review round 1

Verdict: **PASS WITH FINDINGS** (no blocker). Seven findings were raised: narrow snapshot cards, chart labels at 390, toast covering report-drawer actions, display typography not matching the serif claim, market tape hiding USD/VND at 1440, report sources reduced to IDs, and mixed-language AI/chart/export labels.

Dispositions:

| Finding | Disposition | Evidence after fix |
|---|---|---|
| F1 narrow snapshot cards | Fixed: one column below 480px | `final-mobile-overview-fixed.png`; fields now read as full-width units |
| F2 chart labels at 390 | Fixed: compact 420-unit chart, three grid intervals and 14px SVG text at ≤760; phone charts re-render compact | Chart text measured 14px at 390; overview snapshot shows four y labels; axe 390 light: 0 violations |
| F3 toast covers drawer actions | Fixed: `drawer-open`/`modal-open` body classes move the toast above the mobile footer or left of the desktop drawer | `final-mobile-report-toast.png` (footer actions visible), `final-desktop-report-toast.png` |
| F4 display typography | Resolved by contract, not font swap: docs/tokens/CSS now state the display face is Be Vietnam Pro at editorial scale; the unimplemented serif claim was removed | `manifesto.md`, `design-tokens.md`, `styles.css` display token |
| F5 tape hides USD/VND at 1440 | Fixed: tighter tape items and hidden 8px time at 761–1500 so all five values fit | `final-desktop-tape.png` shows Brent, WTI, RON95, crack and USD/VND |
| F6 report sources are raw IDs | Fixed: report ledger shows display name, source ID and source/ingestion time | Report preview after generate: ICE/CME/Platts/Reuters rows with IDs and times |
| F7 mixed-language labels | Fixed: AI adapter meta, AI source chips, chart names and disabled export titles localized; technical IDs remain in tool trace | Assistant answer: “Diễn giải AI · Bộ nối demo Auker · giá trị tất định từ dữ liệu đã lưu”; overview chart name fully Vietnamese |

### Delta review round 2

The first delta review confirmed F1 and F3–F6 fixed, F2 fixed on fresh load but found a resize defect (F2-R), and F7 fixed for named labels but left English event-marker labels (F7-R). Dispositions:

| Finding | Disposition | Evidence after fix |
|---|---|---|
| F2-R charts do not rebuild on viewport change | Fixed: `render()` records compact mode; a debounced `resize` handler re-renders when crossing 760, and a `load` handler catches a viewport change before the listener. Chart builders read the live viewport. | 390→1440→390 without reload: chart y-label count 4→5→4; event labels remain localized; no overlay loss on ordinary resize |
| F7-R event-marker labels English | Fixed: markers use `I18N.event`, translated titles and `t('Event: {title}')`; `<title>` also uses localized title/source | Overview chart at 390 and 1440 reads “Sự kiện: Gián đoạn vận tải Biển Đỏ lan rộng” and “Sự kiện: Tồn kho dầu thô Mỹ giảm mạnh hơn dự kiến” |
| F3 minor footer wrap | Fixed: mobile drawer footer uses tighter padding/font and nowrap; four actions read on one line | Report preview at 390: Tạo lại · Điều chỉnh · Xuất bị từ chối · Đóng all visible |
| F5 minor empty tape tail | Accepted as a deliberate density tradeoff: all five values are visible; freshness remains in cards and the top-bar as-of | `final-desktop-tape.png` |
| F1 longer mobile page | Accepted: one-column cards are legible and the tape stays at the top | `final-mobile-overview-fixed.png` |

### Delta review round 3

The focused delta reviewer confirmed F2-R, F7-R and the mobile footer PASS, but found two severity-1 side effects: the live toast was replaced when a breakpoint crossing re-rendered `#app`, and closing an overlay after a skipped crossing could leave the page chart in compact mode. Dispositions:

| Finding | Disposition | Evidence after fix |
|---|---|---|
| Toast lost on breakpoint crossing | Fixed: `#toast-stack` and `#print-root` moved outside `#app` in `index.html`; `render()` no longer replaces the live stack | Role-switch toast remained visible after resizing 1280→390; no console errors |
| Stale compact chart after closing overlay | Fixed: resize during an open overlay sets `pendingChartRefresh`; `closeDrawer`/`closeModal` schedule a refresh when no overlay remains | 390 metric drawer → 1440 (overlay open) → close: overview chart rebuilt to five y-labels at 1440 |

### Final verification

Independent delta verification returned **PASS**:

- Toast survival: a role-switch toast remained in the single body-level `#toast-stack` after a 390→1440 crossing, then expired on its normal timer; console diagnostics were empty.
- Deferred chart refresh: 390 metric drawer → 1440 with the drawer open → close: the overview chart rebuilt to the five-label desktop build. Same-viewport close did not re-render and returned focus to the opener.
- Remaining known limitation (severity 1, accepted): the cross-viewport deferred refresh re-renders the page after `closeDrawer()` restores focus, so focus lands on `body` in that rare sequence. No functional or data impact; same-viewport close is unaffected. Mitigation would be to restore focus after the deferred render.
- `#print-root` relocation is source-verified; actual `window.print`/PDF output remains unverified in this harness.
- The login screen has no toast-producing action, so the toast path there is source-established only.

### Final review/verify after R1–R4

Independent combined review (profile=code; code-quality, security, testing, conformance references) and runtime verification returned:

```
REVIEW_VERDICT: PASS
VERIFY_VERDICT: PASS
VERDICT: PASS
```

| Finding | Disposition | Evidence |
|---|---|---|
| R1 undefined semantic tokens | Fixed: `--teal`, `--positive`, `--negative`, `--warning`, `--restricted`, `--focus` defined in light and dark | Dark tape dot computes `#6fbfb2`; `+1.07` `#78c99a`; `-0.45` `#e88f88`; WTI series re-resolves; dark non-text contrast 6.7–8.2:1 against `--surface` |
| R2 localized news search | Fixed: haystack includes localized labels and raw fields | VI “Biển Đỏ” → 1 mục; raw “Red Sea” → 1 mục |
| R3 executions one render behind | Fixed: execution unshifted before render | “Lần chạy gần đây” immediately shows the new `AI-DEMO-…` execution with the answer |
| R4 blank news body | Fixed: blank body uses fallback | Empty intake body renders “Đang chờ xử lý.”, not an empty paragraph |

Coverage gaps retained from the final pass: manual screen-reader reading order not run; dark non-text contrast is computed from token values rather than pixel-sampled; intermediate widths 481–759 px not sampled; no automated prototype test suite exists (the Python `tests/` suite covers the backend, not this static prototype).

### Keyboard and print follow-up

- Theme switch, language switch and role select now restore focus to the activated control after the render; verified with Enter/Tab and `document.activeElement`.
- Metric drawer: Tab stays inside the open drawer (event marker inside the drawer receives focus), Escape closes it and returns focus to the opener; the cross-viewport deferred refresh now restores focus to the exact metric card (zone-aware selector), not the tape control.
- Print/PDF: the real export path was exercised with `window.print` stubbed and print media emulated. The body entered `drawer-open printing-report`, `#print-root` received the report, the print capture was light/report-only, and the generated PDF is one page with the source ledger. Evidence: `D:/tmp/bsr-print-check/report-print.png` and `report-print.pdf`.
- Coverage note: the OS print dialog itself is not displayed in the harness; print-media rendering and the DOM path are verified, not the native dialog. Manual screen-reader reading order remains untested. No automated prototype test suite exists; the Python suite covers the backend.

### Final keyboard/print independent check

A fresh independent combined review (profile=code: code-quality, security, testing, conformance) and runtime verification returned:

```
REVIEW_VERDICT: PASS
VERIFY_VERDICT: PASS
VERDICT: PASS
```

No confirmed findings. Live evidence: theme `Tối` activated by Tab+Enter retained focus; language EN retained focus; role select retained focus; 17/17 Tab/Shift+Tab presses stayed inside the open drawer; Escape returned focus to the exact metric-card opener; 390→1440 deferred refresh focused `button.metric-card[brent_futures]`, not the tape item; print export filled `#print-root` (4 source rows, 5 sections), print media hid app chrome and used white/light tokens; PDF was one page with no horizontal overflow; cleanup removed `printing-report` and emptied `#print-root`; eight-route smoke had no console/page errors; 390 footer actions were one row and fit. `node --check` and `compileall` passed. No JS linter is configured for the static prototype.

Remaining gaps specific to this check: native OS print dialog semantics are unobservable (window.print stubbed); print was exercised in Vietnamese only; theme/language switches are unreachable while an overlay is open by design; screen-reader reading order and intermediate widths 481–759 px remain untested.

Overall revision status: **PASS**. The design requirements, PDF-aligned content, light/dark theme, keyboard focus restoration and print-media output are implemented and verified in the prototype; backend and `app/static` remain untouched.

---

Verdict: **PASS with findings** (no blocker). Independent review of the design prototype against `docs/PRD.md`, `docs/SCREENS.md` and `docs/design/specs/*`.

- Artifact: `docs/design/prototype/index.html` (hash-route SPA) with `assets/{app.js,data.js,styles.css}`, synthetic data labelled in the shell.
- Platform: web, desktop-first responsive. Reviewed at 1440×900 and 390×844, with role switching and interactive flows.
- Method: rendered inspection, interaction flows, axe-core 4.12.1 (WCAG 2.0/2.1/2.2 A+AA tags). Automated axe results are partial evidence, not a conformance verdict.

## Evidence ledger

Screenshots live under `.rai/screenshots/browser/`.

| ID | Check | Action | Observed | Status |
|---|---|---|---|---|
| L1-01 | Login `#login` | open at 390/1440 | 3 role cards, synthetic-data note | PASS |
| L1-02 | Overview `#overview` | open, inspect | tape, cards, chart, drivers, briefing; Leadership shows BSR margin, Internal swaps to RON95 | PASS |
| L1-03 | Market Data `#market-data` | open, select crack, compare | CS-GAS-2.1 card; same-unit compare note; table alternative works | PASS |
| L1-04 | News `#news` | open, filter, drawer | drawer separates original/summary/insight; duplicate linked; restricted item hidden for Internal | PASS |
| L1-05 | Forecast `#forecast` | open, recompute | immutable versions; missing actual shown as "missing", not zero; metrics recomputed correctly | PASS |
| L1-06 | Analysis `#analysis` | open | facts, calculations, assumptions, evidence ledger; correlation labelled not causal | PASS |
| L1-07 | Assistant `#assistant` | ask crack, ask physical | citation chips + tool trace; Internal refusal excludes restricted | PASS |
| L1-08 | Reports `#reports` | generate, preview, export gate | new version + preview + sources; export disabled for Leadership, enabled for MI | PASS |
| L1-09 | Admin `#admin` | open as MI | role matrix, sources, AI executions, audit; new run + audit entry appear | PASS |
| L1-10 | Permission boundary | switch to Internal | restricted hidden note; `#admin` denied; AI refusal | PASS |
| L1-11 | Responsive | 390×844, open nav | off-canvas nav, single column; minor footer clip (F7) | PASS w/ finding |
| L1-12 | Chart table | toggle | table alternative with unit headers | PASS |
| L1-13 | Quick input | MI, confirm | preview → confirm → toast + audit | PASS |
| L1-14 | Search | open | permission-scoped results | PASS |
| L1-15 | Notifications | open | 4 items with route actions | PASS |
| A11y-01 | Contrast | axe | 57 nodes below AA, e.g. nav label 3.09:1, policy note 3.53:1, breadcrumb/tape 3.43–3.73:1 | FAIL (sev 2) |
| A11y-02 | aria-hidden focus | axe + CSS | closed drawer/modal keep focusable children | FAIL (sev 2) |
| A11y-03 | Nested interactive | axe | chart `role="img"` contains focusable event markers | FAIL (sev 2) |
| A11y-04 | Manual keyboard/AT | — | not run | UNTESTED |
| L2-01 | Session-change consistency | compare surfaces | card/analysis session change vs table derived day-over-day differ under similar labels | FAIL (sev 2) |
| L2-02 | Upload error state | source | only empty-file guard; no size/type error | FAIL (sev 2) |
| L2-03 | Login invalid/loading | source + render | only default role cards | FAIL (sev 1) |
| L3-01 | Mobile footer | 390px | footer text clips at card edge | FAIL (sev 1) |

## Findings

**F1 — Severity 2 — Two different "change" values for one instrument, under-labelled.**
Card/tape/analysis use the seeded session change (`assets/data.js:25`, `app.js:418`) while the Observations table derives change from consecutive series points (`app.js:581-584`). On Gasoline crack the header reads +0.62 / +3.50% while the latest table row reads -0.26; Brent +1.07 vs +4.08. Correction: label the table column "Δ vs prior observation" and state the distinction, or derive both from one source.

**F2 — Severity 2 — Muted text fails WCAG AA contrast.**
`--ink-400` (#71858a) on paper is 3.43:1; nav label 3.09:1; policy note 3.53:1 (`styles.css:7,122,138`). Correction: darken muted ink to ≈#5c6f74 and lift sidebar muted text to ≥4.5:1, then re-audit.

**F3 — Severity 2 — Closed drawer/modal keep focusable children.**
`app.js:258-267` marks overlays `aria-hidden="true"`; `styles.css:563-580` hides them off-screen/opacity 0 without `visibility`/`inert`. Correction: use `inert`/`visibility:hidden` when closed, or remove tabbable nodes.

**F4 — Severity 2 — Chart exposes interactive markers inside `role="img"`.**
`app.js:345` (`svg role="img"`) contains `g tabindex=0 role=button` event markers. Correction: use a role that permits interactive children (e.g. `group`), or move markers to an adjacent focusable list; keep the table alternative.

**F5 — Severity 2 — Upload validation error state not demonstrated.**
`app.js:1563-1570` only guards an empty file; `accept` is set but no size/type error. US-04 requires a controlled error with nothing stored. Correction: add size/type error state with retained input and retry.

**F6 — Severity 1 — S0 invalid/loading states absent.**
Login renders only role cards. Correction: add a loading/validation demonstration, or document in `SCREENS.md` that demo login has no credential states.

**F7 — Severity 1 — Mobile footer clip.**
Footer text clips at 390px. Correction: allow wrapping or shorten.

## Lens verdicts

- L1 usability & access — PASS with findings (F2, F3, F4 are real access defects).
- L2 product requirements — PASS with findings (F1, F5, F6 are promise/label gaps).
- L3 presentation — PASS with one minor finding (F7).

**Aesthetic assessment.** The "research desk, not trading terminal" direction lands: warm paper, deep-petrol rail, copper accent reserved for attention, editorial serif headings against monospaced figures, thin rules and generous section rhythm. Hierarchy is clear (metric cards → chart → briefing → drivers), density is deliberate, AI surfaces are visibly distinct from source facts, and the login screen carries the identity well. Highest-value correction: muted-text contrast, then the two change figures.

## Remaining gaps

- Manual keyboard journey and screen-reader behavior were not run; axe is automated-only.
- `window.print` / Save-PDF output was not exercised (only the permission gate and audit path).
- File-upload confirm and the restricted-scope denial for Internal were source-verified, not clicked.
- Backend enforcement claims (RBAC, AI retrieval, export) are implementation obligations, untestable in a static prototype.
