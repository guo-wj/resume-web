import { Form, Input, Button, Card, message } from "antd"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/auth/AuthContext"
import { findDemoUser } from "@/auth/demo-users"

interface FormValues {
  username: string
  password: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [msgApi, ctxHolder] = message.useMessage()

  function onFinish(values: FormValues) {
    const user = findDemoUser(values.username, values.password)
    if (user) {
      login(user)
      navigate("/dashboard")
    } else {
      msgApi.error("用户名或密码错误")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      {ctxHolder}
      <Card className="w-96 shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">resume-web</h1>
          <p className="text-gray-500 text-sm mt-1">请登录以继续</p>
        </div>
        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input placeholder="admin" size="large" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password placeholder="123456" size="large" />
          </Form.Item>
          <Form.Item className="mb-2">
            <Button type="primary" htmlType="submit" block size="large">
              登录
            </Button>
          </Form.Item>
          <p className="text-center text-xs text-gray-400">演示账号：admin / 123456</p>
        </Form>
      </Card>
    </div>
  )
}
