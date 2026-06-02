import { Card, Row, Col, Statistic } from "antd"
import { Users, TrendingUp, ShoppingCart, DollarSign } from "lucide-react"

const STATS = [
  { title: "用户总数", value: 1024, icon: Users, color: "text-blue-500" },
  { title: "本月增长", value: 18, suffix: "%", icon: TrendingUp, color: "text-green-500" },
  { title: "订单数量", value: 512, icon: ShoppingCart, color: "text-orange-500" },
  { title: "总收入", value: 98600, prefix: "¥", icon: DollarSign, color: "text-purple-500" },
]

const BAR_DATA = [40, 65, 30, 80, 55, 90, 70]
const DIST = [
  { label: "类别 A", pct: 40, color: "bg-blue-400" },
  { label: "类别 B", pct: 30, color: "bg-green-400" },
  { label: "类别 C", pct: 20, color: "bg-orange-400" },
  { label: "类别 D", pct: 10, color: "bg-purple-400" },
]

export function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">Dashboard</h1>
      <Row gutter={[16, 16]}>
        {STATS.map(({ title, value, suffix, prefix, icon: Icon, color }) => (
          <Col xs={24} sm={12} lg={6} key={title}>
            <Card>
              <div className="flex items-center justify-between">
                <Statistic title={title} value={value} prefix={prefix} suffix={suffix} />
                <Icon size={28} className={color} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      <Row gutter={[16, 16]} className="mt-4">
        <Col xs={24} lg={16}>
          <Card title="近7日趋势">
            <div className="h-48 flex items-end gap-2 px-2">
              {BAR_DATA.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-blue-400 rounded-t transition-all"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="占比分布" className="h-full">
            <div className="flex flex-col gap-4 py-2">
              {DIST.map(({ label, pct, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1 text-gray-600">
                    <span>{label}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
