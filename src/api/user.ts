import { request } from "./request"
import { getAccountCache, setAccountCache, type AccountData } from "@/store/accountCache"
import type {
  BindingChannel,
  BindingChannelType,
  UserBindings,
  UserProfile,
  WechatQrcodeResult,
  WechatStatusResult,
} from "./types"

const CHANNEL_TYPES: BindingChannelType[] = ["phone", "email", "wechat", "apple"]

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function pickString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return ""
}

function normalizeChannelType(raw: unknown): BindingChannelType | null {
  const text = String(raw ?? "").toLowerCase()
  if (text.includes("phone") || text.includes("mobile") || text === "1") return "phone"
  if (text.includes("email") || text.includes("mail") || text === "2") return "email"
  if (text.includes("wechat") || text.includes("weixin") || text.includes("wx") || text === "3") return "wechat"
  if (text.includes("apple") || text === "4") return "apple"
  return null
}

function normalizeChannelItem(raw: unknown, bound = true): BindingChannel | null {
  const item = asRecord(raw)
  if (!item) return null

  const type = normalizeChannelType(
    item.identity_type ?? item.type ?? item.channel ?? item.channel_type ?? item.name,
  )
  if (!type) return null

  const value = bound
    ? pickString(item.identifier, item.value, item.display_value, item.masked_value, item.account) || "已绑定"
    : null

  return { type, bound, value }
}

/** 兼容 profile 接口字段 */
export function normalizeProfile(raw: unknown): UserProfile {
  const data = asRecord(raw) ?? {}
  const id = Number(data.id ?? data.user_id ?? 0)

  return {
    id: Number.isFinite(id) ? id : 0,
    nickname: pickString(data.nickname, data.name, data.username, "用户"),
    avatar_url: pickString(data.avatar_url, data.avatar),
    account: pickString(data.account, data.register_account, data.login_account, data.identifier, data.email, data.phone),
    has_password: Boolean(data.has_password ?? data.hasPassword),
  }
}

/**
 * bindings 接口：
 * - bindings[]：已绑定，identity_type = phone | email | wechat | apple
 * - unbound[]：未绑定的渠道 key 列表
 */
export function normalizeBindings(raw: unknown): UserBindings {
  const data = asRecord(raw) ?? {}
  const channelMap = new Map<BindingChannelType, BindingChannel>()

  const boundList = data.bindings
  if (Array.isArray(boundList)) {
    for (const item of boundList) {
      const channel = normalizeChannelItem(item, true)
      if (channel) channelMap.set(channel.type, channel)
    }
  }

  const unboundList = data.unbound
  if (Array.isArray(unboundList)) {
    for (const item of unboundList) {
      const type = normalizeChannelType(item)
      if (!type || channelMap.has(type)) continue
      channelMap.set(type, { type, bound: false, value: null })
    }
  }

  const channels = CHANNEL_TYPES.map((type) => (
    channelMap.get(type) ?? { type, bound: false, value: null }
  ))

  return { channels }
}

export function getBindingChannel(bindings: UserBindings, type: BindingChannelType): BindingChannel {
  return bindings.channels.find((item) => item.type === type) ?? { type, bound: false, value: null }
}

export async function getUserProfile() {
  const data = await request<unknown>("user.profile")
  return normalizeProfile(data)
}

export async function getUserBindings() {
  const data = await request<unknown>("user.bindings")
  return normalizeBindings(data)
}

let accountInflight: Promise<AccountData> | null = null

/** 加载账户信息；同一会话内默认只请求一次，传 force=true 可强制刷新 */
export async function loadAccountData(force = false) {
  const cached = getAccountCache()
  if (!force && cached) return cached
  if (!force && accountInflight) return accountInflight

  accountInflight = Promise.all([getUserProfile(), getUserBindings()]).then(([profile, bindings]) => {
    const data = { profile, bindings }
    setAccountCache(data)
    return data
  }).finally(() => {
    accountInflight = null
  })

  return accountInflight
}

export async function sendBindCode(identifier: string) {
  return request("auth.sendCode", { body: { identifier, scene: "bind" } })
}

export async function bindByCode(identifier: string, code: string) {
  return request("user.bindCode", { body: { identifier, code } })
}

export async function setUserPassword(body: {
  old_password?: string | null
  new_password: string
  confirm_password: string
}) {
  return request("user.setPassword", { body })
}

export async function bindWechat(state: string) {
  return request("user.bindWechat", { body: { state } })
}

export async function getWechatQrcode() {
  return request<WechatQrcodeResult>("auth.wechatQrcode")
}

export async function getWechatStatus(state: string) {
  return request<WechatStatusResult>("auth.wechatStatus", { query: { state } })
}
