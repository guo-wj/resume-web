import { Form, Input, Select, Switch, DatePicker, Button, Card, message } from "antd"
import type { Dayjs } from "dayjs"

const { Option } = Select

interface FormValues {
  name: string
  type: string
  date: Dayjs | null
  enabled: boolean
  remark: string
}

export function FormPage() {
  const [form] = Form.useForm<FormValues>()
  const [msgApi, ctxHolder] = message.useMessage()

  function onFinish(_values: FormValues) {
    msgApi.success("提交成功")
    form.resetFields()
  }

  return (
    <div>
      {ctxHolder}
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">表单</h1>
      <Card className="max-w-2xl">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item label="名称" name="name" rules={[{ required: true, message: "请输入名称" }, { max: 50, message: "名称不超过 50 个字符" }]}>
            <Input placeholder="请输入名称" />
          </Form.Item>
          <Form.Item label="类型" name="type" rules={[{ required: true, message: "请选择类型" }]}>
            <Select placeholder="请选择">
              <Option value="a">类型 A</Option>
              <Option value="b">类型 B</Option>
              <Option value="c">类型 C</Option>
            </Select>
          </Form.Item>
          <Form.Item label="日期" name="date" rules={[{ required: true, message: "请选择日期" }]}>
            <DatePicker className="w-full" />
          </Form.Item>
          <Form.Item label="启用" name="enabled" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={4} placeholder="选填" maxLength={200} showCount />
          </Form.Item>
          <Form.Item className="mb-0">
            <div className="flex gap-2">
              <Button type="primary" htmlType="submit">
                提交
              </Button>
              <Button onClick={() => form.resetFields()}>重置</Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
