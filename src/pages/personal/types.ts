import type { BillingOrder, BillingOrderInvoiceSummary, InvoiceDetail } from "@/api/billing"
import type { UpgradePreview } from "@/api/subscription"
import type { BindingChannel, UserProfile } from "@/api/types"
import type { CreditDetailRow, PersonalPageId, UsageFeatureTuple } from "@/constant"
import type { SVGProps, ReactNode, Dispatch, MouseEvent, SetStateAction } from "react"

export type PersonalModalId =
  | "bindPhone"
  | "bindEmail"
  | "bindWechat"
  | "password"
  | "upgrade"
  | "addon"
  | "cancel"
  | "invoice"
  | "viewInvoice"
  | null

export type PlanBtnKind = "up" | "current" | "disabled"

export interface DisplayPlan {
  name: string
  planCode: string | null
  price: string
  unit: string
  save: string
  saveColor: string
  daily: string
  hl: boolean
  recommend: boolean
  features: string[]
  btnLabel: string
  btnKind: PlanBtnKind
  onClick: () => void
}

export interface BindingRow {
  label: string
  value: string
  action: string
  strong: boolean
  onClick: () => void
}

export interface BindModalState {
  mPhone: string
  setMPhone: (v: string) => void
  mEmail: string
  setMEmail: (v: string) => void
  mCode: string
  setMCode: (v: string) => void
  mError: string
  setMError: (v: string) => void
  mCountdown: number
  mSubmitting: boolean
  sendMCode: () => void | Promise<void>
  submitBind: () => void | Promise<void>
}

export interface PasswordModalState {
  pwOld: string
  setPwOld: (v: string) => void
  pwNew1: string
  setPwNew1: (v: string) => void
  pwNew2: string
  setPwNew2: (v: string) => void
  pwErr: string
  setPwErr: (v: string) => void
  pwSubmitting: boolean
  pwFirstTime: boolean
  submitPw: () => void | Promise<void>
}

export interface WechatModalState {
  wechatQrUrl: string
  wechatLoading: boolean
}

export interface InvoiceModalState {
  invType: string
  setInvType: (v: string) => void
  invHead: string
  setInvHead: (v: string) => void
  invTitle: string
  setInvTitle: (v: string) => void
  invTax: string
  setInvTax: (v: string) => void
  invEmail: string
  setInvEmail: (v: string) => void
  invNote: string
  setInvNote: (v: string) => void
  invErr: string
  setInvErr: (v: string) => void
}

export type ShowToast = (message: string) => void

export interface TabHookBase {
  showToast: ShowToast
  setModal: Dispatch<SetStateAction<PersonalModalId>>
  closeModal: () => void
}

export interface UseAccountTabParams extends TabHookBase {
  modal: PersonalModalId
}

export interface UseSubscriptionTabParams extends TabHookBase {
  modal: PersonalModalId
  setPricingOpen: Dispatch<SetStateAction<boolean>>
}

export type UseBillsTabParams = TabHookBase

export interface PersonalCenterProps {
  onClose?: () => void
}

export interface SidebarProps {
  page: PersonalPageId
  onPageChange: (page: PersonalPageId) => void
  onClose: () => void
}

export interface AccountTabProps {
  accountLoading: boolean
  profile: UserProfile | null
  displayName: string
  displayAccount: string
  avatarLetter: string
  hasPassword: boolean
  bindings: BindingRow[]
  onOpenPassword: () => void
}

export interface SubscriptionTabProps {
  subscriptionLoading: boolean
  usageLoading: boolean
  planName: string
  planStatusLabel: string
  planRenewText: string
  usedTotal: number
  grandTotal: number
  usageFeatures: UsageFeatureTuple[]
  remaining: number
  detailRows: CreditDetailRow[]
  onOpenPricing: () => void
}

export type BillRow = BillingOrder

export interface BillsTabProps {
  bills: BillRow[]
  billsLoading: boolean
  onOpenInvoice: (orderId: number) => void
  onViewInvoice: (order: BillingOrder) => void
  onDownloadInvoice: (order?: BillingOrder) => void
}

export interface PricingOverlayProps {
  onClose: () => void
  cycle: string
  setCycle: (cycle: string) => void
  plansLoading: boolean
  plans: DisplayPlan[]
  faqOpen: number
  setFaqOpen: (index: number) => void
  onOpenAddon: () => void
  onOpenCancel: () => void
}

export interface PersonalModalsProps {
  modal: PersonalModalId
  stop: (e: MouseEvent) => void
  closeModal: () => void
  phoneBinding: BindingChannel
  emailBinding: BindingChannel
  bindModal: BindModalState
  passwordModal: PasswordModalState
  wechatModal: WechatModalState
  qrCells: boolean[]
  upgradeTarget: string | null
  upgradePreview: UpgradePreview | null
  upgradeLoading: boolean
  yr: boolean
  onConfirmUpgrade: () => void | Promise<void>
  planName: string
  cancelExpireDate: string
  onConfirmCancel: () => void
  invoiceModal: InvoiceModalState
  invoiceSummary: BillingOrderInvoiceSummary | null
  invoiceSummaryLoading: boolean
  invoiceSubmitting: boolean
  viewInvoiceDetail: InvoiceDetail | null
  viewInvoiceLoading: boolean
  onSubmitInvoice: () => void | Promise<void>
  onDownloadInvoice: (order?: BillingOrder) => void
}

export interface SectionTitleProps {
  children: ReactNode
  mt?: number
}

export interface LegendProps {
  color: string
  name: string
  value: string
}

export interface ToastProps {
  message: string
}

export interface SvgProps extends Omit<SVGProps<SVGSVGElement>, "d"> {
  d: string | Array<Record<string, string | number>>
  size?: number
}
