import { useEffect, useState } from "react"
import { ApiError, updateConversationCard } from "@/api"
import type { UpdateConversationCardResult } from "@/api"
import headIcon from "@/assets/chat/info-scan.svg"
import sectionProfileIcon from "@/assets/chat/info-section-profile.svg"
import sectionExperienceIcon from "@/assets/chat/info-section-experience.svg"
import nameIcon from "@/assets/chat/info-user.svg"
import phoneIcon from "@/assets/chat/info-phone.svg"
import emailIcon from "@/assets/chat/info-email.svg"
import industryIcon from "@/assets/chat/info-industry.svg"
import roleIcon from "@/assets/chat/info-role.svg"
import educationIcon from "@/assets/chat/info-degree.svg"
import schoolIcon from "@/assets/chat/info-school.svg"
import majorIcon from "@/assets/chat/info-major.svg"
import chevronIcon from "@/assets/chat/info-chevron.svg"
import type {
  ChatInfoCardData,
  ChatInfoCardPayload,
  ChatInfoBasicInfo,
  ChatInfoExperience,
  ChatInfoExperiencePayload,
  ChatInfoStarItem,
  ChatInfoField,
  ChatInfoFieldIcon,
} from "./types"
import "./index.scss"

const FIELD_ICONS: Record<ChatInfoFieldIcon, string> = {
  name: nameIcon,
  phone: phoneIcon,
  email: emailIcon,
  industry: industryIcon,
  role: roleIcon,
  education: educationIcon,
  school: schoolIcon,
  major: majorIcon,
}

const DEFAULT_TITLE = "我读懂了你的这些信息～"
const DEFAULT_SUBTITLE = "信息已经自动存入履历库，将成为你的身份卡片"
const EDIT_LABEL = "修改"
const CANCEL_LABEL = "取消修改"
const SAVE_LABEL = "保存"

const SECTION_BASIC = "基础资料"
const SECTION_EXPERIENCE = "经历"

const CATEGORY_LABELS: Record<string, string> = {
  work: "工作",
  internship: "实习",
  research: "科研",
  project: "项目",
  practice: "实践项目",
  competition: "竞赛",
  startup: "创业",
  entrepreneurship: "创业",
}

const BASIC_FIELD_DEFS: Array<Omit<ChatInfoField, "value">> = [
  { key: "name", label: "姓名", icon: "name" },
  { key: "phone", label: "电话", icon: "phone" },
  { key: "email", label: "邮箱", icon: "email" },
  { key: "target_industry", label: "目标行业", icon: "industry" },
  { key: "target_role", label: "目标岗位", icon: "role" },
  { key: "highest_education", label: "最高学历", icon: "education" },
  { key: "school", label: "学校", icon: "school" },
  { key: "major", label: "专业", icon: "major" },
]

const DETAIL_STEPS: Array<{ key: "content" | "duty" | "result"; label: string }> = [
  { key: "content", label: "具体经历（Content）" },
  { key: "duty", label: "我的职责（Duty）" },
  { key: "result", label: "最后成果（Result）" },
]

export type {
  ChatInfoCardData,
  ChatInfoCardPayload,
  ChatInfoBasicInfo,
  ChatInfoExperience,
  ChatInfoExperiencePayload,
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

function categoryLabel(raw: string) {
  const text = raw.trim()
  if (!text) return ""
  return CATEGORY_LABELS[text.toLowerCase()] || text
}

function formatPeriod(start: string, end: string) {
  const s = start.trim()
  const rawEnd = end.trim()
  const e =
    !rawEnd || rawEnd.toLowerCase() === "now" || rawEnd.toLowerCase() === "present"
      ? s
        ? "至今"
        : ""
      : rawEnd
  if (s && e) return `${s} – ${e}`
  return s || e
}

function readAbilityArgs(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === "string" ? item.trim() : item != null ? String(item).trim() : ""))
    .filter(Boolean)
}

function basicValue(basic: Record<string, unknown>, key: string) {
  if (key === "highest_education") {
    return readStr(basic, "highest_education") || readStr(basic, "education")
  }
  return readStr(basic, key)
}

function fieldsFromBasic(basic: Record<string, unknown> | null | undefined): ChatInfoField[] {
  const src = basic || {}
  return BASIC_FIELD_DEFS.map((def) => ({
    ...def,
    value: basicValue(src, def.key),
  })).filter((f) => f.value)
}

function dataSnapshot(data: ChatInfoCardData | undefined) {
  if (!data) return ""
  return JSON.stringify({
    cardId: data.cardId,
    title: data.title,
    subtitle: data.subtitle,
    fields: data.fields,
    experiences: data.experiences,
  })
}

