import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { DashboardApp } from "@/dashboard/DashboardApp"
import { LandingApp } from "@/landing/LandingApp"

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingApp />} />
        <Route path="/console" element={<DashboardApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
