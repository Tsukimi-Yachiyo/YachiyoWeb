<script setup lang="ts">
  import { ref } from 'vue'
  // eslint-disable-next-line no-unused-vars
  import UserProfilePopover from '../UserProfilePopover/UserProfilePopover.vue'

  defineProps({
    currentPage: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    userAvatar: {
      type: String,
      default: null,
    },
  })

  const emit = defineEmits(['logout'])
  const iconBaseUrl = `${import.meta.env.BASE_URL}icons/theme/`
  const appLogoUrl = `${iconBaseUrl}月见八千代.svg`
  const tsukuyomiLogoUrl = `${iconBaseUrl}月读空间.svg`

  // eslint-disable-next-line no-unused-vars
  const userProfileIsVisible = ref(false)

  // 处理登出
  // eslint-disable-next-line no-unused-vars
  const handleLogout = () => {
    emit('logout')
  }
</script>

<template src="./templates/AppHeader.html"></template>

<style scoped src="./styles/AppHeader.css"></style>
