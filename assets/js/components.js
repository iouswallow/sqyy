/* ==========================================================================
   components.js — 液态玻璃后台管理系统 · 标准组件渲染层
   表格 / 分页 / 抽屉 / 时间线 / 徽章 / Toast / 筛选 / 表单状态
   暴露到 window.LGComp
   依赖: LGApp, LGData
   ========================================================================== */
(function (global) {
  "use strict";

  var $ = LGApp.$, $all = LGApp.$all, el = LGApp.el, icon = LGApp.icon;
  var D = LGData;

  /* ---------- 徽章 ---------- */
  function badge(status, opts) {
    opts = opts || {};
    var label = D.STATUS_LABEL[status] || status;
    var cls = "badge badge--" + status;
    if (opts.solid) cls += " badge--solid";
    return '<span class="' + cls + '">' + label + '</span>';
  }

  function tag(label) {
    return '<span class="tag">' + escapeHtml(label) + '</span>';
  }

  /* ---------- 表格 ---------- */
  // config: { columns: [{key,title,width,render}], rows, actions: fn(row)->[ {label,type,onClick} ] }
  function renderTable(container, config) {
    container.innerHTML = "";
    var wrap = el("div", { class: "table-wrap responsive" });

    // 桌面表格
    var scroll = el("div", { class: "table-scroll" });
    var table = el("table", { class: "table" });
    var thead = el("thead");
    var trh = el("tr");
    (config.columns || []).forEach(function (c) {
      var th = el("th", { text: c.title });
      if (c.width) th.style.width = c.width;
      trh.appendChild(th);
    });
    if (config.actions) trh.appendChild(el("th", { text: "操作", style: "text-align:right;width:1%;white-space:nowrap" }));
    thead.appendChild(trh);
    table.appendChild(thead);

    var tbody = el("tbody");
    if (!config.rows || !config.rows.length) {
      var emptyTr = el("tr");
      var emptyTd = el("td", { colspan: config.columns.length + (config.actions ? 1 : 0) });
      emptyTd.innerHTML = '<div class="table-empty">' + icon("empty") + '<div>暂无数据</div></div>';
      emptyTr.appendChild(emptyTd);
      tbody.appendChild(emptyTr);
    } else {
      config.rows.forEach(function (row) {
        var tr = el("tr");
        (config.columns || []).forEach(function (c) {
          var td = el("td");
          if (c.render) td.innerHTML = c.render(row);
          else td.textContent = row[c.key] != null ? row[c.key] : "—";
          if (c.align) td.style.textAlign = c.align;
          tr.appendChild(td);
        });
        if (config.actions) {
          var atd = el("td");
          atd.style.textAlign = "right";
          var actBox = el("div", { class: "cell-actions", style: "justify-content:flex-end" });
          config.actions(row).forEach(function (a) {
            var btn = el("button", { class: "btn-link" + (a.type === "danger" ? " danger" : ""), text: a.label, title: a.label });
            if (a.icon) btn.innerHTML = icon(a.icon) + '<span>' + a.label + '</span>';
            btn.addEventListener("click", function () { a.onClick && a.onClick(row); });
            actBox.appendChild(btn);
          });
          atd.appendChild(actBox);
          tr.appendChild(atd);
        }
        tbody.appendChild(tr);
      });
    }
    table.appendChild(tbody);
    scroll.appendChild(table);
    wrap.appendChild(scroll);

    // 移动端卡片列表
    if (config.cardRender) {
      var list = el("div", { class: "card-list" });
      if (config.rows && config.rows.length) {
        config.rows.forEach(function (row) {
          list.appendChild(config.cardRender(row, config));
        });
      } else {
        var ee = el("div", { class: "empty-state" });
        ee.innerHTML = icon("empty") + "<div>暂无数据</div>";
        list.appendChild(ee);
      }
      wrap.appendChild(list);
    }

    container.appendChild(wrap);
    return wrap;
  }

  /* ---------- 分页 ---------- */
  function renderPager(container, config) {
    container.innerHTML = "";
    var total = config.total, page = config.page, pageSize = config.pageSize;
    var pages = Math.max(1, Math.ceil(total / pageSize));
    var pager = el("div", { class: "pager" });

    var start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    var end = Math.min(page * pageSize, total);
    pager.appendChild(el("div", { class: "pager__info", html: '共 <strong class="text-1">' + total + '</strong> 条 · 第 ' + page + '/' + pages + ' 页' }));

    var nav = el("div", { class: "pager__nav" });

    nav.appendChild(pagerBtn(icon("chevron"), page <= 1, function () { config.onChange(page - 1); }, "上一页", true));

    // 页码
    var nums = pageNumbers(page, pages);
    nums.forEach(function (n) {
      if (n === "...") {
        nav.appendChild(el("span", { class: "pager__btn", text: "…", style: "border:none;background:none;cursor:default" }));
      } else {
        nav.appendChild(pagerBtn(String(n), false, function () { config.onChange(n); }, "第" + n + "页", n === page));
      }
    });

    nav.appendChild(pagerBtn(icon("chevron"), page >= pages, function () { config.onChange(page + 1); }, "下一页", false, true));

    pager.appendChild(nav);
    container.appendChild(pager);
  }

  function pagerBtn(content, disabled, onClick, title, active, flip) {
    var b = el("button", { class: "pager__btn" + (active ? " active" : ""), title: title || "", html: content, disabled: !!disabled });
    if (flip) b.style.transform = "rotate(180deg)";
    if (!disabled) b.addEventListener("click", onClick);
    return b;
  }

  function pageNumbers(page, pages) {
    var arr = [];
    if (pages <= 7) {
      for (var i = 1; i <= pages; i++) arr.push(i);
      return arr;
    }
    arr.push(1);
    if (page > 3) arr.push("...");
    var s = Math.max(2, page - 1), e = Math.min(pages - 1, page + 1);
    for (var j = s; j <= e; j++) arr.push(j);
    if (page < pages - 2) arr.push("...");
    arr.push(pages);
    return arr;
  }

  /* ---------- 抽屉 ---------- */
  var drawerEl = null, drawerMask = null;

  function openDrawer(opts) {
    opts = opts || {};
    closeDrawer(true);
    drawerMask = el("div", { class: "drawer-mask" });
    drawerEl = el("aside", { class: "drawer", role: "dialog", "aria-modal": "true" });

    var head = el("div", { class: "drawer__head" });
    head.appendChild(el("div", { class: "drawer__title", text: opts.title || "详情" }));
    var closeBtn = el("button", { class: "btn-icon btn-ghost btn-sm", html: icon("close"), "aria-label": "关闭" });
    closeBtn.addEventListener("click", closeDrawer);
    head.appendChild(closeBtn);
    drawerEl.appendChild(head);

    var body = el("div", { class: "drawer__body" });
    if (typeof opts.body === "string") body.innerHTML = opts.body;
    else if (opts.body) body.appendChild(opts.body);
    drawerEl.appendChild(body);

    if (opts.foot) {
      var foot = el("div", { class: "drawer__foot" });
      if (typeof opts.foot === "string") foot.innerHTML = opts.foot;
      else if (opts.foot) foot.appendChild(opts.foot);
      drawerEl.appendChild(foot);
    }

    drawerMask.addEventListener("click", closeDrawer);
    document.body.appendChild(drawerMask);
    document.body.appendChild(drawerEl);

    requestAnimationFrame(function () {
      drawerMask.classList.add("open");
      drawerEl.classList.add("open");
    });
    document.addEventListener("keydown", escClose);
  }

  function closeDrawer(silent) {
    if (drawerEl) {
      drawerEl.classList.remove("open");
      var de = drawerEl, dm = drawerMask;
      setTimeout(function () { if (de.parentNode) de.parentNode.removeChild(de); if (dm.parentNode) dm.parentNode.removeChild(dm); }, 300);
      drawerEl = null; drawerMask = null;
    } else if (drawerMask) {
      if (drawerMask.parentNode) drawerMask.parentNode.removeChild(drawerMask);
      drawerMask = null;
    }
    document.removeEventListener("keydown", escClose);
  }

  function escClose(e) { if (e.key === "Escape") closeDrawer(); }

  /* ---------- 时间线 ---------- */
  function renderTimeline(container, nodes) {
    container.innerHTML = "";
    var tl = el("div", { class: "timeline" });
    nodes.forEach(function (n) {
      var node = el("div", { class: "timeline-node timeline-node--" + n.status });
      var dot = el("div", { class: "timeline-node__dot" });
      var dotIcon = n.status === "done" ? "check" : (n.status === "rejected" ? "x" : (n.status === "current" ? "clock" : ""));
      if (dotIcon) dot.innerHTML = icon(dotIcon);
      node.appendChild(dot);

      var title = el("div", { class: "timeline-node__title", text: n.title });
      if (n.status === "current") title.appendChild(el("span", { class: "badge badge--approving", html: "进行中" }));
      if (n.status === "rejected") title.appendChild(el("span", { class: "badge badge--rejected", html: "驳回" }));
      node.appendChild(title);

      node.appendChild(el("div", { class: "timeline-node__meta", html: (n.operator ? escapeHtml(n.operator) : "—") + (n.time ? " · " + n.time : "") }));

      if (n.remark) node.appendChild(el("div", { class: "timeline-node__remark", text: n.remark }));

      tl.appendChild(node);
    });
    container.appendChild(tl);
  }

  /* ---------- Toast ---------- */
  function toast(msg, type, duration) {
    var stack = $(".toast-stack");
    if (!stack) {
      stack = el("div", { class: "toast-stack" });
      document.body.appendChild(stack);
    }
    type = type || "info";
    var iconName = type === "success" ? "check" : (type === "error" ? "alert" : "info");
    var t = el("div", { class: "toast toast--" + type });
    t.innerHTML = icon(iconName) + "<span>" + escapeHtml(msg) + "</span>";
    stack.appendChild(t);
    setTimeout(function () {
      t.classList.add("out");
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
    }, duration || 2600);
  }

  /* ---------- 筛选条绑定 ---------- */
  // 从 filter-bar 内的 input/select 收集值，change 时回调
  function bindFilters(container, onFilter) {
    var inputs = $all("input,select", container);
    var handler = LGApp.debounce(function () {
      var data = {};
      inputs.forEach(function (i) {
        var k = i.getAttribute("name") || i.getAttribute("data-key");
        if (k) data[k] = i.value.trim();
      });
      onFilter(data);
    }, 180);
    inputs.forEach(function (i) {
      var ev = i.tagName === "SELECT" ? "change" : "input";
      i.addEventListener(ev, handler);
    });
    return handler;
  }

  /* ---------- 状态横幅 ---------- */
  function statusBanner(status) {
    var label = D.STATUS_LABEL[status];
    var map = {
      draft: { ico: "edit", text: '当前工单为<strong>暂存</strong>状态，可继续编辑并提交审批。' },
      rejected: { ico: "alert", text: '该工单已被<strong>驳回</strong>，请根据审批意见修改后重新提交。' },
      submitted: { ico: "send", text: '工单<strong>已提交</strong>，等待审批，期间不可修改。' },
      approving: { ico: "clock", text: '工单<strong>审批中</strong>，请耐心等待审批结果。' },
      approved: { ico: "check", text: '工单<strong>已通过</strong>审批，内容已归档不可修改。' }
    };
    var m = map[status] || map.draft;
    return '<div class="status-banner status-banner--' + status + '">' + icon(m.ico) +
      '<div class="status-banner__text">' + m.text + '</div>' + badge(status, { solid: true }) + '</div>';
  }

  /* ---------- 工具 ---------- */
  function escapeHtml(s) {
    if (s == null) return "";
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- 列表页通用渲染 ---------- */
  // opts: { type, columns, cardFields, detailHref, allowNew }
  function mountListPage(opts) {
    var root = $("#page-root");
    if (!root) return;

    var state = { keyword: "", status: "", category: "", page: 1, pageSize: 8 };
    var allRows = [];

    function load() {
      allRows = D.getByType(opts.type).slice().sort(function (a, b) { return b.updatedAt.localeCompare(a.updatedAt); });
    }

    function filtered() {
      return allRows.filter(function (r) {
        if (state.keyword) {
          var kw = state.keyword.toLowerCase();
          if ((r.title || "").toLowerCase().indexOf(kw) < 0 && (r.id || "").toLowerCase().indexOf(kw) < 0) return false;
        }
        if (state.status && r.status !== state.status) return false;
        if (state.category && r.category !== state.category) return false;
        return true;
      });
    }

    function categories() {
      var set = {};
      allRows.forEach(function (r) { set[r.category] = true; });
      return Object.keys(set);
    }

      function render() {
      root.innerHTML = "";

      // 面包屑 + 页头
      root.appendChild(crumb(opts.crumb || [], opts.title, opts.subtitle));

      // 筛选条
      var filter = el("div", { class: "filter-bar" });
      var search = el("div", { class: "search-box" });
      search.innerHTML = icon("search");
      var kwInput = el("input", { class: "input", type: "text", placeholder: "搜索工单编号 / 标题…", name: "keyword", value: state.keyword });
      search.appendChild(kwInput);
      filter.appendChild(search);

      var statusSel = el("select", { class: "select", name: "status" });
      statusSel.appendChild(el("option", { value: "", text: "全部状态" }));
      Object.keys(D.STATUS_LABEL).forEach(function (k) {
        var o = el("option", { value: k, text: D.STATUS_LABEL[k] });
        if (state.status === k) o.selected = true;
        statusSel.appendChild(o);
      });
      filter.appendChild(statusSel);

      var catSel = el("select", { class: "select", name: "category" });
      catSel.appendChild(el("option", { value: "", text: "全部分类" }));
      categories().forEach(function (c) {
        var o = el("option", { value: c, text: c });
        if (state.category === c) o.selected = true;
        catSel.appendChild(o);
      });
      filter.appendChild(catSel);

      var spacer = el("div", { class: "spacer" });
      filter.appendChild(spacer);

      if (opts.allowNew) {
        var newBtn = el("a", { class: "btn btn-primary", href: opts.detailHref + "?id=new", html: icon("plus") + "<span>新建" + opts.typeLabel + "</span>" });
        filter.appendChild(newBtn);
      }

      root.appendChild(filter);

      // 表格区
      var tableBox = el("div");
      root.appendChild(tableBox);

      var list = filtered();
      var total = list.length;
      var start = (state.page - 1) * state.pageSize;
      var pageRows = list.slice(start, start + state.pageSize);

      renderTable(tableBox, {
        columns: opts.columns,
        rows: pageRows,
        actions: function (row) {
          var acts = [];
          var editable = D.isEditable(row.status);
          acts.push({ label: "查看", type: "default", onClick: function () { location.href = opts.detailHref + "?id=" + row.id; } });
          if (editable) acts.push({ label: "修改", type: "primary", onClick: function () { location.href = opts.detailHref + "?id=" + row.id; } });
          return acts;
        },
        cardRender: function (row) {
          var card = el("div", { class: "list-card" });
          var head = el("div", { class: "list-card__head" });
          head.appendChild(el("div", { class: "list-card__title", text: row.title }));
          head.appendChild(el("div", { html: badge(row.status) }));
          card.appendChild(head);
          var meta = el("div", { class: "list-card__meta" });
          meta.appendChild(el("span", { text: "编号：" + row.id }));
          meta.appendChild(el("span", { text: "更新：" + row.updatedAt }));
          card.appendChild(meta);
          var acts = el("div", { class: "list-card__actions" });
          var editable = D.isEditable(row.status);
          var viewBtn = el("button", { class: "btn btn-ghost btn-sm", html: icon("eye") + "<span>查看</span>" });
          viewBtn.addEventListener("click", function () { location.href = opts.detailHref + "?id=" + row.id; });
          acts.appendChild(viewBtn);
          if (editable) {
            var editBtn = el("button", { class: "btn btn-primary btn-sm", html: icon("edit") + "<span>修改</span>" });
            editBtn.addEventListener("click", function () { location.href = opts.detailHref + "?id=" + row.id; });
            acts.appendChild(editBtn);
          }
          card.appendChild(acts);
          return card;
        }
      });

      // 分页
      var pagerBox = el("div");
      root.appendChild(pagerBox);
      renderPager(pagerBox, {
        total: total, page: state.page, pageSize: state.pageSize,
        onChange: function (p) { if (p < 1 || p > Math.ceil(total / state.pageSize)) return; state.page = p; render(); window.scrollTo({ top: 0, behavior: "smooth" }); }
      });

      // 绑定筛选
      kwInput.addEventListener("input", LGApp.debounce(function () { state.keyword = kwInput.value.trim(); state.page = 1; render(); }, 200));
      statusSel.addEventListener("change", function () { state.status = statusSel.value; state.page = 1; render(); });
      catSel.addEventListener("change", function () { state.category = catSel.value; state.page = 1; render(); });

      // 入场动画
      $all(".panel, .table-wrap, .filter-bar", root).forEach(function (n, i) {
        n.classList.add("reveal");
        n.style.animationDelay = (i * 60) + "ms";
      });
    }

    load();
    render();
  }

  /* ---------- 面包屑 ---------- */
  function crumb(items, title, sub) {
    var wrap = el("div");
    var inPages = location.pathname.indexOf("/pages/") >= 0;
    var prefix = inPages ? "../../" : "./";
    if (items && items.length) {
      var bc = el("div", { class: "breadcrumb" });
      bc.appendChild(el("a", { href: prefix + "index.html", text: "工作台" }));
      items.forEach(function (it) {
        bc.appendChild(el("span", { html: icon("chevron"), style: "opacity:.4" }));
        if (it.href) bc.appendChild(el("a", { href: prefix + it.href, text: it.label }));
        else bc.appendChild(el("span", { text: it.label }));
      });
      wrap.appendChild(bc);
    }
    var head = el("div", { class: "page-head" });
    var ht = el("div");
    ht.appendChild(el("h2", { class: "page-head__title", text: title }));
    if (sub) ht.appendChild(el("div", { class: "page-head__sub", text: sub }));
    head.appendChild(ht);
    wrap.appendChild(head);
    return wrap;
  }

  /* ---------- 详情页通用渲染 ---------- */
  // opts: { id, type, typeLabel, fields:[{section,title,items:[{label,key,type,options,required,hint,full}]}], detailHref, listHref, listLabel }
  function mountDetailPage(opts) {
    var root = $("#page-root");
    if (!root) return;

    var isNew = opts.id === "new";
    var ticket = isNew ? newTicket(opts.type) : D.getById(opts.id);

    if (!ticket) {
      root.appendChild(crumb([{ label: opts.listLabel, href: opts.listHref }], "未找到工单", "该工单可能已被删除"));
      var empty = el("div", { class: "empty-state" });
      empty.innerHTML = icon("empty") + "<div>未找到对应工单，请返回列表查看。</div>";
      root.appendChild(empty);
      var back = el("a", { class: "btn btn-ghost", href: LGApp.asset(opts.listHref), html: icon("arrowLeft") + "<span>返回列表</span>" });
      root.appendChild(back);
      return;
    }

    var editable = isNew || D.isEditable(ticket.status);
    render();

    function render() {
      root.innerHTML = "";

      root.appendChild(crumb([{ label: opts.listLabel, href: opts.listHref }], isNew ? "新建" + opts.typeLabel : ticket.title, D.TYPE_LABEL[ticket.type] + " · " + ticket.id));

      // 状态横幅（非新建）
      if (!isNew) root.appendChild(el("div", { html: statusBanner(ticket.status) }));

      var layout = el("div", { class: "detail-layout" });
      var main = el("div", { class: "detail-main" });
      var side = el("div", { class: "detail-side" });

      // 表单区
      opts.fields.forEach(function (sec) {
        var panel = el("div", { class: "panel" });
        var head = el("div", { class: "detail-section__title", text: sec.title });
        panel.appendChild(head);
        var grid = el("div", { class: "form-grid" });
        sec.items.forEach(function (it) {
          var field = buildField(it, ticket, editable);
          if (it.full) field.classList.add("field--full");
          grid.appendChild(field);
        });
        panel.appendChild(grid);
        main.appendChild(panel);
      });

      // 底部操作
      var actBar = el("div", { class: "action-bar" });
      var backBtn = el("a", { class: "btn btn-ghost", href: LGApp.asset(opts.listHref), html: icon("arrowLeft") + "<span>返回</span>" });
      actBar.appendChild(backBtn);
      // 非新建工单：始终提供“查看审批流程”入口（移动端侧栏隐藏时尤为重要）
      if (!isNew) {
        var flowBtn = el("button", { class: "btn btn-ghost", html: icon("activity") + "<span>查看审批流程</span>" });
        flowBtn.addEventListener("click", function () { openDrawer({ title: "审批流程", body: timelineBody(ticket) }); });
        actBar.appendChild(flowBtn);
      }
      if (editable) {
        var saveBtn = el("button", { class: "btn btn-ghost", html: icon("save") + "<span>暂存</span>" });
        saveBtn.addEventListener("click", function () { doSave(false); });
        var submitBtn = el("button", { class: "btn btn-primary", html: icon("send") + "<span>提交审批</span>" });
        submitBtn.addEventListener("click", function () { doSave(true); });
        actBar.appendChild(saveBtn);
        actBar.appendChild(submitBtn);
      }
      main.appendChild(actBar);

      // 侧边栏：审批流程
      if (!isNew) {
        var sidePanel = el("div", { class: "panel" });
        sidePanel.appendChild(el("div", { class: "detail-section__title", text: "审批流程" }));
        var tlBox = el("div");
        sidePanel.appendChild(tlBox);
        renderTimeline(tlBox, ticket.nodes);
        side.appendChild(sidePanel);

        // 工单信息
        var infoPanel = el("div", { class: "panel", style: "margin-top:16px" });
        infoPanel.appendChild(el("div", { class: "detail-section__title", text: "工单信息" }));
        var kv = el("div", { class: "kv-list" });
        kv.appendChild(kvItem("创建人", ticket.creator));
        kv.appendChild(kvItem("创建时间", ticket.createdAt));
        kv.appendChild(kvItem("更新时间", ticket.updatedAt));
        kv.appendChild(kvItem("工单编号", ticket.id));
        infoPanel.appendChild(kv);
        side.appendChild(infoPanel);
      }

      layout.appendChild(main);
      layout.appendChild(side);
      root.appendChild(layout);

      // 入场动画
      $all(".panel, .status-banner", root).forEach(function (n, i) {
        n.classList.add("reveal");
        n.style.animationDelay = (i * 70) + "ms";
      });
    }

    function timelineBody(t) {
      var box = el("div");
      renderTimeline(box, t.nodes);
      return box;
    }

    function doSave(submit) {
      // 收集表单
      var patch = collectForm(ticket);
      // 校验必填（兼顾 extra 字段）
      var missing = [];
      opts.fields.forEach(function (sec) {
        sec.items.forEach(function (it) {
          if (!it.required) return;
          var v = it.extra ? (patch.extra && patch.extra[it.key]) : patch[it.key];
          if (!v) missing.push(it.label);
        });
      });
      if (submit && missing.length) {
        toast("请完善必填项：" + missing.join("、"), "error");
        return;
      }
      if (isNew) {
        var now = Date.now();
        patch.id = ticket.id;
        patch.type = opts.type;
        patch.creator = "张明远";
        patch.createdAt = D.fmt(now);
        patch.updatedAt = D.fmt(now);
        patch.status = submit ? "submitted" : "draft";
        patch.title = patch.title || "未命名" + opts.typeLabel;
        patch.nodes = requireNodes(patch.status, now);
        D.upsert(patch);
      } else {
        D.saveDraft(ticket.id, patch);
        if (submit) D.submit(ticket.id);
      }
      toast(submit ? "已提交审批" : "已暂存", "success");
      setTimeout(function () { location.href = LGApp.asset(opts.listHref); }, 700);
    }

    function collectForm(t) {
      var patch = {};
      var extra = t.extra ? JSON.parse(JSON.stringify(t.extra)) : {};
      opts.fields.forEach(function (sec) {
        sec.items.forEach(function (it) {
          var node = document.querySelector('[data-field="' + it.key + '"]');
          if (node) {
            var v = it.type === "checkbox" ? node.checked : node.value;
            if (it.extra) extra[it.key] = v;
            else patch[it.key] = v;
          }
        });
      });
      patch.extra = extra;
      return patch;
    }
  }

  function requireNodes(status, ts) {
    if (status === "draft") {
      return [
        { id: "n1", title: "提交申请", operator: "张明远", status: "current", time: D.fmt(ts), remark: "工单暂存中，未提交审批。" }
      ];
    }
    return [
      { id: "n1", title: "提交申请", operator: "张明远", status: "done", time: D.fmt(ts), remark: "工单已提交，等待初审。" },
      { id: "n2", title: "部门初审", operator: "李清源", status: "current", time: "", remark: "等待部门初审。" }
    ];
  }

  function buildField(it, ticket, editable) {
    var field = el("div", { class: "field" });
    var label = el("label", { class: "field__label", text: it.label });
    if (it.required) label.appendChild(el("span", { class: "req", text: "*" }));
    field.appendChild(label);

    var val = ticket[it.key] != null ? ticket[it.key] : (ticket.extra && ticket.extra[it.key] != null ? ticket.extra[it.key] : "");
    var node;
    if (it.type === "select") {
      node = el("select", { class: "select", "data-field": it.key, disabled: !editable });
      (it.options || []).forEach(function (o) {
        var opt = el("option", { value: o.value || o, text: o.label || o });
        if (String(val) === String(o.value || o)) opt.selected = true;
        node.appendChild(opt);
      });
    } else if (it.type === "textarea") {
      node = el("textarea", { class: "textarea", "data-field": it.key, placeholder: editable ? (it.placeholder || "请输入…") : "" });
      node.value = val;
      if (!editable) node.readOnly = true;
    } else {
      node = el("input", { class: "input", type: it.type || "text", "data-field": it.key, placeholder: editable ? (it.placeholder || "请输入…") : "", value: val });
      if (!editable) node.readOnly = true;
    }
    field.appendChild(node);
    if (it.hint) field.appendChild(el("div", { class: "field__hint", text: it.hint }));
    return field;
  }

  function kvItem(label, value) {
    var k = el("div", { class: "kv" });
    k.appendChild(el("div", { class: "kv__label", text: label }));
    k.appendChild(el("div", { class: "kv__value", text: value || "—" }));
    return k;
  }

  function newTicket(type) {
    var prefix = { catalog: "CAT", product: "PRD", demand: "DMD", scene: "SCN" }[type] || "T";
    var num = String(Math.floor(1000 + Math.random() * 8999));
    var now = D.fmt(Date.now());
    return {
      id: prefix + "-2026-" + num, type: type, title: "", status: "draft",
      category: "", description: "", creator: "张明远", createdAt: now, updatedAt: now,
      extra: {}, nodes: []
    };
  }

  /* ---------- 暴露 ---------- */
  global.LGComp = {
    badge: badge, tag: tag,
    renderTable: renderTable, renderPager: renderPager,
    openDrawer: openDrawer, closeDrawer: closeDrawer,
    renderTimeline: renderTimeline,
    toast: toast,
    bindFilters: bindFilters,
    statusBanner: statusBanner,
    crumb: crumb,
    mountListPage: mountListPage,
    mountDetailPage: mountDetailPage,
    escapeHtml: escapeHtml,
    kvItem: kvItem
  };
})(window);
