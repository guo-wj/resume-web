import type { ChatInfoCardData } from "./types"

/** 本地 mock，对应 Figma 409:1916 */
export const CHAT_INFO_CARD_MOCK: ChatInfoCardData = {
  title: "我读懂了你的这些信息～",
  subtitle: "信息已经自动存入履历库，将成为你的身份卡片",
  fields: [
    { key: "name", label: "姓名", value: "李海", icon: "name" },
    { key: "phone", label: "电话", value: "138–0000–1234", icon: "phone" },
    { key: "email", label: "邮箱", value: "liming@example.com", icon: "email" },
    { key: "target_industry", label: "目标行业", value: "快销、互联网", icon: "industry" },
    { key: "target_role", label: "目标岗位", value: "产品经理", icon: "role" },
    { key: "highest_education", label: "最高学历", value: "硕士", icon: "education" },
    { key: "school", label: "学校", value: "天津农业大学", icon: "school" },
    { key: "major", label: "专业", value: "化学", icon: "major" },
  ],
  experiences: [
    {
      title: "智能客服平台建设",
      category: "work",
      categoryLabel: "实习",
      role: "产品实习生",
      period: "2024.07 – 2025.01",
      content:
        "客服团队日均处理工单超过 5,000 条，长期依赖人工分派；高峰期出现响应滞后、跨渠道数据分散和满意度下降等问题。",
      duty: "主导 12 场用户访谈，梳理核心流程并完成原型设计；协调算法与研发团队推进 Agent 分派能力上线，持续跟进方案落地。",
      result:
        "工单平均处理时长下降 40%，人工分派成本降低 25%，高峰期首次响应速度明显提升，并形成可复用的智能分派方案。",
      abilityArgs: ["需求拆解", "Agent 设计", "流程优化", "跨团队协作"],
    },
    {
      title: "用户增长数据中台",
      category: "research",
      categoryLabel: "实践项目",
      role: "数据产品经理",
      period: "2024.03 – 2024.06",
      content: "",
      duty: "",
      result: "",
      abilityArgs: [],
    },
    {
      title: "校园二手平台创业",
      category: "startup",
      categoryLabel: "创业",
      role: "联合创始人",
      period: "2023.09 – 2024.02",
      content: "",
      duty: "",
      result: "",
      abilityArgs: [],
    },
  ],
  hint: "信息已经自动存入履历库，将成为你的身份卡片",
  written: true,
  primaryAction: { label: "保存" },
  secondaryAction: { label: "修改" },
}
