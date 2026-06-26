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

let subscriptionInflight: Promise<{ subscription: SubscriptionCurrent; usage: UsagePageData }> | null = null
let plansInflight: Promise<SubscriptionPlan[]> | null = null
let billingInflight: Promise<BillingOrder[]> | null = null

/** 订阅页数据：当前订阅 + 积分用量；同一会话内默认只请求一次 */
export async function loadPersonalSubscriptionData(force = false) {
  const cached = getPersonalCenterCache()
  if (!force && cached?.subscription && cached?.usage) {
    return { subscription: cached.subscription, usage: cached.usage }
  }
  if (!force && subscriptionInflight) return subscriptionInflight

  subscriptionInflight = Promise.all([
    getSubscriptionCurrent(),
    loadSubscriptionUsageData(),
  ]).then(([subscription, usage]) => {
    patchPersonalCenterCache({ subscription, usage })
    return { subscription, usage }
  }).finally(() => {
    subscriptionInflight = null
  })

  return subscriptionInflight
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
