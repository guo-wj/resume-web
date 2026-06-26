import { NAV_ITEMS } from "@/constant"
import type { SidebarProps } from "../../types"
import './index.scss'
import { NAV_ICONS, Svg } from "../Ui"

export function Sidebar({ page, onPageChange, onClose }: SidebarProps) {
  return (
    <div className={`pc-scroll sidebar-root`}>
      <div className="sidebar-header">
        <div className="sidebar-title">账户管理</div>
      </div>
      <div className="sidebar-nav">
        {NAV_ITEMS.map((n) => {
          const active = page === n.id
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => onPageChange(n.id)}
              className={`${active ? "pc-nav-active" : "pc-nav"} sidebar-navBtn ${active ? "sidebar-navBtnActive" : "sidebar-navBtnInactive"}`}
            >
              <span className={`sidebar-navIcon ${active ? "sidebar-navIconActive" : "sidebar-navIconInactive"}`}>
                {NAV_ICONS[n.iconKey]}
              </span>
              <span className="sidebar-navLabel">{n.label}</span>
            </button>
          )
        })}
      </div>
      <div className="sidebar-footer">
        <button type="button" onClick={onClose} className={`pc-back sidebar-backBtn`}>
          <Svg size={16} d="M14 6l-6 6 6 6" strokeWidth="2.2" />返回应用
        </button>
      </div>
    </div>
  )
}
