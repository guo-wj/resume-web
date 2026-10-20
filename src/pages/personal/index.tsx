import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react"
import { useNavigate } from "react-router-dom"
import type { PersonalPageId } from "@/constant"
import { buildQr } from "@/utils"
import bgImage from "@/assets/personal/bg.png"
import { Sidebar } from "./components/Sidebar"
import { Toast } from "./components/Ui"
import { useAccountTab } from "./hooks/useAccountTab"
import { useBillsTab } from "./hooks/useBillsTab"
import { useSubscriptionTab } from "./hooks/useSubscriptionTab"
import { useToast } from "./hooks/useToast"
import { PersonalModals } from "./components/PersonalModals"
import { PricingOverlay } from "./components/PricingOverlay"
import { AccountTab } from "./components/AccountTab"
import { BillsTab } from "./components/BillsTab"
import { SubscriptionTab } from "./components/SubscriptionTab"
import type { PersonalModalId } from "./types"
import { isPricingNestedModal } from "./types"
import "./index.scss"

const PAGE_HASH: Record<PersonalPageId, string> = {
  account: "account",
  usage: "usage",
  bills: "bills",
}

function pageFromHash(hash: string): PersonalPageId {
  const id = hash.replace(/^#/, "")
  if (id === "usage" || id === "bills" || id === "account") return id
  return "account"
}

export function PersonalCenter() {
  const navigate = useNavigate()
  const [page, setPage] = useState<PersonalPageId>(() => pageFromHash(window.location.hash))
  const [pricingOpen, setPricingOpen] = useState(false)
  const [modal, setModal] = useState<PersonalModalId>(null)

  const { toast, showToast, clearToastTimer } = useToast()
  const qrCells = useMemo(() => buildQr(), [])

  const accountResetRef = useRef<(() => void) | null>(null)
  const billsResetRef = useRef<(() => void) | null>(null)

  const closeModal = useCallback(() => {
    accountResetRef.current?.()
    billsResetRef.current?.()
    setModal(null)
  }, [])

  const account = useAccountTab({ showToast, modal, setModal, closeModal })
  accountResetRef.current = account.resetAccountModalFields

  const subscription = useSubscriptionTab({ showToast, modal, setModal, closeModal, setPricingOpen })

  const bills = useBillsTab({ showToast, setModal, closeModal })
  billsResetRef.current = bills.resetInvoiceFields

  const handleBack = useCallback(() => {
    if (window.history.length > 1) navigate(-1)
    else navigate("/console")
  }, [navigate])

  const handlePageChange = useCallback((next: PersonalPageId) => {
    setPage(next)
    const hash = PAGE_HASH[next]
    if (window.location.hash.replace(/^#/, "") !== hash) {
      window.history.replaceState(null, "", `#${hash}`)
    }
  }, [])

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, "", `#${PAGE_HASH.account}`)
    }
    account.loadAccount()
    subscription.loadSubscription()
    subscription.loadUsage()
    subscription.loadPlans()
    bills.loadBills()
  // 有缓存则直接展示，无缓存才请求；同一会话内不重复拉取
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onHash = () => setPage(pageFromHash(window.location.hash))
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      if (modal) closeModal()
      else if (pricingOpen) setPricingOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      clearToastTimer()
    }
  }, [modal, pricingOpen, closeModal, clearToastTimer])

  const stop = (e: MouseEvent) => e.stopPropagation()

  return (
    <div className="pc-root personalPage">
      <div className="personalPage-bg" aria-hidden>
        <img src={bgImage} alt="" />
      </div>

      <Sidebar page={page} onPageChange={handlePageChange} onClose={handleBack} />

      <main className={`pc-scroll personalPage-main`}>
        <div className="personalPage-content">
          {page === "account" && (
            <AccountTab
              accountLoading={account.accountLoading}
              profile={account.profile}
              displayName={account.displayName}
              displayAccount={account.displayAccount}
              avatarLetter={account.avatarLetter}
              hasPassword={account.hasPassword}
              bindings={account.bindings}
              onOpenPassword={account.openPassword}
            />
          )}
          {page === "usage" && (
            <SubscriptionTab
              subscriptionLoading={subscription.subscriptionLoading}
              usageLoading={subscription.usageLoading}
              planName={subscription.planName}
              planStatusLabel={subscription.planStatusLabel}
              planRenewText={subscription.planRenewText}
              usedTotal={subscription.usedTotal}
              grandTotal={subscription.grandTotal}
              usageFeatures={subscription.usageFeatures}
              remaining={subscription.remaining}
              detailRows={subscription.detailRows}
              onOpenPricing={() => setPricingOpen(true)}
            />
          )}
          {page === "bills" && (
            <BillsTab
              bills={bills.bills}
              billsLoading={bills.billsLoading}
              onOpenInvoice={bills.openInvoice}
              onViewInvoice={bills.viewInvoice}
              onDownloadInvoice={bills.downloadInvoice}
            />
          )}
        </div>

        {pricingOpen && (
          <PricingOverlay
            onClose={() => setPricingOpen(false)}
            hideClose={isPricingNestedModal(modal)}
            cycle={subscription.cycle}
            setCycle={subscription.setCycle}
            plansLoading={subscription.plansLoading}
            plans={subscription.plans}
            faqOpen={subscription.faqOpen}
            setFaqOpen={subscription.setFaqOpen}
            onOpenAddon={subscription.openAddon}
            onOpenCancel={subscription.openCancel}
          />
        )}
      </main>

      <PersonalModals
        modal={modal}
        pricingOpen={pricingOpen}
        stop={stop}
        closeModal={closeModal}
        phoneBinding={account.phoneBinding}
        emailBinding={account.emailBinding}
        bindModal={account.bindModal}
        passwordModal={account.passwordModal}
        wechatModal={account.wechatModal}
        qrCells={qrCells}
        upgradeTarget={subscription.upgradeTarget}
        upgradePreview={subscription.upgradePreview}
        upgradeLoading={subscription.upgradeLoading}
        yr={subscription.yr}
        onConfirmUpgrade={subscription.confirmUpgrade}
        planName={subscription.planName}
        cancelExpireDate={subscription.cancelExpireDate}
        onConfirmCancel={subscription.confirmCancel}
        invoiceModal={bills.invoiceModal}
        invoiceSummary={bills.invoiceSummary}
        invoiceSummaryLoading={bills.invoiceSummaryLoading}
        invoiceSubmitting={bills.invoiceSubmitting}
        viewInvoiceDetail={bills.viewInvoiceDetail}
        viewInvoiceLoading={bills.viewInvoiceLoading}
        onSubmitInvoice={bills.submitInvoice}
        onDownloadInvoice={bills.downloadInvoice}
      />

      <Toast message={toast} />
    </div>
  )
}
