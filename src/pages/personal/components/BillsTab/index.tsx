import { useMemo } from "react"
import icoView from "@/assets/personal/ico-view.svg"
import icoDownload from "@/assets/personal/ico-download.svg"
import icoInvoice from "@/assets/personal/ico-invoice.svg"
import type { BillsTabProps } from "../../types"
import "./index.scss"

function parseAmount(amount: string): number {
  const n = Number(String(amount).replace(/[^\d.-]/g, ""))
  return Number.isFinite(n) ? n : 0
}

function formatTotal(sum: number): string {
  return `¥${sum.toFixed(2)}`
}

export function BillsTab({
  bills,
  billsLoading,
  onOpenInvoice,
  onViewInvoice,
  onDownloadInvoice,
}: BillsTabProps) {
  const totalSpend = useMemo(
    () => bills.reduce((sum, b) => sum + parseAmount(b.amount), 0),
    [bills],
  )

  return (
    <div className="billsTab-root">
      <header className="billsTab-header">
        <h1 className="billsTab-pageTitle">账单</h1>
        <p className="billsTab-pageDesc">查看历史付款记录并申请开具发票</p>
      </header>

      <section className="billsTab-card">
        <div className="billsTab-table">
          <div className="billsTab-tableHead">
            <div className="billsTab-colDate">日期</div>
            <div className="billsTab-colCategory">类别</div>
            <div className="billsTab-colStatus">状态</div>
            <div className="billsTab-colAmount">金额</div>
            <div className="billsTab-colInvoice">发票</div>
          </div>

          {billsLoading ? (
            <div className="billsTab-loading">加载账单中…</div>
          ) : bills.length === 0 ? (
            <div className="billsTab-loading">暂无账单记录</div>
          ) : bills.map((b, i) => (
            <div
              key={b.id}
              className={`pc-row billsTab-row ${i === bills.length - 1 ? "billsTab-rowLast" : ""}`}
            >
              <div className="billsTab-cellDate">{b.date}</div>
              <div className="billsTab-cellCategory">{b.category}</div>
              <div className="billsTab-cellStatus">
                <span className="billsTab-statusBadge">{b.status}</span>
              </div>
              <div className="billsTab-cellAmount">{b.amount}</div>
              <div className="billsTab-cellInvoice">
                {b.inv === "none" ? (
                  <span className="billsTab-invoiceNone">—</span>
                ) : b.inv === "invoiceable" ? (
                  <button
                    type="button"
                    onClick={() => onOpenInvoice(b.id)}
                    className="pc-hover billsTab-invoiceApply"
                  >
                    申请开票
                    <img src={icoInvoice} alt="" />
                  </button>
                ) : (
                  <div className="billsTab-invoiceActions">
                    <button
                      type="button"
                      onClick={() => onViewInvoice(b)}
                      className="pc-hover billsTab-invoiceLink"
                    >
                      <img src={icoView} alt="" />
                      查看
                    </button>
                    <button
                      type="button"
                      onClick={() => onDownloadInvoice(b)}
                      className="pc-hover billsTab-invoiceLink"
                    >
                      <img src={icoDownload} alt="" />
                      下载
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {!billsLoading && bills.length > 0 && (
          <div className="billsTab-footer">
            <span className="billsTab-footerCount">共 {bills.length} 笔记录</span>
            <span className="billsTab-footerTotal">
              累计消费 <em>{formatTotal(totalSpend)}</em>
            </span>
          </div>
        )}
      </section>
    </div>
  )
}
