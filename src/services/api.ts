/// <reference lib="dom" />
/* global AbortSignal */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'
import { extractAssistantText } from '../utils/extractAssistantText'
import type {
  ApiResponse,
  RawApiResponse,
  ChatResponseData,
  UserDetailResponse,
  PosterDetailResponse,
  PostEncapsulateResponse,
  GetPostingResponse,
  PostStatsResponse,
  CommentRequest,
  Comment,
  AdminPosting,
  SelfPostResponse,
  ColumnResponse,
  ColumnInteractionResponse,
  UserPublicDetailResponse,
  SearchUserItem,
  UserRelationListResponse,
  SearchDetailResponse,
  ChatConnection,
  ChatMessage,
  CreateChatConnectionRequest,
  SendPrivateMessageRequest,
} from '../types/api'

// 扩展 Axios 请求配置，添加 metadata 字段
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: number
    }
  }
}

// 使用相对路径，让 Vite 代理处理请求
// 生产环境使用实际的后端地址，开发环境使用空字符串（走代理）
const baseURL = import.meta.env.VITE_API_URL || ''
const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 防止并发刷新令牌
let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback)
}

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token))
  refreshSubscribers = []
}

// 解析 JWT token 获取 userId
const getUserIdFromToken = (token: string): number | null => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map(c => {
          return `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`
        })
        .join('')
    )
    const payload = JSON.parse(jsonPayload)
    return payload.userId || payload.id || null
  } catch (error) {
    console.error('解析 token 失败:', error)
    return null
  }
}

