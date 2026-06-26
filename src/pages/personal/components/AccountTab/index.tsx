import { SectionTitle } from "../Ui"
import type { AccountTabProps } from "../../types"
import './index.scss'

export function AccountTab({
  accountLoading,
  profile,
  displayName,
  displayAccount,
  avatarLetter,
  hasPassword,
  bindings,
  onOpenPassword,
}: AccountTabProps) {
  return (
    <div className="accountTab-root">
      <h1 className="accountTab-pageTitle">个人主页</h1>
      <p className="accountTab-pageDesc">管理你的账户信息、登录方式与账户安全。</p>

      <SectionTitle>账户信息</SectionTitle>
      <div className="accountTab-profileRow">
        <div className="accountTab-avatar">
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="" className="accountTab-avatarImg" />
            : avatarLetter}
        </div>
        <div className="accountTab-profileInfo">
          <div className="accountTab-displayName">{accountLoading ? "加载中…" : displayName}</div>
          <div className="accountTab-displayAccount">
            {accountLoading ? "正在同步账户信息" : `注册账号 · ${displayAccount}`}
          </div>
        </div>
      </div>

      <SectionTitle>设备管理</SectionTitle>
      <div className="accountTab-card">
        {bindings.map((b) => (
          <div key={b.label} className={`pc-row accountTab-row`}>
            <div className="accountTab-rowLabel">
              <div className="accountTab-rowTitle">{b.label}</div>
              <div className="accountTab-rowValue">{b.value}</div>
            </div>
            <button
              type="button"
              onClick={b.onClick}
              className={`pc-hover accountTab-rowAction ${b.strong ? "accountTab-rowActionStrong" : "accountTab-rowActionMuted"}`}
            >
              {b.action}
            </button>
          </div>
        ))}
        <div className={`pc-row accountTab-row accountTab-rowLast`}>
          <div className="accountTab-rowLabel">
            <div className="accountTab-rowTitle">密码</div>
            <div className="accountTab-rowValue">
              {hasPassword ? "用于手机号 / 邮箱的密码登录" : "你还未设置登录密码"}
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenPassword}
            className={`pc-hover accountTab-rowAction ${hasPassword ? "accountTab-rowActionMuted" : "accountTab-rowActionStrong"}`}
          >
            {hasPassword ? "修改" : "设置"}
          </button>
        </div>
      </div>
    </div>
  )
}
