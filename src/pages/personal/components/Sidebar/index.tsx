import { NAV_ITEMS } from "@/constant"
import navHome from "@/assets/personal/nav-home.svg"
import navSub from "@/assets/personal/nav-sub.svg"
import navBills from "@/assets/personal/nav-bills.svg"
import iconBack from "@/assets/personal/icon-back.svg"
import type { SidebarProps } from "../../types"
import "./index.scss"

const NAV_ICON_SRC: Record<string, string> = {
  user: navHome,
  bolt: navSub,
  receipt: navBills,
}

export function Sidebar({ page, onPageChange, onClose }: SidebarProps) {
  return (
    <aside className="sidebar-root">
      <div className="sidebar-header">账户设置</div>
      <nav className="sidebar-nav" aria-label="账户设置导航">
        {NAV_ITEMS.map((n) => {
          const active = page === n.id
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => onPageChange(n.id)}
              className={`${active ? "pc-nav-active" : "pc-nav"} sidebar-navBtn ${active ? "sidebar-navBtnActive" : "sidebar-navBtnInactive"}`}
            >
              <img className="sidebar-navIcon" src={NAV_ICON_SRC[n.iconKey]} alt="" />
              <span className="sidebar-navLabel">{n.label}</span>
            </button>
          )
        })}
      </nav>
      <div className="sidebar-footer">
        <button type="button" onClick={onClose} className={`pc-back sidebar-backBtn`}>
          <img src={iconBack} alt="" />
          返回列表
        </button>
      </div>
    </aside>
  )
}
