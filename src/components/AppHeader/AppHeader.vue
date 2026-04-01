<script setup lang="ts">
  import { computed, ref, onMounted } from 'vue'
  // eslint-disable-next-line no-unused-vars
  import UserProfilePopover from '../UserProfilePopover/UserProfilePopover.vue'
  import WaveEffect from '../WaveEffect.vue'
  import CheckinModule from '../CheckinModule.vue'
  import { useUserProfile } from '../../composables/useUserProfile'
  import { coinAPI } from '../../services/api'

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

  // eslint-disable-next-line no-unused-vars
  const userProfileIsVisible = ref(false)

  // 处理登出
  // eslint-disable-next-line no-unused-vars
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

<template src="./templates/AppHeader.html"></template>

<style scoped src="./styles/AppHeader.css"></style>
