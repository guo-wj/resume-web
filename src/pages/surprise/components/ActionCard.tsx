import type { ActionCard as ActionCardData, Tone } from "../types"

const CTA_ARROW: Partial<Record<Tone, string>> = {
  coral: "/surprise/assets/img09.svg",
  gold: "/surprise/assets/img10.svg",
  purple: "/surprise/assets/img11.svg",
}

/** 卡片 → 简历 手绘指示箭头（曲线 + 箭头尖）；尺寸由 SCSS r() 控制 */
const CONNECTOR: Partial<Record<Tone, { curve: string; tip: string }>> = {
  coral: {
    curve: "/surprise/assets/img03.svg",
    tip: "/surprise/assets/img04.svg",
  },
  gold: {
    curve: "/surprise/assets/img05.svg",
    tip: "/surprise/assets/img06.svg",
  },
  purple: {
    curve: "/surprise/assets/img07.svg",
    tip: "/surprise/assets/img08.svg",
  },
}

/** 边框色与卡片主题一致 */
const FRAME_COLOR: Record<Tone, string> = {
  coral: "#ff6b6b",
  gold: "#e8a200",
  purple: "#a78bfa",
  teal: "#1c5d5f",
}

interface ActionCardProps {
  card: ActionCardData
}

/** 左侧行动卡 — card1.svg 手绘边框 · 481×199 */
export function ActionCard({ card }: ActionCardProps) {
  const connector = CONNECTOR[card.tone]
  const frameColor = FRAME_COLOR[card.tone] ?? FRAME_COLOR.coral

  return (
    <article className={`sp-action sp-action--${card.tone}`}>
      <span
        className="sp-action__frame"
        style={{ backgroundColor: frameColor }}
        aria-hidden
      />

      <div className="sp-action__body">
        <h3 className="sp-action__title">{card.title}</h3>
        <p className="sp-action__desc">{card.description}</p>
        <button type="button" className="sp-action__cta">
          <span className="sp-action__cta-label">{card.ctaLabel}</span>
          <span className="sp-action__cta-arrow-wrap">
            <img
              className="sp-action__cta-arrow"
              src={CTA_ARROW[card.tone] ?? CTA_ARROW.coral}
              alt=""
            />
          </span>
        </button>
      </div>

      {connector ? (
        <div className="sp-action__connector" aria-hidden>
          <img
            className="sp-action__connector-curve"
            src={connector.curve}
            alt=""
          />
          <img
            className="sp-action__connector-tip"
            src={connector.tip}
            alt=""
          />
        </div>
      ) : null}
    </article>
  )
}
