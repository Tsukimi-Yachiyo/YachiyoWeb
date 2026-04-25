import { ref, computed } from 'vue'
import { chatServiceAPI, userAPI } from '../services/api'
import type { ChatConnection, ChatMessage, ChatSession } from '../types/api'

export function usePrivateChat() {
  // 状态
  const chatConnections = ref<ChatConnection[]>([])
  const currentConnectionId = ref<number | null>(null)
  const messages = ref<ChatMessage[]>([])
  const isLoading = ref(false)
  const isSending = ref(false)
  const error = ref<string | null>(null)
  const wsConnected = ref(false)
  let ws: WebSocket | null = null

  // 当前聊天连接
  const currentConnection = computed(() => {
    return chatConnections.value.find(conn => conn.connection_id === currentConnectionId.value)
  })

  // 获取聊天会话列表（用于UI展示）
  const chatSessions = computed<ChatSession[]>(() => {
    return chatConnections.value.map(conn => {
      const lastMsg = conn.message_list?.[conn.message_list.length - 1]
      return {
        id: conn.connection_id,
        type: 'user',
        name: '用户', // 这里需要根据对方ID获取用户名
        avatar: '', // 这里需要根据对方ID获取头像
        lastMessage: lastMsg?.message || '',
        lastMessageTime: lastMsg?.create_time || '',
        connectionId: conn.connection_id,
      }
    })
  })

  // 加载聊天连接列表
  const loadChatConnections = async () => {
    isLoading.value = true
    error.value = null
    try {
      const res = await chatServiceAPI.getChatConnections()
      if (res.success && res.data) {
        chatConnections.value = res.data
      }
    } catch (err: any) {
      console.error('加载聊天连接列表失败:', err)
      error.value = err.message || '加载失败'
    } finally {
      isLoading.value = false
    }
  }

  // 选择聊天连接
  const selectChatConnection = async (connectionId: number) => {
    currentConnectionId.value = connectionId
    await loadMessageHistory(connectionId)
    connectWebSocket(connectionId)
  }

  // 加载历史消息
  const loadMessageHistory = async (connectionId: number) => {
    try {
      const res = await chatServiceAPI.getPrivateMessageHistory(connectionId)
      if (res.success && res.data) {
        messages.value = res.data
      }
    } catch (err: any) {
      console.error('加载历史消息失败:', err)
    }
  }

  // 发送消息
  const sendMessage = async (message: string) => {
    if (!currentConnectionId.value || !message.trim()) return

    isSending.value = true
    try {
      const res = await chatServiceAPI.sendPrivateMessage(currentConnectionId.value, message)
      if (res.success && res.data) {
        messages.value.push(res.data)
      }
    } catch (err: any) {
      console.error('发送消息失败:', err)
      // 检查是否是1002错误（非好友）
      if (err.code === 1002) {
        error.value = '需要先与对方互相关注才能聊天'
      }
      throw err
    } finally {
      isSending.value = false
    }
  }

  // 创建聊天连接
  const createChatConnection = async (toUserId: number) => {
    try {
      const res = await chatServiceAPI.createChatConnection(toUserId)
      if (res.success && res.data) {
        chatConnections.value.unshift(res.data)
        return res.data
      }
    } catch (err: any) {
      console.error('创建聊天连接失败:', err)
      if (err.code === 1002) {
        throw new Error('需要先与对方互相关注才能聊天')
      }
      throw err
    }
    return null
  }

  // 连接WebSocket
  const connectWebSocket = (connectionId: number) => {
    // 关闭之前的连接
    disconnectWebSocket()

    const token = localStorage.getItem('token')
    const userId = getUserIdFromToken(token || '')
    if (!userId) return

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${
      window.location.host
    }/ws/chat/${connectionId}?user_id=${userId}`

    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      wsConnected.value = true
      console.log('WebSocket连接成功')
      // 启动心跳
      startHeartbeat()
    }

    ws.onmessage = event => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'message' && data.id) {
          messages.value.push(data)
        } else if (data.type === 'heartbeat_ack') {
          // 心跳响应，无需处理
        }
      } catch (e) {
        console.error('解析WebSocket消息失败:', e)
      }
    }

    ws.onclose = () => {
      wsConnected.value = false
      console.log('WebSocket连接关闭')
    }

    ws.onerror = err => {
      console.error('WebSocket错误:', err)
    }
  }

  // 断开WebSocket连接
  const disconnectWebSocket = () => {
    if (ws) {
      ws.close()
      ws = null
    }
    wsConnected.value = false
  }

  // 心跳
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null
  const startHeartbeat = () => {
    stopHeartbeat()
    heartbeatInterval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        const token = localStorage.getItem('token')
        const userId = getUserIdFromToken(token || '')
        ws.send(
          JSON.stringify({
            type: 'heartbeat',
            user_id: userId,
          })
        )
      }
    }, 30000)
  }

  const stopHeartbeat = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }
  }

  // 简单的JWT解析获取userId
  const getUserIdFromToken = (token: string): number | null => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join('')
      )
      const payload = JSON.parse(jsonPayload)
      return payload.userId || payload.id || null
    } catch {
      return null
    }
  }

  return {
    chatConnections,
    currentConnectionId,
    currentConnection,
    chatSessions,
    messages,
    isLoading,
    isSending,
    error,
    wsConnected,
    loadChatConnections,
    selectChatConnection,
    sendMessage,
    createChatConnection,
    loadMessageHistory,
    connectWebSocket,
    disconnectWebSocket,
  }
}
