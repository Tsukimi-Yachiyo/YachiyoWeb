<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import UserAvatar from './UserAvatar.vue'
  import type { ChatSession, ChatSessionType } from '../types/api'

  const router = useRouter()

  // 定义props
  const props = defineProps<{
    aiSessions: ChatSession[]
    userSessions: ChatSession[]
    currentSessionId: string | number | null
    currentSessionType: ChatSessionType
  }>()

  // 定义emit
  const emit = defineEmits<{
    selectSession: [session: ChatSession]
    openNewChat: []
  }>()

  // 状态
  const isPanelOpen = ref(false)
  const showMore = ref(false)

  // 合并所有会话
  const allSessions = computed(() => [...props.aiSessions, ...props.userSessions])

  // 当前聊天对象显示
  const currentSession = computed(() => {
    if (props.currentSessionType === 'ai') {
      return (
        props.aiSessions.find(s => s.id === props.currentSessionId) || {
          id: 'ai-default',
          type: 'ai',
          name: '八千代',
          avatar: '',
        }
      )
    } else {
      return props.userSessions.find(s => s.id === props.currentSessionId)
    }
  })

  // 显示的会话列表（限制为10个，或者显示更多）
  const displaySessions = computed(() => {
    if (showMore.value) return allSessions.value
    return allSessions.value.slice(0, 10)
  })

  // 是否需要显示"查看更多"
  const needShowMore = computed(() => allSessions.value.length > 10)

  // 切换面板展开/收起
  const togglePanel = () => {
    isPanelOpen.value = !isPanelOpen.value
    if (!isPanelOpen.value) {
      showMore.value = false
    }
  }

  // 选择会话
  const handleSelectSession = (session: ChatSession) => {
    emit('selectSession', session)
    isPanelOpen.value = false
    showMore.value = false
  }

  // 跳转到用户主页
  const handleGoToUserProfile = (session: ChatSession, event: MouseEvent) => {
    event.stopPropagation()
    if (session.type === 'user' && session.userId) {
      router.push({ name: 'UserProfile', params: { user_id: session.userId } })
    }
  }
</script>

