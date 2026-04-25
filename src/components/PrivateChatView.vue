<script setup lang="ts">
  import { ref, computed, watch, nextTick, onMounted } from 'vue'
  import type { ChatMessage } from '../types/api'

  // 格式化时间
  const formatTime = (timeStr: string): string => {
    if (!timeStr) return ''
    try {
      const date = new Date(timeStr)
      const now = new Date()
      const diff = now.getTime() - date.getTime()

      // 今天
      if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      }
      // 昨天
      const yesterday = new Date(now)
      yesterday.setDate(now.getDate() - 1)
      if (diff < 48 * 60 * 60 * 1000 && date.getDate() === yesterday.getDate()) {
        return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
      }
      // 本周
      if (diff < 7 * 24 * 60 * 60 * 1000) {
        const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        return `${weekDays[date.getDay()]} ${date.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        })}`
      }
      // 更早
      return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return timeStr
    }
  }

  // 定义props
  const props = defineProps<{
    messages: ChatMessage[]
    isSending: boolean
    wsConnected: boolean
    currentUserName?: string
    targetUserName?: string
  }>()

  // 定义emit
  const emit = defineEmits<{
    sendMessage: [message: string]
  }>()

  // 状态
  const inputMessage = ref('')
  const messageListRef = ref<HTMLElement | null>(null)

  // 当前用户ID（从token获取）
  const currentUserId = computed(() => {
    const token = localStorage.getItem('token')
    if (!token) return null
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
  })

  // 滚动到底部
  const scrollToBottom = () => {
    nextTick(() => {
      if (messageListRef.value) {
        messageListRef.value.scrollTop = messageListRef.value.scrollHeight
      }
    })
  }

  // 监听消息变化，自动滚动
  watch(
    () => props.messages.length,
    () => {
      scrollToBottom()
    }
  )

  onMounted(() => {
    scrollToBottom()
  })

  // 发送消息
  const handleSend = () => {
    if (!inputMessage.value.trim() || props.isSending) return
    emit('sendMessage', inputMessage.value.trim())
    inputMessage.value = ''
  }

  // 回车发送
  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
</script>

<template>
  <div class="private-chat-view">
    <!-- 消息列表 -->
    <div ref="messageListRef" class="message-list">
      <div v-for="msg in messages" :key="msg.id" class="message-wrapper">
        <div :class="['message', msg.user_id === currentUserId ? 'own' : 'other']">
          <div v-if="msg.user_id !== currentUserId" class="message-avatar">
            {{ targetUserName?.charAt(0) || '?' }}
          </div>
          <div class="message-content">
            <div v-if="msg.user_id !== currentUserId" class="message-sender">
              {{ msg.user_name }}
            </div>
            <div class="message-bubble">{{ msg.message }}</div>
            <div class="message-time">{{ formatTime(msg.create_time) }}</div>
          </div>
        </div>
      </div>
      <div v-if="messages.length === 0" class="empty-hint">开始和好友聊天吧~</div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <div class="input-wrapper">
        <input
          v-model="inputMessage"
          type="text"
          placeholder="输入消息..."
          :disabled="isSending"
          @keydown="handleKeyDown"
        />
        <button class="send-btn" :disabled="!inputMessage.trim() || isSending" @click="handleSend">
          <span v-if="isSending" class="loading-spinner"></span>
          <span v-else>发送</span>
        </button>
      </div>
      <div v-if="wsConnected" class="connection-status connected">连接正常</div>
      <div v-else class="connection-status">连接中...</div>
    </div>
  </div>
</template>

<style scoped>
  .private-chat-view {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: transparent;
    position: relative;
    z-index: 10;
  }

  /* 消息列表 */
  .message-list {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .message-wrapper {
    width: 100%;
  }

  .message {
    display: flex;
    gap: 12px;
    max-width: 70%;
  }

  .message.own {
    margin-left: auto;
    flex-direction: row-reverse;
  }

  .message.other {
    margin-right: auto;
  }

  .message-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 14px;
    flex-shrink: 0;
  }

  .message-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .message-sender {
    color: rgba(255, 255, 255, 0.6);
    font-size: 12px;
    margin-left: 4px;
  }

  .message-bubble {
    padding: 10px 14px;
    border-radius: 16px;
    font-size: 14px;
    line-height: 1.5;
    word-break: break-word;
  }

  .message.own .message-bubble {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-bottom-right-radius: 4px;
  }

  .message.other .message-bubble {
    background: rgba(255, 255, 255, 0.15);
    color: white;
    border-bottom-left-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .message-time {
    color: rgba(255, 255, 255, 0.4);
    font-size: 11px;
    margin: 0 4px;
  }

  .message.own .message-time {
    text-align: right;
  }

  .empty-hint {
    margin: auto;
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
    text-align: center;
    padding: 40px 20px;
  }

  /* 输入区域 */
  .input-area {
    padding: 16px 20px 24px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.3), transparent);
  }

  .input-wrapper {
    display: flex;
    gap: 12px;
    max-width: 800px;
    margin: 0 auto;
    align-items: center;
  }

  .input-wrapper input {
    flex: 1;
    padding: 12px 18px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 24px;
    color: white;
    font-size: 14px;
    outline: none;
    transition: all 0.3s ease;
    backdrop-filter: blur(5px);
  }

  .input-wrapper input::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  .input-wrapper input:focus {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(102, 126, 234, 0.6);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
  }

  .input-wrapper input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .send-btn {
    padding: 12px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 24px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 80px;
  }

  .send-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  }

  .send-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .connection-status {
    text-align: center;
    margin-top: 8px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
  }

  .connection-status.connected {
    color: #4caf50;
  }

  /* 滚动条 */
  .message-list::-webkit-scrollbar {
    width: 6px;
  }

  .message-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .message-list::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  .message-list::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
</style>
