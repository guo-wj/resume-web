import { useCallback, useEffect, useState } from "react"
import {
  ApiError,
  formatMoney,
  loadPersonalPlansData,
  loadPersonalSubscriptionOnly,
  loadPersonalUsageData,
  previewSubscriptionUpgrade,
  upgradeSubscription,
} from "@/api"
import type { SubscriptionCurrent, SubscriptionPlan } from "@/api/subscription"
import { getPersonalCenterCache } from "@/store"
import type { UsageFeatureTuple } from "@/constant"
import type { CreditDetailRow } from "@/constant"
import type { DisplayPlan, UseSubscriptionTabParams } from "../types"
import type { UsagePageData } from "@/store/personalCenterCache"

export function useSubscriptionTab({
  showToast,
  modal,
  setModal,
  closeModal,
  setPricingOpen,
}: UseSubscriptionTabParams) {
  const initialPcCache = getPersonalCenterCache()

  const [subscription, setSubscription] = useState<SubscriptionCurrent | null>(
    initialPcCache?.subscription ?? null,
  )
  const [subscriptionLoading, setSubscriptionLoading] = useState(!initialPcCache?.subscription)
  const [usageData, setUsageData] = useState<UsagePageData | null>(initialPcCache?.usage ?? null)
  const [usageLoading, setUsageLoading] = useState(!initialPcCache?.usage)
  const [usageLoaded, setUsageLoaded] = useState(!!initialPcCache?.usage)
  const [apiPlans, setApiPlans] = useState<SubscriptionPlan[]>(initialPcCache?.plans ?? [])
  const [plansLoading, setPlansLoading] = useState(initialPcCache?.plans == null)

  const [cycle, setCycle] = useState("year")
  const [upgradeTarget, setUpgradeTarget] = useState<string | null>(null)
  const [upgradePreview, setUpgradePreview] = useState<Awaited<ReturnType<typeof previewSubscriptionUpgrade>> | null>(null)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [upgradePlanCode, setUpgradePlanCode] = useState<string | null>(null)
  const [addonPick, setAddonPick] = useState(1)
  const [faqOpen, setFaqOpen] = useState(1)

  const yr = cycle === "year"

  const loadSubscription = useCallback(async (force = false) => {
    if (!force) {
      const cached = getPersonalCenterCache()
      if (cached?.subscription) {
        setSubscription(cached.subscription)
        setSubscriptionLoading(false)
        return
      }
    }

    setSubscriptionLoading(true)
    try {
      const next = await loadPersonalSubscriptionOnly(force)
      setSubscription(next)
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "加载订阅信息失败")
    } finally {
      setSubscriptionLoading(false)
    }
  }, [showToast])

  const loadUsage = useCallback(async (force = false) => {
    if (!force) {
      const cached = getPersonalCenterCache()
      if (cached?.usage) {
        setUsageData(cached.usage)
        setUsageLoaded(true)
        setUsageLoading(false)
        return
      }
    }

    setUsageLoading(true)
    try {
      const next = await loadPersonalUsageData(force)
      setUsageData(next)
      setUsageLoaded(true)
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "加载积分用量失败")
    } finally {
      setUsageLoading(false)
    }
  }, [showToast])

  const loadPlans = useCallback(async (force = false) => {
    if (!force) {
      const cached = getPersonalCenterCache()
      if (cached?.plans != null) {
        setApiPlans(cached.plans)
        setPlansLoading(false)
        return
      }
    }

    setPlansLoading(true)
    try {
      const data = await loadPersonalPlansData(force)
      setApiPlans(data)
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "加载套餐列表失败")
    } finally {
      setPlansLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (modal !== "upgrade" || !upgradePlanCode) return undefined
    let cancelled = false
    setUpgradeLoading(true)
    setUpgradePreview(null)
    previewSubscriptionUpgrade(upgradePlanCode).then((data) => {
      if (!cancelled) setUpgradePreview(data)
    }).catch((err) => {
      if (!cancelled) {
        showToast(err instanceof ApiError ? err.message : "加载升级预览失败")
      }
    }).finally(() => {
      if (!cancelled) setUpgradeLoading(false)
    })
    return () => { cancelled = true }
  }, [modal, upgradePlanCode, showToast])

  const openUpgrade = (plan: SubscriptionPlan | string) => {
    const target = typeof plan === "object" ? plan : null
    setUpgradeTarget(target?.name || (typeof plan === "string" ? plan : null))
    setUpgradePlanCode(target?.planCode || null)
    setUpgradePreview(null)
    setModal("upgrade")
  }

  const confirmUpgrade = async () => {
    if (!upgradePlanCode) {
      showToast("请选择可升级的套餐")
      return
    }
    if (!upgradePreview) {
      showToast("请等待升级预览加载完成")
      return
    }
    try {
      await upgradeSubscription(upgradePlanCode)
      closeModal()
      setPricingOpen(false)
      showToast("升级成功，权益已即时生效 🎉")
      await loadSubscription(true)
      await loadUsage(true)
      await loadPlans(true)
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "升级失败，请稍后重试")
    }
  }

  const openAddon = () => showToast("加量包购买暂未开放")
  const confirmAddon = () => showToast("加量包购买暂未开放")
  const openCancel = () => setModal("cancel")
  const confirmCancel = () => {
    closeModal()
    showToast("取消续费功能暂未开放")
  }

  const usageFeatures: UsageFeatureTuple[] = usageLoaded
    ? (usageData?.topFeatures ?? []).map((f): UsageFeatureTuple => [f.name, f.amount, f.color])
    : []
  const grandTotal = usageLoaded ? (usageData?.overview?.grantedTotal ?? 0) : 0
  const usedTotal = usageLoaded ? (usageData?.overview?.usedTotal ?? 0) : 0
  const remaining = usageLoaded ? (usageData?.overview?.remainingTotal ?? 0) : 0
  const detailRows: CreditDetailRow[] = usageLoaded
    ? (usageData?.transactions?.items ?? []).map((d) => ({ name: d.name, amount: d.amount, date: d.date }))
    : []

  const planName = subscriptionLoading ? "加载中…" : (subscription?.planName || "—")
  const planStatusLabel = subscription?.statusLabel || ""
  const planRenewText = subscriptionLoading
    ? "正在同步订阅状态"
    : subscription
      ? `续订日期 ${subscription.renewAt} · ${subscription.billingCycleLabel}`
      : "暂无订阅信息"
  const cancelExpireDate = subscription?.renewAt || "—"

  const cyclePlans = apiPlans.filter((p) => p.cycle === cycle)
  const displayPlans = cyclePlans.length ? cyclePlans : (apiPlans.length ? apiPlans : null)

  const plans: DisplayPlan[] = displayPlans
    ? displayPlans.map((p) => ({
      name: p.name,
      planCode: p.planCode,
      price: p.priceLabel,
      unit: p.unitLabel,
      save: p.saveText || (p.cycle === "year" ? `按年 ${formatMoney(p.priceCents)}` : "原价"),
      saveColor: p.saveColor,
      daily: String(p.dailyCredits || "—"),
      hl: p.isCurrent,
      recommend: p.recommend,
      features: p.features,
      btnLabel: p.isCurrent ? "当前方案" : p.canUpgrade ? `升级到 ${p.name}` : "当前不可降级",
      btnKind: p.isCurrent ? "current" : p.canUpgrade ? "up" : "disabled",
      onClick: p.canUpgrade ? () => openUpgrade(p) : () => {},
    }))
    : []

  return {
    loadSubscription,
    loadUsage,
    loadPlans,
    subscriptionLoading,
    usageLoading,
    plansLoading,
    planName,
    planStatusLabel,
    planRenewText,
    cancelExpireDate,
    usageFeatures,
    grandTotal,
    usedTotal,
    remaining,
    detailRows,
    cycle,
    setCycle,
    yr,
    plans,
    faqOpen,
    setFaqOpen,
    openUpgrade,
    confirmUpgrade,
    openAddon,
    confirmAddon,
    openCancel,
    confirmCancel,
    upgradeTarget,
    upgradePreview,
    upgradeLoading,
    upgradePlanCode,
    addonPick,
    setAddonPick,
  }
}
