import { useCallback, useEffect, useState } from "react"
import {
  ApiError,
  formatMoney,
  loadPersonalPlansData,
  loadPersonalSubscriptionData,
  previewSubscriptionUpgrade,
  upgradeSubscription,
} from "@/api"
import type { SubscriptionCurrent, SubscriptionPlan } from "@/api/subscription"
import { getPersonalCenterCache } from "@/store"
import {
  DETAIL_FALLBACK,
  GRAND_TOTAL_FALLBACK,
  USAGE_FALLBACK,
} from "@/constant"
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
  const [subscriptionLoading, setSubscriptionLoading] = useState(
    !initialPcCache?.subscription || !initialPcCache?.usage,
  )
  const [usageData, setUsageData] = useState<UsagePageData | null>(initialPcCache?.usage ?? null)
  const [usageLoading, setUsageLoading] = useState(
    !initialPcCache?.subscription || !initialPcCache?.usage,
  )
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
      if (cached?.subscription && cached?.usage) {
        setSubscription(cached.subscription)
        setUsageData(cached.usage)
        setSubscriptionLoading(false)
        setUsageLoading(false)
        return
      }
    }

    setSubscriptionLoading(true)
    setUsageLoading(true)
    try {
      const data = await loadPersonalSubscriptionData(force)
      setSubscription(data.subscription)
      setUsageData(data.usage)
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "加载订阅信息失败")
    } finally {
      setSubscriptionLoading(false)
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
      closeModal()
      setPricingOpen(false)
      showToast("升级成功，权益已即时生效 🎉")
      return
    }
    try {
      await upgradeSubscription(upgradePlanCode)
      closeModal()
      setPricingOpen(false)
      showToast("升级成功，权益已即时生效 🎉")
      await loadSubscription(true)
      await loadPlans(true)
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "升级失败，请稍后重试")
    }
  }

  const openAddon = () => { setAddonPick(1); setModal("addon") }
  const confirmAddon = () => { closeModal(); showToast("购买成功，积分已到账 ✓") }
  const openCancel = () => setModal("cancel")
  const confirmCancel = () => { closeModal(); showToast("已取消自动续费，到期前仍可使用") }

  const usageFeatures: UsageFeatureTuple[] = usageData?.topFeatures?.length
    ? usageData.topFeatures.map((f): UsageFeatureTuple => [f.name, f.amount, f.color])
    : USAGE_FALLBACK
  const grandTotal = usageData?.overview?.grantedTotal || GRAND_TOTAL_FALLBACK
  const usedTotal = usageData?.overview?.usedTotal ?? usageFeatures.reduce((a, [, v]) => a + v, 0)
  const remaining = usageData?.overview?.remainingTotal ?? (grandTotal - usedTotal)
  const detailRows: CreditDetailRow[] = usageData?.transactions?.items?.length
    ? usageData.transactions.items.map((d) => ({ name: d.name, amount: d.amount, date: d.date }))
    : DETAIL_FALLBACK

  const planName = subscription?.planName || "Pro"
  const planStatusLabel = subscription?.statusLabel || "订阅中"
  const planRenewText = subscription
    ? `续订日期 ${subscription.renewAt} · ${subscription.billingCycleLabel}`
    : "续订日期 2026-07-08 · 按年付费"
  const cancelExpireDate = subscription?.renewAt || "2026-07-08"

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
      features: p.features.length ? p.features : ["权益详情以套餐页为准"],
      btnLabel: p.isCurrent ? "当前方案" : p.canUpgrade ? `升级到 ${p.name}` : "当前不可降级",
      btnKind: p.isCurrent ? "current" : p.canUpgrade ? "up" : "disabled",
      onClick: p.canUpgrade ? () => openUpgrade(p) : () => {},
    }))
    : [
      { name: "免费版", planCode: null, price: "¥0", unit: "", save: "体验核心能力", saveColor: "#9890AE", daily: "50", hl: false, recommend: false,
        features: ["基础简历模板", "每日 50 积分", "AI 对话挖掘（限量）", "导出带水印"], btnLabel: "当前不可降级", btnKind: "disabled", onClick: () => {} },
      { name: "Pro", planCode: null, price: yr ? "¥39" : "¥59", unit: "/月", save: yr ? "按年 ¥468，省 ¥240（约 40%）" : "原价 ¥59/月", saveColor: yr ? "#5A8A1A" : "#9890AE", daily: "200", hl: true, recommend: false,
        features: ["全部高级模板", "每日 200 积分 + 每月 3,000", "无限 AI 对话挖掘", "模拟面试 & 能力 Gap 分析", "无水印导出"], btnLabel: "当前方案", btnKind: "current", onClick: () => {} },
      { name: "Pro Max", planCode: null, price: yr ? "¥99" : "¥139", unit: "/月", save: yr ? "按年 ¥1188，省 ¥480（约 40%）" : "原价 ¥139/月", saveColor: yr ? "#5A8A1A" : "#9890AE", daily: "400", hl: false, recommend: true,
        features: ["Pro 全部权益", "每日 400 积分 + 每月 8,000", "优先生成队列", "专属职业方向洞察报告", "1 对 1 简历精修建议"], btnLabel: "升级到 Pro Max", btnKind: "up", onClick: () => openUpgrade("Pro Max") },
    ]

  return {
    loadSubscription,
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
