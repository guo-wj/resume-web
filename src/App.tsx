import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom"
import { DashboardApp } from "@/pages/dashboard"
import { LandingApp } from "@/pages/landing"
import { SurpriseApp } from "@/pages/surprise"
import { APP_ROUTES } from "@/config/routes"
import { AuthProvider } from "@/store"
import { GlobalAuthToast } from "@/components/GlobalAuthToast"

function EmptyRoute() {
  return null
}

/** 落地页与 /chat 共用同一挂载实例，切换路由不丢对话状态 */
function LandingLayout() {
  return (
    <>
      <LandingApp />
      <Outlet />
    </>
  )
}

const routeElements = {
  DashboardApp: <DashboardApp />,
  SurpriseApp: <SurpriseApp />,
} as const

export function App() {
  const otherRoutes = APP_ROUTES.filter(
    (route) => route.name !== "landing" && route.name !== "chat" && route.name !== "chatSession",
  )

  return (
    <AuthProvider>
      <BrowserRouter>
        <GlobalAuthToast />
        <Routes>
          <Route element={<LandingLayout />}>
            <Route index element={<EmptyRoute />} />
            <Route path="chat" element={<EmptyRoute />} />
            <Route path="chat/:sessionId" element={<EmptyRoute />} />
          </Route>
          {otherRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={routeElements[route.component as keyof typeof routeElements]}
            />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
