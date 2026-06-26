import type { ApiEndpoint } from "./types"

/**
 * 后端服务表 — API 端点单一数据源
 *
 * 开发环境：VITE_API_BASE（默认 /api）经 Vite 代理到 VITE_SERVER
 * 生产环境：由部署侧配置同前缀反向代理
 */
export const API_ENDPOINTS: ApiEndpoint[] = [
  // ── 认证 ──────────────────────────────────────────
  {
    key: "auth.sendCode",
    module: "认证",
    method: "POST",
    path: "/v1/auth/code/send",
    description: "发送验证码到手机/邮箱，自动识别渠道",
  },
  {
    key: "auth.loginByCode",
    module: "认证",
    method: "POST",
    path: "/v1/auth/login/code",
    description: "验证码登录 / 注册",
  },
  {
    key: "auth.loginByPassword",
    module: "认证",
    method: "POST",
    path: "/v1/auth/login/password",
    description: "密码登录",
  },
  {
    key: "auth.wechatQrcode",
    module: "认证",
    method: "GET",
    path: "/v1/auth/wechat/qrcode",
    description: "获取微信扫码登录二维码",
  },
  {
    key: "auth.wechatStatus",
    module: "认证",
    method: "GET",
    path: "/v1/auth/wechat/status",
    description: "轮询微信扫码状态",
  },
  {
    key: "auth.logout",
    module: "认证",
    method: "POST",
    path: "/v1/auth/logout",
    description: "退出登录，吊销 refresh_token",
    auth: true,
  },

  // ── 用户中心 ──────────────────────────────────────
  {
    key: "user.profile",
    module: "用户中心",
    method: "GET",
    path: "/v1/user/profile",
    description: "获取当前用户信息",
    auth: true,
  },
  {
    key: "user.setPassword",
    module: "用户中心",
    method: "POST",
    path: "/v1/user/password",
    description: "设置 / 修改登录密码",
    auth: true,
  },
  {
    key: "user.bindings",
    module: "用户中心",
    method: "GET",
    path: "/v1/user/bindings",
    description: "查询已绑定渠道列表",
    auth: true,
  },
  {
    key: "user.bindCode",
    module: "用户中心",
    method: "POST",
    path: "/v1/user/bind/code",
    description: "绑定 / 换绑手机号或邮箱",
    auth: true,
  },
  {
    key: "user.bindWechat",
    module: "用户中心",
    method: "POST",
    path: "/v1/user/bind/wechat",
    description: "绑定微信",
    auth: true,
  },
  {
    key: "user.bindApple",
    module: "用户中心",
    method: "POST",
    path: "/v1/user/bind/apple",
    description: "绑定 Apple ID（P2 预留）",
    auth: true,
  },

  // ── 订阅管理 ──────────────────────────────────────
  {
    key: "subscription.current",
    module: "订阅管理",
    method: "GET",
    path: "/v1/subscription/current",
    description: "当前订阅信息",
    auth: true,
  },
  {
    key: "subscription.plans",
    module: "订阅管理",
    method: "GET",
    path: "/v1/subscription/plans",
    description: "订阅计划列表（连续包月/包年）",
    auth: true,
  },
  {
    key: "subscription.subscribe",
    module: "订阅管理",
    method: "POST",
    path: "/v1/subscription/subscribe",
    description: "开通订阅",
    auth: true,
  },
  {
    key: "subscription.upgrade",
    module: "订阅管理",
    method: "POST",
    path: "/v1/subscription/upgrade",
    description: "升级订阅（补差价，仅可升级）",
    auth: true,
  },
  {
    key: "subscription.upgradePreview",
    module: "订阅管理",
    method: "GET",
    path: "/v1/subscription/upgrade/preview",
    description: "升级差价预览",
    auth: true,
  },

  // ── 积分管理 ──────────────────────────────────────
  {
    key: "credit.overview",
    module: "积分管理",
    method: "GET",
    path: "/v1/credit/overview",
    description: "积分概览（余额/本月已用/本月发放）",
    auth: true,
  },
  {
    key: "credit.topFeatures",
    module: "积分管理",
    method: "GET",
    path: "/v1/credit/top-features",
    description: "消耗最多的功能 Top5",
    auth: true,
  },
  {
    key: "credit.transactions",
    module: "积分管理",
    method: "GET",
    path: "/v1/credit/transactions",
    description: "积分明细报表（支持日期/类型/功能过滤）",
    auth: true,
  },

  // ── 账单管理 ──────────────────────────────────────
  {
    key: "billing.orders",
    module: "账单管理",
    method: "GET",
    path: "/v1/billing/orders",
    description: "账单列表（订阅/升级/加量包/退款）",
    auth: true,
  },
  {
    key: "billing.orderDetail",
    module: "账单管理",
    method: "GET",
    path: "/v1/billing/orders/:order_id",
    description: "账单详情",
    auth: true,
  },
  {
    key: "billing.invoiceApply",
    module: "账单管理",
    method: "POST",
    path: "/v1/billing/invoices",
    description: "申请开票",
    auth: true,
  },
  {
    key: "billing.invoiceDetail",
    module: "账单管理",
    method: "GET",
    path: "/v1/billing/invoices/:invoice_id",
    description: "发票详情",
    auth: true,
  },

  // ── 优惠与活动 ────────────────────────────────────
  {
    key: "promo.coupons",
    module: "优惠",
    method: "GET",
    path: "/promo/coupons",
    description: "我的优惠券",
    auth: true,
  },
  {
    key: "promo.redeem",
    module: "优惠",
    method: "POST",
    path: "/promo/redeem",
    description: "兑换码兑换",
    auth: true,
  },

  // ── 通知 ──────────────────────────────────────────
  {
    key: "notifications.list",
    module: "通知",
    method: "GET",
    path: "/notifications",
    description: "消息列表",
    auth: true,
  },
  {
    key: "notifications.readAll",
    module: "通知",
    method: "POST",
    path: "/notifications/read-all",
    description: "全部标为已读",
    auth: true,
  },

  // ── 简历（核心业务）──────────────────────────────
  {
    key: "resume.list",
    module: "简历",
    method: "GET",
    path: "/resumes",
    description: "简历列表",
    auth: true,
  },
  {
    key: "resume.create",
    module: "简历",
    method: "POST",
    path: "/resumes",
    description: "创建简历",
    auth: true,
  },
  {
    key: "resume.detail",
    module: "简历",
    method: "GET",
    path: "/resumes/:id",
    description: "简历详情",
    auth: true,
  },
  {
    key: "resume.chat",
    module: "简历",
    method: "POST",
    path: "/resumes/chat",
    description: "AI 对话生成简历",
    auth: true,
  },
  {
    key: "resume.export",
    module: "简历",
    method: "POST",
    path: "/resumes/:id/export",
    description: "导出 PDF",
    auth: true,
  },
]

/** key → endpoint 索引 */
export const API_ENDPOINT_MAP = Object.fromEntries(
  API_ENDPOINTS.map((ep) => [ep.key, ep]),
) as Record<string, ApiEndpoint>

/** 按模块分组 */
export function groupEndpointsByModule(): Record<string, ApiEndpoint[]> {
  return API_ENDPOINTS.reduce<Record<string, ApiEndpoint[]>>((acc, ep) => {
    ;(acc[ep.module] ??= []).push(ep)
    return acc
  }, {})
}

/** 拼接完整请求路径（支持 :id 路径参数替换） */
export function resolveApiPath(
  key: string,
  params?: Record<string, string | number>,
): string {
  const ep = API_ENDPOINT_MAP[key]
  if (!ep) throw new Error(`Unknown API key: ${key}`)

  let path = ep.path
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      path = path.replace(`:${k}`, String(v))
    }
  }
  return path
}
