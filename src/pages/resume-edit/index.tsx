import { useState, type FormEvent, type KeyboardEvent } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ChatScoreCard } from "@/components/ChatScoreCard"
import backIcon from "@/assets/resume-edit/back.svg"
import modeChatIcon from "@/assets/resume-edit/mode-chat.svg"
import modeFormIcon from "@/assets/resume-edit/mode-form.svg"
import chevronDown from "@/assets/resume-edit/chevron-down.svg"
import checkIcon from "@/assets/resume-edit/check.svg"
import btnPreview from "@/assets/resume-edit/btn-preview.svg"
import btnExport from "@/assets/resume-edit/btn-export.svg"
import btnAdjust from "@/assets/resume-edit/btn-adjust.svg"
import composerPlus from "@/assets/resume-edit/composer-plus.svg"
import composerExtra from "@/assets/resume-edit/composer-extra.svg"
import composerSend from "@/assets/resume-edit/composer-send.svg"
import bgTexture from "@/assets/resume-edit/bg-texture.png"
import {
  EDIT_MESSAGES_MOCK,
  EDIT_SKELETON_ROWS,
  type EditMessage,
  type EditMode,
} from "./mock"
import "./index.scss"

/**
 * AI 简历修改 · Figma 353:1272
 *
 * 适配：与 surprise / workbench 一致，尺寸用项目 rem（r()）。
 * 禁止 transform:scale；不做断点改布局。
 */
export function ResumeEditApp() {
  const navigate = useNavigate()
  const { resumeId } = useParams<{ resumeId?: string }>()
  const [mode, setMode] = useState<EditMode>("chat")
  const [messages, setMessages] = useState<EditMessage[]>(EDIT_MESSAGES_MOCK)
  const [draft, setDraft] = useState("")

  const goBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate("/console")
  }

  const sendDraft = () => {
    const text = draft.trim()
    if (!text) return
    const now = new Date()
    const hh = now.getHours() % 12 || 12
    const mm = String(now.getMinutes()).padStart(2, "0")
    const ap = now.getHours() >= 12 ? "PM" : "AM"
    setMessages((list) => [
      ...list,
      {
        id: `u-${Date.now()}`,
        kind: "user",
        time: `${hh}:${mm} ${ap}`,
        text,
      },
    ])
    setDraft("")
  }

  const onComposerSubmit = (e: FormEvent) => {
    e.preventDefault()
    sendDraft()
  }

  const onComposerKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendDraft()
    }
  }

  return (
    <div className="resume-edit" data-resume-id={resumeId || undefined}>
      <div className="resume-edit__bg" aria-hidden>
        <img src={bgTexture} alt="" />
      </div>

      <div className="resume-edit__split">
        <section className="resume-edit__chat" aria-label="对话修改">
          <header className="resume-edit__chat-bar">
            <button
              type="button"
              className="resume-edit__back"
              aria-label="返回"
              onClick={goBack}
            >
              <img src={backIcon} alt="" />
            </button>

            <div className="resume-edit__modes" role="tablist" aria-label="修改方式">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "chat"}
                className={
                  "resume-edit__mode" + (mode === "chat" ? " is-active" : "")
                }
                onClick={() => setMode("chat")}
              >
                <img src={modeChatIcon} alt="" />
                <span>对话修改</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "form"}
                className={
                  "resume-edit__mode" + (mode === "form" ? " is-active" : "")
                }
                onClick={() => setMode("form")}
              >
                <img src={modeFormIcon} alt="" />
                <span>表单修改</span>
              </button>
            </div>

            <button type="button" className="resume-edit__history">
              <span>历史文件</span>
              <img src={chevronDown} alt="" />
            </button>
          </header>

          {mode === "chat" ? (
            <>
              <div className="resume-edit__messages">
                <div className="resume-edit__messages-inner">
                  {messages.map((msg) => (
                    <MessageBlock key={msg.id} message={msg} />
                  ))}
                </div>
              </div>

              <form className="resume-edit__composer" onSubmit={onComposerSubmit}>
                <div className="resume-edit__composer-card">
                  <textarea
                    className="resume-edit__composer-input"
                    rows={1}
                    placeholder="告诉我你的信息，我来帮你生成简历…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={onComposerKeyDown}
                  />
                  <div className="resume-edit__composer-tools">
                    <button
                      type="button"
                      className="resume-edit__tool-btn"
                      aria-label="添加附件"
                    >
                      <img src={composerPlus} alt="" />
                    </button>
                    <div className="resume-edit__composer-right">
                      <span className="resume-edit__enter-hint">Enter 发送</span>
                      <button
                        type="button"
                        className="resume-edit__tool-btn"
                        aria-label="更多"
                      >
                        <img src={composerExtra} alt="" />
                      </button>
                      <button
                        type="submit"
                        className="resume-edit__send-btn"
                        aria-label="发送"
                        disabled={!draft.trim()}
                      >
                        <img src={composerSend} alt="" />
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <div className="resume-edit__form-placeholder">
              <p>表单修改即将上线</p>
              <p className="resume-edit__form-hint">可先用对话方式调整简历内容</p>
            </div>
          )}
        </section>

        <section className="resume-edit__preview" aria-label="简历预览">
          <header className="resume-edit__preview-bar">
            <div className="resume-edit__live">
              <span className="resume-edit__live-dot" aria-hidden />
              <span>预览</span>
            </div>

            <button type="button" className="resume-edit__adjust">
              <img src={btnAdjust} alt="" />
              <span>调整设计</span>
            </button>

            <div className="resume-edit__preview-actions">
              <button type="button" className="resume-edit__btn-ghost">
                <img src={btnPreview} alt="" />
                <span>预览</span>
              </button>
              <button type="button" className="resume-edit__btn-primary">
                <img src={btnExport} alt="" />
                <span>导出</span>
              </button>
            </div>
          </header>

          <div className="resume-edit__skeleton" aria-hidden>
            {EDIT_SKELETON_ROWS.map((width, i) => (
              <div
                key={i}
                className="resume-edit__skeleton-bar"
                style={{ width: `${width}%` }}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function MessageBlock({ message }: { message: EditMessage }) {
  if (message.kind === "file" && message.file) {
    return (
      <div className="resume-edit__msg">
        <div className="resume-edit__file-card">
          <div className="resume-edit__file-check">
            <img src={checkIcon} alt="" />
          </div>
          <div className="resume-edit__file-meta">
            <div className="resume-edit__file-row">
              <span className="resume-edit__file-name">{message.file.name}</span>
              <span className="resume-edit__file-status">Done</span>
            </div>
            <span className="resume-edit__file-size">{message.file.size}</span>
          </div>
        </div>
        <p className="resume-edit__time">{message.time}</p>
      </div>
    )
  }

  if (message.kind === "score" && message.score) {
    return (
      <div className="resume-edit__msg">
        <ChatScoreCard data={message.score} className="resume-edit__score" />
        <p className="resume-edit__time">{message.time}</p>
      </div>
    )
  }

  if (message.kind === "user") {
    return (
      <div className="resume-edit__msg">
        <div className="resume-edit__bubble resume-edit__bubble--user">
          {message.text}
        </div>
        <p className="resume-edit__time">{message.time}</p>
      </div>
    )
  }

  return (
    <div className="resume-edit__msg">
      <p className="resume-edit__ai-text">{message.text}</p>
      <p className="resume-edit__time">{message.time}</p>
    </div>
  )
}
