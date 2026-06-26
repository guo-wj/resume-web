import { request } from "./request"

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function pickString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return ""
}

function pickNumber(...values: unknown[]): number {
  for (const value of values) {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return 0
}

function formatDateLabel(raw: unknown): string {
  const text = pickString(raw)
  if (!text) return "—"
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return text.slice(0, 10)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function formatDateTimeLabel(raw: unknown): string {
  const text = pickString(raw)
  if (!text) return "—"
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return text.replace("T", " ").slice(0, 16)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  const hh = String(date.getHours()).padStart(2, "0")
  const mm = String(date.getMinutes()).padStart(2, "0")
  return `${y}-${m}-${d} ${hh}:${mm}`
}

function formatMoney(cents: number): string {
  if (!cents) return "¥0"
  const yuan = cents / 100
  return yuan % 1 === 0 ? `¥${yuan.toLocaleString("zh-CN")}` : `¥${yuan.toFixed(2)}`
}

const SUBSCRIPTION_STATUS_LABEL: Record<number, string> = {
  1: "订阅中",
  2: "已取消",
  3: "已过期",
  4: "待生效",
}

const BILLING_CYCLE_LABEL: Record<string, string> = {
  month: "按月付费",
  monthly: "按月付费",
  year: "按年付费",
  yearly: "按年付费",
}

export interface SubscriptionCurrent {
  planName: string
  planCode: string | null
  status: string
  statusLabel: string
  renewAt: string
  billingCycleLabel: string
  autoRenew: boolean
}

export interface SubscriptionPlan {
  planCode: string
  name: string
  tier: string
  priceCents: number
  priceLabel: string
  unitLabel: string
  cycle: "month" | "year"
  cycleLabel: string
  saveText: string
  saveColor: string
  dailyCredits: number
  monthlyCredits: number
  features: string[]
  isCurrent: boolean
  canUpgrade: boolean
  recommend: boolean
}

export interface UpgradePreview {
  planCode: string
  planName: string
  originalPriceCents: number
  discountCents: number
  payableCents: number
  payUrl: string
}

export interface SubscribeResult {
  orderId: number | null
  payUrl: string
  qrCode: string
}

function normalizeBillingCycle(raw: unknown): "month" | "year" {
  const text = String(raw ?? "").toLowerCase()
  if (text.includes("year") || text.includes("annual") || text === "2") return "year"
  if (String(raw ?? "").includes("year_")) return "year"
  if (String(raw ?? "").includes("month_")) return "month"
  return "month"
}

function normalizeSubscriptionStatus(raw: unknown): { status: string; label: string } {
  if (typeof raw === "number") {
    return { status: String(raw), label: SUBSCRIPTION_STATUS_LABEL[raw] ?? "未知" }
  }
  const text = String(raw ?? "").toLowerCase()
  if (text.includes("active") || text.includes("subscribed") || text === "1") {
    return { status: "active", label: "订阅中" }
  }
  if (text.includes("cancel")) return { status: "canceled", label: "已取消" }
  if (text.includes("expire")) return { status: "expired", label: "已过期" }
  return { status: text || "unknown", label: pickString(raw) || "未知" }
}

/** 当前订阅信息 → 个人中心「我的方案」 */
export function normalizeSubscriptionCurrent(raw: unknown): SubscriptionCurrent {
  const data = asRecord(raw) ?? {}
  const status = normalizeSubscriptionStatus(data.status ?? data.subscription_status ?? data.state)
  const cycle = normalizeBillingCycle(
    data.billing_cycle ?? data.cycle ?? data.plan_cycle ?? data.plan_code,
  )

  return {
    planName: pickString(data.plan_name, data.planName, data.tier_name, data.name, "免费版"),
    planCode: pickString(data.plan_code, data.planCode) || null,
    status: status.status,
    statusLabel: pickString(data.status_label, data.statusLabel, status.label),
    renewAt: formatDateLabel(
      data.renew_at ?? data.renewal_at ?? data.next_renewal_at ?? data.expire_at ?? data.period_end,
    ),
    billingCycleLabel: pickString(
      data.billing_cycle_label,
      data.cycle_label,
      BILLING_CYCLE_LABEL[cycle],
      cycle === "year" ? "按年付费" : "按月付费",
    ),
    autoRenew: data.auto_renew !== false && data.autoRenew !== false,
  }
}

function normalizePlanFeatures(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => {
      if (typeof item === "string") return item
      const row = asRecord(item)
      return pickString(row?.text, row?.name, row?.label)
    }).filter(Boolean)
  }
  return []
}

