export type UsageFeatureTuple = [name: string, amount: number, color: string]

export interface CreditDetailRow {
  name: string
  amount: number
  date: string
}

export type BillInvoiceAction = "view" | "download" | "invoiceable" | "none"

export interface FaqParagraph {
  label?: string
  text: string
}

export interface FaqItem {
  q: string
  paras: FaqParagraph[]
}

export type PersonalNavIconKey = "user" | "bolt" | "receipt"

export type PersonalPageId = "account" | "usage" | "bills"

export interface PersonalNavItem {
  id: PersonalPageId
  label: string
  iconKey: PersonalNavIconKey
}

export const FAQ_DATA: FaqItem[] = [
  {
    q: "积分是如何使用的？",
    paras: [
      { text: "积分用于处理你的请求并生成最终结果，具体消耗取决于你选择的功能以及任务的复杂程度。" },
      { text: "总体来说，任务越复杂、设置越高级，所需的积分就越多。例如一次完整的定制简历生成、或一轮包含多次追问的模拟面试，会比单条文案润色消耗更多积分。" },
    ],
  },
  {
    q: "积分会过期吗？",
    paras: [
      { label: "月度套餐积分：", text: "月度订阅的积分在当前计费周期内有效，并会在下一个计费日自动重置。未使用的积分不会滚动到下个月。" },
      { label: "年度套餐积分：", text: "年度订阅的积分按月分配。每月的积分仅在该月周期内有效，并会在下个月周期开始时自动重置。上月未使用的积分不会累计。" },
      { label: "充值积分：", text: "这类积分永不过期，会一直保留在你的账户中直到使用完毕。" },
    ],
  },
  {
    q: "我可以购买额外的积分吗？",
    paras: [
      { text: "可以。如果当月积分提前用完，你随时可以在「订阅」页购买积分加量包。加量包属于充值积分，永不过期，并会在消耗时优先扣减，不影响你套餐内每月积分的额度与重置。" },
    ],
  },
  {
    q: "我的订阅会自动续费吗？",
    paras: [
      { text: "会的。你的订阅会在每个计费周期结束时自动续费，以确保你可以持续使用相关功能。你可以随时在账户设置中取消订阅，当前套餐仍会一直有效至本计费周期结束。" },
    ],
  },
  {
    q: "我可以升级我的套餐吗？",
    paras: [
      { text: "可以，且即时生效。升级时系统会按你当前套餐的剩余天数自动折算抵扣，你只需补足差价。升级完成后，更高的每月积分额度会立即可用。" },
    ],
  },
  {
    q: "取消订阅后我的权益会怎样？",
    paras: [
      { text: "取消后不会立即失效。你的套餐会保留至当前计费周期结束，在此之前仍可正常使用全部会员功能；到期后账户将自动降级为免费版，已发放但未使用的套餐积分会一并清空，充值积分则继续保留。" },
    ],
  },
  {
    q: "支持退款吗？",
    paras: [
      { text: "订阅类商品一经开通即可立即使用，原则上不支持中途退款。若你在购买后 7 天内尚未消耗任何套餐积分，可联系客服申请全额退款；积分加量包一经使用则不支持退款。具体以最新服务条款为准。" },
    ],
  },
]

export const NAV_ITEMS: PersonalNavItem[] = [
  { id: "account", label: "个人主页", iconKey: "user" },
  { id: "usage", label: "订阅", iconKey: "bolt" },
  { id: "bills", label: "账单", iconKey: "receipt" },
]
