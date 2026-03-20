<script setup>
import { ref, computed } from 'vue';
import { useChatHome } from '../../composables/useChatHome.js';
import { useIconManager } from '../../composables/useIconManager.js';
import AppHeader from '../../components/AppHeader/AppHeader.vue';
import Live2DModel from '../../components/Live2DModel/Live2DModel.vue';

// 初始化图标管理器
const { checkIconCache } = useIconManager();

// 计算属性，用于获取图标数据URL
const editIconUrl = computed(() => {
  const iconData = checkIconCache('edit.svg');
  return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : '';
});

const deleteIconUrl = computed(() => {
  const iconData = checkIconCache('trash.svg');
  return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : '';
});

const voiceIconUrl = computed(() => {
  const iconData = checkIconCache('volume-up.svg');
  return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : '';
});

const userProfileIsVisible = ref(false);
const hoveredConversationId = ref(null);
const longPressedConversationId = ref(null);
const editModeConversationId = ref(null);
const editTitle = ref('');

const {
  username,
  userAvatar,
  conversations,
  currentConversationId,
  messages,
  inputMessage,
  isLoading: isChatLoading,
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
  createNewConversation,
  updateConversationTitle,
  deleteConversation,
  sendMessage,
  playVoice,
  logout,
  isModelLoading,
  loadProgress,
  loadStatus
} = useChatHome();

const handleMouseEnter = (conversationId) => {
  hoveredConversationId.value = conversationId;
};

const handleMouseLeave = () => {
  hoveredConversationId.value = null;
};

const handleLongPress = (conversationId) => {
  longPressedConversationId.value = conversationId;
};

const handleLongPressEnd = () => {
  longPressedConversationId.value = null;
};

const startEditTitle = (conversation) => {
  editModeConversationId.value = conversation.id;
  editTitle.value = conversation.title || `对话 ${conversation.id}`;
};

const cancelEditTitle = () => {
  editModeConversationId.value = null;
};

const handleDeleteConversation = async (conversationId, event) => {
  event.stopPropagation();
  if (confirm('确定要删除这个会话吗？')) {
    await deleteConversation(conversationId);
  }
};
</script>

<template src="./templates/ChatHome.html"></template>

<style scoped src="./styles/ChatHome.css"></style>