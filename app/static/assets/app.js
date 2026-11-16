/* BSR Market Intelligence SPA. Vanilla ES module, no build step.
   Screens read the permission-scoped API; the client never widens a scope. */

import { api, apiBlob, setCsrf } from "./api.js";
import { getLang, onLangChange, roleLabel, setLang, t } from "./i18n.js";

const ROUTES = ["login", "overview", "market-data", "news", "forecast", "analysis", "assistant", "reports", "admin"];

const ROUTE_KEYS = {
  overview: "overview",
  "market-data": "marketData",
  news: "news",
  forecast: "forecast",
  analysis: "analysis",
  assistant: "assistant",
  reports: "reports",
  admin: "admin",
};

const RANGES = ["7D", "1M", "3M", "1Y"];

const state = {
  user: null,
  route: "login",
  loading: false,
  error: null,
  data: null,
  tape: [],
  asOf: null,
  freshness: null,
  sidebarCollapsed: false,
  mobileNav: false,
  range: "1M",
  compare: "",
  instrument: "brent_futures",
  newsFilters: { topic: "", source: "", status: "", q: "" },
  forecastFilters: { instrument: "", horizon: "" },
  analysisQuestion: "What is driving the recent move in product cracks?",
  chat: [],
  chatBusy: false,
  adminTab: "users",
  theme: document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  reportType: "On-demand Market Analysis",
  reportStart: "2026-11-01",
  reportEnd: "2026-11-14",
  reportBusy: false,
  lastFocus: null,
};

let loadSeq = 0;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const esc = (value) =>
  String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));

const fmtNum = (value, decimals = 2) =>
  value == null
    ? "-"
    : Number(value).toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

const fmtSigned = (value, decimals = 2) => (value == null ? "-" : `${value > 0 ? "+" : ""}${fmtNum(value, decimals)}`);

const fmtPct = (value) => (value == null ? "-" : `${value > 0 ? "+" : ""}${fmtNum(value, 2)}%`);

const fmtTime = (iso) => {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date
    .toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    })
    .replace(",", " ·");
};

const fmtDate = (iso) => {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });
};

const directionClass = (value) => (value > 0 ? "pos" : value < 0 ? "neg" : "muted");

const ICONS = {
  overview: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>',
  data: '<path d="M3 19h18M5 16V8M10 16V5M15 16v-6M20 16V9"/>',
  news: '<path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/>',
  forecast: '<path d="M3 17l5-6 4 3 6-8M16 6h4v4"/>',
  analysis: '<circle cx="10" cy="10" r="7"/><path d="M15 15l6 6"/>',
  assistant: '<path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8zM19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9z"/>',
  reports: '<path d="M6 3h9l4 4v14H6zM15 3v5h4M9 13h7M9 17h7"/>',
  admin: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/>',
  bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M5 5l14 14M19 5L5 19"/>',
  chevron: '<path d="M9 18l6-6-6-6"/>',
  chevronLeft: '<path d="M15 18l-6-6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M5 21h14"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="1"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  check: '<path d="M4 12l5 5L20 6"/>',
  sparkle: '<path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z"/>',
  file: '<path d="M6 3h9l4 4v14H6zM15 3v5h4"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2z"/>',
  alert: '<path d="M12 3l10 18H2zM12 9v5M12 17h.01"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
};

function icon(name, size = 16) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.overview}</svg>`;
}

function initials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase() || "?";
}

function toast(message, kind = "info") {
  const stack = $("#toast-stack");
  if (!stack) return;
  const node = document.createElement("div");
  node.className = `toast ${kind === "error" ? "error" : ""}`;
  node.setAttribute("role", kind === "error" ? "alert" : "status");
  node.innerHTML = `<span>${esc(message)}</span><button type="button" aria-label="${esc(t("close"))}">×</button>`;
  node.querySelector("button").addEventListener("click", () => node.remove());
  stack.appendChild(node);
  window.setTimeout(() => node.remove(), 5000);
}

function handleApiError(error) {
  if (error && error.status === 401) {
    state.user = null;
    state.data = null;
    state.tape = [];
    setCsrf(null);
    state.route = "login";
    location.hash = "#login";
    closeOverlays();
    render();
    return;
  }
  toast((error && error.message) || t("error"), "error");
}

function statusChip(status) {
  const map = { "real-time": "teal", delayed: "warn", eod: "warn", manual: "" };
  const key = { "real-time": "realtime", delayed: "delayed", eod: "eod", manual: "manual" }[status];
  return `<span class="chip ${map[status] || ""}"><span class="dot"></span>${esc(key ? t(key) : status)}</span>`;
}

function classificationTag(classification) {
  const letter = { public: "P", internal: "I", confidential: "C", restricted: "R" }[classification] || "?";
  return `<span class="cls ${classification === "restricted" ? "restricted" : ""}">${letter} · ${esc(classification)}</span>`;
}

function qualityLabel(quality) {
  const key = { valid: "qualityValid", pending: "qualityPending", rejected: "qualityRejected" }[quality];
  return key ? t(key) : String(quality || "");
}

function qualityState(quality) {
  const map = { valid: "", pending: "warn", rejected: "rejected" };
  return `<span class="q-state ${map[quality] || ""}" title="${esc(t("quality"))}: ${esc(quality)}">${esc(qualityLabel(quality))}</span>`;
}

function sourceName(source) {
  return source && source.name ? source.name : String(source || "");
}

function attributionLabel(attribution) {
  if (!attribution) return t("sourceFact");
  if (attribution === "AI interpretation") return t("aiInterpretation");
  if (attribution === "source fact") return t("sourceFact");
  return attribution;
}

function pageHead(kicker, title, sub, actions = "") {
  return `<div class="page-head"><div><div class="page-kicker">${esc(kicker)}</div><h1 class="page-title">${esc(title)}</h1><div class="page-sub">${esc(sub)}</div></div><div class="page-actions">${actions}</div></div>`;
}

function emptyState(title, body) {
  return `<div class="empty-state"><h3>${esc(title)}</h3><p>${esc(body)}</p></div>`;
}

/* ---------- Theme and language ---------- */

function themeSwitch() {
  const options = [
    { id: "light", label: t("light"), icon: "sun" },
    { id: "dark", label: t("dark"), icon: "moon" },
  ];
  return `<div class="lang-switch theme-switch" role="group" aria-label="${esc(t("displayMode"))}">${options
    .map(
      (opt) =>
        `<button class="lang-btn ${state.theme === opt.id ? "active" : ""}" type="button" data-action="set-theme" data-theme="${opt.id}" aria-pressed="${state.theme === opt.id}" title="${esc(opt.label)}">${icon(opt.icon, 12)}<span class="seg-label">${esc(opt.label)}</span></button>`,
    )
    .join("")}</div>`;
}

function langSwitch() {
  const current = getLang();
  return `<div class="lang-switch" role="group" aria-label="${esc(t("language"))}">${[
    { code: "vi", short: "VI", label: "Tiếng Việt" },
    { code: "en", short: "EN", label: "English" },
  ]
    .map(
      (entry) =>
        `<button class="lang-btn ${current === entry.code ? "active" : ""}" type="button" data-action="set-lang" data-lang="${entry.code}" aria-pressed="${current === entry.code}" title="${esc(entry.label)}">${entry.short}</button>`,
    )
    .join("")}</div>`;
}

function setTheme(next) {
  if (next !== "light" && next !== "dark") return;
  state.theme = next;
  document.documentElement.dataset.theme = next;
  document.documentElement.style.colorScheme = next;
  try {
    window.localStorage.setItem("bsr.theme", next);
  } catch (error) {
    /* storage unavailable: the choice lasts for this page only */
  }
  render();
  const button = document.querySelector(`[data-action="set-theme"][data-theme="${next}"]`);
  if (button) button.focus();
}

/* ---------- Overlays ---------- */

function overlayOpen(node) {
  return node && node.classList.contains("open");
}

function syncOverlayChrome() {
  const drawerOpen = overlayOpen($("#drawer"));
  const modalOpen = overlayOpen($("#modal"));
  $("#backdrop")?.classList.toggle("open", drawerOpen || modalOpen);
  document.body.classList.toggle("drawer-open", drawerOpen);
  document.body.classList.toggle("modal-open", modalOpen);
}

function rememberFocus() {
  state.lastFocus = document.activeElement;
}

function restoreFocus() {
  const target = state.lastFocus;
  state.lastFocus = null;
  if (target && typeof target.focus === "function" && document.contains(target)) target.focus();
}

function openDrawer(kicker, title, body, foot = "") {
  const drawer = $("#drawer");
  if (!drawer) return;
  rememberFocus();
  $("#drawer-kicker").textContent = kicker || "";
  $("#drawer-title").textContent = title || "";
  $("#drawer-body").innerHTML = body;
  $("#drawer-foot").innerHTML = foot;
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  syncOverlayChrome();
  const focusTarget = drawer.querySelector(".drawer-head button") || drawer.querySelector("button, a, input, select, textarea");
  if (focusTarget) focusTarget.focus();
}

function openModal(kicker, title, body, foot = "") {
  const modal = $("#modal");
  if (!modal) return;
  rememberFocus();
  $("#modal-kicker").textContent = kicker || "";
  $("#modal-title").textContent = title || "";
  $("#modal-body").innerHTML = body;
  $("#modal-foot").innerHTML = foot;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  syncOverlayChrome();
  const focusTarget = modal.querySelector(".modal-head button") || modal.querySelector("input, select, textarea, button");
  if (focusTarget) focusTarget.focus();
}

function closeOverlays() {
  ["#drawer", "#modal"].forEach((selector) => {
    const node = $(selector);
    if (!node) return;
    node.classList.remove("open");
    node.setAttribute("aria-hidden", "true");
  });
  ["#drawer-kicker", "#drawer-title", "#drawer-body", "#drawer-foot", "#modal-kicker", "#modal-title", "#modal-body", "#modal-foot"].forEach((selector) => {
    const node = $(selector);
    if (node) node.innerHTML = "";
  });
  syncOverlayChrome();
  restoreFocus();
  updateDocumentTitle();
}

function updateDocumentTitle() {
  if (state.route === "login" || !state.user) {
    document.title = `${t("signIn")} · BSR Market Intelligence`;
    return;
  }
  document.title = `${t(ROUTE_KEYS[state.route] || "overview")} · BSR Market Intelligence`;
}

function trapFocus(event, container) {
  if (event.key !== "Tab") return;
  const focusable = $$(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    container,
  ).filter((node) => node.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/* ---------- Shell ---------- */

function navItem(route, labelKey, iconName) {
  const active = state.route === route;
  return `<a class="nav-item ${active ? "active" : ""}" href="#${route}" ${active ? 'aria-current="page"' : ""} title="${esc(t(labelKey))}">${icon(iconName, 16)}<span>${esc(t(labelKey))}</span></a>`;
}

function shellNav() {
  const items = [
    {
      group: "workspaceGroup",
      entries: [
        ["overview", "overview", "overview"],
        ["market-data", "marketData", "data"],
        ["news", "news", "news"],
        ["forecast", "forecast", "forecast"],
        ["analysis", "analysis", "analysis"],
      ],
    },
    {
      group: "intelligenceGroup",
      entries: [
        ["assistant", "assistant", "assistant"],
        ["reports", "reports", "reports"],
      ],
    },
  ];
  if (state.user && state.user.is_admin) {
    items.push({ group: "governanceGroup", entries: [["admin", "admin", "admin"]] });
  }
  return items
    .map(
      (group) => `<div class="nav-group"><div class="nav-label">${esc(t(group.group))}</div>${group.entries
        .map(([route, key, iconName]) => navItem(route, key, iconName))
        .join("")}</div>`,
    )
    .join("");
}

function tapeMarkup() {
  if (!state.tape.length) return "";
  const items = state.tape
    .map(
      (item) => `<a class="tape-item" href="#market-data" data-action="open-instrument" data-id="${esc(item.instrument_id)}" title="${esc(item.short_name)} · ${esc(item.unit)}">
        <span class="t-status ${item.data_status === "delayed" ? "delayed" : item.data_status === "manual" ? "manual" : ""}"></span>
        <span class="t-label">${esc(item.short_name)}</span>
        <span class="t-value">${fmtNum(item.value, 2)} <span class="t-unit muted" style="font-size:9px;font-weight:400">${esc(item.unit)}</span></span>
        ${item.market_time ? `<span class="t-time">${esc(t("marketTime"))} ${fmtTime(item.market_time)}</span>` : ""}
        <span class="t-change ${directionClass(item.change)}">${fmtSigned(item.change)}</span>
      </a>`,
    )
    .join("");
  const hidden = state.user && !state.user.can_view_restricted
    ? `<span class="tape-item"><span class="tape-restricted">${icon("lock", 11)} ${esc(t("restrictedTape"))}</span></span>`
    : "";
  return `<div class="market-tape" role="group" aria-label="${esc(t("marketTape"))}">${items}${hidden}</div>`;
}

function renderShell(content) {
  const user = state.user || {};
  const role = roleLabel(user.role);
  const collapsed = state.sidebarCollapsed ? "collapsed" : "";
  const asOf = state.asOf
    ? `${t("asOf")} ${fmtTime(state.asOf)} · ${state.freshness === "mixed" ? t("mixed") : state.freshness || ""}`
    : t("loading");
  return `<div class="app">
    <aside id="sidebar" class="sidebar ${collapsed} ${state.mobileNav ? "mobile-open" : ""}" aria-label="${esc(t("mainNav"))}">
      <div class="sidebar-head">
        <div class="brand-mark" aria-hidden="true">BSR</div>
        <div class="brand-text"><div class="brand-name">Market Intelligence</div><div class="brand-sub">${esc(t("tagline"))}</div></div>
        <button class="sidebar-toggle" type="button" data-action="toggle-sidebar" aria-expanded="${!state.sidebarCollapsed}" aria-label="${esc(state.sidebarCollapsed ? t("expand") : t("collapse"))}">${icon(state.sidebarCollapsed ? "chevron" : "chevronLeft", 12)}</button>
      </div>
      <nav class="sidebar-nav">${shellNav()}</nav>
      <div class="sidebar-foot">
        <div class="policy-note">${icon("lock", 11)} ${esc(t("policyNote"))}</div>
        <button class="sidebar-user" type="button" data-action="open-account">
          <span class="avatar" aria-hidden="true">${esc(initials(user.name))}</span>
          <span class="user-meta"><strong>${esc(user.name || "")}</strong><span>${esc(role)}</span></span>
        </button>
      </div>
    </aside>
    ${state.mobileNav ? '<div class="nav-backdrop" data-action="toggle-mobile-nav"></div>' : ""}
    <div class="main ${collapsed}">
      <header class="topbar">
        <button class="icon-btn mobile-menu" type="button" data-action="toggle-mobile-nav" aria-label="${esc(t("menu"))}">${icon("menu", 19)}</button>
        <div class="breadcrumb"><span>BSR</span>${icon("chevron", 11)}<strong>${esc(t(ROUTE_KEYS[state.route] || "overview"))}</strong></div>
        <div class="topbar-spacer"></div>
        <div class="asof" title="${esc(t("freshness"))}"><span class="fresh-dot"></span><span>${esc(asOf)}</span></div>
        <div class="topbar-actions">
          <button class="icon-btn" type="button" data-action="open-search" aria-label="${esc(t("search"))}">${icon("search")}</button>
          <button class="icon-btn" type="button" data-action="open-notifications" aria-label="${esc(t("notifications"))}" aria-haspopup="dialog">${icon("bell")}</button>
          ${themeSwitch()}
          ${langSwitch()}
          <label class="sr-only" for="role-switch">${esc(t("role"))}</label>
          <select id="role-switch" class="role-select" data-action="switch-role" aria-label="${esc(t("role"))}">
            ${["leadership", "mi", "internal"]
              .map((value) => `<option value="${value}" ${user.role === value ? "selected" : ""}>${esc(roleLabel(value))}</option>`)
              .join("")}
          </select>
          <button class="topbar-user" type="button" data-action="open-account" aria-label="${esc(t("account"))}">
            <span class="avatar" aria-hidden="true">${esc(initials(user.name))}</span>
            <span><span class="user-name">${esc(user.name || "")}</span><span class="user-role">${esc(role)}</span></span>
          </button>
        </div>
      </header>
      ${tapeMarkup()}
      <main id="main-content" class="page">${content}</main>
    </div>
  </div>`;
}

/* ---------- Login ---------- */

function renderLogin() {
  const roles = [
    { role: "leadership", dept: "Executive Office", descKey: "roleLeadership", iconName: "user" },
    { role: "mi", dept: "Market Intelligence", descKey: "roleMi", iconName: "layers" },
    { role: "internal", dept: "Commercial", descKey: "roleInternal", iconName: "overview" },
  ];
  return `<div class="login">
    <section class="login-brand" aria-label="BSR Market Intelligence">
      <div>
        <div class="brand-lockup">
          <div class="brand-mark" aria-hidden="true">BSR</div>
          <div><div class="brand-name">Market Intelligence</div><div class="brand-sub">${esc(t("tagline"))}</div></div>
        </div>
        <div class="login-hero">
          <div class="login-kicker">${esc(t("loginKicker"))}</div>
          <h1>${esc(t("loginTitle"))}<br><em>${esc(t("loginTitleAccent"))}</em></h1>
          <p>${esc(t("loginSub"))}</p>
        </div>
      </div>
      <div class="login-foot"><span>${esc(t("loginFootScope"))}</span><span>${esc(t("loginFootAi"))}</span><span>${esc(t("loginFootMetrics"))}</span></div>
    </section>
    <section class="login-panel" aria-labelledby="signin-title">
      <div class="login-lang">${themeSwitch()}${langSwitch()}</div>
      <h2 id="signin-title">${esc(t("enterWorkspace"))}</h2>
      <p>${esc(t("roleHint"))}</p>
      ${roles
        .map(
          (entry) => `<button class="role-card" type="button" data-action="login" data-role="${entry.role}">
            <span class="role-icon" aria-hidden="true">${icon(entry.iconName, 18)}</span>
            <span><strong>${esc(roleLabel(entry.role))}</strong><span class="role-desc">${esc(entry.dept)} · ${esc(t(entry.descKey))}</span></span>
            <span class="role-arrow" aria-hidden="true">→</span>
          </button>`,
        )
        .join("")}
      <div class="login-note"><strong>${esc(t("product"))}.</strong> ${esc(t("demoNote"))}</div>
    </section>
  </div>`;
}

/* ---------- Charts ---------- */

let chartRegistry = new Map();

function palette() {
  const css = getComputedStyle(document.documentElement);
  const value = (token, fallback) => (css.getPropertyValue(token) || "").trim() || fallback;
  return {
    copper: value("--copper", "#b45b2d"),
    teal: value("--teal", "#1d6a63"),
    positive: value("--positive", "#2c7656"),
    negative: value("--negative", "#ac423c"),
    warning: value("--warning", "#9a6a18"),
    restricted: value("--restricted", "#75405f"),
  };
}

function toChartSeries(series) {
  return (series || []).map((entry, index) => ({
    label: entry.instrument ? entry.instrument.short_name : entry.label || `#${index + 1}`,
    unit: entry.unit,
    color: index === 0 ? palette().copper : palette().teal,
    data: (entry.points || []).map((point) => ({ date: new Date(point.t), value: point.v, raw: point.t })),
  }));
}

