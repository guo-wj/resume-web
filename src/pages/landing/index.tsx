// @ts-nocheck — 遗留大文件，待逐步补全类型
import React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ApiError, loginByPassword, logout, request, setUserPassword, streamAgentChat, buildAgentChatMessage, createAgentSession, getConversationHistory, mapConversationHistoryToChat, chatSessionUrl, parseChatSessionIdFromPath, uploadFile } from "@/api"
import { registerUnauthorizedLoginHandler } from "@/api/unauthorized"
import { AuthGateProvider, RequireAuthAction, ChatTextCard, ChatProfileCard, buildChatProfileCardData, ChatInfoCard, buildChatInfoCardData, ChatMiniResumeCard, buildChatMiniResumeCardData, ChatButtonCard, buildChatButtonCardData, ChatLoadingStatus, CHAT_LOADING_STATUS_DEFAULT_TEXT } from "@/components"
import { useAuth, getAuthSession, getAccessToken } from "@/store"
import chatBackArrow from "@/assets/chat/back-arrow.svg"
import chatFileChipDoc from "@/assets/chat/file-chip-doc.svg"
import chatFileChipFail from "@/assets/chat/file-chip-fail.svg"
import chatFileChipClose from "@/assets/chat/file-chip-close.svg"
import chatFileTypePdf from "@/assets/chat/file-type-pdf.svg"
import chatFileTypeMd from "@/assets/chat/file-type-md.svg"
import chatFileTypeWord from "@/assets/chat/file-type-word.svg"
import chatFileTypeTxt from "@/assets/chat/file-type-txt.svg"
import chatComposerPlus from "@/assets/chat/composer-plus.svg"
import chatComposerDash from "@/assets/chat/composer-dash.svg"
import chatComposerSend from "@/assets/chat/composer-send.svg"
import landingBg from "@/assets/landing/bg.png"
import landingBuddyIcon from "@/assets/landing/icon-buddy.svg"
import landingSurpriseIcon from "@/assets/landing/icon-surprise.svg"
import landingWorkbenchIcon from "@/assets/landing/icon-workbench.svg"
import landingLoginIcon from "@/assets/landing/icon-login.svg"
import landingSendIcon from "@/assets/landing/icon-send.svg"
import landingUploadIcon from "@/assets/landing/icon-upload.svg"
import landingPiecesIcon from "@/assets/landing/icon-pieces.svg"
import landingTitleUnderline from "@/assets/landing/title-underline.svg"
import authSparkleWhite from "@/assets/landing/auth/icon-sparkle-white.svg"
import authSparkleTeal from "@/assets/landing/auth/icon-sparkle-teal.svg"
import authSparkleTealSm from "@/assets/landing/auth/icon-sparkle-teal-sm.svg"
import authAppleIcon from "@/assets/landing/auth/icon-apple.svg"
import authCloseIcon from "@/assets/landing/auth/icon-close.svg"
import authWechatQr from "@/assets/landing/auth/qr-wechat.png"
import "./index.scss"

const { useState, useRef, useEffect, useCallback } = React

/* ============================================================
 * Magic Resume · 首页 + 登录模块
 * 由 login.html 原型（DCLogic 自定义模板）还原为 React 组件。
 * 保留全部交互：落地页 / AI 对话 / 创建方式 / 登录注册（弹窗 + 整屏）
 * / Apple 登录 / Toast。
 * ========================================================== */

/* 把 CSS 声明字符串解析为 React style 对象 */
function css(str) {
  if (!str) return {}
  const out = {}
  for (const part of str.split(";")) {
    const idx = part.indexOf(":")
    if (idx === -1) continue
    const prop = part.slice(0, idx).trim()
    const val = part.slice(idx + 1).trim()
    // 跳过原型里残留的非法声明（如 "-top:30px"）
    if (!prop || (prop[0] === "-" && prop[1] !== "-")) continue
    const key = prop.startsWith("--") ? prop : prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    out[key] = val
  }
  return out
}

/* 通用元素：保留动态 s/h；静态样式已抽到 index.scss */
function E({ as = "div", s, h, children, ...rest }) {
  const [hover, setHover] = useState(false)
  const As = as
  if (!s && !h) {
    return <As {...rest}>{children}</As>
  }
  const style = h && hover ? { ...css(s), ...css(h) } : css(s)
  const hoverProps = h
    ? { onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false) }
    : null
  return (
    <As style={style} {...hoverProps} {...rest}>
      {children}
    </As>
  )
}


