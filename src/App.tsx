import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { DashboardApp } from "@/pages/dashboard"
import { LandingApp } from "@/pages/landing"
import { SurpriseApp } from "@/pages/surprise"
import { APP_ROUTES } from "@/config/routes"
import { AuthProvider } from "@/store"
import { GlobalAuthToast } from "@/components/GlobalAuthToast"

const routeElements = {
  LandingApp: <LandingApp />,
  DashboardApp: <DashboardApp />,
  SurpriseApp: <SurpriseApp />,
} as const

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <GlobalAuthToast />
        <Routes>
          {APP_ROUTES.map((route) => (
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
