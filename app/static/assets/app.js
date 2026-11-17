(function () {
  'use strict';
  const D = window.DEMO;
  const I18N = window.I18N;
  const t = (key, vars) => I18N.t(key, vars);
  const RANK = { Public: 0, Internal: 1, Confidential: 2, Restricted: 3 };
  const state = {
    role: 'leadership',
    route: 'login',
    theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
    sidebarCollapsed: false,
    mobileNav: false,
    range: 30,
    compare: false,
    selectedInstrument: 'brent_futures',
    newsTopic: 'All topics',
    newsSource: 'All sources',
    newsQuery: '',
    forecastSource: 'All sources',
    forecastInstrument: 'All instruments',
    inputTab: 'manual',
    chat: [],
    chatThinking: false,
    chatDraft: '',
    attachment: '',
    briefingVersion: 3,
    reportType: 'On-demand Market Analysis',
    reportRange: 'Last 30 days',
    reportScope: 'Market overview, news and analysis',
    reportQuestion: '',
    feedback: {},
    important: {},
    reports: D.reports.slice(),
    executions: D.aiExecutions.slice(),
    audit: D.audit.slice(),
    lastFocus: null,
    lastFocusKey: null
  };
  let chartRegistry = {};
  let chartSeq = 0;
  let lastRoute = '';
  let compactViewport = window.innerWidth <= 760;
  let resizeTimer = 0;
  let pendingChartRefresh = false;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const role = () => I18N.localizeRole(D.roles[state.role]);
  /* Display helper: translated label when the view object carries one. */
  const lb = (obj, key) => I18N.lb(obj, key);
  const clsRank = (c) => RANK[c] ?? 99;
  const canSee = (c) => clsRank(c) <= clsRank(role().maxClassification) && (c !== 'Restricted' || role().viewRestricted);
  const fmtNum = (v, decimals = 2) => Number(v).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const fmtSigned = (v, decimals = 2) => (v > 0 ? '+' : '') + fmtNum(v, decimals);
  const fmtPct = (v) => (v > 0 ? '+' : '') + fmtNum(v, 2) + '%';
  const directionClass = (v) => v > 0 ? 'pos' : v < 0 ? 'neg' : 'muted';
  const shortDate = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'Asia/Ho_Chi_Minh' });
  const longDate = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
  const nowLabel = () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }) + ' · ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }) + ' ICT';

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
    arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    arrowDown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    check: '<path d="M4 12l5 5L20 6"/>',
    sparkle: '<path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z"/>',
    file: '<path d="M6 3h9l4 4v14H6zM15 3v5h4"/>',
    filter: '<path d="M4 5h16M7 12h10M10 19h4"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
    print: '<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2M7 14h10v7H7z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/>',
    alert: '<path d="M12 3l10 18H2zM12 9v5M12 17h.01"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2z"/>'
  };

  /* Chart and sparkline colours are resolved from the active theme tokens so
     a theme switch never leaves a hard-coded light-theme series behind. */
  function palette() {
    const css = getComputedStyle(document.documentElement);
    const value = (token, fallback) => (css.getPropertyValue(token) || '').trim() || fallback;
    return {
      copper: value('--copper', '#b45b2d'),
      teal: value('--teal', '#1d6a63'),
      positive: value('--positive', '#2c7656'),
      negative: value('--negative', '#ac423c'),
      warning: value('--warning', '#9a6a18'),
      restricted: value('--restricted', '#75405f')
    };
  }

  function ico(name, size = 16) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.overview}</svg>`;
  }

  function visibleItems(items, field = 'classification') {
    return items.filter((i) => canSee(i[field]));
  }
  function instrument(id) { const found = D.instruments.find((i) => i.id === id); return found ? I18N.instrument(found) : found; }
  const rawInstrument = (id) => D.instruments.find((i) => i.id === id);
  function visibleInstruments() { return visibleItems(D.instruments).filter((i) => i.classification !== 'Restricted' || role().viewRestricted).map((i) => I18N.instrument(i)); }
  function newsVisible() { return visibleItems(D.news).map((n) => I18N.news(n)); }
  function forecastsVisible() { return visibleItems(D.forecasts).map((f) => I18N.forecast(f)); }
  function reportsVisible() { return visibleItems(state.reports).map((r) => I18N.report(r)); }

  function init() {
    if (!location.hash) history.replaceState(null, '', '#login');
    state.route = location.hash.replace('#', '') || 'login';
    document.documentElement.lang = I18N.getLang();
    I18N.onChange(() => {
      if ($('#drawer') || $('#modal')) closeOverlays();
      const stack = $('#toast-stack');
      if (stack) stack.innerHTML = '';
      render();
      const langButton = document.querySelector('[data-action="set-lang"][data-lang="' + I18N.getLang() + '"]');
      if (langButton) langButton.focus();
    });
    window.addEventListener('hashchange', () => {
      state.route = location.hash.replace('#', '') || 'login';
      state.mobileNav = false;
      render();
    });
    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput);
    document.addEventListener('change', onChange);
    document.addEventListener('keydown', onKeydown);
    window.addEventListener('resize', () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const nextCompact = window.innerWidth <= 760;
        if (nextCompact === compactViewport) return;
        const drawerOpen = $('#drawer') && $('#drawer').classList.contains('open');
        const modalOpen = $('#modal') && $('#modal').classList.contains('open');
        if (drawerOpen || modalOpen) { pendingChartRefresh = true; return; }
        pendingChartRefresh = false;
        render();
      }, 160);
    });
    window.addEventListener('load', () => {
      const nextCompact = window.innerWidth <= 760;
      if (nextCompact !== compactViewport) render();
    });
    render();
    observeI18n();
  }

  /* Dynamic fragments (chart tooltips, filter results, popovers, toasts) are
     translated as they are inserted, so every render path stays covered. */
  function observeI18n() {
    if (!window.MutationObserver) return;
    const observer = new MutationObserver((records) => {
      if (!I18N.isVi()) return;
      records.forEach((record) => {
        if (record.type === 'characterData') {
          const node = record.target;
          const next = I18N.translate(node.nodeValue, 0);
          if (next !== node.nodeValue) node.nodeValue = next;
          return;
        }
        record.addedNodes.forEach((node) => {
          if (node.nodeType === 1) I18N.applyI18n(node);
          else if (node.nodeType === 3 && node.parentNode) {
            const next = I18N.translate(node.nodeValue, 0);
            if (next !== node.nodeValue) node.nodeValue = next;
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function langSwitch() {
    const current = I18N.getLang();
    return `<div class="lang-switch" role="group" aria-label="${esc(t('Language'))}">${I18N.LANGS.map((l) => `<button class="lang-btn ${current === l.code ? 'active' : ''}" data-action="set-lang" data-lang="${l.code}" aria-pressed="${current === l.code}" title="${l.label}">${l.short}</button>`).join('')}</div>`;
  }

  function themeSwitch() {
    const current = state.theme;
    const options = [
      { id: 'light', label: t('Light'), icon: 'sun' },
      { id: 'dark', label: t('Dark'), icon: 'moon' }
    ];
    return `<div class="lang-switch theme-switch" role="group" aria-label="${esc(t('Display mode'))}">${options.map((opt) => `<button class="lang-btn ${current === opt.id ? 'active' : ''}" data-action="set-theme" data-theme="${opt.id}" aria-pressed="${current === opt.id}" title="${esc(opt.label)}">${ico(opt.icon, 12)}<span class="seg-label">${esc(opt.label)}</span></button>`).join('')}</div>`;
  }

  function setTheme(next) {
    if (next !== 'light' && next !== 'dark') return;
    state.theme = next;
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    try { window.localStorage.setItem('bsr.theme', next); } catch (e) { /* storage unavailable */ }
    closeOverlays();
    render();
    const themeButton = document.querySelector('[data-action="set-theme"][data-theme="' + next + '"]');
    if (themeButton) themeButton.focus();
  }

  function render() {
    compactViewport = window.innerWidth <= 760;
    chartRegistry = {};
    chartSeq = 0;
    const route = state.route;
    if (route === 'login') {
      $('#app').innerHTML = loginPage();
      document.title = t('Sign in') + ' · BSR Market Intelligence';
      I18N.applyI18n($('#app'));
      lastRoute = route;
      return;
    }
    const page = renderPage(route);
    $('#app').innerHTML = shell(route, page);
    document.title = t(pageTitle(route)) + ' · BSR Market Intelligence';
    I18N.applyI18n($('#app'));
    bindCharts();
    if (route === 'news') filterNews();
    if (route !== lastRoute) window.scrollTo(0, 0);
    lastRoute = route;
    if (state.pendingOpenNews) {
      const id = state.pendingOpenNews;
      state.pendingOpenNews = null;
      setTimeout(() => openNewsDrawer(id), 0);
    }
  }

  function pageTitle(route) {
    return { overview: 'Overview', 'market-data': 'Market Data', news: 'Market News', forecast: 'Forecast', analysis: 'Analysis', assistant: 'AI Assistant', reports: 'Reports', admin: 'Administration' }[route] || 'Workspace';
  }

  function pendingRoleLabel() {
    const r = D.roles[state.pendingRole] || D.roles[state.role];
    return r ? I18N.localizeRole(r).label : 'demo';
  }

  function signingInPage() {
    const label = esc(pendingRoleLabel());
    const steps = ['Demo identity verified', 'Loading permitted scope', 'Opening overview']
      .map((text, idx) => '<li class="' + (idx === 0 ? 'done' : idx === 1 ? 'active' : '') + '">' + text + '</li>')
      .join('');
    const head = '<section class="login-brand" aria-label="BSR Market Intelligence"><div class="brand-lockup"><div class="brand-mark">BSR</div>'
      + '<div><div class="brand-name">Market Intelligence</div><div class="brand-sub">Reasonary AI \u00b7 Auker intelligence layer</div></div></div></section>';
    const panel = '<section class="login-panel" aria-labelledby="signin-loading-title" aria-busy="true">'
      + '<h2 id="signin-loading-title">Preparing your workspace\u2026</h2>'
      + '<p role="status">Applying the ' + label + ' permission scope. Restricted data and actions are resolved before the workspace renders.</p>'
      + '<ul class="signin-steps">' + steps + '</ul>'
      + '<div class="login-note">If the scope cannot be resolved, the workspace denies the route instead of showing unfiltered data.</div>'
      + '</section>';
    return '<div class="login">' + head + panel + '</div>';
  }

  function loginPage() {
    if (state.signingIn) {
      return signingInPage();
    }
    return `
      <div class="login">
        <section class="login-brand" aria-label="BSR Market Intelligence">
          <div>
            <div class="brand-lockup">
              <div class="brand-mark">BSR</div>
              <div>
                <div class="brand-name">Market Intelligence</div>
                <div class="brand-sub">Reasonary AI · Auker intelligence layer</div>
              </div>
            </div>
            <div class="login-hero">
              <div class="login-kicker">Crude · Products · Cross-market context</div>
              <h1>One desk for the market<br><em>and its evidence.</em></h1>
              <p>Track markets, connect data, verify forecasts, and ask within your access rights.</p>
            </div>
          </div>
          <div class="login-foot">
            <span>Permission-aware by design</span>
            <span>Source-grounded AI</span>
            <span>Deterministic analytics</span>
          </div>
        </section>
        <section class="login-panel" aria-labelledby="signin-title">
          <div class="login-lang">${themeSwitch()}${langSwitch()}</div>
          <h2 id="signin-title">Enter the workspace</h2>
          <p>Choose a demo role. Permissions and visible data change immediately.</p>
          ${Object.entries(D.roles).map(([key, r]) => {
            const lr = I18N.localizeRole(r);
            return `
            <button class="role-card" data-action="login" data-role="${key}">
              <span class="role-icon">${ico(key === 'leadership' ? 'user' : key === 'mi' ? 'layers' : 'overview', 18)}</span>
              <span>
                <strong>${esc(lr.label)}</strong>
                <span>${esc(lr.department)} · ${esc(t(key === 'internal' ? 'approved market information only' : key === 'leadership' ? 'market view, reports, restricted view' : 'data operations, news, forecasts, audit'))}</span>
              </span>
              <span class="role-arrow" aria-hidden="true">→</span>
            </button>`;
          }).join('')}
          <div class="login-note">
            <strong>Demo environment.</strong> All prices, news, forecasts and reports are synthetic and labelled. No live licensed feeds are connected. Restricted data is hidden for the Internal user role at the API boundary in the implemented application.
          </div>
        </section>
      </div>`;
  }

  function navItems() {
    const items = [
      { group: 'Workspace', entries: [
        ['overview', 'Overview', 'overview'], ['market-data', 'Market Data', 'data'], ['news', 'Market News', 'news'],
        ['forecast', 'Forecast', 'forecast'], ['analysis', 'Analysis', 'analysis']
      ]},
      { group: 'Intelligence', entries: [['assistant', 'AI Assistant', 'assistant'], ['reports', 'Reports', 'reports']] }
    ];
    if (role().admin) items.push({ group: 'Governance', entries: [['admin', 'Administration', 'admin']] });
    return items;
  }

  function shell(route, page) {
    const r = role();
    const tapeIds = ['brent_futures', 'wti_futures', 'ron95', 'crack_gasoline', 'usd_vnd'];
    return `
      <a class="skip-link" href="#main-content">Skip to main content</a>
      <div class="app">
        <aside class="sidebar ${state.sidebarCollapsed ? 'collapsed' : ''} ${state.mobileNav ? 'mobile-open' : ''}" id="sidebar" aria-label="Main navigation">
          <div class="sidebar-head">
            <div class="brand-mark">BSR</div>
            <div class="brand-text">
              <div class="brand-name">Market Intelligence</div>
              <div class="brand-sub">Reasonary AI · Auker</div>
            </div>
            <button class="sidebar-toggle" data-action="toggle-sidebar" aria-expanded="${!state.sidebarCollapsed}" aria-label="${state.sidebarCollapsed ? 'Expand' : 'Collapse'} sidebar">${ico(state.sidebarCollapsed ? 'chevron' : 'chevronLeft', 12)}</button>
          </div>
          <nav class="sidebar-nav">
            ${navItems().map((g) => `<div class="nav-group"><div class="nav-label">${g.group}</div>${g.entries.map(([id, label, ic]) => `
              <a href="#${id}" class="nav-item ${route === id ? 'active' : ''}" ${route === id ? 'aria-current="page"' : ''} title="${label}">
                ${ico(ic)}<span>${label}</span>
              </a>`).join('')}</div>`).join('')}
          </nav>
          <div class="sidebar-foot">
            <div class="policy-note">${ico('lock', 11)} Restricted data is filtered at the backend, including AI retrieval.</div>
            <button class="sidebar-user" data-action="open-user-menu">
              <span class="avatar">${esc(r.initials)}</span>
              <span class="user-meta"><strong>${esc(r.name)}</strong><span>${esc(r.label)}</span></span>
            </button>
          </div>
        </aside>
        <div class="main ${state.sidebarCollapsed ? 'sidebar-collapsed' : ''}">
          <header class="topbar">
            <button class="icon-btn mobile-menu" data-action="toggle-mobile-nav" aria-label="Open navigation">${ico('menu', 19)}</button>
            <div class="breadcrumb"><span>Workspace</span>${ico('chevron', 11)}<strong>${pageTitle(route)}</strong></div>
            <div class="topbar-spacer"></div>
            <div class="asof" title="Latest ingestion across permitted sources"><span class="fresh-dot"></span><span>${D.meta.asOf}</span><span class="muted">·</span><span>${D.meta.freshness}</span></div>
            <div class="topbar-actions">
              <button class="icon-btn" data-action="open-search" aria-label="Search workspace">${ico('search')}</button>
              <button class="icon-btn" data-action="open-notifications" aria-label="Notifications" aria-haspopup="dialog">${ico('bell')}</button>
              ${themeSwitch()}
              ${langSwitch()}
              <label class="sr-only" for="role-switch">Demo role</label>
              <select id="role-switch" class="role-select" title="Switch demo role">
                ${Object.entries(D.roles).map(([k, v]) => `<option value="${k}" ${k === state.role ? 'selected' : ''}>${esc(I18N.localizeRole(v).label)}</option>`).join('')}
              </select>
              <button class="topbar-user" data-action="open-user-menu" aria-label="Account menu">
                <span class="avatar">${esc(r.initials)}</span>
                <span><span class="user-name">${esc(r.name)}</span><span class="user-role">${esc(r.label)}</span></span>
              </button>
            </div>
          </header>
          <div class="market-tape" role="group" aria-label="Market tape" data-i18n>
            ${tapeIds.map((id) => { const i = instrument(id); if (!i || !canSee(i.classification)) return ''; return `
              <button class="tape-item" data-action="open-metric" data-instrument="${id}" title="${esc(lb(i, 'short'))} · market ${esc(i.marketTime)} · ingested ${esc(i.ingestionTime)} · ${esc(lb(i, 'dataStatus'))}" data-i18n>
                <span class="t-status ${i.dataStatus === 'Delayed' ? 'delayed' : i.dataStatus === 'Manual' ? 'manual' : ''}" title="${esc(lb(i, 'dataStatus'))}"></span>
                <span class="t-label">${esc(lb(i, 'short'))}</span>
                <span class="t-value">${fmtNum(i.value, i.decimals)} <span class="muted" style="font-size:9px;font-weight:400">${esc(i.unit)}</span></span><span class="t-time">${esc(i.marketTime.replace('14 Nov 2026 · ', ''))}</span>
                <span class="t-change ${directionClass(i.change)}">${fmtSigned(i.change, i.decimals)}</span>
              </button>`; }).join('')}
            ${!role().viewRestricted ? `<span class="tape-item"><span class="tape-restricted">${ico('lock', 11)} Restricted prices hidden</span></span>` : ''}
          </div>
          <main id="main-content" class="page">${page}</main>
        </div>
      </div>
      <div class="backdrop" id="backdrop" data-action="close-overlays"></div>
      <aside class="drawer" id="drawer" aria-hidden="true" aria-modal="true" role="dialog">
        <div class="drawer-head"><div><div class="drawer-kicker" id="drawer-kicker"></div><h2 id="drawer-title"></h2></div><button class="icon-btn" data-action="close-drawer" aria-label="Close panel">${ico('close')}</button></div>
        <div class="drawer-body" id="drawer-body"></div>
        <div class="drawer-foot" id="drawer-foot"></div>
      </aside>
      <div class="modal" id="modal" aria-hidden="true" aria-modal="true" role="dialog">
        <div class="modal-head"><div><div class="drawer-kicker" id="modal-kicker"></div><h2 id="modal-title"></h2></div><button class="icon-btn" data-action="close-modal" aria-label="Close dialog">${ico('close')}</button></div>
        <div class="modal-body" id="modal-body"></div>
        <div class="modal-foot" id="modal-foot"></div>
      </div>
      `;
  }

  function pageHead(kicker, title, sub, actions = '') {
    return `<div class="page-head"><div><div class="page-kicker">${esc(kicker)}</div><h1 class="page-title">${title}</h1><div class="page-sub">${sub}</div></div><div class="page-actions">${actions}</div></div>`;
  }

  function renderPage(route) {
    switch (route) {
      case 'overview': return overviewPage();
      case 'market-data': return marketDataPage();
      case 'news': return newsPage();
      case 'forecast': return forecastPage();
      case 'analysis': return analysisPage();
      case 'assistant': return assistantPage();
      case 'reports': return reportsPage();
      case 'admin': return adminPage();
      default: return `<div class="denied"><div class="denied-mark">?</div><h2>Screen not found</h2><p>The requested route does not exist. Return to the overview to continue.</p><a class="btn" href="#overview">Go to Overview</a></div>`;
    }
  }

  /* ---------- Charts ---------- */
  function chartBlock(key, seriesList, opts = {}) {
    const built = buildLineChart(seriesList, opts);
    chartRegistry[key] = built.meta;
    const table = buildChartTable(seriesList, opts);
    return `<div class="chart-wrap" data-chart-key="${key}">
      ${built.svg}
      <div class="chart-tooltip" role="status"></div>
      <div class="flex items-center justify-between gap-8" style="margin-top:6px;flex-wrap:wrap">
        <div class="chart-legend">${seriesList.map((s) => `<span class="legend-item"><span class="legend-swatch" style="background:${s.color}"></span>${esc(s.label)}</span>`).join('')}${opts.normalize ? '<span class="muted">· indexed to 100</span>' : ''}</div>
        <button class="link-btn" data-action="toggle-table" data-target="chart-table-${key}" aria-expanded="false">View data table</button>
      </div>
      <div class="chart-table hidden" id="chart-table-${key}">${table}</div>
    </div>`;
  }

  function buildLineChart(seriesList, opts = {}) {
    const compact = window.innerWidth <= 760;
    const W = compact ? 420 : 900, H = opts.height || (compact ? 250 : 270);
    const pad = { l: compact ? 46 : 52, r: compact ? 12 : 22, t: 16, b: compact ? 26 : 30 };
    const yTicks = compact ? 3 : 4;
    const first = seriesList[0];
    const n = first.data.length;
    const allValues = seriesList.flatMap((s) => s.data.map((d) => d.value));
    let min = Math.min(...allValues), max = Math.max(...allValues);
    if (max === min) { max += 1; min -= 1; }
    const span = max - min; min -= span * 0.08; max += span * 0.08;
    const x = (i) => pad.l + (n <= 1 ? 0 : (i / (n - 1)) * (W - pad.l - pad.r));
    const y = (v) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b);
    let grid = '', labels = '';
    for (let g = 0; g <= yTicks; g++) {
      const gy = pad.t + (g / yTicks) * (H - pad.t - pad.b);
      const val = max - (g / yTicks) * (max - min);
      grid += `<line class="grid-line" x1="${pad.l}" y1="${gy}" x2="${W - pad.r}" y2="${gy}"/>`;
      labels += `<text x="${pad.l - 8}" y="${gy + 3}" text-anchor="end">${fmtNum(val, opts.yDecimals === undefined ? 2 : opts.yDecimals)}</text>`;
    }
    const xTicks = [0, Math.floor((n - 1) / 2), n - 1];
    xTicks.forEach((i) => {
      labels += `<text x="${x(i)}" y="${H - 8}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">${shortDate(first.data[i].date)}</text>`;
    });
    const seriesSvg = seriesList.map((s, si) => {
      const d = s.data.map((pt, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(pt.value).toFixed(1)}`).join(' ');
      const area = si === 0 && opts.area !== false ? `<path class="series-area" fill="${s.color}" d="${d} L${x(n - 1)},${H - pad.b} L${x(0)},${H - pad.b} Z"/>` : '';
      return `${area}<path class="series-line" stroke="${s.color}" d="${d}"/>`;
    }).join('');
    const eventsInRange = (D.events || []).filter((ev) => {
      const t = new Date(ev.date).getTime();
      return t >= first.data[0].date.getTime() && t <= first.data[n - 1].date.getTime() && (!opts.instrumentId || ev.instruments.includes(opts.instrumentId));
    });
    const markers = eventsInRange.map((ev) => {
      const at = new Date(ev.date).getTime();
      let best = 0, diff = Infinity;
      first.data.forEach((pt, i) => { const d = Math.abs(pt.date.getTime() - at); if (d < diff) { diff = d; best = i; } });
      const mx = x(best), my = y(first.data[best].value);
      const eventView = I18N.event(ev);
      const eventTitle = lb(eventView, 'title');
      return `<g data-event-index="${D.events.indexOf(ev)}" class="event-marker-group" tabindex="0" role="button" aria-label="${esc(t('Event: {title}', { title: eventTitle }))}"><title>${esc(eventTitle)} · ${esc(lb(eventView, 'source'))}</title><polygon points="${mx},${my - 7} ${mx + 6},${my} ${mx},${my + 7} ${mx - 6},${my}" class="event-marker"/></g>`;
    }).join('');
    const hover = `<g class="hover-group" visibility="hidden"><line class="hover-line" y1="${pad.t}" y2="${H - pad.b}"/>${seriesList.map((s) => `<circle class="hover-dot" r="3.5" stroke="${s.color}"/>`).join('')}</g>`;
    const markerNote = eventsInRange.length ? ' ' + t('with {n} event markers', { n: eventsInRange.length }) : '';
    const svgRole = eventsInRange.length ? 'group' : 'img';
    const svg = `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="${svgRole}" aria-label="${esc((opts.ariaLabel || 'Time series chart') + markerNote)}">
      ${grid}${labels}<line class="axis-line" x1="${pad.l}" y1="${H - pad.b}" x2="${W - pad.r}" y2="${H - pad.b}"/>${seriesSvg}${markers}${hover}
    </svg>`;
    return { svg, meta: { series: seriesList, dates: first.data.map((d) => d.date), x, y, W, H, pad, n, events: eventsInRange, opts } };
  }

  function buildChartTable(seriesList, opts) {
    const first = seriesList[0];
    const idxs = [];
    const step = Math.max(1, Math.floor(first.data.length / 8));
    for (let i = 0; i < first.data.length; i += step) idxs.push(i);
    if (idxs[idxs.length - 1] !== first.data.length - 1) idxs.push(first.data.length - 1);
    return `<table><thead><tr><th>Date</th>${seriesList.map((s) => `<th>${esc(s.label)}${opts.unit ? ' (' + esc(opts.unit) + ')' : ''}</th>`).join('')}</tr></thead><tbody>
      ${idxs.map((i) => `<tr><td>${shortDate(first.data[i].date)}</td>${seriesList.map((s) => `<td>${fmtNum(s.data[i].value, opts.yDecimals === undefined ? 2 : opts.yDecimals)}</td>`).join('')}</tr>`).join('')}
    </tbody></table>`;
  }

  function sparkline(data, color = palette().copper, width = 110, height = 30) {
    const values = data.map((d) => d.value);
    const min = Math.min(...values), max = Math.max(...values);
    const span = max - min || 1;
    const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - ((v - min) / span) * (height - 4) - 2}`).join(' ');
    return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>`;
  }

  function bindCharts() {
    $$('.chart-wrap').forEach((wrap) => {
      const meta = chartRegistry[wrap.dataset.chartKey];
      if (!meta) return;
      const svg = $('svg', wrap);
      const tooltip = $('.chart-tooltip', wrap);
      const hover = $('.hover-group', wrap);
      if (!svg || !tooltip || !hover) return;
      const move = (evt) => {
        const rect = svg.getBoundingClientRect();
        const scale = meta.W / rect.width;
        const px = (evt.clientX - rect.left) * scale;
        const ratio = Math.max(0, Math.min(1, (px - meta.pad.l) / (meta.W - meta.pad.l - meta.pad.r)));
        const index = Math.round(ratio * (meta.n - 1));
        const hx = meta.x(index);
        hover.setAttribute('visibility', 'visible');
        const line = $('.hover-line', hover); line.setAttribute('x1', hx); line.setAttribute('x2', hx);
        const circles = $$('circle', hover);
        meta.series.forEach((s, si) => { const c = circles[si]; if (c) { c.setAttribute('cx', hx); c.setAttribute('cy', meta.y(s.data[index].value)); } });
        tooltip.innerHTML = `<div class="tt-date">${longDate(meta.dates[index])}</div>${meta.series.map((s) => `<div class="tt-row"><span>${esc(s.label)}</span><span>${fmtNum(s.data[index].value, 2)}</span></div>`).join('')}`;
        tooltip.classList.add('visible');
        const rectWrap = wrap.getBoundingClientRect();
        const left = Math.min(rectWrap.width - 150, Math.max(0, (evt.clientX - rectWrap.left) + 12));
        tooltip.style.left = left + 'px';
        tooltip.style.top = '8px';
      };
      svg.addEventListener('pointermove', move);
      svg.addEventListener('pointerleave', () => { tooltip.classList.remove('visible'); hover.setAttribute('visibility', 'hidden'); });
      $$('.event-marker-group', svg).forEach((marker) => {
        const open = () => { const ev = D.events[Number(marker.dataset.eventIndex)]; if (ev) openEventDrawer(ev); };
        marker.addEventListener('click', open);
        marker.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
      });
    });
  }

  /* ---------- Overview ---------- */
  function metricIds() {
    const ids = ['brent_futures', 'wti_futures', 'crack_gasoline', 'usd_vnd'];
    ids.push(canSee('Confidential') ? 'bsr_margin' : 'ron95');
    return ids.filter((id) => { const i = instrument(id); return i && canSee(i.classification); });
  }

  function metricCard(i) {
    const color = i.change >= 0 ? palette().positive : palette().negative;
    const previous = i.value - i.change;
    const qualityClass = i.quality === 'Pending' ? 'warn' : i.quality === 'Rejected' ? 'rejected' : '';
    return `<button class="metric-card" data-action="open-metric" data-instrument="${i.id}" aria-label="${esc(t('Open details for {name}', { name: lb(i, 'name') }))}">
      <div class="metric-top"><span class="metric-label">${esc(lb(i, 'short'))}</span><span class="chip ${i.dataStatus === 'Real-time' ? 'teal' : i.dataStatus === 'Manual' ? '' : 'warn'}"><span class="dot"></span>${esc(lb(i, 'dataStatus'))}</span></div>
      <div class="metric-value">${fmtNum(i.value, i.decimals)}<span class="unit">${esc(i.unit)}</span></div>
      <div class="metric-change"><span class="${directionClass(i.change)}">${fmtSigned(i.change, i.decimals)}</span><span class="${directionClass(i.pct)}">${fmtPct(i.pct)}</span><span class="muted" title="Change against the previous session close, not against the prior stored observation">${esc(t('session change'))}</span></div>
      <div class="metric-spark">${sparkline(i.spark, color)}</div>
      <div class="metric-time"><span>${esc(t('Mkt'))} <strong>${esc(i.marketTime)}</strong></span><span>${esc(t('Ingested'))} ${esc(i.ingestionTime)}</span></div>
      <div class="metric-prev"><span>${esc(t('Previous'))} <strong>${fmtNum(previous, i.decimals)}</strong></span><span class="q-state ${qualityClass}" title="${esc(t('Quality'))}: ${esc(lb(i, 'quality'))}">${esc(lb(i, 'quality'))}</span></div>
      <div class="metric-meta"><span class="source">${esc(i.source)}</span>${i.classification === 'Restricted' || i.classification === 'Confidential' ? `<span class="metric-lock">${ico('lock', 9)} ${esc(lb(i, 'classification'))}</span>` : `<span>${esc(lb(i, 'priceType'))}</span>`}</div>
    </button>`;
  }

  function overviewPage() {
    const version = state.briefingVersion;
    return `
      ${pageHead('Market overview', 'The market, with its receipts.', 'A consolidated view of crude, products, cracks and the evidence behind each number. Demo data is synthetic.', `
        <button class="btn" data-action="open-quick-input">${ico('upload')} Quick input</button>
        <button class="btn btn-copper" data-action="generate-briefing">${ico('sparkle')} Generate briefing</button>`)}
      <div class="metric-grid">${metricIds().map((id) => metricCard(instrument(id))).join('')}</div>
      <div class="overview-grid">
        <div class="overview-main">
          <section class="card">
            <div class="card-head">
              <div><h2 class="card-title">Market pulse</h2><div class="card-sub">Brent and WTI futures · ${state.range} sessions · unit USD/bbl</div></div>
              <div class="chart-toolbar">
                <div class="range-tabs" role="group" aria-label="Chart range">
                  ${[7, 30, 90].map((r) => `<button class="range-tab ${state.range === r ? 'active' : ''}" data-action="set-range" data-range="${r}" aria-pressed="${state.range === r}">${r}D</button>`).join('')}
                </div>
              </div>
            </div>
            <div class="card-body">
              ${chartBlock('overview-pulse', [
                { label: 'Brent', color: palette().copper, data: sliceRange(instrument('brent_futures').series, state.range) },
                { label: 'WTI', color: palette().teal, data: sliceRange(instrument('wti_futures').series, state.range) }
              ], { height: 280, instrumentId: 'brent_futures', ariaLabel: t('Brent and WTI futures over the selected range'), unit: 'USD/bbl', area: false })}
              <div class="inline-note mt-12"><span class="note-mark">i</span><span>Event markers show linked market events. Select a marker for its source and affected instruments. Chart values are demo observations, not live prices.</span></div>
            </div>
          </section>

          <section class="card">
            <div class="card-head"><div><h2 class="card-title">Key market drivers</h2><div class="card-sub">Qualitative signals with a directional strength score, not a price forecast</div></div><span class="chip">6 drivers</span></div>
            <div class="card-body"><div class="driver-list">
              ${D.drivers.map((d) => `<div class="driver-row">
                <span class="driver-group">${esc(t(d.group))}</span>
                <div><div class="driver-name">${esc(t(d.label))}</div><div class="driver-detail">${esc(t(d.detail))}</div></div>
                <div><div class="driver-meter ${d.direction}"><span style="width:${d.strength}%"></span></div><div class="small muted text-right" style="margin-top:3px;font-family:var(--mono)">${d.strength}</div></div>
              </div>`).join('')}
            </div></div>
          </section>

          <section class="card">
            <div class="card-head"><div><h2 class="card-title">What matters now</h2><div class="card-sub">Source facts are separated from AI interpretation</div></div><a class="link-btn" href="#news">Open news feed →</a></div>
            <div class="card-body" style="padding-top:4px;padding-bottom:4px"><div class="highlight-list">
              ${D.highlights.map((h) => `<article class="highlight"><h4>${esc(t(h.title))}</h4><div class="highlight-meta"><span class="chip ${h.type === 'AI interpretation' ? 'copper' : ''}">${esc(t(h.type))}</span><span class="meta-pair"><span class="meta-key">${esc(t('Source'))}</span><span class="meta-value">${esc(t(h.source))}</span></span><span class="meta-pair"><span class="meta-key">${esc(t(h.type === 'AI interpretation' ? 'Generated' : 'Published'))}</span><span class="meta-value">${esc(h.published)}</span></span>${h.topics.map((topic) => `<span class="chip">${esc(topic)}</span>`).join('')}</div>${h.basis ? `<p class="small muted" style="margin:5px 0 0">${esc(t('Basis'))}: ${esc(t(h.basis))}</p>` : ''}</article>`).join('')}
            </div></div>
          </section>
        </div>
        <aside class="overview-rail">
          <section class="card briefing">
            <div class="briefing-head">
              <div class="briefing-kicker">${ico('sparkle', 12)} ${esc(t('AI market briefing · v{v}', { v: version }))}</div>
              <h3>${esc(t('Supply risk is supporting crude; product cracks are doing the real work.'))}</h3>
              <p>${esc(t('Brent held above $78 while gasoline and diesel cracks firmed. The move is supported by freight disruption and Asian blending demand, not by a broad crude-supply shock.'))}</p>
              <ul class="briefing-list">
                <li><span class="num">01</span><span>${esc(t('Brent +1.38% to $78.42; WTI +0.71% to $74.18.'))}</span></li>
                <li><span class="num">02</span><span>${esc(t('Gasoline crack +3.5% to $18.35/bbl; diesel crack −1.1%.'))}</span></li>
                <li><span class="num">03</span><span>${esc(t('Red Sea freight and OPEC+ commentary remain the key watch items.'))}</span></li>
              </ul>
              <div class="briefing-block">
                <h4>${esc(t('Change vs previous briefing'))}</h4>
                <ul>
                  <li>${esc(t('The gasoline crack read was upgraded from “watch” to “confirmed by product freight”.'))}</li>
                  <li>${esc(t('The crude-supply shock scenario was retained but its confidence was lowered.'))}</li>
                </ul>
              </div>
              <div class="briefing-block impact">
                <h4>${esc(t('Potential impact on BSR'))}</h4>
                <p>${esc(t('A firmer product crack supports refining margins; sustained Red Sea freight costs would raise delivered crude costs and compress the import window.'))}</p>
              </div>
              <div class="source-ledger">${sourceChips([['ICE (demo)', 'market-data', 'brent_futures'], ['Platts (demo)', 'news', 'N-2410'], ['Reuters (demo)', 'news', 'N-2411']])}</div>
            </div>
            <div class="card-foot"><span>${esc(t('Data cut-off 09:15 ICT · {n} versions kept', { n: version }))}</span><button class="link-btn" data-action="open-briefing">${esc(t('Open briefing →'))}</button></div>
          </section>
          <section class="card quick-query">
            <div class="card-head"><div><h2 class="card-title">${ico('sparkle', 13)} Ask the market desk</h2><div class="card-sub">Answers are scoped to your permissions</div></div></div>
            <div class="card-body">
              <label class="sr-only" for="quick-query-input">Ask a market question</label>
              <textarea id="quick-query-input" placeholder="What is driving the recent move in gasoline cracks?"></textarea>
              <div class="suggestions">
                <button class="suggestion" data-action="suggest" data-q="What is driving the recent move in gasoline cracks?">Gasoline cracks</button>
                <button class="suggestion" data-action="suggest" data-q="Compare Brent and WTI performance over 30 days.">Brent vs WTI</button>
                <button class="suggestion" data-action="suggest" data-q="Which recent news could affect crude supply?">Supply news</button>
              </div>
              <button class="btn mt-8" data-action="send-quick-query" style="width:100%">Continue in AI Assistant ${ico('arrowRight', 13)}</button>
            </div>
          </section>
          <section class="card">
            <div class="card-head"><div><h2 class="card-title">Data quality</h2><div class="card-sub">Permitted observations only</div></div>${ico('layers', 16)}</div>
            <div class="card-body"><div class="quality-list">
              ${qualityRow('Real-time', visibleInstruments().filter((i) => i.dataStatus === 'Real-time').length)}
              ${qualityRow('Delayed', visibleInstruments().filter((i) => i.dataStatus === 'Delayed').length)}
              ${qualityRow('End-of-day', visibleInstruments().filter((i) => i.dataStatus === 'End-of-day').length)}
              ${qualityRow('Manual', visibleInstruments().filter((i) => i.dataStatus === 'Manual').length)}
              ${qualityRow('Pending quality check', visibleInstruments().filter((i) => i.quality === 'Pending').length)}
            </div></div>
            <div class="card-foot"><span>${role().viewRestricted ? 'Restricted instruments visible' : 'Restricted instruments hidden'}</span><a class="link-btn" href="#admin">${role().admin ? 'View audit' : 'Policy'}</a></div>
          </section>
        </aside>
      </div>`;
  }

  function qualityRow(label, count) {
    return `<div class="quality-row"><span class="q-label"><span class="status-dot ${label === 'Delayed' || label === 'Pending quality check' ? 'delayed' : ''}"></span>${label}</span><span class="q-value">${count}</span></div>`;
  }

  function sourceChips(items) {
    return items.map(([label, route, id]) => `<button class="source-chip" data-action="open-source" data-route="${route}" data-id="${id}" title="Open source context">${ico('file', 9)} ${esc(label)}</button>`).join('');
  }

  function sliceRange(series, days) {
    return series.slice(Math.max(0, series.length - days));
  }

  /* ---------- Market Data ---------- */
  function marketDataPage() {
    const selected = instrument(state.selectedInstrument) && canSee(instrument(state.selectedInstrument).classification) ? instrument(state.selectedInstrument) : (visibleInstruments()[0] || instrument('brent_futures'));
    const compareInstrument = state.compare ? visibleInstruments().find((i) => i.id !== selected.id && (i.group === selected.group || selected.group === 'Crude oil')) : null;
    const seriesData = sliceRange(selected.series, state.range);
    const seriesList = [{ label: selected.short, color: palette().copper, data: seriesData }];
    if (compareInstrument) {
      seriesList.push({ label: compareInstrument.short, color: palette().teal, data: sliceRange(compareInstrument.series, state.range) });
    }
    const normalize = compareInstrument && compareInstrument.unit !== selected.unit;
    const chartSeries = normalize ? normalizeSeries(seriesList) : seriesList;
    const observations = sliceRange(selected.series, 12).slice().reverse();
    const groups = [...new Set(visibleInstruments().map((i) => i.group))];
    return `
      ${pageHead('Market data', 'Every series carries its source.', 'Explore historical observations, compare instruments and inspect how each crack spread was calculated.', `
        <button class="btn" data-action="open-quick-input">${ico('plus')} Add observation</button>
        <button class="btn" data-action="export-data" ${role().export ? '' : `disabled title="${esc(t('Export requires export permission'))}"`}>${ico('download')} Export CSV</button>`)}
      <div class="data-layout">
        <aside class="card instrument-rail" aria-label="${esc(t('Instrument selector'))}">
          <div class="card-head"><div><h2 class="card-title">Instruments</h2><div class="card-sub">${visibleInstruments().length} visible</div></div></div>
          <div class="card-body" style="padding:10px 8px">
            ${groups.map((g) => `<div class="instrument-group"><h4>${esc(g)}</h4>${visibleInstruments().filter((i) => i.group === g).map((i) => `
              <button class="instrument-btn ${i.id === selected.id ? 'active' : ''}" data-action="select-instrument" data-instrument="${i.id}">
                <span>${esc(i.short)}${i.classification === 'Restricted' || i.classification === 'Confidential' ? ` <span class="i-lock">${ico('lock', 9)}</span>` : ''}</span><span class="i-value">${fmtNum(i.value, i.decimals)}</span>
              </button>`).join('')}</div>`).join('')}
          </div>
          <div class="card-foot"><span>${role().viewRestricted ? 'Restricted data included' : 'Restricted data hidden'}</span></div>
        </aside>
        <div class="data-main">
          <section class="card">
            <div class="card-body">
              <div class="data-header">
                <div>
                  <div class="page-kicker">${esc(selected.group)} · ${esc(selected.ticker)}</div>
                  <h2 class="data-title">${esc(selected.name)}</h2>
                  <div class="data-price"><span class="big">${fmtNum(selected.value, selected.decimals)}</span><span class="unit">${esc(selected.unit)}</span><span class="chip ${selected.dataStatus === 'Real-time' ? 'teal' : 'warn'}">${esc(selected.dataStatus)}</span><span class="chip">${esc(selected.priceType)}</span>${selected.classification !== 'Internal' ? `<span class="chip ${selected.classification === 'Restricted' ? 'restricted' : ''}">${ico('lock', 9)} ${esc(selected.classification)}</span>` : ''}</div>
                  <div class="data-price small ${directionClass(selected.change)}" style="margin-top:2px">${fmtSigned(selected.change, selected.decimals)} · ${fmtPct(selected.pct)} <span class="muted">over session change</span></div>
                  <div class="data-meta"><span>Source <strong>${esc(selected.source)}</strong></span><span>Market time <strong>${esc(selected.marketTime)}</strong></span><span>Ingested <strong>${esc(selected.ingestionTime)}</strong></span><span>Quality <strong>${esc(selected.quality)}</strong></span></div>
                </div>
                <div class="flex items-center gap-8 wrap">
                  <label class="compare-toggle"><input type="checkbox" id="compare-toggle" ${state.compare ? 'checked' : ''} ${visibleInstruments().length < 2 ? 'disabled' : ''}> Compare series</label>
                  <div class="range-tabs" role="group" aria-label="Chart range">
                    ${[7, 30, 90].map((r) => `<button class="range-tab ${state.range === r ? 'active' : ''}" data-action="set-range" data-range="${r}" aria-pressed="${state.range === r}">${r}D</button>`).join('')}
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section class="card">
            <div class="card-head"><div><h2 class="card-title">${esc(selected.short)} · ${state.range}-session view</h2><div class="card-sub">${normalize ? esc(t('Indexed to 100 to compare different units')) : esc(lb(selected, 'unit') || selected.unit)} · ${esc(t('event markers included'))}</div></div></div>
            <div class="card-body">
              ${chartBlock('market-data', chartSeries, { height: 300, instrumentId: selected.id, ariaLabel: t('{name} time series', { name: selected.name }), unit: normalize ? 'index' : selected.unit, normalize, yDecimals: normalize ? 1 : selected.decimals })}
              ${compareInstrument ? `<div class="inline-note mt-12"><span class="note-mark">≠</span><span>${esc(selected.short)} and ${esc(compareInstrument.short)} are shown ${normalize ? 'indexed to 100 because their units differ' : 'in the same unit'}. Comparison shows co-movement, not a causal relationship.</span></div>` : ''}
            </div>
          </section>
          ${selected.formula ? `<section class="card"><div class="card-head"><div><h2 class="card-title">Calculation provenance</h2><div class="card-sub">Reproducible from stored inputs and formula version</div></div><span class="chip copper">${esc(selected.formula.id)}</span></div><div class="card-body"><div class="formula-box"><div class="formula-id">${esc(selected.formula.id)} · versioned formula</div><p>${esc(selected.formula.rule)}</p><div class="formula-inputs">${selected.formula.inputs.map((x) => `<span class="chip">${esc(x)}</span>`).join('')}<span class="chip teal">No mixed price types</span></div></div><div class="data-meta mt-12"><span>Calculated <strong>${esc(selected.ingestionTime)}</strong></span><span>Source <strong>${esc(selected.source)}</strong></span><span>Quality <strong>${esc(selected.quality)}</strong></span></div></div></section>` : ''}
          <section class="card">
            <div class="card-head"><div><h2 class="card-title">Observations</h2><div class="card-sub">Latest 12 permitted records · Δ is versus the prior stored observation; the header change is session-over-session · historical data is preserved</div></div><span class="chip">${esc(selected.unit)}</span></div>
            <div class="card-body flush"><div class="table-wrap"><table class="data">
              <thead><tr><th>Market date</th><th class="num">Value</th><th class="num" title="Change versus the prior stored observation, not the session change shown above">Δ vs prior obs.</th><th>Source</th><th>Data status</th><th>Quality</th><th>Ingested</th></tr></thead>
              <tbody>${observations.map((o, i) => { const prev = observations[i + 1]; const chg = prev ? o.value - prev.value : 0; return `<tr><td class="mono">${longDate(o.date)}</td><td class="num strong">${fmtNum(o.value, selected.decimals)}</td><td class="num ${directionClass(chg)}">${prev ? fmtSigned(chg, selected.decimals) : '—'}</td><td>${esc(selected.source)}</td><td><span class="chip ${selected.dataStatus === 'Real-time' ? 'teal' : 'warn'}">${esc(selected.dataStatus)}</span></td><td>${esc(selected.quality)}</td><td class="mono small">${esc(selected.ingestionTime)}</td></tr>`; }).join('')}</tbody>
            </table></div></div>
            <div class="card-foot"><span>Market timestamp and ingestion timestamp are stored separately.</span><button class="link-btn" data-action="open-metric" data-instrument="${selected.id}">Open provenance →</button></div>
          </section>
          <section class="card">
            <div class="card-head"><div><h2 class="card-title">Event-linked series</h2><div class="card-sub">Events on or near the selected range</div></div><a class="link-btn" href="#news">All news →</a></div>
            <div class="card-body"><div class="highlight-list">
              ${D.events.filter((e) => e.instruments.includes(selected.id)).map((e) => `<article class="highlight"><h4>${esc(e.title)}</h4><div class="highlight-meta"><span class="chip copper">${esc(e.type)}</span><span>${esc(e.date)}</span><span>${esc(e.source)}</span><button class="link-btn" data-action="open-event" data-event="${D.events.indexOf(e)}">Inspect event →</button></div></article>`).join('') || '<div class="empty-state"><h3>No linked events</h3><p>No permitted event in the current demo data is linked to this instrument.</p></div>'}
            </div></div>
          </section>
        </div>
      </div>`;
  }

  function normalizeSeries(seriesList) {
    return seriesList.map((s) => {
      const base = s.data[0].value || 1;
      return { ...s, data: s.data.map((d) => ({ date: d.date, value: Math.round((d.value / base) * 1000) / 10 })) };
    });
  }

  /* ---------- News ---------- */
  function newsPage() {
    const topics = ['All topics', ...new Set(newsVisible().flatMap((n) => n.topics))];
    const sources = ['All sources', ...new Set(newsVisible().map((n) => n.source))];
    return `
      ${pageHead('Market news & intelligence', 'Read the source, then the interpretation.', 'Filter permitted news, inspect provenance and compare what each source adds. AI summaries never replace the original.', `
        <button class="btn" data-action="open-news-input">${ico('plus')} Add news</button>
        <button class="btn" data-action="mark-all-reviewed">${ico('check')} Mark reviewed</button>`)}
      <div class="news-layout">
        <section class="card">
          <div class="filter-bar">
            <label class="sr-only" for="news-search">Search news</label>
            <input type="search" id="news-search" placeholder="Search title, summary, entity…" value="${esc(state.newsQuery)}">
            <label class="sr-only" for="news-topic">Topic</label>
            <select id="news-topic">${topics.map((topic) => `<option value="${esc(topic)}" ${state.newsTopic === topic ? 'selected' : ''}>${esc(topic)}</option>`).join('')}</select>
            <label class="sr-only" for="news-source">Source</label>
            <select id="news-source">${sources.map((src) => `<option value="${esc(src)}" ${state.newsSource === src ? 'selected' : ''}>${esc(src)}</option>`).join('')}</select>
            <span class="chip" id="news-count">${newsVisible().length} items</span>
          </div>
          <div id="news-list">
            ${newsVisible().map((n) => newsItem(n)).join('')}
            <div id="news-empty" class="empty-state hidden"><h3>No matching items</h3><p>Try a different topic, source or search term. Restricted items are excluded before filtering.</p></div>
          </div>
          <div class="card-foot"><span>${role().viewRestricted ? 'Restricted sources included for this role.' : 'Restricted sources are absent from this feed and its counts.'}</span><a class="link-btn" href="#assistant">Ask about the news →</a></div>
        </section>
        <aside>
          <section class="card">
            <div class="card-head"><div><h2 class="card-title">Coverage comparison</h2><div class="card-sub">What sources share, and what is additive</div></div></div>
            <div class="card-body">
              ${D.coverage.map((c) => `<div class="coverage-card"><h4>${esc(c.topic)}</h4><p><strong>Shared:</strong> ${esc(c.shared)}</p><p><strong>Additive:</strong> ${esc(c.unique)}</p><div class="coverage-sources">${c.sources.map((s) => `<span class="chip">${esc(s)}</span>`).join('')}<span class="chip">${c.articles} article${c.articles === 1 ? '' : 's'}</span></div></div>`).join('')}
              <div class="inline-note mt-12"><span class="note-mark">i</span><span>Article count is not a trust score. This view shows coverage and unique detail, not a conclusion that one source is more reliable.</span></div>
            </div>
          </section>
          <section class="card mt-16">
            <div class="card-head"><div><h2 class="card-title">Processing queue</h2><div class="card-sub">Pipeline status for permitted items</div></div></div>
            <div class="card-body"><div class="quality-list">
              ${qualityRow('Processed', newsVisible().filter((n) => n.status === 'Processed').length)}
              ${qualityRow('Duplicate candidates', newsVisible().filter((n) => n.status === 'Duplicate candidate').length)}
              ${qualityRow('Processing', newsVisible().filter((n) => n.status === 'Processing').length)}
              ${qualityRow('Failed', newsVisible().filter((n) => n.status === 'Failed').length)}
            </div></div>
          </section>
        </aside>
      </div>`;
  }

  function newsItem(n) {
    const fb = state.feedback[n.id] || {};
    const important = state.important[n.id];
    return `<article class="news-item" data-news-id="${n.id}" data-topics="${esc(n.topics.join('|'))}" data-source="${esc(n.source)}">
      <div class="news-top">
        <div style="min-width:0">
          <h3 class="news-title"><button data-action="open-news" data-news="${n.id}">${esc(lb(n, 'title'))}</button></h3>
          <div class="news-meta"><span>${esc(n.source)}</span><span>·</span><span>${esc(n.published)}</span><span>·</span><span>${esc(t('ingested'))} ${esc(n.ingested)}</span>${n.classification !== 'Internal' ? `<span class="chip ${n.classification === 'Restricted' ? 'restricted' : ''}">${ico('lock', 9)} ${esc(lb(n, 'classification'))}</span>` : ''}</div>
        </div>
        <span class="chip ${n.status === 'Duplicate candidate' ? 'warn' : n.status === 'Processed' ? 'teal' : ''}">${esc(lb(n, 'status'))}</span>
      </div>
      <p class="news-summary">${esc(lb(n, 'summary'))}</p>
      <div class="tag-row">${(n.topic_labels || n.topics).map((topic) => `<span class="chip">${esc(topic)}</span>`).join('')}${n.duplicateOf ? `<span class="chip warn">${ico('layers', 9)} ${esc(t('Linked to'))} ${esc(n.duplicateOf)}</span>` : ''}</div>
      <div class="news-foot mt-8">
        <div class="news-meta">${n.coverage}</div>
        <div class="news-actions">
          <button class="icon-btn ${fb.like === true ? 'active' : ''}" data-action="feedback" data-news="${n.id}" data-kind="like" aria-label="Mark useful" title="Useful">${ico('check')}</button>
          <button class="icon-btn ${important ? 'active' : ''}" data-action="important" data-news="${n.id}" aria-label="Mark important" title="Important">${ico('sparkle')}</button>
          <button class="icon-btn" data-action="feedback" data-news="${n.id}" data-kind="duplicate" aria-label="Report duplicate" title="Report duplicate">${ico('layers')}</button>
          <button class="icon-btn" data-action="open-news" data-news="${n.id}" aria-label="Open news detail" title="Open detail">${ico('arrowRight')}</button>
        </div>
      </div>
    </article>`;
  }

  function syncNewsFilter() {
    const topic = $('#news-topic');
    const source = $('#news-source');
    const search = $('#news-search');
    if (topic) state.newsTopic = topic.value;
    if (source) state.newsSource = source.value;
    if (search) state.newsQuery = search.value;
  }

  function filterNews() {
    const q = state.newsQuery.trim().toLowerCase();
    let shown = 0;
    $$('#news-list .news-item').forEach((el) => {
      const n = D.news.find((x) => x.id === el.dataset.newsId);
      const topicOk = state.newsTopic === 'All topics' || n.topics.includes(state.newsTopic);
      const sourceOk = state.newsSource === 'All sources' || n.source === state.newsSource;
      const view = I18N.news(n);
      const hay = [view.title, view.summary, (view.entity_labels || n.entities).join(' '), (view.topic_labels || n.topics).join(' '), n.title, n.summary].join(' ').toLowerCase();
      const qOk = !q || hay.includes(q);
      const ok = topicOk && sourceOk && qOk;
      el.classList.toggle('hidden', !ok);
      if (ok) shown++;
    });
    const empty = $('#news-empty');
    if (empty) empty.classList.toggle('hidden', shown > 0);
    const count = $('#news-count');
    if (count) count.textContent = t('{n} items', { n: shown });
  }

  /* ---------- Forecast ---------- */
  function forecastPage() {
    const allowed = forecastsVisible().filter((f) => (state.forecastSource === 'All sources' || f.source === state.forecastSource) && (state.forecastInstrument === 'All instruments' || f.instrument === state.forecastInstrument));
    const withActual = allowed.filter((f) => f.actual != null);
    const mae = withActual.length ? withActual.reduce((a, f) => a + Math.abs(f.value - f.actual), 0) / withActual.length : null;
    const mape = withActual.length ? withActual.reduce((a, f) => a + Math.abs(f.value - f.actual) / f.actual, 0) / withActual.length * 100 : null;
    const bias = withActual.length ? withActual.reduce((a, f) => a + (f.value - f.actual), 0) / withActual.length : null;
    const errorGroups = (key) => {
      const groups = new Map();
      withActual.forEach((f) => {
        const groupKey = key === 'source' ? f.source : f.horizon;
        const current = groups.get(groupKey) || { label: groupKey, sum: 0, count: 0 };
        current.sum += Math.abs(f.value - f.actual);
        current.count += 1;
        groups.set(groupKey, current);
      });
      return Array.from(groups.values())
        .map((g) => ({ ...g, mae: g.sum / g.count }))
        .sort((a, b) => b.mae - a.mae);
    };
    const bySource = errorGroups('source');
    const byHorizon = errorGroups('horizon');
    const shortInst = (id, fallback) => { const inst = instrument(id); return inst ? lb(inst, 'short') : fallback; };
    const breakdownRows = (groups) => `<div class="breakdown"><div class="breakdown-row header"><span>${esc(t('Group'))}</span><span class="num">${esc(t('MAE'))}</span><span class="num" title="${esc(t('Versions'))}">n</span></div>${groups.map((g) => `<div class="breakdown-row"><span>${esc(t(g.label))}</span><span class="num">${fmtNum(g.mae, 2)}</span><span class="num">${g.count}</span></div>`).join('')}</div>`;
    const sources = ['All sources', ...new Set(forecastsVisible().map((f) => f.source))];
    const instruments = ['All instruments', ...new Set(forecastsVisible().map((f) => f.instrument))];
    const instLabel = (id) => { const f = forecastsVisible().find((x) => x.instrument === id); return f ? lb(f, 'instrumentLabel') : id; };
    return `
      ${pageHead('Forecast intelligence', 'Keep every version. Test it later.', 'Forecasts are stored immutably by source, instrument and horizon. Error metrics are computed deterministically from stored values.', `
        <button class="btn" data-action="open-forecast-input">${ico('plus')} Add forecast</button>
        <button class="btn" data-action="export-forecast" ${role().export ? '' : `disabled title="${esc(t('Export requires export permission'))}"`}>${ico('download')} Export</button>`)}
      <div class="forecast-layout">
        <div class="grid gap-16">
          <section class="card">
            <div class="filter-bar">
              <label class="sr-only" for="forecast-source">Source</label>
              <select id="forecast-source">${sources.map((src) => `<option value="${esc(src)}" ${state.forecastSource === src ? 'selected' : ''}>${esc(src)}</option>`).join('')}</select>
              <label class="sr-only" for="forecast-instrument">Instrument</label>
              <select id="forecast-instrument">${instruments.map((inst) => `<option value="${esc(inst)}" ${state.forecastInstrument === inst ? 'selected' : ''}>${esc(inst === 'All instruments' ? t('All instruments') : instLabel(inst))}</option>`).join('')}</select>
              <span class="chip">${allowed.length} versions</span>
            </div>
            <div class="card-body flush"><div class="table-wrap"><table class="data">
              <thead><tr><th>Source</th><th>Instrument</th><th>Period / horizon</th><th class="num">Forecast</th><th class="num">Actual</th><th class="num">Error</th><th>Version</th><th></th></tr></thead>
              <tbody>${allowed.map((f) => {
                const err = f.actual == null ? null : f.value - f.actual;
                return `<tr><td class="strong">${esc(lb(f, 'source'))}</td><td>${esc(shortInst(f.instrument, lb(f, 'instrumentLabel')))}</td><td>${esc(lb(f, 'period'))} · ${esc(lb(f, 'horizon'))}</td><td class="num">${fmtNum(f.value, 2)}</td><td class="num">${f.actual == null ? '<span class="muted">missing</span>' : fmtNum(f.actual, 2)}</td><td class="num ${err == null ? 'muted' : directionClass(err)}">${err == null ? '—' : fmtSigned(err, 2)}</td><td><span class="chip">v${f.version}</span></td><td class="row-action"><button class="link-btn" data-action="open-forecast" data-forecast="${f.id}">Versions →</button></td></tr>`;
              }).join('') || '<tr><td colspan="8" class="table-empty">No forecasts match the selected filters.</td></tr>'}</tbody>
            </table></div></div>
            <div class="card-foot"><span>Versioned records are never overwritten. Missing actuals are not treated as zero.</span><span>${withActual.length} evaluated</span></div>
          </section>
          <section class="card">
            <div class="card-head"><div><h2 class="card-title">Forecast vs actual</h2><div class="card-sub">Permitted forecasts with a recorded actual</div></div></div>
            <div class="card-body">
              ${withActual.length ? forecastBars(withActual) : '<div class="chart-empty">No evaluated forecasts in the current selection. Actual values must be recorded before error metrics can be computed.</div>'}
            </div>
          </section>
          <section class="card">
            <div class="card-head"><div><h2 class="card-title">${esc(t('Accuracy by source and horizon'))}</h2><div class="card-sub">${esc(t('Deterministic mean absolute error · evaluated versions only'))}</div></div></div>
            <div class="card-body">
              ${withActual.length ? `<div class="split-2"><div><div class="section-label">${esc(t('Error by source'))}</div>${breakdownRows(bySource)}</div><div><div class="section-label">${esc(t('Error by horizon'))}</div>${breakdownRows(byHorizon)}</div></div><div class="breakdown-note">${esc(t('A single error pair does not rank a source. Compare by instrument, horizon and sample size; missing actuals are excluded rather than treated as zero.'))}</div><div class="breakdown-note">${esc(t('A quality trend needs at least three evaluation periods. This demo contains one period, so no trend line is shown.'))}</div>` : '<div class="chart-empty">No evaluated forecasts match the current filters.</div>'}
            </div>
          </section>
        </div>
        <aside class="grid gap-16">
          <section class="card">
            <div class="card-head"><div><h2 class="card-title">Deterministic accuracy</h2><div class="card-sub">Across ${withActual.length} evaluated versions</div></div></div>
            <div class="card-body"><div class="accuracy-grid">
              <div class="accuracy-cell"><div class="a-label">MAE</div><div class="a-value">${mae == null ? '—' : fmtNum(mae, 2)}</div><div class="a-note">mean absolute error</div></div>
              <div class="accuracy-cell"><div class="a-label">MAPE</div><div class="a-value">${mape == null ? '—' : fmtNum(mape, 1) + '%'}</div><div class="a-note">when actual ≠ 0</div></div>
              <div class="accuracy-cell"><div class="a-label">Bias</div><div class="a-value ${bias == null ? '' : directionClass(bias)}">${bias == null ? '—' : fmtSigned(bias, 2)}</div><div class="a-note">forecast − actual</div></div>
            </div>
            <div class="inline-note mt-12"><span class="note-mark">ƒ</span><span>Metrics are calculated by the analytical service from stored forecast versions and actual observations. The LLM does not compute them.</span></div></div>
          </section>
          <section class="card">
            <div class="card-head"><div><h2 class="card-title">Latest version activity</h2><div class="card-sub">Immutable revisions</div></div></div>
            <div class="card-body"><div class="version-list">
              ${forecastsVisible().slice(0, 5).map((f) => `<div class="version-row"><div class="v-main"><span class="chip">v${f.version}</span><span>${esc(lb(f, 'source'))} · ${esc(shortInst(f.instrument, lb(f, 'instrumentLabel')))}</span></div><div class="text-right"><div class="v-value">${fmtNum(f.value, 2)}</div><div class="small muted">${esc(f.published)}</div></div></div>`).join('')}
            </div></div>
          </section>
          <section class="card">
            <div class="card-head"><div><h2 class="card-title">Method notes</h2><div class="card-sub">Store methodology and source document</div></div></div>
            <div class="card-body"><p class="small muted" style="margin:0;line-height:1.6">Each version retains its methodology, publication date, ingestion date and source document. A revised outlook creates a new version; the prior version remains available for comparison.</p></div>
          </section>
        </aside>
      </div>`;
  }

  function forecastBars(items) {
    const compact = window.innerWidth <= 760;
    const W = compact ? 420 : 820, H = compact ? 220 : 250, pad = { l: compact ? 38 : 48, r: compact ? 10 : 16, t: 20, b: compact ? 38 : 44 };
    const max = Math.max(...items.flatMap((f) => [f.value, f.actual])) * 1.12;
    const groupW = (W - pad.l - pad.r) / items.length;
    const barW = Math.min(26, groupW * 0.26);
    let grid = '', labels = '';
    for (let g = 0; g <= 3; g++) {
      const gy = pad.t + (g / 3) * (H - pad.t - pad.b);
      const val = max - (g / 3) * max;
      grid += `<line class="grid-line" x1="${pad.l}" y1="${gy}" x2="${W - pad.r}" y2="${gy}"/>`;
      labels += `<text x="${pad.l - 8}" y="${gy + 3}" text-anchor="end">${fmtNum(val, 0)}</text>`;
    }
    const bars = items.map((f, i) => {
      const cx = pad.l + i * groupW + groupW / 2;
      const hForecast = (f.value / max) * (H - pad.t - pad.b);
      const hActual = (f.actual / max) * (H - pad.t - pad.b);
      return `<rect x="${cx - barW - 3}" y="${H - pad.b - hForecast}" width="${barW}" height="${hForecast}" fill="${palette().copper}"/><rect x="${cx + 3}" y="${H - pad.b - hActual}" width="${barW}" height="${hActual}" fill="${palette().teal}"/><text x="${cx}" y="${H - pad.b + 14}" text-anchor="middle">${esc(f.source.split(' ')[0])} · ${esc(f.instrumentLabel.split(' ')[0])}</text>`;
    }).join('');
    return `<div class="chart-legend" style="margin-bottom:8px"><span class="legend-item"><span class="legend-swatch" style="background:${palette().copper};height:6px"></span>${esc(t('Forecast'))}</span><span class="legend-item"><span class="legend-swatch" style="background:${palette().teal};height:6px"></span>${esc(t('Actual'))}</span></div><svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('Forecast versus actual values'))}">${grid}${labels}${bars}</svg><div class="chart-table"><table><thead><tr><th>Source / instrument</th><th>Forecast</th><th>Actual</th><th>Error</th></tr></thead><tbody>${items.map((f) => `<tr><td>${esc(f.source)} · ${esc(f.instrumentLabel)}</td><td>${fmtNum(f.value, 2)}</td><td>${fmtNum(f.actual, 2)}</td><td>${fmtSigned(f.value - f.actual, 2)}</td></tr>`).join('')}</tbody></table></div>`;
  }

  /* ---------- Analysis ---------- */
  function analysisPage() {
    const a = D.analysis;
    return `
      ${pageHead('Market analysis', 'Facts, calculations, then judgement.', 'A versioned analysis workspace. The recommendation is decision support, not an executed business decision.', `
        <button class="btn" data-action="create-analysis-report">${ico('file')} Create report</button>
        <button class="btn" data-action="open-analysis-versions">${ico('layers')} Version history</button>`)}
      <section class="card" style="margin-bottom:16px">
        <div class="card-head"><div><h2 class="card-title">${esc(t('Evidence stack'))}</h2><div class="card-sub">${esc(t('Four levels stay separate: observation, correlation, hypothesis and conclusion'))}</div></div><span class="chip teal">${ico('check', 10)} ${esc(t('Source-grounded'))}</span></div>
        <div class="card-body flush"><div class="evidence-stack">
          <div class="evidence-step"><div class="e-level">01 · ${esc(t('Observed data'))}</div><h4>${esc(t('Stored market observations'))}</h4><p>${esc(t('Brent, WTI and crack values with source, market time and ingestion time attached.'))}</p></div>
          <div class="evidence-step"><div class="e-level">02 · ${esc(t('Statistical correlation'))}</div><h4>${esc(t('Co-movement only'))}</h4><p>${esc(t('The 20-session matrix shows association, not a causal relationship.'))}</p></div>
          <div class="evidence-step"><div class="e-level">03 · ${esc(t('Explanatory hypothesis'))}</div><h4>${esc(t('Freight and blending demand'))}</h4><p>${esc(t('Product-specific freight and Asian blending demand explain the crack move better than a crude-supply shock.'))}</p></div>
          <div class="evidence-step"><div class="e-level">04 · ${esc(t('Evidence-supported conclusion'))}</div><h4>${esc(t('Watch product cracks'))}</h4><p>${esc(t('The evidence supports a watch stance with medium confidence, not a trading instruction.'))}</p></div>
        </div></div>
      </section>
      <div class="analysis-layout">
        <div class="grid gap-16">
          <section class="card">
            <div class="card-head"><div><div class="page-kicker">Active analysis · v1</div><h2 class="analysis-question">${esc(t(a.question))}</h2><div class="card-sub">${esc(t('As of'))} ${esc(a.asOf)} · ${esc(t('Evidence separated from interpretation'))}</div></div><span class="chip teal">${ico('check', 10)} ${esc(t('Source-grounded'))}</span></div>
            <div class="card-body"><div class="section-label">Observed facts</div><ul class="evidence-list">${a.facts.map((fact, i) => `<li><span class="e-num">F${String(i + 1).padStart(2, '0')}</span><span>${esc(t(fact))}</span></li>`).join('')}</ul></div>
            <div class="card-foot"><span>Sources: ICE (demo), CME (demo), Platts (demo), Reuters (demo)</span><button class="link-btn" data-action="open-analysis-sources">Open source ledger →</button></div>
          </section>
          <section class="card">
            <div class="card-head"><div><h2 class="card-title">${esc(t('Market impact frame'))}</h2><div class="card-sub">${esc(t('Seven questions keep the event read auditable'))}</div></div><span class="chip">${esc(t('Event-linked'))}</span></div>
            <div class="card-body flush"><div class="impact-grid">
              <div class="impact-item"><div class="i-key">01 · ${esc(t('What happened'))}</div><p>${esc(t('Red Sea diversions added about a week to Gulf–Asia product voyages; freight and insurance assessments rose for a second week.'))}</p></div>
              <div class="impact-item"><div class="i-key">02 · ${esc(t('Affected markets'))}</div><p>${esc(t('Brent and WTI futures, gasoline and diesel cracks, and product freight.'))}</p></div>
              <div class="impact-item"><div class="i-key">03 · ${esc(t('Transmission mechanism'))}</div><p>${esc(t('Higher freight and insurance raise delivered costs and widen regional product arbitrage windows.'))}</p></div>
              <div class="impact-item"><div class="i-key">04 · ${esc(t('Supporting evidence'))}</div><p>${esc(t('Platts freight assessments, stored Brent observations and the CS-GAS-2.1 crack calculation.'))}</p></div>
              <div class="impact-item"><div class="i-key">05 · ${esc(t('What could change the read'))}</div><p>${esc(t('A durable route normalisation or a sharper Asian demand slowdown would weaken the product-crack signal.'))}</p></div>
              <div class="impact-item"><div class="i-key">06 · ${esc(t('What to watch next'))}</div><p>${esc(t('Gasoline crack versus its 20-day average, Red Sea freight, US inventories and OPEC+ commentary.'))}</p></div>
              <div class="impact-item wide"><div class="i-key">07 · ${esc(t('Uncertainty'))}</div><p>${esc(t('The freight signal is source-confirmed, but its duration and crude-supply impact are not established. Confidence is medium.'))}</p></div>
            </div></div>
          </section>
          <section class="card">
            <div class="card-head"><div><h2 class="card-title">Deterministic calculations</h2><div class="card-sub">Produced by analytical services, reproducible from inputs</div></div><span class="chip">${ico('layers', 10)} 4 calculations</span></div>
            <div class="card-body"><div class="calc-grid">${a.calculations.map((calc) => `<div class="calc-cell"><div class="c-label">${esc(t(calc.label))}</div><div class="c-value">${esc(calc.value)}</div><div class="c-method">${esc(t(calc.method))}</div></div>`).join('')}</div></div>
          </section>
          <section class="card">
            <div class="card-head"><div><h2 class="card-title">Cross-market correlation</h2><div class="card-sub">20-session rolling correlation matrix · correlation is not causation</div></div></div>
            <div class="card-body"><div class="table-wrap"><table class="correlation">
              <thead><tr><th></th><th>Brent</th><th>WTI</th><th>RON95</th><th>Gasoline crack</th><th>USD/VND</th></tr></thead>
              <tbody>
                <tr><th>Brent</th><td class="high">1.00</td><td class="high">0.96</td><td class="high">0.81</td><td class="low">−0.18</td><td class="low">0.09</td></tr>
                <tr><th>WTI</th><td class="high">0.96</td><td class="high">1.00</td><td class="mid">0.74</td><td class="low">−0.11</td><td class="low">0.06</td></tr>
                <tr><th>RON95</th><td class="high">0.81</td><td class="mid">0.74</td><td class="high">1.00</td><td class="mid">0.43</td><td class="low">−0.12</td></tr>
                <tr><th>Gasoline crack</th><td class="low">−0.18</td><td class="low">−0.11</td><td class="mid">0.43</td><td class="high">1.00</td><td class="low">0.04</td></tr>
                <tr><th>USD/VND</th><td class="low">0.09</td><td class="low">0.06</td><td class="low">−0.12</td><td class="low">0.04</td><td class="high">1.00</td></tr>
              </tbody>
            </table></div><div class="inline-note mt-12"><span class="note-mark">!</span><span>Observed co-movement only. A statistical relationship does not establish that one variable caused the other. Hypotheses must be tested against event and supply evidence.</span></div></div>
          </section>
          <section class="card">
            <div class="card-head"><div><h2 class="card-title">Assumptions and limitations</h2><div class="card-sub">What would change this read</div></div></div>
            <div class="card-body"><ul class="evidence-list">${a.assumptions.map((item, i) => `<li><span class="e-num">A${i + 1}</span><span>${esc(t(item))}</span></li>`).join('')}</ul></div>
          </section>
        </div>
        <aside class="grid gap-16">
          <section class="card recommendation">
            <div class="card-head"><div><div class="briefing-kicker">${ico('sparkle', 12)} Recommendation · AI interpretation</div><h2 class="card-title">Decision support</h2></div><span class="chip warn">Medium confidence</span></div>
            <div class="card-body"><h3>${esc(t(a.recommendation.title))}</h3><p>${esc(t(a.recommendation.rationale))}</p><div class="divider"></div><div class="section-label">Watch next</div><ul class="watch-list">${a.recommendation.watch.map((item) => `<li>${esc(t(item))}</li>`).join('')}</ul><div class="inline-note mt-12"><span class="note-mark">i</span><span>This is not a trading instruction or an automatic business decision. Authorized humans remain responsible for action.</span></div></div>
            <div class="card-foot"><span>Version 1 · ${esc(a.asOf)}</span><button class="link-btn" data-action="create-analysis-report">Turn into report →</button></div>
          </section>
          <section class="card">
            <div class="card-head"><div><h2 class="card-title">Evidence ledger</h2><div class="card-sub">Inputs behind the analysis</div></div></div>
            <div class="card-body"><div class="version-list">
              <div class="version-row"><span>Market observations</span><span class="chip">4 series</span></div>
              <div class="version-row"><span>News items</span><span class="chip">2 cited</span></div>
              <div class="version-row"><span>Forecast versions</span><span class="chip">3</span></div>
              <div class="version-row"><span>Formula versions</span><span class="chip">CS-GAS-2.1</span></div>
              <div class="version-row"><span>AI execution</span><span class="chip teal">AI-8F2A</span></div>
            </div></div>
          </section>
          <section class="card">
            <div class="card-head"><div><h2 class="card-title">Uncertainty</h2><div class="card-sub">What is not established</div></div></div>
            <div class="card-body"><p class="small muted" style="margin:0;line-height:1.6">The freight move is confirmed by source reporting, but its duration and crude-supply impact are unknown. Demo data limits quantitative confidence; production analysis must use licensed observations and BSR's official formulas.</p></div>
          </section>
        </aside>
      </div>`;
  }

  /* ---------- Assistant & Live AI Agent ---------- */
  const AI_CONFIG_KEY = 'bsr.ai_agent_config';
  let backendEnvConfig = null;

  async function checkBackendEnv() {
    try {
      const res = await fetch('/api/assistant/config');
      if (res.ok) {
        const data = await res.json();
        backendEnvConfig = data;
        if (state.route === 'assistant') render();
      }
    } catch (e) {
      // Backend not running (e.g. standalone static preview)
    }
  }
  checkBackendEnv();
  setTimeout(checkBackendEnv, 500);

  function getAiConfig() {
    try {
      const raw = localStorage.getItem(AI_CONFIG_KEY);
      if (!raw) return { provider: 'auker', model: 'deepseek-chat', apiKey: '', baseUrl: 'https://api.deepseek.com' };
      const parsed = JSON.parse(raw);
      if (!parsed || (parsed.provider !== 'deepseek' && parsed.provider !== 'auker')) {
        return { provider: 'auker', model: 'deepseek-chat', apiKey: '', baseUrl: 'https://api.deepseek.com' };
      }
      return parsed;
    } catch (e) {
      return { provider: 'auker', model: 'deepseek-chat', apiKey: '', baseUrl: 'https://api.deepseek.com' };
    }
  }

  function saveAiConfig(config) {
    if (!config) {
      localStorage.removeItem(AI_CONFIG_KEY);
    } else {
      localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
    }
  }

  function formatAiMarkdown(text) {
    if (!text) return '';
    let s = text.trim();
    // Escape HTML special characters
    s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Code blocks
    s = s.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    // Inline code
    s = s.replace(/`([^`]+)`/g, '<code class="calc">$1</code>');
    // Bold
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Headers
    s = s.replace(/^### (.*$)/gim, '<h4 style="margin:10px 0 4px;font-size:13px;color:var(--ink-900);">$1</h4>');
    s = s.replace(/^## (.*$)/gim, '<h3 style="margin:12px 0 6px;font-size:14px;color:var(--ink-900);">$1</h3>');

    const lines = s.split('\n');
    let inList = false;
    let listType = 'ul';
    const out = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (/^[-*•]\s+(.*)$/.test(trimmed)) {
        if (!inList || listType !== 'ul') {
          if (inList) out.push(listType === 'ol' ? '</ol>' : '</ul>');
          out.push('<ul>');
          inList = true;
          listType = 'ul';
        }
        out.push('<li>' + trimmed.replace(/^[-*•]\s+/, '') + '</li>');
      } else if (/^\d+\.\s+(.*)$/.test(trimmed)) {
        if (!inList || listType !== 'ol') {
          if (inList) out.push(listType === 'ol' ? '</ol>' : '</ul>');
          out.push('<ol style="margin:6px 0;padding-left:18px;">');
          inList = true;
          listType = 'ol';
        }
        out.push('<li>' + trimmed.replace(/^\d+\.\s+/, '') + '</li>');
      } else {
        if (inList) {
          out.push(listType === 'ol' ? '</ol>' : '</ul>');
          inList = false;
        }
        if (trimmed.length > 0) {
          out.push('<p>' + trimmed + '</p>');
        }
      }
    }
    if (inList) {
      out.push(listType === 'ol' ? '</ol>' : '</ul>');
    }
    return out.join('');
  }

  function extractSourcesFromText(text) {
    const sources = [];
    const add = (label, route, id) => {
      if (!sources.some((s) => s.id === id && s.route === route)) {
        sources.push({ label, route, id });
      }
    };
    const lower = text.toLowerCase();

    if (lower.includes('brent_futures') || lower.includes('brent')) {
      add(t('Brent futures') + ' · ICE (demo)', 'market-data', 'brent_futures');
    }
    if (lower.includes('wti_futures') || lower.includes('wti')) {
      add(t('WTI futures') + ' · CME (demo)', 'market-data', 'wti_futures');
    }
    if (lower.includes('ron95') || lower.includes('xăng')) {
      add('RON95 physical · Platts (demo)', 'market-data', 'ron95');
    }
    if (lower.includes('diesel') || lower.includes('dầu diesel')) {
      add('Diesel 10ppm · Platts (demo)', 'market-data', 'diesel');
    }
    if (lower.includes('crack_gasoline') || lower.includes('crack') || lower.includes('spread')) {
      add('Gasoline crack · BSR Analytical', 'market-data', 'crack_gasoline');
    }
    if (lower.includes('brent_physical') || lower.includes('dated brent') || lower.includes('vật chất')) {
      if (role().viewRestricted) {
        add('Brent Physical Dated · Platts (demo)', 'market-data', 'brent_physical');
      }
    }

    if (lower.includes('n-2411') || lower.includes('opec')) {
      add('OPEC+ signal (N-2411) · Reuters', 'news', 'N-2411');
    }
    if (lower.includes('n-2410') || lower.includes('red sea') || lower.includes('biển đỏ') || lower.includes('freight')) {
      add('Red Sea freight (N-2410) · Platts', 'news', 'N-2410');
    }
    if (lower.includes('n-2408') || lower.includes('dung quất') || lower.includes('bảo dưỡng') || lower.includes('cdu')) {
      add('Dung Quất CDU (N-2408) · BSR Internal', 'news', 'N-2408');
    }
    if (lower.includes('n-2409') || lower.includes('eia') || lower.includes('inventory') || lower.includes('tồn kho')) {
      add('US inventories (N-2409) · EIA', 'news', 'N-2409');
    }
    return sources;
  }

  async function callLiveAiAgent(question, config) {
    const startTime = performance.now();
    const currentRole = role();
    const isRestrictedAllowed = !!currentRole.viewRestricted;

    // Filter instruments according to permissions
    const visibleInstruments = (window.DEMO && window.DEMO.instruments ? window.DEMO.instruments : [])
      .filter((i) => isRestrictedAllowed || i.classification !== 'Restricted')
      .map((i) => ({
        id: i.id,
        name: i.name,
        price: i.value,
        unit: i.unit,
        change: i.change,
        pct: i.pct,
        source: i.source,
        status: i.dataStatus,
        classification: i.classification,
        description: i.description,
        formula: i.formula ? i.formula.rule : null
      }));

    // Filter news according to permissions
    const visibleNews = (window.DEMO && window.DEMO.news ? window.DEMO.news : [])
      .filter((n) => isRestrictedAllowed || n.classification !== 'Restricted')
      .map((n) => ({
        id: n.id,
        title: n.title,
        source: n.source,
        published: n.published,
        summary: n.summary,
        insight: n.insight,
        classification: n.classification
      }));

    const drivers = window.DEMO && window.DEMO.drivers ? window.DEMO.drivers : [];
    const forecasts = (window.DEMO && window.DEMO.forecasts ? window.DEMO.forecasts : [])
      .filter((f) => isRestrictedAllowed || f.classification !== 'Restricted');

    const systemPrompt = `Bạn là Trợ lý AI Phân tích Thị trường (Market Intelligence Agent) chuyên nghiệp cho Công ty Cổ phần Lọc hóa dầu Bình Sơn (BSR - Nhà máy Lọc dầu Dung Quất).