function mergeSavedPayload(
  prev: ChatInfoCardData,
  result: UpdateConversationCardResult,
  draft: Record<string, string>,
): Record<string, unknown> {
  const data = asRecord(result.data) || {}
  const basic = asRecord(data.basic) || {}
  const highest =
    basic.highest_education ?? basic.education ?? strOrNull(draft.highest_education)
  return {
    ...data,
    card_id: result.card_id ?? prev.cardId,
    title: typeof data.title === "string" ? data.title : prev.title,
    hint: data.hint != null ? data.hint : prev.hint,
    written: data.written != null ? data.written : prev.written,
    file_id: data.file_id != null ? data.file_id : prev.fileId,
    experience: data.experience ?? prev.experiences.map(experienceToPayload),
    basic: {
      name: basic.name ?? strOrNull(draft.name),
      phone: basic.phone ?? strOrNull(draft.phone),
      email: basic.email ?? strOrNull(draft.email),
      target_industry: basic.target_industry ?? strOrNull(draft.target_industry),
      target_role: basic.target_role ?? strOrNull(draft.target_role),
      highest_education: highest,
      education: highest,
      school: basic.school ?? strOrNull(draft.school),
      major: basic.major ?? strOrNull(draft.major),
    },
  }
}

function experienceToPayload(item: ChatInfoExperience): ChatInfoExperiencePayload {
  const [start, end] = item.period.split(" – ")
  return {
    title: item.title,
    category: item.category,
    role: item.role,
    start_date: start || "",
    end_date: end === "至今" ? "now" : end || "",
    content: item.content,
    duty: item.duty,
    result: item.result,
    ability_args: item.abilityArgs,
  }
}

