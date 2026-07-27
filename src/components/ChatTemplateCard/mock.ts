import type { ChatTemplateCardData } from "./types"

/** 本地 mock，后续用接口返回的结构化数据替换 */
export const CHAT_TEMPLATE_CARD_MOCK: ChatTemplateCardData = {
  title: "挑一个简历模板",
  subtitle: "配色和版式都能随时更换哦",
  defaultSelectedId: "coral-1",
  templates: [
    {
      id: "coral-1",
      title: "这是标题",
      primary: "#FF5F40",
      accent: "rgba(0, 0, 0, 0.82)",
      muted: "rgba(217, 217, 217, 0.6)",
      palette: ["#FF5F40", "#2E2E2E", "#E7E7E7"],
    },
    {
      id: "teal-1",
      title: "这是标题",
      primary: "#1C5D5F",
      accent: "#1C5D5F",
      muted: "rgba(28, 93, 95, 0.07)",
      palette: ["#1C5D5F", "rgba(28, 93, 95, 0.08)"],
    },
    {
      id: "purple-1",
      title: "这是标题",
      primary: "#8768E2",
      accent: "#BDBDBD",
      muted: "rgba(217, 217, 217, 0.6)",
      palette: ["#8768E2", "#BDBDBD", "#E7E7E7"],
    },
    {
      id: "coral-2",
      title: "这是标题",
      primary: "#FF5F40",
      accent: "rgba(0, 0, 0, 0.82)",
      muted: "rgba(217, 217, 217, 0.6)",
      palette: ["#FF5F40", "#2E2E2E", "#E7E7E7"],
    },
    {
      id: "teal-2",
      title: "这是标题",
      primary: "#1C5D5F",
      accent: "#1C5D5F",
      muted: "rgba(28, 93, 95, 0.07)",
      palette: ["#1C5D5F", "rgba(28, 93, 95, 0.08)"],
    },
    {
      id: "purple-2",
      title: "这是标题",
      primary: "#8768E2",
      accent: "#BDBDBD",
      muted: "rgba(217, 217, 217, 0.6)",
      palette: ["#8768E2", "#BDBDBD", "#E7E7E7"],
    },
  ],
}
