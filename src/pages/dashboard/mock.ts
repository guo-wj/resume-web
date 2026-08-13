/** 工作台 mock — 后续接接口替换 */

export type WorkbenchNavId = "resume" | "profile" | "interview"

export interface WorkbenchTodoItem {
  id: string
  title: string
}

export interface WorkbenchDoneItem {
  id: string
  title: string
}

export interface WorkbenchResume {
  id: string
  name: string
  title: string
  meta: string
  contact: string
  summary: string
  experience: {
    role: string
    period: string
    bullets: string[]
  }
  project: {
    name: string
    bullets: string[]
  }
  education: string
  updatedAt: string
  score: number
}

export const WORKBENCH_TODOS: WorkbenchTodoItem[] = [
  { id: "t1", title: "补充个人简介" },
  { id: "t2", title: "量化工作成果" },
  { id: "t3", title: "完善技能关键词" },
]

export const WORKBENCH_DONE: WorkbenchDoneItem[] = [
  { id: "d1", title: "联系方式已确认" },
  { id: "d2", title: "教育经历已完善" },
  { id: "d3", title: "联系方式已确认" },
  { id: "d4", title: "教育经历已完善" },
  { id: "d5", title: "联系方式已确认" },
  { id: "d6", title: "教育经历已完善" },
]

export const WORKBENCH_RESUMES: WorkbenchResume[] = [
  {
    id: "r1",
    name: "李明",
    title: "高级前端工程师",
    meta: "3 年经验  ·  上海  ·  正在寻找新机会",
    contact: "138 0000 1234  ·  liming@email.com  ·  github.com/liming",
    summary:
      "专注于构建高性能、易用的 Web 产品，擅长将复杂需求转化为清晰的用户体验。具备从需求分析、交互设计到前端交付的完整项目经验。",
    experience: {
      role: "前端工程师 · 星云科技",
      period: "2024.07 — 至今",
      bullets: [
        "负责核心业务后台与数据产品，推动首屏性能提升 35%。",
        "参与设计系统建设，沉淀 40+ 可复用组件。",
        "与产品、设计和后端协作，稳定交付 6 个版本。",
      ],
    },
    project: {
      name: "智能简历助手 · 核心开发",
      bullets: [
        "设计对话式简历生成流程，降低首次创建门槛。",
        "使用 React、TypeScript、Next.js 构建响应式工作台。",
        "建立可视化评分反馈，帮助用户快速定位优化项。",
      ],
    },
    education: "华东理工大学 · 计算机科学与技术",
    updatedAt: "2026/12/12",
    score: 100,
  },
  {
    id: "r2",
    name: "李明",
    title: "前端工程师",
    meta: "2 年经验  ·  上海  ·  开放机会",
    contact: "138 0000 1234  ·  liming@email.com",
    summary: "热爱打造流畅交互体验，关注性能与可访问性，持续打磨产品细节。",
    experience: {
      role: "前端开发 · 云启网络",
      period: "2023.03 — 2024.06",
      bullets: [
        "主导营销站改版，转化率提升 18%。",
        "落地组件库文档与示例，缩短协作成本。",
      ],
    },
    project: {
      name: "数据看板 · 前端负责人",
      bullets: [
        "搭建可视化图表方案，支持多维筛选。",
        "优化大数据表格滚动性能。",
      ],
    },
    education: "华东理工大学 · 计算机科学与技术",
    updatedAt: "2026/10/08",
    score: 86,
  },
  {
    id: "r3",
    name: "李明",
    title: "Web 开发工程师",
    meta: "校招版  ·  上海",
    contact: "liming@email.com",
    summary: "校招方向简历，突出项目与实习经历，适合互联网研发岗位投递。",
    experience: {
      role: "前端实习 · 启航科技",
      period: "2022.07 — 2022.12",
      bullets: ["参与后台管理系统页面开发与联调。", "协助完成活动页多端适配。"],
    },
    project: {
      name: "校园二手交易平台",
      bullets: ["独立完成前后端原型与基础部署。", "实现商品发布、检索与私信流程。"],
    },
    education: "华东理工大学 · 计算机科学与技术",
    updatedAt: "2026/06/01",
    score: 72,
  },
]
