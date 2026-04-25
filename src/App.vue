<script setup lang="ts">
  import { computed, onMounted, onUnmounted } from 'vue'
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

  // 检查元素是否在允许的内容区域内
  const isInContentArea = (element: HTMLElement | null): boolean => {
    if (!element) return false
    return !!(
      element.closest('.content-area') ||
      element.closest('.message-bubble') ||
      element.closest('.post-content') ||
      element.tagName === 'INPUT' ||
      element.tagName === 'TEXTAREA'
    )
  }

  // 防止右键菜单
  const handleContextMenu = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (!isInContentArea(target)) {
      e.preventDefault()
    }
  }

  // 防止复制/剪切（非内容区域）
  const handleCopyCut = (e: Event) => {
    const target = e.target as HTMLElement
    if (isInContentArea(target)) return

    // 检查选择的文本是否在允许区域内
    const selection = window.getSelection()
    if (selection && selection.toString().length > 0) {
      const range = selection.getRangeAt(0)
      const ancestor = range.commonAncestorContainer as HTMLElement
      const selectionInContent =
        ancestor.closest?.('.content-area') ||
        ancestor.closest?.('.message-bubble') ||
        ancestor.closest?.('.post-content')

      if (!selectionInContent) {
        e.preventDefault()
      }
    }
  }

  onMounted(() => {
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('copy', handleCopyCut)
    document.addEventListener('cut', handleCopyCut)
  })

  onUnmounted(() => {
    document.removeEventListener('contextmenu', handleContextMenu)
    document.removeEventListener('copy', handleCopyCut)
    document.removeEventListener('cut', handleCopyCut)
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
