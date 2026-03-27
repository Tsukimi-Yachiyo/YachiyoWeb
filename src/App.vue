<script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import AppHeader from './components/AppHeader/AppHeader.vue'
  import { useAuth } from './composables/useAuth'
  import { useIconManager } from './composables/useIconManager'

  const route = useRoute()
  const { logout } = useAuth()

  const showGlobalHeader = computed(() => {
    const path = route.path
    return (
      path.startsWith('/chat/home') || path.startsWith('/tsukuyomi') || path.startsWith('/manager')
    )
  })

  const currentPage = computed(() => {
    const path = route.path
    if (path.startsWith('/tsukuyomi')) return 'tsukuyomi'
    if (path.startsWith('/manager')) return 'manager'
    return 'chat'
  })

  // 初始化图标管理器，自动预加载图标
  useIconManager()
</script>

<template src="./templates/App.html"></template>

<style src="./styles/App.css"></style>
