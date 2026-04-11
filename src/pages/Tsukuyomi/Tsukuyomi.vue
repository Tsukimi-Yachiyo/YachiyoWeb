<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useIconManager } from '../../composables/useIconManager'
  import BackgroundMusicToggle from '../../components/BackgroundMusicToggle.vue'

  // 初始化图标管理器
  const { checkIconCache } = useIconManager()

  // 计算属性，用于获取图标数据URL
  const homeIconUrl = computed(() => {
    const iconData = checkIconCache('home.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const followIconUrl = computed(() => {
    const iconData = checkIconCache('users-group.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const columnIconUrl = computed(() => {
    const iconData = checkIconCache('book.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const router = useRouter()
  const route = useRoute()

  // 导航项 - 重构为三个主要选项
  const navItems = [
    { id: 'home', label: '主页', icon: '🏠', path: '/tsukuyomi/home' },
    { id: 'follow', label: '关注', icon: '👥', path: '/tsukuyomi/follow' },
    { id: 'column', label: '专栏', icon: '📚', path: '/tsukuyomi/column' },
  ]

  // 当前选中的导航项
  const currentNavItem = computed(() => {
    const path = route.path
    const navItem = navItems.find(item => path === item.path)
    return navItem ? navItem.id : 'home'
  })

  // 导航栏激活状态
  const isNavActive = ref(false)

  // 切换导航项
  const selectNavItem = path => {
    router.push(path)
  }

  // 激活导航栏
  const activateNav = () => {
    isNavActive.value = true
  }

  // 失活导航栏
  const deactivateNav = () => {
    isNavActive.value = false
  }
</script>

<template src="./templates/Tsukuyomi.html"></template>

<style scoped src="./styles/Tsukuyomi.css"></style>
