import { ref, computed } from 'vue'
import { chatServiceAPI, userAPI } from '../services/api'
import type { ChatConnection, ChatMessage, ChatSession, PosterDetailResponse } from '../types/api'

interface ChatConnectionWithUser extends ChatConnection {
  chatPartnerId?: number
}

export function usePrivateChat() {
  const chatConnections = ref<ChatConnectionWithUser[]>([])
  const currentConnectionId = ref<number | null>(null)
  const messages = ref<ChatMessage[]>([])
  const isLoading = ref(false)
  const isSending = ref(false)
  const error = ref<string | null>(null)
  const wsConnected = ref(false)
  let ws: WebSocket | null = null
  const userInfoCache = new Map<number, PosterDetailResponse>()

  const currentConnection = computed(() => {
    return chatConnections.value.find(conn => conn.connection_id === currentConnectionId.value)
  })

  const currentChatPartnerInfo = computed(() => {
    if (!currentConnection.value?.chatPartnerId) return null
    return userInfoCache.get(currentConnection.value.chatPartnerId) || null
  })

  const chatSessions = computed<ChatSession[]>(() => {
    console.log('📋 Computing chat sessions! chatConnections count:', chatConnections.value.length)
    return chatConnections.value.map(conn => {
      const lastMsg = conn.message_list?.[conn.message_list.length - 1]
      const userInfo = conn.chatPartnerId ? userInfoCache.get(conn.chatPartnerId) : undefined
      const sessionData = {
        id: conn.connection_id,
        type: 'user',
        name: userInfo?.userName || '用户',
        avatar: userInfo?.userAvatar || '',
        lastMessage: lastMsg?.message || '',
        lastMessageTime: lastMsg?.create_time || '',
        connectionId: conn.connection_id,
        userId: conn.chatPartnerId,
      }
      console.log('📋 Session data:', sessionData)
      return sessionData
    })
  })

  const fetchUserInfo = async (userId: number): Promise<PosterDetailResponse | null> => {
    console.log('🚀 Fetching user info for userId:', userId)
    if (userInfoCache.has(userId)) {
      console.log('📦 User info found in cache for userId:', userId)
      console.log('📦 Cached data:', userInfoCache.get(userId))
      return userInfoCache.get(userId)!
    }
    try {
      const res = await userAPI.getPosterDetail(userId)
      console.log('📡 getPosterDetail full response:', res)
      console.log('📡 getPosterDetail response.success:', res.success)
      console.log('📡 getPosterDetail response.data:', res.data)
      if (res.success && res.data) {
        userInfoCache.set(userId, res.data)
        console.log('✅ User info cached:', res.data)
        console.log('✅ Cached userName:', res.data.userName)
        console.log('✅ Cached userAvatar:', res.data.userAvatar)
        return res.data
      }
    } catch (err) {
      console.error('❌ Failed to fetch user info:', err)
    }
    return null
  }

  const loadChatConnections = async () => {
    isLoading.value = true
    error.value = null
    try {
      console.log('Calling getChatConnections')
      const res = await chatServiceAPI.getChatConnections()
      console.log('getChatConnections response:', res)
      if (res.success && res.data) {
        const connectionsWithUser = res.data.map(conn => {
          let chatPartnerId: number | undefined
          // 严格按照要求：获取判断 first_user_id或者second_user_id不为-1，将其作为聊天对象的id
          if (conn.first_user_id !== -1) {
            chatPartnerId = conn.first_user_id
          } else if (conn.second_user_id !== -1) {
            chatPartnerId = conn.second_user_id
          }
          console.log('Connection:', conn.connection_id, 'Chat partner ID:', chatPartnerId)
          return {
            ...conn,
            chatPartnerId,
          }
        })

        chatConnections.value = connectionsWithUser

        const userIdsToFetch = connectionsWithUser
          .map(conn => conn.chatPartnerId)
          .filter((id): id is number => id !== undefined && !userInfoCache.has(id))
        console.log('User IDs to fetch:', userIdsToFetch)

        await Promise.all(
          userIdsToFetch.map(async id => {
            await fetchUserInfo(id)
          })
        )

        // 强制重新触发响应式更新，让 chatSessions 重新计算
        chatConnections.value = [...chatConnections.value]
      }
    } catch (err: any) {
      console.error('Failed to load chat connections:', err)
      error.value = err.message || 'Failed to load'
    } finally {
      isLoading.value = false
    }
  }

  const selectChatConnection = async (connectionId: number) => {
    currentConnectionId.value = connectionId
    await loadMessageHistory(connectionId)
    connectWebSocket(connectionId)
  }

  const loadMessageHistory = async (connectionId: number) => {
    try {
      const res = await chatServiceAPI.getPrivateMessageHistory(connectionId)
      if (res.success && res.data) {
        messages.value = res.data
      }
    } catch (err) {
      console.error('Failed to load message history:', err)
    }
  }

  const sendMessage = async (message: string) => {
    if (!currentConnectionId.value || !message.trim()) return

    isSending.value = true
    try {
      const res = await chatServiceAPI.sendPrivateMessage(currentConnectionId.value, message)
      if (res.success && res.data) {
        messages.value.push(res.data)
      }
    } catch (err: any) {
      console.error('Failed to send message:', err)
      if (err.code === 1002) {
        error.value = '需要先与对方互相关注才能聊天'
      }
      throw err
    } finally {
      isSending.value = false
    }
  }

  const createChatConnection = async (toUserId: number) => {
    try {
      const res = await chatServiceAPI.createChatConnection(toUserId)
      if (res.success && res.data) {
        chatConnections.value.unshift(res.data)
        return res.data
      }
    } catch (err: any) {
      console.error('Failed to create chat connection:', err)
      if (err.code === 1002) {
        throw new Error('需要先与对方互相关注才能聊天')
      }
      throw err
    }
    return null
  }

  const connectWebSocket = (connectionId: number) => {
    disconnectWebSocket()

    // WebSocket URL 不需要 userId，因为连接已经包含认证信息
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${
      window.location.host
    }/ws/chat/${connectionId}`

    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      wsConnected.value = true
      console.log('WebSocket connected')
      startHeartbeat()
    }

    ws.onmessage = event => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'message' && data.id) {
          messages.value.push(data)
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e)
      }
    }

    ws.onclose = () => {
      wsConnected.value = false
      console.log('WebSocket disconnected')
    }

    ws.onerror = err => {
      console.error('WebSocket error:', err)
    }
  }

  const disconnectWebSocket = () => {
    if (ws) {
      ws.close()
      ws = null
    }
    wsConnected.value = false
  }

  let heartbeatInterval: ReturnType<typeof setInterval> | null = null
  const startHeartbeat = () => {
    stopHeartbeat()
    heartbeatInterval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'heartbeat',
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

  return {
    chatConnections,
    currentConnectionId,
    currentConnection,
    currentChatPartnerInfo,
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
    fetchUserInfo,
    userInfoCache,
  }
}
