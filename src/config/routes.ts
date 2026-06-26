/**
 * 前端路由表 — 全站路由单一数据源
 *
 * - APP_ROUTES：React Router 页面级路由
 * - CONSOLE_NAV：工作台 /console 内 hash 子路由
 * - LANDING_SCREENS：首页 LandingApp 内部视图（非 URL 路由）
 */

export interface AppRoute {
  /** 浏览器路径 */
  path: string
  /** 路由标识 */
  name: string
  /** 页面组件 */
  component: string
  /** 说明 */
  description: string
  /** 是否在导航中展示 */
  nav?: boolean
}

export interface ConsoleSubRoute {
  id: string
  label: string
}

export interface ConsoleNavItem {
  id: string
  label: string
  icon: string
  badge?: number
  subs?: ConsoleSubRoute[]
}

export interface LandingScreen {
  id: string
  label: string
  description: string
}

/** React Router 页面路由 */
export const APP_ROUTES: AppRoute[] = [
  {
    path: "/",
    name: "landing",
    component: "LandingApp",
    description: "首页 · 登录注册 · AI 对话创建简历",
    nav: true,
  },
  {
    path: "/console",
    name: "console",
    component: "DashboardApp",
    description: "工作台 · 会员 / 积分 / 订单 / 设置",
    nav: true,
  },
]

/** 工作台侧边栏导航（hash 路由：/console#overview、/console#membership.current …） */
export const CONSOLE_NAV: ConsoleNavItem[] = [
  { id: "overview", label: "概览", icon: "grid" },
  {
    id: "membership",
    label: "我的会员",
    icon: "crown",
    subs: [
      { id: "current", label: "当前订阅" },
      { id: "plans", label: "套餐订阅" },
      { id: "renewal", label: "续费管理" },
    ],
  },
  {
    id: "credits",
    label: "积分中心",
    icon: "coins",
    subs: [
      { id: "balance", label: "余额与明细" },
      { id: "buy", label: "购买积分" },
      { id: "auto", label: "自动充值" },
    ],
  },
  {
    id: "orders",
    label: "订单与发票",
    icon: "receipt",
    badge: 1,
    subs: [
      { id: "list", label: "订单记录" },
      { id: "invoice", label: "发票管理" },
      { id: "refund", label: "退款申请" },
    ],
  },
  {
    id: "stats",
    label: "消耗统计",
    icon: "chart",
    subs: [
      { id: "overview", label: "概览" },
      { id: "detail", label: "明细" },
    ],
  },
  {
    id: "promo",
    label: "优惠与活动",
    icon: "gift",
    subs: [
      { id: "coupons", label: "优惠券" },
      { id: "redeem", label: "兑换码" },
    ],
  },
  {
    id: "settings",
    label: "账户设置",
    icon: "settings",
    subs: [
      { id: "profile", label: "个人资料" },
      { id: "security", label: "登录与安全" },
      { id: "notify", label: "通知偏好" },
    ],
  },
]

/** 工作台分组标题 */
export const CONSOLE_GROUP_TITLE: Record<string, string> = Object.fromEntries(
  CONSOLE_NAV.map((item) => [item.id, item.label]),
)

/** 首页内部视图（组件 state，不反映在 URL） */
export const LANDING_SCREENS: LandingScreen[] = [
  { id: "landing", label: "落地页", description: "营销首页" },
  { id: "chat", label: "AI 对话", description: "对话式创建简历" },
  { id: "createMethod", label: "创建方式", description: "选择简历创建入口" },
  { id: "fullAuth", label: "整屏登录", description: "全屏登录页（开发调试）" },
]

/** 默认工作台路由 */
export const CONSOLE_DEFAULT_ROUTE = "overview"

/** 解析工作台 hash 路由 */
export function parseConsoleRoute(hash: string): { group: string; sub?: string } {
  const route = hash.replace(/^#/, "") || CONSOLE_DEFAULT_ROUTE
  const [group, sub] = route.split(".")
  return { group, sub }
}

/** 生成工作台 hash 路径 */
export function toConsoleRoute(group: string, sub?: string): string {
  return sub ? `${group}.${sub}` : group
}

/** 生成工作台完整 URL */
export function consoleUrl(route: string): string {
  return `/console#${route}`
}

/** 侧边栏 NAV 使用的 subs 元组格式（兼容 DashboardApp） */
export function consoleNavForSidebar(): Array<
  Omit<ConsoleNavItem, "subs"> & { subs?: [string, string][] }
> {
  return CONSOLE_NAV.map((item) => ({
    ...item,
    subs: item.subs?.map((s) => [s.id, s.label] as [string, string]),
  }))
}
