import { runtimeConfig } from '../config/runtime'
import { authStore } from './authStore'

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = options.code ?? 500
    this.requestId = options.requestId || ''
    this.details = options.details
  }
}

export function createIdempotencyKey(prefix = 'write') {
  return `${prefix}-${crypto.randomUUID()}`
}

export function withIdempotency(payload = {}, prefix) {
  return {
    ...payload,
    idempotencyKey: payload.idempotencyKey || createIdempotencyKey(prefix),
  }
}

export async function request(path, options = {}) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), options.timeout || runtimeConfig.requestTimeout)
  const token = authStore.getToken()
  const isFormData = options.body instanceof FormData
  const headers = {
    Accept: 'application/json',
    ...(!isFormData && options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(token && options.auth !== false ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  try {
    const response = await fetch(`${runtimeConfig.apiBaseUrl}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body === undefined || isFormData ? options.body : JSON.stringify(options.body),
      signal: controller.signal,
    })
    const result = await response.json().catch(() => null)

    if (!response.ok || !result) {
      throw new ApiError('网络服务暂时不可用', {
        code: response.status,
        requestId: response.headers.get('x-request-id') || '',
      })
    }

    if (result.code !== 0) {
      if (result.code === 401) {
        authStore.clear()
        window.dispatchEvent(new CustomEvent('yixian:auth-expired'))
      }
      throw new ApiError(result.message || '业务处理失败', {
        code: result.code,
        requestId: result.requestId,
        details: result.data,
      })
    }

    return result.data
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error.name === 'AbortError') {
      throw new ApiError('请求超时，请稍后重试', { code: 408 })
    }
    throw new ApiError('无法连接业务服务，请检查网络或后端配置', { code: 503 })
  } finally {
    window.clearTimeout(timeout)
  }
}
