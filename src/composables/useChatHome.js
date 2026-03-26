import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from './useAuth.js'
import { useConversations } from './useConversations.js'
import { useMessages } from './useMessages.js'
import { useVoice } from './useVoice.js'
import { useSidebar } from './useSidebar.js'
import { useUserProfile } from './useUserProfile.js'
import { useModelLoading } from './useModelLoading.js'

export function useChatHome() {
  const router = useRouter()
  const { token, logout } = useAuth()
  const {
    conversations,
    currentConversationId,
    isCreating,
    loadConversations,
    createNewConversation,
    selectConversation: selectConv,
    updateConversationTitle,
    deleteConversation,
  } = useConversations()
  const {
    messages,
    inputMessage,
    isLoading,
    isTyping,
    messageListRef,
    inputRef,
    loadMessages,
    sendMessage,
    stopStreaming,
  } = useMessages(currentConversationId)
  const { isVoiceClickable, getVoiceStatus, playVoice } = useVoice()
  const { isSidebarOpen, sidebarRef, toggleSidebar, closeSidebar, onTouchStart, onTouchEnd } =
    useSidebar()
  const { username, userAvatar, loadUserDetail } = useUserProfile()
  const { isLoading: isModelLoading, loadProgress, loadStatus } = useModelLoading()

  onMounted(() => {
    if (!token.value) {
      router.push('/')
      return
    }
    loadConversations()
    loadUserDetail()
  })

  watch(currentConversationId, newId => {
    if (newId) {
      loadMessages(newId)
    }
  })

  const selectConversation = async conversation => {
    stopStreaming()
    selectConv(conversation.id)
  }

  const handleCreateConversation = async () => {
    const newConversation = await createNewConversation()
    if (newConversation) {
      await selectConversation(newConversation)
    }
  }

  return {
    username,
    userAvatar,
    conversations,
    currentConversationId,
    messages,
    inputMessage,
    isLoading,
    isTyping,
    isCreating,
    messageListRef,
    inputRef,
    isSidebarOpen,
    sidebarRef,
    isVoiceClickable,
    getVoiceStatus,
    toggleSidebar,
    closeSidebar,
    onTouchStart,
    onTouchEnd,
    selectConversation,
    createNewConversation: handleCreateConversation,
    updateConversationTitle,
    deleteConversation,
    sendMessage,
    playVoice,
    logout,
    isModelLoading,
    loadProgress,
    loadStatus,
  }
}
