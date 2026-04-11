<script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import AppHeader from './components/AppHeader.vue'
  import { useAuth } from './composables/useAuth'
  import { useIconManager } from './composables/useIconManager'
  import { useModelLoading } from './composables/useModelLoading'

  const route = useRoute()
  const { logout } = useAuth()
  const { isLoading: isModelLoading } = useModelLoading()

  const showGlobalHeader = computed(() => {
    if (isModelLoading.value) return false
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

<template>
  <div class="app-shell">
    <AppHeader v-if="showGlobalHeader" :current-page="currentPage" @logout="logout" />
    <main class="app-content">
      <router-view />
    </main>
  </div>
</template>

<style>
  .app-shell {
    @apply w-full h-full flex flex-col;
  }

  .app-content {
    flex: 1;
    overflow: auto;
  }
</style>