const formatFileSizeLabel = (size) => {
  if (size == null || Number.isNaN(Number(size))) return ""
  const n = Number(size)
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function getFileExt(name) {
  const n = String(name || "").trim()
  const i = n.lastIndexOf(".")
  return i >= 0 ? n.slice(i + 1).toLowerCase() : ""
}

/** 材料卡图标 — Figma 379:2863/2871/2881/2890，按扩展名识别 */
function getMaterialFileIcon(name) {
  const ext = getFileExt(name)
  if (ext === "pdf") return { src: chatFileTypePdf, kind: "pdf" }
  if (ext === "doc" || ext === "docx") return { src: chatFileTypeWord, kind: "word" }
  if (ext === "md" || ext === "markdown") return { src: chatFileTypeMd, kind: "md" }
  if (ext === "txt") return { src: chatFileTypeTxt, kind: "txt" }
  // 图片等未单独出稿：回退 txt 图标
  return { src: chatFileTypeTxt, kind: "txt" }
}

function ChatFileCard({ file }) {
  const icon = getMaterialFileIcon(file?.name)
  return (
    <div className={`chat-file-card is-${icon.kind}`}>
      <span className="chat-file-card__icon" aria-hidden>
        <img src={icon.src} alt="" />
      </span>
      <div className="chat-file-card__meta">
        <span className="chat-file-card__name" title={file.name}>{file.name}</span>
        <div className="chat-file-card__size">{formatFileSizeLabel(file.size)}</div>
      </div>
    </div>
  )
}

function formatFileSizeCompact(bytes) {
  if (bytes == null || Number.isNaN(Number(bytes))) return ""
  const n = Number(bytes)
  if (n < 1024) return `${n}B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`
  return `${(n / (1024 * 1024)).toFixed(1)}MB`
}

/** 输入框内上传文件 chip：上传中 / 成功 / 失败 */
function ComposerFileChip({ file, onRemove }) {
  const isError = file.status === "error"
  const isUploading = file.status === "uploading"
  return (
    <div
      className={
        "composer-file-chip" +
        (isError ? " is-error" : "") +
        (isUploading ? " is-uploading" : "")
      }
      aria-busy={isUploading || undefined}
    >
      <span className="composer-file-chip__icon" aria-hidden>
        {isUploading ? (
          <span className="composer-file-chip__spinner" />
        ) : (
          <img src={isError ? chatFileChipFail : chatFileChipDoc} alt="" width={16} height={16} />
        )}
      </span>
      {isError ? (
        <span className="composer-file-chip__name">{file.errorMessage || "简历解析失败"}</span>
      ) : isUploading ? (
        <div className="composer-file-chip__meta">
          <span className="composer-file-chip__name" title={file.name}>{file.name}</span>
          <span className="composer-file-chip__status">上传中...</span>
        </div>
      ) : (
        <>
          <span className="composer-file-chip__name" title={file.name}>{file.name}</span>
          <span className="composer-file-chip__size">{formatFileSizeCompact(file.size)}</span>
        </>
      )}
      <button
        type="button"
        className="composer-file-chip__close"
        onClick={() => onRemove?.(file.id)}
        aria-label={`移除 ${file.name}`}
      >
        <img src={chatFileChipClose} alt="" width={16} height={16} />
      </button>
    </div>
  )
}

/** 多文件单行横向滑动，两侧淡出 + 箭头 */
function ComposerFileRail({ files, onRemove }) {
  const trackRef = useRef(null)
  const [fadeLeft, setFadeLeft] = useState(false)
  const [fadeRight, setFadeRight] = useState(false)

  const syncFade = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setFadeLeft(el.scrollLeft > 2)
    setFadeRight(max > 2 && el.scrollLeft < max - 2)
  }, [])

  const scrollByDir = (dir) => {
    const el = trackRef.current
    if (!el) return
    const step = Math.max(160, Math.floor(el.clientWidth * 0.7))
    el.scrollBy({ left: dir * step, behavior: "smooth" })
  }

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const tick = () => syncFade()
    tick()
    requestAnimationFrame(tick)
    const onScroll = () => syncFade()
    el.addEventListener("scroll", onScroll, { passive: true })
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(syncFade) : null
    ro?.observe(el)
    return () => {
      el.removeEventListener("scroll", onScroll)
      ro?.disconnect()
    }
  }, [files.length, syncFade])

  if (!files?.length) return null

  return (
    <div className="composer-file-rail">
      <div ref={trackRef} className="composer-file-rail__track">
        {files.map((f) => (
          <ComposerFileChip key={f.id} file={f} onRemove={onRemove} />
        ))}
      </div>
      {fadeLeft && (
        <>
          <div className="composer-file-rail__edge composer-file-rail__edge--left" aria-hidden />
          <button
            type="button"
            className="composer-file-rail__arrow composer-file-rail__arrow--left"
            aria-label="向左查看更多文件"
            onClick={() => scrollByDir(-1)}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M7.5 2.5 4 6l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}
      {fadeRight && (
        <>
          <div className="composer-file-rail__edge composer-file-rail__edge--right" aria-hidden />
          <button
            type="button"
            className="composer-file-rail__arrow composer-file-rail__arrow--right"
            aria-label="向右查看更多文件"
            onClick={() => scrollByDir(1)}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M4.5 2.5 8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}

const AppleIcon = ({ size = 20, fill = "#1B1530" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
    <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98C13.876.74 15.214.04 16.32 0c.03.13.045.28.045.43zM20.93 17.14c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8C3.97 18.38 2.93 15.57 2.93 12.92c0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.94 4.45z" />
  </svg>
)

const ChevronDownIcon = ({ size = 14, color = "#9890AE" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const HERO_GOAL_PROMPTS = {
  explore: [
    "我想转行做产品经理，需要具备哪些核心技能？",
    "互联网行业哪些岗位前景和薪资更好？",
    "大厂和创业公司，应届生该如何选择？",
  ],
  revise: [
    "帮我润色这段实习经历，让它更有成就感",
    "简历内容太多，怎么精简到一页？",
    "针对这个岗位 JD，帮我优化简历关键词",
  ],
  generate: ["如何突出我的项目经验？", "实习经历太单薄怎么办？", "简历投了没回应"],
}

const HERO_IDENTITY_LABELS = {
  student: "应届生",
  intern: "实习生",
  pro: "职场人",
}

/** Figma 424:100 默认示例文案 */
const HERO_DEFAULT_INPUT = "我是应届毕业生，想找产品经理相关工作"

const HERO_IDENTITY_PREFIX_RE = /^我是(?:应届毕业生|应届生|大学生|实习生|职场人)/

function formatHeroIdentity(identityKey) {
  return `我是${HERO_IDENTITY_LABELS[identityKey]}`
}

function applyHeroIdentity(input, identityKey) {
  const prefix = formatHeroIdentity(identityKey)
  let rest = input.replace(HERO_IDENTITY_PREFIX_RE, "").trim()
  rest = rest.replace(/^毕业生[，,]\s*/, "").trim()
  if (!rest) {
    return identityKey === "student" ? HERO_DEFAULT_INPUT : prefix
  }
  if (/^[，,]/.test(rest)) return `${prefix}${rest}`
  return `${prefix} ${rest}`
}

const HERO_FILE_TYPES = [".pdf", ".doc", ".docx", ".txt", ".md", ".png", ".jpg", ".jpeg", ".webp"]
const HERO_FILE_ACCEPT = HERO_FILE_TYPES.join(",")
const RESUME_FILE_TYPES = [".pdf", ".doc", ".docx"]
const RESUME_FILE_ACCEPT = RESUME_FILE_TYPES.join(",")
const MATERIAL_FILE_TYPES = [".pdf", ".doc", ".docx", ".txt", ".md", ".png", ".jpg", ".jpeg", ".webp"]
const MATERIAL_FILE_ACCEPT = MATERIAL_FILE_TYPES.join(",")
const MATERIAL_FILE_MAX_COUNT = 5
const HERO_FILE_MAX_COUNT = 10
const HERO_FILE_MAX_SIZE_MB = 50
const HERO_FILE_MAX_SIZE = HERO_FILE_MAX_SIZE_MB * 1024 * 1024
const HERO_FILE_UPLOAD_TIP = `最多 ${HERO_FILE_MAX_COUNT} 个文件，每个不超过 ${HERO_FILE_MAX_SIZE_MB} MB`

function isHeroFileAllowed(file) {
  const ext = `.${file.name.split(".").pop()?.toLowerCase() || ""}`
  return HERO_FILE_TYPES.includes(ext)
}

function isResumeFileAllowed(file) {
  const ext = `.${file.name.split(".").pop()?.toLowerCase() || ""}`
  return RESUME_FILE_TYPES.includes(ext)
}

function isMaterialFileAllowed(file) {
  const ext = `.${file.name.split(".").pop()?.toLowerCase() || ""}`
  return MATERIAL_FILE_TYPES.includes(ext)
}

function createHeroFileItem(file, status = "uploading") {
  return {
    id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    name: file.name,
    size: file.size,
    status,
    fileId: null,
    errorMessage: null,
  }
}

function patchHeroFile(files, id, patch) {
  const idx = files.findIndex((f) => f.id === id)
  if (idx === -1) return files
  const next = [...files]
  next[idx] = { ...next[idx], ...patch }
  return next
}

const HERO_VOICE_MAX_COUNT = 3
const HERO_VOICE_MAX_DURATION = 60
const HERO_VOICE_MIN_DURATION = 0.8
const HERO_VOICE_BAR_COUNT = 28

function formatVoiceDuration(seconds) {
  const total = Math.max(0, Math.floor(seconds))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

function getVoiceMimeType() {
  if (typeof MediaRecorder === "undefined") return ""
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus"
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm"
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4"
  return ""
}

function canUseVoiceInput() {
  if (!window.isSecureContext) return "insecure"
  if (navigator.mediaDevices?.getUserMedia) return "ok"
  const legacyGetUserMedia =
    navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia
  return legacyGetUserMedia ? "legacy" : "unsupported"
}

async function requestAudioStream() {
  const support = canUseVoiceInput()
  if (support === "insecure") {
    const err = new Error("INSECURE_CONTEXT")
    err.code = "INSECURE_CONTEXT"
    throw err
  }
  if (support === "unsupported") {
    const err = new Error("UNSUPPORTED")
    err.code = "UNSUPPORTED"
    throw err
  }
  if (support === "ok") {
    return navigator.mediaDevices.getUserMedia({ audio: true })
  }
  const legacyGetUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia
  return new Promise((resolve, reject) => {
    legacyGetUserMedia.call(navigator, { audio: true }, resolve, reject)
  })
}

function getVoiceInputErrorMessage(err) {
  if (err?.code === "INSECURE_CONTEXT" || err?.name === "INSECURE_CONTEXT") {
    return "语音输入需要在 HTTPS 或 localhost 环境下使用"
  }
  if (err?.code === "UNSUPPORTED" || err?.name === "UNSUPPORTED") {
    return "当前浏览器不支持语音输入，请使用 Chrome / Edge / Safari 最新版"
  }
  if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
    return "请允许使用麦克风后再试"
  }
  if (err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError") {
    return "未检测到可用麦克风，请检查设备连接"
  }
  return "无法启动录音，请检查麦克风权限"
}

function createEmptyVoiceBars(count = HERO_VOICE_BAR_COUNT) {
  return Array.from({ length: count }, () => 0.18)
}

function sampleLiveVoiceBars(analyser, dataArray) {
  analyser.getByteFrequencyData(dataArray)
  const step = Math.max(1, Math.floor(dataArray.length / HERO_VOICE_BAR_COUNT))
  const bars = []
  for (let i = 0; i < HERO_VOICE_BAR_COUNT; i++) {
    let sum = 0
    for (let j = 0; j < step; j++) sum += dataArray[i * step + j] || 0
    bars.push(Math.max(0.15, (sum / step / 255) * 1.15))
  }
  return bars
}

async function buildVoiceWaveformBars(blob, barCount = HERO_VOICE_BAR_COUNT) {
  const arrayBuffer = await blob.arrayBuffer()
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  const audioContext = new AudioCtx()
  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    const channel = audioBuffer.getChannelData(0)
    const blockSize = Math.max(1, Math.floor(channel.length / barCount))
    const bars = []
    for (let i = 0; i < barCount; i++) {
      let sum = 0
      const start = i * blockSize
      for (let j = 0; j < blockSize; j++) sum += Math.abs(channel[start + j] || 0)
      bars.push(sum / blockSize)
    }
    const max = Math.max(...bars, 0.01)
    return bars.map((v) => Math.max(0.12, v / max))
  } finally {
    await audioContext.close()
  }
}

function VoiceWaveBar({ bars, color = "#7b61ff", height = 28, animate = false }) {
  const displayBars = bars?.length ? bars : createEmptyVoiceBars()
  return (
    <div style={css(`display:flex;align-items:center;gap:2px;height:${height}px;min-width:0;flex:1;`)}>
      {displayBars.map((level, i) => (
        <span
          key={i}
          style={css(
            `width:3px;border-radius:9999px;background:${color};opacity:${animate ? 0.55 + (i % 5) * 0.09 : 0.88};transform:scaleY(${Math.max(0.14, Math.min(1, level))});transform-origin:center;height:100%;transition:transform .08s ease;`,
          )}
        />
      ))}
    </div>
  )
}

function VoiceClipRow({ clip, tone = "input", playing = false, onPlay, onRemove }) {
  const barColor = tone === "chat" ? "#ffffff" : "#7b61ff"
  const shellStyle =
    tone === "chat"
      ? "display:inline-flex;align-items:center;gap:10px;min-width:196px;max-width:100%;padding:8px 12px;border-radius:16px;background:rgba(255,255,255,.16);"
      : "display:inline-flex;align-items:center;gap:10px;min-width:196px;max-width:100%;padding:8px 12px;border-radius:16px;background:#f3f0ff;border:1px solid #e4dcff;"
  const btnStyle =
    tone === "chat"
      ? "display:grid;place-items:center;flex:0 0 auto;width:28px;height:28px;border:0;border-radius:50%;background:rgba(255,255,255,.22);color:#fff;cursor:pointer;font-size:11px;"
      : "display:grid;place-items:center;flex:0 0 auto;width:28px;height:28px;border:0;border-radius:50%;background:#ebe4ff;color:#7b61ff;cursor:pointer;font-size:11px;"
  const timeStyle =
    tone === "chat"
      ? "flex:0 0 auto;font-size:12px;color:#fff;opacity:.9;"
      : "flex:0 0 auto;font-size:12px;color:var(--ink-3);"

  return (
    <div style={css(shellStyle)}>
      <button type="button" style={css(btnStyle)} onClick={() => onPlay?.(clip)} aria-label={playing ? "暂停语音" : "播放语音"}>
        {playing ? "❚❚" : "▶"}
      </button>
      <VoiceWaveBar bars={clip.bars} color={barColor} animate={playing} />
      <span style={css(timeStyle)}>{formatVoiceDuration(clip.duration)}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={() => onRemove(clip.id)}
          className="ld-160"
          aria-label="移除语音"
        >
          ×
        </button>
      ) : null}
    </div>
  )
}

const isPhone = (v) => /^1[3-9]\d{9}$/.test(v)
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

const INTRO_MSG = {
  role: "ai",
  text: "你好！我是你的 AI 简历助手，可以帮你生成、优化和管理个人简历。请告诉我你的基本信息，我们从姓名和求职目标开始吧。",
  at: Date.now(),
}

const CHAT_CACHE_PREFIX = "mr:chat:"

/** 从有序 segments 同步扁平字段（缓存 / 判空兼容） */
function syncFlatFieldsFromSegments(segments) {
  let text = ""
  let infoCard
  let miniResumeCard
  let buttonCard
  let profile
  for (const s of segments || []) {
    if (!s || typeof s !== "object") continue
    if (s.kind === "text") text += String(s.text || "")
    else if (s.kind === "info_card") infoCard = s.data
    else if (s.kind === "mini_resume_card") miniResumeCard = s.data
    else if (s.kind === "button_card") buttonCard = s.data
    else if (s.kind === "profile_card") profile = s.data
  }
  return { text, infoCard, miniResumeCard, buttonCard, profile }
}

/** 旧缓存无 segments 时，按原先「正文 → 卡片」顺序还原，避免布局跳变 */
function ensureAiSegments(m) {
  if (Array.isArray(m?.segments) && m.segments.length) return m.segments
  const segs = []
  if (m?.text) segs.push({ kind: "text", text: m.text })
  if (m?.miniResumeCard) segs.push({ kind: "mini_resume_card", data: m.miniResumeCard })
  if (m?.infoCard) segs.push({ kind: "info_card", data: m.infoCard })
  if (m?.buttonCard) segs.push({ kind: "button_card", data: m.buttonCard })
  if (m?.profile) segs.push({ kind: "profile_card", data: m.profile })
  return segs
}

function serializeChatForCache(chat) {
  return (chat || [])
    .filter(
      (m) =>
        !(
          m.role === "ai" &&
          m.streaming &&
          !m.text &&
          !m.loadingText &&
          !m.profile &&
          !m.infoCard &&
          !m.miniResumeCard &&
          !m.buttonCard &&
          !(m.segments && m.segments.length)
        ),
    )
    .map((m) => ({
      role: m.role,
      text: m.text || "",
      at: m.at || Date.now(),
      profile: m.profile || null,
      infoCard: m.infoCard || null,
      miniResumeCard: m.miniResumeCard || null,
      buttonCard: m.buttonCard || null,
      segments: Array.isArray(m.segments) ? m.segments : undefined,
      files: (m.files || []).map((f) => ({
        name: f.name,
        size: f.size,
        fileId: f.fileId || null,
      })),
      // blob: 语音刷新后不可用，仅保留占位信息
      voices: (m.voices || []).map((v) => ({
        id: v.id,
        duration: v.duration,
        bars: v.bars,
      })),
      streaming: false,
    }))
}

function loadChatCache(sessionId) {
  if (!sessionId || typeof sessionStorage === "undefined") return null
  try {
    const raw = sessionStorage.getItem(CHAT_CACHE_PREFIX + sessionId)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || !Array.isArray(data.chat) || !data.chat.length) return null
    return {
      chat: data.chat,
      chatStage: data.chatStage || "intro",
    }
  } catch {
    return null
  }
}

function saveChatCache(sessionId, chat, chatStage) {
  if (!sessionId || typeof sessionStorage === "undefined") return
  try {
    sessionStorage.setItem(
      CHAT_CACHE_PREFIX + sessionId,
      JSON.stringify({
        chat: serializeChatForCache(chat),
        chatStage: chatStage || "intro",
        savedAt: Date.now(),
      }),
    )
  } catch {
    /* quota / private mode */
  }
}

const LEGAL_DOCS = {
  terms: {
    title: "用户协议",
    updated: "2025年6月26日",
    sections: [
      {
        heading: "一、服务说明",
        body: "Magic Resume（以下简称「本平台」）是一款 AI 驱动的在线简历制作与优化工具。注册或使用本平台，即表示你已阅读、理解并同意本协议全部条款。",
      },
      {
        heading: "二、账号注册与使用",
        body: "你应使用真实、有效的手机号或邮箱注册账号，并妥善保管登录凭证。账号下的全部操作均视为你本人行为，因保管不善导致的损失由你自行承担。",
      },
      {
        heading: "三、用户内容与授权",
        body: "你在本平台输入的工作经历、教育背景等个人信息，仅用于为你生成和优化简历。你保证对所提交内容拥有合法权利，不侵犯任何第三方权益。为提供服务，你授权本平台在必要范围内处理上述信息。",
      },
      {
        heading: "四、AI 生成内容",
        body: "本平台利用人工智能技术辅助生成简历内容。AI 输出仅供参考，你应在投递前自行核对准确性。因使用 AI 生成内容引发的纠纷，本平台不承担由此产生的直接或间接责任。",
      },
      {
        heading: "五、付费服务",
        body: "部分高级功能需付费使用。付费前请仔细确认套餐内容与价格，支付成功后除法律规定情形外不予退款。本平台保留调整定价与服务内容的权利。",
      },
      {
        heading: "六、禁止行为",
        body: "你不得利用本平台从事违法违规活动，包括但不限于传播虚假信息、侵犯他人隐私、恶意攻击系统或滥用 AI 功能批量生成垃圾内容。",
      },
      {
        heading: "七、免责声明",
        body: "本平台按「现状」提供服务，不保证服务不间断或完全无错误。因不可抗力、网络故障或第三方原因导致的服务中断，本平台不承担责任。",
      },
      {
        heading: "八、协议变更",
        body: "本平台有权根据需要修订本协议，修订后将通过网站公告等方式通知。若你继续使用服务，即视为接受修订后的协议。",
      },
    ],
  },
  privacy: {
    title: "隐私政策",
    updated: "2025年6月26日",
    sections: [
      {
        heading: "一、我们收集的信息",
        body: "为提供简历制作服务，我们可能收集：账号信息（手机号、邮箱）、个人资料（姓名、工作经历、教育背景等）、设备信息（浏览器类型、操作系统）及使用日志（访问时间、功能使用情况）。",
      },
      {
        heading: "二、信息使用方式",
        body: "我们收集的信息用于：创建和管理你的账号、生成与优化简历、改进产品体验、发送服务通知（如验证码、账户安全提醒），以及在获得你同意的前提下推送产品更新信息。",
      },
      {
        heading: "三、AI 数据处理",
        body: "你输入的简历相关信息会发送至 AI 模型进行处理以生成内容。我们采取去标识化等技术手段降低隐私风险，且不会将你的个人信息用于训练对外公开的通用模型。",
      },
      {
        heading: "四、信息共享",
        body: "我们不会向第三方出售你的个人信息。仅在以下情形可能共享：获得你的明确同意、法律法规要求、与可信服务商合作（如短信/邮件发送），且其须遵守严格的保密义务。",
      },
      {
        heading: "五、数据安全",
        body: "我们采用加密传输、访问控制等安全措施保护你的信息。尽管已尽合理努力，互联网传输无法保证绝对安全，请你理解并自行评估相关风险。",
      },
      {
        heading: "六、信息存储",
        body: "你的信息存储于中华人民共和国境内的服务器。账号注销后，我们将在合理期限内删除或匿名化处理你的个人信息，法律法规另有规定的除外。",
      },
      {
        heading: "七、你的权利",
        body: "你有权访问、更正、删除个人信息，以及撤回授权同意。如需行使上述权利，可通过产品内「个人中心」或联系客服处理，我们将在 15 个工作日内回复。",
      },
      {
        heading: "八、联系我们",
        body: "如对本政策有任何疑问，请发送邮件至 privacy@magicresume.com，我们将在收到后尽快处理。",
      },
    ],
  },
}

function LegalModal({ docKey, onClose }) {
  if (!docKey) return null
  const doc = LEGAL_DOCS[docKey]
  const stopProp = (e) => e.stopPropagation()

  return (
    <div
      className="ld-159"
      onClick={onClose}
    >
      <div
        onClick={stopProp}
        className="ld-158"
      >
        <div className="ld-157">
          <div>
            <div className="ld-156">{doc.title}</div>
            <div className="ld-155">更新日期：{doc.updated}</div>
          </div>
          <button type="button" className="legal-close ld-154"  onClick={onClose}>✕</button>
        </div>
        <div className="legal-body ld-153" >
          {doc.sections.map((s, i) => (
            <div key={i} style={css(i > 0 ? "margin-top:18px;" : "")}>
              <div className="ld-152">{s.heading}</div>
              <div className="ld-151">{s.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function LandingApp() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn, setSession, user, clearSession, refreshToken } = useAuth()

  /** chat 由 URL /chat 或 /chat/:id 驱动；此处仅 landing | fullAuth */
  const [screen, setScreen] = useState("landing") // landing | fullAuth
  const isChat =
    location.pathname === "/chat" ||
    location.pathname.startsWith("/chat/")
  const showLanding = !isChat && screen !== "fullAuth"
  const sessionFromUrl = parseChatSessionIdFromPath(location.pathname)
  const initialChatCacheRef = useRef(
    sessionFromUrl ? loadChatCache(sessionFromUrl) : null,
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [authReturn, setAuthReturn] = useState("landing") // landing | chat | resumeUpload | materialUpload | heroUpload | ...
  const [tab, setTab] = useState("account") // account | wechat
  const [step, setStep] = useState("method") // method | setpw

  const [account, setAccount] = useState("")
  const [accountError, setAccountError] = useState("")
  const [code, setCode] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const [loginMode, setLoginMode] = useState("code") // code | password
  const [loginPw, setLoginPw] = useState("")
  const [loginPwError, setLoginPwError] = useState("")
  const [showLoginPw, setShowLoginPw] = useState(false)

  const [pwNeedSwitch, setPwNeedSwitch] = useState(false)

  const [pw1, setPw1] = useState("")
  const [pw2, setPw2] = useState("")
  const [pwError, setPwError] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [settingPw, setSettingPw] = useState(false)

  const [agreed, setAgreed] = useState(false)
  const [agreeShake, setAgreeShake] = useState(false)
  const [legalDoc, setLegalDoc] = useState(null) // terms | privacy

  const [loggingIn, setLoggingIn] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [appleOpen, setAppleOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState("")

  const [heroInput, setHeroInput] = useState(HERO_DEFAULT_INPUT)
  const [heroGoal, setHeroGoal] = useState("generate") // explore | revise | generate
  const [heroIdentity, setHeroIdentity] = useState("student") // student | intern | pro
  const [heroFiles, setHeroFiles] = useState([])
  const [heroVoices, setHeroVoices] = useState([])
  const [heroRecording, setHeroRecording] = useState(null)
  const [voicePlayingId, setVoicePlayingId] = useState(null)
  /** 下方入口（简历/材料）上传中遮罩 */
  const [entryUploading, setEntryUploading] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [chatStage, setChatStage] = useState(
    () => initialChatCacheRef.current?.chatStage || "intro",
  ) // intro | ready | generating | done
  const [chatStreaming, setChatStreaming] = useState(false)
  const [chat, setChat] = useState(
    () => initialChatCacheRef.current?.chat || [INTRO_MSG],
  )

  // 让锁定倒计时每秒刷新
  const timers = useRef({})
  const userMenuRef = useRef(null)
  const authGateRef = useRef(null)
  const heroFileInputRef = useRef(null)
  const chatInputRef = useRef(null)
  const chatScrollRef = useRef(null)
  const resumeUploadInputRef = useRef(null)
  const materialUploadInputRef = useRef(null)
  const chatSessionIdRef = useRef(sessionFromUrl || "")
  /** 并发去重：同一时刻只创建一次会话 */
  const creatingSessionRef = useRef(null)
  /** 本页生命周期内刚新建的 session，跳过历史拉取（刷新后 ref 清空会再拉） */
  const freshSessionIdsRef = useRef(new Set())
  /** 同一 session 的历史请求去重（避免 StrictMode / effect 重跑打两次） */
  const historyInflightRef = useRef(null)
  const chatAbortRef = useRef(null)
  const heroVoiceRecorderRef = useRef(null)
  const heroVoiceAudioRef = useRef(null)
  const heroVoicesRef = useRef(heroVoices)
  heroVoicesRef.current = heroVoices

  const syncChatSessionUrl = useCallback(
    (sessionId, { replace = true, isNewSession = false } = {}) => {
      const id = String(sessionId || "").trim()
      if (!id) return
      chatSessionIdRef.current = id
      if (isNewSession) freshSessionIdsRef.current.add(id)
      const next = chatSessionUrl(id)
      if (location.pathname !== next) {
        navigate(next, {
          replace,
          state: isNewSession ? { isNewSession: true } : null,
        })
        return
      }
      if (isNewSession && location.state?.isNewSession !== true) {
        navigate(next, { replace: true, state: { isNewSession: true } })
      }
    },
    [location.pathname, location.state, navigate],
  )

  const ensureChatSession = useCallback(
    async ({ replace = true } = {}) => {
      const fromUrl = parseChatSessionIdFromPath(location.pathname)
      if (fromUrl) {
        chatSessionIdRef.current = fromUrl
        syncChatSessionUrl(fromUrl, { replace })
        return fromUrl
      }
      if (chatSessionIdRef.current) {
        const existing = chatSessionIdRef.current
        const isFresh = freshSessionIdsRef.current.has(existing)
        syncChatSessionUrl(existing, { replace, isNewSession: isFresh })
        return existing
      }
      if (creatingSessionRef.current) {
        const id = await creatingSessionRef.current
        syncChatSessionUrl(id, { replace, isNewSession: true })
        return id
      }
      creatingSessionRef.current = (async () => {
        const created = await createAgentSession()
        const id = created.session_id
        chatSessionIdRef.current = id
        freshSessionIdsRef.current.add(id)
        return id
      })()
      try {
        const id = await creatingSessionRef.current
        syncChatSessionUrl(id, { replace, isNewSession: true })
        return id
      } finally {
        creatingSessionRef.current = null
      }
    },
    [location.pathname, syncChatSessionUrl],
  )

  useEffect(() => {
    const t = timers.current
    return () => {
      clearInterval(t.countdown)
      clearTimeout(t.toast)
      clearTimeout(t.gen)
      chatAbortRef.current?.abort()
    }
  }, [])

  // 裸 /chat：已登录则创建会话
  useEffect(() => {
    if (!isChat) return
    const fromUrl = parseChatSessionIdFromPath(location.pathname)
    if (fromUrl) return
    if (!getAuthSession()?.user?.id && !user?.id) return
    let cancelled = false
    void ensureChatSession({ replace: true }).catch(() => {
      if (cancelled) return
    })
    return () => {
      cancelled = true
    }
  }, [isChat, location.pathname, ensureChatSession, user?.id])

  // 带 sessionId：刷新/回访拉历史；首页新建进会话则跳过
  useEffect(() => {
    if (!isChat) return
    const fromUrl = parseChatSessionIdFromPath(location.pathname)
    if (!fromUrl) return

    chatSessionIdRef.current = fromUrl
    const isFreshSession =
      location.state?.isNewSession === true || freshSessionIdsRef.current.has(fromUrl)

    if (isFreshSession) {
      freshSessionIdsRef.current.add(fromUrl)
      return
    }

    const cached = loadChatCache(fromUrl)
    if (cached?.chat?.length) {
      setChat(cached.chat)
      setChatStage(cached.chatStage || "intro")
    }

    if (!getAccessToken()) return

    let cancelled = false
    void (async () => {
      try {
        let inflight = historyInflightRef.current
        if (!inflight || inflight.sessionId !== fromUrl) {
          inflight = {
            sessionId: fromUrl,
            promise: getConversationHistory(fromUrl),
          }
          historyInflightRef.current = inflight
        }
        const hist = await inflight.promise
        if (cancelled) return
        const mapped = mapConversationHistoryToChat(hist)
        if (mapped.length) {
          setChat(mapped)
          setChatStage("intro")
          saveChatCache(fromUrl, mapped, "intro")
          return
        }
        setChat((current) => {
          if (current.some((m) => m.role === "user")) return current
          if (cached?.chat?.some((m) => m.role === "user")) return cached.chat
          return [INTRO_MSG]
        })
      } catch (err) {
        if (cancelled) return
        if (historyInflightRef.current?.sessionId === fromUrl) {
          historyInflightRef.current = null
        }
        if (err instanceof ApiError && err.handled) return
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isChat, location.pathname, location.state])

  // 会话消息持久化，刷新后按 sessionId 恢复
  useEffect(() => {
    if (!isChat || chatStreaming) return
    const id = chatSessionIdRef.current || parseChatSessionIdFromPath(location.pathname)
    if (!id) return
    saveChatCache(id, chat, chatStage)
  }, [chat, chatStage, chatStreaming, isChat, location.pathname])
  useEffect(() => {
    if (!isChat) return
    const el = chatScrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [isChat, chat, chatStage, chatStreaming])

  useEffect(() => {
    if (!userMenuOpen) return
    const onDocClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [userMenuOpen])

  const toast = useCallback((msg) => {
    clearTimeout(timers.current.toast)
    setToastMsg(msg)
    timers.current.toast = setTimeout(() => setToastMsg(""), 2800)
  }, [])

  const clearHeroVoices = useCallback((voices) => {
    voices.forEach((voice) => URL.revokeObjectURL(voice.url))
  }, [])

  const stopHeroVoiceRecording = useCallback(
    async (cancel = false) => {
      const ctx = heroVoiceRecorderRef.current
      if (!ctx) return

      cancelAnimationFrame(ctx.rafId)
      heroVoiceRecorderRef.current = null
      setHeroRecording(null)

      const { recorder, stream, audioContext, chunks, startedAt, mimeType } = ctx

      if (recorder && recorder.state !== "inactive") {
        await new Promise((resolve) => {
          recorder.addEventListener("stop", resolve, { once: true })
          recorder.stop()
        })
      }

      stream.getTracks().forEach((track) => track.stop())
      await audioContext?.close().catch(() => {})

      if (cancel || !chunks.length) return

      const duration = (Date.now() - startedAt) / 1000
      if (duration < HERO_VOICE_MIN_DURATION) {
        toast("录音太短了，请再说几句")
        return
      }

      const blob = new Blob(chunks, { type: mimeType || "audio/webm" })
      try {
        const bars = await buildVoiceWaveformBars(blob)
        const url = URL.createObjectURL(blob)
        const id = `voice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        setHeroVoices((prev) => [...prev, { id, blob, url, duration, bars }])
        toast("语音已添加")
      } catch {
        toast("语音处理失败，请重试")
      }
    },
    [toast],
  )

  const startHeroVoiceRecording = useCallback(async () => {
    if (heroVoiceRecorderRef.current) return
    if (heroVoices.length >= HERO_VOICE_MAX_COUNT) {
      toast(`最多添加 ${HERO_VOICE_MAX_COUNT} 条语音`)
      return
    }

    const mimeType = getVoiceMimeType()
    if (!mimeType) {
      toast("当前浏览器不支持录音编码")
      return
    }

    try {
      const stream = await requestAudioStream()
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      const audioContext = new AudioCtx()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const chunks = []
      const recorder = new MediaRecorder(stream, { mimeType })
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      }

      const startedAt = Date.now()
      const ctx = {
        stream,
        recorder,
        chunks,
        audioContext,
        analyser,
        dataArray,
        startedAt,
        mimeType,
        rafId: 0,
      }
      heroVoiceRecorderRef.current = ctx

      const tick = () => {
        if (!heroVoiceRecorderRef.current) return
        const bars = sampleLiveVoiceBars(analyser, dataArray)
        const duration = (Date.now() - startedAt) / 1000
        setHeroRecording({ bars, duration })
        if (duration >= HERO_VOICE_MAX_DURATION) {
          stopHeroVoiceRecording(false)
          return
        }
        ctx.rafId = requestAnimationFrame(tick)
      }

      recorder.start(200)
      ctx.rafId = requestAnimationFrame(tick)
      setHeroRecording({ bars: createEmptyVoiceBars(), duration: 0 })
    } catch (err) {
      toast(getVoiceInputErrorMessage(err))
    }
  }, [heroVoices.length, stopHeroVoiceRecording, toast])

  const toggleHeroVoiceRecord = useCallback(() => {
    if (heroVoiceRecorderRef.current) stopHeroVoiceRecording(false)
    else startHeroVoiceRecording()
  }, [startHeroVoiceRecording, stopHeroVoiceRecording])

  const removeHeroVoice = useCallback(
    (id) => {
      setHeroVoices((prev) => {
        const target = prev.find((voice) => voice.id === id)
        if (target) URL.revokeObjectURL(target.url)
        return prev.filter((voice) => voice.id !== id)
      })
      if (voicePlayingId === id) {
        heroVoiceAudioRef.current?.pause()
        setVoicePlayingId(null)
      }
    },
    [voicePlayingId],
  )

  const playVoiceClip = useCallback(
    (clip) => {
      if (!clip?.url) return
      if (voicePlayingId === clip.id) {
        heroVoiceAudioRef.current?.pause()
        setVoicePlayingId(null)
        return
      }

      heroVoiceAudioRef.current?.pause()
      const audio = new Audio(clip.url)
      heroVoiceAudioRef.current = audio
      audio.onended = () => setVoicePlayingId(null)
      audio.onerror = () => {
        setVoicePlayingId(null)
        toast("语音播放失败")
      }
      audio
        .play()
        .then(() => setVoicePlayingId(clip.id))
        .catch(() => toast("语音播放失败"))
    },
    [toast, voicePlayingId],
  )

  useEffect(() => {
    return () => {
      stopHeroVoiceRecording(true)
      heroVoiceAudioRef.current?.pause()
      clearHeroVoices(heroVoicesRef.current)
    }
  }, [clearHeroVoices, stopHeroVoiceRecording])

  const resetAuthFields = useCallback(() => {
    clearInterval(timers.current.countdown)
    setAccount("")
    setAccountError("")
    setCode("")
    setCodeSent(false)
    setCountdown(0)
    setLoginMode("code")
    setLoginPw("")
    setLoginPwError("")
    setShowLoginPw(false)
    setPwNeedSwitch(false)
    setPw1("")
    setPw2("")
    setPwError("")
    setShowPw(false)
    setAgreed(false)
    setAgreeShake(false)
  }, [])

  /* ---------- 打开 / 关闭登录 ---------- */
  const openAuth = (ret) => {
    resetAuthFields()
    setModalOpen(true)
    setAuthReturn(ret)
    setStep("method")
    setTab("account")
  }
  const openAuthLogin = () => openAuth("landing")
  const openAuthCreate = () => openAuth("landing")

  // 401：弹登录窗，不在输入区 / toast 里展示「未登录」文案
  const openAuthOnUnauthorizedRef = useRef(openAuth)
  openAuthOnUnauthorizedRef.current = (ret) => openAuth(ret)
  const isChatRef = useRef(isChat)
  isChatRef.current = isChat
  useEffect(() => {
    registerUnauthorizedLoginHandler(() => {
      openAuthOnUnauthorizedRef.current(isChatRef.current ? "chatSend" : "heroUpload")
    })
    return () => registerUnauthorizedLoginHandler(null)
  }, [])

  const closeAuth = () => {
    if (screen === "fullAuth") setScreen("landing")
    else setModalOpen(false)
    setStep("method")
  }
  const onBackdrop = () => {
    if (screen !== "fullAuth") setModalOpen(false)
  }
  const stopProp = (e) => e.stopPropagation()

  const setTabAccount = () => setTab("account")
  const setTabWechat = () => setTab("wechat")

  /* ---------- 账号 / 验证码 ---------- */
  const onAccountChange = (e) => {
    setAccount(e.target.value)
    setAccountError("")
    setLoginPwError("")
    setPwNeedSwitch(false)
  }
  const onAccountBlur = () => {
    const a = account.trim()
    if (a && !isPhone(a) && !isEmail(a)) setAccountError("请输入正确的手机号 / 邮箱")
  }
  const onCodeChange = (e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))

  const sendCode = async () => {
    if (countdown > 0 || sendingCode) return
    const a = account.trim()
    if (!isPhone(a) && !isEmail(a)) {
      setAccountError("请输入正确的手机号 / 邮箱")
      return
    }
    setSendingCode(true)
    setAccountError("")
    try {
      await request("auth.sendCode", {
        body: { identifier: a, scene: "login" },
      })
      setCodeSent(true)
      setCountdown(60)
      toast(isPhone(a) ? "验证码已发送至手机" : "验证码已发送至邮箱")
      clearInterval(timers.current.countdown)
      timers.current.countdown = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timers.current.countdown)
            return 0
          }
          return c - 1
        })
      }, 1000)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "验证码发送失败，请稍后重试"
      toast(msg)
    } finally {
      setSendingCode(false)
    }
  }

  const nudgeAgree = () => {
    setAgreeShake(true)
    toast("请先阅读并同意用户协议")
    setTimeout(() => setAgreeShake(false), 600)
  }
  const toggleAgree = () => setAgreed((v) => !v)
  const openLegal = (e, key) => {
    e.stopPropagation()
    setLegalDoc(key)
  }
  const closeLegal = () => setLegalDoc(null)

  const proceedAuth = (isNewUser = false) => {
    if (isNewUser) {
      setStep("setpw")
      return
    }
    finishAuth()
  }

  const submitAccount = async () => {
    const a = account.trim()
    if (!isPhone(a) && !isEmail(a)) {
      setAccountError("请输入正确的手机号 / 邮箱")
      return
    }
    if (code.trim().length < 4) {
      toast("请输入验证码")
      return
    }
    if (!agreed) {
      nudgeAgree()
      return
    }
    if (loggingIn) return

    setLoggingIn(true)
    try {
      const data = await request("auth.loginByCode", {
        body: { identifier: a, code: code.trim() },
      })
      setSession(data)
      proceedAuth(data.is_new_user === true)
      // mock
      // proceedAuth(data.is_new_user !== true)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "登录失败，请稍后重试"
      toast(msg)
    } finally {
      setLoggingIn(false)
    }
  }

  /* ---------- 密码登录（已注册用户） ---------- */
  const setModeCode = () => {
    setLoginMode("code")
    setLoginPwError("")
    setAccountError("")
  }
  const setModePassword = () => {
    setLoginMode("password")
    setAccountError("")
  }
  const onLoginPw = (e) => {
    setLoginPw(e.target.value)
    setLoginPwError("")
  }
  const onLoginPwKey = (e) => {
    if (e.key === "Enter") submitPassword()
  }
  const toggleShowLoginPw = () => setShowLoginPw((v) => !v)
  const forgotPw = () => {
    setLoginMode("code")
    setLoginPwError("")
    setPwNeedSwitch(false)
    toast("已切换到验证码登录，可重新设置密码（原型示意）")
  }
  const switchToCodeFromPw = () => {
    setLoginMode("code")
    setLoginPwError("")
    setPwNeedSwitch(false)
    setLoginPw("")
  }

  const submitPassword = async () => {
    const a = account.trim()
    if (!isPhone(a) && !isEmail(a)) {
      setAccountError("请输入正确的手机号 / 邮箱")
      return
    }
    if (!loginPw) {
      setLoginPwError("请输入登录密码")
      return
    }
    if (loggingIn) return

    setLoggingIn(true)
    setLoginPwError("")
    setPwNeedSwitch(false)
    try {
      const data = await loginByPassword(a, loginPw)
      setSession(data)
      finishAuth()
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "登录失败，请稍后重试"
      setLoginPwError(msg)
      if (/未设置|没有密码|验证码|不存在|未注册/.test(msg)) {
        setPwNeedSwitch(true)
      }
    } finally {
      setLoggingIn(false)
    }
  }

  /* ---------- 微信 / Apple ---------- */
  const wechatScan = () => {
    // 微信态稿面无协议勾选；扫码成功直接继续（演示）
    proceedAuth()
  }
  const openApple = () => {
    // 仅账号+验证码态展示协议勾选
    const needAgree = tab === "account" && loginMode === "code"
    if (needAgree && !agreed) {
      nudgeAgree()
      return
    }
    setAppleOpen(true)
  }
  const closeApple = () => setAppleOpen(false)
  const appleConfirm = () => {
    setAppleOpen(false)
    proceedAuth()
  }

  /* ---------- 设置密码 ---------- */
  const backToMethod = () => setStep("method")
  const onPw1 = (e) => {
    setPw1(e.target.value)
    setPwError("")
  }
  const onPw2 = (e) => {
    setPw2(e.target.value)
    setPwError("")
  }
  const toggleShowPw = () => setShowPw((v) => !v)
  const confirmPw = async () => {
    if (pw1.length < 8) {
      setPwError("密码至少 8 位")
      return
    }
    if (pw1 !== pw2) {
      setPwError("两次输入的密码不一致")
      return
    }
    if (settingPw) return

    setSettingPw(true)
    setPwError("")
    try {
      // 首次设置：不传 old_password；access_token 由 request 自动从 store 写入 Authorization 头
      await setUserPassword({
        new_password: pw1,
        confirm_password: pw2,
      })
      finishAuth()
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "密码设置失败，请稍后重试"
      setPwError(msg)
    } finally {
      setSettingPw(false)
    }
  }
  const skipPw = () => finishAuth()

  const finishAuth = () => {
    const ret = authReturn
    setModalOpen(false)
    setScreen("landing")
    setStep("method")

    // 选文件类：登录后不自动弹系统文件框（浏览器会拦截），清掉 pending，用户再点一次原入口即可
    if (ret === "resumeUpload" || ret === "materialUpload" || ret === "heroUpload") {
      authGateRef.current?.takePendingAction(ret)
      toast("登录成功，欢迎来到 Magic Resume 🎉")
      resetAuthFields()
      return
    }

    if (authGateRef.current?.resumePendingAction(ret)) {
      toast("登录成功，欢迎来到 Magic Resume 🎉")
      resetAuthFields()
      return
    }

    if (ret === "chat") {
      void ensureChatSession({ replace: false })
      doGenerate()
    }
    toast("登录成功，欢迎来到 Magic Resume 🎉")
    resetAuthFields()
  }

  /* ---------- 落地页 AI 输入 ---------- */
  const addPrompt = (text) =>
    setHeroInput((v) => {
      const trimmed = v.trim()
      if (!trimmed) return text
      const sep = /[，。！？；、,:]$/.test(trimmed) ? "" : "，"
      return trimmed + sep + text
    })
  const onHeroChange = (e) => setHeroInput(e.target.value)
  const openHeroFilePicker = () => {
    if (heroFiles.length >= HERO_FILE_MAX_COUNT) {
      toast(`最多上传 ${HERO_FILE_MAX_COUNT} 个文件`)
      return
    }
    authGateRef.current?.withAuth("heroUpload", () => {
      heroFileInputRef.current?.click()
    })
  }
  const handleHeroFiles = (e) => {
    const picked = Array.from(e.target.files || [])
    e.target.value = ""
    if (!picked.length) return

    // 选文件瞬间若已掉登录，直接弹窗，绝不进入上传 / 错误 chip
    const session = getAuthSession()
    if (!(session?.accessToken && session?.user?.id)) {
      openAuth("heroUpload")
      return
    }

    // 先基于当前列表同步算出待上传批次，再 setState。
    // 不能把「收集 added」放进 setState updater：updater 可能异步执行，
    // 外面立刻读 added 会是空数组，导致根本不调 upload。
    const prev = heroFiles
    const next = [...prev]
    const added = []
    for (const file of picked) {
      if (next.length >= HERO_FILE_MAX_COUNT) {
        toast(`最多上传 ${HERO_FILE_MAX_COUNT} 个文件`)
        break
      }
      if (!isHeroFileAllowed(file)) {
        toast(`${file.name} 格式不支持`)
        continue
      }
      if (file.size > HERO_FILE_MAX_SIZE) {
        toast(`${file.name} 超过 ${HERO_FILE_MAX_SIZE_MB} MB`)
        continue
      }
      if (next.some((item) => item.name === file.name && item.size === file.size)) continue
      const item = createHeroFileItem(file, "uploading")
      next.push(item)
      added.push(item)
    }
    if (!added.length) return

    setHeroFiles(next)

    void Promise.all(
      added.map(async (item) => {
        try {
          const result = await uploadFile(item.file, { parse: true })
          setHeroFiles((files) =>
            patchHeroFile(files, item.id, {
              status: "success",
              fileId: result.file_id,
              name: result.filename || item.name,
              size: result.size_bytes ?? item.size,
              errorMessage: null,
            }),
          )
        } catch (err) {
          // 401：去掉失败 chip，由全局 handler 弹登录（勿把「未登录」文案塞进输入区）
          if (err instanceof ApiError && err.handled) {
            setHeroFiles((files) => files.filter((f) => f.id !== item.id))
            return
          }
          const message =
            err instanceof ApiError && err.message
              ? err.message
              : "简历解析失败"
          setHeroFiles((files) =>
            patchHeroFile(files, item.id, {
              status: "error",
              errorMessage: message,
            }),
          )
        }
      }),
    )
  }
  const removeHeroFile = (id) => setHeroFiles((files) => files.filter((f) => f.id !== id))

  const sendChatMessage = useCallback(
    async (message, fileIds = []) => {
      const trimmed = message.trim()
      if (!trimmed) return

      // 登录后 resume 的 pending action 可能持有旧闭包，需从 store 读最新 user
      const userId = getAuthSession()?.user?.id ?? user?.id
      if (!userId) {
        // 兜底：不入消息、不 toast，交给上层 withAuth 弹登录
        openAuth("chatSend")
        return
      }

      // 会话 id 优先取自 URL，再回退 ref；都没有则创建服务端会话
      let sessionId =
        parseChatSessionIdFromPath(location.pathname) || chatSessionIdRef.current || ""
      if (!sessionId) {
        try {
          sessionId = await ensureChatSession({ replace: true })
        } catch (err) {
          if (!(err instanceof ApiError && err.handled)) {
            toast(err instanceof ApiError ? err.message : "创建会话失败，请稍后重试")
          }
          return
        }
      } else {
        chatSessionIdRef.current = sessionId
        syncChatSessionUrl(sessionId, { replace: true })
      }

      chatAbortRef.current?.abort()
      const ac = new AbortController()
      chatAbortRef.current = ac
      setChatStreaming(true)

      let aiText = ""
      setChat((c) => [
        ...c,
        { role: "ai", text: "", streaming: true, loadingText: null, segments: [], at: Date.now() },
      ])

      const patchStreamingAi = (patch) => {
        setChat((c) => {
          const next = [...c]
          for (let i = next.length - 1; i >= 0; i--) {
            if (next[i].role === "ai" && next[i].streaming) {
              const resolved = typeof patch === "function" ? patch(next[i]) : patch
              next[i] = { ...next[i], ...resolved }
              break
            }
          }
          return next
        })
      }

      const appendAiTextDelta = (delta) => {
        aiText += delta
        patchStreamingAi((msg) => {
          const segments = [...(msg.segments || [])]
          const last = segments[segments.length - 1]
          if (last?.kind === "text") {
            segments[segments.length - 1] = { ...last, text: last.text + delta }
          } else {
            segments.push({ kind: "text", text: delta })
          }
          return { ...syncFlatFieldsFromSegments(segments), segments, loadingText: null }
        })
      }

      const setAiFullText = (text) => {
        aiText = text
        patchStreamingAi((msg) => {
          let segments = [...(msg.segments || [])]
          const firstTextIdx = segments.findIndex((s) => s?.kind === "text")
          if (firstTextIdx >= 0) {
            segments = segments.filter((s, i) => s?.kind !== "text" || i === firstTextIdx)
            const idx = segments.findIndex((s) => s?.kind === "text")
            segments[idx] = { kind: "text", text }
          } else {
            segments.push({ kind: "text", text })
          }
          return { ...syncFlatFieldsFromSegments(segments), segments, loadingText: null }
        })
      }

      const upsertAiCardSegment = (kind, data) => {
        patchStreamingAi((msg) => {
          const segments = [...(msg.segments || [])]
          const idx = segments.findIndex((s) => s?.kind === kind)
          if (idx >= 0) segments[idx] = { kind, data }
          else segments.push({ kind, data })
          return { ...syncFlatFieldsFromSegments(segments), segments, loadingText: null }
        })
      }

      const patchAiLoading = (loadingText) => {
        patchStreamingAi({ loadingText })
      }

      const clearAiLoading = () => {
        patchStreamingAi({ loadingText: null })
      }

      const finishAi = (readyGenerate) => {
        setChat((c) => {
          const next = [...c]
          for (let i = next.length - 1; i >= 0; i--) {
            if (next[i].role === "ai" && next[i].streaming) {
              const hasContent =
                !!aiText ||
                !!next[i].profile ||
                !!next[i].infoCard ||
                !!next[i].miniResumeCard ||
                !!next[i].buttonCard ||
                (Array.isArray(next[i].segments) && next[i].segments.length > 0)
              if (!hasContent) next.splice(i, 1)
              else {
                next[i] = {
                  role: "ai",
                  text: aiText || next[i].text || "",
                  streaming: false,
                  loadingText: null,
                  at: next[i].at || Date.now(),
                  profile: next[i].profile,
                  infoCard: next[i].infoCard,
                  miniResumeCard: next[i].miniResumeCard,
                  buttonCard: next[i].buttonCard,
                  segments: next[i].segments,
                }
              }
              break
            }
          }
          return next
        })
        setChatStage(readyGenerate ? "ready" : "intro")
        setChatStreaming(false)
      }

      let doneReceived = false
      const ids = (Array.isArray(fileIds) ? fileIds : [])
        .map((id) => (id == null ? "" : String(id).trim()))
        .filter(Boolean)

      const contentCardTypes = new Set([
        "info_card",
        "score_card",
        "profile_card",
        "mini_resume_card",
        "button_card",
      ])

      try {
        await streamAgentChat(
          {
            session_id: sessionId,
            message: trimmed,
            workflow: "career_explore",
            stream_output: true,
            file_ids: ids,
          },
          {
            onDelta: (delta) => appendAiTextDelta(delta),
            onFull: (text) => setAiFullText(text),
            onLoadingText: (text) => patchAiLoading(text),
            onEvent: (type, data) => {
              if (contentCardTypes.has(type)) clearAiLoading()
              if (type === "info_card") {
                upsertAiCardSegment("info_card", data)
              } else if (type === "mini_resume_card") {
                upsertAiCardSegment("mini_resume_card", data)
              } else if (type === "button_card") {
                upsertAiCardSegment("button_card", data)
              } else if (type === "profile_card") {
                upsertAiCardSegment("profile_card", data)
              }
            },
            onDone: (ev) => {
              doneReceived = true
              if (ev.session_id) {
                chatSessionIdRef.current = ev.session_id
                syncChatSessionUrl(ev.session_id, { replace: true })
              }
              finishAi(!!ev.ready_generate)
            },
            onError: (err) => {
              if (err instanceof ApiError && err.handled) return
              toast(err.message || "对话失败，请稍后重试")
            },
          },
          ac.signal,
        )
        if (!ac.signal.aborted && !doneReceived) finishAi(false)
      } catch (err) {
        if (ac.signal.aborted) return
        if (!(err instanceof ApiError && err.handled)) {
          const msg = err instanceof ApiError ? err.message : "对话失败，请稍后重试"
          toast(msg)
        }
        finishAi(false)
      }
    },
    [toast, user?.id, location.pathname, ensureChatSession, syncChatSessionUrl],
  )

  const enterChatWithContent = async ({ text = "", files = [], voices = [] }) => {
    // 未登录绝不进会话页（避免先跳转再 toast「请先登录」）
    const userId = getAuthSession()?.user?.id ?? user?.id
    if (!userId) {
      openAuth("heroSubmit")
      return
    }
    stopHeroVoiceRecording(true)
    try {
      await ensureChatSession({ replace: false })
    } catch (err) {
      if (!(err instanceof ApiError && err.handled)) {
        toast(err instanceof ApiError ? err.message : "创建会话失败，请稍后重试")
      }
      return
    }
    setHeroInput(() => formatHeroIdentity(heroIdentity))
    setHeroFiles([])
    setHeroVoices([])
    setChat((c) => [
      ...c,
      {
        role: "user",
        text,
        files,
        voices,
        at: Date.now(),
      },
    ])
    setChatStage("intro")
    const fileIds = files.map((f) => f.fileId).filter(Boolean)
    void sendChatMessage(buildAgentChatMessage(text, files), fileIds)
  }
  /** 落地页输入框当前可带入对话的内容（文本 / 已上传成功附件 / 语音） */
  const snapshotHeroComposer = () => ({
    text: heroInput.trim(),
    files: heroFiles
      .filter((f) => f.status === "success")
      .map((f) => ({
        name: f.name,
        size: f.size,
        fileId: f.fileId,
      })),
    voices: heroVoices.map((voice) => ({
      id: voice.id,
      url: voice.url,
      duration: voice.duration,
      bars: voice.bars,
    })),
  })
  const mergeComposerFiles = (base, extra) => {
    const next = [...base]
    for (const file of extra) {
      if (next.some((item) => item.name === file.name && item.size === file.size)) continue
      next.push(file)
    }
    return next
  }
  const heroSubmitCore = () => {
    const composer = snapshotHeroComposer()
    enterChatWithContent(composer)
  }
  const openResumeUploadPicker = () => {
    if (entryUploading) return
    if (heroFiles.some((f) => f.status === "uploading")) {
      toast("文件上传中，请稍候")
      return
    }
    authGateRef.current?.withAuth("resumeUpload", () => {
      resumeUploadInputRef.current?.click()
    })
  }
  const handleResumeUpload = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (!isResumeFileAllowed(file)) {
      toast("请上传 PDF 或 Word 格式的简历")
      return
    }
    if (file.size > HERO_FILE_MAX_SIZE) {
      toast(`${file.name} 超过 ${HERO_FILE_MAX_SIZE_MB} MB`)
      return
    }
    const submitResume = () => {
      void (async () => {
        setEntryUploading(true)
        try {
          const result = await uploadFile(file, { parse: true })
          const composer = snapshotHeroComposer()
          setEntryUploading(false)
          enterChatWithContent({
            text: composer.text,
            files: mergeComposerFiles(composer.files, [
              {
                name: result.filename || file.name,
                size: result.size_bytes ?? file.size,
                fileId: result.file_id,
              },
            ]),
            voices: composer.voices,
          })
        } catch (err) {
          setEntryUploading(false)
          if (err instanceof ApiError && err.handled) return
          toast(err instanceof ApiError ? err.message : "上传失败，请稍后重试")
        }
      })()
    }
    authGateRef.current?.withAuth("resumeUpload", submitResume)
  }
  const openMaterialUploadPicker = () => {
    if (entryUploading) return
    if (heroFiles.some((f) => f.status === "uploading")) {
      toast("文件上传中，请稍候")
      return
    }
    authGateRef.current?.withAuth("materialUpload", () => {
      materialUploadInputRef.current?.click()
    })
  }
  const handleMaterialUpload = (e) => {
    const picked = Array.from(e.target.files || [])
    e.target.value = ""
    if (!picked.length) return

    const localFiles = []
    for (const file of picked) {
      if (localFiles.length >= MATERIAL_FILE_MAX_COUNT) {
        toast(`最多上传 ${MATERIAL_FILE_MAX_COUNT} 个文件`)
        break
      }
      if (!isMaterialFileAllowed(file)) {
        toast(`${file.name} 格式不支持`)
        continue
      }
      if (file.size > HERO_FILE_MAX_SIZE) {
        toast(`${file.name} 超过 ${HERO_FILE_MAX_SIZE_MB} MB`)
        continue
      }
      if (localFiles.some((item) => item.name === file.name && item.size === file.size)) continue
      localFiles.push(file)
    }
    if (!localFiles.length) return

    const submitMaterials = () => {
      void (async () => {
        setEntryUploading(true)
        try {
          const uploaded = await Promise.all(
            localFiles.map(async (file) => {
              const result = await uploadFile(file, { parse: true })
              return {
                name: result.filename || file.name,
                size: result.size_bytes ?? file.size,
                fileId: result.file_id,
              }
            }),
          )
          const composer = snapshotHeroComposer()
          setEntryUploading(false)
          enterChatWithContent({
            text: composer.text,
            files: mergeComposerFiles(composer.files, uploaded),
            voices: composer.voices,
          })
        } catch (err) {
          setEntryUploading(false)
          if (err instanceof ApiError && err.handled) return
          toast(err instanceof ApiError ? err.message : "上传失败，请稍后重试")
        }
      })()
    }
    authGateRef.current?.withAuth("materialUpload", submitMaterials)
  }
  const hasHeroContent = () => {
    const v = heroInput.trim()
    const readyFiles = heroFiles.some((f) => f.status === "success")
    return !!(v || readyFiles || heroVoices.length)
  }
  /** 上方入口：有上传失败 / 上传中时不允许发送 */
  const canHeroSend = () => {
    if (heroFiles.some((f) => f.status === "error" || f.status === "uploading")) return false
    return hasHeroContent()
  }
  const heroSendDisabled = !canHeroSend()
  const heroSubmit = () => {
    if (heroFiles.some((f) => f.status === "uploading")) {
      toast("文件上传中，请稍候")
      return
    }
    if (heroFiles.some((f) => f.status === "error")) return
    if (!hasHeroContent()) return
    authGateRef.current?.withAuth("heroSubmit", heroSubmitCore)
  }

  /* ---------- 对话 ---------- */
  const onChatChange = (e) => {
    setChatInput(e.target.value)
    const el = e.target
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }
  const onChatKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      chatSend()
    }
  }
  const hasChatContent = () => {
    const v = chatInput.trim()
    const readyFiles = heroFiles.some((f) => f.status === "success")
    return !!(v || readyFiles || heroVoices.length)
  }
  const canChatSend = () => {
    if (chatStreaming) return false
    if (heroFiles.some((f) => f.status === "error" || f.status === "uploading")) return false
    return hasChatContent()
  }
  const chatSendDisabled = !canChatSend()
  const chatSend = () => {
    if (!canChatSend()) {
      if (heroFiles.some((f) => f.status === "uploading")) {
        toast("文件上传中，请稍候")
      }
      return
    }

    // 未登录：先弹登录，消息不入会话；登录成功后再发出
    const v = chatInput.trim()
    const files = heroFiles
      .filter((f) => f.status === "success")
      .map((f) => ({
        name: f.name,
        size: f.size,
        fileId: f.fileId,
      }))
    const voices = heroVoices.map((voice) => ({
      id: voice.id,
      url: voice.url,
      duration: voice.duration,
      bars: voice.bars,
    }))

    const doSend = () => {
      stopHeroVoiceRecording(true)
      setChat((c) => [
        ...c,
        {
          role: "user",
          text: v,
          files,
          voices,
          at: Date.now(),
        },
      ])
      setChatInput("")
      setHeroFiles([])
      setHeroVoices([])
      if (chatInputRef.current) {
        chatInputRef.current.style.height = "auto"
      }
      const fileIds = files.map((f) => f.fileId).filter(Boolean)
      void sendChatMessage(buildAgentChatMessage(v, files), fileIds)
    }

    authGateRef.current?.withAuth("chatSend", doSend)
  }
  /** 建议按钮卡：点击后把文案作为用户消息发出 */
  const sendSuggestedPrompt = (text) => {
    const v = String(text || "").trim()
    if (!v || chatStreaming) return
    const doSend = () => {
      setChat((c) => [
        ...c,
        {
          role: "user",
          text: v,
          files: [],
          voices: [],
          at: Date.now(),
        },
      ])
      void sendChatMessage(buildAgentChatMessage(v, []), [])
    }
    authGateRef.current?.withAuth("chatSend", doSend)
  }
  const generateResume = () => {
    if (!isLoggedIn) openAuth("chat")
    else doGenerate()
  }
  const doGenerate = () => {
    setChatStage("generating")
    clearTimeout(timers.current.gen)
    timers.current.gen = setTimeout(() => setChatStage("done"), 1600)
  }
  const enterEditor = () => navigate("/console")
  const openWorkbench = () => {
    authGateRef.current?.withAuth("console", () => navigate("/console"))
  }

  const openPersonalCenter = () => {
    setUserMenuOpen(false)
    navigate("/personal")
  }

  const handleLogout = async () => {
    setUserMenuOpen(false)
    try {
      await logout(refreshToken)
      clearSession()
      toast("已退出登录")
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "退出登录失败，请稍后重试"
      toast(msg)
    }
  }

  const gotoLanding = () => {
    chatAbortRef.current?.abort()
    chatSessionIdRef.current = ""
    setChatStreaming(false)
    setChat([INTRO_MSG])
    setChatStage("intro")
    navigate("/")
    setScreen("landing")
    setModalOpen(false)
  }

  /* ================= 派生展示值 ================= */
  const isFull = screen === "fullAuth"
  const authVisible = modalOpen || isFull
  const isModal = modalOpen ? true : !isFull

  const stepMethod = step === "method"
  const stepSetpw = step === "setpw"
  const showBack = step === "setpw"
  const showHome = isFull && step === "method"
  const showClose = isModal && step === "method"

  const isAccountTab = tab === "account"
  const isWechatTab = tab === "wechat"
  const codeBtnLabel = sendingCode ? "发送中…" : countdown > 0 ? countdown + "s 后重发" : "获取验证码"
  const codeReady = !!(account.trim() && code.trim())

  const chatRows = chat.map((m) => {
    const loadingText = (m.loadingText || "").trim()
    const files = m.files || []
    const voices = m.voices || []
    const text = m.text || ""
    const hasText = !!text.trim()
    const hasProfile = !!m.profile
    const hasInfoCard = !!m.infoCard
    const hasMiniResumeCard = !!m.miniResumeCard
    const hasButtonCard = !!m.buttonCard
    const hasCard = hasProfile || hasInfoCard || hasMiniResumeCard || hasButtonCard
    const segments = m.role === "ai" ? ensureAiSegments(m) : []
    const loading = m.role === "ai" && !!loadingText && !hasText && !hasCard
    const thinking = m.role === "ai" && !!m.streaming && !hasText && !loading && !hasCard
    const statusLoading = loading || thinking
    const statusText = loadingText || CHAT_LOADING_STATUS_DEFAULT_TEXT
    const filesOnly = m.role === "user" && !hasText && files.length > 0 && voices.length === 0
    const withMedia = m.role === "user" && hasText && (files.length > 0 || voices.length > 0)
    return {
      role: m.role,
      text,
      loadingText: statusText,
      loading: statusLoading,
      streaming: !!m.streaming,
      thinking,
      profile: m.profile || null,
      infoCard: m.infoCard || null,
      miniResumeCard: m.miniResumeCard || null,
      buttonCard: m.buttonCard || null,
      segments,
      files,
      voices,
      rowClass:
        "chat-row" +
        (m.role === "user" ? " is-user" : " is-ai") +
        (statusLoading ? " is-thinking" : ""),
      bubbleClass:
        "chat-bubble" +
        (m.role === "user" ? " is-user" : " is-ai") +
        (statusLoading ? " is-thinking is-loading" : "") +
        (filesOnly ? " is-files-only" : "") +
        (withMedia ? " is-with-media" : ""),
    }
  })

  return (
    <AuthGateProvider ref={authGateRef} onRequireAuth={openAuth}>
    <div className="magic-landing">
      <input
        ref={heroFileInputRef}
        type="file"
        multiple
        accept={HERO_FILE_ACCEPT}
        className="ld-extra-0"
        onChange={handleHeroFiles}
      />

      {/* ===================== LANDING ===================== */}
      {showLanding && (
        <div className="ld-150">
          {/* 整页底色：Figma 424:46，铺满含顶栏/底边，非局部白底 */}
          <div aria-hidden="true" className="ld-137">
            <img src={landingBg} alt="" className="ld-bg-img" />
          </div>

          {/* header — Figma 424:50 */}
          <header className="ld-149">
            <div className="ld-148">
              <span className="ld-logo" aria-hidden />
              <span className="ld-147">不写简历</span>
              <button type="button" className="ld-nav-pill">
                <img src={landingBuddyIcon} alt="" width={16} height={16} />
                求职搭子
              </button>
              <E as="button" className="ld-nav-pill" onClick={() => navigate("/surprise")}>
                <img src={landingSurpriseIcon} alt="" width={16} height={16} />
                惊喜
              </E>
            </div>
            {isLoggedIn ? (
              <div className="ld-139">
                <E as="button" className="ld-workbench" onClick={openWorkbench}>
                  <img src={landingWorkbenchIcon} alt="" width={16} height={16} />
                  简历工作台
                </E>
                <div ref={userMenuRef} className="ld-145">
                  <button
                    type="button"
                    className="ld-144"
                    onClick={() => setUserMenuOpen((v) => !v)}
                  >
                    <div className="ld-143">{user?.nickname?.slice(0, 1) || "你"}</div>
                    <span className="ld-142">{user?.nickname || "用户"}</span>
                    <ChevronDownIcon color={userMenuOpen ? "#1c5d5f" : "#7f9393"} />
                  </button>
                  {userMenuOpen && (
                    <div className="ld-141">
                      <div className="ld-140">
                        <button type="button" className="user-menu-item" onClick={openPersonalCenter}>
                          个人中心
                        </button>
                        <button type="button" className="user-menu-item danger" onClick={handleLogout}>
                          退出登录
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="ld-139">
                <E as="button" className="ld-workbench" onClick={openWorkbench}>
                  <img src={landingWorkbenchIcon} alt="" width={16} height={16} />
                  简历工作台
                </E>
                <E as="button" className="ld-179" onClick={openAuthLogin}>
                  <img src={landingLoginIcon} alt="" width={16} height={16} />
                  登录
                </E>
                <E as="button" className="ld-178" onClick={openAuthCreate}>免费注册</E>
              </div>
            )}
          </header>

          {/* home / 落地页 — Figma 424:45 */}
          <main className="ld-138">
            <div className="ld-130">
              <h1 className="ld-128">
                <span className="ld-128-plain">不止简历，解决一切</span>
                <span className="ld-127">求职卡点</span>
                <img src={landingTitleUnderline} alt="" className="ld-title-underline" />
              </h1>
              <div className="ld-126-wrap">
                <p className="ld-126">
                  告诉我你的目标与困惑，从职业探索到拿下 offer，一步一步陪你完成
                </p>
                <p className="ld-126">告诉我你的目标与困惑，从职业探索到拿下 offer</p>
              </div>
            </div>

            {/* 目标胶囊 */}
            <div className="ld-125">
              <div className="ld-124">
                {[
                  { key: "explore", label: "职业探索" },
                  { key: "revise", label: "简历优化" },
                  { key: "generate", label: "生成简历" },
                ].map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    className={"ld-goal-tab" + (heroGoal === g.key ? " is-active" : "")}
                    onClick={() => {
                      if (heroGoal === g.key) return
                      stopHeroVoiceRecording(true)
                      setHeroVoices((prev) => {
                        clearHeroVoices(prev)
                        return []
                      })
                      setHeroGoal(g.key)
                      setHeroInput(
                        heroIdentity === "student"
                          ? HERO_DEFAULT_INPUT
                          : formatHeroIdentity(heroIdentity),
                      )
                      setHeroFiles([])
                    }}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 输入卡 — Figma 424:94 */}
            <div className="ld-123">
              <div className="ld-122">
                <div className="ld-121">
                  <span className="ld-120">
                    <span className="ld-119" />求职助手在线
                  </span>
                </div>
                <textarea
                  value={heroInput}
                  onChange={onHeroChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      heroSubmit()
                    }
                  }}
                  placeholder={HERO_DEFAULT_INPUT}
                  className="ld-118"
                />
                {(heroFiles.length > 0 || heroVoices.length > 0) && (
                  <div className="ld-115">
                    {heroVoices.map((voice) => (
                      <VoiceClipRow
                        key={voice.id}
                        clip={voice}
                        playing={voicePlayingId === voice.id}
                        onPlay={playVoiceClip}
                        onRemove={removeHeroVoice}
                      />
                    ))}
                    <ComposerFileRail files={heroFiles} onRemove={removeHeroFile} />
                  </div>
                )}
                <div className="ld-111">
                  <div className="ld-id-row">
                    {[
                      { key: "student", label: "应届生" },
                      { key: "intern", label: "实习生" },
                      { key: "pro", label: "职场人" },
                    ].map((it) => (
                      <button
                        key={it.key}
                        type="button"
                        className={"ld-id-chip" + (heroIdentity === it.key ? " is-active" : "")}
                        onClick={() => {
                          setHeroIdentity(it.key)
                          setHeroInput((v) => applyHeroIdentity(v, it.key))
                        }}
                      >
                        {it.label}
                      </button>
                    ))}
                  </div>
                  <RequireAuthAction returnTo="heroSubmit" shouldRun={canHeroSend} onAuthorized={heroSubmitCore}>
                    <E
                      as="button"
                      className={"ld-176" + (heroSendDisabled ? " is-disabled" : "")}
                      title={
                        heroFiles.some((f) => f.status === "error")
                          ? "有文件上传失败，请移除后重试"
                          : "发送"
                      }
                      disabled={heroSendDisabled}
                      aria-disabled={heroSendDisabled}
                    >
                      <img src={landingSendIcon} alt="" width={18} height={18} />
                    </E>
                  </RequireAuthAction>
                </div>
              </div>
            </div>

            {/* 提示词 — Figma 424:112：首行标签+2芯片，次行居中 1 芯片 */}
            <div className="ld-109">
              <div className="ld-109-row">
                <span className="ld-108">大家都在问</span>
                {HERO_GOAL_PROMPTS[heroGoal].slice(0, 2).map((p) => (
                  <E
                    key={p}
                    as="button"
                    className="ld-175"
                    onClick={() => addPrompt(p)}
                  >
                    <span>{p}</span>
                    <span className="ld-175-plus">+</span>
                  </E>
                ))}
              </div>
              {HERO_GOAL_PROMPTS[heroGoal].length > 2 ? (
                <div className="ld-109-row is-center">
                  {HERO_GOAL_PROMPTS[heroGoal].slice(2).map((p) => (
                    <E
                      key={p}
                      as="button"
                      className="ld-175"
                      onClick={() => addPrompt(p)}
                    >
                      <span>{p}</span>
                      <span className="ld-175-plus">+</span>
                    </E>
                  ))}
                </div>
              ) : null}
            </div>

            {/* 双卡入口 — Figma 424:123，无中间分割文案 */}
            <div className="ld-104">
              <input
                ref={resumeUploadInputRef}
                type="file"
                accept={RESUME_FILE_ACCEPT}
                className="ld-extra-1"
                onChange={handleResumeUpload}
              />
              <E as="button" className="ld-174" onClick={openResumeUploadPicker}>
                  <span className="ld-103">
                    <img src={landingUploadIcon} alt="" width={22} height={22} />
                  </span>
                  <span className="ld-101">
                    <span className="ld-100">已有简历，直接优化</span>
                    <span className="ld-99">上传现有简历，快速获得针对性建议</span>
                  </span>
                </E>
              <input
                ref={materialUploadInputRef}
                type="file"
                multiple
                accept={MATERIAL_FILE_ACCEPT}
                className="ld-extra-2"
                onChange={handleMaterialUpload}
              />
              <E as="button" className="ld-173" onClick={openMaterialUploadPicker}>
                  <span className="ld-102">
                    <img src={landingPiecesIcon} alt="" width={22} height={22} />
                  </span>
                  <span className="ld-101">
                    <span className="ld-100">只有零散材料，帮我拼</span>
                    <span className="ld-99">导入项目与经历，自动梳理成简历框架</span>
                  </span>
                </E>
            </div>
          </main>
        </div>
      )}

      {/* ===================== CHAT ===================== */}
      {isChat && (
        <div className="ld-extra-3 chat-page">
          <header className="chat-page__header">
            <div className="chat-page__header-left">
              <E
                as="button"
                className="chat-page__back"
                onClick={gotoLanding}
                aria-label="返回首页"
              >
                <span className="chat-page__back-icon">
                  <img src={chatBackArrow} alt="" width={18} height={18} />
                </span>
              </E>
              <div className="chat-page__avatar" aria-hidden>
                AI
              </div>
              <div className="chat-page__identity">
                <div className="chat-page__name">简历助手</div>
                <div className="chat-page__meta">
                  <span className="chat-page__online-dot" />
                  <span className="chat-page__online">Online</span>
                  <span className="chat-page__meta-sep">·</span>
                  <span className="chat-page__subtitle">随时为你生成专业简历</span>
                </div>
              </div>
            </div>
          </header>

          <div
            ref={chatScrollRef}
            className="chat-scroll ld-94 chat-page__messages"
          >
            <div className="chat-page__thread">
              {chatRows.map((m, i) => {
                const isLastMessage = i === chatRows.length - 1
                const cardActionsDisabled = !isLastMessage || chatStreaming
                return (
                <div key={i} className={m.rowClass}>
                  <div className={m.bubbleClass}>
                    {m.loading ? (
                      <ChatLoadingStatus text={m.loadingText} />
                    ) : (
                      <>
                        {m.files.length > 0 && (
                          <div className="chat-bubble__files">
                            {m.files.map((f) => (
                              <ChatFileCard key={`${f.name}-${f.size}`} file={f} />
                            ))}
                          </div>
                        )}
                        {m.role === "ai" ? (
                          (m.segments || []).map((seg, segIdx) => {
                            if (!seg) return null
                            if (seg.kind === "text") {
                              const content = String(seg.text || "")
                              if (!content.trim()) return null
                              return <ChatTextCard key={`seg-text-${segIdx}`} content={content} />
                            }
                            if (seg.kind === "mini_resume_card") {
                              return (
                                <ChatMiniResumeCard
                                  key={`seg-mini-${segIdx}`}
                                  data={buildChatMiniResumeCardData(seg.data) || undefined}
                                  disabled={cardActionsDisabled}
                                  onAction={() => {
                                    navigate("/surprise")
                                  }}
                                />
                              )
                            }
                            if (seg.kind === "info_card") {
                              return (
                                <ChatInfoCard
                                  key={`seg-info-${segIdx}`}
                                  data={buildChatInfoCardData(seg.data) || undefined}
                                  disabled={cardActionsDisabled}
                                  sessionId={() =>
                                    String(
                                      chatSessionIdRef.current ||
                                        parseChatSessionIdFromPath(location.pathname) ||
                                        "",
                                    ).trim()
                                  }
                                  onSaved={(payload) => {
                                    setChat((c) => {
                                      const next = [...c]
                                      if (i >= 0 && i < next.length && next[i]?.role === "ai") {
                                        const prevCard =
                                          typeof next[i].infoCard === "object" && next[i].infoCard
                                            ? (next[i].infoCard as Record<string, unknown>)
                                            : {}
                                        const merged = {
                                          ...prevCard,
                                          ...payload,
                                          card_id: payload.card_id ?? prevCard.card_id,
                                        }
                                        const segments = ensureAiSegments(next[i]).map((s) =>
                                          s?.kind === "info_card"
                                            ? {
                                                kind: "info_card",
                                                data: {
                                                  ...(typeof s.data === "object" && s.data
                                                    ? (s.data as Record<string, unknown>)
                                                    : {}),
                                                  ...merged,
                                                },
                                              }
                                            : s,
                                        )
                                        next[i] = {
                                          ...next[i],
                                          infoCard: merged,
                                          segments,
                                        }
                                      }
                                      return next
                                    })
                                    toast("已保存")
                                  }}
                                  onSaveError={(err) => {
                                    toast(err.message || "保存失败，请稍后重试")
                                  }}
                                />
                              )
                            }
                            if (seg.kind === "button_card") {
                              return (
                                <ChatButtonCard
                                  key={`seg-btn-${segIdx}`}
                                  data={buildChatButtonCardData(seg.data) || undefined}
                                  disabled={cardActionsDisabled}
                                  onButtonClick={(button) => {
                                    sendSuggestedPrompt(button.text)
                                  }}
                                />
                              )
                            }
                            if (seg.kind === "profile_card") {
                              return (
                                <ChatProfileCard
                                  key={`seg-profile-${segIdx}`}
                                  data={buildChatProfileCardData(seg.data)}
                                />
                              )
                            }
                            return null
                          })
                        ) : m.text ? (
                          <div className={"chat-bubble__text" + (m.files.length ? " has-prev" : "")}>{m.text}</div>
                        ) : null}
                        {m.voices.length > 0 && (
                          <div className={"chat-bubble__voices" + (m.text || m.files.length ? " has-prev" : "")}>
                            {m.voices.map((voice) => (
                              <VoiceClipRow
                                key={voice.id}
                                clip={voice}
                                tone="chat"
                                playing={voicePlayingId === voice.id}
                                onPlay={playVoiceClip}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                )
              })}

              {chatStage === "generating" && (
                <div className="ld-91">
                  <div className="ld-90">
                    <div className="ld-89" />
                    <span className="ld-88">正在为你生成简历…</span>
                  </div>
                </div>
              )}

              {chatStage === "done" && (
                <div className="ld-87">
                  <div className="ld-86">🎉 简历已生成</div>
                  <div className="ld-85">
                    <div className="ld-84" />
                    <div className="ld-83" />
                    <div className="ld-82" />
                    <div className="ld-81" />
                    <div className="ld-80" />
                    <div className="ld-79" />
                  </div>
                  <div className="ld-78">
                    <E as="button" className="ld-171" onClick={enterEditor}>进入编辑器</E>
                    <button className="ld-77" onClick={() => toast("开始下载 PDF（原型示意）")}>下载 PDF</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="chat-page__composer-wrap">
            <div className="chat-page__composer-inner">
              {chatStage === "ready" && (
                <E as="button" className="ld-170 chat-page__generate" onClick={generateResume}>✨ 生成我的简历</E>
              )}
              {(chatStage === "intro" || chatStage === "ready") && (
                <div className="chat-composer">
                  {heroRecording && (
                    <div className="ld-74">
                      <span className="ld-73">
                        <span className="ld-72" />
                        录音中 {formatVoiceDuration(heroRecording.duration)}
                      </span>
                      <VoiceWaveBar bars={heroRecording.bars} color="#ff6b6b" height={22} animate />
                      <button
                        type="button"
                        onClick={() => stopHeroVoiceRecording(false)}
                        className="ld-71"
                      >
                        完成
                      </button>
                    </div>
                  )}
                  {(heroFiles.length > 0 || heroVoices.length > 0) && (
                    <div className="ld-70">
                      {heroVoices.map((voice) => (
                        <VoiceClipRow
                          key={voice.id}
                          clip={voice}
                          playing={voicePlayingId === voice.id}
                          onPlay={playVoiceClip}
                          onRemove={removeHeroVoice}
                        />
                      ))}
                      <ComposerFileRail files={heroFiles} onRemove={removeHeroFile} />
                    </div>
                  )}
                  <textarea
                    ref={chatInputRef}
                    value={chatInput}
                    onChange={onChatChange}
                    onKeyDown={onChatKey}
                    rows={1}
                    placeholder={chatStreaming ? "助手回复中，可先输入…" : "告诉我你的信息，我来帮你生成简历…"}
                    className="chat-composer__input"
                  />
                  <div className="chat-composer__toolbar">
                    <span className="upload-tip">
                      <E
                        as="button"
                        className="chat-composer__tool-btn"
                        aria-label="添加材料"
                        onClick={openHeroFilePicker}
                      >
                        <span className="chat-composer__tool-icon">
                          <img src={chatComposerPlus} alt="" width={14} height={14} />
                        </span>
                      </E>
                      <span className="upload-tip__bubble" role="tooltip">
                        {HERO_FILE_UPLOAD_TIP}
                      </span>
                    </span>
                    <div className="chat-composer__toolbar-right">
                      <span className="chat-composer__hint">Enter 发送</span>
                      <E
                        as="button"
                        className={"chat-composer__tool-btn" + (heroRecording ? " is-recording" : "")}
                        title={heroRecording ? "点击结束录音" : "语音输入"}
                        onClick={toggleHeroVoiceRecord}
                      >
                        <span className="chat-composer__tool-icon">
                          <img src={chatComposerDash} alt="" width={14} height={14} />
                        </span>
                      </E>
                      <E
                        as="button"
                        className={
                          "chat-composer__send" + (chatSendDisabled ? " is-disabled" : "")
                        }
                        title={
                          heroFiles.some((f) => f.status === "error")
                            ? "有文件上传失败，请移除后重试"
                            : "发送"
                        }
                        disabled={chatSendDisabled}
                        aria-disabled={chatSendDisabled}
                        onClick={chatSend}
                      >
                        <span className="chat-composer__send-icon">
                          <img src={chatComposerSend} alt="" width={13} height={13} />
                        </span>
                      </E>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== AUTH — Figma 424:247 / 424:424 / 424:601 ===================== */}
      {authVisible && (
        <div
          className={"auth-modal-root" + (isModal ? " is-modal" : " is-full")}
          onClick={onBackdrop}
        >
          <div className="auth-modal" onClick={stopProp}>
            {/* LEFT — Sidebar */}
            <aside className="auth-modal__side" aria-hidden={false}>
              <div className="auth-modal__side-deco auth-modal__side-deco--ring" />
              <div className="auth-modal__side-deco auth-modal__side-deco--blob" />
              <div className="auth-modal__brand">
                <span className="auth-modal__brand-mark">
                  <img src={authSparkleWhite} alt="" width={20} height={20} />
                </span>
                <span className="auth-modal__brand-name">不写简历</span>
              </div>
              <div className="auth-modal__side-copy">
                <p className="auth-modal__eyebrow">AI 求职搭子</p>
                <h2 className="auth-modal__side-title">
                  几分钟，
                  <br />
                  解决你的
                  <br />
                  求职卡点。
                </h2>
                <p className="auth-modal__side-desc">
                  登录即继续，让每一次选择都有清晰的下一步。
                </p>
              </div>
              <div className="auth-modal__quote">
                <span className="auth-modal__quote-mark">
                  <img src={authSparkleTealSm} alt="" width={16} height={16} />
                </span>
                <span className="auth-modal__quote-text">
                  “把复杂的求职问题，变成一件件小事。”
                </span>
              </div>
            </aside>

            {/* RIGHT — Form */}
            <section className="auth-modal__panel">
              {(showBack || showHome) && (
                <div className="auth-modal__nav-row">
                  {showBack && (
                    <E as="button" className="auth-modal__text-nav" onClick={backToMethod}>
                      ‹ 返回
                    </E>
                  )}
                  {showHome && (
                    <E as="button" className="auth-modal__text-nav" onClick={gotoLanding}>
                      ‹ 返回首页
                    </E>
                  )}
                </div>
              )}
              {showClose && (
                <E as="button" className="auth-modal__close" onClick={closeAuth} aria-label="关闭">
                  <img src={authCloseIcon} alt="" width={20} height={20} />
                </E>
              )}

              {stepMethod && (
                <div className="auth-modal__body">
                  <div className="auth-modal__head">
                    <h2 className="auth-modal__title">
                      登录不写简历
                      <img
                        className="auth-modal__title-icon"
                        src={authSparkleTeal}
                        alt=""
                        width={20}
                        height={20}
                      />
                    </h2>
                    <p className="auth-modal__sub">登录即注册，首次登录将自动创建账号</p>
                  </div>

                  <div className="auth-modal__seg" role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={isAccountTab}
                      className={"auth-modal__seg-btn" + (isAccountTab ? " is-active" : "")}
                      onClick={setTabAccount}
                    >
                      账号登录
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={isWechatTab}
                      className={"auth-modal__seg-btn" + (isWechatTab ? " is-active" : "")}
                      onClick={setTabWechat}
                    >
                      微信登录
                    </button>
                  </div>

                  {isAccountTab && (
                    <div className="auth-modal__account">
                      <div className="auth-modal__modes">
                        <button
                          type="button"
                          className={"auth-modal__mode" + (loginMode === "code" ? " is-active" : "")}
                          onClick={setModeCode}
                        >
                          验证码登录
                        </button>
                        <button
                          type="button"
                          className={
                            "auth-modal__mode" + (loginMode === "password" ? " is-active" : "")
                          }
                          onClick={setModePassword}
                        >
                          密码登录
                        </button>
                      </div>

                      <div className={"auth-modal__field" + (accountError ? " is-error" : "")}>
                        <input
                          value={account}
                          onChange={onAccountChange}
                          onBlur={onAccountBlur}
                          placeholder="请输入手机号 / 邮箱"
                          className="auth-modal__input"
                        />
                      </div>
                      {accountError && <div className="auth-modal__error">{accountError}</div>}

                      {loginMode === "code" && (
                        <>
                          <div className="auth-modal__field auth-modal__field--code">
                            <input
                              value={code}
                              onChange={onCodeChange}
                              placeholder="请输入验证码"
                              inputMode="numeric"
                              className="auth-modal__input"
                            />
                            <button
                              type="button"
                              className={
                                "auth-modal__code-btn" +
                                (countdown > 0 || sendingCode ? " is-wait" : "")
                              }
                              onClick={sendCode}
                            >
                              {codeBtnLabel}
                            </button>
                          </div>
                          {codeSent && (
                            <div className="auth-modal__hint">验证码已发送，请查收</div>
                          )}

                          <div
                            className={
                              "auth-modal__agree" + (agreeShake ? " is-shaking" : "")
                            }
                          >
                            <button
                              type="button"
                              className={
                                "auth-modal__check" + (agreed ? " is-on" : "")
                              }
                              onClick={toggleAgree}
                              aria-checked={agreed}
                              role="checkbox"
                            >
                              {agreed ? "✓" : ""}
                            </button>
                            <div className="auth-modal__agree-text">
                              我已阅读并同意
                              <button
                                type="button"
                                className="legal-link auth-modal__legal"
                                onClick={(e) => openLegal(e, "terms")}
                              >
                                《用户协议》
                              </button>
                              和
                              <button
                                type="button"
                                className="legal-link auth-modal__legal"
                                onClick={(e) => openLegal(e, "privacy")}
                              >
                                《隐私政策》
                              </button>
                            </div>
                          </div>

                          <E
                            as="button"
                            className={
                              "auth-modal__submit" +
                              (!codeReady || loggingIn ? " is-dim" : "")
                            }
                            onClick={submitAccount}
                          >
                            {loggingIn ? "登录中…" : "登录 / 注册"}
                            <span aria-hidden> →</span>
                          </E>
                        </>
                      )}

                      {loginMode === "password" && (
                        <>
                          <div className="auth-modal__field auth-modal__field--code">
                            <input
                              value={loginPw}
                              onChange={onLoginPw}
                              onKeyDown={onLoginPwKey}
                              type={showLoginPw ? "text" : "password"}
                              placeholder="请输入登录密码"
                              className="auth-modal__input"
                            />
                            <button
                              type="button"
                              className="auth-modal__code-btn"
                              onClick={toggleShowLoginPw}
                            >
                              {showLoginPw ? "隐藏" : "显示"}
                            </button>
                          </div>
                          {loginPwError && (
                            <div className="auth-modal__error">{loginPwError}</div>
                          )}
                          {pwNeedSwitch && (
                            <E
                              as="button"
                              className="auth-modal__link-btn"
                              onClick={switchToCodeFromPw}
                            >
                              切换验证码登录 →
                            </E>
                          )}
                          <div className="auth-modal__forgot-row">
                            <E as="button" className="auth-modal__forgot" onClick={forgotPw}>
                              忘记密码？
                            </E>
                          </div>
                          <E
                            as="button"
                            className={
                              "auth-modal__submit" + (loggingIn ? " is-dim" : "")
                            }
                            onClick={submitPassword}
                          >
                            {loggingIn ? "登录中…" : "登录"}
                            <span aria-hidden> →</span>
                          </E>
                        </>
                      )}
                    </div>
                  )}

                  {isWechatTab && (
                    <div className="auth-modal__wechat">
                      <button
                        type="button"
                        className="auth-modal__qr"
                        onClick={wechatScan}
                        title="模拟扫码成功"
                      >
                        <img src={authWechatQr} alt="微信登录二维码" width={180} height={180} />
                      </button>
                      <p className="auth-modal__wechat-tip">
                        打开微信扫一扫，立即登录 / 注册
                      </p>
                    </div>
                  )}

                  <div className="auth-modal__others">
                    <div className="auth-modal__others-line" />
                    <span className="auth-modal__others-label">其他登录方式</span>
                    <div className="auth-modal__others-line" />
                  </div>
                  <div className="auth-modal__apple-row">
                    <E as="button" className="auth-modal__apple" onClick={openApple} aria-label="Apple 登录">
                      <img src={authAppleIcon} alt="" width={24} height={24} />
                    </E>
                  </div>
                </div>
              )}

              {stepSetpw && (
                <div className="auth-modal__body auth-modal__body--setpw">
                  <div className="auth-modal__head">
                    <h2 className="auth-modal__title">设置登录密码</h2>
                    <p className="auth-modal__sub">方便下次用密码快速登录 —— 也可以稍后再说。</p>
                  </div>
                  <div className="auth-modal__field auth-modal__field--code">
                    <input
                      value={pw1}
                      onChange={onPw1}
                      type={showPw ? "text" : "password"}
                      placeholder="设置新密码（至少 8 位）"
                      className="auth-modal__input"
                    />
                    <button type="button" className="auth-modal__code-btn" onClick={toggleShowPw}>
                      {showPw ? "隐藏" : "显示"}
                    </button>
                  </div>
                  <div className="auth-modal__field">
                    <input
                      value={pw2}
                      onChange={onPw2}
                      type={showPw ? "text" : "password"}
                      placeholder="确认新密码"
                      className="auth-modal__input"
                    />
                  </div>
                  {pwError && <div className="auth-modal__error">{pwError}</div>}
                  <E
                    as="button"
                    className={"auth-modal__submit" + (settingPw ? " is-dim" : "")}
                    onClick={confirmPw}
                  >
                    {settingPw ? "提交中…" : "确认并进入"}
                    <span aria-hidden> →</span>
                  </E>
                  <div className="auth-modal__others">
                    <div className="auth-modal__others-line" />
                    <span className="auth-modal__others-label">或</span>
                    <div className="auth-modal__others-line" />
                  </div>
                  <E as="button" className="auth-modal__skip" onClick={skipPw}>
                    稍后在个人中心设置，先进去逛逛 →
                  </E>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* ===================== APPLE SHEET ===================== */}
      {appleOpen && (
        <div className="ld-9" onClick={closeApple}>
          <div onClick={stopProp} className="ld-8">
            <div className="ld-7">
              <AppleIcon size={34} />
              <div className="ld-6">使用 Apple ID 登录</div>
              <div className="ld-5">登录「Magic Resume」</div>
            </div>
            <div className="ld-4">
              <div className="ld-3">Apple ID（演示）</div>
              <div className="ld-2">密码</div>
              <E as="button" className="ld-161" onClick={appleConfirm}>继续</E>
              <button className="ld-1" onClick={closeApple}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== LEGAL MODAL ===================== */}
      <LegalModal docKey={legalDoc} onClose={closeLegal} />

      {/* ===================== TOAST ===================== */}
      {toastMsg && (
        <div className="ld-0">{toastMsg}</div>
      )}

      {entryUploading && (
        <div className="ld-upload-mask" role="status" aria-live="polite">
          <div className="ld-upload-mask__card">
            <span className="ld-upload-mask__spinner" aria-hidden />
            <span className="ld-upload-mask__text">上传中</span>
          </div>
        </div>
      )}

    </div>
    </AuthGateProvider>
  )
}
