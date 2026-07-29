import { getAccessToken } from "@/store/auth"
import { ApiError } from "./types"
import { DEFAULT_TIMEOUT_MS, createTimeoutGate, isAbortError } from "./timeout"
import { extractErrorMessage, handleUnauthorized } from "./unauthorized"

/** Agent 服务独立前缀，不走 VITE_API_BASE */
const AGENT_BASE = (import.meta.env.VITE_AGENT_BASE || "/agent").replace(/\/$/, "")
/**
 * 对外路径（经 Nginx /agent/ 转发到 8888，去掉 /agent 前缀）：
 * - /agent/health       → 127.0.0.1:8888/health
 * - /agent/chat         → 127.0.0.1:8888/chat
 * - /agent/files/upload → 127.0.0.1:8888/files/upload
 */
const AGENT_CHAT_PATH =
  import.meta.env.VITE_AGENT_CHAT_PATH || `${AGENT_BASE}/chat`

export function resolveAgentChatUrl(): string {
  const override = import.meta.env.VITE_AGENT_CHAT_URL
  if (override) return override
  return AGENT_CHAT_PATH.startsWith("http")
    ? AGENT_CHAT_PATH
    : AGENT_CHAT_PATH.startsWith("/")
      ? AGENT_CHAT_PATH
      : `/${AGENT_CHAT_PATH}`
}

export type AgentWorkflow = "career_explore" | "resume_revise" | "resume_generate"

export interface AgentChatRequest {
  user_id: string | number
  session_id: string
  message: string
  workflow: AgentWorkflow | string
  stream_output?: boolean
  /** 已上传文件的 file_id 列表 */
  file_ids?: string[]
}

export interface AgentChatDoneEvent {
  session_id?: string
  ready_generate?: boolean
  resume_result?: unknown
  done?: boolean
}

export interface AgentChatStreamCallbacks {
  onDelta?: (delta: string) => void
  onFull?: (text: string) => void
  onDone?: (event: AgentChatDoneEvent) => void
  onError?: (error: Error) => void
}

function parseStreamLine(line: string): Record<string, unknown> | null {
  const trimmed = line.trim()
  if (!trimmed || trimmed === "[DONE]") return null
  const payload = trimmed.startsWith("data:") ? trimmed.slice(5).trim() : trimmed
  if (!payload || payload === "[DONE]") return null
  try {
    return JSON.parse(payload) as Record<string, unknown>
  } catch {
    return null
  }
}

function isDoneEvent(data: Record<string, unknown>): boolean {
  return (
    data.done === true ||
    ("session_id" in data && ("ready_generate" in data || "resume_result" in data))
  )
}

function handleStreamEvent(data: Record<string, unknown>, callbacks: AgentChatStreamCallbacks) {
  if (typeof data.delta === "string" && data.delta) {
    callbacks.onDelta?.(data.delta)
    return
  }
  if (typeof data.text === "string") {
    callbacks.onFull?.(data.text)
    return
  }
  if (isDoneEvent(data)) {
    callbacks.onDone?.(data as AgentChatDoneEvent)
  }
}

/** POST /agent/chat，解析 SSE / 逐行 JSON 流式响应；首包默认 20s 超时 */
export async function streamAgentChat(
  body: AgentChatRequest,
  callbacks: AgentChatStreamCallbacks,
  signal?: AbortSignal,
  timeout: number = DEFAULT_TIMEOUT_MS,
): Promise<void> {
  const url = resolveAgentChatUrl()
  const token = getAccessToken()
  const gate = createTimeoutGate(timeout, signal)

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream, application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        stream_output: true,
        ...body,
      }),
      signal: gate.signal,
    })

    // 已拿到响应头，进入流式读取，不再套首包超时
    gate.clearTimer()

    if (!res.ok) {
      if (res.status === 401) throw handleUnauthorized()
      const json = await res.json().catch(() => null)
      throw new ApiError(
        res.status,
        extractErrorMessage(json, res.statusText || "对话请求失败"),
      )
    }

    if (!res.body) {
      throw new ApiError(0, "响应不支持流式读取")
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() || ""

      for (const line of lines) {
        const data = parseStreamLine(line)
        if (data) handleStreamEvent(data, callbacks)
      }
    }

    const tail = parseStreamLine(buffer)
    if (tail) handleStreamEvent(tail, callbacks)
  } catch (err) {
    if (signal?.aborted && !gate.didTimeout()) return
    if (gate.didTimeout()) throw new ApiError(0, "请求超时，请稍后重试")
    if (isAbortError(err)) throw new ApiError(0, "请求已取消")
    if (err instanceof ApiError) throw err
    const error = err instanceof Error ? err : new Error("流式对话中断")
    callbacks.onError?.(error)
    throw error
  } finally {
    gate.dispose()
  }
}

export const HERO_GOAL_WORKFLOW: Record<string, AgentWorkflow> = {
  explore: "career_explore",
  revise: "resume_revise",
  generate: "resume_generate",
}

export function buildAgentChatMessage(text = "", files: Array<{ name: string }> = []) {
  const trimmed = text.trim()
  if (trimmed) return trimmed
  if (files.length) return `我上传了材料：${files.map((f) => f.name).join("、")}`
  return "你好"
}

/** 生成会话 ID（UUID，便于挂在 /chat/:id） */
export function createAgentSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0
    const v = ch === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** URL path 段编码 */
export function encodeChatSessionPathId(sessionId: string) {
  return encodeURIComponent(String(sessionId || "").trim())
}

export function decodeChatSessionPathId(raw: string) {
  const text = String(raw || "").trim()
  if (!text) return ""
  try {
    return decodeURIComponent(text)
  } catch {
    return text
  }
}

export function chatSessionUrl(sessionId: string) {
  const id = String(sessionId || "").trim()
  if (!id) return "/chat"
  return `/chat/${encodeChatSessionPathId(id)}`
}

/** 从 pathname 解析 /chat/:sessionId（排除裸 /chat） */
export function parseChatSessionIdFromPath(pathname: string) {
  const path = String(pathname || "").replace(/\/+$/, "") || "/"
  if (path === "/chat") return ""
  const m = path.match(/^\/chat\/([^/]+)$/)
  if (!m?.[1]) return ""
  return decodeChatSessionPathId(m[1])
}
