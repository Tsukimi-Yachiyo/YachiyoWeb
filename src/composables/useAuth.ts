import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserProfile } from './useUserProfile'
import apiClient from '../services/api'

export function useAuth() {
  const router = useRouter()
  const token = ref(localStorage.getItem('token'))
  const username = ref(localStorage.getItem('username') || '用户')
  const { clearCache } = useUserProfile()

  const isAuthenticated = () => !!token.value

  const login = (newToken, newUsername) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('username', newUsername)
    token.value = newToken
    username.value = newUsername
  }

  const logout = async () => {
    try {
      // 调用后端退出登录API
      await apiClient.post('/api/v1/auth/logout')
    } catch (error) {
      console.error('退出登录失败:', error)
      // 即使API调用失败，也执行本地退出逻辑
    } finally {
      // 清除本地存储
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      token.value = null
      username.value = ''
      clearCache()
      router.push('/')
    }
  }

  return {
    token,
    username,
    isAuthenticated,
    login,
    logout,
  }
}
