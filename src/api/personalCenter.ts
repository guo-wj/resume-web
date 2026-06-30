import {
  getPersonalCenterCache,
  patchPersonalCenterCache,
  type UsagePageData,
} from "@/store/personalCenterCache"
import { getSubscriptionCurrent, getSubscriptionPlans } from "./subscription"
import { loadSubscriptionUsageData } from "./credit"
import { getBillingOrders } from "./billing"
import type { SubscriptionCurrent, SubscriptionPlan } from "./subscription"
import type { BillingOrder } from "./billing"

let subscriptionInflight: Promise<SubscriptionCurrent> | null = null
let usageInflight: Promise<UsagePageData> | null = null
let plansInflight: Promise<SubscriptionPlan[]> | null = null
let billingInflight: Promise<BillingOrder[]> | null = null

/** 积分用量与明细；同一会话内默认只请求一次 */
export async function loadPersonalUsageData(force = false) {
  const cached = getPersonalCenterCache()
  if (!force && cached?.usage) return cached.usage
  if (!force && usageInflight) return usageInflight

  usageInflight = loadSubscriptionUsageData().then((usage) => {
    patchPersonalCenterCache({ usage })
    return usage
  }).finally(() => {
    usageInflight = null
  })

  return usageInflight
}

/** 当前订阅信息；同一会话内默认只请求一次 */
export async function loadPersonalSubscriptionOnly(force = false) {
  const cached = getPersonalCenterCache()
  if (!force && cached?.subscription) return cached.subscription
  if (!force && subscriptionInflight) return subscriptionInflight

  subscriptionInflight = getSubscriptionCurrent().then((subscription) => {
    patchPersonalCenterCache({ subscription })
    return subscription
  }).finally(() => {
    subscriptionInflight = null
  })

  return subscriptionInflight
}

/** 订阅页数据：当前订阅 + 积分用量（并行加载，互不影响） */
export async function loadPersonalSubscriptionData(force = false) {
  const cached = getPersonalCenterCache()
  if (!force && cached?.subscription && cached?.usage) {
    return { subscription: cached.subscription, usage: cached.usage }
  }

  const [subscription, usage] = await Promise.all([
    loadPersonalSubscriptionOnly(force),
    loadPersonalUsageData(force),
  ])

  return { subscription, usage }
}

/** 套餐列表；同一会话内默认只请求一次 */
export async function loadPersonalPlansData(force = false) {
  const cached = getPersonalCenterCache()
  if (!force && cached?.plans != null) return cached.plans
  if (!force && plansInflight) return plansInflight

  plansInflight = getSubscriptionPlans().then((plans) => {
    patchPersonalCenterCache({ plans })
    return plans
  }).finally(() => {
    plansInflight = null
  })

  return plansInflight
}

/** 账单列表；同一会话内默认只请求一次 */
export async function loadPersonalBillingData(force = false) {
  const cached = getPersonalCenterCache()
  if (!force && cached?.bills != null) return cached.bills
  if (!force && billingInflight) return billingInflight

  billingInflight = getBillingOrders({ page: 1, page_size: 20 }).then((bills) => {
    patchPersonalCenterCache({ bills })
    return bills
  }).finally(() => {
    billingInflight = null
  })

  return billingInflight
}
