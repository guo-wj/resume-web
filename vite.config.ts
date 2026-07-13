import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import checker from "vite-plugin-checker"
import { defineConfig, loadEnv } from "vite"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiBase = env.VITE_API_BASE || "/api"
  const agentBase = env.VITE_AGENT_BASE || "/agent"
  const target = env.VITE_SERVER?.replace(/\/$/, "")
  const agentTarget = (env.VITE_AGENT_SERVER || env.VITE_SERVER)?.replace(/\/$/, "")
  const stripAgentPrefix = env.VITE_AGENT_STRIP_PREFIX === "true"
  const agentBasePattern = agentBase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const useProxy = apiBase.startsWith("/") && target

  return {
    plugins: [
      react(),
      tailwindcss(),
      checker({
        typescript: {
          tsconfigPath: "tsconfig.app.json",
        },
        oxlint: {
          lintCommand: "oxlint src",
          watchPath: ["src"],
        },
      }),
    ],
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    css: {
      preprocessorOptions: {
        scss: {
          loadPaths: [path.resolve(__dirname, "./src/styles")],
        },
      },
    },
    server: {
      host: true,
      port: 5174,
      proxy: useProxy
        ? {
            [apiBase]: {
              target,
              changeOrigin: true,
              secure: false,
            },
            [agentBase]: {
              target: agentTarget,
              changeOrigin: true,
              secure: false,
              ...(stripAgentPrefix
                ? {
                    rewrite: (p) => p.replace(new RegExp(`^${agentBasePattern}`), "") || "/",
                  }
                : {}),
            },
          }
        : undefined,
    },
  }
})
