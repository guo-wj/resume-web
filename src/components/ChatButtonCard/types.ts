export interface ChatButtonItem {
  text: string
}

export interface ChatButtonCardData {
  cardId?: string | number
  buttons: ChatButtonItem[]
}

/** SSE `button_card` 事件 data */
export interface ChatButtonCardPayload {
  card_id?: string | number
  buttons?: Array<{
    text?: string
    [key: string]: unknown
  }>
  [key: string]: unknown
}
