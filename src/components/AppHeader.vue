<script setup lang="ts">
  import { computed, ref, onMounted } from 'vue'
  import UserProfilePopover from './UserProfilePopover/UserProfilePopover.vue'
  import WaveEffect from './WaveEffect.vue'
  import CheckinModule from './CheckinModule.vue'
  import { useUserProfile } from '../composables/useUserProfile'
  import { coinAPI } from '../services/api'

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
  const tsukuyomiLogoUrl = `${iconBaseUrl}tsukuyomi-space.svg`
  const fujuLogoUrl = `${iconBaseUrl}FUJU.svg`
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

  onMounted(() => {
    loadUserDetail(false)
    getCoinAmount()
  })
</script>

<template>
  <header class="title-bar">
    <div class="title-bar-content">
      <div class="title-section">
        <router-link class="app-title-button" to="/chat/home">
          <img :src="appLogoUrl" alt="yachiyo-tsukimi" width="64" height="64" />
        </router-link>
        <div class="nav-buttons">
          <router-link
            class="nav-button"
            :class="{ active: currentPage === 'tsukuyomi' }"
            to="/tsukuyomi"
          >
            <img :src="tsukuyomiLogoUrl" alt="tsukuyomi-space" width="64" height="64" />
          </router-link>
        </div>
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
  </header>
</template>

<style scoped>
  @reference "tailwindcss";

  /* 标题栏 */
  .title-bar {
    @apply h-32 bg-black  z-100;
    position: relative;
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

  .nav-buttons {
    display: flex;
    gap: 10px;
  }

  .nav-button {
    background: transparent;
    transition: all 0.3s ease;
  }

  .nav-button:hover {
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
    transform: translateX(-40px) translateY(35px);
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

    .nav-buttons {
      gap: 8px;
    }

    .nav-button {
      padding: 6px 12px;
      font-size: 13px;
    }

    .nav-button.text-only {
      padding: 6px 12px;
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

    .nav-button {
      padding: 4px 8px;
      font-size: 12px;
    }

    .nav-button.text-only {
      padding: 4px 8px;
    }

    .username-header {
      display: none;
    }
  }
</style>
