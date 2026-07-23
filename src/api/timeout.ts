import { ApiError } from "./types"

/** 默认请求超时（毫秒），传 `0` 可关闭 */
export const DEFAULT_TIMEOUT_MS = 20_000

export function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error && err.name === "AbortError")
  )
}

export interface TimeoutGate {
  signal: AbortSignal
  didTimeout: () => boolean
  /** 清除超时计时器（流式响应拿到首包后调用），保留外部 abort 联动 */
  clearTimer: () => void
  /** 清理计时器与外部监听 */
  dispose: () => void
}

/** 合并超时与外部 AbortSignal */
export function createTimeoutGate(
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  external?: AbortSignal,
): TimeoutGate {
  const controller = new AbortController()
  let timedOut = false
  let timer: ReturnType<typeof setTimeout> | null = null

  if (timeoutMs > 0) {
    timer = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, timeoutMs)
  }

  const onExternalAbort = () => controller.abort()
  if (external) {
    if (external.aborted) controller.abort()
    else external.addEventListener("abort", onExternalAbort)
  }

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    clearTimer,
    dispose: () => {
      clearTimer()
      external?.removeEventListener("abort", onExternalAbort)
    },
  }
}

/** 将 abort / 超时转为 ApiError 后抛出 */
export function throwIfAborted(err: unknown, timedOut: boolean): never {
  if (timedOut) throw new ApiError(0, "请求超时，请稍后重试")
  if (isAbortError(err)) throw new ApiError(0, "请求已取消")
  throw err
}
