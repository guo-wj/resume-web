import type { ChatInfoCardData } from "./types"

/** 本地 mock，对应 Figma 379:2180 / 379:2248 */
export const CHAT_INFO_CARD_MOCK: ChatInfoCardData = {
  title: "我读到了你的这些信息",
  subtitle: "标题注释文案",
  fields: [
    { key: "name", label: "姓名", value: "李明", icon: "user" },
    { key: "phone", label: "电话", value: "138-0000-1234", icon: "phone" },
    { key: "target_role", label: "求职目标", value: "高级前端工程师", icon: "target" },
    { key: "education", label: "学历", value: "xx大学·计算机·本科", icon: "education" },
  ],
  hint: "已写入履历库，可在个人中心查看",
  primaryAction: { label: "确定" },
  secondaryAction: { label: "编辑" },
}
