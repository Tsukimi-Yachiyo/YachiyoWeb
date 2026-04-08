<script setup lang="ts">
  import { computed, ref, onMounted, onUnmounted } from 'vue'
  import UserProfilePopover from './UserProfilePopover/UserProfilePopover.vue'
  import WaveEffect from './WaveEffect.vue'
  import CheckinModule from './CheckinModule.vue'
  import { useUserProfile } from '../composables/useUserProfile'
  import { coinAPI } from '../services/api'
  import { useRouter } from 'vue-router'

  const router = useRouter()

  const props = defineProps({
    currentPage: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      default: '',
    },
    userAvatar: {
      type: String,
      default: '',
    },
  })

  const emit = defineEmits(['logout'])
  const {
    username: profileUsername,
    userAvatar: profileUserAvatar,
    loadUserDetail,
  } = useUserProfile()
  const iconBaseUrl = `${import.meta.env.BASE_URL}icons/theme/`
  const appLogoUrl = `${iconBaseUrl}yachiyo-tsukimi.svg`
  const shiftIconUrl = new URL('../assets/icons/shift.png', import.meta.url).href
  const tsukuyomiIconUrl = new URL('../assets/icons/tsukuyomi-space-v4.png', import.meta.url).href

  const shiftIconY = ref(0)
  let animationFrame = null
  let time = 0

  const tooltipX = ref(0)
  const tooltipY = ref(0)
  const showTooltip = ref(false)
  const tooltipText = ref('')
  // 优先使用全局单例资料，避免页面级 props 在路由切换时短暂抖动造成头像闪烁
  const resolvedUsername = computed(() => profileUsername.value || props.username || '用户')
  const resolvedUserAvatar = computed(() => profileUserAvatar.value || props.userAvatar || '')

  // 硬币相关状态
  const coinAmount = ref(0)
  const isCheckinVisible = ref(false)
  const isLoading = ref(false)

  const userProfileIsVisible = ref(false)

  // 处理登出

  const handleLogout = () => {
    emit('logout')
  }

  // 获取硬币数量
  const getCoinAmount = async () => {
    try {
      isLoading.value = true
      const response = await coinAPI.getCoinAmount()
      if (response.success) {
        coinAmount.value = response.data || 0
      }
    } catch (error) {
      console.error('获取硬币数量失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 切换签到模块显示
  const toggleCheckin = () => {
    isCheckinVisible.value = !isCheckinVisible.value
  }

  // 签到完成后更新硬币数量
  const handleCheckinComplete = () => {
    getCoinAmount()
    isCheckinVisible.value = false
  }

  // 路由切换函数
  const switchToChat = () => {
    router.push('/chat/home')
  }

  const switchToTsukuyomi = () => {
    router.push('/tsukuyomi')
  }

  // 波浪同步动画
  const animateShiftIcon = () => {
    time += 1
    const amplitude = 5
    const frequency = 0.02
    const speed = 0.03

    let y = 0
    y += amplitude * Math.sin(frequency * 0 + speed * time)
    y += amplitude * 0.5 * Math.sin(2 * frequency * 0 + 1.5 * speed * time)
    y += amplitude * 0.3 * Math.sin(3 * frequency * 0 + 2 * speed * time)

    shiftIconY.value = y
    animationFrame = requestAnimationFrame(animateShiftIcon)
  }

  // 处理鼠标事件
  const handleMouseMove = (event: MouseEvent) => {
    tooltipX.value = event.clientX + 15
    tooltipY.value = event.clientY + 15
  }

  const showTooltipWithText = (text: string) => {
    tooltipText.value = text
    showTooltip.value = true
  }

  const hideTooltip = () => {
    showTooltip.value = false
  }

  onMounted(() => {
    loadUserDetail(false)
    getCoinAmount()
    animateShiftIcon()
  })

  onUnmounted(() => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
    }
  })
</script>

<template>
  <header class="title-bar">
    <div class="title-bar-content">
      <div class="title-section">
        <router-link class="app-title-button" to="/chat/home">
          <img :src="appLogoUrl" alt="yachiyo-tsukimi" width="64" height="64" />
        </router-link>
      </div>
      <div class="user-info-header">
        <span class="username-header" :class="{ 'avatar-active': userProfileIsVisible }">{{
          resolvedUsername
        }}</span>

        <UserProfilePopover
          :username="resolvedUsername"
          :user-avatar="resolvedUserAvatar"
          :coin-amount="coinAmount"
          @logout="handleLogout"
          @update:is-visible="value => (userProfileIsVisible = value)"
          @toggle-checkin="toggleCheckin"
        >
          <template #trigger="{ showPopover, hidePopover, isVisible }">
            <div
              class="user-avatar-header"
              :class="{ 'avatar-active': isVisible }"
              @mouseenter="showPopover"
              @mouseleave="hidePopover"
            >
              <img v-if="resolvedUserAvatar" :src="resolvedUserAvatar" alt="用户头像" />
              <span v-else>{{
                resolvedUsername && resolvedUsername.length > 0
                  ? resolvedUsername.charAt(0).toUpperCase()
                  : 'U'
              }}</span>
            </div>
          </template>
        </UserProfilePopover>
      </div>
    </div>

    <!-- 签到模块弹出层 -->
    <div v-if="isCheckinVisible" class="checkin-popover">
      <div class="checkin-popover-content">
        <button class="close-button" @click="toggleCheckin">×</button>
        <CheckinModule @checkin-complete="handleCheckinComplete" />
      </div>
    </div>

    <div class="title-bar-wave">
      <WaveEffect />
    </div>

    <div class="switch-buttons-container">
      <button
        v-if="currentPage !== 'chat'"
        class="switch-button shift-button"
        :style="{ transform: `translateY(${shiftIconY}px) rotate(45deg)` }"
        title="切换至聊天"
        @click="switchToChat"
        @mousemove="handleMouseMove"
        @mouseenter="showTooltipWithText('切换至聊天')"
        @mouseleave="hideTooltip"
      >
        <img :src="shiftIconUrl" alt="切换至聊天" />
      </button>

      <button
        v-if="currentPage !== 'tsukuyomi'"
        class="switch-button tsukuyomi-button"
        title="切换至月读"
        @click="switchToTsukuyomi"
        @mousemove="handleMouseMove"
        @mouseenter="showTooltipWithText('切换至月读')"
        @mouseleave="hideTooltip"
      >
        <img :src="tsukuyomiIconUrl" alt="切换至月读" />
      </button>
    </div>

    <div
      v-if="showTooltip"
      class="tooltip"
      :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }"
    >
      {{ tooltipText }}
    </div>
  </header>