Ngôn ngữ trả lời: Tiếng Việt (hoặc ngôn ngữ câu hỏi của người dùng).

QUY ĐỊNH PHÂN QUYỀN TRUY CẬP (ACCESS CONTROL):
- Vai trò người dùng hiện tại: ${currentRole.label} (${currentRole.name}) - Thuộc phòng: ${currentRole.department}.
- Mức phân loại tối đa: ${currentRole.maxClassification}.
- Quyền xem dữ liệu Mật/Hạn chế (Restricted/Confidential): ${isRestrictedAllowed ? 'ĐƯỢC PHÉP' : 'BỊ TỪ CHỐI'}.
- NẾU người dùng hỏi về dữ liệu Hạn chế/Mật (như giá Brent Physical Dated hoặc Biên lợi nhuận lọc dầu BSR Internal Margin) trong khi Quyền là "BỊ TỪ CHỐI", bạn BẮT BUỘC phải TỪ CHỐI cung cấp giá trị số, giải thích lịch sự rằng vai trò của họ chưa được cấp quyền xem dữ liệu Restricted.

DỮ LIỆU THỊ TRƯỜNG & TIN TỨC MẪU CỦA BSR ĐƯỢC CẤP PHÉP:
1. Danh mục giá: ${JSON.stringify(visibleInstruments)}
2. Tin tức & Sự kiện: ${JSON.stringify(visibleNews)}
3. Yếu tố dẫn dắt (Market Drivers): ${JSON.stringify(drivers)}
4. Dự báo (Forecasts): ${JSON.stringify(forecasts)}

