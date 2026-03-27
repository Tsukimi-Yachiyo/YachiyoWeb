/**
 * API 响应基础接口
 */
export interface ApiResponse<T = any> {
  success: boolean
  code: string | number
  message: string
  data: T | null
  detail: string | null
}

/**
 * 成功响应
 */
export interface ApiSuccessResponse<T = any> extends ApiResponse<T> {
  success: true
  code: '200' | string
  data: T
}

/**
 * 错误响应
 */
export interface ApiErrorResponse<T = any> extends ApiResponse<T> {
  success: false
  code: string | number
  data: T | null
}

/**
 * 聊天响应数据
 */
export interface ChatResponseData {
  text?: string
  think?: string
  motion?: string
  [key: string]: any
}

/**
 * 原始 API 响应（拦截器处理前）
 */
export interface RawApiResponse {
  code?: string
  message?: string
  data?: any
  detail?: string
}

/**
 * 用户详情
 */
export interface UserDetail {
  id?: string
  username?: string
  avatar?: string
  [key: string]: any
}

/**
 * 帖子相关类型
 */
export interface Posting {
  id: string
  title: string
  content: string
  [key: string]: any
}

/**
 * 评论相关类型
 */
export interface Comment {
  id: string
  content: string
  [key: string]: any
}

/**
 * 会话历史
 */
export interface Conversation {
  id: string | number
  title?: string
  [key: string]: any
}