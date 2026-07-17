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

const TONE_BORDER: Partial<Record<Tone, string>> = {
  coral: "rgba(255, 95, 64, 0.35)",
  teal: "rgba(28, 93, 95, 0.35)",
  purple: "rgba(135, 104, 226, 0.35)",
}

interface InsightSectionCardProps {
  section: InsightSection
}

/** 洞察卡 — Figma 潜藏优势/市场认可/差异化信息：504×142 */
export function InsightSectionCard({ section }: InsightSectionCardProps) {
  const color = TONE_COLOR[section.tone]
  const icon = TONE_ICON[section.tone]
  const border = TONE_BORDER[section.tone] ?? "rgba(0,0,0,0.08)"

  return (
    <section className="sp-insight" style={{ borderColor: border }}>
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
