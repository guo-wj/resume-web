import { getAccessToken } from "@/store/auth"
import { resolveApiPath, API_ENDPOINT_MAP } from "./endpoints"
import type { ApiResponse } from "./types"
import { ApiError } from "./types"

const API_BASE = import.meta.env.VITE_API_BASE || "/api"

export interface RequestOptions extends Omit<RequestInit, "method" | "body"> {
  params?: Record<string, string | number>
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
  token?: string | null
}

function joinApiUrl(path: string): string {
  const base = API_BASE.replace(/\/$/, "")
  const p = path.startsWith("/") ? path : `/${path}`
  return `${base}${p}`
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = joinApiUrl(path)
  if (!query) return url

  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined) qs.set(k, String(v))
  }
  const s = qs.toString()
  return s ? `${url}?${s}` : url
}

/** 发起 API 请求 */
export async function request<T = unknown>(
  key: string,
  options: RequestOptions = {},
): Promise<T> {
  const ep = API_ENDPOINT_MAP[key]
  if (!ep) throw new Error(`Unknown API key: ${key}`)

  const { params, query, body, token, headers, ...rest } = options
  const path = resolveApiPath(key, params)
  const url = buildUrl(path, query)
  const authToken = token ?? getAccessToken()

  const res = await fetch(url, {
    method: ep.method,
    headers: {
      ...(body != null ? { "Content-Type": "application/json" } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    body: body != null ? JSON.stringify(body) : undefined,
    ...rest,
  })

  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null

  if (!res.ok) {
    throw new ApiError(res.status, json?.message || res.statusText)
  }

  if (json && typeof json.code === "number" && json.code !== 0) {
    throw new ApiError(json.code, json.message || "请求失败")
  }

  return (json?.data ?? json) as T
}

export { API_BASE }
