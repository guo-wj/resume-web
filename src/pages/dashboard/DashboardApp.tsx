// @ts-nocheck — 遗留大文件，待逐步补全类型
import React from "react"
import { PersonalCenter } from "@/pages/personal"
import { CONSOLE_DEFAULT_ROUTE, CONSOLE_GROUP_TITLE, consoleNavForSidebar } from "@/config/routes"
const { useState, useEffect, useRef, useMemo, createContext, useContext } = React

/* ============ Mock data + helpers ============ */

const fmtMoney = (cents) => '¥' + (cents / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtMoney0 = (cents) => '¥' + Math.round(cents / 100).toLocaleString('zh-CN');
const fmtNum = (n) => n.toLocaleString('zh-CN');
const fmtDate = (s) => s; // already formatted strings in mock

const ACCOUNT = {
  name: '林子捷',
  id: 'JL-8F3A2C7D91',
  email: 'zijie.lin@gmail.com',
  phone: '188****6620',
  joined: '2025-03-14',
  region: '上海',
  industry: '互联网 / 产品',
  bio: '7 年互联网产品经理，正在求职高级产品岗。',
  tier: 'standard', // free | standard | premium | ultimate
  tierName: '标准版',
};

const TIER_LABEL = { free: '免费版', standard: '标准版', premium: '高级版', ultimate: '旗舰版' };

const SUBSCRIPTION = {
  planName: '标准版',
  tier: 'standard',
  status: 'active', // active | canceled | expired | past_due
  billingCycle: 'month',
  cycleLabel: '月度',
  openedAt: '2026-03-09',
  periodStart: '2026-06-09',
  periodEnd: '2026-07-09',
  remainingDays: 30,
  nextRenewalAt: '2026-07-09',
  nextRenewalAmount: 3900,
  autoRenew: true,
  paymentMethod: '微信支付',
  grantedThisCycle: 1200,
  grantedRemaining: 740,
};

const CREDITS = {
  total: 2486,
  granted: { remaining: 740, total: 1200, expires: '2026-07-09' },
  purchased: { remaining: 1646, total: 2000, expires: '2027-02-18' },
  promo: { remaining: 100, total: 100, expires: '2026-06-30' },
  expiringSoon: { amount: 840, days: 30 }, // granted + promo expiring within 30d
  weekTrend: [62, 48, 95, 120, 80, 156, 138], // last 7 days consumption
};

const CREDIT_PACKS = [
  { id: 'pack_s', name: '小额包', credits: 500, priceCents: 1900, originalCents: 2500, validityDays: 365, tag: null },
  { id: 'pack_m', name: '标准包', credits: 1200, priceCents: 3900, originalCents: 6000, validityDays: 365, tag: '最受欢迎' },
  { id: 'pack_l', name: '超值包', credits: 3000, priceCents: 8900, originalCents: 15000, validityDays: 365, tag: '最划算' },
  { id: 'pack_xl', name: '专业包', credits: 8000, priceCents: 19900, originalCents: 40000, validityDays: 730, tag: null },
];

const PLANS = [
  {
    tier: 'free', name: '免费版', desc: '体验核心 AI 能力',
    price: { month: 0, quarter: 0, year: 0 }, grant: { month: 30, quarter: 30, year: 30 },
    features: ['每月赠送 30 积分', '基础简历模板 8 套', '单份简历存储', 'AI 内容生成（标准模型）', '社区支持'],
    cta: 'current', accent: false,
  },
  {
    tier: 'standard', name: '标准版', desc: '高频求职者的高性价比之选',
    price: { month: 3900, quarter: 9900, year: 29900 }, grant: { month: 1200, quarter: 3600, year: 15000 },
    features: ['每周期赠送 1,200 积分', '全部模板 40+ 套', '简历存储 10 份', 'AI 润色 + JD 智能匹配', '导出 PDF / Word 无水印', '邮件客服支持'],
    cta: 'active', accent: true, tag: '最受欢迎',
  },
  {
    tier: 'premium', name: '高级版', desc: '冲刺名企，追求极致表达',
    price: { month: 7900, quarter: 19900, year: 59900 }, grant: { month: 3000, quarter: 9000, year: 40000 },
    features: ['每周期赠送 3,000 积分', '全部高级模板 + 设计师模板', '简历存储无限', '高级模型 + 长上下文', '3 个并发任务', '面试问题 AI 预测', '优先客服'],
    cta: 'upgrade', accent: false,
  },
  {
    tier: 'ultimate', name: '旗舰版', desc: '团队 / 重度用户全能套餐',
    price: { month: 15900, quarter: 39900, year: 119900 }, grant: { month: 8000, quarter: 24000, year: 110000 },
    features: ['每周期赠送 8,000 积分', '全部功能解锁', '专属设计师模板定制', '最高优先级 + 最快模型', '5 个并发任务', '1对1 简历顾问（每月）', '7×24 专属客服'],
    cta: 'upgrade', accent: false, tag: '全能',
  },
];

const CYCLE_LABEL = { month: '月', quarter: '季', year: '年' };
const CYCLE_SAVE = { month: null, quarter: '省 15%', year: '省 36%' };

// entitlement comparison table
const ENTITLEMENTS = [
  { label: '周期赠送积分', free: '30', standard: '1,200', premium: '3,000', ultimate: '8,000' },
  { label: '简历模板', free: '8 套', standard: '40+ 套', premium: '全部 + 设计师', ultimate: '全部 + 定制' },
  { label: '简历存储', free: '1 份', standard: '10 份', premium: '无限', ultimate: '无限' },
  { label: 'AI 模型', free: '标准', standard: '标准', premium: '高级 + 长上下文', ultimate: '最高优先' },
  { label: '并发任务', free: '1', standard: '1', premium: '3', ultimate: '5' },
  { label: 'JD 智能匹配', free: false, standard: true, premium: true, ultimate: true },
  { label: '面试问题预测', free: false, standard: false, premium: true, ultimate: true },
  { label: '导出无水印', free: false, standard: true, premium: true, ultimate: true },
  { label: '1对1 简历顾问', free: false, standard: false, premium: false, ultimate: true },
  { label: '客服支持', free: '社区', standard: '邮件', premium: '优先', ultimate: '7×24 专属' },
];

const TRANSACTIONS = [
  { id: 'tx_90281', time: '2026-06-09 14:32:08', dir: 'debit', cat: 'consume', biz: 'ai_task', amount: 18, balance: 2486, desc: 'AI 简历生成 · 产品经理模板', ref: 'TASK-7F2A91', batch: 'BAT-2026Q2-03' },
  { id: 'tx_90255', time: '2026-06-09 11:05:41', dir: 'debit', cat: 'consume', biz: 'ai_task', amount: 12, balance: 2504, desc: 'AI 智能润色 · 工作经历段落', ref: 'TASK-7F2A55', batch: 'BAT-2026Q2-03' },
  { id: 'tx_90233', time: '2026-06-08 19:48:22', dir: 'debit', cat: 'consume', biz: 'ai_task', amount: 25, balance: 2516, desc: 'JD 智能匹配 · 字节跳动·高级PM', ref: 'TASK-7F2A33', batch: 'BAT-2026Q2-03' },
  { id: 'tx_90201', time: '2026-06-08 10:12:03', dir: 'credit', cat: 'purchase', biz: 'pack', amount: 1200, balance: 2541, desc: '购买积分包 · 标准包', ref: 'ORD-20260608-1182', batch: 'BAT-PUR-0608' },
  { id: 'tx_90188', time: '2026-06-07 16:30:55', dir: 'debit', cat: 'consume', biz: 'ai_task', amount: 30, balance: 1341, desc: 'AI 简历生成 · 设计师模板', ref: 'TASK-7F29F1', batch: 'BAT-2026Q2-03' },
  { id: 'tx_90150', time: '2026-06-06 09:22:17', dir: 'debit', cat: 'expire', biz: 'promo', amount: 50, balance: 1371, desc: '活动积分过期回收', ref: '—', batch: 'BAT-PROMO-0506' },
  { id: 'tx_90120', time: '2026-06-05 21:14:39', dir: 'debit', cat: 'consume', biz: 'ai_task', amount: 14, balance: 1421, desc: 'AI 翻译 · 简历英文版', ref: 'TASK-7F29A0', batch: 'BAT-2026Q2-03' },
  { id: 'tx_90090', time: '2026-06-04 13:50:11', dir: 'credit', cat: 'refund', biz: 'refund', amount: 200, balance: 1435, desc: '退款返还 · 订单 ORD-20260520', ref: 'RFD-20260604-02', batch: 'BAT-RFD-0604' },
  { id: 'tx_90060', time: '2026-06-02 08:05:00', dir: 'credit', cat: 'grant', biz: 'subscription', amount: 1200, balance: 1235, desc: '会员周期赠送 · 标准版', ref: 'SUB-2026Q2', batch: 'BAT-2026Q2-03' },
  { id: 'tx_90030', time: '2026-06-01 15:42:28', dir: 'debit', cat: 'consume', biz: 'ai_task', amount: 22, balance: 35, desc: 'AI 内容生成 · 项目经历', ref: 'TASK-7F2901', batch: 'BAT-2026Q1-11' },
  { id: 'tx_90001', time: '2026-05-30 10:18:46', dir: 'credit', cat: 'admin_adjust', biz: 'adjust', amount: 50, balance: 57, desc: '客服补偿 · 任务异常退回', ref: 'ADJ-0530-07', batch: 'BAT-ADJ-0530' },
];

const ORDERS = [
  { id: 'ORD-20260608-1182', time: '2026-06-08 10:11:50', paidAt: '2026-06-08 10:12:03', goods: '积分包 · 标准包（1,200 积分）', type: 'credit_pack', typeLabel: '积分包', total: 3900, subtotal: 6000, discount: 2100, status: 'completed', pay: '微信支付', payRef: '4200002391202606081123', coupon: '新人 -¥21', invoice: null, credits: 1200 },
  { id: 'ORD-20260609-0042', time: '2026-06-09 02:00:01', paidAt: '2026-06-09 02:00:09', goods: '自动充值 · 标准包（1,200 积分）', type: 'auto_topup', typeLabel: '自动充值', total: 3900, subtotal: 3900, discount: 0, status: 'completed', pay: '微信支付', payRef: '4200002391202606090020', coupon: null, invoice: null, credits: 1200 },
  { id: 'ORD-20260609-1771', time: '2026-06-09 14:50:33', paidAt: null, goods: '高级版 · 月度订阅', type: 'subscription_upgrade', typeLabel: '升级', total: 4280, subtotal: 4280, discount: 0, status: 'pending', pay: '—', payRef: null, coupon: null, invoice: null, credits: 0 },
  { id: 'ORD-20260520-0901', time: '2026-05-20 18:32:10', paidAt: '2026-05-20 18:32:21', goods: '积分包 · 小额包（500 积分）', type: 'credit_pack', typeLabel: '积分包', total: 1900, subtotal: 2500, discount: 600, status: 'refunded', pay: '支付宝', payRef: '2026052022001498', coupon: null, invoice: 'reversed', credits: 500 },
  { id: 'ORD-20260509-0512', time: '2026-05-09 09:15:44', paidAt: '2026-05-09 09:15:58', goods: '标准版 · 月度续费', type: 'subscription_renew', typeLabel: '续费', total: 3900, subtotal: 3900, discount: 0, status: 'completed', pay: '微信支付', payRef: '4200002391202605091201', coupon: null, invoice: 'issued', credits: 1200 },
  { id: 'ORD-20260409-0330', time: '2026-04-09 09:15:30', paidAt: '2026-04-09 09:15:42', goods: '标准版 · 月度首购', type: 'subscription_new', typeLabel: '订阅首购', total: 3900, subtotal: 3900, discount: 0, status: 'completed', pay: '微信支付', payRef: '4200002391202604091130', coupon: null, invoice: 'issued', credits: 1200 },
];

const ORDER_STATUS = {
  pending: { label: '待支付', cls: 'badge-warning' },
  paid: { label: '已支付', cls: 'badge-accent' },
  completed: { label: '已完成', cls: 'badge-success' },
  canceled: { label: '已取消', cls: 'badge-neutral' },
  refunding: { label: '退款中', cls: 'badge-warning' },
  refunded: { label: '已退款', cls: 'badge-neutral' },
  failed: { label: '已失败', cls: 'badge-danger' },
};

const INVOICE_HEADERS = [
  { id: 'h1', type: 'business', name: '上海简寻信息科技有限公司', taxId: '91310115MA1H8XYZ12', isDefault: true },
  { id: 'h2', type: 'personal', name: '林子捷', taxId: '', isDefault: false },
];

const COUPONS = {
  available: [
    { id: 'c1', name: '年付立减券', type: 'amount', value: '¥50', cond: '年度套餐满 ¥299 可用', expire: '2026-07-31', from: '注册赠送', code: 'WELCOME50' },
    { id: 'c2', name: '积分包 8 折', type: 'discount', value: '8 折', cond: '仅限积分包，单笔最高减 ¥40', expire: '2026-06-30', from: '618 活动', code: null },
    { id: 'c3', name: '100 积分券', type: 'credit', value: '+100 积分', cond: '任意订单可用', expire: '2026-08-15', from: '客服补偿', code: null },
  ],
  used: [
    { id: 'c4', name: '新人 -¥21', type: 'amount', value: '¥21', cond: '首单可用', expire: '已于 2026-06-08 使用', from: '注册赠送', code: null },
  ],
  expired: [
    { id: 'c5', name: '春季 9 折券', type: 'discount', value: '9 折', cond: '全场可用', expire: '已于 2026-04-30 过期', from: '活动获取', code: null },
  ],
};

const REDEEM_HISTORY = [
  { code: 'JL-VIP-2026', time: '2026-05-01 12:00', reward: '7 天高级版试用' },
  { code: 'GIFT-300C', time: '2026-04-12 19:30', reward: '+300 积分' },
];

// ---- stats ----
const STATS = {
  totalCredits: 1842,
  estValue: 5994, // cents
  taskCount: 96,
  avgPerTask: 19.2,
  deltaCredits: 0.18, // +18% vs last month
  deltaTasks: -0.06,
  daily: [ // last 30 days, [day, credits]
    44,62,38,90,72,55,120,84,66,48,95,110,78,60,132,88,70,52,104,96,
    140,76,58,112,84,156,138,92,80,124
  ],
  byFunction: [
    { name: 'AI 内容生成', credits: 720, color: 'oklch(0.58 0.20 277)' },
    { name: 'AI 智能润色', credits: 468, color: 'oklch(0.62 0.16 230)' },
    { name: 'JD 智能匹配', credits: 372, color: 'oklch(0.66 0.15 175)' },
    { name: 'AI 翻译', credits: 168, color: 'oklch(0.72 0.14 90)' },
    { name: '面试问题预测', credits: 114, color: 'oklch(0.68 0.16 30)' },
  ],
  topFunctions: [
    { name: 'AI 内容生成', count: 38 },
    { name: 'AI 智能润色', count: 27 },
    { name: 'JD 智能匹配', count: 16 },
    { name: 'AI 翻译', count: 9 },
    { name: '面试问题预测', count: 6 },
  ],
};

const TASK_DETAIL = [
  { id: 'TASK-7F2A91', time: '2026-06-09 14:32', type: 'AI 内容生成', model: 'JL-Pro', credits: 18, ms: 4200, status: 'ok', summary: '产品经理 · 标准模板 · 工作经历扩写' },
  { id: 'TASK-7F2A55', time: '2026-06-09 11:05', type: 'AI 智能润色', model: 'JL-Std', credits: 12, ms: 2100, status: 'ok', summary: '工作经历段落 · 专业化润色' },
  { id: 'TASK-7F2A33', time: '2026-06-08 19:48', type: 'JD 智能匹配', model: 'JL-Pro', credits: 25, ms: 6800, status: 'ok', summary: '字节跳动 · 高级产品经理 JD 匹配分析' },
  { id: 'TASK-7F2A10', time: '2026-06-08 16:20', type: 'AI 翻译', model: 'JL-Std', credits: 0, ms: 800, status: 'failed', summary: '简历英文版翻译 · 调用超时（已退回积分）' },
  { id: 'TASK-7F29F1', time: '2026-06-07 16:30', type: 'AI 内容生成', model: 'JL-Pro', credits: 30, ms: 5100, status: 'ok', summary: '设计师简历 · 全文生成' },
];

const NOTIFICATIONS = [
  { id: 'n1', icon: 'credit', title: '积分即将过期', desc: '740 赠送积分将于 7 月 9 日过期', time: '2 小时前', unread: true },
  { id: 'n2', icon: 'order', title: '自动充值成功', desc: '已为你充值 1,200 积分（¥39.00）', time: '今天 02:00', unread: true },
  { id: 'n3', icon: 'renew', title: '续费提醒', desc: '标准版将于 7 月 9 日自动续费 ¥39.00', time: '昨天', unread: false },
];

Object.assign(window, {
  fmtMoney, fmtMoney0, fmtNum, fmtDate,
  ACCOUNT, TIER_LABEL, SUBSCRIPTION, CREDITS, CREDIT_PACKS, PLANS, CYCLE_LABEL, CYCLE_SAVE,
  ENTITLEMENTS, TRANSACTIONS, ORDERS, ORDER_STATUS, INVOICE_HEADERS, COUPONS, REDEEM_HISTORY,
  STATS, TASK_DETAIL, NOTIFICATIONS,
});


/* ============ Icons (lucide-style, stroke) ============ */

function Icon({ name, size = 17, className = '', style }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round', className, style };
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></>,
    crown: <><path d="M3 7l4 4 5-7 5 7 4-4-1.5 12.5h-15z"/><path d="M4.5 19.5h15"/></>,
    coins: <><circle cx="9" cy="9" r="6"/><path d="M16.5 5.2a6 6 0 1 1 0 13.6M7 9h2.5M9 7v4"/></>,
    receipt: <><path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21z"/><path d="M9 8h6M9 12h6"/></>,
    chart: <><path d="M3 3v18h18"/><path d="M7 14l3-4 3 3 4-6"/></>,
    gift: <><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13"/><path d="M12 8S11 3 8.5 3 6 6 8.5 6 12 8 12 8zm0 0s1-5 3.5-5S18 6 15.5 6 12 8 12 8z"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    chevron: <polyline points="9 6 15 12 9 18"/>,
    chevronDown: <polyline points="6 9 12 15 18 9"/>,
    back: <><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></>,
    bell: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>,
    copy: <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    checkCircle: <><circle cx="12" cy="12" r="9"/><polyline points="8.5 12 11 14.5 15.5 9.5"/></>,
    x: <><path d="M18 6 6 18M6 6l12 12"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    arrowUp: <><path d="M12 19V5M5 12l7-7 7 7"/></>,
    arrowDown: <><path d="M12 5v14M19 12l-7 7-7-7"/></>,
    trendUp: <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>,
    trendDown: <><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></>,
    wallet: <><path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2"/><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2z"/><circle cx="16.5" cy="12.5" r="1"/></>,
    alert: <><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></>,
    refresh: <><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    creditcard: <><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
    moon: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><polyline points="9 12 11 14 15 10"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    sparkle: <path d="M12 3l1.9 5.6L19.5 10 14 12l-2 6-2-6-5.5-2 5.6-1.4z"/>,
    ticket: <><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v12" strokeDasharray="2 2"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
    inbox: <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.5 5.5 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.5A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.5z"/></>,
    zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>,
    mail: <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></>,
    device: <><rect x="2" y="4" width="14" height="10" rx="2"/><path d="M2 18h14M18 8h4v10a2 2 0 0 1-2 2h-2"/></>,
    arrowRight: <><path d="M5 12h14M13 5l7 7-7 7"/></>,
  };
  return <svg {...p}>{paths[name] || null}</svg>;
}

