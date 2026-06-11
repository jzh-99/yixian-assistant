import { defineStore } from 'pinia'
import { ref } from 'vue'
import http from '@/utils/http'

export const useAuthStore = defineStore('auth', () => {
  const token    = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))

  async function login(username, password) {
    const data = await http.post('/auth/login', { username, password })
    token.value    = data.token
    userInfo.value = data
    localStorage.setItem('token',    data.token)
    localStorage.setItem('userInfo', JSON.stringify(data))
  }

  function logout() {
    token.value    = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  const isLoggedIn  = () => !!token.value
  const roleCode    = () => userInfo.value?.roleCode || ''
  const isAdmin     = () => ['SUPER_ADMIN', 'DEPT_ADMIN'].includes(roleCode())
  const isDispatcher= () => roleCode() === 'DISPATCHER' || isAdmin()

  return { token, userInfo, login, logout, isLoggedIn, roleCode, isAdmin, isDispatcher }
})
