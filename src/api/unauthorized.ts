import { clearAuthSession, getAccessToken } from "@/store/auth"
import { ApiError } from "./types"

/** 401 统一提示文案（会话过期） */
export const UNAUTHORIZED_MESSAGE = "您未登录或登录已过期，请重新登录"

export const AUTH_UNAUTHORIZED_EVENT = "auth:unauthorized"

let handlingUnauthorized = false

/** 落地页等可注册：会话过期时弹登录，而不是全局 toast */
type UnauthorizedLoginHandler = () => void
let unauthorizedLoginHandler: UnauthorizedLoginHandler | null = null

export function registerUnauthorizedLoginHandler(handler: UnauthorizedLoginHandler | null) {
  unauthorizedLoginHandler = handler
}

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
 * 处理 401。
 * - 本地已有会话：清空登录态；有 handler 则弹登录窗，否则派发 toast 事件；标记 handled。
 * - 无会话（如登录失败）：不弹窗、不清会话，返回未 handled，便于表单展示服务端文案。
 */
export function handleUnauthorized(serverMessage?: string): ApiError {
  const hadSession = !!getAccessToken()

  if (hadSession && !handlingUnauthorized) {
    handlingUnauthorized = true
    clearAuthSession()
    if (typeof window !== "undefined") {
      if (unauthorizedLoginHandler) {
        unauthorizedLoginHandler()
      } else {
        window.dispatchEvent(
          new CustomEvent(AUTH_UNAUTHORIZED_EVENT, {
            detail: { message: UNAUTHORIZED_MESSAGE },
          }),
        )
      }
    }
    window.setTimeout(() => {
      handlingUnauthorized = false
    }, 1600)
  }

  if (hadSession) {
    return new ApiError(401, UNAUTHORIZED_MESSAGE, true)
  }
  return new ApiError(
    401,
    (serverMessage && serverMessage.trim()) || UNAUTHORIZED_MESSAGE,
    false,
  )
}
