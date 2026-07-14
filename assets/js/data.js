/* ==========================================================================
   data.js — 液态玻璃后台管理系统 · 标准数据层
   Mock 数据 + localStorage 持久化 + 工单状态机
   暴露到 window.LGData
   ========================================================================== */
(function (global) {
  "use strict";

  var STORAGE_KEY = "lg_admin_tickets_v1";

  /* ---------- 工单类型与状态枚举 ---------- */
  var TYPE_LABEL = {
    catalog: "数据目录",
    product: "产品",
    demand: "需求",
    scene: "场景申请"
  };

  var STATUS_LABEL = {
    draft: "暂存",
    submitted: "已提交",
    approving: "审批中",
    approved: "已通过",
    rejected: "已驳回"
  };

  // 可编辑状态
  var EDITABLE_STATUS = ["draft", "rejected"];

  /* ---------- 种子数据 ---------- */
  function seed() {
    var now = Date.now();
    var day = 86400000;
    return [
      {
        id: "CAT-2026-0001", type: "catalog", title: "公共信用主体数据目录", status: "approved",
        category: "政务数据", source: "市大数据局", format: "API/CSV", records: 1280000,
        description: "归集全市公共信用信息，覆盖企业、个人、社会组织三大主体，提供标准化目录服务。",
        creator: "张明远", createdAt: fmt(now - day * 12), updatedAt: fmt(now - day * 8),
        extra: { provider: "市大数据局", updateCycle: "日更", securityLevel: "公开" },
        nodes: approvalNodes("approved", now - day * 12)
      },
      {
        id: "CAT-2026-0002", type: "catalog", title: "交通运输运行监测数据目录", status: "approving",
        category: "行业数据", source: "交通局", format: "Kafka", records: 98000000,
        description: "实时接入路网流量、公交客流、出租轨迹等动态数据，支撑交通运行监测与调度。",
        creator: "张明远", createdAt: fmt(now - day * 3), updatedAt: fmt(now - day * 2),
        extra: { provider: "市交通局", updateCycle: "实时", securityLevel: "内部" },
        nodes: approvalNodes("approving", now - day * 3)
      },
      {
        id: "CAT-2026-0003", type: "catalog", title: "生态环境监测数据目录", status: "rejected",
        category: "环境数据", source: "生态环境局", format: "API", records: 560000,
        description: "空气质量、地表水、噪声等环境监测指标数据目录，原描述不规范需补充数据更新频率说明。",
        creator: "张明远", createdAt: fmt(now - day * 6), updatedAt: fmt(now - day * 5),
        extra: { provider: "市生态环境局", updateCycle: "小时", securityLevel: "公开" },
        nodes: approvalNodes("rejected", now - day * 6)
      },
      {
        id: "CAT-2026-0004", type: "catalog", title: "教育基础数据目录（草稿）", status: "draft",
        category: "民生数据", source: "教育局", format: "CSV", records: 42000,
        description: "中小学、幼儿园基础信息与师资分布数据，待补充数据共享范围字段。",
        creator: "张明远", createdAt: fmt(now - day * 1), updatedAt: fmt(now - day * 1),
        extra: { provider: "市教育局", updateCycle: "学期", securityLevel: "内部" },
        nodes: approvalNodes("draft", now - day * 1)
      },
      {
        id: "PRD-2026-0007", type: "product", title: "企业信用画像数据产品", status: "approved",
        category: "信用产品", source: "数据中台", format: "API", records: 860000,
        description: "基于多源政务数据融合的企业信用评价产品，输出信用分、风险标签与画像报告。",
        creator: "张明远", createdAt: fmt(now - day * 20), updatedAt: fmt(now - day * 15),
        extra: { price: "按调用计费", sla: "99.9%", audience: "金融机构" },
        nodes: approvalNodes("approved", now - day * 20)
      },
      {
        id: "PRD-2026-0008", type: "product", title: "城市交通态势分析产品", status: "approving",
        category: "交通产品", source: "数据中台", format: "API/报表", records: 1200000,
        description: "实时路网态势、拥堵预警、出行画像一体化分析产品，支持地图可视化与告警订阅。",
        creator: "张明远", createdAt: fmt(now - day * 4), updatedAt: fmt(now - day * 2),
        extra: { price: "订阅制", sla: "99.5%", audience: "政府/企业" },
        nodes: approvalNodes("approving", now - day * 4)
      },
      {
        id: "PRD-2026-0009", type: "product", title: "惠民补贴精准核验产品（草稿）", status: "draft",
        category: "民生产品", source: "数据中台", format: "API", records: 320000,
        description: "对接民政、社保、税务数据，对惠民补贴申领对象进行身份与资格核验，草稿待完善。",
        creator: "张明远", createdAt: fmt(now - day * 2), updatedAt: fmt(now - day * 2),
        extra: { price: "按调用计费", sla: "99.9%", audience: "政府部门" },
        nodes: approvalNodes("draft", now - day * 2)
      },
      {
        id: "DMD-2026-0011", type: "demand", title: "金融机构企业风险监测数据需求", status: "approved",
        category: "金融需求", source: "市银保监局", format: "API", records: 0,
        description: "需要企业工商变更、司法涉诉、行政处罚等数据用于银行风控模型，已对接完成。",
        creator: "张明远", createdAt: fmt(now - day * 30), updatedAt: fmt(now - day * 25),
        extra: { urgency: "高", deadline: "2026-08-01", applicant: "市银保监局" },
        nodes: approvalNodes("approved", now - day * 30)
      },
      {
        id: "DMD-2026-0012", type: "demand", title: "应急指挥一张图数据需求", status: "rejected",
        category: "应急需求", source: "应急管理局", format: "API/瓦片", records: 0,
        description: "需要地理空间、救援力量、物资储备等数据接入，需求范围描述不清晰需重新梳理。",
        creator: "张明远", createdAt: fmt(now - day * 7), updatedAt: fmt(now - day * 6),
        extra: { urgency: "中", deadline: "2026-09-15", applicant: "市应急管理局" },
        nodes: approvalNodes("rejected", now - day * 7)
      },
      {
        id: "DMD-2026-0013", type: "demand", title: "智慧文旅客流分析数据需求", status: "submitted",
        category: "文旅需求", source: "文旅局", format: "API", records: 0,
        description: "需要景区客流、消费、交通等数据支撑节假日文旅运行分析与公共服务优化。",
        creator: "张明远", createdAt: fmt(now - day * 1), updatedAt: fmt(now - day * 1),
        extra: { urgency: "中", deadline: "2026-10-01", applicant: "市文旅局" },
        nodes: approvalNodes("submitted", now - day * 1)
      },
      {
        id: "SCN-2026-0021", type: "scene", title: "普惠金融信贷审批场景", status: "approved",
        category: "金融场景", source: "市金融办", format: "—", records: 0,
        description: "依托企业信用与纳税数据，支撑银行普惠信贷秒批秒贷，已上线运行。",
        creator: "张明远", createdAt: fmt(now - day * 25), updatedAt: fmt(now - day * 20),
        extra: { scenario: "普惠金融", dataScope: "信用+税务", participants: "5家银行" },
        nodes: approvalNodes("approved", now - day * 25)
      },
      {
        id: "SCN-2026-0022", type: "scene", title: "智慧城市运行指挥场景", status: "approving",
        category: "治理场景", source: "市城管委", format: "—", records: 0,
        description: "汇聚多部门实时数据，构建城市运行态势感知与指挥调度一体化场景。",
        creator: "张明远", createdAt: fmt(now - day * 5), updatedAt: fmt(now - day * 3),
        extra: { scenario: "城市治理", dataScope: "12个部门", participants: "市城管委牵头" },
        nodes: approvalNodes("approving", now - day * 5)
      },
      {
        id: "SCN-2026-0023", type: "scene", title: "基层社会治理网格化场景（草稿）", status: "draft",
        category: "治理场景", source: "市委政法委", format: "—", records: 0,
        description: "依托网格员上报与多源数据，构建基层矛盾纠纷发现与处置闭环，草稿待补充数据清单。",
        creator: "张明远", createdAt: fmt(now - day * 1), updatedAt: fmt(now - day * 1),
        extra: { scenario: "基层治理", dataScope: "待定", participants: "街道社区" },
        nodes: approvalNodes("draft", now - day * 1)
      }
    ];
  }

  /* ---------- 审批节点生成 ---------- */
  function approvalNodes(status, startTs) {
    var t = startTs;
    var nodes = [];
    nodes.push({ id: "n1", title: "提交申请", operator: "张明远", status: "done", time: fmt(t), remark: "工单已提交，等待初审。" });
    if (status === "draft") {
      nodes[0].status = "current";
      nodes[0].remark = "工单暂存中，未提交审批。";
      return nodes;
    }
    t += 3600000 * 4;
    nodes.push({ id: "n2", title: "部门初审", operator: "李清源", status: "done", time: fmt(t), remark: "材料齐全，形式审查通过，转业务复审。" });
    if (status === "submitted") {
      nodes[1].status = "current";
      nodes[1].remark = "等待部门初审。";
      return nodes;
    }
    t += 3600000 * 8;
    nodes.push({ id: "n3", title: "业务复审", operator: "王运维", status: status === "rejected" ? "rejected" : "done", time: fmt(t),
      remark: status === "rejected" ? "需求描述与数据范围不够清晰，请补充完善后重新提交。" : "业务逻辑合理，同意进入终审。" });
    if (status === "approving") {
      nodes[2].status = "current";
      nodes[2].remark = "业务复审进行中。";
      return nodes;
    }
    t += 3600000 * 6;
    nodes.push({ id: "n4", title: "领导终审", operator: "赵主任", status: status === "rejected" ? "pending" : "done", time: status === "approved" ? fmt(t) : "",
      remark: status === "approved" ? "审核通过，准予发布/接入。" : "" });
    return nodes;
  }

  function fmt(ts) {
    var d = new Date(ts);
    var p = function (n) { return n < 10 ? "0" + n : "" + n; };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  /* ---------- 存取 ---------- */
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    var s = seed();
    save(s);
    return s;
  }

  function save(tickets) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets)); } catch (e) {}
  }

  /* ---------- API ---------- */
  function getAll() { return load(); }

  function getByType(type) {
    return load().filter(function (t) { return t.type === type; });
  }

  function getById(id) {
    var list = load();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function upsert(ticket) {
    var list = load();
    var idx = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === ticket.id) { idx = i; break; }
    }
    if (idx >= 0) {
      list[idx] = ticket;
    } else {
      list.unshift(ticket);
    }
    save(list);
    return ticket;
  }

  // 保存（暂存）：保持 draft 或 rejected 状态，更新内容与时间
  function saveDraft(id, patch) {
    var t = getById(id);
    if (!t) return null;
    if (!isEditable(t.status)) return null;
    for (var k in patch) { if (patch.hasOwnProperty(k)) t[k] = patch[k]; }
    t.updatedAt = fmt(Date.now());
    return upsert(t);
  }

  // 提交：draft/rejected -> submitted，并刷新审批节点
  function submit(id) {
    var t = getById(id);
    if (!t || !isEditable(t.status)) return null;
    t.status = "submitted";
    t.updatedAt = fmt(Date.now());
    t.nodes = approvalNodes("submitted", Date.now());
    return upsert(t);
  }

  function isEditable(status) {
    return EDITABLE_STATUS.indexOf(status) >= 0;
  }

  // 统计
  function stats() {
    var list = load();
    var s = { total: list.length, publish: 0, apply: 0, pending: 0, approved: 0, rejected: 0, draft: 0 };
    list.forEach(function (t) {
      if (t.type === "scene") s.apply++; else s.publish++;
      if (t.status === "approved") s.approved++;
      if (t.status === "rejected") s.rejected++;
      if (t.status === "draft") s.draft++;
      if (t.status === "submitted" || t.status === "approving") s.pending++;
    });
    return s;
  }

  function recent(limit) {
    var list = load().slice().sort(function (a, b) {
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    return list.slice(0, limit || 5);
  }

  // 重置为种子数据
  function reset() {
    var s = seed();
    save(s);
    return s;
  }

  global.LGData = {
    TYPE_LABEL: TYPE_LABEL,
    STATUS_LABEL: STATUS_LABEL,
    EDITABLE_STATUS: EDITABLE_STATUS,
    getAll: getAll,
    getByType: getByType,
    getById: getById,
    upsert: upsert,
    saveDraft: saveDraft,
    submit: submit,
    isEditable: isEditable,
    stats: stats,
    recent: recent,
    reset: reset,
    fmt: fmt
  };
})(window);
