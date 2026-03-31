<script setup lang="ts">
  import { computed, ref, onMounted } from 'vue'
  // eslint-disable-next-line no-unused-vars
  import UserProfilePopover from '../UserProfilePopover/UserProfilePopover.vue'
  import { useUserProfile } from '../../composables/useUserProfile'

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
  const appLogoUrl = `${iconBaseUrl}月见八千代.svg`
  const tsukuyomiLogoUrl = `${iconBaseUrl}月读空间.svg`
  // 优先使用全局单例资料，避免页面级 props 在路由切换时短暂抖动造成头像闪烁
  const resolvedUsername = computed(() => profileUsername.value || props.username || '用户')
  const resolvedUserAvatar = computed(() => profileUserAvatar.value || props.userAvatar || '')

  // eslint-disable-next-line no-unused-vars
  const userProfileIsVisible = ref(false)

  // 处理登出
  // eslint-disable-next-line no-unused-vars
  const handleLogout = () => {
    emit('logout')
  }

  onMounted(() => {
    loadUserDetail(false)
  })
</script>

<template src="./templates/AppHeader.html"></template>

<style scoped src="./styles/AppHeader.css"></style>
