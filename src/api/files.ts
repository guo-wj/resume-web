import { getAccessToken } from "@/store/auth"
import type { ApiResponse } from "./types"
import { ApiError } from "./types"
import { DEFAULT_TIMEOUT_MS, createTimeoutGate, throwIfAborted } from "./timeout"
import { extractErrorMessage, handleUnauthorized } from "./unauthorized"

/** 与 agent 对话同前缀，不走 VITE_API_BASE */
const AGENT_BASE = (import.meta.env.VITE_AGENT_BASE || "/agent").replace(/\/$/, "")

export function resolveAgentUploadUrl(): string {
  return `${AGENT_BASE}/files/upload`
}

export interface UploadFileResult {
  file_id: string
  filename: string
  size_bytes: number
  content_type?: string
  parse_task_id?: string | null
  [key: string]: unknown
}

export interface UploadFileOptions {
  /** 是否创建异步解析任务，默认 true */
  parse?: boolean
  signal?: AbortSignal
  timeout?: number
}

/** POST /agent/files/upload — multipart：file + parse */
export async function uploadFile(file: File, options: UploadFileOptions = {}) {
  const { parse = true, signal, timeout = DEFAULT_TIMEOUT_MS } = options
  const form = new FormData()
  form.append("file", file)
  form.append("parse", String(parse))

  const token = getAccessToken()
  const gate = createTimeoutGate(timeout, signal)

  try {
    const res = await fetch(resolveAgentUploadUrl(), {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: form,
      signal: gate.signal,
    })

    const json = (await res.json().catch(() => null)) as ApiResponse<UploadFileResult> | null

    if (!res.ok) {
      if (res.status === 401) throw handleUnauthorized()
      throw new ApiError(
        res.status,
        extractErrorMessage(json, json?.message || res.statusText || "上传失败"),
      )
    }

    if (json && typeof json.code === "number" && json.code !== 0) {
      if (json.code === 401) throw handleUnauthorized()
      throw new ApiError(json.code, json.message || "上传失败")
    }

    return (json?.data ?? json) as UploadFileResult
  } catch (err) {
    if (err instanceof ApiError) throw err
    throwIfAborted(err, gate.didTimeout())
  } finally {
    gate.dispose()
  }
}
