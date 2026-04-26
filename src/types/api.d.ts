/* eslint-disable @typescript-eslint/no-explicit-any */

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
export interface UserDetailResponse {
  userName?: string
  userIntroduction?: string
  userCity?: string
  userGender?: string
  userPhone?: string
  userBirthday?: string
  [key: string]: any
}

/**
 * 帖子简要信息
 */
export interface PostEncapsulateResponse {
  title: string
  posterId: number
  coverImage: string
  [key: string]: any
}

/**
 * 帖子详情
 */
export interface GetPostingResponse {
  content: string
  filenames: string[]
  files: string[]
  [key: string]: any
}

/**
 * 评论
 */
export interface Comment {
  id: number
  userId: number
  postingId: number
  content: string
  [key: string]: any
}

/**
 * 评论请求
 */
export interface CommentRequest {
  postingId: number
  content: string
}

/**
 * 发帖者详情
 */
export interface PosterDetailResponse {
  userName: string
  userAvatar: string
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
 * 管理端帖子信息
 */
export interface AdminPosting {
  id: number
  userId?: number
  title?: string
  content?: string
  type?: string
  isApproved?: boolean | null
  [key: string]: any
}

/**
 * 帖子互动请求
 */
export interface InteractionRequest {
  postingId: number
  type: 'LIKE' | 'COLLECTION'
  action: 'ADD' | 'REMOVE' | 'TOGGLE'
}

/**
 * 帖子统计响应
 */
export interface PostStatsResponse {
  likeCount: number
  collectionCount: number
  readingCount: number
  coinCount: number
  liked: boolean
  collected: boolean
}

/**
 * 会话历史
 */
export interface Conversation {
  id: string | number
  title?: string
  [key: string]: any
}

/**
 * 用户自己的帖子响应
 */
export interface SelfPostResponse {
  postingId: number
  approved?: boolean | null
  [key: string]: any
}

/**
 * 专栏类型枚举
 */
export type ColumnType = 'SIMPLE' | 'NOVEL' | 'ACTIVITY'

/**
 * 专栏信息
 */
export interface ColumnResponse {
  id: number
  name: string
  description: string
  type: ColumnType
  writer: number
  essayUrl: string
  createTime: string
  [key: string]: any
}

/**
 * 专栏互动信息
 */
export interface ColumnInteractionResponse {
  coin: number
  like: number
  [key: string]: any
}

/**
 * 专栏互动请求
 */
export interface ColumnInteractionRequest {
  columnId: number
  type: 'LIKE' | 'COIN'
}

/**
 * 用户公开详情
 */
export interface UserPublicDetailResponse {
  userIntroduction?: string
  userCity?: string
  userGender?: string
  [key: string]: any
}

/**
 * 搜索用户结果
 */
export interface SearchUserItem {
  id?: number
  userId?: number
  userName: string
  userAvatar: string
  followerCount: number
  isFollowing: boolean
  isFollowed: boolean
  [key: string]: any
}

/**
 * 用户粉丝/关注列表
 */
export interface UserRelationListResponse {
  id: number
  userName: string
  userAvatar: string
  [key: string]: any
}

/**
 * 用户互动详情
 */
export interface SearchDetailResponse {
  userName: string
  userAvatar: string
  followerCount: number
  followeeCount: number
  isFollowing: boolean
  isFollowed: boolean
  [key: string]: any
}

// =========== 新增 ChatService 相关类型 ===========

/**
 * 聊天连接类型
 */
export interface ChatConnection {
  connection_id: number
  first_user_id: number
  second_user_id: number
  message_list: ChatMessage[]
}

/**
 * 聊天消息类型
 */
export interface ChatMessage {
  id: number
  connection_id: number
  user_id: number
  user_name: string
  message: string
  create_time: string
}

/**
 * 创建聊天连接请求
 */
export interface CreateChatConnectionRequest {
  to_user_id: number
}

/**
 * 发送私聊消息请求
 */
export interface SendPrivateMessageRequest {
  connection_id: number
  message: string
}

/**
 * 通用会话类型
 */
export type ChatSessionType = 'ai' | 'user'

export interface ChatSession {
  id: string | number
  type: ChatSessionType
  name?: string
  avatar?: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
  // AI会话特有字段
  aiConversationId?: string
  // 用户会话特有字段
  userId?: number
  connectionId?: number
}