function sparkline(values, color, width = 120, height = 26) {
  const clean = values.filter((value) => value != null);
  if (clean.length < 2) return "";
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const span = max - min || 1;
  const points = clean
    .map((value, index) => `${(index / (clean.length - 1)) * width},${height - ((value - min) / span) * (height - 4) - 2}`)
    .join(" ");
  return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true" focusable="false"><polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>`;
}

function buildChart(seriesList, events, opts = {}) {
  const compact = window.innerWidth <= 760;
  const width = compact ? 420 : 900;
  const height = opts.height || (compact ? 250 : 280);
  const pad = { l: compact ? 46 : 52, r: compact ? 12 : 22, t: 16, b: compact ? 26 : 30 };
  const yTicks = compact ? 3 : 4;
  const first = seriesList[0];
  if (!first || !first.data.length) return { svg: `<div class="chart-empty">${esc(t("empty"))}</div>`, meta: null };
  const values = seriesList.flatMap((entry) => entry.data.map((point) => point.value)).filter((value) => value != null);
  if (!values.length) return { svg: `<div class="chart-empty">${esc(t("empty"))}</div>`, meta: null };
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (max === min) {
    max += 1;
    min -= 1;
  }
  const span = max - min;
  min -= span * 0.08;
  max += span * 0.08;
  const count = first.data.length;
  const x = (index) => pad.l + (count <= 1 ? 0 : (index / (count - 1)) * (width - pad.l - pad.r));
  const y = (value) => pad.t + (1 - (value - min) / (max - min)) * (height - pad.t - pad.b);

  let grid = "";
  let labels = "";
  for (let tick = 0; tick <= yTicks; tick += 1) {
    const gy = pad.t + (tick / yTicks) * (height - pad.t - pad.b);
    const value = max - (tick / yTicks) * (max - min);
    grid += `<line class="grid-line" x1="${pad.l}" y1="${gy}" x2="${width - pad.r}" y2="${gy}"/>`;
    labels += `<text x="${pad.l - 8}" y="${gy + 3}" text-anchor="end">${fmtNum(value, 2)}</text>`;
  }
  const xTicks = [0, Math.floor((count - 1) / 2), count - 1];
  xTicks.forEach((index) => {
    if (!first.data[index]) return;
    labels += `<text x="${x(index)}" y="${height - 8}" text-anchor="${index === 0 ? "start" : index === count - 1 ? "end" : "middle"}">${fmtDate(first.data[index].raw)}</text>`;
  });

  const paths = seriesList
    .map((entry) => {
      let path = "";
      let started = false;
      (entry.data || []).forEach((point, index) => {
        if (point.value == null) {
          started = false;
          return;
        }
        path += `${started ? "L" : "M"}${x(index).toFixed(1)},${y(point.value).toFixed(1)} `;
        started = true;
      });
      return `<path class="series-line" stroke="${entry.color}" d="${path.trim()}"/>`;
    })
    .join("");

  const firstTime = first.data[0].date.getTime();
  const lastTime = first.data[count - 1].date.getTime();
  const eventsInRange = (events || []).filter((event) => {
    const time = new Date(event.occurred_at).getTime();
    if (Number.isNaN(time) || time < firstTime || time > lastTime) return false;
    return !opts.instrumentId || (event.instruments || []).includes(opts.instrumentId);
  });
  const markers = eventsInRange
    .map((event) => {
      const time = new Date(event.occurred_at).getTime();
      let best = 0;
      let bestDiff = Infinity;
      first.data.forEach((point, index) => {
        const diff = Math.abs(point.date.getTime() - time);
        if (diff < bestDiff && point.value != null) {
          bestDiff = diff;
          best = index;
        }
      });
      const cx = x(best);
      const cy = y(first.data[best].value);
      return `<g class="event-marker-group" tabindex="0" role="button" data-action="event-detail" data-id="${esc(event.id)}" aria-label="${esc(event.title)}"><title>${esc(event.title)} · ${esc(sourceName(event.source))}</title><polygon class="event-marker" points="${cx},${cy - 7} ${cx + 6},${cy} ${cx},${cy + 7} ${cx - 6},${cy}"/></g>`;
    })
    .join("");

  const hover = `<g class="hover-group" visibility="hidden"><line class="hover-line" y1="${pad.t}" y2="${height - pad.b}"/>${seriesList
    .map((entry) => `<circle class="hover-dot" r="3.5" stroke="${entry.color}"/>`)
    .join("")}</g>`;
  const svgRole = eventsInRange.length ? "group" : "img";
  const aria = `${opts.ariaLabel || t("marketPulse")}${eventsInRange.length ? ` · ${eventsInRange.length} ${t("linkedEvents")}` : ""}`;
  const svg = `<svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="${svgRole}" aria-label="${esc(aria)}">
    ${grid}${labels}<line class="axis-line" x1="${pad.l}" y1="${height - pad.b}" x2="${width - pad.r}" y2="${height - pad.b}"/>${paths}${markers}${hover}
  </svg>`;
  return { svg, meta: { seriesList, x, y, width, height, pad, count, events: eventsInRange } };
}

function chartTable(series) {
  const chartSeries = toChartSeries(series);
  const first = chartSeries[0];
  if (!first || !first.data.length) return "";
  const step = Math.max(1, Math.floor(first.data.length / 8));
  const indexes = [];
  for (let index = 0; index < first.data.length; index += step) indexes.push(index);
  if (indexes[indexes.length - 1] !== first.data.length - 1) indexes.push(first.data.length - 1);
  return `<table><thead><tr><th>${esc(t("time"))}</th>${chartSeries
    .map((entry) => `<th>${esc(entry.label)}${entry.unit ? ` (${esc(entry.unit)})` : ""}</th>`)
    .join("")}</tr></thead><tbody>${indexes
    .map(
      (index) => `<tr><td>${fmtDate(first.data[index].raw)}</td>${chartSeries
        .map((entry) => `<td>${entry.data[index] && entry.data[index].value != null ? fmtNum(entry.data[index].value, 2) : "-"}</td>`)
        .join("")}</tr>`,
    )
    .join("")}</tbody></table>`;
}

function chartBlock(key, series, events, opts = {}) {
  const built = buildChart(toChartSeries(series), events, opts);
  if (built.meta) chartRegistry.set(key, built.meta);
  const legend = (series || [])
    .map((entry, index) => {
      const color = index === 0 ? palette().copper : palette().teal;
      return `<span class="legend-item"><span class="legend-swatch" style="background:${color}"></span>${esc(entry.instrument ? entry.instrument.short_name : entry.label || "")}</span>`;
    })
    .join("");
  return `<div class="chart-wrap" data-chart-key="${esc(key)}">
    ${built.svg}
    <div class="chart-tooltip" role="status"></div>
    <div class="flex items-center justify-between gap-8 wrap" style="margin-top:6px">
      <div class="chart-legend">${legend}</div>
      <button class="link-btn" type="button" data-action="toggle-table" data-target="chart-table-${esc(key)}" aria-expanded="false" aria-controls="chart-table-${esc(key)}">${esc(t("viewDataTable"))}</button>
    </div>
    <div class="chart-table hidden" id="chart-table-${esc(key)}">${chartTable(series)}</div>
  </div>`;
}

function bindCharts(root = document) {
  $$(".chart-wrap", root).forEach((wrap) => {
    const meta = chartRegistry.get(wrap.dataset.chartKey);
    if (!meta) return;
    const svg = $("svg", wrap);
    const tooltip = $(".chart-tooltip", wrap);
    const hover = $(".hover-group", wrap);
    if (!svg || !tooltip || !hover) return;
    const move = (event) => {
      const rect = svg.getBoundingClientRect();
      if (!rect.width) return;
      const scale = meta.width / rect.width;
      const px = (event.clientX - rect.left) * scale;
      const ratio = Math.max(0, Math.min(1, (px - meta.pad.l) / (meta.width - meta.pad.l - meta.pad.r)));
      const index = Math.round(ratio * (meta.count - 1));
      const hx = meta.x(index);
      hover.setAttribute("visibility", "visible");
      const line = $(".hover-line", hover);
      if (line) {
        line.setAttribute("x1", hx);
        line.setAttribute("x2", hx);
      }
      const circles = $$("circle", hover);
      meta.seriesList.forEach((entry, seriesIndex) => {
        const circle = circles[seriesIndex];
        if (!circle) return;
        const point = entry.data[index];
        if (!point || point.value == null) {
          circle.setAttribute("visibility", "hidden");
          return;
        }
        circle.setAttribute("visibility", "visible");
        circle.setAttribute("cx", hx);
        circle.setAttribute("cy", meta.y(point.value));
      });
      const point = meta.seriesList[0].data[index];
      tooltip.innerHTML = `<div class="tt-date">${fmtDate(point.raw)}</div>${meta.seriesList
        .map((entry) => `<div class="tt-row"><span>${esc(entry.label)}</span><span>${fmtNum(entry.data[index] ? entry.data[index].value : null, 2)}</span></div>`)
        .join("")}`;
      tooltip.classList.add("visible");
      const wrapRect = wrap.getBoundingClientRect();
      const left = Math.min(wrapRect.width - 140, Math.max(0, event.clientX - wrapRect.left + 12));
      tooltip.style.left = `${left}px`;
      tooltip.style.top = "8px";
    };
    svg.addEventListener("pointermove", move);
    svg.addEventListener("pointerleave", () => {
      tooltip.classList.remove("visible");
      hover.setAttribute("visibility", "hidden");
    });
  });
}

/* ---------- Overview ---------- */

function pickMetricCards(cards) {
  const priority = ["brent_futures", "wti_futures", "brent_physical", "crack_gasoline", "usd_vnd"];
  const byId = new Map(cards.map((card) => [card.instrument.id, card]));
  const picked = priority.map((id) => byId.get(id)).filter(Boolean);
  cards.forEach((card) => {
    if (picked.length < 5 && !picked.includes(card)) picked.push(card);
  });
  return picked.slice(0, 5);
}

function metricCard(card) {
  const instrument = card.instrument;
  const decimals = instrument.decimals == null ? 2 : instrument.decimals;
  const previous = card.value == null || card.change == null ? null : card.value - card.change;
  const color = card.change >= 0 ? palette().positive : palette().negative;
  const series = (state.data && state.data.series) || [];
  const ownSeries = series.find((entry) => entry.instrument && entry.instrument.id === instrument.id);
  const sparkValues = ownSeries ? ownSeries.points.map((point) => point.v) : [];
  return `<button class="metric-card" type="button" data-action="open-metric" data-id="${esc(instrument.id)}">
    <span class="metric-top"><span class="metric-label">${esc(instrument.short_name)} ${classificationTag(card.classification)}</span></span>
    <span class="metric-value">${fmtNum(card.value, decimals)}<span class="unit">${esc(instrument.unit)}</span></span>
    <span class="metric-change"><span class="${directionClass(card.change)}">${fmtSigned(card.change, decimals)}</span><span class="${directionClass(card.change_pct)}">${fmtPct(card.change_pct)}</span><span class="muted">${esc(t("sessionChange"))}</span></span>
    ${sparkValues.length ? `<span class="metric-spark">${sparkline(sparkValues, color)}</span>` : ""}
    <span class="metric-time"><span>${esc(t("marketTime"))} <strong>${fmtTime(card.market_time)}</strong></span><span>${esc(t("ingested"))} ${fmtTime(card.ingested_at)}</span></span>
    <span class="metric-prev"><span>${esc(t("previous"))} <strong>${previous == null ? "-" : fmtNum(previous, decimals)}</strong></span>${qualityState(card.quality_status)}</span>
    <span class="metric-meta"><span class="source">${esc(sourceName(card.source))}</span>${statusChip(card.data_status)}</span>
  </button>`;
}

