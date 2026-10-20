import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import logoAi from "@/assets/workbench/logo-ai.svg"
import scoreStar from "@/assets/workbench/score-star.svg"
import navResume from "@/assets/workbench/nav-resume.svg"
import navProfile from "@/assets/workbench/nav-profile.svg"
import navInterview from "@/assets/workbench/nav-interview.svg"
import navUser from "@/assets/workbench/nav-user.svg"
import chevronLeft from "@/assets/workbench/chevron-left.svg"
import arrowEdit from "@/assets/workbench/arrow-edit.svg"
import {
  WORKBENCH_DONE,
  WORKBENCH_RESUMES,
  WORKBENCH_TODOS,
  type WorkbenchNavId,
  type WorkbenchResume,
} from "./mock"
import "./index.scss"

const NAV_ITEMS: Array<{ id: WorkbenchNavId; label: string; icon: string }> = [
  { id: "resume", label: "我的简历", icon: navResume },
  { id: "profile", label: "个人履历", icon: navProfile },
  { id: "interview", label: "面试准备", icon: navInterview },
]

function ResumePreview({
  resume,
  onEdit,
}: {
  resume: WorkbenchResume
  onEdit: () => void
}) {
  return (
    <article className="workbench__resume-card">
      <h3 className="workbench__resume-name">{resume.name}</h3>
      <p className="workbench__resume-role">{resume.title}</p>
      <p className="workbench__resume-meta">{resume.meta}</p>
      <p className="workbench__resume-contact">{resume.contact}</p>
      <hr className="workbench__resume-divider" />

      <h4 className="workbench__section-title">个人简介</h4>
      <p className="workbench__section-text">{resume.summary}</p>

      <div className="workbench__section">
        <h4 className="workbench__section-title">工作经历</h4>
        <p className="workbench__job-title">{resume.experience.role}</p>
        <p className="workbench__job-period">{resume.experience.period}</p>
        <ul className="workbench__bullets">
          {resume.experience.bullets.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="workbench__section">
        <h4 className="workbench__section-title">项目经历</h4>
        <p className="workbench__job-title">{resume.project.name}</p>
        <ul className="workbench__bullets">
          {resume.project.bullets.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="workbench__section">
        <h4 className="workbench__section-title">教育背景</h4>
        <p className="workbench__section-text">{resume.education}</p>
      </div>

      <div className="workbench__edit-wrap">
        <button type="button" className="workbench__edit-btn" onClick={onEdit}>
          点击进入修改
          <img src={arrowEdit} alt="" />
        </button>
      </div>
    </article>
  )
}

/**
 * 工作台 · Figma 353:1137
 *
 * 适配：与 surprise 一致，尺寸用项目 rem（r()，按剩余宽/1840）。
 * 禁止 transform:scale；不做断点改布局；超出自然滚动。
 */
export function DashboardApp() {
  const navigate = useNavigate()
  const [nav, setNav] = useState<WorkbenchNavId>("resume")
  const [activeIndex, setActiveIndex] = useState(0)
  const resumes = WORKBENCH_RESUMES
  const active = resumes[activeIndex] || resumes[0]
  const score = active?.score ?? 0
  const canPrev = activeIndex > 0
  const canNext = activeIndex < resumes.length - 1

  const stackCount = useMemo(() => Math.min(2, Math.max(0, resumes.length - 1)), [resumes.length])

  const goPrev = () => {
    if (!canPrev) return
    setActiveIndex((i) => i - 1)
  }
  const goNext = () => {
    if (!canNext) return
    setActiveIndex((i) => i + 1)
  }

  return (
    <div className="workbench">
      <aside className="workbench__sidebar">
        <div className="workbench__brand">
          <img className="workbench__brand-logo" src={logoAi} alt="" />
          <div className="workbench__brand-text">
            <p className="workbench__brand-name">AI Resume</p>
            <p className="workbench__brand-desc">你的智能简历伙伴</p>
          </div>
        </div>

        <nav className="workbench__nav" aria-label="工作台导航">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={"workbench__nav-item" + (nav === item.id ? " is-active" : "")}
              onClick={() => setNav(item.id)}
            >
              <img className="workbench__nav-icon" src={item.icon} alt="" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="workbench__sidebar-foot">
          <button
            type="button"
            className="workbench__nav-item"
            onClick={() => navigate("/personal")}
          >
            <img className="workbench__nav-icon" src={navUser} alt="" />
            <span>个人中心</span>
          </button>
          <button
            type="button"
            className="workbench__new-btn"
            onClick={() => navigate("/")}
          >
            <span className="workbench__new-btn-plus">＋</span>
            <span>新建简历</span>
          </button>
        </div>
      </aside>

      <main className="workbench__main">
        <header className="workbench__header">
          <h1 className="workbench__title">我的工作台</h1>
          <p className="workbench__subtitle">把每一次修改，都变成更好的机会</p>
        </header>

        {nav === "resume" ? (
          <div className="workbench__body">
            <div className="workbench__aside">
              <section className="workbench__card workbench__score-card">
                <img className="workbench__score-star" src={scoreStar} alt="" />
                <h2 className="workbench__card-title">当前简历评分</h2>
                <p className="workbench__score-value">{score}%</p>
                <div className="workbench__score-bar" aria-hidden>
                  <div
                    className="workbench__score-bar-fill"
                    style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                  />
                </div>
                <div className="workbench__score-actions">
                  <button type="button" className="workbench__btn-primary">
                    查看报告
                  </button>
                </div>
              </section>

              <section className="workbench__card">
                <div className="workbench__todo-head">
                  <h2 className="workbench__card-title">待优化事项</h2>
                  <span className="workbench__badge">{WORKBENCH_TODOS.length} 项</span>
                </div>
                <ul className="workbench__todo-list">
                  {WORKBENCH_TODOS.map((item) => (
                    <li key={item.id}>
                      <button type="button" className="workbench__todo-item">
                        <span className="workbench__todo-dot" aria-hidden>
                          ○
                        </span>
                        <span className="workbench__todo-label">{item.title}</span>
                        <span className="workbench__todo-chevron" aria-hidden>
                          ›
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="workbench__card">
                <h2 className="workbench__card-title">已完成事项</h2>
                <ul className="workbench__done-list">
                  {WORKBENCH_DONE.map((item) => (
                    <li key={item.id} className="workbench__done-item">
                      <span className="workbench__done-check" aria-hidden>
                        ✓
                      </span>
                      <span>{item.title}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <section className="workbench__resume-panel">
              <div className="workbench__resume-head">
                <div>
                  <h2 className="workbench__resume-title">我的简历</h2>
                  <p className="workbench__resume-desc">
                    一份更有说服力的简历，离理想工作更近一步。
                  </p>
                </div>
                <p className="workbench__resume-date">更新日期：{active.updatedAt}</p>
              </div>

              <div className="workbench__carousel">
                <button
                  type="button"
                  className="workbench__carousel-nav is-prev"
                  aria-label="上一份简历"
                  disabled={!canPrev}
                  onClick={goPrev}
                >
                  <img src={chevronLeft} alt="" />
                </button>

                <div className="workbench__carousel-stage">
                  {stackCount >= 2 ? <div className="workbench__stack-card is-back-1" /> : null}
                  {stackCount >= 1 ? <div className="workbench__stack-card is-back-2" /> : null}
                  {active ? (
                    <ResumePreview
                      resume={active}
                      onEdit={() => navigate(`/console/edit/${active.id}`)}
                    />
                  ) : null}
                </div>

                <button
                  type="button"
                  className="workbench__carousel-nav is-next"
                  aria-label="下一份简历"
                  disabled={!canNext}
                  onClick={goNext}
                >
                  <img src={chevronLeft} alt="" />
                </button>
              </div>
            </section>
          </div>
        ) : (
          <div className="workbench__placeholder">
            {nav === "profile" ? "个人履历即将上线" : "面试准备即将上线"}
          </div>
        )}
      </main>

    </div>
  )
}
