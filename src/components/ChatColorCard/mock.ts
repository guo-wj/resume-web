import type { ChatColorCardData } from "./types"

/** 本地 mock，后续用接口返回的结构化数据替换 */
export const CHAT_COLOR_CARD_MOCK: ChatColorCardData = {
  title: "配色",
  subtitle: "搭配自己喜欢的颜色吧",
  defaultSelectedId: "teal",
  colors: [
    { id: "teal", color: "#1C5D5F", label: "青绿" },
    { id: "coral", color: "#FF5F40", label: "珊瑚" },
    { id: "gold", color: "#E8A200", label: "金黄" },
    { id: "purple", color: "#8768E2", label: "紫罗兰" },
    { id: "sky", color: "#68B8E2", label: "天蓝" },
    { id: "cyan", color: "#40BCFF", label: "青蓝" },
  ],
}
