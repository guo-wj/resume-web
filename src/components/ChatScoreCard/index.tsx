import headIcon from "@/assets/chat/score-book.svg"
import checkIcon from "@/assets/chat/score-check.svg"
import type { ChatScoreCardData, ChatScoreTier } from "./types"
import { getChatScoreTier } from "./types"
import "./index.scss"

export type { ChatScoreCardData, ChatScoreSuggestion, ChatScoreTier } from "./types"
export { getChatScoreTier } from "./types"
export {
  CHAT_SCORE_CARD_MOCK,
  CHAT_SCORE_CARD_MOCK_MID,
  CHAT_SCORE_CARD_MOCK_LOW,
} from "./mock"

export interface ChatScoreCardProps {
  data?: ChatScoreCardData
  className?: string
}

const RING = {
  size: 76,
  stroke: 5,
  glowExtra: 4,
}

export function ChatScoreCard({ data, className }: ChatScoreCardProps) {
  if (!data) return null
  const maxScore = data.maxScore > 0 ? data.maxScore : 100
  const score = Math.max(0, Math.min(data.score, maxScore))
  const tier = getChatScoreTier(score)
  const suggestions = data.suggestions || []

  return (
    <div className={`chat-score-card${className ? ` ${className}` : ""}`}>
      <div className="chat-score-card__head">
        <span className="chat-score-card__head-icon">
          <img src={headIcon} alt="" width={18} height={18} />
        </span>
        <div className="chat-score-card__head-text">
          <div className="chat-score-card__title">{data.title}</div>
          {data.subtitle ? <div className="chat-score-card__sub">{data.subtitle}</div> : null}
        </div>
      </div>

      <div className="chat-score-card__body">
        <ScoreRing score={score} maxScore={maxScore} tier={tier} />
        {suggestions.length > 0 ? (
          <ol className="chat-score-card__tips">
            {suggestions.map((item, i) => (
              <li key={item.id} className="chat-score-card__tip">
                <span className="chat-score-card__tip-index">{i + 1}</span>
                <p className="chat-score-card__tip-text">{item.text}</p>
              </li>
            ))}
          </ol>
        ) : null}
      </div>

      {data.footer ? (
        <div className="chat-score-card__foot">
          <span className="chat-score-card__foot-icon">
            <img src={checkIcon} alt="" width={13} height={13} />
          </span>
          <span className="chat-score-card__foot-text">{data.footer}</span>
        </div>
      ) : null}
    </div>
  )
}

function ScoreRing({
  score,
  maxScore,
  tier,
}: {
  score: number
  maxScore: number
  tier: ChatScoreTier
}) {
  const size = RING.size
  const stroke = RING.stroke
  const r = (size - stroke) / 2 - 2
  const c = 2 * Math.PI * r
  const ratio = maxScore > 0 ? score / maxScore : 0
  const offset = c * (1 - Math.min(1, Math.max(0, ratio)))
  const glowSize = size + RING.glowExtra

  return (
    <div className={`chat-score-card__ring is-${tier}`}>
      <div className="chat-score-card__ring-visual" style={{ width: glowSize, height: glowSize }}>
        <svg
          className="chat-score-card__ring-glow"
          width={glowSize}
          height={glowSize}
          viewBox={`0 0 ${glowSize} ${glowSize}`}
          aria-hidden
        >
          <circle
            cx={glowSize / 2}
            cy={glowSize / 2}
            r={(glowSize - 6) / 2}
            fill="none"
            strokeWidth="6"
            className="chat-score-card__ring-glow-stroke"
          />
        </svg>
        <svg
          className="chat-score-card__ring-svg"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            className="chat-score-card__ring-track"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            className="chat-score-card__ring-progress"
            strokeDasharray={c}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="chat-score-card__ring-score">{score}</div>
      </div>
      <div className="chat-score-card__ring-label">满分 {maxScore}</div>
    </div>
  )
}
