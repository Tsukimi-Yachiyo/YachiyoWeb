<script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import AppHeader from './components/AppHeader.vue'
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

<template>
  <div class="app-shell">
    <AppHeader v-if="showGlobalHeader" :current-page="currentPage" @logout="logout" />
    <main class="app-content">
      <router-view />
    </main>
  </div>
</template>

<style>
  /* 全局样式 */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: Arial, sans-serif;
    background-color: #000;
    color: #fff;
    overflow: hidden;
    margin: 0;
    padding: 0;
  }

  #app,
  .app-shell {
    width: 100%;
    height: 100vh;
  }

  .app-shell {
    display: flex;
    flex-direction: column;
  }

  .app-content {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
</style>
