import { Legend, SectionTitle } from "../Ui"
import type { SubscriptionTabProps } from "../../types"
import './index.scss'

export function SubscriptionTab({
  subscriptionLoading,
  usageLoading,
  planName,
  planStatusLabel,
  planRenewText,
  usedTotal,
  grandTotal,
  usageFeatures,
  remaining,
  detailRows,
  onOpenPricing,
}: SubscriptionTabProps) {
  return (
    <div className="subscriptionTab-root">
      <h1 className="subscriptionTab-pageTitle">订阅</h1>
      <p className="subscriptionTab-pageDesc">查看你的订阅状态、积分构成与消耗明细。</p>

      <SectionTitle mt={38}>我的方案</SectionTitle>
      <div className="subscriptionTab-planCard">
        <div className="subscriptionTab-planGlow" />
        <div className="subscriptionTab-planContent">
          <div className="subscriptionTab-planHeader">
            <span className="subscriptionTab-planName">{subscriptionLoading ? "加载中…" : planName}</span>
            {!subscriptionLoading && planStatusLabel && (
              <span className="subscriptionTab-planBadge">{planStatusLabel}</span>
            )}
          </div>
          <div className="subscriptionTab-planRenew">
            {subscriptionLoading ? "正在同步订阅状态" : planRenewText}
          </div>
        </div>
        <button type="button" onClick={onOpenPricing} className={`pc-upbtn subscriptionTab-upgradeBtn`}>升级</button>
      </div>

      <SectionTitle>用量</SectionTitle>
      <div className="subscriptionTab-usageCard">
        <div className="subscriptionTab-usageHeader">
          <span className="subscriptionTab-usageLabel">总积分已消耗</span>
          <div className="subscriptionTab-usageTotal">
            {usageLoading ? "加载中…" : (
              <>
                <b className="subscriptionTab-usageTotalBold">{usedTotal.toLocaleString()}</b>
                {" / "}
                {grandTotal.toLocaleString()} 积分
              </>
            )}
          </div>
        </div>
        {!usageLoading && (
          <>
            <div className="subscriptionTab-usageBar">
              {usageFeatures.map(([name, v, col]) => (
                <div
                  key={name}
                  title={name}
                  className="subscriptionTab-usageBarSegment"
                  style={{
                    width: `${grandTotal ? (v / grandTotal) * 100 : 0}%`,
                    background: col,
                  }}
                />
              ))}
              {remaining > 0 && (
                <div
                  className="subscriptionTab-usageBarRemainder"
                  style={{ width: `${grandTotal ? (remaining / grandTotal) * 100 : 0}%` }}
                />
              )}
            </div>
            <div className="subscriptionTab-legendGrid">
              {usageFeatures.map(([name, v, col]) => (
                <Legend key={name} color={col} name={name} value={`${v} 积分`} />
              ))}
              <Legend color="#E0DAF0" name="剩余可用" value={`${remaining.toLocaleString()} 积分`} />
            </div>
          </>
        )}
      </div>

      <SectionTitle>明细</SectionTitle>
      <div className="subscriptionTab-detailCard">
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
              key={i}
              className={`pc-row subscriptionTab-detailRow ${i === detailRows.length - 1 ? "subscriptionTab-detailRowLast" : ""}`}
            >
              <div className="subscriptionTab-detailName">{d.name}</div>
              <div className="subscriptionTab-detailStatus">
                <span className={`subscriptionTab-statusBadge ${got ? "subscriptionTab-statusGot" : "subscriptionTab-statusUsed"}`}>
                  {got ? "已获取" : "已消耗"}
                </span>
              </div>
              <div className="subscriptionTab-detailAmount">{got ? "+" : ""}{d.amount}</div>
              <div className="subscriptionTab-detailDate">{d.date}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
