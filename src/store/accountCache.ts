import type { UserBindings, UserProfile } from "@/api/types"

export interface AccountData {
  profile: UserProfile
  bindings: UserBindings
}

let cache: AccountData | null = null

export function getAccountCache(): AccountData | null {
  return cache
}

export function setAccountCache(data: AccountData | null) {
  cache = data
}

export function clearAccountCache() {
  cache = null
}
