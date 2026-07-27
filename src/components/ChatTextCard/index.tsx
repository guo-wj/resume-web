import ReactMarkdown from "react-markdown"
import "./index.scss"

/** 对话气泡卡片类型，后续可扩展选择题、附件预览、简历预览等 */
export type ChatCardType = "text"

export interface ChatTextCardProps {
  content: string
  /** @deprecated 保留兼容，文本卡片不再展示流式光标 */
  streaming?: boolean
  className?: string
}

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