/** 订阅计划列表 → 升级页套餐卡片 */
export function normalizeSubscriptionPlans(raw: unknown): SubscriptionPlan[] {
  const data = asRecord(raw)
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(data?.plans)
      ? data.plans
      : Array.isArray(data?.items)
        ? data.items
        : []

  return list.map((item, index) => {
    const row = asRecord(item) ?? {}
    const cycle = normalizeBillingCycle(row.cycle ?? row.billing_cycle ?? row.plan_code)
    const priceCents = pickNumber(row.price_cents, row.price, row.amount_cents, row.amount)
    const monthlyPriceCents = cycle === "year"
      ? Math.round(priceCents / 12)
      : priceCents
    const name = pickString(row.name, row.plan_name, row.tier_name, "套餐")
    const isCurrent = Boolean(row.is_current ?? row.current ?? row.selected)
    const tier = pickString(row.tier, row.tier_code, row.plan_code, name).toLowerCase()

    return {
      planCode: pickString(row.plan_code, row.code, row.id),
      name,
      tier,
      priceCents,
      priceLabel: formatMoney(monthlyPriceCents || priceCents),
      unitLabel: "/月",
      cycle,
      cycleLabel: cycle === "year" ? "年付" : "月付",
      saveText: pickString(row.save_text, row.promo_text, row.description),
      saveColor: cycle === "year" ? "#5A8A1A" : "#9890AE",
      dailyCredits: pickNumber(row.daily_credits, row.daily_points, row.daily_limit),
      monthlyCredits: pickNumber(row.monthly_credits, row.monthly_points, row.monthly_grant),
      features: normalizePlanFeatures(row.features ?? row.benefits ?? row.perks),
      isCurrent,
      canUpgrade: Boolean(row.can_upgrade ?? row.upgradeable ?? (!isCurrent && index > 0)),
      recommend: Boolean(row.recommend ?? row.recommended ?? row.is_popular),
    }
  })
}

export function normalizeUpgradePreview(raw: unknown, planCode: string): UpgradePreview {
  const data = asRecord(raw) ?? {}
  const originalPriceCents = pickNumber(
    data.original_price_cents,
    data.original_amount,
    data.target_price_cents,
    data.price_cents,
  )
  const discountCents = pickNumber(
    data.discount_cents,
    data.deduction_cents,
    data.credit_cents,
    data.refund_cents,
  )
  const payableCents = pickNumber(
    data.payable_cents,
    data.pay_amount_cents,
    data.final_amount_cents,
    originalPriceCents - discountCents,
  )

  return {
    planCode,
    planName: pickString(data.plan_name, data.target_plan_name, data.name),
    originalPriceCents,
    discountCents,
    payableCents,
    payUrl: pickString(data.pay_url, data.qr_url, data.payment_url),
  }
}

export function normalizeSubscribeResult(raw: unknown): SubscribeResult {
  const data = asRecord(raw) ?? {}
  const orderId = pickNumber(data.order_id, data.orderId)
  return {
    orderId: orderId || null,
    payUrl: pickString(data.pay_url, data.qr_url, data.payment_url),
    qrCode: pickString(data.qr_code, data.qrcode, data.qr_url),
  }
}

export async function getSubscriptionCurrent() {
  const data = await request<unknown>("subscription.current")
  return normalizeSubscriptionCurrent(data)
}

export async function getSubscriptionPlans() {
  const data = await request<unknown>("subscription.plans")
  return normalizeSubscriptionPlans(data)
}

export async function previewSubscriptionUpgrade(planCode: string) {
  const data = await request<unknown>("subscription.upgradePreview", { query: { plan_code: planCode } })
  return normalizeUpgradePreview(data, planCode)
}

export async function subscribePlan(planCode: string, payMethod = 1) {
  const data = await request<unknown>("subscription.subscribe", {
    body: { plan_code: planCode, pay_method: payMethod },
  })
  return normalizeSubscribeResult(data)
}

export async function upgradeSubscription(planCode: string, payMethod = 1) {
  const data = await request<unknown>("subscription.upgrade", {
    body: { plan_code: planCode, pay_method: payMethod },
  })
  return normalizeSubscribeResult(data)
}

export { formatDateTimeLabel, formatMoney }
