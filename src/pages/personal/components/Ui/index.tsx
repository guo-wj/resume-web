import type { ReactNode } from "react"
import type { PersonalNavIconKey } from "@/constant"
import type {
  LegendProps,
  SectionTitleProps,
  SvgProps,
  ToastProps,
} from "../../types"
import './index.scss'

export function Svg({ d, size = 18, ...p }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      {Array.isArray(d)
        ? d.map((x, i) => <path key={i} {...x} />)
        : <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  )
}

export const NAV_ICONS: Record<PersonalNavIconKey, ReactNode> = {
  user: <Svg d={[{ d: "M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", stroke: "currentColor", strokeWidth: 2 }, { d: "M5 20a7 7 0 0 1 14 0", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" }]} />,
  bolt: <Svg d="M13 3L5 13h6l-1 8 8-10h-6l1-8z" />,
  receipt: <Svg d={[{ d: "M6 3h12v18l-3-2-3 2-3-2-3 2V3z", stroke: "currentColor", strokeWidth: 2, strokeLinejoin: "round" }, { d: "M9 8h6M9 12h6", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" }]} />,
}

export function SectionTitle({ children, mt = 36 }: SectionTitleProps) {
  return (
    <div className="ui-sectionTitle" style={{ marginTop: mt }}>
      {children}
    </div>
  )
}

export function Legend({ color, name, value }: LegendProps) {
  return (
    <div className="ui-legend">
      <span className="ui-legendDot" style={{ background: color }} />
      <span className="ui-legendName">{name}</span>
      <span className="ui-legendValue">{value}</span>
    </div>
  )
}

export function Toast({ message }: ToastProps) {
  if (!message) return null
  return <div className="ui-toast">{message}</div>
}
