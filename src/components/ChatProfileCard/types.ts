export type ChatProfileFieldIcon = "user" | "phone" | "target"

export interface ChatProfileField {
  key: string
  label: string
  value: string
  icon: ChatProfileFieldIcon
}

export interface ChatProfileCardData {
  title: string
  subtitle?: string
  fields: ChatProfileField[]
}
