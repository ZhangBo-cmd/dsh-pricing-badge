// dsh-pricing-badge —— 浏览器（Client）半边。
// 在侧边栏底部（Settings 旁）注册一个「高峰/空闲」指示灯，点击展开
// 模型价格速查：DeepSeek 官方分时段价格 + 第三方模型固定价。
// 纯前端、纯工具，不发起任何模型请求。
//
// 这是一个「factory-form」浏览器 bundle：模块体只做一次注册，真正的
// 逻辑放在 factory 闭包里，由模块系统按需物化执行。
window.__ModuleLoader__.load({
  id: "dsh-pricing-badge",
  factory: function (require) {
    var React = require("react")
    var inject = ["slots"]

    // ---------------------------------------------------------------------
    // DeepSeek 官方价格（单位：元 / 100 万 tokens），分高峰/空闲时段。
    // 来源：https://api-docs.deepseek.com/zh-cn/quick_start/pricing/
    // ---------------------------------------------------------------------
    var DEEPSEEK_MODELS = [
      {
        name: "deepseek-flash",
        label: "deepseek-flash",
        sub: "DeepSeek-V4.1-Flash",
        idle: { hit: 0.02, miss: 1, out: 4 },
        peak: { hit: 0.04, miss: 2, out: 8 },
      },
      {
        name: "deepseek-v4-pro",
        label: "deepseek-v4-pro",
        sub: "DeepSeek-V4-Pro-0813",
        idle: { hit: 0.15, miss: 4.5, out: 13.5 },
        peak: { hit: 0.3, miss: 9, out: 27 },
      },
    ]

    // ---------------------------------------------------------------------
    // 第三方模型固定价（单位：每 100 万 tokens）。无高峰/空闲之分。
    // currency: "USD" 或 "CNY"。source: 官方定价页 URL。
    // 价格为调研时的当前值，可能变动，以各官方定价页为准。
    // ---------------------------------------------------------------------
    var THIRD_PARTY_MODELS = [
      { provider: "OpenAI", model: "GPT-4o", input: 2.5, output: 10, currency: "USD", source: "https://platform.openai.com/docs/pricing" },
      { provider: "OpenAI", model: "GPT-4o mini", input: 0.15, output: 0.6, currency: "USD", source: "https://platform.openai.com/docs/pricing" },
      { provider: "OpenAI", model: "o3", input: 10, output: 40, currency: "USD", source: "https://platform.openai.com/docs/pricing" },
      { provider: "OpenAI", model: "GPT-5.6 Sol", input: 5, output: 30, currency: "USD", source: "https://llm-stats.com/providers/openai" },
      { provider: "Anthropic", model: "Claude Opus 5.5", input: 4, output: 20, currency: "USD", source: "https://llm-stats.com/providers/anthropic" },
      { provider: "Anthropic", model: "Claude Sonnet 5", input: 2, output: 10, currency: "USD", source: "https://llm-stats.com/providers/anthropic" },
      { provider: "Google", model: "Gemini 2.5 Pro", input: 1.25, output: 10, currency: "USD", source: "https://ai.google.dev/gemini-api/docs/pricing" },
      { provider: "Google", model: "Gemini 2.5 Flash", input: 0.3, output: 2.5, currency: "USD", source: "https://ai.google.dev/gemini-api/docs/pricing" },
      { provider: "Google", model: "Gemini 3.8 Flash", input: 0.75, output: 3.75, currency: "USD", source: "https://llm-stats.com/providers/google" },
      { provider: "Moonshot (Kimi)", model: "kimi-k3", input: 20, output: 100, currency: "CNY", source: "https://platform.kimi.com/docs/pricing/chat" },
      { provider: "Moonshot (Kimi)", model: "kimi-k2.6", input: 6.5, output: 27, currency: "CNY", source: "https://platform.kimi.com/docs/pricing/chat" },
      { provider: "智谱 (Z.AI)", model: "GLM-5.3", input: 1.4, output: 4.4, currency: "USD", source: "https://docs.z.ai/guides/overview/pricing" },
      { provider: "智谱 (Z.AI)", model: "GLM-4.6", input: 0.6, output: 2.2, currency: "USD", source: "https://docs.z.ai/guides/overview/pricing" },
      { provider: "阿里通义 Qwen", model: "qwen-max", input: 2.4, output: 9.6, currency: "CNY", source: "https://help.aliyun.com/zh/model-studio/model-pricing" },
      { provider: "阿里通义 Qwen", model: "qwen-plus", input: 0.8, output: 2, currency: "CNY", source: "https://help.aliyun.com/zh/model-studio/model-pricing" },
      { provider: "阿里通义 Qwen", model: "qwen3.8-max", input: 12, output: 36, currency: "CNY", source: "https://help.aliyun.com/zh/model-studio/model-pricing" },
      { provider: "MiniMax", model: "MiniMax-M3", input: 0.3, output: 1.2, currency: "USD", source: "https://platform.minimax.io/docs/guides/pricing-paygo" },
      { provider: "xAI", model: "Grok 4.7", input: 2, output: 6, currency: "USD", source: "https://llm-stats.com/providers/xai" },
    ]

    // ---------------------------------------------------------------------
    // 法定节假日放假日期范围（北京时间，含首尾，YYYY-MM-DD）。
    // 周末无需登记（自动判为空闲）；调休上班的周末（如 2026-02-14）仍按
    // 周末判为空闲，与 DeepSeek 官方规则一致（高峰=周一至周五且非法定节假日）。
    // 数据源：国务院办公厅《关于2026年部分节假日安排的通知》，需按年更新。
    // ---------------------------------------------------------------------
    var HOLIDAYS = [
      { start: "2026-01-01", end: "2026-01-03", name: "元旦" },
      { start: "2026-02-15", end: "2026-02-23", name: "春节" },
      { start: "2026-04-04", end: "2026-04-06", name: "清明节" },
      { start: "2026-05-01", end: "2026-05-05", name: "劳动节" },
      { start: "2026-06-19", end: "2026-06-21", name: "端午节" },
      { start: "2026-09-25", end: "2026-09-27", name: "中秋节" },
      { start: "2026-10-01", end: "2026-10-07", name: "国庆节" },
    ]

    function holidayName(dateKey) {
      for (var i = 0; i < HOLIDAYS.length; i++) {
        var h = HOLIDAYS[i]
        if (dateKey >= h.start && dateKey <= h.end) return h.name
      }
      return null
    }

    function isHoliday(dateKey) {
      return holidayName(dateKey) !== null
    }

    // ---------------------------------------------------------------------
    // 北京时间计算
    // ---------------------------------------------------------------------
    function beijingParts(ms) {
      var dtf = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Shanghai",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      var parts = dtf.formatToParts(new Date(ms))
      var out = { weekday: "", hour: 0, minute: 0 }
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i]
        if (p.type === "weekday") out.weekday = p.value
        else if (p.type === "hour") out.hour = Number(p.value)
        else if (p.type === "minute") out.minute = Number(p.value)
      }
      return out
    }

    function beijingDateKey(ms) {
      var dtf = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      var parts = dtf.formatToParts(new Date(ms))
      var y = "",
        m = "",
        d = ""
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i]
        if (p.type === "year") y = p.value
        else if (p.type === "month") m = p.value
        else if (p.type === "day") d = p.value
      }
      return y + "-" + m + "-" + d
    }

    function beijingClockText(ms) {
      var p = beijingParts(ms)
      return pad2(p.hour) + ":" + pad2(p.minute)
    }

    function pad2(n) {
      return n < 10 ? "0" + n : "" + n
    }

    // 返回 "peak"（高峰）或 "idle"（空闲）。
    // 规则：北京时间周一至周五（不含法定节假日）9:00-12:00、14:00-18:00
    // 为高峰时段；其余（含周末、法定节假日全天）为空闲时段。
    function currentPeriod(ms) {
      var p = beijingParts(ms)
      var isWeekend = p.weekday === "Sat" || p.weekday === "Sun"
      if (isWeekend) return "idle"
      if (isHoliday(beijingDateKey(ms))) return "idle"
      var mins = p.hour * 60 + p.minute
      var morning = mins >= 9 * 60 && mins < 12 * 60
      var afternoon = mins >= 14 * 60 && mins < 18 * 60
      return morning || afternoon ? "peak" : "idle"
    }

    // 生成「当前时段 + 原因」说明文案（弹窗内缓存命中行下）。
    function periodNote(ms) {
      var p = beijingParts(ms)
      var dk = beijingDateKey(ms)
      if (currentPeriod(ms) === "peak") return "🔴 当前高峰时段 · 工作日"
      if (p.weekday === "Sat" || p.weekday === "Sun") return "🟢 当前空闲时段 · 周末"
      var hn = holidayName(dk)
      if (hn) return "🟢 当前空闲时段 · " + hn + "假期"
      return "🟢 当前空闲时段 · 非高峰时段"
    }

    // 返回时段原因（紧凑版，用于指示灯胶囊文案）。
    function periodReason(ms) {
      var p = beijingParts(ms)
      var dk = beijingDateKey(ms)
      if (p.weekday === "Sat" || p.weekday === "Sun") return "周末"
      var hn = holidayName(dk)
      if (hn) return hn + "假期"
      var mins = p.hour * 60 + p.minute
      var inPeak = (mins >= 9 * 60 && mins < 12 * 60) || (mins >= 14 * 60 && mins < 18 * 60)
      return inPeak ? "" : "非高峰时段"
    }

    // ---------------------------------------------------------------------
    // 轻量 createElement 助手
    // ---------------------------------------------------------------------
    function el(type, props) {
      var children = Array.prototype.slice.call(arguments, 2)
      return React.createElement.apply(React, [type, props].concat(children))
    }

    // ---------------------------------------------------------------------
    // 样式（弹层用固定深色卡片，明暗主题下均可读）
    // ---------------------------------------------------------------------
    var PEAK_COLOR = "#ff7a59"
    var IDLE_COLOR = "#3ecf8e"

    var composerPillStyle = {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "1px 8px",
      borderRadius: "24px",
      border: "none",
      background: "transparent",
      cursor: "pointer",
      color: "var(--dsw-alias-label-tertiary, #9aa0aa)",
      fontFamily: "inherit",
      fontSize: "12px",
      lineHeight: "20px",
      whiteSpace: "nowrap",
    }

    var dot = {
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      flexShrink: "0",
    }

    var panel = {
      position: "fixed",
      left: "12px",
      bottom: "68px",
      width: "360px",
      maxWidth: "calc(100vw - 24px)",
      maxHeight: "72vh",
      overflow: "auto",
      background: "rgba(24, 26, 32, 0.98)",
      color: "#e8e8ec",
      borderRadius: "12px",
      padding: "14px",
      boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
      border: "1px solid rgba(255,255,255,0.08)",
      zIndex: 9999,
      fontSize: "12px",
      lineHeight: "1.45",
    }

    var panelTitle = {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "10px",
      fontWeight: 600,
      fontSize: "13px",
    }

    var pill = {
      padding: "2px 8px",
      borderRadius: "999px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#0e0e12",
    }

    var note = {
      color: "#9aa0aa",
      fontSize: "11px",
      marginTop: "2px",
    }

    var sectionTitle = {
      fontSize: "12px",
      fontWeight: 600,
      color: "#c6cbd4",
      margin: "12px 0 6px",
      paddingTop: "10px",
      borderTop: "1px solid rgba(255,255,255,0.10)",
    }

    var table = {
      width: "100%",
      borderCollapse: "collapse",
      marginBottom: "4px",
    }

    var th = {
      textAlign: "left",
      padding: "5px 6px",
      borderBottom: "1px solid rgba(255,255,255,0.12)",
      color: "#9aa0aa",
      fontWeight: 500,
      fontSize: "11px",
      whiteSpace: "nowrap",
    }

    var td = {
      padding: "5px 6px",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      fontSize: "12px",
      whiteSpace: "nowrap",
    }

    var modelName = {
      fontWeight: 600,
      color: "#fff",
    }

    var modelSub = {
      color: "#9aa0aa",
      fontSize: "10.5px",
      marginTop: "1px",
    }

    var periodNoteStyle = {
      padding: "6px 6px",
      fontSize: "11px",
      fontWeight: 600,
      borderBottom: "1px solid rgba(255,255,255,0.08)",
    }

    var footerNote = {
      color: "#8a9099",
      fontSize: "10.5px",
      borderTop: "1px solid rgba(255,255,255,0.08)",
      paddingTop: "8px",
      marginTop: "8px",
    }

    // ---------------------------------------------------------------------
    // 组件
    // ---------------------------------------------------------------------
    function PeriodPill(props) {
      var useProjection = props.useProjection
      var nowRef = React.useState(Date.now())
      var now = nowRef[0]
      var setNow = nowRef[1]
      var openRef = React.useState(false)
      var open = openRef[0]
      var setOpen = openRef[1]
      var balanceRef = React.useState(null)
      var balance = balanceRef[0]
      var setBalance = balanceRef[1]

      React.useEffect(function () {
        var id = setInterval(function () {
          setNow(Date.now())
        }, 30 * 1000)
        return function () {
          clearInterval(id)
        }
      }, [])

      React.useEffect(function () {
        var cancelled = false
        function load() {
          fetch("/pricing-balance")
            .then(function (r) {
              return r.json()
            })
            .then(function (j) {
              if (cancelled) return
              if (j && j.ok && j.data && j.data.balance_infos && j.data.balance_infos.length > 0) {
                var info = j.data.balance_infos[0]
                setBalance({ currency: info.currency, total: info.total_balance })
              }
            })
            .catch(function () {})
        }
        load()
        var id2 = setInterval(load, 30 * 1000)
        return function () {
          cancelled = true
          clearInterval(id2)
        }
      }, [])

      var period = currentPeriod(now)
      var isPeak = period === "peak"
      var reason = periodReason(now)
      var selection = useProjection("modelSelection")
      var current = selection ? (selection.next || selection.lastUsed) : null
      var model = current ? current.model : null
      var price = findOutputPrice(model, isPeak)
      var balanceText = balance ? " · " + balanceSymbol(balance.currency) + balance.total : ""
      var label = (isPeak ? "高峰" : "空闲") + "时段" + (reason ? " · " + reason : "") +
        (price ? " · " + fmtPrice(price.price, price.currency) : "") + balanceText

      return el(
        "div",
        { style: { marginTop: "-25px" } },
        el(
          "button",
          {
            onClick: function () {
              setOpen(function (v) {
                return !v
              })
            },
            title: "模型价格速查（点击展开）",
            style: Object.assign({}, composerPillStyle, { transform: "translateX(310px)" }),
          },
          el("span", null, label),
        ),
        open ? el(PricePanel, { period: period, isPeak: isPeak, now: now }) : null,
      )
    }

    function PricePanel(props) {
      var period = props.period
      var isPeak = props.isPeak
      var now = props.now
      var periodLabel = isPeak ? "高峰时段" : "空闲时段"
      var pillBg = isPeak ? PEAK_COLOR : IDLE_COLOR
      var noteText = periodNote(now)
      var noteColor = isPeak ? PEAK_COLOR : IDLE_COLOR

      return el(
        "div",
        { style: panel },
        el(
          "div",
          { style: panelTitle },
          el("span", null, "模型价格速查"),
          el(
            "span",
            { style: Object.assign({}, pill, { background: pillBg }) },
            periodLabel,
          ),
        ),
        el(
          "div",
          { style: note },
          "北京时间 " + beijingClockText(now) + " · 每 100 万 tokens",
        ),

        el("div", { style: sectionTitle }, "DeepSeek 官方（分时段）"),
        DEEPSEEK_MODELS.map(function (m) {
          var rates = isPeak ? m.peak : m.idle
          return el(
            "div",
            { key: m.name },
            el(
              "div",
              null,
              el("span", { style: modelName }, m.label),
              el("div", { style: modelSub }, m.sub),
            ),
            el(
              "table",
              { style: table },
              el(
                "thead",
                null,
                el(
                  "tr",
                  null,
                  el("th", { style: th }, "计费项"),
                  el("th", { style: th }, isPeak ? "高峰（现）" : "空闲（现）"),
                  el("th", { style: th }, isPeak ? "空闲" : "高峰"),
                ),
              ),
              el(
                "tbody",
                null,
                el(PriceRow, {
                  label: "输入 · 缓存命中",
                  active: rates.hit,
                  other: isPeak ? m.idle.hit : m.peak.hit,
                }),
                el(
                  "tr",
                  null,
                  el(
                    "td",
                    { colSpan: 3, style: Object.assign({}, periodNoteStyle, { color: noteColor }) },
                    noteText,
                  ),
                ),
                el(PriceRow, {
                  label: "输入 · 未命中",
                  active: rates.miss,
                  other: isPeak ? m.idle.miss : m.peak.miss,
                }),
                el(PriceRow, {
                  label: "输出",
                  active: rates.out,
                  other: isPeak ? m.idle.out : m.peak.out,
                }),
              ),
            ),
          )
        }),

        el("div", { style: sectionTitle }, "第三方（固定价）"),
        THIRD_PARTY_MODELS.length
          ? el(
              "table",
              { style: table },
              el(
                "thead",
                null,
                el(
                  "tr",
                  null,
                  el("th", { style: th }, "模型"),
                  el("th", { style: th }, "输入"),
                  el("th", { style: th }, "输出"),
                ),
              ),
              el(
                "tbody",
                null,
                THIRD_PARTY_MODELS.map(function (m) {
                  return el(
                    "tr",
                    { key: m.provider + "/" + m.model },
                    el(
                      "td",
                      { style: td },
                      el("span", { style: modelName }, m.model),
                      el("div", { style: modelSub }, m.provider),
                    ),
                    el("td", { style: td }, fmtPrice(m.input, m.currency)),
                    el("td", { style: td }, fmtPrice(m.output, m.currency)),
                  )
                }),
              ),
            )
          : el("div", { style: note }, "（暂无数据）"),

        el(
          "div",
          { style: footerNote },
          "高峰：周一至周五（不含法定节假日）9:00–12:00、14:00–18:00；其余为空闲。" +
            " DeepSeek 分时段，第三方为固定价；价格为调研时点值，可能变动，以各官方定价页为准。",
        ),
      )
    }

    function PriceRow(props) {
      var activeStyle = { color: "#fff", fontWeight: 600 }
      var otherStyle = { color: "#9aa0aa" }
      return el(
        "tr",
        null,
        el("td", { style: td }, props.label),
        el("td", { style: Object.assign({}, td, activeStyle) }, "¥" + props.active),
        el("td", { style: Object.assign({}, td, otherStyle) }, "¥" + props.other),
      )
    }

    // 根据当前模型 ID 查输出价格（DeepSeek 分时段，第三方固定价）。
    function findOutputPrice(modelId, isPeak) {
      if (!modelId) return null
      for (var i = 0; i < DEEPSEEK_MODELS.length; i++) {
        var m = DEEPSEEK_MODELS[i]
        if (m.name === modelId) {
          return { price: isPeak ? m.peak.out : m.idle.out, currency: "CNY" }
        }
      }
      for (var j = 0; j < THIRD_PARTY_MODELS.length; j++) {
        var t = THIRD_PARTY_MODELS[j]
        if (t.model.toLowerCase() === modelId.toLowerCase()) {
          return { price: t.output, currency: t.currency }
        }
      }
      return null
    }

    function balanceSymbol(currency) {
      return currency === "CNY" ? "¥" : "$"
    }

    function fmtPrice(n, currency) {
      var symbol = currency === "USD" ? "$" : "¥"
      return symbol + String(n)
    }

    // ---------------------------------------------------------------------
    // 注册
    // ---------------------------------------------------------------------
    function apply(ctx) {
      ctx.slots.inject("conversation.composer.dock", function () {
        return ctx.slots.register(
          { name: "conversation.composer.dock", id: "pricing-period", order: 100 },
          PeriodPill,
        )
      })
    }

    return { apply: apply, inject: inject }
  },
})
