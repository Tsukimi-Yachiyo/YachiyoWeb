<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useChatHome } from '../composables/useChatHome'
  import { useIconManager } from '../composables/useIconManager'
  import { useBackgroundMusic } from '../composables/useBackgroundMusic'
  import Live2DModel from '../components/Live2DModel/Live2DModel.vue'

  const { isPlaying, toggle } = useBackgroundMusic()

  // 海洋动物像素画
  import img1 from '../assets/images/ChatHome-1.png'
  import img2 from '../assets/images/ChatHome-2.png'
  import img3 from '../assets/images/ChatHome-3.png'
  import img4 from '../assets/images/ChatHome-4.png'

  const animals = [img1, img2, img3, img4]

  const oceanAnimals = computed(() => {
    const list = []
    const total = 18
    for (let i = 0; i < total; i++) {
      const img = animals[Math.floor(Math.random() * animals.length)]

      // 均匀分布，不扎堆
      const section = 100 / total
      const baseLeft = i * section + Math.random() * (section * 0.7)
      const left = `${baseLeft + Math.random() * 5}%`
      const top = `${10 + Math.random() * 75}%`

      // 大小层次：近大远小
      const sizeRand = Math.random()
      let size
      if (sizeRand > 0.85) size = 60 + Math.random() * 25
      else if (sizeRand > 0.6) size = 40 + Math.random() * 18
      else size = 22 + Math.random() * 14

      // 大小不同速度不同
      const duration = size > 50 ? 22 + Math.random() * 8 : 14 + Math.random() * 6

      list.push({
        img,
        flip: Math.random() > 0.5,
        delay: `${Math.random() * 4}s`,
        duration: `${duration}s`,
        left,
        top,
        size: `${size}px`,
        shadow: size > 40 ? '0 4px 8px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.2)',
        opacity: size > 40 ? 0.95 : 0.75,
      })
    }
    return list
  })
  interface BubbleStyle {
    width: string
    height: string
    left: string
    animationDuration: string
    animationDelay: string
  }

  interface AnimalStyle {
    left: string
    animationDuration: string
    animationDelay: string
  }

  //随机气泡大小、位置、速度
  const getBubbleStyle = (i: number): BubbleStyle => {
    const size = `${5 + Math.random() * 30}px`
    const left = `${Math.random() * 100}%`
    const duration = `${10 + Math.random() * 15}s`
    const delay = `${Math.random() * 5}s`

    return {
      width: size,
      height: size,
      left,
      animationDuration: duration,
      animationDelay: delay,
    }
  }

  // 动物随机参数
  const getAnimalStyle = (index: number): AnimalStyle => {
    const duration = `${15 + index * 5}s`
    const delay = `${index * 2}s`
    const left = `${10 + index * 20}%`

    return {
      left,
      animationDuration: duration,
      animationDelay: delay,
    }
  }

  const enterIconUrl = `${import.meta.env.BASE_URL}icons/theme/ENTER.svg`

  // 初始化图标管理器
  const { checkIconCache } = useIconManager()

  // 计算属性，用于获取图标数据URL
  const editIconUrl = computed(() => {
    const iconData = checkIconCache('edit.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const deleteIconUrl = computed(() => {
    const iconData = checkIconCache('trash.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const voiceIconUrl = computed(() => {
    const iconData = checkIconCache('volume-up.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const hoveredConversationId = ref(null)
  const longPressedConversationId = ref(null)
  const editModeConversationId = ref(null)
  const editTitle = ref('')

  const {
    username,
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
    isModelLoading,
    loadProgress,
    loadStatus,
  } = useChatHome()

  const handleMouseEnter = conversationId => {
    hoveredConversationId.value = conversationId
  }

  const handleMouseLeave = () => {
    hoveredConversationId.value = null
  }

  const handleLongPress = conversationId => {
    longPressedConversationId.value = conversationId
  }

  const startEditTitle = conversation => {
    editModeConversationId.value = conversation.id
    editTitle.value = conversation.title || `对话 ${conversation.id}`
  }

  const cancelEditTitle = () => {
    editModeConversationId.value = null
  }

  const handleDeleteConversation = async (conversationId, event) => {
    event.stopPropagation()
    if (confirm('确定要删除这个会话吗？')) {
      await deleteConversation(conversationId)
    }
  }

  const saveEditTitle = async conversationId => {
    if (editTitle.value.trim()) {
      await updateConversationTitle(conversationId, editTitle.value.trim())
    }
    editModeConversationId.value = null
  }
</script>

<template>
  <div class="chat-container" @touchstart="onTouchStart" @touchend="onTouchEnd">
    <!-- 海洋层 -->
    <div class="ocean-container">
      <div v-for="i in 15" :key="i" class="bubble" :style="getBubbleStyle(i)"></div>
      <div
        v-for="(item, i) in oceanAnimals"
        :key="i"
        class="animal"
        :style="{
          left: item.left,
          top: item.top,
          width: item.size,
          height: item.size,
          animationDelay: item.delay,
          animationDuration: item.duration,
          transform: item.flip ? 'scaleX(-1)' : '',
          // boxShadow: item.shadow,
          opacity: item.opacity,
        }"
      >
        <img :src="item.img" alt="海洋动物" class="animal-img" />
      </div>
    </div>

    <!-- 模型加载覆盖层 -->
    <transition name="fade">
      <div v-if="isModelLoading" class="model-loading-overlay">
        <div class="loading-content">
          <div class="loading-text">{{ loadStatus }}</div>
          <div class="progress-bar-container">
            <div class="progress-bar" :style="{ width: loadProgress + '%' }"></div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 遮罩层 -->
    <div v-if="isSidebarOpen" class="sidebar-overlay" @click="closeSidebar"></div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧会话栏 -->
      <aside ref="sidebarRef" :class="['sidebar', { 'sidebar-open': isSidebarOpen }]">
        <div class="sidebar-header">
          <h2>对话选择</h2>
          <button
            class="new-chat-btn"
            :disabled="isCreating || isModelLoading"
            @click="createNewConversation"
          >
            <span class="plus-icon">+</span>
            <span class="btn-text">{{ isCreating ? '创建中...' : '新建' }}</span>
          </button>
        </div>
        <div ref="conversationListRef" class="conversation-list">
          <transition-group name="conversation">
            <div
              v-for="conv in conversations"
              :key="conv.id"
              :class="['conversation-item', { active: conv.id === currentConversationId }]"
              :disabled="isModelLoading"
              @click="selectConversation(conv)"
              @mouseenter="handleMouseEnter(conv.id)"
              @mouseleave="handleMouseLeave"
              @touchstart="onTouchStart($event, () => handleLongPress(conv.id))"
              @touchend="onTouchEnd"
            >
              <span v-if="editModeConversationId !== conv.id" class="conversation-name">{{
                conv.title || '对话 ' + conv.id
              }}</span>
              <div v-else class="edit-title-input-wrapper">
                <input
                  v-model="editTitle"
                  class="edit-title-input"
                  autofocus
                  @keyup.enter="saveEditTitle(conv.id)"
                  @blur="saveEditTitle(conv.id)"
                  @keyup.esc="cancelEditTitle"
                />
                <div class="mobile-buttons">
                  <button class="edit-save-btn" @click="saveEditTitle(conv.id)">保存</button>
                  <button class="edit-cancel-btn" @click="cancelEditTitle">取消</button>
                </div>
              </div>
              <div
                v-if="
                  (hoveredConversationId === conv.id || longPressedConversationId === conv.id) &&
                  editModeConversationId !== conv.id
                "
                class="conversation-actions"
              >
                <button
                  class="action-btn edit-btn"
                  title="编辑标题"
                  @click.stop="startEditTitle(conv)"
                >
                  <img
                    v-if="editIconUrl"
                    :src="editIconUrl"
                    alt="编辑"
                    style="width: 16px; height: 16px"
                  />
                  <span v-else>✏️</span>
                </button>
                <button
                  class="action-btn delete-btn"
                  title="删除会话"
                  @click="handleDeleteConversation(conv.id, $event)"
                >
                  <img
                    v-if="deleteIconUrl"
                    :src="deleteIconUrl"
                    alt="删除"
                    style="width: 16px; height: 16px"
                  />
                  <span v-else>🗑️</span>
                </button>
              </div>
            </div>
          </transition-group>
          <div v-if="conversations.length === 0" class="empty-conversations">
            暂无会话，点击上方新建按钮开始对话
          </div>
        </div>
      </aside>

      <!-- 右滑按钮 -->
      <button
        class="sidebar-toggle-btn"
        :class="{ 'btn-hidden': isSidebarOpen }"
        :disabled="isModelLoading"
        @click="toggleSidebar"
      >
        <span class="toggle-icon">☰</span>
      </button>

      <!-- 右侧聊天区 -->
      <main class="chat-main" @click="isSidebarOpen && closeSidebar()">
        <!-- Live2D 模型展示 -->
        <div class="live2d-display">
          <Live2DModel />
        </div>

        <!-- 欢迎界面 -->
        <div v-if="!currentConversationId && !isModelLoading" class="welcome-screen">
          <div class="welcome-content">
            <!-- 音乐开关按钮 -->
            <button
              class="music-toggle-btn"
              :class="{ playing: isPlaying }"
              title="音乐开关"
              @click="toggle"
            >
              <span class="music-icon">{{ isPlaying ? '🔊' : '🔇' }}</span>
            </button>
            <!-- 对下面标签文字加粗 -->
            <h1>太阳西沉 夜幕降临</h1>
            <p>欢迎来到月读，{{ username }}！</p>
            <button
              class="start-chat-btn"
              :disabled="isModelLoading"
              @click="createNewConversation"
            >
              开始新对话
            </button>
          </div>
        </div>

        <!-- 消息列表  -  修复版-->
        <div v-else-if="!isModelLoading" ref="messageListRef" class="message-list">
          <transition-group name="message">
            <div
              v-for="msg in messages"
              :key="msg.id || JSON.stringify(msg)"
              :class="['message', msg.type]"
            >
              <div class="message-bubble">
                <span v-if="msg.type === 'assistant' && msg.isStreaming && !msg.content"
                  >思考中
                  <div v-if="isTyping" class="typing-indicator">
                    <div class="typing-bubbles">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </span>
                <span v-else>{{ msg.content }}</span>
                <div v-if="msg.type === 'assistant' && !msg.isStreaming" class="message-actions">
                  <button
                    class="voice-btn"
                    :class="{
                      'voice-loading': getVoiceStatus(msg.content).isLoading,
                      'voice-disabled': !isVoiceClickable(msg.content),
                    }"
                    :disabled="!isVoiceClickable(msg.content)"
                    title="播放语音"
                    @click="playVoice(msg.content)"
                  >
                    <span v-if="getVoiceStatus(msg.content).isLoading" class="voice-spinner"></span>
                    <img
                      v-else-if="voiceIconUrl"
                      :src="voiceIconUrl"
                      alt="播放语音"
                      style="width: 16px; height: 16px"
                    />
                    <span v-else>🔊</span>
                  </button>
                </div>
              </div>
            </div>
          </transition-group>
        </div>
        <!-- 输入区 -->
        <div v-if="currentConversationId && !isModelLoading" class="input-area">
          <div class="input-wrapper">
            <input
              ref="inputRef"
              v-model="inputMessage"
              placeholder="输入消息，按 Enter 发送..."
              :disabled="isChatLoading || isModelLoading"
              @keyup.enter="sendMessage"
            />
            <button
              class="send-btn"
              :disabled="isChatLoading || isModelLoading || !inputMessage.trim()"
              @click="sendMessage"
            >
              <span v-if="isChatLoading" class="loading-spinner"></span>
              <!-- <span v-else>发送</span> -->
              <img v-else :src="enterIconUrl" alt="发送" width="36" height="36" />
            </button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
  .chat-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    z-index: 1;
    background: linear-gradient(180deg, #3498db 0%, #2a5298 30%, #0d1642 70%, #050b2c 100%);
    overflow: hidden;
    position: relative;
    box-shadow: none !important;
    border-top: none !important;
    margin-top: 0 !important;

    /*
    todo:
          background: radial-gradient(
        circle at 50% 10%,
        rgba(135, 206, 235, 0.35),
        rgba(0, 191, 255, 0.15) 60%,
        transparent 100%
      );
    */
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      backdrop-filter: blur(1.5px);
      opacity: 0.85;
      pointer-events: none;
      z-index: 0;
    }

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 40%;
      background: linear-gradient(to top, #02051a, transparent);
      pointer-events: none;
      z-index: 0;
    }

    /* 让内部子元素层级高于背景层，不被遮挡 */
    > * {
      position: relative;
      z-index: 1;
    }
  }

  /* 海洋层 */
  /* 🌊 海洋背景层（核心修复：只让背景不拦截点击，不影响Live2D） */
  .ocean-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    z-index: 0;
    /* 最底层，在所有内容之下 */
    pointer-events: none;
    /* 仅背景层不拦截点击 ✅ */
  }

  /* 气泡：继承父级的pointer-events: none，不拦截点击 */
  .bubble {
    position: absolute;
    bottom: -30px;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 50%;
    animation: bubbleUp linear infinite;
    pointer-events: none;
  }

  /* 动物：继承父级的pointer-events: none，不拦截点击 */
  .animal {
    position: absolute;
    animation: swimFloat ease-in-out infinite;
    pointer-events: none;
    will-change: transform;
  }
  .animal img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
  }

  /* 气泡动画 */
  @keyframes bubbleUp {
    0% {
      transform: translateY(0) scale(0.8);
      opacity: 0.7;
    }

    100% {
      transform: translateY(-110vh) scale(1.2);
      opacity: 0;
    }
  }

  /* 动物漂浮动画 */

  @keyframes swimFloat {
    0% {
      transform: scaleX(1) translateX(0) translateY(0) rotate(-1.8deg);
    }
    25% {
      transform: scaleX(1) translateX(30px) translateY(-15px) rotate(0deg);
    }
    50% {
      transform: scaleX(1) translateX(0) translateY(-28px) rotate(1.8deg);
    }
    75% {
      transform: scaleX(1) translateX(-30px) translateY(-15px) rotate(0deg);
    }
    100% {
      transform: scaleX(1) translateX(0) translateY(0) rotate(-1.8deg);
    }
  }

  /* 主内容区 */
  .main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
    position: relative;
  }

  /* 模型加载覆盖层 */
  .model-loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: #000000;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    animation: fadeIn 0.5s ease;
    transition: opacity 0.5s ease;
  }

  .loading-content {
    text-align: center;
    width: 80%;
    max-width: 400px;
  }

  .loading-text {
    color: white;
    font-size: 18px;
    font-weight: 500;
    margin-bottom: 20px;
    animation: pulse 1.5s ease-in-out infinite;
  }

  .progress-bar-container {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #2196f3 0%, #1976d2 100%);
    border-radius: 4px;
    transition: width 0.3s ease;
    box-shadow: 0 0 10px rgba(33, 150, 243, 0.5);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  @keyframes pulse {
    0% {
      opacity: 0.7;
    }

    50% {
      opacity: 1;
    }

    100% {
      opacity: 0.7;
    }
  }

  /* 过渡动画 */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.5s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  /* 左侧边栏 */
  .sidebar {
    width: 280px;
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
  }

  .sidebar-header {
    padding: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .sidebar-header h2 {
    color: #fff;
    font-size: 18px;
    font-weight: 500;
    margin: 0;
  }

  .new-chat-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    color: white;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
  }

  .new-chat-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
  }

  .new-chat-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .plus-icon {
    font-size: 18px;
    font-weight: bold;
  }

  .conversation-list {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
  }

  .empty-conversations {
    padding: 20px;
    text-align: center;
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
  }

  .conversation-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    margin-bottom: 8px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid transparent;
  }

  .conversation-item:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateX(5px);
  }

  .conversation-item.active {
    background: linear-gradient(135deg, rgba(33, 150, 243, 0.3) 0%, rgba(25, 118, 210, 0.3) 100%);
    border-color: rgba(33, 150, 243, 0.5);
    box-shadow: 0 4px 15px rgba(33, 150, 243, 0.2);
  }

  .conversation-icon {
    display: none;
  }

  .conversation-name {
    color: #fff;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* 会话列表动画 */
  .conversation-enter-active,
  .conversation-leave-active {
    transition: all 0.3s ease;
  }

  .conversation-enter-from {
    opacity: 0;
    transform: translateX(-20px);
  }

  .conversation-leave-to {
    opacity: 0;
    transform: translateX(20px);
  }

  /* 用户信息 */
  .user-info {
    padding: 15px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 16px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .user-avatar:hover {
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(33, 150, 243, 0.5);
  }

  .user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .username {
    flex: 1;
    color: #fff;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .logout-btn {
    padding: 6px 12px;
    background: rgba(244, 67, 54, 0.2);
    color: #f44336;
    border: 1px solid rgba(244, 67, 54, 0.3);
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.3s ease;
  }

  .logout-btn:hover {
    background: rgba(244, 67, 54, 0.3);
    transform: scale(1.05);
  }

  /* 主聊天区 */
  .chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  /* Live2D 模型展示 */
  .live2d-display {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    opacity: 1;
    pointer-events: auto;
  }

  @media (max-width: 768px) {
    .live2d-display {
      opacity: 0.6;
    }
  }

  /* 欢迎界面 */
  .welcome-screen {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 2;
  }

  .welcome-content {
    text-align: center;
    animation: fadeInUp 0.6s ease;
  }

  .welcome-content h1 {
    color: #fff;
    font-size: 36px;
    font-weight: bold;
    margin-bottom: 10px;
    background: linear-gradient(135deg, #fff 0%, #64b5f6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .music-toggle-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(5px);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    z-index: 10;
  }

  .music-toggle-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }

  .music-toggle-btn.playing {
    background: rgba(100, 181, 246, 0.4);
    border-color: rgba(100, 181, 246, 0.6);
  }

  .music-icon {
    font-size: 20px;
  }

  .welcome-content p {
    color: rgba(255, 255, 255, 0.7);
    font-size: 18px;
    margin-bottom: 30px;
  }

  .start-chat-btn {
    padding: 15px 40px;
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    color: white;
    border: none;
    border-radius: 30px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(33, 150, 243, 0.4);
  }

  .start-chat-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 30px rgba(33, 150, 243, 0.5);
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* 消息列表 */
  .message-list {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: relative;
    z-index: 2;
  }

  .message {
    display: flex;
    animation: messageSlideIn 0.3s ease;
    max-width: 70%;
  }

  .message.user {
    align-self: flex-end;
    justify-content: flex-end;
  }

  .message.assistant {
    align-self: flex-start;
    justify-content: flex-start;
  }

  @keyframes messageSlideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .message-bubble {
    padding: 12px 16px;
    border-radius: 16px;
    font-size: 14px;
    line-height: 1.6;
    word-wrap: break-word;
    position: relative;
  }

  .message.user .message-bubble {
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    color: white;
    border-bottom-right-radius: 4px;
  }

  .message.assistant .message-bubble {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border-bottom-left-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 40px;
  }

  .message-actions {
    position: absolute;
    bottom: 8px;
    right: 8px;
  }

  .voice-btn {
    padding: 6px 10px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    min-height: 32px;
  }

  .voice-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }

  .voice-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .voice-btn.voice-loading {
    background: rgba(33, 150, 243, 0.3);
  }

  .voice-spinner {
    width: 14px;
    height: 14px;
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

  /* 消息动画 */
  .message-enter-active,
  .message-leave-active {
    transition: all 0.3s ease;
  }

  .message-enter-from {
    opacity: 0;
    transform: translateY(20px);
  }

  .message-leave-to {
    opacity: 0;
    transform: translateY(-20px);
  }

  /* 输入中动画 */
  .typing-indicator {
    display: flex;
    align-items: center;
    align-items: flex-start;
    gap: 12px;
  }

  .typing-bubbles {
    display: flex;
    gap: 6px;
    padding: 0 !important;
    background: transparent !important;
    border-radius: 0 !important;
    border-bottom-left-radius: 0 !important;
    margin-top: 15px;
  }

  .typing-bubbles span {
    width: 8px;
    height: 8px;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    animation: typingBounce 1.4s infinite ease-in-out both;
  }

  .typing-bubbles span:nth-child(1) {
    animation-delay: -0.32s;
  }

  .typing-bubbles span:nth-child(2) {
    animation-delay: -0.16s;
  }

  @keyframes typingBounce {
    0%,
    80%,
    100% {
      transform: scale(0);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }

  /* 输入区 */
  .input-area {
    padding: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.2);
    position: relative;
    z-index: 2;
  }

  .input-wrapper {
    display: flex;
    gap: 12px;
    max-width: 900px;
    margin: 0 auto;
  }

  .input-wrapper input {
    flex: 1;
    padding: 14px 20px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 25px;
    color: #fff;
    font-size: 14px;
    outline: none;
    transition: all 0.3s ease;
  }

  .input-wrapper input::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  .input-wrapper input:focus {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(33, 150, 243, 0.5);
    box-shadow: 0 0 20px rgba(33, 150, 243, 0.2);
  }

  .input-wrapper input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .send-btn {
    padding: 4px 8px;
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    color: white;
    border: none;
    border-radius: 25px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 80px;
  }

  .send-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
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

  /* 滚动条样式 */
  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .sidebar {
      width: 240px;
    }

    .message-content-wrapper {
      max-width: 80%;
    }

    .welcome-content h1 {
      font-size: 28px;
    }
  }

  /* 移动端侧边栏切换按钮 */
  .sidebar-toggle-btn {
    display: none;
  }

  @media (max-width: 768px) {
    .sidebar {
      position: fixed;
      left: -280px;
      top: 0;
      bottom: 0;
      z-index: 400;
      transition: transform 0.3s ease;
      height: 100%;
    }

    .sidebar.sidebar-open {
      transform: translateX(280px);
    }

    /* 遮罩层 */
    .sidebar-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 350;
      backdrop-filter: blur(2px);
    }

    /* 切换按钮 */
    .sidebar-toggle-btn {
      display: flex;
      position: fixed;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
      border: none;
      border-radius: 50%;
      cursor: pointer;
      z-index: 100;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px rgba(33, 150, 243, 0.4);
      transition: all 0.3s ease;
    }

    .sidebar-toggle-btn:hover {
      transform: translateY(-50%) scale(1.1);
      box-shadow: 0 6px 20px rgba(33, 150, 243, 0.5);
    }

    .sidebar-toggle-btn.btn-hidden {
      opacity: 0;
      pointer-events: none;
    }

    .toggle-icon {
      color: white;
      font-size: 18px;
    }

    .chat-main {
      width: 100%;
    }
  }

  /* 会话操作按钮样式 */
  .conversation-actions {
    display: flex;
    gap: 8px;
    margin-left: 10px;
  }

  .action-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    padding: 4px;
    border-radius: 4px;
    transition: background-color 0.2s ease;
  }

  .action-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  /* 编辑标题样式 */
  .edit-title-input-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
  }

  .mobile-buttons {
    display: none;
  }

  .edit-title-input {
    flex: 1;
    padding: 6px 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    background-color: rgba(255, 255, 255, 0.05);
    color: #fff;
    font-size: 14px;
  }

  .edit-title-input:focus {
    outline: none;
    border-color: #2196f3;
  }

  .edit-save-btn,
  .edit-cancel-btn {
    padding: 4px 8px;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .edit-save-btn {
    background-color: #2196f3;
    color: white;
  }

  .edit-cancel-btn {
    background-color: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .edit-save-btn:hover {
    background-color: #1976d2;
  }

  .edit-cancel-btn:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }

  /* 移动端适配 */
  @media (max-width: 768px) {
    .conversation-actions {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      background-color: rgba(0, 0, 0, 0.8);
      padding: 8px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .mobile-buttons {
      display: flex;
      gap: 8px;
      width: 100%;
    }

    .edit-title-input-wrapper {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
    }

    .edit-save-btn,
    .edit-cancel-btn {
      flex: 1;
      text-align: center;
    }
  }
</style>
