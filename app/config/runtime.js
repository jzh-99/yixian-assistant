const apiMode = import.meta.env.VITE_API_MODE || 'mock'

export const runtimeConfig = Object.freeze({
  apiMode,
  useMock: apiMode !== 'remote',
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, ''),
  requestTimeout: Number(import.meta.env.VITE_API_TIMEOUT || 15000),
})
