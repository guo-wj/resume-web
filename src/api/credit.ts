import { request } from "./request"
import { formatDateTimeLabel } from "./subscription"

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
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

function pickList(raw: unknown, ...keys: string[]): unknown[] {
  if (Array.isArray(raw)) return raw
  const data = asRecord(raw)
  if (!data) return []
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key] as unknown[]
  }
  return []
}

export const FEATURE_COLORS = ["#7C5CFD", "#A78BFA", "#C77BFF", "#FF9E8A", "#3BB89A"]

export interface CreditOverview {
  usedTotal: number
  grantedTotal: number
  remainingTotal: number
}

export interface CreditFeatureUsage {
  name: string
  amount: number
  color: string
}

export interface CreditTransaction {
  name: string
  amount: number
  direction: "earn" | "spend"
  date: string
}

export interface CreditTransactionsPage {
  items: CreditTransaction[]
  total: number
  page: number
  pageSize: number
}

/** 积分概览 → 个人中心「用量」汇总（余额 / 本月已用 / 本月发放） */
export function normalizeCreditOverview(raw: unknown): CreditOverview {
  const root = asRecord(raw) ?? {}
  const data = asRecord(root.overview) ?? root

  const balance = pickNumber(
    data.balance,
    data.remaining,
    data.available,
    data.remaining_total,
    data.remainingTotal,
  )
  const monthUsed = pickNumber(
    data.month_used,
    data.monthUsed,
    data.monthly_used,
    data.monthlyUsed,
    data.used_total,
    data.usedTotal,
    data.used,
    data.consumed,
  )
  const monthGranted = pickNumber(
    data.month_granted,
    data.monthGranted,
    data.monthly_granted,
    data.monthlyGranted,
    data.granted_total,
    data.grantedTotal,
    data.granted,
    data.quota,
    data.total,
  )

  const grantedTotal = monthGranted || (monthUsed + balance)
  const usedTotal = monthUsed
  const remainingTotal = balance || Math.max(grantedTotal - usedTotal, 0)

  return { usedTotal, grantedTotal, remainingTotal }
}

/** 功能消耗 Top N → 个人中心「用量」分类条 */
export function normalizeCreditTopFeatures(raw: unknown, limit = 5): CreditFeatureUsage[] {
  const list = pickList(raw, "top_features", "topFeatures", "features", "items", "list", "data")

  return list.slice(0, limit).map((item, index) => {
    const row = asRecord(item) ?? {}
    return {
      name: pickString(row.feature_name, row.featureName, row.feature, row.name, row.label, "其他"),
      amount: pickNumber(row.amount, row.credits, row.points, row.consumed, row.used, row.value, row.count),
      color: FEATURE_COLORS[index % FEATURE_COLORS.length],
    }
  }).filter((item) => item.name && item.amount > 0)
}

function normalizeTransactionDirection(raw: unknown, amount: number): "earn" | "spend" {
  const n = Number(raw)
  if (n === 1) return "earn"
  if (n === 2) return "spend"
  const text = String(raw ?? "").toLowerCase()
  if (text.includes("earn") || text.includes("gain") || text.includes("grant") || text === "in") return "earn"
  if (text.includes("spend") || text.includes("consume") || text.includes("debit") || text === "out") return "spend"
  if (amount > 0) return "earn"
  return "spend"
}

/** 积分明细 → 个人中心「明细」表格 */
export function normalizeCreditTransactions(raw: unknown): CreditTransactionsPage {
  const data = asRecord(raw)
  const list = pickList(raw, "items", "records", "list", "transactions", "data")

  const items = list.map((item) => {
    const row = asRecord(item) ?? {}
    const direction = normalizeTransactionDirection(row.direction ?? row.type ?? row.change_type, 0)
    const rawAmount = pickNumber(row.amount, row.credits, row.points, row.change, row.credit, row.debit)
    const amount = direction === "spend"
      ? (rawAmount > 0 ? -rawAmount : rawAmount || -pickNumber(row.cost, row.consume))
      : (rawAmount > 0 ? rawAmount : pickNumber(row.gain, row.credit))

    return {
      name: pickString(
        row.feature_name,
        row.featureName,
        row.feature,
        row.title,
        row.description,
        row.desc,
        row.remark,
        row.summary,
        "积分变动",
      ),
      amount,
      direction,
      date: formatDateTimeLabel(row.created_at ?? row.createdAt ?? row.time ?? row.date ?? row.occurred_at),
    }
  })

  return {
    items,
    total: pickNumber(data?.total, data?.count, items.length),
    page: pickNumber(data?.page, 1),
    pageSize: pickNumber(data?.page_size, data?.pageSize, 20),
  }
}

export async function getCreditOverview() {
  const data = await request<unknown>("credit.overview")
  return normalizeCreditOverview(data)
}

export async function getCreditTopFeatures(limit = 5) {
  const data = await request<unknown>("credit.topFeatures", { query: { limit } })
  return normalizeCreditTopFeatures(data, limit)
}

export async function getCreditTransactions(query?: {
  page?: number
  page_size?: number
  direction?: 1 | 2
  feature?: string
  start_date?: string
  end_date?: string
}) {
  const data = await request<unknown>("credit.transactions", { query })
  return normalizeCreditTransactions(data)
}

/** 订阅页一次性加载：概览 + Top 功能 + 明细 */
export async function loadSubscriptionUsageData() {
  const [overview, topFeatures, transactions] = await Promise.all([
    getCreditOverview(),
    getCreditTopFeatures(5),
    getCreditTransactions({ page: 1, page_size: 20 }),
  ])
  return { overview, topFeatures, transactions }
}
