/**
 * 装维功能相关 API（任务、领料申请、AI 解析、文件上传）
 * 来源：翼线助手APP-v1.0/src/services/api.js
 */
import { runtimeConfig } from '../config/runtime'
import {
  APPLICATION_TYPE,
  TASK_STATUS,
  normalizeCurrentUser,
} from '../domain/contracts'
import { demoMaintainerUser, assistantAnswers } from '../data/maintainerMockData'
import { authStore } from './authStore'
import { createIdempotencyKey, request, withIdempotency } from './httpClient'

const wait = (ms = 350) => new Promise((resolve) => window.setTimeout(resolve, ms))

const remoteApi = {
  tasks: {
    list: (params) => request(`/tasks${params ? '?' + new URLSearchParams(params) : ''}`),
    get: (id) => request(`/tasks/${id}`),
    accept: (id, version) => request(`/tasks/${id}/accept`, {
      method: 'POST',
      body: withIdempotency({ version }, 'accept-task'),
    }),
    start: (id, version) => request(`/tasks/${id}/start`, {
      method: 'POST',
      body: withIdempotency({ version }, 'start-task'),
    }),
    complete: (id, payload) => request(`/tasks/${id}/complete`, {
      method: 'POST',
      body: withIdempotency(payload, 'complete-task'),
    }),
  },
  applications: {
    create: (payload) => request('/applications', {
      method: 'POST',
      body: withIdempotency(payload, 'application'),
    }),
  },
  ai: {
    extract: (payload) => request('/ai/extract', { method: 'POST', body: payload }),
  },
  files: {
    upload(file, metadata = {}) {
      const form = new FormData()
      form.append('file', file)
      Object.entries(metadata).forEach(([key, value]) => form.append(key, value))
      form.append('idempotencyKey', createIdempotencyKey('file'))
      return request('/files/upload', { method: 'POST', body: form })
    },
  },
}

const mockApi = {
  tasks: {
    async list() {
      await wait()
      return { list: [], total: 0, pageNo: 1, pageSize: 20 }
    },
    async accept(id, version) {
      await wait()
      return { id, version: version + 1, status: TASK_STATUS.ACCEPTED }
    },
    async start(id, version) {
      await wait()
      return { id, version: version + 1, status: TASK_STATUS.IN_PROGRESS }
    },
    async complete(id, payload) {
      await wait(550)
      return { id, version: payload.version + 1, status: TASK_STATUS.COMPLETED }
    },
  },
  applications: {
    async create(payload) {
      await wait(550)
      return {
        id: `APP-${Date.now()}`,
        appNo: `SQ${Date.now().toString().slice(-12)}`,
        ...payload,
      }
    },
  },
  ai: {
    async extract({ input, applicationType }) {
      await wait(800)
      if (!input.trim()) throw new Error('请先描述你的需求')
      if (applicationType === APPLICATION_TYPE.MATERIAL) {
        return {
          fields: {
            title: input.includes('修') ? '宽带故障维修' : '现场装维领料',
            content: input,
            expectedTime: '2026-06-11 09:00:00',
            location: input.includes('鼓楼') ? '南京市鼓楼区' : '',
            urgency: input.includes('紧急') ? 'URGENT' : 'NORMAL',
            materials: [
              { name: '光猫', quantity: 1, unit: '台' },
              { name: '光纤', quantity: 1, unit: '根' },
            ],
          },
          missingFields: [],
          warnings: [{ field: 'materials', message: '请确认物料规格' }],
          confidence: 0.88,
        }
      }
      throw new Error('仅支持领料申请解析')
    },
  },
  files: {
    async upload(file) {
      await wait()
      return { fileUrl: URL.createObjectURL(file), originalName: file.name }
    },
  },
}

export const api = runtimeConfig.useMock ? mockApi : remoteApi
export const apiRuntime = runtimeConfig

/** 装维演示登录 */
export async function loginMaintainer() {
  const user = normalizeCurrentUser(demoMaintainerUser)
  authStore.setToken(`demo-token-${Date.now()}`)
  authStore.setSession(user)
  return user
}

export { assistantAnswers }
