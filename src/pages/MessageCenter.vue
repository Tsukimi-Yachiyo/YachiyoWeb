<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { mailAPI } from '../services/api' // 引入我们刚才写的 API

  interface Message {
    id: number
    title: string
    content: string
    sender?: string
    time?: string
    isRead?: boolean
  }

  interface NavItem {
    key: string
    label: string
    icon: string
    unreadCount: number
  }

  const activeTab = ref<string>('LIKE')
  const isLoading = ref<boolean>(false) // 加载状态
  const mailList = ref<Message[]>([])

  const navItems = ref<NavItem[]>([
    { key: 'REPLY', label: '回复我的', icon: '💬', unreadCount: 1 },
    { key: 'AT_ME', label: '@我', icon: '📢', unreadCount: 0 },
    { key: 'LIKE', label: '收到的赞', icon: '👍', unreadCount: 12 },
    { key: 'NOTICE', label: '系统通知', icon: '🔔', unreadCount: 0 },
    { key: 'PRIVATE', label: '我的私信', icon: '✉️', unreadCount: 0 },
  ])

  // 核心拉取数据函数
  const fetchMails = async () => {
    isLoading.value = true
    mailList.value = [] // 清空旧数据
    try {
      const res = await mailAPI.getMailList(activeTab.value)
      if (res.success && res.data) {
        mailList.value = res.data
      }
    } catch (error) {
      console.error('获取信件失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 切换标签
  const handleTabClick = (tabName: string) => {
    if (activeTab.value === tabName) return // 避免重复点击
    activeTab.value = tabName
    fetchMails() // 切换时重新拉取数据
  }

  // 初始加载
  onMounted(() => {
    fetchMails()
  })

  const totalUnread = computed(() => {
    return navItems.value.reduce((sum, item) => sum + item.unreadCount, 0)
  })

  const currentLabel = computed(() => {
    const item = navItems.value.find(item => item.key === activeTab.value)
    return item ? item.label : ''
  })
</script>

<template>
  <div class="message-container">
    <div class="message-wrapper">
      <h2 class="page-title">📬 消息中心</h2>

      <div class="message-body">
        <div class="sidebar">
          <div class="nav-list">
            <div
              v-for="item in navItems"
              :key="item.key"
              class="nav-item"
              :class="{ active: activeTab === item.key }"
              @click="handleTabClick(item.key)"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-label">{{ item.label }}</span>
              <span v-if="item.unreadCount > 0" class="unread-badge">
                {{ item.unreadCount > 99 ? '99+' : item.unreadCount }}
              </span>
            </div>
          </div>
        </div>

        <div class="content-area">
          <div class="content-header">
            <h3 class="content-title">{{ currentLabel }}</h3>
            <span v-if="totalUnread > 0" class="total-unread"> 未读消息：{{ totalUnread }} </span>
          </div>

          <div class="content-body">
            <div v-if="isLoading" class="status-container">
              <div class="loading-spinner"></div>
              <p class="status-text">正在翻阅信箱...</p>
            </div>

            <div v-else-if="mailList.length === 0" class="status-container">
              <span class="empty-icon">🌊</span>
              <p class="status-text empty-text">海风吹过，这里还没有任何信件。</p>
            </div>

            <div v-else>
              <div
                v-for="mail in mailList"
                :key="mail.id"
                class="message-item"
                :class="{ 'is-read': mail.isRead }"
              >
                <div class="message-left">
                  <div class="avatar">{{ mail.sender?.charAt(0) || '无' }}</div>
                </div>
                <div class="message-main">
                  <div class="message-header">
                    <div class="sender-wrapper">
                      <svg
                        class="mail-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                        />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      <span class="sender-name">{{ mail.sender }}</span>
                    </div>
                    <span class="message-time">{{ mail.time }}</span>
                  </div>
                  <div class="message-title">{{ mail.title }}</div>
                  <div class="message-content">{{ mail.content }}</div>
                </div>
                <div class="message-right">
                  <span v-if="!mail.isRead" class="unread-dot"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  /* -------- 原有样式保持不变 -------- */
  .message-container {
    min-height: calc(100vh - 120px);
    padding: 20px;
    background-color: #f4f5f7;
  }
  .message-wrapper {
    max-width: 1200px;
    margin: 0 auto;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }
  .page-title {
    padding: 20px;
    margin: 0;
    border-bottom: 1px solid #e4e7ed;
    font-size: 20px;
    color: #222;
  }
  .message-body {
    display: flex;
    min-height: 500px;
  }
  .sidebar {
    width: 220px;
    background-color: #fafafa;
    border-right: 1px solid #e4e7ed;
  }
  .nav-list {
    padding: 10px 0;
  }
  .nav-item {
    display: flex;
    align-items: center;
    padding: 14px 20px;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;
    color: #222;
    font-size: 14px;
  }
  .nav-item:hover {
    background-color: #f0f0f0;
  }
  .nav-item.active {
    background-color: #e8f5fc;
    color: #00aeec;
    font-weight: 500;
  }
  .nav-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background-color: #00aeec;
  }
  .nav-icon {
    font-size: 18px;
    margin-right: 12px;
    width: 24px;
    text-align: center;
  }
  .nav-label {
    flex: 1;
  }
  .unread-badge {
    background-color: #fb7299;
    color: #fff;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 10px;
    min-width: 18px;
    text-align: center;
    font-weight: 500;
  }
  .content-area {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #e4e7ed;
  }
  .content-title {
    margin: 0;
    font-size: 16px;
    color: #222;
    font-weight: 500;
  }
  .total-unread {
    font-size: 13px;
    color: #00aeec;
    background-color: #e8f5fc;
    padding: 4px 12px;
    border-radius: 12px;
  }
  .content-body {
    flex: 1;
    overflow-y: auto;
    padding: 0;
    position: relative;
  }
  .message-item {
    display: flex;
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    transition: all 0.3s;
  }
  .message-item:hover {
    background-color: #f8f8f8;
  }
  .message-item.is-read {
    opacity: 0.7;
  }
  .message-left {
    margin-right: 12px;
  }
  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #00aeec 0%, #0085cc 100%);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 500;
  }
  .message-main {
    flex: 1;
    min-width: 0;
  }
  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  .sender-wrapper {
    display: flex;
    align-items: center;
  }
  .mail-icon {
    width: 16px;
    height: 16px;
    margin-right: 8px;
    color: #00aeec;
    flex-shrink: 0;
  }
  .sender-name {
    font-size: 14px;
    color: #222;
    font-weight: 500;
  }
  .message-time {
    font-size: 12px;
    color: #999;
  }
  .message-title {
    font-size: 14px;
    color: #222;
    margin-bottom: 4px;
    font-weight: 500;
  }
  .message-content {
    font-size: 13px;
    color: #666;
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .message-right {
    display: flex;
    align-items: center;
    margin-left: 12px;
  }
  .unread-dot {
    width: 8px;
    height: 8px;
    background-color: #00aeec;
    border-radius: 50%;
  }

  /* -------- 新增：状态提示样式 -------- */
  .status-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 300px;
  }
  .status-text {
    color: #999;
    font-size: 14px;
    margin-top: 16px;
    letter-spacing: 1px;
  }
  .empty-icon {
    font-size: 40px;
    opacity: 0.8;
  }
  .empty-text {
    color: #888;
    font-style: italic;
  }
  /* 简单的加载小圆圈 */
  .loading-spinner {
    width: 30px;
    height: 30px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #00aeec;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
