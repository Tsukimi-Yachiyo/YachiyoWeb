import { ref } from 'vue'
import { userAPI } from '../services/api'
import { processImageData } from './useImageData'

// 缓存键名
const USERNAME_CACHE_KEY = 'cached_username'
const AVATAR_CACHE_KEY = 'cached_avatar'

export function useUserProfile() {
  // 从缓存中初始化用户信息
  const username = ref(localStorage.getItem(USERNAME_CACHE_KEY) || '')
  const userAvatar = ref(localStorage.getItem(AVATAR_CACHE_KEY) || '')

  const loadUserDetail = async () => {
    try {
      // 分别获取用户详情和头像，避免一个失败影响另一个
      const detailResult = await userAPI.getUserDetail().catch(error => {
        console.warn('获取用户详情失败:', error)
        return { success: false, data: null }
      })

      const avatarResult = await userAPI.getAvatar().catch(error => {
        console.warn('获取用户头像失败:', error)
        return { success: false, data: null, detail: error.detail }
      })

      if (detailResult.success && detailResult.data && detailResult.data.userName) {
        username.value = detailResult.data.userName
        localStorage.setItem(USERNAME_CACHE_KEY, detailResult.data.userName)
      }

      if (avatarResult.success && avatarResult.data) {
        const avatarData = avatarResult.data
        const avatarValue = processImageData(avatarData)
        userAvatar.value = avatarValue
        localStorage.setItem(AVATAR_CACHE_KEY, avatarValue)
      } else {
        // 头像不存在或获取失败，清空头像缓存
        console.warn('头像加载失败或不存在:', avatarResult?.detail || '无头像数据')
        userAvatar.value = ''
        localStorage.removeItem(AVATAR_CACHE_KEY)
      }
    } catch (error) {
      console.error('加载用户详情过程中发生未知错误:', error)
    }
  }

  const clearCache = () => {
    username.value = ''
    userAvatar.value = ''
    localStorage.removeItem(USERNAME_CACHE_KEY)
    localStorage.removeItem(AVATAR_CACHE_KEY)
  }

  return {
    username,
    userAvatar,
    loadUserDetail,
    clearCache,
  }
}
