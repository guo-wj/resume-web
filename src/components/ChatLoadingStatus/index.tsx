import loadingIcon from "@/assets/chat/loading-icon.png"
import "./index.scss"

/** 默认思考文案（流式尚未下发 loading_text 时） */
export const CHAT_LOADING_STATUS_DEFAULT_TEXT = "Thinking"

export interface ChatLoadingStatusProps {
  /** 可定制文案；不传则用默认 Thinking */
  text?: string
  className?: string
}

/** 对话 loading 态：左侧 icon + 右侧扫光文案（Figma 353:1135 / 353:1136） */
export function ChatLoadingStatus({
  text = CHAT_LOADING_STATUS_DEFAULT_TEXT,
  className,
}: ChatLoadingStatusProps) {
  const label = String(text || CHAT_LOADING_STATUS_DEFAULT_TEXT).trim() || CHAT_LOADING_STATUS_DEFAULT_TEXT

  return (
    <div
      className={`chat-loading-status${className ? ` ${className}` : ""}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <img
        className="chat-loading-status__icon"
        src={loadingIcon}
        alt=""
        width={22}
        height={20}
        draggable={false}
      />
      <span className="chat-loading-status__text">{label}</span>
    </div>
  )
}
