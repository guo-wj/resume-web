import { useCallback, useRef, useState } from "react"
import type { ShowToast } from "../types"

export function useToast() {
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [toast, setToastState] = useState("")

  const showToast: ShowToast = useCallback((message) => {
    clearTimeout(toastTimer.current ?? undefined)
    setToastState(message)
    toastTimer.current = setTimeout(() => setToastState(""), 2600)
  }, [])

  const clearToastTimer = useCallback(() => {
    clearTimeout(toastTimer.current ?? undefined)
  }, [])

  return { toast, showToast, clearToastTimer }
}
