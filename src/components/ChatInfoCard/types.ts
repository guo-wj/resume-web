export type ChatInfoFieldIcon = "user" | "phone" | "target" | "education"

export interface ChatInfoField {
  key: string
  label: string
  value: string
  icon: ChatInfoFieldIcon
}

export interface ChatInfoCardData {
  /** 主标题（SSE title） */
  title: string
  /** 副标题（SSE title_2） */
  subtitle?: string
  fields: ChatInfoField[]
  /** 有值才展示：已写入履历库提示；开关关闭时后端不返回 */
  hint?: string
  fileId?: string
  /** PUT /conversations/{session_id}/cards/{card_id} */
  cardId?: string | number
  /** 接口字段，卡片 UI 暂不展示，保存时原样带回 */
  email?: string
  /** @deprecated 底部按钮固定为「编辑 / 确定」 */
  secondaryAction?: { label: string }
  /** @deprecated 底部按钮固定为「编辑 / 确定」 */
  primaryAction?: { label: string }
}

/** SSE `info_card` 事件 data.basic / basic_info */
export interface ChatInfoBasicInfo {
  name?: string
  phone?: string
  email?: string
  education?: string
  target_role?: string
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
  /** 固定文案，直接展示 */
  title?: string
  /** 固定文案，直接展示 */
  title_2?: string
  /** 有则展示（已写入履历库）；无则不展示 */
  hint?: string
  file_id?: string
  /** 事件顶层或 data 内均可 */
  card_id?: string | number
  basic?: ChatInfoBasicInfo
  /** 文档别名，与 basic 同义 */
  basic_info?: ChatInfoBasicInfo
  star?: ChatInfoStarItem[]
  primary_btn?: string
  secondary_btn?: string
  [key: string]: unknown
}