function renderOverview() {
  const data = state.data || {};
  const cards = pickMetricCards(data.cards || []);
  const series = data.series || [];
  const briefing = data.briefing;
  const actions = `<button class="btn" type="button" data-action="quick-query">${icon("sparkle")} ${esc(t("quickQuery"))}</button>${
    state.user.role === "mi" ? `<button class="btn btn-copper" type="button" data-action="quick-input">${icon("plus")} ${esc(t("observations"))}</button>` : ""
  }`;
  const briefingBlock = briefing
    ? `<section class="card briefing">
        <div class="briefing-head">
          <div class="briefing-kicker">${icon("sparkle", 12)} ${esc(t("briefing"))} · v${esc(briefing.version)}</div>
          <h3>${esc(briefing.headline)}</h3>
          <ul class="briefing-list">${(briefing.moves || [])
            .map(
              (move, index) => `<li><span class="num">${String(index + 1).padStart(2, "0")}</span><span>${esc(move.instrument)} ${fmtNum(move.value, 2)}${move.change != null ? ` · <span class="${directionClass(move.change)}">${fmtSigned(move.change)} / ${fmtPct(move.pct)}</span>` : ""}</span></li>`,
            )
            .join("")}</ul>
          ${(briefing.drivers || []).length ? `<div class="briefing-block"><h4>${esc(t("driversInBriefing"))}</h4><ul>${(briefing.drivers || []).map((driver) => `<li>${esc(driver)}</li>`).join("")}</ul></div>` : ""}
          ${(briefing.watchlist || []).length ? `<div class="briefing-block impact"><h4>${esc(t("watchlist"))}</h4><ul>${(briefing.watchlist || []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div>` : ""}
          <div class="source-ledger"><button class="source-chip" type="button" data-action="open-briefing">${icon("file", 9)} ${esc(t("openBriefing"))}</button></div>
        </div>
        <div class="card-foot"><span>${esc(t("generatedAt"))} ${fmtTime(briefing.generated_at)} · ${esc(t("dataCutoff"))} ${fmtTime(briefing.data_cutoff)}</span></div>
      </section>`
    : `<section class="card">${emptyState(t("briefing"), t("empty"))}</section>`;

  return `${pageHead("BSR · Market Intelligence", t("overview"), t("tagline"), actions)}
    ${data.restricted_hidden ? `<div class="notice" style="margin-bottom:16px">${icon("lock")} ${esc(t("restrictedHidden"))}</div>` : ""}
    <div class="metric-grid">${cards.map(metricCard).join("")}</div>
    <div class="overview-grid">
      <div class="overview-main">
        <section class="card">
          <div class="card-head">
            <div><h2 class="card-title">${esc(t("marketPulse"))}</h2><div class="card-sub">${esc(t("marketPulseSub", { range: state.range }))}</div></div>
            <div class="chart-toolbar"><div class="range-tabs" role="group" aria-label="${esc(t("range"))}">${RANGES.map(
              (range) => `<button class="range-tab ${state.range === range ? "active" : ""}" type="button" data-action="set-range" data-range="${range}" aria-pressed="${state.range === range}">${range}</button>`,
            ).join("")}</div></div>
          </div>
          <div class="card-body">
            ${chartBlock("overview-pulse", series, data.events || [], { height: 280, ariaLabel: "Brent vs WTI", unit: "USD/bbl" })}
            <div class="inline-note mt-12"><span class="note-mark">i</span><span>${esc(t("eventMarkersNote"))}</span></div>
          </div>
        </section>
        <section class="card">
          <div class="card-head"><div><h2 class="card-title">${esc(t("keyDrivers"))}</h2><div class="card-sub">${esc(t("driverStrength"))}</div></div><span class="chip">${(data.drivers || []).length}</span></div>
          <div class="card-body"><div class="driver-list">${(data.drivers || [])
            .map(
              (driver) => `<div class="driver-row">
                <span class="driver-group">${esc(driver.group)}</span>
                <span><span class="driver-name">${esc(driver.label)}</span><span class="driver-detail">${esc(driver.detail)}</span></span>
                <span><span class="driver-meter ${esc(driver.direction || "neutral")}"><span style="width:${Number(driver.strength) || 0}%"></span></span><span class="small muted text-right" style="display:block;margin-top:3px;font-family:var(--mono)">${Number(driver.strength) || 0}</span></span>
              </div>`,
            )
            .join("")}</div></div>
        </section>
        <section class="card">
          <div class="card-head"><div><h2 class="card-title">${esc(t("highlights"))}</h2><div class="card-sub">${esc(t("sources"))}</div></div><a class="link-btn" href="#news">${esc(t("allNews"))} →</a></div>
          <div class="card-body" style="padding-top:4px;padding-bottom:4px"><div class="highlight-list">${(data.highlights || [])
            .map(
              (item) => `<article class="highlight"><h4><button class="link-btn" type="button" data-action="news-detail" data-id="${esc(item.id)}">${esc(item.title)}</button></h4>
                <div class="highlight-meta"><span class="chip ${item.attribution === "AI interpretation" ? "copper" : ""}">${esc(attributionLabel(item.attribution))}</span>
                <span class="meta-pair"><span class="meta-key">${esc(t("source"))}</span><span class="meta-value">${esc(sourceName(item.source))}</span></span>
                <span class="meta-pair"><span class="meta-key">${esc(t("published"))}</span><span class="meta-value">${fmtTime(item.published_at)}</span></span></div>
              </article>`,
            )
            .join("") || emptyState(t("empty"), "")}</div></div>
        </section>
      </div>
      <aside class="overview-rail">
        ${briefingBlock}
        <section class="card quick-query">
          <div class="card-head"><div><h2 class="card-title">${icon("sparkle", 13)} ${esc(t("quickQuery"))}</h2><div class="card-sub">${esc(t("permissionContext"))}</div></div></div>
          <div class="card-body">
            <label class="sr-only" for="quick-query-input">${esc(t("quickQuery"))}</label>
            <textarea id="quick-query-input" placeholder="${esc(t("chatPlaceholder"))}"></textarea>
            <div class="suggestions">
              <button class="suggestion" type="button" data-action="suggestion" data-question="What is driving gasoline cracks?">Gasoline cracks</button>
              <button class="suggestion" type="button" data-action="suggestion" data-question="Compare Brent and WTI over 30 days.">Brent vs WTI</button>
              <button class="suggestion" type="button" data-action="suggestion" data-question="Which news could affect crude supply?">Supply news</button>
            </div>
            <button class="btn btn-primary mt-8" type="button" data-action="open-quick-query" style="width:100%">${esc(t("ask"))} ${icon("arrowRight", 13)}</button>
          </div>
        </section>
        <section class="card">
          <div class="card-head"><div><h2 class="card-title">${esc(t("dataQuality"))}</h2><div class="card-sub">${esc(t("visibleCardsOnly"))}</div></div>${icon("layers", 16)}</div>
          <div class="card-body"><div class="quality-list">${[
            ["realtime", "real-time"],
            ["delayed", "delayed"],
            ["eod", "eod"],
            ["manual", "manual"],
          ]
            .map(
              ([key, status]) => `<div class="quality-row"><span class="q-label"><span class="status-dot ${status === "delayed" ? "delayed" : status === "manual" ? "manual" : ""}"></span>${esc(t(key))}</span><span class="q-value">${cards.filter((card) => card.data_status === status).length}</span></div>`,
            )
            .join("")}<div class="quality-row"><span class="q-label"><span class="status-dot ${cards.some((card) => card.quality_status === "pending") ? "pending" : ""}"></span>${esc(t("qualityPending"))}</span><span class="q-value">${cards.filter((card) => card.quality_status === "pending").length}</span></div></div></div>
          <div class="card-foot"><span>${esc(state.user.can_view_restricted ? t("restrictedIncluded") : t("restrictedExcluded"))}</span></div>
        </section>
      </aside>
    </div>`;
}

/* ---------- Market data ---------- */

function renderMarketData() {
  const data = state.data || {};
  const instruments = data.instruments || [];
  const series = data.series || [];
  const observations = (data.observations || []).map((row, index, rows) => {
    const prior = rows[index + 1];
    return { ...row, delta: prior ? row.value - prior.value : null };
  }).slice(0, 12);
  const formulas = data.formulas || [];
  const selected = instruments.find((item) => item.id === state.instrument) || instruments[0];
  const formula = selected && selected.formula_id ? formulas.find((item) => item.id === selected.formula_id) : null;
  if (!selected) return pageHead("BSR · Market data", t("marketData"), t("tagline")) + emptyState(t("empty"), "");
  const groups = [...new Set(instruments.map((item) => item.group))];
  const unit = selected.unit;
  const latest = selected.latest;
  const compareInstrument = data.instruments.find((item) => item.id === state.compare);
  const indexed = Boolean(compareInstrument && series[1] && series[0].unit !== series[1].unit);
  const displaySeries = indexed
    ? series.map((entry) => {
        const basePoint = (entry.points || []).find((point) => point.v != null && point.v !== 0);
        const base = basePoint ? basePoint.v : 1;
        return {
          ...entry,
          unit: "index",
          points: (entry.points || []).map((point) => ({
            ...point,
            v: point.v == null ? null : Math.round((point.v / base) * 1000) / 10,
          })),
        };
      })
    : series;
  const actions = `<div class="range-tabs" role="group" aria-label="${esc(t("range"))}">${RANGES.map(
    (range) => `<button class="range-tab ${state.range === range ? "active" : ""}" type="button" data-action="set-range" data-range="${range}" aria-pressed="${state.range === range}">${range}</button>`,
  ).join("")}</div>
    <label class="sr-only" for="compare-select">${esc(t("compare"))}</label>
    <select id="compare-select" class="role-select" data-action="set-compare" aria-label="${esc(t("compare"))}">
      <option value="">${esc(t("compare"))}…</option>
      ${instruments
        .filter((item) => item.id !== selected.id)
        .map((item) => `<option value="${esc(item.id)}" ${state.compare === item.id ? "selected" : ""}>${esc(item.short_name)}</option>`)
        .join("")}
    </select>
    ${state.user.role === "mi" ? `<button class="btn btn-copper" type="button" data-action="quick-input">${icon("plus")} ${esc(t("addObservation"))}</button>` : ""}`;
  return `${pageHead("BSR · Market data", t("marketData"), t("tagline"), actions)}
    <div class="data-layout">
      <aside class="card instrument-rail" aria-label="${esc(t("instruments"))}">
        <div class="card-head"><div><h2 class="card-title">${esc(t("instruments"))}</h2><div class="card-sub">${instruments.length}</div></div></div>
        <div class="card-body" style="padding:10px 8px">
          ${groups
            .map(
              (group) => `<div class="instrument-group"><h4>${esc(group)}</h4>${instruments
                .filter((item) => item.group === group)
                .map(
                  (item) => `<button class="instrument-btn ${item.id === selected.id ? "active" : ""}" type="button" data-action="select-instrument" data-id="${esc(item.id)}">
                    <span>${esc(item.short_name)}${item.classification === "restricted" ? ` <span class="i-lock">${icon("lock", 9)}</span>` : ""}</span><span class="i-value">${item.latest ? fmtNum(item.latest.value, item.decimals) : "-"}</span>
                  </button>`,
                )
                .join("")}</div>`,
            )
            .join("")}
        </div>
        <div class="card-foot"><span>${esc(state.user.can_view_restricted ? t("restrictedIncluded") : t("restrictedExcluded"))}</span></div>
      </aside>
      <div class="data-main">
        <section class="card">
          <div class="card-body">
            <div class="data-header">
              <div>
                <div class="page-kicker">${esc(selected.group)} · ${esc(selected.ticker)}</div>
                <h2 class="data-title">${esc(selected.name)}</h2>
                <div class="data-price">
                  <span class="big">${latest ? fmtNum(latest.value, selected.decimals) : "-"}</span><span class="unit">${esc(unit)}</span>
                  ${latest ? statusChip(latest.data_status) : ""}
                  <span class="chip">${esc(selected.price_type)}</span>
                  ${selected.classification !== "internal" && selected.classification !== "public" ? `<span class="chip restricted">${icon("lock", 9)} ${esc(selected.classification)}</span>` : ""}
                </div>
                <div class="data-meta"><span>${esc(t("source"))} <strong>${esc(sourceName(latest ? latest.source : null) || "-")}</strong></span><span>${esc(t("marketTime"))} <strong>${fmtTime(latest && latest.market_time)}</strong></span><span>${esc(t("ingested"))} <strong>${fmtTime(latest && latest.ingested_at)}</strong></span><span>${esc(t("quality"))} <strong>${esc(qualityLabel(latest ? latest.quality_status : ""))}</strong></span></div>
              </div>
              <div class="flex items-center gap-8 wrap"><span class="chip">${esc(t("range"))} ${esc(state.range)}</span></div>
            </div>
          </div>
        </section>
        <section class="card">
          <div class="card-head"><div><h2 class="card-title">${esc(selected.short_name)} · ${esc(state.range)}</h2><div class="card-sub">${esc(indexed ? t("indexedNote") : `${unit} · ${t("eventMarkersNote")}`)}</div></div></div>
          <div class="card-body">${chartBlock("market-data", displaySeries, data.events || [], { height: 300, instrumentId: selected.id, ariaLabel: indexed ? `${selected.name} vs ${compareInstrument.short_name}, indexed to 100` : selected.name, unit: indexed ? "index" : unit })}
            ${indexed ? `<div class="inline-note mt-12"><span class="note-mark">≠</span><span>${esc(t("indexedNote"))}</span></div>` : ""}
          </div>
        </section>
        ${formula ? `<section class="card"><div class="card-head"><div><h2 class="card-title">${esc(t("formula"))}</h2><div class="card-sub">${esc(t("deterministic"))}</div></div><span class="chip copper">${esc(formula.id)}</span></div>
          <div class="card-body"><div class="formula-box"><div class="formula-id">${esc(formula.id)} · v${esc(formula.version)}</div><p>${esc(formula.expression)}</p><div class="formula-inputs">${(formula.inputs || []).map((input) => `<span class="chip">${esc(input)}</span>`).join("")}<span class="chip ${formula.allow_mixed_price_types ? "warn" : "teal"}">${formula.allow_mixed_price_types ? "mixed price types allowed" : "mixed price types rejected"}</span></div></div></div>
        </section>` : ""}
        <section class="card">
          <div class="card-head"><div><h2 class="card-title">${esc(t("observations"))}</h2><div class="card-sub">${esc(t("observationsHint"))}</div></div><span class="chip">${esc(unit)}</span></div>
          <div class="card-body flush"><div class="table-wrap"><table class="data">
            <thead><tr><th>${esc(t("marketTime"))}</th><th>${esc(t("ingested"))}</th><th class="num">${esc(t("value"))}</th><th class="num">${esc(t("deltaPrior"))}</th><th>${esc(t("source"))}</th><th>${esc(t("status"))}</th></tr></thead>
            <tbody>${observations
              .map((row) => `<tr><td class="mono">${fmtTime(row.market_time)}</td><td class="mono">${fmtTime(row.ingested_at)}</td>
                  <td class="num strong">${fmtNum(row.value, selected.decimals)}</td><td class="num ${directionClass(row.delta)}">${row.delta == null ? "-" : fmtSigned(row.delta, selected.decimals)}</td>
                  <td>${esc(sourceName(row.source))}</td><td>${statusChip(row.data_status)} ${qualityState(row.quality_status)}</td></tr>`)
              .join("") || `<tr><td colspan="6" class="table-empty">${esc(t("empty"))}</td></tr>`}</tbody>
          </table></div></div>
        </section>
        <section class="card">
          <div class="card-head"><div><h2 class="card-title">${esc(t("linkedEvents"))}</h2><div class="card-sub">${esc(t("eventMarkersNote"))}</div></div><a class="link-btn" href="#news">${esc(t("allNews"))} →</a></div>
          <div class="card-body"><div class="highlight-list">${((data.events || []).filter((event) => (event.instruments || []).includes(selected.id)))
            .map(
              (event) => `<article class="highlight"><h4>${esc(event.title)}</h4><div class="highlight-meta"><span class="chip copper">${esc(event.type)}</span><span>${fmtDate(event.occurred_at)}</span><span>${esc(sourceName(event.source))}</span><button class="link-btn" type="button" data-action="event-detail" data-id="${esc(event.id)}">${esc(t("inspectEvent"))} →</button></div></article>`,
            )
            .join("") || emptyState(t("noLinkedEvents"), t("noLinkedEventsBody"))}</div></div>
        </section>
      </div>
    </div>`;
}

/* ---------- News ---------- */

function statusLabel(status) {
  return { processed: t("processed"), duplicate_candidate: t("duplicateCandidates"), processing: t("processing"), failed: t("failed") }[status] || status;
}

function renderNews() {
  const items = (state.data && state.data.news) || [];
  const topics = [...new Set(items.flatMap((item) => item.topics || []))].sort();
  const sources = [...new Map(items.map((item) => [item.source.id, item.source.name])).entries()];
  const actions = state.user.role === "mi"
    ? `<button class="btn" type="button" data-action="news-intake">${icon("plus")} ${esc(t("intake"))}</button>
       <button class="btn" type="button" data-action="news-upload">${icon("upload")} ${esc(t("upload"))}</button>`
    : "";
  const counts = ["processed", "duplicate_candidate", "processing", "failed"].map((status) => ({
    status,
    count: items.filter((item) => item.processing_status === status).length,
  }));
  return `${pageHead("BSR · Market news", t("news"), t("tagline"), actions)}
    <div class="news-layout">
      <section class="card">
        <div class="filter-bar">
          <label class="sr-only" for="news-query">${esc(t("searchNews"))}</label>
          <input id="news-query" type="search" data-filter="q" value="${esc(state.newsFilters.q)}" placeholder="${esc(t("newsSearchPlaceholder"))}" aria-label="${esc(t("searchNews"))}">
          <label class="sr-only" for="news-topic">${esc(t("allTopics"))}</label>
          <select id="news-topic" data-filter="topic" aria-label="${esc(t("allTopics"))}"><option value="">${esc(t("allTopics"))}</option>${topics
            .map((topic) => `<option value="${esc(topic)}" ${state.newsFilters.topic === topic ? "selected" : ""}>${esc(topic)}</option>`)
            .join("")}</select>
          <label class="sr-only" for="news-source">${esc(t("allSources"))}</label>
          <select id="news-source" data-filter="source" aria-label="${esc(t("allSources"))}"><option value="">${esc(t("allSources"))}</option>${sources
            .map(([id, name]) => `<option value="${esc(id)}" ${state.newsFilters.source === id ? "selected" : ""}>${esc(name)}</option>`)
            .join("")}</select>
          <label class="sr-only" for="news-status">${esc(t("allStatuses"))}</label>
          <select id="news-status" data-filter="status" aria-label="${esc(t("allStatuses"))}"><option value="">${esc(t("allStatuses"))}</option>${["processed", "duplicate_candidate", "processing", "failed"]
            .map((status) => `<option value="${esc(status)}" ${state.newsFilters.status === status ? "selected" : ""}>${esc(statusLabel(status))}</option>`)
            .join("")}</select>
          <span class="chip">${esc(t("itemsCount", { n: items.length }))}</span>
        </div>
        <div>${items
          .map(
            (item) => `<article class="news-item">
              <div class="news-top">
                <div style="min-width:0">
                  <h3 class="news-title"><button type="button" data-action="news-detail" data-id="${esc(item.id)}">${esc(item.title)}</button></h3>
                  <div class="news-meta"><span>${esc(sourceName(item.source))}</span><span>·</span><span>${fmtTime(item.published_at)}</span><span>·</span><span>${esc(t("ingested"))} ${fmtTime(item.ingested_at)}</span>${item.classification !== "internal" && item.classification !== "public" ? `<span class="chip ${item.classification === "restricted" ? "restricted" : ""}">${icon("lock", 9)} ${esc(item.classification)}</span>` : ""}</div>
                </div>
                <span class="chip ${item.processing_status === "duplicate_candidate" ? "warn" : item.processing_status === "processed" ? "teal" : ""}">${esc(statusLabel(item.processing_status))}</span>
              </div>
              <p class="news-summary">${esc(item.summary || item.body || "")}</p>
              <div class="tag-row">${(item.topics || []).map((topic) => `<span class="chip">${esc(topic)}</span>`).join("")}${item.duplicate_of ? `<span class="chip warn">${icon("layers", 9)} ${esc(t("linkedTo"))} ${esc(item.duplicate_of)}</span>` : ""}</div>
              <div class="news-foot">
                <div class="news-meta">${esc(item.coverage_note || "")}</div>
                <div class="news-actions">
                  <button class="icon-btn" type="button" data-action="feedback-important" data-id="${esc(item.id)}" aria-label="${esc(t("importantShort"))} · ${esc(item.id)}" title="${esc(t("important"))}">${icon("check")}</button>
                  <button class="icon-btn" type="button" data-action="feedback-comment" data-id="${esc(item.id)}" aria-label="${esc(t("commentShort"))} · ${esc(item.id)}" title="${esc(t("addComment"))}">${icon("sparkle")}</button>
                  <button class="icon-btn" type="button" data-action="news-detail" data-id="${esc(item.id)}" aria-label="${esc(t("openDetail"))} · ${esc(item.id)}" title="${esc(t("openDetail"))}">${icon("arrowRight")}</button>
                </div>
              </div>
            </article>`,
          )
          .join("") || emptyState(t("noMatchingItems"), t("noMatchingItemsBody"))}</div>
        <div class="card-foot"><span>${esc(state.user.can_view_restricted ? t("restrictedIncluded") : t("restrictedExcluded"))}</span><a class="link-btn" href="#assistant">${esc(t("assistant"))} →</a></div>
      </section>
      <aside class="grid gap-16">
        <section class="card">
          <div class="card-head"><div><h2 class="card-title">${esc(t("processingQueue"))}</h2><div class="card-sub">${esc(t("permittedOnly"))}</div></div></div>
          <div class="card-body"><div class="quality-list">${counts
            .map(
              (entry) => `<div class="quality-row"><span class="q-label"><span class="status-dot ${entry.status === "failed" ? "rejected" : entry.status === "processing" ? "delayed" : ""}"></span>${esc(statusLabel(entry.status))}</span><span class="q-value">${entry.count}</span></div>`,
            )
            .join("")}</div></div>
        </section>
        <section class="card">
          <div class="card-head"><div><h2 class="card-title">${esc(t("sources"))}</h2><div class="card-sub">${esc(t("availableSources"))}</div></div></div>
          <div class="card-body"><div class="tag-row">${sources.map(([, name]) => `<span class="chip">${esc(name)}</span>`).join("")}</div></div>
        </section>
      </aside>
    </div>`;
}

/* ---------- Forecast ---------- */

function renderForecast() {
  const data = state.data || {};
  const forecasts = data.forecasts || [];
  const evaluation = data.evaluation || { items: [], aggregates: [] };
  const instruments = [...new Map(forecasts.map((item) => [item.instrument.id, item.instrument.name])).entries()];
  const horizons = [...new Set(forecasts.map((item) => item.horizon))];
  const evaluated = evaluation.items.filter((item) => item.actual != null);
  const aggregates = evaluation.aggregates || [];
  return `${pageHead("BSR · Forecast", t("forecast"), t("tagline"))}
    <div class="forecast-layout">
      <div class="grid gap-16">
        <section class="card">
          <div class="filter-bar">
            <label class="sr-only" for="forecast-instrument">${esc(t("allInstruments"))}</label>
            <select id="forecast-instrument" data-filter="forecast-instrument" aria-label="${esc(t("allInstruments"))}"><option value="">${esc(t("allInstruments"))}</option>${instruments
              .map(([id, name]) => `<option value="${esc(id)}" ${state.forecastFilters.instrument === id ? "selected" : ""}>${esc(name)}</option>`)
              .join("")}</select>
            <label class="sr-only" for="forecast-horizon">${esc(t("allHorizons"))}</label>
            <select id="forecast-horizon" data-filter="forecast-horizon" aria-label="${esc(t("allHorizons"))}"><option value="">${esc(t("allHorizons"))}</option>${horizons
              .map((horizon) => `<option value="${esc(horizon)}" ${state.forecastFilters.horizon === horizon ? "selected" : ""}>${esc(horizon)}</option>`)
              .join("")}</select>
            <span class="chip">${esc(t("versionsCount", { n: forecasts.length }))}</span>
          </div>
          <div class="card-body flush"><div class="table-wrap"><table class="data">
            <thead><tr><th>${esc(t("source"))}</th><th>${esc(t("instrument"))}</th><th>${esc(t("periodHorizon"))}</th><th class="num">${esc(t("value"))}</th><th class="num">${esc(t("forecastActual"))}</th><th class="num">${esc(t("absoluteError"))}</th><th>${esc(t("version"))}</th><th></th></tr></thead>
            <tbody>${forecasts
              .map((item) => {
                /* Error values come from the analytical service; the client never computes them. */
                const error = item.absolute_error;
                return `<tr><td class="strong">${esc(sourceName(item.source))}</td><td>${esc(item.instrument.name)}</td><td>${esc(item.period)} · ${esc(item.horizon)}</td>
                  <td class="num">${fmtNum(item.value, 2)}</td><td class="num">${item.actual == null ? `<span class="muted">${esc(t("missingActual"))}</span>` : fmtNum(item.actual, 2)}</td>
                  <td class="num">${error == null ? "-" : fmtNum(error, 2)}</td><td><span class="chip">v${item.version}</span></td>
                  <td class="row-action"><button class="link-btn" type="button" data-action="forecast-versions" data-id="${esc(item.id)}">${esc(t("history"))} →</button></td></tr>`;
              })
              .join("") || `<tr><td colspan="8" class="table-empty">${esc(t("noForecastMatch"))}</td></tr>`}</tbody>
          </table></div></div>
          <div class="card-foot"><span>${esc(t("forecastHint"))}</span><span>${esc(t("evaluatedCount", { n: evaluated.length }))}</span></div>
        </section>
        <section class="card">
          <div class="card-head"><div><h2 class="card-title">${esc(t("accuracyBySource"))}</h2><div class="card-sub">${esc(t("accuracyHint"))}</div></div><span class="chip">${esc(t("evaluatedCount", { n: evaluated.length }))}</span></div>
          <div class="card-body flush">
            ${aggregates.length ? `<div class="table-wrap"><table class="data">
              <thead><tr><th>${esc(t("source"))}</th><th>${esc(t("periodHorizon"))}</th><th class="num">${esc(t("mae"))}</th><th class="num">${esc(t("mape"))}</th><th class="num">${esc(t("bias"))}</th><th class="num">${esc(t("sampleSize"))}</th><th class="num">${esc(t("missingActual"))}</th></tr></thead>
              <tbody>${aggregates
                .map((row) => `<tr><td>${esc(row.source)}</td><td>${esc(row.horizon)}</td><td class="num">${row.mae == null ? "-" : fmtNum(row.mae, 2)}</td><td class="num">${row.mape == null ? "-" : fmtNum(row.mape, 2)}</td><td class="num ${directionClass(row.bias)}">${row.bias == null ? "-" : fmtSigned(row.bias, 2)}</td><td class="num">${row.count}</td><td class="num">${row.missing}</td></tr>`)
                .join("")}</tbody>
            </table></div>` : `<div class="chart-empty">${esc(t("empty"))}</div>`}
            <div class="card-foot"><span>${esc(t("qualityTrendNote"))}</span><span>${esc(t("trendNote"))}</span></div>
          </div>
        </section>
      </div>
      <aside class="grid gap-16">
        <section class="card">
          <div class="card-head"><div><h2 class="card-title">${esc(t("versionActivity"))}</h2><div class="card-sub">${esc(t("history"))}</div></div></div>
          <div class="card-body"><div class="version-list">${forecasts.slice(0, 5).map(
            (item) => `<div class="version-row"><div><span class="chip">v${item.version}</span> ${esc(sourceName(item.source))} · ${esc(item.instrument.short_name || item.instrument.name)}</div><div class="text-right"><div class="v-value">${fmtNum(item.value, 2)}</div><div class="small muted">${fmtTime(item.published_at)}</div></div></div>`,
          ).join("") || `<div class="small muted">${esc(t("noVersions"))}</div>`}</div></div>
        </section>
        <section class="card">
          <div class="card-head"><div><h2 class="card-title">${esc(t("methodNotes"))}</h2><div class="card-sub">${esc(t("version"))}</div></div></div>
          <div class="card-body"><p class="small muted" style="margin:0;line-height:1.6">${esc(t("methodNotesBody"))}</p></div>
        </section>
      </aside>
    </div>`;
}

/* ---------- Analysis ---------- */

function renderAnalysis() {
  const data = state.data || {};
  const facts = data.facts || [];
  const calculations = data.calculations || [];
  const assumptions = data.assumptions || [];
  const recommendation = data.recommendation || {};
  const execution = data.execution;
  return `${pageHead("BSR · Analysis", t("analysis"), t("analysisHint"))}
    <form class="card" data-form="analysis" style="margin-bottom:16px">
      <div class="card-body">
        <div class="field"><label for="analysis-question">${esc(t("ask"))}</label>
          <input id="analysis-question" name="question" value="${esc(state.analysisQuestion)}" required></div>
        <div class="form-actions"><button class="btn btn-copper" type="submit">${icon("analysis")} ${esc(t("submit"))}</button></div>
      </div>
    </form>
    ${data.facts
      ? `<section class="card" style="margin-bottom:16px">
          <div class="card-head"><div><h2 class="card-title">${esc(t("evidenceStack"))}</h2><div class="card-sub">${esc(t("evidenceStackHint"))}</div></div><span class="chip teal">${icon("check", 10)} ${esc(t("evidenceSeparated"))}</span></div>
          <div class="card-body flush"><div class="evidence-stack">
            <div class="evidence-step"><div class="e-level">01 · ${esc(t("levelObserved"))}</div><h4>${facts.length} ${esc(t("facts"))}</h4><p>${esc(t("permittedOnly"))}</p></div>
            <div class="evidence-step"><div class="e-level">02 · ${esc(t("levelCalculated"))}</div><h4>${calculations.length} ${esc(t("calculations"))}</h4><p>${esc(t("deterministic"))}</p></div>
            <div class="evidence-step"><div class="e-level">03 · ${esc(t("levelAssumed"))}</div><h4>${assumptions.length} ${esc(t("assumptions"))}</h4><p>${esc(t("uncertainty"))}</p></div>
            <div class="evidence-step"><div class="e-level">04 · ${esc(t("levelConclusion"))}</div><h4>${esc(recommendation.title || "-")}</h4><p>${esc(t("confidence"))}: ${esc(recommendation.confidence || "-")}</p></div>
          </div></div>
        </section>
        <div class="analysis-layout">
          <div class="grid gap-16">
            <section class="card">
              <div class="card-head"><div><div class="page-kicker">${esc(t("activeAnalysis"))}</div><h2 class="analysis-question">${esc(data.question || state.analysisQuestion)}</h2><div class="card-sub">${esc(t("asOf"))} ${fmtTime(data.as_of)} · ${esc(t("evidenceSeparated"))}</div></div><span class="chip teal">${icon("check", 10)} ${esc(t("evidenceSeparated"))}</span></div>
              <div class="card-body"><div class="section-label">${esc(t("observedFacts"))}</div><ul class="evidence-list">${facts.map((fact, index) => `<li><span class="e-num">F${String(index + 1).padStart(2, "0")}</span><span>${esc(fact)}</span></li>`).join("")}</ul></div>
            </section>
            <section class="card">
              <div class="card-head"><div><h2 class="card-title">${esc(t("calculations"))}</h2><div class="card-sub">${esc(t("deterministic"))}</div></div><span class="chip">${icon("layers", 10)} ${calculations.length}</span></div>
              <div class="card-body"><div class="calc-grid">${calculations.map((calc) => `<div class="calc-cell"><div class="c-label">${esc(calc.label)}</div><div class="c-value">${fmtNum(calc.value, 2)} ${esc(calc.unit)}</div><div class="c-method">${esc(calc.method)}</div></div>`).join("")}</div></div>
            </section>
            <section class="card">
              <div class="card-head"><div><h2 class="card-title">${esc(t("assumptions"))}</h2><div class="card-sub">${esc(t("uncertainty"))}</div></div></div>
              <div class="card-body"><ul class="evidence-list">${assumptions.map((item, index) => `<li><span class="e-num">A${index + 1}</span><span>${esc(item)}</span></li>`).join("")}</ul></div>
            </section>
            <section class="card">
              <div class="card-head"><div><h2 class="card-title">${esc(t("evidence"))}</h2><div class="card-sub">${esc(t("analysisSources"))}</div></div></div>
              <div class="card-body"><div class="version-list">${(data.evidence || []).map(
                (item) => `<div class="version-row"><span>${esc(item.label)}</span><span class="chip">${esc(item.kind)} #${esc(item.id)}</span></div>`,
              ).join("")}</div></div>
            </section>
          </div>
          <aside class="grid gap-16">
            <section class="card recommendation">
              <div class="card-head"><div><div class="briefing-kicker">${icon("sparkle", 12)} ${esc(t("recommendation"))} · ${esc(t("aiInterpretation"))}</div><h2 class="card-title">${esc(t("levelConclusion"))}</h2></div><span class="chip warn">${esc(recommendation.confidence || "-")}</span></div>
              <div class="card-body"><h3>${esc(recommendation.title || "-")}</h3><p>${esc(recommendation.rationale || "")}</p>
                <div class="divider"></div><div class="section-label">${esc(t("watchNext"))}</div><ul class="watch-list">${(recommendation.watch || []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
                <div class="inline-note mt-12"><span class="note-mark">i</span><span>${esc(t("uncertaintyBody"))}</span></div></div>
            </section>
            <section class="card">
              <div class="card-head"><div><h2 class="card-title">${esc(t("executionTrace"))}</h2><div class="card-sub">${esc(t("auditableRuns"))}</div></div></div>
              <div class="card-body">${execution ? `<div class="context-list">
                <div class="context-row"><span class="c-name">${esc(t("taskId"))}</span><span class="c-value mono">${esc(execution.task_id)}</span></div>
                <div class="context-row"><span class="c-name">${esc(t("status"))}</span><span class="c-value">${esc(execution.status)}</span></div>
                <div class="context-row"><span class="c-name">${esc(t("model"))}</span><span class="c-value">${esc(execution.model)}</span></div>
              </div>` : `<div class="small muted">${esc(t("empty"))}</div>`}</div>
            </section>
          </aside>
        </div>`
      : emptyState(t("empty"), t("analysisHint"))}`;
}

/* ---------- Assistant ---------- */

const SUGGESTIONS = [
  "What is the gasoline crack spread?",
  "What is driving Brent today?",
  "What is the 5-session return on Brent?",
  "What is the dated Brent physical price?",
  "Which news could affect crude supply?",
  "How accurate are Brent forecasts?",
];

function renderChatMessage(message) {
  if (message.role === "user") {
    return `<div class="message user"><div class="bubble">${esc(message.text)}</div></div>`;
  }
  const meta = message.execution
    ? `${t("aiInterpretation")} · ${message.execution.model} · ${message.execution.latency_ms} ms`
    : t("aiInterpretation");
  return `<div class="message ai">
    <div class="ai-label">${icon("sparkle", 11)} ${esc(meta)}</div>
    <div class="bubble">${esc(message.text)}
      ${message.calculations && message.calculations.length
        ? `<div class="answer-table"><table><thead><tr><th>${esc(t("calculations"))}</th><th>${esc(t("value"))}</th></tr></thead><tbody>${message.calculations
            .map((item) => `<tr><td>${esc(item.label)}<div class="small muted">${esc(item.method)}</div></td><td>${fmtNum(item.value, 2)} ${esc(item.unit)}</td></tr>`)
            .join("")}</tbody></table></div>`
        : ""}
      ${message.citations && message.citations.length
        ? `<div class="source-ledger">${message.citations.slice(0, 8).map((citation) => `<span class="source-chip">${icon("file", 9)} ${esc(citation.label || citation.id)}</span>`).join("")}</div>`
        : ""}
      ${message.toolTrace && message.toolTrace.length
        ? `<details class="tool-trace"><summary>${esc(t("toolTrace"))} · ${message.toolTrace.length}</summary><ul>${message.toolTrace.map((tool) => `<li>${esc(tool.tool)} · ${esc(tool.status)}</li>`).join("")}</ul>${message.execution ? `<div>${esc(t("validation"))}: ${esc(message.execution.validation)} · ${esc(message.execution.task_id)}</div>` : ""}</details>`
        : ""}
      ${message.refusal ? "" : `<div class="answer-actions"><button class="btn btn-sm" type="button" data-action="answer-analysis" data-question="${esc(message.question || "")}">${icon("analysis", 12)} ${esc(t("openInAnalysis"))}</button><a class="btn btn-sm" href="#reports">${icon("file", 12)} ${esc(t("createReport"))}</a></div>`}
    </div>
  </div>`;
}

function renderAssistant() {
  const chat = state.chat.length
    ? state.chat.map(renderChatMessage).join("")
    : `<div class="chat-empty"><div class="ai-mark" aria-hidden="true">A</div><h3>${esc(t("chatEmptyTitle"))}</h3><p>${esc(t("chatEmptyBody"))}</p>
        <div class="prompt-grid">${SUGGESTIONS.map((question) => `<button class="prompt-btn" type="button" data-action="suggestion" data-question="${esc(question)}">${esc(question)}</button>`).join("")}</div></div>`;
  const lastExecution = [...state.chat].reverse().find((message) => message.execution);
  return `${pageHead("BSR · AI assistant", t("assistant"), t("chatEmptyBody"), `<a class="btn" href="#reports">${icon("file")} ${esc(t("reports"))}</a>`)}
    <div class="assistant-layout">
      <section class="card chat-card">
        <div class="card-head"><div><h2 class="card-title">${icon("sparkle", 14)} ${esc(t("chatTitle"))}</h2><div class="card-sub">${esc(t("chatSub"))}</div></div><span class="chip teal">${icon("lock", 9)} ${esc(t("scope", { role: roleLabel(state.user.role) }))}</span></div>
        <div class="chat-body" id="chat-body">${chat}${state.chatBusy ? `<div class="thinking"><span class="pulse"></span>${esc(t("loading"))}</div>` : ""}</div>
        <form class="chat-composer" data-form="assistant">
          <label class="sr-only" for="chat-input">${esc(t("ask"))}</label>
          <textarea id="chat-input" name="question" placeholder="${esc(t("chatPlaceholder"))}" aria-label="${esc(t("ask"))}" required></textarea>
          <div class="composer-row"><span class="composer-hint">${esc(t("composerHint"))}</span><button class="btn btn-copper btn-sm" type="submit" ${state.chatBusy ? "disabled" : ""}>${icon("arrowRight", 13)} ${esc(t("send"))}</button></div>
        </form>
      </section>
      <aside class="assistant-rail">
        <section class="card">
          <div class="card-head"><div><h2 class="card-title">${esc(t("permissionContext"))}</h2><div class="card-sub">${esc(t("appliedBeforeRetrieval"))}</div></div></div>
          <div class="card-body"><div class="context-list">
            <div class="context-row"><span class="c-name">${esc(t("accountRole"))}</span><span class="c-value">${esc(roleLabel(state.user.role))}</span></div>
            <div class="context-row"><span class="c-name">${esc(t("maxClassification"))}</span><span class="c-value">${esc(state.user.max_classification)}</span></div>
            <div class="context-row"><span class="c-name">${esc(t("restrictedData"))}</span><span class="c-value">${esc(state.user.can_view_restricted ? t("included") : t("excluded"))}</span></div>
            <div class="context-row"><span class="c-name">${esc(t("exportPermission"))}</span><span class="c-value">${esc(state.user.can_export ? t("allowed") : t("deniedShort"))}</span></div>
            <div class="context-row"><span class="c-name">${esc(t("taskId"))}</span><span class="c-value mono">${esc(lastExecution ? lastExecution.execution.task_id : "-")}</span></div>
          </div></div>
        </section>
        <section class="card">
          <div class="card-head"><div><h2 class="card-title">${esc(t("answerDiscipline"))}</h2><div class="card-sub">${esc(t("answerDisciplineSub"))}</div></div></div>
          <div class="card-body"><div class="context-list">
            <div class="context-row"><span class="c-name">${esc(t("sourceFacts"))}</span><span class="chip">${esc(t("cited"))}</span></div>
            <div class="context-row"><span class="c-name">${esc(t("calculations"))}</span><span class="chip">${esc(t("analyticalService"))}</span></div>
            <div class="context-row"><span class="c-name">${esc(t("aiInterpretation"))}</span><span class="chip copper">${esc(t("labelled"))}</span></div>
            <div class="context-row"><span class="c-name">${esc(t("uncertainty"))}</span><span class="chip">${esc(t("stated"))}</span></div>
            <div class="context-row"><span class="c-name">${esc(t("validation"))}</span><span class="chip teal">${esc(t("schemaChecked"))}</span></div>
          </div></div>
        </section>
        <section class="card">
          <div class="card-head"><div><h2 class="card-title">${esc(t("recentExecutions"))}</h2><div class="card-sub">${esc(t("auditableRuns"))}</div></div></div>
          <div class="card-body"><div class="version-list">${state.chat
            .filter((message) => message.execution)
            .slice(-3)
            .reverse()
            .map(
              (message) => `<div class="version-row"><span><strong class="mono">${esc(message.execution.task_id)}</strong><br><span class="small muted">${esc(message.execution.model)}</span></span><span class="text-right"><span class="chip ${message.execution.status === "succeeded" ? "teal" : "warn"}">${esc(message.execution.status)}</span><div class="small muted">${message.execution.latency_ms} ms · $${fmtNum(message.execution.cost_usd, 3)}</div></span></div>`,
            )
            .join("") || `<div class="small muted">${esc(t("empty"))}</div>`}</div></div>
        </section>
      </aside>
    </div>`;
}

/* ---------- Reports ---------- */

const REPORT_TYPES = ["On-demand Market Analysis", "Morning Briefing", "Weekly Market Report", "Event-driven Analysis"];

function renderReports() {
  const reports = (state.data && state.data.reports) || [];
  return `${pageHead("BSR · Reports", t("reports"), t("reportFrozenNote"))}
    <div class="reports-layout">
      <div class="grid gap-16">
        <section class="card">
          <div class="card-head"><div><h2 class="card-title">${esc(t("reportBuilder"))}</h2><div class="card-sub">${esc(t("reportBuilderSub"))}</div></div><span class="chip ${state.user.can_export ? "teal" : "warn"}">${esc(state.user.can_export ? t("exportAllowed") : t("exportDenied"))}</span></div>
          <div class="card-body"><form class="report-builder" data-form="report">
            <div class="field-row">
              <div class="field"><label for="report-type">${esc(t("reportType"))}</label><select id="report-type" name="type">${REPORT_TYPES.map((type) => `<option value="${esc(type)}" ${state.reportType === type ? "selected" : ""}>${esc(type)}</option>`).join("")}</select></div>
              <div class="field"><label for="report-range-start">${esc(t("from"))}</label><input id="report-range-start" name="range_start" type="date" value="${esc(state.reportStart)}" required></div>
            </div>
            <div class="field-row">
              <div class="field"><label for="report-range-end">${esc(t("to"))}</label><input id="report-range-end" name="range_end" type="date" value="${esc(state.reportEnd)}" required></div>
              <div class="field"><span class="section-label">${esc(t("classification"))}</span><span class="chip">${classificationTag(state.user.max_classification)}</span></div>
            </div>
            <div class="inline-note"><span class="note-mark">i</span><span>${esc(t("reportFrozenNote"))}</span></div>
            <div class="flex items-center justify-between gap-8 wrap"><span class="small muted">${esc(state.user.can_view_restricted ? t("restrictedIncluded") : t("restrictedExcluded"))}</span><button class="btn btn-copper" type="submit">${icon("sparkle")} ${esc(t("generate"))}</button></div>
          </form></div>
        </section>
        <section class="card">
          <div class="card-head"><div><h2 class="card-title">${esc(t("reportRegister"))}</h2><div class="card-sub">${esc(t("reportRegisterSub"))}</div></div><span class="chip">${esc(t("reportsCount", { n: reports.length }))}</span></div>
          <div class="card-body" style="padding-top:4px;padding-bottom:4px">${reports
            .map(
              (report) => `<div class="report-row"><div><div class="report-title">${esc(report.title)}</div><div class="r-meta"><span>${esc(report.type)}</span><span>·</span><span>v${report.version}</span><span>·</span><span>${esc(report.range_start)} → ${esc(report.range_end)}</span><span>·</span><span>${fmtTime(report.created_at)}</span><span class="chip">${esc(report.classification)}</span></div></div>
                <div class="flex items-center gap-8"><button class="btn btn-sm" type="button" data-action="report-preview" data-id="${esc(report.id)}" data-testid="report-preview-${esc(report.id)}">${esc(t("preview"))}</button><button class="btn btn-sm" type="button" data-action="report-export" data-id="${esc(report.id)}" ${state.user.can_export ? "" : `disabled title="${esc(t("exportRequires"))}"`}>${icon("download", 12)} PDF</button></div></div>`,
            )
            .join("") || emptyState(t("empty"), t("reportRegisterSub"))}</div>
        </section>
      </div>
      <aside class="grid gap-16">
        <section class="card">
          <div class="card-head"><div><h2 class="card-title">${esc(t("versionRules"))}</h2><div class="card-sub">${esc(t("history"))}</div></div></div>
          <div class="card-body"><ul class="evidence-list">${[
            t("reportRegisterSub"),
            t("reportFrozenNote"),
            t("exportPolicySub"),
            t("auditNote"),
          ]
            .map((item, index) => `<li><span class="e-num">${String(index + 1).padStart(2, "0")}</span><span>${esc(item)}</span></li>`)
            .join("")}</ul></div>
        </section>
        <section class="card">
          <div class="card-head"><div><h2 class="card-title">${esc(t("exportPolicy"))}</h2><div class="card-sub">${esc(t("exportPolicySub"))}</div></div></div>
          <div class="card-body"><div class="inline-note"><span class="note-mark">${state.user.can_export ? "✓" : "!"}</span><span>${esc(state.user.can_export ? t("exportPolicyAllowed") : t("exportPolicyDenied"))}</span></div></div>
        </section>
      </aside>
    </div>`;
}

/* ---------- Admin ---------- */

function renderAdmin() {
  if (!state.user.is_admin) {
    return `${pageHead("BSR · Governance", t("admin"), t("adminDeniedTitle"))}
      <div class="denied"><div class="denied-mark">${icon("lock", 22)}</div><h2>${esc(t("adminDeniedTitle"))}</h2><p>${esc(t("denied"))}</p><a class="btn mt-12" href="#overview">${esc(t("overview"))}</a></div>`;
  }
  const data = state.data || {};
  const tabs = ["users", "sources", "executions", "audit"];
  let body = "";
  if (state.adminTab === "users") {
    const fieldLabels = {
      can_view_restricted: t("viewRestricted"),
      can_export: t("export"),
      is_admin: t("adminRights"),
    };
    body = `<div class="table-wrap"><table class="data role-matrix">
      <thead><tr><th>${esc(t("users"))}</th><th>${esc(t("role"))}</th><th>${esc(t("classification"))}</th><th>${esc(t("viewRestricted"))}</th><th>${esc(t("export"))}</th><th>${esc(t("adminRights"))}</th></tr></thead>
      <tbody>${(data.users || [])
        .map(
          (user) => `<tr><td class="strong">${esc(user.name)}<br><span class="small muted">${esc(user.department)}</span></td><td>${esc(roleLabel(user.role))}</td><td>${classificationTag(user.max_classification)}</td>
            ${["can_view_restricted", "can_export", "is_admin"]
              .map(
                (field) => `<td><button class="btn btn-ghost btn-sm ${user[field] ? "active" : ""}" type="button" data-action="toggle-permission" data-user="${esc(user.id)}" data-field="${field}" aria-pressed="${user[field]}" aria-label="${esc(`${fieldLabels[field]} - ${user.name}: ${user[field] ? t("yes") : t("no")}`)}">${user[field] ? icon("check") : "-"}</button></td>`,
              )
              .join("")}</tr>`,
        )
        .join("")}</tbody>
    </table></div>`;
  } else if (state.adminTab === "sources") {
    body = `<div class="table-wrap"><table class="data">
      <thead><tr><th>ID</th><th>${esc(t("source"))}</th><th>${esc(t("type"))}</th><th>${esc(t("classification"))}</th><th>${esc(t("sourceLicence"))}</th><th>${esc(t("status"))}</th></tr></thead>
      <tbody>${(data.sources || [])
        .map(
          (source) => `<tr><td class="mono">${esc(source.id)}</td><td>${esc(source.name)}</td><td>${esc(source.kind)}</td><td>${classificationTag(source.classification)}</td><td class="small muted">${esc(source.licence_note || "")}</td><td><span class="chip ${source.active ? "teal" : "warn"}">${esc(source.active ? t("connected") : t("inactive"))}</span></td></tr>`,
        )
        .join("")}</tbody>
    </table></div>`;
  } else if (state.adminTab === "executions") {
    body = `<div class="table-wrap"><table class="data">
      <thead><tr><th>${esc(t("taskId"))}</th><th>${esc(t("type"))}</th><th>${esc(t("model"))}</th><th class="num">${esc(t("latency"))}</th><th class="num">${esc(t("cost"))}</th><th>${esc(t("status"))}</th><th>${esc(t("validation"))}</th></tr></thead>
      <tbody>${(data.executions || [])
        .map(
          (row) => `<tr><td class="mono">${esc(row.task_id)}</td><td>${esc(row.task_type)}</td><td>${esc(row.model)}</td><td class="num">${row.latency_ms} ms</td><td class="num">$${fmtNum(row.cost_usd, 3)}</td><td><span class="chip ${row.status === "succeeded" ? "teal" : "warn"}">${esc(row.status)}</span></td><td>${esc(row.validation)}</td></tr>`,
        )
        .join("")}</tbody>
    </table></div>`;
  } else {
    body = `<div class="table-wrap"><table class="data audit-table">
      <thead><tr><th>${esc(t("time"))}</th><th>${esc(t("actor"))}</th><th>${esc(t("action"))}</th><th>${esc(t("object"))}</th><th>${esc(t("result"))}</th><th>${esc(t("classification"))}</th></tr></thead>
      <tbody>${(data.audit || [])
        .map(
          (row) => `<tr><td class="mono">${fmtTime(row.created_at)}</td><td>${esc(row.actor_id || "system")}<br><span class="small muted">${esc(row.actor_role || "")}</span></td><td>${esc(row.action)}</td><td class="mono">${esc(row.object_id || "")}</td><td class="${row.result === "denied" ? "result-denied" : "result-allowed"}">${esc(row.result)}</td><td>${row.classification ? classificationTag(row.classification) : "-"}</td></tr>`,
        )
        .join("")}</tbody>
    </table></div>`;
  }
  return `${pageHead("BSR · Governance", t("admin"), t("auditNote"))}
    <div class="tabs" role="group" aria-label="${esc(t("admin"))}">${tabs
      .map(
        (tab) => `<button class="tab ${state.adminTab === tab ? "active" : ""}" type="button" data-action="admin-tab" data-tab="${tab}" aria-pressed="${state.adminTab === tab}">${esc(t(tab === "executions" ? "executions" : tab))}</button>`,
      )
      .join("")}</div>
    <div class="card">${body}</div>`;
}

/* ---------- Route rendering ---------- */

function renderContent() {
  if (state.loading) return `<div class="empty-state"><h3>${esc(t("loading"))}</h3><p>${esc(t("tagline"))}</p></div>`;
  if (state.error) {
    return `<div class="error-box">${esc(t("error"))}: ${esc(state.error.message)} <button class="btn btn-sm" type="button" data-action="retry">${esc(t("retry"))}</button></div>`;
  }
  switch (state.route) {
    case "overview":
      return renderOverview();
    case "market-data":
      return renderMarketData();
    case "news":
      return renderNews();
    case "forecast":
      return renderForecast();
    case "analysis":
      return renderAnalysis();
    case "assistant":
      return renderAssistant();
    case "reports":
      return renderReports();
    case "admin":
      return renderAdmin();
    default:
      return emptyState(t("empty"), t("tagline"));
  }
}

function render() {
  const app = $("#app");
  if (!app) return;
  chartRegistry = new Map();
  if (state.route === "login" || !state.user) {
    app.innerHTML = renderLogin();
    document.title = `${t("signIn")} · BSR Market Intelligence`;
    return;
  }
  app.innerHTML = renderShell(renderContent());
  bindCharts();
  updateDocumentTitle();
  if (state.route === "assistant") {
    const chat = $("#chat-body");
    if (chat) chat.scrollTop = chat.scrollHeight;
  }
}

/* ---------- Data loading ---------- */

function applyChrome(overview) {
  state.tape = overview.tape || [];
  state.asOf = overview.as_of;
  state.freshness = overview.freshness;
}

async function ensureChrome(seq) {
  if (state.asOf) return;
  try {
    const overview = await api("/api/overview");
    if (seq !== loadSeq) return;
    applyChrome(overview);
  } catch (error) {
    /* the shell renders without a tape rather than blocking the route */
  }
}

async function fetchRoute(route) {
  if (route === "overview") {
    const [overview, series] = await Promise.all([
      api("/api/overview"),
      api(`/api/instruments/brent_futures/series?range=${state.range}&compare=wti_futures`),
    ]);
    return { ...overview, series: series.series, events: series.events };
  }
  if (route === "market-data") {
    const instrumentsResponse = await api("/api/instruments");
    const instruments = instrumentsResponse.instruments || [];
    if (!instruments.some((item) => item.id === state.instrument)) {
      state.instrument = instruments.length ? instruments[0].id : "";
    }
    if (state.compare && !instruments.some((item) => item.id === state.compare && item.id !== state.instrument)) {
      state.compare = "";
    }
    const compare = state.compare ? `&compare=${encodeURIComponent(state.compare)}` : "";
    const [series, observations, formulas] = await Promise.all([
      api(`/api/instruments/${encodeURIComponent(state.instrument)}/series?range=${state.range}${compare}`),
      api(`/api/observations?instrument=${encodeURIComponent(state.instrument)}&limit=30`),
      api("/api/formulas"),
    ]);
    return {
      instruments,
      series: series.series,
      events: series.events,
      observations: observations.observations,
      formulas: formulas.formulas,
    };
  }
  if (route === "news") {
    const params = new URLSearchParams();
    Object.entries(state.newsFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return api(`/api/news?${params.toString()}`);
  }
  if (route === "forecast") {
    const params = new URLSearchParams();
    if (state.forecastFilters.instrument) params.set("instrument", state.forecastFilters.instrument);
    if (state.forecastFilters.horizon) params.set("horizon", state.forecastFilters.horizon);
    const [forecasts, evaluation] = await Promise.all([
      api(`/api/forecasts?${params.toString()}`),
      api(`/api/forecasts/evaluation?${params.toString()}`),
    ]);
    return { forecasts: forecasts.forecasts, evaluation };
  }
  if (route === "analysis") {
    return api(`/api/analysis?question=${encodeURIComponent(state.analysisQuestion)}`);
  }
  if (route === "assistant") {
    return {};
  }
  if (route === "reports") {
    return api("/api/reports");
  }
  if (route === "admin") {
    if (!state.user.is_admin) return {};
    const [users, sources, audit, executions] = await Promise.all([
      api("/api/admin/users"),
      api("/api/admin/sources"),
      api("/api/admin/audit?limit=50"),
      api("/api/admin/ai-executions"),
    ]);
    return {
      users: users.users,
      sources: sources.sources,
      audit: audit.audit,
      executions: executions.executions,
    };
  }
  return {};
}

async function loadRoute() {
  if (state.route === "login") {
    render();
    return;
  }
  const seq = ++loadSeq;
  if (!state.user) {
    try {
      const me = await api("/api/me");
      if (seq !== loadSeq) return;
      state.user = me.user;
      setCsrf(me.csrf_token);
    } catch (error) {
      if (seq !== loadSeq) return;
      state.route = "login";
      location.hash = "#login";
      render();
      return;
    }
  }
  state.loading = true;
  state.error = null;
  render();
  try {
    if (state.route !== "overview") await ensureChrome(seq);
    if (seq !== loadSeq) return;
    const data = await fetchRoute(state.route);
    if (seq !== loadSeq) return;
    state.data = data;
    if (state.route === "overview") applyChrome(data);
  } catch (error) {
    if (seq !== loadSeq) return;
    if (error.status === 401) {
      state.user = null;
      state.route = "login";
      location.hash = "#login";
      state.loading = false;
      render();
      return;
    }
    state.error = error;
  } finally {
    if (seq === loadSeq) {
      state.loading = false;
      render();
    }
  }
}

/* ---------- Actions ---------- */

function resetWorkspace() {
  state.chat = [];
  state.chatBusy = false;
  state.data = null;
  state.tape = [];
  state.asOf = null;
  state.freshness = null;
  state.instrument = "brent_futures";
  state.compare = "";
  state.range = "1M";
  state.newsFilters = { topic: "", source: "", status: "", q: "" };
  state.forecastFilters = { instrument: "", horizon: "" };
  state.adminTab = "users";
  state.reportType = "On-demand Market Analysis";
  state.reportStart = "2026-11-01";
  state.reportEnd = "2026-11-14";
}

async function signIn(role) {
  try {
    const session = await api("/api/auth/session", { method: "POST", body: { role } });
    closeOverlays();
    state.user = session.user;
    setCsrf(session.csrf_token);
    resetWorkspace();
    if (location.hash === "#overview") {
      state.route = "overview";
      await loadRoute();
    } else {
      location.hash = "#overview";
    }
  } catch (error) {
    toast(error.message, "error");
  }
}

async function signOut() {
  try {
    await api("/api/auth/session", { method: "DELETE" });
  } catch (error) {
    /* a failed sign-out still clears the local view */
  }
  state.user = null;
  state.data = null;
  state.tape = [];
  setCsrf(null);
  closeOverlays();
  location.hash = "#login";
  render();
}

async function switchRole(role) {
  if (!role || role === state.user.role) return;
  await signIn(role);
}

function availableInstruments() {
  const instruments = (state.data && state.data.instruments) || [];
  if (instruments.length) return instruments;
  return ((state.data && state.data.cards) || []).map((card) => card.instrument);
}

function openQuickInput() {
  const instruments = availableInstruments();
  const options = instruments
    .map((item) => `<option value="${esc(item.id)}" ${item.id === state.instrument ? "selected" : ""}>${esc(item.name)} (${esc(item.unit)})</option>`)
    .join("");
  openModal(
    t("observations"),
    t("quickInputTitle"),
    `<form data-form="quick-input" id="quick-input-form">
      <div class="field"><label for="qi-instrument">Instrument</label><select id="qi-instrument" name="instrument_id">${options}</select></div>
      <div class="form-row">
        <div class="field"><label for="qi-value">${esc(t("value"))}</label><input id="qi-value" name="value" type="number" step="0.01" required></div>
        <div class="field"><label for="qi-time">${esc(t("time"))}</label><input id="qi-time" name="market_time" type="datetime-local" value="2026-11-14T08:00" required></div>
      </div>
      <div class="form-row">
        <div class="field"><label for="qi-source">${esc(t("source"))}</label>
          <select id="qi-source" name="source_id"><option value="SRC-ICE">ICE (demo)</option><option value="SRC-CME">CME (demo)</option><option value="SRC-PLATTS">Platts (demo)</option><option value="SRC-SBV">SBV (demo)</option></select></div>
        <div class="field"><label for="qi-status">${esc(t("dataStatus"))}</label>
          <select id="qi-status" name="data_status"><option value="real-time">real-time</option><option value="delayed">delayed</option><option value="eod">eod</option><option value="manual">manual</option></select></div>
      </div>
      <div class="field"><label for="qi-classification">${esc(t("classification"))}</label>
        <select id="qi-classification" name="classification"><option value="internal">internal</option><option value="public">public</option><option value="confidential">confidential</option><option value="restricted">restricted</option></select></div>
      <p class="small muted">${esc(t("synthetic"))}</p>
    </form>`,
    `<button class="btn" type="button" data-action="close-overlays">${esc(t("close"))}</button>
     <button class="btn btn-copper" type="submit" form="quick-input-form">${esc(t("submit"))}</button>`,
  );
}

async function submitQuickInput(form) {
  const data = new FormData(form);
  const instrument = availableInstruments().find((item) => item.id === data.get("instrument_id"));
  const marketTime = data.get("market_time");
  const payload = {
    instrument_id: data.get("instrument_id"),
    value: Number(data.get("value")),
    unit: instrument ? instrument.unit : undefined,
    market_time: marketTime ? `${marketTime}:00+07:00` : undefined,
    source_id: data.get("source_id"),
    data_status: data.get("data_status"),
    quality_status: "valid",
    classification: data.get("classification"),
  };
  try {
    await api("/api/observations", { method: "POST", body: payload });
    closeOverlays();
    toast(t("saved"));
    await loadRoute();
  } catch (error) {
    handleApiError(error);
  }
}

function openQuickQuery(question = "") {
  openModal(
    t("quickQuery"),
    t("assistant"),
    `<form data-form="quick-query" id="quick-query-form">
      <div class="field"><label for="qq-question">${esc(t("ask"))}</label>
        <input id="qq-question" name="question" value="${esc(question)}" required></div>
    </form>`,
    `<button class="btn" type="button" data-action="close-overlays">${esc(t("close"))}</button>
     <button class="btn btn-copper" type="submit" form="quick-query-form">${esc(t("send"))}</button>`,
  );
}

async function askAssistant(question) {
  const text = String(question || "").trim();
  if (!text) return;
  if (state.chatBusy) {
    toast(t("busy"));
    return;
  }
  state.chat.push({ role: "user", text });
  state.chatBusy = true;
  render();
  try {
    const response = await api("/api/assistant/query", { method: "POST", body: { question: text } });
    state.chat.push({
      role: "assistant",
      text: response.answer,
      citations: response.citations,
      calculations: response.calculations,
      toolTrace: response.tool_trace,
      execution: response.execution,
      refusal: response.refusal,
      question: text,
    });
  } catch (error) {
    if (error.status === 401) {
      state.chatBusy = false;
      handleApiError(error);
      return;
    }
    state.chat.push({ role: "assistant", text: `${t("error")}: ${error.message}`, question: text });
  } finally {
    state.chatBusy = false;
    render();
  }
}

async function openNewsDetail(id) {
  try {
    const item = await api(`/api/news/${encodeURIComponent(id)}`);
    openDrawer(
      `${sourceName(item.source)} · ${fmtTime(item.published_at)}`,
      item.title,
      `<div class="tag-row" style="margin-bottom:10px"><span class="chip ${item.processing_status === "processed" ? "teal" : "warn"}">${esc(statusLabel(item.processing_status))}</span>${classificationTag(item.classification)}${item.duplicate_of ? `<span class="chip warn">${esc(t("duplicateOf"))} ${esc(item.duplicate_of)}</span>` : ""}</div>
       <dl class="kv"><dt>${esc(t("source"))}</dt><dd>${esc(sourceName(item.source))}</dd>
       <dt>${esc(t("published"))}</dt><dd class="mono">${fmtTime(item.published_at)}</dd>
       <dt>${esc(t("ingested"))}</dt><dd class="mono">${fmtTime(item.ingested_at)}</dd>
       <dt>${esc(t("topics"))}</dt><dd>${(item.topics || []).map((topic) => esc(topic)).join(", ")}</dd>
       <dt>${esc(t("linkedInstruments"))}</dt><dd>${(item.instruments || []).map((entry) => esc(entry)).join(", ") || "-"}</dd></dl>
       <h3>${esc(t("original"))}</h3><p>${esc(item.body || "")}</p>
       <h3>AI summary</h3><div class="inline-note"><span class="note-mark">${esc(t("aiInterpretation"))}</span><span>${esc(item.summary || "")}</span></div>
       <h3>AI insight</h3><div class="inline-note"><span class="note-mark">${esc(t("aiInterpretation"))}</span><span>${esc(item.insight || "")}</span></div>
       <h3>${esc(t("feedback"))}</h3><ul class="evidence">${(item.feedback || [])
         .map((entry) => `<li><span class="kind">${esc(entry.kind)}</span>${esc(entry.body || "")}</li>`)
         .join("") || `<li class="small muted">${esc(t("empty"))}</li>`}</ul>`,
      `<button class="btn" type="button" data-action="feedback-important" data-id="${esc(item.id)}">${esc(t("important"))}</button>
       <button class="btn" type="button" data-action="feedback-comment" data-id="${esc(item.id)}">${esc(t("addComment"))}</button>
       <button class="btn" type="button" data-action="close-overlays">${esc(t("close"))}</button>`,
    );
  } catch (error) {
    toast(error.message, "error");
  }
}

function openNewsIntake() {
  openModal(
    t("intake"),
    t("addNewsTitle"),
    `<form data-form="news-intake" id="news-intake-form">
      <div class="field"><label for="ni-title">${esc(t("title"))}</label><input id="ni-title" name="title" required></div>
      <div class="field"><label for="ni-body">${esc(t("body"))}</label><textarea id="ni-body" name="body" required></textarea></div>
      <div class="form-row">
        <div class="field"><label for="ni-source">${esc(t("source"))}</label>
          <select id="ni-source" name="source_id"><option value="SRC-REUTERS">Reuters (demo)</option><option value="SRC-PLATTS">Platts (demo)</option><option value="SRC-EIA">EIA (demo)</option><option value="SRC-BLOOMBERG">Bloomberg (demo)</option></select></div>
        <div class="field"><label for="ni-published">${esc(t("publishedAt"))}</label><input id="ni-published" name="published_at" type="datetime-local" value="2026-11-14T09:00" required></div>
      </div>
      <div class="field"><label for="ni-classification">${esc(t("classification"))}</label>
        <select id="ni-classification" name="classification"><option value="internal">internal</option><option value="public">public</option><option value="confidential">confidential</option></select></div>
    </form>`,
    `<button class="btn" type="button" data-action="close-overlays">${esc(t("close"))}</button>
     <button class="btn btn-copper" type="submit" form="news-intake-form">${esc(t("submit"))}</button>`,
  );
}

function openNewsUpload() {
  openModal(
    t("upload"),
    t("uploadTitle"),
    `<form data-form="news-upload" id="news-upload-form">
      <div class="field"><label for="nu-file">${esc(t("file"))}</label><input id="nu-file" name="file" type="file" accept=".csv,.xlsx,.pdf,.doc,.docx" required></div>
      <div class="field"><label for="nu-title">${esc(t("titleOptional"))}</label><input id="nu-title" name="title"></div>
      <div class="form-row">
        <div class="field"><label for="nu-source">${esc(t("source"))}</label>
          <select id="nu-source" name="source_id"><option value="SRC-REUTERS">Reuters (demo)</option><option value="SRC-PLATTS">Platts (demo)</option><option value="SRC-EIA">EIA (demo)</option></select></div>
        <div class="field"><label for="nu-published">${esc(t("publishedAt"))}</label><input id="nu-published" name="published_at" type="datetime-local" value="2026-11-14T09:00" required></div>
      </div>
      <div class="field"><label for="nu-classification">${esc(t("classification"))}</label>
        <select id="nu-classification" name="classification"><option value="internal">internal</option><option value="public">public</option><option value="confidential">confidential</option></select></div>
      <p class="small muted">${esc(t("uploadHint"))}</p>
    </form>`,
    `<button class="btn" type="button" data-action="close-overlays">${esc(t("close"))}</button>
     <button class="btn btn-copper" type="submit" form="news-upload-form">${esc(t("upload"))}</button>`,
  );
}

async function openMetric(id) {
  const card = ((state.data && state.data.cards) || []).find((entry) => entry.instrument.id === id);
  if (!card) return;
  const instrument = card.instrument;
  const decimals = instrument.decimals == null ? 2 : instrument.decimals;
  const previous = card.value == null || card.change == null ? null : card.value - card.change;
  try {
    const [series, observations] = await Promise.all([
      api(`/api/instruments/${encodeURIComponent(id)}/series?range=1M`),
      // One extra row supplies the prior value for the oldest visible observation.
      api(`/api/observations?instrument=${encodeURIComponent(id)}&limit=7`),
    ]);
    const rows = (observations.observations || []).map((row, index, all) => {
      const prior = all[index + 1];
      return { ...row, delta: prior ? row.value - prior.value : null };
    }).slice(0, 6);
    openDrawer(
      `${t("marketData")} · ${instrument.group}`,
      instrument.name,
      `<div class="flex justify-between wrap gap-8">
        <div>
          <div class="metric-value">${fmtNum(card.value, decimals)}<span class="unit">${esc(instrument.unit)}</span></div>
          <div class="metric-change"><span class="${directionClass(card.change)}">${fmtSigned(card.change, decimals)}</span><span class="${directionClass(card.change_pct)}">${fmtPct(card.change_pct)}</span><span class="muted">${esc(t("sessionChange"))}</span></div>
        </div>
        <div class="tag-row">${statusChip(card.data_status)}${classificationTag(card.classification)}</div>
      </div>
      <dl class="kv mt-12">
        <dt>${esc(t("source"))}</dt><dd>${esc(sourceName(card.source))}</dd>
        <dt>${esc(t("marketTime"))}</dt><dd class="mono">${fmtTime(card.market_time)}</dd>
        <dt>${esc(t("ingested"))}</dt><dd class="mono">${fmtTime(card.ingested_at)}</dd>
        <dt>${esc(t("quality"))}</dt><dd>${esc(qualityLabel(card.quality_status))}</dd>
        <dt>${esc(t("previous"))}</dt><dd class="mono">${previous == null ? "-" : fmtNum(previous, decimals)}</dd>
      </dl>
      ${chartBlock(`metric-${id}`, series.series, series.events || [], { height: 220, instrumentId: id, ariaLabel: instrument.name, unit: instrument.unit })}
      <div class="section-label mt-12">${esc(t("observations"))}</div>
      <div class="table-wrap"><table class="data">
        <thead><tr><th>${esc(t("marketTime"))}</th><th class="num">${esc(t("value"))}</th><th class="num">${esc(t("deltaPrior"))}</th><th>${esc(t("source"))}</th><th>${esc(t("status"))}</th></tr></thead>
        <tbody>${rows
          .map(
            (row) => `<tr><td class="mono">${fmtTime(row.market_time)}</td><td class="num">${fmtNum(row.value, decimals)}</td><td class="num ${directionClass(row.delta)}">${row.delta == null ? "-" : fmtSigned(row.delta, decimals)}</td><td>${esc(sourceName(row.source))}</td><td>${statusChip(row.data_status)}</td></tr>`,
          )
          .join("") || `<tr><td colspan="5" class="table-empty">${esc(t("empty"))}</td></tr>`}</tbody>
      </table></div>`,
      `<a class="btn" href="#market-data" data-action="open-instrument" data-id="${esc(id)}">${esc(t("openMarketData"))}</a>
       <button class="btn" type="button" data-action="close-overlays">${esc(t("close"))}</button>`,
    );
    bindCharts($("#drawer"));
  } catch (error) {
    handleApiError(error);
  }
}

async function openForecastVersions(id) {
  try {
    const data = await api(`/api/forecasts/${encodeURIComponent(id)}/versions`);
    openDrawer(
      id,
      t("history"),
      `<div class="table-wrap"><table class="data">
        <thead><tr><th>${esc(t("version"))}</th><th class="num">${esc(t("value"))}</th><th class="num">${esc(t("forecastActual"))}</th><th class="num">${esc(t("absoluteError"))}</th><th>${esc(t("methodNotes"))}</th></tr></thead>
        <tbody>${(data.versions || [])
          .map(
            (row) => `<tr><td class="mono">v${row.version}</td><td class="num">${fmtNum(row.value, 2)}</td>
              <td class="num">${row.actual == null ? `<span class="muted">${esc(t("missingActual"))}</span>` : fmtNum(row.actual, 2)}</td>
              <td class="num">${row.absolute_error == null ? "-" : fmtNum(row.absolute_error, 2)}</td>
              <td>${esc(row.methodology)}</td></tr>`,
          )
          .join("")}</tbody>
      </table></div>
      <div class="inline-note mt-12"><span class="note-mark">i</span><span>${esc(t("forecastHint"))}</span></div>`,
      `<button class="btn" type="button" data-action="close-overlays">${esc(t("close"))}</button>`,
    );
  } catch (error) {
    toast(error.message, "error");
  }
}

function reportPreviewBody(report) {
  const versions = report.versions || [];
  const latest = versions[0];
  if (!latest) return emptyState(t("empty"), "");
  const content = latest.content || {};
  const sources = latest.sources || [];
  return `<div class="report-preview">
      <div class="flex justify-between wrap gap-8"><div><div class="page-kicker">BSR Market Intelligence</div><div class="rp-title">${esc(report.title)}</div><div class="rp-meta">${esc(report.type)} · ${esc(report.range_start)} → ${esc(report.range_end)} · v${latest.version} · ${esc(t("dataCutoff"))} ${fmtTime(latest.data_cutoff)}</div></div><span class="chip">${esc(report.classification)}</span></div>
      <h3>${esc(t("reportContent"))}</h3><p>${esc(content.summary || "")}</p>
      ${(content.sections || [])
        .map(
          (section) => `<h3>${esc(section.heading || t("documentSection"))}</h3><p>${esc(section.body || "")}</p><ul class="evidence">${(section.items || [])
            .map((item) => `<li>${esc(item.title || `${item.instrument_id || ""}: ${item.value == null ? "" : item.value} ${item.unit || ""}`.trim())}</li>`)
            .join("")}</ul>`,
        )
        .join("")}
      <h3>${esc(t("sourcesLedger"))}</h3><div class="rp-ledger">${sources
        .map((source) => `<div class="rp-ledger-row"><span><strong>${esc(source.label || source.id)}</strong> · ${esc(source.id)}</span><span>${esc(source.kind || "")}</span></div>`)
        .join("") || `<div class="rp-ledger-row"><span>${esc(t("empty"))}</span></div>`}</div>
      <h3>${esc(t("history"))}</h3><div class="version-list">${versions
        .map(
          (version) => `<div class="version-row"><span>v${version.version} · ${fmtTime(version.created_at)}</span><span class="chip ${version.version === latest.version ? "teal" : ""}">${version.version === latest.version ? t("current") : ""}</span></div>`,
        )
        .join("")}</div>
    </div>`;
}

async function openReportPreview(id) {
  try {
    const report = await api(`/api/reports/${encodeURIComponent(id)}`);
    const latest = (report.versions || [])[0];
    openDrawer(
      `${report.type} · ${report.id}`,
      report.title,
      reportPreviewBody(report),
      `<button class="btn" type="button" data-action="close-overlays">${esc(t("close"))}</button>
       <button class="btn" type="button" data-action="report-adjust" data-id="${esc(report.id)}">${esc(t("adjust"))}</button>
       <button class="btn" type="button" data-action="report-regenerate" data-id="${esc(report.id)}" title="${esc(t("regenerateHint"))}">${esc(t("regenerate"))}</button>
       <button class="btn btn-copper" type="button" data-action="report-export" data-id="${esc(report.id)}" ${state.user.can_export ? "" : `disabled title="${esc(t("exportRequires"))}"`}>${icon("download")} ${esc(t("exportPdf"))}</button>`,
    );
    if (latest && latest.content) document.title = `${report.title} · BSR Market Intelligence`;
  } catch (error) {
    toast(error.message, "error");
  }
}

async function exportReport(id) {
  try {
    const blob = await apiBlob(`/api/reports/${encodeURIComponent(id)}/export.pdf`);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${id}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast(t("saved"));
  } catch (error) {
    toast(error.message, "error");
  }
}

async function regenerateReport(id) {
  if (state.reportBusy) return;
  state.reportBusy = true;
  try {
    const report = await api(`/api/reports/${encodeURIComponent(id)}`);
    const created = await api("/api/reports", {
      method: "POST",
      body: {
        type: report.type,
        range_start: `${report.range_start}T00:00:00+07:00`,
        range_end: `${report.range_end}T23:59:00+07:00`,
      },
    });
    toast(t("saved"));
    await loadRoute();
    await openReportPreview(created.id);
  } catch (error) {
    handleApiError(error);
  } finally {
    state.reportBusy = false;
  }
}

async function adjustReport(id) {
  try {
    const report = await api(`/api/reports/${encodeURIComponent(id)}`);
    state.reportType = report.type;
    state.reportStart = report.range_start;
    state.reportEnd = report.range_end;
    closeOverlays();
    render();
    const select = $("#report-type");
    if (select) {
      select.focus();
      select.scrollIntoView({ block: "center" });
    }
  } catch (error) {
    toast(error.message, "error");
  }
}

async function openSearch() {
  openModal(
    t("search"),
    t("searchHint"),
    `<form data-form="search" id="search-form">
      <div class="field"><label for="search-input">${esc(t("search"))}</label><input id="search-input" name="q" type="search" required></div>
    </form>
    <div id="search-results"></div>`,
    `<button class="btn" type="button" data-action="close-overlays">${esc(t("close"))}</button>
     <button class="btn btn-copper" type="submit" form="search-form">${esc(t("search"))}</button>`,
  );
}

async function runSearch(form) {
  const query = new FormData(form).get("q");
  const results = $("#search-results");
  if (!results) return;
  try {
    const data = await api(`/api/search?q=${encodeURIComponent(query)}`);
    results.innerHTML = `
      <h3>${esc(t("instruments"))}</h3><ul class="evidence">${(data.instruments || []).map((item) => `<li><button class="link-btn" type="button" data-action="open-instrument" data-id="${esc(item.id)}">${esc(item.name)}</button></li>`).join("") || `<li class="small muted">${esc(t("empty"))}</li>`}</ul>
      <h3>${esc(t("news"))}</h3><ul class="evidence">${(data.news || []).map((item) => `<li><button class="link-btn" type="button" data-action="news-detail" data-id="${esc(item.id)}">${esc(item.title)}</button></li>`).join("") || `<li class="small muted">${esc(t("empty"))}</li>`}</ul>
      <h3>${esc(t("reportsResults"))}</h3><ul class="evidence">${(data.reports || []).map((item) => `<li><button class="link-btn" type="button" data-action="report-preview" data-id="${esc(item.id)}">${esc(item.title)}</button></li>`).join("") || `<li class="small muted">${esc(t("empty"))}</li>`}</ul>`;
  } catch (error) {
    results.innerHTML = `<div class="error-box">${esc(error.message)}</div>`;
  }
}

async function openNotifications() {
  try {
    const data = await api("/api/notifications");
    openDrawer(
      t("notifications"),
      t("notifications"),
      `<div class="version-list">${(data.notifications || [])
        .map(
          (item) => `<div class="version-row"><div><strong>${esc(item.title)}</strong><div class="small muted">${esc(item.body)}</div><div class="small muted mono">${fmtTime(item.created_at)}</div></div><div class="text-right">${item.read_at ? `<span class="chip">${esc(t("read"))}</span>` : `<button class="btn btn-sm" type="button" data-action="mark-notification" data-id="${esc(item.id)}">${esc(t("markRead"))}</button>`}</div></div>`,
        )
        .join("") || `<div class="small muted">${esc(t("notificationEmpty"))}</div>`}</div>`,
      `<button class="btn" type="button" data-action="close-overlays">${esc(t("close"))}</button>`,
    );
  } catch (error) {
    toast(error.message, "error");
  }
}

async function markNotification(id) {
  try {
    await api(`/api/notifications/${id}/read`, { method: "POST" });
    closeOverlays();
    await openNotifications();
  } catch (error) {
    toast(error.message, "error");
  }
}

async function togglePermission(userId, field) {
  const user = ((state.data && state.data.users) || []).find((entry) => entry.id === userId);
  if (!user) return;
  try {
    await api(`/api/admin/users/${encodeURIComponent(userId)}`, { method: "PATCH", body: { [field]: !user[field] } });
    toast(t("saved"));
    await loadRoute();
  } catch (error) {
    toast(error.message, "error");
  }
}

function openAccount() {
  const user = state.user;
  if (!user) return;
  openModal(
    t("account"),
    user.name,
    `<dl class="kv"><dt>${esc(t("accountRole"))}</dt><dd>${esc(roleLabel(user.role))}</dd>
      <dt>${esc(t("accountDepartment"))}</dt><dd>${esc(user.department)}</dd>
      <dt>${esc(t("maxClassification"))}</dt><dd>${classificationTag(user.max_classification)}</dd>
      <dt>${esc(t("viewRestricted"))}</dt><dd>${esc(user.can_view_restricted ? t("yes") : t("no"))}</dd>
      <dt>${esc(t("export"))}</dt><dd>${esc(user.can_export ? t("yes") : t("no"))}</dd>
      <dt>${esc(t("adminRights"))}</dt><dd>${esc(user.is_admin ? t("yes") : t("no"))}</dd></dl>
      <p class="small muted" style="margin-top:12px">${esc(t("synthetic"))}</p>`,
    `<button class="btn" type="button" data-action="close-overlays">${esc(t("close"))}</button>
     <button class="btn btn-copper" type="button" data-action="sign-out">${icon("arrowRight")} ${esc(t("signOut"))}</button>`,
  );
}

async function openBriefing() {
  try {
    const data = await api("/api/briefings");
    openDrawer(
      t("briefing"),
      t("briefingVersions"),
      `<div class="version-list">${(data.briefings || [])
        .map(
          (entry) => `<div class="version-row"><div><strong>v${entry.version} · ${esc(entry.headline)}</strong><div class="small muted">${fmtTime(entry.generated_at)} · ${esc(t("dataCutoff"))} ${fmtTime(entry.data_cutoff)}</div><div class="tag-row" style="margin-top:4px">${(entry.drivers || []).map((driver) => `<span class="chip">${esc(driver)}</span>`).join("")}</div></div><div class="text-right"><span class="chip">${esc(entry.classification)}</span></div></div>`,
        )
        .join("") || `<div class="small muted">${esc(t("noVersions"))}</div>`}</div>`,
      `<button class="btn" type="button" data-action="close-overlays">${esc(t("close"))}</button>`,
    );
  } catch (error) {
    toast(error.message, "error");
  }
}

function openEventDetail(id) {
  const events = (state.data && state.data.events) || [];
  const event = events.find((item) => item.id === id);
  if (!event) return;
  openDrawer(
    `${fmtDate(event.occurred_at)} · ${event.type || ""}`,
    event.title,
    `<dl class="kv"><dt>${esc(t("eventType"))}</dt><dd>${esc(event.type || "-")}</dd>
      <dt>${esc(t("occurred"))}</dt><dd class="mono">${fmtTime(event.occurred_at)}</dd>
      <dt>${esc(t("source"))}</dt><dd>${esc(sourceName(event.source))}</dd>
      <dt>${esc(t("linkedInstruments"))}</dt><dd>${(event.instruments || []).map((entry) => esc(entry)).join(", ") || "-"}</dd>
      <dt>${esc(t("status"))}</dt><dd>${esc(event.status || "-")}</dd>
      <dt>${esc(t("classification"))}</dt><dd>${classificationTag(event.classification)}</dd></dl>`,
    `<button class="btn" type="button" data-action="close-overlays">${esc(t("close"))}</button>`,
  );
}

async function feedback(id, kind, body) {
  try {
    await api(`/api/news/${encodeURIComponent(id)}/feedback`, { method: "POST", body: kind === "comment" ? { kind, body } : { kind } });
    toast(t("saved"));
    closeOverlays();
  } catch (error) {
    toast(error.message, "error");
  }
}

/* ---------- Event wiring ---------- */

document.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "login") {
    await signIn(target.dataset.role);
  } else if (action === "sign-out") {
    await signOut();
  } else if (action === "toggle-sidebar") {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    render();
  } else if (action === "toggle-mobile-nav") {
    state.mobileNav = !state.mobileNav;
    render();
  } else if (action === "set-theme") {
    setTheme(target.dataset.theme);
  } else if (action === "set-lang") {
    setLang(target.dataset.lang);
    render();
    const button = document.querySelector(`[data-action="set-lang"][data-lang="${target.dataset.lang}"]`);
    if (button) button.focus();
  } else if (action === "close-overlays") {
    closeOverlays();
  } else if (action === "retry") {
    await loadRoute();
  } else if (action === "open-metric") {
    await openMetric(target.dataset.id);
  } else if (action === "open-instrument") {
    if (target.tagName === "A") event.preventDefault();
    closeOverlays();
    state.instrument = target.dataset.id;
    state.compare = "";
    if (state.route === "market-data") {
      await loadRoute();
    } else {
      location.hash = "#market-data";
    }
  } else if (action === "select-instrument") {
    state.instrument = target.dataset.id;
    state.compare = "";
    await loadRoute();
  } else if (action === "set-range") {
    state.range = target.dataset.range;
    await loadRoute();
  } else if (action === "quick-input") {
    openQuickInput();
  } else if (action === "quick-query" || action === "open-quick-query") {
    const draft = $("#quick-query-input");
    openQuickQuery(draft ? draft.value : "");
  } else if (action === "open-account") {
    openAccount();
  } else if (action === "news-detail") {
    closeOverlays();
    await openNewsDetail(target.dataset.id);
  } else if (action === "news-intake") {
    openNewsIntake();
  } else if (action === "news-upload") {
    openNewsUpload();
  } else if (action === "feedback-important") {
    await feedback(target.dataset.id, "important");
  } else if (action === "feedback-comment") {
    openModal(
      t("addComment"),
      t("comment"),
      `<form data-form="feedback-comment" id="feedback-comment-form" data-news-id="${esc(target.dataset.id)}"><div class="field"><label for="fc-body">${esc(t("comment"))}</label><textarea id="fc-body" name="body" required></textarea></div></form>`,
      `<button class="btn" type="button" data-action="close-overlays">${esc(t("close"))}</button>
       <button class="btn btn-copper" type="submit" form="feedback-comment-form">${esc(t("submit"))}</button>`,
    );
  } else if (action === "forecast-versions") {
    await openForecastVersions(target.dataset.id);
  } else if (action === "suggestion") {
    closeOverlays();
    if (state.route !== "assistant") location.hash = "#assistant";
    await askAssistant(target.dataset.question);
  } else if (action === "answer-analysis") {
    state.analysisQuestion = target.dataset.question || state.analysisQuestion;
    closeOverlays();
    location.hash = "#analysis";
  } else if (action === "report-preview") {
    closeOverlays();
    await openReportPreview(target.dataset.id);
  } else if (action === "report-export") {
    await exportReport(target.dataset.id);
  } else if (action === "report-regenerate") {
    await regenerateReport(target.dataset.id);
  } else if (action === "report-adjust") {
    await adjustReport(target.dataset.id);
  } else if (action === "admin-tab") {
    state.adminTab = target.dataset.tab;
    render();
  } else if (action === "toggle-permission") {
    await togglePermission(target.dataset.user, target.dataset.field);
  } else if (action === "open-search") {
    await openSearch();
  } else if (action === "open-notifications") {
    await openNotifications();
  } else if (action === "mark-notification") {
    await markNotification(target.dataset.id);
  } else if (action === "open-briefing") {
    await openBriefing();
  } else if (action === "event-detail") {
    openEventDetail(target.dataset.id);
  } else if (action === "toggle-table") {
    const table = document.getElementById(target.dataset.target);
    if (!table) return;
    const hidden = table.classList.toggle("hidden");
    target.setAttribute("aria-expanded", String(!hidden));
    target.textContent = hidden ? t("viewDataTable") : t("hideDataTable");
  }
});

document.addEventListener("change", async (event) => {
  const target = event.target;
  if (target.matches('[data-action="switch-role"]')) {
    await switchRole(target.value);
  } else if (target.matches('[data-action="set-compare"]')) {
    state.compare = target.value;
    await loadRoute();
  } else if (target.matches('[data-filter="topic"]')) {
    state.newsFilters.topic = target.value;
    await loadRoute();
  } else if (target.matches('[data-filter="source"]')) {
    state.newsFilters.source = target.value;
    await loadRoute();
  } else if (target.matches('[data-filter="status"]')) {
    state.newsFilters.status = target.value;
    await loadRoute();
  } else if (target.matches('[data-filter="forecast-instrument"]')) {
    state.forecastFilters.instrument = target.value;
    await loadRoute();
  } else if (target.matches('[data-filter="forecast-horizon"]')) {
    state.forecastFilters.horizon = target.value;
    await loadRoute();
  }
});

let searchTimer = null;
document.addEventListener("input", (event) => {
  const target = event.target;
  if (target.matches('[data-filter="q"]')) {
    state.newsFilters.q = target.value;
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => loadRoute(), 300);
  }
});

document.addEventListener("submit", async (event) => {
  const form = event.target.closest("form[data-form]");
  if (!form) return;
  event.preventDefault();
  const kind = form.dataset.form;
  if (kind === "quick-input") {
    await submitQuickInput(form);
  } else if (kind === "quick-query") {
    const question = new FormData(form).get("question");
    closeOverlays();
    if (state.route !== "assistant") location.hash = "#assistant";
    await askAssistant(question);
  } else if (kind === "assistant") {
    const question = new FormData(form).get("question");
    if (question) await askAssistant(question);
  } else if (kind === "analysis") {
    state.analysisQuestion = new FormData(form).get("question");
    await loadRoute();
  } else if (kind === "news-intake") {
    const data = new FormData(form);
    const published = data.get("published_at");
    try {
      await api("/api/news", {
        method: "POST",
        body: {
          title: data.get("title"),
          body: data.get("body"),
          source_id: data.get("source_id"),
          published_at: published ? `${published}:00+07:00` : undefined,
          classification: data.get("classification"),
        },
      });
      closeOverlays();
      toast(t("saved"));
      await loadRoute();
    } catch (error) {
      toast(error.message, "error");
    }
  } else if (kind === "news-upload") {
    const data = new FormData(form);
    const published = data.get("published_at");
    if (published) data.set("published_at", `${published}:00+07:00`);
    try {
      await api("/api/news/upload", { method: "POST", form: data });
      closeOverlays();
      toast(t("saved"));
      await loadRoute();
    } catch (error) {
      const box = $("#modal-body");
      if (box) {
        const existing = $("#upload-error");
        if (existing) existing.remove();
        const node = document.createElement("div");
        node.id = "upload-error";
        node.className = "error-box";
        node.setAttribute("role", "alert");
        node.textContent = error.message;
        box.prepend(node);
      }
      toast(error.message, "error");
    }
  } else if (kind === "feedback-comment") {
    const body = new FormData(form).get("body");
    await feedback(form.dataset.newsId, "comment", body);
  } else if (kind === "report") {
    if (state.reportBusy) return;
    state.reportBusy = true;
    const submit = form.querySelector('button[type="submit"]');
    if (submit) submit.disabled = true;
    const data = new FormData(form);
    state.reportType = data.get("type");
    state.reportStart = data.get("range_start");
    state.reportEnd = data.get("range_end");
    try {
      const report = await api("/api/reports", {
        method: "POST",
        body: {
          type: data.get("type"),
          range_start: `${data.get("range_start")}T00:00:00+07:00`,
          range_end: `${data.get("range_end")}T23:59:00+07:00`,
        },
      });
      toast(t("saved"));
      await loadRoute();
      await openReportPreview(report.id);
    } catch (error) {
      handleApiError(error);
      if (submit && submit.isConnected) submit.disabled = false;
    } finally {
      state.reportBusy = false;
    }
  } else if (kind === "search") {
    await runSearch(form);
  }
});

document.addEventListener("keydown", (event) => {
  const actionable = event.target.closest('[data-action][role="button"]');
  if (actionable && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    actionable.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    return;
  }
  const drawer = $("#drawer");
  const modal = $("#modal");
  if (event.key === "Escape") {
    if (overlayOpen(drawer) || overlayOpen(modal)) {
      event.preventDefault();
      closeOverlays();
    }
    return;
  }
  if (overlayOpen(drawer)) trapFocus(event, drawer);
  if (overlayOpen(modal)) trapFocus(event, modal);
});

/* ---------- Boot ---------- */

function routeFromHash() {
  const route = location.hash.replace("#", "") || "login";
  return ROUTES.includes(route) ? route : "overview";
}

window.addEventListener("hashchange", () => {
  state.route = routeFromHash();
  state.mobileNav = false;
  closeOverlays();
  loadRoute();
});

onLangChange(() => render());

function wireStaticIcons() {
  ["#drawer", "#modal"].forEach((selector) => {
    const button = $(`${selector} .drawer-head button, ${selector} .modal-head button`);
    if (button) button.innerHTML = icon("close");
  });
  const drawerButton = $("#drawer .drawer-head button");
  const modalButton = $("#modal .modal-head button");
  if (drawerButton) drawerButton.setAttribute("aria-label", t("closeDrawer"));
  if (modalButton) modalButton.setAttribute("aria-label", t("closeDialog"));
}

state.route = routeFromHash();
wireStaticIcons();
loadRoute();
