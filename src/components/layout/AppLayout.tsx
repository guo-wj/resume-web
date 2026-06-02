import { useState } from "react"
import { Layout, Menu, Button, Avatar, Dropdown } from "antd"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  List,
  FileText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
} from "lucide-react"
import { useAuth } from "@/auth/AuthContext"

const { Sider, Content, Header } = Layout

const NAV_ITEMS = [
  { key: "/dashboard", icon: <LayoutDashboard size={16} />, label: "Dashboard" },
  { key: "/list", icon: <List size={16} />, label: "列表" },
  { key: "/form", icon: <FileText size={16} />, label: "表单" },
]

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const userMenu = {
    items: [{ key: "logout", icon: <LogOut size={14} />, label: "退出登录" }],
    onClick: ({ key }: { key: string }) => {
      if (key === "logout") {
        logout()
        navigate("/login")
      }
    },
  }

  return (
    <Layout className="min-h-screen">
      <Sider collapsed={collapsed} width={200} collapsedWidth={64} style={{ position: "relative" }}>
        <div className="flex items-center justify-center h-12 my-2">
          {!collapsed && (
            <span className="text-white font-semibold truncate px-2">resume-web</span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={NAV_ITEMS}
          onClick={({ key }) => navigate(key)}
        />
        <div className="absolute bottom-4 w-full flex justify-center">
          <Button
            type="text"
            icon={collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-white"
          />
        </div>
      </Sider>
      <Layout>
        <Header className="bg-white px-4 flex items-center justify-end border-b border-gray-100">
          <Dropdown menu={userMenu} placement="bottomRight">
            <div className="flex items-center gap-2 cursor-pointer">
              <Avatar icon={<User size={16} />} size="small" />
              <span className="text-sm text-gray-700">{user?.displayName}</span>
            </div>
          </Dropdown>
        </Header>
        <Content className="p-6 bg-gray-50 overflow-auto">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
