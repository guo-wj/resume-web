import { toPng } from "html-to-image"

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a")
  a.href = dataUrl
  a.download = filename
  a.rel = "noopener"
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/** 将惊喜页主体导出为 PNG（不含顶栏标题与操作按钮） */
export async function exportSurprisePagePng(
  target: HTMLElement,
  filename = `简历快照-${new Date().toISOString().slice(0, 10)}.png`,
) {
  const dataUrl = await toPng(target, {
    cacheBust: true,
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    backgroundColor: "#f7f6f2",
  })
  downloadDataUrl(dataUrl, filename)
}
