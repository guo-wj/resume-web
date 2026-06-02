export interface DemoUser {
  id: string
  username: string
  displayName: string
}

const USERS: Array<DemoUser & { password: string }> = [
  { id: "1", username: "admin", password: "123456", displayName: "管理员" },
]

export function findDemoUser(username: string, password: string): DemoUser | null {
  const found = USERS.find((u) => u.username === username && u.password === password)
  if (!found) return null
  const { password: _pw, ...user } = found
  return user
}
