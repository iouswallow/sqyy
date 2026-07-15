/* ==========================================================================
   app.js — 液态玻璃后台管理系统 · 标准应用层
   工具函数 / 侧边栏 / 顶栏 / 应用骨架注入
   暴露到 window.LGApp
   ========================================================================== */
(function (global) {
  "use strict";

  /* ---------- 工具函数 ---------- */
  function qs(name) {
    var m = new RegExp("[?&]" + name + "=([^&#]*)").exec(location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : null;
  }

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function debounce(fn, wait) {
    var t;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait || 200);
    };
  }

  // 布尔属性集合
  var BOOL_ATTRS = { checked: 1, disabled: 1, readonly: 1, selected: 1, multiple: 1, required: 1, hidden: 1, autofocus: 1 };

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!attrs.hasOwnProperty(k)) continue;
        var v = attrs[k];
        if (k === "class") node.className = v;
        else if (k === "html") node.innerHTML = v;
        else if (k === "text") node.textContent = v;
        else if (k.indexOf("on") === 0 && typeof v === "function") {
          node.addEventListener(k.slice(2).toLowerCase(), v);
        } else if (v === null || v === undefined || v === false) {
          continue; // 跳过 false / null，避免布尔属性被误设
        } else if (BOOL_ATTRS[k]) {
          if (v === true || v === "") node.setAttribute(k, "");
          else node.setAttribute(k, v);
        } else {
          node.setAttribute(k, v);
        }
      }
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(function (c) {
        if (c == null) return;
        node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      });
    }
    return node;
  }

  function formatDate(str) {
    if (!str) return "—";
    return str;
  }

  function asset(path) {
    if (path.indexOf("/") === 0) return path;
    if (path.indexOf("./") === 0) return path;
    if (path.indexOf("../") === 0) return path;
    var inPages = location.pathname.indexOf("/pages/") >= 0;
    var prefix = inPages ? "../../" : "./";
    return prefix + path;
  }

  /* ---------- 图标库（内联 SVG） ---------- */
  var ICONS = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
    publish: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.5v5a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5v-5"/><path d="M12 3v10"/><path d="M8 7l4-4 4 4"/></svg>',
    catalog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h6v6H4z"/><path d="M14 4h6v6h-6z"/><path d="M4 14h6v6H4z"/><path d="M14 14h6v6h-6z"/></svg>',
    product: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7L12 3 4 7l8 4 8-4z"/><path d="M4 7v10l8 4 8-4V7"/><path d="M12 11v10"/></svg>',
    demand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a5 5 0 0 1 5 5c0 2-1 3-1 5h-8c0-2-1-3-1-5a5 5 0 0 1 5-5z"/><path d="M9 17h6"/><path d="M10 21h4"/></svg>',
    apply: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    scene: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    trendUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
    trendDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>',
    layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    fileText: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
    inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
    activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><line x1="3.27" y1="6.96" x2="12" y2="12.01"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>'
  };

  function icon(name) { return ICONS[name] || ""; }

  /* ---------- 菜单配置 ---------- */
  var MENU = [
    { group: "工作台", items: [
      { key: "dashboard", label: "工作台首页", icon: "dashboard", href: "index.html" }
    ]},
    { group: "我的发布", items: [
      { key: "catalog", label: "数据目录发布", icon: "catalog", href: "pages/publish/catalog-list.html" },
      { key: "product", label: "产品发布", icon: "product", href: "pages/publish/product-list.html" },
      { key: "demand", label: "需求发布", icon: "demand", href: "pages/publish/demand-list.html" }
    ]},
    { group: "我的申请", items: [
      { key: "scene", label: "场景申请", icon: "scene", href: "pages/apply/scene-list.html" }
    ]}
  ];

  /* ---------- 注入应用骨架 ---------- */
  function mountShell(opts) {
    opts = opts || {};
    var inPages = location.pathname.indexOf("/pages/") >= 0;
    var prefix = inPages ? "../../" : "./";
    var activeKey = opts.active;

    // 侧边栏
    var sidebar = buildSidebar(prefix, activeKey);
    // 顶栏
    var topbar = buildTopbar(opts.topTitle, opts.topSub, prefix);

    var app = el("div", { class: "app", id: "app" });
    var main = el("div", { class: "app__main" });
    var mainInner = el("div", { class: "main-inner" });
    mainInner.id = "page-root";
    main.appendChild(mainInner);

    app.appendChild(sidebar);
    app.appendChild(topbar);
    app.appendChild(main);

    // 移动端遮罩
    var mask = el("div", { class: "sidebar-mask", id: "sidebarMask" });
    mask.addEventListener("click", closeMobileSidebar);

    document.body.appendChild(app);
    document.body.appendChild(mask);

    // 折叠按钮
    bindToggle();
    // 子菜单展开
    bindSubMenu();
    // 高亮当前
    highlightActive(activeKey);
  }

  function buildSidebar(prefix, activeKey) {
    var sb = el("div", { class: "app__sidebar", id: "sidebar" });

    // 品牌
    var brand = el("a", { class: "sidebar__brand", href: prefix + "index.html" });
    brand.appendChild(el("span", { class: "sidebar__logo", html: icon("layers") }));
    var bt = el("span", { class: "sidebar__brand-text" });
    bt.appendChild(el("span", { class: "sidebar__brand-title", text: "数智中台" }));
    bt.appendChild(el("span", { class: "sidebar__brand-sub", text: "Data Console" }));
    brand.appendChild(bt);
    sb.appendChild(brand);

    // 导航
    var nav = el("nav", { class: "sidebar__nav" });
    MENU.forEach(function (grp) {
      var g = el("div", { class: "nav-group" });
      g.appendChild(el("div", { class: "nav-group__label", text: grp.group }));
      grp.items.forEach(function (it) {
        // 父项（带子菜单的标识，但本系统每项直接是叶子，统一处理）
        var a = el("a", {
          class: "nav-item" + (it.key === activeKey ? " active" : ""),
          href: prefix + it.href
        });
        a.appendChild(el("span", { html: icon(it.icon), style: "display:flex" }));
        a.appendChild(el("span", { class: "nav-item__text", text: it.label }));
        g.appendChild(a);
      });
      nav.appendChild(g);
    });
    sb.appendChild(nav);

    // 用户
    var foot = el("div", { class: "sidebar__foot" });
    var user = el("div", { class: "sidebar__user" });
    user.appendChild(el("div", { class: "sidebar__avatar", text: "张" }));
    var ui = el("div", { class: "sidebar__user-info" });
    ui.appendChild(el("span", { class: "sidebar__user-name", text: "张明远" }));
    ui.appendChild(el("span", { class: "sidebar__user-role", text: "数据运营" }));
    user.appendChild(ui);
    foot.appendChild(user);
    sb.appendChild(foot);

    return sb;
  }

  function buildTopbar(title, sub, prefix) {
    var tb = el("header", { class: "app__topbar" });

    var toggle = el("button", { class: "topbar__toggle", "aria-label": "切换菜单", html: icon("menu") });
    tb.appendChild(toggle);

    var tt = el("div", { class: "topbar__title" });
    tt.appendChild(el("h1", { text: title || "工作台" }));
    if (sub) tt.appendChild(el("span", { text: sub }));
    tb.appendChild(tt);

    tb.appendChild(el("div", { class: "topbar__spacer" }));

    var search = el("div", { class: "topbar__search" });
    search.innerHTML = icon("search");
    var inp = el("input", { type: "text", placeholder: "搜索工单 / 数据 / 产品…", "aria-label": "搜索" });
    search.appendChild(inp);
    tb.appendChild(search);

    var bell = el("button", { class: "topbar__icon-btn", "aria-label": "通知", html: icon("bell") });
    bell.appendChild(el("span", { class: "dot" }));
    tb.appendChild(bell);

    return tb;
  }

  function bindToggle() {
    var app = $("#app");
    var toggle = $(".topbar__toggle");
    if (!toggle) return;
    toggle.addEventListener("click", function () {
      if (window.matchMedia("(max-width: 767px)").matches) {
        openMobileSidebar();
      } else {
        app.classList.toggle("is-collapsed");
        try { localStorage.setItem("lg_sidebar_collapsed", app.classList.contains("is-collapsed") ? "1" : "0"); } catch (e) {}
      }
    });
    // 恢复折叠态
    try {
      if (localStorage.getItem("lg_sidebar_collapsed") === "1" && !window.matchMedia("(max-width: 767px)").matches) {
        app.classList.add("is-collapsed");
      }
    } catch (e) {}
  }

  function bindSubMenu() {
    $all(".nav-item.has-children").forEach(function (item) {
      item.addEventListener("click", function (e) {
        if (window.matchMedia("(max-width: 1279px)").matches && !location.pathname.match(/\/pages\//)) return;
        e.preventDefault();
        item.classList.toggle("expanded");
        var sub = item.nextElementSibling;
        if (sub && sub.classList.contains("nav-sub")) sub.classList.toggle("open");
      });
    });
  }

  function openMobileSidebar() {
    var sb = $("#sidebar");
    var mask = $("#sidebarMask");
    if (sb) sb.classList.add("mobile-open");
    if (mask) mask.classList.add("open");
  }
  function closeMobileSidebar() {
    var sb = $("#sidebar");
    var mask = $("#sidebarMask");
    if (sb) sb.classList.remove("mobile-open");
    if (mask) mask.classList.remove("open");
  }

  function highlightActive(key) {
    if (!key) return;
    $all(".nav-item").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      // 已在 buildSidebar 处理，此处兜底
    });
  }

  /* ---------- 暴露 ---------- */
  global.LGApp = {
    qs: qs, $: $, $all: $all, debounce: debounce, el: el, formatDate: formatDate,
    asset: asset, icon: icon, ICONS: ICONS, MENU: MENU,
    mountShell: mountShell,
    openMobileSidebar: openMobileSidebar, closeMobileSidebar: closeMobileSidebar
  };

  // 兼容直接调用
  global.$ = $;
  global.$$ = $all;
})(window);
