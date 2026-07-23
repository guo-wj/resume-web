export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export interface ApiEndpoint {
  /** 唯一标识，用于 request 调用 */
  key: string
  /** 业务模块 */
  module: string
  method: HttpMethod
  /** 相对路径（不含 VITE_API_BASE） */
  path: string
  description: string
  /** 是否需要登录 */
  auth?: boolean
}

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface AuthUser {
  id: number
  nickname: string
  avatar_url: string
}

export type BindingChannelType = "phone" | "email" | "wechat" | "apple"

export interface BindingChannel {
  type: BindingChannelType
  bound: boolean
  value: string | null
}

export interface UserProfile {
  id: number
  nickname: string
  avatar_url: string
  account: string
  has_password: boolean
}

export interface UserBindings {
  channels: BindingChannel[]
}

export interface WechatQrcodeResult {
  state: string
  qr_url: string
  expires_in: number
}

export interface WechatStatusResult {
  status: string
}

export interface AuthSession {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
  tokenType?: string
  hasPassword?: boolean
  user: AuthUser | null
}

export interface LoginResult {
  access_token?: string
  token?: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  has_password?: boolean
  is_new_user?: boolean
  user?: AuthUser
}

export class ApiError extends Error {
  code: number
  /** 已在请求层处理（如 401 全局提示），业务层勿再 toast */
  handled: boolean

  constructor(code: number, message: string, handled = false) {
    super(message)
    this.name = "ApiError"
    this.code = code
    this.handled = handled
  }
}
