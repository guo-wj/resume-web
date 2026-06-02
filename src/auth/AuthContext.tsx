import { createContext, useContext, useState, type ReactNode } from "react"
import type { DemoUser } from "./demo-users"

interface AuthCtx {
  user: DemoUser | null
  login: (user: DemoUser) => void
  logout: () => void
}

const AuthContext = createContext<AuthCtx | null>(null)
const KEY = "resume-web-auth"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(() => {
    try {
      const s = localStorage.getItem(KEY)
      return s ? (JSON.parse(s) as DemoUser) : null
    } catch {
      return null
    }
  })

  function login(u: DemoUser) {
    setUser(u)
    localStorage.setItem(KEY, JSON.stringify(u))
  }

  function logout() {
    setUser(null)
    localStorage.removeItem(KEY)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