<template>
  <div class="chat-session-panel">
    <!-- 当前聊天对象 (常驻) -->
    <div class="current-session" @click="togglePanel">
      <div
        class="session-avatar"
        :style="{ cursor: currentSessionType === 'user' ? 'pointer' : 'default' }"
        @click.stop="
          currentSessionType === 'user' && currentSession?.userId
            ? handleGoToUserProfile(currentSession, $event)
            : void 0
        "
      >
        <UserAvatar
          v-if="currentSessionType === 'user' && currentSession?.userId"
          :user-id="currentSession.userId"
          :avatar-url="currentSession.avatar"
          :username="currentSession.name"
          :size="44"
          :clickable="false"
        />
        <span v-else>{{
          currentSessionType === 'ai' ? 'AI' : currentSession?.name?.charAt(0)
        }}</span>
      </div>
      <div class="session-info">
        <div class="session-name">
          {{ currentSessionType === 'ai' ? '八千代' : currentSession?.name }}
        </div>
        <div class="session-status">
          <span class="status-dot online"></span>
          <span>{{ currentSession?.lastMessage || '暂无消息' }}</span>
        </div>
      </div>
      <div class="toggle-icon" :class="{ rotated: isPanelOpen }">
        {{ isPanelOpen ? '▼' : '▲' }}
      </div>
    </div>

    <!-- 会话列表面板 -->
    <transition name="slide-up">
      <div v-if="isPanelOpen" class="session-list-panel">
        <!-- 头像网格 - 保持纵向排列但用圆形无边框 -->
        <div class="avatar-grid">
          <!-- 新建聊天按钮 -->
          <div class="avatar-item new-chat" title="新建聊天" @click="emit('openNewChat')">
            <span class="plus-icon">+</span>
          </div>

          <!-- 会话头像 -->
          <div
            v-for="session in displaySessions"
            :key="session.id"
            :class="[
              'avatar-item',
              {
                active: session.type === currentSessionType && session.id === currentSessionId,
                ai: session.type === 'ai',
              },
            ]"
            :title="session.name"
            @click="handleSelectSession(session)"
          >
            <div v-if="session.type === 'user'" class="avatar-content-wrapper">
              <UserAvatar
                v-if="session.userId"
                :user-id="session.userId"
                :avatar-url="session.avatar"
                :username="session.name"
                :size="48"
                :clickable="false"
              />
              <span v-else class="avatar-text">{{ session.name?.charAt(0) }}</span>
            </div>
            <div v-else class="avatar-content">AI</div>
            <div v-if="session.unreadCount" class="unread-badge">
              {{ session.unreadCount > 9 ? '9+' : session.unreadCount }}
            </div>
          </div>
        </div>

        <!-- 查看更多按钮 -->
        <div v-if="needShowMore" class="show-more-btn" @click="showMore = !showMore">
          {{ showMore ? '收起' : '查看更多' }}
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
  .chat-session-panel {
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 100;
  }

  .current-session {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(10px);
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);
    max-width: 200px;
  }

  .current-session:hover {
    background: rgba(0, 0, 0, 0.7);
    transform: translateY(-2px);
  }

  .session-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 16px;
    flex-shrink: 0;
  }

  .session-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
    overflow: hidden;
  }

  .session-name {
    color: white;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .session-status {
    display: flex;
    align-items: center;
    gap: 6px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status-dot.online {
    background: #4caf50;
    box-shadow: 0 0 6px rgba(76, 175, 80, 0.5);
  }

  .toggle-icon {
    color: rgba(255, 255, 255, 0.6);
    font-size: 12px;
    transition: transform 0.3s ease;
    width: 20px;
    display: flex;
    justify-content: center;
    flex-shrink: 0;
  }

  .toggle-icon.rotated {
    transform: rotate(180deg);
  }

  /* 会话列表面板 */
  .session-list-panel {
    position: absolute;
    bottom: calc(100% + 12px);
    left: 0;
    background: transparent;
    overflow: visible;
    padding: 8px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  /* 头像网格 */
  .avatar-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 400px;
    overflow-y: auto;
    padding: 8px;
  }

  .avatar-item {
    position: relative;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    flex-shrink: 0;
  }

  .avatar-item:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    z-index: 10;
  }

  .avatar-item.active {
    border: 2px solid #667eea;
    box-shadow:
      0 0 0 3px rgba(102, 126, 234, 0.3),
      0 4px 15px rgba(102, 126, 234, 0.4);
  }

  .avatar-item.ai {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .avatar-item.new-chat {
    background: rgba(255, 255, 255, 0.1);
    border: 2px dashed rgba(255, 255, 255, 0.4);
  }

  .avatar-item.new-chat:hover {
    background: rgba(255, 255, 255, 0.15);
    border-style: solid;
  }

  .avatar-content-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .avatar-content {
    color: white;
    font-weight: bold;
    font-size: 16px;
  }

  .avatar-text {
    color: white;
    font-weight: bold;
    font-size: 16px;
  }

  .plus-icon {
    color: rgba(255, 255, 255, 0.8);
    font-size: 24px;
    font-weight: 300;
  }

  .unread-badge {
    position: absolute;
    top: -2px;
    right: -2px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    background: #f44336;
    color: white;
    border-radius: 50%;
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    border: 2px solid rgba(0, 0, 0, 0.8);
  }

  .show-more-btn {
    margin-top: 8px;
    padding: 10px 20px;
    text-align: center;
    color: #667eea;
    font-size: 13px;
    cursor: pointer;
    transition: color 0.2s ease;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
    border-radius: 8px;
    margin-left: 8px;
  }

  .show-more-btn:hover {
    color: #8a6ef0;
    background: rgba(0, 0, 0, 0.6);
  }

  /* 动画 */
  .slide-up-enter-active,
  .slide-up-leave-active {
    transition: all 0.3s ease;
  }

  .slide-up-enter-from,
  .slide-up-leave-to {
    opacity: 0;
    transform: translateY(20px);
  }

  /* 滚动条 */
  .avatar-grid::-webkit-scrollbar {
    width: 6px;
  }

  .avatar-grid::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }

  .avatar-grid::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
</style>
