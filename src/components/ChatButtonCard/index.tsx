import { useState } from "react"
import type {
  ChatButtonCardData,
  ChatButtonCardPayload,
  ChatButtonItem,
} from "./types"
import "./index.scss"

function ButtonCardArrow() {
  return (
    <svg
      className="chat-button-card__arrow"
      width={16}
      height={16}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3.75 9H14.25M9 3.75L14.25 9L9 14.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export type { ChatButtonCardData, ChatButtonCardPayload, ChatButtonItem }
export { CHAT_BUTTON_CARD_MOCK } from "./mock"

export interface ChatButtonCardProps {
  data?: ChatButtonCardData
  className?: string
  disabled?: boolean
  /** 受控选中下标；不传则点击后内部记录 */
  selectedIndex?: number | null
  /** 点击某个建议按钮 */
  onButtonClick?: (button: ChatButtonItem, index: number, data: ChatButtonCardData) => void
}

/** 建议按钮卡 — Figma 379:2910，SSE type: button_card；buttons 有几项画几个 */
export function ChatButtonCard({
  data,
  className,
  disabled,
  selectedIndex,
  onButtonClick,
}: ChatButtonCardProps) {
  const [innerSelected, setInnerSelected] = useState<number | null>(null)

  if (!data) return null
  const buttons = (data.buttons || []).filter((b) => String(b.text || "").trim())
  if (!buttons.length) return null

  const activeIndex = selectedIndex !== undefined ? selectedIndex : innerSelected

  const handleClick = (button: ChatButtonItem, index: number) => {
    if (disabled) return
    if (selectedIndex === undefined) setInnerSelected(index)
    onButtonClick?.(button, index, data)
  }

  return (
    <div
      className={`chat-button-card${className ? ` ${className}` : ""}`}
      role="group"
      aria-label="建议操作"
    >
      {buttons.map((button, index) => {
        const selected = activeIndex === index
        return (
          <button
            key={`${button.text}-${index}`}
            type="button"
            className={
              "chat-button-card__btn" + (selected ? " is-selected" : "")
            }
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => handleClick(button, index)}
          >
            <span className="chat-button-card__text">{button.text}</span>
            <ButtonCardArrow />
          </button>
        )
      })}
    </div>
  )
}

function readStr(v: unknown) {
  return typeof v === "string" ? v.trim() : v != null ? String(v).trim() : ""
}

/** 将 SSE button_card data 转为卡片结构化数据 */
export function buildChatButtonCardData(
  payload: ChatButtonCardPayload | Record<string, unknown> | null | undefined,
): ChatButtonCardData | null {
  if (!payload || typeof payload !== "object") return null
  const data = payload as ChatButtonCardPayload

  const buttons: ChatButtonItem[] = []
  if (Array.isArray(data.buttons)) {
    for (const raw of data.buttons) {
      if (!raw || typeof raw !== "object") continue
      const text = readStr(raw.text)
      if (!text) continue
      buttons.push({ text })
    }
  }

  if (!buttons.length) return null

  const cardIdRaw = data.card_id ?? (data as { id?: unknown }).id
  const cardId =
    cardIdRaw != null && String(cardIdRaw).trim() !== "" ? cardIdRaw : undefined

  return {
    cardId: cardId as string | number | undefined,
    buttons,
  }
}
