import axios from 'axios'

// 使用相对路径，让 Vite 代理处理请求
// 生产环境使用实际的后端地址，开发环境使用空字符串（走代理）
const baseURL = import.meta.env.VITE_API_URL || ''
const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // 如果是 FormData，移除默认的 Content-Type，让浏览器自动设置
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  response => {
    if (import.meta.env.DEV) console.log('API响应原始数据:', response.data)
    if (import.meta.env.DEV) console.log('API响应状态:', response.status)
    const responseData = response.data
    if (responseData) {
      // 如果有code字段且为200，使用标准格式
      if (responseData.code === '200') {
        if (import.meta.env.DEV) console.log('标准格式响应，code=200，数据:', responseData)

        let data = responseData.data
        // 如果data是字符串，尝试解析为JSON
        if (typeof data === 'string') {
          try {
            const parsedData = JSON.parse(data)
            if (import.meta.env.DEV) console.log('解析data字符串为对象:', parsedData)
            data = parsedData
          } catch (e) {
            if (import.meta.env.DEV) console.warn('无法解析data字符串为JSON，保持原值:', e)
          }
        }

        return {
          success: true,
          code: responseData.code,
          message: responseData.message,
          data,
          detail: responseData.detail,
        }
      }
      // 如果没有code字段，将整个responseData作为data返回（兼容/chat接口）
      else if (responseData.code === undefined) {
        if (import.meta.env.DEV) console.log('兼容格式响应，无code字段，原始数据:', responseData)
        return {
          success: true,
          code: '200',
          message: 'success',
          data: responseData,
          detail: null,
        }
      }
    }
    // 其他情况：code存在且不是200，或者responseData为空
    if (import.meta.env.DEV) console.log('响应异常或错误:', responseData)
    return Promise.reject({
      success: false,
      code: responseData?.code || 400,
      message: responseData?.message || '请求失败',
      data: responseData?.data || null,
      detail: responseData?.detail || null,
    })
  },
  error => {
    if (import.meta.env.DEV) console.log('API请求错误:', error)
    if (error.response) {
      const responseData = error.response.data
      if (import.meta.env.DEV) console.log('错误响应数据:', responseData)
      return Promise.reject({
        success: false,
        code: responseData?.code || error.response.status,
        message: responseData?.message || '请求失败',
        data: responseData?.data || null,
        detail: responseData?.detail || error.message,
      })
    }
    if (import.meta.env.DEV) console.log('网络错误，无响应')
    return Promise.reject({
      success: false,
      code: 500,
      message: '网络错误',
      data: null,
      detail: '请检查网络连接',
    })
  }
)

export const chatAPI = {
  chat(message, conversationId, signal) {
    const config = {}
    if (signal) {
      config.signal = signal
    }
    return apiClient.post(
      '/api/v2/ai/chat',
      {
        message,
        conversationId: String(conversationId),
      },
      config
    ).then(response => {
      // response 是拦截器处理后的格式: { success, code, message, data, detail }
      const text = extractAssistantText(response.data)
      // 如果 data 是对象且没有 text 字段，添加 text 字段
      if (response.data && typeof response.data === 'object' && response.data.text === undefined) {
        response.data.text = text
      }
      return response
    })
  },

  createConversation() {
    return apiClient.post('/api/v2/ai/create')
  },

  getHistory(conversationId) {
    return apiClient.get(`/api/v2/history/${conversationId}`)
  },

  getConversationList() {
    return apiClient.get('/api/v2/history/list')
  },

  speak(text) {
    return apiClient.post('/api/v2/ai/speak', { text }, {})
  },

  updateConversationTitle(conversationId, title) {
    return apiClient.post('/api/v2/ai/title', {
      conversationId,
      title,
    })
  },

  deleteConversation(conversationId) {
    return apiClient.get(`/api/v2/history/clear/${conversationId}`)
  },
}

