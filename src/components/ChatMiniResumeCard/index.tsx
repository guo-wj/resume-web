import sectionIcon from "@/assets/chat/mini-resume-spark.svg"
import actionIcon from "@/assets/chat/mini-resume-bolt.svg"
import type {
  ChatMiniResumeCardData,
  ChatMiniResumeCardPayload,
  ChatMiniResumeExperience,
  ChatMiniResumeAction,
} from "./types"
import "./index.scss"

export type {
  ChatMiniResumeCardData,
  ChatMiniResumeCardPayload,
  ChatMiniResumeExperience,
  ChatMiniResumeAction,
}
export { CHAT_MINI_RESUME_CARD_MOCK } from "./mock"

export interface ChatMiniResumeCardProps {
  data?: ChatMiniResumeCardData
  className?: string
  /** 点击「生成完整简历」等 action 按钮 */
  onAction?: (action: ChatMiniResumeAction, data: ChatMiniResumeCardData) => void
}

function nameInitial(name: string) {
  const s = String(name || "").trim()
  return s ? s.charAt(0) : "?"
}

/** 迷你简历卡 — Figma 379:2815，SSE type: mini_resume_card */
export function ChatMiniResumeCard({ data, className, onAction }: ChatMiniResumeCardProps) {
  if (!data) return null
  const name = String(data.name || "").trim()
  const targetJob = String(data.targetJob || "").trim()
  const experiences = (data.experiences || []).filter(
    (e) => String(e.title || "").trim() || String(e.highlight || "").trim(),
  )
  if (!name && !experiences.length) return null

  const actionLabel = String(data.action?.label || "").trim() || "生成完整简历"

  return (
    <div className={`chat-mini-resume-card${className ? ` ${className}` : ""}`}>
      <div className="chat-mini-resume-card__head">
        <span className="chat-mini-resume-card__avatar" aria-hidden>
          {nameInitial(name)}
        </span>
        <div className="chat-mini-resume-card__identity">
          {name ? <div className="chat-mini-resume-card__name">{name}</div> : null}
          {targetJob ? <span className="chat-mini-resume-card__job">{targetJob}</span> : null}
        </div>
      </div>

      {experiences.length > 0 ? (
        <div className="chat-mini-resume-card__body">
          <div className="chat-mini-resume-card__section-label">
            <img src={sectionIcon} alt="" width={16} height={16} />
            <span>核心经历</span>
          </div>
          <ol className="chat-mini-resume-card__list">
            {experiences.map((item, i) => (
              <li key={`${item.experienceId ?? "x"}-${i}`} className="chat-mini-resume-card__item">
                <span className="chat-mini-resume-card__index">{i + 1}</span>
                <div className="chat-mini-resume-card__item-text">
                  {item.title ? (
                    <div className="chat-mini-resume-card__item-title">{item.title}</div>
                  ) : null}
                  {item.highlight ? (
                    <p className="chat-mini-resume-card__item-highlight">{item.highlight}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="chat-mini-resume-card__foot">
        <button
          type="button"
          className="chat-mini-resume-card__action"
          onClick={() => onAction?.(data.action, data)}
        >
          <img src={actionIcon} alt="" width={16} height={16} />
          <span>{actionLabel}</span>
        </button>
      </div>
    </div>
  )
}

function readStr(v: unknown) {
  return typeof v === "string" ? v.trim() : v != null ? String(v).trim() : ""
}

/** 将 SSE mini_resume_card data 转为卡片结构化数据 */
export function buildChatMiniResumeCardData(
  payload: ChatMiniResumeCardPayload | Record<string, unknown> | null | undefined,
): ChatMiniResumeCardData | null {
  if (!payload || typeof payload !== "object") return null
  const data = payload as ChatMiniResumeCardPayload

  const cardId = readStr(data.card_id)
  const name = readStr(data.name)
  const targetJob = readStr(data.target_job)
  const experiences: ChatMiniResumeExperience[] = []
  if (Array.isArray(data.experiences)) {
    for (const raw of data.experiences) {
      if (!raw || typeof raw !== "object") continue
      const title = readStr(raw.title)
      const highlight = readStr(raw.highlight)
      if (!title && !highlight) continue
      const eid = raw.experience_id as unknown
      let experienceId: number | null = null
      if (typeof eid === "number" && Number.isFinite(eid)) {
        experienceId = eid
      } else if (typeof eid === "string" && eid.trim()) {
        const n = Number(eid)
        experienceId = Number.isFinite(n) ? n : null
      }
      experiences.push({ experienceId, title, highlight })
    }
  }

  if (!cardId && !name && !experiences.length) return null

  const actionRaw = data.action && typeof data.action === "object" ? data.action : null
  const action: ChatMiniResumeAction = {
    label: readStr(actionRaw?.label) || "生成完整简历",
    endpoint: readStr(actionRaw?.endpoint) || undefined,
    payload:
      actionRaw?.payload && typeof actionRaw.payload === "object"
        ? (actionRaw.payload as Record<string, unknown>)
        : undefined,
  }

  return {
    cardId: cardId || `mini_resume_${Date.now()}`,
    name,
    targetJob,
    experiences,
    action,
  }
}
