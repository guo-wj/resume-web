// @ts-nocheck — 遗留大文件，待逐步补全类型
import React from "react"
import { useNavigate } from "react-router-dom"
import { ApiError, loginByPassword, logout, request, setUserPassword } from "@/api"
import { PersonalCenter } from "@/pages/personal"
import { useAuth } from "@/store"

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

/* 通用元素：s = 基础内联样式字符串，h = hover 时叠加的样式字符串 */
function E({ as = "div", s, h, children, ...rest }) {
  const [hover, setHover] = useState(false)
  const As = as
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
      style={css("position:fixed;inset:0;z-index:510;background:rgba(22,17,45,.55);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:24px;")}
      onClick={onClose}
    >
      <div
        onClick={stopProp}
        style={css("width:min(520px,100%);max-height:min(78vh,640px);background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 40px 90px -30px rgba(40,24,90,.55);animation:popIn .3s cubic-bezier(.2,.8,.2,1);display:flex;flex-direction:column;")}
      >
        <div style={css("padding:22px 24px 16px;border-bottom:1px solid #ECE7F7;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-shrink:0;")}>
          <div>
            <div style={css("font-size:18px;font-weight:800;color:#1B1530;")}>{doc.title}</div>
            <div style={css("font-size:12px;color:#A7A0BC;margin-top:4px;")}>更新日期：{doc.updated}</div>
          </div>
          <button type="button" className="legal-close" style={css("width:30px;height:30px;border-radius:50%;background:#F2EFFB;color:#6B6483;font-size:15px;flex-shrink:0;")} onClick={onClose}>✕</button>
        </div>
        <div className="legal-body" style={css("flex:1;overflow-y:auto;padding:20px 24px 24px;")}>
          {doc.sections.map((s, i) => (
            <div key={i} style={css(i > 0 ? "margin-top:18px;" : "")}>
              <div style={css("font-size:14px;font-weight:700;color:#1B1530;margin-bottom:6px;")}>{s.heading}</div>
              <div style={css("font-size:13px;color:#5B5470;line-height:1.7;")}>{s.body}</div>
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

  const [screen, setScreen] = useState("landing") // landing | chat | createMethod | fullAuth
  const [modalOpen, setModalOpen] = useState(false)
  const [authReturn, setAuthReturn] = useState("landing") // landing | createMethod | chat
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

  const [heroInput, setHeroInput] = useState("")
  const [chatInput, setChatInput] = useState("")
  const [chatStage, setChatStage] = useState("intro") // intro | ready | generating | done
  const [chat, setChat] = useState([INTRO_MSG])

  // 让锁定倒计时每秒刷新
  const timers = useRef({})
  const userMenuRef = useRef(null)
  useEffect(() => {
    const t = timers.current
    return () => {
      clearInterval(t.countdown)
      clearTimeout(t.toast)
      clearTimeout(t.gen)
    }
  }, [])

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
  const openAuthCreate = () => {
    if (isLoggedIn) setScreen("createMethod")
    else openAuth("createMethod")
  }
  const startCreate = () => openAuthCreate()
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
    if (ret === "createMethod") setScreen("createMethod")
    else if (ret === "chat") {
      setScreen("chat")
      doGenerate()
    }
    toast("登录成功，欢迎来到 Magic Resume 🎉")
    resetAuthFields()
  }

  /* ---------- 落地页 AI 输入 ---------- */
  const onHeroChange = (e) => setHeroInput(e.target.value)
  const onHeroKey = (e) => {
    if (e.key === "Enter") heroSubmit()
  }
  const heroSubmit = () => {
    const v = heroInput.trim()
    setScreen("chat")
    setHeroInput("")
    if (v) {
      setChat((c) => [...c, { role: "user", text: v }])
      setChatStage("ready")
      setTimeout(() => {
        setChat((c) => [
          ...c,
          { role: "ai", text: "收到！我已经了解你的背景啦 👍 准备好就点下面的按钮，我马上为你生成简历。" },
        ])
      }, 520)
    }
  }

  /* ---------- 对话 ---------- */
  const onChatChange = (e) => setChatInput(e.target.value)
  const onChatKey = (e) => {
    if (e.key === "Enter") chatSend()
  }
  const chatSend = () => {
    const v = chatInput.trim()
    if (!v) return
    setChat((c) => [...c, { role: "user", text: v }])
    setChatInput("")
    if (chatStage === "intro") {
      setTimeout(() => {
        setChat((c) => [
          ...c,
          { role: "ai", text: "太好了！我已经了解你的背景啦 👍 准备好就点下面的按钮，我马上为你生成简历。" },
        ])
        setChatStage("ready")
      }, 520)
    }
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

  /* ---------- 创建方式 ---------- */
  const pickChat = () => setScreen("chat")
  const pickOther = () => toast("进入该创建方式（原型示意）")
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
    text: m.text,
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
    <div className="magic-landing" style={{ minHeight: "100vh", position: "relative", overflowX: "hidden", fontFamily: "'Plus Jakarta Sans','PingFang SC','Microsoft YaHei',system-ui,-apple-system,sans-serif", color: "#1B1530", background: "#F6F4FF" }}>
      <style>{LANDING_CSS}</style>

      {/* ===================== LANDING ===================== */}
      {screen === "landing" && (
        <div style={css("position:relative;min-height:100vh;background:radial-gradient(1100px 600px at 82% -8%,#EBE4FF 0%,rgba(235,228,255,0) 60%),#F6F4FF;overflow:hidden;")}>
          <div style={css("position:absolute;top:-90px;left:-70px;width:300px;height:300px;border-radius:50%;background:#D9CCFF;filter:blur(8px);opacity:.55;animation:floatA 9s ease-in-out infinite;")} />
          <div style={css("position:absolute;bottom:40px;left:-40px;width:150px;height:150px;border-radius:42% 58% 60% 40%/45% 45% 55% 55%;background:#CBF35E;opacity:.7;animation:floatB 11s ease-in-out infinite;")} />
          <div style={css("position:absolute;top:140px;right:60px;width:90px;height:90px;border-radius:50%;border:14px solid #FFB3D1;opacity:.6;animation:floatA 7.5s ease-in-out infinite;")} />

          {/* nav */}
          <div style={css("position:relative;z-index:100;max-width:1180px;margin:0 auto;padding:22px 32px;display:flex;align-items:center;justify-content:space-between;")}>
            <div style={css("display:flex;align-items:center;gap:10px;")}>
              <div style={css("width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#6D5DF6,#9B7BFF);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px -6px rgba(109,93,246,.7);")}>
                <div style={css("width:13px;height:13px;border-radius:4px;background:#CBF35E;transform:rotate(12deg);")} />
              </div>
              <span style={css("font-weight:800;font-size:19px;letter-spacing:-.3px;")}>Magic Resume</span>
            </div>
            <div style={css("display:flex;align-items:center;gap:30px;")}>
              <div style={css("display:flex;gap:26px;font-size:14.5px;font-weight:600;color:#5B5470;white-space:nowrap;")}>
                <span>AI 简历</span>
                <span>模板库</span>
                <span>定价</span>
              </div>
              {isLoggedIn ? (
                <div ref={userMenuRef} style={css("position:relative;z-index:1;")}>
                  <button
                    type="button"
                    style={css("display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #ECE7FB;padding:5px 12px 5px 5px;border-radius:999px;box-shadow:0 4px 14px -8px rgba(40,24,90,.4);cursor:pointer;font-family:inherit;color:inherit;")}
                    onClick={() => setUserMenuOpen((v) => !v)}
                  >
                    <div style={css("width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#6D5DF6,#C77BFF);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px;")}>{user?.nickname?.slice(0, 1) || "你"}</div>
                    <span style={css("font-size:13.5px;font-weight:700;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;")}>{user?.nickname || "用户"}</span>
                    <ChevronDownIcon color={userMenuOpen ? "#6D5DF6" : "#9890AE"} />
                  </button>
                  {userMenuOpen && (
                    <div style={css("position:absolute;top:100%;right:0;padding-top:8px;z-index:10;")}>
                      <div style={css("min-width:168px;background:#fff;border:1px solid #ECE7FB;border-radius:14px;box-shadow:0 16px 40px -16px rgba(40,24,90,.35);padding:6px;animation:popIn .2s ease both;")}>
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
                <div style={css("display:flex;align-items:center;gap:12px;")}>
                  <E as="button" s="font-size:14.5px;font-weight:700;color:#1B1530;padding:9px 16px;border-radius:999px;" h="background:#EEE9FD;" onClick={openAuthLogin}>登录</E>
                  <E as="button" s="font-size:14.5px;font-weight:700;color:#fff;background:#6D5DF6;padding:10px 20px;border-radius:999px;box-shadow:0 8px 20px -8px rgba(109,93,246,.8);" h="background:#5B4BE8;" onClick={openAuthCreate}>免费开始</E>
                </div>
              )}
            </div>
          </div>

          {/* hero */}
          <div style={css("position:relative;z-index:5;max-width:1120px;margin:0 auto;padding:36px 32px 60px;display:grid;grid-template-columns:1.05fr .95fr;gap:48px;align-items:center;")}>
            <div style={css("animation:fadeUp .6s ease both;")}>
              <div style={css("display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid #ECE6FB;padding:7px 14px;border-radius:999px;font-size:13px;font-weight:700;color:#6D5DF6;box-shadow:0 6px 18px -12px rgba(40,24,90,.5);")}>✦ AI 驱动的简历工具</div>
              <h1 style={css("font-size:60px;line-height:1.04;letter-spacing:-1.5px;font-weight:800;margin:20px 0 0;")}>
                更少折腾，<br />更多{" "}
                <span style={css("position:relative;white-space:nowrap;")}>
                  Offer
                  <span style={css("position:absolute;left:-2px;right:-2px;bottom:6px;height:16px;background:#CBF35E;z-index:-1;border-radius:4px;")} />
                </span>
                。
              </h1>
              <p style={css("font-size:18px;line-height:1.6;color:#5B5470;margin:18px 0 28px;max-width:430px;")}>和 AI 聊几句，几分钟就能生成一份打动 HR 的简历。无需从零开始，先聊聊你的经历吧。</p>

              {/* AI chat input entry */}
              <div style={css("background:#fff;border:1px solid #E9E3FA;border-radius:20px;padding:8px 8px 8px 18px;display:flex;align-items:center;gap:12px;box-shadow:0 20px 50px -28px rgba(40,24,90,.55);max-width:480px;")}>
                <span style={css("color:#6D5DF6;font-size:18px;flex:0 0 auto;")}>✦</span>
                <input value={heroInput} onChange={onHeroChange} onKeyDown={onHeroKey} placeholder="说说你的工作经历，我来帮你写…" style={css("flex:1;border:none;font-size:15.5px;color:#1B1530;background:transparent;padding:10px 0;")} />
                <E as="button" s="flex:0 0 auto;width:44px;height:44px;border-radius:14px;background:#6D5DF6;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 18px -8px rgba(109,93,246,.9);" h="background:#5B4BE8;" onClick={heroSubmit}>
                  <SendIcon />
                </E>
              </div>
              <div style={css("display:flex;align-items:center;gap:16px;margin-top:18px;")}>
                <E as="button" s="font-size:15px;font-weight:700;color:#1B1530;display:inline-flex;align-items:center;gap:6px;" h="color:#6D5DF6;" onClick={startCreate}>
                  或 直接创建你的简历 <span>→</span>
                </E>
                <span style={css("font-size:13.5px;color:#9890AE;")}>已帮助 50,000+ 求职者拿到 offer</span>
              </div>
            </div>

            {/* hero illustration */}
            <div style={css("position:relative;animation:fadeUp .7s ease .1s both;")}>
              <div style={css("position:absolute;right:-10px;top:-26px;width:120px;height:120px;border-radius:46% 54% 62% 38%/52% 42% 58% 48%;background:linear-gradient(135deg,#9B7BFF,#6D5DF6);opacity:.9;animation:floatA 8s ease-in-out infinite;")} />
              <div style={css("background:#fff;border-radius:22px;padding:26px;box-shadow:0 40px 80px -36px rgba(40,24,90,.5);position:relative;z-index:2;")}>
                <div style={css("display:flex;align-items:center;gap:13px;")}>
                  <div style={css("width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#FFB3D1,#FF9E8A);")} />
                  <div style={css("flex:1;")}>
                    <div style={css("height:13px;width:62%;background:#1B1530;border-radius:5px;")} />
                    <div style={css("height:9px;width:42%;background:#D9D3EC;border-radius:5px;margin-top:8px;")} />
                  </div>
                  <div style={css("background:#EEFAD2;color:#5A8A1A;font-weight:800;font-size:12px;padding:6px 11px;border-radius:999px;border:1px solid #DBF0AE;")}>匹配度 92</div>
                </div>
                <div style={css("height:1px;background:#F0ECFA;margin:18px 0;")} />
                <div style={css("height:9px;width:30%;background:#C9C2E2;border-radius:5px;")} />
                <div style={css("height:8px;width:92%;background:#EDE9F8;border-radius:5px;margin-top:11px;")} />
                <div style={css("height:8px;width:84%;background:#EDE9F8;border-radius:5px;margin-top:8px;")} />
                <div style={css("height:8px;width:74%;background:#EDE9F8;border-radius:5px;margin-top:8px;")} />
                <div style={css("display:flex;gap:8px;margin-top:18px;")}>
                  <div style={css("height:24px;width:62px;background:#EFEAFE;border-radius:8px;")} />
                  <div style={css("height:24px;width:78px;background:#EFEAFE;border-radius:8px;")} />
                  <div style={css("height:24px;width:54px;background:#EFEAFE;border-radius:8px;")} />
                </div>
              </div>
              <div style={css("position:absolute;bottom:-22px;left:-20px;z-index:3;background:#fff;border-radius:14px;padding:11px 14px;display:flex;align-items:center;gap:9px;box-shadow:0 18px 40px -18px rgba(40,24,90,.5);animation:floatB 6.5s ease-in-out infinite;")}>
                <span style={css("color:#6D5DF6;")}>✦</span>
                <span style={css("font-size:13px;font-weight:700;")}>AI 已优化 8 处表达</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== CHAT ===================== */}
      {screen === "chat" && (
        <div style={css("min-height:100vh;background:radial-gradient(900px 500px at 50% -10%,#EBE4FF 0%,rgba(235,228,255,0) 60%),#F6F4FF;display:flex;flex-direction:column;")}>
          <div style={css("max-width:780px;width:100%;margin:0 auto;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;")}>
            <E as="button" s="display:flex;align-items:center;gap:6px;font-size:14px;font-weight:700;color:#5B5470;" h="color:#6D5DF6;" onClick={gotoLanding}>‹ 返回首页</E>
            <div style={css("display:flex;align-items:center;gap:8px;font-weight:800;")}>
              <span style={css("color:#6D5DF6;")}>✦</span> AI 简历助手
            </div>
            <div style={css("width:64px;")} />
          </div>

          <div style={css("flex:1;max-width:780px;width:100%;margin:0 auto;padding:8px 24px 24px;display:flex;flex-direction:column;gap:16px;overflow:auto;")}>
            {chatRows.map((m, i) => (
              <div key={i} style={css(m.rowStyle)}>
                <div style={css(m.bubbleStyle)}>{m.text}</div>
              </div>
            ))}

            {chatStage === "generating" && (
              <div style={css("display:flex;justify-content:flex-start;animation:msgIn .3s ease both;")}>
                <div style={css("background:#fff;border:1px solid #EDE7FA;border-radius:18px 18px 18px 4px;padding:14px 18px;display:flex;align-items:center;gap:10px;box-shadow:0 8px 24px -16px rgba(40,24,90,.5);")}>
                  <div style={css("width:18px;height:18px;border:2px solid #E0D8F5;border-top-color:#6D5DF6;border-radius:50%;animation:spin .8s linear infinite;")} />
                  <span style={css("font-size:14.5px;color:#5B5470;font-weight:600;")}>正在为你生成简历…</span>
                </div>
              </div>
            )}

            {chatStage === "done" && (
              <div style={css("align-self:flex-start;max-width:88%;background:#fff;border:1px solid #EDE7FA;border-radius:18px;padding:18px;box-shadow:0 16px 40px -24px rgba(40,24,90,.5);animation:fadeUp .45s ease both;")}>
                <div style={css("display:flex;align-items:center;gap:8px;font-weight:800;color:#5A8A1A;margin-bottom:14px;")}>🎉 简历已生成</div>
                <div style={css("border:1px dashed #D9D2EE;border-radius:12px;padding:18px;")}>
                  <div style={css("height:14px;width:40%;background:#1B1530;border-radius:5px;")} />
                  <div style={css("height:9px;width:60%;background:#D9D3EC;border-radius:5px;margin-top:9px;")} />
                  <div style={css("height:1px;background:#F0ECFA;margin:14px 0;")} />
                  <div style={css("height:8px;width:90%;background:#EDE9F8;border-radius:5px;")} />
                  <div style={css("height:8px;width:82%;background:#EDE9F8;border-radius:5px;margin-top:7px;")} />
                  <div style={css("height:8px;width:70%;background:#EDE9F8;border-radius:5px;margin-top:7px;")} />
                </div>
                <div style={css("display:flex;gap:10px;margin-top:14px;")}>
                  <E as="button" s="background:#6D5DF6;color:#fff;font-weight:700;font-size:14px;padding:10px 18px;border-radius:12px;" h="background:#5B4BE8;" onClick={enterEditor}>进入编辑器</E>
                  <button style={css("background:#F1EDFC;color:#6D5DF6;font-weight:700;font-size:14px;padding:10px 18px;border-radius:12px;")} onClick={() => toast("开始下载 PDF（原型示意）")}>下载 PDF</button>
                </div>
              </div>
            )}
          </div>

          <div style={css("max-width:780px;width:100%;margin:0 auto;padding:10px 24px 30px;")}>
            {chatStage === "ready" && (
              <E as="button" s="width:100%;background:linear-gradient(135deg,#6D5DF6,#9B7BFF);color:#fff;font-weight:800;font-size:16px;padding:16px;border-radius:16px;box-shadow:0 16px 34px -14px rgba(109,93,246,.9);animation:fadeUp .4s ease both;" h="filter:brightness(1.05);" onClick={generateResume}>✨ 生成我的简历</E>
            )}
            {(chatStage === "intro" || chatStage === "ready") && (
              <div style={css("background:#fff;border:1px solid #E9E3FA;border-radius:18px;padding:7px 7px 7px 18px;display:flex;align-items:center;gap:12px;box-shadow:0 14px 36px -22px rgba(40,24,90,.5);")}>
                <input value={chatInput} onChange={onChatChange} onKeyDown={onChatKey} placeholder="输入你的回复…" style={css("flex:1;border:none;font-size:15px;background:transparent;padding:10px 0;")} />
                <E as="button" s="width:42px;height:42px;border-radius:13px;background:#6D5DF6;display:flex;align-items:center;justify-content:center;" h="background:#5B4BE8;" onClick={chatSend}>
                  <SendIcon size={18} />
                </E>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== CREATE METHOD ===================== */}
      {screen === "createMethod" && (
        <div style={css("min-height:100vh;background:radial-gradient(900px 500px at 50% -10%,#EBE4FF 0%,rgba(235,228,255,0) 60%),#F6F4FF;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 24px;")}>
          <E as="button" s="position:absolute;top:24px;left:28px;display:flex;align-items:center;gap:6px;font-size:14px;font-weight:700;color:#5B5470;" h="color:#6D5DF6;" onClick={gotoLanding}>‹ 返回首页</E>
          <div style={css("text-align:center;animation:fadeUp .5s ease both;")}>
            <h2 style={css("font-size:36px;font-weight:800;letter-spacing:-.8px;margin:0;")}>你想怎么开始？</h2>
            <p style={css("font-size:16px;color:#5B5470;margin:12px 0 0;")}>选一种方式，几分钟拥有一份好简历。</p>
          </div>
          <div style={css("display:grid;grid-template-columns:repeat(3,260px);gap:20px;margin-top:38px;animation:fadeUp .6s ease .08s both;")}>
            <E as="button" s="text-align:left;background:#fff;border:1.5px solid #EDE7FA;border-radius:20px;padding:26px;box-shadow:0 14px 40px -26px rgba(40,24,90,.5);transition:transform .2s,box-shadow .2s,border-color .2s;" h="transform:translateY(-4px);box-shadow:0 24px 50px -24px rgba(109,93,246,.6);border-color:#CFC2FB;" onClick={pickChat}>
              <div style={css("width:50px;height:50px;border-radius:14px;background:#EFEAFE;display:flex;align-items:center;justify-content:center;font-size:24px;")}>💬</div>
              <div style={css("font-size:17px;font-weight:800;margin-top:16px;")}>和 AI 对话生成</div>
              <div style={css("font-size:13.5px;color:#7A7390;margin-top:6px;line-height:1.5;")}>聊几句，AI 自动帮你成稿</div>
              <div style={css("margin-top:14px;font-size:12px;font-weight:800;color:#6D5DF6;background:#F1EDFC;display:inline-block;padding:4px 9px;border-radius:999px;")}>推荐</div>
            </E>
            <E as="button" s="text-align:left;background:#fff;border:1.5px solid #EDE7FA;border-radius:20px;padding:26px;box-shadow:0 14px 40px -26px rgba(40,24,90,.5);transition:transform .2s,box-shadow .2s,border-color .2s;" h="transform:translateY(-4px);box-shadow:0 24px 50px -24px rgba(109,93,246,.6);border-color:#CFC2FB;" onClick={pickOther}>
              <div style={css("width:50px;height:50px;border-radius:14px;background:#EFEAFE;display:flex;align-items:center;justify-content:center;font-size:24px;")}>📄</div>
              <div style={css("font-size:17px;font-weight:800;margin-top:16px;")}>上传已有简历</div>
              <div style={css("font-size:13.5px;color:#7A7390;margin-top:6px;line-height:1.5;")}>让 AI 帮你润色和优化</div>
            </E>
            <E as="button" s="text-align:left;background:#fff;border:1.5px solid #EDE7FA;border-radius:20px;padding:26px;box-shadow:0 14px 40px -26px rgba(40,24,90,.5);transition:transform .2s,box-shadow .2s,border-color .2s;" h="transform:translateY(-4px);box-shadow:0 24px 50px -24px rgba(109,93,246,.6);border-color:#CFC2FB;" onClick={pickOther}>
              <div style={css("width:50px;height:50px;border-radius:14px;background:#EFEAFE;display:flex;align-items:center;justify-content:center;font-size:24px;")}>🧩</div>
              <div style={css("font-size:17px;font-weight:800;margin-top:16px;")}>从模板开始</div>
              <div style={css("font-size:13.5px;color:#7A7390;margin-top:6px;line-height:1.5;")}>浏览精选模板，套用即可</div>
            </E>
          </div>
        </div>
      )}

      {/* ===================== AUTH (modal or fullscreen) ===================== */}
      {authVisible && (
        <div style={css(authWrapStyle)} onClick={onBackdrop}>
          <div style={css(authCardStyle)} onClick={stopProp}>
            {/* LEFT brand panel */}
            <div style={css("flex:0 0 42%;position:relative;overflow:hidden;background:linear-gradient(160deg,#7C66FF 0%,#6D5DF6 55%,#5B4BE8 100%);padding:40px 36px;display:flex;flex-direction:column;color:#fff;")}>
              <div style={css("position:absolute;top:-50px;right:-40px;width:200px;height:200px;border-radius:50%;background:rgba(203,243,94,.85);opacity:.55;animation:floatA 9s ease-in-out infinite;")} />
              <div style={css("position:absolute;bottom:-30px;left:-30px;width:150px;height:150px;border-radius:44% 56% 60% 40%/50% 44% 56% 50%;background:rgba(255,179,209,.6);animation:floatB 11s ease-in-out infinite;")} />
              <div style={css("position:absolute;top:140px;left:30px;width:54px;height:54px;border-radius:50%;border:10px solid rgba(255,255,255,.25);animation:floatA 7s ease-in-out infinite;")} />
              <div style={css("position:relative;z-index:2;display:flex;align-items:center;gap:10px;")}>
                <div style={css("width:30px;height:30px;border-radius:9px;background:#fff;display:flex;align-items:center;justify-content:center;")}>
                  <div style={css("width:11px;height:11px;border-radius:3px;background:#6D5DF6;transform:rotate(12deg);")} />
                </div>
                <span style={css("font-weight:800;font-size:16px;")}>Magic Resume</span>
              </div>
              <div style={css("position:relative;z-index:2;margin-top:auto;")}>
                <div style={css("font-size:30px;font-weight:800;line-height:1.18;letter-spacing:-.5px;")}>几分钟，<br />搞定一份<br />打动 HR 的简历。</div>
                <p style={css("font-size:14px;line-height:1.6;color:rgba(255,255,255,.82);margin:16px 0 0;max-width:240px;")}>登录即注册 —— 无需繁琐步骤，直接开始你的求职之旅。</p>
              </div>
              <div style={css("position:relative;z-index:2;margin-top:26px;background:rgba(255,255,255,.14);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.22);border-radius:14px;padding:13px 15px;display:flex;align-items:center;gap:11px;")}>
                <div style={css("width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;color:#6D5DF6;font-weight:800;")}>★</div>
                <span style={css("font-size:13px;line-height:1.45;color:#fff;font-weight:600;")}>“10 分钟做完简历，第二天就约了面试。”</span>
              </div>
            </div>

            {/* RIGHT content */}
            <div style={css("flex:1;position:relative;display:flex;flex-direction:column;padding:34px 44px;overflow-y:auto;")}>
              {/* top control */}
              <div style={css("position:absolute;top:20px;left:24px;right:24px;display:flex;align-items:center;justify-content:space-between;min-height:30px;")}>
                {showBack && (
                  <E as="button" s="display:flex;align-items:center;gap:5px;font-size:14px;font-weight:700;color:#5B5470;" h="color:#6D5DF6;" onClick={backToMethod}>‹ 返回</E>
                )}
                {showHome && (
                  <E as="button" s="display:flex;align-items:center;gap:5px;font-size:14px;font-weight:700;color:#5B5470;" h="color:#6D5DF6;" onClick={gotoLanding}>‹ 返回首页</E>
                )}
                <div style={css("flex:1;")} />
                {showClose && (
                  <E as="button" s="width:32px;height:32px;border-radius:50%;background:#F2EFFB;color:#6B6483;font-size:16px;display:flex;align-items:center;justify-content:center;" h="background:#E7E1F8;" onClick={closeAuth}>✕</E>
                )}
              </div>

              {/* ===== METHOD STEP ===== */}
              {stepMethod && (
                <div style={css("margin-top:34px;display:flex;flex-direction:column;flex:1;animation:fadeUp .4s ease both;")}>
                  <h2 style={css("font-size:25px;font-weight:800;letter-spacing:-.4px;margin:0;")}>欢迎来到 Magic Resume ✦</h2>
                  <p style={css("font-size:14px;color:#7A7390;margin:8px 0 0;")}>登录即注册，丝滑开始 —— 首次登录将自动为你创建账号。</p>

                  {/* segmented tabs */}
                  <div style={css("position:relative;margin-top:22px;background:#F2EFFB;border-radius:14px;padding:4px;display:flex;")}>
                    <div style={css("position:absolute;top:4px;bottom:4px;width:calc(50% - 4px);background:#fff;border-radius:11px;box-shadow:0 4px 12px -6px rgba(40,24,90,.35);transition:left .28s cubic-bezier(.4,0,.2,1);left:" + (isAccountTab ? "4px" : "50%") + ";")} />
                    <button style={css(tabBtn(isAccountTab))} onClick={setTabAccount}>账密登录</button>
                    <button style={css(tabBtn(isWechatTab))} onClick={setTabWechat}>微信登录</button>
                  </div>

                  {/* ACCOUNT tab */}
                  {isAccountTab && (
                    <div style={css("margin-top:20px;animation:slideIn .3s ease both;")}>
                      {/* login-mode switch */}
                      <div style={css("display:flex;gap:22px;margin-bottom:14px;")}>
                        <button className="mode-tab" style={css(modeTab(loginMode === "code"))} onClick={setModeCode}>验证码登录</button>
                        <button className="mode-tab" style={css(modeTab(loginMode === "password"))} onClick={setModePassword}>密码登录</button>
                      </div>

                      <div className={accountError ? "auth-field error" : "auth-field"} style={css("background:#F4F2FB;border:1.5px solid #ECE7F7;border-radius:14px;padding:0 16px;display:flex;align-items:center;")}>
                        <input value={account} onChange={onAccountChange} onBlur={onAccountBlur} placeholder="请输入手机号 / 邮箱" style={css("flex:1;border:none;background:transparent;font-size:15px;padding:15px 0;")} />
                      </div>
                      {accountError && (
                        <div style={css("font-size:12.5px;color:#E5484D;font-weight:600;margin-top:7px;padding-left:4px;")}>{accountError}</div>
                      )}

                      {/* CODE mode */}
                      {loginMode === "code" && (
                        <div style={css("animation:slideIn .25s ease both;")}>
                          <div className="auth-field" style={css("background:#F4F2FB;border:1.5px solid #ECE7F7;border-radius:14px;padding:0 8px 0 16px;display:flex;align-items:center;margin-top:12px;")}>
                            <input value={code} onChange={onCodeChange} placeholder="输入验证码" inputMode="numeric" style={css("flex:1;border:none;background:transparent;font-size:15px;padding:15px 0;letter-spacing:2px;")} />
                            <button style={css(codeBtnStyle)} onClick={sendCode}>{codeBtnLabel}</button>
                          </div>
                          {codeSent && (
                            <div style={css("font-size:12px;color:#6D5DF6;font-weight:600;margin-top:7px;padding-left:4px;")}>验证码已发送，请查收</div>
                          )}
                          <E as="button" s={"width:100%;margin-top:18px;background:#6D5DF6;color:#fff;font-weight:800;font-size:16px;padding:15px;border-radius:14px;box-shadow:0 14px 30px -12px rgba(109,93,246,.85);transition:background .2s;" + (loggingIn ? "opacity:.7;pointer-events:none;" : "")} h="background:#5B4BE8;" onClick={submitAccount}>{loggingIn ? "登录中…" : "登录 / 注册"}</E>
                        </div>
                      )}

                      {/* PASSWORD mode */}
                      {loginMode === "password" && (
                        <div style={css("animation:slideIn .25s ease both;")}>
                          <div className="auth-field" style={css("background:#F4F2FB;border:1.5px solid #ECE7F7;border-radius:14px;padding:0 8px 0 16px;display:flex;align-items:center;margin-top:12px;")}>
                            <input value={loginPw} onChange={onLoginPw} onKeyDown={onLoginPwKey} type={showLoginPw ? "text" : "password"} placeholder="请输入登录密码" style={css("flex:1;border:none;background:transparent;font-size:15px;padding:15px 0;")} />
                            <button style={css("font-size:12px;font-weight:700;color:#6D5DF6;padding:6px 10px;")} onClick={toggleShowLoginPw}>{showLoginPw ? "隐藏" : "显示"}</button>
                          </div>
                          {loginPwError && (
                            <div style={css("font-size:12.5px;color:#E5484D;font-weight:600;margin-top:7px;padding-left:4px;")}>
                              {loginPwError}
                            </div>
                          )}
                          {pwNeedSwitch && (
                            <E as="button" s="width:100%;margin-top:10px;background:#F1EDFC;color:#6D5DF6;font-weight:700;font-size:13.5px;padding:11px;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:6px;" h="background:#E7E1F8;" onClick={switchToCodeFromPw}>切换验证码登录 →</E>
                          )}
                          <div style={css("display:flex;align-items:center;justify-content:flex-end;margin-top:9px;")}>
                            <E as="button" s="font-size:12.5px;font-weight:600;color:#9890AE;" h="color:#6D5DF6;" onClick={forgotPw}>忘记密码？</E>
                          </div>
                          <E as="button" s={"width:100%;margin-top:10px;background:#6D5DF6;color:#fff;font-weight:800;font-size:16px;padding:15px;border-radius:14px;box-shadow:0 14px 30px -12px rgba(109,93,246,.85);transition:background .2s;" + (loggingIn ? "opacity:.7;pointer-events:none;" : "")} h="background:#5B4BE8;" onClick={submitPassword}>{loggingIn ? "登录中…" : "登录"}</E>
                        </div>
                      )}
                    </div>
                  )}

                  {/* WECHAT tab */}
                  {isWechatTab && (
                    <div style={css("margin-top:18px;display:flex;flex-direction:column;align-items:center;animation:slideIn .3s ease both;")}>
                      <div style={css("position:relative;width:172px;height:172px;background:#fff;border:1.5px solid #ECE7F7;border-radius:16px;padding:12px;box-shadow:0 10px 30px -18px rgba(40,24,90,.5);")}>
                        <div style={css("display:grid;grid-template-columns:repeat(21,1fr);grid-template-rows:repeat(21,1fr);width:100%;height:100%;")}>
                          {QR_CELLS.map((c, i) => (
                            <div key={i} style={css(c.style)} />
                          ))}
                        </div>
                        <div style={css("position:absolute;top:12px;left:12px;width:38px;height:38px;border:6px solid #1B1530;border-radius:9px;")} />
                        <div style={css("position:absolute;top:22px;left:22px;width:18px;height:18px;background:#1B1530;border-radius:4px;")} />
                        <div style={css("position:absolute;top:12px;right:12px;width:38px;height:38px;border:6px solid #1B1530;border-radius:9px;")} />
                        <div style={css("position:absolute;top:22px;right:22px;width:18px;height:18px;background:#1B1530;border-radius:4px;")} />
                        <div style={css("position:absolute;bottom:12px;left:12px;width:38px;height:38px;border:6px solid #1B1530;border-radius:9px;")} />
                        <div style={css("position:absolute;bottom:22px;left:22px;width:18px;height:18px;background:#1B1530;border-radius:4px;")} />
                        <div style={css("position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:38px;height:38px;border-radius:10px;background:#07C160;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px #fff;")}>
                          <div style={css("width:18px;height:13px;background:#fff;border-radius:7px 7px 7px 2px;position:relative;")} />
                        </div>
                      </div>
                      <div style={css("font-size:14px;color:#5B5470;font-weight:600;margin-top:16px;")}>打开微信扫一扫，立即登录 / 注册</div>
                      <E as="button" s="margin-top:14px;background:#07C160;color:#fff;font-weight:800;font-size:14px;padding:11px 24px;border-radius:12px;box-shadow:0 12px 24px -12px rgba(7,193,96,.8);" h="filter:brightness(1.05);" onClick={wechatScan}>模拟扫码成功 →</E>
                    </div>
                  )}

                  {/* quick login (apple) */}
                  <div style={css("margin-top:auto;padding-top:22px;")}>
                    <div style={css("display:flex;align-items:center;gap:12px;color:#A7A0BC;font-size:12px;font-weight:600;")}>
                      <div style={css("flex:1;height:1px;background:#ECE7F7;")} />其他方式<div style={css("flex:1;height:1px;background:#ECE7F7;")} />
                    </div>
                    <div style={css("display:flex;justify-content:center;margin-top:14px;")}>
                      <E as="button" s="width:46px;height:46px;border-radius:50%;background:#fff;border:1.5px solid #ECE7F7;display:flex;align-items:center;justify-content:center;transition:transform .15s,box-shadow .15s;" h="transform:translateY(-2px);box-shadow:0 10px 22px -12px rgba(40,24,90,.5);" onClick={openApple}>
                        <AppleIcon />
                      </E>
                    </div>
                  </div>

                  {/* agreement */}
                  <div style={{ ...css("margin-top:18px;display:flex;align-items:center;gap:8px;"), ...(agreeShake ? css("animation:shake .5s;") : {}) }}>
                    <button style={css(checkboxStyle)} onClick={toggleAgree}>{agreed ? "✓" : ""}</button>
                    <div style={css("font-size:12px;color:#9890AE;line-height:1.5;")}>
                      我已阅读并同意 Magic Resume
                      <button type="button" className="legal-link" style={css("color:#6D5DF6;font-weight:600;")} onClick={(e) => openLegal(e, "terms")}>《用户协议》</button>
                      和
                      <button type="button" className="legal-link" style={css("color:#6D5DF6;font-weight:600;")} onClick={(e) => openLegal(e, "privacy")}>《隐私政策》</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== SET PASSWORD STEP ===== */}
              {stepSetpw && (
                <div style={css("margin-top:34px;display:flex;flex-direction:column;flex:1;animation:slideIn .35s ease both;")}>
                  <h2 style={css("font-size:25px;font-weight:800;letter-spacing:-.4px;margin:0;")}>设置登录密码</h2>
                  <p style={css("font-size:14px;color:#7A7390;margin:8px 0 0;")}>方便下次用密码快速登录 —— 也可以稍后再说。</p>

                  <div className="auth-field" style={css("background:#F4F2FB;border:1.5px solid #ECE7F7;border-radius:14px;padding:0 8px 0 16px;display:flex;align-items:center;margin-top:24px;")}>
                    <input value={pw1} onChange={onPw1} type={showPw ? "text" : "password"} placeholder="设置新密码（至少 8 位）" style={css("flex:1;border:none;background:transparent;font-size:15px;padding:15px 0;")} />
                    <button style={css("font-size:12px;font-weight:700;color:#6D5DF6;padding:6px 10px;")} onClick={toggleShowPw}>{showPw ? "隐藏" : "显示"}</button>
                  </div>
                  <div className="auth-field" style={css("background:#F4F2FB;border:1.5px solid #ECE7F7;border-radius:14px;padding:0 16px;display:flex;align-items:center;margin-top:12px;")}>
                    <input value={pw2} onChange={onPw2} type={showPw ? "text" : "password"} placeholder="确认新密码" style={css("flex:1;border:none;background:transparent;font-size:15px;padding:15px 0;")} />
                  </div>
                  {pwError && (
                    <div style={css("font-size:12.5px;color:#E5484D;font-weight:600;margin-top:7px;padding-left:4px;")}>{pwError}</div>
                  )}

                  <E as="button" s={"width:100%;margin-top:20px;background:#6D5DF6;color:#fff;font-weight:800;font-size:16px;padding:15px;border-radius:14px;box-shadow:0 14px 30px -12px rgba(109,93,246,.85);" + (settingPw ? "opacity:.7;pointer-events:none;" : "")} h="background:#5B4BE8;" onClick={confirmPw}>{settingPw ? "提交中…" : "确认并进入"}</E>

                  <div style={css("display:flex;align-items:center;gap:12px;color:#A7A0BC;font-size:12px;font-weight:600;margin-top:24px;")}>
                    <div style={css("flex:1;height:1px;background:#ECE7F7;")} />或<div style={css("flex:1;height:1px;background:#ECE7F7;")} />
                  </div>
                  <E as="button" s="margin:14px auto 0;font-size:14px;font-weight:700;color:#6B6483;display:flex;align-items:center;gap:5px;" h="color:#6D5DF6;" onClick={skipPw}>稍后在个人中心设置，先进去逛逛 →</E>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== APPLE SHEET ===================== */}
      {appleOpen && (
        <div style={css("position:fixed;inset:0;z-index:520;background:rgba(22,17,45,.5);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:24px;")} onClick={closeApple}>
          <div onClick={stopProp} style={css("width:380px;max-width:100%;background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 40px 90px -30px rgba(0,0,0,.6);animation:popIn .3s cubic-bezier(.2,.8,.2,1);")}>
            <div style={css("padding:26px 26px 0;display:flex;flex-direction:column;align-items:center;text-align:center;")}>
              <AppleIcon size={34} />
              <div style={css("font-size:17px;font-weight:700;margin-top:14px;")}>使用 Apple ID 登录</div>
              <div style={css("font-size:13px;color:#8A8A8E;margin-top:4px;")}>登录「Magic Resume」</div>
            </div>
            <div style={css("padding:20px 26px 26px;")}>
              <div style={css("background:#F2F2F4;border-radius:12px;padding:13px 14px;font-size:14px;color:#6B6B70;")}>Apple ID（演示）</div>
              <div style={css("background:#F2F2F4;border-radius:12px;padding:13px 14px;font-size:14px;color:#6B6B70;margin-top:10px;")}>密码</div>
              <E as="button" s="width:100%;margin-top:18px;background:#1B1530;color:#fff;font-weight:700;font-size:15px;padding:13px;border-radius:12px;" h="background:#000;" onClick={appleConfirm}>继续</E>
              <button style={css("width:100%;margin-top:10px;color:#6B6B70;font-size:14px;font-weight:600;padding:8px;")} onClick={closeApple}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== LEGAL MODAL ===================== */}
      <LegalModal docKey={legalDoc} onClose={closeLegal} />

      {personalOpen && <PersonalCenter onClose={() => setPersonalOpen(false)} />}

      {/* ===================== TOAST ===================== */}
      {toastMsg && (
        <div style={css("position:fixed;top:34px;left:50%;z-index:600;transform:translateX(-50%);background:#1B1530;color:#fff;font-size:14px;font-weight:600;padding:13px 22px;border-radius:14px;box-shadow:0 18px 40px -16px rgba(0,0,0,.5);animation:toastIn .3s ease both;")}>{toastMsg}</div>
      )}

    </div>
  )
}

const LANDING_CSS = `
  .magic-landing button {
    -webkit-tap-highlight-color: transparent;
  }
  .magic-landing button:focus,
  .magic-landing button:focus-visible {
    outline: none;
    box-shadow: none;
  }
  .magic-landing input {
    font-family: inherit;
    outline: none;
    box-shadow: none;
    appearance: none;
    -webkit-appearance: none;
    min-width: 0;
    width: 100%;
  }
  .magic-landing input:focus {
    outline: none;
    box-shadow: none;
  }
  .magic-landing input:-webkit-autofill,
  .magic-landing input:-webkit-autofill:hover,
  .magic-landing input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0 1000px #F4F2FB inset;
    -webkit-text-fill-color: #1B1530;
    caret-color: #1B1530;
  }
  .magic-landing .auth-field {
    overflow: hidden;
    transition: border-color .2s;
  }
  .magic-landing .auth-field:focus-within:not(.error) {
    border-color: #6D5DF6;
  }
  .magic-landing .auth-field.error {
    border-color: #F3B5B7;
  }
  .magic-landing .mode-tab,
  .magic-landing .mode-tab:focus,
  .magic-landing .mode-tab:focus-visible {
    outline: none;
    box-shadow: none;
  }
  .magic-landing .legal-link {
    outline: none;
    border: none;
    background: none;
    padding: 0;
    font: inherit;
    cursor: pointer;
    text-decoration: none;
  }
  .magic-landing .legal-link:hover,
  .magic-landing .legal-link:focus,
  .magic-landing .legal-link:focus-visible {
    text-decoration: none;
    outline: none;
    box-shadow: none;
  }
  .magic-landing .legal-close {
    outline: none;
    border: none;
    cursor: pointer;
    text-decoration: none;
  }
  .magic-landing .legal-close:hover,
  .magic-landing .legal-close:focus,
  .magic-landing .legal-close:focus-visible {
    text-decoration: none;
    outline: none;
    box-shadow: none;
    background: #E7E1F8;
  }
  .magic-landing .legal-body::-webkit-scrollbar { width: 6px; }
  .magic-landing .legal-body::-webkit-scrollbar-thumb { background: #D9D3EC; border-radius: 6px; }
  ::placeholder { color: #A7A0BC; }
  @keyframes floatA { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-16px) } }
  @keyframes floatB { 0%,100% { transform: translateY(0) rotate(0) } 50% { transform: translateY(12px) rotate(8deg) } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
  @keyframes popIn { from { opacity: 0; transform: scale(.95) translateY(12px) } to { opacity: 1; transform: none } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(14px) } to { opacity: 1; transform: none } }
  @keyframes msgIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
  @keyframes shake { 10%,90% { transform: translateX(-2px) } 20%,80% { transform: translateX(3px) } 30%,50%,70% { transform: translateX(-5px) } 40%,60% { transform: translateX(5px) } }
  @keyframes spin { to { transform: rotate(360deg) } }
  @keyframes toastIn { from { opacity: 0; transform: translate(-50%,-14px) } to { opacity: 1; transform: translate(-50%,0) } }
  .magic-landing .user-menu-item {
    width: 100%;
    display: flex;
    align-items: center;
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 13.5px;
    font-weight: 600;
    color: #1B1530;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
    border: none;
    background: transparent;
    transition: background .15s;
    outline: none;
    box-shadow: none;
  }
  .magic-landing .user-menu-item:focus,
  .magic-landing .user-menu-item:focus-visible {
    outline: none;
    box-shadow: none;
  }
  .magic-landing .user-menu-item:hover {
    background: #F4F2FB;
  }
  .magic-landing .user-menu-item.danger {
    color: #E5484D;
  }
  .magic-landing .user-menu-item.danger:hover {
    background: #FEF2F2;
  }
`
