import ReactMarkdown from "react-markdown"
import type { ChatTextCardProps } from "./types"
import "./ChatTextCard.scss"

export function ChatTextCard({ content, className }: ChatTextCardProps) {
  const trimmed = content?.trim() ?? ""
  if (!trimmed) return null

  return (
    <div className={`chat-text-card${className ? ` ${className}` : ""}`}>
      <div className="chat-text-card__md">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  )
}
