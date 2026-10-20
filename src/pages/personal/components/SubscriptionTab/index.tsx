import type { SubscriptionTabProps } from "../../types"
import "./index.scss"

export function SubscriptionTab({
  subscriptionLoading,
  usageLoading,
  planName,
  planStatusLabel,
  planRenewText,
  usedTotal,
  usageFeatures,
  remaining,
  detailRows,
  onOpenPricing,
}: SubscriptionTabProps) {
  const featureSum = usageFeatures.reduce((sum, [, v]) => sum + v, 0)
  const barTotal = featureSum || usedTotal || 1

  return (
    <div className="subscriptionTab-root">
      <header className="subscriptionTab-header">
        <h1 className="subscriptionTab-pageTitle">订阅</h1>
        <p className="subscriptionTab-pageDesc">查看你的订阅状态、积分构成与消耗明细</p>
      </header>

      <div className="subscriptionTab-sections">
        <section className="subscriptionTab-card">
          <div className="subscriptionTab-cardHeader">
            <h2 className="subscriptionTab-cardTitle">我的方案</h2>
            <p className="subscriptionTab-cardDesc">当前订阅与会员权益</p>
          </div>
          <div className="subscriptionTab-planWrap">
            <div className="subscriptionTab-planCard">
              <div className="subscriptionTab-planGlowA" aria-hidden />
              <div className="subscriptionTab-planGlowB" aria-hidden />
              <div className="subscriptionTab-planTop">
                <div className="subscriptionTab-planMeta">
                  <div className="subscriptionTab-planNameRow">
                    <span className="subscriptionTab-planSpark" aria-hidden>✦</span>
                    <span className="subscriptionTab-planName">
                      {subscriptionLoading ? "加载中…" : planName}
                    </span>
                  </div>
                  <div className="subscriptionTab-planRenew">
                    {subscriptionLoading ? "正在同步订阅状态" : planRenewText}
                  </div>
                </div>
                {!subscriptionLoading && planStatusLabel ? (
                  <span className="subscriptionTab-planBadge">{planStatusLabel}</span>
                ) : null}
              </div>
              <div className="subscriptionTab-planBottom">
                <div className="subscriptionTab-remain">
                  <div className="subscriptionTab-remainLabel">剩余积分</div>
                  <div className="subscriptionTab-remainValue">
                    {usageLoading ? "—" : remaining.toLocaleString()}
                  </div>
                </div>
                <button type="button" onClick={onOpenPricing} className="pc-upbtn subscriptionTab-upgradeBtn">
                  升级方案
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="subscriptionTab-card">
          <div className="subscriptionTab-cardHeader">
            <h2 className="subscriptionTab-cardTitle">用量</h2>
            <p className="subscriptionTab-cardDesc">各功能积分消耗统计</p>
          </div>
          <div className="subscriptionTab-usageBody">
            {usageLoading ? (
              <div className="subscriptionTab-loading">加载用量中…</div>
            ) : (
              <>
                <div className="subscriptionTab-usageChart">
                  <div className="subscriptionTab-usageBar">
                    {usageFeatures.map(([name, v, col]) => (
                      <div
                        key={name}
                        title={name}
                        className="subscriptionTab-usageBarSegment"
                        style={{
                          width: `${(v / barTotal) * 100}%`,
                          background: col,
                        }}
                      />
                    ))}
                  </div>
                  <div className="subscriptionTab-usagePercents">
                    {usageFeatures.map(([name, v]) => {
                      const pct = Math.round((v / barTotal) * 100)
                      return (
                        <div
                          key={name}
                          className="subscriptionTab-usagePercent"
                          style={{ width: `${(v / barTotal) * 100}%` }}
                        >
                          {pct >= 8 ? `${pct}%` : ""}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="subscriptionTab-legendGrid">
                  {usageFeatures.map(([name, v, col]) => (
                    <div key={name} className="subscriptionTab-legendItem">
                      <span className="subscriptionTab-legendDot" style={{ background: col }} />
                      <span className="subscriptionTab-legendName">{name}</span>
                      <span className="subscriptionTab-legendValue">{v.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="subscriptionTab-usageFooter">
                  <span className="subscriptionTab-usageFooterLabel">本周期总消耗</span>
                  <span className="subscriptionTab-usageFooterValue">
                    {usedTotal.toLocaleString()} 积分
                  </span>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="subscriptionTab-card">
          <div className="subscriptionTab-cardHeader">
            <h2 className="subscriptionTab-cardTitle">明细</h2>
            <p className="subscriptionTab-cardDesc">积分获得与消耗流水</p>
          </div>
          <div className="subscriptionTab-detailTable">
            <div className="subscriptionTab-detailHead">
              <div className="subscriptionTab-detailColName">功能明细</div>
              <div className="subscriptionTab-detailColStatus">获得状态</div>
              <div className="subscriptionTab-detailColAmount">积分变化</div>
              <div className="subscriptionTab-detailColDate">日期</div>
            </div>
            {usageLoading ? (
              <div className="subscriptionTab-detailLoading">加载明细中…</div>
            ) : detailRows.length === 0 ? (
              <div className="subscriptionTab-detailLoading">暂无积分明细</div>
            ) : detailRows.map((d, i) => {
              const got = d.amount > 0
              return (
                <div
                  key={`${d.name}-${d.date}-${i}`}
                  className={`pc-row subscriptionTab-detailRow ${i === detailRows.length - 1 ? "subscriptionTab-detailRowLast" : ""}`}
                >
                  <div className="subscriptionTab-detailName">{d.name}</div>
                  <div className="subscriptionTab-detailStatus">
                    <span className={`subscriptionTab-statusBadge ${got ? "subscriptionTab-statusGot" : "subscriptionTab-statusUsed"}`}>
                      {got ? "获得" : "消耗"}
                    </span>
                  </div>
                  <div className="subscriptionTab-detailAmount">
                    {got ? `+${d.amount.toLocaleString()}` : d.amount.toLocaleString()}
                  </div>
                  <div className="subscriptionTab-detailDate">{d.date}</div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
