import { useEffect, useState } from "react"
import { ApiError, updateConversationCard } from "@/api"
import type { UpdateConversationCardResult } from "@/api"
import headIcon from "@/assets/chat/info-scan.svg"
import userIcon from "@/assets/chat/info-user.svg"
import phoneIcon from "@/assets/chat/info-phone.svg"
import targetIcon from "@/assets/chat/info-target.svg"
import educationIcon from "@/assets/chat/info-edu.svg"
import checkIcon from "@/assets/chat/score-check.svg"
import type {
  ChatInfoCardData,
  ChatInfoCardPayload,
  ChatInfoBasicInfo,
  ChatInfoStarItem,
  ChatInfoField,
  ChatInfoFieldIcon,
} from "./types"
import "./index.scss"

const FIELD_ICONS: Record<ChatInfoFieldIcon, string> = {
  user: userIcon,
  phone: phoneIcon,
  target: targetIcon,
  education: educationIcon,
}

/** 设计稿固定文案 */
const EDIT_LABEL = "编辑"
const CONFIRM_LABEL = "确定"

const DEFAULT_FIELD_DEFS: Array<Omit<ChatInfoField, "value">> = [
  { key: "name", label: "姓名", icon: "user" },
  { key: "phone", label: "电话", icon: "phone" },
  { key: "target_role", label: "求职目标", icon: "target" },
  { key: "education", label: "学历", icon: "education" },
]

export type {
  ChatInfoCardData,
  ChatInfoCardPayload,
  ChatInfoBasicInfo,
  ChatInfoStarItem,
  ChatInfoField,
  ChatInfoFieldIcon,
}
export { CHAT_INFO_CARD_MOCK } from "./mock"

export interface ChatInfoCardProps {
  data?: ChatInfoCardData
  className?: string
  /** 当前会话 id；也可传函数在点击时再取（避免 ref 未同步） */
  sessionId?: string | (() => string)
  /** 保存成功后回调（含接口回写结果） */
  onSaved?: (payload: Record<string, unknown>) => void
  /** 保存失败 */
  onSaveError?: (error: Error) => void
  /** 进入编辑 */
  onEdit?: () => void
}

function fieldsToMap(fields: ChatInfoField[]) {
  const map: Record<string, string> = {}
  for (const f of fields) map[f.key] = f.value
  return map
}

