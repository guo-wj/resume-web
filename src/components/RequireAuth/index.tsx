import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useRef,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react"
import { useAuth, getAuthSession } from "@/store"

type AuthAction = () => void

interface PendingAuthAction {
  returnTo: string
  action: AuthAction
}

export interface AuthGateHandle {
  withAuth: (returnTo: string, action: AuthAction) => boolean
  resumePendingAction: (returnTo: string) => boolean
}

interface AuthGateContextValue extends AuthGateHandle {
  isLoggedIn: boolean
}

const AuthGateContext = createContext<AuthGateContextValue | null>(null)

/** 是否已具备可发对话的登录态（token + user.id） */
function hasAuthedUser() {
  const session = getAuthSession()
  return !!(session?.accessToken && session?.user?.id)
}

export const AuthGateProvider = forwardRef<
  AuthGateHandle,
  {
    onRequireAuth: (returnTo: string) => void
    children: ReactNode
  }
>(function AuthGateProvider({ onRequireAuth, children }, ref) {
  const { isLoggedIn } = useAuth()
  const pendingRef = useRef<PendingAuthAction | null>(null)

  const withAuth = useCallback(
    (returnTo: string, action: AuthAction) => {
      // 以 store 最新会话为准，避免仅有 token、无 user 时误放行进对话页
      if (hasAuthedUser()) {
        action()
        return true
      }
      pendingRef.current = { returnTo, action }
      onRequireAuth(returnTo)
      return false
    },
    [onRequireAuth],
  )

  const resumePendingAction = useCallback((returnTo: string) => {
    const pending = pendingRef.current
    pendingRef.current = null
    if (pending?.returnTo === returnTo) {
      pending.action()
      return true
    }
    return false
  }, [])

  useImperativeHandle(ref, () => ({ withAuth, resumePendingAction }), [withAuth, resumePendingAction])

  const value = { isLoggedIn, withAuth, resumePendingAction }

  return <AuthGateContext.Provider value={value}>{children}</AuthGateContext.Provider>
})

export function useAuthGate() {
  const ctx = useContext(AuthGateContext)
  if (!ctx) {
    throw new Error("useAuthGate must be used within AuthGateProvider")
  }
  return ctx
}

export function RequireAuthAction({
  returnTo,
  onAuthorized,
  shouldRun,
  children,
}: {
  returnTo: string
  onAuthorized?: (event: MouseEvent<HTMLElement>) => void
  shouldRun?: () => boolean
  children: ReactElement<{ onClick?: (event: MouseEvent<HTMLElement>) => void }>
}) {
  const { withAuth } = useAuthGate()
  const child = React.Children.only(children)

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (shouldRun && !shouldRun()) return
    withAuth(returnTo, () => {
      child.props.onClick?.(event)
      onAuthorized?.(event)
    })
  }

  return React.cloneElement(child, { onClick: handleClick })
}