export const userAPI = {
  getUserDetail() {
    return apiClient.post('/api/v1/user/detail/detail/get')
  },

  updateUserDetail(userDetail) {
    return apiClient.post('/api/v1/user/detail/detail/update', userDetail)
  },

  getAvatar() {
    return apiClient.post('/api/v1/user/detail/avatar/get')
  },

  updateAvatar(file) {
    const formData = new FormData()
    formData.append('avatar', file)
    return apiClient.post('/api/v1/user/detail/avatar/update', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  getPosterDetail(userId) {
    return apiClient.post(`/api/v1/user/detail/detail/get/user?userId=${userId}`)
  },
}

export const postAPI = {
  uploadPost(formData) {
    return apiClient.post('/api/v2/posting/upload', formData)
  },

  searchPosting(keyword, pageNum, pageSize) {
    return apiClient.post(
      `/api/v2/searching/search?keyword=${encodeURIComponent(keyword)}&pageNum=${encodeURIComponent(pageNum)}&pageSize=${encodeURIComponent(pageSize)}`
    )
  },

  getPostingEncapsulate(postingId) {
    return apiClient.post(`/api/v2/searching/encapsulate?postingId=${postingId}`)
  },

  getPosting(postingId) {
    return apiClient.post(`/api/v2/posting/get?postingId=${postingId}`)
  },

  isLiked(postingId) {
    return apiClient.post(`/api/v2/posting/isLiked?postingId=${postingId}`)
  },

  isCollected(postingId) {
    return apiClient.post(`/api/v2/posting/isCollected?postingId=${postingId}`)
  },

  // 点赞帖子
  likePosting(postingId) {
    return apiClient.post(`/api/v2/posting/like?postingId=${postingId}`)
  },

  // 收藏帖子
  collectionPosting(postingId) {
    return apiClient.post(`/api/v2/posting/collection?postingId=${postingId}`)
  },

  // 取消点赞帖子
  cancelLikePosting(postingId) {
    return apiClient.post(`/api/v2/posting/cancelLike?postingId=${postingId}`)
  },

  // 取消收藏帖子
  cancelCollectionPosting(postingId) {
    return apiClient.post(`/api/v2/posting/cancelCollection?postingId=${postingId}`)
  },

  // 获取帖子的收藏数
  getCollectionCount(postingId) {
    return apiClient.post(`/api/v2/posting/getCollectionCount?postingId=${postingId}`)
  },

  // 获取帖子的点赞数
  getLikeCount(postingId) {
    return apiClient.post(`/api/v2/posting/getLikeCount?postingId=${postingId}`)
  },

  // 获取自己的帖子
  getMyPosting() {
    return apiClient.post('/api/v2/posting/getMyPosting')
  },

  // 删除帖子
  deletePosting(postingId) {
    return apiClient.post(`/api/v2/posting/delete?postingId=${postingId}`)
  },
}

export const adminAPI = {
  uploadFiles(files) {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    return apiClient.post('/api/yachiyo/168/mini/admin/upload', formData)
  },
}

export const commentAPI = {
  // 添加评论
  addComment(commentRequest) {
    return apiClient.post('/api/v1/auth/add-comment', commentRequest)
  },

  // 获取评论列表
  getCommentList(postingId) {
    return apiClient.post('/api/v1/auth/get-comment-list', postingId)
  },

  // 删除评论
  deleteComment(commentId) {
    return apiClient.post('/api/v1/auth/delete-comment', commentId)
  },
}

/**
 * 从API响应数据中提取文本
 * @param {any} responseData - API响应数据
 * @returns {string} 提取的文本
 */
function extractAssistantText(responseData) {
  if (!responseData) return ''

  let parsedData = responseData

  // 如果 responseData 是字符串，尝试解析为JSON
  if (typeof responseData === 'string') {
    try {
      parsedData = JSON.parse(responseData)
    } catch (e) {
      if (import.meta.env.DEV) console.warn('无法解析响应字符串为JSON:', e)
      // 如果解析失败，使用原字符串
      return responseData
    }
  }

  // 此时 parsedData 应该是对象
  if (parsedData && typeof parsedData === 'object') {
    // 如果 parsedData 直接有 text 字段（例如 {think, text, motion}）
    if (parsedData.text !== undefined) {
      return parsedData.text
    }
    // 如果 parsedData 有 data 字段且包含 text（嵌套结构）
    else if (parsedData.data && parsedData.data.text !== undefined) {
      return parsedData.data.text
    }
    // 如果是其他对象格式
    else {
      return JSON.stringify(parsedData)
    }
  }

  return ''
}

export default apiClient
