import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { AuthSession, LoginResult } from "@/api/types"
import { clearAccountCache } from "./accountCache"
import { clearPersonalCenterCache } from "./personalCenterCache"

const STORAGE_KEY = "auth_session"

function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as AuthSession
    return session.accessToken ? session : null
  } catch {
    return null
  }
}

function persistSession(session: AuthSession | null) {
  if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  else localStorage.removeItem(STORAGE_KEY)
}

function loginResultToSession(data: LoginResult): AuthSession {
  const accessToken = data.access_token || data.token || ""
  return {
    accessToken,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
    hasPassword: data.has_password,
    user: data.user ?? null,
  }
}

interface AuthContextValue {
  session: AuthSession | null
  user: AuthSession["user"]
  isLoggedIn: boolean
  accessToken: string | null
  refreshToken: string | null
  setSession: (data: LoginResult) => void
  updateUser: (user: NonNullable<AuthSession["user"]>) => void
  clearSession: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(() => loadSession())

  const setSession = useCallback((data: LoginResult) => {
    const next = loginResultToSession(data)
    persistSession(next)
    setSessionState(next)
  }, [])

  const updateUser = useCallback((user: NonNullable<AuthSession["user"]>) => {
    setSessionState((prev) => {
      if (!prev) return prev
      const next = { ...prev, user }
      persistSession(next)
      return next
    })
  }, [])

  const clearSession = useCallback(() => {
    persistSession(null)
    setSessionState(null)
    clearAccountCache()
    clearPersonalCenterCache()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoggedIn: !!session?.accessToken,
      accessToken: session?.accessToken ?? null,
      refreshToken: session?.refreshToken ?? null,
      setSession,
      updateUser,
      clearSession,
    }),
    [session, setSession, updateUser, clearSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

/** 供非 React 模块（如 request）读取 token */
export function getAccessToken(): string | null {
  return loadSession()?.accessToken ?? null
}
