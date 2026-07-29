import headIcon from "@/assets/chat/profile-book.svg"
import userIcon from "@/assets/chat/profile-user.svg"
import phoneIcon from "@/assets/chat/profile-phone.svg"
import targetIcon from "@/assets/chat/profile-target.svg"
import { ChatCardFrame } from "../ChatCardFrame"
import type { ChatProfileCardData, ChatProfileField, ChatProfileFieldIcon } from "./types"
import "./index.scss"

const FIELD_ICONS: Record<ChatProfileFieldIcon, string> = {
  user: userIcon,
  phone: phoneIcon,
  target: targetIcon,
}

export type { ChatProfileCardData, ChatProfileField, ChatProfileFieldIcon }
export { CHAT_PROFILE_CARD_MOCK } from "./mock"

export interface ChatProfileCardProps {
  data?: ChatProfileCardData
  className?: string
}

export function ChatProfileCard({ data, className }: ChatProfileCardProps) {
  if (!data) return null
  const fields = (data.fields || []).filter((f) => f.value)
  if (!fields.length) return null

  return (
    <ChatCardFrame className={`chat-profile-card${className ? ` ${className}` : ""}`}>
      <div className="chat-profile-card__head">
        <span className="chat-profile-card__head-icon">
          <img src={headIcon} alt="" width={18} height={18} />
        </span>
        <div className="chat-profile-card__head-text">
          <div className="chat-profile-card__title">{data.title}</div>
          {data.subtitle ? <div className="chat-profile-card__sub">{data.subtitle}</div> : null}
        </div>
      </div>
      <div className="chat-profile-card__body">
        {fields.map((field, i) => (
          <ProfileFieldRow key={field.key} field={field} showDivider={i > 0} />
        ))}
      </div>
    </ChatCardFrame>
  )
}

function ProfileFieldRow({ field, showDivider }: { field: ChatProfileField; showDivider: boolean }) {
  const iconSrc = FIELD_ICONS[field.icon]
  return (
    <>
      {showDivider ? <div className="chat-profile-card__divider" /> : null}
      <div className="chat-profile-card__row">
        <span className="chat-profile-card__row-icon">
          {iconSrc ? <img src={iconSrc} alt="" width={13} height={13} /> : null}
        </span>
        <div className="chat-profile-card__row-text">
          <div className="chat-profile-card__label">{field.label}</div>
          <div className="chat-profile-card__value">{field.value}</div>
        </div>
      </div>
    </>
  )
}

/** 将接口/会话里的扁平 profile 转成卡片结构化数据 */
export function buildChatProfileCardData(profile: {
  name?: string
  phone?: string
  goal?: string
  title?: string
  subtitle?: string
}): ChatProfileCardData {
  return {
    title: profile.title || "用户画像",
    subtitle: profile.subtitle || "AI 已识别以下基本信息",
    fields: [
      { key: "name", label: "姓名", value: profile.name || "", icon: "user" },
      { key: "phone", label: "电话", value: profile.phone || "", icon: "phone" },
      { key: "goal", label: "求职目标", value: profile.goal || "", icon: "target" },
    ],
  }
}
