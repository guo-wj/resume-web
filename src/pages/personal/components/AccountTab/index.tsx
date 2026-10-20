import icoLock from "@/assets/personal/ico-lock.svg"
import type { AccountTabProps, BindingRow } from "../../types"
import "./index.scss"

function FieldRow({
  id,
  icon,
  label,
  value,
  valuePrefix,
  action,
  strong,
  onClick,
  last,
}: BindingRow & { last?: boolean }) {
  return (
    <div
      className={`pc-row accountTab-fieldRow ${last ? "accountTab-fieldRowLast" : ""}`}
      data-id={id}
    >
      <div className="accountTab-fieldIcon" aria-hidden>
        <img src={icon} alt="" />
      </div>
      <div className="accountTab-fieldBody">
        <div className="accountTab-fieldLabel">{label}</div>
        <div className="accountTab-fieldValue">
          {valuePrefix ? (
            <>
              <span className="accountTab-fieldPrefix">{valuePrefix}</span>
              {value ? <span className="accountTab-fieldHint">{value}</span> : null}
            </>
          ) : (
            value
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onClick}
        className={`pc-hover accountTab-fieldAction ${strong ? "accountTab-fieldActionStrong" : "accountTab-fieldActionMuted"}`}
      >
        {action}
      </button>
    </div>
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="accountTab-divider">
      <span className="accountTab-dividerLineShort" />
      <span className="accountTab-dividerText">{label}</span>
      <span className="accountTab-dividerLine" />
    </div>
  )
}

export function AccountTab({
  accountLoading,
  profile,
  displayAccount,
  hasPassword,
  bindings,
  onOpenPassword,
}: AccountTabProps) {
  const loginRows = bindings.filter((b) => b.section === "login")
  const securityRows = bindings.filter((b) => b.section === "security")

  return (
    <div className="accountTab-root">
      <header className="accountTab-header">
        <h1 className="accountTab-pageTitle">个人主页</h1>
        <p className="accountTab-pageDesc">管理你的账户信息、登录方式与账户安全</p>
      </header>

      <div className="accountTab-sections">
        <section className="accountTab-card">
          <div className="accountTab-cardHeader">
            <h2 className="accountTab-cardTitle">账户信息</h2>
            <p className="accountTab-cardDesc">你的基本账户资料</p>
          </div>
          <div className="accountTab-profileRow">
            <div className="accountTab-avatar">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="accountTab-avatarImg" />
                : <span className="accountTab-avatarEmoji" aria-hidden>🌱</span>}
            </div>
            <div className="accountTab-profileInfo">
              <div className="accountTab-displayName">
                {accountLoading ? "加载中…" : displayAccount}
              </div>
              <div className="accountTab-displayAccount">注册账号</div>
            </div>
          </div>
        </section>

        <section className="accountTab-card">
          <div className="accountTab-cardHeader">
            <h2 className="accountTab-cardTitle">设备管理</h2>
            <p className="accountTab-cardDesc">管理你的登录方式与账户安全</p>
          </div>

          <SectionDivider label="登录方式" />
          {loginRows.map((row, i) => (
            <FieldRow key={row.id} {...row} last={i === loginRows.length - 1} />
          ))}

          <SectionDivider label="账户安全" />
          {securityRows.map((row) => (
            <FieldRow key={row.id} {...row} />
          ))}
          <FieldRow
            id="password"
            label="密码"
            value={hasPassword ? "••••••••" : "未设置"}
            action={hasPassword ? "修改" : "设置"}
            strong={!hasPassword}
            onClick={onOpenPassword}
            icon={icoLock}
            section="security"
            last
          />
        </section>
      </div>
    </div>
  )
}