</template>

<style scoped>
  @reference "tailwindcss";

  /* 标题栏 */
  .title-bar {
    @apply h-32 z-100 relative;
  }

  .title-bar-wave {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 80px;
    overflow: hidden;
  }

  .title-bar-content {
    @apply flex justify-between items-center px-4 md:px-8 mx-auto h-full w-full max-w-7xl;
  }

  .title-section {
    @apply flex items-center gap-8;
  }

  .app-title-button {
    background: transparent;
    transition: all 0.3s ease;
  }

  .app-title-button:hover {
    transform: translateY(-2px);
  }

  .user-info-header {
    @apply flex items-center gap-4 relative;
  }

  .username-header {
    color: #ffffff;
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    z-index: 1001;
    position: relative;
  }

  .user-avatar-header {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 18px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    transform-origin: top right;
    z-index: 1000;
    position: relative;
  }

  .user-avatar-header.avatar-active {
    transform: scale(2);
    box-shadow: 0 0 20px rgba(33, 150, 243, 0.6);
    z-index: 1000;
  }

  .user-info-header .username-header.avatar-active {
    transform: translateX(-40px) translateY(40px);
  }

  .user-avatar-header img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* 签到模块弹出层样式 */
  .checkin-popover {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .checkin-popover-content {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    width: 90%;
    max-width: 400px;
    position: relative;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }

  .close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.3s ease;
  }

  .close-button:hover {
    background: #f0f0f0;
    color: #333;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .title-bar-content {
      padding: 10px 16px;
    }

    .title-section {
      gap: 10px;
    }

    .app-title-button {
      font-size: 16px;
    }

    .username-header {
      font-size: 13px;
      max-width: 120px;
    }

    .user-avatar-header {
      width: 40px;
      height: 40px;
      font-size: 16px;
    }
  }

  @media (max-width: 480px) {
    .title-section {
      gap: 8px;
    }

    .app-title-button {
      font-size: 14px;
    }

    .username-header {
      display: none;
    }
  }

  /* 切换按钮容器 */
  .switch-buttons-container {
    @apply flex items-end w-full absolute top-0 bottom-4 md:bottom-2 pl-4 md:pl-[10%] gap-4 md:gap-8 overflow-hidden z-1;
  }

  /* 切换按钮通用样式 */
  .switch-button {
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 0;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .switch-button:hover {
    transform: scale(1.1);
  }

  .switch-button:hover img {
    filter: drop-shadow(0 0 12px rgba(255, 255, 255, 1))
      drop-shadow(0 0 24px rgba(255, 255, 255, 0.6));
  }

  .switch-button img {
    width: 108px;
    height: 108px;
    object-fit: contain;
    filter: drop-shadow(0 0 16px rgba(255, 255, 255, 0.8))
      drop-shadow(0 0 32px rgba(255, 255, 255, 0.4));
  }

  .tooltip {
    position: fixed;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    white-space: nowrap;
    pointer-events: none;
    z-index: 9999;
    transition: opacity 0.2s ease;
  }

  /* 响应式设计 - 切换按钮 */
  @media (max-width: 768px) {
    .switch-button img {
      width: 90px;
      height: 90px;
      filter: drop-shadow(0 0 14px rgba(255, 255, 255, 0.8))
        drop-shadow(0 0 28px rgba(255, 255, 255, 0.4));
    }
  }

  @media (max-width: 480px) {
    .switch-button img {
      width: 72px;
      height: 72px;
      filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.8))
        drop-shadow(0 0 24px rgba(255, 255, 255, 0.4));
    }
  }
</style>
