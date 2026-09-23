export type ChatInfoFieldIcon =
  | "name"
  | "phone"
  | "email"
  | "industry"
  | "role"
  | "education"
  | "school"
  | "major"

export interface ChatInfoField {
  key: string
  label: string
  value: string
  icon: ChatInfoFieldIcon
}

export interface ChatInfoExperience {
  title: string
  /** 原始 category，如 research / work / competition */
  category: string
  categoryLabel: string
  role: string
  period: string
  content: string
  duty: string
  result: string
  abilityArgs: string[]
}

export interface ChatInfoCardData {
  /** 主标题；缺省为设计稿固定文案 */
  title: string
  /** 副标题：优先 title_2，否则 hint */
  subtitle?: string
  fields: ChatInfoField[]
  experiences: ChatInfoExperience[]
  /** 有值才展示：已写入履历库提示；开关关闭时后端不返回 */
  hint?: string
  fileId?: string
  /** PUT /conversations/{session_id}/cards/{card_id} */
  cardId?: string | number
  written?: boolean
  /** @deprecated 底部按钮固定为「修改 / 保存」 */
  secondaryAction?: { label: string }
  /** @deprecated 底部按钮固定为「修改 / 保存」 */
  primaryAction?: { label: string }
}

/** SSE `info_card` 事件 data.basic / basic_info */
export interface ChatInfoBasicInfo {
  name?: string
  phone?: string
  email?: string
  target_industry?: string
  target_role?: string
  highest_education?: string
  /** 旧字段，与 highest_education 同义 */
  education?: string
  school?: string
  major?: string
  [key: string]: unknown
}

export interface ChatInfoExperiencePayload {
  title?: string
  category?: string
  role?: string
  start_date?: string
  end_date?: string
  content?: string
  duty?: string
  result?: string
  ability_args?: unknown
  [key: string]: unknown
}

/** SSE `info_card` 事件 data.star 单项（卡片暂不展示） */
export interface ChatInfoStarItem {
  title?: string
  situation?: { value?: string; missing?: unknown; [key: string]: unknown }
  task?: { value?: string; missing?: unknown; [key: string]: unknown }
  action?: { value?: string; missing?: unknown; [key: string]: unknown }
  result?: { value?: string; missing?: unknown; [key: string]: unknown }
  [key: string]: unknown
}

/** SSE `info_card` 事件 data 形态 */
export interface ChatInfoCardPayload {
  title?: string
  title_2?: string
  /** 有则作为副标题（已写入履历库）；无则不展示 */
  hint?: string
  written?: boolean
  file_id?: string
  /** 事件顶层或 data 内均可 */
  card_id?: string | number
  basic?: ChatInfoBasicInfo
  /** 文档别名，与 basic 同义 */
  basic_info?: ChatInfoBasicInfo
  experience?: ChatInfoExperiencePayload[]
  star?: ChatInfoStarItem[]
  primary_btn?: string
  secondary_btn?: string
  [key: string]: unknown
}
