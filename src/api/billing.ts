import { request } from "./request"
import { formatDateTimeLabel, formatMoney } from "./subscription"

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
  invoiceId: number | null
  invoiceUrl: string
}

export interface BillingOrderInvoiceSummary {
  orderId: number
  invoiceableAmount: string
  originalAmount: string
  discountAmount: string
  totalInvoiceableAmount: string
}

export interface InvoiceDetail {
  id: number
  fileName: string
  amount: string
  date: string
  downloadUrl: string
}

export interface InvoiceApplyInput {
  order_id: number
  invoice_type: 1 | 2
  title_type: 1 | 2
  title: string
  tax_no?: string
  email: string
  remark?: string
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
    const invoiceId = pickNumber(row.invoice_id, row.invoiceId) || null
    const invoiceUrl = pickString(row.invoice_url, row.invoiceUrl, row.pdf_url, row.download_url)

    let inv: BillingOrder["inv"] = "invoiceable"
    if (statusCode === 5 || invoiceStatus === "none" || invoiceStatus === "unavailable") {
      inv = "none"
    } else if (invoiceStatus === "issued" || invoiceStatus === "completed" || invoiceId || invoiceUrl) {
      inv = invoiceUrl ? "download" : "view"
    }

    return {
      id: pickNumber(row.id, row.order_id),
      date: formatDateTimeLabel(row.created_at ?? row.paid_at ?? row.time ?? row.date),
      category: pickString(row.title, row.goods_name, row.category_name, row.description, "订单"),
      amount: formatMoney(amountCents),
      status: pickString(row.status_label, row.status_name, ORDER_STATUS_LABEL[statusCode], "未知"),
      inv,
      invoiceId,
      invoiceUrl,
    }
  })
}

export function normalizeBillingOrderInvoiceSummary(raw: unknown, orderId: number): BillingOrderInvoiceSummary {
  const data = asRecord(raw) ?? {}
  const invoiceableCents = pickNumber(
    data.invoiceable_amount_cents,
    data.invoiceable_cents,
    data.invoice_amount_cents,
    data.payable_invoice_cents,
    data.amount_cents,
    data.pay_amount_cents,
  )
  const originalCents = pickNumber(
    data.original_amount_cents,
    data.original_cents,
    data.subtotal_cents,
    data.total_cents,
    invoiceableCents,
  )
  const discountCents = pickNumber(
    data.discount_amount_cents,
    data.discount_cents,
    data.deduction_cents,
    Math.max(originalCents - invoiceableCents, 0),
  )
  const totalCents = pickNumber(
    data.total_invoiceable_amount_cents,
    data.total_invoiceable_cents,
    data.total_amount_cents,
    invoiceableCents,
  )

  return {
    orderId,
    invoiceableAmount: formatMoney(invoiceableCents),
    originalAmount: formatMoney(originalCents),
    discountAmount: discountCents > 0 ? formatMoney(discountCents) : "—",
    totalInvoiceableAmount: formatMoney(totalCents),
  }
}

export function normalizeInvoiceDetail(raw: unknown): InvoiceDetail {
  const data = asRecord(raw) ?? {}
  const amountCents = pickNumber(data.amount_cents, data.total_cents, data.amount, data.pay_amount_cents)
  const downloadUrl = pickString(data.invoice_url, data.pdf_url, data.download_url, data.file_url)
  const fileName = pickString(data.file_name, data.filename, data.title, "增值税电子普通发票.pdf")

  return {
    id: pickNumber(data.id, data.invoice_id),
    fileName,
    amount: formatMoney(amountCents),
    date: formatDateTimeLabel(data.issued_at ?? data.created_at ?? data.date),
    downloadUrl,
  }
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

export async function getBillingOrderDetail(orderId: number) {
  const data = await request<unknown>("billing.orderDetail", { params: { order_id: orderId } })
  return normalizeBillingOrderInvoiceSummary(data, orderId)
}

export async function applyBillingInvoice(body: InvoiceApplyInput) {
  return request<unknown>("billing.invoiceApply", { body })
}

export async function getBillingInvoiceDetail(invoiceId: number) {
  const data = await request<unknown>("billing.invoiceDetail", { params: { invoice_id: invoiceId } })
  return normalizeInvoiceDetail(data)
}
