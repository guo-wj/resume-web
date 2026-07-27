import type { ChatProfileCardData } from "./types"

/** 本地 mock，后续用接口返回值替换即可 */
export const CHAT_PROFILE_CARD_MOCK: ChatProfileCardData = {
  title: "用户画像",
  subtitle: "AI 已识别以下基本信息",
  fields: [
    { key: "name", label: "姓名", value: "李明", icon: "user" },
    { key: "phone", label: "电话", value: "138-0000-1234", icon: "phone" },
    { key: "goal", label: "求职目标", value: "高级前端工程师", icon: "target" },
  ],
}
