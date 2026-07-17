import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { initAdaptive } from "./adaptive/setRootFontSize"
import "./index.css"
import { App } from "./App"

initAdaptive()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
