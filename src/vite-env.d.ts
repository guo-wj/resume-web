/// <reference types="vite/client" />

declare module "*.module.scss" {
  const classes: Record<string, string>
  export default classes
}

declare module "*.scss" {
  const css: string
  export default css
}

interface ImportMetaEnv {
  readonly VITE_ENV: string
  readonly VITE_API_BASE: string
  readonly VITE_AGENT_BASE: string
  readonly VITE_SERVER: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
