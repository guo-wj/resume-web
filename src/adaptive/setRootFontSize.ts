/** 与 src/styles/_adaptive.scss 保持一致 */
export const DESIGN_WIDTH = 1920
export const DESIGN_HEIGHT = 1097
export const REM_BASE = 100
/** 视觉页四周固定页边距（真实 px，不进 rem） */
export const PAGE_PAD = 40
/** 设计稿内容区宽度 = 1920 − 40×2 */
export const CONTENT_WIDTH = DESIGN_WIDTH - PAGE_PAD * 2
/** 设计关注区间（文档用） */
export const PC_MIN_WIDTH = 1280
export const PC_MAX_WIDTH = 1920

/**
 * 根 rem：按「视口宽 − 两侧固定页边距」相对内容区 1840 缩放，且不超过 100px。
 *
 * 这样四周 padding 可写死 40px，内容区 r() 随剩余宽度等比；
 * 避免按整宽 /1920 时边距也被缩小、1440 上内容显得偏大。
 *
 * 例：1440 → (1440−80)/1840×100 ≈ 73.91px；1920 → 100px。
 */
export function setRootFontSize() {
  const { clientWidth } = document.documentElement
  if (clientWidth <= 0) return
  const avail = Math.min(Math.max(clientWidth - PAGE_PAD * 2, 0), CONTENT_WIDTH)
  document.documentElement.style.fontSize = `${(avail / CONTENT_WIDTH) * REM_BASE}px`
}

/** 首屏 + resize（rAF 节流）+ pageshow（bfcache） */
export function initAdaptive() {
  setRootFontSize()

  let raf = 0
  const onResize = () => {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(setRootFontSize)
  }

  window.addEventListener("resize", onResize, { passive: true })
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) setRootFontSize()
  })
}
