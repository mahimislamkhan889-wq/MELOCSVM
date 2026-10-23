/* SKILL ITBD Tracker — app logic (no framework). */
(function () {
  "use strict";

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ESC[c]);
  const icon = (name, cls = "") => `<svg class="icon ${cls}"><use href="/icons.svg#${name}"/></svg>`;

  const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
  const full = new Intl.NumberFormat("en");
  const fmt = (n) => (n >= 10000 ? compact.format(n) : full.format(Math.round(n)));
  const fmtFull = (n) => full.format(Math.round(n));
  const fmt1 = (n) => (n >= 1000 ? compact.format(n) : n.toFixed(1));

  const MONTH_MS = 30.44 * 24 * 3600 * 1000;
  const TYPE_LABEL = { photo: "Photo", illustration: "Illustration", vector: "Vector", video: "Video", "3d": "3D", template: "Template" };
  const TYPE_COLOR = { photo: "--c-photo", illustration: "--c-illustration", vector: "--c-vector", video: "--c-video" };
  const SORT_LABEL = { relevance: "Relevance", downloads: "Most downloaded", newest: "Newest", featured: "Featured", undiscovered: "Undiscovered" };
  const TYPE_CHIPS = [
    ["all", "All types", "circle", "--c-all"],
    ["photo", "Photos", "image", "--c-photo"],
    ["illustration", "Illustrations", "palette", "--c-illustration"],
    ["vector", "Vectors", "pen", "--c-vector"],
    ["video", "Videos", "video", "--c-video"],
  ];
  const MODE_OPTS = {
    search: { sorts: ["relevance", "downloads", "newest", "featured", "undiscovered"], limits: [24, 48, 100, 200] },
    portfolio: { sorts: ["downloads", "newest", "relevance"], limits: [48, 100, 200] },
  };
  const ROUTE_TITLE = { search: "Keywords", portfolio: "Portfolio", saved: "Saved", settings: "Settings" };
  const KEY_URL = "https://console.apify.com/settings/integrations";
  const contacts = () => (window.SIT_SITE?.contact || []).filter((c) => c.url);

  function monthsSince(iso) {
    if (!iso) return 1;
    return Math.max((Date.now() - new Date(iso).getTime()) / MONTH_MS, 1);
  }

  const dmo = (a) => a.downloads / monthsSince(a.createdAt);

  function ago(iso) {
    if (!iso) return "—";
    const days = (Date.now() - new Date(iso).getTime()) / 86400000;
    if (days < 1) return "today";
    if (days < 30) return `${Math.floor(days)}d`;
    if (days < 365) return `${Math.floor(days / 30.44)}mo`;
    return `${(days / 365.25).toFixed(days < 3650 ? 1 : 0).replace(/\.0$/, "")}y`;
  }

  // "today", "5 days ago", "1 month ago", "1 year ago", "2.7 years ago"
  function agoLong(iso) {
    if (!iso) return "Unknown";
    const days = (Date.now() - new Date(iso).getTime()) / 86400000;
    const plural = (n, unit) => `${n} ${unit}${n === 1 ? "" : "s"} ago`;
    if (days < 1) return "Today";
    if (days < 30.44) return plural(Math.floor(days), "day");
    if (days < 365.25) return plural(Math.floor(days / 30.44), "month");
    const years = days / 365.25;
    return years < 10 ? `${years.toFixed(1).replace(/\.0$/, "")} year${years < 1.05 ? "" : "s"} ago` : plural(Math.floor(years), "year");
  }

  function dateLabel(iso) {
    if (!iso) return "Unknown";
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  function initials(name) {
    const parts = String(name || "?").trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]).join("").toUpperCase() || "?";
  }

  function creatorUrl(id) {
    return `https://stock.adobe.com/search?creator_id=${encodeURIComponent(id)}`;
  }

  const isDesktop = () => window.matchMedia("(min-width: 1024px)").matches;

  // ---------------------------------------------------------------------
  // Local storage (always wrapped — storage can be unavailable)
  // ---------------------------------------------------------------------

  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem("sit." + key);
        return v == null ? fallback : JSON.parse(v);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem("sit." + key, JSON.stringify(value));
      } catch {}
    },
    remove(key) {
      try {
        localStorage.removeItem("sit." + key);
      } catch {}
    },
  };

  const prefs = Object.assign({ limit: 100, hideAI: false, view: "grid", sidebar: true, sections: {} }, store.get("prefs", {}));
  const savePrefs = () => store.set("prefs", prefs);

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------

  const assetIndex = new Map();

  function makeCtx(mode, defaults) {
    return {
      mode,
      q: "",
      type: "all",
      sort: defaults.sort,
      limit: defaults.limit,
      data: null,
      error: null,
      loading: false,
      controller: null,
      clientSort: "scan",
      view: prefs.view,
    };
  }

  const ctx = {
    search: makeCtx("search", { sort: "relevance", limit: prefs.limit }),
    portfolio: makeCtx("portfolio", { sort: "downloads", limit: 100 }),
  };

  // ---------------------------------------------------------------------
  // Toasts
  // ---------------------------------------------------------------------

  function toast(message, iconName = "check") {
    const el = document.createElement("div");
    el.className = "toast" + (iconName === "x" ? " is-error" : "");
    el.innerHTML = `${icon(iconName, "icon-sm")}<span>${esc(message)}</span>`;
    $("#toasts").appendChild(el);
    setTimeout(() => {
      el.style.transition = "opacity .2s ease";
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 220);
    }, 2400);
  }

  async function copy(text, label = "Copied") {
    try {
      await navigator.clipboard.writeText(text);
      toast(label);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        toast(label);
      } catch {
        toast("Copy failed", "x");
      }
      ta.remove();
    }
  }

  // ---------------------------------------------------------------------
  // API (PHP backend in api/*.php, same origin, cookie session)
  // ---------------------------------------------------------------------

  class ApiError extends Error {
    constructor(message, status, body) {
      super(message);
      this.status = status;
      this.code = body?.code || null;
      this.body = body || {};
    }
  }

  async function api(path, { method = "GET", body, signal } = {}) {
    let res;
    try {
      res = await fetch("api/" + path, {
        method,
        credentials: "same-origin",
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
        signal,
      });
    } catch (err) {
      if (err.name === "AbortError") throw err;
      throw new ApiError("Can’t reach SKILL ITBD Tracker. Check your connection.", 0);
    }
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      goToLogin();
      throw new ApiError("Please sign in.", 401, data);
    }
    if (typeof data.credits === "number") setCredits(data.credits);
    if (!res.ok) throw new ApiError(data.error || "Something went wrong.", res.status, data);
    return data;
  }

  function goToLogin() {
    const next = location.pathname + location.search + location.hash;
    location.replace("/login.html?next=" + encodeURIComponent(next));
  }

  const sleep = (ms, signal) =>
    new Promise((resolve, reject) => {
      const t = setTimeout(resolve, ms);
      signal?.addEventListener("abort", () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });

  // Start a scan, then poll until Apify finishes. Credits are charged on start
  // and refunded by the server if the scan fails.
  async function fetchAssets(c, signal, fresh) {
    let res = await api("scan.php", {
      method: "POST",
      body: { q: c.q, mode: c.mode, sort: c.sort, type: c.type, limit: c.limit, fresh },
      signal,
    });
    if (res.charged) toast(account?.scan_cost > 1 ? account.scan_cost + " credits used" : "1 credit used", "zap");
    while (res.status === "running") {
      await sleep(1500, signal);
      res = await api("scan.php?id=" + encodeURIComponent(res.scanId), { signal });
    }
    if (res.status === "failed") throw new ApiError(res.error || "The scan failed.", 200, res);
    return res.result;
  }

  const queryKey = (c) => JSON.stringify([c.q, c.type, c.sort]);

  async function run(c, { fresh = false } = {}) {
    if (!c.q) return;
    if (c.controller) c.controller.abort();
    const controller = new AbortController();
    c.controller = controller;
    c.activeKey = queryKey(c);
    c.loading = true;
    c.error = null;
    c.errorCode = null;
    render(c);
    setBusy(c, true);

    try {
      const data = await fetchAssets(c, controller.signal, fresh);
      if (c.controller !== controller) return;
      data.items.forEach((a) => assetIndex.set(a.id, a));
      c.data = data;
      remember(c);
      if (c.mode === "portfolio") refreshSavedCreator(c.q, data.items);
    } catch (err) {
      if (c.controller !== controller || err.name === "AbortError") return;
      c.error = err.message || "Something went wrong.";
      c.errorCode = err.code || null;
      c.data = null;
    } finally {
      // Only the newest scan for this view may update the UI.
      if (c.controller === controller) {
        c.controller = null;
        c.loading = false;
        setBusy(c, false);
        render(c);
      }
    }
  }

  function setBusy(c, busy) {
    const btn = $(c.mode === "search" ? "#searchBtn" : "#portfolioBtn");
    btn.disabled = busy;
    btn.classList.toggle("is-loading", busy);
  }

  // ---------------------------------------------------------------------
  // Account & credits
  // ---------------------------------------------------------------------

  let account = null;

  function setCredits(n) {
    if (!account) return;
    account.credits = n;
    renderAccount();
  }

  function expiryLabel() {
    if (!account?.expires_at) return "";
    if (account.expired) return "Expired";
    const d = new Date(account.expires_at);
    return "Until " + d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  function expiryLong() {
    if (!account?.expires_at) return "Your credits don’t expire.";
    const d = dateLabel(account.expires_at);
    return account.expired ? `Expired on ${d}.` : `Valid until ${d}.`;
  }

  function renderAccount() {
    if (!account) return;
    const low = account.credits <= 0 || account.expired;
    $$("[data-credits]").forEach((el) => (el.textContent = fmtFull(account.credits)));
    $$("[data-credit-expiry]").forEach((el) => (el.textContent = expiryLabel()));
    $$("[data-credit-expiry-long]").forEach((el) => (el.textContent = expiryLong()));
    $$("[data-username]").forEach((el) => (el.textContent = account.name || account.username));
    $$("[data-account-detail]").forEach((el) => {
      const bits = [account.email, account.google ? "Google account" : ""].filter(Boolean);
      el.textContent = bits.length ? " · " + bits.join(" · ") : "";
    });
    // Google photo in the account button (falls back to the user icon).
    const userBtn = $("#userBtn");
    if (userBtn) {
      const old = userBtn.querySelector(".user-avatar");
      if (account.avatar && !old) {
        const img = document.createElement("img");
        img.className = "user-avatar";
        img.alt = "";
        img.referrerPolicy = "no-referrer";
        img.src = account.avatar;
        img.onerror = () => img.remove();
        userBtn.querySelector(".icon").replaceWith(img);
      }
    }
    $$(".credit-card, .credit-pill, .credit-btn").forEach((el) => el.classList.toggle("is-empty", low));
    $$(".credit-btn").forEach((el) => (el.title = low ? "Out of credits — contact SKILL ITBD" : `Your credits${account.expires_at ? " · " + expiryLabel().toLowerCase() : ""}`));

    const connected = !!account.apify_connected;
    $$("[data-apify-status]").forEach((el) => {
      const inCard = !!el.closest(".credit-card");
      el.querySelector(".dot").className = "dot " + (connected ? "ok" : "warn");
      el.querySelector(".key-status-text").textContent = connected
        ? inCard
          ? "Apify connected"
          : account.apify_username
            ? "Connected as " + account.apify_username
            : "Connected"
        : inCard
          ? "Apify not connected"
          : "Not connected";
    });
    if (account.apify_key_url) $$("[data-apify-link]").forEach((a) => (a.href = account.apify_key_url));
    const remove = $("#apifyKeyRemove");
    if (remove) remove.hidden = !connected;
    const input = $("#apifyKeyInput");
    if (input) input.placeholder = connected ? "Paste a new key to replace the saved one" : "apify_api_…";
  }

  // Shown above the empty state when the user hasn't added their Apify key.
  function connectCallout() {
    if (!account || account.apify_connected) return "";
    return `<div class="connect-callout">
      <span class="empty-icon">${icon("key", "icon-lg")}</span>
      <div>
        <strong>Connect your Apify account</strong>
        <p>Scans run on your own Apify account. Add your API key to start.</p>
      </div>
      <div class="btn-row">
        <a class="btn btn-primary btn-sm" href="#/settings" data-focus-key>Add API key</a>
        <a class="btn btn-sm" href="${esc(account.apify_key_url || KEY_URL)}" target="_blank" rel="noopener">Get a key${icon("external", "icon-sm")}</a>
      </div>
    </div>`;
  }

  function contactButtons() {
    const list = contacts();
    if (!list.length) return "";
    return `<div class="btn-row center">${list
      .map((c) => `<a class="btn btn-brand btn-sm" href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.label)}</a>`)
      .join("")}</div>`;
  }

  async function loadAccount() {
    const { user } = await api("me.php");
    account = user;
    renderAccount();
  }

  async function signOut() {
    try {
      await api("logout.php", { method: "POST" });
    } catch {}
    location.replace("/login.html");
  }

  // ---------------------------------------------------------------------
  // Recent & saved
  // ---------------------------------------------------------------------

  function remember(c) {
    const items = c.data?.items || [];
    const label = c.mode === "portfolio" ? items[0]?.creatorName || `#${c.q}` : c.q;
    const recent = store.get("recent", []).filter((r) => !(r.mode === c.mode && r.q.toLowerCase() === c.q.toLowerCase()));
    recent.unshift({ q: c.q, mode: c.mode, label, at: Date.now() });
    store.set("recent", recent.slice(0, 12));
    renderSideRecent();
  }

  function renderSideRecent() {
    const recent = store.get("recent", []).slice(0, 6);
    const el = $("#sideRecent");
    el.hidden = !recent.length;
    if (!recent.length) {
      el.innerHTML = "";
      return;
    }
    el.innerHTML =
      `<p class="side-label">Recent</p>` +
      recent
        .map((r) => {
          const href = r.mode === "portfolio" ? `#/portfolio/${encodeURIComponent(r.q)}` : `#/search?q=${encodeURIComponent(r.q)}`;
          return `<a href="${href}">${icon(r.mode === "portfolio" ? "user" : "search", "icon-sm")}<span>${esc(r.label)}</span></a>`;
        })
        .join("");
  }

  const savedCreators = () => store.get("creators", []);
  const savedAssets = () => store.get("assets", []);

  function isCreatorSaved(id) {
    return savedCreators().some((c) => String(c.id) === String(id));
  }

  function isAssetSaved(id) {
    return savedAssets().some((a) => a.id === id);
  }

  function creatorSummary(id, items) {
    const total = items.reduce((s, a) => s + a.downloads, 0);
    return {
      id: String(id),
      name: items[0]?.creatorName || `Contributor ${id}`,
      country: items[0]?.country || null,
      thumbs: items.slice(0, 3).map((a) => a.thumb),
      downloads: total,
      assets: items.length,
      updatedAt: Date.now(),
    };
  }

  function toggleCreator(id) {
    let list = savedCreators();
    if (list.some((c) => c.id === String(id))) {
      list = list.filter((c) => c.id !== String(id));
      toast("Removed from saved", "x");
    } else {
      const items = ctx.portfolio.data?.items || [];
      list.unshift(creatorSummary(id, items));
      toast("Contributor saved");
    }
    store.set("creators", list);
    updateSavedCount();
  }

  function refreshSavedCreator(id, items) {
    const list = savedCreators();
    const i = list.findIndex((c) => c.id === String(id));
    if (i >= 0 && items.length) {
      list[i] = creatorSummary(id, items);
      store.set("creators", list);
    }
  }

  function toggleAsset(id) {
    let list = savedAssets();
    let saved;
    if (list.some((a) => a.id === id)) {
      list = list.filter((a) => a.id !== id);
      saved = false;
      toast("Bookmark removed", "x");
    } else {
      const asset = assetIndex.get(id);
      if (!asset) return;
      list.unshift(asset);
      saved = true;
      toast("Asset bookmarked");
    }
    store.set("assets", list);
    $$(`[data-action="bookmark"][data-id="${CSS.escape(id)}"]`).forEach((b) => {
      b.setAttribute("aria-pressed", String(saved));
      b.innerHTML = icon(saved ? "bookmark-fill" : "bookmark", "icon-sm");
    });
    updateSavedCount();
    if (currentRoute === "saved") renderSaved();
  }

  function updateSavedCount() {
    const n = savedCreators().length + savedAssets().length;
    const el = $("#savedCount");
    el.hidden = n === 0;
    el.textContent = n;
  }

  // First and last upload year in a scan, e.g. "2018 – 2026".
  function activeYears(items) {
    const years = items.filter((a) => a.createdAt).map((a) => new Date(a.createdAt).getUTCFullYear());
    if (!years.length) return "—";
    const lo = Math.min(...years), hi = Math.max(...years);
    return lo === hi ? String(lo) : `${lo} – ${hi}`;
  }

  function visibleItems(c) {
    let items = (c.data?.items || []).slice();
    if (prefs.hideAI) items = items.filter((a) => !a.isAI);
    const sorters = {
      downloads: (a, b) => b.downloads - a.downloads,
      dmo: (a, b) => dmo(b) - dmo(a),
      newest: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      oldest: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
    };
    if (sorters[c.clientSort]) items.sort(sorters[c.clientSort]);
    return items;
  }

  // ---------------------------------------------------------------------
  // Rendering — shared pieces
  // ---------------------------------------------------------------------

  function toolbar(c, shown, total) {
    const sorts = [
      ["scan", "Scan order"],
      ["downloads", "Downloads"],
      ["dmo", "Downloads / month"],
      ["newest", "Newest first"],
      ["oldest", "Oldest first"],
    ];
    const hidden = total - shown;
    return `<div class="toolbar">
      <p class="toolbar-count"><strong class="tnum">${shown}</strong> <span class="muted">of ${total} shown</span></p>
      <div class="toolbar-actions">
        ${prefs.hideAI && hidden > 0 ? `<button class="ai-chip" type="button" data-action="show-ai" title="Show AI assets">${icon("sparkle", "icon-sm")}${hidden} AI hidden${icon("x", "icon-xs")}</button>` : ""}
        <label class="sr-only" for="${c.mode}ClientSort">Sort results</label>
        <select class="select select-sm fit" id="${c.mode}ClientSort" data-action="client-sort">
          ${sorts.map(([v, l]) => `<option value="${v}" ${c.clientSort === v ? "selected" : ""}>${l}</option>`).join("")}
        </select>
        <div class="segmented" role="group" aria-label="View">
          <button type="button" data-action="set-view" data-value="grid" aria-pressed="${c.view === "grid"}" title="Grid">${icon("grid", "icon-sm")}</button>
          <button type="button" data-action="set-view" data-value="list" aria-pressed="${c.view === "list"}" title="List">${icon("list", "icon-sm")}</button>
        </div>
        <button class="btn btn-sm" type="button" data-action="export">${icon("download", "icon-sm")}CSV</button>
      </div>
    </div>`;
  }

  function bookmarkBtn(a) {
    const saved = isAssetSaved(a.id);
    return `<button class="icon-btn bookmark-btn" type="button" data-action="bookmark" data-id="${esc(a.id)}" aria-pressed="${saved}" aria-label="Bookmark">${icon(
      saved ? "bookmark-fill" : "bookmark",
      "icon-sm",
    )}</button>`;
  }

  function assetCard(a, rank) {
    return `<article class="asset">
      <button class="thumb" type="button" data-action="open-asset" data-id="${esc(a.id)}" aria-label="${esc(a.title)}">
        ${a.thumb ? `<img src="${esc(a.thumb)}" alt="" loading="lazy" decoding="async"/>` : ""}
        <span class="thumb-fallback">${icon(a.type === "video" ? "video" : "image", "icon-lg")}</span>
        <span class="thumb-badges">
          ${rank ? `<span class="badge rank tnum">#${rank}</span>` : ""}
          <span class="badge type-${esc(a.type)}">${TYPE_LABEL[a.type] || esc(a.type)}</span>
          ${a.isAI ? `<span class="badge badge-ai">AI</span>` : ""}
        </span>
      </button>
      ${bookmarkBtn(a)}
      <div class="asset-body">
        <h3 class="asset-title" title="${esc(a.title)}">${esc(a.title)}</h3>
        <div class="asset-stats">
          <div class="stat stat-dl" title="${fmtFull(a.downloads)} downloads">
            <small>${icon("download", "icon-sm")}<span>Downloads</span></small>
            <b>${fmt(a.downloads)}</b>
          </div>
          <div class="stat stat-age" title="Uploaded ${dateLabel(a.createdAt)}">
            <small>${icon("clock", "icon-sm")}<span>Uploaded</span></small>
            <b>${agoLong(a.createdAt)}</b>
          </div>
        </div>
        <div class="asset-foot">
          ${
            a.creatorId
              ? `<button class="creator-link" type="button" data-action="track-creator" data-id="${esc(a.creatorId)}">${icon("user", "icon-xs")}<span>${esc(a.creatorName)}</span></button>`
              : `<span class="creator-link">${esc(a.creatorName)}</span>`
          }
          <button class="id-copy mono" type="button" data-action="copy" data-text="${esc(a.id)}" data-label="Asset ID copied" title="Copy asset ID">${esc(a.id)}</button>
        </div>
      </div>
    </article>`;
  }

  function assetRow(a, rank) {
    return `<tr>
      <td class="t-rank tnum">${rank}</td>
      <td>
        <button class="row-asset" type="button" data-action="open-asset" data-id="${esc(a.id)}">
          <span class="row-thumb">${a.thumb ? `<img src="${esc(a.thumb)}" alt="" loading="lazy"/>` : ""}</span>
          <span class="row-title"><span>${esc(a.title)}</span><small class="mono muted">${esc(a.id)}${a.isAI ? ` · <em class="ai-text">AI</em>` : ""}</small></span>
        </button>
      </td>
      <td class="t-hide-sm">${a.creatorId ? `<button class="link-btn" type="button" data-action="track-creator" data-id="${esc(a.creatorId)}">${esc(a.creatorName)}</button>` : esc(a.creatorName)}</td>
      <td class="t-hide-sm"><span class="type-dot" style="--c:var(${TYPE_COLOR[a.type] || "--c-other"})"></span>${TYPE_LABEL[a.type] || esc(a.type)}</td>
      <td class="num strong">${fmtFull(a.downloads)}</td>
      <td class="num">${fmt1(dmo(a))}</td>
      <td class="num t-hide-sm" title="${dateLabel(a.createdAt)}">${ago(a.createdAt)}</td>
      <td class="t-act">${bookmarkBtn(a)}</td>
    </tr>`;
  }

  function assetsBlock(c, items) {
    if (!items.length) {
      return `<div class="empty small-empty card"><span class="empty-icon">${icon("sparkle", "icon-lg")}</span><p>All results are AI-generated, and AI assets are hidden.</p>
        <div class="btn-row center"><button class="btn btn-sm" type="button" data-action="show-ai">Show AI assets</button></div></div>`;
    }
    if (c.view === "list") {
      return `<div class="table-wrap card"><table class="asset-table">
        <thead><tr>
          <th class="t-rank">#</th><th>Asset</th><th class="t-hide-sm">Contributor</th><th class="t-hide-sm">Type</th>
          <th class="num">Downloads</th><th class="num">D/MO</th><th class="num t-hide-sm">Age</th><th></th>
        </tr></thead>
        <tbody>${items.map((a, i) => assetRow(a, i + 1)).join("")}</tbody>
      </table></div>`;
    }
    return `<div class="asset-grid">${items.map((a, i) => assetCard(a, c.clientSort === "scan" ? 0 : i + 1)).join("")}</div>`;
  }

  function loadingBlock(c) {
    const what = c.mode === "portfolio" ? `contributor <strong>#${esc(c.q)}</strong>` : `<strong>“${esc(c.q)}”</strong>`;
    const skeletons = Array.from({ length: 8 }, () => `<div class="asset skeleton"><div class="thumb"></div><div class="asset-body"><i></i><i></i><i class="short"></i></div></div>`).join("");
    return `<div class="loading-line card">
        <span class="spinner"></span>
        <p>Scanning Adobe Stock for ${what}… this can take a minute.</p>
      </div>
      <div class="asset-grid">${skeletons}</div>`;
  }

  function errorBlock(c) {
    if (c.errorCode === "apify_key") {
      return `<div class="empty card">
        <span class="empty-icon">${icon("key", "icon-lg")}</span>
        <h3>${esc(c.error)}</h3>
        <p>Scans run on your own Apify account.</p>
        <div class="btn-row center">
          <a class="btn btn-primary" href="#/settings" data-focus-key>Add API key</a>
          <a class="btn" href="${esc(account?.apify_key_url || KEY_URL)}" target="_blank" rel="noopener">Get your API key${icon("external", "icon-sm")}</a>
        </div>
      </div>`;
    }
    const noCredits = c.errorCode === "insufficient_credits" || c.errorCode === "credits_expired";
    if (noCredits) {
      return `<div class="empty card">
        <span class="empty-icon err">${icon("zap", "icon-lg")}</span>
        <h3>${esc(c.error)}</h3>
        <p>Contact SKILL ITBD to top up your credits.</p>
        ${contactButtons()}
      </div>`;
    }
    return `<div class="empty card">
      <span class="empty-icon err">${icon("info", "icon-lg")}</span>
      <h3>That scan didn’t work</h3>
      <p>${esc(c.error)}</p>
      <div class="btn-row center">
        <button class="btn btn-primary" type="button" data-action="refresh">${icon("refresh", "icon-sm")}Try again</button>
      </div>
    </div>`;
  }

  function metaLine(c) {
    const d = c.data;
    const parts = [
      `<span class="badge ${c.mode === "portfolio" ? "" : "badge-brand"}">${c.mode === "portfolio" ? "Portfolio" : "Keyword"}</span>`,
      `<span>${SORT_LABEL[d.sort] || esc(d.sort)}</span>`,
      d.type !== "all" ? `<span>${TYPE_LABEL[d.type] || esc(d.type)}s</span>` : "",
      d.fetchedAt ? `<span title="${esc(new Date(d.fetchedAt).toLocaleString())}">Scanned ${ago(d.fetchedAt) === "today" ? "today" : ago(d.fetchedAt) + " ago"}</span>` : "",
    ].filter(Boolean);
    return `<div class="meta-line">${parts.join('<span class="sep"></span>')}
      <button class="btn btn-sm btn-ghost push" type="button" data-action="refresh" title="Scan again (uses a credit)">${icon("refresh", "icon-sm")}Refresh</button>
    </div>`;
  }

  // ---------------------------------------------------------------------
  // Rendering — views
  // ---------------------------------------------------------------------

  function render(c) {
    const root = $(`#${c.mode}Results`);
    root.closest(".view").classList.toggle("has-results", !!(c.loading || c.error || c.data));
    if (c.loading) {
      root.innerHTML = loadingBlock(c);
      return;
    }
    if (c.error) {
      root.innerHTML = errorBlock(c);
      return;
    }
    if (!c.data) {
      root.innerHTML = c.mode === "search" ? searchEmpty() : portfolioEmpty();
      return;
    }
    const all = c.data.items;
    if (!all.length) {
      root.innerHTML = `<div class="empty card">
        <span class="empty-icon">${icon("search", "icon-lg")}</span>
        <h3>No assets found</h3>
        <p>Try a broader keyword or another asset type.</p>
      </div>`;
      return;
    }
    root.innerHTML = c.mode === "search" ? searchResults(c) : portfolioResults(c);
  }

  function searchEmpty() {
    return connectCallout();
  }

  function portfolioEmpty() {
    const recent = store.get("recent", []).filter((r) => r.mode === "portfolio").slice(0, 6);
    const saved = savedCreators().slice(0, 6);
    const chip = (id, label, ic) => `<a class="chip" href="#/portfolio/${encodeURIComponent(id)}">${icon(ic, "icon-xs")}${esc(label)}</a>`;
    return (
      connectCallout() +
      `<div class="empty intro">
      <p class="side-label center" style="margin-top:0">Example</p>
      <div class="chip-row center">${chip("200792199", "200792199", "arrow-right")}</div>
      ${saved.length ? `<p class="side-label center">Saved</p><div class="chip-row center">${saved.map((s) => chip(s.id, s.name, "bookmark")).join("")}</div>` : ""}
      ${recent.length ? `<p class="side-label center">Recent</p><div class="chip-row center">${recent.map((r) => chip(r.q, r.label, "clock")).join("")}</div>` : ""}
    </div>`
    );
  }

  function searchResults(c) {
    const all = c.data.items;
    const items = visibleItems(c);
    return `
      ${metaLine(c)}
      ${toolbar(c, items.length, all.length)}
      ${assetsBlock(c, items)}`;
  }

  function portfolioResults(c) {
    const all = c.data.items;
    const items = visibleItems(c);
    const first = all[0];
    const saved = isCreatorSaved(c.q);
    return `
      ${metaLine(c)}
      <div class="profile card">
        <span class="avatar lg">${esc(initials(first.creatorName))}</span>
        <div class="profile-info">
          <h2>${esc(first.creatorName)}</h2>
          <p class="profile-meta">
            <button class="id-copy mono" type="button" data-action="copy" data-text="${esc(c.q)}" data-label="Contributor ID copied">#${esc(c.q)}</button>
            ${first.country ? `<span>${icon("globe", "icon-xs")}${esc(first.country)}</span>` : ""}
            <span>${icon("clock", "icon-xs")}Active ${activeYears(all)}</span>
          </p>
        </div>
        <div class="profile-actions">
          <button class="btn ${saved ? "" : "btn-primary"}" type="button" data-action="save-creator" data-id="${esc(c.q)}">
            ${icon(saved ? "bookmark-fill" : "bookmark", "icon-sm")}${saved ? "Saved" : "Save"}
          </button>
          <a class="btn" href="${esc(creatorUrl(c.q))}" target="_blank" rel="noopener">${icon("external", "icon-sm")}Adobe Stock</a>
        </div>
      </div>
      ${toolbar(c, items.length, all.length)}
      ${assetsBlock(c, items)}`;
  }

  function renderSaved() {
    const creators = savedCreators();
    const assets = savedAssets();
    assets.forEach((a) => assetIndex.set(a.id, a));
    const root = $("#savedContent");
    if (!creators.length && !assets.length) {
      root.innerHTML = `<div class="empty card intro">
        <span class="empty-icon">${icon("bookmark", "icon-lg")}</span>
        <h3>Nothing saved yet</h3>
        <p>Bookmark assets from any scan, or save contributors from the Portfolio tracker.</p>
        <div class="btn-row center"><a class="btn btn-primary" href="#/search">Search keywords</a><a class="btn" href="#/portfolio">Track a contributor</a></div>
      </div>`;
      return;
    }
    const creatorCards = creators
      .map(
        (c) => `<article class="creator-card card">
          <div class="creator-thumbs">${(c.thumbs || []).map((t) => (t ? `<img src="${esc(t)}" alt="" loading="lazy"/>` : "<span></span>")).join("")}</div>
          <div class="creator-body">
            <span class="avatar">${esc(initials(c.name))}</span>
            <div class="creator-info">
              <h3>${esc(c.name)}</h3>
              <p class="mono muted">#${esc(c.id)}${c.country ? ` · ${esc(c.country)}` : ""}</p>
            </div>
          </div>
          <div class="creator-stats">
            <div><span class="tnum">${fmt(c.downloads || 0)}</span><small>downloads</small></div>
            <div><span class="tnum">${c.assets || 0}</span><small>assets scanned</small></div>
          </div>
          <div class="creator-actions">
            <a class="btn btn-sm btn-primary" href="#/portfolio/${encodeURIComponent(c.id)}">Open portfolio</a>
            <button class="icon-btn" type="button" data-action="remove-creator" data-id="${esc(c.id)}" aria-label="Remove">${icon("trash", "icon-sm")}</button>
          </div>
        </article>`,
      )
      .join("");
    root.innerHTML = `
      ${
        creators.length
          ? `<div class="section-title"><h2>Contributors</h2><span class="badge tnum">${creators.length}</span></div><div class="creator-grid">${creatorCards}</div>`
          : ""
      }
      ${
        assets.length
          ? `<div class="section-title"><h2>Bookmarked assets</h2><span class="badge tnum">${assets.length}</span>
              <button class="btn btn-sm push" type="button" data-action="export-saved">${icon("download", "icon-sm")}CSV</button></div>
             <div class="asset-grid">${assets.map((a) => assetCard(a, 0)).join("")}</div>`
          : ""
      }`;
  }

  // ---------------------------------------------------------------------
  // Drawer
  // ---------------------------------------------------------------------

  let lastFocus = null;

  function openAsset(id) {
    const a = assetIndex.get(id);
    if (!a) return;
    lastFocus = document.activeElement;
    const v = dmo(a);
    const media =
      a.type === "video" && a.videoPreview
        ? `<video src="${esc(a.videoPreview)}" poster="${esc(a.thumbLarge || a.thumb)}" autoplay muted loop playsinline controls></video>`
        : `<img src="${esc(a.thumbLarge || a.thumb)}" alt="${esc(a.title)}"/>`;
    const kws = a.keywords.map((k) => `<button class="chip" type="button" data-action="search-kw" data-kw="${esc(k)}">${esc(k)}</button>`).join("");
    $("#drawerBody").innerHTML = `
      <div class="drawer-top">
        <span class="badge type-${esc(a.type)}">${TYPE_LABEL[a.type] || esc(a.type)}</span>
        ${a.isAI ? `<span class="badge badge-ai">${icon("sparkle", "icon-xs")}AI generated</span>` : ""}
        ${a.isPremium ? `<span class="badge">Premium</span>` : ""}
        <button class="icon-btn push" type="button" data-action="close-drawer" aria-label="Close">${icon("x")}</button>
      </div>
      <div class="drawer-media">${media}</div>
      <div class="drawer-title">
        <h2>${esc(a.title)}</h2>
        <button class="icon-btn" type="button" data-action="copy" data-text="${esc(a.title)}" data-label="Title copied" aria-label="Copy title">${icon("copy", "icon-sm")}</button>
      </div>
      <div class="drawer-stats">
        <div><span>${fmtFull(a.downloads)}</span><small>Downloads</small></div>
        <div><span>${fmt1(v)}</span><small>Downloads / month</small></div>
        <div><span>${a.views ? fmtFull(a.views) : "—"}</span><small>Views</small></div>
      </div>
      <dl class="drawer-facts">
        <div><dt>Uploaded</dt><dd>${dateLabel(a.createdAt)} <span class="muted">(${ago(a.createdAt)} ago)</span></dd></div>
        <div><dt>Category</dt><dd>${esc(a.category)}</dd></div>
        ${a.width ? `<div><dt>Size</dt><dd class="tnum">${esc(a.width)} × ${esc(a.height)} px</dd></div>` : ""}
        <div><dt>Asset ID</dt><dd><button class="id-copy mono" type="button" data-action="copy" data-text="${esc(a.id)}" data-label="Asset ID copied">${esc(a.id)}</button></dd></div>
        <div><dt>Contributor</dt><dd>${
          a.creatorId
            ? `<button class="link-btn" type="button" data-action="track-creator" data-id="${esc(a.creatorId)}">${esc(a.creatorName)}</button>`
            : esc(a.creatorName)
        }${a.country ? ` <span class="muted">· ${esc(a.country)}</span>` : ""}</dd></div>
      </dl>
      ${
        a.keywords.length
          ? `<div class="drawer-kw">
              <div class="panel-head"><h3>Keywords <span class="badge tnum">${a.keywords.length}</span></h3>
              <button class="btn btn-sm btn-ghost push" type="button" data-action="copy" data-text="${esc(a.keywords.join(", "))}" data-label="Keywords copied">${icon("copy", "icon-sm")}Copy</button></div>
              <div class="chip-cloud">${kws}</div>
            </div>`
          : ""
      }
      <div class="drawer-actions">
        <a class="btn btn-primary" href="${esc(a.url)}" target="_blank" rel="noopener">${icon("external", "icon-sm")}View on Adobe Stock</a>
        <button class="btn" type="button" data-action="bookmark-drawer" data-id="${esc(a.id)}">${icon(isAssetSaved(a.id) ? "bookmark-fill" : "bookmark", "icon-sm")}${isAssetSaved(a.id) ? "Bookmarked" : "Bookmark"}</button>
      </div>`;
    $("#drawerBackdrop").hidden = false;
    const drawer = $("#drawer");
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    drawer.scrollTop = 0;
    drawer.focus();
  }

  function closeDrawer() {
    const drawer = $("#drawer");
    if (!drawer.classList.contains("open")) return;
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    $("#drawerBackdrop").hidden = true;
    document.body.classList.remove("no-scroll");
    const vid = $("#drawerBody video");
    if (vid) vid.pause();
    if (lastFocus) lastFocus.focus();
  }

  // ---------------------------------------------------------------------
  // CSV
  // ---------------------------------------------------------------------

  function exportCsv(items, name) {
    const cols = ["id", "title", "creatorName", "creatorId", "country", "type", "category", "downloads", "downloadsPerMonth", "views", "uploaded", "isAI", "url", "keywords"];
    const cell = (v) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = items.map((a) =>
      [a.id, a.title, a.creatorName, a.creatorId, a.country, a.type, a.category, a.downloads, dmo(a).toFixed(2), a.views, a.createdAt?.slice(0, 10), a.isAI, a.url, a.keywords.join("; ")]
        .map(cell)
        .join(","),
    );
    const blob = new Blob(["﻿" + [cols.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `skillitbd-tracker-${name.replace(/[^\w-]+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    toast(`Exported ${items.length} rows`, "download");
  }

  // ---------------------------------------------------------------------
  // Left panel: type chips, scan options, settings, collapsing
  // ---------------------------------------------------------------------

  function renderTypeBars() {
    $$(".type-bar").forEach((bar) => {
      bar.innerHTML = TYPE_CHIPS.map(
        ([value, label, ic, color]) =>
          `<button class="type-chip" type="button" data-value="${value}" style="--c:var(${color})" aria-pressed="false">${icon(ic, "icon-sm")}<span>${label}</span></button>`,
      ).join("");
    });
  }

  // The sidebar's Order / Assets controls always edit the view on screen.
  function syncControls() {
    const c = ctx[currentRoute];
    $("#scanOptions").hidden = !c;
    if (!c) return;
    const opts = MODE_OPTS[c.mode];

    const sort = $("#optSort");
    if (sort.dataset.mode !== c.mode) {
      sort.innerHTML = opts.sorts.map((s) => `<option value="${s}">${SORT_LABEL[s]}</option>`).join("");
      sort.dataset.mode = c.mode;
    }
    sort.value = c.sort;

    const range = $("#optLimit");
    let idx = opts.limits.indexOf(+c.limit);
    if (idx < 0) idx = opts.limits.findIndex((n) => n >= c.limit);
    if (idx < 0) idx = opts.limits.length - 1;
    range.max = String(opts.limits.length - 1);
    range.value = String(idx);
    $("#optLimitTicks").innerHTML = opts.limits.map((n, i) => `<button type="button" data-tick="${i}" class="${i === idx ? "on" : ""}">${n}</button>`).join("");
    paintRange();
  }

  function paintRange() {
    const range = $("#optLimit");
    const c = ctx[currentRoute];
    if (!c) return;
    const limits = MODE_OPTS[c.mode].limits;
    const idx = +range.value;
    const max = +range.max || 1;
    range.style.setProperty("--pct", `${(idx / max) * 100}%`);
    $("#optLimitVal").textContent = limits[idx];
    $$("#optLimitTicks button").forEach((b) => b.classList.toggle("on", +b.dataset.tick === idx));
  }

  function bindControls() {
    $("#optSort").addEventListener("change", (e) => {
      const c = ctx[currentRoute];
      if (!c) return;
      c.sort = e.target.value;
      if (c.q) go(hashFor(c));
    });

    const range = $("#optLimit");
    range.addEventListener("input", paintRange);
    range.addEventListener("change", () => {
      const c = ctx[currentRoute];
      if (!c) return;
      const limit = MODE_OPTS[c.mode].limits[+range.value];
      if (limit === c.limit) return;
      c.limit = limit;
      if (c.mode === "search") {
        prefs.limit = c.limit;
        savePrefs();
        $("#defaultLimit").value = String(prefs.limit);
      }
      if (c.q) run(c);
    });
    $("#optLimitTicks").addEventListener("click", (e) => {
      const b = e.target.closest("[data-tick]");
      if (!b) return;
      range.value = b.dataset.tick;
      paintRange();
      range.dispatchEvent(new Event("change"));
    });

    // Hide AI: one preference, two switches (left panel + Settings).
    $$('[data-pref="hideAI"]').forEach((el) =>
      el.addEventListener("change", () => {
        setHideAI(el.checked);
        toast(prefs.hideAI ? "AI assets hidden" : "AI assets shown");
      }),
    );

    const light = $("#lightSwitch");
    light.checked = SITTheme.get() === "light";
    light.addEventListener("change", () => SITTheme.set(light.checked ? "light" : "dark"));
    window.addEventListener("sit-theme", (e) => (light.checked = e.detail === "light"));

    // Collapsible sections remember their state.
    $$(".side-sec[data-sec]").forEach((sec) => {
      const head = $(".side-head", sec);
      const open = prefs.sections[sec.dataset.sec] !== false;
      head.setAttribute("aria-expanded", String(open));
      head.addEventListener("click", () => {
        const next = head.getAttribute("aria-expanded") !== "true";
        head.setAttribute("aria-expanded", String(next));
        prefs.sections[sec.dataset.sec] = next;
        savePrefs();
      });
    });

    // Panel toggle: collapses on desktop, slides over the canvas on mobile.
    $("#sidebarToggle").addEventListener("click", () => {
      if (isDesktop()) {
        prefs.sidebar = document.body.classList.contains("sidebar-collapsed");
        savePrefs();
        applySidebar();
      } else {
        setMobileSidebar(!document.body.classList.contains("sidebar-open"));
      }
    });
    $("#sidebarScrim").addEventListener("click", () => setMobileSidebar(false));
    window.matchMedia("(min-width: 1024px)").addEventListener("change", () => {
      setMobileSidebar(false);
      applySidebar();
    });
    applySidebar();
  }

  function setHideAI(on) {
    prefs.hideAI = !!on;
    savePrefs();
    $$('[data-pref="hideAI"]').forEach((el) => (el.checked = prefs.hideAI));
    if (ctx[currentRoute]) render(ctx[currentRoute]);
  }

  function applySidebar() {
    const collapsed = isDesktop() && !prefs.sidebar;
    document.body.classList.toggle("sidebar-collapsed", collapsed);
    const open = isDesktop() ? !collapsed : document.body.classList.contains("sidebar-open");
    const btn = $("#sidebarToggle");
    btn.querySelector("use").setAttribute("href", "/icons.svg#" + (open ? "panel-close" : "panel-open"));
    btn.setAttribute("aria-label", open ? "Collapse panel" : "Open panel");
    btn.setAttribute("aria-expanded", String(open));
  }

  function setMobileSidebar(open) {
    document.body.classList.toggle("sidebar-open", open && !isDesktop());
    $("#sidebarScrim").hidden = !(open && !isDesktop());
    applySidebar();
  }

  // Top-bar popovers (Contact, account menu).
  function bindMenus() {
    const pairs = [
      ["#userBtn", "#userMenu"],
      ["#contactBtn", "#contactMenu"],
    ];
    const closeAll = (except) =>
      pairs.forEach(([b, m]) => {
        if (m === except) return;
        $(m).hidden = true;
        $(b).setAttribute("aria-expanded", "false");
      });
    pairs.forEach(([b, m]) => {
      $(b).addEventListener("click", (e) => {
        e.stopPropagation();
        const menu = $(m);
        closeAll(m);
        menu.hidden = !menu.hidden;
        $(b).setAttribute("aria-expanded", String(!menu.hidden));
      });
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".menu")) closeAll();
      else if (e.target.closest("a, button")) closeAll();
    });
    document.addEventListener("keydown", (e) => e.key === "Escape" && closeAll());

    const list = contacts();
    if (list.length) {
      $("#contactMenu").innerHTML =
        `<p class="menu-label">Contact SKILL ITBD</p>` +
        list.map((c) => `<a role="menuitem" href="${esc(c.url)}" target="_blank" rel="noopener">${icon(c.icon || "message", "icon-sm")}${esc(c.label)}</a>`).join("");
      $("#contactWrap").hidden = false;
    }
  }

  // ---------------------------------------------------------------------
  // Routing
  // ---------------------------------------------------------------------

  let currentRoute = "search";

  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, "");
    const [path, query = ""] = raw.split("?");
    const [route, arg] = path.split("/");
    return { route: route || "search", arg: arg ? decodeURIComponent(arg) : "", params: new URLSearchParams(query) };
  }

  function go(hash) {
    if (location.hash === hash) onRoute();
    else location.hash = hash;
  }

  function searchHash(c) {
    const p = new URLSearchParams({ q: c.q });
    if (c.type !== "all") p.set("type", c.type);
    if (c.sort !== "relevance") p.set("sort", c.sort);
    return `#/search?${p}`;
  }

  function portfolioHash(c) {
    const p = new URLSearchParams();
    if (c.type !== "all") p.set("type", c.type);
    if (c.sort !== "downloads") p.set("sort", c.sort);
    const qs = p.toString();
    return `#/portfolio/${encodeURIComponent(c.q)}${qs ? "?" + qs : ""}`;
  }

  const hashFor = (c) => (c.mode === "search" ? searchHash(c) : portfolioHash(c));

  function syncForm(c) {
    const view = $(`.view[data-view="${c.mode}"]`);
    $("input[name]", view).value = c.q;
    $$(".type-chip", view).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.value === c.type)));
    if (currentRoute === c.mode) syncControls();
  }

  function onRoute() {
    const { route, arg, params } = parseHash();
    const known = ["search", "portfolio", "saved", "settings"];
    currentRoute = known.includes(route) ? route : "search";

    $$(".view").forEach((v) => (v.hidden = v.dataset.view !== currentRoute));
    $$("[data-route]").forEach((a) => {
      a.classList.toggle("active", a.dataset.route === currentRoute);
      if (a.dataset.route === currentRoute) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    document.title = `${ROUTE_TITLE[currentRoute]} — SKILL ITBD Tracker`;
    closeDrawer();
    setMobileSidebar(false);
    syncControls();

    if (currentRoute === "search") {
      const c = ctx.search;
      const q = (params.get("q") || "").trim();
      if (q) Object.assign(c, { q, type: params.get("type") || "all", sort: params.get("sort") || "relevance" });
      syncForm(c);
      if (q && queryKey(c) !== c.activeKey) run(c);
      else render(c);
    } else if (currentRoute === "portfolio") {
      const c = ctx.portfolio;
      const id = arg.replace(/\D/g, "");
      if (id) Object.assign(c, { q: id, type: params.get("type") || "all", sort: params.get("sort") || "downloads" });
      syncForm(c);
      if (id && queryKey(c) !== c.activeKey) run(c);
      else render(c);
    } else if (currentRoute === "saved") {
      renderSaved();
    } else if (currentRoute === "settings") {
      syncSettings();
      if (sessionStorageGet("focusKey")) {
        sessionStorageSet("focusKey", "");
        setTimeout(() => {
          $("#apify").scrollIntoView({ block: "center" });
          $("#apifyKeyInput").focus();
        }, 50);
      }
    }
    window.scrollTo({ top: 0 });
  }

  // ---------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------

  function ctxFor(el) {
    const view = el.closest(".view");
    return view ? ctx[view.dataset.view] : null;
  }

  function bindQueryForm(c, formSel) {
    const form = $(formSel);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input[name]");
      const value = input.value.trim();
      if (!value) {
        input.focus();
        return;
      }
      if (c.mode === "search" && /^\d{5,}$/.test(value)) {
        // A bare number is a contributor ID — send it to the portfolio view.
        ctx.portfolio.q = value;
        ctx.portfolio.type = c.type;
        go(portfolioHash(ctx.portfolio));
        return;
      }
      if (c.mode === "portfolio" && !/^\d+$/.test(value)) {
        toast("Contributor IDs are numbers only", "info");
        return;
      }
      c.q = value;
      const hash = hashFor(c);
      // Same URL means no hashchange, so re-run explicitly (served from cache).
      if (location.hash === hash) run(c);
      else location.hash = hash;
    });

    // Asset type chips live above the form, in the same view.
    $(`.view[data-view="${c.mode}"] .type-bar`).addEventListener("click", (e) => {
      const btn = e.target.closest(".type-chip");
      if (!btn) return;
      c.type = btn.dataset.value;
      syncForm(c);
      if (c.q) go(hashFor(c));
    });
  }

  function sessionStorageGet(k) {
    try {
      return sessionStorage.getItem("sit." + k);
    } catch {
      return null;
    }
  }
  function sessionStorageSet(k, v) {
    try {
      sessionStorage.setItem("sit." + k, v);
    } catch {}
  }

  function handleAction(e) {
    if (e.target.closest("[data-focus-key]")) sessionStorageSet("focusKey", "1");
    const el = e.target.closest("[data-action]");
    if (!el || el.tagName === "SELECT" || (el.tagName === "INPUT" && el.type === "checkbox")) return;
    const action = el.dataset.action;
    const c = ctxFor(el);

    switch (action) {
      case "open-asset":
        openAsset(el.dataset.id);
        break;
      case "close-drawer":
        closeDrawer();
        break;
      case "bookmark":
        toggleAsset(el.dataset.id);
        break;
      case "bookmark-drawer":
        toggleAsset(el.dataset.id);
        el.innerHTML = `${icon(isAssetSaved(el.dataset.id) ? "bookmark-fill" : "bookmark", "icon-sm")}${isAssetSaved(el.dataset.id) ? "Bookmarked" : "Bookmark"}`;
        break;
      case "search-kw":
        ctx.search.q = el.dataset.kw;
        go(searchHash(ctx.search));
        break;
      case "track-creator":
        ctx.portfolio.q = String(el.dataset.id);
        ctx.portfolio.type = "all";
        go(portfolioHash(ctx.portfolio));
        break;
      case "save-creator":
        toggleCreator(el.dataset.id);
        render(ctx.portfolio);
        break;
      case "remove-creator":
        store.set("creators", savedCreators().filter((x) => x.id !== el.dataset.id));
        updateSavedCount();
        renderSaved();
        toast("Removed from saved", "x");
        break;
      case "copy":
        copy(el.dataset.text, el.dataset.label || "Copied");
        break;
      case "set-view":
        if (!c) return;
        c.view = el.dataset.value;
        prefs.view = c.view;
        savePrefs();
        render(c);
        break;
      case "show-ai":
        setHideAI(false);
        break;
      case "refresh":
        if (c) run(c, { fresh: true });
        break;
      case "export":
        if (c) exportCsv(visibleItems(c), c.mode === "portfolio" ? `contributor-${c.q}` : c.q);
        break;
      case "export-saved":
        exportCsv(savedAssets(), "bookmarks");
        break;
    }
  }

  function handleChange(e) {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const c = ctxFor(el);
    if (!c) return;
    if (el.dataset.action === "client-sort") {
      c.clientSort = el.value;
      render(c);
      $(`#${c.mode}ClientSort`)?.focus();
    }
  }

  // ---------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------

  function syncSettings() {
    $("#defaultLimit").value = String(prefs.limit);
    $$('[data-pref="hideAI"]').forEach((el) => (el.checked = prefs.hideAI));
    loadAccount().catch(() => {});
  }

  function bindSettings() {
    $$("[data-action-signout]").forEach((btn) => btn.addEventListener("click", signOut));

    const keyInput = $("#apifyKeyInput");
    $("#apifyKeyReveal").addEventListener("click", () => {
      const show = keyInput.type === "password";
      keyInput.type = show ? "text" : "password";
      $("#apifyKeyReveal").innerHTML = icon(show ? "eye-off" : "eye", "icon-sm");
      $("#apifyKeyReveal").setAttribute("aria-label", show ? "Hide key" : "Show key");
    });

    $("#apifyKeyForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const token = keyInput.value.trim();
      if (!token) {
        keyInput.focus();
        return;
      }
      const btn = $("#apifyKeySave");
      btn.disabled = true;
      btn.textContent = "Checking…";
      try {
        const res = await api("apify-key.php", { method: "POST", body: { token } });
        account.apify_connected = res.connected;
        account.apify_username = res.username;
        keyInput.value = "";
        keyInput.type = "password";
        renderAccount();
        toast(res.username ? "Connected as " + res.username : "Apify connected");
        // Clear an earlier "add your key" error so the next scan can run.
        Object.values(ctx).forEach((c) => {
          if (c.errorCode === "apify_key") {
            c.error = null;
            c.errorCode = null;
            c.activeKey = null;
          }
        });
      } catch (err) {
        toast(err.message, "x");
      } finally {
        btn.disabled = false;
        btn.textContent = "Save key";
      }
    });

    $("#apifyKeyRemove").addEventListener("click", async () => {
      if (!confirm("Remove your Apify API key? Scans won’t work until you add one again.")) return;
      try {
        const res = await api("apify-key.php", { method: "DELETE" });
        account.apify_connected = res.connected;
        account.apify_username = null;
        renderAccount();
        toast("Apify key removed", "x");
      } catch (err) {
        toast(err.message, "x");
      }
    });

    $("#defaultLimit").addEventListener("change", (e) => {
      prefs.limit = +e.target.value;
      ctx.search.limit = prefs.limit;
      savePrefs();
      toast("Default scan size updated");
    });

    $("#clearRecent").addEventListener("click", () => {
      store.remove("recent");
      renderSideRecent();
      toast("Recent searches cleared");
    });

    $("#clearAll").addEventListener("click", () => {
      if (!confirm("Clear recent searches, saved contributors and bookmarks? Your theme is kept.")) return;
      ["recent", "creators", "assets"].forEach((k) => store.remove(k));
      renderSideRecent();
      updateSavedCount();
      toast("Local data cleared");
    });
  }

  // ---------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------

  function init() {
    // Links like /?q=coffee become hash routes.
    const qs = new URLSearchParams(location.search);
    const q = (qs.get("q") || "").trim();
    if (q) {
      const hash = /^\d{5,}$/.test(q) ? `#/portfolio/${q}` : `#/search?q=${encodeURIComponent(q)}`;
      history.replaceState(null, "", location.pathname + hash);
    }

    SITTheme.bindAll();
    renderTypeBars();
    bindQueryForm(ctx.search, "#searchForm");
    bindQueryForm(ctx.portfolio, "#portfolioForm");
    bindControls();
    bindMenus();
    bindSettings();
    $$('[data-pref="hideAI"]').forEach((el) => (el.checked = prefs.hideAI));

    document.addEventListener("click", handleAction);
    document.addEventListener("change", handleChange);
    $("#drawerBackdrop").addEventListener("click", closeDrawer);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeDrawer();
        setMobileSidebar(false);
      }
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
        const input = currentRoute === "portfolio" ? $("#portfolioInput") : currentRoute === "search" ? $("#searchInput") : null;
        if (input) {
          e.preventDefault();
          input.focus();
        }
      }
    });

    // Broken thumbnails fall back to an icon.
    document.addEventListener(
      "error",
      (e) => {
        if (e.target.tagName === "IMG") {
          const box = e.target.closest(".thumb, .row-thumb, .creator-thumbs");
          e.target.remove();
          if (box) box.classList.add("no-img");
        }
      },
      true,
    );

    renderSideRecent();
    updateSavedCount();

    // Nothing renders or scans until we know who is signed in (401 → login page).
    loadAccount()
      .then(() => {
        document.body.classList.remove("auth-pending");
        // First visit after "Continue with Google" created the account.
        const welcome = sessionStorageGet("welcome");
        if (welcome !== null) {
          try {
            sessionStorage.removeItem("sit.welcome");
          } catch {}
          const n = parseInt(welcome, 10) || 0;
          toast(n > 0 ? `Welcome! You got ${n} free credit${n === 1 ? "" : "s"}.` : "Welcome to SKILL ITBD Tracker!", n > 0 ? "zap" : "check");
        }
        window.addEventListener("hashchange", onRoute);
        onRoute();
      })
      .catch(() => {});
  }

  init();
})();
