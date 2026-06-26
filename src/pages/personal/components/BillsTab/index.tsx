import type { BillsTabProps } from "../../types"
import './index.scss'

export function BillsTab({
  bills,
  billsLoading,
  onOpenInvoice,
  onViewInvoice,
  onDownloadInvoice,
}: BillsTabProps) {
  return (
    <div className="billsTab-root">
      <h1 className="billsTab-pageTitle">账单</h1>
      <p className="billsTab-pageDesc">查看历史付款记录并申请开具发票。</p>
      <div className="billsTab-table">
        <div className="billsTab-tableHead">
          <div className="billsTab-colDate">日期</div>
          <div className="billsTab-colCategory">类别</div>
          <div className="billsTab-colAmount">金额</div>
          <div className="billsTab-colStatus">状态</div>
          <div className="billsTab-colInvoice">发票</div>
        </div>
        {billsLoading ? (
          <div className="billsTab-loading">加载账单中…</div>
        ) : bills.map((b, i) => {
          let action = "开票"
          let onClick: () => void = onOpenInvoice
          let linkActive = true
          if (b.inv === "view") { action = "查看"; onClick = onViewInvoice }
          else if (b.inv === "download") { action = "下载"; onClick = onDownloadInvoice }
          else if (b.inv === "none") { action = "—"; onClick = () => {}; linkActive = false }
          return (
            <div
              key={"id" in b ? b.id : i}
              className={`pc-row billsTab-row ${i === bills.length - 1 ? "billsTab-rowLast" : ""}`}
            >
              <div className="billsTab-cellDate">{b.date}</div>
              <div className="billsTab-cellCategory">{b.category}</div>
              <div className="billsTab-cellAmount">{b.amount}</div>
              <div className="billsTab-cellStatus">
                <span className="billsTab-statusBadge">{b.status}</span>
              </div>
              <div className="billsTab-cellInvoice">
                <button
                  type="button"
                  onClick={onClick}
                  className={`pc-hover billsTab-invoiceBtn ${linkActive ? "billsTab-invoiceBtnActive" : "billsTab-invoiceBtnDisabled"}`}
                >
                  {action}
                </button>
              </div>
            </div>
          )
        })}
      </div>
      {!billsLoading && bills.length === 0 && (
        <div className="billsTab-footerHint">暂无账单记录</div>
      )}
      {!billsLoading && bills.length > 0 && (
        <div className="billsTab-footerHint">暂无更多数据</div>
      )}
    </div>
  )
}
