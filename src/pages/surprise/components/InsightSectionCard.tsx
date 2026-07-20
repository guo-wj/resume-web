import type { InsightSection, Tone } from "../types"
import { InsightTag } from "./InsightTag"

const TONE_COLOR: Record<Tone, string> = {
  coral: "#ff5f40",
  teal: "#1c5d5f",
  purple: "#8768e2",
  gold: "#e8a200",
}

const TONE_ICON: Partial<Record<Tone, string>> = {
  coral: "/surprise/assets/img26.svg",
  teal: "/surprise/assets/img29.svg",
  purple: "/surprise/assets/img30.svg",
}

/** 边框色与卡片主题一致 */
const FRAME_COLOR: Record<Tone, string> = {
  coral: "#ff5f40",
  teal: "#1c5d5f",
  purple: "#8768e2",
  gold: "#e8a200",
}

interface InsightSectionCardProps {
  section: InsightSection
}

/** 洞察卡 — card2.svg 手绘边框 · 504×142 */
export function InsightSectionCard({ section }: InsightSectionCardProps) {
  const color = TONE_COLOR[section.tone]
  const icon = TONE_ICON[section.tone]
  const frameColor = FRAME_COLOR[section.tone] ?? "rgba(0,0,0,0.35)"

  return (
    <section className="sp-insight">
      <span
        className="sp-insight__frame"
        style={{ backgroundColor: frameColor }}
        aria-hidden
      />

      <header className="sp-insight__head">
        <h3 className="sp-insight__title" style={{ color }}>
          {section.title}
        </h3>
        {icon ? (
          <img className="sp-insight__icon" src={icon} alt="" width={16} height={16} />
        ) : null}
      </header>

      <div className="sp-insight__tags">
        {section.tags.map((tag) => (
          <InsightTag key={tag.id} label={tag.label} tone={tag.tone} />
        ))}
      </div>

      <p className="sp-insight__body">{section.content}</p>
    </section>
  )
}
