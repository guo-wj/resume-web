import { useCallback, useState } from "react"
import { ApiError, loadPersonalBillingData } from "@/api"
import type { BillingOrder } from "@/api/billing"
import { getPersonalCenterCache } from "@/store"
import { BILL_DATA } from "@/constant"
import type { BillFallbackRow } from "@/constant"
import type { UseBillsTabParams } from "../types"

export function useBillsTab({ showToast, setModal, closeModal }: UseBillsTabParams) {
  const initialPcCache = getPersonalCenterCache()

  const [billData, setBillData] = useState<BillingOrder[] | null>(initialPcCache?.bills ?? null)
  const [billsLoading, setBillsLoading] = useState(initialPcCache?.bills == null)

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

  const bills: (BillingOrder | BillFallbackRow)[] = billData ?? (billsLoading ? [] : BILL_DATA)

  const openInvoice = () => {
    setInvType("normal")
    setInvHead("company")
    setInvTitle("")
    setInvTax("")
    setInvEmail("")
    setInvNote("")
    setInvErr("")
    setModal("invoice")
  }
  const viewInvoice = () => setModal("viewInvoice")
  const submitInvoice = () => {
    if (!invTitle.trim()) { setInvErr("请填写发票抬头"); return }
    if (invHead === "company" && !invTax.trim()) { setInvErr("请填写企业税号"); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invEmail)) { setInvErr("请填写正确的接收邮箱"); return }
    closeModal()
    showToast("开票申请已提交，发票将发送至邮箱")
  }
  const downloadInvoice = () => showToast("开始下载发票 PDF（原型示意）")

  const resetInvoiceFields = useCallback(() => {
    setInvErr("")
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
