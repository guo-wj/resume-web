import { StatusBadge } from "./StatusBadge"

interface SurpriseHeaderProps {
  title: string
  subtitle: string
  statusBadge: string
  ctaLabel: string
  onCta: () => void
}

/** 顶栏 — Figma Group 6：头像与首行标题垂直居中 / 右侧 CTA + 手绘装饰线 */
export function SurpriseHeader({
  title,
  subtitle,
  statusBadge,
  ctaLabel,
  onCta,
}: SurpriseHeaderProps) {
  return (
    <header className="sp-header">
      <div className="sp-header__brand">
        {/* 头像只与首行（标题+徽章）垂直居中 */}
        <div className="sp-header__lead">
          <span className="sp-header__avatar" aria-hidden />
          <div className="sp-header__title-row">
            <h1 className="sp-header__title">{title}</h1>
            <StatusBadge label={statusBadge} />
          </div>
        </div>
        <p className="sp-header__subtitle">{subtitle}</p>
      </div>

      <div className="sp-header__cta-wrap">
        {/* Figma Vector 3/4/5 — 按钮右上角手绘强调线 */}
        <span className="sp-header__cta-sparks" aria-hidden>
          <img
            className="sp-header__cta-spark sp-header__cta-spark--1"
            src="/surprise/assets/cta-spark-1.svg"
            alt=""
            width={5}
            height={10}
          />
          <img
            className="sp-header__cta-spark sp-header__cta-spark--2"
            src="/surprise/assets/cta-spark-2.svg"
            alt=""
            width={9}
            height={9}
          />
          <img
            className="sp-header__cta-spark sp-header__cta-spark--3"
            src="/surprise/assets/cta-spark-3.svg"
            alt=""
            width={12}
            height={4}
          />
        </span>

        <button type="button" className="sp-header__cta" onClick={onCta}>
          <span>{ctaLabel}</span>
          {/* 设计稿箭头本体 12×11，置于 18×18 热区内，勿拉伸 */}
          <span className="sp-header__cta-arrow">
            <img src="/surprise/assets/img12.svg" alt="" width={12} height={11} />
          </span>
        </button>
      </div>
    </header>
  )
}
