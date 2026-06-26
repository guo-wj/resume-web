import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react"
import type { PersonalPageId } from "@/constant"
import { buildQr } from "@/utils"
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
import type { PersonalCenterProps, PersonalModalId } from "./types"
import './index.scss'

export function PersonalCenter({ onClose = () => {} }: PersonalCenterProps) {
  const [page, setPage] = useState<PersonalPageId>("account")
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

  useEffect(() => {
    account.loadAccount()
    subscription.loadSubscription()
    subscription.loadPlans()
    bills.loadBills()
  // 有缓存则直接展示，无缓存才请求；同一会话内不重复拉取
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      if (modal) closeModal()
      else if (pricingOpen) setPricingOpen(false)
      else onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
      clearToastTimer()
    }
  }, [modal, pricingOpen, closeModal, onClose, clearToastTimer])

  const stop = (e: MouseEvent) => e.stopPropagation()

  const handlePrimaryBackdropClick = () => {
    if (modal || pricingOpen) return
    onClose()
  }

  return (
    <div className="pc-root">
      <div className="personalCenter-backdrop" onClick={handlePrimaryBackdropClick} role="presentation">
        <div className={`pc-scroll personalCenter-panel`} onClick={stop} role="presentation">
          <button
            type="button"
            onClick={onClose}
            className={`pc-chip personalCenter-closeBtn`}
            aria-label="关闭"
          >
            ✕
          </button>

          <Sidebar page={page} onPageChange={setPage} onClose={onClose} />

          <div className={`pc-scroll personalCenter-contentScroll`}>
            <div className="personalCenter-contentInner">
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
          </div>

          {pricingOpen && (
            <PricingOverlay
              onClose={() => setPricingOpen(false)}
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
        </div>

        <PersonalModals
          modal={modal}
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
          upgradePlanCode={subscription.upgradePlanCode}
          yr={subscription.yr}
          onConfirmUpgrade={subscription.confirmUpgrade}
          addonPick={subscription.addonPick}
          setAddonPick={subscription.setAddonPick}
          onConfirmAddon={subscription.confirmAddon}
          planName={subscription.planName}
          cancelExpireDate={subscription.cancelExpireDate}
          onConfirmCancel={subscription.confirmCancel}
          invoiceModal={bills.invoiceModal}
          onSubmitInvoice={bills.submitInvoice}
          onDownloadInvoice={bills.downloadInvoice}
        />

        <Toast message={toast} />
      </div>
    </div>
  )
}