/* ============ Toast ============ */
const ToastCtx = createContext(() => {});
const useToast = () => useContext(ToastCtx);
function ToastHost({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = (msg, icon = 'check') => {
    const id = Math.random();
    setToasts(t => [...t, { id, msg, icon }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2600);
  };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => <div className="toast" key={t.id}><Icon name={t.icon} size={16}/>{t.msg}</div>)}
      </div>
    </ToastCtx.Provider>
  );
}

/* ============ basics ============ */
function Btn({ variant = 'ghost', size, block, icon, iconRight, children, ...rest }) {
  const cls = ['btn', `btn-${variant}`, size && `btn-${size}`, block && 'btn-block'].filter(Boolean).join(' ');
  return <button className={cls} {...rest}>{icon && <Icon name={icon} size={15}/>}{children}{iconRight && <Icon name={iconRight} size={15}/>}</button>;
}

function Badge({ variant = 'neutral', dot, children }) {
  return <span className={`badge badge-${variant}`}>{dot && <span className="bdot" style={{ background: 'currentColor' }}/>}{children}</span>;
}

function Toggle({ on, onChange }) {
  return <button className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)} role="switch" aria-checked={on}/>;
}

function Copyable({ text, children }) {
  const toast = useToast();
  const [done, setDone] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(text);
    setDone(true); toast('已复制到剪贴板');
    setTimeout(() => setDone(false), 1400);
  };
  return <span className="copy-btn" onClick={copy} title="复制">{children}<Icon name={done ? 'check' : 'copy'} size={13}/></span>;
}

function Field({ label, req, hint, children }) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}{req && <span className="req">*</span>}</span>}
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

/* ============ Modal ============ */
function Modal({ title, sub, onClose, children, footer, wide }) {
  useEffect(() => {
    const h = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="modal-ov" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`}>
        <div className="modal-hd">
          <div>
            <h3>{title}</h3>
            {sub && <div className="sub">{sub}</div>}
          </div>
          <button className="modal-x" onClick={onClose}><Icon name="x" size={17}/></button>
        </div>
        <div className="modal-bd">{children}</div>
        {footer && <div className="modal-ft">{footer}</div>}
      </div>
    </div>
  );
}

/* ============ Charts (hand-built SVG) ============ */
function Sparkline({ data, color = 'var(--accent)', w = 96, h = 30 }) {
  const max = Math.max(...data), min = Math.min(...data);
  const rng = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => [i * step, h - ((v - min) / rng) * (h - 4) - 2]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = d + ` L${w} ${h} L0 ${h} Z`;
  const gid = useMemo(() => 'sg' + Math.random().toString(36).slice(2), []);
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.22"/><stop offset="100%" stopColor={color} stopOpacity="0"/>
      </linearGradient></defs>
      <path d={area} fill={`url(#${gid})`}/>
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="2.4" fill={color}/>
    </svg>
  );
}

function LineChart({ data, labels, color = 'var(--accent)', height = 220 }) {
  const w = 720, h = height, padL = 38, padB = 26, padT = 14, padR = 10;
  const max = Math.max(...data) * 1.1, min = 0;
  const iw = w - padL - padR, ih = h - padB - padT;
  const step = iw / (data.length - 1);
  const x = i => padL + i * step;
  const y = v => padT + ih - ((v - min) / (max - min || 1)) * ih;
  const line = data.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
  const area = line + ` L${x(data.length-1)} ${padT+ih} L${padL} ${padT+ih} Z`;
  const gid = useMemo(() => 'lc' + Math.random().toString(36).slice(2), []);
  const ticks = 4;
  const [hover, setHover] = useState(null);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} onMouseLeave={() => setHover(null)}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.20"/><stop offset="100%" stopColor={color} stopOpacity="0"/>
      </linearGradient></defs>
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const gy = padT + (ih / ticks) * i;
        const val = Math.round(max - (max / ticks) * i);
        return <g key={i}>
          <line x1={padL} y1={gy} x2={w - padR} y2={gy} stroke="var(--border)" strokeWidth="1"/>
          <text x={padL - 8} y={gy + 4} textAnchor="end" fontSize="10" fill="var(--text-3)" fontFamily="var(--mono)">{val}</text>
        </g>;
      })}
      <path d={area} fill={`url(#${gid})`}/>
      <path d={line} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      {labels && labels.map((lb, i) => i % Math.ceil(data.length / 8) === 0 && (
        <text key={i} x={x(i)} y={h - 8} textAnchor="middle" fontSize="10" fill="var(--text-3)">{lb}</text>
      ))}
      {data.map((v, i) => (
        <rect key={i} x={x(i) - step/2} y={padT} width={step} height={ih} fill="transparent" onMouseEnter={() => setHover(i)}/>
      ))}
      {hover != null && <>
        <line x1={x(hover)} y1={padT} x2={x(hover)} y2={padT+ih} stroke="var(--accent)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5"/>
        <circle cx={x(hover)} cy={y(data[hover])} r="4" fill="var(--surface)" stroke={color} strokeWidth="2.2"/>
        <g transform={`translate(${Math.min(Math.max(x(hover), 40), w-70)}, ${y(data[hover]) - 30})`}>
          <rect x="-32" y="-6" width="64" height="26" rx="6" fill="var(--text)"/>
          <text x="0" y="11" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--bg)" fontFamily="var(--mono)">{data[hover]} 积分</text>
        </g>
      </>}
    </svg>
  );
}

function DonutChart({ data, size = 160, thickness = 22 }) {
  const total = data.reduce((s, d) => s + d.credits, 0);
  const r = (size - thickness) / 2, cx = size / 2, cy = size / 2, C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-hover)" strokeWidth={thickness}/>
      {data.map((d, i) => {
        const frac = d.credits / total;
        const dash = `${(frac * C).toFixed(2)} ${C.toFixed(2)}`;
        const off = -acc * C;
        acc += frac;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth={thickness}
          strokeDasharray={dash} strokeDashoffset={off} transform={`rotate(-90 ${cx} ${cy})`} strokeLinecap="butt"/>;
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--text)" fontFamily="var(--mono)">{fmtNum(total)}</text>
      <text x={cx} y={cy + 15} textAnchor="middle" fontSize="11" fill="var(--text-3)">总消耗</text>
    </svg>
  );
}

function HBar({ value, max, color = 'var(--accent)' }) {
  return <div className="progress" style={{ flex: 1 }}><i style={{ width: `${(value/max)*100}%`, background: color }}/></div>;
}

Object.assign(window, {
  Icon, ToastHost, useToast, Btn, Badge, Toggle, Copyable, Field, Modal,
  Sparkline, LineChart, DonutChart, HBar,
  useState, useEffect, useRef, useMemo,
});


