<script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import UserProfilePopover from '../UserProfilePopover/UserProfilePopover.vue'

  const props = defineProps({
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

  const router = useRouter()
  const userProfileIsVisible = ref(false)

  // 切换到聊天界面
  const goToChat = () => {
    router.push('/chat/home')
  }

  // 切换到月读界面
  const goToTsukuyomi = () => {
    router.push('/tsukuyomi')
  }

  // 处理登出
  const handleLogout = () => {
    emit('logout')
  }
</script>

<template src="./templates/AppHeader.html"></template>

<style scoped src="./styles/AppHeader.css"></style>
