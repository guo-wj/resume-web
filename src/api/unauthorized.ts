import { clearAuthSession } from "@/store/auth"
import { ApiError } from "./types"

/** 401 统一提示文案 */
export const UNAUTHORIZED_MESSAGE = "您未登录或登录已过期，请重新登录"

export const AUTH_UNAUTHORIZED_EVENT = "auth:unauthorized"

let handlingUnauthorized = false

/** 从常见错误体中取出可读文案（兼容 message / detail） */
export function extractErrorMessage(json: unknown, fallback: string): string {
  if (!json || typeof json !== "object") return fallback
  const body = json as Record<string, unknown>
  if (typeof body.message === "string" && body.message.trim()) return body.message
  if (typeof body.detail === "string" && body.detail.trim()) return body.detail
  if (Array.isArray(body.detail) && body.detail.length) {
    const first = body.detail[0]
    if (typeof first === "string") return first
    if (first && typeof first === "object" && "msg" in first) {
      return String((first as { msg: unknown }).msg)
    }
  }
  return fallback
}

/**
 * 处理 401：清空本地登录信息，并派发全局提示。
 * 返回已标记 handled 的 ApiError，避免业务层重复 toast。
 */
export function handleUnauthorized(): ApiError {
  if (!handlingUnauthorized) {
    handlingUnauthorized = true
    clearAuthSession()
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(AUTH_UNAUTHORIZED_EVENT, {
          detail: { message: UNAUTHORIZED_MESSAGE },
        }),
      )
    }
    window.setTimeout(() => {
      handlingUnauthorized = false
    }, 1600)
  }
  return new ApiError(401, UNAUTHORIZED_MESSAGE, true)
}
