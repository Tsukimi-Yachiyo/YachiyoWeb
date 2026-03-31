import { ref, nextTick, watch } from 'vue'
import { chatAPI } from '../services/api'
import { extractAssistantText } from '../utils/extractAssistantText'

interface ChatMessage {
  type: 'user' | 'assistant'
  content: string
  isStreaming: boolean
}

export function useMessages(conversationId) {
  const messages = ref<ChatMessage[]>([])
  const inputMessage = ref('')
  const isLoading = ref(false)
  const isTyping = ref(false)
  const messageListRef = ref<HTMLElement | null>(null)
  const inputRef = ref<HTMLInputElement | null>(null)
  const abortController = ref<AbortController | null>(null)

  const normalizeMessageContent = (value: unknown): string => {
    if (value == null) return ''
    if (typeof value === 'string' || typeof value === 'object') {
      return extractAssistantText(value)
    }
    return String(value)
  }

  const setAssistantMessage = (index: number, content: string) => {
    if (!messages.value[index]) return
    messages.value[index].content = content
    messages.value[index].isStreaming = false
  }

  watch(
    messages,
    () => {
      scrollToBottom()
    },
    { deep: true }
  )

  const scrollToBottom = () => {
    nextTick(() => {
      if (messageListRef.value) {
        messageListRef.value.scrollTop = messageListRef.value.scrollHeight
      }
    })
  }

  const loadMessages = async (id: string | number | null) => {
    if (!id) return
    stopStreaming()
    messages.value = []
    try {
      const result = await chatAPI.getHistory(id)
      if (result.success && Array.isArray(result.data)) {
        messages.value = result.data.flatMap((item: { user?: unknown; assistant?: unknown }) => [
          { type: 'user', content: normalizeMessageContent(item.user), isStreaming: false },
          {
            type: 'assistant',
            content: normalizeMessageContent(item.assistant),
            isStreaming: false,
          },
        ])
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('加载历史记录失败:', error)
    }
    nextTick(() => {
      inputRef.value?.focus()
    })
  }

  const stopStreaming = () => {
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
    }
  }

  const sendMessage = async () => {
    const message = inputMessage.value.trim()
    if (!message || isLoading.value || !conversationId.value) return

    stopStreaming()
    messages.value.push({ type: 'user', content: message, isStreaming: false })
    inputMessage.value = ''
    isLoading.value = true
    isTyping.value = true

    const assistantMessageIndex = messages.value.length
    messages.value.push({ type: 'assistant', content: '', isStreaming: true })

    abortController.value = new AbortController()

    try {
      const result = await chatAPI.chat(message, conversationId.value, abortController.value.signal)
      if (import.meta.env.DEV) console.log('聊天响应结果:', result)
      setAssistantMessage(assistantMessageIndex, normalizeMessageContent(result.data))
    } catch (error) {
      if (import.meta.env.DEV) console.error('聊天请求错误:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      setAssistantMessage(assistantMessageIndex, `抱歉，发生了错误: ${errorMessage}`)
    } finally {
      isLoading.value = false
      isTyping.value = false
      abortController.value = null
    }
  }

  return {
    messages,
    inputMessage,
    isLoading,
    isTyping,
    messageListRef,
    inputRef,
    loadMessages,
    sendMessage,
    scrollToBottom,
    stopStreaming,
  }
}