/** 基础信息卡片 — Figma 409:1916，SSE type: info_card */
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
  const [openMap, setOpenMap] = useState<Record<number, boolean>>({ 0: true })
  const snapshot = dataSnapshot(data)

  useEffect(() => {
    if (!data) return
    const next = (data.fields || []).filter((f) => String(f.value || "").trim())
    setFields(next)
    setDraft(fieldsToMap(BASIC_FIELD_DEFS.map((def) => ({
      ...def,
      value: next.find((f) => f.key === def.key)?.value || "",
    }))))
    setOpenMap({ 0: true })
    setEditing(false)
    setSaving(false)
  }, [snapshot])

  if (!data) return null

  const displayFields = fields.filter((f) => String(f.value || "").trim())
  const editFields: ChatInfoField[] = BASIC_FIELD_DEFS.map((def) => ({
    ...def,
    value: draft[def.key] ?? "",
  }))
  const experiences = data.experiences || []
  const rows = editing ? editFields : displayFields

  if (!displayFields.length && !experiences.length && !editing) return null

  const startEdit = () => {
    if (saving) return
    setDraft(
      fieldsToMap(
        BASIC_FIELD_DEFS.map((def) => ({
          ...def,
          value: fields.find((f) => f.key === def.key)?.value || "",
        })),
      ),
    )
    setEditing(true)
    onEdit?.()
  }

  const cancelEdit = () => {
    if (saving) return
    setEditing(false)
  }

  const confirm = async () => {
    if (saving) return

    const nextFields = editFields
      .map((f) => ({ ...f, value: String(draft[f.key] ?? "").trim() }))
      .filter((f) => f.value)
    const highest = strOrNull(draft.highest_education)
    const body = {
      name: strOrNull(draft.name),
      phone: strOrNull(draft.phone),
      email: strOrNull(draft.email),
      target_industry: strOrNull(draft.target_industry),
      target_role: strOrNull(draft.target_role),
      highest_education: highest,
      education: highest,
      school: strOrNull(draft.school),
      major: strOrNull(draft.major),
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
      const merged = mergeSavedPayload(data, result, draft)
      const basic = asRecord(merged.basic)
      const savedFields = fieldsFromBasic(basic)
      setFields(savedFields.length ? savedFields : nextFields)
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

      <div className="chat-info-card__content">
        {rows.length > 0 ? (
          <section className="chat-info-card__section">
            <div className="chat-info-card__section-head">
              <img src={sectionProfileIcon} alt="" width={20} height={20} />
              <span className="chat-info-card__section-title">{SECTION_BASIC}</span>
              <span className="chat-info-card__section-line" />
            </div>
            <div className="chat-info-card__grid">
              {rows.map((field) => (
                <InfoField
                  key={field.key}
                  field={field}
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
          </section>
        ) : null}

        {experiences.length > 0 ? (
          <section className="chat-info-card__section">
            <div className="chat-info-card__section-head">
              <img src={sectionExperienceIcon} alt="" width={20} height={20} />
              <span className="chat-info-card__section-title">{SECTION_EXPERIENCE}</span>
              <span className="chat-info-card__section-line" />
            </div>
            <div className="chat-info-card__experiences">
              {experiences.map((item, index) => (
                <ExperienceItem
                  key={`${item.title}-${index}`}
                  item={item}
                  open={!!openMap[index]}
                  onToggle={() =>
                    setOpenMap((prev) => ({ ...prev, [index]: !prev[index] }))
                  }
                />
              ))}
            </div>
          </section>
        ) : null}

        <div className="chat-info-card__actions">
          {editing ? (
            <button
              type="button"
              className="chat-info-card__btn chat-info-card__btn--edit"
              onClick={cancelEdit}
              disabled={saving}
            >
              {CANCEL_LABEL}
            </button>
          ) : (
            <button
              type="button"
              className="chat-info-card__btn chat-info-card__btn--edit"
              onClick={startEdit}
              disabled={saving}
            >
              {EDIT_LABEL}
            </button>
          )}
          {editing ? (
            <button
              type="button"
              className="chat-info-card__btn chat-info-card__btn--confirm"
              onClick={() => void confirm()}
              disabled={saving}
            >
              {saving ? "保存中…" : SAVE_LABEL}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function InfoField({
  field,
  editing,
  value,
  onChange,
}: {
  field: ChatInfoField
  editing: boolean
  value: string
  onChange?: (value: string) => void
}) {
  const iconSrc = FIELD_ICONS[field.icon]
  return (
    <div className={`chat-info-card__field${editing ? " is-editing" : ""}`}>
      <span className="chat-info-card__field-icon">
        {iconSrc ? <img src={iconSrc} alt="" /> : null}
      </span>
      <div className="chat-info-card__field-text">
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
  )
}

function ExperienceItem({
  item,
  open,
  onToggle,
}: {
  item: ChatInfoExperience
  open: boolean
  onToggle: () => void
}) {
  const steps = DETAIL_STEPS.filter((step) => String(item[step.key] || "").trim())
  const tags = item.abilityArgs.filter(Boolean)
  const canExpand = steps.length > 0 || tags.length > 0

  return (
    <article className={`chat-info-card__exp${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="chat-info-card__exp-head"
        onClick={canExpand ? onToggle : undefined}
        aria-expanded={canExpand ? open : undefined}
        disabled={!canExpand}
      >
        <span className="chat-info-card__exp-dot" aria-hidden />
        <span className="chat-info-card__exp-main">
          {item.title ? <span className="chat-info-card__exp-title">{item.title}</span> : null}
          <span className="chat-info-card__exp-meta">
            {item.categoryLabel ? (
              <span className="chat-info-card__tag">{item.categoryLabel}</span>
            ) : null}
            {item.role ? <span className="chat-info-card__tag">{item.role}</span> : null}
            {item.period ? <span className="chat-info-card__exp-period">{item.period}</span> : null}
          </span>
        </span>
        {canExpand ? (
          <span className={`chat-info-card__exp-chevron${open ? "" : " is-collapsed"}`}>
            <img src={chevronIcon} alt="" width={16} height={16} />
          </span>
        ) : null}
      </button>

      {open && canExpand ? (
        <div className="chat-info-card__exp-body">
          {steps.map((step) => (
            <div key={step.key} className="chat-info-card__step">
              <span className="chat-info-card__step-marker" aria-hidden />
              <div className="chat-info-card__step-text">
                <div className="chat-info-card__step-label">{step.label}</div>
                <p className="chat-info-card__step-value">{item[step.key]}</p>
              </div>
            </div>
          ))}
          {tags.length > 0 ? (
            <div className="chat-info-card__step">
              <span className="chat-info-card__step-marker" aria-hidden />
              <div className="chat-info-card__step-text">
                <div className="chat-info-card__step-label">能力标签（Ability_tags）</div>
                <div className="chat-info-card__tags">
                  {tags.map((tag) => (
                    <span key={tag} className="chat-info-card__tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

/** 将 SSE info_card data 转为卡片结构化数据 */
export function buildChatInfoCardData(
  payload: ChatInfoCardPayload | Record<string, unknown> | null | undefined,
): ChatInfoCardData | null {
  if (!payload || typeof payload !== "object") return null
  const data = payload as ChatInfoCardPayload
  const basic = asRecord(data.basic) || asRecord(data.basic_info) || {}
  const fields = fieldsFromBasic(basic)
  const experiences = readExperiences(data.experience)

  if (!fields.length && !experiences.length) return null

  const title = String(data.title || "").trim() || DEFAULT_TITLE
  const hint = String(data.hint || "").trim()
  const title2 = String(data.title_2 || "").trim()
  const written = data.written
  const subtitle =
    title2 || hint || (written === false ? "" : DEFAULT_SUBTITLE)

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
    experiences,
    hint: hint || undefined,
    written: typeof written === "boolean" ? written : undefined,
    fileId: data.file_id != null ? String(data.file_id).trim() || undefined : undefined,
    cardId: cardId as string | number | undefined,
    primaryAction: { label: SAVE_LABEL },
    secondaryAction: { label: EDIT_LABEL },
  }
}

function readExperiences(raw: unknown): ChatInfoExperience[] {
  if (!Array.isArray(raw)) return []
  const out: ChatInfoExperience[] = []
  for (const item of raw) {
    const row = asRecord(item)
    if (!row) continue
    const title = readStr(row, "title")
    const category = readStr(row, "category")
    const role = readStr(row, "role")
    const period = formatPeriod(readStr(row, "start_date"), readStr(row, "end_date"))
    const content = readStr(row, "content")
    const duty = readStr(row, "duty")
    const result = readStr(row, "result")
    const abilityArgs = readAbilityArgs(row.ability_args)
    if (!title && !role && !content && !duty && !result) continue
    out.push({
      title,
      category,
      categoryLabel: categoryLabel(category),
      role,
      period,
      content,
      duty,
      result,
      abilityArgs,
    })
  }
  return out
}
