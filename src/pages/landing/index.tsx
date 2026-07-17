// @ts-nocheck — 遗留大文件，待逐步补全类型
import React from "react"
import { useNavigate } from "react-router-dom"
import { ApiError, loginByPassword, logout, request, setUserPassword, streamAgentChat, buildAgentChatMessage, createAgentSessionId } from "@/api"
import { PersonalCenter } from "@/pages/personal"
import { AuthGateProvider, RequireAuthAction, ChatTextCard } from "@/components"
import { useAuth } from "@/store"
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

const SendIcon = ({ size = 19 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 12l16-8-6 8 6 8-16-8z" fill="#fff" />
  </svg>
)

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

/* ---- 「求职搭子」首页图标 & 吉祥物（还原自 index.html 原型） ---- */
const Mascot = ({ size = 98 }) => (
  <svg width={size} height={size} viewBox="0 0 104 104" fill="none">
    <path d="M48 21 C 43 7, 60 5, 52 20" stroke="#2fae70" strokeWidth="5" strokeLinecap="round" fill="none" />
    <rect x="16" y="22" width="72" height="60" rx="22" fill="#4fd08a" />
    <path d="M34 74 L23 94 L50 78 Z" fill="#4fd08a" />
    <ellipse cx="42" cy="49" rx="9.5" ry="11" fill="#fff" />
    <ellipse cx="66" cy="49" rx="9.5" ry="11" fill="#fff" />
    <circle cx="44.5" cy="51" r="4.8" fill="#123524" />
    <circle cx="68.5" cy="51" r="4.8" fill="#123524" />
    <circle cx="46" cy="49" r="1.7" fill="#fff" />
    <circle cx="70" cy="49" r="1.7" fill="#fff" />
    <path d="M46 65 Q52 72 61 65" stroke="#123524" strokeWidth="3.2" strokeLinecap="round" fill="none" />
    <ellipse cx="34" cy="60" rx="4.5" ry="3" fill="#ff9db8" opacity=".7" />
    <ellipse cx="75" cy="60" rx="4.5" ry="3" fill="#ff9db8" opacity=".7" />
  </svg>
)
const ArrowUpIcon = ({ size = 18, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
    <path fillRule="evenodd" d="M7.2 3.83 4.3 6.74a.9.9 0 1 1-1.27-1.27l4.34-4.35a.9.9 0 0 1 1.27 0l4.34 4.35a.9.9 0 1 1-1.27 1.27L8.8 3.83v9.47a.8.8 0 0 1-1.6 0V3.83Z" />
  </svg>
)
const MicIcon = ({ size = 17, color = "#7b61ff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="9" y="2" width="6" height="12" rx="3" fill={color} />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
)
const ClipIcon = ({ size = 17, color = "#7b61ff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M20 11.5 12 19.5a5 5 0 0 1-7-7l8-8a3.3 3.3 0 0 1 4.7 4.7l-8 8a1.6 1.6 0 0 1-2.3-2.3l7.3-7.3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const PlusMiniIcon = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
    <path fillRule="evenodd" d="M7.1 7.1V2.5a.9.9 0 0 1 1.8 0V7.1h4.6a.9.9 0 0 1 0 1.8H8.9v4.6a.9.9 0 0 1-1.8 0V8.9H2.5a.9.9 0 0 1 0-1.8H7.1Z" />
  </svg>
)
const UploadIcon = ({ size = 22, color = "#7b61ff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 15V4m0 0 4 4m-4-4-4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const PiecesIcon = ({ size = 22, color = "#1f8a57" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10v6H4V5.5ZM14 4h4.5A1.5 1.5 0 0 1 20 5.5V10h-6V4ZM4 14h6v6H5.5A1.5 1.5 0 0 1 4 18.5V14ZM14 14h6v4.5a1.5 1.5 0 0 1-1.5 1.5H14v-6Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
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
  generate: ["0 经验想转产品经理", "实习经历太单薄怎么写", "简历投了没回音"],
}

const HERO_IDENTITY_LABELS = {
  student: "大学生",
  intern: "实习生",
  pro: "职场人",
}

const HERO_IDENTITY_PREFIX_RE = /^我是(?:大学生|实习生|职场人)/

function formatHeroIdentity(identityKey) {
  return `我是${HERO_IDENTITY_LABELS[identityKey]}`
}

function applyHeroIdentity(input, identityKey) {
  const prefix = formatHeroIdentity(identityKey)
  const rest = input.replace(HERO_IDENTITY_PREFIX_RE, "").trim()
  return rest ? `${prefix} ${rest}` : prefix
}

const HERO_FILE_TYPES = [".pdf", ".doc", ".docx", ".txt", ".md", ".png", ".jpg", ".jpeg", ".webp"]
const HERO_FILE_ACCEPT = HERO_FILE_TYPES.join(",")
const RESUME_FILE_TYPES = [".pdf", ".doc", ".docx"]
const RESUME_FILE_ACCEPT = RESUME_FILE_TYPES.join(",")
const MATERIAL_FILE_TYPES = [".pdf", ".doc", ".docx", ".txt", ".md", ".png", ".jpg", ".jpeg", ".webp"]
const MATERIAL_FILE_ACCEPT = MATERIAL_FILE_TYPES.join(",")
const MATERIAL_FILE_MAX_COUNT = 5
const HERO_FILE_MAX_SIZE = 10 * 1024 * 1024
const HERO_FILE_MAX_COUNT = 5

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

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function createHeroFileItem(file) {
  return {
    id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    name: file.name,
    size: file.size,
  }
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
  text: "嗨，我是 Magic Resume 助手 ✦ 简单聊两句，我就能帮你生成简历。先说说你想投递什么岗位？",
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

/* 21x21 演示二维码点阵 */
function buildQr() {
  const N = 21
  const cells = []
  const inFinder = (r, c) =>
    (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7)
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      let on = false
      if (!inFinder(r, c)) on = (r * c + r * 5 + c * 3 + (r ^ c)) % 7 < 3
      cells.push({
        style:
          "width:100%;height:100%;border-radius:1px;background:" +
          (on ? "#1B1530" : "transparent"),
      })
    }
  }
  return cells
}
const QR_CELLS = buildQr()

export function LandingApp() {
  const navigate = useNavigate()
  const { isLoggedIn, setSession, user, clearSession, refreshToken } = useAuth()

  const [screen, setScreen] = useState("landing") // landing | chat | fullAuth
  const [modalOpen, setModalOpen] = useState(false)
  const [authReturn, setAuthReturn] = useState("landing") // landing | chat
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
  const [personalOpen, setPersonalOpen] = useState(false)
  const [appleOpen, setAppleOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState("")

  const [heroInput, setHeroInput] = useState(() => formatHeroIdentity("student"))
  const [heroGoal, setHeroGoal] = useState("generate") // explore | revise | generate
  const [heroIdentity, setHeroIdentity] = useState("student") // student | intern | pro
  const [heroFiles, setHeroFiles] = useState([])
  const [heroVoices, setHeroVoices] = useState([])
  const [heroRecording, setHeroRecording] = useState(null)
  const [voicePlayingId, setVoicePlayingId] = useState(null)
  const [chatInput, setChatInput] = useState("")
  const [chatStage, setChatStage] = useState("intro") // intro | ready | generating | done
  const [chatStreaming, setChatStreaming] = useState(false)
  const [chat, setChat] = useState([INTRO_MSG])

  // 让锁定倒计时每秒刷新
  const timers = useRef({})
  const userMenuRef = useRef(null)
  const authGateRef = useRef(null)
  const heroFileInputRef = useRef(null)
  const chatInputRef = useRef(null)
  const chatScrollRef = useRef(null)
  const resumeUploadInputRef = useRef(null)
  const materialUploadInputRef = useRef(null)
  const chatSessionIdRef = useRef("")
  const chatAbortRef = useRef(null)
  const heroVoiceRecorderRef = useRef(null)
  const heroVoiceAudioRef = useRef(null)
  const heroVoicesRef = useRef(heroVoices)
  heroVoicesRef.current = heroVoices
  useEffect(() => {
    const t = timers.current
    return () => {
      clearInterval(t.countdown)
      clearTimeout(t.toast)
      clearTimeout(t.gen)
      chatAbortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (screen !== "chat") return
    const el = chatScrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [screen, chat, chatStage, chatStreaming])

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
  const closeAuth = () => {
    if (screen === "fullAuth") setScreen("landing")
    else setModalOpen(false)
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
    if (!agreed) {
      nudgeAgree()
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
    if (!agreed) {
      nudgeAgree()
      return
    }
    proceedAuth()
  }
  const openApple = () => {
    if (!agreed) {
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

    if (authGateRef.current?.resumePendingAction(ret)) {
      toast("登录成功，欢迎来到 Magic Resume 🎉")
      resetAuthFields()
      return
    }

    if (ret === "chat") {
      setScreen("chat")
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
  const openHeroFilePicker = () => heroFileInputRef.current?.click()
  const handleHeroFiles = (e) => {
    const picked = Array.from(e.target.files || [])
    e.target.value = ""
    if (!picked.length) return

    setHeroFiles((prev) => {
      const next = [...prev]
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
          toast(`${file.name} 超过 10MB`)
          continue
        }
        if (next.some((item) => item.name === file.name && item.size === file.size)) continue
        next.push(createHeroFileItem(file))
      }
      return next
    })
  }
  const removeHeroFile = (id) => setHeroFiles((files) => files.filter((f) => f.id !== id))

  const sendChatMessage = useCallback(
    async (message) => {
      const trimmed = message.trim()
      if (!trimmed) return

      const userId = user?.id
      if (!userId) {
        toast("请先登录后再对话")
        return
      }

      if (!chatSessionIdRef.current) {
        chatSessionIdRef.current = createAgentSessionId()
      }

      chatAbortRef.current?.abort()
      const ac = new AbortController()
      chatAbortRef.current = ac
      setChatStreaming(true)

      let aiText = ""
      setChat((c) => [...c, { role: "ai", text: "", streaming: true }])

      const patchAiText = (text) => {
        aiText = text
        setChat((c) => {
          const next = [...c]
          for (let i = next.length - 1; i >= 0; i--) {
            if (next[i].role === "ai" && next[i].streaming) {
              next[i] = { ...next[i], text: aiText }
              break
            }
          }
          return next
        })
      }

      const finishAi = (readyGenerate) => {
        setChat((c) => {
          const next = [...c]
          for (let i = next.length - 1; i >= 0; i--) {
            if (next[i].role === "ai" && next[i].streaming) {
              if (!aiText) next.splice(i, 1)
              else next[i] = { role: "ai", text: aiText, streaming: false }
              break
            }
          }
          return next
        })
        setChatStage(readyGenerate ? "ready" : "intro")
        setChatStreaming(false)
      }

      let doneReceived = false

      try {
        await streamAgentChat(
          {
            user_id: String(userId),
            session_id: chatSessionIdRef.current,
            message: trimmed,
            workflow: "career_explore",
            stream_output: true,
          },
          {
            onDelta: (delta) => patchAiText(aiText + delta),
            onFull: (text) => patchAiText(text),
            onDone: (ev) => {
              doneReceived = true
              if (ev.session_id) chatSessionIdRef.current = ev.session_id
              finishAi(!!ev.ready_generate)
            },
            onError: (err) => toast(err.message || "对话失败，请稍后重试"),
          },
          ac.signal,
        )
        if (!ac.signal.aborted && !doneReceived) finishAi(false)
      } catch (err) {
        if (ac.signal.aborted) return
        const msg = err instanceof ApiError ? err.message : "对话失败，请稍后重试"
        toast(msg)
        finishAi(false)
      }
    },
    [heroGoal, toast, user?.id],
  )

  const enterChatWithContent = ({ text = "", files = [], voices = [] }) => {
    stopHeroVoiceRecording(true)
    setScreen("chat")
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
      },
    ])
    setChatStage("intro")
    void sendChatMessage(buildAgentChatMessage(text, files))
  }
  const heroSubmitCore = () => {
    enterChatWithContent({
      text: heroInput.trim(),
      files: heroFiles.map((f) => ({ name: f.name, size: f.size })),
      voices: heroVoices.map((voice) => ({
        id: voice.id,
        url: voice.url,
        duration: voice.duration,
        bars: voice.bars,
      })),
    })
  }
  const openResumeUploadPicker = () => resumeUploadInputRef.current?.click()
  const handleResumeUpload = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (!isResumeFileAllowed(file)) {
      toast("请上传 PDF 或 Word 格式的简历")
      return
    }
    if (file.size > HERO_FILE_MAX_SIZE) {
      toast(`${file.name} 超过 10MB`)
      return
    }
    const submitResume = () =>
      enterChatWithContent({
        text: "",
        files: [{ name: file.name, size: file.size }],
      })
    authGateRef.current?.withAuth("resumeUpload", submitResume)
  }
  const openMaterialUploadPicker = () => materialUploadInputRef.current?.click()
  const handleMaterialUpload = (e) => {
    const picked = Array.from(e.target.files || [])
    e.target.value = ""
    if (!picked.length) return

    const files = []
    for (const file of picked) {
      if (files.length >= MATERIAL_FILE_MAX_COUNT) {
        toast(`最多上传 ${MATERIAL_FILE_MAX_COUNT} 个文件`)
        break
      }
      if (!isMaterialFileAllowed(file)) {
        toast(`${file.name} 格式不支持`)
        continue
      }
      if (file.size > HERO_FILE_MAX_SIZE) {
        toast(`${file.name} 超过 10MB`)
        continue
      }
      if (files.some((item) => item.name === file.name && item.size === file.size)) continue
      files.push({ name: file.name, size: file.size })
    }
    if (!files.length) return

    const submitMaterials = () =>
      enterChatWithContent({
        text: "",
        files,
      })
    authGateRef.current?.withAuth("materialUpload", submitMaterials)
  }
  const hasHeroContent = () => {
    const v = heroInput.trim()
    return !!(v || heroFiles.length || heroVoices.length)
  }
  const heroSubmit = () => {
    if (!hasHeroContent()) return
    authGateRef.current?.withAuth("heroSubmit", heroSubmitCore)
  }

  /* ---------- 对话 ---------- */
  const onChatChange = (e) => {
    setChatInput(e.target.value)
    const el = e.target
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 44)}px`
  }
  const onChatKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      chatSend()
    }
  }
  const hasChatContent = () => {
    const v = chatInput.trim()
    return !!(v || heroFiles.length || heroVoices.length)
  }
  const chatSend = () => {
    if (chatStreaming || !hasChatContent()) return
    const v = chatInput.trim()
    const files = heroFiles.map((f) => ({ name: f.name, size: f.size }))
    const voices = heroVoices.map((voice) => ({
      id: voice.id,
      url: voice.url,
      duration: voice.duration,
      bars: voice.bars,
    }))
    stopHeroVoiceRecording(true)
    setChat((c) => [
      ...c,
      {
        role: "user",
        text: v,
        files,
        voices,
      },
    ])
    setChatInput("")
    setHeroFiles([])
    setHeroVoices([])
    if (chatInputRef.current) {
      chatInputRef.current.style.height = "auto"
    }
    void sendChatMessage(buildAgentChatMessage(v, files))
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

  const openPersonalCenter = () => {
    setUserMenuOpen(false)
    setPersonalOpen(true)
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
    setScreen("landing")
    setModalOpen(false)
  }

  /* ================= 派生展示值 ================= */
  const isFull = screen === "fullAuth"
  const authVisible = modalOpen || isFull
  const isModal = modalOpen ? true : !isFull

  const tabBtnBase =
    "position:relative;z-index:1;flex:1;padding:11px 0;border-radius:11px;font-size:14.5px;font-weight:700;background:transparent;transition:color .2s;"
  const tabBtn = (active) => tabBtnBase + (active ? "color:#1B1530;" : "color:#9890AE;")
  const modeTab = (active) =>
    "font-size:14px;font-weight:700;padding:6px 0;border:none;outline:none;box-shadow:none;border-bottom:2px solid " +
    (active ? "#6D5DF6" : "transparent") +
    ";color:" +
    (active ? "#1B1530" : "#9890AE") +
    ";transition:all .2s;background:transparent;"
  const authWrapStyle = isModal
    ? "position:fixed;inset:0;z-index:500;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(22,17,45,.5);backdrop-filter:blur(6px);"
    : "position:fixed;inset:0;z-index:500;display:flex;align-items:stretch;justify-content:center;padding:0;background:#EFEAFE;"
  const authCardStyle = isModal
    ? "width:min(940px,100%);height:min(620px,calc(100vh - 40px));display:flex;background:#fff;border-radius:28px;overflow:hidden;box-shadow:0 40px 90px -30px rgba(40,24,90,.55);animation:popIn .34s cubic-bezier(.2,.8,.2,1);"
    : "width:100%;height:100%;display:flex;background:#fff;border-radius:0;overflow:hidden;box-shadow:none;"

  const stepMethod = step === "method"
  const stepSetpw = step === "setpw"
  const showBack = step === "setpw"
  const showHome = isFull && step === "method"
  const showClose = isModal && step === "method"

  const isAccountTab = tab === "account"
  const isWechatTab = tab === "wechat"
  const codeBtnLabel = sendingCode ? "发送中…" : countdown > 0 ? countdown + "s 后重发" : "获取验证码"
  const codeBtnStyle =
    "flex:0 0 auto;font-size:13px;font-weight:700;padding:9px 14px;border-radius:10px;transition:all .2s;" +
    (countdown > 0 || sendingCode ? "color:#A7A0BC;background:#ECE7F7;" : "color:#6D5DF6;background:#F1EDFC;")

  const checkboxStyle =
    "flex:0 0 auto;width:18px;height:18px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;transition:all .15s;border:1.5px solid " +
    (agreed ? "#6D5DF6" : "#CFC8E0") +
    ";background:" +
    (agreed ? "#6D5DF6" : "#fff") +
    ";"

  const chatRows = chat.map((m) => ({
    role: m.role,
    text: m.text,
    streaming: !!m.streaming,
    files: m.files || [],
    voices: m.voices || [],
    rowStyle:
      "display:flex;animation:msgIn .3s ease both;justify-content:" +
      (m.role === "user" ? "flex-end" : "flex-start") +
      ";",
    bubbleStyle:
      m.role === "user"
        ? "max-width:78%;background:#6D5DF6;color:#fff;font-size:14.5px;line-height:1.55;padding:13px 17px;border-radius:18px 18px 4px 18px;box-shadow:0 8px 20px -12px rgba(109,93,246,.7);"
        : "max-width:84%;background:#fff;border:1px solid #EDE7FA;color:#1B1530;font-size:14.5px;line-height:1.55;padding:13px 17px;border-radius:18px 18px 18px 4px;box-shadow:0 8px 24px -18px rgba(40,24,90,.5);",
  }))

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
      {screen === "landing" && (
        <div className="ld-150">

          {/* header */}
          <header className="ld-149">
            <div className="ld-148">
              <Mascot size={30} />
              <span className="ld-147">不写简历</span>
              <span className="ld-146">求职搭子</span>
              <E as="button" className="ld-180" onClick={() => navigate("/surprise")}>✦ 惊喜</E>
            </div>
            {isLoggedIn ? (
              <div ref={userMenuRef} className="ld-145">
                <button
                  type="button"
                  className="ld-144"
                  onClick={() => setUserMenuOpen((v) => !v)}
                >
                  <div className="ld-143">{user?.nickname?.slice(0, 1) || "你"}</div>
                  <span className="ld-142">{user?.nickname || "用户"}</span>
                  <ChevronDownIcon color={userMenuOpen ? "#7b61ff" : "#9890AE"} />
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
            ) : (
              <div className="ld-139">
                <E as="button" className="ld-179" onClick={openAuthLogin}>登录</E>
                <E as="button" className="ld-178" onClick={openAuthCreate}>免费注册</E>
              </div>
            )}
          </header>

          {/* home / 落地页 */}
          <main className="ld-138">
            {/* 装饰色块 */}
            <div aria-hidden="true" className="ld-137">
              <span className="ld-136" />
              <span className="ld-135" />
              <span className="ld-134" />
              <span className="ld-133" />
              <span className="ld-132" />
              <span className="ld-131" />
            </div>

            {/* 标题 + 吉祥物 */}
            <div className="ld-130">
              <div className="ld-129">
                <Mascot size={98} />
              </div>
              <h1 className="ld-128">
                不止简历，<span className="ld-127">解决一切求职卡点</span>
              </h1>
              <p className="ld-126">
                没实习憋不出简历？海投却石沉大海？简历太丑？<br />让「求职搭子」陪你，一个一个搞定 🌱
              </p>
            </div>

            {/* 目标胶囊 */}
            <div className="ld-125">
              <div className="ld-124">
                {[
                  { key: "explore", label: "职业探索" },
                  { key: "revise", label: "简历修改" },
                  { key: "generate", label: "生成简历" },
                ].map((g) => (
                  <button
                    key={g.key}
                    onClick={() => {
                      if (heroGoal === g.key) return
                      stopHeroVoiceRecording(true)
                      setHeroVoices((prev) => {
                        clearHeroVoices(prev)
                        return []
                      })
                      setHeroGoal(g.key)
                      setHeroInput(formatHeroIdentity(heroIdentity))
                      setHeroFiles([])
                    }}
                    style={css(
                      "padding:8px 17px;border-radius:9999px;border:0;cursor:pointer;font-family:inherit;font-size:13.5px;font-weight:600;transition:all .18s;" +
                        (heroGoal === g.key
                          ? "background:#fff;color:var(--accent-strong);box-shadow:0 2px 8px rgba(123,97,255,.20);"
                          : "background:transparent;color:var(--ink-2);"),
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 友好输入区 */}
            <div className="ld-123">
              <div className="ld-122">
                <div className="ld-121">
                  <span className="ld-120">
                    <span className="ld-119" />求职搭子在线
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
                  placeholder="把烦恼丢给搭子就行，比如「0 经验想转产品经理，怎么写简历？」"
                  className="ld-118"
                />
                {heroRecording && (
                  <div className="ld-117">
                    <span className="ld-73">
                      <span className="ld-72" />
                      录音中 {formatVoiceDuration(heroRecording.duration)}
                    </span>
                    <VoiceWaveBar bars={heroRecording.bars} color="#ff6b6b" animate />
                    <button
                      type="button"
                      onClick={() => stopHeroVoiceRecording(false)}
                      className="ld-116"
                    >
                      完成
                    </button>
                  </div>
                )}
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
                    {heroFiles.map((f) => (
                      <span
                        key={f.id}
                        className="ld-114"
                      >
                        <span className="ld-68">📎 {f.name}</span>
                        <span className="ld-113">{formatFileSize(f.size)}</span>
                        <button
                          type="button"
                          onClick={() => removeHeroFile(f.id)}
                          className="ld-112"
                          aria-label={`移除 ${f.name}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="ld-111">
                  <span className="ld-108">我是</span>
                  {[
                    { key: "student", label: "大学生" },
                    { key: "intern", label: "实习生" },
                    { key: "pro", label: "职场人" },
                  ].map((it) => (
                    <button
                      key={it.key}
                      onClick={() => {
                        setHeroIdentity(it.key)
                        setHeroInput((v) => applyHeroIdentity(v, it.key))
                      }}
                      style={css(
                        "padding:5px 13px;border-radius:9999px;cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:600;transition:all .16s;" +
                          (heroIdentity === it.key
                            ? "background:var(--accent-tint);color:var(--accent-strong);border:1px solid var(--accent);"
                            : "background:transparent;color:var(--ink-2);border:1px solid var(--border-strong);"),
                      )}
                    >
                      {it.label}
                    </button>
                  ))}
                  <span className="ld-110" />
                  <E
                    as="button"
                    s={
                      "width:36px;height:36px;border-radius:99px;border:0;cursor:pointer;display:grid;place-items:center;" +
                      (heroRecording
                        ? "background:#ffe3e3;box-shadow:0 0 0 4px rgba(255,77,79,.14);"
                        : "background:#f3f0ff;")
                    }
                    h={heroRecording ? "background:#ffd6d6;" : "background:var(--accent-tint);"}
                    title={heroRecording ? "点击结束录音" : "语音说给搭子听"}
                    onClick={toggleHeroVoiceRecord}
                  >
                    <MicIcon color={heroRecording ? "#ff4d4f" : "#7b61ff"} />
                  </E>
                  <E as="button" className="ld-177" title="添加材料" onClick={openHeroFilePicker}>
                    <ClipIcon />
                  </E>
                  <RequireAuthAction returnTo="heroSubmit" shouldRun={hasHeroContent} onAuthorized={heroSubmitCore}>
                    <E as="button" className="ld-176" title="发送">
                      <ArrowUpIcon />
                    </E>
                  </RequireAuthAction>
                </div>
              </div>
            </div>

            {/* 提示词参考 */}
            <div className="ld-109">
              <span className="ld-108">大家都在问</span>
              {HERO_GOAL_PROMPTS[heroGoal].map((p) => (
                <E
                  key={p}
                  as="button"
                  className="ld-175"
                  onClick={() => addPrompt(p)}
                >
                  {p}
                  <PlusMiniIcon />
                </E>
              ))}
            </div>

            {/* 快捷启动 / 入口二、三 */}
            <div className="ld-107">
              <span className="ld-105" />
              <span className="ld-106">手上有材料？一步到位</span>
              <span className="ld-105" />
            </div>
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
                    <UploadIcon />
                  </span>
                  <span className="ld-101">
                    <span className="ld-100">已有简历，直接上传</span>
                    <span className="ld-99">搭子秒读、诊断打分，告诉你哪儿能更好</span>
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
                    <PiecesIcon />
                  </span>
                  <span className="ld-101">
                    <span className="ld-100">只有零散材料，帮我拼</span>
                    <span className="ld-99">丢进项目 / 作品 / JD，自动拼出简历骨架</span>
                  </span>
                </E>
            </div>
          </main>
        </div>
      )}

      {/* ===================== CHAT ===================== */}
      {screen === "chat" && (
        <div className="ld-extra-3">
          <div className="ld-98">
            <E as="button" className="ld-172" onClick={gotoLanding}>‹ 返回首页</E>
            <div className="ld-97">
              <span className="ld-96">✦</span> AI 简历助手
            </div>
            <div className="ld-95" />
          </div>

          <div
            ref={chatScrollRef}
            className="chat-scroll ld-94"
            
          >
            {chatRows.map((m, i) => (
              <div key={i} style={css(m.rowStyle)}>
                <div style={css(m.bubbleStyle)}>
                  {m.streaming && !m.text ? (
                    <div className="chat-think-dots" role="status" aria-label="正在回复">
                      <span /><span /><span />
                    </div>
                  ) : m.role === "ai" && m.text ? (
                    <ChatTextCard content={m.text} />
                  ) : m.text ? (
                    <div>{m.text}</div>
                  ) : null}
                  {m.files.length > 0 && (
                    <div style={css(`display:flex;flex-direction:column;gap:6px;${m.text || m.voices.length ? "margin-top:10px;" : ""}`)}>
                      {m.files.map((f) => (
                        <span
                          key={`${f.name}-${f.size}`}
                          className="ld-93"
                        >
                          📎 {f.name}
                          <span className="ld-92">{formatFileSize(f.size)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {m.voices.length > 0 && (
                    <div style={css(`display:flex;flex-direction:column;gap:8px;${m.text || m.files.length ? "margin-top:10px;" : ""}`)}>
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
                </div>
              </div>
            ))}

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

          <div className="ld-76">
            {chatStage === "ready" && (
              <E as="button" className="ld-170" onClick={generateResume}>✨ 生成我的简历</E>
            )}
            {(chatStage === "intro" || chatStage === "ready") && (
              <div className="ld-75">
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
                    {heroFiles.map((f) => (
                      <span
                        key={f.id}
                        className="ld-69"
                      >
                        <span className="ld-68">📎 {f.name}</span>
                        <span className="ld-67">{formatFileSize(f.size)}</span>
                        <button
                          type="button"
                          onClick={() => removeHeroFile(f.id)}
                          className="ld-66"
                          aria-label={`移除 ${f.name}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <textarea
                  ref={chatInputRef}
                  value={chatInput}
                  onChange={onChatChange}
                  onKeyDown={onChatKey}
                  rows={2}
                  placeholder={chatStreaming ? "搭子回复中，可先输入…" : "输入你的回复…"}
                  className="ld-65"
                />
                <div className="ld-64">
                  <E
                    as="button"
                    s={
                      "width:32px;height:32px;flex:0 0 auto;border-radius:99px;border:0;cursor:pointer;display:grid;place-items:center;" +
                      (heroRecording
                        ? "background:#ffe3e3;box-shadow:0 0 0 3px rgba(255,77,79,.14);"
                        : "background:#f3f0ff;")
                    }
                    h={heroRecording ? "background:#ffd6d6;" : "background:#ece7ff;"}
                    title={heroRecording ? "点击结束录音" : "语音说给搭子听"}
                    onClick={toggleHeroVoiceRecord}
                  >
                    <MicIcon size={15} color={heroRecording ? "#ff4d4f" : "#7b61ff"} />
                  </E>
                  <E
                    as="button"
                    className="ld-169"
                    title="添加材料"
                    onClick={openHeroFilePicker}
                  >
                    <ClipIcon size={15} />
                  </E>
                  <E
                    as="button"
                    s={
                      "width:36px;height:36px;flex:0 0 auto;border-radius:12px;display:flex;align-items:center;justify-content:center;" +
                      (chatStreaming || !hasChatContent()
                        ? "background:#CFC8E0;cursor:not-allowed;"
                        : "background:#6D5DF6;")
                    }
                    h={chatStreaming || !hasChatContent() ? "" : "background:#5B4BE8;"}
                    title="发送"
                    onClick={chatSend}
                  >
                    <SendIcon size={16} />
                  </E>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== AUTH (modal or fullscreen) ===================== */}
      {authVisible && (
        <div style={css(authWrapStyle)} onClick={onBackdrop}>
          <div style={css(authCardStyle)} onClick={stopProp}>
            {/* LEFT brand panel */}
            <div className="ld-63">
              <div className="ld-62" />
              <div className="ld-61" />
              <div className="ld-60" />
              <div className="ld-59">
                <div className="ld-58">
                  <div className="ld-57" />
                </div>
                <span className="ld-56">Magic Resume</span>
              </div>
              <div className="ld-55">
                <div className="ld-54">几分钟，<br />搞定一份<br />打动 HR 的简历。</div>
                <p className="ld-53">登录即注册 —— 无需繁琐步骤，直接开始你的求职之旅。</p>
              </div>
              <div className="ld-52">
                <div className="ld-51">★</div>
                <span className="ld-50">“10 分钟做完简历，第二天就约了面试。”</span>
              </div>
            </div>

            {/* RIGHT content */}
            <div className="ld-49">
              {/* top control */}
              <div className="ld-48">
                {showBack && (
                  <E as="button" className="ld-168" onClick={backToMethod}>‹ 返回</E>
                )}
                {showHome && (
                  <E as="button" className="ld-168" onClick={gotoLanding}>‹ 返回首页</E>
                )}
                <div className="ld-47" />
                {showClose && (
                  <E as="button" className="ld-167" onClick={closeAuth}>✕</E>
                )}
              </div>

              {/* ===== METHOD STEP ===== */}
              {stepMethod && (
                <div className="ld-46">
                  <h2 className="ld-18">欢迎来到 Magic Resume ✦</h2>
                  <p className="ld-17">登录即注册，丝滑开始 —— 首次登录将自动为你创建账号。</p>

                  {/* segmented tabs */}
                  <div className="ld-45">
                    <div style={css("position:absolute;top:4px;bottom:4px;width:calc(50% - 4px);background:#fff;border-radius:11px;box-shadow:0 4px 12px -6px rgba(40,24,90,.35);transition:left .28s cubic-bezier(.4,0,.2,1);left:" + (isAccountTab ? "4px" : "50%") + ";")} />
                    <button style={css(tabBtn(isAccountTab))} onClick={setTabAccount}>账密登录</button>
                    <button style={css(tabBtn(isWechatTab))} onClick={setTabWechat}>微信登录</button>
                  </div>

                  {/* ACCOUNT tab */}
                  {isAccountTab && (
                    <div className="ld-44">
                      {/* login-mode switch */}
                      <div className="ld-43">
                        <button className="mode-tab" style={css(modeTab(loginMode === "code"))} onClick={setModeCode}>验证码登录</button>
                        <button className="mode-tab" style={css(modeTab(loginMode === "password"))} onClick={setModePassword}>密码登录</button>
                      </div>

                      <div className={accountError ? "auth-field error" : "auth-field"} className="ld-42">
                        <input value={account} onChange={onAccountChange} onBlur={onAccountBlur} placeholder="请输入手机号 / 邮箱" className="ld-13" />
                      </div>
                      {accountError && (
                        <div className="ld-12">{accountError}</div>
                      )}

                      {/* CODE mode */}
                      {loginMode === "code" && (
                        <div className="ld-39">
                          <div className="auth-field ld-38" >
                            <input value={code} onChange={onCodeChange} placeholder="输入验证码" inputMode="numeric" className="ld-41" />
                            <button style={css(codeBtnStyle)} onClick={sendCode}>{codeBtnLabel}</button>
                          </div>
                          {codeSent && (
                            <div className="ld-40">验证码已发送，请查收</div>
                          )}
                          <E as="button" s={"width:100%;margin-top:18px;background:#6D5DF6;color:#fff;font-weight:800;font-size:16px;padding:15px;border-radius:14px;box-shadow:0 14px 30px -12px rgba(109,93,246,.85);transition:background .2s;" + (loggingIn ? "opacity:.7;pointer-events:none;" : "")} h="background:#5B4BE8;" onClick={submitAccount}>{loggingIn ? "登录中…" : "登录 / 注册"}</E>
                        </div>
                      )}

                      {/* PASSWORD mode */}
                      {loginMode === "password" && (
                        <div className="ld-39">
                          <div className="auth-field ld-38" >
                            <input value={loginPw} onChange={onLoginPw} onKeyDown={onLoginPwKey} type={showLoginPw ? "text" : "password"} placeholder="请输入登录密码" className="ld-13" />
                            <button className="ld-15" onClick={toggleShowLoginPw}>{showLoginPw ? "隐藏" : "显示"}</button>
                          </div>
                          {loginPwError && (
                            <div className="ld-12">
                              {loginPwError}
                            </div>
                          )}
                          {pwNeedSwitch && (
                            <E as="button" className="ld-166" onClick={switchToCodeFromPw}>切换验证码登录 →</E>
                          )}
                          <div className="ld-37">
                            <E as="button" className="ld-165" onClick={forgotPw}>忘记密码？</E>
                          </div>
                          <E as="button" s={"width:100%;margin-top:10px;background:#6D5DF6;color:#fff;font-weight:800;font-size:16px;padding:15px;border-radius:14px;box-shadow:0 14px 30px -12px rgba(109,93,246,.85);transition:background .2s;" + (loggingIn ? "opacity:.7;pointer-events:none;" : "")} h="background:#5B4BE8;" onClick={submitPassword}>{loggingIn ? "登录中…" : "登录"}</E>
                        </div>
                      )}
                    </div>
                  )}

                  {/* WECHAT tab */}
                  {isWechatTab && (
                    <div className="ld-36">
                      <div className="ld-35">
                        <div className="ld-34">
                          {QR_CELLS.map((c, i) => (
                            <div key={i} style={css(c.style)} />
                          ))}
                        </div>
                        <div className="ld-33" />
                        <div className="ld-32" />
                        <div className="ld-31" />
                        <div className="ld-30" />
                        <div className="ld-29" />
                        <div className="ld-28" />
                        <div className="ld-27">
                          <div className="ld-26" />
                        </div>
                      </div>
                      <div className="ld-25">打开微信扫一扫，立即登录 / 注册</div>
                      <E as="button" className="ld-164" onClick={wechatScan}>模拟扫码成功 →</E>
                    </div>
                  )}

                  {/* quick login (apple) */}
                  <div className="ld-24">
                    <div className="ld-23">
                      <div className="ld-10" />其他方式<div className="ld-10" />
                    </div>
                    <div className="ld-22">
                      <E as="button" className="ld-163" onClick={openApple}>
                        <AppleIcon />
                      </E>
                    </div>
                  </div>

                  {/* agreement */}
                  <div className={agreeShake ? "ld-agree-row is-shaking" : "ld-agree-row"}>
                    <button style={css(checkboxStyle)} onClick={toggleAgree}>{agreed ? "✓" : ""}</button>
                    <div className="ld-21">
                      我已阅读并同意 Magic Resume
                      <button type="button" className="legal-link ld-20"  onClick={(e) => openLegal(e, "terms")}>《用户协议》</button>
                      和
                      <button type="button" className="legal-link ld-20"  onClick={(e) => openLegal(e, "privacy")}>《隐私政策》</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== SET PASSWORD STEP ===== */}
              {stepSetpw && (
                <div className="ld-19">
                  <h2 className="ld-18">设置登录密码</h2>
                  <p className="ld-17">方便下次用密码快速登录 —— 也可以稍后再说。</p>

                  <div className="auth-field ld-16" >
                    <input value={pw1} onChange={onPw1} type={showPw ? "text" : "password"} placeholder="设置新密码（至少 8 位）" className="ld-13" />
                    <button className="ld-15" onClick={toggleShowPw}>{showPw ? "隐藏" : "显示"}</button>
                  </div>
                  <div className="auth-field ld-14" >
                    <input value={pw2} onChange={onPw2} type={showPw ? "text" : "password"} placeholder="确认新密码" className="ld-13" />
                  </div>
                  {pwError && (
                    <div className="ld-12">{pwError}</div>
                  )}

                  <E as="button" s={"width:100%;margin-top:20px;background:#6D5DF6;color:#fff;font-weight:800;font-size:16px;padding:15px;border-radius:14px;box-shadow:0 14px 30px -12px rgba(109,93,246,.85);" + (settingPw ? "opacity:.7;pointer-events:none;" : "")} h="background:#5B4BE8;" onClick={confirmPw}>{settingPw ? "提交中…" : "确认并进入"}</E>

                  <div className="ld-11">
                    <div className="ld-10" />或<div className="ld-10" />
                  </div>
                  <E as="button" className="ld-162" onClick={skipPw}>稍后在个人中心设置，先进去逛逛 →</E>
                </div>
              )}
            </div>
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

      {personalOpen && <PersonalCenter onClose={() => setPersonalOpen(false)} />}

      {/* ===================== TOAST ===================== */}
      {toastMsg && (
        <div className="ld-0">{toastMsg}</div>
      )}

    </div>
    </AuthGateProvider>
  )
}
