import type { ReactNode } from "react"
import chatCardSvgRaw from "@/assets/chat/chat-card.svg?raw"
import "./index.scss"

/** 把 chat-card.svg 内联为可随容器拉伸的手绘边框（非 CSS 实线） */
function buildBorderSvg(raw: string) {
  return raw.replace(/<svg\b([^>]*)>/i, (_, attrs: string) => {
    let next = String(attrs)
      .replace(/\s*width="[^"]*"/gi, "")
      .replace(/\s*height="[^"]*"/gi, "")
    if (/preserveAspectRatio=/i.test(next)) {
      next = next.replace(/preserveAspectRatio="[^"]*"/i, 'preserveAspectRatio="none"')
    } else {
      next += ' preserveAspectRatio="none"'
    }
    return `<svg${next}>`
  })
}

const borderSvgHtml = buildBorderSvg(chatCardSvgRaw)

export function ChatCardFrame({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`chat-card-frame${className ? ` ${className}` : ""}`}>
      {children}
      <span
        className="chat-card-frame__border"
        aria-hidden
        dangerouslySetInnerHTML={{ __html: borderSvgHtml }}
      />
    </div>
  )
}
