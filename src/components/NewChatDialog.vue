<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { useFriends } from '../composables/useFriends'
  import { useUserSearch } from '../composables/useUserSearch'
  import type { SearchUserItem } from '../types/api'

  const router = useRouter()

  // 定义props
  const props = defineProps<{
    visible: boolean
  }>()

  // 定义emit
  const emit = defineEmits<{
    'update:visible': [value: boolean]
    startChat: [userId: number]
  }>()

  // 使用composables
  const { friends, mutualFollowIds, loadRelations, isFriend, followUser } = useFriends()
  const { searchResults, isSearching, searchKeyword, searchUsers, clearSearchResults } =
    useUserSearch()

  // 状态
  const searchInput = ref('')
  const activeTab = ref<'friends' | 'search'>('friends')
  const showSearchPanel = ref(false)

  // 监听可见性变化
  const handleVisibleChange = (value: boolean) => {
    emit('update:visible', value)
    if (!value) {
      showSearchPanel.value = false
      searchInput.value = ''
      clearSearchResults()
    }
  }

  // 挂载时加载
  onMounted(() => {
    if (props.visible) {
      loadRelations()
    }
  })

  // 监听props.visible变化
  watch(
    () => props.visible,
    newVal => {
      if (newVal) {
        loadRelations()
      }
    }
  )

  // 搜索
  const handleSearch = () => {
    if (searchInput.value.trim()) {
      activeTab.value = 'search'
      searchUsers(searchInput.value.trim())
    }
  }

  // 开始聊天
  const handleStartChat = (user: any) => {
    const userId = user.id || user.userId
    if (userId) {
      emit('startChat', userId)
      handleVisibleChange(false)
    } else {
      console.error('无法获取用户ID:', user)
    }
  }

  // 关注用户
  const handleFollowUser = async (user: any) => {
    const userId = user.id || user.userId
    if (userId) {
      await followUser(userId)
    } else {
      console.error('无法获取用户ID:', user)
    }
  }

  // 跳转到用户主页
  const handleGoToUserProfile = (user: any, event: MouseEvent) => {
    event.stopPropagation()
    const userId = user.id || user.userId
    if (userId) {
      router.push({ name: 'UserProfile', params: { user_id: userId } })
      handleVisibleChange(false)
    }
  }

  // 检查是否已经有聊天连接
  const hasChatConnection = (userId: number): boolean => {
    // 这里简化处理，实际应该检查chatConnections
    return false
  }

  // 格式化搜索结果，添加互关判断
  const formattedSearchResults = computed(() => {
    // 安全检查，确保 searchResults.value 是数组
    if (!Array.isArray(searchResults.value)) {
      console.warn('searchResults.value is not an array:', searchResults.value)
      return []
    }
    return searchResults.value.map(item => ({
      ...item,
      isMutualFollow: item.isFollowing && item.isFollowed,
    }))
  })
</script>

