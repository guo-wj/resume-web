import { getAccessToken } from "@/store/auth"
import { resolveApiPath } from "./endpoints"
import { ApiError } from "./types"

/** Agent 服务独立前缀，不走 VITE_API_BASE */
const AGENT_BASE = import.meta.env.VITE_AGENT_BASE || "/agent"

export type AgentWorkflow = "career_explore" | "resume_revise" | "resume_generate"

export interface AgentChatRequest {
  user_id: string | number
  session_id: string
  message: string
  workflow: AgentWorkflow | string
  stream_output?: boolean
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

function joinAgentUrl(path: string): string {
  const base = AGENT_BASE.replace(/\/$/, "")
  const p = path.startsWith("/") ? path : `/${path}`
  return `${base}${p}`
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

/** POST /agent/chat，解析 SSE / 逐行 JSON 流式响应 */
export async function streamAgentChat(
  body: AgentChatRequest,
  callbacks: AgentChatStreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const path = resolveApiPath("agent.chat")
  const url = joinAgentUrl(path)
  const token = getAccessToken()

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
    signal,
  })

  if (!res.ok) {
    const json = await res.json().catch(() => null)
    const message =
      (json && typeof json === "object" && "message" in json && String(json.message)) ||
      res.statusText ||
      "对话请求失败"
    throw new ApiError(res.status, message)
  }

  if (!res.body) {
    throw new ApiError(0, "响应不支持流式读取")
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
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
    if (signal?.aborted) return
    const error = err instanceof Error ? err : new Error("流式对话中断")
    callbacks.onError?.(error)
    throw error
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

export function createAgentSessionId() {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}
