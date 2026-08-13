import type { ChatScoreCardData } from "@/components/ChatScoreCard"

/** 简历修改页 mock — 后续接接口替换 */

export type EditMode = "chat" | "form"

export type EditMsgKind = "ai" | "user" | "file" | "score"

export interface EditFileCard {
  name: string
  size: string
  status: "done" | "uploading"
}

export interface EditMessage {
  id: string
  kind: EditMsgKind
  time: string
  text?: string
  file?: EditFileCard
  score?: ChatScoreCardData
}

export const EDIT_SCORE_MOCK: ChatScoreCardData = {
  title: "简历评分",
  subtitle: "AI 已识别以下基本信息",
  score: 72,
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

export const EDIT_MESSAGES_MOCK: EditMessage[] = [
  {
    id: "m1",
    kind: "ai",
    time: "12:25 AM",
    text: "你好！我是你的 AI 简历助手，可以帮你生成、优化和管理个人简历。请告诉我你的基本信息，我们从姓名和求职目标开始吧。",
  },
  {
    id: "m2",
    kind: "user",
    time: "12:26 AM",
    text: "我叫李明，手机号 138-0000-1234，求职目标是高级前端工程师。",
  },
  {
    id: "m3",
    kind: "file",
    time: "2:20 AM",
    file: { name: "1.jpg", size: "1.8 MB", status: "done" },
  },
  {
    id: "m4",
    kind: "ai",
    time: "12:27 AM",
    text: "收到！我已经帮你整理好了基本信息，请确认以下内容是否准确：",
  },
  {
    id: "m5",
    kind: "user",
    time: "2:14 AM",
    text: "1",
  },
  {
    id: "m6",
    kind: "ai",
    time: "2:15 AM",
    text: "收到你的消息，我正在为你更新简历信息，请稍候……",
  },
  {
    id: "m7",
    kind: "score",
    time: "2:20 AM",
    score: EDIT_SCORE_MOCK,
  },
]

/** 右侧预览骨架条宽度（设计稿比例） */
export const EDIT_SKELETON_ROWS: number[] = [24, 82, 94, 63, 28, 82, 82, 82, 82]
