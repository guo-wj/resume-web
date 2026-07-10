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
import { useAuth } from "@/store"

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
      if (isLoggedIn) {
        action()
        return true
      }
      pendingRef.current = { returnTo, action }
      onRequireAuth(returnTo)
      return false
    },
    [isLoggedIn, onRequireAuth],
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