<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="visible" class="dialog-overlay" @click.self="handleVisibleChange(false)">
        <div class="dialog-content">
          <!-- 头部 -->
          <div class="dialog-header">
            <h3 class="dialog-title">新建聊天</h3>
            <button class="close-btn" @click="handleVisibleChange(false)">✕</button>
          </div>

          <!-- 搜索框 -->
          <div class="search-bar">
            <input
              v-model="searchInput"
              type="text"
              placeholder="搜索用户..."
              @input="handleSearch"
              @keyup.enter="handleSearch"
            />
            <span v-if="isSearching" class="search-spinner"></span>
          </div>

          <!-- Tab切换 -->
          <div class="tabs">
            <button
              :class="['tab', { active: activeTab === 'friends' }]"
              @click="activeTab = 'friends'"
            >
              我的好友
            </button>
            <button
              :class="['tab', { active: activeTab === 'search' }]"
              @click="activeTab = 'search'"
            >
              搜索结果
            </button>
          </div>

          <!-- 好友列表 -->
          <div v-if="activeTab === 'friends'" class="user-list">
            <div
              v-for="friend in friends"
              :key="(friend as any).id || (friend as any).userId"
              class="user-item"
              @click="handleStartChat(friend)"
            >
              <div
                class="user-avatar"
                :title="`点击查看 ${friend.userName} 的主页`"
                @click.stop="handleGoToUserProfile(friend, $event)"
              >
                {{ friend.userName?.charAt(0) || '?' }}
              </div>
              <div class="user-info">
                <div class="user-name">{{ friend.userName }}</div>
                <div class="user-status">好友</div>
              </div>
              <button class="chat-btn" @click.stop="handleStartChat(friend)">开始聊天</button>
            </div>
            <div v-if="friends.length === 0" class="empty-state">
              <p>还没有好友</p>
              <p class="hint">先关注用户，等对方回关后就可以聊天啦~</p>
            </div>
          </div>

          <!-- 搜索结果 -->
          <div v-else class="user-list">
            <div v-for="user in formattedSearchResults" :key="user.userName" class="user-item">
              <div
                class="user-avatar"
                :title="`点击查看 ${user.userName} 的主页`"
                @click.stop="handleGoToUserProfile(user, $event)"
              >
                {{ user.userName?.charAt(0) || '?' }}
              </div>
              <div class="user-info">
                <div class="user-name">{{ user.userName }}</div>
                <div class="user-status">
                  <span v-if="user.isMutualFollow" class="status-friend">✓ 互相关注</span>
                  <span v-else-if="user.isFollowing" class="status-following">已关注</span>
                  <span v-else-if="user.isFollowed" class="status-follower">关注了你</span>
                  <span v-else>陌生人</span>
                </div>
              </div>
              <template v-if="user.isMutualFollow">
                <button class="chat-btn" @click.stop="handleStartChat(user as any)">
                  开始聊天
                </button>
              </template>
              <template v-else-if="user.isFollowing">
                <button class="wait-btn">等待回关</button>
              </template>
              <template v-else>
                <button class="follow-btn" @click.stop="handleFollowUser(user as any)">
                  {{ user.isFollowed ? '回关' : '关注' }}
                </button>
              </template>
            </div>
            <div v-if="searchResults.length === 0 && searchKeyword" class="empty-state">
              未找到用户
            </div>
            <div v-if="!searchKeyword" class="empty-state">输入用户名搜索用户</div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .dialog-content {
    width: 90%;
    max-width: 480px;
    max-height: 80vh;
    background: linear-gradient(135deg, rgba(30, 30, 50, 0.95) 0%, rgba(20, 20, 40, 0.95) 100%);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }

  /* 头部 */
  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .dialog-title {
    color: white;
    font-size: 18px;
    font-weight: 500;
    margin: 0;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
  }

  /* 搜索框 */
  .search-bar {
    padding: 16px 24px;
    position: relative;
  }

  .search-bar input {
    width: 100%;
    padding: 12px 18px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    color: white;
    font-size: 14px;
    outline: none;
    transition: all 0.3s ease;
    box-sizing: border-box;
  }

  .search-bar input::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  .search-bar input:focus {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(102, 126, 234, 0.5);
  }

  .search-spinner {
    position: absolute;
    right: 36px;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: translateY(-50%) rotate(360deg);
    }
  }

  /* Tabs */
  .tabs {
    display: flex;
    padding: 0 24px;
    gap: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .tab {
    flex: 1;
    padding: 12px 0;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
    cursor: pointer;
    position: relative;
    transition: all 0.3s ease;
  }

  .tab:hover {
    color: rgba(255, 255, 255, 0.8);
  }

  .tab.active {
    color: white;
    font-weight: 500;
  }

  .tab.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  }

  /* 用户列表 */
  .user-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }

  .user-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 24px;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .user-item:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .user-avatar {
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

  .user-info {
    flex: 1;
    min-width: 0;
  }

  .user-name {
    color: white;
    font-size: 15px;
    font-weight: 500;
  }

  .user-status {
    font-size: 12px;
    margin-top: 4px;
  }

  .status-friend {
    color: #4caf50;
  }

  .status-following {
    color: rgba(255, 255, 255, 0.5);
  }

  .status-follower {
    color: #ffb300;
  }

  /* 按钮 */
  .chat-btn {
    padding: 8px 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.3s ease;
    flex-shrink: 0;
  }

  .chat-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .wait-btn {
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.6);
    border: none;
    border-radius: 12px;
    font-size: 13px;
    cursor: not-allowed;
    flex-shrink: 0;
  }

  .follow-btn {
    padding: 8px 16px;
    background: rgba(102, 126, 234, 0.2);
    color: #667eea;
    border: 1px solid rgba(102, 126, 234, 0.4);
    border-radius: 12px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.3s ease;
    flex-shrink: 0;
  }

  .follow-btn:hover {
    background: rgba(102, 126, 234, 0.3);
  }

  /* 空状态 */
  .empty-state {
    padding: 40px 24px;
    text-align: center;
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
  }

  .empty-state .hint {
    margin-top: 8px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.35);
  }

  /* 动画 */
  .fade-enter-active,
  .fade-leave-active {
    transition: all 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .fade-enter-from .dialog-content,
  .fade-leave-to .dialog-content {
    transform: scale(0.95);
  }

  /* 滚动条 */
  .user-list::-webkit-scrollbar {
    width: 4px;
  }

  .user-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .user-list::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }
</style>
