import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ActionCard } from "./components/ActionCard"
import { InsightSectionCard } from "./components/InsightSectionCard"
import { ReviewPanel } from "./components/ReviewPanel"
import { SurpriseHeader } from "./components/SurpriseHeader"
import { exportSurprisePagePng } from "./exportPagePng"
import { SURPRISE_MOCK } from "./mock"
import type { SurprisePageData } from "./types"
import "./index.scss"

/**
 * 惊喜页 · 简历优化结果
 *
 * 适配：四周 padding 固定 40px；内容区用项目 rem（按剩余宽/1840）。
 * 禁止 transform:scale；无 100vh 锁高，超出自然滚动。
 */
export function SurpriseApp({ data = SURPRISE_MOCK }: { data?: SurprisePageData }) {
  const navigate = useNavigate()
  const bodyRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    const target = bodyRef.current
    if (!target || exporting) return
    setExporting(true)
    try {
      await exportSurprisePagePng(target)
    } catch (err) {
      console.error(err)
      window.alert("导出失败，请稍后重试")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="surprise-page">
      <div className="surprise-page__bg" aria-hidden />
      <div className="surprise-page__inner">
        <SurpriseHeader
          title={data.header.title}
          subtitle={data.header.subtitle}
          statusBadge={data.header.statusBadge}
          ctaLabel={data.header.ctaLabel}
          onCta={() => navigate("/")}
          onExport={handleExport}
          exporting={exporting}
        />

        <div className="surprise-page__body" ref={bodyRef}>
          <aside className="surprise-page__left">
            {data.actionCards.map((card) => (
              <ActionCard key={card.id} card={card} />
            ))}
          </aside>

          <main className="surprise-page__center">
            <img
              className="surprise-page__resume"
              src={data.resumeImage}
              alt="生成的简历预览"
            />
          </main>

          <aside className="surprise-page__right">
            <ReviewPanel data={data.review} />
            <div className="surprise-page__insights">
              {data.insights.map((section) => (
                <InsightSectionCard key={section.id} section={section} />
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
