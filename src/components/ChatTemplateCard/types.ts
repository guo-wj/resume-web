export interface ChatTemplateOption {
  id: string
  title: string
  /** 预览顶部色块 */
  primary: string
  /** 预览标题行色 */
  accent: string
  /** 预览正文行色 */
  muted: string
  /** 底部配色小色块 */
  palette: string[]
}

export interface ChatTemplateCardData {
  title: string
  subtitle?: string
  templates: ChatTemplateOption[]
  defaultSelectedId?: string
}
