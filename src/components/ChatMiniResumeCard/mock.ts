import type { ChatMiniResumeCardData } from "./types"

/** 本地 mock — Figma 379:2815 */
export const CHAT_MINI_RESUME_CARD_MOCK: ChatMiniResumeCardData = {
  cardId: "mini_resume_mock_001",
  name: "陈思远",
  targetJob: "产品负责人",
  experiences: [
    {
      experienceId: 1,
      title: "字节跳动 产品实习",
      highlight: "主导智能客服平台从0到1建设，上线后人工工单量下降62%，日均处理量突破8000条。",
    },
    {
      experienceId: 2,
      title: "供应链数字化项目",
      highlight: "负责供应链数字化中台架构设计，整合ERP/WMS/TMS三大系统，库存周转效率提升40%。",
    },
    {
      experienceId: null,
      title: "用户增长数据中台",
      highlight: "牵头用户增长数据中台落地，推动A/B实验平台规模化运营，DAU增长34%。",
    },
  ],
  action: {
    label: "生成完整简历",
    endpoint: "/resume/generate",
    payload: {
      session_id: "sess-1",
      target_job: "产品负责人",
      experience_ids: [1, 2],
    },
  },
}