/* ============ 结算流程（升级 / 购买积分通用） ============ */
function CheckoutFlow({ order, onClose, onDone }) {
  // order: { title, kind, items:[{name, qty, unitCents}], grantCredits, prorationNote, coupons:[] }
  const [step, setStep] = useState('confirm'); // confirm | pay | processing | result
  const [coupon, setCoupon] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [pay, setPay] = useState('wechat');

  const subtotal = order.items.reduce((s, it) => s + it.unitCents * it.qty, 0);
  const discount = coupon ? coupon.amountCents : 0;
  const total = Math.max(0, subtotal - discount);

  const PAYS = [
    { id: 'wechat', label: '微信支付', icon: 'wallet' },
    { id: 'alipay', label: '支付宝', icon: 'wallet' },
    { id: 'card', label: '银行卡', icon: 'creditcard' },
  ];

  const goPay = () => setStep('pay');
  const submitPay = () => {
    setStep('processing');
    setTimeout(() => setStep('result'), 1900);
  };

  const steps = ['confirm', 'pay', 'result'];
  const stepIdx = step === 'processing' ? 1 : steps.indexOf(step);

  return (
    <Modal title={order.title} sub={step === 'result' ? '' : '请核对订单信息后继续'} onClose={onClose} wide
      footer={step === 'confirm' ? <>
          <label className="row" style={{ marginRight: 'auto', fontSize: 12.5, cursor: 'pointer', gap: 7 }}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ accentColor: 'var(--accent)', width: 15, height: 15 }}/>
            <span className="muted">我已阅读并同意<span className="linklike">《付费服务协议》</span></span>
          </label>
          <Btn variant="ghost" onClick={onClose}>取消</Btn>
          <Btn variant="primary" disabled={!agreed} onClick={goPay}>去支付 · {fmtMoney(total)}</Btn>
        </>
        : step === 'pay' ? <>
          <Btn variant="ghost" onClick={() => setStep('confirm')}>返回</Btn>
          <Btn variant="primary" onClick={submitPay}>确认支付 {fmtMoney(total)}</Btn>
        </>
        : step === 'result' ? <Btn variant="primary" block onClick={() => { onDone(order, total); }}>完成</Btn>
        : null}>

      {/* stepper */}
      {step !== 'result' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22 }}>
          {['确认订单', '支付', '完成'].map((lb, i) => (
            <React.Fragment key={i}>
              <div className="row" style={{ gap: 7 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11.5, fontWeight: 700, background: i <= stepIdx ? 'var(--accent)' : 'var(--surface-hover)', color: i <= stepIdx ? 'var(--accent-fg)' : 'var(--text-3)', fontFamily: 'var(--mono)' }}>{i + 1}</div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: i <= stepIdx ? 'var(--text)' : 'var(--text-3)' }}>{lb}</span>
              </div>
              {i < 2 && <div style={{ flex: 1, height: 1.5, background: i < stepIdx ? 'var(--accent)' : 'var(--border)', borderRadius: 2 }}/>}
            </React.Fragment>
          ))}
        </div>
      )}

      {step === 'confirm' && <>
        <div className="card" style={{ boxShadow: 'none', marginBottom: 16 }}>
          {order.items.map((it, i) => (
            <div key={i} className="between" style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{it.name}</div>
                {it.note && <div className="t3" style={{ fontSize: 11.5, marginTop: 2 }}>{it.note}</div>}
              </div>
              <div className="mono" style={{ fontWeight: 600 }}>{fmtMoney(it.unitCents * it.qty)}</div>
            </div>
          ))}
          {order.grantCredits ? (
            <div className="between" style={{ padding: '12px 16px', background: 'var(--accent-soft)', fontSize: 12.5 }}>
              <span className="row" style={{ gap: 6, color: 'var(--accent-text)', fontWeight: 600 }}><Icon name="sparkle" size={13}/>到账积分</span>
              <span className="mono" style={{ fontWeight: 700, color: 'var(--accent-text)' }}>+{fmtNum(order.grantCredits)}</span>
            </div>
          ) : null}
        </div>

        {order.prorationNote && (
          <div className="row" style={{ gap: 8, fontSize: 12, color: 'var(--text-2)', background: 'var(--surface-2)', padding: '10px 12px', borderRadius: 8, marginBottom: 16 }}>
            <Icon name="alert" size={14} className="t3" style={{ flexShrink: 0 }}/>{order.prorationNote}
          </div>
        )}

        {/* coupon */}
        <div className="field-label">优惠券</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {COUPONS.available.filter(c => c.type !== 'credit').slice(0, 2).map((c) => {
            const amt = c.type === 'amount' ? 5000 : Math.round(subtotal * 0.2);
            const active = coupon?.id === c.id;
            return (
              <button key={c.id} onClick={() => setCoupon(active ? null : { id: c.id, amountCents: amt })}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, border: `1px solid ${active ? 'var(--accent)' : 'var(--border-strong)'}`, background: active ? 'var(--accent-soft)' : 'var(--surface)', textAlign: 'left' }}>
                <Icon name="ticket" size={16} style={{ color: active ? 'var(--accent-text)' : 'var(--text-3)' }}/>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div><div className="t3" style={{ fontSize: 11 }}>{c.cond}</div></div>
                <span className="mono" style={{ fontWeight: 700, color: 'var(--accent-text)', fontSize: 13 }}>−{fmtMoney(amt)}</span>
                {active && <Icon name="checkCircle" size={16} style={{ color: 'var(--accent-text)' }}/>}
              </button>
            );
          })}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <div className="between" style={{ fontSize: 13, marginBottom: 6 }}><span className="muted">商品金额</span><span className="mono">{fmtMoney(subtotal)}</span></div>
          {discount > 0 && <div className="between" style={{ fontSize: 13, marginBottom: 6 }}><span className="muted">优惠</span><span className="mono" style={{ color: 'var(--success)' }}>−{fmtMoney(discount)}</span></div>}
          <div className="between"><span style={{ fontWeight: 700 }}>应付金额</span><span className="mono" style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-text)' }}>{fmtMoney(total)}</span></div>
        </div>
      </>}

      {step === 'pay' && <>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div className="t3" style={{ fontSize: 12.5 }}>待支付金额</div>
          <div className="mono" style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-text)', letterSpacing: '-.02em' }}>{fmtMoney(total)}</div>
        </div>
        <div className="field-label">选择支付方式</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PAYS.map(p => (
            <button key={p.id} onClick={() => setPay(p.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 10, border: `1px solid ${pay === p.id ? 'var(--accent)' : 'var(--border-strong)'}`, background: pay === p.id ? 'var(--accent-soft)' : 'var(--surface)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--surface-hover)', display: 'grid', placeItems: 'center' }}><Icon name={p.icon} size={17} className="muted"/></div>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{p.label}</span>
              <div style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', border: `2px solid ${pay === p.id ? 'var(--accent)' : 'var(--border-strong)'}`, display: 'grid', placeItems: 'center' }}>
                {pay === p.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }}/>}
              </div>
            </button>
          ))}
        </div>
      </>}

      {step === 'processing' && (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <div className="spin" style={{ width: 44, height: 44, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 18px', animation: 'spin .8s linear infinite' }}/>
          <div style={{ fontWeight: 700, fontSize: 15 }}>正在处理支付…</div>
          <div className="t3" style={{ fontSize: 12.5, marginTop: 6 }}>等待第三方支付回调，请勿关闭页面</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {step === 'result' && (
        <div style={{ padding: '16px 0 8px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--success-soft)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
            <Icon name="checkCircle" size={36} style={{ color: 'var(--success)' }}/>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>支付成功</div>
          <div className="t3" style={{ fontSize: 13, marginTop: 6 }}>{order.successNote || `已成功支付 ${fmtMoney(total)}`}</div>
          {order.grantCredits ? (
            <div className="row" style={{ justifyContent: 'center', gap: 8, marginTop: 18, background: 'var(--accent-soft)', padding: '12px', borderRadius: 10 }}>
              <Icon name="sparkle" size={16} style={{ color: 'var(--accent-text)' }}/>
              <span style={{ fontWeight: 600, color: 'var(--accent-text)' }}>已到账 <span className="mono">{fmtNum(order.grantCredits)}</span> 积分</span>
            </div>
          ) : null}
        </div>
      )}
    </Modal>
  );
}

window.CheckoutFlow = CheckoutFlow;


/* ============ 概览页 ============ */
function StatCard({ children }) {
  return <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>;
}

function OverviewPage({ go }) {
  const toast = useToast();
  const sub = SUBSCRIPTION, c = CREDITS;
  const todo = { unpaid: 1, invoice: 2, expiring: c.expiringSoon.amount };

  const recent = TRANSACTIONS.slice(0, 5);

  return (
    <div className="page fadein">
      {/* identity card */}
      <div className="card" style={{ marginBottom: 18, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '22px 24px', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(110deg, var(--accent-soft) 0%, transparent 55%)', opacity: .6, pointerEvents: 'none' }}/>
          <div style={{ width: 60, height: 60, borderRadius: 16, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 24, flexShrink: 0, background: 'linear-gradient(140deg, oklch(0.60 0.16 230), oklch(0.58 0.18 277))', zIndex: 1 }}>{ACCOUNT.name[0]}</div>
          <div style={{ zIndex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-.02em' }}>{ACCOUNT.name}</span>
              <Badge variant="gold"><Icon name="crown" size={12}/> {sub.planName}</Badge>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6, color: 'var(--text-2)', fontSize: 12.5 }}>
              <span className="row" style={{ gap: 5 }}>ID <Copyable text={ACCOUNT.id}><span className="mono" style={{ color: 'var(--text)' }}>{ACCOUNT.id}</span></Copyable></span>
              <span>会员至 <b style={{ color: 'var(--text)' }}>{sub.periodEnd}</b></span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, zIndex: 1 }}>
            <Btn variant="ghost" icon="settings" onClick={() => go('settings.profile')}>管理订阅</Btn>
            <Btn variant="primary" icon="arrowUp" onClick={() => go('membership.plans')}>升级会员</Btn>
          </div>
        </div>
      </div>

      {/* asset cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 18 }}>
        <StatCard>
          <div className="between"><span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>积分余额</span><Icon name="coins" size={16} className="t3"/></div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div className="mono" style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, letterSpacing: '-.02em' }}>{fmtNum(c.total)}</div>
              <div className="t3" style={{ fontSize: 11.5, marginTop: 6 }}>赠送 {c.granted.remaining} · 充值 {c.purchased.remaining}</div>
            </div>
            <Sparkline data={c.weekTrend} w={84} h={34}/>
          </div>
          <div className="linklike" style={{ fontSize: 12 }} onClick={() => go('credits.balance')}>查看明细 →</div>
        </StatCard>

        <StatCard>
          <div className="between"><span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>会员状态</span><Icon name="crown" size={16} className="t3"/></div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.01em' }}>{sub.planName} <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>{sub.cycleLabel}</span></div>
            <div className="t3" style={{ fontSize: 11.5, marginTop: 6 }}>剩余 <b className="mono" style={{ color: 'var(--text)' }}>{sub.remainingDays}</b> 天 · 续费 {fmtMoney0(sub.nextRenewalAmount)}/{CYCLE_LABEL[sub.billingCycle]}</div>
          </div>
          <div className="progress" style={{ marginTop: 2 }}><i style={{ width: '73%' }}/></div>
          <div className="linklike" style={{ fontSize: 12 }} onClick={() => go('membership.current')}>管理订阅 →</div>
        </StatCard>

        <StatCard>
          <div className="between"><span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>本月消耗</span><Icon name="zap" size={16} className="t3"/></div>
          <div>
            <div className="mono" style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, letterSpacing: '-.02em' }}>{fmtNum(STATS.totalCredits)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
              <Badge variant={STATS.deltaCredits >= 0 ? 'danger' : 'success'}>
                <Icon name={STATS.deltaCredits >= 0 ? 'trendUp' : 'trendDown'} size={11}/> {Math.abs(Math.round(STATS.deltaCredits*100))}%
              </Badge>
              <span className="t3" style={{ fontSize: 11.5 }}>较上月</span>
            </div>
          </div>
          <div className="linklike" style={{ fontSize: 12 }} onClick={() => go('stats.overview')}>消耗统计 →</div>
        </StatCard>

        <StatCard>
          <div className="between"><span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>待办事项</span><Icon name="inbox" size={16} className="t3"/></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 2 }}>
            <div className="between" style={{ fontSize: 12.5 }}><span className="muted">待支付订单</span><Badge variant="warning">{todo.unpaid}</Badge></div>
            <div className="between" style={{ fontSize: 12.5 }}><span className="muted">待开发票</span><Badge variant="accent">{todo.invoice}</Badge></div>
            <div className="between" style={{ fontSize: 12.5 }}><span className="muted">即将过期积分</span><span className="cell-neg" style={{ fontSize: 12.5 }}>{todo.expiring}</span></div>
          </div>
          <div className="linklike" style={{ fontSize: 12 }} onClick={() => go('orders.list')}>去处理 →</div>
        </StatCard>
      </div>

      {/* quick actions + expiring banner */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <Btn variant="ghost" icon="plus" onClick={() => go('credits.buy')}>购买积分</Btn>
        <Btn variant="ghost" icon="crown" onClick={() => go('membership.plans')}>升级会员</Btn>
        <Btn variant="ghost" icon="chart" onClick={() => go('stats.detail')}>消耗明细</Btn>
        <Btn variant="ghost" icon="receipt" onClick={() => go('orders.invoice')}>申请发票</Btn>
        <div style={{ flex: 1 }}/>
      </div>

      {/* expiring alert */}
      {c.expiringSoon.amount > 0 && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', marginBottom: 18, borderColor: 'var(--warning)', background: 'var(--warning-soft)' }}>
          <Icon name="alert" size={18} style={{ color: 'var(--warning)' }}/>
          <div style={{ fontSize: 13 }}>未来 <b>{c.expiringSoon.days}</b> 天内将有 <b className="mono">{c.expiringSoon.amount}</b> 积分过期。赠送积分随会员周期清零，建议尽快使用。</div>
          <Btn variant="ghost" size="sm" style={{ marginLeft: 'auto' }} onClick={() => toast('已跳转至 AI 工作台')}>立即使用</Btn>
        </div>
      )}

      {/* recent activity */}
      <div className="card">
        <div className="card-hd"><Icon name="clock" size={16} className="t3"/><h3>最近活动</h3><span className="sub">积分变动与订单</span>
          <div style={{ marginLeft: 'auto' }}><span className="linklike" style={{ fontSize: 12.5 }} onClick={() => go('credits.balance')}>全部明细</span></div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <tbody>
              {recent.map(t => (
                <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => go('credits.balance')}>
                  <td style={{ width: 38 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center', background: t.dir === 'credit' ? 'var(--success-soft)' : 'var(--surface-hover)' }}>
                      <Icon name={t.dir === 'credit' ? 'arrowDown' : 'zap'} size={14} style={{ color: t.dir === 'credit' ? 'var(--success)' : 'var(--text-2)' }}/>
                    </div>
                  </td>
                  <td><div style={{ fontWeight: 600 }}>{t.desc}</div><div className="t3 mono" style={{ fontSize: 11 }}>{t.time}</div></td>
                  <td style={{ textAlign: 'right' }}><span className={t.dir === 'credit' ? 'cell-pos' : 'cell-neg'}>{t.dir === 'credit' ? '+' : '−'}{t.amount}</span></td>
                  <td style={{ textAlign: 'right', width: 120 }}><span className="t3 mono" style={{ fontSize: 12 }}>余 {fmtNum(t.balance)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

window.OverviewPage = OverviewPage;


/* ============ 我的会员 ============ */
const TIER_ORDER = { free: 0, standard: 1, premium: 2, ultimate: 3 };

function MembershipPage({ sub, view, go, onUpgrade, onToggleRenew }) {
  const tabs = [
  { id: 'current', label: '当前订阅' },
  { id: 'plans', label: '套餐订阅' },
  { id: 'renewal', label: '续费管理' }];

  return (
    <div className="page fadein">
      <div className="page-head">
        <div className="page-title">会员订阅</div>
        <div className="page-sub">管理你的订阅、套餐与续费设置</div>
      </div>
      <div className="subtabs">
        {tabs.map((t) => <button key={t.id} className={`subtab ${view === t.id ? 'active' : ''}`} onClick={() => go('membership.' + t.id)}>{t.label}</button>)}
      </div>
      {view === 'current' && <CurrentSub sub={sub} go={go} onToggleRenew={onToggleRenew} />}
      {view === 'plans' && <PlansView sub={sub} onUpgrade={onUpgrade} />}
      {view === 'renewal' && <RenewalView sub={sub} onToggleRenew={onToggleRenew} />}
    </div>);

}

function CurrentSub({ sub, go, onToggleRenew }) {
  const toast = useToast();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const rows = [
  ['订阅状态', <Badge variant="success" dot>激活中</Badge>],
  ['计费方式', sub.cycleLabel],
  ['开通日期', <span className="mono">{sub.openedAt}</span>],
  ['当前周期', <span className="mono">{sub.periodStart} ~ {sub.periodEnd}</span>],
  ['下次续费', <span className="mono">{sub.nextRenewalAt} · {fmtMoney(sub.nextRenewalAmount)}</span>],
  ['扣款方式', <span className="row" style={{ gap: 6 }}><Icon name="creditcard" size={14} className="t3" />{sub.paymentMethod}</span>]];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18 }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--accent-soft)', display: 'grid', placeItems: 'center' }}><Icon name="crown" size={22} style={{ color: 'var(--accent-text)' }} /></div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{sub.planName}</div>
            <div className="t3" style={{ fontSize: 12.5 }}>剩余 {sub.remainingDays} 天到期</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div className="mono" style={{ fontSize: 20, fontWeight: 800 }}>{fmtMoney0(sub.nextRenewalAmount)}<span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>/{CYCLE_LABEL[sub.billingCycle]}</span></div>
          </div>
        </div>
        <div style={{ padding: '6px 22px' }}>
          {rows.map(([k, v], i) =>
          <div key={i} className="between" style={{ padding: '11px 0', borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 13.5 }}>
              <span className="muted">{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '16px 22px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <Btn variant="primary" icon="arrowUp" onClick={() => go('membership.plans')}>切换 / 升级套餐</Btn>
          <Btn variant="ghost" onClick={() => toast('已打开历史订阅记录')}>历史订阅</Btn>
          <Btn variant="danger" style={{ marginLeft: 'auto' }} onClick={() => setConfirmCancel(true)}>取消自动续费</Btn>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="card card-pad">
          <div className="between" style={{ marginBottom: 4 }}><span style={{ fontWeight: 700, fontSize: 14 }}>自动续费</span><Toggle on={sub.autoRenew} onChange={() => onToggleRenew()} /></div>
          <div className="t3" style={{ fontSize: 12 }}>{sub.autoRenew ? `将于 ${sub.nextRenewalAt} 自动扣款 ${fmtMoney0(sub.nextRenewalAmount)}，无缝续期。` : '已关闭，当前周期结束后将回落至免费版。'}</div>
        </div>
        <div className="card card-pad">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>本周期赠送积分</div>
          <div className="between" style={{ marginBottom: 8 }}>
            <span className="mono" style={{ fontSize: 22, fontWeight: 800 }}>{sub.grantedRemaining}</span>
            <span className="t3" style={{ fontSize: 12 }}>/ {sub.grantedThisCycle} 剩余</span>
          </div>
          <div className="progress"><i style={{ width: `${sub.grantedRemaining / sub.grantedThisCycle * 100}%` }} /></div>
          <div className="t3" style={{ fontSize: 11.5, marginTop: 10 }}>赠送积分将于 <b style={{ color: 'var(--text-2)' }}>{sub.periodEnd}</b> 周期结束时清零，不跨周期累计。</div>
        </div>
      </div>

      {confirmCancel &&
      <Modal title="取消自动续费？" onClose={() => setConfirmCancel(false)}
      footer={<>
            <Btn variant="ghost" onClick={() => setConfirmCancel(false)}>暂不取消</Btn>
            <Btn variant="danger" onClick={() => {onToggleRenew();setConfirmCancel(false);toast('已取消自动续费');}}>确认取消</Btn>
          </>}>
          <div style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.7 }}>
            取消后，你的 <b style={{ color: 'var(--text)' }}>{sub.planName}</b> 权益将保留至当前周期结束（<b className="mono" style={{ color: 'var(--text)' }}>{sub.periodEnd}</b>），到期后停止续费并回落至免费版。期间已发放的赠送积分不受影响。
          </div>
        </Modal>
      }
    </div>);

}

function PlansView({ sub, onUpgrade }) {
  const [cycle, setCycle] = useState('month');
  const [showCompare, setShowCompare] = useState(false);
  const curOrder = TIER_ORDER[sub.tier];

  const ctaFor = (p) => {
    const o = TIER_ORDER[p.tier];
    if (p.tier === sub.tier) return { label: '当前版本', variant: 'subtle', disabled: true };
    if (o > curOrder) return { label: '立即升级', variant: 'primary', disabled: false, action: 'upgrade' };
    return { label: '降级', variant: 'ghost', disabled: false, action: 'downgrade' };
  };

  return (
    <div>
      <div className="between" style={{ marginBottom: 18 }}>
        <div className="chip-tab">
          {['month', 'quarter', 'year'].map((cy) =>
          <button key={cy} className={cycle === cy ? 'active' : ''} onClick={() => setCycle(cy)}>
              按{CYCLE_LABEL[cy]}付{CYCLE_SAVE[cy] && <span style={{ color: 'var(--success)', fontSize: 10.5, marginLeft: 4, fontWeight: 700 }}>{CYCLE_SAVE[cy]}</span>}
            </button>
          )}
        </div>
        <span className="t3" style={{ fontSize: 12 }}>价格为占位示例，最终以 V1.1 配置为准</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {PLANS.map((p) => {
          const cta = ctaFor(p);
          const price = p.price[cycle];
          const isCur = p.tier === sub.tier;
          return (
            <div key={p.tier} className="card" style={{ display: 'flex', flexDirection: 'column', position: 'relative', borderColor: p.accent ? 'var(--accent)' : 'var(--border)', boxShadow: p.accent ? '0 0 0 1px var(--accent), var(--shadow-md)' : 'var(--shadow-sm)', overflow: 'visible' }}>
              {p.tag && <div style={{ position: 'absolute', top: -10, left: 16, background: p.accent ? 'var(--accent)' : 'var(--text)', color: p.accent ? 'var(--accent-fg)' : 'var(--bg)', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6 }}>{p.tag}</div>}
              <div style={{ padding: '20px 18px 16px' }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{p.name}</div>
                <div className="t3" style={{ fontSize: 11.5, marginTop: 3, minHeight: 30 }}>{p.desc}</div>
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span className="mono" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.02em' }}>{price === 0 ? '免费' : fmtMoney0(price)}</span>
                  {price > 0 && <span className="t3" style={{ fontSize: 12 }}>/{CYCLE_LABEL[cycle]}</span>}
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <Icon name="sparkle" size={13} style={{ color: 'var(--accent-text)' }} />
                  <span className="muted">赠送 <b style={{ color: 'var(--text)' }} className="mono">{fmtNum(p.grant[cycle])}</b> 积分/{CYCLE_LABEL[cycle]}</span>
                </div>
              </div>
              <div style={{ padding: '0 18px', flex: 1 }}>
                <div style={{ height: 1, background: 'var(--border)', marginBottom: 12 }} />
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {p.features.map((f, i) =>
                  <li key={i} style={{ display: 'flex', gap: 8, fontSize: 12.5, color: 'var(--text-2)' }}>
                      <Icon name="check" size={14} style={{ color: 'var(--accent-text)', flexShrink: 0, marginTop: 2 }} />{f}
                    </li>
                  )}
                </ul>
              </div>
              <div style={{ padding: 18 }}>
                <Btn variant={cta.variant} block disabled={cta.disabled}
                onClick={() => !cta.disabled && onUpgrade(p, cycle, cta.action)}>
                  {isCur && <Icon name="check" size={14} />}{cta.label}
                </Btn>
              </div>
            </div>);

        })}
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <button className="card-hd" style={{ width: '100%', cursor: 'pointer' }} onClick={() => setShowCompare((s) => !s)}>
          <Icon name="grid" size={16} className="t3" /><h3>权益对比详表</h3><span className="sub">覆盖全部套餐差异点</span>
          <Icon name="chevronDown" size={16} className="t3" style={{ marginLeft: 'auto', transform: showCompare ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
        </button>
        {showCompare &&
        <div className="tbl-wrap fadein">
            <table className="tbl">
              <thead><tr>
                <th>权益项</th>
                {PLANS.map((p) => <th key={p.tier} style={{ textAlign: 'center' }}>{p.name}</th>)}
              </tr></thead>
              <tbody>
                {ENTITLEMENTS.map((e, i) =>
              <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{e.label}</td>
                    {['free', 'standard', 'premium', 'ultimate'].map((tier) =>
                <td key={tier} style={{ textAlign: 'center' }}>
                        {typeof e[tier] === 'boolean' ?
                  e[tier] ? <Icon name="check" size={15} style={{ color: 'var(--success)' }} /> : <span className="t3">—</span> :
                  <span className={tier === sub.tier ? 'mono' : 'mono muted'} style={tier === sub.tier ? { fontWeight: 700, color: 'var(--accent-text)' } : {}}>{e[tier]}</span>}
                      </td>
                )}
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>);

}

function RenewalView({ sub, onToggleRenew }) {
  const toast = useToast();
  const [cards, setCards] = useState([
  { id: 'pm1', label: '微信支付', sub: '默认扣款方式', icon: 'wallet', isDefault: true },
  { id: 'pm2', label: '招商银行 •••• 6620', sub: '储蓄卡', icon: 'creditcard', isDefault: false }]
  );
  const reminders = [
  { day: 7, on: true }, { day: 3, on: true }, { day: 1, on: true }];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
      <div className="card card-pad">
        <div className="between" style={{ marginBottom: 14 }}><span style={{ fontWeight: 700, fontSize: 14 }}>自动续费</span><Toggle on={sub.autoRenew} onChange={onToggleRenew} /></div>
        <div className="t3" style={{ fontSize: 12.5, lineHeight: 1.6, marginBottom: 16 }}>开启后将在到期前自动扣款，确保权益无缝延续。可随时关闭。</div>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>续费提醒</div>
        {reminders.map((r, i) =>
        <div key={i} className="between" style={{ padding: '9px 0', borderBottom: i < reminders.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 13 }}>
            <span className="muted">到期前 {r.day} 天 · 站内信 + 邮件</span>
            <Toggle on={r.on} onChange={() => {}} />
          </div>
        )}
      </div>
      <div className="card">
        <div className="card-hd"><Icon name="creditcard" size={16} className="t3" /><h3>扣款方式</h3>
          <Btn variant="subtle" size="sm" icon="plus" style={{ marginLeft: 'auto' }} onClick={() => toast('打开绑卡流程')}>添加</Btn>
        </div>
        <div style={{ padding: '8px 0' }}>
          {cards.map((c) =>
          <div key={c.id} className="between" style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
              <div className="row">
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--surface-hover)', display: 'grid', placeItems: 'center' }}><Icon name={c.icon} size={16} className="muted" /></div>
                <div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.label}</div><div className="t3" style={{ fontSize: 11.5 }}>{c.sub}</div></div>
              </div>
              {c.isDefault ?
            <Badge variant="accent">默认</Badge> :
            <span className="linklike" style={{ fontSize: 12.5 }} onClick={() => {setCards((cs) => cs.map((x) => ({ ...x, isDefault: x.id === c.id })));toast('已设为默认');}}>设为默认</span>}
            </div>
          )}
        </div>
      </div>
    </div>);

}

window.MembershipPage = MembershipPage;
window.TIER_ORDER = TIER_ORDER;

/* ============ 积分中心 ============ */
const TX_CAT = {
  grant: { label: '赠送', variant: 'accent' }, purchase: { label: '充值', variant: 'success' },
  consume: { label: '消耗', variant: 'neutral' }, expire: { label: '过期', variant: 'warning' },
  refund: { label: '退款返还', variant: 'success' }, admin_adjust: { label: '调账', variant: 'accent' }
};

function CreditsPage({ view, go, balance, onBuy }) {
  const tabs = [
  { id: 'balance', label: '余额与明细' },
  { id: 'buy', label: '购买积分' },
  { id: 'auto', label: '自动充值' }];

  return (
    <div className="page fadein">
      <div className="page-head" data-comment-anchor="f2582d781e-div-16-7">
        <div className="page-title">积分中心</div>
        <div className="page-sub">AI 能力的计费单位 · 当前余额 {fmtNum(balance)} 积分</div>
      </div>
      <div className="subtabs">
        {tabs.map((t) => <button key={t.id} className={`subtab ${view === t.id ? 'active' : ''}`} onClick={() => go('credits.' + t.id)}>{t.label}</button>)}
      </div>
      {view === 'balance' && <BalanceView go={go} />}
      {view === 'buy' && <BuyView onBuy={onBuy} />}
      {view === 'auto' && <AutoTopupView />}
    </div>);

}

function BalanceView({ go }) {
  const toast = useToast();
  const c = CREDITS;
  const [fCat, setFCat] = useState('all');
  const [fDir, setFDir] = useState('all');
  const [sort, setSort] = useState({ key: 'time', dir: 'desc' });

  const buckets = [
  { key: 'granted', label: '赠送积分', d: c.granted, note: `本周期 · ${c.granted.expires} 到期`, color: 'var(--accent)' },
  { key: 'purchased', label: '充值积分', d: c.purchased, note: `最远 ${c.purchased.expires} 到期`, color: 'oklch(0.62 0.16 230)' },
  { key: 'promo', label: '活动积分', d: c.promo, note: `${c.promo.expires} 到期`, color: 'var(--warning)' }];


  let rows = TRANSACTIONS.filter((t) => (fCat === 'all' || t.cat === fCat) && (fDir === 'all' || t.dir === fDir));
  rows = [...rows].sort((a, b) => {
    let r = 0;
    if (sort.key === 'time') r = a.time < b.time ? -1 : 1;
    if (sort.key === 'amount') r = a.amount - b.amount;
    return sort.dir === 'asc' ? r : -r;
  });
  const toggleSort = (k) => setSort((s) => ({ key: k, dir: s.key === k && s.dir === 'desc' ? 'asc' : 'desc' }));

  return (
    <div>
      {/* aggregate */}
      <div className="card" style={{ marginBottom: 18, padding: '22px 24px', display: 'grid', gridTemplateColumns: '0.9fr 1px 1fr 1fr 1fr', gap: 24, alignItems: 'center' }}>
        <div>
          <div className="t3" style={{ fontSize: 12.5, fontWeight: 600 }}>总余额</div>
          <div className="mono" style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.1 }}>{fmtNum(c.total)}</div>
          <div className="t3" style={{ fontSize: 11.5 }}>积分</div>
        </div>
        <div style={{ height: 52, background: 'var(--border)' }} />
        {buckets.map((b) =>
        <div key={b.key}>
            <div className="row" style={{ gap: 6, marginBottom: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: b.color }} /><span style={{ fontSize: 12.5, fontWeight: 600 }}>{b.label}</span></div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 800 }}>{fmtNum(b.d.remaining)}<span className="t3" style={{ fontSize: 12, fontWeight: 600 }}> / {fmtNum(b.d.total)}</span></div>
            <div className="t3" style={{ fontSize: 11 }}>{b.note}</div>
          </div>
        )}
      </div>

      {/* expiring banner */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', marginBottom: 18, borderColor: 'var(--warning)', background: 'var(--warning-soft)' }}>
        <Icon name="alert" size={17} style={{ color: 'var(--warning)' }} />
        <span style={{ fontSize: 13 }}>未来 30 天将过期 <b className="mono">{c.expiringSoon.amount}</b> 积分</span>
        <Btn variant="ghost" size="sm" style={{ marginLeft: 'auto' }} onClick={() => toast('已跳转至 AI 工作台')}>立即使用</Btn>
      </div>

      {/* detail table */}
      <div className="card">
        <div className="card-hd"><Icon name="clock" size={16} className="t3" /><h3>积分明细</h3>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <select className="select select-sm" value={fDir} onChange={(e) => setFDir(e.target.value)}>
              <option value="all">全部方向</option><option value="credit">收入</option><option value="debit">支出</option>
            </select>
            <select className="select select-sm" value={fCat} onChange={(e) => setFCat(e.target.value)}>
              <option value="all">全部类型</option>
              {Object.entries(TX_CAT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <Btn variant="ghost" size="sm" icon="download" onClick={() => toast('已导出 CSV（最多 1 年）')}>导出</Btn>
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr>
              <th className="sortable" onClick={() => toggleSort('time')}><span className="th-in">时间 {sort.key === 'time' && <Icon name={sort.dir === 'asc' ? 'arrowUp' : 'arrowDown'} size={12} />}</span></th>
              <th>类型</th><th>业务描述</th><th>来源 / 去向</th>
              <th className="sortable" style={{ textAlign: 'right' }} onClick={() => toggleSort('amount')}><span className="th-in">变动 {sort.key === 'amount' && <Icon name={sort.dir === 'asc' ? 'arrowUp' : 'arrowDown'} size={12} />}</span></th>
              <th style={{ textAlign: 'right' }}>余额</th>
            </tr></thead>
            <tbody>
              {rows.map((t) =>
              <tr key={t.id}>
                  <td className="mono t3" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{t.time}</td>
                  <td><Badge variant={TX_CAT[t.cat].variant}>{TX_CAT[t.cat].label}</Badge></td>
                  <td style={{ fontWeight: 600 }}>{t.desc}</td>
                  <td>{t.ref === '—' ? <span className="t3">—</span> : <span className="linklike mono" style={{ fontSize: 12 }} onClick={() => go('orders.list')}>{t.ref}</span>}</td>
                  <td style={{ textAlign: 'right' }}><span className={t.dir === 'credit' ? 'cell-pos' : 'cell-neg'}>{t.dir === 'credit' ? '+' : '−'}{t.amount}</span></td>
                  <td style={{ textAlign: 'right' }}><span className="mono t3">{fmtNum(t.balance)}</span></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <div className="empty"><Icon name="inbox" size={40} /><div>没有符合条件的记录</div></div>}
      </div>
    </div>);

}

function BuyView({ onBuy }) {
  const [custom, setCustom] = useState('');
  const customCredits = custom ? Math.max(0, parseInt(custom) || 0) : 0;
  const unit = 3.3; // cents per credit approx
  const customCents = Math.round(customCredits * unit);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        {CREDIT_PACKS.map((p) => {
          const per = p.priceCents / p.credits;
          return (
            <div key={p.id} className="card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'visible', borderColor: p.tag === '最划算' ? 'var(--accent)' : 'var(--border)', boxShadow: p.tag === '最划算' ? '0 0 0 1px var(--accent), var(--shadow-md)' : 'var(--shadow-sm)' }}>
              {p.tag && <div style={{ position: 'absolute', top: -10, left: 16, background: p.tag === '最划算' ? 'var(--accent)' : 'var(--gold)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6 }}>{p.tag}</div>}
              <div className="card-pad" style={{ flex: 1 }}>
                <div className="t3" style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
                  <Icon name="coins" size={18} style={{ color: 'var(--accent-text)' }} />
                  <span className="mono" style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.02em' }}>{fmtNum(p.credits)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
                  <span className="mono" style={{ fontSize: 22, fontWeight: 800 }}>{fmtMoney0(p.priceCents)}</span>
                  <span className="mono t3" style={{ fontSize: 12.5, textDecoration: 'line-through' }}>{fmtMoney0(p.originalCents)}</span>
                </div>
                <div className="t3" style={{ fontSize: 11, marginTop: 6 }}>≈ {per.toFixed(2)} 分/积分 · 购买后 {Math.round(p.validityDays / 30)} 个月有效</div>
              </div>
              <div style={{ padding: 16, paddingTop: 0 }}>
                <Btn variant={p.tag === '最划算' ? 'primary' : 'ghost'} block onClick={() => onBuy(p)}>立即购买</Btn>
              </div>
            </div>);

        })}
      </div>

      <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }} data-comment-anchor="5d28d53130-div-157-11">自定义购买</div>
          <div className="t3" style={{ fontSize: 12, marginTop: 2 }}>输入想购买的积分数，按阶梯单价自动计算</div>
        </div>
        <div className="search" style={{ width: 200 }}>
          <Icon name="coins" />
          <input className="input" type="number" placeholder="输入积分数量" value={custom} onChange={(e) => setCustom(e.target.value)} style={{ paddingLeft: 33 }} />
        </div>
        <div style={{ minWidth: 120 }}>
          <div className="t3" style={{ fontSize: 11 }}>预计金额</div>
          <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-text)' }}>{fmtMoney(customCents)}</div>
        </div>
        <Btn variant="primary" disabled={customCredits < 100} style={{ marginLeft: 'auto' }}
        onClick={() => onBuy({ id: 'custom', name: '自定义积分', credits: customCredits, priceCents: customCents, originalCents: customCents, validityDays: 365 })}>
          {customCredits < 100 ? '最少 100 积分' : '购买'}
        </Btn>
      </div>
    </div>);

}

function AutoTopupView() {
  const toast = useToast();
  const [on, setOn] = useState(true);
  const [threshold, setThreshold] = useState('200');
  const [target, setTarget] = useState('1200');
  const [maxDay, setMaxDay] = useState('2');
  const [maxMonth, setMaxMonth] = useState('30000');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
      <div className="card">
        <div className="card-hd"><Icon name="refresh" size={16} className="t3" /><h3>自动充值</h3><span className="sub">余额不足时自动充值，避免任务中断</span></div>
        <div className="card-pad">
          <div className="between" style={{ padding: '4px 0 16px', borderBottom: '1px solid var(--border)' }}>
            <div><div style={{ fontWeight: 700 }}>启用自动充值</div><div className="t3" style={{ fontSize: 12 }}>需已绑定默认支付方式</div></div>
            <Toggle on={on} onChange={(v) => {setOn(v);toast(v ? '已开启自动充值' : '已关闭自动充值');}} />
          </div>

          <div style={{ opacity: on ? 1 : .45, pointerEvents: on ? 'auto' : 'none', paddingTop: 18, transition: 'opacity .2s' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="触发阈值" hint="余额低于此值时触发">
                <select className="select" value={threshold} onChange={(e) => setThreshold(e.target.value)}>
                  {['100', '200', '500', '1000'].map((v) => <option key={v} value={v}>低于 {v} 积分</option>)}
                </select>
              </Field>
              <Field label="充值目标" hint="自动充值至该余额">
                <select className="select" value={target} onChange={(e) => setTarget(e.target.value)}>
                  {['500', '1200', '3000', '8000'].map((v) => <option key={v} value={v}>充至 {v} 积分</option>)}
                </select>
              </Field>
              <Field label="单日最大次数" hint="防止失控扣款">
                <select className="select" value={maxDay} onChange={(e) => setMaxDay(e.target.value)}>
                  {['1', '2', '3', '5'].map((v) => <option key={v} value={v}>{v} 次 / 日</option>)}
                </select>
              </Field>
              <Field label="单月最大金额" hint="超过则暂停自动充值">
                <select className="select" value={maxMonth} onChange={(e) => setMaxMonth(e.target.value)}>
                  {[['10000', '¥100'], ['30000', '¥300'], ['50000', '¥500'], ['100000', '¥1,000']].map(([v, l]) => <option key={v} value={v}>{l} / 月</option>)}
                </select>
              </Field>
            </div>
            <Field label="默认支付方式">
              <div className="row" style={{ padding: '11px 13px', border: '1px solid var(--border-strong)', borderRadius: 8 }}>
                <Icon name="wallet" size={16} className="muted" /><span style={{ fontWeight: 600, fontSize: 13.5 }}>微信支付</span>
                <Badge variant="accent">默认</Badge>
                <span className="linklike" style={{ marginLeft: 'auto', fontSize: 12.5 }} onClick={() => toast('打开支付方式管理')}>更换</span>
              </div>
            </Field>
            <Btn variant="primary" onClick={() => toast('自动充值配置已保存')}>保存配置</Btn>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="card card-pad">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>当前规则预览</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            <div className="row" style={{ gap: 8 }}><Icon name="alert" size={14} style={{ color: 'var(--warning)' }} /><span className="muted">余额低于 <b style={{ color: 'var(--text)' }} className="mono">{threshold}</b> 积分时</span></div>
            <div className="row" style={{ gap: 8 }}><Icon name="arrowRight" size={14} className="t3" /><span className="muted">自动充值至 <b style={{ color: 'var(--text)' }} className="mono">{target}</b> 积分</span></div>
            <div className="row" style={{ gap: 8 }}><Icon name="shield" size={14} className="t3" /><span className="muted">每日最多 {maxDay} 次 · 每月最高 {fmtMoney0(parseInt(maxMonth))}</span></div>
          </div>
        </div>
        <div className="card card-pad">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>最近自动充值</div>
          <div className="between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
            <div><div style={{ fontWeight: 600 }}>充值 1,200 积分</div><div className="t3 mono" style={{ fontSize: 11 }}>2026-06-09 02:00</div></div>
            <Badge variant="success" dot>成功</Badge>
          </div>
          <div className="t3" style={{ fontSize: 11.5, marginTop: 12 }}>自动充值订单与普通购买结构一致，仅标识来源 <span className="mono">auto_topup</span>。成功 / 失败均站内信 + 邮件通知。</div>
        </div>
      </div>
    </div>);

}

window.CreditsPage = CreditsPage;

/* ============ 订单与发票 ============ */
function OrdersPage({ view, go }) {
  const tabs = [
    { id: 'list', label: '订单记录' },
    { id: 'invoice', label: '发票管理' },
    { id: 'refund', label: '退款申请' },
  ];
  return (
    <div className="page fadein">
      <div className="page-head">
        <div className="page-title">订单与发票</div>
        <div className="page-sub">查看订单、申请发票与退款</div>
      </div>
      <div className="subtabs">
        {tabs.map(t => <button key={t.id} className={`subtab ${view === t.id ? 'active' : ''}`} onClick={() => go('orders.' + t.id)}>{t.label}</button>)}
      </div>
      {view === 'list' && <OrderList/>}
      {view === 'invoice' && <InvoiceView/>}
      {view === 'refund' && <RefundView/>}
    </div>
  );
}

function OrderList() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [fStatus, setFStatus] = useState('all');
  const [fType, setFType] = useState('all');
  const [sort, setSort] = useState({ key: 'time', dir: 'desc' });
  const [detail, setDetail] = useState(null);
  const [refundFor, setRefundFor] = useState(null);
  const [invoiceFor, setInvoiceFor] = useState(null);

  let rows = ORDERS.filter(o =>
    (fStatus === 'all' || o.status === fStatus) &&
    (fType === 'all' || o.type === fType) &&
    (q === '' || o.id.toLowerCase().includes(q.toLowerCase()) || o.goods.includes(q))
  );
  rows = [...rows].sort((a, b) => {
    let r = a.time < b.time ? -1 : 1;
    if (sort.key === 'total') r = a.total - b.total;
    return sort.dir === 'asc' ? r : -r;
  });
  const toggleSort = k => setSort(s => ({ key: k, dir: s.key === k && s.dir === 'desc' ? 'asc' : 'desc' }));

  return (
    <div>
      <div className="filter-row">
        <div className="search">
          <Icon name="search"/>
          <input className="input" placeholder="搜索订单号或商品名" value={q} onChange={e => setQ(e.target.value)}/>
        </div>
        <select className="select select-sm" value={fType} onChange={e => setFType(e.target.value)}>
          <option value="all">全部类型</option>
          <option value="subscription_new">订阅首购</option><option value="subscription_renew">续费</option>
          <option value="subscription_upgrade">升级</option><option value="credit_pack">积分包</option><option value="auto_topup">自动充值</option>
        </select>
        <select className="select select-sm" value={fStatus} onChange={e => setFStatus(e.target.value)}>
          <option value="all">全部状态</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <Btn variant="ghost" size="sm" icon="download" onClick={() => toast('已导出订单 CSV')}>导出</Btn>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr>
              <th>订单号</th>
              <th className="sortable" onClick={() => toggleSort('time')}><span className="th-in">创建时间 {sort.key === 'time' && <Icon name={sort.dir === 'asc' ? 'arrowUp' : 'arrowDown'} size={12}/>}</span></th>
              <th>商品</th><th>类型</th>
              <th className="sortable" style={{ textAlign: 'right' }} onClick={() => toggleSort('total')}><span className="th-in">金额 {sort.key === 'total' && <Icon name={sort.dir === 'asc' ? 'arrowUp' : 'arrowDown'} size={12}/>}</span></th>
              <th>状态</th><th style={{ textAlign: 'right' }}>操作</th>
            </tr></thead>
            <tbody>
              {rows.map(o => (
                <tr key={o.id}>
                  <td><Copyable text={o.id}><span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{o.id}</span></Copyable></td>
                  <td className="mono t3" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{o.time}</td>
                  <td style={{ fontWeight: 600, maxWidth: 220 }}>{o.goods}</td>
                  <td><Badge variant="neutral">{o.typeLabel}</Badge></td>
                  <td style={{ textAlign: 'right' }}><span className="mono" style={{ fontWeight: 700 }}>{fmtMoney(o.total)}</span></td>
                  <td><Badge variant={ORDER_STATUS[o.status].cls.replace('badge-', '')} dot>{ORDER_STATUS[o.status].label}</Badge></td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', gap: 4, justifyContent: 'flex-end' }}>
                      {o.status === 'pending' && <Btn variant="primary" size="sm" onClick={() => toast('跳转支付')}>支付</Btn>}
                      <span className="linklike" style={{ fontSize: 12.5, padding: '0 6px' }} onClick={() => setDetail(o)}>详情</span>
                      {o.status === 'completed' && o.type === 'credit_pack' && <span className="linklike" style={{ fontSize: 12.5, padding: '0 6px' }} onClick={() => setRefundFor(o)}>退款</span>}
                      {o.status === 'completed' && !o.invoice && <span className="linklike" style={{ fontSize: 12.5, padding: '0 6px' }} onClick={() => setInvoiceFor(o)}>开票</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <div className="empty"><Icon name="inbox" size={40}/><div>没有符合条件的订单</div></div>}
      </div>

      {detail && <OrderDetail order={detail} onClose={() => setDetail(null)} onRefund={() => { setDetail(null); setRefundFor(detail); }} onInvoice={() => { setDetail(null); setInvoiceFor(detail); }}/>}
      {refundFor && <RefundModal order={refundFor} onClose={() => setRefundFor(null)}/>}
      {invoiceFor && <InvoiceModal order={invoiceFor} onClose={() => setInvoiceFor(null)}/>}
    </div>
  );
}

function OrderDetail({ order, onClose, onRefund, onInvoice }) {
  const groups = [
    { title: '订单基础', rows: [
      ['订单号', <Copyable text={order.id}><span className="mono">{order.id}</span></Copyable>],
      ['创建时间', <span className="mono">{order.time}</span>],
      ['支付时间', order.paidAt ? <span className="mono">{order.paidAt}</span> : <span className="t3">—</span>],
      ['商品', order.goods],
      ['应付 / 实付', <span><span className="mono t3" style={{ textDecoration: order.discount ? 'line-through' : 'none', marginRight: 6 }}>{fmtMoney(order.subtotal)}</span><span className="mono" style={{ fontWeight: 700 }}>{fmtMoney(order.total)}</span></span>],
      ['优惠', order.coupon ? <span style={{ color: 'var(--success)' }}>{order.coupon}</span> : <span className="t3">无</span>],
    ]},
    { title: '支付信息', rows: [
      ['支付渠道', order.pay],
      ['支付流水号', order.payRef ? <span className="mono" style={{ fontSize: 12 }}>{order.payRef}</span> : <span className="t3">—</span>],
    ]},
    { title: '履约信息', rows: [
      ['到账积分', order.credits ? <span className="mono" style={{ color: 'var(--success)', fontWeight: 700 }}>+{fmtNum(order.credits)}</span> : <span className="t3">—</span>],
      ['积分批次', order.credits ? <span className="mono" style={{ fontSize: 12 }}>BAT-PUR-{order.id.slice(-4)}</span> : <span className="t3">—</span>],
    ]},
    { title: '发票信息', rows: [
      ['发票状态', order.invoice === 'issued' ? <Badge variant="success">已开具</Badge> : order.invoice === 'reversed' ? <Badge variant="danger">已红冲</Badge> : <Badge variant="neutral">未申请</Badge>],
    ]},
  ];
  return (
    <Modal title="订单详情" sub={order.id} onClose={onClose} wide
      footer={<>
        {order.status === 'completed' && order.type === 'credit_pack' && <Btn variant="danger" style={{ marginRight: 'auto' }} onClick={onRefund}>申请退款</Btn>}
        <Btn variant="ghost" onClick={onClose}>关闭</Btn>
        {order.status === 'completed' && !order.invoice && <Btn variant="primary" onClick={onInvoice}>申请发票</Btn>}
      </>}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <Badge variant={ORDER_STATUS[order.status].cls.replace('badge-', '')} dot>{ORDER_STATUS[order.status].label}</Badge>
        <Badge variant="neutral">{order.typeLabel}</Badge>
      </div>
      {groups.map((g, gi) => (
        <div key={gi} style={{ marginBottom: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>{g.title}</div>
          <div className="card" style={{ boxShadow: 'none' }}>
            {g.rows.map(([k, v], i) => (
              <div key={i} className="between" style={{ padding: '11px 14px', borderBottom: i < g.rows.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 13 }}>
                <span className="muted">{k}</span><span style={{ fontWeight: 600, textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </Modal>
  );
}

function RefundModal({ order, onClose }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);
  const reasons = ['购买错误 / 重复购买', '功能不符合预期', '积分暂不需要', '其他原因'];

  if (done) {
    return (
      <Modal title="退款申请已提交" onClose={onClose} footer={<Btn variant="primary" block onClick={onClose}>知道了</Btn>}>
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--success-soft)', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}><Icon name="checkCircle" size={30} style={{ color: 'var(--success)' }}/></div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>申请已进入审核</div>
          <div className="t3" style={{ fontSize: 13, marginTop: 8, maxWidth: 320, margin: '8px auto 0', lineHeight: 1.6 }}>小额且符合规则的申请将自动通过，其余将由客服在 1-3 个工作日内处理，结果会通过站内信 + 邮件通知。</div>
        </div>
      </Modal>
    );
  }
  return (
    <Modal title="申请退款" sub={order.id} onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>取消</Btn>
        <Btn variant="primary" disabled={!reason} onClick={() => { setDone(true); toast('退款申请已提交'); }}>提交申请</Btn>
      </>}>
      <div className="card" style={{ boxShadow: 'none', padding: '12px 14px', marginBottom: 16, background: 'var(--surface-2)' }}>
        <div className="between" style={{ fontSize: 13 }}><span className="muted">{order.goods}</span><span className="mono" style={{ fontWeight: 700 }}>{fmtMoney(order.total)}</span></div>
      </div>
      <div className="row" style={{ gap: 8, fontSize: 12, color: 'var(--text-2)', background: 'var(--warning-soft)', padding: '10px 12px', borderRadius: 8, marginBottom: 16 }}>
        <Icon name="alert" size={14} style={{ color: 'var(--warning)', flexShrink: 0 }}/>
        <span>该积分包购买后 7 天内、已消耗占比 &lt; 30% 可申请。退款将从最近发放批次冲销剩余积分并原路退回。</span>
      </div>
      <Field label="退款原因" req>
        <select className="select" value={reason} onChange={e => setReason(e.target.value)}>
          <option value="">请选择退款原因</option>
          {reasons.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </Field>
      <Field label="补充说明" hint="选填，详细描述有助于加快审核">
        <textarea className="textarea" placeholder="请描述具体情况…" value={note} onChange={e => setNote(e.target.value)}/>
      </Field>
      <Field label="上传凭证（可选）">
        <div style={{ border: '1.5px dashed var(--border-strong)', borderRadius: 10, padding: '20px', textAlign: 'center', color: 'var(--text-3)' }}>
          <Icon name="download" size={22} style={{ transform: 'rotate(180deg)', marginBottom: 6 }}/>
          <div style={{ fontSize: 12.5 }}>点击或拖拽上传截图 · 支持 JPG/PNG</div>
        </div>
      </Field>
    </Modal>
  );
}

function InvoiceModal({ order, onClose }) {
  const toast = useToast();
  const [headerId, setHeaderId] = useState(INVOICE_HEADERS.find(h => h.isDefault)?.id);
  const [email, setEmail] = useState(ACCOUNT.email);
  const [content, setContent] = useState('信息技术服务费');
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <Modal title="开票申请已提交" onClose={onClose} footer={<Btn variant="primary" block onClick={onClose}>知道了</Btn>}>
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-soft)', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}><Icon name="receipt" size={28} style={{ color: 'var(--accent-text)' }}/></div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>发票开具中</div>
          <div className="t3" style={{ fontSize: 13, marginTop: 8, maxWidth: 320, margin: '8px auto 0', lineHeight: 1.6 }}>预计 1-3 个工作日内开具，开具后将发送至 <b style={{ color: 'var(--text-2)' }}>{email}</b>，并可在发票管理中下载 PDF。</div>
        </div>
      </Modal>
    );
  }
  return (
    <Modal title="申请发票" sub={order.id} onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>取消</Btn>
        <Btn variant="primary" onClick={() => { setDone(true); toast('开票申请已提交'); }}>提交开票</Btn>
      </>}>
      <div className="card" style={{ boxShadow: 'none', padding: '12px 14px', marginBottom: 16, background: 'var(--surface-2)' }}>
        <div className="between" style={{ fontSize: 13 }}><span className="muted">{order.goods}</span><span className="mono" style={{ fontWeight: 700 }}>开票金额 {fmtMoney(order.total)}</span></div>
      </div>
      <Field label="选择抬头" req>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {INVOICE_HEADERS.map(h => (
            <button key={h.id} onClick={() => setHeaderId(h.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 9, border: `1px solid ${headerId === h.id ? 'var(--accent)' : 'var(--border-strong)'}`, background: headerId === h.id ? 'var(--accent-soft)' : 'var(--surface)', textAlign: 'left' }}>
              <Icon name={h.type === 'business' ? 'file' : 'user'} size={16} className={headerId === h.id ? '' : 'muted'} style={headerId === h.id ? { color: 'var(--accent-text)' } : {}}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{h.name}</div>
                {h.taxId && <div className="t3 mono" style={{ fontSize: 11 }}>{h.taxId}</div>}
              </div>
              <Badge variant="neutral">{h.type === 'business' ? '企业' : '个人'}</Badge>
            </button>
          ))}
          <button className="row" style={{ gap: 6, color: 'var(--accent-text)', fontWeight: 600, fontSize: 12.5, padding: '6px 4px' }} onClick={() => toast('打开新增抬头表单')}><Icon name="plus" size={14}/>新增抬头</button>
        </div>
      </Field>
      <Field label="发票内容">
        <select className="select" value={content} onChange={e => setContent(e.target.value)}>
          {['信息技术服务费', '软件服务费', '会员服务费'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="收票邮箱" req>
        <input className="input" value={email} onChange={e => setEmail(e.target.value)}/>
      </Field>
    </Modal>
  );
}

function InvoiceView() {
  const toast = useToast();
  const [headers, setHeaders] = useState(INVOICE_HEADERS);
  const issued = ORDERS.filter(o => o.invoice === 'issued');
  const reversed = ORDERS.filter(o => o.invoice === 'reversed');
  const all = [...issued.map(o => ({ ...o, st: 'issued' })), ...reversed.map(o => ({ ...o, st: 'reversed' }))];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
      <div className="card">
        <div className="card-hd"><Icon name="receipt" size={16} className="t3"/><h3>发票记录</h3></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>订单 / 商品</th><th style={{ textAlign: 'right' }}>金额</th><th>状态</th><th style={{ textAlign: 'right' }}>操作</th></tr></thead>
            <tbody>
              {all.map(o => (
                <tr key={o.id}>
                  <td><div style={{ fontWeight: 600, fontSize: 13 }}>{o.goods}</div><div className="t3 mono" style={{ fontSize: 11 }}>{o.id}</div></td>
                  <td style={{ textAlign: 'right' }}><span className="mono" style={{ fontWeight: 700 }}>{fmtMoney(o.total)}</span></td>
                  <td>{o.st === 'issued' ? <Badge variant="success">已开具</Badge> : <Badge variant="danger">已红冲</Badge>}</td>
                  <td style={{ textAlign: 'right' }}>
                    {o.st === 'issued'
                      ? <span className="linklike" style={{ fontSize: 12.5 }} onClick={() => toast('开始下载 PDF')}>下载 PDF</span>
                      : <span className="t3" style={{ fontSize: 12.5 }}>退款红冲</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {all.length === 0 && <div className="empty"><Icon name="receipt" size={40}/><div>暂无发票记录</div></div>}
      </div>

      <div className="card">
        <div className="card-hd"><Icon name="file" size={16} className="t3"/><h3>抬头管理</h3>
          <Btn variant="subtle" size="sm" icon="plus" style={{ marginLeft: 'auto' }} onClick={() => toast('新增抬头')}>新增</Btn>
        </div>
        <div style={{ padding: '8px 0' }}>
          {headers.map(h => (
            <div key={h.id} className="between" style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
              <div className="row">
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface-hover)', display: 'grid', placeItems: 'center' }}><Icon name={h.type === 'business' ? 'file' : 'user'} size={15} className="muted"/></div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{h.name}</div>
                  {h.taxId && <div className="t3 mono" style={{ fontSize: 10.5 }}>{h.taxId}</div>}
                </div>
              </div>
              {h.isDefault ? <Badge variant="accent">默认</Badge>
                : <span className="linklike" style={{ fontSize: 12 }} onClick={() => { setHeaders(hs => hs.map(x => ({ ...x, isDefault: x.id === h.id }))); toast('已设为默认'); }}>设默认</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RefundView() {
  const refundable = ORDERS.filter(o => o.status === 'completed' && (o.type === 'credit_pack' || o.type === 'auto_topup'));
  const [target, setTarget] = useState(null);
  return (
    <div>
      <div className="card" style={{ marginBottom: 18, padding: '16px 20px' }}>
        <div className="row" style={{ gap: 10 }}>
          <Icon name="shield" size={18} className="t3"/>
          <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
            <b style={{ color: 'var(--text)' }}>退款规则（草案，参数 TBD）：</b>积分包购买后 X 天内且消耗占比 &lt; Y% 可申请；订阅首购开通后 X 天内未使用付费功能可申请；续费不支持自助退款，需联系客服。
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-hd"><Icon name="refresh" size={16} className="t3"/><h3>可申请退款的订单</h3></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>订单号</th><th>商品</th><th>支付时间</th><th style={{ textAlign: 'right' }}>金额</th><th style={{ textAlign: 'right' }}>操作</th></tr></thead>
            <tbody>
              {refundable.map(o => (
                <tr key={o.id}>
                  <td><span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{o.id}</span></td>
                  <td style={{ fontWeight: 600 }}>{o.goods}</td>
                  <td className="mono t3" style={{ fontSize: 12 }}>{o.paidAt}</td>
                  <td style={{ textAlign: 'right' }}><span className="mono" style={{ fontWeight: 700 }}>{fmtMoney(o.total)}</span></td>
                  <td style={{ textAlign: 'right' }}><Btn variant="danger" size="sm" onClick={() => setTarget(o)}>申请退款</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {target && <RefundModal order={target} onClose={() => setTarget(null)}/>}
    </div>
  );
}

window.OrdersPage = OrdersPage;


/* ============ 消耗统计 ============ */
function StatsPage({ view, go }) {
  const tabs = [
  { id: 'overview', label: '概览' },
  { id: 'detail', label: '明细' }];

  return (
    <div className="page fadein">
      <div className="page-head">
        <div className="page-title">消耗统计</div>
        <div className="page-sub">了解你的 AI 用量分布与趋势</div>
      </div>
      <div className="subtabs">
        {tabs.map((t) => <button key={t.id} className={`subtab ${view === t.id ? 'active' : ''}`} onClick={() => go('stats.' + t.id)}>{t.label}</button>)}
      </div>
      {view === 'overview' && <StatsOverview />}
      {view === 'detail' && <StatsDetail />}
    </div>);

}

function StatsOverview() {
  const [range, setRange] = useState('month');
  const s = STATS;
  const ranges = [['today', '今日'], ['week', '本周'], ['month', '本月'], ['custom', '自定义']];
  const maxTop = Math.max(...s.topFunctions.map((t) => t.count));
  const dayLabels = s.daily.map((_, i) => `${i + 1}`);

  const kpis = [
  { label: '消耗积分总量', value: fmtNum(s.totalCredits), delta: s.deltaCredits, icon: 'zap' },
  { label: '折算金额', value: fmtMoney0(s.estValue), sub: '按充值积分均价估算', icon: 'wallet' },
  { label: '使用次数', value: fmtNum(s.taskCount), delta: s.deltaTasks, icon: 'sparkle' },
  { label: '平均单次消耗', value: s.avgPerTask, sub: '积分 / 次', icon: 'chart' }];


  return (
    <div>
      <div className="between" style={{ marginBottom: 18 }}>
        <div className="chip-tab">
          {ranges.map(([k, l]) => <button key={k} className={range === k ? 'active' : ''} onClick={() => setRange(k)}>{l}</button>)}
        </div>
        <span className="t3" style={{ fontSize: 12 }}>数据每小时更新一次</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 18 }}>
        {kpis.map((k, i) =>
        <div key={i} className="card card-pad">
            <div className="between"><span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>{k.label}</span><Icon name={k.icon} size={16} className="t3" /></div>
            <div className="mono" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.02em', marginTop: 10 }}>{k.value}</div>
            <div style={{ marginTop: 8, minHeight: 20 }}>
              {k.delta != null ?
            <Badge variant={k.delta >= 0 ? 'danger' : 'success'}><Icon name={k.delta >= 0 ? 'trendUp' : 'trendDown'} size={11} /> {Math.abs(Math.round(k.delta * 100))}% 较上月</Badge> :
            <span className="t3" style={{ fontSize: 11.5 }}>{k.sub}</span>}
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-hd" data-comment-anchor="cc04b395b9-div-60-9"><Icon name="chart" size={16} className="t3" /><h3>消耗趋势</h3><span className="sub">近 30 天 · 每日积分消耗</span></div>
        <div className="card-pad"><LineChart data={s.daily} labels={dayLabels} height={240} /></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 18 }}>
        <div className="card">
          <div className="card-hd" data-comment-anchor="40c8bd5055-div-66-11"><Icon name="grid" size={16} className="t3" /><h3>按功能分布</h3></div>
          <div className="card-pad" style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <DonutChart data={s.byFunction} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
              {s.byFunction.map((f, i) =>
              <div key={i} className="between" style={{ fontSize: 12.5 }}>
                  <span className="row" style={{ gap: 7 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: f.color }} />{f.name}</span>
                  <span className="mono" style={{ fontWeight: 600 }}>{fmtNum(f.credits)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-hd" data-comment-anchor="2e6d569b59-div-80-11"><Icon name="trendUp" size={16} className="t3" /><h3>Top 5 最常用功能</h3><span className="sub">按调用次数</span></div>
          <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {s.topFunctions.map((t, i) =>
            <div key={i}>
                <div className="between" style={{ fontSize: 12.5, marginBottom: 6 }}><span style={{ fontWeight: 600 }}>{t.name}</span><span className="mono t3">{t.count} 次</span></div>
                <HBar value={t.count} max={maxTop} color={s.byFunction[i]?.color} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18, padding: '24px', display: 'flex', alignItems: 'center', gap: 14, color: 'var(--text-3)', justifyContent: 'center' }}>
        <Icon name="grid" size={18} />
        <span style={{ fontSize: 13 }}>7 天 × 24 小时使用热力图将于 V1.1 上线</span>
      </div>
    </div>);

}

function StatsDetail() {
  const toast = useToast();
  const [agg, setAgg] = useState('time'); // time | type
  const [open, setOpen] = useState(null);
  const statusBadge = { ok: ['badge-success', '成功'], failed: ['badge-danger', '失败 · 已退回'] };

  return (
    <div>
      <div className="filter-row">
        <div className="chip-tab">
          <button className={agg === 'time' ? 'active' : ''} onClick={() => setAgg('time')}>按时间</button>
          <button className={agg === 'type' ? 'active' : ''} onClick={() => setAgg('type')}>按任务类型</button>
        </div>
        <div style={{ flex: 1 }} />
        <Btn variant="ghost" size="sm" icon="download" onClick={() => toast('已导出消耗明细')}>导出</Btn>
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr>
              <th>任务 ID</th><th>时间</th><th>类型</th><th>模型</th>
              <th style={{ textAlign: 'right' }}>消耗</th><th style={{ textAlign: 'right' }}>耗时</th><th>状态</th><th></th>
            </tr></thead>
            <tbody>
              {TASK_DETAIL.map((t) =>
              <React.Fragment key={t.id}>
                  <tr style={{ cursor: 'pointer' }} onClick={() => setOpen(open === t.id ? null : t.id)}>
                    <td><span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{t.id}</span></td>
                    <td className="mono t3" style={{ fontSize: 12 }}>{t.time}</td>
                    <td style={{ fontWeight: 600 }}>{t.type}</td>
                    <td><Badge variant="neutral">{t.model}</Badge></td>
                    <td style={{ textAlign: 'right' }}>{t.credits > 0 ? <span className="cell-neg">−{t.credits}</span> : <span className="t3 mono">0</span>}</td>
                    <td style={{ textAlign: 'right' }} className="mono t3">{(t.ms / 1000).toFixed(1)}s</td>
                    <td><Badge variant={statusBadge[t.status][0].replace('badge-', '')} dot>{statusBadge[t.status][1]}</Badge></td>
                    <td style={{ textAlign: 'right', width: 30 }}><Icon name="chevronDown" size={15} className="t3" style={{ transform: open === t.id ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} /></td>
                  </tr>
                  {open === t.id &&
                <tr className="fadein"><td colSpan={8} style={{ background: 'var(--surface-2)', padding: 0 }}>
                      <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 40px', fontSize: 12.5 }}>
                        <div className="between"><span className="muted">入参摘要</span><span style={{ fontWeight: 600 }}>{t.summary}</span></div>
                        <div className="between"><span className="muted">调用模型</span><span className="mono">{t.model}</span></div>
                        <div className="between"><span className="muted">实际耗时</span><span className="mono">{t.ms} ms</span></div>
                        <div className="between"><span className="muted">积分处理</span><span>{t.status === 'failed' ? <span style={{ color: 'var(--success)' }}>异常 · 积分已全额退回</span> : <span className="mono">扣减 {t.credits}</span>}</span></div>
                        <div className="between"><span className="muted">结果链接</span>{t.status === 'ok' ? <span className="linklike">查看结果 →</span> : <span className="t3">无</span>}</div>
                      </div>
                    </td></tr>
                }
                </React.Fragment>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="t3" style={{ fontSize: 12, marginTop: 14, textAlign: 'center' }}>明细数据等同积分中心「支出」项，额外提供任务下钻与异常调用标识</div>
    </div>);

}

window.StatsPage = StatsPage;

/* ============ 优惠与活动 ============ */
function PromoPage({ view, go }) {
  const tabs = [{ id: 'coupons', label: '优惠券' }, { id: 'redeem', label: '兑换码' }];
  return (
    <div className="page fadein">
      <div className="page-head">
        <div className="page-title">优惠与活动</div>
        <div className="page-sub">管理你的优惠券与兑换码</div>
      </div>
      <div className="subtabs">
        {tabs.map(t => <button key={t.id} className={`subtab ${view === t.id ? 'active' : ''}`} onClick={() => go('promo.' + t.id)}>{t.label}</button>)}
      </div>
      {view === 'coupons' && <CouponsView/>}
      {view === 'redeem' && <RedeemView/>}
    </div>
  );
}

function CouponTicket({ c, state }) {
  const dim = state !== 'available';
  const valColor = state === 'available' ? 'var(--accent-text)' : 'var(--text-3)';
  return (
    <div className="card" style={{ display: 'flex', overflow: 'hidden', opacity: dim ? .62 : 1 }}>
      <div style={{ width: 132, flexShrink: 0, background: state === 'available' ? 'var(--accent-soft)' : 'var(--surface-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1.5px dashed var(--border-strong)', padding: 12, position: 'relative' }}>
        <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: valColor, letterSpacing: '-.02em', textAlign: 'center' }}>{c.value}</div>
        <div className="t3" style={{ fontSize: 10.5, marginTop: 2 }}>{c.type === 'amount' ? '满减券' : c.type === 'discount' ? '折扣券' : '积分券'}</div>
      </div>
      <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column' }}>
        <div className="between"><span style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</span><Badge variant="neutral">{c.from}</Badge></div>
        <div className="muted" style={{ fontSize: 12, marginTop: 5 }}>{c.cond}</div>
        <div className="t3" style={{ fontSize: 11.5, marginTop: 'auto', paddingTop: 10 }}>
          {state === 'available' ? `有效期至 ${c.expire}` : c.expire}
          {c.code && <span className="mono" style={{ marginLeft: 10 }}>码 {c.code}</span>}
        </div>
      </div>
      {state === 'available' && <div style={{ display: 'flex', alignItems: 'center', paddingRight: 16 }}><Btn variant="ghost" size="sm">去使用</Btn></div>}
    </div>
  );
}

function CouponsView() {
  const [tab, setTab] = useState('available');
  const tabs = [['available', '可用', COUPONS.available.length], ['used', '已用', COUPONS.used.length], ['expired', '已过期', COUPONS.expired.length]];
  const list = COUPONS[tab];
  return (
    <div>
      <div className="chip-tab" style={{ marginBottom: 18 }}>
        {tabs.map(([k, l, n]) => <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{l} <span className="t3" style={{ marginLeft: 3 }}>{n}</span></button>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {list.map(c => <CouponTicket key={c.id} c={c} state={tab}/>)}
      </div>
      {list.length === 0 && <div className="empty"><Icon name="ticket" size={40}/><div>暂无{tabs.find(t => t[0] === tab)[1]}优惠券</div></div>}
    </div>
  );
}

function RedeemView() {
  const toast = useToast();
  const [code, setCode] = useState('');
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 18 }}>
      <div className="card card-pad">
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>兑换码</div>
        <div className="t3" style={{ fontSize: 12.5, marginBottom: 18 }}>输入兑换码，可兑换优惠券、积分或试用会员</div>
        <Field label="兑换码">
          <input className="input mono" placeholder="输入兑换码，如 GIFT-300C" value={code} onChange={e => setCode(e.target.value.toUpperCase())} style={{ letterSpacing: '.05em' }}/>
        </Field>
        <Btn variant="primary" block disabled={!code} onClick={() => { toast(code ? '兑换成功！+300 积分已到账' : ''); setCode(''); }}>立即兑换</Btn>
      </div>
      <div className="card">
        <div className="card-hd"><Icon name="gift" size={16} className="t3"/><h3>兑换记录</h3></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>兑换码</th><th>兑换时间</th><th>获得内容</th></tr></thead>
            <tbody>
              {REDEEM_HISTORY.map((r, i) => (
                <tr key={i}>
                  <td><span className="mono" style={{ fontWeight: 600, fontSize: 12.5 }}>{r.code}</span></td>
                  <td className="mono t3" style={{ fontSize: 12 }}>{r.time}</td>
                  <td><Badge variant="accent">{r.reward}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

window.PromoPage = PromoPage;


/* ============ 账户设置 ============ */
function SettingsPage({ view, go }) {
  const tabs = [
  { id: 'profile', label: '个人资料' },
  { id: 'security', label: '登录与安全' },
  { id: 'notify', label: '通知偏好' }];

  return (
    <div className="page fadein">
      <div className="page-head">
        <div className="page-title">账户设置</div>
        <div className="page-sub">管理你的资料、安全与通知</div>
      </div>
      <div className="subtabs">
        {tabs.map((t) => <button key={t.id} className={`subtab ${view === t.id ? 'active' : ''}`} onClick={() => go('settings.' + t.id)}>{t.label}</button>)}
      </div>
      {view === 'profile' && <ProfileView />}
      {view === 'security' && <SecurityView />}
      {view === 'notify' && <NotifyView />}
    </div>);

}

function ProfileView() {
  const toast = useToast();
  const a = ACCOUNT;
  const [form, setForm] = useState({ name: a.name, bio: a.bio, region: a.region, industry: a.industry });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18, maxWidth: 880 }}>
      <div className="card card-pad">
        <div className="row" style={{ gap: 16, marginBottom: 22 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 24, background: 'linear-gradient(140deg, oklch(0.60 0.16 230), oklch(0.58 0.18 277))' }}>{form.name[0]}</div>
          <div><Btn variant="ghost" size="sm">更换头像</Btn><div className="t3" style={{ fontSize: 11.5, marginTop: 6 }}>支持 JPG/PNG，建议 256×256</div></div>
        </div>
        <Field label="昵称"><input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="个人简介" hint="用于 AI 简历生成时理解你的背景"><textarea className="textarea" value={form.bio} onChange={(e) => set('bio', e.target.value)} /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="所在地区"><input className="input" value={form.region} onChange={(e) => set('region', e.target.value)} /></Field>
          <Field label="所在行业"><input className="input" value={form.industry} onChange={(e) => set('industry', e.target.value)} /></Field>
        </div>
        <Btn variant="primary" onClick={() => toast('资料已保存')}>保存修改</Btn>
      </div>
      <div className="card card-pad" style={{ height: 'fit-content' }} data-comment-anchor="5123ad2f20-div-44-7">
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>账户信息</div>
        <div className="between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}><span className="muted">用户 ID</span><Copyable text={a.id}><span className="mono" style={{ fontWeight: 600 }}>{a.id}</span></Copyable></div>
        <div className="between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}><span className="muted">注册时间</span><span className="mono">{a.joined}</span></div>
        <div className="between" style={{ padding: '10px 0', fontSize: 13 }}><span className="muted">当前套餐</span><Badge variant="gold"><Icon name="crown" size={11} /> {a.tierName}</Badge></div>
      </div>
    </div>);

}

function SecurityView() {
  const toast = useToast();
  const [twoFA] = useState(false);
  const binds = [
  { icon: 'phone', label: '手机号', value: ACCOUNT.phone, bound: true },
  { icon: 'mail', label: '邮箱', value: ACCOUNT.email, bound: true }];

  const thirds = [
  { name: '微信', bound: true }, { name: '飞书', bound: false }, { name: 'Google', bound: false }];

  const devices = [
  { name: 'MacBook Pro · Chrome', loc: '上海', time: '当前在线', cur: true },
  { name: 'iPhone 15 · App', loc: '上海', time: '2 小时前', cur: false },
  { name: 'Windows · Edge', loc: '杭州', time: '昨天 21:30', cur: false }];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, maxWidth: 920 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="card">
          <div className="card-hd" data-comment-anchor="c03a30c88f-div-73-11"><Icon name="shield" size={16} className="t3" /><h3>账号绑定</h3></div>
          <div style={{ padding: '4px 0' }}>
            {binds.map((b, i) =>
            <div key={i} className="between" style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)' }}>
                <div className="row" style={{ gap: 10 }}><Icon name={b.icon} size={16} className="muted" /><div><div style={{ fontWeight: 600, fontSize: 13 }}>{b.label}</div><div className="t3 mono" style={{ fontSize: 11.5 }}>{b.value}</div></div></div>
                <span className="linklike" style={{ fontSize: 12.5 }} onClick={() => toast('打开换绑流程（需二次验证）')}>更换</span>
              </div>
            )}
            <div className="between" style={{ padding: '13px 20px' }}>
              <div className="row" style={{ gap: 10 }}><Icon name="shield" size={16} className="muted" /><div><div style={{ fontWeight: 600, fontSize: 13 }}>登录密码</div><div className="t3" style={{ fontSize: 11.5 }}>上次修改 30 天前</div></div></div>
              <span className="linklike" style={{ fontSize: 12.5 }} onClick={() => toast('打开修改密码')}>修改</span>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-hd"><Icon name="user" size={16} className="t3" /><h3>第三方登录</h3></div>
          <div style={{ padding: '4px 0' }}>
            {thirds.map((t, i) =>
            <div key={i} className="between" style={{ padding: '12px 20px', borderBottom: i < thirds.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</span>
                {t.bound ? <span className="linklike" style={{ fontSize: 12.5 }} onClick={() => toast('解绑需保留至少一种登录方式')}>已绑定 · 解绑</span> : <Btn variant="ghost" size="sm" onClick={() => toast('跳转授权')}>绑定</Btn>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="card card-pad">
          <div className="between"><div><div style={{ fontWeight: 700, fontSize: 14 }}>双因素认证</div><div className="t3" style={{ fontSize: 12, marginTop: 2 }}>TOTP / 通行密钥 · V1.1 上线</div></div><Toggle on={twoFA} onChange={() => toast('双因素认证将于 V1.1 开放')} /></div>
        </div>
        <div className="card">
          <div className="card-hd"><Icon name="device" size={16} className="t3" /><h3>登录设备</h3><span className="sub">最近 5 次</span></div>
          <div style={{ padding: '4px 0' }}>
            {devices.map((d, i) =>
            <div key={i} className="between" style={{ padding: '12px 20px', borderBottom: i < devices.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div><div style={{ fontWeight: 600, fontSize: 13 }}>{d.name}</div><div className="t3" style={{ fontSize: 11.5 }}>{d.loc} · {d.time}</div></div>
                {d.cur ? <Badge variant="success" dot>当前</Badge> : <span className="linklike" style={{ fontSize: 12.5, color: 'var(--danger)' }} onClick={() => toast('已强制下线该设备')}>下线</span>}
              </div>
            )}
          </div>
        </div>
        <div className="card card-pad" style={{ borderColor: 'var(--danger)', background: 'var(--danger-soft)' }}>
          <div className="between"><div><div style={{ fontWeight: 700, fontSize: 14, color: 'var(--danger)' }}>注销账户</div><div className="muted" style={{ fontSize: 12, marginTop: 2 }}>有生效中的订阅时不可注销</div></div><Btn variant="danger" size="sm" onClick={() => toast('请先取消订阅后再注销')}>注销</Btn></div>
        </div>
      </div>
    </div>);

}

function NotifyView() {
  const toast = useToast();
  const [prefs, setPrefs] = useState({
    renewal_email: true, balance_email: true, expire_email: true, security_email: true,
    inapp: true, marketing: false
  });
  const toggle = (k) => setPrefs((p) => ({ ...p, [k]: !p[k] }));
  const emailRows = [
  ['renewal_email', '续费提醒', '到期前提醒自动续费'],
  ['balance_email', '积分到账', '充值或赠送积分到账时'],
  ['expire_email', '积分即将过期', '积分过期前提醒'],
  ['security_email', '安全提示', '异地登录、密码变更等']];

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-hd"><Icon name="mail" size={16} className="t3" /><h3>邮件通知</h3></div>
        <div style={{ padding: '4px 0' }}>
          {emailRows.map(([k, t, d], i) =>
          <div key={k} className="between" style={{ padding: '13px 20px', borderBottom: i < emailRows.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div><div style={{ fontWeight: 600, fontSize: 13 }}>{t}</div><div className="t3" style={{ fontSize: 11.5 }}>{d}</div></div>
              <Toggle on={prefs[k]} onChange={() => toggle(k)} />
            </div>
          )}
        </div>
      </div>
      <div className="card">
        <div style={{ padding: '4px 0' }}>
          <div className="between" style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)' }}>
            <div><div style={{ fontWeight: 600, fontSize: 13 }}>站内信</div><div className="t3" style={{ fontSize: 11.5 }}>在控制台消息中心接收通知</div></div>
            <Toggle on={prefs.inapp} onChange={() => toggle('inapp')} />
          </div>
          <div className="between" style={{ padding: '13px 20px' }}>
            <div><div style={{ fontWeight: 600, fontSize: 13 }}>营销订阅 <Badge variant="neutral">默认关闭</Badge></div><div className="t3" style={{ fontSize: 11.5 }}>活动、优惠等推广信息（符合反垃圾合规）</div></div>
            <Toggle on={prefs.marketing} onChange={() => toggle('marketing')} />
          </div>
        </div>
      </div>
      <div style={{ marginTop: 18 }}><Btn variant="primary" onClick={() => toast('通知偏好已保存')}>保存设置</Btn></div>
    </div>);

}

window.SettingsPage = SettingsPage;

/* ============ App shell ============ */
const NAV = consoleNavForSidebar()

function Sidebar({ route, go }) {
  const [group, sub] = route.split('.');
  const [expanded, setExpanded] = useState(group);
  useEffect(() => {setExpanded(group);}, [group]);

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="sb-logo">JL</div>
        <div>
          <div className="sb-brand-name">AI 简历助手</div>
          <div className="sb-brand-sub">个人中心</div>
        </div>
      </div>
      <nav className="sb-nav">
        {NAV.map((item) => {
          if (!item.subs) {
            return (
              <button key={item.id} className={`sb-item ${group === item.id ? 'active' : ''}`} onClick={() => go(item.id)}>
                <Icon name={item.icon} size={17} className="sb-ico" />{item.label}
              </button>);

          }
          const isExp = expanded === item.id;
          return (
            <div className="sb-group" key={item.id}>
              <button className={`sb-item ${group === item.id ? 'active' : ''}`} onClick={() => {setExpanded(isExp && group !== item.id ? null : item.id);if (!isExp) go(item.id + '.' + item.subs[0][0]);}}>
                <Icon name={item.icon} size={17} className="sb-ico" />{item.label}
                {item.badge && <span className="sb-badge">{item.badge}</span>}
                <Icon name="chevron" size={14} className={`sb-chevron ${isExp ? 'open' : ''}`} style={item.badge ? { marginLeft: 8 } : {}} />
              </button>
              {isExp &&
              <div className="sb-sub">
                  {item.subs.map(([sid, slabel]) =>
                <button key={sid} className={`sb-subitem ${group === item.id && sub === sid ? 'active' : ''}`} onClick={() => go(item.id + '.' + sid)}>{slabel}</button>
                )}
                </div>
              }
            </div>);

        })}
      </nav>
    </aside>);

}

function NotifDropdown({ onClose }) {
  useEffect(() => {
    const h = () => onClose();
    setTimeout(() => window.addEventListener('click', h), 0);
    return () => window.removeEventListener('click', h);
  }, []);
  const iconMap = { credit: 'alert', order: 'wallet', renew: 'crown' };
  return (
    <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 46, right: 0, width: 340, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-pop)', zIndex: 60, overflow: 'hidden' }}>
      <div className="between" style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)' }}><span style={{ fontWeight: 700, fontSize: 13.5 }}>消息中心</span><span className="linklike" style={{ fontSize: 12 }}>全部已读</span></div>
      {NOTIFICATIONS.map((n) =>
      <div key={n.id} className="row" style={{ gap: 11, padding: '12px 16px', borderBottom: '1px solid var(--border)', alignItems: 'flex-start', background: n.unread ? 'var(--surface-2)' : 'transparent' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent-soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={iconMap[n.icon]} size={15} style={{ color: 'var(--accent-text)' }} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="between"><span style={{ fontWeight: 600, fontSize: 13 }}>{n.title}</span>{n.unread && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{n.desc}</div>
            <div className="t3" style={{ fontSize: 11, marginTop: 4 }}>{n.time}</div>
          </div>
        </div>
      )}
    </div>);

}

function UserDropdown({ theme, setTheme, go, onClose, onOpenPersonal }) {
  useEffect(() => {
    const h = () => onClose();
    setTimeout(() => window.addEventListener('click', h), 0);
    return () => window.removeEventListener('click', h);
  }, []);
  const toast = useToast();
  return (
    <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 46, right: 0, width: 240, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-pop)', zIndex: 60, overflow: 'hidden', padding: 6 }}>
      <div className="row" style={{ gap: 10, padding: '10px 10px 12px' }}>
        <div className="tb-avatar" style={{ width: 38, height: 38, fontSize: 15 }}>{ACCOUNT.name[0]}</div>
        <div style={{ minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 13.5 }}>{ACCOUNT.name}</div><div className="t3" style={{ fontSize: 11.5 }}>{ACCOUNT.email}</div></div>
      </div>
      <div className="divider" style={{ margin: '2px 0 6px' }} />
      <button className="sb-item" style={{ fontSize: 13 }} onClick={() => {onOpenPersonal();onClose();}}><Icon name="user" size={16} className="sb-ico" />个人中心</button>
      <button className="sb-item" style={{ fontSize: 13 }} onClick={() => {go('membership.current');onClose();}}><Icon name="crown" size={16} className="sb-ico" />我的会员</button>
      <div className="between sb-item" style={{ cursor: 'default' }}>
        <span className="row" style={{ gap: 10 }}><Icon name={theme === 'dark' ? 'moon' : 'sun'} size={16} className="sb-ico" />外观</span>
        <div className="chip-tab" style={{ padding: 2 }}>
          <button className={theme === 'light' ? 'active' : ''} style={{ padding: '4px 8px' }} onClick={() => setTheme('light')}><Icon name="sun" size={13} /></button>
          <button className={theme === 'dark' ? 'active' : ''} style={{ padding: '4px 8px' }} onClick={() => setTheme('dark')}><Icon name="moon" size={13} /></button>
        </div>
      </div>
      <div className="divider" style={{ margin: '6px 0' }} />
      <button className="sb-item" style={{ fontSize: 13, color: 'var(--danger)' }} onClick={() => toast('已退出登录')}><Icon name="logout" size={16} className="sb-ico" style={{ color: 'var(--danger)' }} />退出登录</button>
    </div>);

}

function Topbar({ route, theme, setTheme, go, onOpenPersonal }) {
  const [notif, setNotif] = useState(false);
  const [user, setUser] = useState(false);
  const [g, s] = route.split('.');
  const sub = s ? NAV.find((n) => n.id === g)?.subs?.find((x) => x[0] === s)?.[1] : null;
  return (
    <header className="topbar" data-comment-anchor="0172f8ef9c-header-119-5">
      <button className="tb-back" onClick={() => go('overview')}><Icon name="back" size={15} />返回工作台</button>
      <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
      <div className="breadcrumb" style={{ margin: 0 }}>
        <span></span><Icon name="chevron" size={12} /><b>{CONSOLE_GROUP_TITLE[g]}</b>{sub && <><Icon name="chevron" size={12} /><b>{sub}</b></>}
      </div>
      <div className="tb-spacer" />
      <div style={{ position: 'relative' }}>
        <button className="tb-iconbtn" onClick={(e) => {e.stopPropagation();setNotif((v) => !v);setUser(false);}}><Icon name="bell" size={18} /><span className="dot" /></button>
        {notif && <NotifDropdown onClose={() => setNotif(false)} />}
      </div>
      <div style={{ position: 'relative' }}>
        <button className="tb-user" onClick={(e) => {e.stopPropagation();setUser((v) => !v);setNotif(false);}}>
          <div className="tb-avatar">{ACCOUNT.name[0]}</div>
          <div><div className="tb-uname">{ACCOUNT.name}</div><div className="tb-uplan">{ACCOUNT.tierName}</div></div>
          <Icon name="chevronDown" size={14} className="t3" />
        </button>
        {user && <UserDropdown theme={theme} setTheme={setTheme} go={go} onClose={() => setUser(false)} onOpenPersonal={onOpenPersonal} />}
      </div>
    </header>);

}

function App() {
  const [route, setRoute] = useState(() => location.hash.replace('#', '') || CONSOLE_DEFAULT_ROUTE);
  const [theme, setTheme] = useState(() => localStorage.getItem('jl-theme') || 'light');
  const [sub, setSub] = useState({ ...SUBSCRIPTION });
  const [balance, setBalance] = useState(CREDITS.total);
  const [checkout, setCheckout] = useState(null);
  const [personalOpen, setPersonalOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {document.documentElement.setAttribute('data-theme', theme);localStorage.setItem('jl-theme', theme);}, [theme]);
  useEffect(() => {location.hash = route;document.querySelector('.content')?.scrollTo(0, 0);}, [route]);

  const go = (r) => setRoute(r);

  const onUpgrade = (plan, cycle, action) => {
    if (action === 'downgrade') {
      toast(`将于 ${sub.periodEnd} 切换至 ${plan.name}`, 'check');
      return;
    }
    const price = plan.price[cycle];
    const isUpgrade = TIER_ORDER[plan.tier] > TIER_ORDER[sub.tier];
    const proration = isUpgrade && sub.tier !== 'free' ?
    Math.round(price * 0.42) // mock proration
    : price;
    setCheckout({
      title: `${isUpgrade ? '升级至' : '订阅'} ${plan.name}`,
      kind: 'plan',
      items: [{ name: `${plan.name} · 按${CYCLE_LABEL[cycle]}付`, note: isUpgrade && sub.tier !== 'free' ? '按剩余天数折算补差价' : `${CYCLE_LABEL[cycle]}度订阅`, unitCents: proration, qty: 1 }],
      grantCredits: plan.grant[cycle],
      prorationNote: isUpgrade && sub.tier !== 'free' ? `升级立即生效。补差价 =（新套餐日均价 − 旧套餐日均价）× 剩余 ${sub.remainingDays} 天，原赠送积分不回收。` : null,
      successNote: `${plan.name} 已生效`,
      _apply: () => {
        setSub((s) => ({ ...s, planName: plan.name, tier: plan.tier, grantedThisCycle: plan.grant[cycle], grantedRemaining: plan.grant[cycle], nextRenewalAmount: price, cycleLabel: { month: '月度', quarter: '季度', year: '年度' }[cycle], billingCycle: cycle }));
        setBalance((b) => b + plan.grant[cycle]);
      }
    });
  };

  const onBuy = (pack) => {
    setCheckout({
      title: `购买 ${pack.name}`,
      kind: 'pack',
      items: [{ name: `${pack.name} · ${fmtNum(pack.credits)} 积分`, note: `购买后 ${Math.round(pack.validityDays / 30)} 个月有效`, unitCents: pack.priceCents, qty: 1 }],
      grantCredits: pack.credits,
      successNote: `${pack.name} 购买成功`,
      _apply: () => setBalance((b) => b + pack.credits)
    });
  };

  const onCheckoutDone = (order) => {
    order._apply?.();
    setCheckout(null);
    toast(order.successNote || '操作成功', 'checkCircle');
    if (order.kind === 'plan') go('membership.current');else go('credits.balance');
  };

  const onToggleRenew = () => setSub((s) => ({ ...s, autoRenew: !s.autoRenew }));

  const [g, s] = route.split('.');
  const liveSub = { ...sub, tierName: TIER_LABEL[sub.tier] || sub.planName };

  return (
    <div className="app">
      <Sidebar route={route} go={go} />
      <div className="main">
        <Topbar route={route} theme={theme} setTheme={setTheme} go={go} onOpenPersonal={() => setPersonalOpen(true)} />
        <div className="content">
          {g === 'overview' && <OverviewPage go={go} />}
          {g === 'membership' && <MembershipPage sub={liveSub} view={s || 'current'} go={go} onUpgrade={onUpgrade} onToggleRenew={onToggleRenew} />}
          {g === 'credits' && <CreditsPage view={s || 'balance'} go={go} balance={balance} onBuy={onBuy} data-comment-anchor="878d2b65cf-button-21-24" />}
          {g === 'orders' && <OrdersPage view={s || 'list'} go={go} data-comment-anchor="520f434cfb-button-15-24" />}
          {g === 'stats' && <StatsPage view={s || 'overview'} go={go} />}
          {g === 'promo' && <PromoPage view={s || 'coupons'} go={go} />}
          {g === 'settings' && <SettingsPage view={s || 'profile'} go={go} />}
        </div>
      </div>
      {checkout && <CheckoutFlow order={checkout} onClose={() => setCheckout(null)} onDone={onCheckoutDone} />}
      {personalOpen && <PersonalCenter onClose={() => setPersonalOpen(false)} />}
    </div>);

}


export function DashboardApp() {
  return (
    <ToastHost>
      <App />
    </ToastHost>
  )
}
