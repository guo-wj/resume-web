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

interface ActionCardProps {
  card: ActionCardData
}

/** 左侧行动卡 — Figma Group 11/12/14：481×199、3px 边框、色染白底 */
export function ActionCard({ card }: ActionCardProps) {
  const connector = CONNECTOR[card.tone]

  return (
    <article className={`sp-action sp-action--${card.tone}`}>
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
