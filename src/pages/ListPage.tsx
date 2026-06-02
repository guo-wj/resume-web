import { useState } from "react"
import { Card, Badge, Empty, Tag } from "antd"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Item {
  id: number
  title: string
  description: string
  status: "进行中" | "已完成" | "待处理"
  date: string
}

const ITEMS: Item[] = [
  { id: 1, title: "项目 Alpha", description: "核心功能开发，包含用户认证、数据展示、报表导出等模块。", status: "进行中", date: "2026-01-15" },
  { id: 2, title: "项目 Beta", description: "移动端适配优化，提升在各类设备上的用户体验。", status: "已完成", date: "2026-01-10" },
  { id: 3, title: "项目 Gamma", description: "后台管理系统重构，引入新的权限控制体系。", status: "待处理", date: "2026-02-01" },
  { id: 4, title: "项目 Delta", description: "性能优化专项，目标将首屏加载时间缩短至 1 秒以内。", status: "进行中", date: "2026-01-20" },
  { id: 5, title: "项目 Epsilon", description: "数据迁移任务，将旧版数据库迁移至新架构。", status: "已完成", date: "2025-12-30" },
]

const STATUS_COLOR: Record<Item["status"], "processing" | "success" | "default"> = {
  "进行中": "processing",
  "已完成": "success",
  "待处理": "default",
}

export function ListPage() {
  const [selected, setSelected] = useState<Item | null>(null)

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">列表</h1>
      <div className="flex gap-4 h-[calc(100vh-200px)]">
        <Card className="w-72 flex-shrink-0 overflow-auto p-0" styles={{ body: { padding: 0 } }}>
          {ITEMS.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelected(item)}
              className={cn(
                "flex items-center justify-between px-4 py-3 cursor-pointer border-b border-gray-100 hover:bg-blue-50 transition-colors",
                selected?.id === item.id && "bg-blue-50 border-l-2 border-l-blue-500",
              )}
            >
              <div className="min-w-0">
                <div className="font-medium text-sm text-gray-800 truncate">{item.title}</div>
                <div className="text-xs text-gray-400 mt-0.5">{item.date}</div>
              </div>
              <ChevronRight size={14} className="text-gray-300 flex-shrink-0 ml-2" />
            </div>
          ))}
        </Card>
        <Card className="flex-1 overflow-auto">
          {selected ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">{selected.title}</h2>
                <Badge status={STATUS_COLOR[selected.status]} text={selected.status} />
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-400 mb-1">描述</div>
                  <p className="text-sm text-gray-700">{selected.description}</p>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">日期</div>
                  <Tag>{selected.date}</Tag>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">状态</div>
                  <Tag color={selected.status === "已完成" ? "success" : selected.status === "进行中" ? "processing" : "default"}>
                    {selected.status}
                  </Tag>
                </div>
              </div>
            </div>
          ) : (
            <Empty description="请从左侧选择一条记录" className="mt-16" />
          )}
        </Card>
      </div>
    </div>
  )
}
