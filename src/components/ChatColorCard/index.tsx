import { useState } from "react"
import headIcon from "@/assets/chat/color-book.svg"
import checkIcon from "@/assets/chat/color-check.svg"
import { ChatCardFrame } from "../ChatCardFrame"
import type { ChatColorCardData, ChatColorOption } from "./types"
import "./index.scss"

export type { ChatColorCardData, ChatColorOption } from "./types"
export { CHAT_COLOR_CARD_MOCK } from "./mock"

export interface ChatColorCardProps {
  data?: ChatColorCardData
  /** 受控选中色 id */
  selectedId?: string
  onSelect?: (color: ChatColorOption) => void
  className?: string
}

export function ChatColorCard({ data, selectedId, onSelect, className }: ChatColorCardProps) {
  const colors = data?.colors || []
  const [innerSelected, setInnerSelected] = useState(
    () => data?.defaultSelectedId || colors[0]?.id || "",
  )

  if (!data || !colors.length) return null

  const activeId = selectedId ?? innerSelected

  const handleSelect = (color: ChatColorOption) => {
    if (selectedId === undefined) setInnerSelected(color.id)
    onSelect?.(color)
  }

  return (
    <ChatCardFrame className={`chat-color-card${className ? ` ${className}` : ""}`}>
      <div className="chat-color-card__head">
        <span className="chat-color-card__head-icon">
          <img src={headIcon} alt="" width={18} height={18} />
        </span>
        <div className="chat-color-card__head-text">
          <div className="chat-color-card__title">{data.title}</div>
          {data.subtitle ? <div className="chat-color-card__sub">{data.subtitle}</div> : null}
        </div>
      </div>

      <div className="chat-color-card__body" role="radiogroup" aria-label={data.title}>
        {colors.map((item) => {
          const selected = item.id === activeId
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={item.label || item.color}
              className={"chat-color-card__swatch" + (selected ? " is-selected" : "")}
              style={{ backgroundColor: item.color }}
              onClick={() => handleSelect(item)}
            >
              {selected ? (
                <img src={checkIcon} alt="" width={16} height={16} className="chat-color-card__check" />
              ) : null}
            </button>
          )
        })}
      </div>
    </ChatCardFrame>
  )
}
