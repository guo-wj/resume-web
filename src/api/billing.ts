import { request } from "./request"
import { formatDateTimeLabel, formatMoney } from "./subscription"

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

const ORDER_STATUS_LABEL: Record<number, string> = {
  1: "待支付",
  2: "已支付",
  3: "已关闭",
  4: "已取消",
  5: "已退款",
}

export interface BillingOrder {
  id: number
  date: string
  category: string
  amount: string
  status: string
  inv: "invoiceable" | "view" | "download" | "none"
}

export function normalizeBillingOrders(raw: unknown): BillingOrder[] {
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

  return list.map((item) => {
    const row = asRecord(item) ?? {}
    const statusCode = pickNumber(row.status, row.order_status)
    const amountCents = pickNumber(row.amount_cents, row.total_cents, row.amount, row.pay_amount)
    const invoiceStatus = pickString(row.invoice_status, row.invoice_state).toLowerCase()

    let inv: BillingOrder["inv"] = "invoiceable"
    if (statusCode === 5 || invoiceStatus === "none" || invoiceStatus === "unavailable") {
      inv = "none"
    } else if (invoiceStatus === "issued" || invoiceStatus === "completed") {
      inv = row.invoice_url ? "download" : "view"
    }

    return {
      id: pickNumber(row.id, row.order_id),
      date: formatDateTimeLabel(row.created_at ?? row.paid_at ?? row.time ?? row.date),
      category: pickString(row.title, row.goods_name, row.category_name, row.description, "订单"),
      amount: formatMoney(amountCents),
      status: pickString(row.status_label, row.status_name, ORDER_STATUS_LABEL[statusCode], "未知"),
      inv,
    }
  })
}

export async function getBillingOrders(query?: {
  page?: number
  page_size?: number
  category?: number
  status?: number
}) {
  const data = await request<unknown>("billing.orders", { query })
  return normalizeBillingOrders(data)
}
