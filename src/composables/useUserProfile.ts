import { ref } from 'vue'
import { userAPI } from '../services/api'
import { processImageData } from './useImageData'

// 缓存键名
const USERNAME_CACHE_KEY = 'cached_username'
const AVATAR_CACHE_KEY = 'cached_avatar'

// 模块级单例状态：跨页面复用，避免路由切换反复拉取导致头像闪烁
const usernameState = ref(localStorage.getItem(USERNAME_CACHE_KEY) || '')
const userAvatarState = ref(localStorage.getItem(AVATAR_CACHE_KEY) || '')
const hasLoadedProfile = ref(false)
const isLoadingProfile = ref(false)

export function useUserProfile() {
  const loadUserDetail = async (forceRefresh = false) => {
    if (!forceRefresh && hasLoadedProfile.value) return
    if (isLoadingProfile.value) return

    isLoadingProfile.value = true
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
        usernameState.value = detailResult.data.userName
        localStorage.setItem(USERNAME_CACHE_KEY, detailResult.data.userName)
      }

      if (avatarResult.success && avatarResult.data) {
        const avatarData = avatarResult.data
        const avatarValue = processImageData(avatarData)
        userAvatarState.value = avatarValue
        localStorage.setItem(AVATAR_CACHE_KEY, avatarValue)
      } else {
        const detailText = String(avatarResult?.detail || '')
        const isAvatarNotFound = detailText.includes('用户头像不存在') || detailText.includes('404')

        if (isAvatarNotFound) {
          userAvatarState.value = ''
          localStorage.removeItem(AVATAR_CACHE_KEY)
        } else {
          // 网络抖动或临时失败时保持旧头像，避免路由切页闪烁
          console.warn('头像加载失败，保留现有缓存头像:', detailText || '无头像数据')
        }
      }
      hasLoadedProfile.value = true
    } catch (error) {
      console.error('加载用户详情过程中发生未知错误:', error)
    } finally {
      isLoadingProfile.value = false
    }
  }

  const clearCache = () => {
    usernameState.value = ''
    userAvatarState.value = ''
    hasLoadedProfile.value = false
    localStorage.removeItem(USERNAME_CACHE_KEY)
    localStorage.removeItem(AVATAR_CACHE_KEY)
  }

  return {
    username: usernameState,
    userAvatar: userAvatarState,
    loadUserDetail,
    clearCache,
  }
}
