import { useState } from "react"
import headIcon from "@/assets/chat/color-book.svg"
import checkIcon from "@/assets/chat/template-check.svg"
import { ChatCardFrame } from "../ChatCardFrame"
import type { ChatTemplateCardData, ChatTemplateOption } from "./types"
import "./index.scss"

export type { ChatTemplateCardData, ChatTemplateOption } from "./types"
export { CHAT_TEMPLATE_CARD_MOCK } from "./mock"

export interface ChatTemplateCardProps {
  data?: ChatTemplateCardData
  selectedId?: string
  onSelect?: (template: ChatTemplateOption) => void
  className?: string
}

const PREVIEW_LINES = [
  { kind: "accent", width: "79px" },
  { kind: "muted", width: "100%" },
  { kind: "muted", width: "74%" },
  { kind: "accent", width: "79px" },
  { kind: "muted", width: "100%" },
  { kind: "muted", width: "74%" },
] as const

export function ChatTemplateCard({
  data,
  selectedId,
  onSelect,
  className,
}: ChatTemplateCardProps) {
  const templates = data?.templates || []
  const [innerSelected, setInnerSelected] = useState(
    () => data?.defaultSelectedId || templates[0]?.id || "",
  )

  if (!data || !templates.length) return null

  const activeId = selectedId ?? innerSelected

  const handleSelect = (template: ChatTemplateOption) => {
    if (selectedId === undefined) setInnerSelected(template.id)
    onSelect?.(template)
  }

  return (
    <ChatCardFrame className={`chat-template-card${className ? ` ${className}` : ""}`}>
      <div className="chat-template-card__head">
        <span className="chat-template-card__head-icon">
          <img src={headIcon} alt="" width={18} height={18} />
        </span>
        <div className="chat-template-card__head-text">
          <div className="chat-template-card__title">{data.title}</div>
          {data.subtitle ? <div className="chat-template-card__sub">{data.subtitle}</div> : null}
        </div>
      </div>

      <div className="chat-template-card__grid" role="radiogroup" aria-label={data.title}>
        {templates.map((item) => {
          const selected = item.id === activeId
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={item.title}
              className={"chat-template-card__item" + (selected ? " is-selected" : "")}
              onClick={() => handleSelect(item)}
            >
              <div className="chat-template-card__preview">
                <div
                  className="chat-template-card__preview-banner"
                  style={{ backgroundColor: item.primary }}
                />
                <div className="chat-template-card__preview-body">
                  {PREVIEW_LINES.map((line, i) => (
                    <span
                      key={i}
                      className="chat-template-card__preview-line"
                      style={{
                        width: line.width,
                        backgroundColor: line.kind === "accent" ? item.accent : item.muted,
                      }}
                    />
                  ))}
                </div>
                {selected ? (
                  <span className="chat-template-card__badge">
                    <img src={checkIcon} alt="" width={16} height={16} />
                  </span>
                ) : null}
              </div>
              <div className="chat-template-card__item-title">{item.title}</div>
              <div className="chat-template-card__palette">
                {item.palette.map((color, i) => (
                  <span
                    key={`${item.id}-${i}`}
                    className="chat-template-card__chip"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </ChatCardFrame>
  )
}
