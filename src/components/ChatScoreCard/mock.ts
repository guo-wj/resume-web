import type { ChatScoreCardData } from "./types"

/** 本地 mock，后续用接口返回的结构化数据替换 */
export const CHAT_SCORE_CARD_MOCK: ChatScoreCardData = {
  title: "简历评分",
  subtitle: "AI 已识别以下基本信息",
  score: 100,
  maxScore: 100,
  suggestions: [
    {
      id: "s1",
      text: "工作经历描述较为笼统，建议使用数据量化成果，如「提升效率 30%」等。",
    },
    {
      id: "s2",
      text: "技能栏目较为简单，可补充具体技术栈版本及项目实践，增强说服力。",
    },
    {
      id: "s3",
      text: "缺少个人简介模块，加入一段 2~3 句的职业定位描述可显著提升第一印象。",
    },
  ],
  footer: "评分已记录，可前往主页面查看完整优化建议",
}

/** 中分段示例（60–79） */
export const CHAT_SCORE_CARD_MOCK_MID: ChatScoreCardData = {
  ...CHAT_SCORE_CARD_MOCK,
  score: 79,
}

/** 低分段示例（60 以下） */
export const CHAT_SCORE_CARD_MOCK_LOW: ChatScoreCardData = {
  ...CHAT_SCORE_CARD_MOCK,
  score: 45,
}
