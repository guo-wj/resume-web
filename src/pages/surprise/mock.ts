import type { SurprisePageData } from "./types"

/** 本地 mock，后续用接口返回值替换即可 */
export const SURPRISE_MOCK: SurprisePageData = {
  header: {
    title: "这是我读到的你",
    subtitle: "从你聊的那些事里，我写成这样一份简历",
    statusBadge: "简历已生成",
    ctaLabel: "进入Dashboard",
  },
  actionCards: [
    {
      id: "card-1",
      title: "这里是标题",
      description:
        "这里是内容描述这里是内容描述这里是内容描述这里是内容描述",
      ctaLabel: "进入Dashboard",
      tone: "coral",
    },
    {
      id: "card-2",
      title: "这里是标题",
      description:
        "这里是内容描述这里是内容描述这里是内容描述这里是内容描述",
      ctaLabel: "进入Dashboard",
      tone: "gold",
    },
    {
      id: "card-3",
      title: "这里是标题",
      description:
        "这里是内容描述这里是内容描述这里是内容描述这里是内容描述",
      ctaLabel: "进入Dashboard",
      tone: "purple",
    },
  ],
  resumeImage: "/surprise/assets/img02.png",
  review: {
    badge: "主观点评",
    highlight: "这个优势你没有写进简历这个优势你没有写进简历",
    title: "这里是评价内容",
    delta: "+23%",
    axes: ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight"],
    keywords: ["词条", "词条", "词条", "词条", "词条"],
  },
  insights: [
    {
      id: "insight-1",
      title: "潜藏优势",
      tone: "coral",
      tags: [
        { id: "t1", label: "标签内容", tone: "teal" },
        { id: "t2", label: "标签内容", tone: "coral" },
        { id: "t3", label: "标签内容", tone: "purple" },
      ],
      content:
        "这里是内容这里是内容这里是内容这里是内容这里是内容这里容这里是内容这里是内容",
    },
    {
      id: "insight-2",
      title: "市场认可",
      tone: "teal",
      tags: [
        { id: "t4", label: "标签内容", tone: "coral" },
        { id: "t5", label: "标签内容", tone: "teal" },
        { id: "t6", label: "标签内容", tone: "purple" },
      ],
      content:
        "这里是内容这里是内容这里是内容这里是内容这里是内容这里容这里是内容这里是内容",
    },
    {
      id: "insight-3",
      title: "差异化信息",
      tone: "purple",
      tags: [
        { id: "t7", label: "标签内容", tone: "coral" },
        { id: "t8", label: "标签内容", tone: "teal" },
        { id: "t9", label: "标签内容", tone: "purple" },
      ],
      content:
        "这里是内容这里是内容这里是内容这里是内容这里是内容这里容这里是内容这里是内容",
    },
  ],
}
