import { request } from "./request"
import { formatDateTimeLabel } from "./subscription"

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

/** 积分概览 → 个人中心「用量」汇总 */
export function normalizeCreditOverview(raw: unknown): CreditOverview {
  const data = asRecord(raw) ?? {}
  const usedTotal = pickNumber(
    data.used_total,
    data.used,
    data.consumed,
    data.month_used,
    data.monthly_used,
  )
  const grantedTotal = pickNumber(
    data.granted_total,
    data.granted,
    data.total,
    data.month_granted,
    data.monthly_granted,
    data.quota,
  )
  const remainingTotal = pickNumber(
    data.remaining,
    data.balance,
    data.available,
    grantedTotal - usedTotal,
  )

  return {
    usedTotal,
    grantedTotal: grantedTotal || usedTotal + remainingTotal,
    remainingTotal,
  }
}

/** 功能消耗 Top N → 个人中心「用量」分类条 */
export function normalizeCreditTopFeatures(raw: unknown, limit = 5): CreditFeatureUsage[] {
  const data = asRecord(raw)
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(data?.features)
      ? data.features
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.top_features)
          ? data.top_features
          : []

  return list.slice(0, limit).map((item, index) => {
    const row = asRecord(item) ?? {}
    return {
      name: pickString(row.feature, row.feature_name, row.name, row.label, "其他"),
      amount: pickNumber(row.amount, row.credits, row.points, row.consumed, row.used),
      color: FEATURE_COLORS[index % FEATURE_COLORS.length],
    }
  })
}

function normalizeTransactionDirection(raw: unknown, amount: number): "earn" | "spend" {
  const n = Number(raw)
  if (n === 1) return "earn"
  if (n === 2) return "spend"
  if (amount > 0) return "earn"
  return "spend"
}

/** 积分明细 → 个人中心「明细」表格 */
export function normalizeCreditTransactions(raw: unknown): CreditTransactionsPage {
  const data = asRecord(raw)
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.records)
        ? data.records
        : Array.isArray(data?.list)
          ? data.list
          : []

  const items = list.map((item) => {
    const row = asRecord(item) ?? {}
    const signedAmount = pickNumber(row.amount, row.credits, row.points, row.change)
    const direction = normalizeTransactionDirection(row.direction ?? row.type, signedAmount)
    const amount = signedAmount !== 0
      ? signedAmount
      : direction === "earn"
        ? pickNumber(row.credit, row.gain)
        : -pickNumber(row.debit, row.cost, row.consume)

    return {
      name: pickString(row.feature_name, row.feature, row.title, row.description, row.remark, "积分变动"),
      amount: direction === "spend" && amount > 0 ? -amount : amount,
      direction,
      date: formatDateTimeLabel(row.created_at ?? row.time ?? row.date ?? row.occurred_at),
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
