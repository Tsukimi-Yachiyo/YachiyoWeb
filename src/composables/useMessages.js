import { ref, nextTick, watch } from 'vue';
import { chatAPI } from '../services/api.js';

export function useMessages(conversationId) {
  const messages = ref([]);
  const inputMessage = ref('');
  const isLoading = ref(false);
  const isTyping = ref(false);
  const messageListRef = ref(null);
  const inputRef = ref(null);
  const abortController = ref(null);

  watch(messages, () => {
    scrollToBottom();
  }, { deep: true });

  const scrollToBottom = () => {
    nextTick(() => {
      if (messageListRef.value) {
        messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
      }
    });
  };

  const loadMessages = async (id) => {
    if (!id) return;
    stopStreaming();
    messages.value = [];
    try {
      const result = await chatAPI.getHistory(id);
      if (result.success && Array.isArray(result.data)) {
        messages.value = result.data.flatMap(item => [
          { type: 'user', content: item.user, isStreaming: false },
          { type: 'assistant', content: item.assistant, isStreaming: false }
        ]);
      }
    } catch (error) {
      console.error('加载历史记录失败:', error);
    }
    nextTick(() => {
      inputRef.value?.focus();
    });
  };

  const stopStreaming = () => {
    if (abortController.value) {
      abortController.value.abort();
      abortController.value = null;
    }
  };

  const sendMessage = () => {
    const message = inputMessage.value.trim();
    if (!message || isLoading.value || !conversationId.value) return;

    stopStreaming();
    messages.value.push({ type: 'user', content: message, isStreaming: false });
    inputMessage.value = '';
    isLoading.value = true;
    isTyping.value = true;

    const assistantMessageIndex = messages.value.length;
    messages.value.push({ type: 'assistant', content: '', isStreaming: true });

    abortController.value = new AbortController();

    chatAPI.streamChat(
      message,
      conversationId.value,
      (data) => {
        if (messages.value[assistantMessageIndex]) {
          messages.value[assistantMessageIndex].content += data;
        }
      },
      () => {
        if (messages.value[assistantMessageIndex]) {
          messages.value[assistantMessageIndex].isStreaming = false;
        }
        isLoading.value = false;
        isTyping.value = false;
        abortController.value = null;
      },
      (error) => {
        console.error('SSE 连接错误:', error);
        if (messages.value[assistantMessageIndex]) {
          messages.value[assistantMessageIndex].content = '抱歉，发生了错误: ' + (error.message || '未知错误');
          messages.value[assistantMessageIndex].isStreaming = false;
        }
        isLoading.value = false;
        isTyping.value = false;
        abortController.value = null;
      },
      abortController.value.signal
    );
  };

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
    stopStreaming
  };
}
