const TOKEN_KEY = 'yixian-access-token'
const SESSION_KEY = 'yixian-session'

export const authStore = {
  getToken() {
    return window.localStorage.getItem(TOKEN_KEY) || ''
  },

  setToken(token) {
    if (token) window.localStorage.setItem(TOKEN_KEY, token)
  },

  getSession() {
    try {
      return JSON.parse(window.localStorage.getItem(SESSION_KEY) || 'null')
    } catch {
      return null
    }
  },

  setSession(user) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  },

  clear() {
    window.localStorage.removeItem(TOKEN_KEY)
    window.localStorage.removeItem(SESSION_KEY)
  },
}
