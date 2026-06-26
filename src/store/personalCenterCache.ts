import type { SubscriptionCurrent, SubscriptionPlan } from "@/api/subscription"
import type { CreditOverview, CreditFeatureUsage, CreditTransactionsPage } from "@/api/credit"
import type { BillingOrder } from "@/api/billing"

export interface UsagePageData {
  overview: CreditOverview
  topFeatures: CreditFeatureUsage[]
  transactions: CreditTransactionsPage
}

export interface PersonalCenterCache {
  subscription: SubscriptionCurrent | null
  usage: UsagePageData | null
  plans: SubscriptionPlan[] | null
  bills: BillingOrder[] | null
}

let cache: PersonalCenterCache | null = null

export function getPersonalCenterCache(): PersonalCenterCache | null {
  return cache
}

export function setPersonalCenterCache(data: PersonalCenterCache | null) {
  cache = data
}

export function patchPersonalCenterCache(patch: Partial<PersonalCenterCache>) {
  cache = { ...(cache ?? { subscription: null, usage: null, plans: null, bills: null }), ...patch }
}

export function clearPersonalCenterCache() {
  cache = null
}
