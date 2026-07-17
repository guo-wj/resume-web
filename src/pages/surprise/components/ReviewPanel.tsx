import type { ReviewPanelData } from "../types"

interface ReviewPanelProps {
  data: ReviewPanelData
}

/** 词条档位：上→下 sm / md / lg(active) / md / sm，尺寸全走 SCSS r() */
const KEYWORD_TIER = ["sm", "md", "lg", "md", "sm"] as const

/** 主观点评 — Figma「评价」504×436 */
export function ReviewPanel({ data }: ReviewPanelProps) {
  return (
    <section className="sp-review">
      <div className="sp-review__head">
        <div className="sp-review__badge">
          <img
            className="sp-review__badge-icon"
            src="/surprise/assets/img13.svg"
            alt=""
          />
          <span>{data.badge}</span>
        </div>
        <h3 className="sp-review__title">{data.title}</h3>
      </div>

      <p className="sp-review__highlight">{data.highlight}</p>

      <div className="sp-review__chart">
        <div className="sp-radar" aria-hidden>
          {data.axes.map((axis, i) => (
            <span key={axis} className={`sp-radar__axis sp-radar__axis--${i}`}>
              {axis}
            </span>
          ))}

          <div className="sp-radar__graphic">
            <img
              className="sp-radar__polygon"
              src="/surprise/assets/radar-polygon.svg"
              alt=""
            />
            <img
              className="sp-radar__lines"
              src="/surprise/assets/radar-lines.svg"
              alt=""
            />
            <img
              className="sp-radar__shape"
              src="/surprise/assets/radar-shape.svg"
              alt=""
            />
            <img
              className="sp-radar__dots"
              src="/surprise/assets/radar-dots.svg"
              alt=""
            />
          </div>

          <div className="sp-radar__hover">
            <img
              className="sp-radar__dot"
              src="/surprise/assets/radar-dot.svg"
              alt=""
            />
            <span className="sp-radar__bubble">{data.delta}</span>
          </div>
        </div>

        <ul className="sp-review__keywords">
          {data.keywords.map((word, i) => {
            const tier = KEYWORD_TIER[i] ?? "md"
            return (
              <li
                key={`${word}-${i}`}
                className={`sp-keyword sp-keyword--${tier}${tier === "lg" ? " sp-keyword--active" : ""}`}
              >
                {word}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
