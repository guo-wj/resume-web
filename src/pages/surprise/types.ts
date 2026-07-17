/** 惊喜页数据结构 — 与后端约定对齐，mock 可直接替换 */

export type Tone = "coral" | "teal" | "purple" | "gold"

export interface InsightTag {
  id: string
  label: string
  tone: Tone
}

export interface InsightSection {
  id: string
  title: string
  tone: Tone
  tags: InsightTag[]
  content: string
}

export interface ActionCard {
  id: string
  title: string
  description: string
  ctaLabel: string
  tone: Tone
}

export interface ReviewPanelData {
  badge: string
  highlight: string
  title: string
  delta: string
  axes: string[]
  keywords: string[]
}

export interface SurpriseHeaderData {
  title: string
  subtitle: string
  statusBadge: string
  ctaLabel: string
}

export interface SurprisePageData {
  header: SurpriseHeaderData
  actionCards: ActionCard[]
  resumeImage: string
  review: ReviewPanelData
  insights: InsightSection[]
}
