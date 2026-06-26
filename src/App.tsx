import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { DashboardApp } from "@/pages/dashboard/DashboardApp"
import { LandingApp } from "@/pages/landing/LandingApp"
import { APP_ROUTES } from "@/config/routes"
import { AuthProvider } from "@/store"

const routeElements = {
  LandingApp: <LandingApp />,
  DashboardApp: <DashboardApp />,
} as const

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