NGUYÊN TẮC TRẢ LỜI:
1. Mọi con số, sự kiện và nhận định phải bám sát dữ liệu được cung cấp ở trên. Tuyệt đối không bịa đặt số liệu giá ngoài danh sách.
2. Trình bày rõ ràng, súc tích với định dạng Markdown (tiêu đề, in đậm số liệu, gạch đầu dòng).
3. Luôn phân định rõ ràng giữa:
   - [Số liệu thực tế / Facts]: Giá bao nhiêu, thay đổi bao nhiêu, nguồn từ đâu.
   - [Tính toán phân tích / Analysis]: Crack spread, spread Brent-WTI, tác động vận tải/biến động.
   - [Nhận định & Khuyến nghị / AI Interpretation]: Gợi ý điểm cần theo dõi cho BSR.
4. Khi đề cập đến loại hàng hay tin tức cụ thể, hãy ghi rõ mã định danh (ví dụ: brent_futures, ron95, crack_gasoline, N-2411, N-2410...) để hệ thống tự tạo liên kết nguồn.`;

    let replyText = '';
    const baseUrl = (config.baseUrl || 'https://api.deepseek.com').replace(/\/+$/, '');
    const model = config.model || 'deepseek-chat';
    const url = `${baseUrl}/chat/completions`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        temperature: 0.3
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const msg = errJson.error && errJson.error.message ? errJson.error.message : `HTTP ${res.status} ${res.statusText}`;
      throw new Error(`DeepSeek API: ${msg}`);
    }

    const data = await res.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      replyText = data.choices[0].message.content;
    } else {
      throw new Error('DeepSeek API không trả về nội dung hợp lệ.');
    }

    const latency = ((performance.now() - startTime) / 1000).toFixed(2);
    const sources = extractSourcesFromText(replyText + ' ' + question);
    const isRefusal = replyText.toLowerCase().includes('từ chối') || replyText.toLowerCase().includes('chưa được cấp quyền') || replyText.toLowerCase().includes('không có quyền');

    return {
      type: 'live_agent_query',
      model: 'Auker AI Agent',
      html: formatAiMarkdown(replyText),
      sources: sources,
      trace: {
        tools: ['permission_scope.enforce', 'auker.context_retrieval', 'auker_agent.inference', 'output.markdown_render'],
        validation: 'passed',
        status: 'completed',
        meta: `Auker Orchestration (Auker AI Agent) · Latency: ${latency}s`
      },
      meta: 'Auker Intelligence · Auker AI Agent',
      refusal: isRefusal,
      latency: latency,
      cost: '$0.001'
    };
  }

  function openAiSettingsModal() {
    const config = getAiConfig() || { provider: 'auker', model: 'deepseek-chat', apiKey: '', baseUrl: 'https://api.deepseek.com' };
    const hasEnv = !!(backendEnvConfig && backendEnvConfig.has_key);
    const isDeepSeek = config.provider === 'deepseek' || hasEnv;
    const kicker = 'BẢO MẬT & CẤU HÌNH';
    const title = 'Cấu hình Auker AI Agent';
    const body = `
      <div class="grid gap-16">
        ${hasEnv ? `
          <div class="inline-note" style="background:var(--surface-2);border-left:3px solid var(--teal);padding:10px 12px;">
            <span class="note-mark">✓</span>
            <span><strong>Đã kết nối .env từ Server:</strong> Backend Python đang chạy và đã nạp Key từ file <code>.env</code>. Hệ thống tự động kích hoạt Auker AI Agent cho bạn!</span>
          </div>
        ` : `
          <div class="inline-note" style="background:var(--surface-2);border-left:3px solid var(--teal);padding:10px 12px;">
            <span class="note-mark">🔒</span>
            <span><strong>Bảo mật tuyệt đối khi Deploy:</strong> Bạn có thể cấu hình API Key qua file <code>.env</code> ở Backend, hoặc lưu trực tiếp trong <code>localStorage</code> trên trình duyệt của riêng bạn. Khi deploy lên hosting tĩnh (GitHub Pages/Vercel), <strong>không có API Key nào nằm trong mã nguồn</strong>.</span>
          </div>
        `}

        <div class="field">
          <label for="ai-provider">Chọn Động cơ AI (AI Engine)</label>
          <select id="ai-provider">
            <option value="auker" ${!isDeepSeek ? 'selected' : ''}>Auker Orchestration (Mô phỏng nội bộ BSR · Không cần Key)</option>
            <option value="deepseek" ${isDeepSeek ? 'selected' : ''}>Auker AI Agent (Live AI Agent · Phân tích & Suy luận thật)</option>
          </select>
        </div>

        <div id="ai-auker-desc" style="${isDeepSeek ? 'display:none;' : ''}">
          <div class="inline-note" style="background:var(--surface);border-left:3px solid var(--copper);padding:9px 12px;">
            <span class="note-mark">ℹ</span>
            <span><strong>Chế độ Auker:</strong> Sử dụng động cơ phân tích tất định (Deterministic) và bộ dữ liệu mockup có sẵn của BSR. Phản hồi tức thì, tuân thủ chặt chẽ chính sách dữ liệu và chạy hoàn toàn offline không cần API Key.</span>
          </div>
        </div>

        <div id="ai-deepseek-settings" style="${isDeepSeek ? '' : 'display:none;'}">
          <div class="grid gap-16">
            <div class="field">
              <label for="ai-api-key">API Key</label>
              <div style="display:flex;gap:8px;">
                <input type="password" id="ai-api-key" placeholder="Dán API Key (sk-...)" value="${esc(config.apiKey || '')}" style="flex:1;">
                <button class="btn btn-sm" type="button" data-action="toggle-key-view" id="btn-toggle-key">👁 Hiện</button>
              </div>
              <div class="small muted mt-4">
                API Key được cấp quyền truy cập dịch vụ AI.
              </div>
            </div>

            <div class="field">
              <label for="ai-model">Tên Model AI</label>
              <input type="text" id="ai-model" value="${esc(config.model || 'deepseek-chat')}">
              <div class="small muted mt-4">Gợi ý: <code>deepseek-chat</code> (hoặc để mặc định)</div>
            </div>

            <div class="field">
              <label for="ai-base-url">API Base URL (Tùy chọn)</label>
              <input type="text" id="ai-base-url" placeholder="https://api.deepseek.com" value="${esc(config.baseUrl || 'https://api.deepseek.com')}">
              <div class="small muted mt-4">Mặc định: <code>https://api.deepseek.com</code></div>
            </div>
          </div>
        </div>

        <div id="ai-test-status" class="small mt-4"></div>
      </div>
    `;

    const foot = `
      <div class="flex items-center justify-between gap-8 wrap" style="width:100%">
        <button class="btn btn-sm" data-action="clear-ai-settings" style="color:var(--restricted);">Đặt lại Auker mặc định</button>
        <div class="flex items-center gap-8">
          <button class="btn btn-sm" data-action="test-ai-connection">Thử kết nối</button>
          <button class="btn btn-copper btn-sm" data-action="save-ai-settings">Lưu cấu hình</button>
        </div>
      </div>
    `;

    openModal(kicker, title, body, foot);
  }

  function toggleKeyVisibility() {
    const inp = $('#ai-api-key');
    const btn = $('#btn-toggle-key');
    if (inp && btn) {
      if (inp.type === 'password') {
        inp.type = 'text';
        btn.textContent = '🔒 Ẩn';
      } else {
        inp.type = 'password';
        btn.textContent = '👁 Hiện';
      }
    }
  }

  function saveAiSettingsFromModal() {
    const provider = $('#ai-provider') ? $('#ai-provider').value : 'auker';
    const apiKey = $('#ai-api-key') ? $('#ai-api-key').value.trim() : '';
    const model = $('#ai-model') ? $('#ai-model').value.trim() : 'deepseek-chat';
    const baseUrl = ($('#ai-base-url') ? $('#ai-base-url').value.trim() : '') || 'https://api.deepseek.com';

    if (provider === 'deepseek' && !apiKey) {
      showToast('Vui lòng nhập API Key trước khi lưu.');
      return;
    }

    saveAiConfig({ provider, apiKey, model, baseUrl });
    closeModal();
    render();
    if (provider === 'deepseek') {
      showToast('🎉 Đã kích hoạt Auker AI Agent!');
    } else {
      showToast('Đã chuyển về chế độ Auker Orchestrator (Mô phỏng nội bộ).');
    }
  }

  function clearAiSettingsFromModal() {
    saveAiConfig({ provider: 'auker', model: 'deepseek-chat', apiKey: '', baseUrl: 'https://api.deepseek.com' });
    closeModal();
    render();
    showToast('Đã đặt lại về chế độ Auker Orchestrator mặc định.');
  }

  async function testAiConnectionFromModal() {
    const provider = $('#ai-provider') ? $('#ai-provider').value : 'deepseek';
    const statusEl = $('#ai-test-status');

    if (provider === 'auker') {
      if (statusEl) statusEl.innerHTML = '<span style="color:var(--teal);font-weight:600;">✓ Chế độ Auker (Mô phỏng nội bộ) sẵn sàng hoạt động mà không cần API Key.</span>';
      return;
    }

    const apiKey = $('#ai-api-key') ? $('#ai-api-key').value.trim() : '';
    const model = $('#ai-model') ? $('#ai-model').value.trim() : 'deepseek-chat';
    const baseUrl = ($('#ai-base-url') ? $('#ai-base-url').value.trim() : '') || 'https://api.deepseek.com';

    if (!apiKey) {
      if (statusEl) statusEl.innerHTML = '<span style="color:var(--restricted);">⚠️ Vui lòng nhập API Key trước khi thử kết nối.</span>';
      return;
    }

    if (statusEl) statusEl.innerHTML = '<span class="muted"><span class="pulse"></span> Đang kiểm tra kết nối tới AI Service...</span>';

    try {
      const base = baseUrl.replace(/\/+$/, '');
      const res = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: 'Trả lời đúng 1 từ: OK' }],
          max_tokens: 5
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error && err.error.message ? err.error.message : 'HTTP ' + res.status);
      }
      if (statusEl) statusEl.innerHTML = '<span style="color:var(--teal);font-weight:600;">✓ Kết nối thành công! Auker AI Agent hoạt động tốt.</span>';
    } catch (err) {
      if (statusEl) statusEl.innerHTML = `<span style="color:var(--restricted);font-weight:600;">✗ Lỗi kết nối Auker AI Agent: ${esc(err.message)}</span>`;
    }
  }

  function assistantPage() {
    const aiConfig = getAiConfig();
    const hasEnv = !!(backendEnvConfig && backendEnvConfig.has_key);
    const isDeepSeek = hasEnv || (aiConfig && aiConfig.provider === 'deepseek' && !!aiConfig.apiKey);
    const modelName = hasEnv ? (backendEnvConfig.model || 'deepseek-chat') : (aiConfig.model || 'deepseek-chat');
    const engineBadge = isDeepSeek
      ? `<span class="chip teal">${ico('sparkle', 9)} Auker AI Agent</span>`
      : `<span class="chip">${ico('sparkle', 9)} Auker AI Agent (Demo Mode)</span>`;

    return `
      ${pageHead('AI assistant', 'Ask inside the boundary.', 'A permission-scoped research assistant. It retrieves permitted data, uses registered tools and cites what it used.', `
        <button class="btn" data-action="attach-doc">${ico('upload')} Attach document</button>
        <a class="btn" href="#reports">${ico('file')} Report workspace</a>`)}
      <div class="assistant-layout">
        <section class="card chat-card">
          <div class="card-head">
            <div>
              <h2 class="card-title">${ico('sparkle', 14)} Market intelligence assistant</h2>
              <div class="card-sub">${isDeepSeek ? 'Auker Orchestration · Auker AI Agent' : 'Auker orchestration · demo provider adapter'}</div>
            </div>
            <div class="flex items-center gap-8">
              ${engineBadge}
              <span class="chip teal">${ico('lock', 9)} ${esc(role().label)} scope</span>
            </div>
          </div>
          <div class="chat-body" id="chat-body">
            ${state.chat.length === 0 ? chatEmpty() : state.chat.map(renderMessage).join('')}
            ${state.chatThinking ? `<div class="thinking"><span class="pulse"></span>${isDeepSeek ? 'Auker AI Agent đang phân tích dữ liệu thị trường và trích dẫn nguồn…' : 'Retrieving permitted data and validating sources…'}</div>` : ''}
          </div>
          <div class="chat-composer">
            <label class="sr-only" for="chat-input">Ask a question</label>
            <textarea id="chat-input" placeholder="Hỏi về giá dầu Brent, crack spread xăng, tin tức OPEC+, tình hình Biển Đỏ, bảo dưỡng Dung Quất…">${esc(state.chatDraft)}</textarea>
            ${state.attachment ? `<div class="tag-row mt-8"><span class="chip copper">${ico('file', 10)} ${esc(state.attachment)} <button class="link-btn" data-action="remove-attachment" aria-label="Remove attachment">×</button></span></div>` : ''}
            <div class="composer-row"><span class="composer-hint">Enter để gửi · Shift+Enter xuống dòng · câu trả lời tự động trích dẫn nguồn</span><div class="flex gap-8 items-center"><button class="btn btn-sm" data-action="attach-doc">${ico('file', 12)} Attach</button><button class="btn btn-copper btn-sm" data-action="send-chat">${ico('arrowRight', 13)} Send</button></div></div>
          </div>
        </section>
        <aside class="assistant-rail">
          <section class="card">
            <div class="card-head"><div><h2 class="card-title">AI Engine</h2><div class="card-sub">${isDeepSeek ? 'Auker AI Agent' : 'Auker Synthetic Demo'}</div></div></div>
            <div class="card-body"><div class="context-list">
              <div class="context-row"><span class="c-name">Chế độ</span><span class="chip ${isDeepSeek ? 'teal' : ''}">${isDeepSeek ? 'Online · Auker AI Agent' : 'Auker Mô phỏng'}</span></div>
              <div class="context-row"><span class="c-name">Orchestration</span><span class="c-value">Auker Intelligence</span></div>
              <div class="context-row"><span class="c-name">LLM Engine</span><span class="c-value">${isDeepSeek ? 'Auker AI Agent' : 'Auker Deterministic'}</span></div>
              <div class="context-row"><span class="c-name">Lưu trữ Key</span><span class="c-value">${hasEnv ? 'Backend .env' : 'Browser LocalStorage'}</span></div>
            </div></div>
          </section>
          <section class="card">
            <div class="card-head"><div><h2 class="card-title">Permission context</h2><div class="card-sub">Applied before retrieval</div></div></div>
            <div class="card-body"><div class="context-list">
              <div class="context-row"><span class="c-name">Role</span><span class="c-value">${esc(role().label)}</span></div>
              <div class="context-row"><span class="c-name">Max classification</span><span class="c-value">${esc(role().maxClassification)}</span></div>
              <div class="context-row"><span class="c-name">Restricted data</span><span class="c-value">${role().viewRestricted ? 'Included' : 'Excluded before AI'}</span></div>
              <div class="context-row"><span class="c-name">Export permission</span><span class="c-value">${role().export ? 'Allowed' : 'Denied'}</span></div>
              <div class="context-row"><span class="c-name">Trace ID</span><span class="c-value">AI-DEMO-8F2A</span></div>
            </div></div>
          </section>
          <section class="card">
            <div class="card-head"><div><h2 class="card-title">Answer discipline</h2><div class="card-sub">What the assistant must show</div></div></div>
            <div class="card-body"><div class="context-list">
              <div class="context-row"><span class="c-name">Source facts</span><span class="chip">cited</span></div>
              <div class="context-row"><span class="c-name">Calculations</span><span class="chip">analytical service</span></div>
              <div class="context-row"><span class="c-name">AI interpretation</span><span class="chip copper">labelled</span></div>
              <div class="context-row"><span class="c-name">Uncertainty</span><span class="chip">stated</span></div>
              <div class="context-row"><span class="c-name">Output validation</span><span class="chip teal">schema checked</span></div>
            </div></div>
          </section>
          <section class="card">
            <div class="card-head"><div><h2 class="card-title">Recent executions</h2><div class="card-sub">Auditable task runs</div></div></div>
            <div class="card-body"><div class="version-list">${state.executions.slice(0, 4).map((x) => `<div class="version-row"><span><strong>${esc(x.task)}</strong><br><span class="small muted">${esc(x.type)} · ${esc(x.model)}</span></span><span class="text-right"><span class="chip ${x.status === 'Succeeded' ? 'teal' : 'warn'}">${esc(x.status)}</span><div class="small muted">${esc(x.latency)} · ${esc(x.cost)}</div></span></div>`).join('')}</div></div>
          </section>
        </aside>
      </div>`;
  }

  function chatEmpty() {
    const aiConfig = getAiConfig();
    const hasEnv = !!(backendEnvConfig && backendEnvConfig.has_key);
    const isDeepSeek = hasEnv || (aiConfig && aiConfig.provider === 'deepseek' && !!aiConfig.apiKey);
    return `<div class="chat-empty"><div class="ai-mark">A</div><h3>${isDeepSeek ? 'Auker AI Agent đã sẵn sàng' : 'What should we investigate?'}</h3>
    <p>${isDeepSeek ? 'Hỏi bất kỳ điều gì về biến động giá, crack spread, tin tức OPEC+, tình hình Biển Đỏ, bảo dưỡng Dung Quất... Auker AI Agent sẽ phân tích trực tiếp trên dữ liệu của BSR và trích dẫn nguồn đầy đủ.' : 'Ask about a price move, a crack spread, a source comparison, forecast accuracy or a permitted news theme. The assistant will show its sources and tool trace.'}</p>
    <div class="prompt-grid">
      ${['What is driving gasoline cracks?', 'Compare Brent and WTI over 30 days.', 'Which news could affect crude supply?', 'How accurate are Brent forecasts?', 'What does the physical Brent market show?', 'Summarize this morning\'s market briefing.'].map((p) => `<button class="prompt-btn" data-action="prompt" data-q="${esc(p)}">${esc(p)}</button>`).join('')}
    </div></div>`;
  }

  function renderMessage(m) {
    if (m.role === 'user') return `<div class="message user"><div class="bubble" data-i18n-skip>${esc(m.content)}</div></div>`;
    return `<div class="message ai"><div class="ai-label">${ico('sparkle', 11)} ${esc(t('AI interpretation'))} · ${esc(t(m.meta || 'Auker demo adapter'))}</div><div class="bubble" data-i18n-skip>${m.html}
      ${!m.refusal ? `<div class="answer-actions"><button class="btn btn-sm" data-action="answer-report" data-question="${esc(m.question || '')}">${ico('file', 12)} ${esc(t('Create report'))}</button><button class="btn btn-sm" data-action="answer-analysis">${ico('analysis', 12)} ${esc(t('Open in Analysis'))}</button></div>` : ''}
      ${m.sources && m.sources.length ? `<div class="source-ledger">${m.sources.map((s) => `<button class="source-chip" data-action="open-source" data-route="${s.route}" data-id="${s.id}">${ico('file', 9)} ${esc(s.label)}</button>`).join('')}</div>` : ''}
      ${m.trace ? `<details class="tool-trace"><summary>Tool execution · ${esc(m.trace.status || 'completed')}</summary><ul>${m.trace.tools.map((t) => `<li>${esc(t)}</li>`).join('')}</ul><div>Validation: ${esc(m.trace.validation)} · ${esc(m.trace.meta)}</div></details>` : ''}
    </div></div>`;
  }

  function scrollChat() {
    const el = $('#chat-body');
    if (el) el.scrollTop = el.scrollHeight;
  }

  async function ask(question) {
    const q = question.trim();
    if (!q) return;
    state.chat.push({ role: 'user', content: q });
    state.chatDraft = '';
    state.chatThinking = true;
    if (state.route !== 'assistant') navigate('assistant'); else render();

    if (backendEnvConfig === null) {
      await checkBackendEnv();
    }

    const aiConfig = getAiConfig();
    const hasClientKey = !!(aiConfig && aiConfig.provider === 'deepseek' && aiConfig.apiKey);

    if (!hasClientKey && backendEnvConfig) {
      // Connects via Backend which reads .env!
      try {
        const res = await fetch('/api/assistant/prototype-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: q, role: state.role || 'leadership' })
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        const sources = (data.citations || []).map((c) => ({
          label: c.label || c.id,
          route: c.kind === 'news' ? 'news' : 'market-data',
          id: c.id
        }));
        const isDeepSeek = !!(backendEnvConfig && backendEnvConfig.has_key);
        const exec = {
          task: data.execution ? data.execution.task_id : ('AI-ENV-' + Math.random().toString(16).slice(2, 6).toUpperCase()),
          type: 'backend_env_query',
          model: isDeepSeek ? 'Auker AI Agent' : 'Auker Deterministic',
          reasoning: isDeepSeek ? 'live_auker_agent' : 'sqlite_rag',
          tools: data.tool_trace ? data.tool_trace.length : 3,
          latency: (data.execution ? (data.execution.latency_ms / 1000).toFixed(2) : '1.20') + 's',
          cost: isDeepSeek ? '$0.001' : '$0.000',
          status: data.refusal ? 'Refused' : 'Succeeded',
          validation: 'Passed'
        };
        state.executions.unshift(exec);
        state.chat.push({
          role: 'ai',
          html: formatAiMarkdown(data.answer),
          sources: sources.length ? sources : extractSourcesFromText(data.answer + ' ' + q),
          trace: {
            tools: ['permission_scope.enforce', 'backend.dotenv_env', 'auker_agent_api', 'output.render'],
            validation: 'passed',
            status: 'completed',
            meta: `Auker Orchestration · Auker AI Agent`
          },
          meta: isDeepSeek ? 'Auker Intelligence · Auker AI Agent' : 'Auker Intelligence · SQLite Engine',
          refusal: !!data.refusal,
          question: q
        });
      } catch (err) {
        console.error('Backend .env query error:', err);
        // Fallback to client-side or demo simulation
        runLocalOrDemo(q, aiConfig);
      } finally {
        state.chatThinking = false;
        if (state.route === 'assistant') { render(); scrollChat(); }
      }
    } else {
      runLocalOrDemo(q, aiConfig);
    }
  }

  async function runLocalOrDemo(q, aiConfig) {
    if (aiConfig && aiConfig.provider === 'deepseek' && aiConfig.apiKey) {
      try {
        const answer = await callLiveAiAgent(q, aiConfig);
        const exec = {
          task: 'AI-AUKER-' + Math.random().toString(16).slice(2, 6).toUpperCase(),
          type: answer.type || 'live_agent_query',
          model: 'Auker AI Agent',
          reasoning: 'auker_live_agent',
          tools: (answer.trace && answer.trace.tools ? answer.trace.tools.length : 4),
          latency: answer.latency + 's',
          cost: '$0.001',
          status: answer.refusal ? 'Refused' : 'Succeeded',
          validation: 'Passed'
        };
        state.executions.unshift(exec);
        state.chat.push({
          role: 'ai',
          html: answer.html,
          sources: answer.sources || [],
          trace: answer.trace,
          meta: answer.meta || 'Auker Intelligence · Auker AI Agent',
          refusal: answer.refusal,
          question: q
        });
      } catch (err) {
        console.error('Auker Live Agent error:', err);
        const errMsg = err.message || 'Lỗi không xác định khi gọi AI Service';
        state.chat.push({
          role: 'ai',
          html: `<div class="refusal"><strong>Lỗi kết nối Auker AI Agent:</strong> ${esc(errMsg)}</div><p class="small muted mt-4">Vui lòng kiểm tra lại cấu hình hoặc kết nối mạng.</p>`,
          sources: [],
          trace: { tools: ['auker_agent.error'], validation: 'failed', status: 'error', meta: esc(errMsg) },
          meta: 'Auker AI Agent Error',
          refusal: true,
          question: q
        });
      } finally {
        state.chatThinking = false;
        if (state.route === 'assistant') { render(); scrollChat(); }
      }
    } else {
      window.setTimeout(() => {
        const answer = aiAnswer(q);
        const exec = { task: 'AI-DEMO-' + Math.random().toString(16).slice(2, 6).toUpperCase(), type: answer.type, model: 'demo-orchestrator/standard', reasoning: 'standard', tools: answer.trace.tools.length, latency: '1.8s', cost: '$0.014', status: answer.refusal ? 'Refused' : 'Succeeded', validation: 'Passed' };
        state.executions.unshift(exec);
        state.chat.push({ role: 'ai', html: answer.html, sources: answer.sources, trace: answer.trace, meta: answer.meta, refusal: answer.refusal, question: q });
        state.chatThinking = false;
        if (state.route === 'assistant') { render(); scrollChat(); }
      }, 850);
    }
  }

  function aiAnswer(q) {
    const lower = q.toLowerCase();
    const has = (...words) => words.some((w) => lower.includes(w));
    const sources = [];
    const add = (label, route, id) => { if (!sources.some((s) => s.id === id && s.route === route)) sources.push({ label, route, id }); };
    const baseTrace = { tools: ['permission_scope.resolve', 'market_data.query'], validation: 'passed', status: 'completed', meta: 'demo · trace retained' };

    if (has('physical', 'dated', 'restricted', 'mật', 'confidential margin', 'bsr margin', 'vật chất', 'hạn chế', 'biên lợi nhuận', 'biên nội bộ')) {
      if (!role().viewRestricted) {
        return {
          refusal: true, type: 'chat_query',
          html: I18N.ai('refusal'),
          sources: [], trace: { ...baseTrace, tools: ['permission_scope.resolve', 'policy.deny'], validation: 'passed', meta: 'denied before retrieval' }, meta: 'Auker demo adapter · permission boundary'
        };
      }
      const phys = rawInstrument('brent_physical');
      const physView = I18N.instrument(phys);
      add(t('Brent physical') + ' · ' + physView.source, 'market-data', 'brent_physical');
      return {
        type: 'chat_query',
        html: I18N.ai('physical', { value: fmtNum(phys.value, 2), unit: esc(phys.unit), pct: fmtPct(phys.pct), source: esc(phys.source), marketTime: esc(phys.marketTime), ingestionTime: esc(phys.ingestionTime) }),
        sources, trace: { ...baseTrace, tools: ['permission_scope.resolve', 'market_data.query', 'source.policy'], validation: 'passed' }, meta: 'Auker demo adapter · restricted access confirmed'
      };
    }

    if (has('crack', 'gasoline crack', 'diesel crack', 'margin', 'xăng', 'dầu diesel', 'chênh lệch')) {
      const crack = instrument('crack_gasoline');
      const brent = instrument('brent_futures');
      const ron95 = instrument('ron95');
      add(t('Gasoline crack') + ' · BSR Analytical', 'market-data', 'crack_gasoline');
      add(t('Brent futures') + ' · ICE (demo)', 'market-data', 'brent_futures');
      add(t('Red Sea freight') + ' · Platts (demo)', 'news', 'N-2410');
      const crackTable = `<div class="answer-table"><table><thead><tr><th>${esc(t('Instrument'))}</th><th>${esc(t('Value'))}</th><th>${esc(t('Session change'))}</th></tr></thead><tbody>
        <tr><td>${esc(t('Brent futures'))}</td><td>${fmtNum(brent.value, 2)} USD/bbl</td><td class="${directionClass(brent.change)}">${fmtPct(brent.pct)}</td></tr>
        <tr><td>${esc(t('RON95 physical'))}</td><td>${fmtNum(ron95.value, 2)} USD/bbl</td><td class="${directionClass(ron95.change)}">${fmtPct(ron95.pct)}</td></tr>
        <tr><td>${esc(t('Gasoline crack'))}</td><td>${fmtNum(crack.value, 2)} USD/bbl</td><td class="${directionClass(crack.change)}">${fmtPct(crack.pct)}</td></tr>
      </tbody></table></div>`;
      return {
        type: 'financial_time_series', sources,
        html: I18N.ai('crack', { crackId: esc(crack.formula.id), crackVal: fmtNum(crack.value, 2), crackPct: fmtPct(crack.pct), brentVal: fmtNum(brent.value, 2), brentPct: fmtPct(brent.pct), dieselPct: fmtPct(instrument('crack_diesel').pct) }) + crackTable,
        trace: { ...baseTrace, tools: ['permission_scope.resolve', 'market_data.query', 'analytics.crack_spread', 'news.search'], validation: 'passed' }, meta: 'Auker demo adapter · deterministic values from stored data'
      };
    }
    if (has('forecast', 'accuracy', 'eia', 'iea', 'mape', 'dự báo', 'độ chính xác', 'sai số')) {
      const evaluated = forecastsVisible().filter((f) => f.actual != null);
      const mae = evaluated.length ? evaluated.reduce((a, f) => a + Math.abs(f.value - f.actual), 0) / evaluated.length : null;
      add(t('Forecast register') + ' · EIA / IEA / Platts', 'forecast', 'F-101');
      return {
        type: 'forecast_evaluation', sources,
        html: I18N.ai('forecast', { n: evaluated.length, mae: mae == null ? t('not available') : fmtNum(mae, 2) }),
        trace: { ...baseTrace, tools: ['permission_scope.resolve', 'forecast.query', 'analytics.forecast_evaluate'], validation: 'passed' }, meta: 'Auker demo adapter · deterministic metrics'
      };
    }
    if (has('news', 'supply', 'opec', 'red sea', 'freight', 'headline', 'tin', 'nguồn cung', 'biển đỏ', 'vận tải', 'tiêu đề')) {
      add(t('OPEC+ signal') + ' · Reuters (demo)', 'news', 'N-2411');
      add(t('Red Sea freight') + ' · Platts (demo)', 'news', 'N-2410');
      add(t('Asian crude demand') + ' · Reuters (demo)', 'news', 'N-2406');
      return {
        type: 'news_summarization', sources,
        html: I18N.ai('news'),
        trace: { ...baseTrace, tools: ['permission_scope.resolve', 'news.search', 'source.compare'], validation: 'passed' }, meta: 'Auker demo adapter · cited news'
      };
    }
    if (has('brent', 'wti', 'crude', 'price', 'market', 'dầu thô', 'giá', 'thị trường')) {
      const brent = instrument('brent_futures');
      const wti = instrument('wti_futures');
      const spread = Math.round((brent.value - wti.value) * 100) / 100;
      add(t('Brent futures') + ' · ICE (demo)', 'market-data', 'brent_futures');
      add(t('WTI futures') + ' · CME (demo)', 'market-data', 'wti_futures');
      add(t('OPEC+ signal') + ' · Reuters (demo)', 'news', 'N-2411');
      return {
        type: 'market_data_interpretation', sources,
        html: I18N.ai('prices', { brentVal: fmtNum(brent.value, 2), brentPct: fmtPct(brent.pct), wtiVal: fmtNum(wti.value, 2), wtiPct: fmtPct(wti.pct), spread: fmtNum(spread, 2) }),
        trace: { ...baseTrace, tools: ['permission_scope.resolve', 'market_data.query', 'analytics.spread', 'news.search'], validation: 'passed' }, meta: 'Auker demo adapter · cited observations'
      };
    }
    add(t('Brent futures') + ' · ICE (demo)', 'market-data', 'brent_futures');
    add(t('OPEC+ signal') + ' · Reuters (demo)', 'news', 'N-2411');
    return {
      type: 'market_briefing', sources,
      html: I18N.ai('snapshot', { brentVal: fmtNum(instrument('brent_futures').value, 2), brentPct: fmtPct(instrument('brent_futures').pct), wtiVal: fmtNum(instrument('wti_futures').value, 2), wtiPct: fmtPct(instrument('wti_futures').pct), crackVal: fmtNum(instrument('crack_gasoline').value, 2), crackPct: fmtPct(instrument('crack_gasoline').pct) }),
      trace: { ...baseTrace, tools: ['permission_scope.resolve', 'market_data.query', 'news.search'], validation: 'passed' }, meta: 'Auker demo adapter · cited snapshot'
    };
  }

  /* ---------- Reports ---------- */
  function reportsPage() {
    return `
      ${pageHead('Reports', 'A snapshot that stays put.', 'Build a report, cite its sources and keep each version. Export is a separate permission from viewing.', `
        <button class="btn" data-action="open-report-builder">${ico('plus')} New report</button>`)}
      <div class="reports-layout">
        <div class="grid gap-16">
          <section class="card">
            <div class="card-head"><div><h2 class="card-title">Report builder</h2><div class="card-sub">On-demand market analysis · permitted data only</div></div><span class="chip ${role().export ? 'teal' : 'warn'}">${role().export ? 'Export allowed' : 'Export denied for role'}</span></div>
            <div class="card-body"><div class="report-builder">
              <div class="field-row"><div class="field"><label for="report-type">Report type</label><select id="report-type">${['On-demand Market Analysis', 'Morning Briefing', 'End-of-day Report', 'Daily Market Report', 'Weekly Market Report', 'Monthly Market Report', 'Event-driven Market Report'].map((opt) => `<option value="${esc(opt)}" ${state.reportType === opt ? 'selected' : ''}>${esc(opt)}</option>`).join('')}</select></div>
              <div class="field"><label for="report-range">Range</label><select id="report-range">${['Last 7 days', 'Last 30 days', 'Last 90 days', 'Week to date', 'Month to date'].map((opt) => `<option value="${esc(opt)}" ${state.reportRange === opt ? 'selected' : ''}>${esc(opt)}</option>`).join('')}</select></div></div>
              <div class="field"><label for="report-scope">Scope</label><select id="report-scope">${['Market overview, news and analysis', 'Market data and crack spreads', 'News and source coverage', 'Forecast accuracy', 'Restricted physical and internal margin'].map((opt) => `<option value="${esc(opt)}" ${state.reportScope === opt ? 'selected' : ''}>${esc(opt)}</option>`).join('')}</select></div>
              ${state.reportQuestion ? `<div class="inline-note"><span class="note-mark">AI</span><span>${esc(t('From the assistant thread'))}: “${esc(state.reportQuestion)}”. ${esc(t('The report keeps its own data cut-off and sources.'))}</span></div>` : ''}
              <div class="inline-note"><span class="note-mark">i</span><span>The report freezes its data cut-off and sources. Later source updates do not silently change the stored version.</span></div>
              <div class="flex items-center justify-between gap-8 wrap"><span class="small muted">May contain ${role().viewRestricted ? 'Restricted data if explicitly selected' : 'Internal data only'}.</span><button class="btn btn-copper" data-action="generate-report">${ico('sparkle')} Generate report</button></div>
            </div></div>
          </section>
          <section class="card">
            <div class="card-head"><div><h2 class="card-title">Report register</h2><div class="card-sub">Immutable versions · source references retained</div></div><span class="chip">${reportsVisible().length} reports</span></div>
            <div class="card-body" style="padding-top:4px;padding-bottom:4px">
              ${reportsVisible().map((r) => `<div class="report-row"><div><h4>${esc(r.title)}</h4><div class="r-meta"><span>${esc(r.type)}</span><span>·</span><span>v${r.version}</span><span>·</span><span>${esc(r.range)}</span><span>·</span><span>${esc(r.created)}</span>${r.classification !== 'Internal' ? `<span class="chip">${esc(r.classification)}</span>` : ''}</div></div><div class="flex items-center gap-8"><button class="btn btn-sm" data-action="open-report" data-report="${r.id}">Preview</button><button class="btn btn-sm ${role().export ? '' : 'btn-disabled'}" data-action="export-report" data-report="${r.id}" ${role().export ? '' : `disabled title="${esc(t('Export permission required'))}"`}>${ico('download', 12)} PDF</button></div></div>`).join('')}
            </div>
          </section>
        </div>
        <aside class="grid gap-16">
          <section class="card">
            <div class="card-head"><div><h2 class="card-title">Version rules</h2><div class="card-sub">What is retained</div></div></div>
            <div class="card-body"><ul class="evidence-list">
              <li><span class="e-num">01</span><span>Report ID, type, requester and creation time.</span></li>
              <li><span class="e-num">02</span><span>Data cut-off and source references.</span></li>
              <li><span class="e-num">03</span><span>AI model/allocation metadata per retention policy.</span></li>
              <li><span class="e-num">04</span><span>Full content and immutable version number.</span></li>
              <li><span class="e-num">05</span><span>Approval status when a workflow is configured.</span></li>
            </ul></div>
          </section>
          <section class="card">
            <div class="card-head"><div><h2 class="card-title">Export policy</h2><div class="card-sub">Viewing is not sharing</div></div></div>
            <div class="card-body"><div class="inline-note"><span class="note-mark">${role().export ? '✓' : '!'}</span><span>${role().export ? 'Your role can export permitted reports. Every export is audited.' : 'Your role can view reports but cannot export them. The export endpoint would deny the request and record it in the audit log.'}</span></div><button class="btn mt-12" data-action="export-policy" style="width:100%">Review permission model</button></div>
          </section>
        </aside>
      </div>`;
  }

  function reportPreviewHTML(r) {
    const view = I18N.report(r);
    const b = instrument('brent_futures');
    const w = instrument('wti_futures');
    const c = instrument('crack_gasoline');
    const facts = `${esc(lb(b, 'short'))} ${fmtNum(b.value, 2)} USD/bbl (${fmtPct(b.pct)}); ${esc(lb(w, 'short'))} ${fmtNum(w.value, 2)} USD/bbl (${fmtPct(w.pct)}); ${esc(lb(c, 'short'))} ${fmtNum(c.value, 2)} USD/bbl (${fmtPct(c.pct)}).`;
    const sourceMeta = {
      'SRC-ICE': { label: 'ICE (demo)', kind: 'market', ref: 'brent_futures' },
      'SRC-CME': { label: 'CME (demo)', kind: 'market', ref: 'wti_futures' },
      'SRC-PLATTS': { label: 'Platts (demo)', kind: 'market', ref: 'ron95' },
      'SRC-BSR-AN': { label: 'BSR Analytical', kind: 'market', ref: 'crack_gasoline' },
      'SRC-NEWS-2410': { label: 'Platts (demo)', kind: 'news', ref: 'N-2410' },
      'SRC-NEWS-2411': { label: 'Reuters (demo)', kind: 'news', ref: 'N-2411' }
    };
    const sourceLedger = (r.sources || []).map((id) => {
      const meta = sourceMeta[id];
      let time = r.cutOff;
      if (meta) {
        if (meta.kind === 'news') {
          const item = D.news.find((n) => n.id === meta.ref);
          if (item) time = item.ingested;
        } else {
          const inst = rawInstrument(meta.ref);
          if (inst) time = inst.ingestionTime;
        }
      }
      return `<div class="rp-ledger-row"><span><strong>${esc(meta ? meta.label : t('Source'))}</strong> · ${esc(id)}</span><span>${esc(time)}</span></div>`;
    }).join('');
    return `<div class="report-preview">
      <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start"><div><div class="page-kicker">BSR Market Intelligence</div><h2>${esc(lb(view, 'title'))}</h2><div class="rp-meta">${esc(lb(view, 'type'))} · ${esc(lb(view, 'range'))} · ${esc(t('Version'))} ${r.version} · ${esc(t('Data cut-off'))} ${esc(r.cutOff)}</div></div><div class="chip">${esc(lb(view, 'classification'))}</div></div>
      <h3>${esc(t('Executive read'))}</h3>
      <p>${esc(t('Brent held above $78 while the product complex carried the stronger signal. Gasoline cracks firmed on freight and Asian blending demand; diesel cracks softened. The evidence supports a watch stance, not a crude-supply-shock conclusion.'))}</p>
      <h3>${esc(t('Observed market facts'))}</h3>
      <p>${facts}</p>
      <h3>${esc(t('What is driving it'))}</h3>
      <p>${esc(t('OPEC+ commentary points to patience on supply. Red Sea diversions are raising freight and insurance costs. Asian refiners have trimmed some December spot crude requirements, a demand-side offset.'))}</p>
      <h3>${esc(t('AI interpretation'))}</h3>
      <p>${esc(t('The balance of evidence favours a product-crack watch stance. The freight signal is source-confirmed, but its duration and crude-supply impact remain uncertain. No trading action is implied.'))}</p>
      <h3>${esc(t('Sources'))}</h3>
      <div class="rp-ledger">${sourceLedger}</div>
      <p class="rp-source" style="margin-top:14px;border-top:1px solid var(--line);padding-top:8px">${esc(t('Generated by BSR Market Intelligence · Synthetic demo content · AI-assisted, human-reviewed before use.'))}</p>
    </div>`;
  }

  /* ---------- Admin ---------- */
  function adminPage() {
    if (!role().admin) {
      return `<div class="denied"><div class="denied-mark">${ico('lock', 22)}</div><h2>Administration is restricted.</h2><p>Your role does not have access to user, source or audit administration. The navigation entry is hidden and the backend would deny this route. Switch to the Market Intelligence demo role to inspect the governance views.</p><a class="btn mt-12" href="#overview">Return to Overview</a></div>`;
    }
    return `
      ${pageHead('Administration & governance', 'The system of record.', 'Demo governance view: role matrix, data sources, AI executions and append-only audit evidence.', `
        <button class="btn" data-action="export-audit">${ico('download')} Export audit</button>`)}
      <div class="admin-grid">
        <section class="card">
          <div class="card-head"><div><h2 class="card-title">Role matrix</h2><div class="card-sub">Backend-enforced capabilities</div></div><span class="chip">3 roles</span></div>
          <div class="card-body flush"><div class="table-wrap"><table class="role-matrix">
            <thead><tr><th>Capability</th><th>Leadership</th><th>Market Intelligence</th><th>Internal</th></tr></thead>
            <tbody>
              <tr><td>View market data</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td></tr>
              <tr><td>View Restricted</td><td class="yes">✓</td><td class="yes">✓</td><td class="no">—</td></tr>
              <tr><td>Export reports</td><td class="no">—</td><td class="yes">✓</td><td class="no">—</td></tr>
              <tr><td>Ingest data / news</td><td class="no">—</td><td class="yes">✓</td><td class="no">—</td></tr>
              <tr><td>Manage forecasts</td><td class="no">—</td><td class="yes">✓</td><td class="no">—</td></tr>
              <tr><td>View audit log</td><td class="no">—</td><td class="yes">✓</td><td class="no">—</td></tr>
              <tr><td>AI queries</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td></tr>
            </tbody>
          </table></div></div>
          <div class="card-foot"><span>Viewing and exporting are separate permissions.</span></div>
        </section>
        <section class="card">
          <div class="card-head"><div><h2 class="card-title">Data sources</h2><div class="card-sub">Configured demo connectors</div></div><span class="chip teal">4 connected</span></div>
          <div class="card-body"><div class="source-row"><div><div class="s-name">ICE (demo)</div><div class="s-meta">Futures · real-time demo · Internal</div></div><span class="chip teal">Connected</span></div>
          <div class="source-row"><div><div class="s-name">CME (demo)</div><div class="s-meta">Futures · real-time demo · Internal</div></div><span class="chip teal">Connected</span></div>
          <div class="source-row"><div><div class="s-name">Platts (demo)</div><div class="s-meta">Physical assessments · end-of-day · Restricted</div></div><span class="chip teal">Connected</span></div>
          <div class="source-row"><div><div class="s-name">SBV (demo)</div><div class="s-meta">FX reference · delayed · Internal</div></div><span class="chip teal">Connected</span></div>
          <div class="source-row"><div><div class="s-name">Reuters / Bloomberg (demo)</div><div class="s-meta">News · manual / licensed integration pending</div></div><span class="chip warn">Manual</span></div>
          <div class="inline-note mt-12"><span class="note-mark">i</span><span>Commercial integrations depend on licensing and technical access. No licensed feed is connected in this demo.</span></div></div>
        </section>
        <section class="card admin-wide">
          <div class="card-head"><div><h2 class="card-title">AI executions</h2><div class="card-sub">Task, model, latency, cost, validation</div></div><span class="chip">${state.executions.length} runs</span></div>
          <div class="card-body flush"><div class="table-wrap"><table class="data"><thead><tr><th>Task</th><th>Type</th><th>Model</th><th class="num">Tools</th><th class="num">Latency</th><th class="num">Cost</th><th>Status</th><th>Validation</th></tr></thead><tbody>${state.executions.map((x) => `<tr><td class="mono">${esc(x.task)}</td><td>${esc(x.type)}</td><td>${esc(x.model)}</td><td class="num">${x.tools}</td><td class="num">${esc(x.latency)}</td><td class="num">${esc(x.cost)}</td><td><span class="chip ${x.status === 'Succeeded' ? 'teal' : 'warn'}">${esc(x.status)}</span></td><td>${esc(x.validation)}</td></tr>`).join('')}</tbody></table></div></div>
        </section>
        <section class="card admin-wide">
          <div class="card-head"><div><h2 class="card-title">Audit log</h2><div class="card-sub">Append-only · latest permitted events</div></div><span class="chip">${state.audit.length} events</span></div>
          <div class="card-body flush"><div class="table-wrap"><table class="data audit-table"><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Object</th><th>Result</th><th>Class.</th></tr></thead><tbody>${state.audit.slice(0, 10).map((a) => `<tr><td class="mono">${esc(a.time)}</td><td>${esc(a.actor)}<br><span class="small muted">${esc(a.role)}</span></td><td>${esc(a.action)}</td><td class="mono">${esc(a.object)}</td><td class="${a.result === 'Denied' ? 'result-denied' : 'result-allowed'}">${esc(a.result)}</td><td><span class="chip ${a.classification === 'Restricted' ? 'restricted' : ''}">${esc(a.classification)}</span></td></tr>`).join('')}</tbody></table></div></div>
          <div class="card-foot"><span>Every sensitive view, upload, export, permission change and AI request is recorded.</span></div>
        </section>
      </div>`;
  }

  /* ---------- Drawers and modals ---------- */
  function describeFocus(el) {
    if (!el || !el.dataset) return null;
    return {
      id: el.id || '',
      action: el.dataset.action || '',
      instrument: el.dataset.instrument || '',
      news: el.dataset.news || '',
      report: el.dataset.report || '',
      zone: el.classList.contains('metric-card') ? 'metric-card' : el.classList.contains('tape-item') ? 'tape-item' : ''
    };
  }

  function restoreFocusKey(key) {
    if (!key) return;
    const quote = (value) => (window.CSS && window.CSS.escape ? window.CSS.escape(value) : String(value).replace(/"/g, '\\"'));
    let el = key.id ? document.getElementById(key.id) : null;
    if (!el && key.action) {
      let selector = '[data-action="' + quote(key.action) + '"]';
      if (key.instrument) selector += '[data-instrument="' + quote(key.instrument) + '"]';
      if (key.news) selector += '[data-news="' + quote(key.news) + '"]';
      if (key.report) selector += '[data-report="' + quote(key.report) + '"]';
      if (key.zone) selector += '.' + quote(key.zone);
      el = document.querySelector(selector);
    }
    if (el && el.focus) el.focus();
  }

  function refreshChartsAfterOverlay() {
    if (!pendingChartRefresh) return;
    const focusKey = state.lastFocusKey;
    window.setTimeout(() => {
      const drawerOpen = $('#drawer') && $('#drawer').classList.contains('open');
      const modalOpen = $('#modal') && $('#modal').classList.contains('open');
      if (drawerOpen || modalOpen) return;
      pendingChartRefresh = false;
      if ((window.innerWidth <= 760) !== compactViewport) {
        render();
        restoreFocusKey(focusKey);
      }
    }, 0);
  }

  function openDrawer(kicker, title, body, foot = '') {
    state.lastFocus = document.activeElement;
    state.lastFocusKey = describeFocus(state.lastFocus);
    document.body.classList.add('drawer-open');
    $('#drawer-kicker').textContent = kicker || '';
    $('#drawer-title').textContent = title || '';
    $('#drawer-body').innerHTML = body;
    $('#drawer-foot').innerHTML = foot;
    I18N.applyI18n($('#drawer'));
    $('#drawer').classList.add('open');
    $('#drawer').setAttribute('aria-hidden', 'false');
    $('#backdrop').classList.add('open');
    setTimeout(() => { const b = $('#drawer .drawer-head .icon-btn'); if (b) b.focus(); }, 30);
  }
  function closeDrawer() {
    const drawer = $('#drawer');
    if (!drawer) return;
    if (state.route === 'news') syncNewsFilter();
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('drawer-open');
    refreshChartsAfterOverlay();
    const modal = $('#modal');
    if (modal && !modal.classList.contains('open')) $('#backdrop').classList.remove('open');
    if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus();
  }
  function openModal(kicker, title, body, foot = '') {
    state.lastFocus = document.activeElement;
    state.lastFocusKey = describeFocus(state.lastFocus);
    document.body.classList.add('modal-open');
    $('#modal-kicker').textContent = kicker || '';
    $('#modal-title').textContent = title || '';
    $('#modal-body').innerHTML = body;
    $('#modal-foot').innerHTML = foot;
    I18N.applyI18n($('#modal'));
    $('#modal').classList.add('open');
    $('#modal').setAttribute('aria-hidden', 'false');
    $('#backdrop').classList.add('open');
    setTimeout(() => { const f = $('#modal-body input, #modal-body select, #modal-body textarea, #modal .modal-head .icon-btn'); if (f) f.focus(); }, 30);
  }
  function closeModal() {
    const modal = $('#modal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    refreshChartsAfterOverlay();
    const drawer = $('#drawer');
    if (drawer && !drawer.classList.contains('open')) $('#backdrop').classList.remove('open');
    if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus();
  }
  function closeOverlays() { closeDrawer(); closeModal(); }

  function openMetricDrawer(i) {
    const meta = `<div class="data-meta"><span>${esc(t('Instrument'))} <strong>${esc(i.ticker)}</strong></span><span>${esc(t('Price type'))} <strong>${esc(lb(i, 'priceType'))}</strong></span><span>${esc(t('Classification'))} <strong>${esc(lb(i, 'classification'))}</strong></span></div>`;
    const body = `
      <div class="data-price"><span class="big">${fmtNum(i.value, i.decimals)}</span><span class="unit">${esc(i.unit)}</span><span class="chip ${i.dataStatus === 'Real-time' ? 'teal' : 'warn'}">${esc(lb(i, 'dataStatus'))}</span></div>
      <div class="metric-change mt-8"><span class="${directionClass(i.change)}">${fmtSigned(i.change, i.decimals)}</span><span class="${directionClass(i.pct)}">${fmtPct(i.pct)}</span><span class="muted">over session change</span></div>
      <div class="divider"></div>
      <dl class="kv"><dt>${esc(t('Previous value'))}</dt><dd>${fmtNum(i.value - i.change, i.decimals)} ${esc(i.unit)}</dd><dt>${esc(t('Absolute change'))}</dt><dd>${fmtSigned(i.change, i.decimals)} ${esc(i.unit)}</dd><dt>${esc(t('Percentage change'))}</dt><dd>${fmtPct(i.pct)}</dd><dt>${esc(t('Source'))}</dt><dd>${esc(i.source)}</dd><dt>${esc(t('Market timestamp'))}</dt><dd>${esc(i.marketTime)}</dd><dt>${esc(t('Ingestion timestamp'))}</dt><dd>${esc(i.ingestionTime)}</dd><dt>${esc(t('Data status'))}</dt><dd>${esc(lb(i, 'dataStatus'))}</dd><dt>${esc(t('Quality'))}</dt><dd>${esc(lb(i, 'quality'))}</dd><dt>${esc(t('Classification'))}</dt><dd>${esc(lb(i, 'classification'))}</dd></dl>
      <div class="divider"></div>
      ${chartBlock('drawer-' + i.id, [{ label: lb(i, 'short'), color: palette().copper, data: sliceRange(i.series, state.range) }], { height: 210, instrumentId: i.id, ariaLabel: t('{name} chart', { name: lb(i, 'name') }), unit: i.unit, yDecimals: i.decimals })}
      <p class="small muted mt-12">${esc(lb(i, 'description'))}</p>
      ${i.formula ? `<div class="formula-box mt-12"><div class="formula-id">${esc(i.formula.id)}</div><p>${esc(i.formula.rule_label || i.formula.rule)}</p></div>` : ''}
      <div class="inline-note mt-12"><span class="note-mark">i</span><span>Market time is when the value was recorded; ingestion time is when the platform received it. The dashboard marks delayed and manual data rather than presenting it as real-time.</span></div>`;
    openDrawer('Market observation', i.name, body, `<a class="btn" href="#market-data" data-action="navigate" data-route="market-data">Open in Market Data</a><button class="btn" data-action="close-drawer">Close</button>`);
    bindDrawerCharts();
  }

  function bindDrawerCharts() {
    // chart blocks inside the drawer are registered above; bind hover behavior for them
    $$('#drawer .chart-wrap').forEach((wrap) => {
      const meta = chartRegistry[wrap.dataset.chartKey];
      if (!meta) return;
      const svg = $('svg', wrap), tooltip = $('.chart-tooltip', wrap), hover = $('.hover-group', wrap);
      if (!svg || !tooltip || !hover) return;
      const move = (evt) => {
        const rect = svg.getBoundingClientRect(); const scale = meta.W / rect.width;
        const px = (evt.clientX - rect.left) * scale;
        const ratio = Math.max(0, Math.min(1, (px - meta.pad.l) / (meta.W - meta.pad.l - meta.pad.r)));
        const index = Math.round(ratio * (meta.n - 1)); const hx = meta.x(index);
        hover.setAttribute('visibility', 'visible');
        const line = $('.hover-line', hover); line.setAttribute('x1', hx); line.setAttribute('x2', hx);
        const c = $('circle', hover); if (c) { c.setAttribute('cx', hx); c.setAttribute('cy', meta.y(meta.series[0].data[index].value)); }
        tooltip.innerHTML = `<div class="tt-date">${longDate(meta.dates[index])}</div><div class="tt-row"><span>${esc(meta.series[0].label)}</span><span>${fmtNum(meta.series[0].data[index].value, 2)}</span></div>`;
        tooltip.classList.add('visible'); const rectWrap = wrap.getBoundingClientRect();
        tooltip.style.left = Math.min(rectWrap.width - 150, Math.max(0, evt.clientX - rectWrap.left + 12)) + 'px'; tooltip.style.top = '8px';
      };
      svg.addEventListener('pointermove', move);
      svg.addEventListener('pointerleave', () => { tooltip.classList.remove('visible'); hover.setAttribute('visibility', 'hidden'); });
    });
  }

  function openNewsDrawer(id) {
    const n = D.news.find((x) => x.id === id);
    if (!n || !canSee(n.classification)) { showToast(t('That item is not available for your role.')); return; }
    const view = I18N.news(n);
    const topics = view.topic_labels || n.topics;
    const linkedChips = n.linked
      .filter((x) => { const found = instrument(x); return found && canSee(found.classification); })
      .map((x) => { const found = instrument(x); return `<span class="chip">${esc(found ? lb(found, 'short') : x)}</span>`; })
      .join('') || `<span class="small muted">${esc(t('None available for your role.'))}</span>`;
    const body = `
      <div class="tag-row">${topics.map((topic) => `<span class="chip">${esc(topic)}</span>`).join('')}<span class="chip ${n.status === 'Duplicate candidate' ? 'warn' : 'teal'}">${esc(lb(view, 'status'))}</span>${n.classification !== 'Internal' ? `<span class="chip ${n.classification === 'Restricted' ? 'restricted' : ''}">${ico('lock', 9)} ${esc(lb(view, 'classification'))}</span>` : ''}</div>
      <div class="data-meta mt-12"><span>${esc(t('Source'))} <strong>${esc(n.source)}</strong></span><span>${esc(t('Published'))} <strong>${esc(n.published)}</strong></span><span>${esc(t('Ingested'))} <strong>${esc(n.ingested)}</strong></span></div>
      <div class="divider"></div>
      <div class="section-label">${esc(t('Original source content'))}</div><p class="small" style="line-height:1.65">${esc(lb(view, 'original'))}</p>
      <div class="inline-note mt-8"><span class="note-mark">S</span><span>${esc(t('Original news is attributable to {source}. The text below is generated and must not be presented as the publisher article.', { source: n.source }))}</span></div>
      <div class="divider"></div>
      <div class="section-label">${esc(t('AI summary'))}</div><p class="small" style="line-height:1.65">${esc(lb(view, 'summary'))}</p>
      <div class="section-label mt-12">${esc(t('AI insight'))}</div><p class="small" style="line-height:1.65">${esc(lb(view, 'insight'))}</p>
      <div class="divider"></div>
      <div class="section-label">${esc(t('Linked instruments'))}</div><div class="tag-row">${linkedChips}</div>
      ${n.duplicateOf ? `<div class="inline-note mt-12"><span class="note-mark">≠</span><span>${esc(t('Duplicate candidate linked to {id}. The source is retained for provenance; the platform does not delete it automatically.', { id: n.duplicateOf }))}</span></div>` : ''}
      <div class="divider"></div>
      <div class="flex gap-8 wrap"><button class="btn btn-sm" data-action="feedback" data-news="${n.id}" data-kind="like">${ico('check', 12)} ${esc(t('Useful'))}</button><button class="btn btn-sm" data-action="important" data-news="${n.id}">${ico('sparkle', 12)} ${esc(t('Important'))}</button><button class="btn btn-sm" data-action="feedback" data-news="${n.id}" data-kind="duplicate">${ico('layers', 12)} ${esc(t('Report duplicate'))}</button></div>`;
    openDrawer('News intelligence', lb(view, 'title'), body, `<a class="btn" href="#market-data" data-action="navigate" data-route="market-data">${esc(t('Open linked data'))}</a><button class="btn" data-action="close-drawer">${esc(t('Close'))}</button>`);
  }

  function openEventDrawer(ev) {
    const view = I18N.event(ev);
    const linked = ev.instruments
      .filter((x) => { const found = instrument(x); return found && canSee(found.classification); })
      .map((x) => { const found = instrument(x); return found ? lb(found, 'short') : x; })
      .join(', ') || t('no permitted instruments');
    const body = `<div class="data-meta"><span>${esc(t('Date'))} <strong>${esc(ev.date)}</strong></span><span>${esc(t('Type'))} <strong>${esc(lb(view, 'type'))}</strong></span><span>${esc(t('Source'))} <strong>${esc(ev.source)}</strong></span></div><div class="divider"></div><p class="small" style="line-height:1.65">${esc(t('This event is linked to {instruments}. Event markers show co-occurrence with market moves; they do not by themselves establish causation.', { instruments: linked }))}</p><div class="inline-note mt-12"><span class="note-mark">!</span><span>${esc(t('Use Market Data to inspect the series before and after the event. The event detail is a pointer to evidence, not a conclusion.'))}</span></div>`;
    openDrawer('Market event', lb(view, 'title'), body, `<button class="btn" data-action="close-drawer">${esc(t('Close'))}</button>`);
  }

  function openBriefingDrawer() {
    const body = `<div class="briefing-kicker">${ico('sparkle', 12)} AI market briefing · v${state.briefingVersion}</div><h3 style="font-family:var(--display);font-size:24px;line-height:1.2;font-weight:400;margin:0 0 10px">Supply risk is supporting crude; product cracks are doing the real work.</h3><p class="small" style="line-height:1.65">Brent held above $78 while gasoline and diesel cracks firmed. The move is supported by freight disruption and Asian blending demand, not by a broad crude-supply shock.</p><div class="divider"></div><div class="section-label">24-hour moves</div><div class="version-list"><div class="version-row"><span>Brent futures</span><span class="v-value pos">${fmtSigned(instrument('brent_futures').change)} · ${fmtPct(instrument('brent_futures').pct)}</span></div><div class="version-row"><span>WTI futures</span><span class="v-value pos">${fmtSigned(instrument('wti_futures').change)} · ${fmtPct(instrument('wti_futures').pct)}</span></div><div class="version-row"><span>Gasoline crack</span><span class="v-value ${directionClass(instrument('crack_gasoline').change)}">${fmtSigned(instrument('crack_gasoline').change)} · ${fmtPct(instrument('crack_gasoline').pct)}</span></div></div><div class="section-label mt-12">Watch next</div><ul class="watch-list"><li>OPEC+ ministerial commentary</li><li>Red Sea freight assessments</li><li>US crude and product inventories</li><li>Dung Quat maintenance progress</li></ul><div class="inline-note mt-12"><span class="note-mark">i</span><span>Generated from permitted observations and cited news. Source facts and AI interpretation are separated. Version ${state.briefingVersion} is retained; regeneration creates a new version.</span></div>`;
    openDrawer('AI-generated briefing', 'Morning market briefing', body, `<button class="btn" data-action="generate-briefing">${ico('sparkle')} Regenerate</button><a class="btn" href="#reports" data-action="navigate" data-route="reports">Open reports</a><button class="btn" data-action="close-drawer">Close</button>`);
  }

  function openForecastDrawer(id) {
    const f = D.forecasts.find((x) => x.id === id);
    if (!f || !canSee(f.classification)) return;
    const view = I18N.forecast(f);
    const history = [
      { v: f.version, value: f.value, date: f.published, kind: 'Current' },
      { v: Math.max(0, f.version - 1), value: f.previous, date: f.published, kind: 'Prior version' }
    ].filter((x) => x.value != null);
    const unit = instrument(f.instrument) ? instrument(f.instrument).unit : '';
    const rows = history.map((h) => `<div class="version-row"><div class="v-main"><span class="chip ${h.kind === 'Current' ? 'copper' : ''}">v${h.v}</span><span>${esc(t(h.kind))} · ${esc(h.date)}</span></div><span class="v-value">${fmtNum(h.value, 2)}</span></div>`).join('');
    const body = `<div class="data-meta"><span>${esc(t('Source'))} <strong>${esc(lb(view, 'source'))}</strong></span><span>${esc(t('Published'))} <strong>${esc(f.published)}</strong></span><span>${esc(t('Ingested'))} <strong>${esc(f.ingested)}</strong></span><span>${esc(t('Horizon'))} <strong>${esc(lb(view, 'horizon'))}</strong></span></div><div class="divider"></div><div class="data-price"><span class="big">${fmtNum(f.value, 2)}</span><span class="unit">${esc(unit)}</span></div><p class="small muted">${esc(lb(view, 'instrumentLabel'))} · ${esc(lb(view, 'period'))} · ${esc(t('methodology:'))} ${esc(lb(view, 'methodology'))}</p><div class="section-label mt-12">${esc(t('Version history'))}</div><div class="version-list">${rows}</div><div class="inline-note mt-12"><span class="note-mark">i</span><span>${esc(t('Every update creates a new version. The prior version is never overwritten. Error metrics are deterministic and require a recorded actual.'))}</span></div>`;
    openDrawer('Forecast version', lb(view, 'instrumentLabel') + ' · ' + lb(view, 'source'), body, `<button class="btn" data-action="close-drawer">${esc(t('Close'))}</button>`);
  }

  function openReportDrawer(id) {
    const r = state.reports.find((x) => x.id === id);
    if (!r || !canSee(r.classification)) return;
    const series = state.reports
      .filter((x) => x.type === r.type && canSee(x.classification))
      .sort((a, b) => b.version - a.version);
    const history = `<div class="version-history"><h4>${esc(t('Version history'))}</h4>${series.map((x) => `<div class="v-row ${x.id === r.id ? 'current' : ''}"><span>${esc(x.id)} · v${x.version}</span><span>${esc(x.created)}</span></div>`).join('')}</div>`;
    openDrawer('Report preview', r.title, reportPreviewHTML(r) + history, `<button class="btn" data-action="regenerate-report" data-report="${r.id}">${ico('sparkle')} ${esc(t('Regenerate'))}</button><button class="btn" data-action="adjust-report" data-report="${r.id}">${esc(t('Adjust'))}</button>${role().export ? `<button class="btn btn-copper" data-action="export-report" data-report="${r.id}">${ico('print')} ${esc(t('Print / Save PDF'))}</button>` : `<button class="btn" disabled title="${esc(t('Export permission required'))}">${ico('lock')} ${esc(t('Export denied'))}</button>`}<button class="btn" data-action="close-drawer">${esc(t('Close'))}</button>`);
  }

  function openSource(route, id) {
    if (route === 'news') { closeOverlays(); navigate('news'); setTimeout(() => openNewsDrawer(id), 30); return; }
    if (route === 'forecast') { closeOverlays(); navigate('forecast'); setTimeout(() => openForecastDrawer(id), 30); return; }
    if (route === 'market-data') { const i = instrument(id); if (i) { state.selectedInstrument = i.id; closeOverlays(); navigate('market-data'); } }
  }

  function openQuickInput() {
    if (state.role !== 'mi') {
      openModal('Quick data input', 'Data entry requires Market Intelligence access', `<div class="inline-note"><span class="note-mark">${ico('lock', 12)}</span><span>Your demo role is ${esc(role().label)}. Switch to <strong>Market Intelligence</strong> in the top bar to enter an observation. The input control is shown for discoverability, but the backend would reject the write.</span></div>`, `<button class="btn" data-action="close-modal">Close</button>`);
      return;
    }
    const options = visibleInstruments().map((i) => `<option value="${i.id}">${esc(i.name)} (${esc(i.unit)})</option>`).join('');
    const body = `<div class="tabs" role="tablist"><button class="tab ${state.inputTab === 'manual' ? 'active' : ''}" data-action="input-tab" data-tab="manual" role="tab" aria-selected="${state.inputTab === 'manual'}">Manual input</button><button class="tab ${state.inputTab === 'file' ? 'active' : ''}" data-action="input-tab" data-tab="file" role="tab" aria-selected="${state.inputTab === 'file'}">File upload</button></div>
      <div class="tab-panel ${state.inputTab === 'manual' ? '' : 'hidden'}" id="input-manual">
        <div class="field"><label for="input-instrument">Instrument</label><select id="input-instrument">${options}</select></div>
        <div class="field-row mt-12"><div class="field"><label for="input-value">Value</label><input id="input-value" type="number" step="any" placeholder="e.g. 78.64"></div><div class="field"><label for="input-source">Source</label><input id="input-source" placeholder="e.g. BSR Internal"></div></div>
        <div class="field-row mt-12"><div class="field"><label for="input-market-time">Market timestamp</label><input id="input-market-time" type="datetime-local" value="2026-11-14T09:45"></div><div class="field"><label for="input-quality">Quality state</label><select id="input-quality"><option value="Pending">Pending</option><option value="Valid">Valid</option></select></div></div>
        <div class="field mt-12"><label for="input-note">Note (optional)</label><input id="input-note" placeholder="Context for the reviewer"></div>
        <div id="input-preview" class="mt-12"></div>
        <div class="inline-note mt-12"><span class="note-mark">i</span><span>Manual data is marked as Manual and Pending until reviewed. Market time and ingestion time are stored separately. A duplicate check runs before confirmation.</span></div>
      </div>
      <div class="tab-panel ${state.inputTab === 'file' ? '' : 'hidden'}" id="input-file">
        <div class="field"><label for="input-file-name">Data file</label><input id="input-file-name" type="file" accept="${D.uploadLimits.extensions.join(',')}" aria-describedby="input-file-note input-file-error"></div>
        <div class="inline-note mt-12" id="input-file-note"><span class="note-mark">i</span><span>Supported demo formats: ${esc(D.uploadLimits.label)}, up to ${Math.round(D.uploadLimits.maxBytes / (1024 * 1024))} MB. The upload is validated, stored, classified and queued for extraction. It is not applied directly to market observations until reviewed.</span></div>
        <div id="input-file-error" class="mt-12" role="alert"></div>
        <div id="file-preview" class="mt-12"></div>
      </div>`;
    openModal('Quick data input', 'Add a market observation', body, `<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-copper" data-action="confirm-input">Preview & confirm</button>`);
  }

  function previewInput() {
    const value = parseFloat($('#input-value') ? $('#input-value').value : NaN);
    const source = $('#input-source') ? $('#input-source').value.trim() : '';
    const instrumentId = $('#input-instrument') ? $('#input-instrument').value : 'brent_futures';
    const preview = $('#input-preview');
    if (!preview) return;
    if (!Number.isFinite(value)) { preview.innerHTML = '<div class="inline-note"><span class="note-mark">!</span><span>Enter a numeric value before previewing. No data has been written.</span></div>'; return; }
    if (!source) { preview.innerHTML = '<div class="inline-note"><span class="note-mark">!</span><span>Enter a source before previewing. No data has been written.</span></div>'; return; }
    const i = instrument(instrumentId);
    preview.innerHTML = `<div class="formula-box"><div class="formula-id">Preview · not yet saved</div><p>${esc(i.name)} · ${fmtNum(value, i.decimals)} ${esc(i.unit)} · source ${esc(source)} · quality ${esc($('#input-quality') ? $('#input-quality').value : 'Pending')} · classification ${esc(i.classification)}.</p><span class="chip warn">Manual</span> <span class="chip">Pending review</span></div>`;
  }

  function confirmInput() {
    const value = parseFloat($('#input-value') ? $('#input-value').value : NaN);
    const source = $('#input-source') ? $('#input-source').value.trim() : '';
    const instrumentId = $('#input-instrument') ? $('#input-instrument').value : 'brent_futures';
    if (!Number.isFinite(value) || !source) { previewInput(); return; }
    const i = rawInstrument(instrumentId);
    const old = i.value;
    i.value = value; i.change = Math.round((value - old) * 100) / 100; i.pct = old ? Math.round((value - old) / old * 10000) / 100 : 0;
    i.source = source; i.dataStatus = 'Manual'; i.quality = $('#input-quality') ? $('#input-quality').value : 'Pending';
    i.marketTime = ($('#input-market-time') ? $('#input-market-time').value.replace('T', ' · ') : nowLabel()) + ' ICT';
    i.ingestionTime = nowLabel();
    state.audit.unshift({ time: nowLabel(), actor: role().name, role: role().label, action: 'Manual observation added', object: i.id, result: 'Succeeded', classification: i.classification });
    closeModal();
    render();
    showToast(t('{name} updated to {value} {unit}. Audit entry recorded.', { name: i.short, value: fmtNum(value, i.decimals), unit: i.unit }));
  }

  function openNewsInput() {
    if (!role().admin) { showToast(t('News import requires Market Intelligence access. This action is not available for your role.')); return; }
    openModal('News intake', 'Add a news item', `<div class="field"><label for="news-title-input">Headline</label><input id="news-title-input" placeholder="Headline from the source"></div><div class="field-row mt-12"><div class="field"><label for="news-source-input">Source</label><input id="news-source-input" placeholder="Reuters / Platts / internal"></div><div class="field"><label for="news-class">Classification</label><select id="news-class"><option value="Internal">Internal</option><option value="Public">Public</option><option value="Confidential">Confidential</option><option value="Restricted">Restricted</option></select></div></div><div class="field mt-12"><label for="news-summary-input">Summary or body</label><textarea id="news-summary-input" rows="4" placeholder="Paste the source content or a short summary"></textarea></div><div class="inline-note mt-12"><span class="note-mark">i</span><span>The item enters the processing pipeline: validation, extraction, metadata normalization, deduplication, classification and indexing. Original content is retained.</span></div>`, `<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-copper" data-action="confirm-news-input">Add to pipeline</button>`);
  }

  function confirmNewsInput() {
    const title = $('#news-title-input') ? $('#news-title-input').value.trim() : '';
    const source = $('#news-source-input') ? $('#news-source-input').value.trim() : '';
    if (!title || !source) { showToast(t('Headline and source are required. Nothing was saved.')); return; }
    const cls = $('#news-class') ? $('#news-class').value : 'Internal';
    const summaryInput = $('#news-summary-input');
    const summary = (summaryInput && summaryInput.value.trim()) || 'Awaiting processing.';
    const id = 'N-' + (2450 + state.audit.length);
    D.news.unshift({ id, title, source, published: nowLabel(), ingested: nowLabel(), topics: ['Other'], entities: [], classification: cls, status: 'Processing', relevance: 0, summary, original: summary, insight: 'AI insight will be generated after extraction and validation.', linked: [], duplicateOf: null, coverage: '1 source · processing' });
    state.audit.unshift({ time: nowLabel(), actor: role().name, role: role().label, action: 'News uploaded', object: id, result: 'Succeeded', classification: cls });
    closeModal(); render(); showToast(t('News item queued for processing. Original content retained; classification applied.'));
  }

  function openSearch() {
    openModal('Workspace search', 'Search instruments, news and reports', `<div class="field"><label for="global-search-input" class="sr-only">Search</label><input id="global-search-input" type="search" placeholder="Search instruments, news, reports…" autofocus></div><div id="search-results" class="mt-12"></div>`, `<button class="btn" data-action="close-modal">Close</button>`);
    renderSearchResults('');
    setTimeout(() => { const el = $('#global-search-input'); if (el) el.focus(); }, 30);
  }

  function renderSearchResults(q) {
    const box = $('#search-results');
    if (!box) return;
    const query = q.toLowerCase();
    const results = [];
    visibleInstruments().filter((i) => (i.name + ' ' + i.short + ' ' + i.ticker).toLowerCase().includes(query)).slice(0, 4).forEach((i) => results.push({ kind: 'instrument', id: i.id, label: i.name, meta: 'Market data · ' + i.priceType }));
    newsVisible().filter((n) => (n.title + ' ' + n.summary).toLowerCase().includes(query)).slice(0, 4).forEach((n) => results.push({ kind: 'news', id: n.id, label: n.title, meta: 'News · ' + n.source }));
    reportsVisible().filter((r) => r.title.toLowerCase().includes(query)).slice(0, 3).forEach((r) => results.push({ kind: 'report', id: r.id, label: r.title, meta: 'Report · v' + r.version }));
    box.innerHTML = results.length ? results.map((r) => `<button class="popover-item" data-action="search-result" data-kind="${r.kind}" data-id="${r.id}"><strong>${esc(r.label)}</strong><span>${esc(r.meta)}</span></button>`).join('') : '<div class="empty-state" style="padding:20px"><p>No permitted match. Try a different term.</p></div>';
  }

  function openNotifications() {
    const existing = $('#notif-popover');
    if (existing) { existing.remove(); return; }
    const top = $('.topbar').getBoundingClientRect();
    const pop = document.createElement('div');
    pop.className = 'popover';
    pop.id = 'notif-popover';
    pop.style.top = (top.bottom + 8) + 'px';
    pop.style.right = '20px';
    pop.innerHTML = `<h4>Notifications</h4><button class="popover-item" data-action="notify-route" data-route="market-data"><strong>Data freshness</strong><span>2 delayed feeds · USD/VND and DXY</span></button><button class="popover-item" data-action="notify-route" data-route="forecast"><strong>Forecast activity</strong><span>EIA Brent v3 added · 12 Nov 2026</span></button><button class="popover-item" data-action="notify-route" data-route="admin"><strong>Permission check</strong><span>1 denied Restricted request · audit logged</span></button><button class="popover-item" data-action="notify-route" data-route="reports"><strong>Report ready</strong><span>Morning Briefing R-2026-041 v2</span></button>`;
    document.body.appendChild(pop);
    setTimeout(() => {
      const closer = (e) => { if (!pop.contains(e.target) && !e.target.closest('[data-action="open-notifications"]')) { pop.remove(); document.removeEventListener('click', closer); } };
      document.addEventListener('click', closer);
    }, 0);
  }

  function openUserMenu() {
    const existing = $('#user-popover');
    if (existing) { existing.remove(); return; }
    const pop = document.createElement('div');
    pop.className = 'popover';
    pop.id = 'user-popover';
    pop.style.bottom = '16px'; pop.style.left = '16px';
    pop.innerHTML = `<h4>${esc(role().name)}</h4><div class="small muted" style="margin-bottom:8px">${esc(role().label)} · ${esc(role().department)}</div><div class="context-row"><span class="c-name">Classification ceiling</span><span class="c-value">${esc(role().maxClassification)}</span></div><div class="context-row"><span class="c-name">Export</span><span class="c-value">${role().export ? 'Allowed' : 'Denied'}</span></div><div class="context-row"><span class="c-name">Admin</span><span class="c-value">${role().admin ? 'Allowed' : 'Denied'}</span></div><button class="btn btn-sm mt-12" data-action="sign-out" style="width:100%">Sign out to role selection</button>`;
    document.body.appendChild(pop);
    setTimeout(() => {
      const closer = (e) => { if (!pop.contains(e.target) && !e.target.closest('[data-action="open-user-menu"]')) { pop.remove(); document.removeEventListener('click', closer); } };
      document.addEventListener('click', closer);
    }, 0);
  }

  function generateReport() {
    const type = $('#report-type') ? $('#report-type').value : state.reportType;
    const range = $('#report-range') ? $('#report-range').value : state.reportRange;
    const scope = $('#report-scope') ? $('#report-scope').value : state.reportScope;
    if (scope.indexOf('Restricted') >= 0 && !role().viewRestricted) { showToast(t('Restricted scope is not permitted for your role. No report was generated.')); return; }
    const id = 'R-2026-' + String(50 + state.reports.length).padStart(3, '0');
    const now = nowLabel();
    const r = { id, type, title: `${type} — ${range} market read`, range, scope, created: now, cutOff: now, version: 1, requester: role().name, status: 'Final', classification: scope.indexOf('Restricted') >= 0 ? 'Restricted' : 'Internal', sources: ['SRC-ICE', 'SRC-CME', 'SRC-PLATTS', 'SRC-NEWS-2411'] };
    state.reports.unshift(r);
    state.audit.unshift({ time: now, actor: role().name, role: role().label, action: 'Report generated', object: id + ' v1', result: 'Succeeded', classification: r.classification });
    render();
    openReportDrawer(id);
    showToast(t('Report generated and versioned. Sources and data cut-off frozen.'));
  }

  function regenerateReport(id) {
    const previous = state.reports.find((x) => x.id === id);
    if (!previous || !canSee(previous.classification)) return;
    const now = nowLabel();
    const nextVersion = Math.max(0, ...state.reports.filter((x) => x.type === previous.type).map((x) => x.version)) + 1;
    const nextId = 'R-2026-' + String(50 + state.reports.length).padStart(3, '0');
    const next = { ...previous, id: nextId, version: nextVersion, created: now, cutOff: now, status: 'Final' };
    state.reports.unshift(next);
    state.audit.unshift({ time: now, actor: role().name, role: role().label, action: 'Report regenerated', object: nextId + ' v' + nextVersion, result: 'Succeeded', classification: next.classification });
    render();
    openReportDrawer(nextId);
    showToast(t('Report v{v} generated from the stored scope. The prior version is unchanged.', { v: nextVersion }));
  }

  function adjustReport(id) {
    const r = state.reports.find((x) => x.id === id);
    if (!r) return;
    state.reportType = r.type;
    state.reportScope = r.scope || state.reportScope;
    state.reportQuestion = '';
    if (['Last 7 days', 'Last 30 days', 'Last 90 days', 'Week to date', 'Month to date'].includes(r.range)) state.reportRange = r.range;
    closeOverlays();
    navigate('reports');
    setTimeout(() => { const field = $('#report-type'); if (field) field.focus(); }, 50);
    showToast(t('Report scope loaded into the builder. Generating creates a new version; the stored report is unchanged.'));
  }

  function exportReport(id) {
    const r = state.reports.find((x) => x.id === id);
    if (!r) return;
    if (!role().export) {
      state.audit.unshift({ time: nowLabel(), actor: role().name, role: role().label, action: 'Report export denied', object: id, result: 'Denied', classification: r.classification });
      showToast(t('Export denied: your role can view this report but cannot export it. The attempt was recorded in the audit log.'));
      return;
    }
    const root = $('#print-root');
    if (!root) return;
    root.innerHTML = reportPreviewHTML(r);
    document.body.classList.add('printing-report');
    window.print();
    window.setTimeout(() => { document.body.classList.remove('printing-report'); root.innerHTML = ''; }, 600);
    state.audit.unshift({ time: nowLabel(), actor: role().name, role: role().label, action: 'Report exported', object: id, result: 'Succeeded', classification: r.classification });
  }

  function showToast(message) {
    const stack = $('#toast-stack');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span>${ico('check', 14)}</span><span>${esc(message)}</span><button class="toast-close" aria-label="Dismiss notification">×</button>`;
    stack.appendChild(el);
    I18N.applyI18n(el);
    const close = () => el.remove();
    el.querySelector('.toast-close').addEventListener('click', close);
    setTimeout(close, 5200);
  }

  function navigate(route) {
    closeOverlays();
    state.mobileNav = false;
    if (state.route === route) { state.route = route; render(); }
    else location.hash = '#' + route;
  }

  /* ---------- Events ---------- */
  function onClick(e) {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    if (action === 'close-overlays') { closeOverlays(); return; }
    if (el.tagName === 'A' && el.getAttribute('href') && action !== 'navigate') {
      // let normal hash navigation occur, but close overlays first
      closeOverlays();
      return;
    }
    e.preventDefault();
    switch (action) {
      case 'set-lang': I18N.setLang(el.dataset.lang); break;
      case 'set-theme': setTheme(el.dataset.theme); break;
      case 'login': {
        const next = el.dataset.role;
        state.pendingRole = next;
        state.signingIn = true;
        render();
        setTimeout(() => { state.signingIn = false; state.role = next; state.route = 'overview'; history.pushState(null, '', '#overview'); render(); }, 600);
        break;
      }
      case 'toggle-sidebar': state.sidebarCollapsed = !state.sidebarCollapsed; render(); break;
      case 'toggle-mobile-nav': state.mobileNav = !state.mobileNav; $('#sidebar').classList.toggle('mobile-open', state.mobileNav); break;
      case 'open-metric': closeOverlays(); openMetricDrawer(instrument(el.dataset.instrument)); break;
      case 'set-range': state.range = Number(el.dataset.range); render(); break;
      case 'select-instrument': state.selectedInstrument = el.dataset.instrument; state.compare = false; render(); break;
      case 'toggle-table': { const target = document.getElementById(el.dataset.target); if (target) { target.classList.toggle('hidden'); const open = !target.classList.contains('hidden'); el.setAttribute('aria-expanded', String(open)); el.textContent = t(open ? 'Hide data table' : 'View data table'); } break; }
      case 'open-news': openNewsDrawer(el.dataset.news); break;
      case 'feedback': doFeedback(el.dataset.news, el.dataset.kind); break;
      case 'important': state.important[el.dataset.news] = !state.important[el.dataset.news]; render(); showToast(t(state.important[el.dataset.news] ? 'Marked important for follow-up.' : 'Removed from important items.')); break;
      case 'open-forecast': openForecastDrawer(el.dataset.forecast); break;
      case 'open-quick-input': openQuickInput(); break;
      case 'input-tab': state.inputTab = el.dataset.tab; openQuickInput(); break;
      case 'preview-input': previewInput(); break;
      case 'confirm-input': if (state.inputTab === 'file') confirmFileInput(); else confirmInput(); break;
      case 'generate-briefing': generateBriefing(); break;
      case 'open-briefing': openBriefingDrawer(); break;
      case 'suggest': { const ta = $('#quick-query-input'); if (ta) { ta.value = el.dataset.q; ta.focus(); } break; }
      case 'send-quick-query': { const ta = $('#quick-query-input'); if (ta) ask(ta.value); break; }
      case 'send-chat': { const ta = $('#chat-input'); if (ta) ask(ta.value); break; }
      case 'prompt': ask(el.dataset.q); break;
      case 'attach-doc': openAttach(); break;
      case 'remove-attachment': state.attachment = ''; render(); break;
      case 'open-search': openSearch(); break;
      case 'search-result': { closeModal(); const kind = el.dataset.kind; const id = el.dataset.id; if (kind === 'instrument') { state.selectedInstrument = id; navigate('market-data'); } else if (kind === 'news') { state.pendingOpenNews = id; navigate('news'); } else if (kind === 'report') { navigate('reports'); setTimeout(() => openReportDrawer(id), 30); } break; }
      case 'open-notifications': openNotifications(); break;
      case 'notify-route': { const p = $('#notif-popover'); if (p) p.remove(); navigate(el.dataset.route); break; }
      case 'open-user-menu': openUserMenu(); break;
      case 'sign-out': { const p = $('#user-popover'); if (p) p.remove(); state.chat = []; state.route = 'login'; history.pushState(null, '', '#login'); render(); break; }
      case 'open-source': openSource(el.dataset.route, el.dataset.id); break;
      case 'open-event': openEventDrawer(D.events[Number(el.dataset.event)]); break;
      case 'open-report': openReportDrawer(el.dataset.report); break;
      case 'export-report': exportReport(el.dataset.report); break;
      case 'generate-report': generateReport(); break;
      case 'regenerate-report': regenerateReport(el.dataset.report); break;
      case 'adjust-report': adjustReport(el.dataset.report); break;
      case 'answer-report': {
        state.reportType = 'On-demand Market Analysis';
        state.reportScope = 'Market overview, news and analysis';
        state.reportQuestion = el.dataset.question || '';
        navigate('reports');
        setTimeout(() => { const field = $('#report-type'); if (field) field.focus(); }, 50);
        showToast(t('Report builder prefilled from the assistant thread. Review the scope, then generate a versioned report.'));
        break;
      }
      case 'answer-analysis': navigate('analysis'); break;
      case 'create-analysis-report': { state.reportType = 'Event-driven Market Report'; navigate('reports'); setTimeout(generateReport, 40); break; }
      case 'open-analysis-versions': showToast(t('Analysis versioning is enabled. This demo retains v1 and exposes the evidence ledger.')); break;
      case 'open-analysis-sources': showToast(t('Source ledger: ICE, CME, Platts, Reuters, BSR Analytical, formula CS-GAS-2.1.')); break;
      case 'export-policy': showToast(t(role().export ? 'Export allowed for your role. Downloads and prints are audited.' : 'Export denied for your role. Viewing remains available.')); break;
      case 'export-data': if (role().export) { state.audit.unshift({ time: nowLabel(), actor: role().name, role: role().label, action: 'Market data exported', object: state.selectedInstrument, result: 'Succeeded', classification: instrument(state.selectedInstrument).classification }); showToast(t('CSV export simulated. Audit entry recorded.')); } else showToast(t('Export denied: export permission is separate from view permission.')); break;
      case 'export-forecast': if (role().export) showToast(t('Forecast export simulated. Audit entry recorded.')); else showToast(t('Export denied: export permission is separate from view permission.')); break;
      case 'export-audit': if (role().admin) showToast(t('Audit export simulated. In production this is a restricted, audited export.')); else showToast(t('Administration permission required.')); break;
      case 'open-report-builder': { const f = $('#report-type'); if (f) f.focus(); else navigate('reports'); break; }
      case 'add-forecast': openForecastInput(); break;
      case 'open-forecast-input': openForecastInput(); break;
      case 'confirm-forecast-input': confirmForecastInput(); break;
      case 'open-news-input': openNewsInput(); break;
      case 'confirm-news-input': confirmNewsInput(); break;
      case 'mark-all-reviewed': showToast(t('All permitted visible items marked reviewed for this demo session.')); break;
      case 'close-drawer': closeDrawer(); break;
      case 'close-modal': closeModal(); break;
      case 'close-overlays': closeOverlays(); break;
      case 'navigate': navigate(el.dataset.route); break;
      case 'confirm-file-input': confirmFileInput(); break;
      case 'open-file': { const inp = $('#input-file-name'); if (inp) inp.click(); break; }
      case 'open-ai-settings': openAiSettingsModal(); break;
      case 'save-ai-settings': saveAiSettingsFromModal(); break;
      case 'clear-ai-settings': clearAiSettingsFromModal(); break;
      case 'test-ai-connection': testAiConnectionFromModal(); break;
      case 'toggle-key-view': toggleKeyVisibility(); break;
      default: break;
    }
  }

  function onChange(e) {
    if (e.target.id === 'ai-provider') {
      const isDeepSeek = e.target.value === 'deepseek';
      const deepseekBox = $('#ai-deepseek-settings');
      const aukerBox = $('#ai-auker-desc');
      if (deepseekBox) deepseekBox.style.display = isDeepSeek ? 'block' : 'none';
      if (aukerBox) aukerBox.style.display = isDeepSeek ? 'none' : 'block';
    }
    if (e.target.id === 'role-switch') {
      state.role = e.target.value;
      state.mobileNav = false;
      render();
      const roleSelect = $('#role-switch');
      if (roleSelect) roleSelect.focus();
      showToast(t('Demo role switched. Visible data and actions update to the new permission scope.'));
    }
    if (e.target.id === 'news-topic') { state.newsTopic = e.target.value; filterNews(); }
    if (e.target.id === 'news-source') { state.newsSource = e.target.value; filterNews(); }
    if (e.target.id === 'compare-toggle') { state.compare = e.target.checked; render(); }
    if (e.target.id === 'forecast-source') { state.forecastSource = e.target.value; render(); }
    if (e.target.id === 'forecast-instrument') { state.forecastInstrument = e.target.value; render(); }
    if (e.target.id === 'input-file-name') {
      const f = e.target.files && e.target.files[0];
      const box = $('#file-preview');
      if (!f) return;
      const problem = validateUpload(f);
      if (box) box.innerHTML = `<div class="formula-box"><div class="formula-id">Selected file</div><p>${esc(f.name)} · ${Math.ceil(f.size / 1024)} KB · ${t(problem ? 'rejected, see the error above' : 'queued for validation and extraction on confirm')}.</p></div>`;
      renderFileError(problem);
    }
    if (e.target.id === 'report-type') state.reportType = e.target.value;
    if (e.target.id === 'report-range') state.reportRange = e.target.value;
    if (e.target.id === 'report-scope') state.reportScope = e.target.value;
  }

  function onInput(e) {
    if (e.target.id === 'news-search') { state.newsQuery = e.target.value; filterNews(); }
    if (e.target.id === 'global-search-input') renderSearchResults(e.target.value);
    if (e.target.id === 'chat-input') state.chatDraft = e.target.value;
    if (e.target.id === 'quick-query-input') { /* transient */ }
    if (['input-value', 'input-source', 'input-instrument', 'input-quality'].includes(e.target.id)) previewInput();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      if ($('#modal') && $('#modal').classList.contains('open')) closeModal();
      else if ($('#drawer') && $('#drawer').classList.contains('open')) closeDrawer();
      else { const p = $('#notif-popover') || $('#user-popover'); if (p) p.remove(); }
    }
    if (e.key === 'Enter' && (e.target.id === 'chat-input') && !e.shiftKey) { e.preventDefault(); ask(e.target.value); }
    if (e.key === 'Enter' && e.target.id === 'global-search-input') { const first = $('#search-results .popover-item'); if (first) first.click(); }
    if (e.key === 'Tab') trapFocus(e, '#modal');
    if (e.key === 'Tab') trapFocus(e, '#drawer');
  }

  function trapFocus(e, sel) {
    const overlay = $(sel);
    if (!overlay || !overlay.classList.contains('open')) return false;
    // keep focus inside the open drawer or modal so the aria-modal contract holds
    const focusables = $$(sel + ' button, ' + sel + ' a, ' + sel + ' input, ' + sel + ' select, ' + sel + ' textarea, ' + sel + ' [tabindex="0"]').filter((x) => !x.disabled && x.offsetParent !== null);
    if (!focusables.length) return false;
    const first = focusables[0], last = focusables[focusables.length - 1];
    const inside = overlay.contains(document.activeElement);
    if (e.shiftKey) {
      if (!inside || document.activeElement === first) { e.preventDefault(); last.focus(); return true; }
      return false;
    }
    if (!inside || document.activeElement === last) { e.preventDefault(); first.focus(); return true; }
    return false;
  }

  function doFeedback(id, kind) {
    syncNewsFilter();
    state.feedback[id] = state.feedback[id] || {};
    state.feedback[id][kind] = !state.feedback[id][kind];
    state.audit.unshift({ time: nowLabel(), actor: role().name, role: role().label, action: 'News feedback: ' + kind, object: id, result: 'Succeeded', classification: (D.news.find((n) => n.id === id) || {}).classification || 'Internal' });
    render();
    showToast(t(kind === 'duplicate' ? 'Duplicate report saved for review. The source remains visible.' : 'Feedback saved with your name and timestamp.'));
  }

  function generateBriefing() {
    state.briefingVersion += 1;
    const id = 'R-2026-' + String(60 + state.briefingVersion).padStart(3, '0');
    const r = { id, type: 'Morning Briefing', title: 'Morning briefing — supply risk meets product strength', range: '13–14 Nov 2026', created: nowLabel(), cutOff: nowLabel(), version: state.briefingVersion, requester: role().name, status: 'Final', classification: 'Internal', sources: ['SRC-ICE', 'SRC-PLATTS', 'SRC-NEWS-2411', 'SRC-NEWS-2410'] };
    state.reports.unshift(r);
    state.audit.unshift({ time: nowLabel(), actor: role().name, role: role().label, action: 'Briefing generated', object: id + ' v' + r.version, result: 'Succeeded', classification: 'Internal' });
    render();
    openBriefingDrawer();
    showToast(t('Briefing v{v} generated. Prior versions retained.', { v: state.briefingVersion }));
  }

  function openForecastInput() {
    if (!role().admin) { showToast(t('Forecast management requires Market Intelligence access.')); return; }
    const options = visibleInstruments().map((i) => `<option value="${i.id}">${esc(i.name)}</option>`).join('');
    openModal('Forecast register', 'Add a forecast version', `<div class="field"><label for="forecast-source-input">Source</label><input id="forecast-source-input" placeholder="e.g. EIA / IEA / BSR Internal"></div><div class="field mt-12"><label for="forecast-instrument-input">Instrument</label><select id="forecast-instrument-input">${options}</select></div><div class="field-row mt-12"><div class="field"><label for="forecast-value-input">Value</label><input id="forecast-value-input" type="number" step="any"></div><div class="field"><label for="forecast-period-input">Period</label><input id="forecast-period-input" placeholder="e.g. Q1 2027"></div></div><div class="field mt-12"><label for="forecast-method-input">Methodology</label><input id="forecast-method-input" placeholder="Method or model name"></div><div class="inline-note mt-12"><span class="note-mark">i</span><span>A new immutable version is created; prior versions are never overwritten. Actuals are compared later by the forecast evaluator.</span></div>`, `<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-copper" data-action="confirm-forecast-input">Add version</button>`);
  }

  function confirmForecastInput() {
    const source = $('#forecast-source-input') ? $('#forecast-source-input').value.trim() : '';
    const value = parseFloat($('#forecast-value-input') ? $('#forecast-value-input').value : NaN);
    if (!source || !Number.isFinite(value)) { showToast(t('Source and numeric value are required. Nothing was saved.')); return; }
    const id = 'F-' + (200 + D.forecasts.length);
    const i = instrument($('#forecast-instrument-input').value);
    D.forecasts.unshift({ id, source, instrument: i.id, instrumentLabel: i.name, value, period: $('#forecast-period-input').value || 'Next quarter', horizon: '3-month', published: nowLabel(), ingested: nowLabel(), version: 1, methodology: $('#forecast-method-input').value || 'User supplied', classification: i.classification, actual: null, previous: null });
    state.audit.unshift({ time: nowLabel(), actor: role().name, role: role().label, action: 'Forecast version added', object: id, result: 'Succeeded', classification: i.classification });
    closeModal(); render(); showToast(t('Forecast version added. Prior versions retained.'));
  }

  function openAttach() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.pdf,.doc,.docx,.txt';
    input.addEventListener('change', () => {
      const f = input.files && input.files[0];
      if (f) { state.attachment = f.name; render(); showToast(t('Document attached to the AI context. Classification and permission checks will apply.')); }
    });
    input.click();
  }

  function validateUpload(file) {
    if (!file) return t('Choose a file before confirming. Nothing was uploaded.');
    const ext = (file.name.match(/\.[^.]+$/) || [''])[0].toLowerCase();
    if (!D.uploadLimits.extensions.includes(ext)) return t('Unsupported format ({ext}). Allowed: {allowed}. Nothing was stored.', { ext: ext || t('no extension'), allowed: D.uploadLimits.label });
    if (file.size > D.uploadLimits.maxBytes) return t('File is {size} MB, above the {limit} MB limit. Nothing was stored.', { size: (file.size / (1024 * 1024)).toFixed(1), limit: Math.round(D.uploadLimits.maxBytes / (1024 * 1024)) });
    return null;
  }

  function renderFileError(message) {
    const box = $('#input-file-error');
    if (!box) return;
    if (!message) { box.innerHTML = ''; return; }
    box.innerHTML = `<div class="inline-note"><span class="note-mark">!</span><span><strong>${esc(t('Upload rejected.'))}</strong> ${esc(message)} ${esc(t('The selected file is kept below so you can retry with a supported file.'))}</span></div>`;
  }

  function confirmFileInput() {
    const file = $('#input-file-name') && $('#input-file-name').files && $('#input-file-name').files[0];
    const problem = validateUpload(file);
    if (problem) { renderFileError(problem); showToast(t('Upload rejected. {reason}', { reason: problem })); return; }
    renderFileError('');
    const id = 'N-' + (2460 + state.audit.length);
    D.news.unshift({ id, title: file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '), source: 'BSR Internal', published: nowLabel(), ingested: nowLabel(), topics: ['Other'], entities: [], classification: 'Internal', status: 'Processing', relevance: 0, summary: 'Uploaded document queued for text extraction, classification and indexing.', original: 'Original file retained in object storage (demo simulation).', insight: 'AI insight will be generated after extraction and validation.', linked: [], duplicateOf: null, coverage: '1 document · processing' });
    state.audit.unshift({ time: nowLabel(), actor: role().name, role: role().label, action: 'Document uploaded', object: id + ' · ' + file.name, result: 'Succeeded', classification: 'Internal' });
    closeModal(); render(); showToast(t('Document uploaded and queued for processing. Original retained; classification applied.'));
  }

  document.addEventListener('DOMContentLoaded', init);
})();
