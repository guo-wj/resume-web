import { useCallback, useEffect, useRef, useState } from "react"
import {
  ApiError,
  bindByCode,
  bindWechat,
  getBindingChannel,
  getWechatQrcode,
  getWechatStatus,
  loadAccountData,
  sendBindCode,
  setUserPassword,
} from "@/api"
import { getAccountCache } from "@/store"
import { useAuth } from "@/store"
import type { BindingRow, UseAccountTabParams } from "../types"
import type { UserBindings, UserProfile } from "@/api/types"

export function useAccountTab({ showToast, modal, setModal, closeModal }: UseAccountTabParams) {
  const { user, updateUser, session } = useAuth()
  const initialCache = getAccountCache()

  const [accountLoading, setAccountLoading] = useState(!initialCache)
  const [profile, setProfile] = useState<UserProfile | null>(initialCache?.profile ?? null)
  const [accountBindings, setAccountBindings] = useState<UserBindings>(
    initialCache?.bindings ?? { channels: [] },
  )

  const [mPhone, setMPhone] = useState("")
  const [mEmail, setMEmail] = useState("")
  const [mCode, setMCode] = useState("")
  const [mError, setMError] = useState("")
  const [mCountdown, setMCountdown] = useState(0)
  const [mSubmitting, setMSubmitting] = useState(false)

  const [pwOld, setPwOld] = useState("")
  const [pwNew1, setPwNew1] = useState("")
  const [pwNew2, setPwNew2] = useState("")
  const [pwErr, setPwErr] = useState("")
  const [pwSubmitting, setPwSubmitting] = useState(false)
  const [pwFirstTime, setPwFirstTime] = useState(false)

  const [wechatQrUrl, setWechatQrUrl] = useState("")
  const [wechatLoading, setWechatLoading] = useState(false)

  const cdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wechatPollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const phoneBinding = getBindingChannel(accountBindings, "phone")
  const emailBinding = getBindingChannel(accountBindings, "email")
  const wechatBinding = getBindingChannel(accountBindings, "wechat")
  const appleBinding = getBindingChannel(accountBindings, "apple")
  const hasPassword = profile?.has_password === true || session?.hasPassword === true

  const displayName = profile?.nickname || user?.nickname || "用户"
  const displayAccount = profile?.account
    || (phoneBinding.bound ? phoneBinding.value : null)
    || (emailBinding.bound ? emailBinding.value : null)
    || user?.nickname
    || "—"
  const avatarLetter = (displayName || "用").slice(0, 1).toUpperCase()

  const applyAccountData = useCallback((data: { profile: UserProfile; bindings: UserBindings }) => {
    setProfile(data.profile)
    setAccountBindings(data.bindings)
    updateUser({
      id: data.profile.id || 0,
      nickname: data.profile.nickname,
      avatar_url: data.profile.avatar_url || "",
    })
  }, [updateUser])

  const loadAccount = useCallback(async (force = false) => {
    if (!force) {
      const cached = getAccountCache()
      if (cached) {
        applyAccountData(cached)
        setAccountLoading(false)
        return
      }
    }

    setAccountLoading(true)
    try {
      const data = await loadAccountData(force)
      applyAccountData(data)
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "加载账户信息失败")
    } finally {
      setAccountLoading(false)
    }
  }, [applyAccountData, showToast])

  const openBindPhone = () => { closeModal(); setModal("bindPhone") }
  const openBindEmail = () => { closeModal(); setModal("bindEmail") }
  const openBindWechat = () => setModal("bindWechat")
  const openBindApple = () => showToast("Apple ID 绑定暂未开放")

  const openPassword = () => {
    setPwFirstTime(!hasPassword)
    setPwOld("")
    setPwNew1("")
    setPwNew2("")
    setPwErr("")
    setModal("password")
  }

  const sendMCode = async () => {
    if (mCountdown > 0 || mSubmitting) return
    const isPhone = modal === "bindPhone"
    const identifier = isPhone ? mPhone : mEmail
    if (isPhone && !/^1[3-9]\d{9}$/.test(identifier)) { setMError("请输入正确的手机号"); return }
    if (!isPhone && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) { setMError("请输入正确的邮箱"); return }

    setMSubmitting(true)
    setMError("")
    try {
      await sendBindCode(identifier)
      setMCountdown(60)
      showToast(isPhone ? "验证码已发送至手机" : "验证码已发送至邮箱")
      clearInterval(cdTimer.current ?? undefined)
      cdTimer.current = setInterval(() => {
        setMCountdown((v) => {
          if (v <= 1) { clearInterval(cdTimer.current ?? undefined); return 0 }
          return v - 1
        })
      }, 1000)
    } catch (err) {
      setMError(err instanceof ApiError ? err.message : "验证码发送失败")
    } finally {
      setMSubmitting(false)
    }
  }

  const submitBind = async () => {
    const isPhone = modal === "bindPhone"
    const identifier = isPhone ? mPhone : mEmail
    if (isPhone && !/^1[3-9]\d{9}$/.test(identifier)) { setMError("请输入正确的手机号"); return }
    if (!isPhone && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) { setMError("请输入正确的邮箱"); return }
    if (mCode.length < 4) { setMError("请输入验证码"); return }
    if (mSubmitting) return

    setMSubmitting(true)
    setMError("")
    try {
      await bindByCode(identifier, mCode)
      closeModal()
      showToast(isPhone ? "手机号绑定成功 ✓" : "邮箱绑定成功 ✓")
      await loadAccount(true)
    } catch (err) {
      setMError(err instanceof ApiError ? err.message : "绑定失败，请稍后重试")
    } finally {
      setMSubmitting(false)
    }
  }

  const submitPw = async () => {
    if (!pwFirstTime && !pwOld) { setPwErr("请输入原密码"); return }
    if (pwNew1.length < 8) { setPwErr("新密码至少 8 位"); return }
    if (pwNew1 !== pwNew2) { setPwErr("两次输入的密码不一致"); return }
    if (pwSubmitting) return

    setPwSubmitting(true)
    setPwErr("")
    try {
      await setUserPassword({
        old_password: pwFirstTime ? null : pwOld,
        new_password: pwNew1,
        confirm_password: pwNew2,
      })
      closeModal()
      showToast("登录密码修改成功 ✓")
      await loadAccount(true)
    } catch (err) {
      setPwErr(err instanceof ApiError ? err.message : "密码修改失败，请稍后重试")
    } finally {
      setPwSubmitting(false)
    }
  }

  useEffect(() => {
    if (modal !== "bindWechat") return undefined

    let cancelled = false
    setWechatLoading(true)
    setWechatQrUrl("")

    const startWechatBind = async () => {
      try {
        const qrcode = await getWechatQrcode()
        if (cancelled) return
        setWechatQrUrl(qrcode.qr_url)

        clearInterval(wechatPollTimer.current ?? undefined)
        wechatPollTimer.current = setInterval(async () => {
          try {
            const status = await getWechatStatus(qrcode.state)
            if (status.status === "expired") {
              clearInterval(wechatPollTimer.current ?? undefined)
              showToast("二维码已过期，请关闭后重试")
              return
            }
            if (status.status === "confirmed" || status.status === "scanned") {
              clearInterval(wechatPollTimer.current ?? undefined)
              await bindWechat(qrcode.state)
              closeModal()
              showToast("微信绑定成功 ✓")
              await loadAccount(true)
            }
          } catch {
            // 轮询失败时静默重试
          }
        }, 2000)
      } catch (err) {
        if (!cancelled) {
          showToast(err instanceof ApiError ? err.message : "获取微信二维码失败")
        }
      } finally {
        if (!cancelled) setWechatLoading(false)
      }
    }

    startWechatBind()
    return () => {
      cancelled = true
      clearInterval(wechatPollTimer.current ?? undefined)
    }
  }, [modal, loadAccount, showToast, closeModal])

  const bindings: BindingRow[] = [
    { label: "手机号", value: phoneBinding.bound ? (phoneBinding.value || "已绑定") : "未绑定", action: phoneBinding.bound ? "修改" : "绑定", strong: !phoneBinding.bound, onClick: openBindPhone },
    { label: "邮箱", value: emailBinding.bound ? (emailBinding.value || "已绑定") : "未绑定", action: emailBinding.bound ? "修改" : "绑定", strong: !emailBinding.bound, onClick: openBindEmail },
    { label: "微信", value: wechatBinding.bound ? (wechatBinding.value || "已绑定") : "未绑定", action: wechatBinding.bound ? "已绑定" : "绑定", strong: !wechatBinding.bound, onClick: openBindWechat },
    { label: "Apple ID", value: appleBinding.bound ? (appleBinding.value || "已绑定") : "未绑定", action: appleBinding.bound ? "已绑定" : "绑定", strong: !appleBinding.bound, onClick: openBindApple },
  ]

  const resetAccountModalFields = useCallback(() => {
    clearInterval(cdTimer.current ?? undefined)
    clearInterval(wechatPollTimer.current ?? undefined)
    setMPhone("")
    setMEmail("")
    setMCode("")
    setMError("")
    setMCountdown(0)
    setMSubmitting(false)
    setPwOld("")
    setPwNew1("")
    setPwNew2("")
    setPwErr("")
    setPwSubmitting(false)
    setWechatQrUrl("")
    setWechatLoading(false)
  }, [])

  return {
    accountLoading,
    profile,
    displayName,
    displayAccount,
    avatarLetter,
    hasPassword,
    bindings,
    phoneBinding,
    emailBinding,
    loadAccount,
    openPassword,
    resetAccountModalFields,
    bindModal: {
      mPhone, setMPhone, mEmail, setMEmail, mCode, setMCode, mError, setMError,
      mCountdown, mSubmitting, sendMCode, submitBind,
    },
    passwordModal: {
      pwOld, setPwOld, pwNew1, setPwNew1, pwNew2, setPwNew2, pwErr, setPwErr,
      pwSubmitting, pwFirstTime, submitPw,
    },
    wechatModal: { wechatQrUrl, wechatLoading },
  }
}
