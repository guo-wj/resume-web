interface StatusBadgeProps {
  label: string
}

/** 状态徽章 — 薄荷绿胶囊，呼吸光晕 + 星标扇形摆动 */
export function StatusBadge({ label }: StatusBadgeProps) {
  return (
    <span className="sp-status-badge">
      <img
        className="sp-status-badge__icon"
        src="/surprise/assets/img13.svg"
        alt=""
        width={16}
        height={16}
        aria-hidden
      />
      <span className="sp-status-badge__label">{label}</span>
    </span>
  )
}