// 性能监控
const performanceMonitor = {
  totalRequests: 0,
  failedRequests: 0,
  totalResponseTime: 0,

  get successRate() {
    return this.totalRequests > 0
      ? (((this.totalRequests - this.failedRequests) / this.totalRequests) * 100).toFixed(2)
      : 100
  },

  get averageResponseTime() {
    return this.totalRequests > 0 ? (this.totalResponseTime / this.totalRequests).toFixed(2) : 0
  },

  logMetrics() {
    if (import.meta.env.DEV) {
      console.log(
        `[API Performance] 总请求: ${this.totalRequests}, ` +
          `失败: ${this.failedRequests}, ` +
          `成功率: ${this.successRate}%, ` +
          `平均响应时间: ${this.averageResponseTime}ms`
      )
    }
  },
}

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 根据请求路径选择使用普通token还是管理员token
    let token
    if (config.url?.includes('/api/yachiyo/168/mini/admin')) {
      token = localStorage.getItem('adminToken')
    } else {
      token = localStorage.getItem('token')
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // 如果是 FormData，移除默认的 Content-Type，让浏览器自动设置
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    // 性能监控：记录请求开始时间
    config.metadata = { startTime: Date.now() }
    performanceMonitor.totalRequests++
    return config
  },
  (error: any) => {
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response: AxiosResponse<RawApiResponse | RawApiResponse[]>) => {
    // 性能监控：计算响应时间
    const startTime = response.config.metadata?.startTime
    if (startTime) {
      const duration = Date.now() - startTime
      performanceMonitor.totalResponseTime += duration
      if (import.meta.env.DEV) {
        console.log(`[API Performance] 请求耗时: ${duration}ms, URL: ${response.config.url}`)
      }
    }
    if (import.meta.env.DEV) console.log('API响应原始数据:', response.data)
    if (import.meta.env.DEV) console.log('API响应状态:', response.status)
    const responseData = response.data

    // 处理响应是数组的情况（例如搜索API返回多个响应对象）
    if (Array.isArray(responseData)) {
      if (import.meta.env.DEV) console.log('响应是数组，处理每个元素:', responseData)

      // 提取每个元素中的 data 字段，只保留 code === '200' 的
      const extractedData = responseData
        .filter(item => item.code === '200' && item.data)
        .map(item => item.data)

      response.data = {
        success: true,
        code: '200',
        message: 'success',
        data: extractedData,
        detail: null,
      } as any
      return response
    }

    // 处理响应是单个对象的情况
    if (responseData) {
      // 如果有code字段且为200，使用标准格式
      if (responseData.code === '200') {
        if (import.meta.env.DEV) console.log('标准格式响应，code=200，数据:', responseData)

        let data = responseData.data
        // 如果data是字符串，尝试解析为JSON
        if (typeof data === 'string') {
          // 检查字符串是否看起来像JSON（以{或[开头）
          if (data.trim().startsWith('{') || data.trim().startsWith('[')) {
            try {
              const parsedData = JSON.parse(data)
              if (import.meta.env.DEV) console.log('解析data字符串为对象:', parsedData)
              data = parsedData
            } catch (e) {
              if (import.meta.env.DEV) console.warn('无法解析data字符串为JSON，保持原值:', e)
            }
          } else {
            // 不是JSON格式的字符串，保持原值（如JWT令牌）
            if (import.meta.env.DEV)
              console.log('data字符串不是JSON格式，保持原值:', `${data.substring(0, 50)}...`)
          }
        }

        response.data = {
          success: true,
          code: responseData.code,
          message: responseData.message,
          data,
          detail: responseData.detail,
        } as any
        return response
      }
      // 如果没有code字段，将整个responseData作为data返回（兼容/chat接口）
      else if (responseData.code === undefined) {
        if (import.meta.env.DEV) console.log('兼容格式响应，无code字段，原始数据:', responseData)
        response.data = {
          success: true,
          code: '200',
          message: 'success',
          data: responseData,
          detail: null,
        } as any
        return response
      }
    }
    // 其他情况：code存在且不是200，或者responseData为空
    if (import.meta.env.DEV) console.log('响应异常或错误:', responseData)
    return Promise.reject({
      success: false,
      code: (responseData as any)?.code || 400,
      message: (responseData as any)?.message || '请求失败',
      data: (responseData as any)?.data || null,
      detail: (responseData as any)?.detail || null,
    })
  },
  async (error: AxiosError) => {
    // 性能监控：记录失败请求
    performanceMonitor.failedRequests++
    const startTime = error.config?.metadata?.startTime
    if (startTime) {
      const duration = Date.now() - startTime
      if (import.meta.env.DEV) {
        console.log(`[API Performance] 请求失败，耗时: ${duration}ms, URL: ${error.config?.url}`)
      }
    }
    if (import.meta.env.DEV) console.log('API请求错误:', error)

    const originalRequest = error.config as any
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      const token = localStorage.getItem('token')
      const adminToken = localStorage.getItem('adminToken')

      // 检查是否是管理员接口
      const isAdminRequest = originalRequest.url?.includes('/api/yachiyo/168/mini/admin')
      const currentToken = isAdminRequest ? adminToken : token

      if (!currentToken) {
        // 没有 token，直接跳转登录
        redirectToLogin()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // 如果正在刷新，等待刷新完成后重试
        return new Promise(resolve => {
          subscribeTokenRefresh(newToken => {
            if (isAdminRequest) {
              localStorage.setItem('adminToken', newToken)
            } else {
              localStorage.setItem('token', newToken)
            }
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            resolve(apiClient(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          throw new Error('没有 refreshToken')
        }

        const userId = getUserIdFromToken(currentToken)
        if (!userId) {
          throw new Error('无法从 token 中解析 userId')
        }

        // 调用刷新令牌接口
        const refreshResponse = await apiClient.post(
          `/api/v1/auth/refresh-token?refreshToken=${encodeURIComponent(refreshToken)}&userId=${userId}`
        )

        const newToken = refreshResponse.data.data
        if (isAdminRequest) {
          localStorage.setItem('adminToken', newToken)
        } else {
          localStorage.setItem('token', newToken)
        }

        onTokenRefreshed(newToken)

        // 重试原始请求
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        console.error('刷新令牌失败:', refreshError)
        // 刷新失败，清除所有认证信息并跳转登录
        redirectToLogin()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    if (error.response) {
      const responseData = error.response.data as any
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

// 跳转到登录页面
const redirectToLogin = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('adminToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('username')
  window.location.href = '/'
}

function unwrapData<T>(request: Promise<AxiosResponse<ApiResponse<T>>>): Promise<ApiResponse<T>> {
  return request.then(response => response.data)
}

export const chatAPI = {
  chat(
    message: string,
    conversationId: string | number,
    signal?: AbortSignal
  ): Promise<ApiResponse<ChatResponseData>> {
    const config: AxiosRequestConfig = {}
    if (signal) {
      config.signal = signal
    }
    return apiClient
      .post<ApiResponse<ChatResponseData>>(
        '/api/v2/ai/chat',
        {
          message,
          conversationId: String(conversationId),
        },
        config
      )
      .then((response: AxiosResponse<ApiResponse<ChatResponseData>>) => {
        // response.data 是拦截器处理后的格式: { success, code, message, data, detail }
        const text = extractAssistantText(response.data.data)
        // 如果 data 是对象且没有 text 字段，添加 text 字段
        if (
          response.data.data &&
          typeof response.data.data === 'object' &&
          response.data.data.text === undefined
        ) {
          response.data.data.text = text
        }
        return response.data
      })
  },

  createConversation(): Promise<ApiResponse<any>> {
    return unwrapData(apiClient.post<ApiResponse<any>>('/api/v2/ai/create'))
  },

  getHistory(conversationId: string | number): Promise<ApiResponse<any>> {
    return unwrapData(apiClient.get<ApiResponse<any>>(`/api/v2/history/${conversationId}`))
  },

  getConversationList(): Promise<ApiResponse<any>> {
    return unwrapData(apiClient.get<ApiResponse<any>>('/api/v2/history/list'))
  },

  speak(text: string): Promise<ApiResponse<any>> {
    return unwrapData(apiClient.post<ApiResponse<any>>('/api/v2/ai/speak', { text }, {}))
  },

  updateConversationTitle(
    conversationId: string | number,
    title: string
  ): Promise<ApiResponse<any>> {
    return unwrapData(
      apiClient.post<ApiResponse<any>>('/api/v2/ai/title', {
        conversationId,
        title,
      })
    )
  },

  deleteConversation(conversationId: string | number): Promise<ApiResponse<any>> {
    return unwrapData(apiClient.get<ApiResponse<any>>(`/api/v2/history/clear/${conversationId}`))
  },
}

export const userAPI = {
  getUserDetail(): Promise<ApiResponse<UserDetailResponse>> {
    return unwrapData(apiClient.post<ApiResponse<UserDetailResponse>>('/api/v2/user/detail/get'))
  },

  updateUserDetail(userDetail: Partial<UserDetailResponse>): Promise<ApiResponse<boolean>> {
    return unwrapData(
      apiClient.post<ApiResponse<boolean>>('/api/v2/user/detail/update', userDetail)
    )
  },

  getAvatar(): Promise<ApiResponse<string>> {
    return unwrapData(apiClient.post<ApiResponse<string>>('/api/v2/user/avatar/get'))
  },

  updateAvatar(file: File): Promise<ApiResponse<boolean>> {
    const formData = new FormData()
    // 兼容后端字段名差异：部分实现读取 avatar，部分读取 fileBytes
    formData.append('avatar', file)
    formData.append('fileBytes', file)
    return unwrapData(apiClient.post<ApiResponse<boolean>>('/api/v2/user/avatar/update', formData))
  },

  getPosterDetail(userId: number): Promise<ApiResponse<PosterDetailResponse>> {
    return unwrapData(
      apiClient.post<ApiResponse<PosterDetailResponse>>(
        `/api/v2/user/detail/poster/get?userId=${userId}`
      )
    )
  },

  getUserDetailById(userId: number): Promise<ApiResponse<PosterDetailResponse>> {
    return unwrapData(
      apiClient.post<ApiResponse<PosterDetailResponse>>(`/api/v2/user/detail/get?userId=${userId}`)
    )
  },

  getUserPublicDetail(userId: number): Promise<ApiResponse<UserPublicDetailResponse>> {
    return unwrapData(
      apiClient.post<ApiResponse<UserPublicDetailResponse>>(
        `/api/v2/user/detail/user/detail/get?userId=${userId}`
      )
    )
  },

  getUserFollows(): Promise<ApiResponse<number[]>> {
    return unwrapData(apiClient.post<ApiResponse<number[]>>('/api/v2/user/detail/user/follow/get'))
  },

  getUserFollowers(): Promise<ApiResponse<number[]>> {
    return unwrapData(
      apiClient.post<ApiResponse<number[]>>('/api/v2/user/detail/user/follow/getFollower')
    )
  },

  followUser(followeeId: number): Promise<ApiResponse<boolean>> {
    return unwrapData(
      apiClient.post<ApiResponse<boolean>>(
        `/api/v2/user/detail/user/follow/follow?followeeId=${followeeId}`
      )
    )
  },

  getFollowStatus(followeeId: number): Promise<ApiResponse<boolean>> {
    return unwrapData(
      apiClient.post<ApiResponse<boolean>>(
        `/api/v2/user/detail/user/follow/status/get?followeeId=${followeeId}`
      )
    )
  },

  getInteractionDetail(followeeId: number): Promise<ApiResponse<SearchDetailResponse>> {
    return unwrapData(
      apiClient.post<ApiResponse<SearchDetailResponse>>(
        `/api/v2/user/detail/user/interaction/get?followeeId=${followeeId}`
      )
    )
  },

  // 新增搜索用户接口
  searchUsers(
    keyword: string,
    pageNum: number = 1,
    pageSize: number = 20
  ): Promise<ApiResponse<SearchUserItem[]>> {
    return unwrapData(
      apiClient.post<ApiResponse<SearchUserItem[]>>(
        `/api/v2/user/detail/user/search?userName=${encodeURIComponent(
          keyword
        )}&pageNum=${pageNum}&pageSize=${pageSize}`
      )
    )
  },
}

export const systemAPI = {
  testBackendStatus(): Promise<ApiResponse<unknown>> {
    return unwrapData(apiClient.get<ApiResponse<unknown>>('/api/v3/test/hello'))
  },
}

export const postAPI = {
  uploadPost(formData: FormData): Promise<ApiResponse<boolean>> {
    return unwrapData(apiClient.post<ApiResponse<boolean>>('/api/v2/posting/upload', formData))
  },

  searchPosting(
    keyword: string,
    pageNum: number,
    pageSize: number
  ): Promise<ApiResponse<number[]>> {
    return unwrapData(
      apiClient.post<ApiResponse<number[]>>(
        `/api/v2/posting/search?keyword=${encodeURIComponent(keyword)}&pageNum=${encodeURIComponent(pageNum)}&pageSize=${encodeURIComponent(pageSize)}`
      )
    )
  },

  getPostingEncapsulate(postingId: number): Promise<ApiResponse<PostEncapsulateResponse>> {
    return unwrapData(
      apiClient.post<ApiResponse<PostEncapsulateResponse>>(
        `/api/v2/posting/encapsulate?postingId=${postingId}`
      )
    )
  },

  getPosting(postingId: number): Promise<ApiResponse<GetPostingResponse>> {
    return unwrapData(
      apiClient.post<ApiResponse<GetPostingResponse>>(`/api/v2/posting/get?postingId=${postingId}`)
    )
  },

  isLiked(postingId: number): Promise<ApiResponse<boolean>> {
    return this.getPostStats(postingId).then(response => {
      return {
        ...response,
        data: response.data?.liked || false,
      }
    })
  },

  isCollected(postingId: number): Promise<ApiResponse<boolean>> {
    return this.getPostStats(postingId).then(response => {
      return {
        ...response,
        data: response.data?.collected || false,
      }
    })
  },

  // 点赞帖子
  likePosting(postingId: number): Promise<ApiResponse<boolean>> {
    return this.interaction(postingId, 'LIKE', 'ADD')
  },

  // 收藏帖子
  collectionPosting(postingId: number): Promise<ApiResponse<boolean>> {
    return this.interaction(postingId, 'COLLECTION', 'ADD')
  },

  // 取消点赞帖子
  cancelLikePosting(postingId: number): Promise<ApiResponse<boolean>> {
    return this.interaction(postingId, 'LIKE', 'REMOVE')
  },

  // 取消收藏帖子
  cancelCollectionPosting(postingId: number): Promise<ApiResponse<boolean>> {
    return this.interaction(postingId, 'COLLECTION', 'REMOVE')
  },

  // 获取帖子的收藏数
  getCollectionCount(postingId: number): Promise<ApiResponse<number>> {
    return this.getPostStats(postingId).then(response => {
      return {
        ...response,
        data: response.data?.collectionCount || 0,
      }
    })
  },

  // 获取帖子的点赞数
  getLikeCount(postingId: number): Promise<ApiResponse<number>> {
    return this.getPostStats(postingId).then(response => {
      return {
        ...response,
        data: response.data?.likeCount || 0,
      }
    })
  },

  // 获取自己的帖子
  getMyPosting(): Promise<ApiResponse<SelfPostResponse[]>> {
    return unwrapData(
      apiClient.post<ApiResponse<SelfPostResponse[]>>('/api/v2/posting/getMyPosting')
    )
  },

  // 帖子互动（合并接口，替代点赞/收藏相关接口）
  interaction(
    postingId: number,
    type: 'LIKE' | 'COLLECTION',
    action: 'ADD' | 'REMOVE' | 'TOGGLE'
  ): Promise<ApiResponse<boolean>> {
    return unwrapData(
      apiClient.post<ApiResponse<boolean>>('/api/v2/posting/interaction', {
        postingId,
        type,
        action,
      })
    )
  },

  // 获取帖子统计信息（合并接口，替代单个统计接口）
  getPostStats(postingId: number): Promise<ApiResponse<PostStatsResponse>> {
    return unwrapData(
      apiClient.post<ApiResponse<PostStatsResponse>>(`/api/v2/posting/stats?postingId=${postingId}`)
    )
  },

  // 删除帖子
  deletePosting(postingId: number): Promise<ApiResponse<boolean>> {
    const formData = new URLSearchParams()
    formData.append('postingId', String(postingId))
    return unwrapData(
      apiClient.post<ApiResponse<boolean>>('/api/v2/posting/delete', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    )
  },

  // 获取用户的帖子列表
  getUserPosting(userId: number): Promise<ApiResponse<number[]>> {
    return unwrapData(
      apiClient.post<ApiResponse<number[]>>(`/api/v2/posting/user?userId=${userId}`)
    )
  },
}

export const adminAPI = {
  uploadFiles(files: File[]): Promise<ApiResponse<boolean>> {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    return unwrapData(
      apiClient.post<ApiResponse<boolean>>('/api/yachiyo/168/mini/admin/upload', formData)
    )
  },

  runCommand(command: string): Promise<ApiResponse<string>> {
    const formData = new URLSearchParams()
    formData.append('command', command)
    return unwrapData(
      apiClient.post<ApiResponse<string>>('/api/yachiyo/168/mini/admin/run-command', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    )
  },

  getRemainingToken(): Promise<ApiResponse<number>> {
    return unwrapData(
      apiClient.post<ApiResponse<number>>('/api/yachiyo/168/mini/admin/get-remaining-token')
    )
  },

  changeApiKey(apiKey: string, model: string): Promise<ApiResponse<void>> {
    const formData = new URLSearchParams()
    formData.append('apiKey', apiKey)
    formData.append('model', model)
    return unwrapData(
      apiClient.post<ApiResponse<void>>('/api/yachiyo/168/mini/admin/change-api-key', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    )
  },

  login(username: string, password: string): Promise<ApiResponse<string>> {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)
    return unwrapData(
      apiClient.post<ApiResponse<string>>('/api/yachiyo/168/mini/admin/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    )
  },

  reviewPost(postingId: number, action: string, reason?: string): Promise<ApiResponse<boolean>> {
    return unwrapData(
      apiClient.post<ApiResponse<boolean>>('/api/yachiyo/168/mini/admin/review', {
        postingId,
        action,
        reason,
      })
    )
  },

  getPendingPosts(
    status?: string,
    keyword?: string,
    pageNum?: number,
    pageSize?: number
  ): Promise<ApiResponse<AdminPosting[]>> {
    return unwrapData(
      apiClient.post<ApiResponse<AdminPosting[]>>('/api/yachiyo/168/mini/admin/query-postings', {
        status: status || 'PENDING',
        keyword,
        pageNum: pageNum || 1,
        pageSize: pageSize || 20,
      })
    )
  },

  deletePosting(postingId: number): Promise<ApiResponse<boolean>> {
    return this.reviewPost(postingId, 'DELETE')
  },

  getAllPosting(): Promise<ApiResponse<AdminPosting[]>> {
    return this.getPendingPosts(undefined, undefined, 1, 1000)
  },
}

export const commentAPI = {
  // 添加评论
  addComment(commentRequest: CommentRequest): Promise<ApiResponse<boolean>> {
    return unwrapData(
      apiClient.post<ApiResponse<boolean>>('/api/v2/posting/add-comment', commentRequest)
    )
  },

  // 获取评论列表
  getCommentList(postingId: number): Promise<ApiResponse<Comment[]>> {
    return unwrapData(
      apiClient.post<ApiResponse<Comment[]>>('/api/v2/posting/get-comment-list', postingId)
    )
  },

  // 删除评论
  deleteComment(commentId: number): Promise<ApiResponse<boolean>> {
    return unwrapData(
      apiClient.post<ApiResponse<boolean>>('/api/v2/posting/delete-comment', commentId)
    )
  },
}
export interface MailItem {
  id: number
  title: string
  content: string
  sender: string
  time: string
  isRead: boolean
  status: string
}

export const mailAPI = {
  getMailList(type: string): Promise<any> {
    return new Promise(resolve => {
      setTimeout(() => {
        let mockData: MailItem[] = []
        if (type === 'LIKE') {
          mockData = [
            {
              id: 1,
              title: '赞了你的视频',
              content: '《Vue 3 从入门到精通》',
              sender: 'BangBooM',
              time: '10 分钟前',
              isRead: false,
              status: 'unread',
            },
            {
              id: 2,
              title: '赞了你的专栏',
              content: '《深入理解 TypeScript 泛型》',
              sender: '小说家助手',
              time: '1 小时前',
              isRead: false,
              status: 'unread',
            },
            {
              id: 3,
              title: '赞了你的动态',
              content: '今天完成了一个大项目！',
              sender: '代码艺术家',
              time: '3 小时前',
              isRead: true,
              status: 'read',
            },
          ]
        } else if (type === 'REPLY') {
          mockData = [
            {
              id: 4,
              title: '回复了你的动态',
              content: '设定太棒了，期待后续！',
              sender: '热心读者',
              time: '刚才',
              isRead: false,
              status: 'unread',
            },
          ]
        }
        resolve({ success: true, code: '200', message: 'success', data: mockData, detail: null })
      }, 600)
    })
  },
}
export const coinAPI = {
  // 签到
  sign(): Promise<ApiResponse<boolean>> {
    return unwrapData(apiClient.post<ApiResponse<boolean>>('/api/v2/sign/check-in'))
  },

  // 获取签到状态
  getSignStatus(): Promise<ApiResponse<boolean>> {
    return unwrapData(apiClient.post<ApiResponse<boolean>>('/api/v2/sign/status'))
  },

  // 获取金币数量
  getCoinAmount(): Promise<ApiResponse<number>> {
    return unwrapData(apiClient.post<ApiResponse<number>>('/api/v2/coin/get'))
  },
}

export const columnAPI = {
  // 搜索专栏
  searchColumn(
    keyword: string,
    pageNum: number,
    pageSize: number
  ): Promise<ApiResponse<ColumnResponse[]>> {
    return unwrapData(
      apiClient.post<ApiResponse<ColumnResponse[]>>('/api/v2/column/search', {
        keyword,
        pageNum,
        pageSize,
      })
    )
  },

  // 专栏互动（点赞/投币）
  columnInteraction(columnId: number, type: 'LIKE' | 'COIN'): Promise<ApiResponse<boolean>> {
    return unwrapData(
      apiClient.post<ApiResponse<boolean>>('/api/v2/column/interaction', {
        columnId,
        type,
      })
    )
  },

  // 获取互动信息
  getColumnInteraction(columnId: number): Promise<ApiResponse<ColumnInteractionResponse>> {
    return unwrapData(
      apiClient.get<ApiResponse<ColumnInteractionResponse>>(
        `/api/v2/column/getInteraction?columnId=${columnId}`
      )
    )
  },
}

export const authAPI = {
  // 用户名密码登录
  login(username: string, password: string): Promise<ApiResponse<string>> {
    return unwrapData(
      apiClient.post<ApiResponse<string>>('/api/v1/auth/login', {
        username,
        password,
      })
    )
  },

  // 用户注册
  register(
    username: string,
    password: string,
    email: string,
    code: string
  ): Promise<ApiResponse<string>> {
    return unwrapData(
      apiClient.post<ApiResponse<string>>('/api/v1/auth/register', {
        username,
        password,
        email,
        code,
      })
    )
  },

  // 发送验证码
  sendCode(email: string): Promise<ApiResponse<boolean>> {
    return unwrapData(
      apiClient.post<ApiResponse<boolean>>(
        `/api/v1/auth/send-code?email=${encodeURIComponent(email)}`
      )
    )
  },

  // 邮箱验证码登录
  loginByEmail(email: string, code: string): Promise<ApiResponse<string>> {
    return unwrapData(
      apiClient.post<ApiResponse<string>>('/api/v1/auth/login-by-email', {
        email,
        code,
      })
    )
  },

  // 修改密码
  changePassword(
    username: string,
    password: string,
    email: string,
    code: string
  ): Promise<ApiResponse<boolean>> {
    return unwrapData(
      apiClient.post<ApiResponse<boolean>>('/api/v1/auth/change-password', {
        username,
        password,
        email,
        code,
      })
    )
  },

  // 退出登录
  logout(): Promise<ApiResponse<boolean>> {
    return unwrapData(apiClient.post<ApiResponse<boolean>>('/api/v1/auth/logout'))
  },

  // 刷新令牌
  refreshToken(refreshToken: string, userId: number): Promise<ApiResponse<string>> {
    return unwrapData(
      apiClient.post<ApiResponse<string>>(
        `/api/v1/auth/refresh-token?refreshToken=${encodeURIComponent(refreshToken)}&userId=${userId}`
      )
    )
  },
}

// =========== 新增 ChatService API ===========
export const chatServiceAPI = {
  // 获取好友列表
  getFriends(): Promise<ApiResponse<number[]>> {
    return unwrapData(apiClient.get<ApiResponse<number[]>>('/api/v2/chat/friends'))
  },

  // 创建聊天连接
  createChatConnection(toUserId: number): Promise<ApiResponse<ChatConnection>> {
    return unwrapData(
      apiClient.post<ApiResponse<ChatConnection>>('/api/v2/chat/connection/create', {
        to_user_id: toUserId,
      })
    )
  },

  // 获取聊天连接详情
  getChatConnectionDetail(connectionId: number): Promise<ApiResponse<ChatConnection>> {
    return unwrapData(
      apiClient.get<ApiResponse<ChatConnection>>(`/api/v2/chat/connection/${connectionId}`)
    )
  },

  // 获取聊天连接列表
  getChatConnections(): Promise<ApiResponse<ChatConnection[]>> {
    return unwrapData(apiClient.get<ApiResponse<ChatConnection[]>>('/api/v2/chat/connection/list'))
  },

  // 发送私聊消息
  sendPrivateMessage(connectionId: number, message: string): Promise<ApiResponse<ChatMessage>> {
    return unwrapData(
      apiClient.post<ApiResponse<ChatMessage>>('/api/v2/chat/message/send', {
        connection_id: connectionId,
        message,
      })
    )
  },

  // 接收新消息
  receiveNewMessages(
    connectionId: number,
    lastTimestamp: string
  ): Promise<ApiResponse<ChatMessage[]>> {
    return unwrapData(
      apiClient.get<ApiResponse<ChatMessage[]>>('/api/v2/chat/message/receive', {
        params: {
          connection_id: connectionId,
          last_timestamp: lastTimestamp,
        },
      })
    )
  },

  // 获取历史消息
  getPrivateMessageHistory(
    connectionId: number,
    page: number = 1
  ): Promise<ApiResponse<ChatMessage[]>> {
    return unwrapData(
      apiClient.get<ApiResponse<ChatMessage[]>>('/api/v2/chat/message/history', {
        params: {
          connection_id: connectionId,
          page,
        },
      })
    )
  },
}

export default apiClient
