export interface ChatColorOption {
  id: string
  color: string
  label?: string
}

export interface ChatColorCardData {
  title: string
  subtitle?: string
  colors: ChatColorOption[]
  /** 默认选中色，可被受控 selectedId 覆盖 */
  defaultSelectedId?: string
}
