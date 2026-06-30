import { useCallback, useState } from "react"
import {
  ApiError,
  applyBillingInvoice,
  getBillingInvoiceDetail,
  getBillingOrderDetail,
  loadPersonalBillingData,
} from "@/api"
import type { BillingOrder, BillingOrderInvoiceSummary, InvoiceDetail } from "@/api/billing"
import { getPersonalCenterCache } from "@/store"
import type { UseBillsTabParams } from "../types"

export function useBillsTab({ showToast, setModal, closeModal }: UseBillsTabParams) {
  const initialPcCache = getPersonalCenterCache()

  const [billData, setBillData] = useState<BillingOrder[] | null>(initialPcCache?.bills ?? null)
  const [billsLoading, setBillsLoading] = useState(initialPcCache?.bills == null)

  const [invoiceOrderId, setInvoiceOrderId] = useState<number | null>(null)
  const [invoiceSummary, setInvoiceSummary] = useState<BillingOrderInvoiceSummary | null>(null)
  const [invoiceSummaryLoading, setInvoiceSummaryLoading] = useState(false)
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false)

  const [viewInvoiceDetail, setViewInvoiceDetail] = useState<InvoiceDetail | null>(null)
  const [viewInvoiceLoading, setViewInvoiceLoading] = useState(false)

  const [invType, setInvType] = useState("normal")
  const [invHead, setInvHead] = useState("company")
  const [invTitle, setInvTitle] = useState("")
  const [invTax, setInvTax] = useState("")
  const [invEmail, setInvEmail] = useState("")
  const [invNote, setInvNote] = useState("")
  const [invErr, setInvErr] = useState("")

  const loadBills = useCallback(async (force = false) => {
    if (!force) {
      const cached = getPersonalCenterCache()
      if (cached?.bills != null) {
        setBillData(cached.bills)
        setBillsLoading(false)
        return
      }
    }

    setBillsLoading(true)
    try {
      const data = await loadPersonalBillingData(force)
      setBillData(data)
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "加载账单失败")
    } finally {
      setBillsLoading(false)
    }
  }, [showToast])

  const bills: BillingOrder[] = billData ?? []

  const openInvoice = useCallback(async (orderId: number) => {
    setInvoiceOrderId(orderId)
    setInvType("normal")
    setInvHead("company")
    setInvTitle("")
    setInvTax("")
    setInvEmail("")
    setInvNote("")
    setInvErr("")
    setInvoiceSummary(null)
    setModal("invoice")

    setInvoiceSummaryLoading(true)
    try {
      const summary = await getBillingOrderDetail(orderId)
      setInvoiceSummary(summary)
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "加载开票信息失败")
      closeModal()
    } finally {
      setInvoiceSummaryLoading(false)
    }
  }, [setModal, showToast, closeModal])

  const viewInvoice = useCallback(async (order: BillingOrder) => {
    setViewInvoiceDetail(null)
    setModal("viewInvoice")

    if (order.invoiceUrl) {
      setViewInvoiceDetail({
        id: order.invoiceId ?? order.id,
        fileName: "增值税电子普通发票.pdf",
        amount: order.amount,
        date: order.date,
        downloadUrl: order.invoiceUrl,
      })
      return
    }

    if (!order.invoiceId) {
      showToast("未找到发票信息")
      closeModal()
      return
    }

    setViewInvoiceLoading(true)
    try {
      const detail = await getBillingInvoiceDetail(order.invoiceId)
      setViewInvoiceDetail(detail)
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "加载发票失败")
      closeModal()
    } finally {
      setViewInvoiceLoading(false)
    }
  }, [setModal, showToast, closeModal])

  const submitInvoice = useCallback(async () => {
    if (!invoiceOrderId) {
      setInvErr("未选择账单")
      return
    }
    if (!invTitle.trim()) { setInvErr("请填写发票抬头"); return }
    if (invHead === "company" && !invTax.trim()) { setInvErr("请填写企业税号"); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invEmail)) { setInvErr("请填写正确的接收邮箱"); return }

    setInvoiceSubmitting(true)
    try {
      await applyBillingInvoice({
        order_id: invoiceOrderId,
        invoice_type: invType === "special" ? 2 : 1,
        title_type: invHead === "company" ? 2 : 1,
        title: invTitle.trim(),
        tax_no: invHead === "company" ? invTax.trim() : "",
        email: invEmail.trim(),
        remark: invNote.trim(),
      })
      closeModal()
      showToast("开票申请已提交，发票将发送至邮箱")
      await loadBills(true)
    } catch (err) {
      setInvErr(err instanceof ApiError ? err.message : "提交开票申请失败")
    } finally {
      setInvoiceSubmitting(false)
    }
  }, [invoiceOrderId, invType, invHead, invTitle, invTax, invEmail, invNote, closeModal, showToast, loadBills])

  const downloadInvoice = useCallback((order?: BillingOrder) => {
    const url = order?.invoiceUrl || viewInvoiceDetail?.downloadUrl
    if (!url) {
      showToast("暂无可下载的发票文件")
      return
    }
    window.open(url, "_blank", "noopener,noreferrer")
  }, [viewInvoiceDetail, showToast])

  const resetInvoiceFields = useCallback(() => {
    setInvErr("")
    setInvoiceOrderId(null)
    setInvoiceSummary(null)
    setViewInvoiceDetail(null)
  }, [])

  return {
    loadBills,
    bills,
    billsLoading,
    openInvoice,
    viewInvoice,
    submitInvoice,
    downloadInvoice,
    resetInvoiceFields,
    invoiceSummary,
    invoiceSummaryLoading,
    invoiceSubmitting,
    viewInvoiceDetail,
    viewInvoiceLoading,
    invoiceModal: {
      invType, setInvType,
      invHead, setInvHead,
      invTitle, setInvTitle,
      invTax, setInvTax,
      invEmail, setInvEmail,
      invNote, setInvNote,
      invErr, setInvErr,
    },
  }
}
