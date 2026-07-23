import { useEffect, useRef, useState } from "react"
import { AUTH_UNAUTHORIZED_EVENT } from "@/api/unauthorized"

/** 监听全局 401 事件，展示登录过期提示 */
export function GlobalAuthToast() {
  const [message, setMessage] = useState("")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const onUnauthorized = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail
      const text = detail?.message || "您未登录或登录已过期，请重新登录"
      if (timerRef.current) clearTimeout(timerRef.current)
      setMessage(text)
      timerRef.current = setTimeout(() => setMessage(""), 2800)
    }
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized)
    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  if (!message) return null

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        top: 34,
        left: "50%",
        zIndex: 9999,
        transform: "translateX(-50%)",
        background: "#1B1530",
        color: "#fff",
        fontSize: 14,
        fontWeight: 600,
        padding: "13px 22px",
        borderRadius: 14,
        boxShadow: "0 18px 40px -16px rgba(0,0,0,.5)",
        pointerEvents: "none",
        maxWidth: "min(90vw, 420px)",
        textAlign: "center",
      }}
    >
      {message}
    </div>
  )
}
