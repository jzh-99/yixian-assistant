import axios from 'axios'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

const http = axios.create({
  baseURL: '/api/v1',
  timeout: 15000
})

// 请求拦截：自动带 Token
http.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// 响应拦截：统一处理错误码
http.interceptors.response.use(
  res => {
    const { code, message: msg, data } = res.data
    if (code === 0) return data
    if (code === 401) {
      useAuthStore().logout()
      router.push('/login')
      return Promise.reject(new Error(msg))
    }
    message.error(msg || '请求失败')
    return Promise.reject(new Error(msg))
  },
  err => {
    message.error('网络异常，请稍后重试')
    return Promise.reject(err)
  }
)

export default http
