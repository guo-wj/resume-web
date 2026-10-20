/**
 * 前端路由表 — 全站路由单一数据源
 *
 * - APP_ROUTES：React Router 页面级路由
 * - CONSOLE_NAV：工作台 /console 侧边栏导航
 * - LANDING_SCREENS：首页 landing 内部视图（非 URL；chat 已独立为 /chat）
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
    description: "首页 · 登录注册",
    nav: true,
  },
  {
    path: "/chat",
    name: "chat",
    component: "LandingApp",
    description: "AI 对话 · /chat/:sessionId 挂载会话",
    nav: false,
  },
  {
    path: "/chat/:sessionId",
    name: "chatSession",
    component: "LandingApp",
    description: "AI 对话会话页（刷新保持同一 session）",
    nav: false,
  },
  {
    path: "/console",
    name: "console",
    component: "DashboardApp",
    description: "工作台 · 我的简历 / 履历 / 面试准备",
    nav: true,
  },
  {
    path: "/console/edit/:resumeId?",
    name: "resumeEdit",
    component: "ResumeEditApp",
    description: "AI 简历修改 · 对话 / 表单",
    nav: false,
  },
  {
    path: "/surprise",
    name: "surprise",
    component: "SurpriseApp",
    description: "惊喜页 · 简历优化界面原型",
    nav: false,
  },
  {
    path: "/personal",
    name: "personal",
    component: "PersonalCenterApp",
    description: "账户设置 · 个人主页 / 订阅 / 账单",
    nav: false,
  },
]

/** 工作台侧边栏导航 */
export const CONSOLE_NAV: ConsoleNavItem[] = [
  { id: "resume", label: "我的简历", icon: "resume" },
  { id: "profile", label: "个人履历", icon: "profile" },
  { id: "interview", label: "面试准备", icon: "interview" },
]

/** 工作台分组标题 */
export const CONSOLE_GROUP_TITLE: Record<string, string> = Object.fromEntries(
  CONSOLE_NAV.map((item) => [item.id, item.label]),
)

/** 首页内部视图（fullAuth 仍为组件 state；chat 已独立为 /chat） */
export const LANDING_SCREENS: LandingScreen[] = [
  { id: "landing", label: "落地页", description: "营销首页" },
  { id: "fullAuth", label: "整屏登录", description: "全屏登录页（开发调试）" },
]

/** 默认工作台路由 */
export const CONSOLE_DEFAULT_ROUTE = "resume"

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

/** 侧边栏 NAV 使用的 subs 元组格式（兼容 dashboard） */
export function consoleNavForSidebar(): Array<
  Omit<ConsoleNavItem, "subs"> & { subs?: [string, string][] }
> {
  return CONSOLE_NAV.map((item) => ({
    ...item,
    subs: item.subs?.map((s) => [s.id, s.label] as [string, string]),
  }))
}
