import { ref } from 'vue';
import { chatAPI } from '../services/api.js';

export function useConversations() {
  const conversations = ref([]);
  const currentConversationId = ref(null);
  const isCreating = ref(false);
  const isLoading = ref(false);

  const loadConversations = async () => {
    try {
      const result = await chatAPI.getConversationList();
      if (result.success) {
        conversations.value = result.data || [];
      }
    } catch (error) {
      console.error('加载会话列表失败:', error);
    }
  };

  const createNewConversation = async () => {
    if (isCreating.value) return null;
    isCreating.value = true;
    try {
      const result = await chatAPI.createConversation();
      if (result.success) {
        const newConversation = {
          id: result.data,
          title: '新对话'
        };
        conversations.value.unshift(newConversation);
        return newConversation;
      }
    } catch (error) {
      console.error('创建会话失败:', error);
    } finally {
      isCreating.value = false;
    }
    return null;
  };

  const selectConversation = (id) => {
    currentConversationId.value = id;
  };

  const updateConversationTitle = async (conversationId, title) => {
    try {
      const result = await chatAPI.updateConversationTitle(conversationId, title);
      if (result.success) {
        const conversation = conversations.value.find(conv => conv.id === conversationId);
        if (conversation) {
          conversation.title = title;
        }
        return true;
      }
    } catch (error) {
      console.error('更新会话标题失败:', error);
    }
    return false;
  };

  const deleteConversation = async (conversationId) => {
    try {
      const result = await chatAPI.deleteConversation(conversationId);
      if (result.success) {
        const index = conversations.value.findIndex(conv => conv.id === conversationId);
        if (index !== -1) {
          conversations.value.splice(index, 1);
          if (currentConversationId.value === conversationId) {
            currentConversationId.value = conversations.value.length > 0 ? conversations.value[0].id : null;
          }
        }
        return true;
      }
    } catch (error) {
      console.error('删除会话失败:', error);
    }
    return false;
  };

  return {
    conversations,
    currentConversationId,
    isCreating,
    isLoading,
    loadConversations,
    createNewConversation,
    selectConversation,
    updateConversationTitle,
    deleteConversation
  };
}
