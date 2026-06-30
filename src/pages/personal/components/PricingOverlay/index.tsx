import { FAQ_DATA } from "@/constant"
import type { PricingOverlayProps } from "../../types"
import './index.scss'

export function PricingOverlay({
  onClose,
  hideClose = false,
  cycle,
  setCycle,
  plansLoading,
  plans,
  faqOpen,
  setFaqOpen,
  onOpenAddon,
  onOpenCancel,
}: PricingOverlayProps) {
  return (
    <div className={`pc-scroll pricingOverlay-overlay`}>
      {!hideClose && (
        <button type="button" onClick={onClose} className={`pc-chip pricingOverlay-closeBtn`} aria-label="关闭">✕</button>
      )}
      <div className="pricingOverlay-inner">
        <div className="pricingOverlay-hero">
          <h2 className="pricingOverlay-heroTitle">解锁 Magic Resume 全部能力</h2>
          <p className="pricingOverlay-heroDesc">升级解锁更多积分、模拟面试与职业方向洞察。</p>
        </div>
        <div className="pricingOverlay-cycleWrap">
          <div className="pricingOverlay-cycleToggle">
            {([["month", "月付"], ["year", "年付"]] as const).map(([id, label]) => {
              const on = cycle === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCycle(id)}
                  className={`pricingOverlay-cycleBtn ${on ? "pricingOverlay-cycleBtnOn" : "pricingOverlay-cycleBtnOff"}`}
                >
                  {label}
                  {id === "year" && <span className="pricingOverlay-saveBadge">省 20%</span>}
                </button>
              )
            })}
          </div>
        </div>

        <div className="pricingOverlay-plansGrid">
          {plansLoading ? (
            <div className="pricingOverlay-plansLoading">加载套餐中…</div>
          ) : plans.length === 0 ? (
            <div className="pricingOverlay-plansLoading">暂无可用套餐</div>
          ) : plans.map((p) => (
            <div
              key={p.name}
              className={`pricingOverlay-planCard ${p.hl ? "pricingOverlay-planCardHighlight" : ""}`}
            >
              {p.recommend && <div className="pricingOverlay-recommendBadge">最受欢迎</div>}
              <div className="pricingOverlay-planName">{p.name}</div>
              <div className="pricingOverlay-planPriceRow">
                <span className="pricingOverlay-planPrice">{p.price}</span>
                <span className="pricingOverlay-planUnit">{p.unit}</span>
              </div>
              <div className="pricingOverlay-planSave" style={{ color: p.saveColor }}>{p.save}</div>
              <button
                type="button"
                onClick={p.onClick}
                className={`${p.btnKind === "up" ? "pc-primary" : ""} pricingOverlay-planBtn ${
                  p.btnKind === "up" ? "pricingOverlay-planBtnUp"
                    : p.btnKind === "current" ? "pricingOverlay-planBtnCurrent"
                      : "pricingOverlay-planBtnDisabled"
                }`}
              >
                {p.btnLabel}
              </button>
              <div className="pricingOverlay-dailyCredits">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#6D5DF6"><path d="M13 2L4 14h6l-1 8 9-12h-6z" /></svg>
                <span className="pricingOverlay-dailyCreditsText">每日 {p.daily} 积分</span>
              </div>
              <div className="pricingOverlay-features">
                {p.features.map((f) => (
                  <div key={f} className="pricingOverlay-feature">
                    <span className="pricingOverlay-featureCheck">✓</span>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pricingOverlay-faqSection">
          <h3 className="pricingOverlay-faqTitle">常见问题</h3>
          <p className="pricingOverlay-faqDesc">关于订阅、续费、退款与积分消耗</p>
          <div className="pricingOverlay-faqList">
            {FAQ_DATA.map((f, i) => {
              const isOpen = faqOpen === i
              return (
                <div key={i} className="pricingOverlay-faqItem">
                  <button type="button" onClick={() => setFaqOpen(isOpen ? -1 : i)} className={`pc-hover pricingOverlay-faqQuestion`}>
                    <span className="pricingOverlay-faqQuestionText">{f.q}</span>
                    <span className={`pricingOverlay-faqChevron ${isOpen ? "pricingOverlay-faqChevronOpen" : ""}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="#9890AE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </span>
                  </button>
                  {isOpen && (
                    <div className="pricingOverlay-faqAnswer">
                      {f.paras.map((pa, j) => (
                        <div key={j} className="pricingOverlay-faqPara">
                          {pa.label && <span className="pricingOverlay-faqParaLabel">{pa.label}</span>}
                          {pa.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="pricingOverlay-footer">
          <button type="button" onClick={onOpenAddon} className={`pc-hover pricingOverlay-footerLink`}>购买积分加量包</button>
          <span className="pricingOverlay-footerDivider" />
          <button type="button" className={`pc-hover pricingOverlay-footerLinkMuted`}>条款与条件</button>
          <span className="pricingOverlay-footerDivider" />
          <button type="button" onClick={onOpenCancel} className={`pc-hover pricingOverlay-footerLinkMuted pricingOverlay-cancelLink`}>取消订阅 →</button>
        </div>
      </div>
    </div>
  )
}
