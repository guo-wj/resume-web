export interface ChatMiniResumeExperience {
  experienceId?: number | null
  title: string
  highlight: string
}

export interface ChatMiniResumeAction {
  label: string
  endpoint?: string
  payload?: Record<string, unknown>
}

export interface ChatMiniResumeCardData {
  cardId: string
  name: string
  targetJob: string
  experiences: ChatMiniResumeExperience[]
  action: ChatMiniResumeAction
}

/** SSE `mini_resume_card` 事件 data */
export interface ChatMiniResumeCardPayload {
  card_id?: string
  name?: string
  target_job?: string
  experiences?: Array<{
    experience_id?: number | null
    title?: string
    highlight?: string
    [key: string]: unknown
  }>
  action?: {
    label?: string
    endpoint?: string
    payload?: Record<string, unknown>
    [key: string]: unknown
  }
  [key: string]: unknown
}
