export type ChatScoreTier = "high" | "mid" | "low"

export interface ChatScoreSuggestion {
  id: string
  text: string
}

export interface ChatScoreCardData {
  title: string
  subtitle?: string
  score: number
  maxScore: number
  suggestions: ChatScoreSuggestion[]
  footer?: string
}

export function getChatScoreTier(score: number): ChatScoreTier {
  if (score >= 80) return "high"
  if (score >= 60) return "mid"
  return "low"
}