function strOrNull(v: string | undefined | null): string | null {
  const s = String(v ?? "").trim()
  return s ? s : null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function readStr(src: Record<string, unknown> | null | undefined, key: string) {
  if (!src) return ""
  const v = src[key]
  return typeof v === "string" ? v.trim() : v != null ? String(v).trim() : ""
}

function fieldsFromBasic(
  basic: Record<string, unknown> | null | undefined,
): ChatInfoField[] {
  const src = basic || {}
  return DEFAULT_FIELD_DEFS.map((def) => ({
    ...def,
    value: readStr(src, def.key === "target_role" ? "target_role" : def.key),
  })).filter((f) => f.value)
}

function mergeSavedPayload(
  prev: ChatInfoCardData,
  result: UpdateConversationCardResult,
): Record<string, unknown> {
  const data = asRecord(result.data) || {}
  const basic = asRecord(data.basic) || {}
  return {
    ...data,
    card_id: result.card_id ?? prev.cardId,
    title: typeof data.title === "string" ? data.title : prev.title,
    title_2: typeof data.title_2 === "string" ? data.title_2 : prev.subtitle,
    hint: data.hint != null ? data.hint : prev.hint,
    file_id: data.file_id != null ? data.file_id : prev.fileId,
    basic: {
      name: basic.name ?? null,
      phone: basic.phone ?? null,
      email: basic.email ?? prev.email ?? null,
      education: basic.education ?? null,
      target_role: basic.target_role ?? null,
    },
  }
}

/** 基础信息卡片 — Figma 379:2180 / 379:2248，SSE type: info_card */
export function ChatInfoCard({
  data,
  className,
  sessionId,
  onSaved,
  onSaveError,
  onEdit,
}: ChatInfoCardProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [fields, setFields] = useState<ChatInfoField[]>([])
  const [email, setEmail] = useState("")

  useEffect(() => {
    if (!data) return
    const next = (data.fields || []).filter((f) => String(f.value || "").trim())
    setFields(next)
    setDraft(fieldsToMap(next))
    setEmail(String(data.email || "").trim())
    setEditing(false)
    setSaving(false)
  }, [data])

  if (!data) return null

  const displayFields = fields.filter((f) => String(f.value || "").trim())
  const editFields: ChatInfoField[] = DEFAULT_FIELD_DEFS.map((def) => ({
    ...def,
    value: draft[def.key] ?? "",
  }))

  if (!displayFields.length && !editing) return null

  const hint = String(data.hint || "").trim()
  const rows = editing ? editFields : displayFields

  const startEdit = () => {
    if (saving) return
    setDraft(fieldsToMap(fields))
    setEditing(true)
    onEdit?.()
  }

  const confirm = async () => {
    if (saving) return

    const nextFields = editFields.map((f) => ({
      ...f,
      value: String(draft[f.key] ?? "").trim(),
    }))
    const body = {
      name: strOrNull(draft.name),
      phone: strOrNull(draft.phone),
      email: strOrNull(email),
      education: strOrNull(draft.education),
      target_role: strOrNull(draft.target_role),
    }

    const sid = String(
      typeof sessionId === "function" ? sessionId() : sessionId || "",
    ).trim()
    const cardId = data.cardId

    if (!sid) {
      onSaveError?.(new Error("缺少会话，无法保存"))
      return
    }
    if (cardId == null || String(cardId).trim() === "") {
      onSaveError?.(new Error("缺少卡片 id，无法保存"))
      return
    }

    setSaving(true)
    try {
      const result = await updateConversationCard(sid, cardId, body)
      if (!result) throw new Error("保存失败：接口无返回")
      const merged = mergeSavedPayload(data, result)
      const basic = asRecord(merged.basic)
      const savedFields = fieldsFromBasic(basic)
      setFields(savedFields.length ? savedFields : nextFields.filter((f) => f.value))
      setEmail(readStr(basic, "email") || email)
      setDraft(fieldsToMap(savedFields.length ? savedFields : nextFields))
      setEditing(false)
      onSaved?.(merged)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("保存失败")
      if (!(err instanceof ApiError && err.handled)) {
        onSaveError?.(error)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`chat-info-card${className ? ` ${className}` : ""}${editing ? " is-editing" : ""}`}>
      <div className="chat-info-card__head">
        <span className="chat-info-card__head-icon">
          <img src={headIcon} alt="" width={24} height={24} />
        </span>
        <div className="chat-info-card__head-text">
          <div className="chat-info-card__title">{data.title}</div>
          {data.subtitle ? <div className="chat-info-card__sub">{data.subtitle}</div> : null}
        </div>
      </div>

      <div className="chat-info-card__body">
        {rows.map((field, i) => (
          <InfoFieldRow
            key={field.key}
            field={field}
            showDivider={i > 0}
            editing={editing}
            value={editing ? (draft[field.key] ?? "") : field.value}
            onChange={
              editing
                ? (v) => setDraft((prev) => ({ ...prev, [field.key]: v }))
                : undefined
            }
          />
        ))}
      </div>

      {hint && !editing ? (
        <div className="chat-info-card__hint">
          <span className="chat-info-card__hint-icon">
            <img src={checkIcon} alt="" width={13} height={13} />
          </span>
          <span className="chat-info-card__hint-text">{hint}</span>
        </div>
      ) : null}

      <div className="chat-info-card__actions">
        <button
          type="button"
          className="chat-info-card__btn chat-info-card__btn--edit"
          onClick={startEdit}
          disabled={saving}
        >
          {EDIT_LABEL}
        </button>
        <button
          type="button"
          className="chat-info-card__btn chat-info-card__btn--confirm"
          onClick={() => void confirm()}
          disabled={saving}
        >
          {saving ? "保存中…" : CONFIRM_LABEL}
        </button>
      </div>
    </div>
  )
}

function InfoFieldRow({
  field,
  showDivider,
  editing,
  value,
  onChange,
}: {
  field: ChatInfoField
  showDivider: boolean
  editing: boolean
  value: string
  onChange?: (value: string) => void
}) {
  const iconSrc = FIELD_ICONS[field.icon]
  return (
    <>
      {showDivider ? <div className="chat-info-card__divider" /> : null}
      <div className={`chat-info-card__row${editing ? " is-editing" : ""}`}>
        <span className="chat-info-card__row-icon">
          {iconSrc ? <img src={iconSrc} alt="" width={16} height={16} /> : null}
        </span>
        <div className="chat-info-card__row-text">
          <div className="chat-info-card__label">{field.label}</div>
          {editing ? (
            <input
              className="chat-info-card__input"
              type="text"
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              aria-label={field.label}
            />
          ) : (
            <div className="chat-info-card__value">{value}</div>
          )}
        </div>
      </div>
    </>
  )
}

/** 将 SSE info_card data 转为卡片结构化数据 */
export function buildChatInfoCardData(
  payload: ChatInfoCardPayload | Record<string, unknown> | null | undefined,
): ChatInfoCardData | null {
  if (!payload || typeof payload !== "object") return null
  const data = payload as ChatInfoCardPayload
  const basic = asRecord(data.basic) || asRecord(data.basic_info) || {}

  const name = readStr(basic, "name")
  const phone = readStr(basic, "phone")
  const email = readStr(basic, "email")
  const education = readStr(basic, "education")
  const targetRole = readStr(basic, "target_role")

  const candidates: ChatInfoField[] = DEFAULT_FIELD_DEFS.map((def) => ({
    ...def,
    value:
      def.key === "name"
        ? name
        : def.key === "phone"
          ? phone
          : def.key === "target_role"
            ? targetRole
            : education,
  }))
  const fields = candidates.filter((f) => f.value)

  if (!fields.length) return null

  const title = String(data.title || "").trim() || "我读到了你的这些信息"
  const subtitle = String(data.title_2 || "").trim()
  const hint = String(data.hint || "").trim()
  // card_id 可能在顶层 / data / id 字段
  const cardIdRaw =
    data.card_id ??
    (data as { id?: unknown }).id ??
    (asRecord(data.data) as { card_id?: unknown } | null)?.card_id
  const cardId =
    cardIdRaw != null && String(cardIdRaw).trim() !== "" ? cardIdRaw : undefined

  return {
    title,
    subtitle: subtitle || undefined,
    fields,
    hint: hint || undefined,
    email: email || undefined,
    fileId: data.file_id != null ? String(data.file_id).trim() || undefined : undefined,
    cardId: cardId as string | number | undefined,
    primaryAction: { label: CONFIRM_LABEL },
    secondaryAction: { label: EDIT_LABEL },
  }
}
