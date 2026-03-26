import { ref } from 'vue'
import { userAPI } from '../services/api.js'
import { processImageData } from './useImageData.js'

// 缓存键名
const USERNAME_CACHE_KEY = 'cached_username'
const AVATAR_CACHE_KEY = 'cached_avatar'

export function useUserProfile() {
  // 从缓存中初始化用户信息
  const username = ref(localStorage.getItem(USERNAME_CACHE_KEY) || '')
  const userAvatar = ref(localStorage.getItem(AVATAR_CACHE_KEY) || '')

  const loadUserDetail = async () => {
    try {
      const [detailResult, avatarResult] = await Promise.all([
        userAPI.getUserDetail(),
        userAPI.getAvatar(),
      ])

      if (detailResult.success && detailResult.data.userName) {
        username.value = detailResult.data.userName
        localStorage.setItem(USERNAME_CACHE_KEY, detailResult.data.userName)
      }

      if (avatarResult.success && avatarResult.data) {
        const avatarData = avatarResult.data
        const avatarValue = processImageData(avatarData)
        userAvatar.value = avatarValue
        localStorage.setItem(AVATAR_CACHE_KEY, avatarValue)
      }
    } catch (error) {
      console.error('加载用户详情失败:', error)
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
