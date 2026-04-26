import { ref } from 'vue'
import { userAPI } from '../services/api'
import type { SearchUserItem } from '../types/api'

export function useUserSearch() {
  // 确保始终是数组，避免赋值错误的类型
  const searchResults = ref<SearchUserItem[]>([])
  const isSearching = ref(false)
  const searchError = ref<string | null>(null)
  const searchKeyword = ref('')

  // 搜索用户
  const searchUsers = async (keyword: string, pageNum: number = 1, pageSize: number = 20) => {
    if (!keyword.trim()) {
      searchResults.value = []
      return
    }

    searchKeyword.value = keyword
    isSearching.value = true
    searchError.value = null

    try {
      const res = await userAPI.searchUsers(keyword, pageNum, pageSize)
      if (res.success && res.data) {
        // 响应拦截器已经处理了数据提取，res.data 已经是用户数组
        if (Array.isArray(res.data)) {
          searchResults.value = [...res.data]
        } else {
          // 兼容旧格式
          searchResults.value = [res.data as any]
        }
      } else {
        searchResults.value = []
      }
    } catch (err: any) {
      console.error('搜索用户失败:', err)
      searchError.value = err.message || '搜索失败'
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }

  // 清空搜索结果
  const clearSearchResults = () => {
    searchResults.value = []
    searchKeyword.value = ''
    searchError.value = null
  }

  return {
    searchResults,
    isSearching,
    searchError,
    searchKeyword,
    searchUsers,
    clearSearchResults,
  }
}
