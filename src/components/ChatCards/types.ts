/** 对话气泡卡片类型，后续可扩展选择题、附件预览、简历预览等 */
export type ChatCardType = "text"

export interface ChatTextCardProps {
  content: string
  /** @deprecated 保留兼容，文本卡片不再展示流式光标 */
  streaming?: boolean
  className?: string
}
