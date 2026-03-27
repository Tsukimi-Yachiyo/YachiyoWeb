import { ref, nextTick, watch } from 'vue'
import { chatAPI } from '../services/api'

export function useMessages(conversationId) {
  const messages = ref([])
  const inputMessage = ref('')
  const isLoading = ref(false)
  const isTyping = ref(false)
  const messageListRef = ref(null)
  const inputRef = ref(null)
  const abortController = ref(null)

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

  const loadMessages = async id => {
    if (!id) return
    stopStreaming()
    messages.value = []
    try {
      const result = await chatAPI.getHistory(id)
      if (result.success && Array.isArray(result.data)) {
        messages.value = result.data.flatMap(item => [
          { type: 'user', content: item.user, isStreaming: false },
          { type: 'assistant', content: item.assistant, isStreaming: false },
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

  const sendMessage = () => {
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

    chatAPI
      .chat(message, conversationId.value, abortController.value.signal)
      .then(result => {
        if (import.meta.env.DEV) console.log('聊天响应结果:', result)
        if (messages.value[assistantMessageIndex]) {
          // 拦截器返回的格式: { success, code, message, data, detail }
          // 其中 data 字段包含 AI 回复，API层已确保包含 text 字段
          const responseData = result.data // 这是拦截器返回的 data 字段
          if (import.meta.env.DEV) console.log('响应数据:', responseData)

          let assistantText = ''
          if (responseData) {
            // 优先使用 text 字段，如果不存在则使用字符串表示
            if (responseData.text !== undefined) {
              assistantText = responseData.text
            } else if (typeof responseData === 'string') {
              assistantText = responseData
            } else {
              assistantText = JSON.stringify(responseData)
            }
          }

          if (import.meta.env.DEV) console.log('提取的文本:', assistantText)
          messages.value[assistantMessageIndex].content = assistantText
          messages.value[assistantMessageIndex].isStreaming = false
        }
        isLoading.value = false
        isTyping.value = false
        abortController.value = null
      })
      .catch(error => {
        if (import.meta.env.DEV) console.error('聊天请求错误:', error)
        if (messages.value[assistantMessageIndex]) {
          messages.value[assistantMessageIndex].content =
            `抱歉，发生了错误: ${error.message || '未知错误'}`
          messages.value[assistantMessageIndex].isStreaming = false
        }
        isLoading.value = false
        isTyping.value = false
        abortController.value = null
      })
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
