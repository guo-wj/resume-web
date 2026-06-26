import { request } from "./request"
import type { LoginResult } from "./types"

/** 密码登录（不触发自动注册） */
export async function loginByPassword(identifier: string, password: string) {
  return request<LoginResult>("auth.loginByPassword", {
    body: { identifier, password },
  })
}

/** 退出登录，吊销 refresh_token */
export async function logout(refreshToken?: string | null) {
  if (!refreshToken) throw new Error("缺少 refresh_token")
  await request("auth.logout", { body: { refresh_token: refreshToken } })
}
