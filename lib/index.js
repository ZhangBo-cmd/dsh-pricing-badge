// dsh-pricing-badge —— node（Host）半边。
// 注册本地 HTTP 路由 /pricing-balance，供浏览器半边读取 DeepSeek 账户余额。
// 余额接口需要 API key，且浏览器直连 api.deepseek.com 有跨域限制，
// 因此必须在 Host 侧代取。
export const name = "dsh-pricing-badge"
export const inject = ["webServer", "credentials"]

export function apply(ctx) {
  ctx.effect(() =>
    ctx.webServer.register({
      kind: "exact",
      path: "/pricing-balance",
      handler: async (req, res) => {
        res.setHeader("Content-Type", "application/json")
        res.setHeader("Cache-Control", "no-store")
        try {
          const hit = await ctx.credentials.resolve("DEEPSEEK_API_KEY")
          const key = hit && hit.value ? hit.value : process.env.DEEPSEEK_API_KEY
          if (!key) {
            res.writeHead(200)
            res.end(JSON.stringify({ ok: false, error: "no-key" }))
            return
          }
          const resp = await fetch("https://api.deepseek.com/user/balance", {
            headers: { Authorization: "Bearer " + key, Accept: "application/json" },
          })
          if (!resp.ok) {
            res.writeHead(200)
            res.end(JSON.stringify({ ok: false, error: "http-" + resp.status }))
            return
          }
          const data = await resp.json()
          res.writeHead(200)
          res.end(JSON.stringify({ ok: true, data }))
        } catch (err) {
          res.writeHead(200)
          res.end(JSON.stringify({ ok: false, error: String((err && err.message) || err) }))
        }
      },
    }),
  )
}
