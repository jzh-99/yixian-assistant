import { computed, reactive } from 'vue'
import { isRemoteMode } from './remoteApi'

const STORAGE_KEY = 'yixian-admin-session'
const TOKEN_KEY = 'yixian-admin-token'
const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const mockUsers = {
  admin: {
    userId: 1, username: 'admin', realName: '超级管理员',
    roleCode: 'SUPER_ADMIN', roleName: '超级管理员', deptId: 1, deptName: '江苏电信', dataScope: '全省组织',
  },
  dispatcher: {
    userId: 5, username: 'dispatcher', realName: '调度员',
    roleCode: 'DISPATCHER', roleName: '调度员', deptId: 1, deptName: '江苏电信', dataScope: '本部门',
  },
  observer: {
    userId: 6, username: 'observer', realName: '观察员',
    roleCode: 'OBSERVER', roleName: '只读观察员', deptId: 1, deptName: '江苏电信', dataScope: '授权组织只读',
  },
}

function restore() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null } catch { return null }
}

export const session = reactive({ user: restore() })

export const isLoggedIn = computed(() => Boolean(session.user))
export const canWrite = computed(() => session.user?.roleCode !== 'OBSERVER')
export const isSuperAdmin = computed(() => session.user?.roleCode === 'SUPER_ADMIN')

export async function login(username, password) {
  if (isRemoteMode) {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const payload = await res.json()
    if (payload.code !== 0) throw new Error(payload.message || '登录失败')
    localStorage.setItem(TOKEN_KEY, payload.data.token)
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${payload.data.token}` },
    })
    const me = await meRes.json()
    const user = {
      userId: me.data.userId, username: me.data.username, realName: me.data.realName,
      roleCode: me.data.roleCode,
      roleName: {
        SUPER_ADMIN: '超级管理员',
        DISPATCHER: '调度员',
        MAINTAINER: '装维人员',
        ACCOUNT_MANAGER: '客户经理',
        OBSERVER: '只读观察员',
      }[me.data.roleCode] || me.data.roleCode,
      deptId: me.data.deptId,
      deptName: me.data.deptId === 1 ? '江苏电信' : `部门 ${me.data.deptId || '-'}`,
      dataScope: me.data.roleCode === 'SUPER_ADMIN' ? '全省组织' : '本部门授权数据',
    }
    session.user = user
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    return user
  }
  await new Promise((resolve) => window.setTimeout(resolve, 450))
  const user = mockUsers[username]
  if (!user || password !== '123456') throw new Error('账号或密码错误')
  session.user = user
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  return user
}

export function logout() {
  session.user = null
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(TOKEN_KEY)
}
