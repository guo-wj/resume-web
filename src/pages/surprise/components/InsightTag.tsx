import type { Tone } from "../types"

const TONE_STYLE: Record<Tone, { color: string; background: string }> = {
  coral: { color: "#ff5f40", background: "rgba(255, 95, 64, 0.1)" },
  teal: { color: "#1c5d5f", background: "rgba(28, 93, 95, 0.1)" },
  purple: { color: "#8768e2", background: "rgba(135, 104, 226, 0.1)" },
  gold: { color: "#e8a200", background: "rgba(232, 162, 0, 0.1)" },
}

interface InsightTagProps {
  label: string
  tone: Tone
}

/** 标签 — Figma Border：112×28、圆角 100、左灰块+文字 */
export function InsightTag({ label, tone }: InsightTagProps) {
  return (
    <span className="sp-tag" style={TONE_STYLE[tone]}>
      <span className="sp-tag__dot" aria-hidden />
      <span className="sp-tag__label">{label}</span>
    </span>
  )
}
